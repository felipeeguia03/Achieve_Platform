-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Fase B6.20 — la Bitácora es de una materia
--
-- `VI.2` §8.7 pide en `UX02` *«una preview cronológica de eventos relevantes de
-- esta materia»* y `VI.6` §8.3 pone el historial completo en `UX06`, sobre la
-- misma verdad: *«no existe una segunda fuente histórica»*. Las dos frases dicen
-- **de esta materia**, y hasta acá sólo la primera lo cumplía.
--
-- `hechos_de_cursada()` siempre fue por cursada. El que elegía mal era
-- `estado_de_progreso`: su CTE `cursada` tomaba **la primera activa** por
-- `created_at`, así que con tres materias en curso la Bitácora era siempre la de
-- la más vieja. Con una sola cursada eso era invisible; con tres es un error que
-- el estudiante ve.
--
-- ## Qué cambia
--
-- Un quinto parámetro, `p_course_enrollment_id`, **opcional**. Es exactamente el
-- mismo contrato que `estado_de_materia` ya tenía —el de [ADR-054](../../docs/decisions.md#adr-054),
-- opción `B`: el objeto viaja en la URL— y con `NULL` el comportamiento anterior
-- se conserva entero.
--
-- ## Por qué hay `DROP` y no sólo `CREATE OR REPLACE`
--
-- `CREATE OR REPLACE` **no puede cambiar la lista de argumentos**: dejaría la
-- función de cuatro parámetros viva al lado de la de cinco, y toda llamada con
-- cuatro argumentos pasaría a ser ambigua —`function is not unique`— en vez de
-- resolver. Se borra la vieja y se crea la nueva, como en
-- `20260901000000_reflection_requirement.sql`.
--
-- ## Lo que esta migración NO hace
--
-- **No mueve la Bitácora adentro de `UX02`.** El spec reparte: `UX02` muestra
-- 2–3 entradas y `UX06` el historial. Copiar el historial a la materia sería la
-- segunda fuente que `VI.6` §8.3 prohíbe.
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.estado_de_progreso(UUID, UUID, TIMESTAMPTZ, UUID);

CREATE OR REPLACE FUNCTION public.estado_de_progreso(p_institution_id uuid, p_student_id uuid, p_ahora timestamp with time zone, p_evidence_id uuid DEFAULT NULL::uuid, p_course_enrollment_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
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
       -- Y **la evidencia se acota a la materia pedida**. Sin esta línea, pedir
       -- la Bitácora de Álgebra devolvía la última evidencia del estudiante
       -- —la de Cálculo— y con ella su cursada: la pantalla decía «Álgebra» en
       -- la URL y «Cálculo» en el encabezado. No es una ausencia: es una
       -- respuesta equivocada, la misma que `cursadaId` cerró en `CTA-001`.
       AND (p_course_enrollment_id IS NULL OR a.course_enrollment_id = p_course_enrollment_id)
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
       -- `NULL` ⇒ el comportamiento de siempre: la cursada de la evidencia, y
       -- sin evidencia la primera activa. Es lo que `UX01` y `UX05` siguen
       -- pidiendo, y lo que el Track A necesita cuando no hay id que nombrar.
       AND (p_course_enrollment_id IS NULL OR ce.id = p_course_enrollment_id)
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
$function$;

GRANT EXECUTE ON FUNCTION public.estado_de_progreso TO service_role;

COMMENT ON FUNCTION public.estado_de_progreso IS
  'UX06. p_course_enrollment_id acota la Bitácora a una materia; NULL conserva la cursada de la evidencia.';
