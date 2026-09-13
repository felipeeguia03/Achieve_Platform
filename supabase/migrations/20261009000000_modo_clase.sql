-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Fase B6.28, corte 2 — Modo Clase
--
-- [ADR-098](../../docs/decisions.md#adr-098), decidido por el owner el 13 de
-- septiembre de 2026.
--
-- ## ⛔ Por qué no es `class_session`
--
-- `class_session` es una clase **dictada**, de la comisión, con procedencia:
-- de ella salen el Gantt, el `Un.` de Hoy y el ritmo de cátedra **de todos los
-- alumnos**. Si abrir Modo Clase escribiera ahí, la clase de un estudiante
-- movería la materia de sus compañeros. Ésta es de uno solo.
--
-- ## Lo que estas tablas NO llevan, y cada ausencia es una decisión
--
-- ⛔ **Sin unidad.** Asociar la clase a una unidad necesita quien la escriba
-- —confirmarla al cerrar—, que es P1. La columna llega con su escritor, como
-- `schedule_status` en ADR-083.
--
-- ⛔ **Sin comprensión declarada.** El *"¿cómo te quedó?"* espera a la
-- psicopedagoga (`agenda-cierre-psicopedagoga.md` §10). Una columna sin
-- escritor ni lector es `reflection.difficulty` otra vez.
--
-- ⛔ **Sin audio.** ADR-006: un micrófono en un aula graba a terceros reales.
-- Cuando llegue, es **otra tabla** —la clase sigue si la grabación falla, y la
-- grabación se borra sin borrar apuntes ni marcas— y el archivo va a un bucket
-- privado, nunca a una columna.
-- ─────────────────────────────────────────────────────────────────────────────

-- La cursada y su estudiante como par, para que la FK compuesta de abajo pueda
-- apuntarles. No cambia nada de `course_enrollment`: `id` ya es único.
ALTER TABLE course_enrollment
  ADD CONSTRAINT course_enrollment_id_estudiante_unico UNIQUE (id, student_id);

CREATE TABLE student_class_session (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  course_enrollment_id UUID NOT NULL,

  -- `NULL` es una clase **iniciada a mano**, que es válida: cambios de horario,
  -- recuperatorios, un horario mal cargado. `SET NULL` porque los bloques se
  -- regeneran (`simular-temarios --aplicar`) y una clase no se borra por eso.
  class_schedule_block_id UUID REFERENCES class_schedule_block(id) ON DELETE SET NULL,
  -- **Copia** del horario del bloque al entrar: si el bloque desaparece, la
  -- clase conserva contra qué horario empezó.
  scheduled_start TIME,
  scheduled_end   TIME,

  status     TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ENDED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at   TIMESTAMPTZ,

  -- Los apuntes. Texto plano, del estudiante: no se versionan (ADR-098 §4).
  notes            TEXT,
  notes_updated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- La clase es de una cursada **del mismo estudiante**. Integridad, no regla
  -- de negocio: el Service ya lo verifica; la base impide que un defecto lo
  -- saltee.
  CONSTRAINT clase_de_una_cursada_propia
    FOREIGN KEY (course_enrollment_id, student_id)
    REFERENCES course_enrollment (id, student_id) ON DELETE CASCADE,
  CONSTRAINT clase_horario_completo
    CHECK (num_nulls(scheduled_start, scheduled_end) IN (0, 2)),
  CONSTRAINT clase_horario_valido
    CHECK (scheduled_end IS NULL OR scheduled_end > scheduled_start),
  CONSTRAINT clase_con_bloque_copia_su_horario
    CHECK (class_schedule_block_id IS NULL OR scheduled_start IS NOT NULL),
  -- `ENDED` si y sólo si tiene fin. Una clase terminada sin fecha de fin, o una
  -- abierta con fin, es un dato roto.
  CONSTRAINT clase_terminada_tiene_fin
    CHECK ((status = 'ENDED') = (ended_at IS NOT NULL)),
  CONSTRAINT clase_termina_despues_de_empezar
    CHECK (ended_at IS NULL OR ended_at >= started_at),
  -- Límite técnico, no de producto: `MAXIMO_DE_APUNTES` en `sesion-de-clase.ts`.
  CONSTRAINT apuntes_acotados
    CHECK (notes IS NULL OR char_length(notes) <= 50000)
);

COMMENT ON TABLE student_class_session IS
  'La clase que abre un estudiante mientras cursa (ADR-098). NO es class_session, que es la clase '
  'dictada de la comisión. No produce Evidence, progreso, Actions ni cambios en el Gantt.';

-- **Una sola clase activa por estudiante** (ADR-098 §2). El Service lo chequea
-- para contestar bien; esto lo garantiza cuando dos pedidos llegan juntos.
CREATE UNIQUE INDEX student_class_session_una_activa
  ON student_class_session (student_id) WHERE status = 'ACTIVE';

-- *Tus clases*: las de una materia, la más reciente primero.
CREATE INDEX student_class_session_cursada_idx
  ON student_class_session (course_enrollment_id, started_at DESC);
CREATE INDEX student_class_session_institution_idx
  ON student_class_session (institution_id);

ALTER TABLE student_class_session ENABLE ROW LEVEL SECURITY;

-- ── Las marcas ───────────────────────────────────────────────────────────────
--
-- ⛔ **No es `class_event_record`.** Aquél es el *"Pasó algo en clase"* que
-- cambia decisiones del sistema, y su contrato es `C01-004`, `OPEN`. Una marca
-- es un señalador privado: no sube la prioridad de un tema y no es voz de la
-- cátedra (AGENTS.md §2.6).
--
-- ⚠️ **Tampoco es un evento por marca.** El spec: *"evento nuevo para cada
-- interacción: no está aprobado"*. Son filas.
CREATE TABLE class_marker (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_class_session_id UUID NOT NULL
                   REFERENCES student_class_session(id) ON DELETE CASCADE,
  -- `ASSESSMENT`, no `EXAM`: el vocabulario canónico es `Assessment`.
  marker_type    TEXT NOT NULL
                   CHECK (marker_type IN ('QUESTION','IMPORTANT','ASSESSMENT','REVIEW')),
  -- Desde que empezó la clase. **Lo calcula el servidor**: un reloj del
  -- cliente no escribe dominio.
  elapsed_seconds INTEGER NOT NULL CHECK (elapsed_seconds >= 0),
  -- *"¿Qué no entendiste?"*: opcional y posterior. Marcar no espera a escribir.
  detail         TEXT CHECK (detail IS NULL OR char_length(detail) <= 1000),
  -- El doble toque y el reintento devuelven la misma fila.
  idempotency_key TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detail_updated_at TIMESTAMPTZ,
  UNIQUE (student_class_session_id, idempotency_key)
);

COMMENT ON TABLE class_marker IS
  'Una marca de un toque durante una clase del estudiante (ADR-098 §3). Señalador privado: NO es '
  'class_event_record (C01-004) ni un product_event.';

CREATE INDEX class_marker_clase_idx
  ON class_marker (student_class_session_id, elapsed_seconds);
CREATE INDEX class_marker_institution_idx
  ON class_marker (institution_id);

ALTER TABLE class_marker ENABLE ROW LEVEL SECURITY;
