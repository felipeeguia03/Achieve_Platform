import type { CommitmentState } from "./types";
import { canTransition, commitmentTransitions } from "./state-machines";

/**
 * Cuándo una renegociación es elegible — [ADR-046](../../docs/decisions.md#adr-046).
 *
 * Las cinco condiciones del Product Owner, **todas obligatorias**, en un solo
 * lugar y sin acceso a la base: son una regla, no una consulta.
 *
 * ## Lo que la regla NO exige, y es el error más probable
 *
 * ⚠️ **No hay anticipación mínima respecto del horario original.** Textual:
 * *"un compromiso en `DUE` todavía puede renegociarse mientras no haya sido
 * declarado `MISSED`"*. El límite es el estado, no el reloj del acuerdo viejo.
 * Los 15 minutos se miden contra **ahora**, no contra el original.
 *
 * ## Y una lectura que se declara en vez de esconderse
 *
 * La condición 5 dice *"el mismo día calendario"* sin nombrar contra qué. Se
 * lee **contra el día del acuerdo original**: renegociar mueve la hora dentro
 * del día prometido, no el día. La otra lectura posible —el día en que se pide
 * el cambio— haría que un compromiso de mañana sólo pueda moverse a hoy, que
 * es al revés de lo que la operación significa.
 */

/** Contra `ahora`, no contra el horario original. Ver arriba. */
export const MINUTOS_DE_ANTICIPACION = 15;

export type MotivoDeInelegibilidad =
  /** Condiciones 1 y 2: el estado ya no admite `RENEGOTIATED`. */
  | "ESTADO_NO_RENEGOCIABLE"
  /** Condición 3: la cadena ya gastó su única renegociación. */
  | "CADENA_YA_RENEGOCIADA"
  /** Condición 4: el nuevo horario empieza dentro de los próximos 15 minutos. */
  | "ANTICIPACION_INSUFICIENTE"
  /** Condición 5: el nuevo horario cae en otro día calendario. */
  | "OTRO_DIA_CALENDARIO"
  /**
   * No hay contra qué comparar el día: el compromiso no tiene horario acordado.
   * No debería ocurrir —`DRAFT` no es renegociable—, y si ocurre **no se
   * adivina un día**: se rechaza. Omitir, no inventar.
   */
  | "SIN_ACUERDO_ORIGINAL";

export type Elegibilidad =
  | { elegible: true }
  | { elegible: false; motivo: MotivoDeInelegibilidad };

export interface PropuestaDeRenegociacion {
  /** El compromiso que se quiere mover. */
  estado: CommitmentState;
  /** Distinto de `null` ⇒ este compromiso YA es el sucesor de otro. */
  renegociadoDeId: string | null;
  /** El instante acordado que se quiere reemplazar. `null` ⇒ no hay acuerdo. */
  inicioOriginal: string | null;
  /** El instante propuesto. */
  inicioPropuesto: string;
  /** El momento en que se pide el cambio. */
  ahora: string;
  /** La zona de la **institución** (ADR-049), no la del estudiante. */
  zonaInstitucional: string;
}

/** `YYYY-MM-DD` en la zona pedida. El día calendario, no el instante. */
function diaEn(instante: string, zona: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: zona,
  }).format(new Date(instante));
}

export function elegibilidadDeRenegociacion(p: PropuestaDeRenegociacion): Elegibilidad {
  // 1 y 2 — la máquina ya sabe esto: `STARTED` y `MISSED` no tienen salida a
  // `RENEGOTIATED`. No se reescribe la lista acá para que no existan dos.
  if (!canTransition(commitmentTransitions, p.estado, "RENEGOTIATED")) {
    return { elegible: false, motivo: "ESTADO_NO_RENEGOCIABLE" };
  }

  // 3 — una sola por cadena. Si este compromiso ya es el sucesor de otro, la
  // cadena la gastó. No hace falta mirar hacia adelante: un compromiso que ya
  // fue renegociado está en `RENEGOTIATED` y no llega hasta acá.
  if (p.renegociadoDeId !== null) {
    return { elegible: false, motivo: "CADENA_YA_RENEGOCIADA" };
  }

  // 4 — al menos 15 minutos después de AHORA.
  const propuesto = new Date(p.inicioPropuesto).getTime();
  const ahora = new Date(p.ahora).getTime();
  if (propuesto - ahora < MINUTOS_DE_ANTICIPACION * 60_000) {
    return { elegible: false, motivo: "ANTICIPACION_INSUFICIENTE" };
  }

  // 5 — el mismo día calendario, en la zona de la institución.
  if (p.inicioOriginal === null) {
    return { elegible: false, motivo: "SIN_ACUERDO_ORIGINAL" };
  }
  if (diaEn(p.inicioPropuesto, p.zonaInstitucional) !== diaEn(p.inicioOriginal, p.zonaInstitucional)) {
    return { elegible: false, motivo: "OTRO_DIA_CALENDARIO" };
  }

  return { elegible: true };
}
