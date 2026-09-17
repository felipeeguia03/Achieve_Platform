-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B5.1 — la capa de examen
--
-- Implementa `docs/data-model.md` §10, **con las tres correcciones que el owner
-- cerró el 1 de septiembre de 2026** y que el propio §10 dejaba anotadas como
-- brechas abiertas. Sin ellas esta migración habría congelado en el schema tres
-- afirmaciones que el criterio profesional confirmado contradice.
--
--   1. ADR-028 — **la completion de un paso es un hecho, no un estado.** Se cae
--      el `UNIQUE (exam_preparation_id, protocol_step_id)`.
--   2. ADR-029 — **la pauta de la cátedra tiene entidad propia**, con
--      Provenance, para poder guardarla sin declararla oficial.
--   3. ADR-030 — el protocolo se carga como **configuración versionada
--      rotulada**: `EP-SPEC v0.1` es asunción del equipo y lo dice en sus
--      propias columnas.
--
-- Y una cuarta que no requirió decisión porque ya estaba decidida:
-- **ADR-011** — readiness vive en `preparation_readiness` y en ningún otro
-- lado. `exam_preparation.status` pierde `BUILDING`, `READY_BY_PROTOCOL` y
-- `NOT_READY`: eran la segunda verdad que ADR-011 prohíbe.
--
-- ⚠️ ADR-006 sigue `PROVISIONAL`: sólo datos sintéticos.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── ExamProtocol · configuración versionada, nunca código ────────────────────
--
-- `alcance` es nuevo respecto de §10 y lo pide `HUMAN-P0-04 v1.0`: lo que no se
-- puede omitir con menos de 24 horas **tiene siete componentes**, y siete
-- componentes con su propio criterio de cierre son un protocolo, no un paso del
-- otro. Modelarlo como una versión aparte es lo que permite cargarlo sin tocar
-- el protocolo completo — y sin inventar a qué paso de los 20 corresponde cada
-- uno, que es justamente lo que `C01-034` deja abierto.
CREATE TABLE exam_protocol (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL ⇒ aplica a cualquier modalidad. El núcleo de 24 h no distingue
  -- práctico de teórico en la fuente, y forzarle una modalidad sería inventar.
  modality TEXT CHECK (modality IN ('practico','teorico_escrito')),
  alcance  TEXT NOT NULL DEFAULT 'COMPLETO'
             CHECK (alcance IN ('COMPLETO','NUCLEO_H24')),
  version  TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT protocolo_completo_tiene_modalidad
    CHECK (alcance <> 'COMPLETO' OR modality IS NOT NULL),
  UNIQUE NULLS NOT DISTINCT (modality, alcance, version)
);

-- Dos versiones vigentes para la misma modalidad y alcance serían dos
-- protocolos corriendo a la vez sobre el mismo estudiante.
CREATE UNIQUE INDEX exam_protocol_una_vigente
  ON exam_protocol (COALESCE(modality, ''), alcance)
  WHERE is_current;

COMMENT ON TABLE exam_protocol IS
  'Configuración versionada (ADR-007). Cambiar una regla pedagógica es cargar una versión, no migrar.';

