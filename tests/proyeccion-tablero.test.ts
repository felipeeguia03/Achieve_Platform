import { describe, expect, it } from "vitest";

import {
  numeroDeUnidad,
  proyectarTablero,
  type InsumosDelDia,
} from "@/lib/server/servicios/proyeccion-tablero";
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

describe("la píldora, que es lo único que queda de las evaluaciones — ADR-096", () => {
  it("cuenta los días de la más cercana", () => {
    const t = proyectarTablero(
      insumos([
        materia({ cursadaId: "lejos", diasHastaEvaluacion: 20 }),
        materia({ cursadaId: "cerca", diasHastaEvaluacion: 5 }),
      ]),
      SIN_DIA,
      AHORA,
      ZONA,
    );
    expect(t.proximaEvaluacion).toEqual({ dias: 5 });
  });

  it("sin fecha no hay píldora: ausencia, no cero", () => {
    const t = proyectarTablero(
      insumos([materia({ diasHastaEvaluacion: null, evaluacion: null })]),
      SIN_DIA,
      AHORA,
      ZONA,
    );
    expect(t.proximaEvaluacion).toBeNull();
  });

  it("ya no se arman tarjetas ni carril: el listado vive en `/materias`", () => {
    const t = proyectarTablero(insumos([materia()]), SIN_DIA, AHORA, ZONA);
    expect(t).not.toHaveProperty("tarjetas");
    expect(t).not.toHaveProperty("horizonteEnDias");
    expect(t).not.toHaveProperty("aclaracionDeCobertura");
  });

  it("ningún enum crudo llega a la pantalla", () => {
    const t = proyectarTablero(insumos([materia()], 30), SIN_DIA, AHORA, ZONA);
    expect(JSON.stringify(t)).not.toMatch(/teorico_escrito|sin_evidencia|CONFIRMED|declared/);
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
      { cursadaId: "c1", hora: "10:00–12:00", materia: "Analisis matematico I", detalle: "Un. 2 · Aula 3.12", cuando: null, entrada: null },
    ]);
  });

  /*
    **ADR-098 §8** — la fila en curso o por empezar lleva `CTA-022`. Con la zona
    de la institución, porque el horario de cursado es suyo (ADR-049).
  */
  describe("Modo Clase: entrar desde la fila — ADR-098", () => {
    const CON_BLOQUE: InsumosDelDia = {
      ...DIA,
      clases: [{ ...DIA.clases[0], bloqueId: "b-1" }],
      zonaInstitucional: ZONA,
    };
    const en = (iso: string, dia: InsumosDelDia = CON_BLOQUE, materias: Materia[] = [materia()]) =>
      proyectarTablero(insumos(materias), dia, iso, ZONA).hoy;

    it("en curso: «Ahora» y Entrar a clase, con el bloque", () => {
      const fila = en("2026-09-11T14:00:00.000Z").clases[0];
      expect(fila.cuando).toBe("Ahora");
      expect(fila.entrada).toEqual({ tipo: "ENTRAR", bloqueId: "b-1" });
    });

    it("a 10 minutos: «Empieza en 10 min», y también se puede entrar", () => {
      const fila = en("2026-09-11T12:50:00.000Z").clases[0];
      expect(fila.cuando).toBe("Empieza en 10 min");
      expect(fila.entrada?.tipo).toBe("ENTRAR");
    });

    it("fuera de la ventana, la fila no lleva botón", () => {
      expect(en("2026-09-11T12:00:00.000Z").clases[0].entrada).toBeNull();
      // A la hora exacta del fin ya no está en curso.
      expect(en(AHORA).clases[0].entrada).toBeNull();
    });

    it("sin zona de la institución no se afirma que esté en curso", () => {
      const fila = en("2026-09-11T14:00:00.000Z", { ...CON_BLOQUE, zonaInstitucional: null }).clases[0];
      expect(fila.entrada).toBeNull();
      expect(fila.cuando).toBeNull();
    });

    it("con la clase de esa materia abierta, la fila dice Volver, y no se repite arriba", () => {
      const hoy = en("2026-09-11T14:00:00.000Z", { ...CON_BLOQUE, claseActiva: { id: "cl-1", cursadaId: "c1" } });
      expect(hoy.clases[0].entrada?.tipo).toBe("VOLVER");
      expect(hoy.claseAbierta).toBeNull();
    });

    it("con otra clase abierta, la fila no ofrece entrar, y la abierta se ve arriba", () => {
      const otra = materia({ cursadaId: "c2", nombre: "FISICA I" });
      const hoy = en("2026-09-11T14:00:00.000Z", { ...CON_BLOQUE, claseActiva: { id: "cl-9", cursadaId: "c2" } }, [materia(), otra]);
      expect(hoy.clases[0].entrada).toBeNull();
      expect(hoy.claseAbierta).toEqual({ cursadaId: "c2", materia: "Fisica I" });
    });

    it("una clase abierta un día sin clases igual se ve", () => {
      const hoy = en("2026-09-12T14:00:00.000Z", { ...CON_BLOQUE, claseActiva: { id: "cl-1", cursadaId: "c1" } });
      expect(hoy.clases).toEqual([]);
      expect(hoy.claseAbierta).toEqual({ cursadaId: "c1", materia: "Analisis matematico I" });
    });
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
