import "server-only";

import type { EstadoDeRespuesta, HipotesisDerivada } from "@/lib/domain/preguntas-de-recorrido";
import { clienteDeServicio } from "../supabase";

/**
 * El perfil del recorrido contra Postgres — [ADR-107](../../../docs/decisions.md#adr-107).
 *
 * ⚠️ **El texto libre del estudiante no se loguea** ni vuelve en un error.
 */

export interface PerfilLeido {
  respuestas: { id: string; clave: string; estado: EstadoDeRespuesta; opciones: string[]; textoLibre: string | null; en: string }[];
  hipotesis: {
    id: string;
    clave: string;
    dimension: HipotesisDerivada["dimension"];
    enunciado: string;
    evidencia: HipotesisDerivada["evidencia"];
    confianza: "BAJA" | "MEDIA";
    estado: "VIGENTE" | "RECHAZADA";
  }[];
  requisitosCursados: string[];
}

async function perfil(institutionId: string, studentId: string): Promise<PerfilLeido> {
  const { data, error } = await clienteDeServicio().rpc("perfil_del_estudiante", {
    p_institution_id: institutionId,
    p_student_id: studentId,
  });
  if (error) throw new Error(`No se pudo leer el perfil: ${error.message}`);
  return data as PerfilLeido;
}

async function responder(
  institutionId: string,
  studentId: string,
  respuesta: Record<string, unknown>,
  hipotesis: readonly Record<string, unknown>[],
): Promise<string> {
  const { data, error } = await clienteDeServicio().rpc("responder_pregunta", {
    p_institution_id: institutionId,
    p_student_id: studentId,
    p_respuesta: respuesta,
    p_hipotesis: hipotesis,
  });
  if (error) throw new Error(`No se pudo guardar la respuesta: ${error.message}`);
  return data as string;
}

async function rechazar(institutionId: string, studentId: string, hipotesisId: string): Promise<boolean> {
  const { data, error } = await clienteDeServicio().rpc("rechazar_hipotesis", {
    p_institution_id: institutionId,
    p_student_id: studentId,
    p_hypothesis_id: hipotesisId,
  });
  if (error) throw new Error(`No se pudo registrar el rechazo: ${error.message}`);
  return data === true;
}

/** Borrar el analítico se lleva lo que salió de él (ADR-106 §9). */
async function borrar(institutionId: string, studentId: string): Promise<void> {
  const db = clienteDeServicio();
  const h = await db.from("profile_hypothesis").delete().eq("institution_id", institutionId).eq("student_id", studentId);
  if (h.error) throw new Error(`No se pudieron borrar las hipótesis: ${h.error.message}`);
  const a = await db.from("profile_answer").delete().eq("institution_id", institutionId).eq("student_id", studentId);
  if (a.error) throw new Error(`No se pudieron borrar las respuestas: ${a.error.message}`);
}

export const perfilReal = { perfil, responder, rechazar, borrar };
