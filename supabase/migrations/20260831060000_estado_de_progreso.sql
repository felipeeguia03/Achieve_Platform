-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B2.6 — `UX06` en una sola lectura
--
-- Mismo argumento que las otras cuatro: `UX06` mira evidencia, resultado de
-- progreso, dimensiones e historial a la vez, y varias lecturas dan una foto
-- inconsistente entre sí — acá el riesgo es peor que en las demás, porque una
-- foto desalineada muestra *"cambió Práctica"* al lado de una evidencia que
-- todavía nadie validó.
--
-- ## Las tres cosas que esta función se niega a hacer
--
-- 1. **No deriva un cambio de progreso de un estado de Evidence.** `VALIDATED`
--    no produce `ProgressUpdated` por sí solo (`VI.6` §6). Si no hay fila en
--    `progress_entry`, no hay cambio, y lo que viaja es la ausencia — no un
--    "sin cambios".
-- 2. **No atribuye una entrada vieja a la evidencia de hoy.** El resultado sólo
--    se liga a la evidencia vigente si la fila lo dice (`evidence_id` o
--    `causal_evidence_id`). Si la entrada existe pero apunta a otra cosa, viaja
--    con `esDeEstaEvidencia: false` y la proyección no le pone causa.
-- 3. **No devuelve ningún valor numérico de `topic_progress`.** Misma regla que
--    `estado_de_materia`: `*_value` es `NUMERIC` sin unidad ni escala
--    (`C01-019`, gate `H`). Viaja **el estado** de cada dimensión, que es un
--    hecho cerrado.
--
-- ## La Bitácora sale de `product_event`, y por qué
--
-- `data-model.md` §12 dice que la Bitácora **no tiene tabla propia**: es
-- composición de lectura sobre objetos existentes. El registro de hechos con
-- instante propio, actor y causa es `product_event`, que además es append-only
-- (`I12`) — o sea, es la única fuente que no se puede reescribir.
--
-- Reconstruir la historia desde las columnas de estado no alcanza: `evidence`
-- no tiene `validated_at`, así que *"la validó"* no tendría instante y habría
-- que inventarle uno. Un hecho sin fecha no entra a un timeline.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.estado_de_progreso(
  p_institution_id UUID,
  p_student_id     UUID,
  p_ahora          TIMESTAMPTZ,
  p_evidence_id    UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH evidencia AS (
    SELECT e.id, e.lifecycle_state, e.submitted_at, e.commitment_id,
           a.id AS action_id, a.objective, a.course_enrollment_id, a.topic_id
      FROM evidence e
      JOIN action a ON a.id = e.action_id
      JOIN course_enrollment ce ON ce.id = a.course_enrollment_id
     WHERE e.institution_id = p_institution_id
       AND ce.student_id = p_student_id
       AND (p_evidence_id IS NULL OR e.id = p_evidence_id)
       -- La reemplazada se preserva (`I4`), no se proyecta como la actual.
       AND (p_evidence_id IS NOT NULL OR e.superseded_by_id IS NULL)
     ORDER BY e.created_at DESC LIMIT 1
  ),
  -- La cursada de la evidencia. Sin evidencia todavía hay pantalla: el
  -- estudiante puede abrir su progreso antes de entregar nada.
  cursada AS (
    SELECT ce.id, ce.offering_id
      FROM course_enrollment ce
     WHERE ce.institution_id = p_institution_id
       AND ce.student_id = p_student_id
       AND ce.status = 'active'
       AND (ce.id = (SELECT course_enrollment_id FROM evidencia)
            OR NOT EXISTS (SELECT 1 FROM evidencia))
     ORDER BY ce.created_at ASC LIMIT 1
  ),
  -- El resultado autoritativo. Primero el que habla de ESTA evidencia; si no
  -- existe, el último de la cursada, que viaja sin causa atribuida.
  resultado AS (
    SELECT pe.*,
           (pe.evidence_id = (SELECT id FROM evidencia)
            OR pe.causal_evidence_id = (SELECT id FROM evidencia)) AS es_de_esta_evidencia
      FROM progress_entry pe
      JOIN cursada cu ON cu.id = pe.course_enrollment_id
     WHERE pe.institution_id = p_institution_id
     ORDER BY (pe.evidence_id = (SELECT id FROM evidencia)
               OR pe.causal_evidence_id = (SELECT id FROM evidencia)) DESC NULLS LAST,
              pe.occurred_at DESC
     LIMIT 1
  ),
  -- Las dimensiones de la unidad de la que habla la pantalla.
  dimensiones AS (
    SELECT tp.* FROM topic_progress tp
     JOIN cursada cu ON cu.id = tp.course_enrollment_id
    WHERE tp.topic_id = COALESCE((SELECT topic_id FROM resultado),
                                 (SELECT topic_id FROM evidencia))
    LIMIT 1
  ),
  -- La Action viva de la cursada: es lo que "qué sigue" puede ofrecer, si el
  -- ADE ya emitió una recomendación. Esta pantalla nunca crea una.
  siguiente AS (
    SELECT a.id, a.objective,
           (SELECT ar.reason_primary FROM action_recommendation ar
             WHERE ar.action_id = a.id AND ar.is_primary LIMIT 1) AS razon
      FROM action a
      JOIN cursada cu ON cu.id = a.course_enrollment_id
     WHERE a.institution_id = p_institution_id
       AND a.status NOT IN ('COMPLETED','CANCELLED','REPLACED')
     ORDER BY a.created_at DESC LIMIT 1
  ),
  -- Los hechos de la cursada, resueltos a la Action que los agrupa en un ciclo.
  hechos AS (
    SELECT ev.event_name, ev.occurred_at, ev.actor_id,
           COALESCE(ac.id, cm.action_id, e2.action_id) AS accion_id
      FROM product_event ev
      LEFT JOIN action     ac ON ev.subject_type = 'action'     AND ac.id = ev.subject_id
      LEFT JOIN commitment cm ON ev.subject_type = 'commitment' AND cm.id = ev.subject_id
      LEFT JOIN evidence   e2 ON ev.subject_type = 'evidence'   AND e2.id = ev.subject_id
     WHERE ev.institution_id = p_institution_id
  ),
  ciclos AS (
    SELECT a.id AS accion_id, a.objective, min(h.occurred_at) AS desde,
           jsonb_agg(jsonb_build_object(
             'evento', h.event_name,
             'en', h.occurred_at,
             -- Quién lo causó. `IS NOT DISTINCT FROM` y no `=`: con un actor
             -- nulo —el reloj del lifecycle— la comparación daría NULL, y un
             -- "no sé" que viaja como ausencia se lee después como cualquier
             -- cosa. El sistema no es una fuente académica, y lo dice `false`.
             'porElEstudiante', h.actor_id IS NOT DISTINCT FROM p_student_id
           ) ORDER BY h.occurred_at ASC) AS entradas
      FROM hechos h
      JOIN action a ON a.id = h.accion_id
      JOIN cursada cu ON cu.id = a.course_enrollment_id
     GROUP BY a.id, a.objective
  )
  SELECT jsonb_build_object(
    'instante', p_ahora,
    'zona', COALESCE(s.timezone, 'UTC'),
    'materia', c.name,
    'unidad', (SELECT t.name FROM topic t
                WHERE t.id = COALESCE((SELECT topic_id FROM resultado),
                                      (SELECT topic_id FROM evidencia))),
    'evidencia', (SELECT jsonb_build_object(
                    'id', e.id,
                    'lifecycle', e.lifecycle_state,
                    'objetivo', e.objective,
                    'enviadaEn', e.submitted_at) FROM evidencia e),
    'resultado', (SELECT jsonb_build_object(
                    'occurridoEn', r.occurred_at,
                    'tipo', r.entry_kind,
                    'dimensionesCambiadas', to_jsonb(r.changed_dimensions),
                    'valoresAnteriores', r.before_values,
                    'valoresActuales', r.current_values,
                    'noCambioExplicito', r.explicit_no_change,
                    'razonDeNoCambio', r.no_change_reason,
                    'esDeEstaEvidencia', COALESCE(r.es_de_esta_evidencia, false))
                  FROM resultado r),
    -- El ESTADO de cada dimensión, nunca su valor.
    'dimensiones', (SELECT jsonb_build_object(
                      'recorrido', d.exposure_state,
                      'practica', d.practice_state,
                      'dominio', d.domain_state,
                      'confianza', d.confidence_state,
                      'confianzaEn', d.confidence_declared_at,
                      'recenciaEn', d.recency_at) FROM dimensiones d),
    'siguiente', (SELECT jsonb_build_object('objetivo', sg.objective, 'razon', sg.razon)
                    FROM siguiente sg),
    'bitacora', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                            'accionId', ci.accion_id,
                            'objetivo', ci.objective,
                            'desde', ci.desde,
                            'entradas', ci.entradas)
                          ORDER BY ci.desde DESC)
                          FROM ciclos ci), '[]'::jsonb)
  )
  FROM cursada cu
  JOIN course_offering o ON o.id = cu.offering_id
  JOIN course c ON c.id = o.course_id
  JOIN student s ON s.id = p_student_id AND s.institution_id = p_institution_id;
$$;

GRANT EXECUTE ON FUNCTION public.estado_de_progreso TO service_role;