CREATE TABLE protocol_step (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_protocol_id   UUID NOT NULL REFERENCES exam_protocol(id) ON DELETE CASCADE,
  canonical_id       TEXT NOT NULL,
  -- Ordena la LISTA. **No deriva "el siguiente paso"**: `HUMAN-P0-01 v1.0` dice
  -- que en el tramo reentrante el orden es variable, modificable y transversal.
  sequence           INTEGER NOT NULL,
  step_type          TEXT NOT NULL,
  label              TEXT NOT NULL,
  objective          TEXT,
  explanation        TEXT,
  expected_artifact  TEXT,
  criterion          TEXT,

  -- `is_required BOOLEAN NOT NULL DEFAULT TRUE` era lo que decía §10, y afirma
  -- que los 20 pasos son obligatorios. **`C01-031` es exactamente esa pregunta,
  -- y sigue abierta.** Un booleano no tiene dónde poner "todavía nadie lo
  -- declaró", así que se usa el patrón que ADR-026 ya fijó para `Reflection`:
  -- tres estados, con la ausencia tipada.
  requirement        TEXT NOT NULL DEFAULT 'NO_CONFIGURADA'
                       CHECK (requirement IN ('NO_CONFIGURADA','OPCIONAL','OBLIGATORIO')),

  -- `HUMAN-P0-01 v1.0`, literal: los pasos 9 a 18 se pueden repetir varias
  -- veces sobre el mismo tema. Es un dato del paso, no un comentario: la
  -- reentrancia se consulta, no se recuerda.
  is_reentrant       BOOLEAN NOT NULL DEFAULT FALSE,

  -- Procedencia del contenido pedagógico. `EP-SPEC`/`v0.1` = asunción del
  -- equipo; `HUMAN-P0-0X`/`v1.0` = criterio profesional confirmado.
  provisional_default_id TEXT,
  provisional_version    TEXT,
  UNIQUE (exam_protocol_id, canonical_id),
  UNIQUE (exam_protocol_id, sequence)
);

COMMENT ON COLUMN protocol_step.requirement IS
  'NO_CONFIGURADA hasta que C01-031 se cierre. Nunca se lee como OBLIGATORIO por defecto.';
COMMENT ON COLUMN protocol_step.sequence IS
  'Ordena la lista. Derivar de acá "el siguiente paso" contradice HUMAN-P0-01 v1.0.';

-- ── La pauta de la cátedra · ADR-029 ─────────────────────────────────────────
--
-- `HUMAN-P0-07 v1.0`: los criterios generales se conservan, *"pero siempre
-- tomando como referencia la pauta o criterio de evaluación de la cátedra
-- porque en definitiva es lo que va a determinar qué se espera del estudiante"*.
-- El ADL no tenía dónde guardarla.
--
-- **Lleva Provenance completa y por eso se puede guardar sin mentir.** Cargada
-- por el estudiante entra `student`/`unverified` (ADR-023) y la superficie la
-- muestra como lo que el estudiante cargó; sólo `institution`/`instructor` la
-- presenta como criterio de cátedra. `I9` no se toca: nada se eleva.
CREATE TABLE assessment_criterion (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  assessment_id  UUID NOT NULL REFERENCES assessment(id) ON DELETE CASCADE,
  criterion_text TEXT NOT NULL,
  sequence       INTEGER,
  -- `C01-037` — peso relativo de cada criterio. Abierto: se guarda si el dato
  -- viene, y NULL no se lee como "pesa poco".
  weight         NUMERIC(4,3) CHECK (weight IS NULL OR weight BETWEEN 0 AND 1),
  source_type    TEXT NOT NULL CHECK (source_type IN
                   ('institution','instructor','student','community','public_web','inference')),
  source_ref     TEXT,
  observed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
                   CHECK (verification_status IN
                     ('unverified','corroborated','official','disputed')),
  rights_status  TEXT NOT NULL DEFAULT 'unknown'
                   CHECK (rights_status IN ('unknown','allowed','restricted')),
  uploaded_by    UUID
);

COMMENT ON TABLE assessment_criterion IS
  'La pauta de la cátedra (HUMAN-P0-07 v1.0). Autoritativa sólo con source_type institution/instructor.';

