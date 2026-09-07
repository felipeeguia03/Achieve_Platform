import { describe, expect, it } from "vitest";

import {
  enHoras,
  proyectarReparto,
  type InsumosDeReparto,
} from "@/lib/server/servicios/proyeccion-reparto";

/**
 * El reparto proyectado — [ADR-073](../docs/decisions.md#adr-073), corte 2.
 *
 * Encadena `duracion.ts` → `cobertura.ts` → `reparto.ts`. Lo que se protege acá
 * es el corte por **alcance declarado**: sin él, un parcial que cubre dos
 * unidades exige la materia entera y el número sale al doble.
 */

const materia = (over: Partial<InsumosDeReparto["materias"][number]> = {}) => ({
  cursadaId: "ce-1",
  nombre: "Cálculo",
  diasHastaEvaluacion: 7,
  alcance: [] as string[],
  cargaDeclarada: null,
  unidades: [
    { id: "u1", peso: null, trabajado: false },
    { id: "u2", peso: null, trabajado: false },
  ],
  clases: [
    { minutos: 600, tipo: null, temas: ["u1"] },
    { minutos: 600, tipo: null, temas: ["u2"] },
  ],
  ...over,
});

describe("El alcance declarado recorta lo que hace falta", () => {
  it("sin alcance declarado, cuenta la materia entera", () => {
    // Misma salida que `contexto_del_ade()`: el alcance se declara, nunca se
    // infiere del texto de `scope`.
    const r = proyectarReparto({ minutosPorSemana: 600, observaciones: [], materias: [materia()] })!;
    expect(r.requerido).toBe("20 h"); // 1200 min en una semana
  });

  it("con alcance declarado, sólo lo que entra en la próxima evaluación", () => {
    const r = proyectarReparto({
      minutosPorSemana: 600,
      observaciones: [],
      materias: [materia({ alcance: ["u1"] })],
    })!;
    expect(r.requerido).toBe("10 h"); // la mitad: `u2` no entra en este parcial
  });

  it("lo ya trabajado no vuelve a pedirse", () => {
    const r = proyectarReparto({
      minutosPorSemana: 600,
      observaciones: [],
      materias: [
        materia({
          unidades: [
            { id: "u1", peso: null, trabajado: true },
            { id: "u2", peso: null, trabajado: false },
          ],
        }),
      ],
    })!;
    expect(r.requerido).toBe("10 h");
  });
});

describe("Las dos cifras, y ninguna conclusión", () => {
  it("cuando falta tiempo, `falta` es true y no hay ningún veredicto", () => {
    const r = proyectarReparto({ minutosPorSemana: 60, observaciones: [], materias: [materia()] })!;
    expect(r.disponible).toBe("1 h");
    expect(r.requerido).toBe("20 h");
    expect(r.falta).toBe(true);
    // El objeto no trae ninguna clave que afirme algo sobre el resultado.
    expect(Object.keys(r).sort()).toEqual(
      ["disponible", "falta", "materias", "regla", "requerido"].sort(),
    );
  });

  it("cuando sobra, `falta` es false y tampoco hay veredicto", () => {
    const r = proyectarReparto({ minutosPorSemana: 3000, observaciones: [], materias: [materia()] })!;
    expect(r.falta).toBe(false);
  });

  it("sin disponibilidad declarada, no se compara nada", () => {
    const r = proyectarReparto({ minutosPorSemana: null, observaciones: [], materias: [materia()] })!;
    expect(r.disponible).toBeNull();
    expect(r.falta).toBeNull();
    expect(r.materias[0].asignado).toBeNull();
    expect(r.materias[0].motivo).toBe("SIN_DISPONIBILIDAD");
  });
});

describe("Cargar una materia reorganiza a las demás", () => {
  it("dos materias iguales parten el presupuesto por la mitad", () => {
    const r = proyectarReparto({
      minutosPorSemana: 600,
      observaciones: [],
      materias: [materia(), materia({ cursadaId: "ce-2", nombre: "Física" })],
    })!;
    expect(r.materias.map((m) => m.asignado)).toEqual(["5 h", "5 h"]);
  });

  it("cuando no alcanza, ninguna recibe cero", () => {
    // ⚠️ El sistema no elige cuál se sacrifica: una en cero sería proponer
    // abandonarla.
    const r = proyectarReparto({
      minutosPorSemana: 60,
      observaciones: [],
      materias: [materia(), materia({ cursadaId: "ce-2" }), materia({ cursadaId: "ce-3" })],
    })!;
    expect(r.materias.every((m) => m.asignado !== null && m.asignado !== "0 h")).toBe(true);
  });
});

describe("Sin datos no es cero", () => {
  it("una materia sin clases no pide nada, y el motivo lo dice", () => {
    const r = proyectarReparto({
      minutosPorSemana: 600,
      observaciones: [],
      materias: [materia({ clases: [] })],
    })!;
    expect(r.materias[0].motivo).toBe("SIN_ESTIMACION");
    expect(r.materias[0].asignado).toBeNull();
    expect(r.requerido).toBeNull();
  });

  it("sin materias no se dibuja la sección", () => {
    // Una sección vacía diciendo «no hay nada» es peor que no dibujarla.
    expect(proyectarReparto({ minutosPorSemana: 600, observaciones: [], materias: [] })).toBeNull();
  });
});

describe("El formato no finge precisión", () => {
  it("redondea a la media hora", () => {
    expect(enHoras(90)).toBe("1,5 h");
    expect(enHoras(100)).toBe("1,5 h");
    expect(enHoras(120)).toBe("2 h");
  });
});

describe("El multiplicador personal entra al reparto (ADR-074)", () => {
  /** Cinco observaciones de 75 sobre un central de 50: 1,5×. */
  const lento = Array.from({ length: 5 }, () => ({
    minutosReales: 75,
    estimadoMin: 40,
    estimadoMax: 60,
  }));

  it("sin historia, el reparto no cambia", () => {
    const r = proyectarReparto({ minutosPorSemana: 600, observaciones: [], materias: [materia()] })!;
    expect(r.requerido).toBe("20 h");
  });

  it("con historia, pide más tiempo — nunca menos", () => {
    const r = proyectarReparto({
      minutosPorSemana: 600,
      observaciones: lento,
      materias: [materia()],
    })!;
    expect(r.requerido).toBe("30 h"); // 20 h × 1,5
  });

  it("a quien tarda MENOS de lo estimado no se le promete menos", () => {
    // ADR-070: el Personal Engine puede pedir más tiempo; no puede prometer que
    // vas a necesitar menos. El piso de 1.0 lo hace cumplir.
    const rapido = Array.from({ length: 5 }, () => ({
      minutosReales: 20,
      estimadoMin: 40,
      estimadoMax: 60,
    }));
    const r = proyectarReparto({
      minutosPorSemana: 600,
      observaciones: rapido,
      materias: [materia()],
    })!;
    expect(r.requerido).toBe("20 h");
  });

  it("una materia sin estimación sigue sin pedir nada, multiplicador o no", () => {
    // El multiplicador escala lo que hay; no convierte un `null` en un número.
    const r = proyectarReparto({
      minutosPorSemana: 600,
      observaciones: lento,
      materias: [materia({ clases: [] })],
    })!;
    expect(r.materias[0].motivo).toBe("SIN_ESTIMACION");
    expect(r.requerido).toBeNull();
  });
});
