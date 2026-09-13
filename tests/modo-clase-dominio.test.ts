/**
 * Modo Clase, corte 1 — el dominio puro · [ADR-098](../docs/decisions.md#adr-098).
 */
import { describe, expect, it } from "vitest";

import { clasesDeAhora, MINUTOS_ANTES_DE_CLASE, type BloqueDeHoy } from "@/lib/domain/clase-en-curso";
import {
  duracionEnMinutos,
  enOrden,
  esTipoDeMarca,
  reloj,
  resumenDeMarcas,
  segundosEntre,
  TIPOS_DE_MARCA,
} from "@/lib/domain/sesion-de-clase";
import {
  assertTransition,
  canTransition,
  classSessionTransitions,
  ForbiddenTransitionError,
  isTerminal,
} from "@/lib/domain/state-machines";
import { diaDeSemana } from "@/lib/domain/zona";

const ZONA = "America/Argentina/Cordoba"; // UTC-3, sin horario de verano
const JUEVES = "2026-09-17";
/** Un instante de pared en Córdoba, como ISO UTC. */
const a = (hhmm: string, fecha = JUEVES) => Date.parse(`${fecha}T${hhmm}:00-03:00`);

const analisis: BloqueDeHoy = { cursadaId: "c-analisis", bloqueId: "b-1", dia: 4, desde: "08:00:00", hasta: "10:00:00" };
const fisica: BloqueDeHoy = { cursadaId: "c-fisica", bloqueId: "b-2", dia: 4, desde: "10:00:00", hasta: "12:00:00" };

describe("la máquina de estados de la clase", () => {
  it("ACTIVE → ENDED es la única transición", () => {
    expect(canTransition(classSessionTransitions, "ACTIVE", "ENDED")).toBe(true);
    expect(classSessionTransitions.ACTIVE).toEqual(["ENDED"]);
  });

  it("una clase terminada no se reabre", () => {
    expect(isTerminal(classSessionTransitions, "ENDED")).toBe(true);
    expect(() => assertTransition("StudentClassSession", classSessionTransitions, "ENDED", "ACTIVE"))
      .toThrow(ForbiddenTransitionError);
  });

  it("no hay estados de procesamiento que nada alcanza", () => {
    expect(Object.keys(classSessionTransitions).sort()).toEqual(["ACTIVE", "ENDED"]);
  });
});

