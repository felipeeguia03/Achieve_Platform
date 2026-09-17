-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · El estudiante da de alta su propia evaluación
--
-- Ejecuta [ADR-067](../../docs/decisions.md#adr-067).
--
-- **El agujero que tapa.** Ninguna ruta de la aplicación llegaba a un escritor
-- de `assessment`. `ingerirMateria()` existe y escribe evaluaciones, pero
-- ninguna ruta lo alcanza — y no serviría igual: **reemplaza** las unidades y
-- las evaluaciones de la cursada entera. Usarlo para agregar un final borraría
-- el temario.
--
-- Y `assessment_date` sostiene todo lo demás: la próxima evaluación de
-- `estado_de_materia()`, `contexto_del_ade().proximaEvaluacion`, la aparición
-- de `CTA-019`, y la ventana de 14 días de ADR-048. Sin escritor, todo eso
-- dependía de filas que sólo insertaban los scripts de verificación.
--
-- **Las tres decisiones de ADR-067 que se materializan acá:**
--
-- 1. `declared_by` — sólo la ve quien la cargó. `NULL` = no la declaró un
--    estudiante (vino de la ingesta o de la institución) y la ve todo el mundo.
-- 2. `assessment_type` pasa a vocabulario cerrado. Sin eso el Gantt no puede
--    tratar distinto un final de una entrega.
-- 3. **Se aceptan duplicados.** No hay `UNIQUE`: dos estudiantes de la misma
--    comisión van a cargar el mismo parcial y las dos filas conviven
--    `unverified`. Fusionarlas es corroborar, y eso sigue diferido por ADR-057.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1 · Quién la declaró ─────────────────────────────────────────────────────
--
-- Sin FK, igual que `class_session.uploaded_by` y `preparation_readiness
-- .overridden_by`: son columnas de autoría, y borrar al estudiante no debe
-- arrastrar el hecho académico de que esa evaluación existe.

ALTER TABLE assessment ADD COLUMN declared_by UUID;

COMMENT ON COLUMN assessment.declared_by IS
  'Quién la declaró, o NULL si no fue un estudiante. La visibilidad se filtra por '
  'esta columna en las funciones de lectura (ADR-067). NULL = la ve toda la comisión.';

-- Parcial: la enorme mayoría de las filas son `NULL` y no hace falta indexarlas.
CREATE INDEX assessment_declarada_por
    ON assessment (declared_by) WHERE declared_by IS NOT NULL;

-- ── 2 · El vocabulario de tipos ──────────────────────────────────────────────
--
-- Hasta acá `assessment_type` era TEXT libre. Las filas existentes usan
-- `final` y `parcial`, las dos dentro del vocabulario: el CHECK no rompe nada.
--
-- ⚠️ **`coloquio` entra aunque el corpus no lo traiga.** No es especulación:
-- es un tipo de evaluación del régimen, y dejarlo afuera obligaría al
-- estudiante a mentir eligiendo `final`. Lo que NO entra es un `otro` de
-- escape: una fila que el Gantt no sabe tratar es una fila que alguien va a
-- tener que reclasificar después.

ALTER TABLE assessment
  ADD CONSTRAINT assessment_tipo_vocabulario
  CHECK (assessment_type IN ('parcial','final','tp','entrega','coloquio'));

-- ── 3 · El escritor ──────────────────────────────────────────────────────────
--
-- Angosto a propósito: da de alta **una** evaluación y no toca nada más. No
-- crea `ExamPreparation` — eso lo hace `CTA-011` con confirmación explícita —,
-- no escribe `assessment_topic`, y no eleva procedencia.

CREATE OR REPLACE FUNCTION public.declarar_evaluacion(
  p_institution_id       UUID,
  p_student_id           UUID,
  p_course_enrollment_id UUID,
  p_tipo                 TEXT,
  p_titulo               TEXT,
  -- Opcional, y ese es el punto: quien sabe que tiene final pero no cuándo
  -- tiene que poder registrarlo. Obligarla lo forzaría a inventar una fecha,
  -- que es exactamente lo que `assessment_date` nullable previene.
  p_fecha                DATE DEFAULT NULL,
  p_hora                 TIME DEFAULT NULL,
  p_modalidad            TEXT DEFAULT NULL,
  p_alcance              TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_offering UUID;
  v_id       UUID;
BEGIN
  -- La cursada tiene que ser de este estudiante y de esta institución. Sin
  -- esto, un `course_enrollment_id` ajeno escribiría en la comisión de otro.
  SELECT ce.offering_id INTO v_offering
    FROM course_enrollment ce
   WHERE ce.id = p_course_enrollment_id
     AND ce.student_id = p_student_id
     AND ce.institution_id = p_institution_id;

  IF v_offering IS NULL THEN
    RETURN NULL;   -- el servicio lo traduce; acá no se inventa una cursada
  END IF;

  INSERT INTO assessment (
    offering_id, assessment_type, title, assessment_date, assessment_time,
    modality, scope, declared_by,
    -- `I9`: nada se auto-eleva. `verification_status` queda en su default
    -- `unverified` y **no viaja como parámetro**, igual que en `ingerir_materia`.
    source_type, source_ref, observed_at
  ) VALUES (
    v_offering, p_tipo, p_titulo, p_fecha, p_hora,
    p_modalidad, p_alcance, p_student_id,
    'student', 'declarada por el estudiante en UX02', NOW()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.declarar_evaluacion IS
  'ADR-067. Da de alta UNA evaluación del estudiante. No crea ExamPreparation, '
  'no escribe assessment_topic y no eleva procedencia. Devuelve NULL si la cursada no es suya.';

REVOKE ALL ON FUNCTION public.declarar_evaluacion FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.declarar_evaluacion TO service_role;

-- ── 4 · La visibilidad, en las cuatro funciones que leen `assessment` ─────────
--
-- Un `declared_by` que no se filtra al leer es una mentira: la fila se guarda
-- como privada y se muestra igual. Las cuatro llevan el mismo predicado.
--
-- `estado_de_preparacion`, `estado_de_paso` y `protocolo_vigente` **no se
-- tocan**: llegan a la evaluación a través de `exam_preparation`, que ya es
-- por estudiante. Filtrar dos veces no agregaría nada.


-- ── `estado_de_materia()` — la próxima evaluación de la materia

CREATE OR REPLACE FUNCTION public.estado_de_materia(
  p_institution_id UUID,
  p_student_id     UUID,
  p_ahora          TIMESTAMPTZ,
  -- NULL ⇒ la cursada de la Action viva; si no hay, la primera activa.
  -- `/materia` no lleva id en la URL y agregarle uno toca el registro canónico
  -- de CTAs, que es contrato. Ver la Etapa B2.6 en `roadmap.md`.
  p_course_enrollment_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
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
    'examen', (SELECT jsonb_build_object('titulo', ev.title, 'fechaEn', ev.assessment_date)
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
        SELECT 1 FROM topic tp WHERE tp.offering_id = cu.offering_id),
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
                 'codigo', tp.code,
                 'nombre', tp.name,
                 'ultimoAvanceEn', pr.recency_at,
                 -- El ESTADO de cada dimensión, nunca su valor.
                 'dominio', pr.domain_state,
                 'practica', pr.practice_state,
                 'recorrido', pr.exposure_state)
                 ORDER BY tp.sequence ASC NULLS LAST, tp.name ASC)
          FROM topic tp
          LEFT JOIN topic_progress pr
                 ON pr.topic_id = tp.id AND pr.course_enrollment_id = cu.id
         WHERE tp.offering_id = cu.offering_id), '[]'::jsonb),
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
$$;

