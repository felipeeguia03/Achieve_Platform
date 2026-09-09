-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · `topic` gana identidad estable y deja de borrarse
--
-- Ejecuta [ADR-081](../../docs/decisions.md#adr-081).
--
-- ## El defecto que cierra, medido y no supuesto
--
-- Cargar dos veces la misma materia **destruía el trabajo del estudiante**:
--
--   topic_progress de la cursada    1 → 0
--   action ancladas a un tema       2 → 0
--   action con topic_id NULL        —  → 7
--
-- En silencio: sin `audit_log`, sin evento. Y el ADE volvía a ver todo como
-- `no_information`, recomendando como si nunca hubiera pasado nada.
--
-- ## Qué cambia
--
-- 1. `topic.retired_at` — retirar no es borrar.
-- 2. Clave natural `(pertenencia, COALESCE(code, name))`, en índices parciales
--    porque `topic_belongs_somewhere` admite offering **o** course (ADR-060).
-- 3. `ingerir_materia` upsertea en vez de borrar, y retira lo ausente.
-- 4. Las lecturas que **enumeran el programa** excluyen lo retirado. Las que
--    **resuelven el nombre de un tema ya anclado** NO: si una acción quedó
--    apuntando a una unidad retirada, mostrar su nombre es más honesto que
--    mostrar nada.
--
-- ⚠️ **El índice se agrega sin deduplicar.** Si un catálogo trae códigos
-- repetidos, la migración **falla ruidosamente**: elegir cuál de dos unidades
-- homónimas sobrevive es una decisión de contenido, no de schema.
--
-- ⚠️ **Esto NO agrega procedencia a `topic`.** `source_type` y
-- `verification_status` siguen sin existir ahí. Hace la identidad estable
-- —precondición para poder atribuir algo— y no atribuye nada todavía.
-- ─────────────────────────────────────────────────────────────────────────────

-- `NULL` ⇒ vigente. Un instante y no un booleano: **cuándo** dejó de estar en el
-- programa es un hecho que se va a querer saber.
ALTER TABLE topic ADD COLUMN IF NOT EXISTS retired_at TIMESTAMPTZ;

COMMENT ON COLUMN topic.retired_at IS
  'ADR-081. NULL = la unidad está en el programa vigente. Con valor = la ingesta dejó de traerla. '
  'RETIRAR NO ES BORRAR: el progreso del estudiante sobre esa unidad sigue siendo cierto.';

-- Los dos índices parciales. `COALESCE(code, name)` porque `codigo` es opcional
-- en el contrato del servicio y el nombre ya era identificador en la ingesta.
CREATE UNIQUE INDEX IF NOT EXISTS topic_clave_natural_offering
  ON topic (offering_id, COALESCE(code, name)) WHERE offering_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS topic_clave_natural_course
  ON topic (course_id, COALESCE(code, name)) WHERE course_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.ingerir_materia(p_institution_id uuid, p_source_type text, p_source_ref text, p_observed_at timestamp with time zone, p_confidence numeric, p_course_code text, p_course_name text, p_term text, p_commission text, p_unidades jsonb, p_prerequisitos jsonb, p_evaluaciones jsonb, p_curriculum_plan_id uuid DEFAULT NULL::uuid, p_clases jsonb DEFAULT '[]'::jsonb, p_carga_min integer DEFAULT NULL::integer, p_carga_texto text DEFAULT NULL::text, p_estudio_min integer DEFAULT NULL::integer, p_estudio_texto text DEFAULT NULL::text)
 RETURNS TABLE(cursada_id uuid, unidades integer, evaluaciones integer, clases integer)
 LANGUAGE plpgsql
AS $function$
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
  -- ⚠️ **Las unidades YA NO se borran** — [ADR-081](../../docs/decisions.md#adr-081).
  --
  -- El `DELETE` que estaba acá **destruía el trabajo del estudiante**, medido:
  -- `topic_progress` de la cursada pasaba de 1 a 0 y las `action` ancladas
  -- perdían su tema. Doce tablas apuntan a `topic`; cuatro con `CASCADE` —que
  -- borran la fila— y siete con `SET NULL` —que la dejan huérfana—.
  --
  -- Y el ADE volvía a ver todo como `no_information`: recomendaba como si el
  -- estudiante nunca hubiera hecho nada.
  --
  -- Ahora hay clave natural y las unidades se **upsertean**; lo que no viene se
  -- **retira**, que no es lo mismo que borrar. El progreso sobre una unidad que
  -- la cátedra sacó del programa **sigue siendo cierto**: el estudiante lo hizo.
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

  -- ── Las unidades, por clave natural · ADR-081 ────────────────────────────
  --
  -- **La clave es `coalesce(code, name)`**, y no es una invención de esta
  -- migración: los prerequisitos de más abajo **ya emparejaban por nombre**
  -- (`t.name = r->>'unidad'`), así que el nombre ya era identificador en esta
  -- función. `codigo` es opcional en el contrato del servicio, así que exigirlo
  -- rompería a los llamadores.
  --
  -- ⚠️ **Limitación conocida de una unidad sin código:** su identidad ES su
  -- nombre, así que renombrarla es indistinguible de reemplazarla —la vieja se
  -- retira y nace otra—. Es el argumento para que el programa traiga códigos.
  FOR r IN SELECT * FROM jsonb_array_elements(p_unidades) LOOP
    INSERT INTO topic (offering_id, code, name, sequence)
    VALUES (v_offering, r->>'codigo', r->>'nombre', (r->>'orden')::INTEGER)
    ON CONFLICT (offering_id, COALESCE(code, name)) WHERE offering_id IS NOT NULL
    -- ⚠️ **`code` no se actualiza.** Es parte de la clave: cambiarlo sería
    -- mover la identidad de la fila sin que nadie lo pida.
    DO UPDATE SET name = EXCLUDED.name,
                  sequence = EXCLUDED.sequence,
                  -- Vuelve a estar en el programa: deja de estar retirada.
                  retired_at = NULL;
    v_unidades := v_unidades + 1;
  END LOOP;

  -- ⚠️ **Lo que ya no viene se RETIRA, no se borra.** Sus filas dependientes
  -- —progreso, acciones, evidencia— sobreviven intactas.
  UPDATE topic SET retired_at = NOW()
   WHERE offering_id = v_offering
     AND retired_at IS NULL
     AND COALESCE(code, name) NOT IN (
       SELECT COALESCE(u->>'codigo', u->>'nombre')
         FROM jsonb_array_elements(p_unidades) u);

  -- ⚠️ **Los prerequisitos SÍ se reemplazan, y ahora hay que borrarlos a mano.**
  -- Antes se iban por `CASCADE` al borrarse el tema. Con las unidades vivas se
  -- acumularían corrida tras corrida.
  DELETE FROM topic_prerequisite tp
   USING topic t
   WHERE tp.topic_id = t.id AND t.offering_id = v_offering;

  -- Prerequisitos EXPLÍCITOS. Nunca se derivan de `sequence`.
  FOR r IN SELECT * FROM jsonb_array_elements(COALESCE(p_prerequisitos, '[]'::JSONB)) LOOP
    INSERT INTO topic_prerequisite (topic_id, prerequisite_id)
    SELECT t.id, p.id
      FROM topic t, topic p
     WHERE t.offering_id = v_offering AND t.name = r->>'unidad' AND t.retired_at IS NULL
       AND p.offering_id = v_offering AND p.name = r->>'requiere' AND p.retired_at IS NULL;
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
$function$;


-- ── Las lecturas que enumeran el programa · ADR-081 ──────────────────────────
--
-- Cuatro funciones cambian. Las que **resuelven el nombre de un tema ya
-- anclado** —`estado_de_accion`, `estado_de_evidencia`, `estado_de_paso`,
-- `estado_de_progreso` y el `LEFT JOIN topic` de `estado_de_materia`— **NO se
-- tocan**: si una acción quedó apuntando a una unidad retirada, mostrar su
-- nombre es más honesto que mostrar nada.

-- · contexto_del_ade
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

-- · estado_de_materia
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
        SELECT 1 FROM topic tp WHERE tp.offering_id = cu.offering_id AND tp.retired_at IS NULL),
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

-- · estado_del_dia
CREATE OR REPLACE FUNCTION public.estado_del_dia(p_institution_id uuid, p_student_id uuid, p_ahora timestamp with time zone)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
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
                 'id', av.id,
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
           AND NOT EXISTS (SELECT 1 FROM topic tp WHERE tp.offering_id = ce5.offering_id AND tp.retired_at IS NULL)),
    'materias', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
                 -- La **cursada**, no la materia del catálogo: es lo que
                 -- identifica "esta materia para este estudiante", y es lo que
                 -- aceptan `estado_de_materia()` y `GET /api/materia`.
                 'cursadaId', ce6.id,
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
                 'tono', 'neutral')
               -- El orden es el declarado, no uno inferido. Ver el encabezado.
               ORDER BY ce6.created_at ASC, c6.name ASC, ce6.id ASC)
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
                 'necesitaPersona', rs.status = 'INTERVENTION_REQUIRED',
                 -- El acompañamiento, si alguien ya lo tomó. `NULL` ⇒ nadie
                 -- todavía. **No es el operador**: es sólo en qué estado está
                 -- la intervención, que es lo único que la matriz de
                 -- visibilidad (§4.1) le da al estudiante de un hecho humano.
                 'intervencion', (SELECT i.status FROM intervention i
                                   WHERE i.risk_signal_id = rs.id
                                   ORDER BY i.started_at DESC LIMIT 1))
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
$function$;

