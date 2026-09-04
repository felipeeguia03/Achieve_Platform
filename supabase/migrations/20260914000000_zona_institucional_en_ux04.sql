-- ═══════════════════════════════════════════════════════════════════════════
-- Etapa B6.13 — `UX04` necesita la zona de la institución
--
-- [ADR-050](../../docs/decisions.md#adr-050) pone en `UX04` una acción
-- secundaria —**«Cambiar horario»**— y pide que el selector ofrezca *"sólo
-- horarios del mismo día institucional del compromiso original"*.
--
-- Esa elegibilidad se proyecta, y para proyectarla hace falta el dato que
-- [ADR-049](../../docs/decisions.md#adr-049) creó. La vista ya traía todo lo
-- demás —el estado, `esRenegociacion`, el inicio acordado y el instante—; le
-- faltaba la zona.
--
-- ⚠️ **`zona` NO cambia.** Sigue siendo la del estudiante, porque es la que
-- dice a qué hora ve él su propio día. Ésta se agrega **al lado**, no en su
-- lugar: son dos preguntas distintas y confundirlas cambiaría en silencio qué
-- horarios ofrece el selector.
--
-- ⚠️ **Y la regla no se calcula acá.** Las cinco condiciones viven en
-- `lib/domain/renegociacion.ts`. Esta función entrega hechos.
-- ═══════════════════════════════════════════════════════════════════════════

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
    -- La de la INSTITUCIÓN (ADR-049): define el "día calendario" de la
    -- condición 5 de ADR-046, y no es la de arriba.
    'zonaInstitucional', i.timezone,
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
  JOIN student s ON s.id = p_student_id AND s.institution_id = p_institution_id
  JOIN institution i ON i.id = p_institution_id;
$$;

GRANT EXECUTE ON FUNCTION public.estado_de_compromiso TO service_role;
