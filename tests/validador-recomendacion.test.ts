import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  REGLAS,
  validarRecomendacion,
  type ResultadoDeValidacion,
} from "@/lib/domain/validador-de-recomendacion";
import type { RecomendacionDelAde } from "@/lib/domain/ade";

/**
 * Etapa B4.1 — el validador determinista.
 *
 * [ADR-004](../docs/decisions.md#adr-004): *"verifica que la Action sea
 * ejecutable, que respete disponibilidad y que **no se afirma dominio, progreso
 * ni readiness inexistente**. Ese validador es la parte que no se puede
 * saltear"*.
 */

const VALIDA: RecomendacionDelAde = {
  materia: "Análisis Matemático II",
  topicId: "topic-1",
  objetivo: "Resolver los ejercicios 8 a 14 de la guía 3",
  verbo: "resolver",
  alcance: "guía 3",
  minutosMin: 45,
  minutosMax: 60,
  recursoId: "res-1",
  evidenciaEsperada: "Los 7 ejercicios resueltos",
  criterioDeCierre: "Están completos y corregidos",
  razon: "Entra en el Parcial 1 y todavía no registraste práctica en esta unidad.",
  prioridad: 10,
};

const rechazo = (r: ResultadoDeValidacion) => {
  if (r.estado !== "RECHAZADA") throw new Error("se esperaba un rechazo");
  return r;
};

describe("B4.1 · lo que el ADE no puede afirmar", () => {
  it("una recomendación honesta pasa", () => {
    expect(validarRecomendacion(VALIDA)).toEqual({ estado: "OK" });
  });

  it("no puede afirmar dominio", () => {
    const r = rechazo(validarRecomendacion({ ...VALIDA, razon: "Ya dominás las integrales." }));
    expect(r.campo).toBe("razon");
    expect(r.afirma).toContain("dominio");
  });

  it("tampoco 'aprendiste' ni 'ya sabés'", () => {
    for (const razon of ["Aprendiste la unidad 2.", "Ya sabés derivar, seguimos."]) {
      expect(validarRecomendacion({ ...VALIDA, razon }).estado).toBe("RECHAZADA");
    }
  });

  it("no puede gamificar el progreso", () => {
    expect(validarRecomendacion({ ...VALIDA, razon: "Subiste tu nivel en esta materia." }).estado).toBe(
      "RECHAZADA",
    );
  });

  it("no puede mostrar un porcentaje ni un «N de M»", () => {
    // No existe métrica de porcentaje aprobada, y los pasos del protocolo son
    // provisionales: "5 de 12" hardcodea algo que nadie cerró.
    expect(validarRecomendacion({ ...VALIDA, razon: "Llevás 60% de la materia." }).estado).toBe(
      "RECHAZADA",
    );
    expect(validarRecomendacion({ ...VALIDA, objetivo: "Completar 5 de 12 pasos" }).estado).toBe(
      "RECHAZADA",
    );
  });

  it("no puede derivar «no avanzaste» de que no haya datos", () => {
    expect(validarRecomendacion({ ...VALIDA, razon: "No avanzaste esta semana." }).estado).toBe(
      "RECHAZADA",
    );
  });

  it("no puede emitir un juicio sobre la persona", () => {
    expect(validarRecomendacion({ ...VALIDA, razon: "Fallaste en la última entrega." }).estado).toBe(
      "RECHAZADA",
    );
  });

  it("no puede prometer readiness ni predecir el resultado", () => {
    for (const razon of ["Con esto quedás listo para rendir.", "Así vas a aprobar."]) {
      expect(validarRecomendacion({ ...VALIDA, razon }).estado).toBe("RECHAZADA");
    }
  });

  it("no puede prometer una persona que no está asignada", () => {
    expect(
      validarRecomendacion({ ...VALIDA, razon: "Alguien te va a revisar la entrega." }).estado,
    ).toBe("RECHAZADA");
  });

  it("no puede decir que repetir un tema es retroceder", () => {
    // `HUMAN-P0-01`: el tramo 9–18 es reentrante. Volver sobre un tema es el
    // método, no una recaída.
    expect(validarRecomendacion({ ...VALIDA, razon: "Retrocediste en esta unidad." }).estado).toBe(
      "RECHAZADA",
    );
  });

  it("no puede decir que un apoyo producido demuestra aprendizaje", () => {
    // `HUMAN-P0-05`: evidencia de trabajo ≠ evidencia de aprendizaje.
    const r = validarRecomendacion({
      ...VALIDA,
      razon: "Tu resumen demuestra que entendiste el tema.",
    });
    expect(r.estado).toBe("RECHAZADA");
  });
});

describe("B4.1 · el validador mira lo que el estudiante lee", () => {
  it("revisa los cuatro campos visibles, no sólo la razón", () => {
    for (const campo of ["objetivo", "evidenciaEsperada", "criterioDeCierre"] as const) {
      const r = rechazo(validarRecomendacion({ ...VALIDA, [campo]: "Ya dominás esto" }));
      expect(r.campo).toBe(campo);
    }
  });

  it("no revisa lo invisible", () => {
    // `prioridad` ordena y nunca se muestra (`P-03`); `topicId` es un id.
    // Validar copy de algo invisible daría una cobertura que no existe.
    expect(validarRecomendacion({ ...VALIDA, topicId: "dominaste-todo" }).estado).toBe("OK");
  });

  it("dice qué campo y qué afirma, para poder arreglar la plantilla", () => {
    const r = rechazo(validarRecomendacion({ ...VALIDA, razon: "Ya dominás las integrales." }));
    expect(r.texto).toBe("Ya dominás las integrales.");
    expect(r.origen).toContain("Dominaste la unidad");
  });
});

describe("B4.1 · cada regla se ata a `product.md` §13", () => {
  it("toda regla cita una fila que existe en el documento", () => {
    // Sin esto, "sale del copy prohibido" sería una afirmación de un comentario.
    const product = readFileSync(resolve(process.cwd(), "docs/product.md"), "utf8");
    for (const regla of REGLAS) {
      // La frase prohibida es lo que va entre las primeras comillas del origen.
      // El documento la escribe en cursiva —`*"..."*`—, así que se compara la
      // frase y no el renglón entero.
      const frase = regla.origen.match(/"([^"]+)"/)?.[1];
      expect(frase, `la regla "${regla.afirma}" no cita ninguna frase`).toBeTruthy();
      expect(product, `la regla "${regla.afirma}" cita algo que no está en §13`).toContain(frase!);
    }
  });

  it("hay al menos una regla por cada familia que el ADE puede violar", () => {
    // Si alguien borra una regla, esto lo dice. La lista es corta a propósito:
    // están las que un motor de recomendación puede romper al escribir.
    expect(REGLAS.length).toBeGreaterThanOrEqual(10);
  });
});