GRANT EXECUTE ON FUNCTION public.estado_de_materia TO service_role;

-- ── `estado_de_activacion()` — la lista de `UX07`

CREATE OR REPLACE FUNCTION public.estado_de_activacion(
  p_institution_id UUID,
  p_student_id     UUID,
  p_ahora          TIMESTAMPTZ,
  p_course_enrollment_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH cursada AS (
    SELECT ce.id, ce.offering_id
      FROM course_enrollment ce
     WHERE ce.institution_id = p_institution_id
       AND ce.student_id = p_student_id
       AND ce.status = 'active'
       AND (p_course_enrollment_id IS NULL OR ce.id = p_course_enrollment_id)
     ORDER BY ce.created_at ASC LIMIT 1
  ),
  -- Las preparaciones vivas de esta cursada. `ABANDONED`, `CLOSED` y
  -- `EXAM_TAKEN` conservan su historia y no compiten por la activación.
  preparaciones AS (
    SELECT ep.* FROM exam_preparation ep
      JOIN cursada cu ON cu.id = ep.course_enrollment_id
     WHERE ep.institution_id = p_institution_id
       AND ep.status IN ('RECOMMENDED','ACTIVE','BLOCKED')
  )
  SELECT jsonb_build_object(
    'instante', p_ahora,
    'zona', COALESCE(s.timezone, 'UTC'),
    'cursadaId', cu.id,
    'materia', c.name,
    'comision', o.commission,
    -- Las evaluaciones del offering con su procedencia. **En el orden
    -- declarado**, sin fecha estimada y sin priorizar: elegir cuál es "la
    -- próxima" cuando hay varias es `SELECCION`, y la decide la persona.
    'evaluaciones', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
                 'id', ev.id,
                 'titulo', ev.title,
                 'fechaEn', ev.assessment_date,
                 'modalidad', ev.modality,
                 'fuente', ev.source_type,
                 'verificacion', ev.verification_status,
                 -- Sin protocolo para la modalidad, activar no tendría contra
                 -- qué correr. `C01-047` deja `oral` fuera de P0.
                 'tieneProtocolo', EXISTS (SELECT 1 FROM protocolo_vigente(ev.id)),
                 'preparacion', (
                    SELECT jsonb_build_object('id', pp.id, 'status', pp.status)
                      FROM preparaciones pp WHERE pp.assessment_id = ev.id))
                 ORDER BY ev.assessment_date ASC NULLS LAST, ev.title ASC)
          FROM assessment ev
         WHERE ev.offering_id = cu.offering_id
           -- ADR-067: una evaluación declarada por otro estudiante de la misma
           -- comisión NO se le muestra a éste. `NULL` = no la declaró un
           -- estudiante: es de la cursada, y la ve todo el mundo.
           AND (ev.declared_by IS NULL OR ev.declared_by = p_student_id)), '[]'::jsonb)
  )
  FROM cursada cu
  JOIN course_offering o ON o.id = cu.offering_id
  JOIN course c ON c.id = o.course_id
  JOIN student s ON s.id = p_student_id;
