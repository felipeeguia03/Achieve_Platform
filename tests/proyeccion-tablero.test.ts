import { describe, expect, it } from "vitest";

import {
  numeroDeUnidad,
  proyectarTablero,
  type InsumosDelDia,
} from "@/lib/server/servicios/proyeccion-tablero";
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

const SIN_DIA: InsumosDelDia = { clases: [], compromisos: [], disponibilidad: [], dictadas: [], temas: [] };

describe("las tarjetas", () => {
  it("siguen el orden y la cobertura del índice: no hay una segunda verdad", () => {
    const i = insumos([
      materia({ cursadaId: "lejos", nombre: "Lejos", diasHastaEvaluacion: 20 }),
      materia({ cursadaId: "cerca", nombre: "Cerca", diasHastaEvaluacion: 5 }),
    ]);
    const t = proyectarTablero(i, SIN_DIA, AHORA, ZONA);
    const indice = proyectarMaterias(i, AHORA, ZONA);
    expect(t.tarjetas.map((c) => c.cursadaId)).toEqual(indice.materias.map((m) => m.cursadaId));
    expect(t.tarjetas.map((c) => c.cobertura?.fraccion ?? null)).toEqual(
      indice.materias.map((m) => m.cobertura?.fraccion ?? null),
    );
  });

  it("parten la evaluación en tipo, fecha y modalidad **legible**", () => {
    const [c] = proyectarTablero(insumos([materia()]), SIN_DIA, AHORA, ZONA).tarjetas;
    expect(c?.evaluacion).toEqual({ rotulo: "Parcial 1", fecha: "mar 15 sept", modalidad: "teórico escrito" });
    expect(c?.faltan).toBe("4 d");
  });

  it("una modalidad que el copy no conoce se omite: **el enum nunca es copy**", () => {
    const [c] = proyectarTablero(
      insumos([materia({ evaluacion: { titulo: "Final", tipo: "final", modalidad: "escrito", fecha: "2026-09-15" } })]),
      SIN_DIA,
      AHORA,
      ZONA,
    ).tarjetas;
    expect(c?.evaluacion?.modalidad).toBeNull();
  });

  it("ningún enum crudo llega a la pantalla", () => {
    const t = proyectarTablero(insumos([materia()], 30), SIN_DIA, AHORA, ZONA);
    expect(JSON.stringify(t)).not.toMatch(/teorico_escrito|sin_evidencia|CONFIRMED|declared/);
  });

  it("el nombre va con mayúscula inicial y el romano se conserva (ADR-088 E5)", () => {
    const [c] = proyectarTablero(insumos([materia()]), SIN_DIA, AHORA, ZONA).tarjetas;
    expect(c?.nombre).toBe("Analisis matematico I");
  });

  it("sin fecha no hay cifra ni píldora: ausencia, no cero", () => {
    const t = proyectarTablero(
      insumos([materia({ diasHastaEvaluacion: null, evaluacion: null })]),
      SIN_DIA,
      AHORA,
      ZONA,
    );
    expect(t.tarjetas[0]).toMatchObject({ evaluacion: null, dias: null, faltan: null });
    expect(t.proximaEvaluacion).toBeNull();
  });

  it("el carril deja una semana de aire después de la más lejana, y nunca mide menos de 14 días", () => {
    expect(proyectarTablero(insumos([materia()]), SIN_DIA, AHORA, ZONA).horizonteEnDias).toBe(14);
    const lejos = proyectarTablero(insumos([materia({ diasHastaEvaluacion: 37 })]), SIN_DIA, AHORA, ZONA);
    expect(lejos.horizonteEnDias).toBe(42);
  });
});

describe("los riesgos llegan redactados", () => {
  it("una evaluación a 4 días sin cobertura se enuncia como hecho", () => {
    const t = proyectarTablero(insumos([materia()]), SIN_DIA, AHORA, ZONA);
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
    const plan = proyectarTablero(i, SIN_DIA, AHORA, ZONA).riesgos.find((r) => r.regla === "PLAN_NO_ENTRA");
    expect(plan).toMatchObject({
      motor: "PERSONAL",
      titulo: "Tu plan no entra completo en el tiempo disponible.",
      cursadaId: null,
    });
    expect(plan?.detalle).toMatch(/Esta semana declaraste/);
  });

  it("sin reparto crítico no hay riesgo del plan", () => {
    const i = insumos([materia({ diasHastaEvaluacion: 40, evaluacion: null })], 6000);
    expect(proyectarTablero(i, SIN_DIA, AHORA, ZONA).riesgos).toEqual([]);
  });
});

