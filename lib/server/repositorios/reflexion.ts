import "server-only";

import type { ReflexionEntregada, RequisitoDeReflexion } from "../servicios/reflexion";
import { clienteDeServicio } from "../supabase";

/**
 * La `Reflection`, por fin escrita — Etapa B6.10.
 *
 * La tabla existe desde la Fase B1 y **nadie la escribía**: el servicio que
 * decide si una reflexión es válida estaba probado y sin llamador, así que el
 * estudiante no tenía por dónde reflexionar y el requisito que
 * [ADR-026](../../../docs/decisions.md#adr-026) cerró **no lo hacía cumplir
 * nadie**.
 */

/** De quién es la `Action`, para no dejar reflexionar sobre la ajena. */
async function duenioDeAccion(institutionId: string, actionId: string): Promise<string | null> {
  const { data, error } = await clienteDeServicio()
    .from("action")
    .select("id, course_enrollment:course_enrollment_id(student_id)")
    .eq("institution_id", institutionId)
    .eq("id", actionId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer la action: ${error.message}`);

  const fila = data as Record<string, unknown> | null;
  const ce = fila?.course_enrollment as { student_id?: string } | null;
  return ce?.student_id ?? null;
}

/**
 * El requisito congelado en la `Action` y si ya hay una reflexión colgada.
 *
 * Las dos cosas en una lectura porque se usan juntas y para lo mismo: decidir
 * si el submit puede pasar. **El requisito sale de la `Action`, no de una
 * preferencia**: ADR-026 lo congela al crearla, y leerlo de otro lado sería
 * reabrir la decisión.
 */
async function requisitoYPresencia(
  institutionId: string,
  actionId: string,
): Promise<{ requisito: RequisitoDeReflexion; hayReflexion: boolean }> {
  const { data, error } = await clienteDeServicio()
    .from("action")
    .select("id, reflection_requirement")
    .eq("institution_id", institutionId)
    .eq("id", actionId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el requisito de reflexión: ${error.message}`);

  const requisito =
    ((data as { reflection_requirement?: string } | null)?.reflection_requirement as RequisitoDeReflexion) ??
    "NO_CONFIGURADA";

  const { data: filas, error: errRef } = await clienteDeServicio()
    .from("reflection")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("action_id", actionId)
    .limit(1);
  if (errRef) throw new Error(`No se pudo leer la reflexión: ${errRef.message}`);

  return { requisito, hayReflexion: (filas ?? []).length > 0 };
}

/** `INSERT` de la reflexión. Los campos ausentes quedan `NULL`, no en cero. */
async function crear(institutionId: string, datos: ReflexionEntregada): Promise<{ id: string }> {
  const { data, error } = await clienteDeServicio()
    .from("reflection")
    .insert({
      institution_id: institutionId,
      action_id: datos.actionId ?? null,
      evidence_id: datos.evidenceId ?? null,
      protocol_step_id: datos.protocolStepId ?? null,
      // **Ausente no es cero.** Un `0` en `actual_minutes` afirma que no tardó
      // nada; `NULL` dice que no lo declaró, que es lo que pasó.
      actual_minutes: datos.actualMinutes ?? null,
      difficulty: datos.difficulty ?? null,
      note: datos.note?.trim() || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo registrar la reflexión: ${error.message}`);

  return { id: (data as { id: string }).id };
}

export const reflexionesReal = { crear, duenioDeAccion, requisitoYPresencia };
