-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Fase B6.23 — el tema en el tiempo
--
-- El owner pidió el Gantt **por tema** dentro de la materia, con eje de fechas.
-- `estado_de_materia` ya traía el estado de cada unidad; le faltaban las dos
-- puntas que la ubican en el calendario.
--
-- ## Las dos puntas son hechos, como en ADR-078
--
-- **Cuándo se dictó** sale de `class_session_topic` — el libro de temas— y
-- **para cuándo se evalúa** de `assessment_topic`, el alcance declarado. Ninguna
-- se estima.
--
-- ⚠️ **Un tema sin esas fechas NO se ubica en el eje.** Colocarlo en «+7 días»
-- porque es el séptimo de la lista sería inventar un plan de estudio que nadie
-- hizo, y presentarlo como si la cátedra lo hubiera dictado. El spec ya lo dice
-- para el ADE: **no agenda**. Esto tampoco.
--
-- ⚠️ **Y sin `assessment_topic` no hay alcance.** No se supone que la evaluación
-- de la materia cubre todos sus temas: eso lo declara la cátedra o no está.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.estado_de_materia(p_institution_id uuid, p_student_id uuid, p_ahora timestamp with time zone, p_course_enrollment_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  WITH cursada AS (
    SELECT ce.id, ce.offering_id
      FROM course_enrollment ce
     WHERE ce.institution_id = p_institution_id
       AND ce.student_id = p_student_id
       AND ce.status = 'active'
       AND (p_course_enrollment_id IS NULL OR ce.id = p_course_enrollment_id)
     ORDER BY
       -- La cursada que tiene una Action viva primero: es la materia de la que
       -- el estudiante viene hablando en `UX01`.
       (SELECT count(*) FROM action a
         WHERE a.course_enrollment_id = ce.id
           AND a.status NOT IN ('COMPLETED','CANCELLED','REPLACED')) DESC,
       ce.created_at ASC
     LIMIT 1
  ),
  accion_viva AS (
    SELECT a.*, t.name AS unidad,
           (SELECT ar.reason_primary FROM action_recommendation ar
             WHERE ar.action_id = a.id AND ar.is_primary LIMIT 1) AS razon
      FROM action a
      JOIN cursada cu ON cu.id = a.course_enrollment_id
      LEFT JOIN topic t ON t.id = a.topic_id
     WHERE a.institution_id = p_institution_id
       AND a.status NOT IN ('COMPLETED','CANCELLED','REPLACED')
     ORDER BY a.created_at DESC LIMIT 1
  ),
  compromiso_vigente AS (
    SELECT cm.state FROM commitment cm
      JOIN action a2 ON a2.id = cm.action_id
      JOIN cursada cu2 ON cu2.id = a2.course_enrollment_id
     WHERE cm.institution_id = p_institution_id
       AND cm.state NOT IN ('COMPLETED','CLOSED','RENEGOTIATED')
     ORDER BY cm.start_at DESC LIMIT 1
  )
  SELECT jsonb_build_object(
    'instante', p_ahora,
    'zona', COALESCE(s.timezone, 'UTC'),
    'cursadaId', cu.id,
    'materia', c.name,
    -- El título de la evaluación más próxima. Una evaluación **sin fecha se
    -- ordena al final y conserva su `null`**: una fecha desconocida no se
    -- estima (`assessment.assessment_date`).
    'examen', (SELECT jsonb_build_object('titulo', ev.title, 'fechaEn', ev.assessment_date,
                                         -- El tipo y la modalidad **como los declaró la fuente**.
                                         -- `NULL` no se completa: una evaluación sin modalidad
                                         -- declarada no es «escrita por defecto».
                                         'tipo', ev.assessment_type, 'modalidad', ev.modality)
                 FROM assessment ev
                WHERE ev.offering_id = cu.offering_id
           -- ADR-067: una evaluación declarada por otro estudiante de la misma
           -- comisión NO se le muestra a éste. `NULL` = no la declaró un
           -- estudiante: es de la cursada, y la ve todo el mundo.
                  AND (ev.declared_by IS NULL OR ev.declared_by = p_student_id)
                ORDER BY ev.assessment_date ASC NULLS LAST LIMIT 1),
    'accion', (SELECT jsonb_build_object(
                 'status', av.status,
                 'objetivo', av.objective,
                 'unidad', av.unidad,
                 'razon', av.razon,
                 'minutosMin', av.estimated_minutes_min,
                 'minutosMax', av.estimated_minutes_max,
                 'evidenciaEsperada', av.expected_evidence,
                 'criterioCierre', av.completion_criterion,
                 'bloqueoRazon', av.blocked_reason) FROM accion_viva av),
    'compromiso', (SELECT jsonb_build_object('state', cv.state) FROM compromiso_vigente cv),
    'rescatePendiente', EXISTS (
        SELECT 1 FROM commitment m
          JOIN action a3 ON a3.id = m.action_id
          JOIN cursada cu3 ON cu3.id = a3.course_enrollment_id
         WHERE m.institution_id = p_institution_id AND m.state = 'MISSED'
           AND NOT EXISTS (SELECT 1 FROM commitment r WHERE r.rescues_commitment_id = m.id)),
    'evidencia', COALESCE((
        SELECT CASE WHEN e.lifecycle_state = 'VALIDATED' THEN 'VALIDADA'
                    WHEN e.lifecycle_state = 'SUBMITTED' THEN 'ENVIADA' ELSE 'NONE' END
          FROM evidence e
          JOIN action a4 ON a4.id = e.action_id
          JOIN cursada cu4 ON cu4.id = a4.course_enrollment_id
         WHERE e.institution_id = p_institution_id
         ORDER BY e.created_at DESC LIMIT 1), 'NONE'),
    -- Sin unidades declaradas no hay contexto de cursado, y el ADE lo dice
    -- aparte: acá es un hecho de la base, no una inferencia.
    'contextoIncompleto', NOT EXISTS (
        SELECT 1 FROM topic tp WHERE tp.offering_id = cu.offering_id AND tp.retired_at IS NULL),
    -- Cuántas entregas lleva la cursada. **Es un conteo de hechos**, no una
    -- medida de avance: dos evidencias enviadas no dicen nada de cuánto sabe.
    'evidenciasEnviadas', (SELECT count(*) FROM evidence e5
                             JOIN action a5 ON a5.id = e5.action_id
                            WHERE a5.course_enrollment_id = cu.id
                              AND e5.submitted_at IS NOT NULL
                              AND e5.superseded_by_id IS NULL),
    'ultimoAvanceEn', (SELECT max(tp.recency_at) FROM topic_progress tp
                        WHERE tp.course_enrollment_id = cu.id),
    -- Actividad reciente (`VI.2` §8.7): **la misma fuente que la Bitácora**, no
    -- una consulta parecida. El corte en 3 lo hace la base — `VI.2` fija «2–3
    -- entradas», y traer cincuenta para tirar cuarenta y siete es trabajo que se
    -- le pide a Postgres y a la red para nada.
    'actividadReciente', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
                 'evento', h.event_name,
                 'en', h.occurred_at,
                 'porElEstudiante', h.actor_id IS NOT DISTINCT FROM p_student_id)
               ORDER BY h.occurred_at DESC)
          FROM public.hechos_de_cursada(p_institution_id, cu.id, 3) h), '[]'::jsonb),
    -- Las unidades **declaradas**, en su orden declarado. `sequence` puede
    -- faltar: se ordena al final, no se inventa una posición.
    'unidades', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
                 'id', tp.id,
                 'codigo', tp.code,
                 'nombre', tp.name,
                 'ultimoAvanceEn', pr.recency_at,
                 -- ── El tema en el tiempo · ADR-085 ──────────────────────────
                 --
                 -- Las dos puntas son **hechos**, como en la ventana de ADR-078:
                 -- cuándo se dictó por primera vez y para cuándo se evalúa.
                 -- Ninguna se estima, y sin ellas el tema **no se ubica en el
                 -- eje**: colocarlo en «+7 días» porque es el séptimo de la
                 -- lista sería inventar un plan de estudio que nadie hizo.
                 'primeraClaseEn', (SELECT min(cs.session_date) FROM class_session cs
                                      JOIN class_session_topic cst ON cst.class_session_id = cs.id
                                     WHERE cst.topic_id = tp.id AND cs.offering_id = cu.offering_id),
                 'ultimaClaseEn', (SELECT max(cs.session_date) FROM class_session cs
                                     JOIN class_session_topic cst ON cst.class_session_id = cs.id
                                    WHERE cst.topic_id = tp.id AND cs.offering_id = cu.offering_id),
                 -- La evaluación **más próxima que declara cubrir este tema**.
                 -- Sin `assessment_topic` no hay alcance declarado: no se supone
                 -- que la evaluación de la materia cubre todos los temas.
                 'evaluaEn', (SELECT min(ev2.assessment_date) FROM assessment ev2
                                JOIN assessment_topic at2 ON at2.assessment_id = ev2.id
                               WHERE at2.topic_id = tp.id
                                 AND ev2.offering_id = cu.offering_id
                                 AND ev2.assessment_date IS NOT NULL
                                 AND (ev2.declared_by IS NULL OR ev2.declared_by = p_student_id)),
                 -- El ESTADO de cada dimensión, nunca su valor.
                 'dominio', pr.domain_state,
                 'practica', pr.practice_state,
                 'recorrido', pr.exposure_state,
                 -- El peso declarado. NULL = no declarado, **no 1.0**.
                 'peso', tp.weight,
                 -- ⚠️ **Cuatro estados, no un booleano** — ADR-075 §C2. La
                 -- psicopedagoga corrigió la pregunta antes de contestarla:
                 -- *"fuerza una elección falsa porque mezcla dos constructos:
                 -- actividad y calidad del resultado"*.
                 --
                 -- Una entrega insuficiente es **trabajo intentado** y **no**
                 -- contenido cubierto. No reconocerla *"invisibiliza el esfuerzo
                 -- y castiga dos veces"*; contarla como cobertura plena *"puede
                 -- producir una falsa sensación de preparación"*.
                 --
                 -- Gana el mejor estado: haber alcanzado el criterio una vez no
                 -- se pierde porque después haya otra entrega en revisión.
                 'evidencia', COALESCE((
                     SELECT CASE
                              WHEN bool_or(ev.lifecycle_state IN ('SUFFICIENT','VALIDATED'))
                                THEN 'criterio_alcanzado'
                              WHEN bool_or(ev.lifecycle_state IN ('SUBMITTED','UNDER_REVIEW'))
                                THEN 'enviada'
                              WHEN bool_or(ev.lifecycle_state IN ('INSUFFICIENT','RESUBMISSION_REQUESTED'))
                                THEN 'requiere_revision'
                              ELSE 'sin_evidencia'
                            END
                       FROM evidence ev
                       JOIN action ac ON ac.id = ev.action_id
                      WHERE ac.course_enrollment_id = cu.id
                        AND ac.topic_id = tp.id), 'sin_evidencia'))
                 -- ⚠️ **El orden es el DICTADO, con el declarado de respaldo**
                 -- ([ADR-071](../../docs/decisions.md#adr-071)). `SISTEMAS DE
                 -- INFORMACIÓN` 2024 dio la unidad 1 en la clase 13, a
                 -- propósito: ordenar por `sequence` le mostraría al estudiante
                 -- una historia que no pasó.
                 ORDER BY (SELECT MIN(cs.session_date)
                             FROM class_session_topic cst
                             JOIN class_session cs ON cs.id = cst.class_session_id
                            WHERE cst.topic_id = tp.id
                              AND cs.offering_id = cu.offering_id
                              AND (cs.session_kind IS NULL OR cs.session_kind = 'clase'))
                          ASC NULLS LAST,
                          tp.sequence ASC NULLS LAST, tp.name ASC)
          FROM topic tp
          LEFT JOIN topic_progress pr
                 ON pr.topic_id = tp.id AND pr.course_enrollment_id = cu.id
         -- ⚠️ ADR-081: el Gantt dibuja el programa **vigente**. Una unidad
         -- retirada distorsionaría la cobertura —entraría al denominador una
         -- unidad que la cátedra sacó—, y el progreso que el estudiante hizo
         -- sobre ella sigue guardado.
         WHERE tp.offering_id = cu.offering_id AND tp.retired_at IS NULL), '[]'::jsonb),

    -- ── Los insumos de la duración · ADR-068 ─────────────────────────────────
    --
    -- ⚠️ **La función NO reparte los minutos entre los temas.** Ese cálculo vive
    -- en `lib/domain/duracion.ts`, versionado por la regla que lo produjo, y
    -- ADR-068 fue explícito en que no bajara a SQL: es una regla de producto que
    -- va a cambiar, y una función de base la volvería difícil de versionar.
    --
    -- Acá viajan **los hechos**: cuánto duró cada sesión y qué temas cubrió.
    -- §D: el primer escalón del factor de estudio, si la cátedra lo declara.
    'cargaDeEstudio', (SELECT CASE WHEN o2.declared_study_min IS NULL THEN NULL
                                   ELSE jsonb_build_object('minutos', o2.declared_study_min,
                                                           'texto', o2.declared_study_source) END
                         FROM course_offering o2 WHERE o2.id = cu.offering_id),
    'cargaDeclarada', (SELECT CASE WHEN o2.declared_total_min IS NULL THEN NULL
                                   ELSE jsonb_build_object('minutos', o2.declared_total_min,
                                                           'texto', o2.declared_total_source) END
                         FROM course_offering o2 WHERE o2.id = cu.offering_id),
    -- ── El horario semanal de cursado · ADR-063 ─────────────────────────────
    --
    -- **`class_session` es otra cosa** y las dos viajan juntas a propósito, para
    -- que se vea la diferencia: `clases` son las **dictadas**, con su fecha;
    -- `horario` es **la regla semanal**. Derivar la segunda desde las primeras
    -- —«se dictó tres martes, entonces cursa los martes»— sería inferencia
    -- presentada como horario de la institución.
    --
    -- Los dos dueños viajan **rotulados y sin fusionarse** (`P-08`): lo que
    -- publica la cátedra y lo que declaró el estudiante son dos fuentes, y una
    -- no se convierte en la otra (AGENTS.md §2.6).
    'horario', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
                 'dia', b.day_of_week,
                 'desde', b.start_time,
                 'hasta', b.end_time,
                 'origen', CASE WHEN b.offering_id IS NOT NULL THEN 'catedra' ELSE 'vos' END,
                 'fuente', b.source_type,
                 'verificacion', b.verification_status)
                 ORDER BY b.day_of_week ASC, b.start_time ASC)
          FROM class_schedule_block b
         WHERE b.offering_id = cu.offering_id
            OR b.course_enrollment_id = cu.id), '[]'::jsonb),
    'clases', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
                 'minutos', cs.duration_min,
                 'tipo', cs.session_kind,
                 'temas', COALESCE((SELECT jsonb_agg(cst.topic_id)
                                      FROM class_session_topic cst
                                     WHERE cst.class_session_id = cs.id), '[]'::jsonb))
                 ORDER BY cs.session_date ASC, cs.session_time ASC NULLS LAST)
          FROM class_session cs
         WHERE cs.offering_id = cu.offering_id), '[]'::jsonb),
    -- Agregado de la materia: **cuántas unidades tienen cada estado**. No es un
    -- promedio de dimensiones (prohibido) ni una magnitud de máquina: es el
    -- conteo de un hecho, y la proyección lo usa sólo para decidir si una
    -- dimensión se muestra como ausencia o se omite.
    'dimensiones', (
        SELECT jsonb_build_object(
                 'unidades', count(*),
                 'dominioMedido',   count(*) FILTER (WHERE pr.domain_state = 'value'),
                 'dominioNoEval',   count(*) FILTER (WHERE COALESCE(pr.domain_state,'not_evaluated') = 'not_evaluated'),
                 'practicaMedida',  count(*) FILTER (WHERE pr.practice_state = 'value'),
                 'recorridoMedido', count(*) FILTER (WHERE pr.exposure_state = 'value'),
                 'confianzaEn',     max(pr.confidence_declared_at) FILTER (WHERE pr.confidence_state = 'value'))
          FROM topic tp2
          LEFT JOIN topic_progress pr
                 ON pr.topic_id = tp2.id AND pr.course_enrollment_id = cu.id
         WHERE tp2.offering_id = cu.offering_id)
  )
  FROM cursada cu
  JOIN course_offering o ON o.id = cu.offering_id
  JOIN course c ON c.id = o.course_id
  JOIN student s ON s.id = p_student_id AND s.institution_id = p_institution_id;
$function$;

GRANT EXECUTE ON FUNCTION public.estado_de_materia TO service_role;
