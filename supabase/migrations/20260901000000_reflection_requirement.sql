-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B2.4 — el requisito de `Reflection` deja de ser un
-- parámetro suelto y pasa a vivir donde `ADR-026` decidió
--
-- La B2.4 se hizo a medias **a propósito**: `C01-051` estaba `OPEN` y el Service
-- recibía el requisito por parámetro para no elegir un default desde el código.
-- `ADR-026` (1 sep 2026, decidido por el owner) lo cerró, así que ahora hay
-- dónde leerlo.
--
-- ## Por qué en `action` y no en una tabla de configuración
--
-- Porque el requisito **se congela en la instancia**. Un flag global mutable
-- reescribiría el pasado: cambiarlo mañana cambiaría si la entrega de la semana
-- pasada era válida. Es el mismo argumento por el que `commitment` congela su
-- `timezone_at_commit` y por el que un `MISSED` no se edita para parecer
-- cumplido.
--
-- ## Por qué el default es `NO_CONFIGURADA` y no `OPTIONAL`
--
-- Son cosas distintas, y el spec las distingue: `OPTIONAL` significa que **se
-- ofrece** la `CTA-016` y omitirla es válido; `NO_CONFIGURADA` significa que
-- nadie configuró nada y no se ofrece. Poner `OPTIONAL` como default de columna
-- haría que toda Action histórica —creada antes de esta decisión— apareciera
-- ofreciendo una Reflection que nadie configuró. **El default de producto es
-- `OPTIONAL`; el default de columna es el silencio.** Quien crea la Action pone
-- el valor.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE action
  ADD COLUMN reflection_requirement TEXT NOT NULL DEFAULT 'NO_CONFIGURADA'
    CHECK (reflection_requirement IN ('NO_CONFIGURADA','OPTIONAL','REQUIRED'));

COMMENT ON COLUMN action.reflection_requirement IS
  'ADR-026. Se congela al crear la Action y no cambia: un requisito que cambia después reescribe si una entrega vieja era válida. NO_CONFIGURADA no es OPTIONAL — la primera no ofrece la CTA-016, la segunda sí.';

-- El paso del protocolo lleva el suyo, y lo trae la Fase B5 junto con la tabla:
-- `protocol_step` no existe todavía. Anotarlo acá evita que alguien "resuelva"
-- el examen con el requisito de la Action, que es de otro objeto y otro ciclo.

