/**
 * La ventana de preparación — [ADR-078](../../docs/decisions.md#adr-078).
 *
 * ## Qué afirma, y qué explícitamente no
 *
 * **Cuánto tiempo hay**: desde la primera clase dictada hasta la evaluación. Las
 * dos puntas son hechos persistidos y ninguna se infiere.
 *
 * ⚠️ **No es el reparto, y la distinción es el motivo de este módulo.**
 * [ADR-073](../../docs/decisions.md#adr-073) reparte **horas por semana** sobre
 * un presupuesto declarado; esto describe **días de calendario**. Ninguno puede
 * contradecir al otro porque no afirman la misma magnitud — y por eso este
 * archivo **no importa `reparto.ts` ni conoce la disponibilidad**.
 *
 * ## Lo que tiene prohibido hacer
 *
 * 1. **Inventar una punta.** Sin fecha de evaluación **no hay ventana**: dibujar
 *    hasta el borde del eje sería fabricar un plazo.
 * 2. **Decir si alcanza.** Una ventana corta no dice «no llegás»
 *    ([ADR-058](../../docs/decisions.md#adr-058)). Dice cuántos días hay.
 * 3. **Ordenar.** El orden lo decide la proyección, por próxima evaluación
 *    ([ADR-072](../../docs/decisions.md#adr-072)).
 */

/** La versión de la regla. Cambiarla **no** reescribe ventanas viejas. */
export const REGLA_DE_VENTANA = "ventana-v1";

/** El piso del eje hacia atrás. Conserva la forma que el owner dibujó. */
export const SEMANAS_HACIA_ATRAS = 2;

/**
 * El piso del eje hacia adelante. Es un **piso**, no un techo: una evaluación
 * más lejana estira el eje en vez de quedar fuera de cuadro.
 */
export const SEMANAS_HACIA_ADELANTE = 3;

const DIA = 86_400_000;

/** Una fecha `YYYY-MM-DD` a milisegundos, leída como día de calendario. */
function dia(fecha: string): number {
  return Date.parse(`${fecha}T00:00:00Z`);
}

/** Milisegundos a `YYYY-MM-DD`. */
function comoFecha(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export interface MateriaConVentana {
  /** `null` ⇒ no hay clases cargadas. **No es «empezó hoy»**. */
  primeraClase: string | null;
  /** `null` ⇒ no hay evaluación con fecha. **Sin esto no hay ventana**. */
  fechaDeEvaluacion: string | null;
}

export type Ventana =
  | {
      estado: "OK";
      /** `YYYY-MM-DD`. Puede ser anterior al eje: el recorte es de dibujo. */
      inicio: string;
      fin: string;
      /**
       * `true` ⇒ el inicio **no es un hecho**: no hay clases cargadas y se tomó
       * el borde del eje. La pantalla lo dice; no lo disimula.
       */
      inicioDesconocido: boolean;
      regla: string;
    }
  | { estado: "SIN_VENTANA"; motivo: "sin_fecha_de_evaluacion"; regla: string };

/**
 * @param m las dos puntas, como vienen de la base
 * @param bordeIzquierdo el arranque del eje, para la materia sin clases cargadas
 */
export function ventanaDe(m: MateriaConVentana, bordeIzquierdo: string): Ventana {
  // ⚠️ **Sin fin no hay ventana**, y no es un caso degradado que se dibuje en
  // gris: es la ausencia de un plazo. Una barra hasta el borde del eje diría
  // que el examen es entonces.
  if (m.fechaDeEvaluacion === null) {
    return { estado: "SIN_VENTANA", motivo: "sin_fecha_de_evaluacion", regla: REGLA_DE_VENTANA };
  }

  // Sin primera clase hay plazo y no se sabe desde cuándo. Se dibuja desde el
  // borde **con la marca puesta**: es distinto de haber empezado ahí.
  const inicioDesconocido = m.primeraClase === null;
  const inicio = m.primeraClase ?? bordeIzquierdo;

  // ⚠️ **Una primera clase posterior a la evaluación no se «arregla».** Es un
  // dato contradictorio —una carga mal hecha, o un examen ya pasado— y
  // colapsarlo a un punto lo escondería. La ventana sale invertida y la
  // pantalla la recorta; el dato queda como está.
  return { estado: "OK", inicio, fin: m.fechaDeEvaluacion, inicioDesconocido, regla: REGLA_DE_VENTANA };
}

export interface Eje {
  desde: string;
  hasta: string;
  /** Cuántos días cubre. Nunca cero: el eje tiene al menos cinco semanas. */
  dias: number;
}

/**
 * El eje común de todas las materias.
 *
 * ⚠️ **Los dos extremos son pisos, y el derecho cede ante los datos.** Una
 * evaluación más lejana que `+3 semanas` **estira el eje**: un examen fuera de
 * cuadro es peor que un eje largo.
 */
export function ejeDelPeriodo(hoy: string, evaluaciones: readonly string[]): Eje {
  const centro = dia(hoy);
  const desde = centro - SEMANAS_HACIA_ATRAS * 7 * DIA;
  const pisoDerecho = centro + SEMANAS_HACIA_ADELANTE * 7 * DIA;
  const masLejana = evaluaciones.length === 0 ? pisoDerecho : Math.max(...evaluaciones.map(dia));
  const hasta = Math.max(pisoDerecho, masLejana);
  return { desde: comoFecha(desde), hasta: comoFecha(hasta), dias: Math.round((hasta - desde) / DIA) };
}

/**
 * Dónde cae una fecha dentro del eje, como fracción `0`–`1`.
 *
 * **Recortada a los bordes**: una primera clase de marzo se dibuja pegada al
 * borde izquierdo en vez de salirse del cuadro. El recorte es de **dibujo**; el
 * dato que viaja sigue siendo la fecha real.
 */
export function posicionEnEje(fecha: string, eje: Eje): number {
  const bruta = (dia(fecha) - dia(eje.desde)) / (eje.dias * DIA);
  return Math.min(1, Math.max(0, bruta));
}
