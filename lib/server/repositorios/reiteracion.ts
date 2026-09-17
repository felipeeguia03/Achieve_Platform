import "server-only";

import type {
  CalidadDeEvidencia,
  ConfianzaDeClasificacion,
} from "@/lib/domain/reiteracion";
import type {
  FamiliaDeError,
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
    const { data, error } = await clienteDeServicio().rpc("registrar_observacion_b6_7_3", {
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
      p_secondary_error_type_id: entrada.secondaryErrorTypeId ?? null,
      p_learning_objective_id: entrada.learningObjectiveId ?? null,
      p_evidence_quality: entrada.evidenceQuality ?? null,
      p_error_identifiable: entrada.errorIdentifiable ?? null,
      p_classification_confidence: entrada.classificationConfidence ?? null,
      p_task_format: entrada.taskFormat ?? null,
      p_support_offered: entrada.supportOffered ?? null,
      p_correction_delivered: entrada.correctionDelivered ?? null,
      p_correction_accessible: entrada.correctionAccessible ?? null,
      p_learner_engaged: entrada.learnerEngaged ?? null,
      p_new_independent_attempt: entrada.newIndependentAttempt ?? null,
      p_same_error_confidence: entrada.sameErrorConfidence ?? null,
      p_attempt_identity: entrada.attemptIdentity ?? null,
      p_equivalent_not_identical: entrada.equivalentNotIdentical ?? null,
      p_spaced_or_no_immediate_model: entrada.spacedOrNoImmediateModel ?? null,
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

  /**
   * A qué familia pertenece una fila del catálogo. **Sirve para cualquier
   * versión**, incluidas las apagadas: la fila vieja de una observación
   * histórica sigue diciendo de qué familia era.
   */
  async familiaDelTipo(errorTypeId) {
    const { data, error } = await clienteDeServicio()
      .from("error_type")
      .select("canonical_id")
      .eq("id", errorTypeId)
      .maybeSingle();

    if (error) throw new Error(`No se pudo leer el tipo de error: ${error.message}`);
    return data ? (data.canonical_id as string) : null;
  },

  /**
   * La familia según el vocabulario **vigente**.
   *
   * `null` ⇒ ninguna versión vigente la declara. Es lo que le pasa a
   * 'dependencia de ayuda externa' después de la B6.7.1: la fila del Product
   * Owner sigue ahí, apagada e intacta, y no hay v2.0 que la reemplace.
   */
  async familiaVigente(canonicalId): Promise<FamiliaDeError | null> {
    const { data, error } = await clienteDeServicio()
      .from("error_type")
      .select("canonical_id, label, es_familia")
      .eq("canonical_id", canonicalId)
      .eq("is_current", true)
      .maybeSingle();

    if (error) throw new Error(`No se pudo leer la familia ${canonicalId}: ${error.message}`);
    if (!data) return null;
    return {
      canonicalId: data.canonical_id as string,
      label: data.label as string,
      esFamilia: data.es_familia as boolean,
    };
  },

  /**
   * Las observaciones de una **familia**, cruzando versiones del vocabulario.
   *
   * El filtro es por `canonical_id` y no por `error_type_id` a propósito: si no,
   * cargar una versión nueva partiría el contador en dos sin que nadie se
   * enterara.
   *
   * ⚠️ **El embed nombra la FK, y es obligatorio.** Desde que existe
   * `secondary_error_type_id` hay **dos** relaciones entre `error_observation` y
   * `error_type`, y un embed sin nombre falla —*"more than one relationship was
   * found"*—. Nombrar `error_observation_error_type_id_fkey` es además lo que
   * garantiza que **el contador lee la principal**: por la secundaria no se
   * cuenta, y acá no hay forma de equivocarse en silencio.
   */
  async observaciones(institutionId, examPreparationId, canonicalId) {
    const RELACION_PRINCIPAL = "error_observation_error_type_id_fkey";
    const { data, error } = await clienteDeServicio()
      .from("error_observation")
      .select(
        `kind, corroborated, observed_at, after_action_id, error_type_id, learning_objective_id, evidence_quality, error_identifiable, classification_confidence, correction_delivered, correction_accessible, learner_engaged, new_independent_attempt, same_error_confidence, attempt_identity, equivalent_not_identical, spaced_or_no_immediate_model, error_type!${RELACION_PRINCIPAL}!inner(canonical_id, label)`,
      )
      .eq("institution_id", institutionId)
      .eq("exam_preparation_id", examPreparationId)
      .eq(`error_type.canonical_id`, canonicalId)
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
        // La cuarta dimensión de la unidad de conteo (`9.1`). `null` es un
        // estado legítimo: nadie declaró contra qué comparar.
        objetivoId: (f.learning_objective_id as string | null) ?? null,
        calidad: (f.evidence_quality as CalidadDeEvidencia | null) ?? null,
        errorIdentificable: (f.error_identifiable as boolean | null) ?? null,
        confianza: (f.classification_confidence as ConfianzaDeClasificacion | null) ?? null,
        correccionEntregada: (f.correction_delivered as boolean | null) ?? null,
        correccionAccesible: (f.correction_accessible as boolean | null) ?? null,
        estudianteSeInvolucro: (f.learner_engaged as boolean | null) ?? null,
        nuevoIntentoIndependiente: (f.new_independent_attempt as boolean | null) ?? null,
        confianzaMismoError: (f.same_error_confidence as ConfianzaDeClasificacion | null) ?? null,
        identidadIntento: (f.attempt_identity as string | null) ?? null,
        tareaEquivalenteNoIdentica: (f.equivalent_not_identical as boolean | null) ?? null,
        espaciadaOSinModeloInmediato:
          (f.spaced_or_no_immediate_model as boolean | null) ?? null,
      };
    });
  },

  /** La corrección y la reclasificación, **en una sola transacción**. */
  async corregirClasificacion(entrada) {
    const { data, error } = await clienteDeServicio().rpc("corregir_clasificacion_de_error", {
      p_institution_id: entrada.institutionId,
      p_observation_id: entrada.observacionId,
      p_to_error_type_id: entrada.aTipoDeErrorId,
      p_reason: entrada.motivo,
      p_to_secondary_type_id: entrada.aSecundariaId ?? null,
      p_corrected_by: entrada.corregidoPor ?? null,
    });
    if (error) throw new Error(error.message);
    const fila = (
      data as Array<{
        correction_id: string;
        from_canonical_id: string;
        to_canonical_id: string;
        exam_preparation_id: string;
        learning_objective_id: string | null;
      }>
    )[0];
    if (!fila) throw new Error("La corrección no devolvió fila");
    return {
      correccionId: fila.correction_id,
      desdeCanonicalId: fila.from_canonical_id,
      aCanonicalId: fila.to_canonical_id,
      examPreparationId: fila.exam_preparation_id,
      learningObjectiveId: fila.learning_objective_id ?? null,
    };
  },

  /**
   * La condición de desempeño. **Otra tabla, y a propósito**: la decisión de la
   * psicopedagoga es que no es un error, y guardarla en `error_observation`
   * contradiría esa decisión justo donde más se lee, que es el modelo de datos.
   */
  async registrarNecesidadDeApoyo(entrada) {
    const { data, error } = await clienteDeServicio().rpc("registrar_necesidad_de_apoyo", {
      p_institution_id: entrada.institutionId,
      p_exam_preparation_id: entrada.examPreparationId,
      p_support_need_type_id: entrada.supportNeedTypeId,
      p_evidence_id: entrada.evidenceId ?? null,
      p_topic_id: entrada.topicId ?? null,
      p_note: entrada.note ?? null,
      p_recorded_by: entrada.recordedBy ?? null,
      p_idempotency_key: entrada.claveDeIdempotencia ?? null,
    });
    if (error) throw new Error(error.message);
    const fila = (data as Array<{ observation_id: string; duplicado: boolean }>)[0];
    if (!fila) throw new Error("El registro de la necesidad de apoyo no devolvió fila");
    return { id: fila.observation_id, duplicado: fila.duplicado };
  },

  async sincronizarEpisodio(entrada) {
    const { data, error } = await clienteDeServicio().rpc(
      "sincronizar_episodio_de_reiteracion",
      {
        p_institution_id: entrada.institutionId,
        p_exam_preparation_id: entrada.examPreparationId,
        p_error_family_canonical_id: entrada.canonicalId,
        p_learning_objective_id: entrada.learningObjectiveId,
        p_hay_actividad: entrada.hayActividad,
        p_recuperada: entrada.recuperada,
      },
    );
    if (error) throw new Error(`No se pudo sincronizar el episodio: ${error.message}`);
    const fila = (
      data as Array<{ episode_id: string; previous_episode_id: string | null; status: string }>
    )[0];
    return fila
      ? {
          id: fila.episode_id,
          previousId: fila.previous_episode_id ?? null,
          status: fila.status as "active" | "recovered",
        }
      : null;
  },

  async contextoParaRevision(institutionId, examPreparationId, canonicalId, learningObjectiveId) {
    let observacionesQuery = clienteDeServicio()
      .from("error_observation")
      .select("id, evidence_id, support_offered, observed_at, error_type!error_observation_error_type_id_fkey!inner(canonical_id)")
      .eq("institution_id", institutionId)
      .eq("exam_preparation_id", examPreparationId)
      .order("observed_at", { ascending: true });
    if (canonicalId) observacionesQuery = observacionesQuery.eq("error_type.canonical_id", canonicalId);
    if (learningObjectiveId !== undefined) {
      observacionesQuery = learningObjectiveId === null
        ? observacionesQuery.is("learning_objective_id", null)
        : observacionesQuery.eq("learning_objective_id", learningObjectiveId);
    }
    const [{ data: observaciones, error: errorObservaciones }, { data: apoyos, error: errorApoyos }] =
      await Promise.all([
        observacionesQuery,
        clienteDeServicio()
          .from("support_need_observation")
          .select("id, evidence_id, note, observed_at")
          .eq("institution_id", institutionId)
          .eq("exam_preparation_id", examPreparationId)
          .order("observed_at", { ascending: true }),
      ]);
    if (errorObservaciones) throw new Error(`No se pudo leer la evidencia del caso: ${errorObservaciones.message}`);
    if (errorApoyos) throw new Error(`No se pudo leer el historial de apoyos: ${errorApoyos.message}`);
    return {
      observaciones: observaciones ?? [],
      historialDeApoyos: apoyos ?? [],
    };
  },

  async registrarDisparadorTemprano(entrada) {
    const { data, error } = await clienteDeServicio().rpc("registrar_disparador_temprano", {
      p_institution_id: entrada.institutionId,
      p_exam_preparation_id: entrada.examPreparationId,
      p_trigger_canonical_id: entrada.triggerCanonicalId,
      p_evidence_id: entrada.evidenceId ?? null,
      p_note: entrada.note ?? null,
      p_recorded_by: entrada.recordedBy ?? null,
      p_idempotency_key: entrada.claveDeIdempotencia ?? null,
    });
    if (error) throw new Error(error.message);
    const fila = (data as Array<{ observation_id: string; duplicado: boolean }>)[0];
    if (!fila) throw new Error("El disparador temprano no devolvió fila");
    return { id: fila.observation_id, duplicado: fila.duplicado };
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
