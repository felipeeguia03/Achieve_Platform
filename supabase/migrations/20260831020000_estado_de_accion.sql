-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B2.6 — `UX03`, la próxima acción
--
-- Lee la Action viva con su recomendación primaria y su recurso. Una lectura:
-- la razón y la Action tienen que salir de la misma foto, porque una Action sin
-- su razón no se puede mostrar (`P-01`).
--
-- **El recurso viaja con su procedencia cruda**, no traducida: `source_type` es
-- un enum técnico y `product.md` §7 prohíbe que aparezca como copy visible. La
-- traducción la hace `lib/content/provenance.ts`, del lado de la presentación.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.estado_de_accion(
  p_institution_id UUID,
  p_student_id     UUID,
  p_ahora          TIMESTAMPTZ,
  p_action_id      UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH viva AS (
    SELECT a.*, c.name AS materia, t.name AS unidad
      FROM action a
      JOIN course_enrollment ce ON ce.id = a.course_enrollment_id
      JOIN course_offering o ON o.id = ce.offering_id
      JOIN course c ON c.id = o.course_id
      LEFT JOIN topic t ON t.id = a.topic_id
     WHERE a.institution_id = p_institution_id
       AND ce.student_id = p_student_id
       AND (p_action_id IS NULL OR a.id = p_action_id)
       AND (p_action_id IS NOT NULL OR a.status NOT IN ('COMPLETED','CANCELLED','REPLACED'))
     ORDER BY a.created_at DESC LIMIT 1
  )
  SELECT jsonb_build_object(
    'instante', p_ahora,
    'zona', COALESCE(s.timezone, 'UTC'),
    'accionId', v.id,
    'status', v.status,
    'materia', v.materia,
    'unidad', v.unidad,
    'objetivo', v.objective,
    'verbo', v.verb,
    'alcance', v.scope,
    'razon', (SELECT ar.reason_primary FROM action_recommendation ar
               WHERE ar.action_id = v.id AND ar.is_primary LIMIT 1),
    'minutosMin', v.estimated_minutes_min,
    'minutosMax', v.estimated_minutes_max,
    'evidenciaEsperada', v.expected_evidence,
    'criterioCierre', v.completion_criterion,
    'bloqueoRazon', v.blocked_reason,
    'reemplazada', v.replaced_by_id IS NOT NULL,
    -- El recurso requerido, si hay uno declarado. Su procedencia va cruda.
    'recurso', (SELECT jsonb_build_object(
                  'titulo', r.title,
                  'fuente', r.source_type,
                  -- `resource` NO tiene `verification_status`: viaja NULL a
                  -- propósito, y la traducción lo lee como "no disponible".
                  -- Rellenarlo acá sería elevar la verificación (`I9`).
                  'verificacion', NULL)
                  FROM action_resource ar2
                  JOIN resource r ON r.id = ar2.resource_id
                 WHERE ar2.action_id = v.id
                 ORDER BY ar2.sort_order ASC LIMIT 1),
    -- ¿Ya hay un compromiso vivo para esta Action? Decide si la CTA de
    -- comprometerse tiene sentido, y **no** se infiere del status de la Action:
    -- aceptar una Action no crea un Commitment.
    'compromisoVivo', EXISTS (
        SELECT 1 FROM commitment cm
         WHERE cm.action_id = v.id
           AND cm.state NOT IN ('MISSED','CLOSED','RENEGOTIATED'))
  )
  FROM viva v
  JOIN student s ON s.id = p_student_id AND s.institution_id = p_institution_id;
$$;

GRANT EXECUTE ON FUNCTION public.estado_de_accion TO service_role;
