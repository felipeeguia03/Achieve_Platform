-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.4 — el riesgo llega a `UX01`, como modificador
--
-- `VI.1` §3.3 es explícito: `HIGH_RISK` **no gana el Hero**. Puede cambiar el
-- estado general a *"Necesita recuperación"*, seleccionar la causa visible y
-- habilitar un hecho humano si hay una `Intervention` real — pero **no puede
-- interrumpir `IN_PROGRESS` ni `EVIDENCE_PENDING` sólo por severidad**, ni
-- reordenar recomendaciones o materias.
--
-- Por eso la señal viaja en su propia clave, **fuera de todo lo que alimenta la
-- matriz de precedencia**, y la proyección la usa para una sola cosa. Hay
-- guards estáticos que verifican que no toque el nivel del Hero ni la CTA.
--
-- **Y no se inventa un umbral.** Qué severidad cambia el estado general es
-- `C01-021`; lo que la proyección mira es si **la señal misma** está en
-- `INTERVENTION_REQUIRED`, que es la señal diciendo que necesita una persona.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.estado_del_dia(
  p_institution_id UUID,
  p_student_id     UUID,
  p_ahora          TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH accion_viva AS (
    SELECT a.*, c.name AS materia, t.name AS unidad,
           (SELECT ar.reason_primary FROM action_recommendation ar
             WHERE ar.action_id = a.id AND ar.is_primary LIMIT 1) AS razon
      FROM action a
      JOIN course_enrollment ce ON ce.id = a.course_enrollment_id
      JOIN course_offering o ON o.id = ce.offering_id
      JOIN course c ON c.id = o.course_id
      LEFT JOIN topic t ON t.id = a.topic_id
     WHERE a.institution_id = p_institution_id
       AND ce.student_id = p_student_id
       AND a.status NOT IN ('COMPLETED','CANCELLED','REPLACED')
     ORDER BY a.created_at DESC LIMIT 1
  ),
  compromiso_vigente AS (
    SELECT cm.* FROM commitment cm
      JOIN action a2 ON a2.id = cm.action_id
      JOIN course_enrollment ce2 ON ce2.id = a2.course_enrollment_id
     WHERE cm.institution_id = p_institution_id
       AND ce2.student_id = p_student_id
       AND cm.state NOT IN ('COMPLETED','CLOSED','RENEGOTIATED')
     ORDER BY cm.start_at DESC LIMIT 1
  )
  SELECT jsonb_build_object(
    -- ISO y la zona del estudiante. **El formato no se decide acá:** el idioma
    -- y la forma de la fecha son presentación, y la base no habla es-AR.
    'instante', p_ahora,
    'zona', COALESCE(s.timezone, 'UTC'),
    'accion', (SELECT jsonb_build_object(
                 'status', av.status,
                 'objetivo', av.objective,
                 'contexto', upper(av.materia || COALESCE(' · ' || av.unidad, '')),
                 'razon', av.razon,
                 'minutosMin', av.estimated_minutes_min,
                 'minutosMax', av.estimated_minutes_max,
                 'evidenciaEsperada', av.expected_evidence,
                 'queSigue', NULL) FROM accion_viva av),
    'compromiso', (SELECT jsonb_build_object('state', cv.state) FROM compromiso_vigente cv),
    -- Un rescate pendiente: hay un MISSED que nadie rescató todavía.
    'rescatePendiente', EXISTS (
        SELECT 1 FROM commitment m
          JOIN action a3 ON a3.id = m.action_id
          JOIN course_enrollment ce3 ON ce3.id = a3.course_enrollment_id
         WHERE m.institution_id = p_institution_id AND ce3.student_id = p_student_id
           AND m.state = 'MISSED'
           AND NOT EXISTS (SELECT 1 FROM commitment r WHERE r.rescues_commitment_id = m.id)),
    'evidencia', COALESCE((
        SELECT CASE WHEN e.lifecycle_state = 'VALIDATED' THEN 'VALIDADA'
                    WHEN e.lifecycle_state = 'SUBMITTED' THEN 'ENVIADA' ELSE 'NONE' END
          FROM evidence e
          JOIN action a4 ON a4.id = e.action_id
          JOIN course_enrollment ce4 ON ce4.id = a4.course_enrollment_id
         WHERE e.institution_id = p_institution_id AND ce4.student_id = p_student_id
         ORDER BY e.created_at DESC LIMIT 1), 'NONE'),
    -- Falta contexto cuando el estudiante tiene cursadas sin unidades cargadas.
    'contextoIncompleto', EXISTS (
        SELECT 1 FROM course_enrollment ce5
         WHERE ce5.student_id = p_student_id AND ce5.institution_id = p_institution_id
           AND ce5.status = 'active'
           AND NOT EXISTS (SELECT 1 FROM topic tp WHERE tp.offering_id = ce5.offering_id)),
    'materias', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
                 'nombre', c6.name,
                 -- NULL a propósito: sin Risk Engine nadie evaluó esta materia.
                 -- Ver el encabezado de esta migración.
                 'estado', NULL,
                 -- ISO o `null`. `null` ⇒ "Sin avance registrado", que NO es
                 -- "hace 0 días" (P-09).
                 'ultimoAvanceEn', (SELECT max(tp6.recency_at)
                                      FROM topic_progress tp6
                                     WHERE tp6.course_enrollment_id = ce6.id),
                 -- El tono acompaña a una lectura. Sin lectura, neutral: no hay
                 -- nada que destacar ni que atenuar.
                 'tono', 'neutral'))
          FROM course_enrollment ce6
          JOIN course_offering o6 ON o6.id = ce6.offering_id
          JOIN course c6 ON c6.id = o6.course_id
         WHERE ce6.student_id = p_student_id AND ce6.institution_id = p_institution_id
           AND ce6.status = 'active'), '[]'::jsonb),
    'bitacoraDisponible', TRUE,
    -- ── Riesgo · Fase B6 ─────────────────────────────────────────────────────
    --
    -- La señal **más severa que sigue viva**, con su explicación. `VI.1` §3.3:
    -- `HIGH_RISK` es un **estado modificador, no reemplazante** — *"no gana
    -- automáticamente el Hero"* y *"no puede interrumpir `IN_PROGRESS` ni
    -- `EVIDENCE_PENDING` sólo por severidad"*.
    --
    -- Por eso viaja **fuera** de todo lo que alimenta la matriz de precedencia:
    -- lo único que puede cambiar es el estado general, y la proyección lo hace
    -- **sólo cuando la señal misma dice que necesita una persona**. Qué
    -- severidad cambia el estado sería un umbral, y eso es `C01-021`.
    --
    -- Y viaja con `reason`, porque la matriz de visibilidad (§4.1) le da al
    -- estudiante *"explicación útil"* de su propia señal, no un color.
    'riesgo', (
        SELECT jsonb_build_object(
                 'severidad', rs.severity,
                 'razon', rs.reason,
                 'necesitaPersona', rs.status = 'INTERVENTION_REQUIRED')
          FROM risk_signal rs
         WHERE rs.institution_id = p_institution_id
           AND rs.student_id = p_student_id
           AND rs.status IN ('OPEN','ACKNOWLEDGED','INTERVENTION_REQUIRED')
         ORDER BY (rs.status = 'INTERVENTION_REQUIRED') DESC,
                  array_position(ARRAY['intervencion','riesgo','atencion','bajo'], rs.severity),
                  rs.created_at DESC
         LIMIT 1)
  )
  FROM student s
  WHERE s.id = p_student_id AND s.institution_id = p_institution_id;
$$;

GRANT EXECUTE ON FUNCTION public.estado_del_dia TO service_role;
