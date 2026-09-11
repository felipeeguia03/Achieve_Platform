import { describe, expect, it } from "vitest";

import { cuadroDeHoy, type EntradaDelCuadro } from "@/lib/domain/cuadro-de-hoy";

/**
 * El cuadro de hoy — [ADR-094](../docs/decisions.md#adr-094).
 *
 * Tres cosas delicadas: `Un.` sale de la **última clase dada**, nunca de una
 * futura; *Podés avanzar* es un filtro sobre hechos que respeta el orden que
 * recibe; y un compromiso cae en el día **de pared** del estudiante.
 */

const ZONA = "America/Argentina/Cordoba";
// 2026-09-11 es viernes (`5`).
const BASE: EntradaDelCuadro = {
  hoy: "2026-09-11",
  zona: ZONA,
  materias: [],
  clases: [],
  dictadas: [],
  evaluaciones: [],
  compromisos: [],
  disponibilidad: [],
};

type Unidad = EntradaDelCuadro["materias"][number]["unidades"][number];
const u = (id: string, numero: number | null, conEvidencia = false): Unidad => ({ id, numero, conEvidencia });
const materia = (cursadaId: string, nombre: string, unidades: Unidad[] = []) => ({ cursadaId, nombre, unidades });
const clase = (cursadaId: string, dia: number, desde: string, over: Partial<EntradaDelCuadro["clases"][number]> = {}) => ({
  cursadaId,
  dia,
  desde,
  hasta: `${String(Number(desde.slice(0, 2)) + 2).padStart(2, "0")}:00`,
  aula: null,
  estimada: false,
  ...over,
});

describe("las clases de hoy", () => {
  it("son las del día de semana de hoy, en orden de hora", () => {
    const c = cuadroDeHoy({
      ...BASE,
      materias: [materia("a", "Álgebra"), materia("b", "Física")],
      clases: [clase("b", 5, "14:00"), clase("a", 5, "08:00"), clase("a", 1, "10:00")],
    });
    expect(c.clases.map((x) => [x.nombre, x.desde])).toEqual([
      ["Álgebra", "08:00"],
      ["Física", "14:00"],
    ]);
  });

  it("una clase de una materia que el cuadro no conoce no se nombra", () => {
    const c = cuadroDeHoy({ ...BASE, clases: [clase("x", 5, "08:00")] });
    expect(c.clases).toEqual([]);
  });

  it("llevan su aula y si son simuladas; sin aula, `null` —no «sin aula»—", () => {
    const c = cuadroDeHoy({
      ...BASE,
      materias: [materia("a", "Álgebra"), materia("b", "Física")],
      clases: [clase("a", 5, "08:00", { aula: "Aula 3.12", estimada: true }), clase("b", 5, "10:00")],
    });
    expect(c.clases.map((x) => [x.aula, x.estimada])).toEqual([
      ["Aula 3.12", true],
      [null, false],
    ]);
  });
});

describe("`Un.` es por dónde va la materia, no lo que se da hoy", () => {
  const conUnidades = materia("a", "Álgebra", [u("t1", 1), u("t2", 2), u("t3", 3)]);

  it("la unidad más alta de la última clase dada", () => {
    const c = cuadroDeHoy({
      ...BASE,
      materias: [conUnidades],
      clases: [clase("a", 5, "08:00")],
      dictadas: [
        { cursadaId: "a", fecha: "2026-08-28", temas: ["t1"] },
        { cursadaId: "a", fecha: "2026-09-04", temas: ["t1", "t2"] },
      ],
    });
    expect(c.clases[0]?.unidad).toBe(2);
  });

  /** ADR-068: `class_session` son clases **dadas**. Una fechada después de hoy no ocurrió. */
  it("una clase con fecha futura no cuenta", () => {
    const c = cuadroDeHoy({
      ...BASE,
      materias: [conUnidades],
      clases: [clase("a", 5, "08:00")],
      dictadas: [
        { cursadaId: "a", fecha: "2026-09-04", temas: ["t1"] },
        { cursadaId: "a", fecha: "2026-09-18", temas: ["t3"] },
      ],
    });
    expect(c.clases[0]?.unidad).toBe(1);
  });

  it("sin clases dadas con temas, `null`: no se le inventa una unidad", () => {
    const c = cuadroDeHoy({
      ...BASE,
      materias: [conUnidades],
      clases: [clase("a", 5, "08:00")],
      dictadas: [{ cursadaId: "a", fecha: "2026-09-04", temas: [] }],
    });
    expect(c.clases[0]?.unidad).toBeNull();
  });
});

