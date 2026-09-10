import { describe, expect, it } from "vitest";

import { recomendar, type ContextoDelAde, type UnidadCandidata } from "@/lib/domain/ade";

/**
 * ADE v1 determinista ([ADR-004](../docs/decisions.md#adr-004)).
 *
 * Lo que se prueba no es "recomienda bien" —eso lo dirá el uso—, sino que
 * respeta lo que el spec congela y que **es reproducible**: la misma entrada da
 * la misma salida, siempre.
 */
const AHORA = "2026-08-30T12:00:00.000Z";

function unidad(p: Partial<UnidadCandidata> & { topicId: string }): UnidadCandidata {
  return {
    nombre: `Unidad ${p.topicId}`,
    orden: 1,
    requiere: [],
    practicaValor: null,
    practicaEstado: "no_information",
    dominioValor: null,
    dominioEstado: "not_evaluated",
    recenciaEn: null,
    // Por defecto **sin peso declarado**, que es el estado de casi todas las
    // materias: así los casos viejos siguen midiendo lo que medían.
    peso: null,
    recursos: [{ id: `res-${p.topicId}`, titulo: "Apunte" }],
    ...p,
  };
}

function ctx(p: Partial<ContextoDelAde> = {}): ContextoDelAde {
  return {
    courseEnrollmentId: "ce-1",
    materia: "Materia SYN",
    unidades: [unidad({ topicId: "t1" })],
    proximaEvaluacion: null,
    minutosDisponibles: null,
    hayAccionViva: false,
    ahora: AHORA,
    ...p,
  };
}

describe("ADE v1 · las cuatro ramas, y NONE no es una sola cosa", () => {
  it("con contexto suficiente devuelve NEW", () => {
    const r = recomendar(ctx());
    expect(r.rama).toBe("NEW");
  });

  /**
   * `academic_context_blocker` es **semánticamente distinto** de `NONE`
   * confirmado. Colapsarlos le diría al estudiante "no hay nada que hacer"
   * cuando en realidad falta cargar su cursado.
   */
  it("sin unidades es CONTEXTO_INCOMPLETO, no ausencia confirmada", () => {
    const r = recomendar(ctx({ unidades: [] }));
    expect(r).toMatchObject({ rama: "NONE", motivo: "CONTEXTO_INCOMPLETO" });
  });

  it("con una acción viva es ausencia CONFIRMADA", () => {
    const r = recomendar(ctx({ hayAccionViva: true }));
    expect(r).toMatchObject({ rama: "NONE", motivo: "CONFIRMADA" });
  });

  it("sin material configurado no inventa un recurso", () => {
    const r = recomendar(ctx({ unidades: [unidad({ topicId: "t1", recursos: [] })] }));
    expect(r).toMatchObject({ rama: "NONE", motivo: "CONTEXTO_INCOMPLETO" });
    expect(JSON.stringify(r)).not.toMatch(/res-/);
  });
});

describe("ADE v1 · la salida mínima del spec (Parte I §9.2)", () => {
  it("trae los siete campos, y la razón nunca falta", () => {
    const r = recomendar(ctx());
    if (r.rama !== "NEW") throw new Error("esperaba NEW");
    const rec = r.recomendacion;
    expect(rec.materia).toBeTruthy();
    expect(rec.objetivo).toBeTruthy();
    expect(rec.verbo).toBeTruthy();
    expect(rec.minutosMin).toBeGreaterThan(0);
    expect(rec.recursoId).toBeTruthy();
    expect(rec.evidenciaEsperada).toBeTruthy();
    expect(rec.razon).toBeTruthy();
  });

  /**
   * `P-03`: ninguna magnitud de máquina llega al estudiante. Que exista
   * `prioridad` no autoriza a mostrarla, y la razón no puede filtrarla.
   */
  it("la razón enuncia el hecho, no el cálculo", () => {
    const r = recomendar(ctx({ proximaEvaluacion: { titulo: "Parcial 1", fecha: null, temas: ["t1"] } }));
    if (r.rama !== "NEW") throw new Error("esperaba NEW");
    expect(r.recomendacion.razon).toBe("Entra en Parcial 1.");
    // El "1" de "Parcial 1" es parte del nombre de la evaluación, no una
    // magnitud. Lo que no puede aparecer es **el número que ordena**, ni un
    // juicio de nivel.
    expect(r.recomendacion.razon).not.toContain(String(r.recomendacion.prioridad));
    expect(r.recomendacion.razon).not.toMatch(/prioridad|score|riesgo|nivel (alto|bajo)/i);
  });
});

