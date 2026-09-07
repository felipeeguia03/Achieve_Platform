import { describe, expect, it } from "vitest";

import {
  ACLARACION_DE_COBERTURA,
  ganttDeMateria,
  type EstadoDeMateria,
} from "@/lib/server/servicios/proyeccion-materia";

/**
 * El Gantt de `UX02` — [ADR-072](../docs/decisions.md#adr-072).
 *
 * Junta las dos derivaciones: `duracion.ts` dice cuánto lleva cada tema y
 * `cobertura.ts` cuánto de eso tiene evidencia enviada. Lo que se protege acá
 * es **que el pie diga siempre algo verdadero**, incluso cuando no hay barra.
 */

const BASE: EstadoDeMateria = {
  instante: "2026-09-07T12:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  cursadaId: "ce-1",
  materia: "Análisis Matemático II",
  examen: null,
  accion: null,
  compromiso: null,
  rescatePendiente: false,
  evidencia: "NONE",
  contextoIncompleto: false,
  ultimoAvanceEn: null,
  unidades: [],
  clases: [],
  cargaDeclarada: null,
  dimensiones: null,
  actividadReciente: [],
};

const u = (id: string, trabajado = false) => ({
  id,
  codigo: id.toUpperCase(),
  nombre: id,
  ultimoAvanceEn: null,
  dominio: null,
  practica: null,
  recorrido: null,
  peso: null,
  trabajado,
});

describe("Con clases cargadas: los dos números, y no coinciden", () => {
  const e: EstadoDeMateria = {
    ...BASE,
    unidades: [u("u1", true), u("u2")],
    clases: [
      { minutos: 360, tipo: "clase", temas: ["u1"] },
      { minutos: 60, tipo: "clase", temas: ["u2"] },
    ],
  };

  it("la barra se dibuja con las horas, no con el conteo", () => {
    const g = ganttDeMateria(e);
    // 1 de 2 temas es 50% por conteo; por horas es 86%. Ésa es la razón de que
    // el pie muestre los dos.
    expect(g.barra).toBe(86);
    expect(g.pie).toBe("1 de 2 temas · 86% de las horas");
  });

  it("la aclaración del owner acompaña al número, textual", () => {
    expect(ganttDeMateria(e).aclaracion).toBe(ACLARACION_DE_COBERTURA);
    expect(ACLARACION_DE_COBERTURA).toContain("No es una nota ni una predicción");
  });

  it("cada unidad lleva sus minutos derivados", () => {
    const g = ganttDeMateria(e);
    expect(g.unidades.map((x) => x.minutos)).toEqual([360, 60]);
  });
});

describe("El total declarado manda y el libro reparte", () => {
  it("la carga horaria del programa escala el reparto observado", () => {
    const g = ganttDeMateria({
      ...BASE,
      unidades: [u("u1", true), u("u2")],
      clases: [
        { minutos: 120, tipo: "clase", temas: ["u1"] },
        { minutos: 60, tipo: "clase", temas: ["u2"] },
      ],
      cargaDeclarada: { minutos: 3600, texto: "60 horas" },
    });
    expect(g.unidades.map((x) => x.minutos)).toEqual([2400, 1200]);
    // La proporción no cambia: sigue siendo 2:1, así que la barra tampoco.
    expect(g.barra).toBe(67);
  });

  it("un parcial no le atribuye minutos a los temas que evaluó", () => {
    const g = ganttDeMateria({
      ...BASE,
      unidades: [u("u1", true), u("u2")],
      clases: [
        { minutos: 100, tipo: "clase", temas: ["u1"] },
        { minutos: 120, tipo: "parcial", temas: ["u1", "u2"] },
      ],
    });
    expect(g.unidades.find((x) => x.id === "u2")?.minutos).toBeNull();
    // `u2` no entra al denominador, así que `u1` es todo lo que se puede medir.
    expect(g.barra).toBe(100);
    // Pero el conteo NO miente: son 1 de 2, no 1 de 1.
    expect(g.pie).toBe("1 de 2 temas · 100% de las horas");
  });
});

describe("Sin barra, el pie sigue diciendo algo verdadero", () => {
  it("sin temas cargados: el mensaje del mockup, en primera persona", () => {
    const g = ganttDeMateria(BASE);
    expect(g.barra).toBeNull();
    expect(g.pie).toBe("sin temas cargados — no puedo estimar");
    // Sin número no hay nada que aclarar: poner la nota igual explicaría una
    // barra que no está.
    expect(g.aclaracion).toBeNull();
  });

  it("con temas pero sin clases: el conteo sí, las horas no", () => {
    const g = ganttDeMateria({ ...BASE, unidades: [u("u1", true), u("u2"), u("u3")] });
    expect(g.barra).toBeNull();
    expect(g.pie).toBe("1 de 3 temas · sin clases cargadas, no puedo estimar las horas");
    expect(g.aclaracion).toBeNull();
  });

  it("una materia sin trabajo pero con clases SÍ muestra cero", () => {
    // Es la distinción entera: vacía por falta de trabajo ≠ vacía por falta de
    // datos. La primera se dibuja; la segunda no existe.
    const g = ganttDeMateria({
      ...BASE,
      unidades: [u("u1"), u("u2")],
      clases: [{ minutos: 120, tipo: "clase", temas: ["u1", "u2"] }],
    });
    expect(g.barra).toBe(0);
    expect(g.pie).toBe("0 de 2 temas · 0% de las horas");
    expect(g.aclaracion).toBe(ACLARACION_DE_COBERTURA);
  });
});

describe("El orden llega dado, y la proyección no lo toca", () => {
  it("respeta el orden en que vinieron las unidades", () => {
    // El orden es DICTADO y lo resuelve `estado_de_materia()` con un ORDER BY:
    // es una propiedad de la consulta, no una regla de producto. Reordenar acá
    // duplicaría la decisión en dos lugares.
    const g = ganttDeMateria({ ...BASE, unidades: [u("u2"), u("u1"), u("u3")] });
    expect(g.unidades.map((x) => x.id)).toEqual(["u2", "u1", "u3"]);
  });
});
