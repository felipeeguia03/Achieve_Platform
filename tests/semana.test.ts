import { describe, expect, it } from "vitest";

import { semanaDe, type EntradaDeSemana } from "@/lib/domain/semana";

/**
 * Los próximos 7 días — [ADR-093](../docs/decisions.md#adr-093).
 *
 * Lo delicado es el reloj: un compromiso se guarda como instante UTC y se
 * muestra en la hora de pared del estudiante. Las 02:00 UTC del sábado son las
 * 23:00 del viernes en Córdoba, y eso cambia **de qué día es**.
 */

const ZONA = "America/Argentina/Cordoba";
// 2026-09-11 es viernes (`5`).
const BASE: EntradaDeSemana = {
  hoy: "2026-09-11",
  zona: ZONA,
  evaluaciones: [],
  clases: [],
  compromisos: [],
  disponibilidad: [],
};

describe("los siete días", () => {
  it("empiezan hoy y son consecutivos", () => {
    const s = semanaDe(BASE);
    expect(s.map((d) => d.fecha)).toEqual([
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
    ]);
    expect(s.map((d) => d.offset)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("cruzan de mes sin perder un día", () => {
    expect(semanaDe({ ...BASE, hoy: "2026-09-28" }).at(-1)?.fecha).toBe("2026-10-04");
  });

  it("un día sin nada queda vacío, no se inventa relleno", () => {
    expect(semanaDe(BASE).every((d) => d.items.length === 0)).toBe(true);
  });
});

describe("las clases son la regla semanal", () => {
  it("una clase del lunes aparece el lunes y sólo ahí", () => {
    const s = semanaDe({
      ...BASE,
      clases: [{ cursadaId: "ce-1", nombre: "Física I", dia: 1, desde: "14:00:00", hasta: "16:00:00" }],
    });
    const conClase = s.filter((d) => d.items.length > 0);
    expect(conClase.map((d) => d.fecha)).toEqual(["2026-09-14"]);
    expect(conClase[0]?.items[0]).toMatchObject({ tipo: "CLASE", desde: "14:00", hasta: "16:00" });
  });
});

describe("los compromisos van en la hora del estudiante", () => {
  it("21:30 UTC del sábado son las 18:30 del sábado", () => {
    const s = semanaDe({
      ...BASE,
      compromisos: [{ cursadaId: "ce-1", nombre: "Álgebra", inicio: "2026-09-12T21:30:00Z", minutos: 45, titulo: "Resumen" }],
    });
    expect(s[1]?.items[0]).toMatchObject({ tipo: "COMPROMISO", hora: "18:30", minutos: 45 });
  });

  it("02:00 UTC del sábado son las 23:00 del viernes: cae hoy, no mañana", () => {
    const s = semanaDe({
      ...BASE,
      compromisos: [{ cursadaId: "ce-1", nombre: "Álgebra", inicio: "2026-09-12T02:00:00Z", minutos: 30, titulo: "Repaso" }],
    });
    expect(s[0]?.items[0]).toMatchObject({ tipo: "COMPROMISO", hora: "23:00" });
    expect(s[1]?.items).toEqual([]);
  });
});

describe("la disponibilidad es la declarada, y no se mezcla con las clases", () => {
  it("una clase y una franja el mismo día son dos cosas distintas", () => {
    const s = semanaDe({
      ...BASE,
      clases: [{ cursadaId: "ce-1", nombre: "Física I", dia: 5, desde: "08:00", hasta: "10:00" }],
      disponibilidad: [{ dia: 5, desde: "18:00:00", hasta: "20:00:00", minutos: 120 }],
    });
    expect(s[0]?.items.map((i) => i.tipo)).toEqual(["CLASE", "DISPONIBLE"]);
  });

  it("una franja sin día no se ubica en ninguno", () => {
    const s = semanaDe({ ...BASE, disponibilidad: [{ dia: null, desde: "18:00", hasta: "20:00", minutos: 120 }] });
    expect(s.every((d) => d.items.length === 0)).toBe(true);
  });

  it("una franja sin horario pero con minutos se muestra, sin inventarle hora", () => {
    const s = semanaDe({ ...BASE, disponibilidad: [{ dia: 5, desde: null, hasta: null, minutos: 90 }] });
    expect(s[0]?.items[0]).toMatchObject({ tipo: "DISPONIBLE", desde: null, minutos: 90 });
  });
});

describe("el orden dentro del día", () => {
  it("la evaluación primero —no tiene hora—, después por hora", () => {
    const s = semanaDe({
      ...BASE,
      evaluaciones: [{ cursadaId: "ce-2", nombre: "Química", fecha: "2026-09-11", rotulo: "Parcial 1" }],
      clases: [{ cursadaId: "ce-1", nombre: "Física I", dia: 5, desde: "14:00", hasta: "16:00" }],
      compromisos: [{ cursadaId: "ce-1", nombre: "Física I", inicio: "2026-09-11T12:00:00Z", minutos: 30, titulo: "Guía" }],
      disponibilidad: [{ dia: 5, desde: "18:00", hasta: "20:00", minutos: 120 }],
    });
    expect(s[0]?.items.map((i) => i.tipo)).toEqual(["EVALUACION", "COMPROMISO", "CLASE", "DISPONIBLE"]);
  });
});