describe("las marcas", () => {
  it("son cuatro, y `ASSESSMENT` en vez de `EXAM`", () => {
    expect(TIPOS_DE_MARCA).toEqual(["QUESTION", "IMPORTANT", "ASSESSMENT", "REVIEW"]);
    expect(esTipoDeMarca("EXAM")).toBe(false);
    expect(esTipoDeMarca("❓")).toBe(false);
    expect(esTipoDeMarca("QUESTION")).toBe(true);
  });

  it("el resumen cuenta cada tipo, y sin marcas es un cero real", () => {
    expect(resumenDeMarcas([])).toEqual({ QUESTION: 0, IMPORTANT: 0, ASSESSMENT: 0, REVIEW: 0 });
    expect(resumenDeMarcas([{ tipo: "QUESTION" }, { tipo: "QUESTION" }, { tipo: "ASSESSMENT" }]))
      .toEqual({ QUESTION: 2, IMPORTANT: 0, ASSESSMENT: 1, REVIEW: 0 });
  });

  it("se ordenan por momento, y el empate por creación", () => {
    const m = enOrden([
      { id: "c", segundos: 90, creadaEn: "2026-09-17T11:01:30Z" },
      { id: "a", segundos: 10, creadaEn: "2026-09-17T11:00:10Z" },
      { id: "b", segundos: 10, creadaEn: "2026-09-17T11:00:11Z" },
    ]);
    expect(m.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
});

describe("tiempo y duración", () => {
  it("una clase abierta no tiene duración", () => {
    expect(duracionEnMinutos({ iniciadaEn: "2026-09-17T11:00:00Z", terminadaEn: null })).toBeNull();
  });

  it("una terminada, en minutos enteros", () => {
    expect(duracionEnMinutos({ iniciadaEn: "2026-09-17T11:00:00Z", terminadaEn: "2026-09-17T12:47:59Z" })).toBe(107);
  });

  it("un reloj corrido nunca da tiempo negativo", () => {
    expect(segundosEntre("2026-09-17T11:00:01Z", "2026-09-17T11:00:00Z")).toBe(0);
  });

  it("el reloj se escribe HH:MM:SS", () => {
    expect(reloj(0)).toBe("00:00:00");
    expect(reloj(4697)).toBe("01:18:17");
  });
});

describe("¿tiene clase ahora? · la ventana de ADR-098 §8", () => {
  it("el fixture es un jueves", () => {
    expect(diaDeSemana(JUEVES)).toBe(4);
  });

  it(`a ${MINUTOS_ANTES_DE_CLASE} minutos o menos es PROXIMA, con los minutos que faltan`, () => {
    expect(clasesDeAhora([analisis], a("07:50"), ZONA)).toEqual([
      { cursadaId: "c-analisis", bloqueId: "b-1", momento: "PROXIMA", desde: "08:00", hasta: "10:00", minutosParaEmpezar: 10 },
    ]);
    expect(clasesDeAhora([analisis], a("07:45"), ZONA)[0]?.momento).toBe("PROXIMA");
  });

  it("antes de la ventana no aparece", () => {
    expect(clasesDeAhora([analisis], a("07:44"), ZONA)).toEqual([]);
  });

  it("durante el horario es EN_CURSO, desde el minuto exacto de inicio", () => {
    expect(clasesDeAhora([analisis], a("08:00"), ZONA)[0]?.momento).toBe("EN_CURSO");
    expect(clasesDeAhora([analisis], a("08:17"), ZONA)[0]).toMatchObject({ momento: "EN_CURSO", minutosParaEmpezar: 0 });
  });

  it("a la hora exacta de fin ya no está en curso: intervalo semiabierto", () => {
    expect(clasesDeAhora([analisis], a("09:59"), ZONA)).toHaveLength(1);
    expect(clasesDeAhora([analisis], a("10:00"), ZONA)).toEqual([]);
  });

  it("dos clases seguidas: al terminar una, la siguiente ya está en curso", () => {
    const cambio = clasesDeAhora([fisica, analisis], a("10:00"), ZONA);
    expect(cambio.map((c) => [c.cursadaId, c.momento])).toEqual([["c-fisica", "EN_CURSO"]]);
  });

  it("una en curso y otra próxima conviven, en orden de inicio", () => {
    const clases = clasesDeAhora([fisica, analisis], a("09:50"), ZONA);
    expect(clases.map((c) => [c.cursadaId, c.momento])).toEqual([
      ["c-analisis", "EN_CURSO"],
      ["c-fisica", "PROXIMA"],
    ]);
  });

  it("un bloque de otro día no aparece", () => {
    expect(clasesDeAhora([{ ...analisis, dia: 2 }], a("08:30"), ZONA)).toEqual([]);
  });

  it("sin bloques no hay clase, y no se dice que esté libre", () => {
    expect(clasesDeAhora([], a("08:30"), ZONA)).toEqual([]);
  });

  it("el día lo decide la zona de la institución, no UTC", () => {
    // 22:30 del miércoles en Córdoba ya es jueves en UTC.
    const miercolesTarde = Date.parse("2026-09-16T22:30:00-03:00");
    const nocturna: BloqueDeHoy = { cursadaId: "c-noche", bloqueId: null, dia: 3, desde: "22:00", hasta: "23:30" };
    expect(clasesDeAhora([nocturna], miercolesTarde, ZONA)[0]?.momento).toBe("EN_CURSO");
    expect(clasesDeAhora([{ ...nocturna, dia: 4 }], miercolesTarde, ZONA)).toEqual([]);
  });
});
