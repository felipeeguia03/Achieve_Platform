/**
 * **La sesión de Focus** — [ADR-104](../../docs/decisions.md#adr-104).
 *
 * ## La sesión es la entidad; Pomodoro es un modo
 *
 * Una sesión es una secuencia de **tramos** —foco, descanso, pausa— con sus
 * instantes. Todo lo demás se deduce de ahí: en qué fase está, cuánto se
 * registró, qué bloque sigue. Nunca hay un `timeElapsed` que se suma de a un
 * segundo: eso se atrasa en una pestaña de fondo y miente después de una siesta
 * de la notebook.
 *
 * ## Qué es declarado y qué es derivado
 *
 * | Declarado (lo sella el servidor) | Derivado (acá) |
 * |---|---|
 * | empezar, pausar, continuar, pasar a Pomodoro, volver antes, cerrar, el último latido | la fase, la recuperación, el bloque, los tiempos, los bloques completos y parciales |
 *
 * ## ⚠️ El tiempo que corre sin nadie
 *
 * Un bloque Pomodoro tiene un **fin planeado**. Si llegó a él con la pantalla
 * viva, se completó en ese instante aunque el pedido llegue tarde. Si el último
 * latido es anterior, **no se cuenta más allá del latido**: eso es la
 * recuperación. Nada de esto toca un `Commitment` (AGENTS.md §2.3): es el reloj
 * que el estudiante eligió, no un lifecycle.
 *
 * **Puro:** sin React, sin I/O, sin copy. Los instantes entran por parámetro.
 */

import type { FocusSessionStatus } from "./types";

// ── Modos, presets y límites ─────────────────────────────────────────────────

export const MODOS_DE_FOCO = ["FREE", "POMODORO"] as const;
export type ModoDeFoco = (typeof MODOS_DE_FOCO)[number];

export interface ConfiguracionPomodoro {
  /** Minutos de cada bloque de foco. */
  foco: number;
  descansoCorto: number;
  descansoLargo: number;
  /** Cuántos bloques completos antes de un descanso largo. */
  bloquesAntesDelLargo: number;
}

export const PRESETS = ["CLASICO", "INTERMEDIO", "PROFUNDO"] as const;
export type Preset = (typeof PRESETS)[number];
export type PresetOPersonalizado = Preset | "PERSONALIZADO";

/**
 * Los tres de ADR-104 §6. **No son una recomendación cognitiva**: son tres
 * puntos de partida. Ninguna copy dice que uno sea mejor que otro.
 */
export const CONFIGURACION_DE_PRESET: Readonly<Record<Preset, ConfiguracionPomodoro>> = {
  CLASICO: { foco: 25, descansoCorto: 5, descansoLargo: 15, bloquesAntesDelLargo: 4 },
  INTERMEDIO: { foco: 40, descansoCorto: 8, descansoLargo: 20, bloquesAntesDelLargo: 4 },
  PROFUNDO: { foco: 50, descansoCorto: 10, descansoLargo: 25, bloquesAntesDelLargo: 4 },
};

/**
 * Límites **técnicos** de *Personalizado*: impiden un bloque de cero minutos o
 * uno de un día. ⚠️ No son un rango aconsejado, y la pantalla no los presenta así.
 */
export const LIMITES_POMODORO: Readonly<Record<keyof ConfiguracionPomodoro, { min: number; max: number }>> = {
  foco: { min: 5, max: 120 },
  descansoCorto: { min: 1, max: 30 },
  descansoLargo: { min: 5, max: 60 },
  bloquesAntesDelLargo: { min: 2, max: 8 },
};

export function esModoDeFoco(valor: unknown): valor is ModoDeFoco {
  return typeof valor === "string" && (MODOS_DE_FOCO as readonly string[]).includes(valor);
}

export function esPreset(valor: unknown): valor is Preset {
  return typeof valor === "string" && (PRESETS as readonly string[]).includes(valor);
}

/** `null` ⇒ algún valor falta, no es entero o cae fuera de su límite. */
export function validarPomodoro(valor: unknown): ConfiguracionPomodoro | null {
  if (typeof valor !== "object" || valor === null) return null;
  const v = valor as Record<string, unknown>;
  const salida = {} as ConfiguracionPomodoro;
  for (const clave of Object.keys(LIMITES_POMODORO) as Array<keyof ConfiguracionPomodoro>) {
    const n = v[clave];
    const { min, max } = LIMITES_POMODORO[clave];
    if (typeof n !== "number" || !Number.isInteger(n) || n < min || n > max) return null;
    salida[clave] = n;
  }
  return salida;
}

