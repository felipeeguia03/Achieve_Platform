-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · El cuarto paso del alta: comisión y horarios de cursada
--
-- [ADR-105](../../docs/decisions.md#adr-105), que construye
-- [ADR-062](../../docs/decisions.md#adr-062) y [ADR-063](../../docs/decisions.md#adr-063)
-- — cortes 3 y 4 de `plan-periodo-comision-horarios.md`.
--
-- ## Lo que agrega
--
-- 1. En `course_enrollment`: el estado de la comisión (los cuatro de ADR-062),
--    la comisión elegida y el nombre de la que no aparece; y el estado del
--    horario (ADR-063: *"guardar el estado explícito en la cursada"*).
-- 2. En `enrollment`: `course_setup_declared_at`, que el paso se contestó.
-- 3. `bloques_de_cursada()`: **la única precedencia** de bloques de una cursada.
-- 4. Los dos lectores SQL —`horarios_del_estudiante()` y `estado_de_materia()`—
--    pasan a leer de ahí.
-- 5. `opciones_de_cursada()` y `declarar_cursada()`, las dos mitades del paso.
-- 6. `estado_del_alta()` conoce el paso nuevo.
--
-- ## ⚠️ La cursada NO se muda de offering (ADR-105 §4)
--
-- Todo el contenido de la materia —temas, clases, evaluaciones, recursos,
-- horario— cuelga de la offering sin comisión que crea el alta. Mover
-- `offering_id` a la de la comisión dejaría la materia vacía por haber contestado
-- una pregunta. La comisión elegida va **al lado**, en `commission_offering_id`,
-- y mudar la cursada es trabajo del corte 7 (ADR-060).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1 · La comisión y el horario, en la cursada ──────────────────────────────

ALTER TABLE course_enrollment
  ADD COLUMN commission_status      TEXT,
  ADD COLUMN commission_offering_id UUID REFERENCES course_offering(id) ON DELETE SET NULL,
  ADD COLUMN commission_label       TEXT,
  ADD COLUMN schedule_status        TEXT;

-- ⚠️ **`NULL` es «todavía no se preguntó»**, y no es `NOT_APPLICABLE`: el plan
-- proponía ese default, pero desde que el catálogo sintético tiene comisiones
-- sería afirmar algo que nadie contestó. `NOT_APPLICABLE ≠ UNKNOWN ≠ NULL`.
ALTER TABLE course_enrollment
  ADD CONSTRAINT commission_status_canonico
    CHECK (commission_status IS NULL
           OR commission_status IN ('CONFIRMED','UNKNOWN','NOT_LISTED','NOT_APPLICABLE')),
  ADD CONSTRAINT comision_confirmada_tiene_oferta
    CHECK ((commission_status = 'CONFIRMED') = (commission_offering_id IS NOT NULL)),
  ADD CONSTRAINT comision_no_listada_tiene_nombre
    CHECK ((commission_status = 'NOT_LISTED')
           = (commission_label IS NOT NULL AND length(btrim(commission_label)) > 0)),
  ADD CONSTRAINT schedule_status_canonico
    CHECK (schedule_status IS NULL OR schedule_status IN ('KNOWN','UNKNOWN'));

COMMENT ON COLUMN course_enrollment.commission_status IS
  'ADR-062: CONFIRMED | UNKNOWN | NOT_LISTED | NOT_APPLICABLE. NULL = todavía no se preguntó. '
  'Nunca lo elige el sistema: la primera comisión no se preselecciona.';
COMMENT ON COLUMN course_enrollment.commission_offering_id IS
  'ADR-105 §4: la comisión elegida, AL LADO de offering_id. La cursada no se muda: el '
  'contenido cuelga de la offering del alta hasta que ADR-060 lo pase a la materia.';
COMMENT ON COLUMN course_enrollment.commission_label IS
  'NOT_LISTED: el nombre que escribió el estudiante. Sin verificar y no entra al catálogo.';
COMMENT ON COLUMN course_enrollment.schedule_status IS
  'ADR-063: KNOWN | UNKNOWN. UNKNOWN no deja filas horarias negativas, y la ausencia de '
  'bloques nunca se lee como disponibilidad.';

ALTER TABLE enrollment ADD COLUMN course_setup_declared_at TIMESTAMPTZ;

COMMENT ON COLUMN enrollment.course_setup_declared_at IS
  'ADR-105 §6: el estudiante contestó comisión y horarios. «No sé» cuenta como contestar.';

-- ── 2 · La precedencia de bloques, en un solo lugar (ADR-105 §5) ─────────────

CREATE OR REPLACE FUNCTION public.bloques_de_cursada(p_course_enrollment_id UUID)
RETURNS SETOF class_schedule_block
LANGUAGE sql STABLE AS $$
  WITH cu AS (
    SELECT id, offering_id, commission_status, commission_offering_id, schedule_status
      FROM course_enrollment WHERE id = p_course_enrollment_id
  ),
  declarados AS (
    SELECT b.id FROM class_schedule_block b JOIN cu ON b.course_enrollment_id = cu.id
  )
  SELECT b.*
    FROM class_schedule_block b, cu
   -- 1 · Dijo que no sabe: ninguno. La ausencia no es disponibilidad.
   WHERE COALESCE(cu.schedule_status, '') <> 'UNKNOWN'
     AND (
       -- 2 · Los que declaró él.
       b.course_enrollment_id = cu.id
       OR (NOT EXISTS (SELECT 1 FROM declarados) AND (
            -- 3 · Los publicados de su comisión.
            (cu.commission_status = 'CONFIRMED' AND b.offering_id = cu.commission_offering_id)
            -- 5 · Sin estado o sin comisiones: los de la cursada, como antes.
            -- (4 · UNKNOWN / NOT_LISTED sin declarados: ninguno.)
         OR (COALESCE(cu.commission_status, 'NOT_APPLICABLE') = 'NOT_APPLICABLE'
             AND b.offering_id = cu.offering_id)
       ))
     );
$$;

COMMENT ON FUNCTION public.bloques_de_cursada IS
  'ADR-105 §5: los bloques de una cursada, con UNA precedencia — no sabe > declarados > '
  'comisión confirmada > (sin comisión conocida: ninguno) > los de su offering. Toda '
  'superficie lee de acá.';

CREATE OR REPLACE FUNCTION public.bloques_de_cursadas(
  p_institution_id UUID,
  p_student_id     UUID
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'cursadaId', ce.id,
           'bloqueId', b.id,
           'dia', b.day_of_week,
           'desde', b.start_time,
           'hasta', b.end_time,
           'aula', b.room,
           'fuente', b.source_type)
           ORDER BY b.day_of_week ASC, b.start_time ASC), '[]'::jsonb)
    FROM course_enrollment ce
    CROSS JOIN LATERAL public.bloques_de_cursada(ce.id) b
   WHERE ce.institution_id = p_institution_id
     AND ce.student_id = p_student_id
     AND ce.status = 'active'
     AND b.institution_id = p_institution_id;