describe("ADE v1 · prerequisitos explícitos, nunca derivados del orden", () => {
  it("una unidad con prerequisito sin trabajar no se recomienda", () => {
    const r = recomendar(
      ctx({
        unidades: [
          unidad({ topicId: "t2", orden: 2, requiere: ["t1"] }),
          unidad({ topicId: "t1", orden: 1, practicaEstado: "value", practicaValor: 5 }),
        ],
      }),
    );
    if (r.rama !== "NEW") throw new Error("esperaba NEW");
    // `t1` está trabajada, así que `t2` se habilita; se elige por costo.
    expect(["t1", "t2"]).toContain(r.recomendacion.topicId);
  });

  it("si todas dependen de algo sin trabajar, es CONTEXTO_INCOMPLETO", () => {
    const r = recomendar(ctx({ unidades: [unidad({ topicId: "t2", requiere: ["t9"] })] }));
    expect(r).toMatchObject({ rama: "NONE", motivo: "CONTEXTO_INCOMPLETO" });
  });

  /**
   * Que la Unidad 2 vaya después de la 1 **no** dice que la necesite. Sin
   * `requiere` declarado, el orden no bloquea nada.
   */
  it("el orden por sí solo no bloquea una unidad", () => {
    const r = recomendar(ctx({ unidades: [unidad({ topicId: "t2", orden: 2, requiere: [] })] }));
    expect(r.rama).toBe("NEW");
  });
});

describe("ADE v1 · «sin datos no es cero»", () => {
  /**
   * Una unidad **sin información** de práctica es más urgente que una con
   * práctica registrada, aunque el valor de ésta sea bajo: desconocido no es
   * lo mismo que poco.
   */
  it("una unidad sin información pesa más que una con práctica baja", () => {
    const r = recomendar(
      ctx({
        unidades: [
          unidad({ topicId: "conocida", orden: 1, practicaEstado: "value", practicaValor: 1, recenciaEn: AHORA }),
          unidad({ topicId: "desconocida", orden: 2, practicaEstado: "no_information", recenciaEn: AHORA }),
        ],
      }),
    );
    if (r.rama !== "NEW") throw new Error("esperaba NEW");
    expect(r.recomendacion.topicId).toBe("desconocida");
  });

  it("`not_evaluated` cuenta como desconocido, no como cero", () => {
    const r = recomendar(
      ctx({
        unidades: [
          unidad({ topicId: "cero-real", orden: 1, practicaEstado: "value", practicaValor: 0, recenciaEn: AHORA }),
          unidad({ topicId: "no-evaluada", orden: 2, practicaEstado: "not_evaluated", recenciaEn: AHORA }),
        ],
      }),
    );
    if (r.rama !== "NEW") throw new Error("esperaba NEW");
    expect(r.recomendacion.topicId).toBe("no-evaluada");
  });
});

describe("ADE v1 · es reproducible", () => {
  /**
   * La misma entrada da la misma salida. Sin desempate estable, dos unidades
   * empatadas cambian de recomendación entre corridas y el estudiante ve otra
   * cosa cada vez que refresca — que es lo contrario de "una decisión por vez".
   */
  it("cien corridas con la misma entrada dan la misma recomendación", () => {
    const entrada = ctx({
      unidades: [unidad({ topicId: "a", orden: 1 }), unidad({ topicId: "b", orden: 2 })],
    });
    const primera = JSON.stringify(recomendar(entrada));
    for (let i = 0; i < 100; i++) expect(JSON.stringify(recomendar(entrada))).toBe(primera);
  });

  it("no lee el reloj del sistema: el tiempo entra por parámetro", () => {
    // Dentro del tope de recencia, mover el `ahora` mueve la prioridad. Fuera
    // del tope las dos dan lo mismo **a propósito**: pasados 60 días, "hace
    // mucho" ya no distingue nada y sumar más sería inventar precisión.
    const u = ctx({ unidades: [unidad({ topicId: "a", recenciaEn: "2026-08-20T12:00:00.000Z" })] });
    const a = recomendar({ ...u, ahora: "2026-08-30T12:00:00.000Z" });
    const b = recomendar({ ...u, ahora: "2026-09-10T12:00:00.000Z" });
    if (a.rama !== "NEW" || b.rama !== "NEW") throw new Error("esperaba NEW");
    expect(a.recomendacion.prioridad).not.toBe(b.recomendacion.prioridad);

    // Y el tope es deliberado: más allá de 60 días no distingue.
    const c = recomendar({ ...u, ahora: "2030-01-01T00:00:00.000Z" });
    const d = recomendar({ ...u, ahora: "2031-01-01T00:00:00.000Z" });
    if (c.rama !== "NEW" || d.rama !== "NEW") throw new Error("esperaba NEW");
    expect(c.recomendacion.prioridad).toBe(d.recomendacion.prioridad);
  });
});

