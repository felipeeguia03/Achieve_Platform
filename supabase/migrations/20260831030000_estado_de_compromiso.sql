-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B2.6 — `UX04`, el compromiso
--
-- El compromiso vivo con su Action, y **el original cuando esto es una
-- renegociación o un rescate**. El original viaja entero y de una sola lectura
-- porque `I2` e `I3` exigen que se preserve: mostrarlo desde otra consulta
-- abriría la ventana para mostrarlo ya modificado.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.estado_de_compromiso(
  p_institution_id UUID,
  p_student_id     UUID,
  p_ahora          TIMESTAMPTZ,
  p_commitment_id  UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH vigente AS (
    SELECT cm.*, a.objective, a.expected_evidence, a.completion_criterion,
           c.name AS materia
      FROM commitment cm
      JOIN action a ON a.id = cm.action_id
      JOIN course_enrollment ce ON ce.id = a.course_enrollment_id
      JOIN course_offering o ON o.id = ce.offering_id
      JOIN course c ON c.id = o.course_id
     WHERE cm.institution_id = p_institution_id
       AND ce.student_id = p_student_id
       AND (p_commitment_id IS NULL OR cm.id = p_commitment_id)
     ORDER BY
       -- El vivo primero; si no hay, el más reciente. Un MISSED sin rescate
       -- sigue siendo lo que el estudiante necesita ver.
       (cm.state NOT IN ('COMPLETED','CLOSED','RENEGOTIATED')) DESC,
       cm.start_at DESC
     LIMIT 1
  )
  SELECT jsonb_build_object(
    'instante', p_ahora,
    'zona', COALESCE(s.timezone, 'UTC'),
    'compromisoId', v.id,
    'state', v.state,
    'materia', v.materia,
    'objetivo', v.objective,
    'inicioEn', v.start_at,
    -- La zona CONGELADA en el acuerdo, no la actual del estudiante: es la que
    -- reconstruye el horario histórico sin ambigüedad.
    'zonaDelAcuerdo', v.timezone_at_commit,
    'minutosPlanificados', v.planned_minutes,
    'evidenciaEsperada', v.expected_evidence,
    'criterioCierre', v.completion_criterion,
    'esRenegociacion', v.renegotiated_from_id IS NOT NULL,
    'esRescate', v.rescues_commitment_id IS NOT NULL,
    -- El original, si lo hay. **No editable, y con sus valores intactos.**
    'original', (SELECT jsonb_build_object(
                   'state', og.state,
                   'inicioEn', og.start_at,
                   'zonaDelAcuerdo', og.timezone_at_commit,
                   'minutosPlanificados', og.planned_minutes)
                   FROM commitment og
                  WHERE og.id = COALESCE(v.renegotiated_from_id, v.rescues_commitment_id)),
    -- ¿Se puede renegociar? La regla la decide el Service contra
    -- `commitmentTransitions`; acá viaja el hecho que necesita: si ya empezó.
    'yaEmpezo', v.started_at IS NOT NULL
  )
  FROM vigente v
  JOIN student s ON s.id = p_student_id AND s.institution_id = p_institution_id;
$$;

GRANT EXECUTE ON FUNCTION public.estado_de_compromiso TO service_role;
