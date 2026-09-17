import { describe, expect, it } from "vitest";

import {
  HORIZONTE_SIN_FECHA_EN_SEMANAS,
  demandaSemanal,
  faltaTiempo,
  repartir,
  type MateriaEnElReparto,
} from "@/lib/domain/reparto";

/**
 * El reparto entre materias — [ADR-073](../docs/decisions.md#adr-073).
 *
 * Lo que estos tests protegen son las dos cosas que el reparto tiene prohibido
 * decir: **si vas a llegar** y **qué materia recortar**. Las dos van a parecer
 * mejoras cuando alguien las proponga.
 */

const m = (
  nombre: string,
  minutosPendientes: number | null,
  diasHastaEvaluacion: number | null,
): MateriaEnElReparto => ({ cursadaId: nombre, nombre, minutosPendientes, diasHastaEvaluacion });

describe("Cargar una materia reorganiza a las demás", () => {
  it("con una sola materia, se lleva todo el presupuesto", () => {
    const r = repartir([m("Análisis", 1200, 14)], 600);
    expect(r.materias[0].minutosAsignados).toBe(600);
    expect(r.materias[0].motivo).toBe("POR_URGENCIA");
  });

  it("al entrar la segunda, la primera recibe menos: es el pedido del owner", () => {
    const solo = repartir([m("Análisis", 1200, 14)], 600);
    const dos = repartir([m("Análisis", 1200, 14), m("Historia", 1200, 14)], 600);
    expect(solo.materias[0].minutosAsignados).toBe(600);
    expect(dos.materias[0].minutosAsignados).toBe(300);
    // El presupuesto no crece: lo que cambia es cómo se parte.
    expect(dos.materias.reduce((a, x) => a + (x.minutosAsignados ?? 0), 0)).toBe(600);
  });

  it("la urgencia manda: el mismo pendiente con el examen más cerca pesa más", () => {
    const r = repartir([m("Cerca", 1200, 7), m("Lejos", 1200, 28)], 1000);
    const cerca = r.materias.find((x) => x.nombre === "Cerca")!;
    const lejos = r.materias.find((x) => x.nombre === "Lejos")!;
    expect(cerca.minutosAsignados!).toBeGreaterThan(lejos.minutosAsignados!);
    expect(cerca.minutosAsignados! / lejos.minutosAsignados!).toBeCloseTo(4, 5);
  });

  it("un examen mañana no infla la demanda siete veces", () => {
    // El denominador nunca baja de una semana: con el examen encima, la demanda
    // es lo que falta, no lo que falta multiplicado por siete.
    expect(demandaSemanal(m("Mañana", 700, 1))).toBe(700);
    expect(demandaSemanal(m("En una semana", 700, 7))).toBe(700);
  });

  it("sin fecha entra al reparto con un horizonte declarado, no infinito", () => {
    // Dejarla fuera diría que no hay que estudiarla; estimarle una fecha sería
    // inventarla por la puerta de atrás.
    expect(demandaSemanal(m("Sin fecha", 1200, null))).toBe(1200 / HORIZONTE_SIN_FECHA_EN_SEMANAS);
    const r = repartir([m("Sin fecha", 1200, null)], 600);
    expect(r.materias[0].motivo).toBe("SIN_FECHA");
    expect(r.materias[0].minutosAsignados).toBe(600);
  });
});

describe("Lo que el reparto tiene prohibido decir", () => {
  it("cuando no alcanza, da las dos cifras y ninguna conclusión", () => {
    const r = repartir([m("A", 1400, 7), m("B", 1400, 7)], 600);
    expect(r.minutosPorSemana).toBe(600);
    expect(r.huecoSemanal).toBe(2200); // 2800 de demanda − 600 disponibles
    // `faltaTiempo` es un booleano sobre dos números, no un juicio. El objeto no
    // trae ninguna clave que afirme algo sobre el resultado del examen.
    expect(faltaTiempo(r)).toBe(true);
    expect(Object.keys(r).sort()).toEqual(
      // `demandaSemanalTotal` entró por ADR-075: es la cifra que se compara con
      // `minutosPorSemana`, y está en **la misma unidad a propósito**.
      [
        "demandaSemanalTotal",
        "huecoSemanal",
        "materias",
        "minutosPorSemana",
        "minutosRequeridos",
        "regla",
      ].sort(),
    );
  });

  it("cuando no alcanza, TODAS se achican en la misma proporción", () => {
    // ⚠️ El sistema no elige cuál se sacrifica. Si una recibiera cero, eso sería
    // proponer abandonarla.
    const r = repartir([m("A", 1400, 7), m("B", 1400, 7), m("C", 1400, 7)], 300);
    for (const x of r.materias) expect(x.minutosAsignados).toBe(100);
    expect(r.materias.every((x) => x.minutosAsignados! > 0)).toBe(true);
  });

  it("cuando sobra tiempo, el hueco es negativo y sigue sin haber veredicto", () => {
    const r = repartir([m("A", 140, 7)], 600);
    expect(r.huecoSemanal).toBe(-460);
    expect(faltaTiempo(r)).toBe(false);
  });
});

describe("Sin datos no es cero, tampoco acá", () => {
  it("sin disponibilidad declarada no hay reparto, y el motivo lo dice", () => {
    const r = repartir([m("A", 1200, 14)], null);
    expect(r.minutosPorSemana).toBeNull();
    expect(r.materias[0].minutosAsignados).toBeNull();
    expect(r.materias[0].motivo).toBe("SIN_DISPONIBILIDAD");
    // ⚠️ El hueco necesita las dos cifras: un cero se leería como «justo alcanza».
    expect(r.huecoSemanal).toBeNull();
    expect(faltaTiempo(r)).toBeNull();
  });

  it("una materia degradada entra al reparto sin pedir nada, y se dice", () => {
    // `SIN_ESTIMACION` no es «no necesita tiempo»: es que no sabemos cuánto.
    const r = repartir([m("Estimable", 1200, 14), m("Degradada", null, 14)], 600);
    const deg = r.materias.find((x) => x.nombre === "Degradada")!;
    expect(deg.motivo).toBe("SIN_ESTIMACION");
    expect(deg.minutosAsignados).toBeNull();
    // Y la estimable se lleva el presupuesto entero, porque es la única que pide.
    expect(r.materias[0].minutosAsignados).toBe(600);
  });

  it("con todas degradadas no hay requerido ni hueco: no se inventa un total", () => {
    const r = repartir([m("A", null, 14), m("B", null, null)], 600);
    expect(r.minutosRequeridos).toBeNull();
    expect(r.huecoSemanal).toBeNull();
    expect(r.materias.every((x) => x.minutosAsignados === null)).toBe(true);
  });

  it("sin materias, el reparto existe y no afirma nada", () => {
    const r = repartir([], 600);
    expect(r.materias).toEqual([]);
    expect(r.minutosRequeridos).toBeNull();
    expect(r.huecoSemanal).toBeNull();
  });
});

describe("La regla se versiona", () => {
  it("todo reparto declara con qué regla se calculó", () => {
    expect(repartir([m("A", 60, 7)], 60).regla).toBe("reparto-v1");
  });
});
