-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.1 — la capa de riesgo e intervención
--
-- Implementa `docs/data-model.md` §10 para `risk_signal`, `playbook`,
-- `intervention` e `intervention_outcome`, y agrega lo que el circuito cerrado
-- necesita para poder verificarse.
--
-- ## Lo que esta migración NO trae, y es la mitad de la decisión
--
-- **Ninguna regla que produzca una señal.** `C01-021` —Risk Engine v1 y sujeto
-- de `RiskSignal`— sigue `OPEN`. Lo que hay es el catálogo de reglas como
-- **configuración versionada** con sus umbrales sin configurar, y un escritor
-- que persiste una señal que su owner ya produjo. Igual que
-- `preparation_readiness` en la B5: la estructura existe, el umbral no.
--
-- **Ningún playbook.** `C01-044` es explícito —*"no se inventan valores"*— y su
-- gate es `P`, antes del piloto. La tabla queda vacía, y el circuito lo declara
-- incompleto en vez de fingir que está cerrado.
--
-- **Ninguna identidad de operador.** Quién es un operador y cómo se le asignan
-- estudiantes viene del CRM (`C01-039`), y eso es el contrato v2 que lleva el
-- CTO. Por eso `owner_operator_id` va **sin FK**, igual que
-- `action.exam_preparation_id` antes de que existiera su tabla.
--
-- ⚠️ ADR-006 sigue `PROVISIONAL`: sólo datos sintéticos.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── El catálogo de reglas · configuración versionada ─────────────────────────
--
-- Mismo patrón que `exam_protocol`: la regla pedagógica es configuración, nunca
-- código. `HUMAN-P0-06 v1.0` nombró **tres situaciones** en las que hace falta
-- una persona, y las nombró como situaciones del estudiante, no como
-- propiedades de una entrega. Entran acá con su texto.
--
-- **Y entran con todo lo que no dijo, vacío.** Cuántas repeticiones hacen a un
-- error "reiterativo" es `C01-036`; qué severidad le corresponde a cada una,
-- nadie la asignó; y si una señal se observa, se automatiza o llama a una
-- persona es una de las preguntas abiertas del spec (§32). Nada de eso se
-- completa acá.
CREATE TABLE risk_rule (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id TEXT NOT NULL,
  version      TEXT NOT NULL,
  signal_type  TEXT NOT NULL,
  label        TEXT NOT NULL,
  -- El texto de la fuente, verbatim. Igual que en `protocol_step`: la
  -- trazabilidad se verifica, no se promete.
  source_text  TEXT,

  -- ⚠️ `C01-036`. NULL ⇒ **nadie fijó el umbral**, y por eso nada la evalúa.
  threshold_config JSONB,
  -- NULL ⇒ nadie asignó severidad a esta regla. **No es `bajo`.**
  suggested_severity TEXT
    CHECK (suggested_severity IS NULL
        OR suggested_severity IN ('bajo','atencion','riesgo','intervencion')),
  -- Observar, automatizar o llamar a una persona: pregunta abierta del spec §32.
  modo TEXT NOT NULL DEFAULT 'NO_CONFIGURADO'
    CHECK (modo IN ('NO_CONFIGURADO','OBSERVACION','AUTOMATICA','HUMANA')),

  is_current   BOOLEAN NOT NULL DEFAULT FALSE,
  provisional_default_id TEXT,
  provisional_version    TEXT,
  UNIQUE (canonical_id, version),

  -- **Una regla no se puede correr sola sin umbral.** Es el equivalente de lo
  -- que `preparation_readiness` hace con la explicación: sin la pieza que la
  -- vuelve legible, el estado no se puede escribir.
  CONSTRAINT automatica_exige_umbral
    CHECK (modo <> 'AUTOMATICA' OR threshold_config IS NOT NULL)
);

CREATE UNIQUE INDEX risk_rule_una_vigente
  ON risk_rule (canonical_id) WHERE is_current;

COMMENT ON TABLE risk_rule IS
  'Configuración versionada. Cambiar un umbral es cargar una versión, no migrar (mismo criterio que exam_protocol).';
COMMENT ON COLUMN risk_rule.threshold_config IS
  'NULL = C01-036 sin responder. Ninguna regla sin umbral puede correr en modo AUTOMATICA.';

-- ── RiskSignal ───────────────────────────────────────────────────────────────
--
-- `data-model.md` §10, más lo que el circuito necesita para cerrarse: las
-- marcas de tiempo de cada transición y la regla que la produjo.
CREATE TABLE risk_signal (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id       UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id           UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  course_enrollment_id UUID REFERENCES course_enrollment(id) ON DELETE CASCADE,
  signal_type          TEXT NOT NULL,
  severity             TEXT NOT NULL CHECK (severity IN ('bajo','atencion','riesgo','intervencion')),

  -- **Explicabilidad obligatoria.** El spec lo dice dos veces: *"nunca un score
  -- opaco como única salida"*, *"toda señal de riesgo relevante debe mostrar
  -- causas operables"*. Sin razón no hay señal, y el `NOT NULL` es la única
  -- forma de que eso no dependa de que alguien se acuerde.
  reason               TEXT NOT NULL CHECK (length(btrim(reason)) > 0),
  source_ref           TEXT,

  -- Qué regla la produjo y en qué versión. Cambiar los umbrales no reescribe
  -- las señales viejas: quedan con la versión que las generó.
  risk_rule_id         UUID REFERENCES risk_rule(id) ON DELETE SET NULL,
  rule_version         TEXT,

  status               TEXT NOT NULL DEFAULT 'OPEN'
                         CHECK (status IN ('OPEN','ACKNOWLEDGED','INTERVENTION_REQUIRED',
                                           'RESOLVED','ESCALATED','EXPIRED')),
  valid_until          TIMESTAMPTZ,
  acknowledged_at      TIMESTAMPTZ,
  resolved_at          TIMESTAMPTZ,
  escalated_at         TIMESTAMPTZ,
  expired_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- `I8`: reintentar una detección no crea dos señales del mismo hecho.
  idempotency_key      TEXT,

  -- Coherencia entre estado y marcas, igual que en `commitment`.
  CONSTRAINT senal_resuelta_tiene_fecha
    CHECK (status <> 'RESOLVED' OR resolved_at IS NOT NULL),
  CONSTRAINT senal_expirada_tiene_fecha
    CHECK (status <> 'EXPIRED' OR expired_at IS NOT NULL)
);

