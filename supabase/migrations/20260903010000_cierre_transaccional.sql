-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.3 — el cierre, entero, en una transacción
--
-- Ejecuta §7.4 y la mitad de base de §7.5 del plan de
-- [ADR-034](../../docs/decisions.md#adr-034).
--
-- ## §7.4 — la señal se resuelve con el mismo `COMMIT`
--
-- Hasta acá el circuito cerraba en **dos llamadas**: `cerrar_intervencion()`
-- escribía outcome y estado, y después alguien llamaba a `resolver_senal()`.
-- Entre las dos había una ventana en la que la intervención estaba cerrada con
-- su resultado y la señal seguía pidiendo una persona que ya la había
-- atendido — y si la segunda llamada no llegaba, la señal quedaba pidiendo para
-- siempre. Es el mismo agujero que la fase se propuso cerrar con el outcome,
-- una capa más arriba.
--
-- Decisión 4 de ADR-034: **al cerrar se registra el outcome, se cierra la
-- intervención y la señal pasa a `RESOLVED`, todo junto.**
--
-- **La regla de `resolver_senal` no se relaja: se cumple por construcción.**
-- *`RESOLVED` exige una intervención con outcome* — y acá el outcome se acaba
-- de escribir, en la misma transacción, tres líneas más arriba. La función
-- `resolver_senal()` **se conserva** para las señales que se resuelvan por otro
-- camino.
--
-- ## §7.5 — cerrar es del dueño
--
-- `p_recorded_by` tiene que ser el `owner_operator_id` de la intervención.
-- ADR-034: *"la reasignación requiere un comando propio; no se cambia el dueño
-- de un caso de costado"*. Va acá además del Service por el mismo motivo que el
-- trigger de la B6.2: `service_role` llama a la función directo.
--
-- ⚠️ Cambia la firma de retorno, así que la función se dropea y se vuelve a
-- crear: `CREATE OR REPLACE` no puede cambiar el tipo de retorno. **No se
-- borran datos**, y `resolver_senal()` queda intacta.
--
-- ⚠️ ADR-006 sigue `PROVISIONAL`: sólo datos sintéticos.
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.cerrar_intervencion(UUID, UUID, TEXT, TEXT, UUID, INTEGER);

CREATE FUNCTION public.cerrar_intervencion(
  p_institution_id  UUID,
  p_intervention_id UUID,
  p_outcome         TEXT,
  p_note            TEXT,
  p_recorded_by     UUID,
  p_human_minutes   INTEGER DEFAULT NULL
)
RETURNS TABLE (cerrada BOOLEAN, ya_estaba BOOLEAN, senal_resuelta BOOLEAN, senal_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
  v_estado  TEXT;
  v_duenio  UUID;
  v_senal   UUID;
  v_est_sen TEXT;
  v_resuelta BOOLEAN := FALSE;
BEGIN
  SELECT i.status, i.owner_operator_id, i.risk_signal_id
    INTO v_estado, v_duenio, v_senal
    FROM intervention i
   WHERE i.id = p_intervention_id AND i.institution_id = p_institution_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'la intervención % no pertenece a la institución %',
      p_intervention_id, p_institution_id;
  END IF;

  -- Cerrar dos veces no es un error del que haya que avisar: es un reintento.
  -- Se devuelve lo que ya había y **no se pisa el outcome registrado**.
  IF v_estado = 'closed' THEN
    RETURN QUERY SELECT TRUE, TRUE, FALSE, v_senal;
    RETURN;
  END IF;

  -- La máquina la valida el Service; acá se comprueba lo que la transacción
  -- necesita saber para no dejar el circuito a medias.
  IF v_estado <> 'acknowledged' THEN
    RAISE EXCEPTION 'una intervención en % no se puede cerrar sin reconocerla', v_estado;
  END IF;

  -- §7.5. Quien cierra es quien la tomó. Un tercero que registre el resultado
  -- de un caso ajeno deja una auditoría que dice algo que no pasó.
  IF p_recorded_by IS DISTINCT FROM v_duenio THEN
    RAISE EXCEPTION 'INVALID_OWNER_ASSERTION: la intervención es de % y la cierra %',
      v_duenio, p_recorded_by;
  END IF;

  -- Las tres escrituras, juntas. Cerrar sin outcome es el único modo real de
  -- romper el Done de esta fase, y esta transacción es lo que lo impide.
  INSERT INTO intervention_outcome (intervention_id, outcome, note, recorded_by)
  VALUES (p_intervention_id, p_outcome, p_note, p_recorded_by);

  UPDATE intervention
     SET status = 'closed',
         closed_at = NOW(),
         human_minutes = COALESCE(p_human_minutes, human_minutes)
   WHERE id = p_intervention_id;

  -- Y la señal, si la hay y si todavía está pidiendo a alguien.
  --
  -- `NULL` es un caso legítimo: una intervención puede nacer sin señal previa.
  -- Y una señal que ya no está en `INTERVENTION_REQUIRED` **no se toca**: otra
  -- intervención pudo haberla resuelto, o alguien pudo haberla escalado, y
  -- pisarla desde acá reescribiría un final que ya se había registrado.
  IF v_senal IS NOT NULL THEN
    SELECT s.status INTO v_est_sen FROM risk_signal s
     WHERE s.id = v_senal AND s.institution_id = p_institution_id
     FOR UPDATE;
    IF FOUND AND v_est_sen = 'INTERVENTION_REQUIRED' THEN
      UPDATE risk_signal
         SET status = 'RESOLVED', resolved_at = NOW()
       WHERE id = v_senal;
      v_resuelta := TRUE;
    END IF;
  END IF;

  RETURN QUERY SELECT TRUE, FALSE, v_resuelta, v_senal;
END;
$$;

REVOKE ALL ON FUNCTION public.cerrar_intervencion FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cerrar_intervencion TO service_role;

COMMENT ON FUNCTION public.cerrar_intervencion IS
  'ADR-034 §7.4: outcome + intervención cerrada + señal RESOLVED, en una transacción. §7.5: sólo el dueño cierra.';
