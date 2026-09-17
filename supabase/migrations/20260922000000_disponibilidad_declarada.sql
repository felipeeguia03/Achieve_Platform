-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · La disponibilidad se declara
--
-- Ejecuta [ADR-073](../../docs/decisions.md#adr-073).
--
-- **El mismo agujero que ADR-067 encontró con `assessment`.** `availability`
-- existe desde la Fase B1 y ninguna ruta la escribe: sólo la siembra
-- `db-demo.sh`. Y el ADE la lee como `MIN(capacity_min)` —el mínimo, nunca la
-- suma—, así que sirve para dimensionar un bloque y no sabe cuánto tiempo hay
-- por semana. Para un estudiante real eso es `NULL`, porque no tiene filas.
--
-- ## La columna que hace falta, y por qué no alcanzaba con las filas
--
-- ⚠️ **Cero filas significa dos cosas a la vez**: «no se lo preguntamos» y «lo
-- preguntamos y dijo que no sabe». Sin distinguirlas, el alta le volvería a
-- preguntar para siempre al que ya contestó.
--
-- Mismo problema que resolvió `whatsapp_consent` con una decisión explícita, y
-- misma forma de resolverlo: **el hecho de haber contestado se registra aparte
-- del contenido de la respuesta**.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE student ADD COLUMN availability_declared_at TIMESTAMPTZ;

COMMENT ON COLUMN student.availability_declared_at IS
  'Cuándo contestó la pregunta de disponibilidad, HAYA declarado bloques o no (ADR-073). '
  'NULL = todavía no se le preguntó. Cero filas en availability con esta columna puesta '
  'significa "me lo preguntaron y no sé", que es una respuesta legítima y no bloquea el alta.';

-- ── El escritor ──────────────────────────────────────────────────────────────
--
-- Reemplazo completo, no acumulación: declarar la disponibilidad es decir
-- **cómo es tu semana**, no agregar un bloque más. Sin esto, corregir un horario
-- dejaría el viejo conviviendo con el nuevo y la suma daría el doble.
--
-- ⚠️ **Una lista vacía es una respuesta.** Marca la columna y no deja filas: es
-- el «no sé» del ADR, y tiene que ser expresable.

CREATE OR REPLACE FUNCTION public.declarar_disponibilidad(
  p_institution_id UUID,
  p_student_id     UUID,
  -- `[{"dia":1,"desde":"18:00","hasta":"20:00","minutos":90}, ...]`
  p_bloques        JSONB DEFAULT '[]'::JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  r JSONB;
  v_n INTEGER := 0;
BEGIN
  -- El estudiante tiene que ser de esta institución. Sin esto, un id ajeno
  -- escribiría la semana de otro.
  IF NOT EXISTS (SELECT 1 FROM student s
                  WHERE s.id = p_student_id AND s.institution_id = p_institution_id) THEN
    RETURN NULL;
  END IF;

  DELETE FROM availability WHERE student_id = p_student_id AND source = 'declared';

  FOR r IN SELECT * FROM jsonb_array_elements(COALESCE(p_bloques, '[]'::JSONB)) LOOP
    INSERT INTO availability (student_id, day_of_week, start_time, end_time, capacity_min, source)
    VALUES (p_student_id, (r->>'dia')::SMALLINT, (r->>'desde')::TIME, (r->>'hasta')::TIME,
            (r->>'minutos')::INTEGER, 'declared');
    v_n := v_n + 1;
  END LOOP;

  -- ⚠️ **Se marca aunque no haya bloques.** Es lo que distingue «no sé» de «no
  -- me preguntaron», y lo que impide que el alta pregunte para siempre.
  UPDATE student SET availability_declared_at = NOW() WHERE id = p_student_id;

  RETURN v_n;
END;
$$;

COMMENT ON FUNCTION public.declarar_disponibilidad IS
  'ADR-073. Reemplaza los bloques `declared` del estudiante. Una lista vacía es una respuesta '
  'válida: marca availability_declared_at y no deja filas. NO toca los `observed` ni los `inferred`.';

REVOKE ALL ON FUNCTION public.declarar_disponibilidad FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.declarar_disponibilidad TO service_role;

-- Las lecturas del reparto suman por estudiante; sin índice cada una escanea.
CREATE INDEX availability_por_estudiante ON availability (student_id);

-- ── `estado_del_alta()` conoce el paso nuevo ─────────────────────────────────

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
    -- ⚠️ **Contestó la pregunta, haya declarado bloques o no** (ADR-073). Cero
    -- filas en `availability` significaría dos cosas a la vez: «no se lo
    -- preguntamos» y «dijo que no sabe». La columna las separa, y sin ella el
    -- alta le volvería a preguntar para siempre al que ya contestó.
    'disponibilidadRespondida', EXISTS (
       SELECT 1 FROM student s
        WHERE s.id = p_student_id AND s.institution_id = p_institution_id
          AND s.availability_declared_at IS NOT NULL),
    'materiasConfirmadas', EXISTS (
       SELECT 1 FROM enrollment e2
        WHERE e2.student_id = p_student_id AND e2.confirmed_at IS NOT NULL),
    'declaracion', (
       SELECT jsonb_build_object(
                'inscripcionId', e3.id,
                'carreraId', e3.program_id,
                'planId', e3.curriculum_plan_id,
                'anio', e3.curriculum_year,
                'periodo', e3.term,
                'confirmadaEn', e3.confirmed_at)
         FROM enrollment e3
        WHERE e3.student_id = p_student_id AND e3.curriculum_plan_id IS NOT NULL
        ORDER BY e3.created_at DESC LIMIT 1)
  );
$$;

GRANT EXECUTE ON FUNCTION public.estado_del_alta TO service_role;
