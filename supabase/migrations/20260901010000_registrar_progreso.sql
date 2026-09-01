-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B3.1 — el resultado de progreso se escribe
--
-- `progress_entry` existía desde la B2.6 y **nadie la escribía**. Esta función
-- la escribe, junto con las dimensiones que el resultado afirma, **en una sola
-- transacción**: media escritura deja la Bitácora diciendo que algo cambió y las
-- dimensiones sin reflejarlo, que es peor que no registrar nada.
--
-- ## Lo que esta función NO decide
--
-- **Cuándo hay un resultado.** `C01-018` sigue `OPEN`: quién emite el
-- `ProgressUpdated` y con qué causalidad no está decidido. Acá se persiste un
-- resultado que el owner del progreso ya produjo. **No hay ningún camino desde
-- `Evidence`:** validar una evidencia no llama a esto, y no existe función que
-- lo haga.
--
-- **Qué magnitud es mostrable.** `C01-019`. El valor y su texto entran como los
-- declaró el owner; la proyección decide qué muestra, y con un número sin texto
-- muestra *"cambió"*.
-- ─────────────────────────────────────────────────────────────────────────────

-- `I8` para el progreso: un reintento de red no puede duplicar el avance de un
-- estudiante. Parcial, porque una entrada sin clave sigue siendo válida.
ALTER TABLE progress_entry ADD COLUMN idempotency_key TEXT;
CREATE UNIQUE INDEX progress_entry_idempotency_idx
  ON progress_entry (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.registrar_progreso(
  p_institution_id       UUID,
  p_course_enrollment_id UUID,
  p_topic_id             UUID,
  p_action_id            UUID,
  p_evidence_id          UUID,
  p_causal_evidence_id   UUID,
  p_entry_kind           TEXT,
  p_occurred_at          TIMESTAMPTZ,
  -- `[{"dimension":"practice","valor":19,"texto":"19 ejercicios",
  --    "textoAnterior":"12 ejercicios"}, …]`
  p_cambios              JSONB,
  p_no_change            BOOLEAN,
  p_no_change_reason     TEXT,
  p_idempotency_key      TEXT
)
RETURNS TABLE (entry_id UUID, duplicado BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_entry     UUID;
  v_existente UUID;
  v_dims      TEXT[];
  v_antes     JSONB := '{}'::jsonb;
  v_ahora     JSONB := '{}'::jsonb;
  v_cambio    JSONB;
  v_dim       TEXT;
BEGIN
  -- `I8` primero: si esta clave ya escribió, se devuelve lo de antes y **no se
  -- toca nada**. Reintentar no puede sumar dos veces el mismo avance.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existente FROM progress_entry
     WHERE idempotency_key = p_idempotency_key AND institution_id = p_institution_id;
    IF FOUND THEN
      RETURN QUERY SELECT v_existente, TRUE;
      RETURN;
    END IF;
  END IF;

  -- El scoping va en el WHERE, no en una comparación después de leer (`I11`).
  PERFORM 1 FROM course_enrollment
   WHERE id = p_course_enrollment_id AND institution_id = p_institution_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'cursada % no pertenece a la institución %',
      p_course_enrollment_id, p_institution_id;
  END IF;

  -- Las dimensiones cambiadas y sus valores, tal como el owner los declaró.
  SELECT COALESCE(array_agg(c->>'dimension'), '{}')
    INTO v_dims FROM jsonb_array_elements(COALESCE(p_cambios, '[]'::jsonb)) c;

  FOR v_cambio IN SELECT * FROM jsonb_array_elements(COALESCE(p_cambios, '[]'::jsonb)) LOOP
    v_dim := v_cambio->>'dimension';
    IF v_cambio ? 'textoAnterior' THEN
      v_antes := v_antes || jsonb_build_object(v_dim, v_cambio->'textoAnterior');
    END IF;
    -- El texto del owner gana sobre el número: es lo único mostrable hoy.
    IF v_cambio ? 'texto' THEN
      v_ahora := v_ahora || jsonb_build_object(v_dim, v_cambio->'texto');
    ELSIF v_cambio ? 'valor' THEN
      v_ahora := v_ahora || jsonb_build_object(v_dim, v_cambio->'valor');
    END IF;
  END LOOP;

  INSERT INTO progress_entry (
    institution_id, course_enrollment_id, topic_id, action_id, evidence_id,
    causal_evidence_id, occurred_at, entry_kind, changed_dimensions,
    before_values, current_values, explicit_no_change, no_change_reason,
    idempotency_key
  ) VALUES (
    p_institution_id, p_course_enrollment_id, p_topic_id, p_action_id, p_evidence_id,
    p_causal_evidence_id, COALESCE(p_occurred_at, NOW()), p_entry_kind, v_dims,
    NULLIF(v_antes, '{}'::jsonb), NULLIF(v_ahora, '{}'::jsonb),
    COALESCE(p_no_change, FALSE), p_no_change_reason,
    p_idempotency_key
  )
  RETURNING id INTO v_entry;

  -- Las dimensiones que el resultado afirma, en la misma transacción. Sin unidad
  -- no hay número que guardar: una dimensión declarada **sin valor** se marca
  -- como medida sólo si el owner mandó la magnitud; si no, se toca la recencia y
  -- nada más. `topic_progress` prohíbe un estado `value` sin número, justamente
  -- para que nadie guarde un 0 y después lo lea como dominio bajo.
  IF p_topic_id IS NOT NULL AND array_length(v_dims, 1) > 0 THEN
    INSERT INTO topic_progress (institution_id, course_enrollment_id, topic_id, recency_at)
    VALUES (p_institution_id, p_course_enrollment_id, p_topic_id, COALESCE(p_occurred_at, NOW()))
    ON CONFLICT (course_enrollment_id, topic_id) DO UPDATE SET recency_at = EXCLUDED.recency_at;

    FOR v_cambio IN SELECT * FROM jsonb_array_elements(p_cambios) LOOP
      v_dim := v_cambio->>'dimension';
      IF v_cambio ? 'valor' THEN
        EXECUTE format(
          'UPDATE topic_progress SET %I = $1, %I = ''value'', updated_at = NOW()
            WHERE course_enrollment_id = $2 AND topic_id = $3',
          v_dim || '_value', v_dim || '_state')
        USING (v_cambio->>'valor')::numeric, p_course_enrollment_id, p_topic_id;
      END IF;
      -- La confianza SIEMPRE lleva su fecha (`data-model.md` §8).
      IF v_dim = 'confidence' THEN
        UPDATE topic_progress SET confidence_declared_at = COALESCE(p_occurred_at, NOW())
         WHERE course_enrollment_id = p_course_enrollment_id AND topic_id = p_topic_id;
      END IF;
    END LOOP;
  END IF;

  RETURN QUERY SELECT v_entry, FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_progreso FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_progreso TO service_role;
