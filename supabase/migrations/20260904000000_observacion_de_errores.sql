-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.5 — el error, como hecho registrado
--
-- ⚠️ **PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION.** Todo lo que esta
-- migración carga como configuración es una **decisión provisional del Product
-- Owner** para poder demostrar el MVP con datos sintéticos
-- ([ADR-036](../../docs/decisions.md#adr-036)). **No tiene validación clínica,
-- pedagógica ni psicopedagógica**, y no se le atribuye a la psicopedagoga.
--
-- ## Por qué hace falta esta tabla antes que la regla
--
-- `C01-036` define un error reiterativo como *"la misma clase de error, al menos
-- dos veces"*. Para contar eso hace falta que **el error sea un hecho
-- registrado**, y en el repositorio no existía nada: ni tabla, ni `error_type`,
-- ni el `WF-S12 Mapa de Errores` del spec.
--
-- Sin esto, cualquier regla tendría que **inferir** el error desde el texto de
-- una evidencia. La decisión del PO lo prohíbe explícitamente: *"un error
-- meramente inferido, ambiguo o no corroborado no incrementa el contador"*.
--
-- ## Las dos cosas que se registran, y por qué van juntas
--
-- Un **error** y una **resolución limpia** son observaciones sobre el mismo
-- `error_type` dentro de la misma preparación, y la regla las lee **en orden**:
-- una resolución correcta, independiente y sin ayuda **reinicia el contador**.
-- Separarlas en dos tablas obligaría a reconstruir esa línea de tiempo con un
-- `UNION`, que es la forma más fácil de que las dos mitades se desincronicen.
--
-- ⚠️ ADR-006 sigue `PROVISIONAL`: sólo datos sintéticos.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── El catálogo de tipos de error · configuración versionada ─────────────────
--
-- Mismo patrón que `risk_rule` y `exam_protocol`: **el vocabulario es
-- configuración, nunca código**. Cambiarlo es cargar una versión, no migrar — y
-- eso es exactamente lo que pide la naturaleza provisional de estas decisiones:
-- si la psicopedagoga después define otra taxonomía, entra como versión nueva y
-- **las observaciones históricas conservan la suya**.
--
-- Los seis tipos son los que el PO listó como ilustrativos. El dominio no tenía
-- otro vocabulario que respetar: se verificó que no existiera ninguno.
CREATE TABLE error_type (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id TEXT NOT NULL,
  version      TEXT NOT NULL,
  label        TEXT NOT NULL,
  description  TEXT,
  is_current   BOOLEAN NOT NULL DEFAULT FALSE,
  -- Quién fijó este vocabulario. NO es la psicopedagoga.
  provisional_default_id TEXT,
  provisional_version    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (canonical_id, version)
);

CREATE UNIQUE INDEX error_type_uno_vigente ON error_type (canonical_id) WHERE is_current;

COMMENT ON TABLE error_type IS
  'Configuración versionada. PROVISIONAL del Product Owner (ADR-036): sin validación psicopedagógica.';

-- ── La observación ───────────────────────────────────────────────────────────
--
-- **La identidad del error es el tipo, no el tema.** El PO lo dijo textual: el
-- tema *"es contexto explicativo"*, y dos errores del mismo tipo cuentan aunque
-- ocurran en ejercicios distintos. Por eso `topic_id` es nullable y **no entra
-- en la clave del contador**.
--
-- `corroborated` es la traducción del punto 6: un error inferido o ambiguo
-- **no incrementa el contador**. No es un default optimista: nace en `FALSE`, y
-- sólo lo pone en `TRUE` quien puede afirmarlo.
--
-- `after_action_id` es la traducción de *"una nueva aparición después de una
-- acción correctiva fallida"*. **Es un hecho, no una inferencia**: lo declara
-- quien registra la observación, diciendo contra qué acción correctiva ocurrió.
-- Deducirlo por proximidad temporal sería adivinar.
CREATE TABLE error_observation (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id          UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  -- El alcance del contador: **la preparación del mismo examen** (punto 4).
  exam_preparation_id UUID NOT NULL REFERENCES exam_preparation(id) ON DELETE CASCADE,
  error_type_id       UUID NOT NULL REFERENCES error_type(id) ON DELETE RESTRICT,

  kind                TEXT NOT NULL CHECK (kind IN ('error','resolucion_limpia')),

  -- De qué entrega salió. La función de escritura exige que esté **juzgada**.
  evidence_id         UUID REFERENCES evidence(id) ON DELETE SET NULL,
  -- Contexto explicativo. **No es la identidad del error.**
  topic_id            UUID REFERENCES topic(id) ON DELETE SET NULL,
  -- Contra qué acción correctiva ocurrió, si ocurrió después de una.
  after_action_id     UUID REFERENCES action(id) ON DELETE SET NULL,

  corroborated        BOOLEAN NOT NULL DEFAULT FALSE,
  note                TEXT,
  observed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by         UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Reprocesar la misma evidencia no registra el hecho dos veces.
  idempotency_key     TEXT,

  -- Una resolución limpia es, por definición, *"correcta, independiente y sin
  -- ayuda"*: no puede venir marcada como ocurrida tras una acción correctiva
  -- fallida, porque eso sería un error, no una resolución.
  CONSTRAINT resolucion_no_es_reincidencia
    CHECK (kind <> 'resolucion_limpia' OR after_action_id IS NULL)
);

CREATE UNIQUE INDEX error_observation_idempotencia
  ON error_observation (institution_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- El índice del contador: la regla lee **una preparación y un tipo, en orden**.
CREATE INDEX error_observation_contador
  ON error_observation (exam_preparation_id, error_type_id, observed_at);
CREATE INDEX error_observation_por_estudiante
  ON error_observation (student_id, observed_at DESC);
CREATE INDEX error_observation_por_evidencia ON error_observation (evidence_id);
CREATE INDEX error_observation_por_accion    ON error_observation (after_action_id);

COMMENT ON TABLE error_observation IS
  'Hechos, no inferencias. El contador de C01-036 sólo cuenta las corroboradas (ADR-036).';
COMMENT ON COLUMN error_observation.topic_id IS
  'Contexto explicativo. La identidad del error es error_type_id: el mismo tipo cuenta en temas distintos.';
COMMENT ON COLUMN error_observation.after_action_id IS
  'Declarado por quien registra, nunca inferido por proximidad temporal.';

-- ── RLS · deny-by-default, como todo lo demás ────────────────────────────────
ALTER TABLE error_type        ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_observation ENABLE ROW LEVEL SECURITY;

-- ── El vocabulario provisional ───────────────────────────────────────────────
--
-- ⚠️ Los seis los listó el **Product Owner** como ilustrativos, y entran como
-- `v1.0-po-provisional` **a propósito**: el nombre de la versión dice de quién
-- son. Si la psicopedagoga define otra taxonomía, entra como versión nueva y
-- estas filas quedan apagadas, no borradas.
INSERT INTO error_type (canonical_id, version, label, description, is_current,
                        provisional_default_id, provisional_version) VALUES
  ('conceptual',   'v1.0-po-provisional', 'Error conceptual',
   'No comprende el concepto que la consigna requiere aplicar.', TRUE, 'PO-MVP', 'v1.0-provisional'),
  ('procedimiento','v1.0-po-provisional', 'Error de procedimiento',
   'Comprende el concepto y falla en la ejecución del procedimiento.', TRUE, 'PO-MVP', 'v1.0-provisional'),
  ('consigna',     'v1.0-po-provisional', 'Error de interpretación de consigna',
   'Resuelve correctamente algo distinto de lo que se pedía.', TRUE, 'PO-MVP', 'v1.0-provisional'),
  ('calculo',      'v1.0-po-provisional', 'Error de cálculo',
   'El método es correcto y la aritmética o el álgebra no.', TRUE, 'PO-MVP', 'v1.0-provisional'),
  ('omision',      'v1.0-po-provisional', 'Omisión de paso obligatorio',
   'Saltea un paso que la resolución exige.', TRUE, 'PO-MVP', 'v1.0-provisional'),
  ('dependencia',  'v1.0-po-provisional', 'Dependencia de ayuda externa',
   'Sólo resuelve con asistencia; no sostiene la resolución solo.', TRUE, 'PO-MVP', 'v1.0-provisional');
