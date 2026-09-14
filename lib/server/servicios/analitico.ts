import {
  ESTADOS_DE_RESULTADO,
  interpretarEstado,
  interpretarFecha,
  interpretarNota,
  validarArchivo,
  vincular,
  type EstadoDeResultado,
  type ExtractorDeAnalitico,
  type MotivoDeArchivoInvalido,
  type RecorridoLeido,
  type TipoDeArchivo,
} from "@/lib/domain/analitico";
import type { PublicadorDeEventos } from "./eventos";

/**
 * Service del analítico — [ADR-106](../../../docs/decisions.md#adr-106).
 *
 * **No conoce la persistencia ni el storage**: los recibe por inyección
 * (`architecture.md` §3.2). Tampoco sabe calcular un hash: se lo pasan, para que
 * el dominio siga puro y el test no necesite `node:crypto`.
 *
 * ## El orden de subir, y por qué
 *
 * 1. Validar **por bytes**. Un archivo inválido no se guarda ni se registra.
 * 2. Exigir consentimiento vigente.
 * 3. Extraer. Si falla, **se registra el fallo sin guardar el archivo**: retener
 *    lo que no se pudo leer es retener un dato personal sin finalidad.
 * 4. Guardar el objeto, y **después** la fila. Si la fila falla, se borra el
 *    objeto: no queda un archivo huérfano.
 *
 * ⚠️ **Nada de acá crea una cursada** (ADR-106 §2).
 */

/** La versión de la política que el estudiante acepta. Provisional: ADR-006 abierto. */
export const VERSION_DE_POLITICA_DEL_ANALITICO = "analitico-v1-sintetica";

export interface RepositorioDelAnalitico {
  recorrido(institutionId: string, studentId: string): Promise<RecorridoLeido>;
  registrarConsentimiento(i: string, s: string, decision: "GRANTED" | "WITHDRAWN", version: string): Promise<void>;
  subirArchivo(clave: string, bytes: Uint8Array, tipo: TipoDeArchivo): Promise<void>;
  borrarArchivos(claves: readonly string[]): Promise<void>;
  registrar(
    i: string,
    s: string,
    documento: Record<string, unknown>,
    filas: readonly Record<string, unknown>[],
  ): Promise<{ documentoId: string; repetido: boolean }>;
  revisar(
    i: string,
    s: string,
    resultadoId: string,
    decision: DecisionDeRevision,
    requisitoId: string | null,
    estado: EstadoDeResultado | null,
  ): Promise<void>;
  confirmar(i: string, s: string, documentoId: string): Promise<boolean>;
  clavesDeDocumentos(i: string, s: string): Promise<string[]>;
  borrarDocumentos(i: string, s: string): Promise<number>;
}

export interface DependenciasDelAnalitico {
  repo: RepositorioDelAnalitico;
  extractor: ExtractorDeAnalitico;
  eventos: PublicadorDeEventos;
  sha256: (bytes: Uint8Array) => string;
}

export type DecisionDeRevision = "CONFIRMED" | "CORRECTED" | "UNSURE" | "NOT_IN_PLAN";

export type ResultadoDeSubida =
  | { estado: "PROCESADO"; documentoId: string; repetido: boolean }
  | { estado: "FALLIDO"; documentoId: string; motivo: string }
  | { estado: "ARCHIVO_INVALIDO"; motivo: MotivoDeArchivoInvalido }
  | { estado: "SIN_CONSENTIMIENTO" }
  | { estado: "SIN_PLAN" };

export async function decidirConsentimiento(
  deps: Pick<DependenciasDelAnalitico, "repo">,
  institutionId: string,
  studentId: string,
  decision: "GRANTED" | "WITHDRAWN",
): Promise<void> {
  await deps.repo.registrarConsentimiento(institutionId, studentId, decision, VERSION_DE_POLITICA_DEL_ANALITICO);
}