-- · insumos_de_reparto
CREATE OR REPLACE FUNCTION public.insumos_de_reparto(p_institution_id uuid, p_student_id uuid, p_ahora timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
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
        -- ── La próxima evaluación, para el índice · ADR-077 ────────────────
        --
        -- La MISMA fila que eligió `diasHastaEvaluacion`: el índice muestra
        -- *"Final 12 sep · escrito"* al lado de *"15 d"*, y si las dos cosas
        -- salieran de subconsultas con criterios distintos podrían hablar de
        -- evaluaciones distintas sin que nada lo delate.
        --
        -- `NULL` ⇒ **no hay evaluación con fecha futura**, y la fila dice
        -- *"Sin evaluación cargada"*. No se cae a la más reciente pasada: una
        -- evaluación que ya ocurrió no es la próxima.
        'evaluacion', (
          SELECT jsonb_build_object(
                   'titulo', ev4.title,
                   'tipo', ev4.assessment_type,
                   -- ⚠️ **`modality` y `assessment_type` no son lo mismo.** El
                   -- tipo dice qué instancia es —parcial, final—; la modalidad,
                   -- cómo se rinde —oral, escrito—. El índice muestra las dos
                   -- porque responden preguntas distintas, y `NULL` en
                   -- cualquiera de las dos **se omite, no se completa**.
                   'modalidad', ev4.modality,
                   'fecha', ev4.assessment_date)
            FROM assessment ev4
           WHERE ev4.offering_id = cu.offering_id
             AND ev4.assessment_date IS NOT NULL
             AND ev4.assessment_date >= p_ahora::DATE
             AND (ev4.declared_by IS NULL OR ev4.declared_by = p_student_id)
           ORDER BY ev4.assessment_date LIMIT 1),
        -- ISO o `null`. `null` ⇒ *"Sin avance registrado"*, que **no es**
        -- «hace 0 días» (`P-09`). Misma fuente que la cola de `HOY`, para que
        -- las dos superficies no discrepen sobre la misma materia.
        -- ── La punta izquierda de la ventana · ADR-078 ─────────────────────
        --
        -- **La primera clase dictada, que es un hecho.** `NULL` ⇒ no hay
        -- ninguna cargada, y entonces la barra empieza en el borde del eje
        -- **diciéndolo**: hay plazo, y no se sabe desde cuándo se viene
        -- preparando.
        --
        -- ⚠️ **No se manda la fecha de cada clase.** Con dieciséis materias eso
        -- multiplicaría el payload para dibujar un solo punto. La punta derecha
        -- ya viaja en `evaluacion.fecha`.
        'primeraClase', (
          SELECT MIN(cs2.session_date) FROM class_session cs2
           WHERE cs2.offering_id = cu.offering_id),
        'ultimoAvanceEn', (
          SELECT MAX(tp7.recency_at) FROM topic_progress tp7
           WHERE tp7.course_enrollment_id = cu.id),
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
            -- ADR-081: lo retirado no entra al denominador de la cobertura.
            FROM topic tp WHERE tp.offering_id = cu.offering_id AND tp.retired_at IS NULL), '[]'::jsonb),
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
$function$;
