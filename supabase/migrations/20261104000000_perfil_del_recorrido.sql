-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Las preguntas del recorrido y las hipótesis de perfil
--
-- [ADR-107](../../docs/decisions.md#adr-107), decidido por el owner el 13 de
-- septiembre de 2026: *"no se llevan, que no se impida nada"*. **Sólo datos
-- sintéticos**: ADR-006 sigue intacto.
--
-- ## Dos tablas, y la respuesta no es la hipótesis
--
-- | Tabla | Qué es |
-- |---|---|
-- | `profile_answer` | lo que el estudiante **declaró**, con el texto de la pregunta congelado. Append-only |
-- | `profile_hypothesis` | lo que se **deriva**: dimensión, enunciado, evidencia, confianza. Aparte |
--
-- ## La vigencia se deduce, no se escribe
--
-- Una hipótesis está vigente si su respuesta **es la última de esa pregunta** y
-- la pregunta **sigue generándose** con el analítico de hoy. Lo segundo lo sabe
-- la regla `RECORRIDO-v0.1`, en `lib/domain/`: si una corrección del analítico
-- hace que la pregunta ya no salga, sus hipótesis quedan sin vigencia **sin que
-- nadie las borre ni las edite** (ADR-107 §6). La única escritura sobre una
-- hipótesis es *«Esto no me representa»*.
--
-- ## Lo que estas tablas NO son
--
-- ⛔ **No son un Student Model.** `C01-043` sigue sin especificar: esto es el
-- perfil que declara el recorrido, con su procedencia, y nada lo consume todavía.
-- ⛔ **No las lee el ADE**, ni el riesgo, ni Hoy (ADR-107 «Qué no hace»).
-- ⛔ **No comparan estudiantes** ni guardan un puntaje.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE profile_answer (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,

  -- La pregunta, **congelada**: si mañana cambia la redacción, se sabe qué se contestó.
  question_key  TEXT NOT NULL CHECK (length(btrim(question_key)) > 0),
  trigger_kind  TEXT NOT NULL CHECK (trigger_kind IN
                  ('MATERIA_ACTUAL','RECUPERACION','PERSISTENCIA','CAMBIO_DE_PERIODO','FORTALEZA','CALIBRACION')),
  rule_version  TEXT NOT NULL,
  question_text TEXT NOT NULL CHECK (length(btrim(question_text)) > 0),
  subject_requirement_ids UUID[] NOT NULL DEFAULT '{}',

  status     TEXT NOT NULL CHECK (status IN ('ANSWERED','UNSURE','PREFER_NOT_TO_SAY','SKIPPED')),
  options    TEXT[] NOT NULL DEFAULT '{}',
  free_text  TEXT CHECK (free_text IS NULL OR length(free_text) <= 1000),
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Responder dice algo; no responder no lleva ni opciones ni texto.
  CONSTRAINT respuesta_dice_algo CHECK (
    (status = 'ANSWERED' AND (cardinality(options) > 0 OR length(btrim(COALESCE(free_text,''))) > 0))
    OR (status <> 'ANSWERED' AND cardinality(options) = 0 AND free_text IS NULL))
);

COMMENT ON TABLE profile_answer IS
  'ADR-107 §3: la declaración del estudiante, append-only. Contestar de nuevo es otra fila; la '
  'vigente es la última por question_key. Nunca reemplaza una nota, ni una nota la reemplaza.';
COMMENT ON COLUMN profile_answer.free_text IS
  'Texto libre del estudiante. PRIVADO: no viaja a eventos, al CRM ni a la institución, y no se '
  'convierte en hipótesis.';

REVOKE UPDATE ON profile_answer FROM service_role, anon, authenticated;
CREATE INDEX profile_answer_student_idx ON profile_answer (student_id, question_key, answered_at DESC);

CREATE TABLE profile_hypothesis (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  answer_id      UUID NOT NULL REFERENCES profile_answer(id) ON DELETE CASCADE,
  question_key   TEXT NOT NULL,

  dimension TEXT NOT NULL CHECK (dimension IN (
    'ESTRATEGIA_QUE_FUNCIONO','ESTRATEGIA_A_PROBAR','OBSTACULO_DECLARADO','ACTIVADOR_PERSONAL',
    'SENSIBILIDAD_A_MODALIDAD','CALIBRACION_NOTA','FORTALEZA_HISTORICA','RECUPERACION','PERSISTENCIA','CONTEXTO')),
  -- El enunciado **tal como se mostró**. Se redacta como lo que es: «nos contaste»,
  -- «figura en tu analítico». Nunca una etiqueta ni una causa.
  statement     TEXT NOT NULL CHECK (length(btrim(statement)) > 0),
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('HISTORICO','DECLARADO','HISTORICO_Y_DECLARADO')),
  -- ⚠️ **Sin `ALTA`**: desde el onboarding ninguna hipótesis es firme.
  confidence    TEXT NOT NULL CHECK (confidence IN ('BAJA','MEDIA')),
  rule_version  TEXT NOT NULL,
  source_requirement_ids UUID[] NOT NULL DEFAULT '{}',

  status      TEXT NOT NULL DEFAULT 'VIGENTE' CHECK (status IN ('VIGENTE','RECHAZADA')),
  rejected_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT rechazada_tiene_fecha CHECK ((status = 'RECHAZADA') = (rejected_at IS NOT NULL))
);

