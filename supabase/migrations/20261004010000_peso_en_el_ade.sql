-- Achieve Platform · Fase B6.24 — el ADE ve el peso de cada unidad.
--
-- ADR-086. `contexto_del_ade()` no seleccionaba `topic.weight`, así que el motor
-- no tenía cómo saber que una unidad pide más tiempo que otra: rankeaba por
-- estar en el próximo examen, estado de práctica, recencia y `sequence` como
-- desempate. Una unidad de tres semanas y una de una tarde valían lo mismo.
--
-- ⚠️ **Esto es sólo la lectura.** Qué hace el motor con el peso vive en
-- `lib/domain/ade.ts`, que es donde se puede leer la regla y romperla con un
-- test. La función de base **no rankea**.
--
-- Sólo se agrega la clave `peso` a cada unidad. El resto queda igual.

CREATE OR REPLACE FUNCTION public.contexto_del_ade(p_institution_id uuid, p_course_enrollment_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  SELECT jsonb_build_object(
    'courseEnrollmentId', ce.id,
    'materia', c.name,
    'hayAccionViva', EXISTS (
      SELECT 1 FROM action a
       WHERE a.course_enrollment_id = ce.id
         AND a.status NOT IN ('COMPLETED','CANCELLED','REPLACED')),
    'minutosDisponibles', (
      SELECT MIN(av.capacity_min) FROM availability av WHERE av.student_id = ce.student_id),
    'proximaEvaluacion', (
      SELECT jsonb_build_object(
               'titulo', a2.title,
               'fecha', a2.assessment_date,
               -- Declarado. Si nadie declaró el alcance, viaja vacío y la regla
               -- del examen **no se activa** — que es lo correcto: no se
               -- inventa qué entra en un parcial.
               'temas', COALESCE((SELECT jsonb_agg(at.topic_id)
                                    FROM assessment_topic at WHERE at.assessment_id = a2.id),
                                 '[]'::jsonb))
        FROM assessment a2
       WHERE a2.offering_id = ce.offering_id AND a2.assessment_date >= CURRENT_DATE
           -- ADR-067: una evaluación declarada por otro estudiante de la misma
           -- comisión NO se le muestra a éste. `NULL` = no la declaró un
           -- estudiante: es de la cursada, y la ve todo el mundo.
         AND (a2.declared_by IS NULL OR a2.declared_by = ce.student_id)
       ORDER BY a2.assessment_date LIMIT 1),
    'unidades', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'topicId', t.id,
               'nombre', t.name,
               'orden', t.sequence,
               -- ADR-086. **`NULL` es ausencia de dato, no `1.0`**: el dominio
               -- decide con `usaPesos()` si la materia tiene pesos o no, y esa
               -- decisión es por materia entera, no por unidad.
               'peso', t.weight,
               'requiere', COALESCE((SELECT jsonb_agg(tp.prerequisite_id)
                                       FROM topic_prerequisite tp WHERE tp.topic_id = t.id), '[]'::jsonb),
               'practicaValor', pr.practice_value,
               'practicaEstado', COALESCE(pr.practice_state, 'no_information'),
               'dominioValor', pr.domain_value,
               'dominioEstado', COALESCE(pr.domain_state, 'not_evaluated'),
               'recenciaEn', pr.recency_at,
               'recursos', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', r.id, 'titulo', r.title))
                                       FROM resource r WHERE r.topic_id = t.id), '[]'::jsonb))
               ORDER BY t.sequence NULLS LAST)
        FROM topic t
        LEFT JOIN topic_progress pr
               ON pr.topic_id = t.id AND pr.course_enrollment_id = ce.id
       -- ⚠️ ADR-081: una unidad retirada **no se recomienda**. Su progreso sigue
       -- existiendo en la base; lo que ya no existe es la obligación de hacerla.
       WHERE t.offering_id = ce.offering_id AND t.retired_at IS NULL), '[]'::jsonb)
  )
  FROM course_enrollment ce
  JOIN course_offering o ON o.id = ce.offering_id
  JOIN course c ON c.id = o.course_id
  WHERE ce.id = p_course_enrollment_id AND ce.institution_id = p_institution_id;
$function$;
