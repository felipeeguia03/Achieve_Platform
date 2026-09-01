-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B5.3 — completar un paso, varias veces
--
-- El escritor del hecho que ADR-028 hizo posible. Todo lo que hace es agregar
-- una fila; lo que necesita transacción es **el número de vuelta**: contar
-- "cuántas van" en el cliente y después insertar es la condición de carrera de
-- manual, y dos pestañas abiertas producirían dos vueltas número 3.
--
-- ## Lo que esta función NO decide
--
-- **Si el paso se puede repetir.** Eso lo dice el contenido del protocolo, en
-- `protocol_step.is_reentrant`, cargado con la versión. La función lo obedece:
-- un paso no reentrante conserva la garantía vieja —se completa una vez— y uno
-- reentrante admite todas las vueltas que hagan falta. La regla pedagógica vive
-- en la configuración, que es donde `HUMAN-P0-01` la puso.
--
-- **Qué significa haber completado.** `product.md` §5.6 lista lo que NO
-- completa un paso —abrirlo, leerlo, subir Evidence, cumplir un Commitment— y
-- esta función no se llama desde ninguno de esos caminos. La invoca el owner
-- del protocolo, y nada más.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.completar_paso_de_protocolo(
  p_institution_id      UUID,
  p_exam_preparation_id UUID,
  p_protocol_step_id    UUID,
  -- NULL ⇒ el paso no se trabajó sobre un tema en particular. **No es "todos"**:
  -- es que no se sabe, y la superficie lo dice distinto.
  p_topic_id            UUID,
  p_confirmed_by        UUID,
  p_idempotency_key     TEXT DEFAULT NULL
)
RETURNS TABLE (completion_id UUID, occurrence INTEGER, duplicado BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_existente   UUID;
  v_occurrence  INTEGER;
  v_status      TEXT;
  v_protocolo   UUID;
  v_reentrante  BOOLEAN;
  v_previas     INTEGER;
  v_id          UUID;
BEGIN
  -- `I8`: reintentar no puede sumar una vuelta que el estudiante no dio.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT c.id, c.occurrence INTO v_existente, v_occurrence
      FROM protocol_step_completion c
     WHERE c.exam_preparation_id = p_exam_preparation_id
       AND c.idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN QUERY SELECT v_existente, v_occurrence, TRUE;
      RETURN;
    END IF;
  END IF;

  -- El scoping va en el WHERE (`I11`), y el `FOR UPDATE` serializa a todos los
  -- que quieran agregar una vuelta a **esta** preparación.
  SELECT p.status, p.exam_protocol_id INTO v_status, v_protocolo
    FROM exam_preparation p
   WHERE p.id = p_exam_preparation_id AND p.institution_id = p_institution_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'preparación % no pertenece a la institución %',
      p_exam_preparation_id, p_institution_id;
  END IF;

  -- Una preparación que no está corriendo no acumula pasos. `EXAM_TAKEN` y
  -- `CLOSED` conservan su historia; no la siguen escribiendo.
  IF v_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'la preparación está en % y no admite completions', v_status;
  END IF;

  -- El paso tiene que ser del protocolo que rige ESTA preparación. Sin esto, un
  -- id de otro protocolo entraría como paso propio.
  SELECT s.is_reentrant INTO v_reentrante
    FROM protocol_step s
   WHERE s.id = p_protocol_step_id AND s.exam_protocol_id = v_protocolo;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'el paso % no pertenece al protocolo de esta preparación',
      p_protocol_step_id;
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_previas
    FROM protocol_step_completion c
   WHERE c.exam_preparation_id = p_exam_preparation_id
     AND c.protocol_step_id = p_protocol_step_id
     AND c.topic_id IS NOT DISTINCT FROM p_topic_id;

  -- `is_reentrant = FALSE` conserva exactamente lo que decía el `UNIQUE` que
  -- ADR-028 sacó. La garantía no se perdió: se volvió configurable, que es lo
  -- que `HUMAN-P0-01 v1.0` pedía.
  IF v_previas > 0 AND NOT v_reentrante THEN
    RAISE EXCEPTION 'el paso % no es reentrante y ya está completado',
      p_protocol_step_id;
  END IF;

  v_occurrence := v_previas + 1;

  INSERT INTO protocol_step_completion (
    institution_id, exam_preparation_id, protocol_step_id, topic_id,
    occurrence, confirmed_by, idempotency_key
  ) VALUES (
    p_institution_id, p_exam_preparation_id, p_protocol_step_id, p_topic_id,
    v_occurrence, p_confirmed_by, p_idempotency_key
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_occurrence, FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.completar_paso_de_protocolo FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.completar_paso_de_protocolo TO service_role;

COMMENT ON FUNCTION public.completar_paso_de_protocolo IS
  'Agrega una vuelta. La reentrancia la decide el contenido del protocolo, no esta función.';

-- ─────────────────────────────────────────────────────────────────────────────
-- El protocolo vigente para una evaluación
--
-- Una igualdad, no un fallback: `EP-SPEC v0.1` está cargado para las dos
-- modalidades justamente para no tener que inventar una regla de precedencia
-- entre un protocolo genérico y uno específico.
--
-- Devuelve cero filas cuando la modalidad no tiene protocolo —`oral`, `mixta`,
-- `otra`, o sin modalidad declarada—. Eso **no es un error**: `C01-047` deja
-- esas modalidades fuera de P0, y la superficie lo dice en vez de asignar el
-- protocolo de otra.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.protocolo_vigente(p_assessment_id UUID)
RETURNS TABLE (protocol_id UUID, version TEXT)
LANGUAGE sql STABLE AS $$
  SELECT p.id, p.version
    FROM assessment a
    JOIN exam_protocol p
      ON p.modality = a.modality
     AND p.alcance = 'COMPLETO'
     AND p.is_current
   WHERE a.id = p_assessment_id;
$$;

GRANT EXECUTE ON FUNCTION public.protocolo_vigente TO service_role;
