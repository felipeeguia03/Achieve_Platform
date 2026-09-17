-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Modo Focus — cuatro sonidos más
--
-- [ADR-104 · Enmienda 1](../../docs/decisions.md#adr-104-enmienda-1), pedida por
-- el owner el 13 de septiembre de 2026: *"podés agregar lluvia que no tenga
-- copyright? y 3 sonidos más?"*.
--
-- Lluvia, mar, viento y chimenea **se calculan en el navegador**
-- (`lib/client/focus/sonidos.ts`), como el ruido marrón y el rosa: no hay
-- archivo, grabación ni autor. Lo único que cambia en la base es qué valores
-- acepta la preferencia.
--
-- Una migración aplicada no se edita: el `CHECK` se reemplaza desde acá.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE focus_preference DROP CONSTRAINT focus_preference_sound_check;

ALTER TABLE focus_preference
  ADD CONSTRAINT focus_preference_sound_check
  CHECK (sound IN ('NINGUNO','LLUVIA','MAR','VIENTO','CHIMENEA','MARRON','ROSA'));