CREATE TRIGGER risk_signal_updated_at
  BEFORE UPDATE ON risk_signal
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE UNIQUE INDEX risk_signal_idempotencia
  ON risk_signal (institution_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN risk_signal.reason IS
  'Explicabilidad obligatoria: nunca un score opaco como única salida (Parte I §8.6).';

-- ── Playbook ─────────────────────────────────────────────────────────────────
--
-- ⚠️ **Se crea vacía y se queda vacía.** Cuáles son los 4–6 playbooks mínimos
-- del piloto y sus SLA es `C01-044`, gate `P`, y dice textual *"no se inventan
-- valores"*. Un playbook inventado sería una instrucción a una persona sobre
-- qué hacer con un estudiante, escrita por un agente.
CREATE TABLE playbook (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institution(id) ON DELETE RESTRICT,
  trigger        TEXT NOT NULL,
  objective      TEXT NOT NULL,
  version        TEXT NOT NULL,
  steps          JSONB NOT NULL DEFAULT '[]',
  escalation     TEXT,
  -- El SLA vive en el playbook porque es parte de él (`C01-044`).
  sla_minutes    INTEGER CHECK (sla_minutes IS NULL OR sla_minutes > 0),
  is_current     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trigger, version)
);

COMMENT ON TABLE playbook IS
  'Vacía a propósito: C01-044 (gate P) dice "no se inventan valores". El circuito declara la falta.';

-- ── Intervention ─────────────────────────────────────────────────────────────
--
-- `owner_operator_id` **sin FK**: la identidad del operador vive en el CRM
-- (`C01-039`) y llega con el contrato v2. `owner_verified` registra si en el
-- momento de abrirla existía un directorio que pudiera confirmarla — hoy no
-- existe, y la alternativa era que el dato quedara indistinguible de uno
-- verificado.
CREATE TABLE intervention (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id    UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  risk_signal_id    UUID REFERENCES risk_signal(id) ON DELETE SET NULL,
  student_id        UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  owner_operator_id UUID NOT NULL,
  owner_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  playbook_id       UUID REFERENCES playbook(id) ON DELETE SET NULL,
  sla_at            TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','acknowledged','closed')),
  human_minutes     INTEGER CHECK (human_minutes IS NULL OR human_minutes >= 0),
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at   TIMESTAMPTZ,
  closed_at         TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idempotency_key   TEXT,
  CONSTRAINT intervencion_cerrada_tiene_fecha
    CHECK (status <> 'closed' OR closed_at IS NOT NULL)
);

CREATE TRIGGER intervention_updated_at
  BEFORE UPDATE ON intervention
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE UNIQUE INDEX intervention_idempotencia
  ON intervention (institution_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN intervention.owner_verified IS
  'FALSE mientras no exista el directorio de operadores del CRM (C01-039, contrato v2).';

-- El outcome es una tabla aparte y con PK compartida: **una intervención tiene
-- como mucho un resultado**, y una intervención cerrada no puede no tenerlo.
-- Eso último no lo puede garantizar un CHECK entre tablas: lo garantiza
-- `cerrar_intervencion()`, que escribe las dos cosas en una transacción.
CREATE TABLE intervention_outcome (
  intervention_id UUID PRIMARY KEY REFERENCES intervention(id) ON DELETE CASCADE,
  outcome         TEXT NOT NULL CHECK (outcome IN
                    ('recuperado','replanificado','sin_respuesta','escalado','falso_positivo')),
  note            TEXT,
  recorded_by     UUID,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE intervention_outcome IS
  'El final del Risk Engine. El dashboard no lo es (Parte I, DECIDIDO).';

-- ── Índices sobre las foráneas y las colas ───────────────────────────────────
CREATE INDEX risk_signal_por_estudiante ON risk_signal (student_id, status);
CREATE INDEX risk_signal_por_institucion ON risk_signal (institution_id, status, created_at DESC);
CREATE INDEX risk_signal_por_cursada    ON risk_signal (course_enrollment_id);
CREATE INDEX risk_signal_por_regla      ON risk_signal (risk_rule_id);
-- La cola del operador: abiertas, por vencimiento de SLA.
CREATE INDEX intervention_cola          ON intervention (institution_id, status, sla_at NULLS LAST);
CREATE INDEX intervention_por_senal     ON intervention (risk_signal_id);
CREATE INDEX intervention_por_estudiante ON intervention (student_id);
CREATE INDEX playbook_vigente           ON playbook (trigger) WHERE is_current;

-- ── RLS deny-by-default (data-model.md §6) ───────────────────────────────────
ALTER TABLE risk_rule            ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_signal          ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook             ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention         ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_outcome ENABLE ROW LEVEL SECURITY;
