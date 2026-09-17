-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B1.4 — capa de ejecución (el loop diario)
--
-- `docs/data-model.md` §9, literal. Siete tablas: la Action y su recomendación,
-- el Commitment con su renegociación y su rescate, la Evidence con su
-- resubmission y sus tres señales separadas, y la Reflection, que es un objeto
-- aparte y no se fusiona con la Evidence.
--
-- `action.exam_preparation_id` queda **sin FK**: apunta a `exam_preparation`,
-- que vive en §10 y todavía no existe. El doc lo anota como "FK más abajo". La
-- restricción se agrega cuando esa tabla exista, no antes: una FK a una tabla
-- inexistente no compila, y una columna sin FK que dice tenerla miente.
--
-- ⚠️ ADR-006 sigue `PENDING`. `evidence_content.storage_ref` y `reflection.note`
-- están marcados en el doc como gateados: se crean, no se escriben.
-- ─────────────────────────────────────────────────────────────────────────────


CREATE TABLE action (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id       UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  course_enrollment_id UUID NOT NULL REFERENCES course_enrollment(id) ON DELETE CASCADE,
  topic_id             UUID REFERENCES topic(id) ON DELETE SET NULL,
  exam_preparation_id  UUID,              -- contexto EXAMEN; FK más abajo

  objective            TEXT NOT NULL,
  verb                 TEXT NOT NULL,
  scope                TEXT NOT NULL,

  -- SOURCE CONTRACT PENDING en el spec: nullable a propósito.
  -- Si falta, la UI OMITE la línea. Nunca la rellena.
  estimated_minutes_min INTEGER,
  estimated_minutes_max INTEGER,
  expected_evidence     TEXT,
  completion_criterion  TEXT,

  status               TEXT NOT NULL DEFAULT 'RECOMMENDED'
                         CHECK (status IN ('RECOMMENDED','ACCEPTED','COMMITTED','IN_PROGRESS',
                                           'EVIDENCE_PENDING','COMPLETED','BLOCKED',
                                           'CANCELLED','REPLACED')),
  blocked_reason       TEXT,
  replaced_by_id       UUID REFERENCES action(id) ON DELETE SET NULL,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE action_resource (
  action_id     UUID NOT NULL REFERENCES action(id) ON DELETE CASCADE,
  resource_id   UUID NOT NULL REFERENCES resource(id) ON DELETE CASCADE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_required   BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (action_id, resource_id)
);

CREATE TABLE action_recommendation (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id      UUID NOT NULL REFERENCES action(id) ON DELETE CASCADE,
  reason_primary TEXT NOT NULL,
  reasons_additional JSONB NOT NULL DEFAULT '[]',
  -- Se usa para identidad y orden autoritativo. NUNCA se expone como score (P-03).
  priority       INTEGER NOT NULL,
  -- El contrato exige exactamente UNA recomendación principal por contexto. Este schema
  -- solo puede impedir más de una por Action hasta definir una identidad canónica de contexto.
  is_primary     BOOLEAN NOT NULL DEFAULT FALSE,
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine_version TEXT
);

CREATE UNIQUE INDEX one_primary_recommendation_per_action
  ON action_recommendation (action_id)
  WHERE is_primary;

CREATE TABLE commitment (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id    UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  action_id         UUID NOT NULL REFERENCES action(id) ON DELETE CASCADE,

  start_at          TIMESTAMPTZ NOT NULL,
  -- La timezone se CONGELA en el acuerdo para reconstruir el horario histórico
  -- sin ambigüedad, aunque el estudiante después cambie de zona.
  timezone_at_commit TEXT NOT NULL,
  planned_minutes   INTEGER NOT NULL CHECK (planned_minutes > 0),

  state             TEXT NOT NULL DEFAULT 'DRAFT'
                      CHECK (state IN ('DRAFT','CONFIRMED','DUE','STARTED',
                                       'COMPLETED','RENEGOTIATED','MISSED','CLOSED')),

  -- Renegociación: relación old → new. El original NO se edita.
  renegotiated_from_id UUID REFERENCES commitment(id) ON DELETE SET NULL,
  -- Rescate: vincula un objeto de rescate con el MISSED original.
  rescues_commitment_id UUID REFERENCES commitment(id) ON DELETE SET NULL,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  missed_at         TIMESTAMPTZ,

  -- Idempotencia del lado del servidor (P3).
  idempotency_key   TEXT,
  UNIQUE (idempotency_key)
);

-- Un rescate NUNCA rescata a un Commitment que no esté MISSED.
-- El Service valida la transición y el Repository la persiste con guard atómico.

CREATE TABLE evidence (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id     UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  action_id          UUID NOT NULL REFERENCES action(id) ON DELETE CASCADE,
  -- SOURCE CONTRACT PENDING: vínculo con el Commitment concreto que originó
  -- esta ejecución. Necesario para explicar tardanza y rescate.
  commitment_id      UUID REFERENCES commitment(id) ON DELETE SET NULL,

  lifecycle_state    TEXT NOT NULL DEFAULT 'EXPECTED'
                       CHECK (lifecycle_state IN ('EXPECTED','SUBMITTED','UNDER_REVIEW',
                                                  'SUFFICIENT','INSUFFICIENT',
                                                  'RESUBMISSION_REQUESTED','VALIDATED')),

  -- Resubmission: la anterior se PRESERVA.
  supersedes_id      UUID REFERENCES evidence(id) ON DELETE SET NULL,
  superseded_by_id   UUID REFERENCES evidence(id) ON DELETE SET NULL,
  resubmission_reason TEXT,

  submission_channel TEXT CHECK (submission_channel IN ('WEB','WHATSAPP')),
  whatsapp_message_ref TEXT,           -- deduplicación y auditoría
  uploaded_by        UUID,
  submitted_at       TIMESTAMPTZ,

  validation_method  TEXT CHECK (validation_method IN
                       ('declarativa','automatica_basica','inspeccionable',
                        'humana','prueba_dominio')),
  -- UNDER_REVIEW EXIGE una instancia real. Un método configurado NO alcanza.
  review_instance_id UUID,
  reviewer_id        UUID,
  review_sla_at      TIMESTAMPTZ,       -- solo si existe SLA real

  -- Las tres señales SEPARADAS. Ninguna se deriva del upload.
  signal_execution   TEXT CHECK (signal_execution IN ('none','low','medium','high','not_evaluated')),
  signal_production  TEXT CHECK (signal_production IN ('none','low','medium','high','not_evaluated')),
  signal_domain      TEXT NOT NULL DEFAULT 'not_evaluated'
                       CHECK (signal_domain IN ('none','low','medium','high','not_evaluated')),

  idempotency_key    TEXT,
  UNIQUE (idempotency_key),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UNDER_REVIEW solo con instancia real de revisión.
ALTER TABLE evidence ADD CONSTRAINT under_review_requires_instance
  CHECK (lifecycle_state <> 'UNDER_REVIEW' OR review_instance_id IS NOT NULL);

CREATE TABLE evidence_content (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id   UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  content_type  TEXT NOT NULL CHECK (content_type IN ('foto','archivo','texto','audio')),
  storage_ref   TEXT,                  -- ⚠️ gateado por ADR-006
  text_content  TEXT,
  display_name  TEXT,
  byte_size     BIGINT,
  sort_order    INTEGER NOT NULL DEFAULT 0
);

-- Reflection: objeto SEPARADO de Evidence. No se fusiona ni infiere.
CREATE TABLE reflection (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id   UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  action_id        UUID REFERENCES action(id) ON DELETE CASCADE,
  evidence_id      UUID REFERENCES evidence(id) ON DELETE SET NULL,
  protocol_step_id UUID,

  actual_minutes   INTEGER,
  difficulty       TEXT CHECK (difficulty IN ('mas_facil','esperado','mas_dificil')),
  confidence       NUMERIC(3,2) CHECK (confidence BETWEEN 0 AND 1),
  result           TEXT,
  quantity_without_help INTEGER,
  quantity_total        INTEGER,
  note             TEXT,               -- ⚠️ visibilidad restringida: C01-017

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reflection_belongs_somewhere
    CHECK (action_id IS NOT NULL OR evidence_id IS NOT NULL OR protocol_step_id IS NOT NULL)
);

-- ── `updated_at` automático donde el doc lo declara ──────────────────────────
CREATE TRIGGER action_updated_at
  BEFORE UPDATE ON action
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Invariantes de dominio que el doc enuncia en prosa ───────────────────────
--
-- "Un rescate NUNCA rescata a un Commitment que no esté MISSED. El Service
-- valida la transición y el Repository la persiste con guard atómico." Lo que
-- la base puede sostener sola es lo estructural; el estado del rescatado lo
-- comprueba el Service, porque depende de otra fila.

-- Un Commitment no se renegocia ni se rescata a sí mismo.
ALTER TABLE commitment
  ADD CONSTRAINT no_se_renegocia_a_si_mismo CHECK (renegotiated_from_id <> id),
  ADD CONSTRAINT no_se_rescata_a_si_mismo   CHECK (rescues_commitment_id <> id);

-- Una Evidence no se supersede a sí misma.
ALTER TABLE evidence
  ADD CONSTRAINT no_se_supersede_a_si_misma  CHECK (supersedes_id <> id),
  ADD CONSTRAINT no_es_superseded_por_si_misma CHECK (superseded_by_id <> id);

-- Las marcas de tiempo de estado sólo existen si el estado las justifica.
-- Un `completed_at` en un Commitment DRAFT es un dato que contradice su estado.
ALTER TABLE commitment
  ADD CONSTRAINT started_at_coherente CHECK (
    started_at IS NULL OR state IN ('STARTED','COMPLETED','CLOSED','MISSED','RENEGOTIATED')),
  ADD CONSTRAINT completed_at_coherente CHECK (
    completed_at IS NULL OR state IN ('COMPLETED','CLOSED')),
  ADD CONSTRAINT missed_at_coherente CHECK (
    missed_at IS NULL OR state IN ('MISSED','CLOSED','RENEGOTIATED'));

-- ── RLS deny-by-default ──────────────────────────────────────────────────────
ALTER TABLE action                ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_resource       ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_recommendation ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment            ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence              ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_content      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection            ENABLE ROW LEVEL SECURITY;

-- ── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX action_institution_idx        ON action (institution_id);
CREATE INDEX action_enrollment_idx         ON action (course_enrollment_id);
CREATE INDEX action_topic_idx              ON action (topic_id);
CREATE INDEX action_replaced_by_idx        ON action (replaced_by_id);
CREATE INDEX action_resource_resource_idx  ON action_resource (resource_id);
CREATE INDEX action_recommendation_action_idx ON action_recommendation (action_id);
CREATE INDEX commitment_institution_idx    ON commitment (institution_id);
CREATE INDEX commitment_action_idx         ON commitment (action_id);
CREATE INDEX commitment_renegotiated_idx   ON commitment (renegotiated_from_id);
CREATE INDEX commitment_rescues_idx        ON commitment (rescues_commitment_id);
CREATE INDEX evidence_institution_idx      ON evidence (institution_id);
CREATE INDEX evidence_action_idx           ON evidence (action_id);
CREATE INDEX evidence_commitment_idx       ON evidence (commitment_id);
CREATE INDEX evidence_supersedes_idx       ON evidence (supersedes_id);
CREATE INDEX evidence_content_evidence_idx ON evidence_content (evidence_id);
CREATE INDEX reflection_institution_idx    ON reflection (institution_id);
CREATE INDEX reflection_action_idx         ON reflection (action_id);
CREATE INDEX reflection_evidence_idx       ON reflection (evidence_id);

-- La consulta caliente del loop diario: las acciones vivas de una cursada.
CREATE INDEX action_enrollment_activas_idx
  ON action (course_enrollment_id, status)
  WHERE status NOT IN ('COMPLETED','CANCELLED','REPLACED');
