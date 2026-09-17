-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.14.4 — el alta académica, contra Postgres
--
-- [ADR-052](../../docs/decisions.md#adr-052). Tres lecturas y una escritura.
--
-- Las lecturas siguen la convención de la B2.6: **una función por superficie**,
-- una sola llamada, para que la pantalla no arme una foto inconsistente entre
-- viajes. No deciden nada — quién ordena y qué se preselecciona vive en
-- `lib/domain/alta.ts`.
--
-- ⚠️ **Ninguna lectura del alta devuelve un plan `DRAFT`.** Es la garantía de
-- ADR-051 puesta donde el Service no la pueda olvidar, y hay test.
-- ─────────────────────────────────────────────────────────────────────────────

/**
 * El catálogo que el alta puede ofrecer: instituciones y carreras con al menos
 * un plan publicado.
 */
CREATE OR REPLACE FUNCTION public.catalogo_ofrecible()
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(x ORDER BY x->>'nombre'), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'institucionId', i.id,
      'nombre', i.name,
      'carreras', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
                 'carreraId', ap.id,
                 'nombre', ap.name,
                 -- La facultad se **infiere del catálogo y se muestra para
                 -- confirmar**; si la fuente no la declara, viaja `null` y la
                 -- línea desaparece (omitir, no inventar).
                 'facultad', au.name
               ) ORDER BY ap.name), '[]'::jsonb)
          FROM academic_program ap
          LEFT JOIN academic_unit au ON au.id = ap.academic_unit_id
         WHERE ap.institution_id = i.id
           AND EXISTS (SELECT 1 FROM curriculum_plan cp
                        WHERE cp.program_id = ap.id AND cp.publication_status = 'PUBLISHED')
      )
    ) AS x
    FROM institution i
   WHERE EXISTS (
     SELECT 1 FROM academic_program ap2
       JOIN curriculum_plan cp2 ON cp2.program_id = ap2.id
      WHERE ap2.institution_id = i.id AND cp2.publication_status = 'PUBLISHED')
  ) s;
$$;

COMMENT ON FUNCTION public.catalogo_ofrecible() IS
  'Sólo instituciones y carreras con plan PUBLISHED. Un plan DRAFT no llega acá, y por eso '
  'una carrera cuyo único plan está en borrador tampoco: no se le ofrece al estudiante algo '
  'de lo que no se le puede mostrar el contenido (ADR-051).';

/**
 * Las versiones publicadas de una carrera. **Quién resuelve la ambigüedad es
 * `lib/domain/alta.ts`**: esto sólo trae los candidatos.
 */
CREATE OR REPLACE FUNCTION public.planes_publicados(p_program_id UUID)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', cp.id, 'version', cp.version,
           'validFrom', cp.valid_from, 'validUntil', cp.valid_until
         ) ORDER BY cp.valid_from DESC NULLS LAST, cp.version DESC), '[]'::jsonb)
    FROM curriculum_plan cp
   WHERE cp.program_id = p_program_id AND cp.publication_status = 'PUBLISHED';
$$;

/**
 * Los requisitos de un plan publicado, con lo que el estudiante ya declaró.
 *
 * Trae **el plan entero**, no sólo el año elegido: la pantalla ofrece "agregar
 * materias de otros años" sin un segundo viaje, y quién se preselecciona lo
 * decide el dominio.
 */
