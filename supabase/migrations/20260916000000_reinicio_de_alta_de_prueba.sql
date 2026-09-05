-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Modo prueba — reiniciar el alta de un estudiante sintético
--
-- ⚠️⚠️ **HERRAMIENTA DE PRUEBA. NO ES UNA CAPACIDAD DEL PRODUCTO.**
--
-- Existe para una sola cosa: que el tramo de alta se pueda **recorrer muchas
-- veces seguidas** —cómo toma las materias, cómo se comporta con otro catálogo—
-- sin bajar a la terminal a correr `npm run db:demo`, que además vuelve a
-- sembrar el mundo entero y borra lo que uno estaba mirando.
--
-- **Ningún estudiante ve esto.** La ruta que la llama responde `404` sin
-- `MODO_PRUEBA=1`, y con [ADR-006](../../docs/decisions.md#adr-006) abierto no
-- existe ningún estudiante que no sea sintético.
--
-- ## Lo que borra, y lo que no
--
-- Borra **lo que el alta escribió** y lo que colgó de eso: el consentimiento, la
-- inscripción de carrera, las cursadas y las declaraciones de requisito, más las
-- `Action`/`Commitment`/`Evidence` que el ADE materializó encima —esas se van
-- por `ON DELETE CASCADE` desde `course_enrollment`, no por una lista a mano—.
--
-- **No borra:**
--
-- - `student` ni su `auth_user_id`. Reiniciar el alta no es cerrar la sesión, y
--   perder la atadura de identidad devolvía un `403 SIN_PADRON` que no tenía
--   nada que ver con el padrón — la lección de `db:demo`.
-- - `availability`. No la escribe el alta.
-- - **El catálogo entero.** Instituciones, carreras, planes, requisitos y
--   materias son de `db:catalogo`: borrarlos dejaría el alta sin nada que
--   ofrecer.
-- - **`product_event` ni `audit_log`.** Son append-only por `I12` —`service_role`
--   tiene `UPDATE`/`DELETE` revocados— y **no se intenta**: los hechos de la
--   corrida anterior ocurrieron, y un log de hechos que se puede rebobinar no es
--   un log.
--
-- ⚠️ **Consecuencia declarada:** el próximo `confirmar_mapa_academico()` vuelve a
-- ver `confirmed_at IS NULL` y emite **otro** `AcademicMapMinimumReached`. Es
-- correcto —esa alta volvió a ocurrir— y a la vez significa que en una base con
-- reinicios el conteo de activaciones **no sirve para medir nada**. Por eso el
-- modo prueba no se declara donde se mire un embudo.
--
-- ## Cambiar de institución es otra operación, y se dice así
--
-- `p_nueva_institucion` **simula el padrón**, no le devuelve al estudiante una
-- elección que [ADR-052](../../docs/decisions.md#adr-052) le sacó: la
-- institución la fija el padrón y el alta la muestra para confirmar. Acá se
-- mueve la ficha del padrón, que es lo que un backoffice haría, y sólo:
--
-- 1. **después de borrar todo lo académico** —mover a un estudiante con cursadas
--    de la institución vieja rompe `I11` en silencio—, y
-- 2. **a una institución con al menos un plan `PUBLISHED`**, o falla. Dejarlo en
--    una sin plan es el mismo pozo del que salió la Etapa B6.14.7.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.reiniciar_alta_de_prueba(
  p_institution_id    UUID,
  p_student_id        UUID,
  -- NULL ⇒ el estudiante se queda donde está. Es el caso normal.
  p_nueva_institucion UUID DEFAULT NULL
)
RETURNS TABLE (
  cursadas        INTEGER,
  declaraciones   INTEGER,
  consentimientos INTEGER,
  inscripciones   INTEGER,
  institucion     UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_cursadas INTEGER;
  v_decls    INTEGER;
  v_cons     INTEGER;
  v_inscr    INTEGER;
  v_destino  UUID := COALESCE(p_nueva_institucion, p_institution_id);
BEGIN
  -- El scoping va en el WHERE, no después de leer (`I11`). La institución llega
  -- de la sesión, así que esto comprueba que el par sesión/estudiante es real —
  -- y no que el request dijo algo lindo.
  IF NOT EXISTS (
    SELECT 1 FROM student
     WHERE id = p_student_id AND institution_id = p_institution_id
  ) THEN
    RAISE EXCEPTION 'el estudiante % no pertenece a la institución %',
      p_student_id, p_institution_id USING ERRCODE = 'check_violation';
  END IF;

  IF p_nueva_institucion IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM curriculum_plan cp
      JOIN academic_program ap ON ap.id = cp.program_id
     WHERE ap.institution_id = p_nueva_institucion
       AND cp.publication_status = 'PUBLISHED'
  ) THEN
    RAISE EXCEPTION
      'la institución % no tiene ningún plan publicado: mover al estudiante ahí lo dejaría sin alta posible',
      p_nueva_institucion USING ERRCODE = 'check_violation';
  END IF;

  -- Se cuenta **antes** de borrar: después, todo da cero y la respuesta no
  -- diría si había algo que reiniciar.
  SELECT count(*) INTO v_cursadas FROM course_enrollment       WHERE student_id = p_student_id;
  SELECT count(*) INTO v_decls    FROM requirement_declaration WHERE student_id = p_student_id;
  SELECT count(*) INTO v_cons     FROM whatsapp_consent        WHERE student_id = p_student_id;
  SELECT count(*) INTO v_inscr    FROM enrollment              WHERE student_id = p_student_id;

  -- `reiteration_episode.previous_episode_id` es autorreferente y `RESTRICT`, y
  -- `RESTRICT` se comprueba fila por fila: un `DELETE` que se lleva la cadena
  -- entera igual falla contra sí mismo. Se corta el eslabón primero.
  UPDATE reiteration_episode SET previous_episode_id = NULL WHERE student_id = p_student_id;

  DELETE FROM escalation_sink          WHERE student_id = p_student_id;
  DELETE FROM intervention             WHERE student_id = p_student_id;
  DELETE FROM error_observation        WHERE student_id = p_student_id;
  DELETE FROM support_need_observation WHERE student_id = p_student_id;
  DELETE FROM early_review_observation WHERE student_id = p_student_id;
  DELETE FROM reiteration_episode      WHERE student_id = p_student_id;
  DELETE FROM risk_signal              WHERE student_id = p_student_id;
  DELETE FROM exam_preparation         WHERE student_id = p_student_id;

  -- El que hace casi todo el trabajo: `action`, `commitment`, `evidence`,
  -- `reflection`, `topic_progress`, `progress_entry` y las declaraciones con
  -- cursada se van en cascada desde acá.
  DELETE FROM course_enrollment        WHERE student_id = p_student_id;

  -- Las que quedan son las declaraciones **sin cursada**: la electiva que el
  -- estudiante escribió a mano. La cascada no las alcanza porque no colgaban de
  -- ninguna cursada.
  DELETE FROM requirement_declaration  WHERE student_id = p_student_id;
  DELETE FROM enrollment               WHERE student_id = p_student_id;
  DELETE FROM whatsapp_consent         WHERE student_id = p_student_id;

  IF p_nueva_institucion IS NOT NULL AND p_nueva_institucion <> p_institution_id THEN
    UPDATE student SET institution_id = p_nueva_institucion WHERE id = p_student_id;
  END IF;

  RETURN QUERY SELECT v_cursadas, v_decls, v_cons, v_inscr, v_destino;
END;
$$;

COMMENT ON FUNCTION public.reiniciar_alta_de_prueba IS
  'MODO PRUEBA — deja a un estudiante SINTÉTICO como antes del alta, en una transacción. '
  'No es una capacidad del producto: la ruta que la llama responde 404 sin MODO_PRUEBA=1. '
  'No toca product_event ni audit_log (append-only, I12) ni el catálogo. '
  'p_nueva_institucion simula el padrón, no le devuelve al estudiante una elección (ADR-052).';

REVOKE ALL ON FUNCTION public.reiniciar_alta_de_prueba FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reiniciar_alta_de_prueba TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Las instituciones a las que se puede mover un estudiante en modo prueba.
--
-- **Sólo las que tienen plan publicado.** Una sin plan no es una opción: es el
-- pozo del que salió la Etapa B6.14.7. La UCC no aparece, y no por una lista
-- negra — su Plan 2016 está en `DRAFT` ([ADR-053](../../docs/decisions.md#adr-053)).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.instituciones_de_prueba()
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'institucionId', i.id,
           'nombre', i.name,
           'carreras', (SELECT count(*) FROM academic_program ap2
                         WHERE ap2.institution_id = i.id
                           AND ap2.name <> 'Sin programa declarado')
         ) ORDER BY i.name), '[]'::jsonb)
    FROM institution i
   WHERE EXISTS (
     SELECT 1 FROM curriculum_plan cp
       JOIN academic_program ap ON ap.id = cp.program_id
      WHERE ap.institution_id = i.id AND cp.publication_status = 'PUBLISHED');
$$;

COMMENT ON FUNCTION public.instituciones_de_prueba IS
  'MODO PRUEBA — las instituciones con plan publicado, para mover un estudiante sintético '
  'entre catálogos. No la consume ninguna superficie del producto: el alta ofrece SOLO la '
  'institución del padrón (ADR-052).';

REVOKE ALL ON FUNCTION public.instituciones_de_prueba FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.instituciones_de_prueba TO service_role;
