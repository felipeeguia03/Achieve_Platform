-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · El `1,5` baja al último escalón
--
-- Ejecuta [ADR-075](../../docs/decisions.md#adr-075) §D.
--
-- > *"No encontré respaldo para afirmar que **1,5 horas de estudio autónomo por
-- > cada hora de clase** sea una constante psicopedagógica universal."*
--
-- Y trajo la normativa: la Resolución 2598/2023 define el Crédito de Referencia
-- del Estudiante en 25–30 horas por crédito, y **no prescribe una relación fija
-- de 1,5 a 1**.
--
-- El `1,5` deja de ser **el** número y pasa a ser **el último recurso**. Cuando
-- la cátedra declara cuántas horas de trabajo autónomo espera, manda eso — y se
-- guarda **el texto literal**, igual que `declared_total_source`, porque §D pide
-- *"guardar siempre la fuente y versión de la estimación"*.
--
-- ⚠️ **Dos de los cuatro escalones de la respuesta ya existían**, y no se
-- reimplementan acá: *"estimación por actividad concreta"* son las
-- `action.estimated_minutes_*` que produce el ADE, y *"mediana histórica de
-- actividades comparables"* es el multiplicador de
-- [ADR-074](../../docs/decisions.md#adr-074), que se aplica **aparte**. Plegarlo
-- acá lo contaría dos veces.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE course_offering
  ADD COLUMN declared_study_min    INTEGER,
  ADD COLUMN declared_study_source TEXT;

ALTER TABLE course_offering
  ADD CONSTRAINT estudio_declarado_completo_o_ausente
    CHECK ((declared_study_min IS NULL AND declared_study_source IS NULL)
        OR (declared_study_min IS NOT NULL AND declared_study_source IS NOT NULL
            AND declared_study_min > 0));

COMMENT ON COLUMN course_offering.declared_study_source IS
  'ADR-075 §D. El texto literal del programa sobre trabajo autónomo. Va junto al número para poder '
  'auditar la lectura, igual que declared_total_source.';

-- La aridad cambia otra vez: sin el DROP quedan las dos versiones conviviendo
-- y cualquier llamada falla con «function name is not unique».
DROP FUNCTION IF EXISTS public.ingerir_materia(
  UUID, TEXT, TEXT, TIMESTAMPTZ, NUMERIC, TEXT, TEXT, TEXT, TEXT,
  JSONB, JSONB, JSONB, UUID, JSONB, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.ingerir_materia(
  p_institution_id UUID,
  p_source_type    TEXT,
  p_source_ref     TEXT,
  p_observed_at    TIMESTAMPTZ,
  p_confidence     NUMERIC,
  p_course_code    TEXT,
  p_course_name    TEXT,
  p_term           TEXT,
  p_commission     TEXT,
  p_unidades       JSONB,
  p_prerequisitos  JSONB,
  p_evaluaciones   JSONB,
  p_curriculum_plan_id UUID DEFAULT NULL,
  -- Las sesiones del libro de temas. Vacío ⇒ no se toca nada de `class_session`.
  p_clases         JSONB DEFAULT '[]'::JSONB,
  -- La carga horaria declarada por el programa: minutos + el texto literal.
  p_carga_min      INTEGER DEFAULT NULL,
  p_carga_texto    TEXT DEFAULT NULL,
  -- §D: las horas de trabajo autónomo que declara el programa, si las declara.
  p_estudio_min    INTEGER DEFAULT NULL,
  p_estudio_texto  TEXT DEFAULT NULL
)
RETURNS TABLE (cursada_id UUID, unidades INTEGER, evaluaciones INTEGER, clases INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  v_program_id UUID;
  v_plan_id    UUID;
  v_course_id  UUID;
  v_offering   UUID;
  v_unidades   INTEGER := 0;
  v_evals      INTEGER := 0;
  v_clases     INTEGER := 0;
  v_sesion     UUID;
  r            JSONB;
  t            JSONB;
BEGIN
  IF p_curriculum_plan_id IS NOT NULL THEN
    -- El plan viene declarado: la materia se cuelga de él y no se fabrica nada.
    SELECT cp.id INTO v_plan_id FROM curriculum_plan cp
      JOIN academic_program ap ON ap.id = cp.program_id
     WHERE cp.id = p_curriculum_plan_id AND ap.institution_id = p_institution_id;
    IF v_plan_id IS NULL THEN
      RAISE EXCEPTION 'el plan % no existe o no pertenece a la institución %',
        p_curriculum_plan_id, p_institution_id USING ERRCODE = 'foreign_key_violation';
    END IF;
  ELSE
    -- Sin plan declarado, el comportamiento de la B2b.1, intacto: un contenedor
    -- por institución, explícito y reconocible, en vez de inventar una
    -- estructura curricular que nadie declaró.
    SELECT id INTO v_program_id FROM academic_program
     WHERE institution_id = p_institution_id AND name = 'Sin programa declarado';
    IF v_program_id IS NULL THEN
      INSERT INTO academic_program (institution_id, name)
      VALUES (p_institution_id, 'Sin programa declarado') RETURNING id INTO v_program_id;
    END IF;

    SELECT id INTO v_plan_id FROM curriculum_plan
     WHERE program_id = v_program_id AND version = 'sin-plan';
    IF v_plan_id IS NULL THEN
      INSERT INTO curriculum_plan (program_id, version)
      VALUES (v_program_id, 'sin-plan') RETURNING id INTO v_plan_id;
    END IF;
  END IF;

  SELECT id INTO v_course_id FROM course
   WHERE curriculum_plan_id = v_plan_id AND code = p_course_code;
  IF v_course_id IS NULL THEN
    INSERT INTO course (curriculum_plan_id, code, name)
    VALUES (v_plan_id, p_course_code, p_course_name) RETURNING id INTO v_course_id;
  ELSE
    UPDATE course SET name = p_course_name WHERE id = v_course_id;
  END IF;

  SELECT id INTO v_offering FROM course_offering
   WHERE course_id = v_course_id AND term = p_term
     AND commission IS NOT DISTINCT FROM p_commission;
  IF v_offering IS NULL THEN
    INSERT INTO course_offering (course_id, term, commission)
    VALUES (v_course_id, p_term, p_commission) RETURNING id INTO v_offering;
  END IF;

  -- Reemplazo, no acumulación: la cursada queda con el material nuevo.
  --
  -- ⚠️ **Pero lo que declaró un estudiante NO se borra.** Desde
  -- [ADR-067](../../docs/decisions.md#adr-067) una `assessment` puede tener
  -- `declared_by`, y una ingesta de material de cátedra que la barriera le
  -- borraría al estudiante el final que él cargó — sin que nada se lo avise.
  -- **La ingesta reemplaza lo que la ingesta trajo.**
  DELETE FROM topic WHERE offering_id = v_offering;
  DELETE FROM assessment WHERE offering_id = v_offering AND declared_by IS NULL;
  DELETE FROM class_session WHERE offering_id = v_offering;

  -- La carga horaria declarada. Van juntos o no van (`carga_declarada_completa_o_ausente`).
  IF p_carga_min IS NOT NULL AND p_carga_texto IS NOT NULL THEN
    UPDATE course_offering
       SET declared_total_min = p_carga_min, declared_total_source = p_carga_texto
     WHERE id = v_offering;
  END IF;

  IF p_estudio_min IS NOT NULL AND p_estudio_texto IS NOT NULL THEN
    UPDATE course_offering
       SET declared_study_min = p_estudio_min, declared_study_source = p_estudio_texto
     WHERE id = v_offering;
  END IF;

  FOR r IN SELECT * FROM jsonb_array_elements(p_unidades) LOOP
    INSERT INTO topic (offering_id, code, name, sequence)
    VALUES (v_offering, r->>'codigo', r->>'nombre', (r->>'orden')::INTEGER);
    v_unidades := v_unidades + 1;
  END LOOP;

  -- Prerequisitos EXPLÍCITOS. Nunca se derivan de `sequence`.
  FOR r IN SELECT * FROM jsonb_array_elements(COALESCE(p_prerequisitos, '[]'::JSONB)) LOOP
    INSERT INTO topic_prerequisite (topic_id, prerequisite_id)
    SELECT t.id, p.id
      FROM topic t, topic p
     WHERE t.offering_id = v_offering AND t.name = r->>'unidad'
       AND p.offering_id = v_offering AND p.name = r->>'requiere';
  END LOOP;

  FOR r IN SELECT * FROM jsonb_array_elements(COALESCE(p_evaluaciones, '[]'::JSONB)) LOOP
    INSERT INTO assessment (
      offering_id, assessment_type, title, assessment_date, modality, scope,
      source_type, source_ref, observed_at, confidence
      -- `verification_status` NO se pasa: queda en su default `unverified`.
    ) VALUES (
      v_offering, r->>'tipo', r->>'titulo', (r->>'fecha')::DATE,
      r->>'modalidad', r->>'alcance',
      p_source_type, p_source_ref, p_observed_at, p_confidence
    );
    v_evals := v_evals + 1;
  END LOOP;

  -- ── Las sesiones del libro de temas · ADR-068 y ADR-069 ───────────────────
  --
  -- ⚠️ **`session_kind` sólo entra si la guía lo trae, y la guía lo trae sólo
  -- si una persona lo confirmó.** El importador no clasifica: la columna `tipo`
  -- del libro dice `NORMAL` en 988 de ~1016 filas y el parcial vive en texto
  -- libre, con 25% de falsos positivos medidos. Ausente queda `NULL`, que el
  -- dominio cuenta como clase.
  --
  -- ⚠️ **El docente no se carga.** El libro trae nombre y legajo en cada fila;
  -- `class_session` no tiene dónde ponerlos y no hay que agregarle un lugar
  -- (ADR-023, y la consulta de ADR-006 sigue abierta).
  FOR r IN SELECT * FROM jsonb_array_elements(COALESCE(p_clases, '[]'::JSONB)) LOOP
    INSERT INTO class_session (
      offering_id, session_date, session_time, duration_min, stream, session_kind,
      source_type, source_ref, observed_at, confidence
    ) VALUES (
      v_offering, (r->>'fecha')::DATE, (r->>'hora')::TIME, (r->>'minutos')::INTEGER,
      r->>'corrida', r->>'tipo',
      p_source_type, p_source_ref, p_observed_at, p_confidence
    ) RETURNING id INTO v_sesion;

    -- Una sesión cubre VARIOS temas, y sólo los que la materia declara: un
    -- nombre que no está entre las unidades no crea un tema fantasma.
    FOR t IN SELECT * FROM jsonb_array_elements(COALESCE(r->'temas', '[]'::JSONB)) LOOP
      INSERT INTO class_session_topic (class_session_id, topic_id)
      SELECT v_sesion, tp.id FROM topic tp
       WHERE tp.offering_id = v_offering AND tp.name = t #>> '{}'
      ON CONFLICT DO NOTHING;
    END LOOP;

    v_clases := v_clases + 1;
  END LOOP;

  RETURN QUERY SELECT v_offering, v_unidades, v_evals, v_clases;
END;
$$;

REVOKE ALL ON FUNCTION public.ingerir_materia FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ingerir_materia TO service_role;

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
                 'id', tp.id,
                 'codigo', tp.code,
                 'nombre', tp.name,
                 'ultimoAvanceEn', pr.recency_at,
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
         WHERE tp.offering_id = cu.offering_id), '[]'::jsonb),

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
$$;

GRANT EXECUTE ON FUNCTION public.estado_de_materia TO service_role;

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
        -- §D: las horas de **trabajo autónomo** que declara la cátedra, si las
        -- declara. Es el primer escalón, y el `1,5` pasa a ser el último.
        'cargaDeEstudio', (
          SELECT CASE WHEN o3.declared_study_min IS NULL THEN NULL
                      ELSE jsonb_build_object('minutos', o3.declared_study_min,
                                              'texto', o3.declared_study_source) END
            FROM course_offering o3 WHERE o3.id = cu.offering_id),
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
