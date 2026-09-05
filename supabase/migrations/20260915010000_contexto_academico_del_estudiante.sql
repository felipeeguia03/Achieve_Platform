-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.14.2 — el contexto académico del estudiante
--
-- [ADR-052](../../docs/decisions.md#adr-052). El otro lado del catálogo: qué
-- carrera declaró el estudiante, en qué año está y qué requisitos cursa.
--
-- ⚠️ **`enrollment` existía desde la B1.3 y nadie la leía ni la escribía.** Se
-- revive en vez de crear una tabla al lado: `(student, program, term)` con su
-- UNIQUE es exactamente "la carrera de este estudiante". Una tabla
-- `onboarding_state` paralela habría sido una segunda historia del mismo hecho.
--
-- ⚠️ **Sobre WhatsApp:** ADR-042 §4 autoriza construir y probar con teléfonos
-- sintéticos, pero `capa_estudiante.sql:27` dice que ninguna capa escribe
-- `student.whatsapp` mientras ADR-006 siga abierto. Se resuelve sin elegir: se
-- persiste **el consentimiento**, y la tabla **no tiene columna de teléfono**.
-- No es que no se llene: es que no existe dónde.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. La carrera del estudiante, y el estado del alta ───────────────────────

ALTER TABLE enrollment
  ADD COLUMN institution_id     UUID REFERENCES institution(id) ON DELETE RESTRICT,
  ADD COLUMN curriculum_plan_id UUID REFERENCES curriculum_plan(id) ON DELETE RESTRICT,
  ADD COLUMN curriculum_year    SMALLINT CHECK (curriculum_year IS NULL OR curriculum_year BETWEEN 1 AND 12),
  ADD COLUMN confirmed_at       TIMESTAMPTZ,
  ADD COLUMN created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMENT ON COLUMN enrollment.confirmed_at IS
  'El estado del alta (ADR-052). NOT NULL = el estudiante confirmó su mapa académico mínimo '
  'y entra a HOY. No hay tabla de onboarding: el hecho es este, y ya tenía dónde vivir.';

COMMENT ON COLUMN enrollment.curriculum_plan_id IS
  'La versión del plan contra la que el estudiante declaró su cursado. Un estudiante legado '
  'de un plan viejo conserva el suyo: dos planes de carreras sucesoras no se mezclan.';

-- Confirmar exige saber contra qué plan y en qué año: un alta a medias no es
-- un alta. Las tres viajan juntas o no viaja ninguna.
ALTER TABLE enrollment
  ADD CONSTRAINT alta_confirmada_completa CHECK (
    confirmed_at IS NULL
    OR (curriculum_plan_id IS NOT NULL AND curriculum_year IS NOT NULL AND institution_id IS NOT NULL));

CREATE INDEX enrollment_institution_idx ON enrollment (institution_id);
CREATE INDEX enrollment_plan_idx        ON enrollment (curriculum_plan_id);
-- La consulta caliente: ¿este estudiante ya completó el alta?
CREATE INDEX enrollment_confirmada_idx  ON enrollment (student_id) WHERE confirmed_at IS NOT NULL;

-- ── 2. El consentimiento de WhatsApp ─────────────────────────────────────────
--
-- ADR-042 §1: explícito, específico y **no premarcado**. §2: se puede rechazar
-- u omitir **sin perder el acceso**.
--
-- Append-only: retirar el consentimiento es un hecho nuevo, no un UPDATE. Es la
-- misma disciplina de `provenance_corroboration` y de `class_event_record`
-- —una corrección nunca sobrescribe— y es lo que hace ejecutable el derecho a
-- revocar: si el `GRANTED` se pisara, nadie podría decir qué se consintió.

CREATE TABLE whatsapp_consent (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  decision       TEXT NOT NULL CHECK (decision IN ('GRANTED','DECLINED','WITHDRAWN')),
  -- Qué texto aceptó. Sin esto, un cambio de política dejaría consentimientos
  -- que nadie puede decir a qué se referían.
  policy_version TEXT NOT NULL,
  decided_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- ⚠️ SIN columna de teléfono. `student.whatsapp` sigue sin escritor hasta que
  -- ADR-006 tenga dictamen (ADR-052).
);

COMMENT ON TABLE whatsapp_consent IS
  'El consentimiento, append-only (ADR-042 §1-2). NO guarda el número: mientras ADR-006 siga '
  'PROVISIONAL, student.whatsapp no tiene escritor y acá no hay dónde ponerlo.';

COMMENT ON COLUMN whatsapp_consent.decision IS
  'DECLINED no es un error ni un estado incompleto: rechazar es una respuesta válida y no '
  'quita acceso. WITHDRAWN es una fila nueva, nunca un UPDATE del GRANTED.';

CREATE INDEX whatsapp_consent_student_idx ON whatsapp_consent (student_id, decided_at DESC);

-- ── 3. Qué requisito del plan satisface cada cosa que el estudiante cursa ────
--
-- **Esto no es una segunda historia de course_enrollment.** La materia que el
-- estudiante cursa sigue siendo `course_enrollment`, el eje del modelo
-- (`data-model.md` §1). Esta tabla **apunta** a ella y agrega un solo dato: qué
-- requisito del plan satisface.
--
-- Y resuelve el caso que `course_enrollment` no puede: cuando el estudiante
-- escribe el nombre de una electiva que **no está en el catálogo**, no hay
-- cursada a la que apuntar. `declared_label` lo guarda **sin tocar el
-- catálogo** — seleccionar una opción no modifica el plan, y una materia que
-- informó un alumno no se vuelve dato oficial.

CREATE TABLE requirement_declaration (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  curriculum_requirement_id UUID NOT NULL REFERENCES curriculum_requirement(id) ON DELETE RESTRICT,

  -- Una de las dos, nunca las dos ni ninguna.
  course_enrollment_id UUID REFERENCES course_enrollment(id) ON DELETE CASCADE,
  declared_label       TEXT,

  -- Lo que escribe un estudiante entra `student`, como todo lo demás (I9).
  source_type TEXT NOT NULL DEFAULT 'student' CHECK (source_type IN
                ('institution','instructor','student','community','public_web','inference')),
  source_ref  TEXT,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- La idempotencia del doble submit, en la base y no en el handler.
  UNIQUE (student_id, curriculum_requirement_id),

  CONSTRAINT una_sola_forma CHECK (num_nonnulls(course_enrollment_id, declared_label) = 1),
  CONSTRAINT etiqueta_no_vacia CHECK (declared_label IS NULL OR length(btrim(declared_label)) > 0)
);

COMMENT ON TABLE requirement_declaration IS
  'Qué requisito del plan satisface cada cosa que el estudiante declaró cursar. Apunta a '
  'course_enrollment cuando la materia existe en el catálogo, y guarda el nombre escrito a '
  'mano cuando no. Escribir un nombre acá NO agrega nada al catálogo (ADR-051).';

COMMENT ON COLUMN requirement_declaration.declared_label IS
  'Informado por el estudiante y sin verificar. No se presenta como dato oficial y no se '
  'promueve solo: convertirlo en elective_option es una decisión de alguien con autoridad.';

CREATE INDEX requirement_declaration_student_idx    ON requirement_declaration (student_id);
CREATE INDEX requirement_declaration_requisito_idx  ON requirement_declaration (curriculum_requirement_id);
CREATE INDEX requirement_declaration_cursada_idx    ON requirement_declaration (course_enrollment_id);

-- ── RLS deny-by-default ──────────────────────────────────────────────────────
ALTER TABLE whatsapp_consent        ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_declaration ENABLE ROW LEVEL SECURITY;
