-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Fase B6.21 — el horario entra por donde entra la materia
--
-- La entidad de `20261001000000_bloque_horario.sql` nace sin escritor, y una
-- tabla que nadie escribe es el defecto que este repositorio viene señalando en
-- otras tres —`student.whatsapp`, `reflection.difficulty`, `rights_status`—.
-- Así que entra por la misma puerta que el resto del contenido de la materia.
--
-- ## Por qué la ingesta y no el alta
--
-- [ADR-063](../../docs/decisions.md#adr-063) tiene **dos** escritores previstos:
-- el horario **publicado** de la comisión y el que **declara el estudiante**.
-- Éste construye el primero. El segundo vive en el cuarto paso del alta, que
-- pregunta comisión y horario juntos y por eso arrastra
-- [ADR-062](../../docs/decisions.md#adr-062) entero: es otro corte, y no está
-- autorizado.
--
-- ⚠️ **Que falte el segundo no vuelve al primero una verdad a medias.** El
-- horario publicado entra con `source_type` de la ingesta y su
-- `verification_status` sin tocar, y `course_enrollment_id` queda `NULL` en cada
-- fila: **nadie declaró nada todavía**, y el schema lo dice.
--
-- ## Por qué hay `DROP`
--
-- `CREATE OR REPLACE` no puede cambiar ni la lista de argumentos ni el tipo de
-- retorno, y acá cambian los dos. Es el mismo `DROP` que esta función ya recibió
-- en `20260920010000_ingesta_de_clases.sql` y en `20260926000000_factor_de_estudio.sql`.
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.ingerir_materia(
  UUID, TEXT, TEXT, TIMESTAMPTZ, NUMERIC, TEXT, TEXT, TEXT, TEXT,
  JSONB, JSONB, JSONB, UUID, JSONB, INTEGER, TEXT, INTEGER, TEXT
);

CREATE OR REPLACE FUNCTION public.ingerir_materia(p_institution_id uuid, p_source_type text, p_source_ref text, p_observed_at timestamp with time zone, p_confidence numeric, p_course_code text, p_course_name text, p_term text, p_commission text, p_unidades jsonb, p_prerequisitos jsonb, p_evaluaciones jsonb, p_curriculum_plan_id uuid DEFAULT NULL::uuid, p_clases jsonb DEFAULT '[]'::jsonb, p_carga_min integer DEFAULT NULL::integer, p_carga_texto text DEFAULT NULL::text, p_estudio_min integer DEFAULT NULL::integer, p_estudio_texto text DEFAULT NULL::text, p_horarios jsonb DEFAULT '[]'::jsonb)
 RETURNS TABLE(cursada_id uuid, unidades integer, evaluaciones integer, clases integer, horarios integer)
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
  v_horarios   INTEGER := 0;
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

  -- ── El horario semanal de la comisión · ADR-063 ───────────────────────────
  --
  -- **Vacío ⇒ no se toca nada**, igual que `p_clases`. Una reingesta sin
  -- horarios no borra los que ya estaban: el que no manda el dato no está
  -- afirmando que no existe.
  --
  -- Con horarios, **reemplaza los de esta oferta**. Puede hacerlo sin el cuidado
  -- que ADR-081 le exigió a `topic` por una razón concreta y verificada:
  -- **ninguna tabla referencia a `class_schedule_block`**, así que borrar una
  -- fila no arrastra progreso de nadie. Si algún día algo la referencia, esto
  -- vuelve a ser un `ON CONFLICT`.
  --
  -- ⚠️ **Y sólo toca las de la oferta.** Los bloques que declaró un estudiante
  -- viven en su `course_enrollment` y **no son de la cátedra**: una ingesta no
  -- los pisa.
  IF jsonb_array_length(COALESCE(p_horarios, '[]'::JSONB)) > 0 THEN
    DELETE FROM class_schedule_block WHERE offering_id = v_offering;

    FOR r IN SELECT * FROM jsonb_array_elements(p_horarios) LOOP
      INSERT INTO class_schedule_block (
        institution_id, offering_id, day_of_week, start_time, end_time,
        source_type, source_ref, observed_at, confidence
      ) VALUES (
        p_institution_id, v_offering,
        (r->>'dia')::SMALLINT, (r->>'desde')::TIME, (r->>'hasta')::TIME,
        p_source_type, p_source_ref, p_observed_at, p_confidence
      );
      v_horarios := v_horarios + 1;
    END LOOP;

    -- ⚠️ **No se escribe ningún estado en la cursada**, y no es un olvido: ver
    -- el cierre de `20261001000000_bloque_horario.sql`. La cursada puede no
    -- existir todavía cuando se ingiere la materia —el alta la crea después—,
    -- así que un `UPDATE` acá dejaría el estado en falso justo en el caso
    -- normal. «No se sabe» se contesta con la ausencia de bloques.
    --
    -- ⚠️ Y `verification_status` **tampoco se toca**. Que la fuente sea la
    -- institución no eleva nada por sí solo: elevar es `corroborar_procedencia()`
    -- y sólo eso (`I9`).
  END IF;

  RETURN QUERY SELECT v_offering, v_unidades, v_evals, v_clases, v_horarios;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.ingerir_materia TO service_role;

COMMENT ON FUNCTION public.ingerir_materia IS
  'Ingesta de una materia. p_horarios carga el horario semanal PUBLICADO de la comisión '
  '(ADR-063, dueño = offering). Vacío no toca nada; con datos reemplaza los de esa oferta y '
  'nunca los que declaró un estudiante, que cuelgan de su cursada.';
