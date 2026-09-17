-- Achieve Platform · Etapa B6.7.3 — acelerar y reiniciar
--
-- Cierra `9.2`, `9.3` y `9.4` de ADR-037. La fuente literal es
-- `docs/validacion-psicopedagogica-source.md` y manda sobre este comentario.
-- Sólo habilita defaults reversibles para datos sintéticos: ADR-006 sigue
-- bloqueando cualquier dato de una persona real.

-- ── 1 · La corrección válida y el acierto limpio son hechos declarados ──────
ALTER TABLE error_observation
  ADD COLUMN correction_delivered BOOLEAN,
  ADD COLUMN correction_accessible BOOLEAN,
  ADD COLUMN learner_engaged BOOLEAN,
  ADD COLUMN new_independent_attempt BOOLEAN,
  ADD COLUMN same_error_confidence TEXT
    CHECK (same_error_confidence IN ('alta','media','baja')),
  ADD COLUMN attempt_identity TEXT,
  ADD COLUMN equivalent_not_identical BOOLEAN,
  ADD COLUMN spaced_or_no_immediate_model BOOLEAN;

ALTER TABLE error_observation
  ADD CONSTRAINT contexto_correctivo_exige_accion CHECK (
    after_action_id IS NOT NULL OR
    (correction_delivered IS NULL AND correction_accessible IS NULL
      AND learner_engaged IS NULL AND same_error_confidence IS NULL)
  ),
  ADD CONSTRAINT resolucion_limpia_identificada CHECK (
    kind <> 'resolucion_limpia' OR attempt_identity IS NOT NULL
  );

COMMENT ON COLUMN error_observation.correction_delivered IS
  '9.3: una de cinco condiciones conjuntas. after_action_id solo no acelera.';
COMMENT ON COLUMN error_observation.attempt_identity IS
  '9.4: identidad declarada del intento; permite exigir dos aciertos no idénticos sin inferir comparabilidad.';

-- Envuelve al escritor anterior: la llamada y el UPDATE viven en la misma
-- transacción. No se edita una migración aplicada ni se duplica su validación.
CREATE FUNCTION public.registrar_observacion_b6_7_3(
  p_institution_id UUID, p_exam_preparation_id UUID, p_error_type_id UUID,
  p_kind TEXT, p_corroborated BOOLEAN,
  p_evidence_id UUID DEFAULT NULL, p_topic_id UUID DEFAULT NULL,
  p_after_action_id UUID DEFAULT NULL, p_note TEXT DEFAULT NULL,
  p_recorded_by UUID DEFAULT NULL, p_idempotency_key TEXT DEFAULT NULL,
  p_secondary_error_type_id UUID DEFAULT NULL,
  p_learning_objective_id UUID DEFAULT NULL, p_evidence_quality TEXT DEFAULT NULL,
  p_error_identifiable BOOLEAN DEFAULT NULL,
  p_classification_confidence TEXT DEFAULT NULL, p_task_format TEXT DEFAULT NULL,
  p_support_offered TEXT DEFAULT NULL,
  p_correction_delivered BOOLEAN DEFAULT NULL,
  p_correction_accessible BOOLEAN DEFAULT NULL,
  p_learner_engaged BOOLEAN DEFAULT NULL,
  p_new_independent_attempt BOOLEAN DEFAULT NULL,
  p_same_error_confidence TEXT DEFAULT NULL,
  p_attempt_identity TEXT DEFAULT NULL,
  p_equivalent_not_identical BOOLEAN DEFAULT NULL,
  p_spaced_or_no_immediate_model BOOLEAN DEFAULT NULL
)
RETURNS TABLE (observation_id UUID, duplicado BOOLEAN)
LANGUAGE plpgsql AS $$
DECLARE v_id UUID; v_dup BOOLEAN;
BEGIN
  SELECT r.observation_id, r.duplicado INTO v_id, v_dup
    FROM public.registrar_observacion_de_error(
      p_institution_id, p_exam_preparation_id, p_error_type_id, p_kind,
      p_corroborated, p_evidence_id, p_topic_id, p_after_action_id, p_note,
      p_recorded_by, p_idempotency_key, p_secondary_error_type_id,
      p_learning_objective_id, p_evidence_quality, p_error_identifiable,
      p_classification_confidence, p_task_format, p_support_offered
    ) r;

  IF NOT v_dup THEN
    UPDATE error_observation SET
      correction_delivered = p_correction_delivered,
      correction_accessible = p_correction_accessible,
      learner_engaged = p_learner_engaged,
      new_independent_attempt = p_new_independent_attempt,
      same_error_confidence = p_same_error_confidence,
      attempt_identity = p_attempt_identity,
      equivalent_not_identical = p_equivalent_not_identical,
      spaced_or_no_immediate_model = p_spaced_or_no_immediate_model
    WHERE id = v_id;
  END IF;
  RETURN QUERY SELECT v_id, v_dup;
END;
$$;