$$;

GRANT EXECUTE ON FUNCTION public.bloques_de_cursada TO service_role;
GRANT EXECUTE ON FUNCTION public.bloques_de_cursadas TO service_role;

-- ── 3 · `horarios_del_estudiante()` lee la precedencia (ADR-064) ─────────────

CREATE OR REPLACE FUNCTION public.horarios_del_estudiante(
  p_institution_id UUID,
  p_student_id     UUID
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('dia', x->'dia', 'desde', x->'desde', 'hasta', x->'hasta')), '[]'::jsonb)
    FROM jsonb_array_elements(public.bloques_de_cursadas(p_institution_id, p_student_id)) x;
$$;

-- ── 4 · Lo que el paso ofrece ────────────────────────────────────────────────
--
-- Por cursada activa: la materia, lo que ya contestó, **las comisiones reales del
-- catálogo** —misma materia, mismo período, con comisión— con su horario, y los
-- bloques que declaró. Sin comisiones la lista viaja vacía: **no se inventa una**.

CREATE OR REPLACE FUNCTION public.opciones_de_cursada(
  p_institution_id UUID,
  p_student_id     UUID
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'cursadaId', ce.id,
    'materia', c.name,
    'periodo', o.term,
    'comision', jsonb_build_object(
       'estado', ce.commission_status,
       'ofertaId', ce.commission_offering_id,
       'nombre', ce.commission_label),
    'horario', jsonb_build_object('estado', ce.schedule_status),
    'comisiones', COALESCE((
       SELECT jsonb_agg(jsonb_build_object(
                'ofertaId', o2.id,
                'nombre', o2.commission,
                'bloques', COALESCE((
                   SELECT jsonb_agg(jsonb_build_object(
                            'dia', b.day_of_week, 'desde', b.start_time, 'hasta', b.end_time,
                            'aula', b.room, 'fuente', b.source_type)
                            ORDER BY b.day_of_week, b.start_time)
                     FROM class_schedule_block b WHERE b.offering_id = o2.id), '[]'::jsonb))
                ORDER BY o2.commission)
         FROM course_offering o2
        WHERE o2.course_id = o.course_id AND o2.term = o.term AND o2.commission IS NOT NULL), '[]'::jsonb),
    -- El horario de la materia sin comisión: el de siempre, para `NOT_APPLICABLE`.
    'bloquesDeLaMateria', COALESCE((
       SELECT jsonb_agg(jsonb_build_object(
                'dia', b.day_of_week, 'desde', b.start_time, 'hasta', b.end_time,
                'aula', b.room, 'fuente', b.source_type)
                ORDER BY b.day_of_week, b.start_time)
         FROM class_schedule_block b WHERE b.offering_id = ce.offering_id), '[]'::jsonb),
    'bloquesDeclarados', COALESCE((
       SELECT jsonb_agg(jsonb_build_object(
                'dia', b.day_of_week, 'desde', b.start_time, 'hasta', b.end_time, 'aula', b.room)
                ORDER BY b.day_of_week, b.start_time)
         FROM class_schedule_block b WHERE b.course_enrollment_id = ce.id), '[]'::jsonb)
  ) ORDER BY c.name), '[]'::jsonb)
  FROM course_enrollment ce
  JOIN course_offering o ON o.id = ce.offering_id
  JOIN course c ON c.id = o.course_id
 WHERE ce.institution_id = p_institution_id
   AND ce.student_id = p_student_id
   AND ce.status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.opciones_de_cursada TO service_role;