/** Qué preset es una configuración, o `PERSONALIZADO`. */
export function presetDe(c: ConfiguracionPomodoro): PresetOPersonalizado {
  for (const p of PRESETS) {
    const q = CONFIGURACION_DE_PRESET[p];
    if (
      q.foco === c.foco &&
      q.descansoCorto === c.descansoCorto &&
      q.descansoLargo === c.descansoLargo &&
      q.bloquesAntesDelLargo === c.bloquesAntesDelLargo
    ) {
      return p;
    }
  }
  return "PERSONALIZADO";
}

// ── Textos y preferencias ────────────────────────────────────────────────────

/** *Para después*: el anotador privado (ADR-104 §12). Límite técnico. */
export const MAXIMO_DE_ANOTADOR = 20_000;
/** *¿Qué avanzaste?* (ADR-104 §13). No es `Reflection`. */
export const MAXIMO_DE_AVANCE = 2_000;

/** Los sonidos se generan en el navegador (ADR-104 §19): sin archivos. */
export const SONIDOS = ["NINGUNO", "MARRON", "ROSA"] as const;
export type Sonido = (typeof SONIDOS)[number];

export function esSonido(valor: unknown): valor is Sonido {
  return typeof valor === "string" && (SONIDOS as readonly string[]).includes(valor);
}

/**
 * Lo único que se recuerda de un estudiante (ADR-104 §18). **Preferencia, no
 * perfil**: ningún motor la lee para decidir nada.
 */
export interface PreferenciasDeFocus {
  ultimoModo: ModoDeFoco;
  preset: PresetOPersonalizado | null;
  personalizado: ConfiguracionPomodoro | null;
  sonido: Sonido;
  volumen: number;
}

// ── El reloj ─────────────────────────────────────────────────────────────────

/** Cada cuánto manda un latido la pantalla mientras corre el foco. */
export const LATIDO_EN_SEGUNDOS = 30;
/**
 * Cuánto después del último latido la pantalla se da por viva. Cubre un latido
 * perdido y el freno de las pestañas de fondo, que espacian los timers a uno por
 * minuto. Pasado esto, **la sesión pide recuperación** (ADR-104 §16).
 */
export const GRACIA_EN_SEGUNDOS = 120;

export type TipoDeTramo = "FOCUS" | "BREAK" | "PAUSE";
export type TipoDeDescanso = "SHORT" | "LONG";

/**
 * Por qué se cerró un tramo. Es trazabilidad, y dos se leen para contar:
 * `COMPLETED` en un foco Pomodoro es un bloque completo; en un descanso, que
 * duró lo planeado.
 */
export type MotivoDeCierre =
  | "COMPLETED"
  | "PAUSED"
  | "RESUMED"
  | "SWITCHED"
  | "SKIPPED"
  | "SAVED"
  | "DONE"
  | "RECOVERED";

export interface Tramo {
  /** `null` ⇒ lo acaba de crear un comando y todavía no se guardó. */
  id: string | null;
  tipo: TipoDeTramo;
  /** Sólo en un foco. */
  modo: ModoDeFoco | null;
  /** El número de bloque Pomodoro, desde 1. `null` en libre, pausa y descanso. */
  bloque: number | null;
  descanso: TipoDeDescanso | null;
  inicio: string;
  /** Sólo en un foco Pomodoro y en un descanso. */
  finPlaneado: string | null;
  fin: string | null;
  motivo: MotivoDeCierre | null;
}

export interface EstadoDeSesion {
  estado: FocusSessionStatus;
  modo: ModoDeFoco;
  pomodoro: ConfiguracionPomodoro | null;
  iniciadaEn: string;
  ultimoLatido: string;
  terminadaEn: string | null;
  tramos: readonly Tramo[];
}

export type Fase = "CONCENTRACION" | "DESCANSO" | "PAUSADA" | "LISTA" | "RECUPERACION" | "FINALIZADA";

const ms = (iso: string) => Date.parse(iso);
const iso = (t: number) => new Date(t).toISOString();

/** Segundos entre dos instantes, nunca negativo. */
export function segundosEntre(desde: string, hasta: string): number {
  return Math.max(0, Math.floor((ms(hasta) - ms(desde)) / 1000));
}

export function tramoAbierto(tramos: readonly Tramo[]): Tramo | null {
  return tramos.find((t) => t.fin === null) ?? null;
}

