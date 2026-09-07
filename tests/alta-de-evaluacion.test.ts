import { describe, expect, it } from "vitest";

import { ctaRegistry } from "@/lib/navigation/cta-registry";
import { contextoVacio } from "@/lib/navigation/context";
import {
  MODALIDADES,
  TIPOS_DE_EVALUACION,
  validarEvaluacion,
  type EvaluacionDeclarada,
} from "@/lib/server/servicios/evaluacion";

/**
 * El alta de evaluación — [ADR-067](../docs/decisions.md#adr-067).
 *
 * Lo que estos tests protegen no es el formulario: es que **la fecha siga
 * siendo opcional**. Es la decisión del ADR que más fácil se pierde en una
 * refactorización, porque "un examen sin fecha" parece un error hasta que uno
 * recuerda que el estudiante muchas veces sabe que rinde y todavía no sabe
 * cuándo.
 */

const BASE: EvaluacionDeclarada = {
  cursadaId: "ce-1",
  tipo: "final",
  titulo: "Final de Análisis II",
};

describe("Lo que hace válida a una evaluación declarada", () => {
  it("acepta el caso mínimo: materia, tipo y título. Sin fecha", () => {
    expect(validarEvaluacion(BASE)).toBeNull();
  });

  it("la fecha es OPCIONAL, y eso es el punto de ADR-067", () => {
    // Quien sabe que tiene final pero no cuándo tiene que poder registrarlo:
    // con eso ya hay temas y alcance, que es la mitad del Gantt.
    expect(validarEvaluacion({ ...BASE, fecha: undefined })).toBeNull();
    expect(validarEvaluacion({ ...BASE, fecha: "2026-09-22" })).toBeNull();
  });

  it("rechaza una fecha que no existe en el calendario", () => {
    // `Date.parse('2026-02-31')` no falla en todos los motores: el 31 de
    // febrero se desborda a marzo y quedaría guardado como otro día.
    expect(validarEvaluacion({ ...BASE, fecha: "2026-02-31" })).toContain("no existe");
    expect(validarEvaluacion({ ...BASE, fecha: "22/09/2026" })).toContain("AAAA-MM-DD");
  });

  it("una hora sin fecha no se guarda: no ubica nada", () => {
    expect(validarEvaluacion({ ...BASE, hora: "14:00" })).toContain("sin fecha");
    expect(validarEvaluacion({ ...BASE, fecha: "2026-09-22", hora: "14:00" })).toBeNull();
    expect(validarEvaluacion({ ...BASE, fecha: "2026-09-22", hora: "25:00" })).toContain("HH:MM");
  });

  it("NO rechaza una fecha pasada: registrar lo ya rendido es legítimo", () => {
    // Y no hace falta una regla: `candidatos_de_modo_examen()` entrega la fecha
    // y la ventana de 14 días de ADR-048 la descarta sola.
    expect(validarEvaluacion({ ...BASE, fecha: "2020-03-01" })).toBeNull();
  });

  it("el vocabulario de tipos es cerrado, y sin escape", () => {
    for (const t of TIPOS_DE_EVALUACION) {
      expect(validarEvaluacion({ ...BASE, tipo: t }), t).toBeNull();
    }
    // `otro` no existe a propósito: una fila que el Gantt no sabe tratar es una
    // fila que alguien va a tener que reclasificar después.
    expect(validarEvaluacion({ ...BASE, tipo: "otro" })).toContain("tiene que ser uno de");
    expect(validarEvaluacion({ ...BASE, tipo: "" })).toContain("tiene que ser uno de");
  });

  it("`oral` y `mixta` se almacenan aunque queden fuera de P0 (C01-047)", () => {
    // Lo que no se hace nunca es mapearlas a una modalidad P0 para que entren.
    for (const m of MODALIDADES) {
      expect(validarEvaluacion({ ...BASE, modalidad: m }), m).toBeNull();
    }
    expect(validarEvaluacion({ ...BASE, modalidad: "multiple_choice" })).toContain(
      "tiene que ser una de",
    );
  });

  it("sin materia y sin título no hay alta", () => {
    expect(validarEvaluacion({ ...BASE, cursadaId: "  " })).toContain("de qué materia");
    expect(validarEvaluacion({ ...BASE, titulo: "   " })).toContain("título");
  });
});

describe("`CTA-020` en el registro canónico", () => {
  const cta = ctaRegistry["CTA-020"];

  it("sale de `UX02` y no navega: el alta pasa dentro de la materia", () => {
    expect(cta.origen).toEqual(["UX02"]);
    expect(cta.destino).toBeNull();
    expect(cta.fallback.nodo).toBe("UX02");
  });

  it("aparece con que haya cursada, a diferencia de `CTA-019`", () => {
    // `CTA-019` exige una evaluación elegible. Ésta es la que resuelve el caso
    // en que no hay ninguna: condicionarla igual la volvería inalcanzable
    // exactamente cuando hace falta.
    const conMateria = { ...contextoVacio, courseVisible: true };
    expect(cta.aparece(conMateria)).toBe(true);
    expect(ctaRegistry["CTA-019"].aparece(conMateria)).toBe(false);

    expect(cta.aparece(contextoVacio)).toBe(false);
  });

  it("no promete preparación: lo que produce es una evaluación `unverified`", () => {
    expect(cta.resultadoAutoritativo).toContain("unverified");
    expect(cta.resultadoAutoritativo).not.toContain("ExamPreparation");
  });
});
