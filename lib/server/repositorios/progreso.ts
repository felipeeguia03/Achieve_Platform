import "server-only";

import type { RepositorioDeProgreso } from "../servicios/progreso";
import { clienteDeServicio } from "../supabase";

/**
 * Escritura del resultado de progreso — Etapa B3.1.
 *
 * Por función de base y no por varios `insert`: `progress_entry`,
 * `topic_progress` y sus valores se escriben **en una transacción**. Media
 * escritura deja la Bitácora afirmando un cambio que las dimensiones no
 * reflejan.
 */
export const progresoEscrituraReal: RepositorioDeProgreso = {
  async registrar(entrada) {
    const { data, error } = await clienteDeServicio().rpc("registrar_progreso", {
      p_institution_id: entrada.institutionId,
      p_course_enrollment_id: entrada.courseEnrollmentId,
      p_topic_id: entrada.topicId ?? null,
      p_action_id: entrada.actionId ?? null,
      p_evidence_id: entrada.evidenceId ?? null,
      p_causal_evidence_id: entrada.causalEvidenceId ?? null,
      p_entry_kind: entrada.tipo,
      p_occurred_at: new Date().toISOString(),
      p_cambios: entrada.cambios,
      p_no_change: entrada.noCambioExplicito ?? false,
      p_no_change_reason: entrada.razonDeNoCambio ?? null,
      p_idempotency_key: entrada.idempotencyKey ?? null,
    });
    if (error) throw new Error(`No se pudo registrar el progreso: ${error.message}`);

    const fila = (data as Array<{ entry_id: string; duplicado: boolean }>)[0];
    if (!fila) throw new Error("El registro de progreso no devolvió entrada");
    return { entryId: fila.entry_id, duplicado: fila.duplicado };
  },
};
