import "server-only";

import type { EvidenceState } from "@/lib/domain/types";
import type {
  EntregaDeEvidencia,
  RepositorioDeEvidencias,
  Evidencia,
  HuellaDeEvidencia,
  RepositorioDeEntrega,
} from "../servicios/evidencia";
import { clienteDeServicio } from "../supabase";

/**
 * Escritura de `evidence`. La lectura vive aparte, en `evidencia-lectura.ts`,
 * porque proyecta por RPC y esto inserta: son dos caminos distintos a la misma
 * tabla y mezclarlos esconde cuál de los dos muta.
 */

/** Los estados en que un compromiso todavía admite una entrega. */
const ENTREGABLES = ["CONFIRMED", "DUE", "STARTED"];

async function huellaDeClave(
  institutionId: string,
  clave: string,
): Promise<HuellaDeEvidencia | null> {
  const { data, error } = await clienteDeServicio()
    .from("evidence")
    .select("id, commitment_id, action:action_id(course_enrollment:course_enrollment_id(student_id))")
    .eq("institution_id", institutionId)
    .eq("idempotency_key", clave)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer evidence por clave: ${error.message}`);
  if (!data) return null;

  const fila = data as Record<string, unknown>;
  const accion = fila.action as { course_enrollment?: { student_id?: string } } | null;
  return {
    evidenciaId: fila.id as string,
    estudianteId: accion?.course_enrollment?.student_id ?? "",
    commitmentId: (fila.commitment_id as string | null) ?? null,
  };
}

/**
 * `INSERT` de la entrega, ya en `SUBMITTED`.
 *
 * **Las tres señales entran en `not_evaluated`**, no en `none`. No son lo
 * mismo: `none` afirma que se miró y no había nada; `not_evaluated` dice que
 * nadie miró todavía, que es la verdad de una entrega recién hecha. *"Sin datos
 * no es cero."*
 *
 * `validation_method` queda `NULL` a propósito: lo escribe quien juzgue, y
 * cuál método se usó es parte del juicio, no de la entrega.
 */
async function crearEntregada(
  institutionId: string,
  datos: EntregaDeEvidencia,
): Promise<{ actionId: string } | null> {
  const { data: compromiso, error: errCom } = await clienteDeServicio()
    .from("commitment")
    .select("id, action_id, state, action:action_id(course_enrollment:course_enrollment_id(student_id))")
    .eq("institution_id", institutionId)
    .eq("id", datos.commitmentId)
    .maybeSingle();
  if (errCom) throw new Error(`No se pudo leer commitment: ${errCom.message}`);

  const fila = compromiso as Record<string, unknown> | null;
  const duenio = (fila?.action as { course_enrollment?: { student_id?: string } } | null)
    ?.course_enrollment?.student_id;
  if (!fila || duenio !== datos.estudianteId || !ENTREGABLES.includes(fila.state as string)) {
    return null;
  }

  const { error } = await clienteDeServicio().from("evidence").insert({
    id: datos.evidenciaId,
    institution_id: institutionId,
    action_id: fila.action_id as string,
    commitment_id: datos.commitmentId,
    lifecycle_state: "SUBMITTED",
    submission_channel: "WEB",
    uploaded_by: datos.estudianteId,
    submitted_at: new Date().toISOString(),
    signal_execution: "not_evaluated",
    signal_production: "not_evaluated",
    signal_domain: "not_evaluated",
    idempotency_key: datos.claveDeIdempotencia,
  });
  if (error) throw new Error(`No se pudo registrar la entrega: ${error.message}`);

  return { actionId: fila.action_id as string };
}

export const entregaReal: RepositorioDeEntrega = { huellaDeClave, crearEntregada };

// ── Transiciones ─────────────────────────────────────────────────────────────

const COLUMNAS = "id, institution_id, action_id, lifecycle_state, superseded_by_id, review_instance_id";

function aDominio(f: Record<string, unknown>): Evidencia {
  return {
    id: f.id as string,
    institutionId: f.institution_id as string,
    actionId: f.action_id as string,
    state: f.lifecycle_state as EvidenceState,
    supersededById: (f.superseded_by_id as string | null) ?? null,
    reviewInstanceId: (f.review_instance_id as string | null) ?? null,
  };
}

async function porId(institutionId: string, id: string): Promise<Evidencia | null> {
  const { data, error } = await clienteDeServicio()
    .from("evidence")
    .select(COLUMNAS)
    .eq("institution_id", institutionId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer evidence: ${error.message}`);
  return data ? aDominio(data as Record<string, unknown>) : null;
}

/** Compare-and-swap: si otro se adelantó, no pisa nada y devuelve `null`. */
async function cambiarEstadoSi(
  institutionId: string,
  id: string,
  esperado: EvidenceState,
  nuevo: EvidenceState,
  columnas: Readonly<Record<string, unknown>> = {},
): Promise<Evidencia | null> {
  const { data, error } = await clienteDeServicio()
    .from("evidence")
    .update({ lifecycle_state: nuevo, ...columnas })
    .eq("institution_id", institutionId)
    .eq("id", id)
    .eq("lifecycle_state", esperado)
    .select(COLUMNAS)
    .maybeSingle();
  if (error) throw new Error(`No se pudo actualizar evidence: ${error.message}`);
  return data ? aDominio(data as Record<string, unknown>) : null;
}

/** Lo que la validación necesita saber de la evidencia para causar el progreso. */
export async function contextoDeEvidencia(
  institutionId: string,
  id: string,
): Promise<{ actionId: string; courseEnrollmentId: string; topicId: string | null } | null> {
  const { data, error } = await clienteDeServicio()
    .from("evidence")
    .select("action_id, action:action_id(course_enrollment_id, topic_id)")
    .eq("institution_id", institutionId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el contexto de evidence: ${error.message}`);
  if (!data) return null;
  const f = data as Record<string, unknown>;
  const a = f.action as { course_enrollment_id?: string; topic_id?: string | null } | null;
  return {
    actionId: f.action_id as string,
    courseEnrollmentId: a?.course_enrollment_id ?? "",
    topicId: a?.topic_id ?? null,
  };
}

/**
 * `I4` — la resubmission crea una `Evidence` nueva y **preserva la anterior**.
 *
 * Delega en `resubmitir_evidencia`: crear la nueva y enlazarlas son un solo
 * hecho, y partirlo en dos escrituras dejaría, si falla la segunda, una entrega
 * huérfana que nadie sabe de qué es sucesora.
 */
async function resubmitirAtomico(
  institutionId: string,
  anteriorId: string,
  canal: "WEB" | "WHATSAPP",
  claveDeIdempotencia?: string,
): Promise<Evidencia | null> {
  const { data, error } = await clienteDeServicio().rpc("resubmitir_evidencia", {
    p_institution_id: institutionId,
    p_anterior_id: anteriorId,
    p_canal: canal,
    p_idempotency_key: claveDeIdempotencia ?? null,
  });
  if (error) throw new Error(`No se pudo resubmitir: ${error.message}`);
  const filas = (data ?? []) as Record<string, unknown>[];
  return filas.length > 0 ? aDominio(filas[0]) : null;
}

export const evidenciasReal: RepositorioDeEvidencias = {
  porId,
  cambiarEstadoSi,
  resubmitirAtomico,
};
