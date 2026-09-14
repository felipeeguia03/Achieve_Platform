import { describe, expect, it } from "vitest";

import { canTransition, focusSessionTransitions } from "@/lib/domain/state-machines";
import {
  aplicarComando,
  avanzarReloj,
  CONFIGURACION_DE_PRESET,
  descansoTras,
  duracionLegible,
  faseDe,
  GRACIA_EN_SEGUNDOS,
  posicionEnElCiclo,
  presetDe,
  relojDeFoco,
  requiereRecuperacion,
  resumenDe,
  tramoAbierto,
  validarPomodoro,
  type Comando,
  type EstadoDeSesion,
} from "@/lib/domain/sesion-de-focus";

/**
 * **La sesión de Focus, pura** — [ADR-104](../docs/decisions.md#adr-104).
 */

const T0 = "2026-09-13T21:00:00.000Z";
const en = (minutos: number, segundos = 0) => new Date(Date.parse(T0) + minutos * 60_000 + segundos * 1000).toISOString();

function nueva(): EstadoDeSesion {
  return {
    estado: "OPEN",
    modo: "FREE",
    pomodoro: null,
    iniciadaEn: T0,
    ultimoLatido: T0,
    terminadaEn: null,
    tramos: [{ id: "t1", tipo: "FOCUS", modo: "FREE", bloque: null, descanso: null, inicio: T0, finPlaneado: null, fin: null, motivo: null }],
  };
}

/**
 * Aplica comandos en orden, avanzando el reloj antes de cada uno, como el Service.
 *
 * **La pantalla late**: entre un paso y el siguiente se manda un latido por
 * minuto, como hace `/focus` mientras está abierta. Un paso con `sinPantalla`
 * llega después de un hueco sin latidos: la notebook cerrada.
 */
function correr(s: EstadoDeSesion, pasos: Array<[string, Comando, { sinPantalla?: true }?]>): EstadoDeSesion {
  let actual = s;
  let desde = Date.parse(s.ultimoLatido);
  for (const [ahora, comando, opciones] of pasos) {
    if (!opciones?.sinPantalla) {
      for (let t = desde + 60_000; t < Date.parse(ahora); t += 60_000) {
        const cuando = new Date(t).toISOString();
        const avanzada = avanzarReloj(actual, cuando);
        const r = aplicarComando(avanzada, { tipo: "LATIDO" }, cuando);
        actual = r.estado === "OK" ? r.sesion : avanzada;
      }
    }
    const r = aplicarComando(avanzarReloj(actual, ahora), comando, ahora);
    if (r.estado !== "OK") throw new Error(`${comando.tipo} en ${r.fase}`);
    actual = r.sesion;
    desde = Date.parse(ahora);
  }
  return actual;
}

describe("ADR-104 §6 · presets y límites", () => {
  it("los tres presets son los de la decisión, con el largo cada cuatro", () => {
    expect(CONFIGURACION_DE_PRESET.CLASICO).toEqual({ foco: 25, descansoCorto: 5, descansoLargo: 15, bloquesAntesDelLargo: 4 });
    expect(CONFIGURACION_DE_PRESET.INTERMEDIO).toEqual({ foco: 40, descansoCorto: 8, descansoLargo: 20, bloquesAntesDelLargo: 4 });
    expect(CONFIGURACION_DE_PRESET.PROFUNDO).toEqual({ foco: 50, descansoCorto: 10, descansoLargo: 25, bloquesAntesDelLargo: 4 });
  });

  it("personalizado valida enteros dentro de los límites técnicos", () => {
    expect(validarPomodoro({ foco: 30, descansoCorto: 6, descansoLargo: 18, bloquesAntesDelLargo: 3 })).not.toBeNull();
    expect(validarPomodoro({ foco: 4, descansoCorto: 6, descansoLargo: 18, bloquesAntesDelLargo: 3 })).toBeNull();
    expect(validarPomodoro({ foco: 30.5, descansoCorto: 6, descansoLargo: 18, bloquesAntesDelLargo: 3 })).toBeNull();
    expect(validarPomodoro({ foco: 30, descansoCorto: 6, descansoLargo: 18 })).toBeNull();
    expect(validarPomodoro(null)).toBeNull();
  });

  it("reconoce el preset de una configuración, o dice personalizado", () => {
    expect(presetDe(CONFIGURACION_DE_PRESET.INTERMEDIO)).toBe("INTERMEDIO");
    expect(presetDe({ ...CONFIGURACION_DE_PRESET.CLASICO, foco: 30 })).toBe("PERSONALIZADO");
  });

  it("el descanso largo va después de cada cuarto bloque", () => {
    const c = CONFIGURACION_DE_PRESET.CLASICO;
    expect([1, 2, 3, 4, 5, 8].map((n) => descansoTras(n, c).tipo)).toEqual(["SHORT", "SHORT", "SHORT", "LONG", "SHORT", "LONG"]);
    expect(posicionEnElCiclo(6, c)).toBe(2);
  });
});

