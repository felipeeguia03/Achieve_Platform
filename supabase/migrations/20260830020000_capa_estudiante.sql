-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B1.3 — capa del estudiante y auth
--
-- Implementa `docs/data-model.md` §8 literalmente, y ata `student.auth_user_id`
-- al proveedor de auth ahora que ADR-005 (Bloque A) ratificó Supabase: el doc
-- lo declara "FK al proveedor de auth" y hasta hoy no había proveedor al que
-- apuntar.
--
-- ⚠️ ADR-006 sigue `PENDING`: sólo usuarios y datos sintéticos.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE student (
  -- UUID canónico de Plataforma. En contratos HTTP se expone como `platformStudentId`.
  -- No crear una segunda columna con ese nombre: sería la misma identidad duplicada.
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  -- FK real al proveedor de auth, habilitada por ADR-005 Bloque A.
  -- ON DELETE SET NULL y no CASCADE: borrar una identidad de auth no puede
  -- llevarse por delante el historial académico del estudiante en silencio.
  -- Qué se borra y qué se conserva lo decide ADR-006, no esta migración.
  auth_user_id   UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  timezone       TEXT NOT NULL DEFAULT 'America/Argentina/Cordoba',
  whatsapp       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN student.whatsapp IS
  'DATO PERSONAL. Gateado por ADR-006: ninguna capa lo escribe mientras siga PENDING.';
COMMENT ON COLUMN student.auth_user_id IS
  'FK a auth.users. NULL = estudiante del padrón sin identidad de auth todavía.';

CREATE TABLE enrollment (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES academic_program(id) ON DELETE RESTRICT,
  term       TEXT NOT NULL,
  UNIQUE (student_id, program_id, term)
);

CREATE TABLE course_enrollment (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  offering_id    UUID NOT NULL REFERENCES course_offering(id) ON DELETE RESTRICT,
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','completed','dropped','paused')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, offering_id)
);

-- Las cinco dimensiones, SEPARADAS. Sin columna de score agregado.
CREATE TABLE topic_progress (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id       UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  course_enrollment_id UUID NOT NULL REFERENCES course_enrollment(id) ON DELETE CASCADE,
  topic_id             UUID NOT NULL REFERENCES topic(id) ON DELETE CASCADE,

  -- NULL = no hay información. Distinto de 'not_evaluated' explícito.
  exposure_value       NUMERIC,
  exposure_state       TEXT NOT NULL DEFAULT 'no_information'
                         CHECK (exposure_state IN ('value','not_evaluated','no_information')),
  practice_value       NUMERIC,
  practice_state       TEXT NOT NULL DEFAULT 'no_information'
                         CHECK (practice_state IN ('value','not_evaluated','no_information')),
  domain_value         NUMERIC,
  domain_state         TEXT NOT NULL DEFAULT 'not_evaluated'
                         CHECK (domain_state IN ('value','not_evaluated','no_information')),
  confidence_value     NUMERIC,
  confidence_state     TEXT NOT NULL DEFAULT 'no_information'
                         CHECK (confidence_state IN ('value','not_evaluated','no_information')),
  confidence_declared_at TIMESTAMPTZ,     -- la confianza SIEMPRE lleva su fecha
  recency_at           TIMESTAMPTZ,

  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_enrollment_id, topic_id)
);

COMMENT ON TABLE topic_progress IS
  'Cinco dimensiones separadas. No hay columna de score agregado y no se agrega: DD5 y P-03 prohíben la magnitud de máquina visible.';

-- El invariante que más se rompe: "sin datos no es cero". Un estado `value`
-- exige un número; `not_evaluated` y `no_information` exigen que NO lo haya,
-- para que nadie guarde un 0 y después lo lea como dominio bajo.
ALTER TABLE topic_progress
  ADD CONSTRAINT exposure_valor_consistente CHECK (
    (exposure_state = 'value' AND exposure_value IS NOT NULL) OR
    (exposure_state <> 'value' AND exposure_value IS NULL)),
  ADD CONSTRAINT practice_valor_consistente CHECK (
    (practice_state = 'value' AND practice_value IS NOT NULL) OR
    (practice_state <> 'value' AND practice_value IS NULL)),
  ADD CONSTRAINT domain_valor_consistente CHECK (
    (domain_state = 'value' AND domain_value IS NOT NULL) OR
    (domain_state <> 'value' AND domain_value IS NULL)),
  ADD CONSTRAINT confidence_valor_consistente CHECK (
    (confidence_state = 'value' AND confidence_value IS NOT NULL) OR
    (confidence_state <> 'value' AND confidence_value IS NULL)),
  -- "La confianza SIEMPRE lleva su fecha" (§8). Sin fecha no es confianza:
  -- es un número sin cuándo, y UX02 la muestra como "alta · declarada ayer".
  ADD CONSTRAINT confianza_con_fecha CHECK (
    confidence_state <> 'value' OR confidence_declared_at IS NOT NULL);

-- Primer usuario de `set_updated_at()` de la B1.1: §8 es la primera capa con
-- tablas que se editan en sitio.
CREATE TRIGGER topic_progress_updated_at
  BEFORE UPDATE ON topic_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  day_of_week  SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME,
  end_time     TIME,
  capacity_min INTEGER,
  source       TEXT NOT NULL DEFAULT 'declared'
                 CHECK (source IN ('declared','observed','inferred'))
);

-- ── RLS deny-by-default ──────────────────────────────────────────────────────
ALTER TABLE student           ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment        ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability      ENABLE ROW LEVEL SECURITY;

-- ── Índices sobre claves foráneas y sobre el scoping institucional ───────────
CREATE INDEX student_institution_idx            ON student (institution_id);
CREATE INDEX enrollment_student_idx             ON enrollment (student_id);
CREATE INDEX enrollment_program_idx             ON enrollment (program_id);
CREATE INDEX course_enrollment_institution_idx  ON course_enrollment (institution_id);
CREATE INDEX course_enrollment_student_idx      ON course_enrollment (student_id);
CREATE INDEX course_enrollment_offering_idx     ON course_enrollment (offering_id);
CREATE INDEX topic_progress_institution_idx     ON topic_progress (institution_id);
CREATE INDEX topic_progress_enrollment_idx      ON topic_progress (course_enrollment_id);
CREATE INDEX topic_progress_topic_idx           ON topic_progress (topic_id);
CREATE INDEX availability_student_idx           ON availability (student_id);