describe("el cuadro de hoy — ADR-094", () => {
  // Viernes 11 de septiembre: la clase del viernes es `dia: 5`.
  const DIA: InsumosDelDia = {
    clases: [{ cursadaId: "c1", dia: 5, desde: "10:00:00", hasta: "12:00:00", aula: "Aula 3.12", estimada: true }],
    compromisos: [{ cursadaId: "c1", inicio: "2026-09-11T21:30:00Z", minutos: 45, titulo: "LIMITES Y CONTINUIDAD" }],
    disponibilidad: [{ dia: 5, desde: null, hasta: null, minutos: 90 }],
    dictadas: [
      { cursadaId: "c1", fecha: "2026-09-04", temas: ["u1", "u2"] },
      // Fechada después de hoy: **no se dio**, y no mueve `Un.`.
      { cursadaId: "c1", fecha: "2026-09-18", temas: ["u2"] },
    ],
    temas: [
      { id: "u1", codigo: "U1", secuencia: 1 },
      { id: "u2", codigo: "U2", secuencia: 2 },
    ],
  };
  const cuadro = (dia: InsumosDelDia = DIA, materias: Materia[] = [materia()]) =>
    proyectarTablero(insumos(materias), dia, AHORA, ZONA).hoy;

  it("la clase de hoy dice su unidad y su aula, en poco", () => {
    expect(cuadro().clases).toEqual([
      { cursadaId: "c1", hora: "10:00–12:00", materia: "Analisis matematico I", detalle: "Un. 2 · Aula 3.12" },
    ]);
  });

  it("una clase simulada lleva la nota de estimado, y `Un.` la suya", () => {
    expect(cuadro().notas).toEqual(
      expect.arrayContaining([
        "Horarios y aulas estimados por Achieve, no publicados por la facultad.",
        "Un.: la unidad de la última clase dada.",
      ]),
    );
  });

  it("sin clases simuladas no hay nota de estimado", () => {
    const real = { ...DIA, clases: DIA.clases.map((c) => ({ ...c, estimada: false })) };
    expect(cuadro(real).notas).not.toContain("Horarios y aulas estimados por Achieve, no publicados por la facultad.");
  });

  it("podés avanzar: lo dado y sin evidencia; una unidad con evidencia no se ofrece", () => {
    expect(cuadro().avanzar).toEqual([{ cursadaId: "c1", materia: "Analisis matematico I", unidades: "Un. 1 · 2" }]);
    const conUna = materia({
      unidades: [
        { id: "u1", peso: null, evidencia: "enviada" },
        { id: "u2", peso: null, evidencia: "sin_evidencia" },
      ],
    });
    expect(cuadro(DIA, [conUna]).avanzar[0]?.unidades).toBe("Un. 2");
  });

  it("los horarios llegan redactados, con la hora de pared", () => {
    expect(cuadro().horarios).toEqual([
      { tipo: "COMPROMISO", hora: "18:30", texto: "Compromiso · Limites y continuidad", cursadaId: "c1" },
      { tipo: "DISPONIBLE", hora: null, texto: "Disponible para estudiar · 1,5 h", cursadaId: null },
    ]);
  });

  it("sin clases dadas el vacío no dice «todo hecho»", () => {
    expect(cuadro({ ...DIA, dictadas: [] }).vacioDeAvance).toBe("Todavía no hay clases dadas cargadas.");
  });

  it("el número de unidad sale del código y, si no hay, de la secuencia", () => {
    expect(numeroDeUnidad("U5", 9)).toBe(5);
    expect(numeroDeUnidad(null, 3)).toBe(3);
    expect(numeroDeUnidad("Intro", null)).toBeNull();
  });
});
