-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.7.1 — el vocabulario, con criterio profesional
--
-- Cierra el punto **9.5** de la validación psicopedagógica
-- ([ADR-037](../../docs/decisions.md#adr-037)). La fuente literal es
-- [`validacion-psicopedagogica-source.md`](../../docs/validacion-psicopedagogica-source.md)
-- y **manda sobre este comentario**.
--
-- > *"Conservar **cinco familias académicas** […] **Reemplazar 'dependencia de
-- > ayuda externa' por «necesidad de apoyo para avanzar», registrada como
-- > condición de desempeño y no como error.** Permitir **categoría principal +
-- > secundaria** […] Incluir **'clasificación incierta'** y **opción de
-- > corrección humana**."*
--
-- Y la frase que ordena la fase entera: **«el sistema debe reconocer patrones,
-- no etiquetar personas»**.
--
-- ## Lo que esta migración NO hace
--
-- **No borra ni reescribe el vocabulario del Product Owner.** Las seis filas
-- `v1.0-po-provisional` se apagan con un `UPDATE`, igual que `EP-SPEC v0.1`
-- (B5), `HP0-06-1 v1.0` (B6.5) y `ACKNOWLEDGED` (ADR-034). Una observación
-- registrada bajo aquel vocabulario **conserva la versión con la que se la
-- clasificó**: eso es lo que hace auditable una taxonomía.
--
-- **No mueve un solo umbral.** Los números siguen en `risk_rule.threshold_config`
-- y son los mismos: ella no objetó los umbrales, objetó **qué cuenta como una
-- repetición**. Los umbrales son la Etapa B6.7.2.
--
-- **No autoriza datos reales.** Su validación es de producto y ella condicionó
-- el uso con estudiantes reales a *"piloto, revisión humana, explicabilidad,
-- accesibilidad y monitoreo de equidad"*. [ADR-006](../../docs/decisions.md#adr-006)
-- sigue siendo bloqueo absoluto.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1 · Una familia es una familia, y hay cosas que están en el catálogo sin
--        serlo ───────────────────────────────────────────────────────────────
--
-- `es_familia = FALSE` es el lugar donde vive **'clasificación incierta'**: es
-- una respuesta a *"¿de qué tipo fue este error?"* —la respuesta *"no se pudo
-- determinar"*— y por eso entra al catálogo. Pero **no es una familia**, así que
-- **no alimenta el contador**: contar repeticiones de *"no sé"* como si fueran
-- el mismo error es exactamente el falso positivo que ella marcó.
--
-- El default es `TRUE` **a propósito**: todas las filas que ya existen fueron
-- afirmadas como familias de error por quien las cargó, y esta columna no
-- reescribe esa afirmación.
ALTER TABLE error_type
  ADD COLUMN es_familia BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN error_type.es_familia IS
  'FALSE ⇒ está en el catálogo pero no cuenta para la reiteración (9.5: "clasificación incierta").';

-- ── 2 · Categoría principal + secundaria ────────────────────────────────────
--
-- > *"las categorías pueden solaparse: una omisión puede derivar de
-- > interpretación, atención, método o demanda excesiva."*
--
-- **La secundaria no cuenta nunca.** Ella pidió *"mantener un indicador
-- transversal por tipo para análisis, **pero sin usarlo solo para escalar**"*, y
-- la forma de que eso no dependa de la disciplina de quien escriba la próxima
-- query es que el contador lea una sola columna. La secundaria es información
-- para la persona que recibe el caso.
ALTER TABLE error_observation
  ADD COLUMN secondary_error_type_id UUID REFERENCES error_type(id) ON DELETE RESTRICT;

ALTER TABLE error_observation
  ADD CONSTRAINT secundaria_distinta_de_principal
    CHECK (secondary_error_type_id IS NULL OR secondary_error_type_id <> error_type_id);

CREATE INDEX error_observation_secundaria
  ON error_observation (secondary_error_type_id) WHERE secondary_error_type_id IS NOT NULL;

COMMENT ON COLUMN error_observation.secondary_error_type_id IS
  'Categoría secundaria (9.5). NO entra en el contador: es contexto para quien recibe el caso.';

-- ── 3 · El vocabulario v2.0 ─────────────────────────────────────────────────
--
-- **Los `canonical_id` no cambian**, y es una decisión: es la **misma familia
-- redefinida**, no una familia nueva. Cambiarlos cortaría el vínculo con todo lo
-- ya observado y partiría el contador al medio en silencio.
UPDATE error_type SET is_current = FALSE WHERE version = 'v1.0-po-provisional';

INSERT INTO error_type (canonical_id, version, label, description, es_familia, is_current) VALUES
  ('conceptual', 'v2.0-psicopedagogia', 'Error conceptual',
   'El concepto que la tarea requiere no está consolidado.', TRUE, TRUE),

  ('procedimiento', 'v2.0-psicopedagogia', 'Error de procedimiento o estrategia',
   'La estrategia elegida o el procedimiento aplicado no sostiene la resolución.', TRUE, TRUE),

  ('consigna', 'v2.0-psicopedagogia', 'Error de interpretación de consigna',
   'Lo resuelto no es lo que la consigna pedía. Puede indicar una consigna ambigua y no una dificultad del estudiante.',
   TRUE, TRUE),

  ('calculo', 'v2.0-psicopedagogia', 'Error de cálculo o ejecución',
   'El método es adecuado y la ejecución no.', TRUE, TRUE),

  ('omision', 'v2.0-psicopedagogia', 'Omisión o falla de monitoreo',
   'Falta un paso que la resolución exige, o no se revisó el propio trabajo.', TRUE, TRUE),

  -- **No es una familia.** Es la respuesta honesta cuando quien observa no puede
  -- ubicar el error con confianza suficiente. Se registra —el error ocurrió— y
  -- **no cuenta**.
  ('clasificacion_incierta', 'v2.0-psicopedagogia', 'Clasificación incierta',
   'Se observó un error y no se lo pudo ubicar en una familia con confianza suficiente. No cuenta para la reiteración.',
   FALSE, TRUE);

-- ⚠️ **`dependencia` no tiene fila en v2.0, y ésa es la decisión.**
--
-- > *"La necesidad de ayuda **puede ser esperable y productiva**; denominarla
-- > 'dependencia' corre el riesgo de **estigmatizar**."*
--
-- La fila `v1.0-po-provisional` **se queda como está**, apagada: es lo que el
-- Product Owner afirmó, y editarla sería reescribir su afirmación. Lo que hace
-- que deje de contar no es haberla tocado, sino la regla del §4: el contador
-- sólo evalúa una familia que el vocabulario **vigente** todavía declara como
-- familia. Sin fila vigente, no hay familia.

COMMENT ON TABLE error_type IS
  'Configuración versionada. v2.0-psicopedagogia: cinco familias + clasificación incierta (ADR-037, 9.5).';

-- ── 4 · «Necesidad de apoyo para avanzar» · condición de desempeño ──────────
--
-- Tabla propia, y no un `kind` más en `error_observation`. La decisión de ella
-- es que **no es un error**; guardarlo en una tabla llamada «observación de
-- error» contradiría esa decisión justo donde más se lee después, que es el
-- modelo de datos.
--
-- **Ninguna consulta del contador toca estas dos tablas**, y hay guard estático
-- y comprobación contra Postgres de que sembrar necesidades de apoyo no mueve un
-- contador.
CREATE TABLE support_need_type (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id TEXT NOT NULL,
  version      TEXT NOT NULL,
  label        TEXT NOT NULL,
  description  TEXT,
  is_current   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (canonical_id, version)
);

CREATE UNIQUE INDEX support_need_type_uno_vigente
  ON support_need_type (canonical_id) WHERE is_current;

-- **Una sola fila, porque ella nombró una sola condición.** Agregar otras es
-- decisión suya, no de un agente: `AGENTS.md` §1.1, *"no se inventan valores"*.
INSERT INTO support_need_type (canonical_id, version, label, description, is_current) VALUES
  ('necesidad_de_apoyo', 'v1.0-psicopedagogia', 'Necesidad de apoyo para avanzar',
   'Condición de desempeño, no un error. Puede ser esperable y productiva.', TRUE);

CREATE TABLE support_need_observation (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id          UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  exam_preparation_id UUID NOT NULL REFERENCES exam_preparation(id) ON DELETE CASCADE,
  support_need_type_id UUID NOT NULL REFERENCES support_need_type(id) ON DELETE RESTRICT,

  evidence_id         UUID REFERENCES evidence(id) ON DELETE SET NULL,
  topic_id            UUID REFERENCES topic(id) ON DELETE SET NULL,
  note                TEXT,
  observed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by         UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idempotency_key     TEXT
);

CREATE UNIQUE INDEX support_need_observation_idempotencia
  ON support_need_observation (institution_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX support_need_observation_por_preparacion
  ON support_need_observation (exam_preparation_id, observed_at);

COMMENT ON TABLE support_need_observation IS
  'Condición de desempeño (9.5). NO es un error y NO alimenta ningún contador de reiteración.';

-- ── 5 · La corrección humana de una clasificación ───────────────────────────
--
-- > *"Incluir 'clasificación incierta' y **opción de corrección humana**."*
--
-- **Append-only.** La corrección no borra lo que se afirmó primero: escribe de
-- qué a qué, con motivo obligatorio, y recién entonces actualiza la
-- clasificación vigente de la observación. Es la misma idea que ella pidió para
-- el reinicio del contador —*"cerrar el estado activo, no eliminar datos
-- previos"*—, aplicada a la taxonomía.
--
-- ⚠️ **Quién puede corregir NO está definido, y no se inventa acá.** Ella lo
-- puso entre lo que hay que evaluar antes de un piloto: *"cómo se define una
-- 'tarea comparable' y **quién puede corregir una clasificación de error**"*.
-- Por eso `corrected_by` es una **identidad externa** —UUID sin FK, igual que
-- `intervention.owner_operator_id`— y la superficie va con secreto de servicio.
CREATE TABLE error_classification_correction (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  observation_id UUID NOT NULL REFERENCES error_observation(id) ON DELETE CASCADE,

  from_error_type_id      UUID NOT NULL REFERENCES error_type(id) ON DELETE RESTRICT,
  from_secondary_type_id  UUID REFERENCES error_type(id) ON DELETE RESTRICT,
  to_error_type_id        UUID NOT NULL REFERENCES error_type(id) ON DELETE RESTRICT,
  to_secondary_type_id    UUID REFERENCES error_type(id) ON DELETE RESTRICT,

  -- **Obligatorio.** Una reclasificación sin motivo es indistinguible de un
  -- error de tipeo, y es la clase de dato que después nadie puede auditar.
  reason         TEXT NOT NULL CHECK (length(btrim(reason)) > 0),
  -- Identidad externa. **Sin FK a propósito**: el rol no está definido.
  corrected_by   UUID,
  corrected_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT correccion_cambia_algo
    CHECK (from_error_type_id <> to_error_type_id
           OR from_secondary_type_id IS DISTINCT FROM to_secondary_type_id)
);

CREATE INDEX error_classification_correction_por_observacion
  ON error_classification_correction (observation_id, corrected_at);

COMMENT ON TABLE error_classification_correction IS
  'Append-only (9.5). La corrección humana no borra la clasificación anterior: la registra.';
COMMENT ON COLUMN error_classification_correction.corrected_by IS
  'Identidad externa, sin FK: quién puede corregir una clasificación sigue sin definirse (ADR-037).';

-- ── RLS · deny-by-default, como todo lo demás ───────────────────────────────
ALTER TABLE support_need_type               ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_need_observation        ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_classification_correction ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · El escritor de observaciones, ampliado
--
-- Se reemplaza por **firma nueva** —`DROP` y `CREATE`, no `CREATE OR REPLACE`—
-- porque agregarle un parámetro crea una sobrecarga, y dos funciones con el
-- mismo nombre hacen ambigua cualquier llamada que use los defaults.
--
-- Lo que suma, y por qué no podía quedar en el código de aplicación:
--
--   · **Sólo se clasifica con el vocabulario vigente.** Un tipo apagado no
--     acepta observaciones nuevas. Es lo que hace que 'dependencia de ayuda
--     externa' **deje de registrarse como error** sin haber tocado la fila que
--     el Product Owner escribió.
--   · **La secundaria tiene que ser una familia.** 'Clasificación incierta' como
--     categoría secundaria no agrega nada: la principal ya dijo que no se pudo
--     determinar.
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.registrar_observacion_de_error(
  UUID, UUID, UUID, TEXT, BOOLEAN, UUID, UUID, UUID, TEXT, UUID, TEXT);

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
  p_secondary_error_type_id UUID DEFAULT NULL
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
  END IF;

  INSERT INTO error_observation (
    institution_id, student_id, exam_preparation_id, error_type_id, kind,
    evidence_id, topic_id, after_action_id, corroborated, note, recorded_by,
    idempotency_key, secondary_error_type_id
  ) VALUES (
    p_institution_id, v_student, p_exam_preparation_id, p_error_type_id, p_kind,
    p_evidence_id, p_topic_id, p_after_action_id, COALESCE(p_corroborated, FALSE),
    p_note, p_recorded_by, p_idempotency_key, p_secondary_error_type_id
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_observacion_de_error FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_observacion_de_error TO service_role;

COMMENT ON FUNCTION public.registrar_observacion_de_error IS
  'ADR-036 + ADR-037 (9.5): sólo el vocabulario vigente clasifica, y la secundaria tiene que ser una familia.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · Registrar una necesidad de apoyo
--
-- **No evalúa nada, y no puede.** Escribe en una tabla que ningún contador lee.
-- Ella fue explícita: la necesidad de ayuda *"puede ser esperable y
-- productiva"*, así que registrarla **no puede acercar a nadie a una escalada**.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.registrar_necesidad_de_apoyo(
  p_institution_id       UUID,
  p_exam_preparation_id  UUID,
  p_support_need_type_id UUID,
  p_evidence_id          UUID DEFAULT NULL,
  p_topic_id             UUID DEFAULT NULL,
  p_note                 TEXT DEFAULT NULL,
  p_recorded_by          UUID DEFAULT NULL,
  p_idempotency_key      TEXT DEFAULT NULL
)
RETURNS TABLE (observation_id UUID, duplicado BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_existente UUID;
  v_student   UUID;
  v_vigente   BOOLEAN;
  v_id        UUID;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT o.id INTO v_existente FROM support_need_observation o
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

  SELECT t.is_current INTO v_vigente FROM support_need_type t WHERE t.id = p_support_need_type_id;
  IF NOT FOUND OR NOT v_vigente THEN
    RAISE EXCEPTION 'la condición de apoyo no pertenece al vocabulario vigente';
  END IF;

  INSERT INTO support_need_observation (
    institution_id, student_id, exam_preparation_id, support_need_type_id,
    evidence_id, topic_id, note, recorded_by, idempotency_key
  ) VALUES (
    p_institution_id, v_student, p_exam_preparation_id, p_support_need_type_id,
    p_evidence_id, p_topic_id, p_note, p_recorded_by, p_idempotency_key
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_necesidad_de_apoyo FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_necesidad_de_apoyo TO service_role;

COMMENT ON FUNCTION public.registrar_necesidad_de_apoyo IS
  'ADR-037 (9.5): condición de desempeño, no un error. No alimenta ningún contador.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 8 · Corregir una clasificación
--
-- **Una transacción, dos escrituras**: la corrección queda registrada y la
-- observación pasa a llevar la clasificación nueva. Que la observación cargue la
-- clasificación **vigente** es lo que deja el contador simple; que la corrección
-- sea una fila aparte es lo que deja la historia intacta.
--
-- Devuelve **las dos familias afectadas** —de dónde salió y adónde fue— porque
-- las dos hay que volver a evaluar: una perdió una aparición y la otra la ganó.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.corregir_clasificacion_de_error(
  p_institution_id     UUID,
  p_observation_id     UUID,
  p_to_error_type_id   UUID,
  p_reason             TEXT,
  p_to_secondary_type_id UUID DEFAULT NULL,
  p_corrected_by       UUID DEFAULT NULL
)
RETURNS TABLE (
  correction_id      UUID,
  from_canonical_id  TEXT,
  to_canonical_id    TEXT,
  exam_preparation_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_from      UUID;
  v_from_sec  UUID;
  v_prep      UUID;
  v_vigente   BOOLEAN;
  v_familia   BOOLEAN;
  v_id        UUID;
BEGIN
  SELECT o.error_type_id, o.secondary_error_type_id, o.exam_preparation_id
    INTO v_from, v_from_sec, v_prep
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

  -- Una corrección que no corrige nada no se registra: sería ruido en un
  -- historial que existe justamente para poder auditar reclasificaciones.
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
           v_prep;
END;
$$;

REVOKE ALL ON FUNCTION public.corregir_clasificacion_de_error FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.corregir_clasificacion_de_error TO service_role;

COMMENT ON FUNCTION public.corregir_clasificacion_de_error IS
  'ADR-037 (9.5): append-only. Registra de qué a qué con motivo obligatorio, y recién entonces actualiza.';
