-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · ADR-099 — Modo Clase, segunda vuelta
--
-- Cuatro tablas y dos buckets, todos colgados de `student_class_session`: la
-- clase del estudiante (ADR-098 §1), **no** la dictada.
--
--   - `class_note_entry`     — los apuntes, una entrada por Enter (§4).
--   - `class_attachment`     — un archivo o un link de la clase (§5).
--   - `class_recording`      — una grabación de audio (§2).
--   - `class_recording_tag`  — las etiquetas de una grabación (§3).
--
-- ⚠️ **Ninguna produce `Evidence`, progreso, `Action`s ni eventos.** Es material
-- del estudiante sobre su clase.
--
-- ⚠️ **Grabar no levanta ADR-006.** El producto sabe grabar; tratar la voz de
-- terceros reales en producción sigue esperando el dictamen legal.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Los apuntes, por entrada ─────────────────────────────────────────────────
CREATE TABLE class_note_entry (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_class_session_id UUID NOT NULL
                    REFERENCES student_class_session(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  -- Desde que empezó la clase, **lo calcula el servidor**. `NULL` ⇒ se escribió
  -- con la clase terminada: no tiene momento de la clase, y no se inventa uno.
  elapsed_seconds INTEGER CHECK (elapsed_seconds IS NULL OR elapsed_seconds >= 0),
  -- Enter dos veces, o un reintento, devuelven la misma entrada.
  idempotency_key TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ,
  CONSTRAINT apunte_no_vacio CHECK (btrim(body) <> ''),
  -- Límite técnico: `MAXIMO_DE_ENTRADA` en `sesion-de-clase.ts`.
  CONSTRAINT apunte_acotado CHECK (char_length(body) <= 4000),
  UNIQUE (student_class_session_id, idempotency_key)
);

COMMENT ON TABLE class_note_entry IS
  'Una entrada de apuntes de una clase del estudiante (ADR-099 §4). Reemplaza el texto único de '
  'student_class_session.notes, que queda sin escritor.';

CREATE INDEX class_note_entry_clase_idx ON class_note_entry (student_class_session_id, created_at);
CREATE INDEX class_note_entry_institution_idx ON class_note_entry (institution_id);
ALTER TABLE class_note_entry ENABLE ROW LEVEL SECURITY;

-- Lo que ya estaba escrito no se pierde: pasa a ser la primera entrada.
INSERT INTO class_note_entry (institution_id, student_class_session_id, body, elapsed_seconds, idempotency_key, created_at, updated_at)
SELECT institution_id, id, left(notes, 4000), NULL, 'migrado-de-notes', COALESCE(notes_updated_at, started_at), notes_updated_at
FROM student_class_session
WHERE notes IS NOT NULL AND btrim(notes) <> '';

COMMENT ON COLUMN student_class_session.notes IS
  'SIN ESCRITOR desde ADR-099: los apuntes son class_note_entry. Lo que había se copió en la migración.';

-- ── El material de la clase ──────────────────────────────────────────────────
--
-- ⚠️ **No es `Evidence` ni material de cátedra** (ADR-006 §4): es lo que el
-- estudiante guardó de su clase.
CREATE TABLE class_attachment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_class_session_id UUID NOT NULL
                    REFERENCES student_class_session(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL CHECK (kind IN ('FILE','LINK')),
  title           TEXT NOT NULL,
  -- Un archivo guarda **la clave del objeto, no una URL** (ADR-005 ítem 4).
  storage_key     TEXT,
  mime_type       TEXT,
  size_bytes      INTEGER,
  url             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT material_titulo_no_vacio CHECK (btrim(title) <> '' AND char_length(title) <= 200),
  -- Exactamente uno de los dos, y con lo que cada uno necesita.
  CONSTRAINT material_archivo_o_link CHECK (
    (kind = 'FILE' AND storage_key IS NOT NULL AND url IS NULL
       AND size_bytes IS NOT NULL AND size_bytes > 0 AND size_bytes <= 26214400)
    OR
    (kind = 'LINK' AND url IS NOT NULL AND storage_key IS NULL AND size_bytes IS NULL
       AND url ~* '^https?://' AND char_length(url) <= 2000)
  ),
  UNIQUE (storage_key)
);

COMMENT ON TABLE class_attachment IS
  'Un archivo o link que el estudiante guardó de su clase (ADR-099 §5). NO es Evidence ni material de cátedra.';

CREATE INDEX class_attachment_clase_idx ON class_attachment (student_class_session_id, created_at);
CREATE INDEX class_attachment_institution_idx ON class_attachment (institution_id);
ALTER TABLE class_attachment ENABLE ROW LEVEL SECURITY;

-- ── Las grabaciones ──────────────────────────────────────────────────────────
--
-- ⛔ **Nunca empieza sola** y **no se transcribe** (ADR-099 §2). Es un objeto
-- aparte: si falla, la clase sigue; si se borra, apuntes y marcas quedan.
CREATE TABLE class_recording (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_class_session_id UUID NOT NULL
                    REFERENCES student_class_session(id) ON DELETE CASCADE,
  storage_key     TEXT NOT NULL UNIQUE,
  mime_type       TEXT NOT NULL,
  size_bytes      INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 52428800),
  -- Dato del archivo, acotado: hasta cuatro horas.
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds BETWEEN 1 AND 14400),
  -- En qué momento de la clase empezó. Lo calcula el servidor al registrarla.
  started_at_seconds INTEGER NOT NULL CHECK (started_at_seconds >= 0),
  idempotency_key TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_class_session_id, idempotency_key)
);

COMMENT ON TABLE class_recording IS
  'Una grabación de audio de una clase del estudiante (ADR-099 §2). Opt-in, sin transcripción. '
  'Grabar en un aula real en producción sigue bloqueado por ADR-006.';

CREATE INDEX class_recording_clase_idx ON class_recording (student_class_session_id, created_at);
CREATE INDEX class_recording_institution_idx ON class_recording (institution_id);
ALTER TABLE class_recording ENABLE ROW LEVEL SECURITY;

-- ── Las etiquetas de una grabación ───────────────────────────────────────────
--
-- ⚠️ **Una etiqueta no es una marca** (ADR-098 §3): texto libre sobre un archivo,
-- no un tipo cerrado sobre la clase.
CREATE TABLE class_recording_tag (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  class_recording_id UUID NOT NULL REFERENCES class_recording(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  -- El segundo **de la grabación**. `NULL` ⇒ la etiqueta es de la grabación entera.
  at_seconds      INTEGER CHECK (at_seconds IS NULL OR at_seconds >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT etiqueta_no_vacia CHECK (btrim(label) <> '' AND char_length(label) <= 60)
);

COMMENT ON TABLE class_recording_tag IS
  'Una etiqueta de texto sobre una grabación de clase (ADR-099 §3). NO es class_marker.';

CREATE INDEX class_recording_tag_grabacion_idx ON class_recording_tag (class_recording_id, at_seconds);
CREATE INDEX class_recording_tag_institution_idx ON class_recording_tag (institution_id);
ALTER TABLE class_recording_tag ENABLE ROW LEVEL SECURITY;

-- ── Buckets privados ─────────────────────────────────────────────────────────
-- Como `evidencia`: sin políticas para `anon`/`authenticated`. La firma de
-- corta duración que emite el backend ES el control de acceso.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('clase-audio', 'clase-audio', false, 52428800),
       ('clase-material', 'clase-material', false, 26214400)
ON CONFLICT (id) DO NOTHING;
