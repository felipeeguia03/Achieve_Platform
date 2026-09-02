-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.7.2 — el denominador
--
-- Cierra los puntos **9.1** y **9.6** de la validación psicopedagógica
-- ([ADR-037](../../docs/decisions.md#adr-037)). La fuente literal es
-- [`validacion-psicopedagogica-source.md`](../../docs/validacion-psicopedagogica-source.md)
-- y **manda sobre este comentario**.
--
-- > *"No contar automáticamente dos errores sólo porque comparten una etiqueta
-- > amplia. **Deben coincidir el tipo de error y el objetivo de aprendizaje o
-- > demanda cognitiva principal.**"* — `9.1`
--
-- > *"Separar **'repetición detectada' de 'dificultad confirmada'**."* — `9.1`
--
-- ## El problema que resuelve, en una línea
--
-- Hasta acá el contador sumaba dos errores del mismo tipo **en contenidos no
-- comparables**, y ella marcó exactamente eso: *"no necesariamente expresan la
-- misma dificultad"*. El umbral nunca fue el problema. El denominador sí.
--
-- ## Lo que esta migración NO hace
--
-- **No define qué hace comparables a dos tareas.** Ella lo dejó entre lo que hay
-- que evaluar antes de un piloto —*"cómo se define una 'tarea comparable'"*—, así
-- que la comparabilidad **se declara, nunca se infiere**, y `learning_objective`
-- nace **vacía**, como `playbook` con `C01-044`.
--
-- **No toca `9.2`, `9.3` ni `9.4`.** El reinicio con dos aciertos limpios, las
-- cinco condiciones de corrección válida y los disparadores cualitativos
-- tempranos son la Etapa **B6.7.3**. Las claves de configuración que todavía
-- llevan el valor del Product Owner **se nombran una por una** en
-- `threshold_config.pendiente_b6_7_3`, en vez de quedar disimuladas.
--
-- ⚠️ **No autoriza datos reales.** [ADR-006](../../docs/decisions.md#adr-006)
-- sigue siendo bloqueo absoluto.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1 · El objetivo de aprendizaje o demanda cognitiva ──────────────────────
--
-- > *"Deben coincidir el tipo de error **y el objetivo de aprendizaje o demanda
-- > cognitiva principal**."*
--
-- **No existía nada de esto en el repositorio.** `topic` es contenido y
-- `action.objective` es el objetivo de una acción diaria: ninguno de los dos es
-- esto. Y ella los mantiene separados en su propia lista, porque pide contar por
-- objetivo/demanda **y además** registrar el tema.
--
-- `kind` existe porque ella ofrece las dos cosas como alternativas. **Lo que no
-- se hace es elegir una taxonomía**: no hay verbos de Bloom ni niveles de
-- demanda cargados acá. La tabla arranca vacía y sólo entran filas declaradas.
CREATE TABLE learning_objective (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  -- Alcance opcional. Un objetivo puede vivir en una materia, en un tema, o en
  -- ninguno de los dos: eso lo dice quien lo declara.
  course_id      UUID REFERENCES course(id) ON DELETE CASCADE,
  topic_id       UUID REFERENCES topic(id) ON DELETE SET NULL,

  kind           TEXT NOT NULL
                   CHECK (kind IN ('objetivo_de_aprendizaje','demanda_cognitiva')),
  label          TEXT NOT NULL CHECK (length(btrim(label)) > 0),
  description    TEXT,

  -- Provenance, igual que toda la capa académica (`data-model.md` §4). Un
  -- objetivo declarado por el estudiante **no se eleva solo** a oficial.
  source_type    TEXT NOT NULL CHECK (source_type IN
                   ('institution','instructor','student','community','public_web','inference')),
  source_ref     TEXT,
  observed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
                   CHECK (verification_status IN
                     ('unverified','corroborated','official','disputed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX learning_objective_por_curso ON learning_objective (institution_id, course_id);
CREATE INDEX learning_objective_por_tema  ON learning_objective (topic_id);

COMMENT ON TABLE learning_objective IS
  'Vacía a propósito (ADR-037, 9.5-9.1): la comparabilidad se declara. Cómo se define una "tarea comparable" sigue abierto.';
COMMENT ON COLUMN learning_objective.kind IS
  'Ella ofrece objetivo de aprendizaje O demanda cognitiva. No se carga ninguna taxonomía.';

ALTER TABLE learning_objective ENABLE ROW LEVEL SECURITY;

-- ── 2 · Lo que la observación pasa a registrar ──────────────────────────────
--
-- `9.1`: *"Registrar además **tema, ayuda, formato de tarea y confianza de
-- clasificación**."* El tema ya estaba. Los otros tres entran acá.
--
-- `9.6`: *"Guardar **`evidence_quality`, `error_identifiable` y
-- `classification_confidence`**."*
ALTER TABLE error_observation
  -- **La cuarta dimensión de la unidad de conteo.** Nullable: que no se sepa el
  -- objetivo es un estado legítimo, y lo que cambia es que entonces **no hay
  -- comparabilidad que afirmar**.
  ADD COLUMN learning_objective_id UUID REFERENCES learning_objective(id) ON DELETE RESTRICT,

  -- Los tres estados de `9.6`. **Es otro eje que `evidence.lifecycle_state`**:
  -- una entrega `INSUFFICIENT` puede ser perfectamente legible. Fundirlos
  -- rompería *"enviar no es suficiencia"*, que es el invariante que este
  -- repositorio más protege.
  ADD COLUMN evidence_quality TEXT
    CHECK (evidence_quality IN
      ('suficiente_de_logro','suficiente_para_identificar_error','no_interpretable')),
  ADD COLUMN error_identifiable BOOLEAN,
  -- **Ordinal, no un número.** Nadie calcula esta probabilidad: la declara quien
  -- clasifica. Un `0.73` escrito a mano parece medición y no lo es, y
  -- `product.md` §13 prohíbe *"un score opaco como única salida"*.
  ADD COLUMN classification_confidence TEXT
    CHECK (classification_confidence IN ('alta','media','baja')),

  -- Contexto de `9.1`. **Ninguno de los dos entra al contador.** La *validez* de
  -- la ayuda es `9.3`, o sea la B6.7.3.
  ADD COLUMN task_format TEXT,
  ADD COLUMN support_offered TEXT;

-- Una evidencia no interpretable no puede, a la vez, permitir identificar el
-- error. Es la contradicción que `9.6` describe al pedir los tres estados.
ALTER TABLE error_observation
  ADD CONSTRAINT no_interpretable_no_identifica
    CHECK (evidence_quality <> 'no_interpretable' OR error_identifiable IS NOT TRUE);

CREATE INDEX error_observation_por_objetivo
  ON error_observation (exam_preparation_id, learning_objective_id, observed_at);

COMMENT ON COLUMN error_observation.learning_objective_id IS
  'La cuarta dimensión de la unidad de conteo (9.1). NULL = no hay comparabilidad que afirmar.';
COMMENT ON COLUMN error_observation.evidence_quality IS
  'Eje distinto de evidence.lifecycle_state. Una entrega INSUFFICIENT puede ser legible, y entonces cuenta (9.6).';
COMMENT ON COLUMN error_observation.classification_confidence IS
  'Ordinal declarado, no calculado. El umbral vive en risk_rule.threshold_config.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · La regla, con la unidad de conteo de ella
--
-- **Los dos números no se movieron**, y hay que decirlo con precisión: `2` y `3`
-- son ahora suyos, no del Product Owner. Ella los recomendó textual
-- —*"`repeat_signal_at = 2`"*, *"`human_review_at = 3`"*— después de mirar los
-- del PO. Lo que cambió es **qué se cuenta**.
--
-- `v2.0-po-provisional` se apaga con un `UPDATE`. **No se borra:** es lo que él
-- decidió, y sigue explicando las señales que produjo.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE risk_rule SET is_current = FALSE
 WHERE canonical_id = 'HP0-06-1' AND version = 'v2.0-po-provisional';

INSERT INTO risk_rule (
  canonical_id, version, signal_type, label, source_text,
  threshold_config, suggested_severity, modo, is_current,
  provisional_default_id, provisional_version
) VALUES (
  'HP0-06-1', 'v3.0-psicopedagogia', 'error_reiterado',
  'Un error que se repite y exige corregir el método',
  -- La **situación** sigue siendo la que ella nombró en `HUMAN-P0-06 v1.0`.
  'cuando aparece un error reiterativo que requiere identificar que está haciendo mal y corregir la forma/método',
  jsonb_build_object(
    'autoridad',  'psicopedagoga',
    'fuente',     'ADR-037 · validacion-psicopedagogica-source.md · 9.1 y 9.6',
    'validacion', 'VALIDACIÓN CON MODIFICACIONES PARA MVP CON DATOS SINTÉTICOS — no autoriza estudiantes reales',
    'alcance',    'exam_preparation',

    -- Los mismos números, con otro denominador.
    'apariciones', jsonb_build_object('atencion', 2, 'intervencion', 3),

    -- **9.1 · la unidad de conteo.** El estudiante viene implícito en la
    -- preparación, que es de uno solo.
    'unidad_de_conteo', jsonb_build_array('estudiante','preparacion','familia_de_error','objetivo_o_demanda'),
    -- Sin objetivo declarado **no hay comparabilidad que afirmar**, y entonces
    -- no se escala. La repetición se sigue detectando y se sigue diciendo.
    'exige_objetivo_comparable', TRUE,

    -- **9.6 · qué evidencia deja contar.** Una entrega insuficiente **cuenta**
    -- si el error es identificable: excluirla *"sesgaría la detección contra
    -- quienes más necesitan acompañamiento"*.
    'exige_error_identificable', TRUE,
    'calidad_excluida', jsonb_build_array('no_interpretable'),
    'confianza_minima', 'media',

    'solo_corroboradas', TRUE,

    -- Heredado del PO y **todavía sin la corrección de ella**. Se nombra en vez
    -- de disimularse: `9.4` pide dos aciertos limpios y `9.3` pide las cinco
    -- condiciones de corrección válida.
    'reincidencia_tras_correctiva', 'intervencion',
    'reinicia_con_resolucion_limpia', TRUE,
    'pendiente_b6_7_3', jsonb_build_array(
      '9.3 · acelerar exige que la corrección haya sido válida (cinco condiciones)',
      '9.4 · reiniciar exige DOS aciertos limpios, y abre episodio vinculado',
      '9.2 · early_review_triggers cualitativos'
    )
  ),
  'intervencion',
  'AUTOMATICA', TRUE,
  'PSICOPEDAGOGIA-ADR-037', 'v1.0-mvp-sintetico-no-autoriza-datos-reales'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · El escritor, con lo que `9.6` pide guardar
--
-- Firma nueva otra vez —`DROP` y `CREATE`—: agregar parámetros crea sobrecargas,
-- y dos funciones con el mismo nombre hacen ambigua cualquier llamada que use
-- los defaults.
--
-- Lo que suma:
--
--   · **Corroborar un error exige que el error sea identificable.** Es la
--     traducción exacta de `9.6`: cuenta *"cuando fue evaluada y permite
--     identificar el error con claridad"*. No alcanza con que alguien la haya
--     mirado.
--   · **Una evidencia no interpretable no corrobora nada.** Fotos ilegibles,
--     respuestas vacías, abandono sin producción.
--   · **El objetivo tiene que ser de la misma institución.** Comparar contra el
--     objetivo de otra sería comparabilidad inventada.
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.registrar_observacion_de_error(
  UUID, UUID, UUID, TEXT, BOOLEAN, UUID, UUID, UUID, TEXT, UUID, TEXT, UUID);

CREATE FUNCTION public.registrar_observacion_de_error(
  p_institution_id      UUID,
  p_exam_preparation_id UUID,
  p_error_type_id       UUID,
  p_kind                TEXT,
  p_corroborated        BOOLEAN,
  p_evidence_id         UUID DEFAULT NULL,
  p_topic_id            UUID DEFAULT NULL,
  p_after_action_id     UUID DEFAULT NULL,
  p_note                TEXT DEFAULT NULL,
  p_recorded_by         UUID DEFAULT NULL,
  p_idempotency_key     TEXT DEFAULT NULL,
  p_secondary_error_type_id UUID DEFAULT NULL,
  p_learning_objective_id   UUID DEFAULT NULL,
  p_evidence_quality        TEXT DEFAULT NULL,
  p_error_identifiable      BOOLEAN DEFAULT NULL,
  p_classification_confidence TEXT DEFAULT NULL,
  p_task_format             TEXT DEFAULT NULL,
  p_support_offered         TEXT DEFAULT NULL
)
RETURNS TABLE (observation_id UUID, duplicado BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_existente UUID;
  v_student   UUID;
  v_estado_ev TEXT;
  v_prep_ev   UUID;
  v_vigente   BOOLEAN;
  v_familia   BOOLEAN;
  v_id        UUID;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT o.id INTO v_existente FROM error_observation o
     WHERE o.institution_id = p_institution_id AND o.idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN QUERY SELECT v_existente, TRUE;
      RETURN;
    END IF;
  END IF;

  SELECT p.student_id INTO v_student FROM exam_preparation p
   WHERE p.id = p_exam_preparation_id AND p.institution_id = p_institution_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'la preparación % no pertenece a la institución %',
      p_exam_preparation_id, p_institution_id;
  END IF;

  -- El vocabulario vigente es el único con el que se clasifica algo nuevo.
  SELECT t.is_current INTO v_vigente FROM error_type t WHERE t.id = p_error_type_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'el tipo de error % no existe', p_error_type_id;
  END IF;
  IF NOT v_vigente THEN
    RAISE EXCEPTION 'el tipo de error % pertenece a una versión apagada del vocabulario', p_error_type_id;
  END IF;

  IF p_secondary_error_type_id IS NOT NULL THEN
    SELECT t.is_current, t.es_familia INTO v_vigente, v_familia
      FROM error_type t WHERE t.id = p_secondary_error_type_id;
    IF NOT FOUND OR NOT v_vigente THEN
      RAISE EXCEPTION 'la categoría secundaria no pertenece al vocabulario vigente';
    END IF;
    IF NOT v_familia THEN
      RAISE EXCEPTION 'la categoría secundaria tiene que ser una familia de error';
    END IF;
  END IF;

  -- Comparar contra el objetivo de otra institución sería comparabilidad
  -- inventada.
  IF p_learning_objective_id IS NOT NULL THEN
    PERFORM 1 FROM learning_objective o
     WHERE o.id = p_learning_objective_id AND o.institution_id = p_institution_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'el objetivo de aprendizaje % no pertenece a la institución %',
        p_learning_objective_id, p_institution_id;
    END IF;
  END IF;

  -- Corroborar exige una evidencia juzgada. **No alcanza con que exista**: si
  -- nadie la evaluó, lo que hay es una sospecha, y una sospecha no cuenta.
  IF p_corroborated THEN
    IF p_evidence_id IS NULL THEN
      RAISE EXCEPTION 'una observación corroborada necesita la evidencia que la sostiene';
    END IF;
    SELECT e.lifecycle_state, a.exam_preparation_id INTO v_estado_ev, v_prep_ev
      FROM evidence e
      JOIN action a ON a.id = e.action_id
     WHERE e.id = p_evidence_id AND e.institution_id = p_institution_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'la evidencia % no pertenece a la institución %',
        p_evidence_id, p_institution_id;
    END IF;
    IF v_estado_ev NOT IN ('SUFFICIENT','INSUFFICIENT','VALIDATED') THEN
      RAISE EXCEPTION 'la evidencia está en % y nadie la evaluó: no corrobora nada', v_estado_ev;
    END IF;
    IF v_prep_ev IS DISTINCT FROM p_exam_preparation_id THEN
      RAISE EXCEPTION 'la evidencia no pertenece a esta preparación de examen';
    END IF;

    -- **9.6.** Una entrega insuficiente cuenta **si el error es identificable**.
    -- Lo que no cuenta es lo que no se puede leer.
    IF p_evidence_quality IS NULL THEN
      RAISE EXCEPTION 'una observación corroborada necesita declarar la calidad de la evidencia (9.6)';
    END IF;
    IF p_evidence_quality = 'no_interpretable' THEN
      RAISE EXCEPTION 'una evidencia no interpretable no corrobora nada: no se puede distinguir qué ocurrió';
    END IF;
    IF p_kind = 'error' AND p_error_identifiable IS NOT TRUE THEN
      RAISE EXCEPTION 'un error corroborado exige que el error sea identificable (9.6)';
    END IF;
  END IF;

  INSERT INTO error_observation (
    institution_id, student_id, exam_preparation_id, error_type_id, kind,
    evidence_id, topic_id, after_action_id, corroborated, note, recorded_by,
    idempotency_key, secondary_error_type_id,
    learning_objective_id, evidence_quality, error_identifiable,
    classification_confidence, task_format, support_offered
  ) VALUES (
    p_institution_id, v_student, p_exam_preparation_id, p_error_type_id, p_kind,
    p_evidence_id, p_topic_id, p_after_action_id, COALESCE(p_corroborated, FALSE),
    p_note, p_recorded_by, p_idempotency_key, p_secondary_error_type_id,
    p_learning_objective_id, p_evidence_quality, p_error_identifiable,
    p_classification_confidence, p_task_format, p_support_offered
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_observacion_de_error FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_observacion_de_error TO service_role;

COMMENT ON FUNCTION public.registrar_observacion_de_error IS
  'ADR-037 (9.1 y 9.6): el objetivo declara la comparabilidad, y sólo cuenta lo que se puede leer.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · La corrección devuelve también el objetivo
--
-- Una reclasificación cambia la **familia**, no el objetivo — así que los dos
-- pares a re-evaluar son `(familia vieja, objetivo)` y `(familia nueva, mismo
-- objetivo)`. Sin devolverlo, el llamador tendría que ir a buscarlo, o peor:
-- re-evaluar la familia entera y volver a mezclar lo no comparable.
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.corregir_clasificacion_de_error(UUID, UUID, UUID, TEXT, UUID, UUID);

CREATE FUNCTION public.corregir_clasificacion_de_error(
  p_institution_id     UUID,
  p_observation_id     UUID,
  p_to_error_type_id   UUID,
  p_reason             TEXT,
  p_to_secondary_type_id UUID DEFAULT NULL,
  p_corrected_by       UUID DEFAULT NULL
)
RETURNS TABLE (
  correction_id         UUID,
  from_canonical_id     TEXT,
  to_canonical_id       TEXT,
  exam_preparation_id   UUID,
  learning_objective_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_from      UUID;
  v_from_sec  UUID;
  v_prep      UUID;
  v_objetivo  UUID;
  v_vigente   BOOLEAN;
  v_familia   BOOLEAN;
  v_id        UUID;
BEGIN
  SELECT o.error_type_id, o.secondary_error_type_id, o.exam_preparation_id, o.learning_objective_id
    INTO v_from, v_from_sec, v_prep, v_objetivo
    FROM error_observation o
   WHERE o.id = p_observation_id AND o.institution_id = p_institution_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'la observación % no pertenece a la institución %',
      p_observation_id, p_institution_id;
  END IF;

  SELECT t.is_current INTO v_vigente FROM error_type t WHERE t.id = p_to_error_type_id;
  IF NOT FOUND OR NOT v_vigente THEN
    RAISE EXCEPTION 'no se puede reclasificar a una versión apagada del vocabulario';
  END IF;

  IF p_to_secondary_type_id IS NOT NULL THEN
    IF p_to_secondary_type_id = p_to_error_type_id THEN
      RAISE EXCEPTION 'la categoría secundaria no puede ser la misma que la principal';
    END IF;
    SELECT t.is_current, t.es_familia INTO v_vigente, v_familia
      FROM error_type t WHERE t.id = p_to_secondary_type_id;
    IF NOT FOUND OR NOT v_vigente THEN
      RAISE EXCEPTION 'la categoría secundaria no pertenece al vocabulario vigente';
    END IF;
    IF NOT v_familia THEN
      RAISE EXCEPTION 'la categoría secundaria tiene que ser una familia de error';
    END IF;
  END IF;

  IF v_from = p_to_error_type_id
     AND v_from_sec IS NOT DISTINCT FROM p_to_secondary_type_id THEN
    RAISE EXCEPTION 'la corrección no cambia la clasificación';
  END IF;

  INSERT INTO error_classification_correction (
    institution_id, observation_id,
    from_error_type_id, from_secondary_type_id,
    to_error_type_id, to_secondary_type_id,
    reason, corrected_by
  ) VALUES (
    p_institution_id, p_observation_id,
    v_from, v_from_sec,
    p_to_error_type_id, p_to_secondary_type_id,
    p_reason, p_corrected_by
  )
  RETURNING id INTO v_id;

  UPDATE error_observation
     SET error_type_id = p_to_error_type_id,
         secondary_error_type_id = p_to_secondary_type_id
   WHERE id = p_observation_id;

  RETURN QUERY
    SELECT v_id,
           (SELECT t.canonical_id FROM error_type t WHERE t.id = v_from),
           (SELECT t.canonical_id FROM error_type t WHERE t.id = p_to_error_type_id),
           v_prep,
           v_objetivo;
END;
$$;

REVOKE ALL ON FUNCTION public.corregir_clasificacion_de_error FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.corregir_clasificacion_de_error TO service_role;

COMMENT ON FUNCTION public.corregir_clasificacion_de_error IS
  'ADR-037 (9.5 + 9.1): append-only, y devuelve el objetivo para re-evaluar los dos pares comparables.';
