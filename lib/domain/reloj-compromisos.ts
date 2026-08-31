import type { CommitmentState } from "./types";

/**
 * El reloj del lifecycle de `Commitment` — puro.
 *
 * `product.md` §226: *"la UI **no** declara `MISSED` ni `DUE` por el paso del
 * tiempo. **Lo hace el owner del lifecycle**"*. Esto es ese owner, y es la
 * pieza que faltaba para que el producto se mueva solo.
 *
 * **Puro y con el tiempo por parámetro.** No lee `Date.now()`, no toca la base
 * y no decide nada más: recibe compromisos y un instante, y devuelve qué
 * transiciones corresponden. Quién las ejecuta es el Service.
 *
 * ⚠️ **La ventana es provisional** ([ADR-024](../../docs/decisions.md#adr-024)).
 * El spec dice **quién** declara `MISSED`, no **cuándo**: eso es `C01-010`
 * —*"Commitment temporal, renegociación y rescate"*—, `OPEN`. La regla de abajo
 * es una lectura razonable, **no una decisión de producto**, y se reemplaza
 * cuando ese contrato cierre.
 */
export interface CompromisoConReloj {
  id: string;
  state: CommitmentState;
  /** Instante acordado, en UTC. */
  startAt: string;
  /** Minutos que el estudiante declaró. Siempre `> 0` por constraint. */
  plannedMinutes: number;
}

export interface TransicionPorTiempo {
  id: string;
  desde: CommitmentState;
  hacia: Extract<CommitmentState, "DUE" | "MISSED">;
  /** Por qué, en palabras. Va al `causa` del evento. */
  porque: string;
}

/**
 * **Regla provisional de `MISSED` (`C01-010`, `OPEN`):** un compromiso se
 * incumple cuando **el bloque acordado pasó entero sin que se empezara**.
 *
 * El estudiante acordó trabajar `plannedMinutes` desde `startAt`; si pasó
 * `startAt + plannedMinutes` y nunca pasó a `STARTED`, ese bloque ya no existe.
 *
 * Sin tolerancia extra **a propósito**: una tolerancia es una decisión
 * pedagógica —cuánto se le perdona a alguien— y eso no lo define una función.
 */
function finDelBloque(c: CompromisoConReloj): number {
  return Date.parse(c.startAt) + c.plannedMinutes * 60_000;
}

/**
 * Qué transiciones corresponden a este instante.
 *
 * **Sólo devuelve una por compromiso**: si un `CONFIRMED` ya venció, primero
 * corresponde `DUE`. Saltar directo a `MISSED` borraría de la Bitácora que
 * alguna vez llegó su hora, y `product.md` pide que el historial no se pierda.
 */
export function transicionesPorTiempo(
  compromisos: readonly CompromisoConReloj[],
  ahora: string,
): TransicionPorTiempo[] {
  const t = Date.parse(ahora);
  if (!Number.isFinite(t)) return [];

  const salida: TransicionPorTiempo[] = [];
  for (const c of compromisos) {
    const inicio = Date.parse(c.startAt);
    if (!Number.isFinite(inicio)) continue;

    if (c.state === "CONFIRMED" && inicio <= t) {
      salida.push({ id: c.id, desde: "CONFIRMED", hacia: "DUE", porque: "llegó la hora acordada" });
      continue;
    }
    if (c.state === "DUE" && finDelBloque(c) <= t) {
      salida.push({
        id: c.id,
        desde: "DUE",
        hacia: "MISSED",
        porque: "el bloque acordado pasó sin empezar",
      });
    }
  }
  return salida;
}