-- ── 2 · Reiniciar es cerrar un episodio, nunca borrar observaciones ─────────
CREATE TABLE reiteration_episode (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  exam_preparation_id UUID NOT NULL REFERENCES exam_preparation(id) ON DELETE CASCADE,
  error_family_canonical_id TEXT NOT NULL,
  learning_objective_id UUID REFERENCES learning_objective(id) ON DELETE RESTRICT,
  previous_episode_id UUID REFERENCES reiteration_episode(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','recovered')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recovered_at TIMESTAMPTZ,
  CONSTRAINT episodio_recuperado_tiene_fecha
    CHECK (status <> 'recovered' OR recovered_at IS NOT NULL)
);

CREATE UNIQUE INDEX reiteration_episode_uno_activo
  ON reiteration_episode (
    institution_id, exam_preparation_id, error_family_canonical_id,
    COALESCE(learning_objective_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) WHERE status = 'active';
CREATE INDEX reiteration_episode_historia
  ON reiteration_episode (exam_preparation_id, error_family_canonical_id, opened_at);
ALTER TABLE reiteration_episode ENABLE ROW LEVEL SECURITY;

ALTER TABLE risk_signal
  ADD COLUMN reiteration_episode_id UUID REFERENCES reiteration_episode(id) ON DELETE SET NULL,
  ADD COLUMN review_context JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE escalation_sink
  ADD COLUMN review_context JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE FUNCTION public.registrar_senal_b6_7_3(
  p_institution_id UUID, p_student_id UUID, p_course_enrollment_id UUID,
  p_signal_type TEXT, p_severity TEXT, p_reason TEXT, p_source_ref TEXT,
  p_risk_rule_id UUID, p_rule_version TEXT, p_valid_until TIMESTAMPTZ,
  p_idempotency_key TEXT, p_reiteration_episode_id UUID DEFAULT NULL,
  p_review_context JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (signal_id UUID, duplicado BOOLEAN)
LANGUAGE plpgsql AS $$
DECLARE v_id UUID; v_dup BOOLEAN;
BEGIN
  SELECT r.signal_id, r.duplicado INTO v_id, v_dup
    FROM public.registrar_senal(
      p_institution_id, p_student_id, p_course_enrollment_id, p_signal_type,
      p_severity, p_reason, p_source_ref, p_risk_rule_id, p_rule_version,
      p_valid_until, p_idempotency_key
    ) r;
  IF NOT v_dup THEN
    UPDATE risk_signal SET reiteration_episode_id=p_reiteration_episode_id,
      review_context=COALESCE(p_review_context, '{}'::jsonb)
     WHERE id=v_id;
  END IF;
  RETURN QUERY SELECT v_id, v_dup;
END;
$$;

CREATE FUNCTION public.sincronizar_episodio_de_reiteracion(
  p_institution_id UUID, p_exam_preparation_id UUID,
  p_error_family_canonical_id TEXT, p_learning_objective_id UUID,
  p_hay_actividad BOOLEAN, p_recuperada BOOLEAN
)
RETURNS TABLE (episode_id UUID, previous_episode_id UUID, status TEXT)
LANGUAGE plpgsql AS $$
DECLARE v_student UUID; v_actual UUID; v_previo UUID; v_estado TEXT;
BEGIN
  SELECT student_id INTO v_student FROM exam_preparation
   WHERE id = p_exam_preparation_id AND institution_id = p_institution_id;
  IF v_student IS NULL THEN RETURN; END IF;

  SELECT e.id INTO v_actual FROM reiteration_episode e
   WHERE e.institution_id = p_institution_id
     AND e.exam_preparation_id = p_exam_preparation_id
     AND e.error_family_canonical_id = p_error_family_canonical_id
     AND e.learning_objective_id IS NOT DISTINCT FROM p_learning_objective_id
     AND e.status = 'active' FOR UPDATE;

  IF p_recuperada AND v_actual IS NOT NULL THEN
    UPDATE reiteration_episode SET status='recovered', recovered_at=NOW()
     WHERE id=v_actual;
    RETURN QUERY SELECT v_actual,
      (SELECT e.previous_episode_id FROM reiteration_episode e WHERE e.id=v_actual),
      'recovered'::TEXT;
    RETURN;
  END IF;

  IF p_hay_actividad AND v_actual IS NULL THEN
    SELECT e.id INTO v_previo FROM reiteration_episode e
     WHERE e.institution_id=p_institution_id
       AND e.exam_preparation_id=p_exam_preparation_id
       AND e.error_family_canonical_id=p_error_family_canonical_id
       AND e.learning_objective_id IS NOT DISTINCT FROM p_learning_objective_id
       AND e.status='recovered' ORDER BY e.recovered_at DESC LIMIT 1;
    INSERT INTO reiteration_episode (
      institution_id, student_id, exam_preparation_id, error_family_canonical_id,
      learning_objective_id, previous_episode_id
    ) VALUES (
      p_institution_id, v_student, p_exam_preparation_id, p_error_family_canonical_id,
      p_learning_objective_id, v_previo
    ) RETURNING id INTO v_actual;
  END IF;

  IF v_actual IS NOT NULL THEN
    SELECT e.previous_episode_id, e.status INTO v_previo, v_estado
      FROM reiteration_episode e WHERE e.id=v_actual;
    RETURN QUERY SELECT v_actual, v_previo, v_estado;
  END IF;
END;
$$;

-- ── 3 · Los disparadores cualitativos también son hechos ───────────────────
CREATE TABLE early_review_observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  exam_preparation_id UUID NOT NULL REFERENCES exam_preparation(id) ON DELETE CASCADE,
  trigger_canonical_id TEXT NOT NULL,
  evidence_id UUID REFERENCES evidence(id) ON DELETE SET NULL,
  note TEXT,
  recorded_by UUID,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idempotency_key TEXT
);
CREATE UNIQUE INDEX early_review_observation_idempotencia
  ON early_review_observation (institution_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
ALTER TABLE early_review_observation ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.registrar_disparador_temprano(
  p_institution_id UUID, p_exam_preparation_id UUID, p_trigger_canonical_id TEXT,
  p_evidence_id UUID DEFAULT NULL, p_note TEXT DEFAULT NULL,
  p_recorded_by UUID DEFAULT NULL, p_idempotency_key TEXT DEFAULT NULL
)
RETURNS TABLE (observation_id UUID, duplicado BOOLEAN)
LANGUAGE plpgsql AS $$
DECLARE v_student UUID; v_id UUID;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_id FROM early_review_observation
     WHERE institution_id=p_institution_id AND idempotency_key=p_idempotency_key;
    IF FOUND THEN RETURN QUERY SELECT v_id, TRUE; RETURN; END IF;
  END IF;
  SELECT student_id INTO v_student FROM exam_preparation
   WHERE id=p_exam_preparation_id AND institution_id=p_institution_id;
  IF v_student IS NULL THEN RAISE EXCEPTION 'la preparación no pertenece a la institución'; END IF;
  INSERT INTO early_review_observation (
    institution_id, student_id, exam_preparation_id, trigger_canonical_id,
    evidence_id, note, recorded_by, idempotency_key
  ) VALUES (
    p_institution_id, v_student, p_exam_preparation_id, p_trigger_canonical_id,
    p_evidence_id, p_note, p_recorded_by, p_idempotency_key
  ) RETURNING id INTO v_id;
  RETURN QUERY SELECT v_id, FALSE;
END;
$$;

-- ── 4 · La configuración profesional reemplaza, sin borrar ─────────────────
UPDATE risk_rule SET is_current=FALSE
 WHERE canonical_id='HP0-06-1' AND version='v3.0-psicopedagogia';

INSERT INTO risk_rule (
  canonical_id, version, signal_type, label, source_text, threshold_config,
  suggested_severity, modo, is_current, provisional_default_id, provisional_version
)
SELECT canonical_id, 'v4.0-psicopedagogia', signal_type, label, source_text,
  (threshold_config - 'reincidencia_tras_correctiva' - 'pendiente_b6_7_3'
    - 'reinicia_con_resolucion_limpia') || jsonb_build_object(
      'fuente', 'ADR-037 · validacion-psicopedagogica-source.md · 9.1–9.6',
      'accelerate_after_valid_correction', TRUE,
      'valid_correction_requires', jsonb_build_array(
        'correction_delivered','correction_accessible','learner_engaged',
        'new_independent_attempt','same_error_confidence'
      ),
      'same_error_confidence_minima', 'media',
      'reincidencia_tras_correctiva', 'intervencion',
      'reinicia_con_resolucion_limpia', TRUE,
      'clean_successes_to_resolve', 2,
      'clean_successes_distinct_attempts', TRUE,
      'clean_successes_require_spacing_or_no_model', TRUE,
      'early_review_severity', 'intervencion',
      'early_review_triggers', jsonb_build_array(
        jsonb_build_object('canonical_id','bloqueo_manifiesto','label','Bloqueo manifiesto'),
        jsonb_build_object('canonical_id','malestar','label','Malestar'),
        jsonb_build_object('canonical_id','pedido_explicito_de_ayuda','label','Pedido explícito de ayuda'),
        jsonb_build_object('canonical_id','alto_impacto_academico','label','Alto impacto académico'),
        jsonb_build_object('canonical_id','barrera_de_accesibilidad','label','Barrera de accesibilidad'),
        jsonb_build_object('canonical_id','baja_confianza_del_sistema','label','Baja confianza del sistema')
      )
    ),
  suggested_severity, modo, TRUE, provisional_default_id, provisional_version
FROM risk_rule WHERE canonical_id='HP0-06-1' AND version='v3.0-psicopedagogia';

GRANT EXECUTE ON FUNCTION public.registrar_observacion_b6_7_3 TO service_role;
GRANT EXECUTE ON FUNCTION public.registrar_senal_b6_7_3 TO service_role;
GRANT EXECUTE ON FUNCTION public.sincronizar_episodio_de_reiteracion TO service_role;
GRANT EXECUTE ON FUNCTION public.registrar_disparador_temprano TO service_role;
