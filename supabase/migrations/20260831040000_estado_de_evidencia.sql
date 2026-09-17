-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B2.6 — `UX05`, la evidencia
--
-- ⚠️ **`C01-051` sigue `OPEN` (gate `H`).** Dónde vive el flag que hace
-- obligatoria una `Reflection` y quién lo pone no está decidido, y la Etapa
-- B2.4 sostuvo el criterio de que **el requisito entra por parámetro y no se lee
-- de una tabla de configuración que nadie decidió**. Esta función mantiene ese
-- criterio: `p_reflexion_requerida` entra de afuera, con `false` como valor de
-- llamada —no como default de producto—, y no hay ninguna columna que consultar.
--
-- Lo que sí lee de la base es si **existe** una Reflection: eso es un hecho.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.estado_de_evidencia(
  p_institution_id UUID,
  p_student_id     UUID,
  p_ahora          TIMESTAMPTZ,
  p_evidence_id    UUID DEFAULT NULL,
  p_reflexion_requerida BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH vigente AS (
    SELECT e.*, a.objective, a.expected_evidence, a.completion_criterion,
           c.name AS materia, t.name AS unidad
      FROM evidence e
      JOIN action a ON a.id = e.action_id
      JOIN course_enrollment ce ON ce.id = a.course_enrollment_id
      JOIN course_offering o ON o.id = ce.offering_id
      JOIN course c ON c.id = o.course_id
      LEFT JOIN topic t ON t.id = a.topic_id
     WHERE e.institution_id = p_institution_id
       AND ce.student_id = p_student_id
       AND (p_evidence_id IS NULL OR e.id = p_evidence_id)
       -- La superseded no se muestra como la actual: se preserva (`I4`), no se
       -- proyecta. La actual es la que nadie reemplazó.
       AND (p_evidence_id IS NOT NULL OR e.superseded_by_id IS NULL)
     ORDER BY e.created_at DESC LIMIT 1
  )
  SELECT jsonb_build_object(
    'instante', p_ahora,
    'zona', COALESCE(s.timezone, 'UTC'),
    'evidenciaId', v.id,
    'lifecycle', v.lifecycle_state,
    'materia', v.materia,
    'unidad', v.unidad,
    'objetivo', v.objective,
    'evidenciaEsperada', v.expected_evidence,
    'criterioCierre', v.completion_criterion,
    'reflexionRequerida', p_reflexion_requerida,
    'reflexionPresente', EXISTS (
        SELECT 1 FROM reflection rf WHERE rf.evidence_id = v.id),
    -- El adjunto ya subido, si hay. La pantalla no vuelve a pedirlo.
    'adjuntoPrevio', (SELECT ec.display_name FROM evidence_content ec
                       WHERE ec.evidence_id = v.id
                       ORDER BY ec.sort_order ASC LIMIT 1),
    'esResubmission', v.supersedes_id IS NOT NULL,
    'razonResubmission', v.resubmission_reason,
    -- `UNDER_REVIEW` exige instancia real: viaja el hecho, no el método.
    'revisionReal', v.review_instance_id IS NOT NULL,
    -- Entrega tardía: se entregó después del vencimiento del compromiso.
    'tardia', (v.submitted_at IS NOT NULL AND EXISTS (
        SELECT 1 FROM commitment cm
         WHERE cm.id = v.commitment_id
           AND v.submitted_at > cm.start_at + (cm.planned_minutes || ' minutes')::interval))
  )
  FROM vigente v
  JOIN student s ON s.id = p_student_id AND s.institution_id = p_institution_id;
$$;

GRANT EXECUTE ON FUNCTION public.estado_de_evidencia TO service_role;
