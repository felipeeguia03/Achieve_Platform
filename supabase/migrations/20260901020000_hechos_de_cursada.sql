-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B3.3 — una sola fuente histórica, y en código
--
-- `VI.6` §8.3: *«Bitácora es el historial completo de la misma verdad derivada.
-- **No existe una segunda fuente histórica.** Ambas consumen `ProgressEntry` o
-- el mismo bundle derivado de eventos»*.
--
-- Hasta acá eso era cierto por casualidad: sólo `UX06` mostraba historial. Al
-- agregar la Actividad reciente de `UX02` había dos caminos posibles —copiar el
-- `SELECT` sobre `product_event` o compartirlo—, y copiarlo es como se termina
-- con dos historiales que se contradicen: el que se mira menos envejece primero.
--
-- Así que la composición vive **acá**, y las dos superficies la llaman.
--
-- ## Por qué devuelve hechos y no texto
--
-- `event_name` viaja crudo: traducirlo es contenido y vive en
-- `lib/content/bitacora.ts` (`AGENTS.md` §2.6, los enums nunca son copy). La
-- base dice **qué pasó, cuándo y quién lo causó**; la proyección decide cómo se
-- lee y si se muestra.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hechos_de_cursada(
  p_institution_id UUID,
  p_course_enrollment_id UUID,
  -- `NULL` ⇒ todos, que es lo que la Bitácora necesita. `UX02` pide 3.
  p_limite INTEGER DEFAULT NULL
)
RETURNS TABLE (
  event_name  TEXT,
  occurred_at TIMESTAMPTZ,
  actor_id    UUID,
  accion_id   UUID,
  objetivo    TEXT
)
LANGUAGE sql STABLE AS $$
  SELECT ev.event_name, ev.occurred_at, ev.actor_id, a.id, a.objective
    FROM product_event ev
    -- Un hecho se ata a su Action por el objeto que lo produjo. Es lo que
    -- permite agrupar por ciclo sin inventar una tabla de ciclos.
    LEFT JOIN action     ac ON ev.subject_type = 'action'     AND ac.id = ev.subject_id
    LEFT JOIN commitment cm ON ev.subject_type = 'commitment' AND cm.id = ev.subject_id
    LEFT JOIN evidence   e2 ON ev.subject_type = 'evidence'   AND e2.id = ev.subject_id
    LEFT JOIN progress_entry pe ON ev.subject_type = 'progress_entry' AND pe.id = ev.subject_id
    JOIN action a ON a.id = COALESCE(ac.id, cm.action_id, e2.action_id, pe.action_id)
   WHERE ev.institution_id = p_institution_id
     AND a.course_enrollment_id = p_course_enrollment_id
   ORDER BY ev.occurred_at DESC
   LIMIT p_limite;
$$;

GRANT EXECUTE ON FUNCTION public.hechos_de_cursada TO service_role;

COMMENT ON FUNCTION public.hechos_de_cursada IS
  'La única fuente histórica. UX02 (preview) y UX06 (Bitácora) llaman acá; no existe una segunda consulta sobre product_event.';

-- ─────────────────────────────────────────────────────────────────────────────
-- `estado_de_progreso` deja de componer la Bitácora por su cuenta
--
-- La composición sobre `product_event` se movió a `hechos_de_cursada()`, que
-- `UX02` también usa. Una migración aplicada no se edita: la función se
-- reemplaza desde acá.
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
  -- Los hechos de la cursada, agrupados por la Action que los produjo.
  --
  -- **La composición no está acá:** vive en `hechos_de_cursada()`, que `UX02`
  -- también llama para su Actividad reciente. `VI.6` §8.3 dice que no existe una
  -- segunda fuente histórica, y dos `SELECT` parecidos sobre `product_event`
  -- serían exactamente eso.
  ciclos AS (
    SELECT h.accion_id, h.objetivo, min(h.occurred_at) AS desde,
           jsonb_agg(jsonb_build_object(
             'evento', h.event_name,
             'en', h.occurred_at,
             -- Quién lo causó. `IS NOT DISTINCT FROM` y no `=`: con un actor
             -- nulo —el reloj del lifecycle— la comparación daría NULL, y un
             -- "no sé" que viaja como ausencia se lee después como cualquier
             -- cosa. El sistema no es una fuente académica, y lo dice `false`.
             'porElEstudiante', h.actor_id IS NOT DISTINCT FROM p_student_id
           ) ORDER BY h.occurred_at ASC) AS entradas
      FROM public.hechos_de_cursada(p_institution_id, (SELECT id FROM cursada), NULL) h
     GROUP BY h.accion_id, h.objetivo
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
                            'objetivo', ci.objetivo,
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
