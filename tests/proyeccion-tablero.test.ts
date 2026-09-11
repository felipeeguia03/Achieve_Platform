import { describe, expect, it } from "vitest";

import { proyectarTablero, type InsumosDeSemana } from "@/lib/server/servicios/proyeccion-tablero";
import { proyectarMaterias } from "@/lib/server/servicios/proyeccion-materias";
import { proyectarReparto, type InsumosDeReparto } from "@/lib/server/servicios/proyeccion-reparto";

/**
 * La proyección del tablero de `UX01` — [ADR-093](../docs/decisions.md#adr-093).
 *
 * Tres garantías: una tarjeta **dice lo mismo que la fila del índice** sobre la
 * misma materia; ningún enum llega a la pantalla; y los riesgos llegan ya
 * redactados, con la frase de la psicopedagoga cuando el que habla es el
 * Personal Engine.
 */

// Viernes 11 de septiembre de 2026, 12:00 en Córdoba.
const AHORA = "2026-09-11T15:00:00.000Z";
const ZONA = "America/Argentina/Cordoba";

type Materia = InsumosDeReparto["materias"][number];

const materia = (over: Partial<Materia> = {}): Materia => ({
  cursadaId: "c1",
  nombre: "ANALISIS MATEMATICO I",
  diasHastaEvaluacion: 4,
  alcance: [],
  cargaDeclarada: null,
  cargaDeEstudio: null,
  evaluacion: { titulo: "Parcial 1", tipo: "parcial", modalidad: "teorico_escrito", fecha: "2026-09-15" },
  ultimoAvanceEn: null,
  primeraClase: null,
  unidades: [
    { id: "u1", peso: null, evidencia: "sin_evidencia" },
    { id: "u2", peso: null, evidencia: "sin_evidencia" },
  ],
  clases: [
    { minutos: 120, tipo: null, temas: ["u1"] },
    { minutos: 120, tipo: null, temas: ["u2"] },
  ],
  ...over,
});

const insumos = (materias: Materia[], minutosPorSemana: number | null = 600): InsumosDeReparto => ({
  minutosPorSemana,
  observaciones: [],
  calibracionActiva: true,
  materias,
});

const SIN_SEMANA: InsumosDeSemana = { clases: [], compromisos: [], disponibilidad: [] };

describe("las tarjetas", () => {
  it("siguen el orden y la cobertura del índice: no hay una segunda verdad", () => {
    const i = insumos([
      materia({ cursadaId: "lejos", nombre: "Lejos", diasHastaEvaluacion: 20 }),
      materia({ cursadaId: "cerca", nombre: "Cerca", diasHastaEvaluacion: 5 }),
    ]);
    const t = proyectarTablero(i, SIN_SEMANA, AHORA, ZONA);
    const indice = proyectarMaterias(i, AHORA, ZONA);
    expect(t.tarjetas.map((c) => c.cursadaId)).toEqual(indice.materias.map((m) => m.cursadaId));
    expect(t.tarjetas.map((c) => c.cobertura?.fraccion ?? null)).toEqual(
      indice.materias.map((m) => m.cobertura?.fraccion ?? null),
    );
  });

  it("parten la evaluación en tipo, fecha y modalidad **legible**", () => {
    const [c] = proyectarTablero(insumos([materia()]), SIN_SEMANA, AHORA, ZONA).tarjetas;
    expect(c?.evaluacion).toEqual({ rotulo: "Parcial 1", fecha: "mar 15 sept", modalidad: "teórico escrito" });
    expect(c?.faltan).toBe("4 d");
  });

  it("una modalidad que el copy no conoce se omite: **el enum nunca es copy**", () => {
    const [c] = proyectarTablero(
      insumos([materia({ evaluacion: { titulo: "Final", tipo: "final", modalidad: "escrito", fecha: "2026-09-15" } })]),
      SIN_SEMANA,
      AHORA,
      ZONA,
    ).tarjetas;
    expect(c?.evaluacion?.modalidad).toBeNull();
  });

  it("ningún enum crudo llega a la pantalla", () => {
    const t = proyectarTablero(insumos([materia()], 30), SIN_SEMANA, AHORA, ZONA);
    expect(JSON.stringify(t)).not.toMatch(/teorico_escrito|sin_evidencia|CONFIRMED|declared/);
  });

  it("el nombre va con mayúscula inicial y el romano se conserva (ADR-088 E5)", () => {
    const [c] = proyectarTablero(insumos([materia()]), SIN_SEMANA, AHORA, ZONA).tarjetas;
    expect(c?.nombre).toBe("Analisis matematico I");
  });

  it("sin fecha no hay cifra ni píldora: ausencia, no cero", () => {
    const t = proyectarTablero(
      insumos([materia({ diasHastaEvaluacion: null, evaluacion: null })]),
      SIN_SEMANA,
      AHORA,
      ZONA,
    );
    expect(t.tarjetas[0]).toMatchObject({ evaluacion: null, dias: null, faltan: null });
    expect(t.proximaEvaluacion).toBeNull();
  });

  it("el carril deja una semana de aire después de la más lejana, y nunca mide menos de 14 días", () => {
    expect(proyectarTablero(insumos([materia()]), SIN_SEMANA, AHORA, ZONA).horizonteEnDias).toBe(14);
    const lejos = proyectarTablero(insumos([materia({ diasHastaEvaluacion: 37 })]), SIN_SEMANA, AHORA, ZONA);
    expect(lejos.horizonteEnDias).toBe(42);
  });
});

