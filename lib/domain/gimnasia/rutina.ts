/**
 * La **rutina de memoria** y lo que se afirma del progreso ·
 * [ADR-102](../../../docs/decisions.md#adr-102) §3 y §10.
 *
 * ## Cuatro medidas que no se mezclan
 *
 * Puntuación de la cuadrícula, nivel de la cadena, repasos de Recuerdo real y
 * días con rutina **son magnitudes distintas**. No hay un número que las sume:
 * un «índice cognitivo» afirmaría algo que ningún ejercicio mide.
 */

export type Juego = "FLASH_GRID" | "REVERSE_CHAIN" | "REAL_RECALL";

/** El orden de la rutina, y el de las tarjetas. */
export const JUEGOS_DE_MEMORIA = ["FLASH_GRID", "REVERSE_CHAIN", "REAL_RECALL"] as const satisfies readonly Juego[];

export function esJuego(v: unknown): v is Juego {
  return typeof v === "string" && (JUEGOS_DE_MEMORIA as readonly string[]).includes(v);
}

export type OrigenDeSesion = "ROUTINE" | "SINGLE_GAME";

/** Minutos estimados por ejercicio. Los tres suman ocho: la rutina entra entre seis y diez. */
export const MINUTOS_POR_JUEGO: Readonly<Record<Juego, number>> = {
  FLASH_GRID: 3,
  REVERSE_CHAIN: 2,
  REAL_RECALL: 3,
};

/**
 * Los ejercicios de la rutina de hoy.
 *
 * ⚠️ **Sin preguntas disponibles, Recuerdo real no entra.** No se fabrican: la
 * rutina queda con los dos ejercicios genéricos y la tarjeta dice por qué.
 */
export function juegosDeLaRutina(hayPreguntas: boolean): Juego[] {
  return JUEGOS_DE_MEMORIA.filter((j) => j !== "REAL_RECALL" || hayPreguntas);
}

export function minutosDe(juegos: readonly Juego[]): number {
  return juegos.reduce((m, j) => m + MINUTOS_POR_JUEGO[j], 0);
}

/** El primer ejercicio previsto que todavía no se completó, en el orden de la rutina. */
export function juegoSiguiente(previstos: readonly Juego[], completados: readonly Juego[]): Juego | null {
  return previstos.find((j) => !completados.includes(j)) ?? null;
}

/** Días distintos con al menos una rutina **completada**. Las canceladas no cuentan. */
export function diasConRutina(fechasLocales: readonly string[]): number {
  return new Set(fechasLocales).size;
}

export type Marca = "PRIMERA" | "NUEVA" | "SIN_CAMBIO";

/**
 * ¿Superó su marca? **Sin marca anterior no hay nada que superar:** es la
 * primera, y se dice así, no *«¡nueva marca!»*.
 */
export function marcaDe(valor: number, mejorAnterior: number | null): Marca {
  if (mejorAnterior === null) return "PRIMERA";
  return valor > mejorAnterior ? "NUEVA" : "SIN_CAMBIO";
}
