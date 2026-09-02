-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.7.4 — replanificar y volver
--
-- HUMAN-P0-9.7 v1.0: cambiar la fecha del mismo examen versiona el plan dentro
-- de la misma preparación. Volver es una propuesta explicada y aceptada antes
-- de mover `current_step_id`; nunca borra completions, evidencias ni progreso.
-- ─────────────────────────────────────────────────────────────────────────────

-- `ABANDONED` no distingue inactividad de una decisión. La fuente profesional
-- exige abandono explícito y agrega cancelación y replanificación al lifecycle.
ALTER TABLE exam_preparation DROP CONSTRAINT exam_preparation_status_check;
UPDATE exam_preparation SET status = 'EXPLICITLY_ABANDONED' WHERE status = 'ABANDONED';
ALTER TABLE exam_preparation
  ADD CONSTRAINT exam_preparation_status_check
  CHECK (status IN ('RECOMMENDED','ACTIVE','REPLANNED','BLOCKED',
                    'EXAM_TAKEN','CLOSED','CANCELLED','EXPLICITLY_ABANDONED'));

-- Una versión vive ADENTRO de la preparación: `I7` sigue siendo una preparación
-- por estudiante + evaluación. Los objetos históricos siguen ligados a esa
-- preparación, no a esta tabla, y por eso una versión no puede borrarlos.
CREATE TABLE exam_preparation_plan_version (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  exam_preparation_id UUID NOT NULL REFERENCES exam_preparation(id) ON DELETE CASCADE,
  version_number      INTEGER NOT NULL CHECK (version_number >= 1),
  is_current          BOOLEAN NOT NULL DEFAULT TRUE,
  assessment_date     DATE,
  change_reason       TEXT NOT NULL CHECK (btrim(change_reason) <> ''),
  created_by          UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idempotency_key     TEXT,
  UNIQUE (exam_preparation_id, version_number)
);

CREATE UNIQUE INDEX exam_preparation_plan_version_current
  ON exam_preparation_plan_version (exam_preparation_id) WHERE is_current;
