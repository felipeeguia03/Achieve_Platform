-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B1.2 — capa académica (ADL)
--
-- Implementa `docs/data-model.md` §7 **literalmente**. Las 13 tablas, sus
-- constraints y sus `CHECK` salen del documento sin reinterpretarlos: si el
-- schema y el doc discrepan, el defectuoso es el schema.
--
-- Habilitado por ADR-005 (Bloque A). ⚠️ ADR-006 sigue `PENDING`: sólo datos
-- sintéticos.
--
-- Dos cosas que agrega esta migración y que el §7 no escribe:
--
--   1. `ENABLE ROW LEVEL SECURITY` en las 13. Lo exige §6 —"todas las tablas
--      quedan con RLS deny-by-default"— y `tablas_sin_rls()` de la B1.1 lo
--      verifica. Sin política declarada, RLS niega todo: el backend entra por
--      `service_role`, y la autorización real vive en Service/Repository.
--   2. Índices sobre las claves foráneas. Postgres **no** los crea solo, y §6
--      asigna los índices a la base. Es la única parte con criterio propio.
--
-- Lo que NO lleva esta capa, y no es un olvido: `updated_at`. En este diseño
-- los datos académicos no se editan en sitio —una corrección crea una fila
-- nueva que apunta a la anterior, ver `class_event_record`—, así que la
-- convención de §6 (`updated_at` en toda tabla **mutable**) no aplica acá.
-- `set_updated_at()` de la B1.1 recibe sus usuarios en §8 y §9.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE institution (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  tenant_config JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE institution IS
  'Raíz del aislamiento institucional (Parte I §29). Todo dato de estudiante cuelga de acá.';

CREATE TABLE academic_program (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  name           TEXT NOT NULL
);

CREATE TABLE curriculum_plan (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID NOT NULL REFERENCES academic_program(id) ON DELETE RESTRICT,
  version     TEXT NOT NULL,
  valid_from  DATE,
  valid_until DATE,
  UNIQUE (program_id, version)
);

CREATE TABLE course (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_plan_id UUID NOT NULL REFERENCES curriculum_plan(id) ON DELETE RESTRICT,
  code               TEXT NOT NULL,
  name               TEXT NOT NULL,
  UNIQUE (curriculum_plan_id, code)
);

CREATE TABLE instructor (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  name           TEXT NOT NULL,
  metadata       JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE course_offering (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID NOT NULL REFERENCES course(id) ON DELETE RESTRICT,
  term          TEXT NOT NULL,
  commission    TEXT,
  instructor_id UUID REFERENCES instructor(id) ON DELETE SET NULL,
  UNIQUE (course_id, term, commission)
);

CREATE TABLE topic (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID REFERENCES course_offering(id) ON DELETE CASCADE,
  course_id   UUID REFERENCES course(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES topic(id) ON DELETE SET NULL,
  code        TEXT,
  name        TEXT NOT NULL,
  sequence    INTEGER,
  CONSTRAINT topic_belongs_somewhere
    CHECK (offering_id IS NOT NULL OR course_id IS NOT NULL)
);

-- Prerequisitos como relación explícita. NUNCA se derivan de `sequence`.
CREATE TABLE topic_prerequisite (
  topic_id        UUID NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
  prerequisite_id UUID NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, prerequisite_id),
  CONSTRAINT no_self_prerequisite CHECK (topic_id <> prerequisite_id)
);

COMMENT ON TABLE topic_prerequisite IS
  'Prerequisitos explícitos. Derivarlos de `topic.sequence` sería inventar una regla académica.';

-- Una ClassSession puede cubrir VARIOS temas. Decisión explícita del spec.
CREATE TABLE class_session (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES course_offering(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled','confirmed','cancelled')),
  -- provenance
  source_type         TEXT NOT NULL CHECK (source_type IN
                        ('institution','instructor','student','community','public_web','inference')),
  source_ref          TEXT,
  observed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence          NUMERIC(3,2) CHECK (confidence BETWEEN 0 AND 1),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
                        CHECK (verification_status IN
                          ('unverified','corroborated','official','disputed')),
  uploaded_by         UUID
);

CREATE TABLE class_session_topic (
  class_session_id UUID NOT NULL REFERENCES class_session(id) ON DELETE CASCADE,
  topic_id         UUID NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
  -- comenzó / continuó / reforzó / cerró. Se CONSUME si el dato lo expresa;
  -- NUNCA se infiere desde la posición.
  relation         TEXT CHECK (relation IN ('started','continued','reinforced','closed')),
  PRIMARY KEY (class_session_id, topic_id)
);

CREATE TABLE resource (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id   UUID REFERENCES course_offering(id) ON DELETE CASCADE,
  topic_id      UUID REFERENCES topic(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL,
  title         TEXT NOT NULL,
  url           TEXT,
  file_ref      TEXT,
  -- provenance + derechos: obligatorio desde el inicio (decisión v0.2 del spec)
  source_type   TEXT NOT NULL,
  source_ref    TEXT,
  rights_status TEXT NOT NULL DEFAULT 'unknown'
                  CHECK (rights_status IN ('unknown','allowed','restricted')),
  uploaded_by   UUID,
  observed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN resource.rights_status IS
  'Default `unknown`, no `allowed`: no se presume permiso sobre material de terceros.';

CREATE TABLE assessment (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES course_offering(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL,           -- parcial / final / TP / entrega
  title       TEXT NOT NULL,
  -- La fecha PUEDE faltar. Fecha desconocida NO se estima.
  assessment_date DATE,
  assessment_time TIME,
  -- P0: 'practico' | 'teorico_escrito'. 'oral' y otras se ALMACENAN pero
  -- quedan fuera de P0 (C01-047). NUNCA se mapean a una modalidad P0.
  modality    TEXT CHECK (modality IN ('practico','teorico_escrito','oral','mixta','otra')),
  scope       TEXT,
  source_type         TEXT NOT NULL,
  source_ref          TEXT,
  observed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence          NUMERIC(3,2),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
                        CHECK (verification_status IN
                          ('unverified','corroborated','official','disputed'))
);

COMMENT ON COLUMN assessment.assessment_date IS
  'Puede faltar. Una fecha desconocida NO se estima: la línea desaparece (omitir, no inventar).';

-- Reportes de clase del estudiante. Versionados: una corrección NO sobrescribe.
CREATE TABLE class_event_record (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id      UUID NOT NULL REFERENCES course_offering(id) ON DELETE CASCADE,
  class_session_id UUID REFERENCES class_session(id) ON DELETE SET NULL,
  student_id       UUID NOT NULL,
  event_type       TEXT NOT NULL CHECK (event_type IN
                     ('topic_priority_up','topic_priority_down','date_change','task','note')),
  payload          JSONB NOT NULL,
  -- versionado: la corrección crea una fila nueva que apunta a la anterior
  supersedes_id    UUID REFERENCES class_event_record(id) ON DELETE SET NULL,
  is_current       BOOLEAN NOT NULL DEFAULT TRUE,
  source_type      TEXT NOT NULL DEFAULT 'student',
  observed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
                        CHECK (verification_status IN
                          ('unverified','corroborated','official','disputed'))
);

COMMENT ON TABLE class_event_record IS
  'Versionado por `supersedes_id`. Una corrección NUNCA sobrescribe: crea fila nueva.';

-- ── RLS deny-by-default (data-model.md §6) ───────────────────────────────────
-- Sin política declarada, RLS niega todo. El backend entra por `service_role`;
-- la autorización fina vive en Service/Repository (ADR-005 Bloque A, ítem 2).
ALTER TABLE institution          ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_program     ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_plan      ENABLE ROW LEVEL SECURITY;
ALTER TABLE course               ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor           ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_offering      ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic                ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_prerequisite   ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_session        ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_session_topic  ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource             ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment           ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_event_record   ENABLE ROW LEVEL SECURITY;

-- ── Índices sobre claves foráneas ────────────────────────────────────────────
-- Postgres indexa la PK y los UNIQUE, pero **no** las FK. Sin esto, cada
-- borrado del padre escanea la tabla hija entera. §6 asigna los índices a la
-- base; cuáles, es criterio de esta migración.
CREATE INDEX academic_program_institution_idx   ON academic_program (institution_id);
CREATE INDEX curriculum_plan_program_idx        ON curriculum_plan (program_id);
CREATE INDEX course_plan_idx                    ON course (curriculum_plan_id);
CREATE INDEX instructor_institution_idx         ON instructor (institution_id);
CREATE INDEX course_offering_course_idx         ON course_offering (course_id);
CREATE INDEX course_offering_instructor_idx     ON course_offering (instructor_id);
CREATE INDEX topic_offering_idx                 ON topic (offering_id);
CREATE INDEX topic_course_idx                   ON topic (course_id);
CREATE INDEX topic_parent_idx                   ON topic (parent_id);
CREATE INDEX topic_prerequisite_prereq_idx      ON topic_prerequisite (prerequisite_id);
CREATE INDEX class_session_offering_idx         ON class_session (offering_id);
CREATE INDEX class_session_topic_topic_idx      ON class_session_topic (topic_id);
CREATE INDEX resource_offering_idx              ON resource (offering_id);
CREATE INDEX resource_topic_idx                 ON resource (topic_id);
CREATE INDEX assessment_offering_idx            ON assessment (offering_id);
CREATE INDEX class_event_record_offering_idx    ON class_event_record (offering_id);
CREATE INDEX class_event_record_session_idx     ON class_event_record (class_session_id);
CREATE INDEX class_event_record_supersedes_idx  ON class_event_record (supersedes_id);

-- La consulta caliente: los reportes vigentes de una cursada.
CREATE INDEX class_event_record_current_idx
  ON class_event_record (offering_id, student_id)
  WHERE is_current;
