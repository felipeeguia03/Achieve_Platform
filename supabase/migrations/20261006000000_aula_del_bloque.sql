-- ─────────────────────────────────────────────────────────────────────────────
-- ADR-094 · El bloque horario gana el aula.
--
-- ADR-062 y ADR-083 modelaron `class_schedule_block` **sin aula, a propósito**:
-- la captura del owner pedía «Aula 305» y no había de dónde sacarla. El 11 de
-- septiembre de 2026 el owner pidió el aula en el cuadro de Hoy, *"como no están,
-- simulalas"*. Esta migración le da el lugar; el dato lo pone
-- `scripts/simular-aulas.mjs`, y sólo sobre horarios que ya son simulados.
--
-- ⚠️ **El aula NO tiene procedencia propia: es la del bloque.** Un aula simulada
-- sólo se escribe sobre un bloque `source_type = 'inference'`, así que nunca
-- puede parecer más verificada que el horario que la contiene. Un horario
-- publicado por la institución, cuando exista, trae su aula en la misma fila y
-- con la misma procedencia.
--
-- ⚠️ **Nullable, y NULL no es «sin aula».** Es «no se sabe dónde»: la pantalla
-- omite la línea en vez de escribir un aula vacía.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE class_schedule_block ADD COLUMN IF NOT EXISTS room TEXT;

ALTER TABLE class_schedule_block DROP CONSTRAINT IF EXISTS class_schedule_block_room_no_vacia;
ALTER TABLE class_schedule_block
  ADD CONSTRAINT class_schedule_block_room_no_vacia CHECK (room IS NULL OR btrim(room) <> '');

COMMENT ON COLUMN class_schedule_block.room IS
  'ADR-094. Dónde se dicta el bloque. NULL = no se sabe, que no es «sin aula». Su procedencia '
  'es la del bloque (source_type): un aula simulada sólo existe sobre un bloque inference.';
