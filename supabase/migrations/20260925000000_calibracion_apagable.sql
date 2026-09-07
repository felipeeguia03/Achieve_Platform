-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · El estudiante puede apagar la calibración, y las
-- observaciones traen con qué compararse
--
-- Ejecuta [ADR-075](../../docs/decisions.md#adr-075) §B3 y §B4.
--
-- ## §B4 — el interruptor
--
-- > *"Un sistema que cambia la carga sin explicar por qué puede parecer
-- > arbitrario. […] Podés revisar los registros o **desactivar este ajuste**."*
--
-- No es una preferencia cosmética: es lo que convierte una devolución en algo
-- que el estudiante puede discutir. Nace en `TRUE` porque la calibración
-- **existe** y lo que se ofrece es apagarla, no encenderla.
--
-- ## §B3 — con qué se compara
--
-- Las observaciones viajaban con los minutos y la estimación, y nada más. Sin
-- **el día** no se puede exigir que vengan de días distintos —*"cinco registros
-- de una misma tarde describen una tarde"*—, y sin **el tipo de actividad** se
-- comparan una lectura y un laboratorio como si fueran lo mismo.
--
-- El tipo sale de `action.verb`: es el vocabulario que el ADE ya usa, y
-- **inventar una taxonomía nueva sería exactamente lo que ella advirtió** sobre
-- las etiquetas.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE student
  ADD COLUMN time_calibration_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN student.time_calibration_enabled IS
  'ADR-075 §B4. FALSE = el estudiante apagó el ajuste de duración. Apagarlo NO borra las '
  'observaciones: volver a encenderlo no empieza de cero.';

CREATE OR REPLACE FUNCTION public.insumos_de_reparto(
  p_institution_id UUID,
  p_student_id     UUID,
  p_ahora          TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH cursadas AS (
    SELECT ce.id, ce.offering_id, c.name AS materia
      FROM course_enrollment ce
      JOIN course_offering o ON o.id = ce.offering_id
      JOIN course c ON c.id = o.course_id
     WHERE ce.institution_id = p_institution_id
       AND ce.student_id = p_student_id
       AND ce.status = 'active'
  )
  SELECT jsonb_build_object(
    -- `NULL` ⇒ **no contestó la pregunta**, que no es lo mismo que cero. Sin
    -- este corte, el estudiante que declaró «no sé» y el que tiene la semana
    -- ocupada se verían igual, y el reparto afirmaría cosas distintas de ellos.
    'minutosPorSemana', (
      SELECT CASE WHEN s.availability_declared_at IS NULL THEN NULL
                  ELSE COALESCE((SELECT SUM(av.capacity_min) FROM availability av
                                  WHERE av.student_id = p_student_id AND av.source = 'declared'), 0)
             END
        FROM student s WHERE s.id = p_student_id),

    -- ── Las observaciones del Personal Engine · ADR-074 ─────────────────────
    --
    -- Lo que el estudiante declaró que tardó, contra lo que la `Action`
    -- estimaba. **Es una propiedad de la tarea frente a la persona**, no de su
    -- vida: por eso sale de `reflection`, y NO de los `Commitment` cumplidos.
    --
    -- ⚠️ Derivar la disponibilidad de lo cumplido confundiría capacidad con
    -- conducta: una mala semana reduciría el presupuesto, y el reparto daría
    -- menos porque se hizo menos. `availability.source = 'observed'` **queda sin
    -- escribir** hasta que exista una señal que mida capacidad de verdad.
    -- ⚠️ **El estudiante puede apagar la calibración** — ADR-075 §B4: *"Podés
    -- revisar los registros o **desactivar este ajuste**"*. Un sistema que
    -- cambia la carga sin dar cómo pararlo es exactamente lo que ella señaló
    -- como arbitrario.
    'calibracionActiva', (SELECT s2.time_calibration_enabled FROM student s2 WHERE s2.id = p_student_id),

    'observaciones', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'minutosReales', rf.actual_minutes,
               'estimadoMin', ac2.estimated_minutes_min,
               'estimadoMax', ac2.estimated_minutes_max,
               -- §B3: **días distintos**. Cinco registros de una misma tarde
               -- describen una tarde, no una tendencia.
               'dia', (rf.created_at AT TIME ZONE COALESCE(st.timezone, 'UTC'))::DATE,
               -- §B3: **el mismo tipo general de actividad**. Comparar una
               -- lectura con un laboratorio no compara nada.
               'tipo', ac2.verb)
               -- En orden cronológico: §B2 mira **las últimas cinco**.
               ORDER BY rf.created_at ASC)
        FROM reflection rf
        JOIN action ac2 ON ac2.id = rf.action_id
        JOIN course_enrollment ce2 ON ce2.id = ac2.course_enrollment_id
        JOIN student st ON st.id = p_student_id
       WHERE ce2.student_id = p_student_id
         AND ce2.institution_id = p_institution_id
         AND rf.actual_minutes IS NOT NULL), '[]'::jsonb),

    'materias', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'cursadaId', cu.id,
        'nombre', cu.materia,
        -- Días hasta la próxima evaluación **con fecha**. Sin fecha viaja
        -- `null` y el dominio la reparte con su horizonte declarado: dejarla
        -- fuera diría que no hay que estudiarla.
        'diasHastaEvaluacion', (
          SELECT (ev.assessment_date - p_ahora::DATE)
            FROM assessment ev
           WHERE ev.offering_id = cu.offering_id
             AND ev.assessment_date IS NOT NULL
             AND ev.assessment_date >= p_ahora::DATE
             -- ADR-067: la declarada por otro estudiante no cuenta para éste.
             AND (ev.declared_by IS NULL OR ev.declared_by = p_student_id)
           ORDER BY ev.assessment_date LIMIT 1),
        -- ⚠️ **Qué entra en la próxima evaluación**, declarado. Sin esto el
        -- reparto exigiría la materia entera para un parcial que cubre dos
        -- unidades, y el número saldría al doble.
        --
        -- Vacío ⇒ nadie declaró el alcance, y entonces se cuenta todo: es la
        -- misma salida que `contexto_del_ade()` —*"si nadie declaró el alcance,
        -- viaja vacío"*—, y no se infiere del texto de `scope`.
        'alcance', COALESCE((
          SELECT jsonb_agg(at.topic_id)
            FROM assessment ev2
            JOIN assessment_topic at ON at.assessment_id = ev2.id
           WHERE ev2.id = (
             SELECT ev3.id FROM assessment ev3
              WHERE ev3.offering_id = cu.offering_id
                AND ev3.assessment_date IS NOT NULL
                AND ev3.assessment_date >= p_ahora::DATE
                AND (ev3.declared_by IS NULL OR ev3.declared_by = p_student_id)
              ORDER BY ev3.assessment_date LIMIT 1)), '[]'::jsonb),
        'cargaDeclarada', (
          SELECT CASE WHEN o2.declared_total_min IS NULL THEN NULL
                      ELSE jsonb_build_object('minutos', o2.declared_total_min,
                                              'texto', o2.declared_total_source) END
            FROM course_offering o2 WHERE o2.id = cu.offering_id),
        'unidades', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
                   'id', tp.id, 'peso', tp.weight,
                   -- Los mismos cuatro estados que `estado_de_materia()`. Que
                   -- las dos funciones digan lo mismo del mismo tema es lo que
                   -- evita que el Gantt y el reparto se contradigan.
                   'evidencia', COALESCE((
                       SELECT CASE
                                WHEN bool_or(ev2.lifecycle_state IN ('SUFFICIENT','VALIDATED'))
                                  THEN 'criterio_alcanzado'
                                WHEN bool_or(ev2.lifecycle_state IN ('SUBMITTED','UNDER_REVIEW'))
                                  THEN 'enviada'
                                WHEN bool_or(ev2.lifecycle_state IN ('INSUFFICIENT','RESUBMISSION_REQUESTED'))
                                  THEN 'requiere_revision'
                                ELSE 'sin_evidencia'
                              END
                         FROM evidence ev2
                         JOIN action ac ON ac.id = ev2.action_id
                        WHERE ac.course_enrollment_id = cu.id
                          AND ac.topic_id = tp.id), 'sin_evidencia'))
                   ORDER BY tp.sequence ASC NULLS LAST, tp.name ASC)
            FROM topic tp WHERE tp.offering_id = cu.offering_id), '[]'::jsonb),
        'clases', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
                   'minutos', cs.duration_min,
                   'tipo', cs.session_kind,
                   'temas', COALESCE((SELECT jsonb_agg(cst.topic_id)
                                        FROM class_session_topic cst
                                       WHERE cst.class_session_id = cs.id), '[]'::jsonb))
                   ORDER BY cs.session_date ASC)
            FROM class_session cs WHERE cs.offering_id = cu.offering_id), '[]'::jsonb))
        -- El mismo orden que `estado_del_dia()`: la cola de HOY indexa por
        -- posición, y dos listas de materias en órdenes distintos harían que la
        -- tarjeta y su reparto no se correspondan.
        ORDER BY cu.materia ASC, cu.id ASC)
      FROM cursadas cu), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.insumos_de_reparto FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insumos_de_reparto TO service_role;