describe("ADE v1 · respeta la disponibilidad declarada", () => {
  it("no propone un bloque más largo del que el estudiante declaró", () => {
    const r = recomendar(ctx({ minutosDisponibles: 20 }));
    if (r.rama !== "NEW") throw new Error("esperaba NEW");
    expect(r.recomendacion.minutosMax).toBeLessThanOrEqual(20);
  });
});

describe("ADR-086 · el peso entra al ranking, y en una dirección", () => {
  /**
   * La dirección la decidió el owner el 9 de septiembre de 2026: **más peso,
   * más prioridad**. La unidad larga es la que no llega si se deja para el
   * final, porque el estudiante no puede comprimirla después.
   *
   * ⚠️ Este test **falla si alguien invierte el signo**, que es exactamente lo
   * que tiene que pasar: la alternativa —arrancar por las cortas para acumular
   * cierres— es un criterio psicopedagógico defendible, pero es de la
   * psicopedagoga y hoy no está respondido. No se cambia sin su decisión.
   */
  it("entre dos unidades iguales, gana la más pesada", () => {
    const r = recomendar(
      ctx({
        unidades: [
          unidad({ topicId: "liviana", orden: 1, peso: 1 }),
          unidad({ topicId: "pesada", orden: 2, peso: 3 }),
        ],
      }),
    );
    if (r.rama !== "NEW") throw new Error("esperaba NEW");
    expect(r.recomendacion.topicId).toBe("pesada");
  });

  /**
   * ⚠️ **El peso ajusta, no decide.** Si le ganara a la evaluación, el ADE
   * mandaría a estudiar algo que no entra en el parcial del martes porque es
   * más largo. `1000` contra `120` es la distancia que lo impide.
   */
  it("pero no le gana a estar en la próxima evaluación", () => {
    const r = recomendar(
      ctx({
        unidades: [
          unidad({ topicId: "en-el-parcial", orden: 1, peso: 1 }),
          unidad({ topicId: "pesada-y-fuera", orden: 2, peso: 3 }),
        ],
        proximaEvaluacion: { titulo: "Parcial 1", fecha: "2026-09-15", temas: ["en-el-parcial"] },
      }),
    );
    if (r.rama !== "NEW") throw new Error("esperaba NEW");
    expect(r.recomendacion.topicId).toBe("en-el-parcial");
  });

  /**
   * ⚠️ **Todo o nada**, la misma regla que reparte los minutos (`usaPesos()`).
   * Un peso faltante no es `1`: mezclar declarados con defaults produciría un
   * orden que **parece medido y no lo es**.
   */
  it("si una unidad no tiene peso, la materia se ordena como si ninguna lo tuviera", () => {
    const conMezcla = recomendar(
      ctx({
        unidades: [
          unidad({ topicId: "primera", orden: 1, peso: null }),
          unidad({ topicId: "segunda", orden: 2, peso: 3 }),
        ],
      }),
    );
    const sinNinguno = recomendar(
      ctx({
        unidades: [
          unidad({ topicId: "primera", orden: 1, peso: null }),
          unidad({ topicId: "segunda", orden: 2, peso: null }),
        ],
      }),
    );
    if (conMezcla.rama !== "NEW" || sinNinguno.rama !== "NEW") throw new Error("esperaba NEW");
    expect(conMezcla.recomendacion.topicId).toBe(sinNinguno.recomendacion.topicId);
  });

  /**
   * Un peso de `0` o negativo no existe —la base lo rechaza con
   * `CHECK (weight IS NULL OR weight > 0)`—, pero el dominio no puede confiar
   * en eso: `usaPesos()` ya lo trata como no declarado y acá se fija.
   */
  it("un peso no positivo cuenta como no declarado, no como el más liviano", () => {
    const r = recomendar(
      ctx({
        unidades: [
          unidad({ topicId: "cero", orden: 1, peso: 0 }),
          unidad({ topicId: "tres", orden: 2, peso: 3 }),
        ],
      }),
    );
    if (r.rama !== "NEW") throw new Error("esperaba NEW");
    // Sin pesos utilizables gana el desempate por orden: la primera.
    expect(r.recomendacion.topicId).toBe("cero");
  });
});
