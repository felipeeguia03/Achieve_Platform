-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.14.6 — el mapa mínimo se alcanza una sola vez
--
-- [ADR-052](../../docs/decisions.md#adr-052). Encontrado al medir el recorrido
-- de punta a punta: **reconfirmar emitía `AcademicMapMinimumReached` otra vez**.
--
-- No es lo mismo que el resto de la idempotencia. Las filas ya no se duplicaban
-- —los `UNIQUE` las cuidan—, pero el evento sí: `product_event` es append-only,
-- así que dos confirmaciones dejaban dos hechos donde ocurrió uno. Y este hecho
-- no es *"el estudiante confirmó"*: es *"existe información suficiente para
-- conducción"*, que se alcanza una vez y después ya está alcanzado. Contarlo
-- dos veces duplicaría las activaciones en cualquier análisis del piloto.
--
-- La función pasa a devolver **si ésta fue la primera confirmación**, y el
-- Service decide con eso. La decisión no se toma en la base: la base informa.
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.confirmar_mapa_academico(UUID, UUID, UUID, UUID, SMALLINT, TEXT, JSONB);

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
  s            JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM curriculum_plan
                  WHERE id = p_curriculum_plan_id AND publication_status = 'PUBLISHED') THEN
    RAISE EXCEPTION 'el plan % no está publicado: no se puede confirmar contra un borrador',
      p_curriculum_plan_id USING ERRCODE = 'check_violation';
  END IF;

  -- Se mira **antes** de escribir: después de la confirmación siempre hay fecha.
  SELECT confirmed_at IS NOT NULL INTO v_ya_estaba
    FROM enrollment
   WHERE student_id = p_student_id AND program_id = p_program_id AND term = p_term;

  INSERT INTO enrollment (student_id, program_id, term, institution_id,
                          curriculum_plan_id, curriculum_year, confirmed_at)
  VALUES (p_student_id, p_program_id, p_term, p_institution_id,
          p_curriculum_plan_id, p_curriculum_year, NOW())
  ON CONFLICT (student_id, program_id, term) DO UPDATE
    SET institution_id     = EXCLUDED.institution_id,
        curriculum_plan_id = EXCLUDED.curriculum_plan_id,
        curriculum_year    = EXCLUDED.curriculum_year,
        -- Reconfirmar **no mueve la fecha original**: el alta ocurrió una vez.
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
  'Devuelve `es_primera` para que el Service no emita dos veces un hecho que ocurre una sola '
  '(ADR-052). NO llama al ADE: recomendar es del Service (ADR-040).';

REVOKE ALL ON FUNCTION public.confirmar_mapa_academico FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_mapa_academico TO service_role;