CREATE UNIQUE INDEX exam_preparation_plan_version_idempotency
  ON exam_preparation_plan_version (exam_preparation_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

INSERT INTO exam_preparation_plan_version (
  institution_id, exam_preparation_id, version_number, assessment_date, change_reason, created_at
)
SELECT p.institution_id, p.id, 1, a.assessment_date, 'PLAN_INICIAL', p.created_at
  FROM exam_preparation p
  JOIN assessment a ON a.id = p.assessment_id;

COMMENT ON TABLE exam_preparation_plan_version IS
  'Versiones append-only del plan dentro de una misma preparación (HUMAN-P0-9.7, ADR-038).';

-- El tramo y los motivos no se hardcodean en el Service. Una versión nueva se
-- carga como filas nuevas y la anterior se apaga sin reescribirla.
CREATE TABLE protocol_reentry_policy (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version                TEXT NOT NULL UNIQUE,
  is_current             BOOLEAN NOT NULL DEFAULT FALSE,
  minimum_step_sequence  INTEGER NOT NULL,
  maximum_step_sequence  INTEGER NOT NULL,
  source_id              TEXT NOT NULL,
  source_text            TEXT NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (minimum_step_sequence <= maximum_step_sequence)
);
CREATE UNIQUE INDEX protocol_reentry_policy_current
  ON protocol_reentry_policy ((is_current)) WHERE is_current;

CREATE TABLE protocol_reentry_reason (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id     UUID NOT NULL REFERENCES protocol_reentry_policy(id) ON DELETE RESTRICT,
  canonical_id  TEXT NOT NULL,
  label         TEXT NOT NULL,
  UNIQUE (policy_id, canonical_id)
);

WITH policy AS (
  INSERT INTO protocol_reentry_policy (
    version, is_current, minimum_step_sequence, maximum_step_sequence, source_id, source_text
  ) VALUES (
    'v1.0-psicopedagogia', TRUE, 9, 18, 'HUMAN-P0-9.7',
    'Volver al primer paso estrictamente necesario; registrar motivo, origen, destino y justificación.'
  ) RETURNING id
)
INSERT INTO protocol_reentry_reason (policy_id, canonical_id, label)
SELECT policy.id, reason.canonical_id, reason.label
  FROM policy
 CROSS JOIN (VALUES
   ('EVIDENCIA_INSUFICIENTE', 'La evidencia resultó insuficiente'),
   ('ERROR_REITERATIVO', 'Volvió a aparecer el mismo error'),
   ('CAMBIO_INFORMACION_EXAMEN', 'Cambió información del examen'),
   ('REPLANIFICACION', 'La replanificación exige volver'),
   ('PEDIDO_FUNDAMENTADO_ESTUDIANTE', 'Lo pidió el estudiante con fundamento'),
   ('INDICACION_HUMANA', 'Lo indicó una persona del equipo')
 ) AS reason(canonical_id, label);

CREATE TABLE protocol_reentry_proposal (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id           UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  exam_preparation_id      UUID NOT NULL REFERENCES exam_preparation(id) ON DELETE CASCADE,
  plan_version_id          UUID NOT NULL REFERENCES exam_preparation_plan_version(id) ON DELETE RESTRICT,
  reason_id                UUID NOT NULL REFERENCES protocol_reentry_reason(id) ON DELETE RESTRICT,
  from_step_id             UUID NOT NULL REFERENCES protocol_step(id) ON DELETE RESTRICT,
  to_step_id               UUID NOT NULL REFERENCES protocol_step(id) ON DELETE RESTRICT,
  justification            TEXT NOT NULL CHECK (btrim(justification) <> ''),
  repeated_activity        TEXT NOT NULL CHECK (btrim(repeated_activity) <> ''),
  preserved_evidence_text  TEXT NOT NULL CHECK (btrim(preserved_evidence_text) <> ''),
  status                   TEXT NOT NULL DEFAULT 'PROPOSED'
                             CHECK (status IN ('PROPOSED','ACCEPTED',
                                               'ALTERNATIVE_REQUESTED','HUMAN_OVERRIDDEN')),
  proposed_by              UUID,
  proposed_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_by             UUID,
  responded_at             TIMESTAMPTZ,
  idempotency_key          TEXT,
  CHECK (from_step_id <> to_step_id),
  CHECK ((status = 'PROPOSED' AND responded_by IS NULL AND responded_at IS NULL)
      OR (status <> 'PROPOSED' AND responded_by IS NOT NULL AND responded_at IS NOT NULL))
);

CREATE UNIQUE INDEX protocol_reentry_one_pending
  ON protocol_reentry_proposal (exam_preparation_id) WHERE status = 'PROPOSED';
CREATE UNIQUE INDEX protocol_reentry_idempotency
  ON protocol_reentry_proposal (exam_preparation_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX protocol_reentry_history
  ON protocol_reentry_proposal (exam_preparation_id, proposed_at DESC);

COMMENT ON TABLE protocol_reentry_proposal IS
  'Explicación y decisión previa a mover el recorrido. PROPOSED nunca cambia current_step_id.';

ALTER TABLE exam_preparation_plan_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_reentry_policy        ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_reentry_reason        ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_reentry_proposal      ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.replanificar_preparacion(
  p_institution_id      UUID,
  p_exam_preparation_id UUID,
  p_student_id          UUID,
  p_change_reason       TEXT,
  p_created_by          UUID,
  p_assessment_date     DATE DEFAULT NULL,
  p_idempotency_key     TEXT DEFAULT NULL
)
RETURNS TABLE (plan_version_id UUID, version_number INTEGER, duplicado BOOLEAN)
LANGUAGE plpgsql AS $$
DECLARE
  v_status TEXT;
  v_id UUID;
  v_number INTEGER;
BEGIN
  IF btrim(COALESCE(p_change_reason, '')) = '' THEN
    RAISE EXCEPTION 'la replanificación exige un motivo';
  END IF;

  SELECT status INTO v_status FROM exam_preparation
   WHERE id = p_exam_preparation_id
     AND institution_id = p_institution_id
     AND student_id = p_student_id
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'preparación fuera de alcance'; END IF;
  IF v_status NOT IN ('ACTIVE','REPLANNED') THEN
    RAISE EXCEPTION 'la preparación está en % y no admite replanificación', v_status;
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, exam_preparation_plan_version.version_number INTO v_id, v_number
      FROM exam_preparation_plan_version
     WHERE exam_preparation_id = p_exam_preparation_id
       AND idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN QUERY SELECT v_id, v_number, TRUE; RETURN; END IF;
  END IF;

  SELECT COALESCE(MAX(v.version_number), 0) + 1 INTO v_number
    FROM exam_preparation_plan_version v
   WHERE v.exam_preparation_id = p_exam_preparation_id;
  UPDATE exam_preparation_plan_version SET is_current = FALSE
   WHERE exam_preparation_id = p_exam_preparation_id AND is_current;
  INSERT INTO exam_preparation_plan_version (
    institution_id, exam_preparation_id, version_number, assessment_date,
    change_reason, created_by, idempotency_key
  ) VALUES (
    p_institution_id, p_exam_preparation_id, v_number, p_assessment_date,
    p_change_reason, p_created_by, p_idempotency_key
  ) RETURNING id INTO v_id;
  UPDATE exam_preparation SET status = 'REPLANNED' WHERE id = p_exam_preparation_id;
  RETURN QUERY SELECT v_id, v_number, FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.proponer_reentrada(
  p_institution_id        UUID,
  p_exam_preparation_id   UUID,
  p_from_step_id          UUID,
  p_to_step_id            UUID,
  p_reason_canonical_id   TEXT,
  p_justification         TEXT,
  p_repeated_activity     TEXT,
  p_preserved_evidence_text TEXT,
  p_proposed_by           UUID,
  p_idempotency_key       TEXT DEFAULT NULL
)
RETURNS TABLE (proposal_id UUID, duplicado BOOLEAN)
LANGUAGE plpgsql AS $$
DECLARE
  v_status TEXT; v_protocol UUID; v_current UUID; v_plan UUID; v_reason UUID;
  v_min INTEGER; v_max INTEGER; v_from INTEGER; v_to INTEGER; v_id UUID;
BEGIN
  IF btrim(COALESCE(p_justification, '')) = ''
     OR btrim(COALESCE(p_repeated_activity, '')) = ''
     OR btrim(COALESCE(p_preserved_evidence_text, '')) = '' THEN
    RAISE EXCEPTION 'la propuesta exige justificación, actividad y evidencia conservada';
  END IF;

  SELECT status, exam_protocol_id, current_step_id INTO v_status, v_protocol, v_current
    FROM exam_preparation
   WHERE id = p_exam_preparation_id AND institution_id = p_institution_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'preparación fuera de alcance'; END IF;
  IF v_status NOT IN ('ACTIVE','REPLANNED') THEN
    RAISE EXCEPTION 'la preparación está en % y no admite reentrada', v_status;
  END IF;
  IF v_current IS DISTINCT FROM p_from_step_id THEN
    RAISE EXCEPTION 'el paso de origen ya no es el paso actual';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_id FROM protocol_reentry_proposal
     WHERE exam_preparation_id = p_exam_preparation_id AND idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN QUERY SELECT v_id, TRUE; RETURN; END IF;
  END IF;

  SELECT pv.id INTO v_plan FROM exam_preparation_plan_version pv
   WHERE pv.exam_preparation_id = p_exam_preparation_id AND pv.is_current;
  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'la preparación no tiene una versión de plan vigente';
  END IF;
  SELECT pol.minimum_step_sequence, pol.maximum_step_sequence, rr.id
    INTO v_min, v_max, v_reason
    FROM protocol_reentry_policy pol
    JOIN protocol_reentry_reason rr ON rr.policy_id = pol.id
   WHERE pol.is_current AND rr.canonical_id = p_reason_canonical_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'motivo de reentrada no vigente'; END IF;

  SELECT sequence INTO v_from FROM protocol_step
   WHERE id = p_from_step_id AND exam_protocol_id = v_protocol;
  IF NOT FOUND THEN RAISE EXCEPTION 'paso de origen fuera del protocolo'; END IF;
  SELECT sequence INTO v_to FROM protocol_step
   WHERE id = p_to_step_id AND exam_protocol_id = v_protocol;
  IF NOT FOUND THEN RAISE EXCEPTION 'paso de destino fuera del protocolo'; END IF;
  IF v_from NOT BETWEEN v_min AND v_max OR v_to NOT BETWEEN v_min AND v_max OR v_to >= v_from THEN
    RAISE EXCEPTION 'la reentrada debe volver dentro del tramo configurado %–%', v_min, v_max;
  END IF;

  INSERT INTO protocol_reentry_proposal (
    institution_id, exam_preparation_id, plan_version_id, reason_id,
    from_step_id, to_step_id, justification, repeated_activity,
    preserved_evidence_text, proposed_by, idempotency_key
  ) VALUES (
    p_institution_id, p_exam_preparation_id, v_plan, v_reason,
    p_from_step_id, p_to_step_id, p_justification, p_repeated_activity,
    p_preserved_evidence_text, p_proposed_by, p_idempotency_key
  ) RETURNING id INTO v_id;
  RETURN QUERY SELECT v_id, FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.responder_reentrada(
  p_institution_id UUID,
  p_proposal_id    UUID,
  p_decision       TEXT,
  p_responded_by   UUID,
  p_student_id     UUID
)
RETURNS TABLE (proposal_status TEXT, current_step_id UUID)
LANGUAGE plpgsql AS $$
DECLARE
  v_proposal protocol_reentry_proposal%ROWTYPE;
  v_status TEXT;
  v_current UUID;
BEGIN
  IF p_decision NOT IN ('ACCEPT','REQUEST_ALTERNATIVE','HUMAN_OVERRIDE') THEN
    RAISE EXCEPTION 'decisión de reentrada inválida';
  END IF;
  SELECT rp.* INTO v_proposal
    FROM protocol_reentry_proposal rp
    JOIN exam_preparation ep ON ep.id = rp.exam_preparation_id
   WHERE rp.id = p_proposal_id
     AND rp.institution_id = p_institution_id
     AND (p_decision = 'HUMAN_OVERRIDE' OR ep.student_id = p_student_id)
   FOR UPDATE OF rp;
  IF NOT FOUND THEN RAISE EXCEPTION 'propuesta fuera de alcance'; END IF;
  IF v_proposal.status <> 'PROPOSED' THEN
    RAISE EXCEPTION 'la propuesta ya fue respondida';
  END IF;
  SELECT p.current_step_id INTO v_current FROM exam_preparation p
   WHERE p.id = v_proposal.exam_preparation_id AND p.institution_id = p_institution_id
   FOR UPDATE;
  IF p_decision IN ('ACCEPT','HUMAN_OVERRIDE')
     AND v_current IS DISTINCT FROM v_proposal.from_step_id THEN
    RAISE EXCEPTION 'el recorrido cambió desde que se propuso la reentrada';
  END IF;

  v_status := CASE p_decision
    WHEN 'ACCEPT' THEN 'ACCEPTED'
    WHEN 'REQUEST_ALTERNATIVE' THEN 'ALTERNATIVE_REQUESTED'
    ELSE 'HUMAN_OVERRIDDEN'
  END;
  UPDATE protocol_reentry_proposal
     SET status = v_status, responded_by = p_responded_by, responded_at = NOW()
   WHERE id = p_proposal_id;
  IF p_decision IN ('ACCEPT','HUMAN_OVERRIDE') THEN
    UPDATE exam_preparation SET current_step_id = v_proposal.to_step_id
     WHERE id = v_proposal.exam_preparation_id AND institution_id = p_institution_id;
  END IF;
  RETURN QUERY
    SELECT v_status, p.current_step_id FROM exam_preparation p
     WHERE p.id = v_proposal.exam_preparation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.replanificar_preparacion FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.proponer_reentrada FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.responder_reentrada FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replanificar_preparacion TO service_role;
GRANT EXECUTE ON FUNCTION public.proponer_reentrada TO service_role;
GRANT EXECUTE ON FUNCTION public.responder_reentrada TO service_role;

-- Un plan replanificado sigue vivo. Se reemplaza el escritor original para que
-- admita ambos estados; el resto de sus invariantes permanece idéntico.
CREATE OR REPLACE FUNCTION public.completar_paso_de_protocolo(
  p_institution_id UUID,
  p_exam_preparation_id UUID,
  p_protocol_step_id UUID,
  p_topic_id UUID,
  p_confirmed_by UUID,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS TABLE (completion_id UUID, occurrence INTEGER, duplicado BOOLEAN)
LANGUAGE plpgsql AS $$
DECLARE
  v_existente UUID; v_occurrence INTEGER; v_status TEXT; v_protocolo UUID;
  v_reentrante BOOLEAN; v_previas INTEGER; v_id UUID;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT c.id, c.occurrence INTO v_existente, v_occurrence
      FROM protocol_step_completion c
     WHERE c.exam_preparation_id = p_exam_preparation_id
       AND c.idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN QUERY SELECT v_existente, v_occurrence, TRUE; RETURN; END IF;
  END IF;
  SELECT p.status, p.exam_protocol_id INTO v_status, v_protocolo
    FROM exam_preparation p
   WHERE p.id = p_exam_preparation_id AND p.institution_id = p_institution_id
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'preparación fuera de alcance'; END IF;
  IF v_status NOT IN ('ACTIVE','REPLANNED') THEN
    RAISE EXCEPTION 'la preparación está en % y no admite completions', v_status;
  END IF;
  SELECT s.is_reentrant INTO v_reentrante FROM protocol_step s
   WHERE s.id = p_protocol_step_id AND s.exam_protocol_id = v_protocolo;
  IF NOT FOUND THEN RAISE EXCEPTION 'paso fuera del protocolo de la preparación'; END IF;
  SELECT COUNT(*)::INTEGER INTO v_previas FROM protocol_step_completion c
   WHERE c.exam_preparation_id = p_exam_preparation_id
     AND c.protocol_step_id = p_protocol_step_id
     AND c.topic_id IS NOT DISTINCT FROM p_topic_id;
  IF v_previas > 0 AND NOT v_reentrante THEN
    RAISE EXCEPTION 'el paso % no es reentrante y ya está completado', p_protocol_step_id;
  END IF;
  v_occurrence := v_previas + 1;
  INSERT INTO protocol_step_completion (
    institution_id, exam_preparation_id, protocol_step_id, topic_id,
    occurrence, confirmed_by, idempotency_key
  ) VALUES (
    p_institution_id, p_exam_preparation_id, p_protocol_step_id, p_topic_id,
    v_occurrence, p_confirmed_by, p_idempotency_key
  ) RETURNING id INTO v_id;
  RETURN QUERY SELECT v_id, v_occurrence, FALSE;
END;
$$;
REVOKE ALL ON FUNCTION public.completar_paso_de_protocolo FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.completar_paso_de_protocolo TO service_role;

-- UX09 recibe la propuesta pendiente tal como fue declarada. La función no
-- decide cuál debería ser el destino ni genera copy pedagógico.
CREATE OR REPLACE FUNCTION public.estado_de_paso(
  p_institution_id UUID,
  p_student_id UUID,
  p_ahora TIMESTAMPTZ,
  p_exam_preparation_id UUID,
  p_protocol_step_id UUID
) RETURNS JSONB LANGUAGE sql STABLE AS $$
  WITH prep AS (
    SELECT ep.* FROM exam_preparation ep
     WHERE ep.institution_id = p_institution_id
       AND ep.student_id = p_student_id
       AND ep.id = p_exam_preparation_id
  )
  SELECT jsonb_build_object(
    'instante', p_ahora, 'zona', COALESCE(s.timezone, 'UTC'),
    'preparacionId', p.id, 'status', p.status, 'materia', c.name,
    'evaluacion', ev.title, 'modalidad', ev.modality, 'pasoId', st.id,
    'label', st.label, 'objetivo', st.objective, 'explicacion', st.explanation,
    'entregable', st.expected_artifact, 'criterio', st.criterion,
    'requisito', st.requirement, 'reentrante', st.is_reentrant,
    'version', pr.version, 'contenido', st.provisional_default_id,
    'contenidoVersion', st.provisional_version,
    'vueltas', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'occurrence', cp.occurrence, 'completadoEn', cp.completed_at, 'tema', t.name)
      ORDER BY cp.completed_at DESC)
      FROM protocol_step_completion cp LEFT JOIN topic t ON t.id = cp.topic_id
      WHERE cp.exam_preparation_id = p.id AND cp.protocol_step_id = st.id), '[]'::jsonb),
    'reentrada', (SELECT jsonb_build_object(
      'id', rp.id, 'motivo', rr.label, 'justificacion', rp.justification,
      'actividad', rp.repeated_activity, 'evidenciaVigente', rp.preserved_evidence_text,
      'desde', fs.label, 'hacia', ts.label)
      FROM protocol_reentry_proposal rp
      JOIN protocol_reentry_reason rr ON rr.id = rp.reason_id
      JOIN protocol_step fs ON fs.id = rp.from_step_id
      JOIN protocol_step ts ON ts.id = rp.to_step_id
      WHERE rp.exam_preparation_id = p.id AND rp.status = 'PROPOSED'
      ORDER BY rp.proposed_at DESC LIMIT 1),
    'recurso', NULL,
    'accion', (SELECT jsonb_build_object('status', a.status, 'objetivo', a.objective)
      FROM action a WHERE a.exam_preparation_id = p.id
      AND a.status NOT IN ('COMPLETED','CANCELLED','REPLACED')
      ORDER BY a.created_at DESC LIMIT 1),
    'compromiso', (SELECT jsonb_build_object('state', cm.state)
      FROM commitment cm JOIN action a2 ON a2.id = cm.action_id
      WHERE a2.exam_preparation_id = p.id
      AND cm.state NOT IN ('COMPLETED','CLOSED','RENEGOTIATED')
      ORDER BY cm.start_at DESC LIMIT 1),
    'evidencia', COALESCE((SELECT e.lifecycle_state FROM evidence e
      JOIN action a3 ON a3.id = e.action_id
      WHERE a3.exam_preparation_id = p.id AND e.institution_id = p_institution_id
      ORDER BY e.created_at DESC LIMIT 1), 'NONE')
  )
  FROM prep p
  JOIN protocol_step st ON st.id = p_protocol_step_id AND st.exam_protocol_id = p.exam_protocol_id
  JOIN exam_protocol pr ON pr.id = st.exam_protocol_id
  JOIN assessment ev ON ev.id = p.assessment_id
  JOIN course_offering o ON o.id = ev.offering_id
  JOIN course c ON c.id = o.course_id
  JOIN student s ON s.id = p_student_id;
$$;
GRANT EXECUTE ON FUNCTION public.estado_de_paso TO service_role;