-- ─────────────────────────────────────────────────────────────────────────────
-- El ADE congela el requisito al crear la Action
--
-- `ADR-026` §3: **el default del loop diario es `OPTIONAL`.** Se ofrece la
-- `CTA-016` y omitirla es válido; `REQUIRED` sólo donde el contenido versionado
-- lo declare, y ese contenido —el protocolo de examen— es de la Fase B5.
--
-- Va acá y no en el `DEFAULT` de la columna porque son dos cosas distintas: el
-- default de columna es el **silencio** (`NO_CONFIGURADA`), para que ninguna
-- Action histórica empiece a ofrecer una Reflection que nadie configuró. El
-- default de **producto** lo pone quien crea la Action, que hoy es el ADE.
--
-- El resto de la función no cambia; se reemplaza entera porque es la forma de
-- versionarla en una migración.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.materializar_recomendacion(
  p_institution_id       UUID,
  p_course_enrollment_id UUID,
  p_topic_id             UUID,
  p_objective            TEXT,
  p_verb                 TEXT,
  p_scope                TEXT,
  p_minutes_min          INTEGER,
  p_minutes_max          INTEGER,
  p_resource_id          UUID,
  p_expected_evidence    TEXT,
  p_completion_criterion TEXT,
  p_reason               TEXT,
  p_priority             INTEGER
)
RETURNS TABLE (action_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
  v_action UUID;
BEGIN
  -- El ADE no apila. Si ya hay una Action viva para esta cursada, no se crea
  -- otra: `UX01` muestra **una** acción, y dos vivas sería el frontend
  -- eligiendo, que es justo lo que el spec prohíbe.
  PERFORM 1 FROM action
   WHERE course_enrollment_id = p_course_enrollment_id
     AND institution_id = p_institution_id
     AND status NOT IN ('COMPLETED','CANCELLED','REPLACED')
   LIMIT 1;
  IF FOUND THEN
    RETURN;
  END IF;

  INSERT INTO action (
    institution_id, course_enrollment_id, topic_id,
    objective, verb, scope,
    estimated_minutes_min, estimated_minutes_max,
    expected_evidence, completion_criterion, status,
    reflection_requirement
  ) VALUES (
    p_institution_id, p_course_enrollment_id, p_topic_id,
    p_objective, p_verb, p_scope,
    p_minutes_min, p_minutes_max,
    p_expected_evidence, p_completion_criterion, 'RECOMMENDED',
    -- `ADR-026`. Congelado acá: si mañana cambia la política, las Actions ya
    -- creadas conservan la regla con la que el estudiante se comprometió.
    'OPTIONAL'
  )
  RETURNING id INTO v_action;

  -- El recurso es opcional en el schema, pero si vino se vincula: `UX03`
  -- muestra "Usá:" sólo cuando hay con qué.
  IF p_resource_id IS NOT NULL THEN
    INSERT INTO action_resource (action_id, resource_id, is_required)
    VALUES (v_action, p_resource_id, TRUE);
  END IF;

  -- La primaria. El índice único parcial garantiza que sea una sola (I6).
  INSERT INTO action_recommendation (action_id, reason_primary, priority, is_primary, engine_version)
  VALUES (v_action, p_reason, p_priority, TRUE, 'ade-v1-determinista');

  RETURN QUERY SELECT v_action;
END;
$$;

REVOKE ALL ON FUNCTION public.materializar_recomendacion FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.materializar_recomendacion TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- `estado_de_evidencia` lee el requisito de la Action, y deja de recibirlo
--
-- La versión de `20260831040000` recibía `p_reflexion_requerida` **por
-- parámetro**, porque `C01-051` estaba `OPEN` y no había dónde leerlo sin
-- inventar la decisión. `ADR-026` la cerró y ahora vive en la Action.
--
-- **`DROP` y no sólo `CREATE OR REPLACE`:** cambia la firma —un parámetro
-- menos—, y un `REPLACE` dejaría las dos versiones conviviendo como sobrecargas.
-- La que sobrevive tiene que ser una sola.
--
-- Y la migración vieja **no se edita**: ya corrió. Editarla haría que un
-- `db:reset` desde cero fallara, porque referiría una columna que todavía no
-- existe en ese punto de la historia.
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.estado_de_evidencia(UUID, UUID, TIMESTAMPTZ, UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION public.estado_de_evidencia(
  p_institution_id UUID,
  p_student_id     UUID,
  p_ahora          TIMESTAMPTZ,
  p_evidence_id    UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH vigente AS (
    SELECT e.*, a.objective, a.expected_evidence, a.completion_criterion,
           a.reflection_requirement,
           c.name AS materia, t.name AS unidad
      FROM evidence e
      JOIN action a ON a.id = e.action_id
      JOIN course_enrollment ce ON ce.id = a.course_enrollment_id
      JOIN course_offering o ON o.id = ce.offering_id
      JOIN course c ON c.id = o.course_id
      LEFT JOIN topic t ON t.id = a.topic_id
     WHERE e.institution_id = p_institution_id
       AND ce.student_id = p_student_id
       AND (p_evidence_id IS NULL OR e.id = p_evidence_id)
       -- La superseded no se muestra como la actual: se preserva (`I4`), no se
       -- proyecta. La actual es la que nadie reemplazó.
       AND (p_evidence_id IS NOT NULL OR e.superseded_by_id IS NULL)
     ORDER BY e.created_at DESC LIMIT 1
  )
  SELECT jsonb_build_object(
    'instante', p_ahora,
    'zona', COALESCE(s.timezone, 'UTC'),
    'evidenciaId', v.id,
    'lifecycle', v.lifecycle_state,
    'materia', v.materia,
    'unidad', v.unidad,
    'objetivo', v.objective,
    'evidenciaEsperada', v.expected_evidence,
    'criterioCierre', v.completion_criterion,
    -- Congelado en la Action al crearla (`ADR-026`). Ternario: la proyección
    -- distingue no ofrecerla, ofrecerla, y ofrecerla bloqueando el submit.
    'requisitoDeReflexion', v.reflection_requirement,
    'reflexionPresente', EXISTS (
        SELECT 1 FROM reflection rf WHERE rf.evidence_id = v.id),
    -- El adjunto ya subido, si hay. La pantalla no vuelve a pedirlo.
    'adjuntoPrevio', (SELECT ec.display_name FROM evidence_content ec
                       WHERE ec.evidence_id = v.id
                       ORDER BY ec.sort_order ASC LIMIT 1),
    'esResubmission', v.supersedes_id IS NOT NULL,
    'razonResubmission', v.resubmission_reason,
    -- `UNDER_REVIEW` exige instancia real: viaja el hecho, no el método.
    'revisionReal', v.review_instance_id IS NOT NULL,
    -- Entrega tardía: se entregó después del vencimiento del compromiso.
    'tardia', (v.submitted_at IS NOT NULL AND EXISTS (
        SELECT 1 FROM commitment cm
         WHERE cm.id = v.commitment_id
           AND v.submitted_at > cm.start_at + (cm.planned_minutes || ' minutes')::interval))
  )
  FROM vigente v
  JOIN student s ON s.id = p_student_id AND s.institution_id = p_institution_id;
$$;

GRANT EXECUTE ON FUNCTION public.estado_de_evidencia TO service_role;