describe("podés avanzar", () => {
  it("sólo lo dado en clase y todavía sin evidencia", () => {
    const c = cuadroDeHoy({
      ...BASE,
      materias: [materia("a", "Álgebra", [u("t1", 1, true), u("t2", 2), u("t3", 3)])],
      dictadas: [{ cursadaId: "a", fecha: "2026-09-04", temas: ["t1", "t2"] }],
    });
    // t1 tiene evidencia; t3 no se dio.
    expect(c.avanzar).toEqual([{ cursadaId: "a", nombre: "Álgebra", unidades: [2], resto: 0 }]);
  });

  it("tres unidades y el resto contado; una sin número no se muestra", () => {
    const c = cuadroDeHoy({
      ...BASE,
      materias: [materia("a", "Álgebra", [u("t5", 5), u("t1", 1), u("t2", 2), u("t3", 3), u("tx", null)])],
      dictadas: [{ cursadaId: "a", fecha: "2026-09-01", temas: ["t5", "t1", "t2", "t3", "tx"] }],
    });
    expect(c.avanzar[0]).toMatchObject({ unidades: [1, 2, 3], resto: 1 });
  });

  it("respeta el orden que recibe —el de próxima evaluación— y muestra tres materias", () => {
    const ms = ["d", "c", "b", "a"].map((id) => materia(id, id.toUpperCase(), [u(`${id}1`, 1)]));
    const c = cuadroDeHoy({
      ...BASE,
      materias: ms,
      dictadas: ms.map((m) => ({ cursadaId: m.cursadaId, fecha: "2026-09-01", temas: [`${m.cursadaId}1`] })),
    });
    expect(c.avanzar.map((a) => a.cursadaId)).toEqual(["d", "c", "b"]);
  });

  it("sin ninguna clase dada, el vacío lo dice: no es «todo hecho»", () => {
    const c = cuadroDeHoy({ ...BASE, materias: [materia("a", "Álgebra", [u("t1", 1)])] });
    expect(c.avanzar).toEqual([]);
    expect(c.sinClasesDadas).toBe(true);
  });
});

describe("los horarios de hoy", () => {
  it("la evaluación primero; el compromiso en hora de pared; la franja del día", () => {
    const c = cuadroDeHoy({
      ...BASE,
      evaluaciones: [{ cursadaId: "a", nombre: "Química", fecha: "2026-09-11", rotulo: "Parcial 1" }],
      compromisos: [
        // 02:00 UTC del sábado son las 23:00 del viernes en Córdoba: es hoy.
        { cursadaId: "a", inicio: "2026-09-12T02:00:00Z", minutos: 30, titulo: "Repaso" },
        // 21:30 UTC del sábado es el sábado: no es hoy.
        { cursadaId: "a", inicio: "2026-09-12T21:30:00Z", minutos: 30, titulo: "Guía" },
      ],
      disponibilidad: [
        { dia: 5, desde: "18:00:00", hasta: "20:00:00", minutos: 120 },
        { dia: 6, desde: "10:00:00", hasta: "12:00:00", minutos: 120 },
      ],
    });
    expect(c.horarios.map((h) => h.tipo)).toEqual(["EVALUACION", "DISPONIBLE", "COMPROMISO"]);
    expect(c.horarios[2]).toMatchObject({ hora: "23:00", titulo: "Repaso" });
  });

  it("las clases no se repiten en los horarios: están en su bloque", () => {
    const c = cuadroDeHoy({ ...BASE, materias: [materia("a", "Álgebra")], clases: [clase("a", 5, "08:00")] });
    expect(c.horarios).toEqual([]);
  });
});