-- ── 5 · Contestar el paso ────────────────────────────────────────────────────
--
-- `p_cursadas`: `[{ cursadaId, comision: { estado, ofertaId?, nombre? },
-- horario: { estado, bloques?: [{ dia, desde, hasta, aula? }] } }]`.
--
-- Todo en una transacción. Las validaciones de forma las hace el Service con
-- `lib/domain/cursada.ts`; acá quedan **las que sólo la base puede hacer**: que la
-- cursada sea del estudiante y que la comisión sea de esa materia y ese período.
--
-- ⚠️ **Los bloques declarados se reemplazan.** Contestar el paso es decir *"así
-- es mi semana de cursado"*, no agregar un bloque más — el mismo criterio que
-- `declarar_disponibilidad()`. Corregir un horario **después** del alta es otra
-- operación y no existe todavía (ADR-064, segunda salida).

CREATE OR REPLACE FUNCTION public.declarar_cursada(
  p_institution_id UUID,
  p_student_id     UUID,
  p_cursadas       JSONB
)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  c          JSONB;
  bl         JSONB;
  v_ce       course_enrollment%ROWTYPE;
  v_estado   TEXT;
  v_oferta   UUID;
  v_horario  TEXT;
  v_n        INTEGER := 0;
  v_faltan   INTEGER;
