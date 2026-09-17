/**
 * Service del alta de evaluación — [ADR-067](../../../docs/decisions.md#adr-067).
 *
 * ## Qué tapa
 *
 * Ninguna ruta de la aplicación llegaba a un escritor de `assessment`. El
 * escritor existe —`ingerirMateria()`, con su RPC— pero **ninguna ruta lo
 * alcanza**, y tampoco serviría: `ingerir_materia` *reemplaza* las unidades y
 * las evaluaciones de la cursada entera. Usarlo para agregar un final borraría
 * el temario.
 *
 * Este módulo es angosto a propósito: da de alta **una** evaluación.
 *
 * ## Las dos reglas que se hacen cumplir acá
 *
 * 1. **La fecha es opcional**, y es lo que hace útil al alta. Quien sabe que
 *    tiene final pero no cuándo tiene que poder registrarlo: con eso ya hay
 *    temas y alcance, que es la mitad del Gantt. Obligarla lo forzaría a
 *    inventar una fecha — lo que `assessment_date` nullable existe para evitar.
 * 2. **El vocabulario de tipos es cerrado.** Sin eso el Gantt no puede tratar
 *    distinto un final de una entrega, y la ventana de 14 días de
 *    [ADR-048](../../../docs/decisions.md#adr-048) no sabe a qué aplicar.
 *
 * ## Lo que este módulo no decide
 *
 * **No emite evento de producto.** El catálogo declara `AcademicDataIngested`
 * como *"un hecho de la plataforma, no del estudiante"*, y esto es exactamente
 * lo contrario. Inventar un nombre nuevo es lo que el guard de
 * [ADR-027](../../../docs/decisions.md#adr-027) impide.
 */

/** El vocabulario del `CHECK assessment_tipo_vocabulario`. */
export const TIPOS_DE_EVALUACION = ["parcial", "final", "tp", "entrega", "coloquio"] as const;
export type TipoDeEvaluacion = (typeof TIPOS_DE_EVALUACION)[number];

/**
 * `oral` y `mixta` se **almacenan** aunque queden fuera de P0 (`C01-047`): lo
 * que no se hace nunca es mapearlas a una modalidad P0 para que "entren".
 */
export const MODALIDADES = ["practico", "teorico_escrito", "oral", "mixta", "otra"] as const;
export type Modalidad = (typeof MODALIDADES)[number];

export interface EvaluacionDeclarada {
  cursadaId: string;
  tipo: string;
  titulo: string;
  /** `YYYY-MM-DD`. Ausente ⇒ la evaluación existe sin fecha. */
  fecha?: string;
  /** `HH:MM`. Sin fecha no significa nada, y por eso se valida junto. */
  hora?: string;
  modalidad?: string;
  /** Texto libre. **No se parsea para derivar el alcance**: eso es `assessment_topic`. */
  alcance?: string;
}

export type ResultadoDeAlta =
  | { estado: "OK"; evaluacionId: string }
  | { estado: "DATOS_INVALIDOS"; motivo: string }
  /** La cursada no es de este estudiante, o no existe. Las dos son lo mismo desde afuera. */
  | { estado: "CURSADA_AJENA" };

/**
 * Valida sin tocar la base. Devuelve el motivo en castellano porque llega a la
 * pantalla: un `400` sin explicación deja al estudiante sin saber qué corregir.
 */
export function validarEvaluacion(e: EvaluacionDeclarada): string | null {
  if (!e.cursadaId?.trim()) return "hace falta decir de qué materia es";
  if (!e.titulo?.trim()) return "la evaluación necesita un título";

  if (!(TIPOS_DE_EVALUACION as readonly string[]).includes(e.tipo)) {
    return `el tipo tiene que ser uno de: ${TIPOS_DE_EVALUACION.join(", ")}`;
  }

  if (e.modalidad !== undefined && !(MODALIDADES as readonly string[]).includes(e.modalidad)) {
    return `la modalidad tiene que ser una de: ${MODALIDADES.join(", ")}`;
  }

  if (e.fecha !== undefined) {
    // `Date.parse` acepta cosas que no son fechas de calendario —`2026-02-31`
    // entre ellas—, así que se compara contra la fecha reconstruida.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.fecha)) return "la fecha va en formato AAAA-MM-DD";
    const d = new Date(`${e.fecha}T00:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== e.fecha) {
      return "esa fecha no existe en el calendario";
    }
  }

  if (e.hora !== undefined) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.hora)) return "la hora va en formato HH:MM";
    // Una hora sin día no ubica nada, y guardarla sola haría que la pantalla
    // muestre "a las 14:00" de un examen cuya fecha nadie sabe.
    if (e.fecha === undefined) return "una hora sin fecha no ubica el examen";
  }

  return null;
}

/**
 * **No se valida que la fecha sea futura, y es deliberado.**
 *
 * Registrar un examen ya rendido es legítimo —el historial es parte del mapa— y
 * rechazarlo sería inventar una regla que nadie decidió. Lo que sí hace el
 * dominio es no recomendarle Modo Examen: `candidatos_de_modo_examen()` entrega
 * la fecha y la ventana de ADR-048 la descarta sola.
 */
export const NO_SE_VALIDA_QUE_SEA_FUTURA = true;
