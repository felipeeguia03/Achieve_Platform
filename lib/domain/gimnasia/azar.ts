/**
 * El azar de Gimnasia cognitiva — [ADR-102](../../../docs/decisions.md#adr-102).
 *
 * ## Por qué hay semilla
 *
 * La secuencia de una ronda **no puede depender del render ni del navegador**:
 * el servidor tiene que poder rehacer la partida entera con la misma semilla y
 * corregirla él (`ADR-102` §4). Así, el cliente muestra lo que la semilla dice y
 * el servidor calcula el resultado con lo que la semilla dice: son la misma
 * secuencia sin que viaje nunca del cliente al servidor.
 *
 * **Puro:** sin `Math.random`, sin `crypto`, sin reloj. La semilla nueva la pone
 * el Service con `crypto`; acá sólo se la despliega.
 */

/** FNV-1a de 32 bits: una cadena a un entero sin signo, estable en todo motor. */
export function semillaDeTexto(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32: un generador chico, determinístico y suficiente para un juego. No es criptográfico. */
export function generador(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Un entero en `[min, max)`. */
export function enteroEntre(azar: () => number, min: number, max: number): number {
  return min + Math.floor(azar() * (max - min));
}

/**
 * El generador de **una** prueba: la semilla de la partida, el número de prueba
 * y su largo. Cambiar el largo cambia la secuencia, así que una ronda más larga
 * no es la anterior con una casilla agregada.
 */
export function azarDePrueba(semilla: number, prueba: number, largo: number): () => number {
  return generador(semillaDeTexto(`${semilla}:${prueba}:${largo}`));
}

/** El rango de una semilla válida: entero de 31 bits, para que entre en un `integer` de Postgres. */
export const SEMILLA_MAXIMA = 2147483647;

export function esSemilla(valor: unknown): valor is number {
  return Number.isInteger(valor) && (valor as number) >= 0 && (valor as number) <= SEMILLA_MAXIMA;
}
