-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B2.2 — atomicidad de renegociación y rescate
--
-- `data-model.md` §11 pide, para I2 y I3, una **transacción**: renegociar crea
-- una fila nueva y deja el original en `RENEGOTIATED` — las dos cosas, o
-- ninguna. Un rescate nace apuntando a un `MISSED`, y ese estado tiene que
-- seguir siendo `MISSED` en el instante de la escritura.
--
-- ⚠️ **Esto no contradice ADR-005, y la distinción importa:**
--
--   * **La decisión vive en el Service.** Qué estados se pueden renegociar sale
--     de `commitmentTransitions` en `lib/domain/`, en TypeScript. Estas
--     funciones **no saben** qué transiciones existen ni las consultan.
--   * **Acá sólo hay atomicidad**, que `data-model.md` §6 asigna
--     explícitamente a la base: *"la base aporta constraints, índices y
--     atomicidad/concurrencia mínima"*.
--   * El `WHERE state = ...` de adentro **no es la regla**: es el mismo
--     compare-and-swap que ya usa el Repository, o sea control de
--     concurrencia. Sin él, dos requests concurrentes renegocian el mismo
--     compromiso dos veces y producen dos sucesores.
--
-- La prueba de que la regla no está acá: si mañana `commitmentTransitions`
-- permite renegociar desde un estado nuevo, **estas funciones no cambian**.
-- ─────────────────────────────────────────────────────────────────────────────

/**
 * Renegocia: marca el original y crea el sucesor, o no hace nada.
 * Devuelve el compromiso nuevo, o NULL si el original ya no estaba en
 * `p_estado_esperado` — es decir, si otro se adelantó.
 */
CREATE OR REPLACE FUNCTION public.renegociar_compromiso(
  p_institution_id   UUID,
  p_original_id      UUID,
  p_estado_esperado  TEXT,
  p_start_at         TIMESTAMPTZ,
  p_timezone         TEXT,
  p_planned_minutes  INTEGER,
  p_idempotency_key  TEXT DEFAULT NULL
)
RETURNS SETOF commitment
LANGUAGE plpgsql
AS $$
DECLARE
  v_action_id UUID;
BEGIN
  -- Compare-and-swap sobre el original. Si no está en el estado esperado, no
  -- se toca nada y la función no devuelve filas.
  UPDATE commitment
     SET state = 'RENEGOTIATED'
   WHERE id = p_original_id
     AND institution_id = p_institution_id
     AND state = p_estado_esperado
  RETURNING action_id INTO v_action_id;

  IF v_action_id IS NULL THEN
    RETURN;
  END IF;

  -- El sucesor apunta al original. El original NO se edita más allá del estado:
  -- su fecha, su hora y sus minutos quedan como fueron acordados.
  RETURN QUERY
  INSERT INTO commitment (
    institution_id, action_id, start_at, timezone_at_commit, planned_minutes,
    state, renegotiated_from_id, idempotency_key
  ) VALUES (
    p_institution_id, v_action_id, p_start_at, p_timezone, p_planned_minutes,
    'CONFIRMED', p_original_id, p_idempotency_key
  )
  RETURNING *;
END;
$$;

/**
 * Crea un rescate para un compromiso incumplido.
 *
 * El `WHERE state = 'MISSED'` es I3: **un rescate nunca apunta a algo que no
 * esté incumplido**, y tiene que seguir estándolo en el instante de escribir.
 * Devuelve cero filas si el rescatado no está `MISSED`.
 *
 * El original **no se toca**: sigue `MISSED`. El rescate es otro objeto, no una
 * edición del incumplimiento (`AGENTS.md` §2.4, *No Cortar*).
 */
CREATE OR REPLACE FUNCTION public.crear_rescate(
  p_institution_id  UUID,
  p_rescatado_id    UUID,
  p_start_at        TIMESTAMPTZ,
  p_timezone        TEXT,
  p_planned_minutes INTEGER,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS SETOF commitment
LANGUAGE plpgsql
AS $$
DECLARE
  v_action_id UUID;
BEGIN
  SELECT action_id INTO v_action_id
    FROM commitment
   WHERE id = p_rescatado_id
     AND institution_id = p_institution_id
     AND state = 'MISSED'
     FOR UPDATE;

  IF v_action_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  INSERT INTO commitment (
    institution_id, action_id, start_at, timezone_at_commit, planned_minutes,
    state, rescues_commitment_id, idempotency_key
  ) VALUES (
    p_institution_id, v_action_id, p_start_at, p_timezone, p_planned_minutes,
    'CONFIRMED', p_rescatado_id, p_idempotency_key
  )
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.renegociar_compromiso FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crear_rescate         FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.renegociar_compromiso TO service_role;
GRANT EXECUTE ON FUNCTION public.crear_rescate         TO service_role;

-- I3 también en el schema, para lo que no depende de otra fila: un rescate no
-- es a la vez una renegociación.
ALTER TABLE commitment
  ADD CONSTRAINT rescate_o_renegociacion_no_ambos
  CHECK (NOT (rescues_commitment_id IS NOT NULL AND renegotiated_from_id IS NOT NULL));