COMMENT ON TABLE profile_hypothesis IS
  'ADR-107 §4: una hipótesis derivada, aparte de la respuesta. «Esto no me representa» la marca '
  'RECHAZADA con fecha y no la borra. La vigencia se deduce (última respuesta + pregunta vigente).';

CREATE INDEX profile_hypothesis_student_idx ON profile_hypothesis (student_id);

ALTER TABLE profile_answer     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_hypothesis ENABLE ROW LEVEL SECURITY;

-- ── Responder, en una transacción ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.responder_pregunta(
  p_institution_id UUID,
  p_student_id     UUID,
  p_respuesta      JSONB,
  p_hipotesis      JSONB
)
RETURNS UUID
LANGUAGE plpgsql AS $$
DECLARE
  v_answer UUID;
  h        JSONB;
BEGIN
  INSERT INTO profile_answer
    (institution_id, student_id, question_key, trigger_kind, rule_version, question_text,
     subject_requirement_ids, status, options, free_text)
  VALUES
    (p_institution_id, p_student_id, p_respuesta->>'clave', p_respuesta->>'disparador', p_respuesta->>'regla',
     p_respuesta->>'texto',
     COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_respuesta->'requisitos'))::UUID[], '{}'),
     p_respuesta->>'estado',
     COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_respuesta->'opciones')), '{}'),
     NULLIF(btrim(p_respuesta->>'textoLibre'), ''))
  RETURNING id INTO v_answer;

  FOR h IN SELECT * FROM jsonb_array_elements(COALESCE(p_hipotesis, '[]'::jsonb)) LOOP
    INSERT INTO profile_hypothesis
      (institution_id, student_id, answer_id, question_key, dimension, statement, evidence_type,
       confidence, rule_version, source_requirement_ids)
    VALUES
      (p_institution_id, p_student_id, v_answer, p_respuesta->>'clave', h->>'dimension', h->>'enunciado',
       h->>'evidencia', h->>'confianza', p_respuesta->>'regla',
       COALESCE(ARRAY(SELECT jsonb_array_elements_text(h->'requisitos'))::UUID[], '{}'));
  END LOOP;

  RETURN v_answer;
END;
$$;

-- ── «Esto no me representa» ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rechazar_hipotesis(
  p_institution_id UUID,
  p_student_id     UUID,
  p_hypothesis_id  UUID
)
RETURNS BOOLEAN
LANGUAGE sql AS $$
  WITH u AS (
    UPDATE profile_hypothesis
       SET status = 'RECHAZADA', rejected_at = NOW()
     WHERE id = p_hypothesis_id AND student_id = p_student_id AND institution_id = p_institution_id
       AND status = 'VIGENTE'
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM u);
$$;

-- ── Lo que lee el perfil ─────────────────────────────────────────────────────
--
-- La **última** respuesta de cada pregunta y las hipótesis **de esa respuesta**.
-- Qué preguntas siguen vigentes lo decide la regla en TypeScript.

CREATE OR REPLACE FUNCTION public.perfil_del_estudiante(
  p_institution_id UUID,
  p_student_id     UUID
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH ultimas AS (
    SELECT DISTINCT ON (a.question_key) a.*
      FROM profile_answer a
     WHERE a.student_id = p_student_id AND a.institution_id = p_institution_id
     ORDER BY a.question_key, a.answered_at DESC, a.id DESC
  )
  SELECT jsonb_build_object(
    'respuestas', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                     'id', u.id, 'clave', u.question_key, 'estado', u.status, 'opciones', to_jsonb(u.options),
                     'textoLibre', u.free_text, 'en', u.answered_at) ORDER BY u.answered_at)
                      FROM ultimas u), '[]'::jsonb),
    'hipotesis', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                    'id', h.id, 'clave', h.question_key, 'dimension', h.dimension, 'enunciado', h.statement,
                    'evidencia', h.evidence_type, 'confianza', h.confidence, 'estado', h.status,
                    'rechazadaEn', h.rejected_at) ORDER BY h.created_at, h.id)
                     FROM profile_hypothesis h JOIN ultimas u ON u.id = h.answer_id), '[]'::jsonb),
    -- Las materias que cursa **ahora**: la única entrada del presente que usa la
    -- regla, para la pregunta de materia actual. Sale de la declaración del alta.
    'requisitosCursados', COALESCE((SELECT jsonb_agg(DISTINCT rd.curriculum_requirement_id)
                             FROM requirement_declaration rd
                             JOIN course_enrollment ce ON ce.id = rd.course_enrollment_id AND ce.status = 'active'
                            WHERE rd.student_id = p_student_id AND rd.institution_id = p_institution_id), '[]'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION public.responder_pregunta TO service_role;
GRANT EXECUTE ON FUNCTION public.rechazar_hipotesis TO service_role;
GRANT EXECUTE ON FUNCTION public.perfil_del_estudiante TO service_role;