describe("ADR-104 · la máquina de la sesión", () => {
  it("OPEN → ENDED, y ENDED es terminal", () => {
    expect(canTransition(focusSessionTransitions, "OPEN", "ENDED")).toBe(true);
    expect(canTransition(focusSessionTransitions, "ENDED", "OPEN")).toBe(false);
  });
});

describe("ADR-104 §6 y §8 · cronómetro libre", () => {
  it("empieza concentrado y cuenta hacia arriba", () => {
    const s = correr(nueva(), [[en(5), { tipo: "LATIDO" }]]);
    expect(faseDe(s, en(5, 20))).toBe("CONCENTRACION");
    expect(resumenDe(s, en(7)).focoSegundos).toBe(7 * 60);
  });

  it("pausar congela el foco y el tiempo pausado se cuenta aparte", () => {
    const s = correr(nueva(), [
      [en(10), { tipo: "PAUSAR" }],
      [en(15), { tipo: "CONTINUAR" }],
      [en(20), { tipo: "CERRAR", como: "SAVED" }],
    ]);
    const r = resumenDe(s, en(99));
    expect(r).toMatchObject({ focoSegundos: 15 * 60, pausadoSegundos: 5 * 60, totalSegundos: 20 * 60, pausas: 1, descansoSegundos: 0 });
    expect(s.estado).toBe("ENDED");
  });

  it("un clic viejo no hace nada y dice en qué fase está", () => {
    const pausada = correr(nueva(), [[en(1), { tipo: "PAUSAR" }]]);
    expect(aplicarComando(pausada, { tipo: "PAUSAR" }, en(2))).toEqual({ estado: "FASE_INVALIDA", fase: "PAUSADA" });
    expect(aplicarComando(pausada, { tipo: "VOLVER_ANTES" }, en(2)).estado).toBe("FASE_INVALIDA");
  });
});

describe("ADR-104 §6 · pasar de libre a Pomodoro no reescribe nada", () => {
  it("cierra el tramo libre con sus minutos y abre el bloque 1 entero", () => {
    const s = correr(nueva(), [[en(7), { tipo: "POMODORO", configuracion: CONFIGURACION_DE_PRESET.CLASICO }]]);
    expect(s.modo).toBe("POMODORO");
    expect(s.tramos[0]).toMatchObject({ modo: "FREE", fin: en(7), motivo: "SWITCHED" });
    expect(tramoAbierto(s.tramos)).toMatchObject({ modo: "POMODORO", bloque: 1, finPlaneado: en(32) });
    expect(aplicarComando(s, { tipo: "POMODORO", configuracion: CONFIGURACION_DE_PRESET.PROFUNDO }, en(8)).estado).toBe("FASE_INVALIDA");
  });

  it("el ejemplo de la propuesta: 7 libres + 25 + descanso 5 + 25 = 57 min de Focus", () => {
    let s = correr(nueva(), [[en(7), { tipo: "POMODORO", configuracion: CONFIGURACION_DE_PRESET.CLASICO }]]);
    // Latidos cada 30 s mientras corre: la pantalla está viva.
    for (let m = 8; m <= 32; m++) s = correr(s, [[en(m), { tipo: "LATIDO" }]]);
    s = avanzarReloj(s, en(32, 10));
    expect(faseDe(s, en(32, 10))).toBe("DESCANSO");
    s = avanzarReloj(s, en(38));
    // §7: terminado el descanso, el foco espera el clic.
    expect(faseDe(s, en(38))).toBe("LISTA");
    s = correr(s, [[en(40), { tipo: "CONTINUAR" }]]);
    for (let m = 41; m <= 65; m++) s = correr(s, [[en(m), { tipo: "LATIDO" }]]);
    s = avanzarReloj(s, en(65, 30));
    s = correr(s, [[en(66), { tipo: "CERRAR", como: "SAVED" }]]);
    const r = resumenDe(s, en(66));
    expect(r.focoSegundos).toBe(57 * 60);
    expect(r.descansoSegundos).toBe(6 * 60); // el segundo descanso corrió un minuto antes de cerrar
    expect(r.bloquesCompletos).toBe(2);
    expect(r.bloquesParciales).toBe(0);
  });
});

