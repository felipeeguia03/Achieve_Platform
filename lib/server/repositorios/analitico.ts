import "server-only";

import type { EstadoDeResultado, RecorridoLeido, TipoDeArchivo } from "@/lib/domain/analitico";

export type { RecorridoLeido, ResultadoLeido } from "@/lib/domain/analitico";
import { clienteDeServicio } from "../supabase";

/**
 * El analítico contra Postgres y Storage — [ADR-106](../../../docs/decisions.md#adr-106).
 *
 * ⚠️ **El contenido del archivo nunca se loguea.** Los errores de acá dicen qué
 * operación falló, jamás qué había adentro.
 */

export const BUCKET_ANALITICOS = "analiticos";

export class AnaliticoRechazado extends Error {
  constructor(public readonly motivo: "SIN_CONSENTIMIENTO" | "REQUISITO_DE_OTRO_PLAN" | "RESULTADO_AJENO") {
    super(motivo);
  }
}

function rechazoDe(mensaje: string): AnaliticoRechazado | null {
  for (const m of ["SIN_CONSENTIMIENTO", "REQUISITO_DE_OTRO_PLAN", "RESULTADO_AJENO"] as const) {
    if (mensaje.includes(m)) return new AnaliticoRechazado(m);
  }
  return null;
}

async function recorrido(institutionId: string, studentId: string): Promise<RecorridoLeido> {
  const { data, error } = await clienteDeServicio().rpc("recorrido_del_estudiante", {
    p_institution_id: institutionId,
    p_student_id: studentId,
  });
  if (error) throw new Error(`No se pudo leer el recorrido: ${error.message}`);
  return data as RecorridoLeido;
}

async function registrarConsentimiento(
  institutionId: string,
  studentId: string,
  decision: "GRANTED" | "WITHDRAWN",
  version: string,
): Promise<void> {
  const { error } = await clienteDeServicio()
    .from("academic_record_consent")
    .insert({ institution_id: institutionId, student_id: studentId, decision, policy_version: version });
  if (error) throw new Error(`No se pudo registrar el consentimiento: ${error.message}`);
}

async function subirArchivo(clave: string, bytes: Uint8Array, tipo: TipoDeArchivo): Promise<void> {
  const { error } = await clienteDeServicio()
    .storage.from(BUCKET_ANALITICOS)
    .upload(clave, bytes, { contentType: tipo, upsert: false });
  // Un objeto que ya existe con esa clave es el mismo archivo (la clave es su hash).
  if (error && !/exists|Duplicate/i.test(error.message)) throw new Error(`No se pudo guardar el archivo: ${error.message}`);
}

async function borrarArchivos(claves: readonly string[]): Promise<void> {
  if (claves.length === 0) return;
  const { error } = await clienteDeServicio().storage.from(BUCKET_ANALITICOS).remove([...claves]);
  if (error) throw new Error(`No se pudo borrar el archivo: ${error.message}`);
}

async function registrar(
  institutionId: string,
  studentId: string,
  documento: Record<string, unknown>,
  filas: readonly Record<string, unknown>[],
): Promise<{ documentoId: string; repetido: boolean }> {
  const { data, error } = await clienteDeServicio().rpc("registrar_analitico", {
    p_institution_id: institutionId,
    p_student_id: studentId,
    p_documento: documento,
    p_filas: filas,
  });
  if (error) {
    throw rechazoDe(error.message) ?? new Error(`No se pudo registrar el analítico: ${error.message}`);
  }
  return data as { documentoId: string; repetido: boolean };
}

async function revisar(
  institutionId: string,
  studentId: string,
  resultadoId: string,
  decision: "CONFIRMED" | "CORRECTED" | "UNSURE" | "NOT_IN_PLAN",
  requisitoId: string | null,
  estado: EstadoDeResultado | null,
): Promise<void> {
  const { error } = await clienteDeServicio().rpc("revisar_resultado", {
    p_institution_id: institutionId,
    p_student_id: studentId,
    p_entry_id: resultadoId,
    p_decision: decision,
    p_requisito_id: requisitoId,
    p_estado: estado,
  });
  if (error) throw rechazoDe(error.message) ?? new Error(`No se pudo revisar el resultado: ${error.message}`);
}

async function confirmar(institutionId: string, studentId: string, documentoId: string): Promise<boolean> {
  const { data, error } = await clienteDeServicio()
    .from("academic_document")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("institution_id", institutionId)
    .eq("student_id", studentId)
    .eq("id", documentoId)
    .eq("status", "PROCESSED")
    .is("confirmed_at", null)
    .select("id");
  if (error) throw new Error(`No se pudo confirmar el analítico: ${error.message}`);
  return (data ?? []).length > 0;
}

/** Las claves de storage de todos sus documentos, para borrar el objeto **antes** que la fila. */
async function clavesDeDocumentos(institutionId: string, studentId: string): Promise<string[]> {
  const { data, error } = await clienteDeServicio()
    .from("academic_document")
    .select("storage_key")
    .eq("institution_id", institutionId)
    .eq("student_id", studentId);
  if (error) throw new Error(`No se pudieron leer los documentos: ${error.message}`);
  return ((data ?? []) as { storage_key: string | null }[]).flatMap((d) => (d.storage_key ? [d.storage_key] : []));
}

async function borrarDocumentos(institutionId: string, studentId: string): Promise<number> {
  const { data, error } = await clienteDeServicio()
    .from("academic_document")
    .delete()
    .eq("institution_id", institutionId)
    .eq("student_id", studentId)
    .select("id");
  if (error) throw new Error(`No se pudieron borrar los documentos: ${error.message}`);
  return (data ?? []).length;
}

export const analiticoReal = {
  recorrido,
  registrarConsentimiento,
  subirArchivo,
  borrarArchivos,
  registrar,
  revisar,
  confirmar,
  clavesDeDocumentos,
  borrarDocumentos,
};
