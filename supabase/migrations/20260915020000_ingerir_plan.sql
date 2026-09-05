-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.14.3 — la ingesta de un plan de estudios
--
-- [ADR-051](../../docs/decisions.md#adr-051). La hermana de `ingerir_materia()`
-- un nivel más arriba: aquélla ingiere el material de **una cursada**, ésta la
-- **estructura curricular** que aquélla no podía conocer.
--
-- Misma disciplina que la B2b.1, y por los mismos motivos:
--
--   · Procedencia obligatoria, y una fuente sin referencia concreta se rechaza:
--     "lo dijo alguien" no se puede volver a mirar, así que no se podría
--     corroborar nunca.
--   · **Reemplazo por plan, no acumulación.** Sin esto, importar dos veces el
--     mismo CSV duplica el plan entero.
--   · **`publication_status` no es parámetro.** Todo entra `DRAFT` y no hay
--     forma de pedir otra cosa desde acá — igual que `verification_status` en
--     `ingerir_materia()`. Publicar es una operación distinta, de alguien que
--     mira el plan y decide que se puede mostrar.
--
-- ⚠️ ADR-006 sigue `PROVISIONAL`. El plan real de una institución entra `DRAFT`
-- y ahí se queda hasta que `C01-052` y `C01-042` se cierren (ADR-053).
-- ─────────────────────────────────────────────────────────────────────────────

/**
 * Ingiere un plan de estudios completo en una transacción.
 *
 * `p_requisitos` es un array de objetos con:
 *   { ordinal, code, label, requirement_type, curriculum_year, year_source,
 *     term, is_annual, label_truncated, needs_review, min_options, max_options }
 *
 * Devuelve el plan, cuántos requisitos entraron y cuántos de ellos son materias
 * concretas — que **no es el mismo número**, y ése es el punto de ADR-051.
 */
CREATE OR REPLACE FUNCTION public.ingerir_plan_de_estudios(
  p_institution_key   TEXT,
  p_institution_name  TEXT,
  p_academic_unit_key TEXT,     -- NULL: la fuente no declara facultad. No se infiere.
  p_academic_unit_name TEXT,
  p_program_key       TEXT,
  p_program_name      TEXT,
  p_plan_version      TEXT,     -- el `plan_code` del CSV. La clave natural ya existía.
  p_plan_valid_from   DATE,
  p_plan_valid_until  DATE,
  p_source_type       TEXT,
  p_source_ref        TEXT,
  p_observed_at       TIMESTAMPTZ,
  p_confidence        NUMERIC,
  p_content_hash      TEXT,
  p_requisitos        JSONB
)
RETURNS TABLE (plan_id UUID, requisitos INTEGER, materias INTEGER)
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
  v_tipo        TEXT;
  r             JSONB;
BEGIN
  IF p_source_ref IS NULL OR length(btrim(p_source_ref)) = 0 THEN
    RAISE EXCEPTION 'la fuente necesita una referencia concreta: "lo dijo alguien" no se puede corroborar'
      USING ERRCODE = 'check_violation';
  END IF;

  -- ── Institución ────────────────────────────────────────────────────────────
  SELECT id INTO v_institution FROM institution WHERE key = p_institution_key;
  IF v_institution IS NULL THEN
    INSERT INTO institution (name, key) VALUES (p_institution_name, p_institution_key)
      RETURNING id INTO v_institution;
  ELSE
    UPDATE institution SET name = p_institution_name WHERE id = v_institution;
  END IF;

  -- ── Facultad, sólo si la fuente la declara ────────────────────────────────
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

  -- ── Carrera ────────────────────────────────────────────────────────────────
  SELECT id INTO v_program FROM academic_program
   WHERE institution_id = v_institution AND key = p_program_key;
  IF v_program IS NULL THEN
    INSERT INTO academic_program (institution_id, key, name, academic_unit_id)
    VALUES (v_institution, p_program_key, p_program_name, v_unit) RETURNING id INTO v_program;
  ELSE
    UPDATE academic_program SET name = p_program_name, academic_unit_id = v_unit
     WHERE id = v_program;
  END IF;

  -- ── El plan. Entra DRAFT y no hay parámetro para pedir otra cosa. ─────────
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

  -- ── Reemplazo, no acumulación ──────────────────────────────────────────────
  --
  -- Se borran los requisitos, **no los `course`**: una materia puede tener
  -- cursadas y estudiantes inscriptos colgando, y un reimport no puede
  -- llevárselos por delante. Un `course` que deja de estar en el plan queda sin
  -- requisito que lo nombre, y así se lo ve.
  DELETE FROM curriculum_requirement WHERE curriculum_plan_id = v_plan;

  FOR r IN SELECT * FROM jsonb_array_elements(p_requisitos) LOOP
    v_tipo := COALESCE(r->>'requirement_type', 'UNKNOWN');
    v_course := NULL;

    -- Sólo un requisito de tipo COURSE tiene materia concreta. Crear un `course`
    -- para ELECTIVA I sería exactamente lo que ADR-051 evita.
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
      min_options, max_options,
      label_truncated, needs_review,
      source_type, source_ref, observed_at, confidence
    ) VALUES (
      v_plan,
      (r->>'ordinal')::INTEGER,
      r->>'code',
      r->>'label',
      v_tipo,
      -- Ausente o null en el JSON ⇒ NULL. **No se deriva del ordinal.**
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

  RETURN QUERY SELECT v_plan, v_reqs, v_materias;
END;
$$;

COMMENT ON FUNCTION public.ingerir_plan_de_estudios IS
  'Ingiere un plan completo. Todo entra DRAFT y no hay parámetro para pedir otra cosa: '
  'publicar es una operación aparte, de alguien que mira el plan y decide (ADR-051).';

/**
 * Publicar es un acto explícito, con su motivo.
 *
 * Se separa de la ingesta por el mismo motivo que corroborar se separó de
 * ingerir en la B2b.2: si publicar fuera un parámetro del importador, publicar
 * sería un efecto secundario de cargar un archivo.
 */
CREATE OR REPLACE FUNCTION public.publicar_plan_de_estudios(
  p_plan_id UUID,
  p_motivo  TEXT
)
RETURNS TABLE (plan_id UUID, publicado_en TIMESTAMPTZ)
LANGUAGE plpgsql
AS $$
DECLARE
  v_pendientes    INTEGER;
  v_institution   UUID;
  v_antes         TEXT;
BEGIN
  IF p_motivo IS NULL OR length(btrim(p_motivo)) = 0 THEN
    RAISE EXCEPTION 'publicar un plan exige un motivo: una publicación sin motivo es indistinguible de un clic'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Un plan con requisitos sin revisar no se publica. Es la regla escrita en
  -- ADR-053: se publica cuando están corroborados las materias, sus códigos, su
  -- distribución por año, sus reglas electivas y la fuente institucional.
  SELECT count(*) INTO v_pendientes
    FROM curriculum_requirement WHERE curriculum_plan_id = p_plan_id AND needs_review;
  IF v_pendientes > 0 THEN
    RAISE EXCEPTION 'el plan tiene % requisitos sin corroborar; no se publica (ADR-053)', v_pendientes
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT ap.institution_id, cp.publication_status INTO v_institution, v_antes
    FROM curriculum_plan cp JOIN academic_program ap ON ap.id = cp.program_id
   WHERE cp.id = p_plan_id;
  IF v_institution IS NULL THEN
    RAISE EXCEPTION 'no existe el plan %', p_plan_id USING ERRCODE = 'no_data_found';
  END IF;

  UPDATE curriculum_plan
     SET publication_status = 'PUBLISHED',
         published_at = NOW()
   WHERE id = p_plan_id;

  -- Con antes y después, como la corroboración de la B2b.2. `actor_id` va NULL
  -- —lo produjo un proceso, no una persona— y quién puede publicar sigue sin
  -- definirse: es `C01-030`, y no se inventa un rol.
  INSERT INTO audit_log (institution_id, actor_id, action, target_type, target_id,
                         before_value, after_value)
  VALUES (v_institution, NULL, 'PLAN_PUBLICADO', 'curriculum_plan', p_plan_id,
          jsonb_build_object('publication_status', v_antes),
          jsonb_build_object('publication_status', 'PUBLISHED', 'motivo', p_motivo));

  RETURN QUERY SELECT p_plan_id, cp.published_at FROM curriculum_plan cp WHERE cp.id = p_plan_id;
END;
$$;

COMMENT ON FUNCTION public.publicar_plan_de_estudios IS
  'La operación explícita que hace ofrecible un plan. Rechaza publicar mientras queden '
  'requisitos con needs_review: es la regla de ADR-053, puesta donde no se pueda saltear.';

-- ─────────────────────────────────────────────────────────────────────────────
-- `ingerir_materia()` aprende a colgar de un plan declarado
--
-- Hasta hoy fabricaba `'Sin programa declarado'` / `'sin-plan'` porque no había
-- estructura curricular a la que colgarse. Ahora la hay, y una materia cargada
-- desde el programa de la cátedra tiene que poder atarse a la materia del plan
-- — si no, el mismo `Análisis Matemático II` queda en dos lugares.
--
-- ⚠️ **`DROP` y recrear, no `CREATE OR REPLACE`:** cambiar la firma crearía una
-- sobrecarga, y las dos versiones convivirían. `p_curriculum_plan_id` va al
-- final con `DEFAULT NULL`, así que **los llamadores existentes no cambian** y
-- el comportamiento centinela se conserva intacto.
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.ingerir_materia(
  UUID, TEXT, TEXT, TIMESTAMPTZ, NUMERIC, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB);

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
  p_curriculum_plan_id UUID DEFAULT NULL
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
REVOKE ALL ON FUNCTION public.ingerir_plan_de_estudios FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ingerir_plan_de_estudios TO service_role;
REVOKE ALL ON FUNCTION public.publicar_plan_de_estudios FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publicar_plan_de_estudios TO service_role;
