-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · La disponibilidad se declara sólo en Mi plan
--
-- [ADR-110 · Enmienda 3](../../docs/decisions.md#adr-110-enmienda-3), pedida por
-- el owner el 17 de septiembre de 2026: *"borra todo lo de las franjas
-- declaradas en el onboarding, ya no importan, solo importa lo que declare como
-- disponibilidad en el plan"*.
--
-- El paso del alta (ADR-073) preguntaba **minutos por día, sin horario**
-- (*«90 minutos los martes»*). Mi plan dibuja franjas, y una franja dibujada
-- siempre tiene inicio y fin. Así que la forma de la fila dice de dónde vino:
--
-- | Fila `declared` | De dónde |
-- |---|---|
-- | sin `start_time` / `end_time` | el paso del alta → **se borra** |
-- | con las dos horas | Mi plan → se queda |
--
-- ⚠️ **Y no puede volver a entrar.** El `CHECK` sólo mira `declared`: `observed`
-- e `inferred` son del Personal Engine y no se dibujan.
--
-- ⚠️ `student.availability_declared_at` **queda**: ya no gobierna el alta, pero
-- sigue diciendo cuándo guardó su disponibilidad por última vez.
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM availability
 WHERE source = 'declared'
   AND (start_time IS NULL OR end_time IS NULL);

ALTER TABLE availability
  ADD CONSTRAINT availability_declarada_con_horario
  CHECK (source <> 'declared' OR (start_time IS NOT NULL AND end_time IS NOT NULL));