BEGIN
  FOR c IN SELECT * FROM jsonb_array_elements(COALESCE(p_cursadas, '[]'::jsonb)) LOOP
    SELECT * INTO v_ce FROM course_enrollment
     WHERE id = (c->>'cursadaId')::UUID
       AND institution_id = p_institution_id AND student_id = p_student_id AND status = 'active';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'CURSADA_AJENA: la cursada % no es del estudiante', c->>'cursadaId'
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    v_estado := c->'comision'->>'estado';
    v_oferta := NULL;
    IF v_estado = 'CONFIRMED' THEN
      SELECT o2.id INTO v_oferta
        FROM course_offering o2
        JOIN course_offering o ON o.id = v_ce.offering_id
       WHERE o2.id = NULLIF(c->'comision'->>'ofertaId','')::UUID
         AND o2.course_id = o.course_id AND o2.term = o.term AND o2.commission IS NOT NULL;
      IF v_oferta IS NULL THEN
        RAISE EXCEPTION 'COMISION_INVALIDA: la comisión no es de esa materia y ese período'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;

    UPDATE course_enrollment
       SET commission_status      = v_estado,
           commission_offering_id = v_oferta,
           commission_label       = CASE WHEN v_estado = 'NOT_LISTED'
                                         THEN btrim(c->'comision'->>'nombre') END
     WHERE id = v_ce.id;

    v_horario := c->'horario'->>'estado';
    DELETE FROM class_schedule_block WHERE course_enrollment_id = v_ce.id;

    IF v_horario = 'KNOWN' THEN
      FOR bl IN SELECT * FROM jsonb_array_elements(COALESCE(c->'horario'->'bloques', '[]'::jsonb)) LOOP
        INSERT INTO class_schedule_block
          (institution_id, course_enrollment_id, day_of_week, start_time, end_time, room,
           source_type, source_ref, verification_status)
        VALUES
          (p_institution_id, v_ce.id, (bl->>'dia')::SMALLINT, (bl->>'desde')::TIME, (bl->>'hasta')::TIME,
           NULLIF(btrim(bl->>'aula'), ''),
           -- ADR-063: lo declara el estudiante, sin corroborar, y nada lo eleva (I9).
           'student', 'alta: horario declarado', 'unverified');
      END LOOP;
    END IF;

    UPDATE course_enrollment SET schedule_status = v_horario WHERE id = v_ce.id;

    -- «Conozco mi horario» sin un solo bloque efectivo no es un horario: es un
    -- dato roto, y se rechaza en vez de guardar un KNOWN vacío.
    IF v_horario = 'KNOWN' AND NOT EXISTS (SELECT 1 FROM public.bloques_de_cursada(v_ce.id)) THEN
      RAISE EXCEPTION 'HORARIO_SIN_BLOQUES: la cursada % dice conocer su horario y no tiene bloques', v_ce.id
        USING ERRCODE = 'check_violation';
    END IF;

    v_n := v_n + 1;
  END LOOP;

  -- El paso queda contestado cuando **todas** las cursadas activas lo están.
  SELECT count(*) INTO v_faltan FROM course_enrollment
   WHERE institution_id = p_institution_id AND student_id = p_student_id AND status = 'active'
     AND (commission_status IS NULL OR schedule_status IS NULL);

  IF v_faltan = 0 THEN
    UPDATE enrollment SET course_setup_declared_at = COALESCE(course_setup_declared_at, NOW())
     WHERE student_id = p_student_id AND confirmed_at IS NOT NULL;
  END IF;

  RETURN jsonb_build_object('cursadas', v_n, 'faltan', v_faltan);
END;
$$;

GRANT EXECUTE ON FUNCTION public.declarar_cursada TO service_role;

-- ── 6 · El estado del alta conoce el paso ────────────────────────────────────
--
-- ⚠️ **Sin cursadas activas el paso no tiene nada que preguntar**, y cuenta como
-- contestado: un estudiante que sólo declaró una electiva por nombre no se traba
-- en una pantalla vacía.

