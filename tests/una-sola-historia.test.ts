import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { aEntradaVisible } from "@/lib/server/servicios/hechos";
import { proyectarMateria } from "@/lib/server/servicios/proyeccion-materia";

/**
 * Etapa B3.3 — no existe una segunda fuente histórica.
 *
 * `VI.6` §8.3, textual: *"Bitácora es el historial completo de la misma verdad
 * derivada. **No existe una segunda fuente histórica.** Ambas consumen
 * `ProgressEntry` o el mismo bundle derivado de eventos"*.
 *
 * Es una regla fácil de cumplir el primer día y fácil de romper el segundo:
 * agregar una consulta parecida sobre `product_event` para una pantalla nueva no
 * se siente como crear una segunda fuente. Por eso hay guard y no convención.
 */

const RAIZ = process.cwd();
const LEER = (p: string) => readFileSync(resolve(RAIZ, p), "utf8");

function sqlDeMigraciones(): string {
  const dir = resolve(RAIZ, "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(resolve(dir, f), "utf8"))
    .join("\n");
}

/**
 * La **última** definición de cada función, no todas.
 *
 * Una migración aplicada no se edita: se reemplaza la función desde una nueva.
 * O sea que el repositorio conserva versiones viejas a propósito, y un guard que
 * las mirara todas estaría auditando el pasado — que ya no corre en ninguna
 * base. Los archivos se ordenan por nombre, que acá es cronológico.
 */
function funcionesVigentes(): Map<string, string> {
  const vigentes = new Map<string, string>();
  const partes = sqlDeMigraciones().split(/CREATE OR REPLACE FUNCTION|CREATE FUNCTION/).slice(1);
  for (const fn of partes) {
    const nombre = fn.trim().split(/[(\s]/)[0];
    vigentes.set(nombre, fn);
  }
  return vigentes;
}

describe("B3.3 · una sola fuente histórica", () => {
  it("sólo `hechos_de_cursada` consulta `product_event`", () => {
    // Las funciones de lectura de superficie no pueden mirar la tabla de hechos
    // por su cuenta: si lo hicieran, la preview de `UX02` y la Bitácora de
    // `UX06` podrían contar historias distintas del mismo día.
    for (const [nombre, fn] of funcionesVigentes()) {
      if (nombre.includes("hechos_de_cursada")) continue;
      // `registrar_progreso` escribe hechos, no los compone: no cuenta.
      if (nombre.includes("registrar_progreso")) continue;
      expect(
        fn.includes("FROM product_event"),
        `${nombre} consulta product_event por su cuenta: usá hechos_de_cursada()`,
      ).toBe(false);
    }
  });

  it("las dos superficies llaman a la misma función", () => {
    const sql = sqlDeMigraciones();
    // La última versión de cada una: ambas la usan.
    expect(sql).toContain("public.hechos_de_cursada(p_institution_id, cu.id, 3)");
    expect(sql).toContain("public.hechos_de_cursada(p_institution_id, (SELECT id FROM cursada), NULL)");
  });

  it("y traducen el hecho con la misma función", () => {
    for (const p of [
      "lib/server/servicios/proyeccion-materia.ts",
      "lib/server/servicios/proyeccion-progreso.ts",
    ]) {
      expect(LEER(p), `${p} no usa la traducción compartida`).toContain("aEntradaVisible");
    }
  });

  it("ninguna proyección traduce un evento por su cuenta", () => {
    // `tituloDeHecho` es de `hechos.ts`. Si otra proyección lo importa, está
    // armando su propia versión de la misma entrada.
    const dir = resolve(RAIZ, "lib/server/servicios");
    for (const archivo of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
      if (archivo === "hechos.ts") continue;
      expect(
        readFileSync(resolve(dir, archivo), "utf8"),
        `${archivo} traduce hechos por su cuenta`,
      ).not.toContain("tituloDeHecho");
    }
  });
});

describe("B3.3 · la preview es una preview", () => {
  const base = {
    instante: "2026-09-01T20:00:00.000Z",
    zona: "America/Argentina/Cordoba",
    cursadaId: "ce-1",
    materia: "Análisis Matemático II",
    examen: null,
    accion: null,
    compromiso: null,
    rescatePendiente: false,
    evidencia: "NONE" as const,
    contextoIncompleto: false,
    ultimoAvanceEn: null,
    unidades: [],
    dimensiones: null,
    actividadReciente: [
      { evento: "EvidenceSubmitted", en: "2026-09-01T19:00:00.000Z", porElEstudiante: true },
      { evento: "CommitmentStarted", en: "2026-09-01T18:00:00.000Z", porElEstudiante: true },
      { evento: "CommitmentConfirmed", en: "2026-09-01T17:00:00.000Z", porElEstudiante: true },
    ],
  };

  it("muestra las entradas que la base le dio, con su procedencia", () => {
    const p = proyectarMateria(base);
    expect(p.actividadReciente).toHaveLength(3);
    expect(p.actividadReciente![0].titulo).toBe("Presentaste evidencia");
    expect(p.actividadReciente![0].provenance).toBe("Reportado por vos · sin verificar");
  });

  it("sin hechos no dibuja una sección vacía", () => {
    expect(proyectarMateria({ ...base, actividadReciente: [] }).actividadReciente).toBeNull();
  });

  it("un hecho sin copy aprobada no llena el hueco", () => {
    // `CommitmentDue` lo dispara el reloj y no es del estudiante: se omite, y si
    // era el único, la sección no aparece.
    const p = proyectarMateria({
      ...base,
      actividadReciente: [
        { evento: "CommitmentDue", en: "2026-09-01T19:00:00.000Z", porElEstudiante: false },
      ],
    });
    expect(p.actividadReciente).toBeNull();
  });

  it("la traducción es idéntica a la de la Bitácora", () => {
    // El mismo hecho, la misma frase. Si divergieran, el estudiante leería dos
    // versiones de lo que hizo ayer.
    const hecho = { evento: "EvidenceValidated", en: "2026-09-01T19:00:00.000Z", porElEstudiante: false };
    const entrada = aEntradaVisible(hecho, base.zona);
    expect(proyectarMateria({ ...base, actividadReciente: [hecho] }).actividadReciente![0]).toEqual(
      entrada,
    );
  });
});
