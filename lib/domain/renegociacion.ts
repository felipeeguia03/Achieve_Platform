import type { CommitmentState } from "./types";
import { canTransition, commitmentTransitions } from "./state-machines";
// El offset real de la zona, compartido con `superposicion.ts`: dos copias de
// aritmética de husos divergen en el primer horario de verano.
import { desplazamiento } from "./zona";
import { bloqueQueSeSuperpone, type BloqueSemanal } from "./superposicion";

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

// ── Lo que la pantalla necesita saber ANTES de proponer nada — ADR-050 ───────

/**
 * ¿Se le ofrece al estudiante cambiar el horario?
 *
 * `elegibilidadDeRenegociacion` juzga **una propuesta concreta**; esto juzga
 * **si hay alguna propuesta posible**, que es lo que decide si la acción
 * secundaria aparece. No son la misma pregunta: a las 23:50 de un compromiso
 * de hoy no queda ningún horario que cumpla las condiciones 4 y 5 a la vez, y
 * ofrecer un botón que no puede terminar en nada es prometer lo que el
 * servidor va a rechazar.
 *
 * ⚠️ **No reimplementa las reglas: usa las mismas.** El último instante
 * posible es el final del día acordado, y el primero es `ahora + 15 minutos`.
 * Si el primero pasa al segundo, no hay horario.
 */
export type MotivoSinCambio =
  | "YA_EMPEZO"
  | "INCUMPLIDO"
  | "ESTADO_TERMINAL"
  | "CADENA_YA_RENEGOCIADA"
  | "SIN_HORARIO_POSIBLE"
  | "SIN_ACUERDO_ORIGINAL";

export type CambioDeHorario =
  | { sePuede: true; horarios: readonly string[] }
  | { sePuede: false; motivo: MotivoSinCambio };

/** Cada cuánto se ofrece un horario. Es presentación, no regla. */
const PASO_EN_MINUTOS = 15;

/**
 * El instante en que empieza el día siguiente al del acuerdo, en la zona de la
 * institución. Todo horario propuesto tiene que ser **anterior** a esto.
 *
 * Se construye buscando el offset real de la zona ese día en vez de asumir uno:
 * un `-03:00` escrito a mano se rompe en la primera institución con horario de
 * verano.
 */
function finDelDia(instanteDelAcuerdo: string, zona: string): number {
  const dia = new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: zona,
  }).format(new Date(instanteDelAcuerdo));

  // Medianoche del día siguiente: se prueba contra la zona y se corrige por su
  // offset, que `Intl` devuelve al formatear.
  const siguiente = Date.UTC(
    Number(dia.slice(0, 4)), Number(dia.slice(5, 7)) - 1, Number(dia.slice(8, 10)) + 1,
  );
  return siguiente - desplazamiento(siguiente, zona);
}

/**
 * Por qué un estado no admite mover el horario.
 *
 * Vive acá y no en la ruta ni en la pantalla porque **lo usan los dos**: la
 * proyección para decidir qué explicar antes de intentar, y el endpoint para
 * decir qué pasó cuando la elegibilidad cambió en el medio. Dos tablas serían
 * dos verdades, y la de la ruta diría *«ya empezó»* de algo que se incumplió.
 */
export function motivoDelEstado(estado: CommitmentState): MotivoSinCambio {
  if (estado === "STARTED") return "YA_EMPEZO";
  if (estado === "MISSED") return "INCUMPLIDO";
  // `RENEGOTIATED` no es «terminal» a secas: es **exactamente** el caso de la
  // cadena gastada, visto desde el otro lado. Es lo que ve quien tenía la
  // pantalla abierta cuando el horario se movió por otro camino, y decirle
  // «está cerrado» sería contarle otra historia.
  if (estado === "RENEGOTIATED") return "CADENA_YA_RENEGOCIADA";
  return "ESTADO_TERMINAL";
}

export function cambioDeHorarioPosible(entrada: {
  estado: CommitmentState;
  renegociadoDeId: string | null;
  inicioOriginal: string | null;
  ahora: string;
  zonaInstitucional: string;
  /**
   * Los bloques de clase conocidos y cuánto dura el compromiso —
   * [ADR-064](../../docs/decisions.md#adr-064).
   *
   * **No cambian la elegibilidad, filtran la oferta.** Con la lista vacía —el
   * caso de casi todo el mundo hoy— se ofrecen exactamente las mismas franjas
   * que antes de que esta regla existiera.
   */
  bloques?: readonly BloqueSemanal[];
  minutos?: number;
}): CambioDeHorario {
  if (!canTransition(commitmentTransitions, entrada.estado, "RENEGOTIATED")) {
    // El motivo se distingue porque la salida del estudiante es distinta en
    // cada caso: empezar, rescatar, o nada.
    return { sePuede: false, motivo: motivoDelEstado(entrada.estado) };
  }
  if (entrada.renegociadoDeId !== null) {
    return { sePuede: false, motivo: "CADENA_YA_RENEGOCIADA" };
  }
  if (entrada.inicioOriginal === null) {
    return { sePuede: false, motivo: "SIN_ACUERDO_ORIGINAL" };
  }

  const limite = finDelDia(entrada.inicioOriginal, entrada.zonaInstitucional);
  const primero = Date.parse(entrada.ahora) + MINUTOS_DE_ANTICIPACION * 60_000;
  if (primero >= limite) return { sePuede: false, motivo: "SIN_HORARIO_POSIBLE" };

  // Se redondea hacia arriba al próximo múltiplo del paso: ofrecer «19:07» es
  // ofrecer un horario que nadie eligió, y ofrecer uno ya pasado sería ofrecer
  // algo que el servidor rechaza.
  const paso = PASO_EN_MINUTOS * 60_000;
  const bloques = entrada.bloques ?? [];
  const minutos = entrada.minutos ?? 0;
  const horarios: string[] = [];
  for (let t = Math.ceil(primero / paso) * paso; t < limite; t += paso) {
    const inicio = new Date(t).toISOString();
    // ADR-064: **no se ofrece una franja que el servidor va a rechazar.** Es el
    // mismo criterio con el que arriba no se ofrece un horario ya pasado.
    if (
      minutos > 0 &&
      bloqueQueSeSuperpone({ inicio, minutos, zonaInstitucional: entrada.zonaInstitucional }, bloques)
    ) {
      continue;
    }
    horarios.push(inicio);
  }

  // Puede quedar vacío si el redondeo se pasó del límite, **o si todas las
  // franjas del día tienen clase encima**: en los dos casos no hay horario
  // posible, y se dice con el mismo motivo.
  return horarios.length > 0
    ? { sePuede: true, horarios }
    : { sePuede: false, motivo: "SIN_HORARIO_POSIBLE" };
}