CREATE OR REPLACE FUNCTION public.estado_del_alta(
  p_institution_id UUID,
  p_student_id     UUID
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'consentimientoRespondido', EXISTS (
       SELECT 1 FROM whatsapp_consent w
        WHERE w.student_id = p_student_id AND w.institution_id = p_institution_id),
    'carreraDeclarada', EXISTS (
       SELECT 1 FROM enrollment e
        WHERE e.student_id = p_student_id AND e.curriculum_plan_id IS NOT NULL
          AND e.curriculum_year IS NOT NULL),
    'disponibilidadRespondida', EXISTS (
       SELECT 1 FROM student s
        WHERE s.id = p_student_id AND s.institution_id = p_institution_id
          AND s.availability_declared_at IS NOT NULL),
    'materiasConfirmadas', EXISTS (
       SELECT 1 FROM enrollment e2
        WHERE e2.student_id = p_student_id AND e2.confirmed_at IS NOT NULL),
    'cursadaRespondida', (
       EXISTS (SELECT 1 FROM enrollment e4
                WHERE e4.student_id = p_student_id AND e4.course_setup_declared_at IS NOT NULL)
       OR NOT EXISTS (SELECT 1 FROM course_enrollment ce
                       WHERE ce.student_id = p_student_id AND ce.institution_id = p_institution_id
                         AND ce.status = 'active')),
    'declaracion', (
       SELECT jsonb_build_object(
                'inscripcionId', e3.id,
                'carreraId', e3.program_id,
                'planId', e3.curriculum_plan_id,
                'anio', e3.curriculum_year,
                'periodo', e3.term,
                'anioLectivo', e3.academic_year,
                'semestre', e3.semester,
                'confirmadaEn', e3.confirmed_at)
         FROM enrollment e3
        WHERE e3.student_id = p_student_id AND e3.curriculum_plan_id IS NOT NULL
        ORDER BY e3.created_at DESC LIMIT 1)
  );
$$;

-- ── 7 · `estado_de_materia()` lee la precedencia, y dice la comisión ─────────
--
-- Se reescribe **desde la definición vigente** —sólo cambia el origen de
-- `horario` y se agrega `comision`—, para no perder nada de lo que las
-- migraciones anteriores le sumaron.

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
    -- ── Qué parte de esta materia la declaró la cátedra · ADR-086 ────────────
    --
    -- `topic` **no lleva procedencia** y no se le agrega (ADR-081 lo dice
    -- explícito), así que el origen del temario se lee de su material y el del
    -- calendario de sus clases. Tres valores y ninguno inventado:
    --
    --   'estimado'             — todo lo generó Achieve: las unidades también.
    --   'calendario_estimado'  — las unidades salieron del programa oficial,
    --                            pero las fechas y los pesos los puso Achieve.
    --   NULL                   — no hay nada que advertir.
    --
    -- ⚠️ **`NULL` no significa «verificado».** Significa que ninguna fila dice
    -- `inference`. Lo que la cátedra corroboró se lee en `verification_status`,
    -- que esta clave **no toca** (`I9`).
    'contenido', (SELECT CASE
        WHEN EXISTS (SELECT 1 FROM resource r9
                      WHERE r9.offering_id = cu.offering_id AND r9.source_type = 'inference')
         AND NOT EXISTS (SELECT 1 FROM resource r8
                          WHERE r8.offering_id = cu.offering_id AND r8.source_type <> 'inference')
          THEN 'estimado'
        WHEN EXISTS (SELECT 1 FROM class_session cs9
                      WHERE cs9.offering_id = cu.offering_id AND cs9.source_type = 'inference')
          THEN 'calendario_estimado'
        ELSE NULL END),
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
                 'aula', b.room,
                 'origen', CASE WHEN b.offering_id IS NOT NULL THEN 'catedra' ELSE 'vos' END,
                 'fuente', b.source_type,
                 'verificacion', b.verification_status)
                 ORDER BY b.day_of_week ASC, b.start_time ASC)
          FROM public.bloques_de_cursada(cu.id) b), '[]'::jsonb),
    -- ADR-062 · ADR-105: lo que contestó sobre su comisión. `NULL` ⇒ no se preguntó.
    'comision', (SELECT jsonb_build_object(
                   'estado', ce9.commission_status,
                   'nombre', COALESCE(o9.commission, ce9.commission_label),
                   'horario', ce9.schedule_status)
                   FROM course_enrollment ce9
                   LEFT JOIN course_offering o9 ON o9.id = ce9.commission_offering_id
                  WHERE ce9.id = cu.id),
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
