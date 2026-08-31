-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Fase B2b — ingesta del Academic Data Layer
--
-- ADR-023. Estructura conocimiento académico; **no recomienda nada**.
--
-- La ingesta es **reemplazo por cursada, no acumulación**: si el programa se
-- vuelve a cargar, la cursada queda con las unidades del material nuevo. Sin
-- esto, cargar dos veces el mismo PDF duplica el programa entero.
-- ─────────────────────────────────────────────────────────────────────────────

/**
 * Ingiere una materia completa en una transacción.
 *
 * **`verification_status` no es parámetro.** Todo entra `unverified` y no hay
 * forma de pedir otra cosa desde acá: es `I9` —*"ninguna capa eleva un
 * `verification_status`"*— hecho imposible en vez de prohibido. Corroborar es
 * una operación distinta, de alguien con autoridad.
 *
 * **No toca `instructor`.** Un programa suele traer el nombre del docente, y un
 * docente es una persona real (ADR-023).
 */
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
  p_unidades       JSONB,   -- [{codigo,nombre,orden}]
  p_prerequisitos  JSONB,   -- [{unidad,requiere}]
  p_evaluaciones   JSONB    -- [{tipo,titulo,fecha,modalidad,alcance}]
)
RETURNS TABLE (cursada_id UUID, unidades INTEGER, evaluaciones INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  v_program_id UUID;
  v_plan_id    UUID;
  v_course_id  UUID;
  v_offering   UUID;
  v_unidades   INTEGER := 0;
  v_evals      INTEGER := 0;
  r            JSONB;
BEGIN
  -- El ingestor asistido no conoce programa ni plan: el material de una materia
  -- no los trae. Se usa un contenedor por institución, explícito y reconocible,
  -- en vez de inventar una estructura curricular que nadie declaró.
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
  DELETE FROM topic WHERE offering_id = v_offering;
  DELETE FROM assessment WHERE offering_id = v_offering;

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

  RETURN QUERY SELECT v_offering, v_unidades, v_evals;
END;
$$;

REVOKE ALL ON FUNCTION public.ingerir_materia FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ingerir_materia TO service_role;
