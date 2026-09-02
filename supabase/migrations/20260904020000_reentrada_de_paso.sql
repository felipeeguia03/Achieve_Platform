-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.5 — la reentrada deja rastro
--
-- ⚠️ **PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION**
-- ([ADR-036](../../docs/decisions.md#adr-036) §4).
--
-- La reentrancia de los pasos 9–18 ya existía desde la B5: `occurrence` cuenta
-- las vueltas y la tabla es append-only, así que **repetir nunca borró nada**.
-- Lo que faltaba es lo que el Product Owner pidió: que la vuelta diga **por
-- qué**, **desde dónde** y **contra qué intento anterior**.
--
-- Sin eso, dos filas con `occurrence` 1 y 2 dicen que pasó dos veces y nada
-- más. Con esto, la Bitácora puede explicar que se volvió porque una evidencia
-- resultó insuficiente — que es la diferencia entre un historial y un contador.
--
-- **Las tres columnas son nullable, y las filas existentes quedan en `NULL`**:
-- es la verdad, esas vueltas se registraron sin motivo declarado. Rellenarlas
-- con un default sería inventar por qué volvió alguien.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE protocol_step_completion
  ADD COLUMN reentry_reason       TEXT,
  ADD COLUMN reentry_from_step_id UUID REFERENCES protocol_step(id) ON DELETE SET NULL,
  ADD COLUMN previous_completion_id UUID REFERENCES protocol_step_completion(id) ON DELETE SET NULL;

-- Una primera vuelta no es una reentrada, y no puede declarar un motivo de
-- reentrada: sería decir que volvió alguien que todavía no había ido.
ALTER TABLE protocol_step_completion
  ADD CONSTRAINT reentrada_solo_desde_la_segunda
    CHECK (occurrence > 1
        OR (reentry_reason IS NULL
            AND reentry_from_step_id IS NULL
            AND previous_completion_id IS NULL));

COMMENT ON COLUMN protocol_step_completion.reentry_reason IS
  'Por qué se volvió a este paso. NULL en las filas anteriores a ADR-036: no es "sin motivo", es que nadie lo declaró.';
COMMENT ON COLUMN protocol_step_completion.previous_completion_id IS
  'El intento anterior. Conserva la relación entre vueltas sin fusionarlas: cada una sigue siendo un hecho propio.';

CREATE INDEX protocol_step_completion_reentradas
  ON protocol_step_completion (previous_completion_id)
  WHERE previous_completion_id IS NOT NULL;
