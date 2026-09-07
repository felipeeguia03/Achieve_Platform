-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · La ingesta escribe las sesiones, y deja de pisar al alumno
--
-- Ejecuta [ADR-068](../../docs/decisions.md#adr-068) y
-- [ADR-069](../../docs/decisions.md#adr-069), y **corrige un defecto que
-- introdujo el corte anterior**.
--
-- ## El defecto, primero
--
-- `ingerir_materia` hacía `DELETE FROM assessment WHERE offering_id = ...`
-- antes de cargar las nuevas. Con [ADR-067](../../docs/decisions.md#adr-067)
-- una `assessment` puede tener `declared_by`, así que **una ingesta de material
-- de cátedra le borraba al estudiante el final que él había cargado**, sin
-- aviso y sin dejar rastro.
--
-- No era un defecto antes de ayer: nadie podía declarar evaluaciones. Lo pasó a
-- ser en el mismo commit que dio el alta, y por eso se arregla acá.
--
-- **La regla: la ingesta reemplaza lo que la ingesta trajo.**
--
-- ## Y lo que agrega
--
-- Sin esto, las columnas de duración quedarían sin escritor — exactamente el
-- problema que ADR-067 documentó sobre `assessment`.
-- ─────────────────────────────────────────────────────────────────────────────

-- La firma cambia de aridad: hay que borrar la anterior o quedan las dos.
DROP FUNCTION IF EXISTS public.ingerir_materia(
  UUID, TEXT, TEXT, TIMESTAMPTZ, NUMERIC, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, UUID);

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
  p_carga_texto    TEXT DEFAULT NULL
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