CREATE OR REPLACE FUNCTION public.requisitos_del_plan(
  p_curriculum_plan_id UUID,
  p_student_id         UUID
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT CASE WHEN NOT EXISTS (
           SELECT 1 FROM curriculum_plan
            WHERE id = p_curriculum_plan_id AND publication_status = 'PUBLISHED')
         -- `null` y no `[]`: "no hay plan publicado" no es "el plan está vacío".
         THEN NULL
         ELSE jsonb_build_object(
           'planId', p_curriculum_plan_id,
           'requisitos', COALESCE((
             SELECT jsonb_agg(jsonb_build_object(
                      'requisitoId', cr.id,
                      'codigo', cr.code,
                      'nombre', cr.label,
                      'tipo', cr.requirement_type,
                      'anio', cr.curriculum_year,
                      'nombreCortado', cr.label_truncated,
                      'materiaId', cr.course_id,
                      -- Las opciones concretas del cupo. Vacío = todavía no hay
                      -- catálogo verificado, y el estudiante escribe el nombre.
                      'opciones', COALESCE((
                        SELECT jsonb_agg(jsonb_build_object('materiaId', c2.id, 'nombre', c2.name)
                                         ORDER BY c2.name)
                          FROM elective_option eo JOIN course c2 ON c2.id = eo.course_id
                         WHERE eo.curriculum_requirement_id = cr.id), '[]'::jsonb),
                      -- Lo que este estudiante ya declaró para este requisito.
                      'declarado', (
                        SELECT jsonb_build_object(
                                 'cursadaId', rd.course_enrollment_id,
                                 'nombreEscrito', rd.declared_label)
                          FROM requirement_declaration rd
                         WHERE rd.student_id = p_student_id
                           AND rd.curriculum_requirement_id = cr.id)
                    ) ORDER BY cr.ordinal)
               FROM curriculum_requirement cr
              WHERE cr.curriculum_plan_id = p_curriculum_plan_id), '[]'::jsonb)
         ) END;
$$;

COMMENT ON FUNCTION public.requisitos_del_plan IS
  'Devuelve NULL si el plan no está publicado: no es lo mismo que devolver una lista vacía, '
  'y colapsarlos le diría al estudiante que su carrera no tiene materias.';

/**
 * El estado del alta de un estudiante, en una lectura.
 *
 * ⚠️ `consentimientoRespondido` es **true también con `DECLINED`**: ADR-042 §2
 * dice que rechazar WhatsApp no quita acceso, así que un alta que se trabara ahí
 * sería exactamente lo que esa regla prohíbe.
 */
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

-- ─────────────────────────────────────────────────────────────────────────────
-- La confirmación, en **una** transacción
--
-- Escribe la inscripción, las cursadas por defecto, las inscripciones a materia
-- y las declaraciones de requisito. Si algo falla, no queda un alta a medias.
--
-- **La idempotencia no vive acá:** vive en `UNIQUE (student_id, offering_id)` de
-- `course_enrollment` y en `UNIQUE (student_id, curriculum_requirement_id)` de
-- `requirement_declaration`, que existen desde su migración. Esta función sólo
-- usa `ON CONFLICT`.
--
-- ⚠️ **No llama al ADE.** Recomendar es del Service (ADR-040): una función de
-- base que materializara Actions sería una regla de negocio invisible desde el
-- código de aplicación, que es lo que `data-model.md` §11 prohíbe.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.confirmar_mapa_academico(
  p_institution_id     UUID,
  p_student_id         UUID,
  p_program_id         UUID,
  p_curriculum_plan_id UUID,
  p_curriculum_year    SMALLINT,
  p_term               TEXT,
  -- [{ requisitoId, materiaId?, nombreEscrito? }]
  p_selecciones        JSONB
)
RETURNS TABLE (inscripcion_id UUID, cursadas INTEGER, declaraciones INTEGER)
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
  s            JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM curriculum_plan
                  WHERE id = p_curriculum_plan_id AND publication_status = 'PUBLISHED') THEN
    RAISE EXCEPTION 'el plan % no está publicado: no se puede confirmar contra un borrador',
      p_curriculum_plan_id USING ERRCODE = 'check_violation';
  END IF;

  -- ── La inscripción a la carrera ────────────────────────────────────────────
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

    -- Una opción concreta elegida para un cupo manda sobre la materia del
    -- requisito: en un `ELECTIVE_SLOT` el requisito no tiene materia propia.
    IF NULLIF(s->>'materiaId','') IS NOT NULL THEN
      v_materia := (s->>'materiaId')::UUID;
    END IF;

    IF v_materia IS NOT NULL THEN
      -- La cursada por defecto: el término elegido, **sin comisión**. Cátedras y
      -- comisiones están fuera del alcance, y no se inventa una.
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
      -- Una electiva que el estudiante nombró y **que no está en el catálogo**.
      -- Se guarda su declaración; **el catálogo no se toca** (ADR-051).
      INSERT INTO requirement_declaration (
        institution_id, student_id, curriculum_requirement_id, declared_label, source_type)
      VALUES (p_institution_id, p_student_id, (s->>'requisitoId')::UUID,
              btrim(s->>'nombreEscrito'), 'student')
      ON CONFLICT (student_id, curriculum_requirement_id) DO UPDATE
        SET declared_label = EXCLUDED.declared_label, course_enrollment_id = NULL;
    ELSE
      CONTINUE;   -- ni materia ni nombre: no hay nada que declarar
    END IF;

    v_decls := v_decls + 1;
    v_materia := NULL;
  END LOOP;

  -- Lo que el estudiante **desmarcó** deja de estar declarado, y su cursada
  -- pasa a `dropped` en vez de borrarse: puede tener progreso o evidencias
  -- colgando, y borrar la fila sería reescribir su historia.
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

  RETURN QUERY SELECT v_enrollment, v_cursadas, v_decls;
END;
$$;

COMMENT ON FUNCTION public.confirmar_mapa_academico IS
  'Una transacción: inscripción, cursadas por defecto, inscripciones a materia y '
  'declaraciones. Idempotente por los UNIQUE que ya existían. NO llama al ADE: recomendar '
  'es del Service (ADR-040).';

/**
 * La declaración de carrera y año, **antes** de elegir materias.
 *
 * Existe para que recargar `/alta/materias` no pierda lo que el estudiante ya
 * contestó. Deja `confirmed_at` en `NULL`: declarar no es confirmar.
 */
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
  v_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM curriculum_plan
                  WHERE id = p_curriculum_plan_id AND publication_status = 'PUBLISHED') THEN
    RAISE EXCEPTION 'el plan % no está publicado' , p_curriculum_plan_id
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO enrollment (student_id, program_id, term, institution_id,
                          curriculum_plan_id, curriculum_year)
  VALUES (p_student_id, p_program_id, p_term, p_institution_id,
          p_curriculum_plan_id, p_curriculum_year)
  ON CONFLICT (student_id, program_id, term) DO UPDATE
    SET institution_id     = EXCLUDED.institution_id,
        curriculum_plan_id = EXCLUDED.curriculum_plan_id,
        curriculum_year    = EXCLUDED.curriculum_year
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.confirmar_mapa_academico FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_mapa_academico TO service_role;
REVOKE ALL ON FUNCTION public.declarar_carrera FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.declarar_carrera TO service_role;
