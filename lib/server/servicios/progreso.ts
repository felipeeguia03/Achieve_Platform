import type { PublicadorDeEventos } from "./eventos";

/**
 * Service de `ProgressEntry` — Etapa B3.1.
 *
 * ## Lo que este Service NO hace, y es lo más importante
 *
 * **No decide que hubo progreso.** `C01-018` —quién emite el `ProgressUpdated`,
 * con qué causalidad y qué payload— sigue `OPEN` con gate `I`. Acá se recibe un
 * resultado que el owner del progreso **ya produjo**, se lo valida y se lo
 * persiste. Es el mismo criterio con el que la Etapa B2.4 trató la `Reflection`:
 * la regla se hace cumplir, la decisión no se inventa.
 *
 * **Y no existe ningún camino desde `Evidence`.** Validar una evidencia no
 * escribe progreso, y no hay función acá que lo permita. Es el invariante
 * central del producto —*enviar no es suficiencia, suficiencia no es validación,
 * validación no es dominio*— y el más barato de romper, porque el dato está a
 * mano: la Evidence ya dice `VALIDATED` y la tentación es derivar. Hay un guard
 * estático que lo impide, no una convención.
 *
 * ## Lo que sí hace
 *
 * Hacer cumplir cuatro cosas que, si no se verifican acá, terminan siendo una
 * pantalla que le miente a un estudiante sobre lo que aprendió:
 *
 * 1. **`I10`** — una entrada que no declara dimensiones cambiadas y tampoco
 *    afirma que no hubo cambio **no dice nada**, y la pantalla la leería como un
 *    no-cambio que nadie declaró.
 * 2. **No se contradice** — "cambiaron estas dimensiones" y "no cambió nada" a
 *    la vez es una fila que la UI no puede proyectar sin elegir por su cuenta.
 * 3. **El vocabulario de dimensiones es cerrado** — son las cinco de `product.md`
 *    §6, las mismas columnas que `topic_progress` ya tiene.
 * 4. **Todo resultado cuelga de una causa** — una cursada, y la unidad cuando la
 *    hay. Un progreso sin de qué materia es un dato que nadie puede leer.
 */

/** Las cinco. El nombre es el de la columna en `topic_progress`. */
export const DIMENSIONES = ["exposure", "practice", "domain", "confidence", "recency"] as const;
export type Dimension = (typeof DIMENSIONES)[number];

/**
 * Lo que el owner declara para una dimensión que cambió.
 *
 * `valor` es la magnitud interna; `texto` es **lo que el owner escribió para
 * mostrar**, si escribió algo. El Service no formatea ni infiere unidades: qué
 * es mostrable es `C01-019`, y la proyección ya resuelve que un número sin texto
 * se muestra como *"cambió"*.
 */
export interface CambioDeDimension {
  dimension: Dimension;
  valor?: number;
  texto?: string;
  textoAnterior?: string;
}

export interface ResultadoDeProgresoEntrante {
  institutionId: string;
  courseEnrollmentId: string;
  topicId?: string | null;
  /** De dónde sale el resultado. Trazabilidad, no causalidad inferida. */
  actionId?: string | null;
  evidenceId?: string | null;
  /** La Evidence que el owner señala como causa, **si la señala él**. */
  causalEvidenceId?: string | null;
  /** Vocabulario abierto: `C01-018`. Se guarda tal cual, no se interpreta. */
  tipo: string;
  cambios: readonly CambioDeDimension[];
  /** El owner declara que ninguna dimensión cambió. No es lo mismo que no saber. */
  noCambioExplicito?: boolean;
  razonDeNoCambio?: string | null;
  /** `I8`: el mismo registro dos veces produce una sola entrada. */
  idempotencyKey?: string | null;
  /** Quién lo registró. `null` ⇒ lo produjo un proceso, no una persona. */
  actorId?: string | null;
}

export type ResultadoDelRegistro =
  | { estado: "OK"; entryId: string; duplicado: boolean }
  /** `I10`: no declara cambios ni afirma un no-cambio. No dice nada. */
  | { estado: "NO_AFIRMA_NADA" }
  /** Declara cambios **y** un no-cambio. La UI no puede proyectar las dos. */
  | { estado: "SE_CONTRADICE" }
  | { estado: "DIMENSION_DESCONOCIDA"; dimension: string }
  /** Una razón de no-cambio sin no-cambio declarado explica algo que no pasó. */
  | { estado: "RAZON_SIN_NO_CAMBIO" }
  | { estado: "SIN_CURSADA" };

export interface RepositorioDeProgreso {
  registrar(entrada: ResultadoDeProgresoEntrante): Promise<{ entryId: string; duplicado: boolean }>;
}

/**
 * Valida el resultado sin tocar nada. Expuesto aparte porque las mismas reglas
 * las hace cumplir la base con `CHECK`s: acá el error es entendible, allá es la
 * última línea de defensa.
 */
export function validar(entrada: ResultadoDeProgresoEntrante): ResultadoDelRegistro | null {
  if (!entrada.courseEnrollmentId) return { estado: "SIN_CURSADA" };

  for (const c of entrada.cambios) {
    if (!DIMENSIONES.includes(c.dimension)) {
      return { estado: "DIMENSION_DESCONOCIDA", dimension: c.dimension };
    }
  }

  const hayCambios = entrada.cambios.length > 0;
  const noCambio = entrada.noCambioExplicito === true;

  if (hayCambios && noCambio) return { estado: "SE_CONTRADICE" };
  if (!hayCambios && !noCambio) return { estado: "NO_AFIRMA_NADA" };
  if (entrada.razonDeNoCambio && !noCambio) return { estado: "RAZON_SIN_NO_CAMBIO" };

  return null;
}

/**
 * El nombre del hecho.
 *
 * **Son dos, y el segundo no está en el spec.** `ProgressUpdated` es el evento
 * aprobado y se emite cuando hay dimensiones cambiadas. Un no-cambio declarado
 * emite `ProgressNoChangeConfirmed`: llamar *"Updated"* a un hecho que dice que
 * nada cambió es la clase exacta de confusión que este producto evita. Queda
 * rotulado como vocabulario del Product Event Model —objetivo de la Fase B3—,
 * no como regla de negocio.
 */
export function nombreDelEvento(entrada: ResultadoDeProgresoEntrante): string {
  return entrada.cambios.length > 0 ? "ProgressUpdated" : "ProgressNoChangeConfirmed";
}

export async function registrarProgreso(
  deps: { repo: RepositorioDeProgreso; eventos: PublicadorDeEventos },
  entrada: ResultadoDeProgresoEntrante,
): Promise<ResultadoDelRegistro> {
  const invalida = validar(entrada);
  if (invalida) return invalida;

  const { entryId, duplicado } = await deps.repo.registrar(entrada);

  // Después de que la escritura ganó, nunca antes. Y si fue un duplicado
  // idempotente **no se publica de nuevo**: el hecho ya ocurrió una vez, y
  // dos eventos harían que la Bitácora muestre dos avances donde hubo uno.
  if (!duplicado) {
    await deps.eventos.publicar({
      nombre: nombreDelEvento(entrada),
      institutionId: entrada.institutionId,
      actorId: entrada.actorId ?? null,
      sujetoTipo: "progress_entry",
      sujetoId: entryId,
      causa: entrada.tipo,
    });
  }

  return { estado: "OK", entryId, duplicado };
}
