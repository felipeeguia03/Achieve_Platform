-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Fase B4 — materializar una recomendación del ADE
--
-- La `Action` y su `ActionRecommendation` primaria nacen juntas o no nacen.
-- **Media recomendación es peor que ninguna:** una Action sin razón no se puede
-- mostrar (`P-01` pide la regla de negocio pegada al control), y una razón sin
-- Action no es nada.
--
-- La decisión de QUÉ recomendar vive en `lib/domain/ade.ts`, puro. Acá sólo se
-- escribe lo ya decidido.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.materializar_recomendacion(
  p_institution_id       UUID,
  p_course_enrollment_id UUID,
  p_topic_id             UUID,
  p_objective            TEXT,
  p_verb                 TEXT,
  p_scope                TEXT,
  p_minutes_min          INTEGER,
  p_minutes_max          INTEGER,
  p_resource_id          UUID,
  p_expected_evidence    TEXT,
  p_completion_criterion TEXT,
  p_reason               TEXT,
  p_priority             INTEGER
)
RETURNS TABLE (action_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
  v_action UUID;
BEGIN
  -- El ADE no apila. Si ya hay una Action viva para esta cursada, no se crea
  -- otra: `UX01` muestra **una** acción, y dos vivas sería el frontend
  -- eligiendo, que es justo lo que el spec prohíbe.
  PERFORM 1 FROM action
   WHERE course_enrollment_id = p_course_enrollment_id
     AND institution_id = p_institution_id
     AND status NOT IN ('COMPLETED','CANCELLED','REPLACED')
   LIMIT 1;
  IF FOUND THEN
    RETURN;
  END IF;

  INSERT INTO action (
    institution_id, course_enrollment_id, topic_id,
    objective, verb, scope,
    estimated_minutes_min, estimated_minutes_max,
    expected_evidence, completion_criterion, status
  ) VALUES (
    p_institution_id, p_course_enrollment_id, p_topic_id,
    p_objective, p_verb, p_scope,
    p_minutes_min, p_minutes_max,
    p_expected_evidence, p_completion_criterion, 'RECOMMENDED'
  )
  RETURNING id INTO v_action;

  -- El recurso es opcional en el schema, pero si vino se vincula: `UX03`
  -- muestra "Usá:" sólo cuando hay con qué.
  IF p_resource_id IS NOT NULL THEN
    INSERT INTO action_resource (action_id, resource_id, is_required)
    VALUES (v_action, p_resource_id, TRUE);
  END IF;

  -- La primaria. El índice único parcial garantiza que sea una sola (I6).
  INSERT INTO action_recommendation (action_id, reason_primary, priority, is_primary, engine_version)
  VALUES (v_action, p_reason, p_priority, TRUE, 'ade-v1-determinista');

  RETURN QUERY SELECT v_action;
END;
$$;

REVOKE ALL ON FUNCTION public.materializar_recomendacion FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.materializar_recomendacion TO service_role;

/**
 * El contexto que el Engine necesita, en una lectura.
 *
 * Devuelve las unidades de la cursada con su progreso **y sus estados**: el
 * Engine distingue `no_information` de un valor bajo, así que traer sólo el
 * número perdería justo la diferencia que importa.
 */
CREATE OR REPLACE FUNCTION public.contexto_del_ade(
  p_institution_id       UUID,
  p_course_enrollment_id UUID
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'courseEnrollmentId', ce.id,
    'materia', c.name,
    'hayAccionViva', EXISTS (
      SELECT 1 FROM action a
       WHERE a.course_enrollment_id = ce.id
         AND a.status NOT IN ('COMPLETED','CANCELLED','REPLACED')),
    'minutosDisponibles', (
      SELECT MIN(av.capacity_min) FROM availability av WHERE av.student_id = ce.student_id),
    'proximaEvaluacion', (
      SELECT jsonb_build_object('titulo', a2.title, 'fecha', a2.assessment_date, 'temas', '[]'::jsonb)
        FROM assessment a2
       WHERE a2.offering_id = ce.offering_id AND a2.assessment_date >= CURRENT_DATE
       ORDER BY a2.assessment_date LIMIT 1),
    'unidades', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'topicId', t.id,
               'nombre', t.name,
               'orden', t.sequence,
               'requiere', COALESCE((SELECT jsonb_agg(tp.prerequisite_id)
                                       FROM topic_prerequisite tp WHERE tp.topic_id = t.id), '[]'::jsonb),
               'practicaValor', pr.practice_value,
               'practicaEstado', COALESCE(pr.practice_state, 'no_information'),
               'dominioValor', pr.domain_value,
               'dominioEstado', COALESCE(pr.domain_state, 'not_evaluated'),
               'recenciaEn', pr.recency_at,
               'recursos', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', r.id, 'titulo', r.title))
                                       FROM resource r WHERE r.topic_id = t.id), '[]'::jsonb))
               ORDER BY t.sequence NULLS LAST)
        FROM topic t
        LEFT JOIN topic_progress pr
               ON pr.topic_id = t.id AND pr.course_enrollment_id = ce.id
       WHERE t.offering_id = ce.offering_id), '[]'::jsonb)
  )
  FROM course_enrollment ce
  JOIN course_offering o ON o.id = ce.offering_id
  JOIN course c ON c.id = o.course_id
  WHERE ce.id = p_course_enrollment_id AND ce.institution_id = p_institution_id;
$$;

GRANT EXECUTE ON FUNCTION public.contexto_del_ade TO service_role;