describe("ADR-104 §7 · Pomodoro", () => {
  const pomodoro = () => correr(nueva(), [[T0, { tipo: "POMODORO", configuracion: CONFIGURACION_DE_PRESET.CLASICO }]]);

  it("un bloque pausado se retoma con lo que le faltaba, no desde cero", () => {
    const s = correr(pomodoro(), [
      [en(10), { tipo: "PAUSAR" }],
      [en(20), { tipo: "CONTINUAR" }],
    ]);
    expect(tramoAbierto(s.tramos)).toMatchObject({ bloque: 1, finPlaneado: en(35) });
  });

  it("volver antes corta el descanso y abre el bloque siguiente", () => {
    let s = pomodoro();
    s = correr(s, [[en(24, 40), { tipo: "LATIDO" }]]);
    s = avanzarReloj(s, en(26));
    expect(faseDe(s, en(26))).toBe("DESCANSO");
    s = correr(s, [[en(27), { tipo: "VOLVER_ANTES" }]]);
    expect(tramoAbierto(s.tramos)).toMatchObject({ bloque: 2, finPlaneado: en(52) });
    expect(s.tramos.find((t) => t.tipo === "BREAK")).toMatchObject({ motivo: "SKIPPED", fin: en(27) });
  });

  it("cerrar a mitad de un bloque lo cuenta como parcial", () => {
    const s = correr(pomodoro(), [[en(12), { tipo: "CERRAR", como: "DONE" }]]);
    expect(resumenDe(s, en(12))).toMatchObject({ bloquesCompletos: 0, bloquesParciales: 1, focoSegundos: 12 * 60 });
  });

  it("un bloque que terminó sin pantalla viva NO se completa", () => {
    const s = avanzarReloj(pomodoro(), en(40));
    expect(faseDe(s, en(40))).toBe("RECUPERACION");
    expect(s.tramos.some((t) => t.tipo === "BREAK")).toBe(false);
  });
});

describe("ADR-104 §16 · recuperación", () => {
  it("sin latido más allá de la gracia, el libre pide recuperación", () => {
    const s = correr(nueva(), [[en(20), { tipo: "LATIDO" }]]);
    expect(requiereRecuperacion(s, en(20, GRACIA_EN_SEGUNDOS))).toBe(false);
    expect(requiereRecuperacion(s, en(20, GRACIA_EN_SEGUNDOS + 1))).toBe(true);
    expect(faseDe(s, en(300))).toBe("RECUPERACION");
    // Ni para mostrar se cuenta más allá del latido.
    expect(resumenDe(s, en(300)).focoSegundos).toBe(20 * 60);
  });

  it("una pausa no pide recuperación: el tiempo no está corriendo", () => {
    const s = correr(nueva(), [[en(5), { tipo: "PAUSAR" }]]);
    expect(faseDe(s, en(500))).toBe("PAUSADA");
  });

  it("reanudar cierra en el último latido y abre un foco nuevo", () => {
    const s = correr(nueva(), [
      [en(20), { tipo: "LATIDO" }],
      [en(300), { tipo: "RECUPERAR", opcion: "REANUDAR" }, { sinPantalla: true }],
    ]);
    expect(s.tramos[0]).toMatchObject({ fin: en(20), motivo: "RECOVERED" });
    expect(tramoAbierto(s.tramos)).toMatchObject({ tipo: "FOCUS", inicio: en(300) });
    expect(faseDe(s, en(300, 10))).toBe("CONCENTRACION");
  });

  it("revisar la deja pausada desde el último latido", () => {
    const s = correr(nueva(), [
      [en(20), { tipo: "LATIDO" }],
      [en(300), { tipo: "RECUPERAR", opcion: "REVISAR" }, { sinPantalla: true }],
    ]);
    expect(tramoAbierto(s.tramos)).toMatchObject({ tipo: "PAUSE", inicio: en(20) });
    expect(resumenDe(s, en(300)).focoSegundos).toBe(20 * 60);
  });

  it("*terminé cuando se cerró* cierra la sesión en el último latido", () => {
    const s = correr(nueva(), [
      [en(20), { tipo: "LATIDO" }],
      [en(300), { tipo: "CERRAR_EN_EL_ULTIMO_LATIDO" }, { sinPantalla: true }],
    ]);
    expect(s).toMatchObject({ estado: "ENDED", terminadaEn: en(20) });
    expect(resumenDe(s, en(999))).toMatchObject({ focoSegundos: 20 * 60, totalSegundos: 20 * 60 });
  });

  it("en recuperación no se admite un latido ni un cierre común", () => {
    const s = correr(nueva(), [[en(1), { tipo: "LATIDO" }]]);
    expect(aplicarComando(s, { tipo: "LATIDO" }, en(60)).estado).toBe("FASE_INVALIDA");
    expect(aplicarComando(s, { tipo: "CERRAR", como: "SAVED" }, en(60)).estado).toBe("FASE_INVALIDA");
  });
});

describe("formatos", () => {
  it("la duración redondea hacia abajo y el reloj pasa a horas", () => {
    expect(duracionLegible(52 * 60 + 59)).toBe("52 min");
    expect(duracionLegible(40)).toBe("menos de un minuto");
    expect(duracionLegible(0)).toBe("0 min");
    expect(duracionLegible(72 * 60)).toBe("1 h 12 min");
    expect(relojDeFoco(7 * 60 + 5)).toBe("07:05");
    expect(relojDeFoco(3725)).toBe("1:02:05");
  });
});
