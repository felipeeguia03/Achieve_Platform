-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Fase B4 — qué temas entran en una evaluación
--
-- **Hallazgo al conectar el ADE a la base.** `data-model.md` §7 no tiene forma
-- de decir qué unidades cubre un parcial: `assessment.scope` es **texto libre**
-- ("U1 a U2"). El Engine tiene la regla de más peso —*"entra en la próxima
-- evaluación"*— y **no había con qué activarla**: `temas` llegaba siempre vacío.
--
-- Una regla que nunca se activa es peor que no tenerla: parece que el producto
-- prioriza el examen y en realidad nunca lo hace.
--
-- ⚠️ **Adición estructural provisional** ([ADR-024](../../docs/decisions.md#adr-024)).
-- El vínculo evaluación↔tema no está en el spec; se agrega porque el propio
-- comportamiento que el spec pide lo necesita. Queda para revisión junto con
-- `C01-027` (secuencia y criterio del Exam Protocol).
--
-- **No se parsea `scope`.** Convertir "U1 a U2" en unidades sería inferir un
-- alcance académico desde texto libre — exactamente lo que el producto evita.
-- El vínculo se declara, igual que los prerequisitos.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE assessment_topic (
  assessment_id UUID NOT NULL REFERENCES assessment(id) ON DELETE CASCADE,
  topic_id      UUID NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
  PRIMARY KEY (assessment_id, topic_id)
);

COMMENT ON TABLE assessment_topic IS
  'Qué unidades entran en una evaluación. Declarado, nunca inferido de `scope` (texto libre).';

ALTER TABLE assessment_topic ENABLE ROW LEVEL SECURITY;
CREATE INDEX assessment_topic_topic_idx ON assessment_topic (topic_id);

-- El contexto del ADE ahora sí puede traer los temas de la próxima evaluación.
CREATE OR REPLACE FUNCTION public.contexto_del_ade(
  p_institution_id       UUID,
  p_course_enrollment_id UUID
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
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
       ORDER BY a2.assessment_date LIMIT 1),
    'unidades', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'topicId', t.id,
               'nombre', t.name,
               'orden', t.sequence,
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
       WHERE t.offering_id = ce.offering_id), '[]'::jsonb)
  )
  FROM course_enrollment ce
  JOIN course_offering o ON o.id = ce.offering_id
  JOIN course c ON c.id = o.course_id
  WHERE ce.id = p_course_enrollment_id AND ce.institution_id = p_institution_id;
$$;

GRANT EXECUTE ON FUNCTION public.contexto_del_ade TO service_role;
