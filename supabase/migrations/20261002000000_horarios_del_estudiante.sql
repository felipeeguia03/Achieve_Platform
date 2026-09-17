-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Fase B6.22 — contra qué se compara un horario propuesto
--
-- [ADR-064](../../docs/decisions.md#adr-064) pone la restricción horaria en el
-- flujo del `Commitment`: *"el ADE continúa decidiendo qué hacer… **el flujo de
-- `Commitment` decide cuándo hacerlo**"*. Para decidirlo hace falta saber cuándo
-- está en clase, y eso son **todos** sus bloques, no los de una materia.
--
-- ## Por qué todas las cursadas y no la de la Action
--
-- Comprometerse a estudiar Cálculo el martes a las 18:30 choca con la clase de
-- **Física** de 18 a 20 igual que con la de Cálculo. Nadie puede estudiar
-- mientras cursa otra cosa, y filtrar por materia dejaría pasar justo el caso
-- que el estudiante no ve venir.
--
-- ## Los dos dueños, en una sola respuesta
--
-- El horario **publicado** cuelga de la oferta y el **declarado** de la cursada
-- ([ADR-063](../../docs/decisions.md#adr-063)). Los dos restringen igual: *"un
-- horario declarado por el estudiante puede usarse inmediatamente como una
-- restricción personal para sus compromisos"*. Se devuelven juntos porque para
-- esta pregunta son lo mismo — **y sólo para ésta**: `estado_de_materia` los
-- sigue entregando rotulados y sin fusionar, que es lo que `P-08` exige de la
-- pantalla.
--
-- ⚠️ **Usarlo sin corroborar no lo eleva** (`I9`): esta función no toca
-- `verification_status` ni lo mira. La regla del ADR es explícita en que no hace
-- falta corroboración humana para que el propio estudiante use lo que declaró.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.horarios_del_estudiante(
  p_institution_id UUID,
  p_student_id     UUID
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH cursadas AS (
    SELECT ce.id, ce.offering_id
      FROM course_enrollment ce
     WHERE ce.institution_id = p_institution_id
       AND ce.student_id = p_student_id
       -- Una cursada terminada o abandonada **ya no ocupa el martes**.
       AND ce.status = 'active'
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'dia', b.day_of_week,
           'desde', b.start_time,
           'hasta', b.end_time)
           ORDER BY b.day_of_week ASC, b.start_time ASC), '[]'::jsonb)
    FROM class_schedule_block b
   WHERE b.institution_id = p_institution_id
     AND (b.course_enrollment_id IN (SELECT id FROM cursadas)
          OR b.offering_id IN (SELECT offering_id FROM cursadas));
$$;

GRANT EXECUTE ON FUNCTION public.horarios_del_estudiante TO service_role;

COMMENT ON FUNCTION public.horarios_del_estudiante IS
  'Todos los bloques de clase conocidos del estudiante, publicados y declarados, para validar el '
  'horario de un Commitment (ADR-064). Vacío = no se sabe, y no se bloquea nada.';
