-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.5 — la regla mínima de `C01-021`, provisional
--
-- ⚠️⚠️ **PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION.**
--
-- Los umbrales de abajo son una **decisión del Product Owner** para desbloquear
-- el MVP con datos sintéticos ([ADR-036](../../docs/decisions.md#adr-036)).
-- **No tienen validación clínica, pedagógica ni psicopedagógica, y no se le
-- atribuyen a la psicopedagoga.** Antes de un piloto con estudiantes reales
-- tienen que pasar por ella.
--
-- ## Lo que NO hace esta migración
--
-- **No toca `HP0-06-1 v1.0`.** Esa fila es la situación que nombró la
-- psicopedagoga, con su texto verbatim, y se queda como está: apagada, no
-- borrada. La versión nueva **no reescribe lo que ella dijo**; le agrega un
-- umbral que ella no dio, y el nombre de la versión dice de quién es.
--
-- Es la misma regla con la que la B5 apagó `EP-SPEC v0.1` con un `UPDATE`, y
-- con la que ADR-034 dejó `ACKNOWLEDGED` como legacy. Cambiar una configuración
-- histórica en el lugar es reescribir lo que alguien afirmó.
--
-- **No agrega otras reglas.** `HP0-06-2` y `HP0-06-3` siguen en `v1.0`, sin
-- umbral y en modo `HUMANA`: nadie decidió las suyas.
--
-- ## Por qué el umbral vive en `threshold_config` y no en el código
--
-- Porque el día que la psicopedagoga lo cambie tiene que ser **una fila nueva,
-- no un deploy**. Y porque `risk_signal` guarda `risk_rule_id` y `rule_version`:
-- las señales viejas conservan la versión que las produjo, así que cambiar el
-- umbral **no reescribe el pasado**.
-- ─────────────────────────────────────────────────────────────────────────────

-- La v1.0 se apaga. **No se borra**: es lo que ella dijo, y sigue siendo cierto.
UPDATE risk_rule SET is_current = FALSE
 WHERE canonical_id = 'HP0-06-1' AND version = 'v1.0';

INSERT INTO risk_rule (
  canonical_id, version, signal_type, label, source_text,
  threshold_config, suggested_severity, modo, is_current,
  provisional_default_id, provisional_version
) VALUES (
  'HP0-06-1', 'v2.0-po-provisional', 'error_reiterado',
  'Un error que se repite y exige corregir el método',
  -- El texto sigue siendo el de ella: la **situación** no cambió, y sacarlo
  -- perdería la trazabilidad de dónde salió esta regla.
  'cuando aparece un error reiterativo que requiere identificar que está haciendo mal y corregir la forma/método',
  jsonb_build_object(
    'autoridad',  'product_owner',
    'validacion', 'PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION',
    'alcance',    'exam_preparation',
    -- Cuántas apariciones corroboradas del **mismo tipo** hacen falta.
    'apariciones', jsonb_build_object('atencion', 2, 'intervencion', 3),
    -- Una aparición nueva **después de una acción correctiva** llega directo a
    -- intervención, sin esperar la tercera.
    'reincidencia_tras_correctiva', 'intervencion',
    -- Una resolución correcta, independiente y sin ayuda reinicia el contador.
    'reinicia_con_resolucion_limpia', TRUE,
    -- Un error inferido, ambiguo o no corroborado no cuenta.
    'solo_corroboradas', TRUE
  ),
  -- La severidad **máxima** que esta regla puede producir. Cuál corresponde en
  -- cada caso lo dice `apariciones`, no esta columna.
  'intervencion',
  -- Deja de ser `HUMANA`: ahora hay umbral, y el `CHECK` `automatica_exige_umbral`
  -- recién ahora la deja pasar a `AUTOMATICA`.
  'AUTOMATICA', TRUE,
  -- **Quién puso el umbral.** No es `HUMAN-P0-06`.
  'PO-MVP-C01-021', 'v1.0-provisional-sin-validacion-profesional'
);

COMMENT ON COLUMN risk_rule.threshold_config IS
  'NULL = sin umbral, y entonces la regla no puede correr en AUTOMATICA. HP0-06-1 v2.0 lo tiene, y es PROVISIONAL del Product Owner (ADR-036).';

-- ─────────────────────────────────────────────────────────────────────────────
-- El escritor de observaciones
--
-- Lo que garantiza, y no puede quedar en el código de aplicación:
--
--   · **Sólo cuenta lo evaluable.** Una observación corroborada exige una
--     evidencia que alguien **juzgó** — `SUFFICIENT`, `INSUFFICIENT` o
--     `VALIDATED`. Un error "visto" en una entrega que nadie miró es
--     exactamente el error inferido que el punto 6 prohíbe contar.
--   · **La evidencia es del mismo estudiante y de la misma preparación.**
--   · **Idempotencia**: reprocesar la misma evidencia no registra el hecho dos
--     veces, y por lo tanto no infla el contador.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.registrar_observacion_de_error(
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
  p_idempotency_key     TEXT DEFAULT NULL
)
RETURNS TABLE (observation_id UUID, duplicado BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_existente UUID;
  v_student   UUID;
  v_estado_ev TEXT;
  v_prep_ev   UUID;
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
    idempotency_key
  ) VALUES (
    p_institution_id, v_student, p_exam_preparation_id, p_error_type_id, p_kind,
    p_evidence_id, p_topic_id, p_after_action_id, COALESCE(p_corroborated, FALSE),
    p_note, p_recorded_by, p_idempotency_key
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_observacion_de_error FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_observacion_de_error TO service_role;

COMMENT ON FUNCTION public.registrar_observacion_de_error IS
  'ADR-036: sólo corrobora contra una evidencia que alguien evaluó. Un error inferido no incrementa el contador.';
