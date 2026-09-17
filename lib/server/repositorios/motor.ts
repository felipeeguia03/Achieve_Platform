import "server-only";

import type { ContextoDelAde } from "@/lib/domain/ade";
import type { RepositorioDelMotor } from "../servicios/motor";
import { clienteDeServicio } from "../supabase";

/**
 * Lee el contexto académico y materializa la recomendación. Las dos cosas por
 * función de base: la lectura es un solo viaje, y la escritura tiene que ser
 * atómica (`Action` + `ActionRecommendation` nacen juntas).
 */
export const motorReal: RepositorioDelMotor = {
  async contextoDe(institutionId, courseEnrollmentId) {
    const { data, error } = await clienteDeServicio().rpc("contexto_del_ade", {
      p_institution_id: institutionId,
      p_course_enrollment_id: courseEnrollmentId,
    });
    if (error) throw new Error(`No se pudo leer el contexto: ${error.message}`);
    if (!data) return null;
    // `ahora` lo pone el Service: la base no decide el instante de la decisión.
    return { ...(data as Omit<ContextoDelAde, "ahora">), ahora: "" } as ContextoDelAde;
  },

  async materializar(institutionId, courseEnrollmentId, rec) {
    const { data, error } = await clienteDeServicio().rpc("materializar_recomendacion", {
      p_institution_id: institutionId,
      p_course_enrollment_id: courseEnrollmentId,
      p_topic_id: rec.topicId,
      p_objective: rec.objetivo,
      p_verb: rec.verbo,
      p_scope: rec.alcance,
      p_minutes_min: rec.minutosMin,
      p_minutes_max: rec.minutosMax,
      p_resource_id: rec.recursoId,
      p_expected_evidence: rec.evidenciaEsperada,
      p_completion_criterion: rec.criterioDeCierre,
      p_reason: rec.razon,
      p_priority: rec.prioridad,
    });
    if (error) throw new Error(`No se pudo materializar: ${error.message}`);
    const filas = (data ?? []) as Record<string, unknown>[];
    return filas.length > 0 ? { actionId: filas[0].action_id as string } : null;
  },
};