-- ── ExamPreparation ──────────────────────────────────────────────────────────
--
-- `status` **ya no incluye** `BUILDING`, `READY_BY_PROTOCOL` ni `NOT_READY`.
-- Estaban en §10 y son la contradicción `CR-UX08-01` que
-- [ADR-011](docs/decisions.md#adr-011) cerró: readiness tiene una sola fuente y
-- no es esta tabla. Lo que queda acá es el lifecycle de la preparación.
CREATE TABLE exam_preparation (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id       UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  assessment_id        UUID NOT NULL REFERENCES assessment(id) ON DELETE CASCADE,
  student_id           UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  course_enrollment_id UUID NOT NULL REFERENCES course_enrollment(id) ON DELETE CASCADE,
  exam_protocol_id     UUID REFERENCES exam_protocol(id) ON DELETE SET NULL,
  status               TEXT NOT NULL DEFAULT 'RECOMMENDED'
                         CHECK (status IN ('RECOMMENDED','ACTIVE','BLOCKED',
                                           'EXAM_TAKEN','CLOSED','ABANDONED')),
  -- "Dónde está ahora", **nunca** "hasta dónde llegó". Con el tramo reentrante
  -- la segunda lectura es directamente falsa.
  current_step_id      UUID REFERENCES protocol_step(id) ON DELETE SET NULL,
  activated_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- `I7`. Hasta esta migración el invariante no tenía dónde probarse.
  UNIQUE (student_id, assessment_id)
);

CREATE TRIGGER exam_preparation_updated_at
  BEFORE UPDATE ON exam_preparation
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- `action.exam_preparation_id` esperaba esta tabla desde la Etapa B1.4.
ALTER TABLE action
  ADD CONSTRAINT action_exam_preparation_fk
  FOREIGN KEY (exam_preparation_id) REFERENCES exam_preparation(id) ON DELETE SET NULL;

-- ── La completion como hecho · ADR-028 ───────────────────────────────────────
--
-- §10 traía `UNIQUE (exam_preparation_id, protocol_step_id)`, que dice **un
-- paso se completa una vez y no vuelve**. `HUMAN-P0-01 v1.0` dice lo contrario,
-- textual: *"el estudiante puede avanzar, volver sobre un tema, recuperar,
-- detectar un error, corregir, practicar, repasar y de nuevo recuperar. Incluso
-- algunas de estas acciones pueden darse varias veces sobre un mismo tema"*.
--
-- Y `product.md` §5.6 ya lo decía del lado del producto: *"no existe un enum de
-- estado por paso congelado; sólo hay un hecho factual de completion"*. El
-- `UNIQUE` era lo único que sostenía la lectura de estado.
--
-- **El tema es parte del hecho.** La fuente no dice "varias veces", dice
-- "varias veces sobre un mismo tema": sin `topic_id` la repetición se puede
-- contar pero no se puede leer, y la superficie tendría que decir "repetiste el
-- paso 12" en vez de "volviste sobre Series".
CREATE TABLE protocol_step_completion (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  exam_preparation_id UUID NOT NULL REFERENCES exam_preparation(id) ON DELETE CASCADE,
  protocol_step_id    UUID NOT NULL REFERENCES protocol_step(id) ON DELETE CASCADE,
  -- NULL ⇒ el paso no se trabajó sobre un tema en particular. No es "todos".
  topic_id            UUID REFERENCES topic(id) ON DELETE SET NULL,
  -- 1, 2, 3… por (preparación, paso, tema). Lo asigna el escritor transaccional
  -- de la B5.3: contarlo en el cliente es una condición de carrera.
  occurrence          INTEGER NOT NULL CHECK (occurrence >= 1),
  completed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_by        UUID NOT NULL,
  idempotency_key     TEXT,
  UNIQUE NULLS NOT DISTINCT (exam_preparation_id, protocol_step_id, topic_id, occurrence)
);

COMMENT ON TABLE protocol_step_completion IS
  'Append-only por convención (I12 no la cubre): cada vuelta es una fila más. Repetir no es retroceder.';
COMMENT ON COLUMN protocol_step_completion.occurrence IS
  'Ordinal de la vuelta. Nunca se presenta como recaída ni como pérdida de progreso (product.md §8.2).';

CREATE UNIQUE INDEX protocol_step_completion_idempotencia
  ON protocol_step_completion (exam_preparation_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE protocol_artifact (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  protocol_step_id    UUID NOT NULL REFERENCES protocol_step(id) ON DELETE CASCADE,
  exam_preparation_id UUID NOT NULL REFERENCES exam_preparation(id) ON DELETE CASCADE,
  artifact_type       TEXT NOT NULL,
  evidence_id         UUID REFERENCES evidence(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PreparationReadiness · la fuente canónica (ADR-011) ──────────────────────
--
-- ADR-011 decidió que readiness vive acá **con su explicación, sus señales y la
-- versión de la regla que lo calculó**. Un estado sin su explicación es un
-- veredicto, y este producto no emite veredictos sobre personas.
--
-- ⚠️ **Nada escribe esta tabla todavía, y no es un olvido.** Los umbrales son
-- `C01-029` y siguen abiertos: qué cuenta como señal suficiente lo fija la
-- psicopedagoga con el insumo de `HUMAN-P0-04` y `HUMAN-P0-05`. Hasta entonces
-- rige lo que ADR-011 dejó vigente: **sin card, sin score, sin cálculo**, y la
-- superficie muestra ausencia tipada. La tabla existe para que el día que haya
-- regla no haya además que decidir dónde vive el resultado.
CREATE TABLE preparation_readiness (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  exam_preparation_id UUID NOT NULL REFERENCES exam_preparation(id) ON DELETE CASCADE,
  state               TEXT NOT NULL
                        CHECK (state IN ('NOT_READY','BUILDING','READY_BY_PROTOCOL')),
  -- Las señales del spec (§VI.8): qué produjo el estado. Sin esto el estado es
  -- un score opaco, que es lo que el producto se prohíbe.
  required_steps      JSONB NOT NULL DEFAULT '[]',
  evidence_status     TEXT,
  autonomous_practice BOOLEAN,
  simulation          BOOLEAN,
  critical_gaps       JSONB NOT NULL DEFAULT '[]',
  -- Explicabilidad obligatoria, igual que en `risk_signal.reason`.
  explanation         TEXT NOT NULL,
  -- Qué regla lo calculó. Cambiar los umbrales no reescribe los readiness
  -- viejos: quedan con la versión que los produjo.
  rule_version        TEXT NOT NULL,
  calculated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Override autorizado (ADR-011). Quién y por qué, o nada.
  overridden_by       UUID,
  override_reason     TEXT,
  overridden_at       TIMESTAMPTZ,
  CONSTRAINT override_completo_o_ausente
    CHECK ((overridden_by IS NULL AND override_reason IS NULL AND overridden_at IS NULL)
        OR (overridden_by IS NOT NULL AND override_reason IS NOT NULL AND overridden_at IS NOT NULL))
);

COMMENT ON TABLE preparation_readiness IS
  'Fuente canónica de readiness (ADR-011). READY_BY_PROTOCOL no predice aprobación.';

-- El readiness vigente de una preparación. Es una referencia, no una copia:
-- `exam_preparation` no mantiene una segunda verdad.
ALTER TABLE exam_preparation
  ADD COLUMN readiness_id UUID REFERENCES preparation_readiness(id) ON DELETE SET NULL;

-- ── Índices sobre las foráneas ───────────────────────────────────────────────
CREATE INDEX protocol_step_por_protocolo    ON protocol_step (exam_protocol_id);
CREATE INDEX assessment_criterion_por_eval  ON assessment_criterion (assessment_id);
CREATE INDEX exam_preparation_por_estudiante ON exam_preparation (student_id, status);
CREATE INDEX exam_preparation_por_cursada   ON exam_preparation (course_enrollment_id);
CREATE INDEX completion_por_preparacion     ON protocol_step_completion (exam_preparation_id, completed_at DESC);
CREATE INDEX completion_por_paso            ON protocol_step_completion (protocol_step_id);
CREATE INDEX artifact_por_preparacion       ON protocol_artifact (exam_preparation_id);
CREATE INDEX readiness_por_preparacion      ON preparation_readiness (exam_preparation_id, calculated_at DESC);

-- ── RLS deny-by-default (data-model.md §6) ───────────────────────────────────
ALTER TABLE exam_protocol            ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_step            ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_criterion     ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_preparation         ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_step_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_artifact        ENABLE ROW LEVEL SECURITY;
ALTER TABLE preparation_readiness    ENABLE ROW LEVEL SECURITY;
