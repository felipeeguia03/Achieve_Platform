import "server-only";

import type {
  ObservacionPersistida,
  ReglaDeRiesgo,
  RepositorioDeReiteracion,
} from "../servicios/reiteracion";
import { clienteDeServicio } from "../supabase";

/**
 * Lecturas de la regla de reiteración — Etapa B6.5.
 *
 * **El orden lo pone el `ORDER BY`, no el código.** El evaluador vuelve a
 * ordenar por las dudas, pero traer la lista desordenada y confiar en que
 * alguien la acomode después es como se cuela un contador que da distinto según
 * de dónde se lo llame.
 */
export const reiteracionReal: RepositorioDeReiteracion = {
  async registrarObservacion(entrada) {
    const { data, error } = await clienteDeServicio().rpc("registrar_observacion_de_error", {
      p_institution_id: entrada.institutionId,
      p_exam_preparation_id: entrada.examPreparationId,
      p_error_type_id: entrada.errorTypeId,
      p_kind: entrada.kind,
      p_corroborated: entrada.corroborated,
      p_evidence_id: entrada.evidenceId ?? null,
      p_topic_id: entrada.topicId ?? null,
      p_after_action_id: entrada.afterActionId ?? null,
      p_note: entrada.note ?? null,
      p_recorded_by: entrada.recordedBy ?? null,
      p_idempotency_key: entrada.claveDeIdempotencia ?? null,
    });
    if (error) throw new Error(error.message);
    const fila = (data as Array<{ observation_id: string; duplicado: boolean }>)[0];
    if (!fila) throw new Error("El registro de la observación no devolvió fila");
    return { id: fila.observation_id, duplicado: fila.duplicado };
  },

  async reglaVigente(canonicalId): Promise<ReglaDeRiesgo | null> {
    const { data, error } = await clienteDeServicio()
      .from("risk_rule")
      .select("id, canonical_id, version, signal_type, threshold_config")
      .eq("canonical_id", canonicalId)
      .eq("is_current", true)
      .maybeSingle();

    if (error) throw new Error(`No se pudo leer la regla ${canonicalId}: ${error.message}`);
    if (!data) return null;
    return {
      id: data.id as string,
      canonicalId: data.canonical_id as string,
      version: data.version as string,
      signalType: data.signal_type as string,
      thresholdConfig: data.threshold_config,
    };
  },

  async observaciones(institutionId, examPreparationId, errorTypeId) {
    const { data, error } = await clienteDeServicio()
      .from("error_observation")
      .select("kind, corroborated, observed_at, after_action_id, error_type_id, error_type(label)")
      .eq("institution_id", institutionId)
      .eq("exam_preparation_id", examPreparationId)
      .eq("error_type_id", errorTypeId)
      .order("observed_at", { ascending: true });

    if (error) throw new Error(`No se pudieron leer las observaciones: ${error.message}`);

    return (data ?? []).map((f): ObservacionPersistida => {
      const tipo = f.error_type as { label?: string } | { label?: string }[] | null;
      const etiqueta = Array.isArray(tipo) ? (tipo[0]?.label ?? "") : (tipo?.label ?? "");
      return {
        kind: f.kind as "error" | "resolucion_limpia",
        corroborated: f.corroborated as boolean,
        observedAt: f.observed_at as string,
        // `after_action_id` presente ⇒ ocurrió tras una correctiva. Es el hecho
        // que alguien declaró, no una deducción por cercanía en el tiempo.
        trasAccionCorrectiva: f.after_action_id !== null,
        errorTypeId: f.error_type_id as string,
        etiqueta,
      };
    });
  },

  async preparacion(institutionId, examPreparationId) {
    const { data, error } = await clienteDeServicio()
      .from("exam_preparation")
      .select("student_id, course_enrollment_id")
      .eq("institution_id", institutionId)
      .eq("id", examPreparationId)
      .maybeSingle();

    if (error) throw new Error(`No se pudo leer la preparación: ${error.message}`);
    if (!data) return null;
    return {
      studentId: data.student_id as string,
      courseEnrollmentId: data.course_enrollment_id as string,
    };
  },
};