$$;

GRANT EXECUTE ON FUNCTION public.estado_de_activacion TO service_role;

-- ── `contexto_del_ade()` — qué entra en el próximo examen

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

-- ── `candidatos_de_modo_examen()` — a quién se le recomienda Modo Examen

CREATE OR REPLACE FUNCTION public.candidatos_de_modo_examen(
  p_institution_id UUID,
  p_limite         INTEGER DEFAULT 200
)
RETURNS TABLE (
  assessment_id        UUID,
  student_id           UUID,
  course_enrollment_id UUID,
  assessment_date      DATE,
  titulo               TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT a.id, ce.student_id, ce.id, a.assessment_date, a.title
    FROM assessment a
    JOIN course_enrollment ce ON ce.offering_id = a.offering_id
   WHERE ce.institution_id = p_institution_id
           -- ADR-067: una evaluación declarada por otro estudiante de la misma
           -- comisión NO se le muestra a éste. `NULL` = no la declaró un
           -- estudiante: es de la cursada, y la ve todo el mundo.
     AND (a.declared_by IS NULL OR a.declared_by = ce.student_id)
     -- Sin fecha no hay ventana que evaluar, y no se estima una. La fila ni
     -- siquiera viaja: *omitir, no inventar*.
     AND a.assessment_date IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM exam_preparation p
        WHERE p.student_id = ce.student_id AND p.assessment_id = a.id
     )
   ORDER BY a.assessment_date
   LIMIT p_limite;
$$;

GRANT EXECUTE ON FUNCTION public.candidatos_de_modo_examen TO service_role;
