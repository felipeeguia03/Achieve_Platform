-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.14.3 — las opciones de un cupo electivo
--
-- [ADR-051](../../docs/decisions.md#adr-051). `elective_option` existe desde la
-- migración del catálogo y **el importador no tenía cómo llenarla**: un cupo sin
-- opciones sólo deja al estudiante escribir el nombre a mano.
--
-- Se agrega en una migración propia y no editando la anterior: una migración
-- aplicada no se edita. `CREATE OR REPLACE` con la misma firma reemplaza la
-- función; los llamadores no cambian.
--
-- El requisito ahora acepta `elective_for`: el **código** del cupo que esa
-- materia puede satisfacer. Se resuelve en una segunda pasada, cuando todos los
-- requisitos del plan ya existen — si no, una materia no podría ser opción de un
-- cupo declarado más abajo en el archivo.
-- ─────────────────────────────────────────────────────────────────────────────

-- El retorno gana una columna, y Postgres no deja cambiarlo con
-- `CREATE OR REPLACE`: hay que soltar la función primero.
DROP FUNCTION IF EXISTS public.ingerir_plan_de_estudios(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, DATE, TEXT, TEXT, TIMESTAMPTZ, NUMERIC, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.ingerir_plan_de_estudios(
  p_institution_key   TEXT,
  p_institution_name  TEXT,
  p_academic_unit_key TEXT,
  p_academic_unit_name TEXT,
  p_program_key       TEXT,
  p_program_name      TEXT,
  p_plan_version      TEXT,
  p_plan_valid_from   DATE,
  p_plan_valid_until  DATE,
  p_source_type       TEXT,
  p_source_ref        TEXT,
  p_observed_at       TIMESTAMPTZ,
  p_confidence        NUMERIC,
  p_content_hash      TEXT,
  p_requisitos        JSONB
)
RETURNS TABLE (plan_id UUID, requisitos INTEGER, materias INTEGER, opciones INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  v_institution UUID;
  v_unit        UUID;
  v_program     UUID;
  v_plan        UUID;
  v_course      UUID;
  v_reqs        INTEGER := 0;
  v_materias    INTEGER := 0;
  v_opciones    INTEGER := 0;
  v_tipo        TEXT;
  v_cupo        UUID;
  r             JSONB;
BEGIN
  IF p_source_ref IS NULL OR length(btrim(p_source_ref)) = 0 THEN
    RAISE EXCEPTION 'la fuente necesita una referencia concreta: "lo dijo alguien" no se puede corroborar'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT id INTO v_institution FROM institution WHERE key = p_institution_key;
  IF v_institution IS NULL THEN
    INSERT INTO institution (name, key) VALUES (p_institution_name, p_institution_key)
      RETURNING id INTO v_institution;
  ELSE
    UPDATE institution SET name = p_institution_name WHERE id = v_institution;
  END IF;

  IF p_academic_unit_key IS NOT NULL THEN
    SELECT id INTO v_unit FROM academic_unit
     WHERE institution_id = v_institution AND key = p_academic_unit_key;
    IF v_unit IS NULL THEN
      INSERT INTO academic_unit (institution_id, key, name)
      VALUES (v_institution, p_academic_unit_key, p_academic_unit_name)
        RETURNING id INTO v_unit;
    ELSE
      UPDATE academic_unit SET name = p_academic_unit_name WHERE id = v_unit;
    END IF;
  END IF;

  SELECT id INTO v_program FROM academic_program
   WHERE institution_id = v_institution AND key = p_program_key;
  IF v_program IS NULL THEN
    INSERT INTO academic_program (institution_id, key, name, academic_unit_id)
    VALUES (v_institution, p_program_key, p_program_name, v_unit) RETURNING id INTO v_program;
  ELSE
    UPDATE academic_program SET name = p_program_name, academic_unit_id = v_unit
     WHERE id = v_program;
  END IF;

  SELECT id INTO v_plan FROM curriculum_plan
   WHERE program_id = v_program AND version = p_plan_version;
  IF v_plan IS NULL THEN
    INSERT INTO curriculum_plan (program_id, version, valid_from, valid_until,
                                 source_type, source_ref, observed_at, content_hash)
    VALUES (v_program, p_plan_version, p_plan_valid_from, p_plan_valid_until,
            p_source_type, p_source_ref, p_observed_at, p_content_hash)
      RETURNING id INTO v_plan;
  ELSE
    UPDATE curriculum_plan
       SET valid_from = p_plan_valid_from, valid_until = p_plan_valid_until,
           source_type = p_source_type, source_ref = p_source_ref,
           observed_at = p_observed_at, content_hash = p_content_hash
     WHERE id = v_plan;
  END IF;

  -- Reemplazo, no acumulación. Las opciones caen con su cupo (ON DELETE CASCADE);
  -- los `course` **no** se borran: pueden tener cursadas y estudiantes colgando.
  DELETE FROM curriculum_requirement WHERE curriculum_plan_id = v_plan;

  -- ── Primera pasada: los requisitos ─────────────────────────────────────────
  FOR r IN SELECT * FROM jsonb_array_elements(p_requisitos) LOOP
    v_tipo := COALESCE(r->>'requirement_type', 'UNKNOWN');
    v_course := NULL;

    IF v_tipo = 'COURSE' THEN
      SELECT id INTO v_course FROM course
       WHERE curriculum_plan_id = v_plan AND code = r->>'code';
      IF v_course IS NULL THEN
        INSERT INTO course (curriculum_plan_id, code, name)
        VALUES (v_plan, r->>'code', r->>'label') RETURNING id INTO v_course;
      ELSE
        UPDATE course SET name = r->>'label' WHERE id = v_course;
      END IF;
      v_materias := v_materias + 1;
    END IF;

    INSERT INTO curriculum_requirement (
      curriculum_plan_id, ordinal, code, label, requirement_type,
      curriculum_year, year_source, term, is_annual, course_id,
      min_options, max_options, label_truncated, needs_review,
      source_type, source_ref, observed_at, confidence
    ) VALUES (
      v_plan, (r->>'ordinal')::INTEGER, r->>'code', r->>'label', v_tipo,
      NULLIF(r->>'curriculum_year','')::SMALLINT,
      NULLIF(r->>'year_source',''),
      NULLIF(r->>'term',''),
      NULLIF(r->>'is_annual','')::BOOLEAN,
      v_course,
      NULLIF(r->>'min_options','')::SMALLINT,
      NULLIF(r->>'max_options','')::SMALLINT,
      COALESCE(NULLIF(r->>'label_truncated','')::BOOLEAN, FALSE),
      COALESCE(NULLIF(r->>'needs_review','')::BOOLEAN, TRUE),
      p_source_type, p_source_ref, p_observed_at, p_confidence
    );
    v_reqs := v_reqs + 1;
  END LOOP;

  -- ── Segunda pasada: qué materia puede satisfacer qué cupo ─────────────────
  --
  -- Va después porque una materia puede ser opción de un cupo que el archivo
  -- declara más abajo. Y **falla si el cupo no existe**: una opción que apunta a
  -- un requisito inexistente es un typo, no un dato.
  FOR r IN SELECT * FROM jsonb_array_elements(p_requisitos) LOOP
    IF NULLIF(r->>'elective_for','') IS NULL THEN CONTINUE; END IF;

    SELECT id INTO v_cupo FROM curriculum_requirement
     WHERE curriculum_plan_id = v_plan AND code = r->>'elective_for';
    IF v_cupo IS NULL THEN
      RAISE EXCEPTION 'la materia % dice satisfacer el cupo %, que no existe en el plan',
        r->>'code', r->>'elective_for' USING ERRCODE = 'foreign_key_violation';
    END IF;

    SELECT id INTO v_course FROM course
     WHERE curriculum_plan_id = v_plan AND code = r->>'code';

    -- El trigger `elective_option_solo_sobre_cupo` rechaza si el destino no es
    -- un cupo. No se comprueba dos veces.
    INSERT INTO elective_option (curriculum_requirement_id, course_id, source_type, source_ref, observed_at)
    VALUES (v_cupo, v_course, p_source_type, p_source_ref, p_observed_at)
    ON CONFLICT DO NOTHING;
    v_opciones := v_opciones + 1;
  END LOOP;

  RETURN QUERY SELECT v_plan, v_reqs, v_materias, v_opciones;
END;
$$;

COMMENT ON FUNCTION public.ingerir_plan_de_estudios IS
  'Ingiere un plan completo, con sus opciones electivas en una segunda pasada. Todo entra '
  'DRAFT y no hay parámetro para pedir otra cosa: publicar es una operación aparte (ADR-051).';

REVOKE ALL ON FUNCTION public.ingerir_plan_de_estudios FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ingerir_plan_de_estudios TO service_role;