function vivoHasta(s: EstadoDeSesion): number {
  return ms(s.ultimoLatido) + GRACIA_EN_SEGUNDOS * 1000;
}

function cerrar(tramos: readonly Tramo[], fin: string, motivo: MotivoDeCierre): Tramo[] {
  return tramos.map((t) => (t.fin === null ? { ...t, fin, motivo } : t));
}

function bloquesPomodoro(tramos: readonly Tramo[]): Map<number, { completo: boolean; segundos: number }> {
  const salida = new Map<number, { completo: boolean; segundos: number }>();
  for (const t of tramos) {
    if (t.tipo !== "FOCUS" || t.modo !== "POMODORO" || t.bloque === null) continue;
    const previo = salida.get(t.bloque) ?? { completo: false, segundos: 0 };
    salida.set(t.bloque, {
      completo: previo.completo || t.motivo === "COMPLETED",
      segundos: previo.segundos + (t.fin ? segundosEntre(t.inicio, t.fin) : 0),
    });
  }
  return salida;
}

export function bloquesCompletos(tramos: readonly Tramo[]): number {
  return [...bloquesPomodoro(tramos).values()].filter((b) => b.completo).length;
}

/** El descanso que corresponde al terminar el bloque `n`. */
export function descansoTras(n: number, c: ConfiguracionPomodoro): { tipo: TipoDeDescanso; minutos: number } {
  return n % c.bloquesAntesDelLargo === 0
    ? { tipo: "LONG", minutos: c.descansoLargo }
    : { tipo: "SHORT", minutos: c.descansoCorto };
}

/** *«Foco 2 de 4»*: la posición del bloque en su ciclo. */
export function posicionEnElCiclo(bloque: number, c: ConfiguracionPomodoro): number {
  return ((bloque - 1) % c.bloquesAntesDelLargo) + 1;
}

/**
 * El tramo de foco que abre *Continuar*.
 *
 * En Pomodoro, **un bloque pausado se retoma con lo que le faltaba**, no desde
 * cero: pausar congela, no reinicia. Un bloque ya completo abre el siguiente
 * entero.
 */
function focoNuevo(s: EstadoDeSesion, tramos: readonly Tramo[], ahora: string): Tramo {
  if (s.modo === "FREE" || !s.pomodoro) {
    return { id: null, tipo: "FOCUS", modo: "FREE", bloque: null, descanso: null, inicio: ahora, finPlaneado: null, fin: null, motivo: null };
  }
  const bloques = bloquesPomodoro(tramos);
  const ultimo = Math.max(0, ...bloques.keys());
  const pendiente = ultimo > 0 ? bloques.get(ultimo) : undefined;
  const total = s.pomodoro.foco * 60;
  const falta = pendiente && !pendiente.completo ? total - pendiente.segundos : 0;
  const [bloque, segundos] = falta > 0 ? [ultimo, falta] : [ultimo + 1, total];
  return {
    id: null,
    tipo: "FOCUS",
    modo: "POMODORO",
    bloque,
    descanso: null,
    inicio: ahora,
    finPlaneado: iso(ms(ahora) + segundos * 1000),
    fin: null,
    motivo: null,
  };
}

/**
 * Lleva la sesión hasta `ahora` aplicando lo que el modo elegido ya decidió:
 * un bloque que llegó a su fin **con la pantalla viva** se completa y abre su
 * descanso; un descanso que llegó a su fin se cierra y la sesión queda *lista*.
 *
 * ⚠️ **El siguiente foco nunca se abre acá** (ADR-104 §7): lo abre el clic.
 */
export function avanzarReloj(s: EstadoDeSesion, ahora: string): EstadoDeSesion {
  if (s.estado === "ENDED") return s;
  let tramos: Tramo[] = [...s.tramos];
  const t = ms(ahora);

  for (let vuelta = 0; vuelta < 4; vuelta++) {
    const abierto = tramoAbierto(tramos);
    if (!abierto || !abierto.finPlaneado) break;
    const fin = ms(abierto.finPlaneado);
    if (fin > t) break;

    if (abierto.tipo === "FOCUS") {
      // Terminó mientras nadie miraba: no se completa (§16).
      if (fin > vivoHasta(s) || !s.pomodoro || abierto.bloque === null) break;
      tramos = cerrar(tramos, abierto.finPlaneado, "COMPLETED");
      const d = descansoTras(abierto.bloque, s.pomodoro);
      tramos.push({
        id: null,
        tipo: "BREAK",
        modo: null,
        bloque: null,
        descanso: d.tipo,
        inicio: abierto.finPlaneado,
        finPlaneado: iso(fin + d.minutos * 60_000),
        fin: null,
        motivo: null,
      });
      continue;
    }
    if (abierto.tipo === "BREAK") {
      tramos = cerrar(tramos, abierto.finPlaneado, "COMPLETED");
    }
    break;
  }
  return tramos.length === s.tramos.length && tramos.every((x, i) => x === s.tramos[i]) ? s : { ...s, tramos };
}