export async function subirAnalitico(
  deps: DependenciasDelAnalitico,
  institutionId: string,
  studentId: string,
  bytes: Uint8Array,
): Promise<ResultadoDeSubida> {
  const archivo = validarArchivo(bytes);
  if (archivo.estado === "INVALIDO") return { estado: "ARCHIVO_INVALIDO", motivo: archivo.motivo };

  const recorrido = await deps.repo.recorrido(institutionId, studentId);
  if (recorrido.consentimiento?.decision !== "GRANTED") return { estado: "SIN_CONSENTIMIENTO" };
  // Sin plan no hay contra qué vincular, y vincular contra «cualquiera» mezclaría planes.
  if (recorrido.requisitos.length === 0) return { estado: "SIN_PLAN" };

  const sha = deps.sha256(bytes);
  const extraccion = await deps.extractor.extraer(bytes, archivo.tipo);

  const documento = {
    sha256: sha,
    tipo: archivo.tipo,
    bytes: bytes.length,
    paginas: archivo.paginas,
    extractor: deps.extractor.version,
  };

  if (extraccion.estado === "FALLO") {
    const r = await deps.repo.registrar(institutionId, studentId, { ...documento, estado: "FAILED", motivo: extraccion.motivo, clave: "" }, []);
    await deps.eventos.publicar({
      nombre: "AcademicRecordUploaded",
      institutionId,
      actorId: null,
      sujetoTipo: "academic_document",
      sujetoId: r.documentoId,
      causa: `recorrido:${studentId}`,
      payload: { resultado: "FAILED", motivo: extraccion.motivo },
    });
    return { estado: "FALLIDO", documentoId: r.documentoId, motivo: extraccion.motivo };
  }

  const filas = extraccion.filas.map((f, i) => {
    const v = vincular(f, recorrido.requisitos);
    return {
      ordinal: i + 1,
      crudo: f,
      estado: interpretarEstado(f.estado),
      nota: interpretarNota(f.nota),
      fecha: interpretarFecha(f.fecha),
      requisitoId: v.requisitoId,
      regla: v.regla,
      confianza: v.confianza,
      revision: v.revision,
    };
  });

  const clave = `${institutionId}/${studentId}/${sha}`;
  await deps.repo.subirArchivo(clave, bytes, archivo.tipo);
  let registrado: { documentoId: string; repetido: boolean };
  try {
    registrado = await deps.repo.registrar(institutionId, studentId, { ...documento, estado: "PROCESSED", motivo: "", clave }, filas);
  } catch (e) {
    await deps.repo.borrarArchivos([clave]).catch(() => undefined);
    throw e;
  }

  if (!registrado.repetido) {
    await deps.eventos.publicar({
      nombre: "AcademicRecordUploaded",
      institutionId,
      actorId: null,
      sujetoTipo: "academic_document",
      sujetoId: registrado.documentoId,
      causa: `recorrido:${studentId}`,
      // Conteos, nunca contenido: ni nombres de materias ni notas (ADR-106 §4).
      payload: {
        resultado: "PROCESSED",
        resultados: filas.length,
        aRevisar: filas.filter((f) => f.revision === "NEEDS_REVIEW").length,
      },
    });
  }
  return { estado: "PROCESADO", documentoId: registrado.documentoId, repetido: registrado.repetido };
}

export type ResultadoDeRevision = { estado: "OK" } | { estado: "DATOS_INVALIDOS"; motivo: string };

/** Valida la forma de una revisión. `null` ⇒ válida. */
export function motivoDeRevisionInvalida(
  decision: string,
  requisitoId: string | null,
  estado: string | null,
): string | null {
  if (!["CONFIRMED", "CORRECTED", "UNSURE", "NOT_IN_PLAN"].includes(decision)) return "decisión desconocida";
  if (estado !== null && !(ESTADOS_DE_RESULTADO as readonly string[]).includes(estado)) return "estado desconocido";
  if (decision === "CORRECTED" && requisitoId === null && estado === null) return "una corrección cambia algo";
  if ((decision === "UNSURE" || decision === "NOT_IN_PLAN") && requisitoId !== null) {
    return "«no estoy seguro» y «no es de mi plan» no llevan materia";
  }
  return null;
}

export async function revisarResultado(
  deps: Pick<DependenciasDelAnalitico, "repo">,
  institutionId: string,
  studentId: string,
  entrada: { resultadoId: string; decision: string; requisitoId: string | null; estado: string | null },
): Promise<ResultadoDeRevision> {
  const motivo = motivoDeRevisionInvalida(entrada.decision, entrada.requisitoId, entrada.estado);
  if (motivo) return { estado: "DATOS_INVALIDOS", motivo };
  await deps.repo.revisar(
    institutionId,
    studentId,
    entrada.resultadoId,
    entrada.decision as DecisionDeRevision,
    entrada.requisitoId,
    entrada.estado as EstadoDeResultado | null,
  );
  return { estado: "OK" };
}

/** Confirmar **no exige resolver todo**: lo pendiente queda pendiente (ADR-106 §8). */
export async function confirmarAnalitico(
  deps: Pick<DependenciasDelAnalitico, "repo" | "eventos">,
  institutionId: string,
  studentId: string,
  documentoId: string,
): Promise<{ estado: "OK" } | { estado: "NO_ENCONTRADO" }> {
  const ok = await deps.repo.confirmar(institutionId, studentId, documentoId);
  if (!ok) return { estado: "NO_ENCONTRADO" };
  await deps.eventos.publicar({
    nombre: "AcademicRecordConfirmed",
    institutionId,
    actorId: null,
    sujetoTipo: "academic_document",
    sujetoId: documentoId,
    causa: `recorrido:${studentId}`,
  });
  return { estado: "OK" };
}

/**
 * *Borrar mi analítico* — ADR-106 §9. **Objeto primero, fila después**
 * (ADR-099): si la fila se borrara primero y el storage fallara, quedaría un
 * archivo que nadie puede encontrar para borrarlo. Y retira el consentimiento:
 * volver a subir vuelve a preguntarlo.
 */
export async function borrarAnalitico(
  deps: Pick<DependenciasDelAnalitico, "repo" | "eventos">,
  institutionId: string,
  studentId: string,
): Promise<{ documentos: number }> {
  const claves = await deps.repo.clavesDeDocumentos(institutionId, studentId);
  await deps.repo.borrarArchivos(claves);
  const documentos = await deps.repo.borrarDocumentos(institutionId, studentId);
  await deps.repo.registrarConsentimiento(institutionId, studentId, "WITHDRAWN", VERSION_DE_POLITICA_DEL_ANALITICO);
  if (documentos > 0) {
    await deps.eventos.publicar({
      nombre: "AcademicRecordDeleted",
      institutionId,
      actorId: null,
      // El sujeto ya no existe: se nombra al estudiante, sin contenido.
      sujetoTipo: "student",
      sujetoId: studentId,
      causa: `recorrido:${studentId}`,
      payload: { documentos },
    });
  }
  return { documentos };
}