describe("los riesgos llegan redactados", () => {
  it("una evaluación a 4 días sin cobertura se enuncia como hecho", () => {
    const t = proyectarTablero(insumos([materia()]), SIN_SEMANA, AHORA, ZONA);
    expect(t.riesgos[0]).toMatchObject({
      regla: "COBERTURA_BAJA_CERCA",
      motor: "ACADEMICO",
      titulo: "Analisis matematico I: evaluación en 4 días con 0% de cobertura",
      cursadaId: "c1",
    });
  });

  it("el del plan usa la frase de la psicopedagoga y las dos cifras, y no ofrece abrir nada", () => {
    const i = insumos([materia()], 1);
    // Precondición: el caso tiene que caer en `CRITICA`, o el test no prueba nada.
    expect(proyectarReparto(i)?.tramo).toBe("CRITICA");
    const plan = proyectarTablero(i, SIN_SEMANA, AHORA, ZONA).riesgos.find((r) => r.regla === "PLAN_NO_ENTRA");
    expect(plan).toMatchObject({
      motor: "PERSONAL",
      titulo: "Tu plan no entra completo en el tiempo disponible.",
      cursadaId: null,
    });
    expect(plan?.detalle).toMatch(/Esta semana declaraste/);
  });

  it("sin reparto crítico no hay riesgo del plan", () => {
    const i = insumos([materia({ diasHastaEvaluacion: 40, evaluacion: null })], 6000);
    expect(proyectarTablero(i, SIN_SEMANA, AHORA, ZONA).riesgos).toEqual([]);
  });
});

describe("la semana", () => {
  const semana: InsumosDeSemana = {
    // Lunes 14, 10 a 12.
    clases: [{ cursadaId: "c1", dia: 1, desde: "10:00:00", hasta: "12:00:00" }],
    // Sábado 12, 18:30 en Córdoba.
    compromisos: [{ cursadaId: "c1", inicio: "2026-09-12T21:30:00Z", minutos: 45, titulo: "LIMITES Y CONTINUIDAD" }],
    disponibilidad: [{ dia: 5, desde: null, hasta: null, minutos: 90 }],
  };

  it("siete días, empezando hoy, con sus etiquetas", () => {
    const s = proyectarTablero(insumos([materia()]), semana, AHORA, ZONA).semana;
    expect(s).toHaveLength(7);
    expect(s.slice(0, 3).map((d) => d.etiqueta)).toEqual(["hoy", "mañana", "dom 13 sept"]);
  });

  it("cada renglón llega redactado, con su hora cuando la tiene", () => {
    const s = proyectarTablero(insumos([materia()]), semana, AHORA, ZONA).semana;
    expect(s[0]?.items).toEqual([
      { tipo: "DISPONIBLE", hora: null, texto: "Disponible para estudiar · 1,5 h", cursadaId: null },
    ]);
    expect(s[1]?.items).toEqual([
      { tipo: "COMPROMISO", hora: "18:30", texto: "Compromiso · Limites y continuidad", cursadaId: "c1" },
    ]);
    expect(s[3]?.items).toEqual([
      { tipo: "CLASE", hora: "10:00–12:00", texto: "Clase · Analisis matematico I", cursadaId: "c1" },
    ]);
    expect(s[4]?.items[0]).toMatchObject({ tipo: "EVALUACION", hora: null, texto: "Parcial 1 · Analisis matematico I" });
  });

  it("un bloque de una cursada que no está en el índice no se nombra: se omite", () => {
    const s = proyectarTablero(
      insumos([materia()]),
      { ...SIN_SEMANA, clases: [{ cursadaId: "otra", dia: 1, desde: "10:00", hasta: "12:00" }] },
      AHORA,
      ZONA,
    ).semana;
    expect(s.flatMap((d) => d.items).filter((i) => i.tipo === "CLASE")).toEqual([]);
  });
});