/** ¿Corría el foco y la pantalla dejó de latir? Se evalúa sobre la sesión ya avanzada. */
export function requiereRecuperacion(s: EstadoDeSesion, ahora: string): boolean {
  if (s.estado === "ENDED") return false;
  const abierto = tramoAbierto(s.tramos);
  if (!abierto || abierto.tipo !== "FOCUS") return false;
  const limite = vivoHasta(s);
  if (ms(ahora) <= limite) return false;
  return abierto.finPlaneado === null || ms(abierto.finPlaneado) > limite;
}

export function faseDe(s: EstadoDeSesion, ahora: string): Fase {
  if (s.estado === "ENDED") return "FINALIZADA";
  const abierto = tramoAbierto(s.tramos);
  if (!abierto) return "LISTA";
  if (abierto.tipo === "BREAK") return "DESCANSO";
  if (abierto.tipo === "PAUSE") return "PAUSADA";
  return requiereRecuperacion(s, ahora) ? "RECUPERACION" : "CONCENTRACION";
}

// ── Los comandos ─────────────────────────────────────────────────────────────

export type Comando =
  | { tipo: "PAUSAR" }
  | { tipo: "CONTINUAR" }
  | { tipo: "POMODORO"; configuracion: ConfiguracionPomodoro }
  | { tipo: "VOLVER_ANTES" }
  | { tipo: "LATIDO" }
  | { tipo: "RECUPERAR"; opcion: "REANUDAR" | "REVISAR" }
  | { tipo: "CERRAR"; como: "SAVED" | "DONE" }
  | { tipo: "CERRAR_EN_EL_ULTIMO_LATIDO" };

export type ResultadoDeComando =
  | { estado: "OK"; sesion: EstadoDeSesion }
  /** El comando no corresponde a la fase en que está la sesión. */
  | { estado: "FASE_INVALIDA"; fase: Fase };

/**
 * Aplica un comando a una sesión **ya avanzada hasta `ahora`**.
 *
 * Cada comando se admite en ciertas fases y en ninguna otra. Un clic viejo
 * —*Pausar* sobre una sesión que ya está en descanso— no hace nada y lo dice.
 */
export function aplicarComando(s: EstadoDeSesion, comando: Comando, ahora: string): ResultadoDeComando {
  const fase = faseDe(s, ahora);
  const invalido: ResultadoDeComando = { estado: "FASE_INVALIDA", fase };
  const con = (cambios: Partial<EstadoDeSesion>): ResultadoDeComando => ({ estado: "OK", sesion: { ...s, ...cambios } });

  switch (comando.tipo) {
    case "LATIDO":
      if (fase === "RECUPERACION" || fase === "FINALIZADA") return invalido;
      return con({ ultimoLatido: ahora });

    case "PAUSAR": {
      if (fase !== "CONCENTRACION") return invalido;
      const tramos = cerrar(s.tramos, ahora, "PAUSED");
      tramos.push({ id: null, tipo: "PAUSE", modo: null, bloque: null, descanso: null, inicio: ahora, finPlaneado: null, fin: null, motivo: null });
      return con({ tramos, ultimoLatido: ahora });
    }

    case "CONTINUAR": {
      if (fase !== "PAUSADA" && fase !== "LISTA") return invalido;
      const tramos = cerrar(s.tramos, ahora, "RESUMED");
      tramos.push(focoNuevo(s, tramos, ahora));
      return con({ tramos, ultimoLatido: ahora });
    }

    case "POMODORO": {
      if (s.modo !== "FREE") return invalido;
      if (fase !== "CONCENTRACION" && fase !== "PAUSADA" && fase !== "LISTA") return invalido;
      const abierto = tramoAbierto(s.tramos);
      const tramos = cerrar(s.tramos, ahora, abierto?.tipo === "FOCUS" ? "SWITCHED" : "RESUMED");
      const siguiente: EstadoDeSesion = { ...s, modo: "POMODORO", pomodoro: comando.configuracion };
      tramos.push(focoNuevo(siguiente, tramos, ahora));
      return { estado: "OK", sesion: { ...siguiente, tramos, ultimoLatido: ahora } };
    }

    case "VOLVER_ANTES": {
      if (fase !== "DESCANSO") return invalido;
      const tramos = cerrar(s.tramos, ahora, "SKIPPED");
      tramos.push(focoNuevo(s, tramos, ahora));
      return con({ tramos, ultimoLatido: ahora });
    }

    case "RECUPERAR": {
      if (fase !== "RECUPERACION") return invalido;
      // Nunca más allá del último latido (§16).
      const tramos = cerrar(s.tramos, s.ultimoLatido, "RECOVERED");
      if (comando.opcion === "REANUDAR") {
        tramos.push(focoNuevo(s, tramos, ahora));
      } else {
        tramos.push({ id: null, tipo: "PAUSE", modo: null, bloque: null, descanso: null, inicio: s.ultimoLatido, finPlaneado: null, fin: null, motivo: null });
      }
      return con({ tramos, ultimoLatido: ahora });
    }

    case "CERRAR_EN_EL_ULTIMO_LATIDO": {
      if (fase !== "RECUPERACION") return invalido;
      return con({
        tramos: cerrar(s.tramos, s.ultimoLatido, "RECOVERED"),
        estado: "ENDED",
        terminadaEn: s.ultimoLatido,
      });
    }

    case "CERRAR": {
      if (fase === "FINALIZADA" || fase === "RECUPERACION") return invalido;
      return con({ tramos: cerrar(s.tramos, ahora, comando.como), estado: "ENDED", terminadaEn: ahora });
    }
  }
}

