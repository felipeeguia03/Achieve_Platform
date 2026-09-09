-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Fase B6.22 — `UX04` no ofrece un horario con clase encima
--
-- [ADR-064](../../docs/decisions.md#adr-064) pone la restricción horaria en *"la
-- propuesta **y** validación del `Commitment`"*. La validación ya está en el
-- Service; esto es la propuesta: el selector de «cambiar horario» de
-- [ADR-050](../../docs/decisions.md#adr-050) deja de listar franjas que el
-- servidor rechazaría.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.estado_de_compromiso(p_institution_id uuid, p_student_id uuid, p_ahora timestamp with time zone, p_commitment_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
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
    -- Los bloques de clase conocidos · ADR-064.
    --
    -- `UX04` los necesita para **no ofrecer un horario que el servidor va a
    -- rechazar**: es el defecto que ADR-050 ya corrigió una vez —la pantalla
    -- ofreciendo algo que el backend no puede hacer— y el selector de horarios
    -- es exactamente donde volvería a aparecer.
    --
    -- Se reusa `horarios_del_estudiante()` en vez de repetir el `SELECT`: dos
    -- consultas parecidas sobre `class_schedule_block` serían dos respuestas a
    -- «cuándo cursa», y la que se mira menos envejece primero.
    'horario', public.horarios_del_estudiante(p_institution_id, p_student_id),
    -- ¿Se puede renegociar? La regla la decide el Service contra
    -- `commitmentTransitions`; acá viaja el hecho que necesita: si ya empezó.
    'yaEmpezo', v.started_at IS NOT NULL
  )
  FROM vigente v
  JOIN student s ON s.id = p_student_id AND s.institution_id = p_institution_id
  JOIN institution i ON i.id = p_institution_id;
$function$;

GRANT EXECUTE ON FUNCTION public.estado_de_compromiso TO service_role;
