-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B2.6 — `ProgressEntry`, la tabla que `UX06` necesita
--
-- ## Por qué se crea acá y no en la Fase B3
--
-- La `B2.6` prometió **cinco superficies** (`UX02`–`UX06`) y `UX06` no proyecta
-- nada que se pueda derivar de `evidence` o de `topic_progress`: proyecta un
-- **resultado autoritativo de progreso**, que es exactamente lo que esta tabla
-- registra. Sin ella, la pantalla sólo puede decir *"todavía no hay un cambio
-- confirmado"*, para siempre y para todo el mundo.
--
-- Esto **no adelanta la Fase B3**. La B3 es el `ProgressUpdated` completo:
-- quién lo emite, con qué causalidad y con qué payload (`C01-018`), qué
-- magnitudes son mostrables (`C01-019`) y cómo se compone la Bitácora completa
-- (`C01-020`). Acá se crea **la estructura que `data-model.md` §10 ya declaró**,
-- palabra por palabra, con su invariante `I10`. Ninguna decisión abierta se
-- cierra: no hay Service que escriba estas filas, no hay vocabulario cerrado de
-- `entry_kind`, y la proyección se niega a mostrar magnitudes.
--
-- ## Lo que esta tabla NO decide
--
-- **`entry_kind` no lleva `CHECK`.** Cerrar el vocabulario de tipos de entrada
-- es `C01-018`, `OPEN`, gate `I`. Un enum acá lo cerraría desde el schema, que
-- es precisamente lo que el anexo de decisiones existe para impedir. Lo único
-- que se exige es que no venga vacío: un hecho sin nombre no es un hecho.
--
-- **`before_values` y `current_values` son `JSONB` sin forma declarada.** Qué
-- magnitud es legítimo mostrarle al estudiante es `C01-019`, gate `H`. La
-- proyección sólo muestra lo que el owner haya escrito ya como texto, y nunca
-- un número crudo — la misma regla con la que `estado_de_materia` se niega a
-- devolver `topic_progress.*_value`.
-- ─────────────────────────────────────────────────────────────────────────────

-- Transcripción de `data-model.md` §10. Bundle derivado, materialización
-- OPCIONAL para la Bitácora: nada del loop diario depende de que exista una fila.
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
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE progress_entry IS
  'Resultado autoritativo de progreso. Una dimensión sólo se presenta como cambiada si aparece en changed_dimensions de una fila real: VALIDATED no produce progreso por sí solo.';

COMMENT ON COLUMN progress_entry.entry_kind IS
  'Sin CHECK a propósito: el vocabulario de tipos de entrada es C01-018, OPEN.';

-- ── I10, el invariante que da sentido a la tabla ─────────────────────────────
--
-- Una entrada que no declara ninguna dimensión cambiada Y tampoco afirma que no
-- hubo cambio **no dice nada**, y lo peor es cómo se lee: la pantalla la
-- encontraría y mostraría "sin cambio confirmado", que es una afirmación que
-- nadie hizo. Un no-cambio es una declaración del owner, no la ausencia de una.
ALTER TABLE progress_entry
  ADD CONSTRAINT progress_entry_dice_algo CHECK (
    cardinality(changed_dimensions) > 0 OR explicit_no_change),
  -- Y no puede decir las dos cosas: "cambiaron estas dimensiones" y "no cambió
  -- nada" es una fila que la UI no puede proyectar sin elegir por su cuenta.
  ADD CONSTRAINT progress_entry_no_se_contradice CHECK (
    NOT (cardinality(changed_dimensions) > 0 AND explicit_no_change)),
  -- Las cinco dimensiones son decisión congelada, y son las mismas columnas que
  -- `topic_progress` ya tiene. Una dimensión inventada rompe acá y no en la UI.
  ADD CONSTRAINT progress_entry_dimensiones_conocidas CHECK (
    changed_dimensions <@ ARRAY['exposure','practice','domain','confidence','recency']),
  ADD CONSTRAINT progress_entry_kind_no_vacio CHECK (length(btrim(entry_kind)) > 0),
  -- Una razón de no-cambio sin no-cambio declarado es una explicación de algo
  -- que no ocurrió. `no_change_reason` sigue pudiendo ser NULL: §7.1 dice que la
  -- razón se muestra "sólo si existe", así que exigirla inventaría una.
  ADD CONSTRAINT progress_entry_razon_solo_con_no_cambio CHECK (
    no_change_reason IS NULL OR explicit_no_change);

ALTER TABLE progress_entry ENABLE ROW LEVEL SECURITY;

-- El GRANT se declara en vez de confiarlo a los privilegios por defecto, por el
-- mismo motivo que `20260830030000_grants.sql`: un default que cambia sin que
-- nadie lo note deja al backend sin leer, o al cliente leyendo de más.
GRANT SELECT, INSERT, UPDATE, DELETE ON progress_entry TO service_role;

CREATE INDEX progress_entry_institution_idx ON progress_entry (institution_id);
CREATE INDEX progress_entry_enrollment_idx  ON progress_entry (course_enrollment_id, occurred_at DESC);
CREATE INDEX progress_entry_topic_idx       ON progress_entry (topic_id);
CREATE INDEX progress_entry_action_idx      ON progress_entry (action_id);
CREATE INDEX progress_entry_evidence_idx    ON progress_entry (evidence_id);
CREATE INDEX progress_entry_causal_idx      ON progress_entry (causal_evidence_id);
