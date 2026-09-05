-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Corte 1 — el período académico deja de ser texto libre
--
-- [ADR-061](../../docs/decisions.md#adr-061), decidido por el Product Owner el 5
-- de septiembre de 2026:
--
--   «Separar conceptualmente: año lectivo · semestre actual del estudiante
--    FIRST_SEMESTER o SECOND_SEMESTER · período de dictado de una materia.»
--
--   «Debe evitar que valores como 1, primer semestre, 2026-1 y S1 representen el
--    mismo concepto de maneras diferentes.»
--
-- ## Lo que esta migración NO hace, y es deliberado
--
-- **No retira `enrollment.term`.** Tiene `UNIQUE (student_id, program_id, term)`
-- detrás y lo usan `declarar_carrera()` y `confirmar_mapa_academico()`. El año y
-- el semestre pasan a vivir **además** en columnas propias, y la clave textual se
-- deriva de ellas para que no puedan discrepar. Retirarla es trabajo propio y
-- necesita decidir si el semestre entra en esa clave — fila 20 de
-- `decisiones-abiertas.md`.
--
-- **No toca `course_offering.term`.** Es el período calendario de la oferta, y lo
-- tocan los cortes 3 y 4.
--
-- **No pregunta nada.** Preguntar el año y el semestre es el corte 2; hasta
-- entonces siguen saliendo de `periodoDeCursado()`, y esta migración **los deriva
-- de `p_term` dentro de la base** para no cambiar ningún contrato hacia afuera.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1 · El período de dictado de una fila del plan ───────────────────────────
--
-- ⚠️ **`NULL` sigue siendo válido, y no es un descuido.** Significa «no sabemos
-- en qué semestre se dicta», que es el estado de las 57 filas del Plan 2016:
-- [ADR-053](../../docs/decisions.md#adr-053) declaró que el semestre **no se
-- puede determinar** de la fuente. Prohibirlo obligaría a inventarlo.

ALTER TABLE curriculum_requirement
  ADD CONSTRAINT periodo_de_dictado_canonico
  CHECK (term IS NULL OR term IN ('FIRST_SEMESTER', 'SECOND_SEMESTER'));

-- Una anual **no lleva semestre**: aparece en los dos. Escribir las dos cosas a
-- la vez sería afirmar que se dicta en uno solo, que es lo contrario.
ALTER TABLE curriculum_requirement
  ADD CONSTRAINT anual_no_lleva_semestre
  CHECK (NOT (COALESCE(is_annual, FALSE) AND term IS NOT NULL));

COMMENT ON COLUMN curriculum_requirement.term IS
  'Período de DICTADO de la materia en el plan: FIRST_SEMESTER | SECOND_SEMESTER | NULL. '
  'NULL = no se sabe (Plan 2016, ADR-053). NUNCA una clave calendario como 2026-1: eso es '
  'otro concepto y vive en enrollment/course_offering (ADR-061).';

COMMENT ON COLUMN curriculum_requirement.is_annual IS
  'La materia se dicta todo el año. Excluyente con term: una anual aparece en los DOS '
  'semestres del mismo año lectivo (ADR-061).';

-- ── 2 · El año lectivo y el semestre del estudiante, en columnas propias ─────

ALTER TABLE enrollment ADD COLUMN academic_year SMALLINT;
ALTER TABLE enrollment ADD COLUMN semester      TEXT;

ALTER TABLE enrollment
  ADD CONSTRAINT enrollment_semester_check
  CHECK (semester IS NULL OR semester IN ('FIRST_SEMESTER', 'SECOND_SEMESTER'));

-- Un año lectivo con forma de año. No se acota por arriba: el piloto es de 2026
-- y poner un techo sería fijar una fecha de caducidad al producto.
ALTER TABLE enrollment
  ADD CONSTRAINT enrollment_academic_year_check
  CHECK (academic_year IS NULL OR academic_year >= 2000);

COMMENT ON COLUMN enrollment.academic_year IS 'Año lectivo del estudiante. Ver ADR-061.';
COMMENT ON COLUMN enrollment.semester IS
  'Semestre en el que cursa el estudiante: FIRST_SEMESTER | SECOND_SEMESTER. NO admite '
  'un valor «anual»: la anualidad es de la materia, no del alumno (ADR-061).';

-- ── 3 · Backfill desde la clave textual que ya existía ───────────────────────
--
-- `'2026-2'` → `2026` + `SECOND_SEMESTER`. Lo que no tenga esa forma **queda en
-- `NULL`**: no se adivina un semestre para una fila que nunca lo declaró.

UPDATE enrollment
   SET academic_year = substring(term FROM '^(\d{4})-[12]$')::SMALLINT,
       semester      = CASE substring(term FROM '^\d{4}-([12])$')
                         WHEN '1' THEN 'FIRST_SEMESTER'
                         WHEN '2' THEN 'SECOND_SEMESTER'
                       END
 WHERE term ~ '^\d{4}-[12]$';

-- ── 4 · Las dos funciones del alta derivan las columnas nuevas de `p_term` ───
--
-- **El contrato hacia afuera no cambia**: las rutas siguen mandando `periodo`.
-- Lo que cambia es que la base deja de guardar sólo la forma compuesta.

CREATE OR REPLACE FUNCTION public.declarar_carrera(
  p_institution_id     UUID,
  p_student_id         UUID,
  p_program_id         UUID,
  p_curriculum_plan_id UUID,
  p_curriculum_year    SMALLINT,
  p_term               TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_id     UUID;
  v_anio   SMALLINT := substring(p_term FROM '^(\d{4})-[12]$')::SMALLINT;
  v_sem    TEXT     := CASE substring(p_term FROM '^\d{4}-([12])$')
                         WHEN '1' THEN 'FIRST_SEMESTER'
                         WHEN '2' THEN 'SECOND_SEMESTER'
                       END;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM curriculum_plan
                  WHERE id = p_curriculum_plan_id AND publication_status = 'PUBLISHED') THEN
    RAISE EXCEPTION 'el plan % no está publicado' , p_curriculum_plan_id
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO enrollment (student_id, program_id, term, institution_id,
                          curriculum_plan_id, curriculum_year, academic_year, semester)
  VALUES (p_student_id, p_program_id, p_term, p_institution_id,
          p_curriculum_plan_id, p_curriculum_year, v_anio, v_sem)
  ON CONFLICT (student_id, program_id, term) DO UPDATE
    SET institution_id     = EXCLUDED.institution_id,
        curriculum_plan_id = EXCLUDED.curriculum_plan_id,
        curriculum_year    = EXCLUDED.curriculum_year,
        academic_year      = EXCLUDED.academic_year,
        semester           = EXCLUDED.semester
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.declarar_carrera IS
  'Declarar carrera y año. Deja confirmed_at en NULL: declarar no es confirmar. Desde ADR-061 '
  'guarda además el año lectivo y el semestre en columnas propias, derivados de p_term.';

REVOKE ALL ON FUNCTION public.declarar_carrera FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.declarar_carrera TO service_role;

-- `confirmar_mapa_academico()` hace su propio INSERT sobre `enrollment`, así que
-- necesita el mismo derivado. Se reemplaza entera —las migraciones no se editan—
-- conservando **todo** lo demás de la versión de la Etapa B6.14.6.

CREATE OR REPLACE FUNCTION public.confirmar_mapa_academico(
  p_institution_id     UUID,
  p_student_id         UUID,
  p_program_id         UUID,
  p_curriculum_plan_id UUID,
  p_curriculum_year    SMALLINT,
  p_term               TEXT,
  p_selecciones        JSONB
)
RETURNS TABLE (inscripcion_id UUID, cursadas INTEGER, declaraciones INTEGER, es_primera BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_enrollment UUID;
  v_offering   UUID;
  v_ce         UUID;
  v_cursadas   INTEGER := 0;
  v_decls      INTEGER := 0;
  v_tipo       TEXT;
  v_materia    UUID;
  v_ya_estaba  BOOLEAN;
  v_anio       SMALLINT := substring(p_term FROM '^(\d{4})-[12]$')::SMALLINT;
  v_sem        TEXT     := CASE substring(p_term FROM '^\d{4}-([12])$')
                             WHEN '1' THEN 'FIRST_SEMESTER'
                             WHEN '2' THEN 'SECOND_SEMESTER'
                           END;
  s            JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM curriculum_plan
                  WHERE id = p_curriculum_plan_id AND publication_status = 'PUBLISHED') THEN
    RAISE EXCEPTION 'el plan % no está publicado: no se puede confirmar contra un borrador',
      p_curriculum_plan_id USING ERRCODE = 'check_violation';
  END IF;

  SELECT confirmed_at IS NOT NULL INTO v_ya_estaba
    FROM enrollment
   WHERE student_id = p_student_id AND program_id = p_program_id AND term = p_term;

  INSERT INTO enrollment (student_id, program_id, term, institution_id,
                          curriculum_plan_id, curriculum_year, academic_year, semester,
                          confirmed_at)
  VALUES (p_student_id, p_program_id, p_term, p_institution_id,
          p_curriculum_plan_id, p_curriculum_year, v_anio, v_sem, NOW())
  ON CONFLICT (student_id, program_id, term) DO UPDATE
    SET institution_id     = EXCLUDED.institution_id,
        curriculum_plan_id = EXCLUDED.curriculum_plan_id,
        curriculum_year    = EXCLUDED.curriculum_year,
        academic_year      = EXCLUDED.academic_year,
        semester           = EXCLUDED.semester,
        confirmed_at       = COALESCE(enrollment.confirmed_at, EXCLUDED.confirmed_at)
  RETURNING id INTO v_enrollment;

  FOR s IN SELECT * FROM jsonb_array_elements(COALESCE(p_selecciones, '[]'::jsonb)) LOOP
    SELECT cr.requirement_type, cr.course_id INTO v_tipo, v_materia
      FROM curriculum_requirement cr
     WHERE cr.id = (s->>'requisitoId')::UUID AND cr.curriculum_plan_id = p_curriculum_plan_id;

    IF v_tipo IS NULL THEN
      RAISE EXCEPTION 'el requisito % no pertenece al plan %', s->>'requisitoId', p_curriculum_plan_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF NULLIF(s->>'materiaId','') IS NOT NULL THEN
      v_materia := (s->>'materiaId')::UUID;
    END IF;

    IF v_materia IS NOT NULL THEN
      SELECT id INTO v_offering FROM course_offering
       WHERE course_id = v_materia AND term = p_term AND commission IS NULL;
      IF v_offering IS NULL THEN
        INSERT INTO course_offering (course_id, term, commission)
        VALUES (v_materia, p_term, NULL)
        ON CONFLICT (course_id, term, commission) DO NOTHING
        RETURNING id INTO v_offering;
        IF v_offering IS NULL THEN
          SELECT id INTO v_offering FROM course_offering
           WHERE course_id = v_materia AND term = p_term AND commission IS NULL;
        END IF;
      END IF;

      INSERT INTO course_enrollment (institution_id, student_id, offering_id)
      VALUES (p_institution_id, p_student_id, v_offering)
      ON CONFLICT (student_id, offering_id) DO UPDATE SET status = 'active'
      RETURNING id INTO v_ce;
      v_cursadas := v_cursadas + 1;

      INSERT INTO requirement_declaration (
        institution_id, student_id, curriculum_requirement_id, course_enrollment_id, source_type)
      VALUES (p_institution_id, p_student_id, (s->>'requisitoId')::UUID, v_ce, 'student')
      ON CONFLICT (student_id, curriculum_requirement_id) DO UPDATE
        SET course_enrollment_id = EXCLUDED.course_enrollment_id, declared_label = NULL;

    ELSIF NULLIF(s->>'nombreEscrito','') IS NOT NULL THEN
      INSERT INTO requirement_declaration (
        institution_id, student_id, curriculum_requirement_id, declared_label, source_type)
      VALUES (p_institution_id, p_student_id, (s->>'requisitoId')::UUID,
              btrim(s->>'nombreEscrito'), 'student')
      ON CONFLICT (student_id, curriculum_requirement_id) DO UPDATE
        SET declared_label = EXCLUDED.declared_label, course_enrollment_id = NULL;
    ELSE
      CONTINUE;
    END IF;

    v_decls := v_decls + 1;
    v_materia := NULL;
  END LOOP;

  UPDATE course_enrollment ce SET status = 'dropped'
   WHERE ce.student_id = p_student_id AND ce.institution_id = p_institution_id
     AND ce.status = 'active'
     AND EXISTS (SELECT 1 FROM requirement_declaration rd
                  WHERE rd.course_enrollment_id = ce.id AND rd.student_id = p_student_id)
     AND NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(COALESCE(p_selecciones,'[]'::jsonb)) sel
         JOIN requirement_declaration rd2
           ON rd2.curriculum_requirement_id = (sel->>'requisitoId')::UUID
          AND rd2.student_id = p_student_id
        WHERE rd2.course_enrollment_id = ce.id);

  DELETE FROM requirement_declaration rd
   WHERE rd.student_id = p_student_id
     AND rd.curriculum_requirement_id IN (
       SELECT id FROM curriculum_requirement WHERE curriculum_plan_id = p_curriculum_plan_id)
     AND NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(COALESCE(p_selecciones,'[]'::jsonb)) sel
        WHERE (sel->>'requisitoId')::UUID = rd.curriculum_requirement_id);

  RETURN QUERY SELECT v_enrollment, v_cursadas, v_decls, NOT COALESCE(v_ya_estaba, FALSE);
END;
$$;

COMMENT ON FUNCTION public.confirmar_mapa_academico IS
  'Una transacción: inscripción, cursadas por defecto, inscripciones a materia y declaraciones. '
  'Devuelve es_primera para que el Service no emita dos veces un hecho que ocurre una sola '
  '(ADR-052). Desde ADR-061 guarda año lectivo y semestre en columnas propias. '
  'NO llama al ADE: recomendar es del Service (ADR-040).';

REVOKE ALL ON FUNCTION public.confirmar_mapa_academico FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_mapa_academico TO service_role;
