import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  claveDePeriodo,
  leerClaveDePeriodo,
  normalizarPeriodoDeDictado,
  seDictaEn,
  SEMESTRES,
  type Semestre,
} from "@/lib/domain/periodo";
import { periodoDeCursado } from "@/lib/domain/alta";

/**
 * **El período académico** — [ADR-061](../docs/decisions.md#adr-061), decidido
 * por el Product Owner el 5 de septiembre de 2026. Corte 1 del plan.
 *
 * Lo que se prueba es que **tres conceptos no se vuelvan uno**:
 *
 * > *"Debe evitar que valores como `1`, `primer semestre`, `2026-1` y `S1`
 * > representen el mismo concepto de maneras diferentes."*
 *
 * Y la regla que más fácil se rompe sin darse cuenta: **la anualidad no es un
 * semestre**, y una materia anual aparece en los dos.
 */

describe("El normalizador guarda un solo valor canónico", () => {
  const primeros = ["1", "S1", "s1", "1C", "primer semestre", "Primer Cuatrimestre", "FIRST_SEMESTER"];
  const segundos = ["2", "S2", "2c", "segundo semestre", "SECOND_SEMESTER"];

  it("todas las grafías de primer semestre dan el mismo valor", () => {
    for (const g of primeros) expect(normalizarPeriodoDeDictado(g), g).toBe("FIRST_SEMESTER");
  });

  it("todas las de segundo, también", () => {
    for (const g of segundos) expect(normalizarPeriodoDeDictado(g), g).toBe("SECOND_SEMESTER");
  });

  it("«anual» es su propio valor, y no un semestre", () => {
    expect(normalizarPeriodoDeDictado("anual")).toBe("ANNUAL");
    expect(normalizarPeriodoDeDictado("ANUAL")).toBe("ANNUAL");
    expect(normalizarPeriodoDeDictado("annual")).toBe("ANNUAL");
  });

  it("una clave calendario NO es un período de dictado", () => {
    // Es la confusión que ADR-061 vino a cerrar: la fila del plan dice «se dicta
    // en el primer semestre», de cualquier año. `2026-1` es otro concepto.
    for (const clave of ["2026-1", "2026-2", "2025-1"]) {
      expect(normalizarPeriodoDeDictado(clave), clave).toBeNull();
    }
  });

  it("lo que no se reconoce vuelve `null`: no se adivina", () => {
    for (const raro of ["primavera", "3", "S3", "cuatrimestre", "I", "verano"]) {
      expect(normalizarPeriodoDeDictado(raro), raro).toBeNull();
    }
  });

  it("vacío y ausente son ausencia de dato, no un error", () => {
    for (const nada of ["", "   ", null, undefined]) {
      expect(normalizarPeriodoDeDictado(nada)).toBeNull();
    }
  });
});

describe("La clave calendario y el par (año, semestre) no pueden discrepar", () => {
  it("ida y vuelta", () => {
    for (const anio of [2025, 2026, 2030]) {
      for (const s of SEMESTRES) {
        expect(leerClaveDePeriodo(claveDePeriodo(anio, s))).toEqual({ anio, semestre: s });
      }
    }
  });

  it("`periodoDeCursado` se arma con la misma función", () => {
    // Si alguien vuelve a escribir la clave a mano, esto rompe.
    expect(leerClaveDePeriodo(periodoDeCursado(new Date("2026-03-15T12:00:00Z")))).toEqual({
      anio: 2026,
      semestre: "FIRST_SEMESTER",
    });
    expect(leerClaveDePeriodo(periodoDeCursado(new Date("2026-09-05T12:00:00Z")))).toEqual({
      anio: 2026,
      semestre: "SECOND_SEMESTER",
    });
  });

  it("una clave con otra forma no se completa", () => {
    for (const mala of ["2026", "2026-3", "26-1", "2026-1-1", "", null]) {
      expect(leerClaveDePeriodo(mala), String(mala)).toBeNull();
    }
  });
});

describe("Qué se cursa en cada semestre", () => {
  const anual = { periodo: null, esAnual: true };
  const primero = { periodo: "FIRST_SEMESTER" as Semestre, esAnual: false };
  const segundo = { periodo: "SECOND_SEMESTER" as Semestre, esAnual: false };
  const sinDato = { periodo: null, esAnual: false };

  it("una anual aparece en los DOS semestres", () => {
    // La regla que el owner escribió: «una persona puede estar en el segundo
    // semestre y cursar simultáneamente materias anuales».
    for (const s of SEMESTRES) expect(seDictaEn(anual, s), s).toBe(true);
  });

  it("una de primero no aparece en segundo, y al revés", () => {
    expect(seDictaEn(primero, "SECOND_SEMESTER")).toBe(false);
    expect(seDictaEn(segundo, "FIRST_SEMESTER")).toBe(false);
    expect(seDictaEn(primero, "FIRST_SEMESTER")).toBe(true);
    expect(seDictaEn(segundo, "SECOND_SEMESTER")).toBe(true);
  });

  it("sin período declarado se muestra igual: la ausencia no es una negación", () => {
    // Es el estado de las 57 filas del Plan 2016 (ADR-053). Ocultarla afirmaría
    // «no se dicta ahora», que nadie dijo.
    for (const s of SEMESTRES) expect(seDictaEn(sinDato, s), s).toBe(true);
  });
});

describe("El vocabulario es el mismo en el dominio, en la base y en el importador", () => {
  const MIGRACION = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260917000000_vocabulario_de_periodo.sql"),
    "utf8",
  );
  const IMPORTADOR = readFileSync(resolve(process.cwd(), "scripts/importar-catalogo.mjs"), "utf8");

  it("la base acepta exactamente los dos semestres, y `NULL`", () => {
    expect(MIGRACION).toContain("term IS NULL OR term IN ('FIRST_SEMESTER', 'SECOND_SEMESTER')");
  });

  it("la base prohíbe que una anual lleve semestre", () => {
    expect(MIGRACION).toContain("NOT (COALESCE(is_annual, FALSE) AND term IS NOT NULL)");
  });

  it("`enrollment.semester` no admite un valor «anual»", () => {
    // La anualidad es de la materia, no del alumno.
    expect(MIGRACION).toMatch(/semester IS NULL OR semester IN \('FIRST_SEMESTER', 'SECOND_SEMESTER'\)/);
    const cuerpo = MIGRACION.replace(/^\s*--.*$/gm, "");
    expect(cuerpo).not.toMatch(/semester\s*IN\s*\([^)]*ANNUAL/);
  });

  it("el importador traduce ANNUAL a las dos columnas, no a `term`", () => {
    expect(IMPORTADOR).toContain('term: periodo === "ANNUAL" ? null : periodo');
  });

  it("y corta cuando no reconoce el período, en vez de guardarlo crudo", () => {
    expect(IMPORTADOR).toContain("período de dictado desconocido");
    expect(IMPORTADOR).toMatch(/período de dictado desconocido[\s\S]{0,400}process\.exit\(1\)/);
  });
});
