# Achieve — Modelo de datos

**Documento:** `docs/data-model.md`
**Rol:** owner canónico de entidades, relaciones, máquinas de estado y schema.
**Última actualización:** 31 de agosto de 2026

> ⚠️ **Estado.** Las **entidades, relaciones y máquinas de estado** (§1–§5) están heredadas del spec
> fuente y son firmes. El **schema SQL** (§6–§10) es la baseline implementada en Postgres, con las
> adiciones provisionales rotuladas; no se ejecutaba ninguna migración hasta que
> [ADR-005](decisions.md#adr-005) estuviera `ACCEPTED`. **Lo
> está desde el 30 de agosto de 2026** y B1/B2 ya implementaron las capas académica, estudiante y
> ejecución, además de eventos, ingesta asistida, Storage y materialización del ADE. Todo corre
> **sobre datos sintéticos**. Cualquier dato de una persona real sigue bloqueado por
> [ADR-006](decisions.md#adr-006).
>
> Se usa SQL estándar de Postgres, portable entre las alternativas probables. Donde algo es
> específico de un proveedor, está marcado.

---

## 1. Grafo de dominio

```
Institution
 └─ AcademicProgram
     └─ CurriculumPlan
         └─ Course
             └─ CourseOffering
                 ├─ Instructor
                 ├─ ClassSession
                 ├─ Topic
                 ├─ Resource
                 └─ Assessment

Student
 └─ Enrollment
     └─ CourseEnrollment
         ├─ TopicProgress
         ├─ Action
         │   ├─ ActionRecommendation
         │   ├─ Commitment
         │   ├─ Evidence
         │   └─ Reflection
         ├─ ProgressEntry
         └─ ExamPreparation
             ├─ ExamProtocol (plantilla versionada)
             ├─ ProtocolStep
             ├─ ProtocolArtifact
             ├─ Diagnostic
             ├─ ErrorMap
             └─ Simulation
```

**`CourseEnrollment` es el eje del modelo del estudiante.** Es el contexto persistente de Cursado, y
tanto las Actions del día a día como las preparaciones de examen cuelgan de él.

---

## 2. Cardinalidades críticas

| Origen | Destino | Cardinalidad | Nota |
|---|---|---|---|
| `Course` | `CourseOffering` | 1:N | Una materia se dicta múltiples veces |
| `CourseOffering` | `Assessment` | 1:N | Cada dictado tiene varias evaluaciones |
| `CourseOffering` | `ClassSession` | 1:N | **Una sesión puede cubrir varios temas** |
| `ClassSession` | `Topic` | N:N | No se asume "una unidad = una clase" |
| `Student` | `CourseEnrollment` | 1:N | |
| `CourseEnrollment` | `TopicProgress` | 1:N | Progreso por tema |
| `CourseEnrollment` | `Action` | 1:N | De cursado o de examen |
| `Assessment` | `ExamPreparation` | 1:N | Una preparación por estudiante |
| `CourseEnrollment` | `ExamPreparation` | 1:N | Varias preparaciones históricas |
| `ExamPreparation` | `ProtocolStep` | N:N | Plantilla versionada; estado por preparación |
| **`Action`** | **`Commitment`** | **1:N** | **Renegociación y reintento conservan historial** |
| **`Action`** | **`Evidence`** | **1:N** | **Puede requerir varias evidencias** |
| `RiskSignal` | `Intervention` | 1:N | Una señal puede requerir varias intervenciones |
| `Intervention` | `InterventionOutcome` | 1:1 final | Cada intervención cierra con resultado |

> Las dos cardinalidades en negrita son las que más se implementan mal. Un `Commitment` renegociado
> **no actualiza** el anterior: crea uno nuevo. Una `Evidence` reenviada **no sobrescribe** la
> anterior: crea una nueva y preserva la original.

---

## 3. Máquinas de estado

Definidas en `product.md` §5. Acá está su forma ejecutable, para que el schema y los tests las
compartan.

### 3.1 Action

```ts
type ActionStatus =
  | 'RECOMMENDED' | 'ACCEPTED' | 'COMMITTED'
  | 'IN_PROGRESS' | 'EVIDENCE_PENDING' | 'COMPLETED'
  | 'BLOCKED' | 'CANCELLED' | 'REPLACED';

const actionTransitions: Record<ActionStatus, ActionStatus[]> = {
  RECOMMENDED:      ['ACCEPTED', 'BLOCKED', 'CANCELLED', 'REPLACED'],
  ACCEPTED:         ['COMMITTED', 'BLOCKED', 'CANCELLED', 'REPLACED'],
  COMMITTED:        ['IN_PROGRESS', 'BLOCKED', 'CANCELLED', 'REPLACED'],
  IN_PROGRESS:      ['EVIDENCE_PENDING', 'COMPLETED', 'BLOCKED'],
  EVIDENCE_PENDING: ['COMPLETED', 'BLOCKED'],
  COMPLETED:        [],
  BLOCKED:          ['RECOMMENDED', 'ACCEPTED', 'COMMITTED', 'IN_PROGRESS', 'CANCELLED'],
  CANCELLED:        [],
  REPLACED:         [],
};
```

### 3.2 Commitment

```ts
type CommitmentState =
  | 'DRAFT' | 'CONFIRMED' | 'DUE' | 'STARTED'
  | 'COMPLETED' | 'RENEGOTIATED' | 'MISSED' | 'CLOSED';

const commitmentTransitions: Record<CommitmentState, CommitmentState[]> = {
  DRAFT:        ['CONFIRMED'],
  CONFIRMED:    ['DUE', 'STARTED', 'RENEGOTIATED', 'MISSED'],
  DUE:          ['STARTED', 'RENEGOTIATED', 'MISSED'],
  STARTED:      ['COMPLETED', 'MISSED'],   // STARTED NO admite RENEGOTIATED
  COMPLETED:    [],
  RENEGOTIATED: [],                        // terminal: el nuevo Commitment es otra fila
  MISSED:       ['CLOSED'],                // MISSED NUNCA vuelve a un estado "cumplido"
  CLOSED:       [],
};
```

> **`MISSED` es un estado casi terminal por diseño.** Su única salida es `CLOSED`. No existe camino
> de `MISSED` a `COMPLETED`, `CONFIRMED` ni `RENEGOTIATED`. Esto implementa *No Cortar*: el rescate es
> un objeto separado, no una edición del original.

`RESCUE_REQUIRED` y `RESCUE_MATERIALIZED` **no son estados**: son condiciones derivadas de la
proyección. `RESCUE_REQUIRED` = existe un `MISSED` sin objeto de rescate vinculado.
`RESCUE_MATERIALIZED` = existe una Action o Commitment de rescate vinculada.

### 3.3 Evidence

Heredada literalmente de `lib/targeted-correction.ts` del prototipo, que la tenía correcta:

```ts
type EvidenceState =
  | 'EXPECTED' | 'SUBMITTED' | 'UNDER_REVIEW'
  | 'SUFFICIENT' | 'INSUFFICIENT' | 'RESUBMISSION_REQUESTED' | 'VALIDATED';

const evidenceOwnerTransitions: Record<EvidenceState, EvidenceState[]> = {
  EXPECTED:               ['SUBMITTED'],
  SUBMITTED:              ['UNDER_REVIEW', 'SUFFICIENT', 'INSUFFICIENT'],
  UNDER_REVIEW:           ['SUFFICIENT', 'INSUFFICIENT'],
  SUFFICIENT:             ['VALIDATED'],
  INSUFFICIENT:           ['RESUBMISSION_REQUESTED'],
  RESUBMISSION_REQUESTED: ['SUBMITTED'],   // sobre una Evidence NUEVA
  VALIDATED:              [],
};
```

> `RESUBMISSION_REQUESTED → SUBMITTED` **no** ocurre sobre la misma fila. La Evidence anterior queda
> en `RESUBMISSION_REQUESTED` con `superseded_by` apuntando a la nueva, que nace en `SUBMITTED` con
> `supersedes` apuntando a la anterior.

### 3.4 ExamPreparation

```ts
type ExamPreparationStatus =
  | 'RECOMMENDED' | 'ACTIVE' | 'BLOCKED'
  | 'EXAM_TAKEN' | 'CLOSED' | 'ABANDONED';

type PreparationReadinessState = 'NOT_READY' | 'BUILDING' | 'READY_BY_PROTOCOL';
```

✅ **`CR-UX08-01`, cerrada por [ADR-011](decisions.md#adr-011) e implementada en la Fase B5.**
`BUILDING`, `READY_BY_PROTOCOL` y `NOT_READY` **salieron del lifecycle**: son estados de
`PreparationReadiness`, que es su única fuente. `ExamPreparation` referencia el readiness vigente por
`readiness_id` y **no mantiene una segunda verdad**.

Y la tabla de transiciones, que este documento no traía: sale de la máquina de
[`product.md`](product.md) §5.4 quitándole los tres nodos de readiness, con lo que la cadena central
se cierra en `ACTIVE → EXAM_TAKEN`. **No es un atajo nuevo**: es el mismo camino sin los nodos que
dejaron de pertenecer a esta entidad. `BLOCKED` queda **sin salida declarada** —el diagrama no dibuja
el retorno y `C01-025` sigue `OPEN`—, y deny-by-default: lo que nadie declaró, no se puede.

### 3.5 RiskSignal

```ts
type RiskSignalStatus =
  | 'OPEN' | 'ACKNOWLEDGED' | 'INTERVENTION_REQUIRED'
  | 'RESOLVED' | 'ESCALATED' | 'EXPIRED';
```

---

## 4. Provenance — el tipo compartido

Todo dato académico discutible lleva este bloque. En el schema se materializa como columnas, no como
JSON, para que sea consultable e indexable.

```ts
type SourceType =
  | 'institution' | 'instructor' | 'student'
  | 'community' | 'public_web' | 'inference';

type VerificationStatus =
  | 'unverified' | 'corroborated' | 'official' | 'disputed';

type RightsStatus = 'unknown' | 'allowed' | 'restricted';

interface Provenance {
  source_type: SourceType;
  source_ref: string | null;
  observed_at: Date;
  valid_from: Date | null;
  valid_until: Date | null;
  confidence: number | null;          // 0..1, operativa. NO es la confianza del alumno
  verification_status: VerificationStatus;
  uploaded_by: string | null;
  rights_status: RightsStatus | null;
}
```

> **Invariante de aplicación:** ninguna capa eleva un `verification_status`. Un reporte del estudiante
> permanece `student` + `unverified` hasta que el owner del dato lo corrobore. Enviar una corrección
> no lo vuelve `official`.

---

## 5. Las cinco dimensiones de progreso

```ts
interface TopicProgressDimensions {
  exposure:   DimensionValue;   // Recorrido
  practice:   DimensionValue;   // Práctica
  domain:     DimensionValue;   // Dominio
  confidence: DimensionValue;   // Confianza (autorreporte, con fecha)
  recency:    Date | null;      // Recencia
}

// P4 — el read model tipa cuatro estados, NO tres.
// `unavailable` es operativo: lo produce la lectura ante un fallo y no se persiste.
type DimensionValue =
  | { kind: 'value';         value: number; unit: string; observed_at: Date }
  | { kind: 'not_evaluated' }        // existe el eje, no hay prueba aplicable
  | { kind: 'no_information' }       // no hay datos suficientes
  | { kind: 'unavailable' };         // la lectura falló — NO es lo mismo que las otras
```

**Nunca** se agrega un campo `overall_progress`, `percentage` ni `score` a esta estructura. La UI
puede sintetizar para mostrar; el modelo no colapsa.

**La escala breve de `HUMAN-P0-02 v1.0` no cambia esto.** La psicopedagoga confirmó el modelo mixto
—escala breve para el día a día, dimensiones separadas cuando hay desempeño observable
([ADR-025](decisions.md#adr-025))—, y esa escala es **proyección de lectura**: se deriva, **no se
persiste**, no reemplaza a las dimensiones y no dispara un `ProgressUpdated`. Ninguna columna nueva
sale de ahí.

⚠️ **El conjunto de ejes sigue abierto.** El vocabulario profesional —contacto, recuperación,
aplicación, corrección, confianza aparte— **no coincide** con estos cinco campos: *corrección* no
tiene eje y *recuperación* y *aplicación* viven colapsadas en `domain`. La reconciliación es
`C01-019` (gate `H`) y **hasta que se cierre esta estructura no gana ni pierde campos**. Ver
[`product.md`](product.md) §6.1.

---

## 6. Schema propuesto — convenciones

- PostgreSQL 15+. Claves `UUID` con `gen_random_uuid()`.
- `TIMESTAMPTZ` siempre; nunca `TIMESTAMP` sin zona.
- Todas las tablas de datos de estudiante llevan `institution_id` para el aislamiento (R1).
- Los enums se declaran como `CHECK` constraints, no como tipos `ENUM` de Postgres: agregar un valor
  a un `ENUM` es una migración bloqueante, y las máquinas de estado del spec pueden crecer.
- `created_at` / `updated_at` en toda tabla mutable.
- La lógica de negocio no se implementa en triggers ni funciones PL/pgSQL. Vive en Services
  TypeScript; la base aporta constraints, índices y atomicidad/concurrencia mínima.
- Todas las tablas quedan con RLS deny-by-default para cerrar la superficie autoexpuesta de Supabase.
  El backend usa `service_role`, por lo que autorización y scoping siguen siendo responsabilidad de
  Controller/Service/Repository ([`architecture.md`](architecture.md) §3).
- **Ninguna tabla para `TodayView`**, `ActionDetailView`, `CommitmentView`,
  `EvidenceSubmissionView`, `ProgressAfterEvidenceView` ni `ExamPreparationOverviewView`: son
  proyecciones de lectura, no entidades.

### 6.1 Identidades entre Plataforma y CRM

- `student.id` es el UUID canónico generado por Plataforma y se serializa como `platformStudentId`
  en el contrato CRM. Son el mismo identificador; no se duplica en otra columna.
- `studentId` de la respuesta de CRM es una identidad externa distinta. Puede conservarse para
  trazabilidad cuando se defina su modelo, pero nunca reemplaza `student.id`.
- El `institutionId` que devuelve CRM identifica una institución en el CRM. El contrato recibido no
  congela si ese UUID también será la PK de `institution` en Plataforma o si requiere una tabla de
  correspondencia. **No se asume ninguna de las dos opciones:** el mapping queda pendiente en
  `C01-001`/`C01-039` y debe cerrarse antes de persistir autorizaciones reales.
- Email institucional se usa para el match inicial de padrón; no es identidad canónica y no se usa
  como FK entre sistemas.

---

## 7. Schema — capa académica (ADL)

```sql
CREATE TABLE institution (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  tenant_config JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Adición estructural provisional de ADR-024, para revisión junto con C01-027.
-- `scope` sigue siendo texto libre: el alcance académico se declara, nunca se infiere.
CREATE TABLE assessment_topic (
  assessment_id UUID NOT NULL REFERENCES assessment(id) ON DELETE CASCADE,
  topic_id      UUID NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
  PRIMARY KEY (assessment_id, topic_id)
);

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
```

---

## 8. Schema — capa del estudiante

```sql
CREATE TABLE student (
  -- UUID canónico de Plataforma. En contratos HTTP se expone como `platformStudentId`.
  -- No crear una segunda columna con ese nombre: sería la misma identidad duplicada.
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  auth_user_id   UUID UNIQUE,          -- FK al proveedor de auth (ADR-005)
  timezone       TEXT NOT NULL DEFAULT 'America/Argentina/Cordoba',
  whatsapp       TEXT,                 -- ⚠️ dato personal: gateado por ADR-006
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
```

---

## 9. Schema — capa de ejecución (el loop diario)

```sql
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

  -- ADR-026. Se CONGELA al crear la Action: un requisito que cambia después
  -- reescribiría si una entrega vieja era válida. NO_CONFIGURADA no es OPTIONAL
  -- — la primera no ofrece la CTA-016, la segunda sí y omitirla es válido.
  reflection_requirement TEXT NOT NULL DEFAULT 'NO_CONFIGURADA'
                         CHECK (reflection_requirement IN ('NO_CONFIGURADA','OPTIONAL','REQUIRED')),

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
  --
  -- HUMAN-P0-05 v1.0 (ADR-025) confirmó esta separación y le puso nombre:
  --   `signal_execution` + `signal_production` = EVIDENCIA DE TRABAJO.
  --     Un cronograma, una foto del material, un checklist, una ficha o un resumen.
  --     Prueban que hubo actividad. NO habilitan ninguna afirmación de aprendizaje.
  --   `signal_domain`                          = EVIDENCIA DE APRENDIZAJE.
  --     Exige una instancia que compruebe qué puede hacer con el contenido de manera
  --     AUTÓNOMA. Por eso es la única NOT NULL y arranca en 'not_evaluated'.
  -- Excepción declarada por la fuente, alcance abierto en `C01-035`: una tarea cuya
  -- consigna misma exija comprensión.
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

-- ⚠️ El REQUISITO de Reflection no vive acá: vive en `action.reflection_requirement`
-- (y en el paso del protocolo, Fase B5), congelado al crear la instancia
-- (ADR-026). Una configuración que cambia después reescribiría si una entrega
-- vieja era válida. Los tres valores son NO_CONFIGURADA / OPTIONAL / REQUIRED:
-- la primera no ofrece la CTA-016, la segunda sí y omitirla es válido.

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
```

---

## 10. Schema — progreso, examen, riesgo y eventos

> **Estado de migración — 31 de agosto de 2026.** `progress_entry` **existe en la base** desde
> `20260831050000_progress_entry.sql` (Etapa B2.6): `UX06` no podía proyectar un resultado de
> progreso sin ella. Lo que se migró es esta declaración más su invariante `I10` como `CHECK`; **el
> `ProgressUpdated` productivo sigue siendo la Fase B3** —nadie escribe estas filas todavía— y
> `entry_kind` **no lleva `CHECK`** porque cerrar su vocabulario es `C01-018`, `OPEN`. Las tablas de
> examen y riesgo de esta sección siguen sin migrar.

```sql
-- ProgressEntry: bundle derivado. Materialización OPCIONAL para la Bitácora.
CREATE TABLE progress_entry (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id       UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  course_enrollment_id UUID NOT NULL REFERENCES course_enrollment(id) ON DELETE CASCADE,
  topic_id             UUID REFERENCES topic(id) ON DELETE SET NULL,
  action_id            UUID REFERENCES action(id) ON DELETE SET NULL,
  commitment_id        UUID REFERENCES commitment(id) ON DELETE SET NULL,
  evidence_id          UUID REFERENCES evidence(id) ON DELETE SET NULL,
  occurred_at          TIMESTAMPTZ NOT NULL,
  entry_kind           TEXT NOT NULL,
  -- SOLO las dimensiones efectivamente cambiadas. Nunca se arrastran las demás.
  changed_dimensions   TEXT[] NOT NULL DEFAULT '{}',
  before_values        JSONB,
  current_values       JSONB,
  -- Distingue "no cambió" (confirmado) de "todavía no llegó" (pendiente).
  explicit_no_change   BOOLEAN NOT NULL DEFAULT FALSE,
  no_change_reason     TEXT,
  causal_evidence_id   UUID REFERENCES evidence(id) ON DELETE SET NULL,
  -- `I8` para el progreso (Etapa B3.1): un reintento de red no puede duplicar el
  -- avance de un estudiante. Índice único PARCIAL — una entrada sin clave sigue
  -- siendo válida.
  idempotency_key      TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Capa de examen — migrada en la Fase B5 (1 de septiembre de 2026).
--
-- Lo que sigue es el schema **real**, con las tres correcciones que el owner
-- cerró antes de escribir la primera migración. Las tres estaban anotadas acá
-- como brechas abiertas, y ninguna era de copy:
--
--   · ADR-028 — la completion de un paso es un hecho: se cayó el `UNIQUE`.
--   · ADR-029 — la pauta de la cátedra tiene entidad propia, con Provenance.
--   · ADR-030 — el contenido se carga rotulado, y `is_required` pasó a ternario.
--
-- Y ADR-011, que ya estaba decidida: readiness vive en `preparation_readiness`
-- y `exam_preparation.status` perdió sus tres estados.
-- ─────────────────────────────────────────────────────────────────────────────

-- ExamProtocol como CONFIGURACIÓN VERSIONADA (ADR-007). Nunca hardcodeado.
CREATE TABLE exam_protocol (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL ⇒ aplica a cualquier modalidad. El núcleo de 24 h no distingue
  -- práctico de teórico en la fuente, y forzarle una modalidad sería inventar.
  modality TEXT CHECK (modality IN ('practico','teorico_escrito')),
  -- `NUCLEO_H24` es una versión aparte, no un paso del protocolo completo:
  -- `HUMAN-P0-04 v1.0` le da siete componentes con su propio criterio de cierre.
  alcance  TEXT NOT NULL DEFAULT 'COMPLETO'
             CHECK (alcance IN ('COMPLETO','NUCLEO_H24')),
  version  TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT protocolo_completo_tiene_modalidad
    CHECK (alcance <> 'COMPLETO' OR modality IS NOT NULL),
  UNIQUE NULLS NOT DISTINCT (modality, alcance, version)
);
-- Dos vigentes para la misma modalidad y alcance serían dos protocolos
-- corriendo a la vez sobre el mismo estudiante.
CREATE UNIQUE INDEX exam_protocol_una_vigente
  ON exam_protocol (COALESCE(modality, ''), alcance) WHERE is_current;

CREATE TABLE protocol_step (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_protocol_id   UUID NOT NULL REFERENCES exam_protocol(id) ON DELETE CASCADE,
  canonical_id       TEXT NOT NULL,       -- p.ej. 'EP-06', 'H24-3'
  -- Ordena la LISTA. **No deriva "el siguiente paso"**: `HUMAN-P0-01 v1.0` dice
  -- que en el tramo reentrante el orden es variable, modificable y transversal.
  sequence           INTEGER NOT NULL,
  step_type          TEXT NOT NULL,
  label              TEXT NOT NULL,
  objective          TEXT,
  explanation        TEXT,
  expected_artifact  TEXT,
  criterion          TEXT,
  -- Era `is_required BOOLEAN NOT NULL DEFAULT TRUE`, que **afirma** que los 20
  -- pasos son obligatorios — y `C01-031` es exactamente esa pregunta, abierta.
  -- Ternario, con el patrón de ADR-026: la ausencia tiene su propio valor.
  requirement        TEXT NOT NULL DEFAULT 'NO_CONFIGURADA'
                       CHECK (requirement IN ('NO_CONFIGURADA','OPCIONAL','OBLIGATORIO')),
  -- `HUMAN-P0-01 v1.0`, literal: los pasos 9 a 18 se repiten. Es un dato del
  -- paso, no un comentario: la reentrancia se consulta, no se recuerda.
  is_reentrant       BOOLEAN NOT NULL DEFAULT FALSE,
  -- Procedencia del contenido pedagógico. `EP-SPEC`/`v0.1` = asunción del
  -- equipo; `HUMAN-P0-0X`/`v1.0` = criterio profesional confirmado (ADR-030).
  provisional_default_id TEXT,
  provisional_version    TEXT,
  UNIQUE (exam_protocol_id, canonical_id),
  UNIQUE (exam_protocol_id, sequence)
);

-- La pauta de la cátedra — ADR-029. `HUMAN-P0-07 v1.0` la vuelve la referencia
-- determinante de la corrección, y el ADL no tenía dónde guardarla.
--
-- Lleva Provenance completa **y por eso se puede guardar sin mentir**: cargada
-- por el estudiante entra `student`/`unverified` y la superficie la muestra como
-- lo que el estudiante cargó. Sólo `institution`/`instructor` la presenta como
-- criterio de cátedra. `I9` no se toca.
CREATE TABLE assessment_criterion (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  assessment_id  UUID NOT NULL REFERENCES assessment(id) ON DELETE CASCADE,
  criterion_text TEXT NOT NULL,
  sequence       INTEGER,
  -- `C01-037`, abierto. Un NULL **no se lee como "pesa poco"**.
  weight         NUMERIC(4,3) CHECK (weight IS NULL OR weight BETWEEN 0 AND 1),
  source_type    TEXT NOT NULL,
  source_ref     TEXT,
  observed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  rights_status  TEXT NOT NULL DEFAULT 'unknown',
  uploaded_by    UUID
);

CREATE TABLE exam_preparation (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id       UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  assessment_id        UUID NOT NULL REFERENCES assessment(id) ON DELETE CASCADE,
  student_id           UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  course_enrollment_id UUID NOT NULL REFERENCES course_enrollment(id) ON DELETE CASCADE,
  exam_protocol_id     UUID REFERENCES exam_protocol(id) ON DELETE SET NULL,
  -- **Sin los tres estados de readiness** (ADR-011): eran la segunda verdad.
  status               TEXT NOT NULL DEFAULT 'RECOMMENDED'
                         CHECK (status IN ('RECOMMENDED','ACTIVE','BLOCKED',
                                           'EXAM_TAKEN','CLOSED','ABANDONED')),
  -- "Dónde está ahora", **nunca** "hasta dónde llegó". Con el tramo reentrante
  -- la segunda lectura es directamente falsa. Hoy **nadie lo escribe**, y por
  -- eso las superficies dicen "todavía no hay un paso para abrir".
  current_step_id      UUID REFERENCES protocol_step(id) ON DELETE SET NULL,
  -- En la migración real entra por `ALTER`: las dos tablas se referencian.
  readiness_id         UUID REFERENCES preparation_readiness(id) ON DELETE SET NULL,
  activated_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- `I7`. Hasta la Fase B5 el invariante no tenía dónde probarse.
  UNIQUE (student_id, assessment_id)
);

ALTER TABLE action
  ADD CONSTRAINT action_exam_preparation_fk
  FOREIGN KEY (exam_preparation_id) REFERENCES exam_preparation(id) ON DELETE SET NULL;

-- ✅ Completion como HECHO — ADR-028.
--
-- Acá estaba `UNIQUE (exam_preparation_id, protocol_step_id)`, que decía "un
-- paso se completa una vez y no vuelve". `HUMAN-P0-01 v1.0` dice lo contrario, y
-- `product.md` §5.6 ya decía desde el principio que la completion es *"un hecho
-- factual"* y no un enum de estado: **el `UNIQUE` era lo único que sostenía la
-- lectura de estado**.
--
-- El tema es parte del hecho. La fuente no dice "varias veces": dice "varias
-- veces sobre un mismo tema".
CREATE TABLE protocol_step_completion (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  exam_preparation_id UUID NOT NULL REFERENCES exam_preparation(id) ON DELETE CASCADE,
  protocol_step_id    UUID NOT NULL REFERENCES protocol_step(id) ON DELETE CASCADE,
  -- NULL ⇒ no se trabajó sobre un tema en particular. **No es "todos"**.
  topic_id            UUID REFERENCES topic(id) ON DELETE SET NULL,
  -- 1, 2, 3… por (preparación, paso, tema). Lo asigna el escritor transaccional:
  -- contarlo en el cliente es una condición de carrera.
  occurrence          INTEGER NOT NULL CHECK (occurrence >= 1),
  completed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_by        UUID NOT NULL,
  idempotency_key     TEXT,
  UNIQUE NULLS NOT DISTINCT (exam_preparation_id, protocol_step_id, topic_id, occurrence)
);
CREATE UNIQUE INDEX protocol_step_completion_idempotencia
  ON protocol_step_completion (exam_preparation_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE protocol_artifact (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id   UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  protocol_step_id UUID NOT NULL REFERENCES protocol_step(id) ON DELETE CASCADE,
  exam_preparation_id UUID NOT NULL REFERENCES exam_preparation(id) ON DELETE CASCADE,
  artifact_type    TEXT NOT NULL,
  evidence_id      UUID REFERENCES evidence(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PreparationReadiness — la fuente canónica (ADR-011).
--
-- Con su explicación, sus señales y la versión de la regla que lo calculó. Un
-- estado sin explicación es un veredicto, y este producto no emite veredictos
-- sobre personas: `explanation` y `rule_version` son NOT NULL.
--
-- ⚠️ **Nadie la escribe todavía.** Los umbrales son `C01-029`, abierto.
CREATE TABLE preparation_readiness (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  exam_preparation_id UUID NOT NULL REFERENCES exam_preparation(id) ON DELETE CASCADE,
  state               TEXT NOT NULL
                        CHECK (state IN ('NOT_READY','BUILDING','READY_BY_PROTOCOL')),
  required_steps      JSONB NOT NULL DEFAULT '[]',
  evidence_status     TEXT,
  autonomous_practice BOOLEAN,
  simulation          BOOLEAN,
  critical_gaps       JSONB NOT NULL DEFAULT '[]',
  explanation         TEXT NOT NULL,
  rule_version        TEXT NOT NULL,
  calculated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  overridden_by       UUID,
  override_reason     TEXT,
  overridden_at       TIMESTAMPTZ,
  CONSTRAINT override_completo_o_ausente
    CHECK ((overridden_by IS NULL AND override_reason IS NULL AND overridden_at IS NULL)
        OR (overridden_by IS NOT NULL AND override_reason IS NOT NULL AND overridden_at IS NOT NULL))
);

CREATE TABLE risk_signal (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id       UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id           UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  course_enrollment_id UUID REFERENCES course_enrollment(id) ON DELETE CASCADE,
  signal_type          TEXT NOT NULL,
  severity             TEXT NOT NULL CHECK (severity IN ('bajo','atencion','riesgo','intervencion')),
  -- Explicabilidad obligatoria: nunca un score opaco como única salida.
  reason               TEXT NOT NULL,
  source_ref           TEXT,
  status               TEXT NOT NULL DEFAULT 'OPEN'
                         CHECK (status IN ('OPEN','ACKNOWLEDGED','INTERVENTION_REQUIRED',
                                           'RESOLVED','ESCALATED','EXPIRED')),
  valid_until          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE playbook (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger  TEXT NOT NULL,
  objective TEXT NOT NULL,
  version  TEXT NOT NULL,
  steps    JSONB NOT NULL DEFAULT '[]',
  escalation TEXT
);

CREATE TABLE intervention (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  risk_signal_id UUID REFERENCES risk_signal(id) ON DELETE SET NULL,
  student_id     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  owner_operator_id UUID NOT NULL,
  playbook_id    UUID REFERENCES playbook(id) ON DELETE SET NULL,
  sla_at         TIMESTAMPTZ,
  status         TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','acknowledged','closed')),
  human_minutes  INTEGER,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE intervention_outcome (
  intervention_id UUID PRIMARY KEY REFERENCES intervention(id) ON DELETE CASCADE,
  outcome         TEXT NOT NULL CHECK (outcome IN
                    ('recuperado','replanificado','sin_respuesta','escalado','falso_positivo')),
  note            TEXT,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product Event Model. Append-only.
--
-- ⚠️ `event_name` NO lleva enum, y el catálogo no vive en el schema: está en
-- `lib/domain/product-events.ts`, transcripto de `product-spec-source.md` §16
-- (23 eventos P0) más las extensiones que el backend emite y §16 no lista. Un
-- CHECK acá cerraría C01-023 desde la base, y además pelearía con el append-only:
-- una fila vieja con un nombre retirado dejaría de poder escribirse de nuevo.
CREATE TABLE product_event (
  id             BIGSERIAL PRIMARY KEY,
  event_name     TEXT NOT NULL,
  institution_id UUID NOT NULL,
  actor_id       UUID,
  subject_type   TEXT NOT NULL,
  subject_id     UUID NOT NULL,
  cause_ref      TEXT,
  payload        JSONB NOT NULL DEFAULT '{}',
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX product_event_subject_idx ON product_event (subject_type, subject_id, occurred_at DESC);

-- Auditoría de accesos y cambios críticos (R3).
CREATE TABLE audit_log (
  id             BIGSERIAL PRIMARY KEY,
  institution_id UUID NOT NULL,
  actor_id       UUID,
  action         TEXT NOT NULL,
  target_type    TEXT NOT NULL,
  target_id      UUID,
  before_value   JSONB,
  after_value    JSONB,
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 10.1 Las funciones de base, y qué decide cada una

Actualizado el 1 de septiembre de 2026. **Ninguna implementa una regla de negocio**: componen una
lectura consistente o escriben una transacción que no puede quedar a medias. Las reglas viven en los
Services (§3.2 de [`architecture.md`](architecture.md)).

| Función | Qué hace | Por qué es una función y no varias consultas |
|---|---|---|
| `estado_del_dia` · `estado_de_materia` · `estado_de_accion` · `estado_de_compromiso` · `estado_de_evidencia` · `estado_de_progreso` · `estado_de_activacion` · `estado_de_preparacion` · `estado_de_paso` | Una lectura por superficie. **Las nueve del estudiante, desde la Fase B5** | Varias lecturas por pantalla dan una foto **inconsistente entre sí** |
| `hechos_de_cursada` | El historial de una cursada | **La única fuente histórica.** `UX02` pide 3 entradas y `UX06` todas; `VI.6` §8.3 prohíbe una segunda |
| `registrar_progreso` | Escribe `progress_entry` + `topic_progress` + sus valores | Media escritura deja la Bitácora afirmando un cambio que las dimensiones no reflejan |
| `materializar_recomendacion` | Crea la `Action` y su `ActionRecommendation` primaria | Nacen juntas o no nacen: media recomendación es peor que ninguna |
| `ingerir_materia` | Carga una materia entera del ADL con su procedencia | Un programa a medias no es un programa |
| `completar_paso_de_protocolo` | Agrega una vuelta al paso, con su ordinal | **El número de vuelta se asigna dentro de la transacción**: contarlo en el cliente da dos vueltas número 3 con dos pestañas abiertas |
| `protocolo_vigente` | El protocolo de una evaluación, por modalidad | Una igualdad, no un fallback: sin protocolo para la modalidad devuelve **cero filas**, y eso es la respuesta (`C01-047`) |

**Ninguna es un trigger.** §11 lo dice y hay guard: el único trigger del schema es el de
`updated_at`. Una regla de negocio en un trigger es invisible desde el código de aplicación.

---

## 11. Invariantes que el sistema debe garantizar

Estos invariantes combinan Services, Repositories y constraints. **No se implementan reglas de negocio
con triggers o PL/pgSQL.** Cuando una regla depende del estado actual, el Service la valida y el
Repository usa una transacción o predicate atómico para evitar carreras. Cada invariante tiene test.

> **Dónde se audita — 1 de septiembre de 2026.** `tests/invariantes.test.ts` mantiene la tabla de qué
> prueba cada invariante y **se compara contra esta sección**: si acá aparece un `I13` y nadie lo
> prueba, ese test rompe. **Desde la Fase B5 los doce tienen test.** `I7` era el único pendiente, y lo
> era porque `exam_preparation` no estaba migrada; el guard rompió el día que la migración entró, que
> es exactamente para lo que estaba escrito.

| # | Invariante | Implementación |
|---|---|---|
| I1 | Un `Commitment` `MISSED` nunca transiciona a `COMPLETED`, `CONFIRMED` ni `RENEGOTIATED` | Tabla `commitmentTransitions` en Service + `UPDATE` condicionado por estado actual en Repository |
| I2 | Renegociar **crea una fila nueva**; el original queda `RENEGOTIATED` con la nueva apuntando por `renegotiated_from_id` | Transacción en la capa de servicio |
| I3 | `rescues_commitment_id` solo apunta a un Commitment en estado `MISSED` | Validación en Service + lectura/bloqueo y escritura en una transacción de Repository |
| I4 | Una Evidence nueva por resubmission **preserva** la anterior; ninguna se borra ni se sobrescribe | `supersedes_id` + prohibición de `DELETE` |
| I5 | `UNDER_REVIEW` exige `review_instance_id NOT NULL` | `CHECK` constraint (ya declarado) |
| I6 | Exactamente **una** `ActionRecommendation` primaria por contexto | Regla de Service/contrato pendiente de una identidad canónica de contexto o lote; el índice único parcial solo garantiza **como máximo una por `action_id`** |
| I7 | Una sola `ExamPreparation` por (`student_id`, `assessment_id`) | `UNIQUE` |
| I8 | Las mutaciones idempotentes no crean duplicados ante reintento | `UNIQUE (idempotency_key)` + `ON CONFLICT` |
| I9 | Ninguna capa eleva un `verification_status` | Operación explícita del owner en Service + autorización y auditoría; Repository no expone un update genérico del campo |
| I10 | Un `ProgressUpdated` con `changed_dimensions` vacío y `explicit_no_change = FALSE` es inválido | `CHECK` |
| I11 | Ningún dato de un `institution_id` es visible desde otro | Scoping obligatorio en Service/Repository + tests de aislamiento; RLS deny-by-default como defensa en profundidad ([ADR-005](decisions.md#adr-005)) |
| I12 | `product_event` y `audit_log` son append-only | Revocar `UPDATE`/`DELETE` |

---

## 12. Lo que NO está en el schema, y por qué

| Ausencia | Razón |
|---|---|
| Tabla `today_view` | `TodayView` es una **proyección efímera** sin identidad persistida (Parte VI §11.1) |
| ~~Tabla `preparation_readiness`~~ | ✅ **Existe desde la Fase B5.** [ADR-011](decisions.md#adr-011) la declaró fuente canónica. **Nadie la escribe todavía:** los umbrales son `C01-029` |
| Columna `overall_progress` / `percentage` | No existe porcentaje universal de materia aprendida |
| Columna `risk_score` numérico visible | La explicabilidad es obligatoria; un score opaco no es salida válida |
| Entidad `Review` productiva | El spec usa `review_instance_ref`; no inventa una entidad `Review` |
| Entidad `RecommendationFeedback` | No aprobada; queda como contrato pendiente |
| Tabla `Activity` / `TimelineItem` | La Bitácora es composición de lectura sobre objetos existentes. **Desde la B2.6 esa composición es concreta:** `estado_de_progreso()` la arma desde `product_event`, que es el único registro de hechos con instante propio, actor y causa —y append-only (`I12`)—. Reconstruirla desde las columnas de estado no alcanza: `evidence` no tiene `validated_at`, así que *"la validaron"* no tendría fecha |
| Estados `RESCUE_REQUIRED` / `RESCUE_MATERIALIZED` | Son **condiciones derivadas**, no estados persistidos |
| Enum de estado por `ProtocolStep` | El spec no lo congela: solo hay un hecho de completion |
| Tabla `student_model` | `C01-043` sigue `OPEN`: mencionado, no especificado |
| ~~**Pauta o criterio de evaluación de la cátedra**~~ | ✅ **`assessment_criterion`, desde la Fase B5** ([ADR-029](decisions.md#adr-029)). Con Provenance completa: cargada por el estudiante entra `student`/`unverified` y **no se eleva** (`I9`). Sigue abierto `C01-037`: qué pasa cuando la pauta contradice las familias generales |
| ~~**Repetición de un `ProtocolStep`**~~ | ✅ **Resuelta por [ADR-028](decisions.md#adr-028):** se cayó el `UNIQUE`, cada vuelta es una fila con su `occurrence` y su `topic_id`. La garantía vieja no se perdió, se volvió configurable: `protocol_step.is_reentrant` |
| **El contenido de los 20 pasos `PE-PSY`** | `HUMAN-P0-01 v1.0` confirma la **secuencia**; el **texto de cada paso nunca se transcribió al repositorio**. Hasta que esté, corre `EP-SPEC v0.1` —los 12 del spec— rotulado como provisional en sus propias columnas ([ADR-030](decisions.md#adr-030)) |

---

## 13. Convivencia Track A / Track B

En el Track A estos tipos viven en `lib/domain/` como TypeScript puro y los escenarios en
`lib/fixtures/`. **Los tipos son los mismos.** Track B ya implementa el backend y `UX01` puede
proyectar datos persistidos sin tocar `components/screens/`. Los fixtures no se eliminaron: siguen
siendo el catálogo del focus group y de estados críticos mientras `UX02`–`UX06` se conectan con el
mismo patrón. `UX07`–`UX09` no se conectan hasta la Fase B5: proyectan `ExamPreparation` y
`ExamProtocol`, que todavía no existen como tablas.

```ts
// lib/domain/types.ts — compartido entre Track A y Track B
export interface Action {
  id: string;
  courseEnrollmentId: string;
  topicId: string | null;
  examPreparationId: string | null;
  objective: string;
  verb: string;
  scope: string;
  estimatedMinutes: { min: number; max: number } | null;   // null ⇒ omitir la línea
  expectedEvidence: string | null;
  completionCriterion: string | null;
  status: ActionStatus;
}
```

> **Regla del Track A:** un fixture puede omitir cualquier campo marcado como
> `SOURCE CONTRACT PENDING`, y la pantalla debe renderizar correctamente esa ausencia. Los escenarios
> de "contrato incompleto" son parte del catálogo de fixtures, no un caso de error.