// ── Lo que se registra ───────────────────────────────────────────────────────

export interface Resumen {
  /** El dato principal: *tiempo registrado en Focus*. */
  focoSegundos: number;
  descansoSegundos: number;
  totalSegundos: number;
  /** Total − foco − descanso. Incluye el tiempo *lista* esperando el clic. */
  pausadoSegundos: number;
  pausas: number;
  bloquesCompletos: number;
  bloquesParciales: number;
}

/**
 * Los números de la sesión hasta `ahora`, o hasta su cierre si está cerrada.
 *
 * **Acá `0` es un cero real**: la sesión existe y no hubo, por ejemplo, ningún
 * descanso. Un tramo abierto cuenta hasta `ahora`.
 */
export function resumenDe(s: EstadoDeSesion, ahora: string): Resumen {
  const hasta = s.terminadaEn ?? ahora;
  // Una sesión que pide recuperación **no cuenta el foco más allá del último
  // latido**, ni siquiera para mostrarlo (§16).
  const tramos = requiereRecuperacion(s, ahora) ? cerrar(s.tramos, s.ultimoLatido, "RECOVERED") : s.tramos;
  let foco = 0;
  let descanso = 0;
  let pausas = 0;
  for (const t of tramos) {
    const segundos = segundosEntre(t.inicio, t.fin ?? hasta);
    if (t.tipo === "FOCUS") foco += segundos;
    else if (t.tipo === "BREAK") descanso += segundos;
    else pausas += 1;
  }
  const total = segundosEntre(s.iniciadaEn, hasta);
  const bloques = [...bloquesPomodoro(tramos).values()];
  return {
    focoSegundos: foco,
    descansoSegundos: descanso,
    totalSegundos: total,
    pausadoSegundos: Math.max(0, total - foco - descanso),
    pausas,
    bloquesCompletos: bloques.filter((b) => b.completo).length,
    bloquesParciales: bloques.filter((b) => !b.completo).length,
  };
}

/**
 * `52 min`, `1 h 12 min`. Redondea hacia abajo: no se regala un minuto.
 *
 * ⚠️ **Menos de un minuto no es «0 min»**, que se lee como que no ocurrió — la
 * misma regla que `textoDeDuracion` de Modo Clase. Un cero real sí es `0 min`.
 */
export function duracionLegible(segundos: number): string {
  if (segundos > 0 && segundos < 60) return "menos de un minuto";
  const minutos = Math.floor(Math.max(0, segundos) / 60);
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

/** `07:32` o `1:02:05`: el reloj de la pantalla. */
export function relojDeFoco(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const dos = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(s / 3600);
  return h > 0 ? `${h}:${dos(Math.floor((s % 3600) / 60))}:${dos(s % 60)}` : `${dos(Math.floor(s / 60))}:${dos(s % 60)}`;
}
