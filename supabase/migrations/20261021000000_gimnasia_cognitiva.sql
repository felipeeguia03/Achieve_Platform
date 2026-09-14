-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Gimnasia cognitiva, categoría Memoria
--
-- [ADR-102](../../docs/decisions.md#adr-102), pedido por el owner el 13 de
-- septiembre de 2026. Plan en `docs/gimnasia-cognitiva.md`.
--
-- ## Cuatro tablas, y ninguna guarda "el progreso"
--
-- El progreso **se deduce** de los intentos y los repasos: mejor puntuación,
-- nivel actual, próximo repaso. Una tabla de progreso sería una segunda fuente
-- que dice lo mismo que los hechos y que tarde o temprano dice otra cosa — la
-- misma regla que *"no existe una segunda fuente histórica"* de la Bitácora.
--
-- ## Lo que estas tablas NO son, y cada ausencia es la decisión
--
-- ⛔ **Sin `cognitive_score`.** Puntuación, nivel, repasos y constancia son
-- magnitudes distintas y tienen columnas distintas. Ninguna mide inteligencia.
-- ⛔ **No tocan `action`, `commitment`, `evidence` ni `topic_progress`.** Jugar no
-- es estudiar una materia, ni entregar, ni avanzar una unidad (AGENTS.md §2.1).
-- ⛔ **Sin cada pulsación.** Se guardan las respuestas por ronda —lo que el
-- servidor necesita para rehacer la corrección—, no un registro de clics.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── La sesión ────────────────────────────────────────────────────────────────

CREATE TABLE gym_session (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,

  -- La rutina de tres ejercicios, o un juego suelto desde su tarjeta.
  origin        TEXT NOT NULL CHECK (origin IN ('ROUTINE','SINGLE_GAME')),
  -- Los previstos, fijados **al empezar**: si mañana hay preguntas y hoy no, la
  -- rutina de hoy no cambia a mitad de camino.
  planned_games TEXT[] NOT NULL,

  -- ⚠️ Sin `CREATED`: crear la sesión es empezarla (ADR-102 §10).
  status     TEXT NOT NULL DEFAULT 'IN_PROGRESS'
               CHECK (status IN ('IN_PROGRESS','COMPLETED','CANCELLED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at   TIMESTAMPTZ,

  -- El doble toque y el reintento devuelven la misma sesión.
  idempotency_key TEXT NOT NULL CHECK (length(btrim(idempotency_key)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (student_id, idempotency_key),
  -- Para que el intento pueda exigir una sesión **del mismo estudiante**.
  CONSTRAINT gym_session_id_estudiante_unico UNIQUE (id, student_id),

  CONSTRAINT gym_session_juegos_validos CHECK (
    cardinality(planned_games) BETWEEN 1 AND 3
    AND planned_games <@ ARRAY['FLASH_GRID','REVERSE_CHAIN','REAL_RECALL']::TEXT[]
  ),
  CONSTRAINT gym_session_suelta_es_un_juego
    CHECK (origin <> 'SINGLE_GAME' OR cardinality(planned_games) = 1),
  -- Terminada o cancelada si y sólo si tiene fin.
  CONSTRAINT gym_session_cerrada_tiene_fin
    CHECK ((status = 'IN_PROGRESS') = (ended_at IS NULL)),
  CONSTRAINT gym_session_termina_despues_de_empezar
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);

COMMENT ON TABLE gym_session IS
  'Una sesión de Gimnasia cognitiva (ADR-102): la rutina o un juego suelto. No es tiempo de estudio '
  'académico, ni una Action, ni un Commitment.';

-- **Una sola sesión abierta por estudiante.** El Service lo chequea para
-- contestar bien; esto lo garantiza cuando dos pedidos llegan juntos.
CREATE UNIQUE INDEX gym_session_una_abierta
  ON gym_session (student_id) WHERE status = 'IN_PROGRESS';
CREATE INDEX gym_session_estudiante_idx
  ON gym_session (student_id, status, ended_at DESC);
CREATE INDEX gym_session_institution_idx ON gym_session (institution_id);

ALTER TABLE gym_session ENABLE ROW LEVEL SECURITY;

-- ── El intento de un juego ───────────────────────────────────────────────────

CREATE TABLE gym_attempt (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  gym_session_id UUID NOT NULL,

  game          TEXT NOT NULL CHECK (game IN ('FLASH_GRID','REVERSE_CHAIN','REAL_RECALL')),
  -- `CF-1`, `CI-1`, `RR-1`: con qué reglas se corrige este intento.
  rules_version TEXT NOT NULL CHECK (length(btrim(rules_version)) > 0),

  status       TEXT NOT NULL DEFAULT 'STARTED'
                 CHECK (status IN ('STARTED','COMPLETED','ABANDONED')),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- ── Lo que fija el servidor al empezar ──────────────────────────────────
  -- La semilla y el largo inicial de la cuadrícula y la cadena. **Los pone el
  -- servidor**: con ellos rehace la partida y corrige.
  seed         INTEGER CHECK (seed IS NULL OR seed >= 0),
  start_length SMALLINT CHECK (start_length IS NULL OR start_length BETWEEN 3 AND 16),
  -- Las preguntas de Recuerdo real, en orden. La cola completa (con las que
  -- vuelven) se deduce de esto y de los repasos.
  plan UUID[],

  idempotency_key TEXT NOT NULL CHECK (length(btrim(idempotency_key)) > 0),

  -- ── El resultado, calculado por el servidor (NULL hasta COMPLETED) ───────
  -- Las respuestas por ronda, para poder rehacer la corrección. No son clics.
  answers            JSONB,
  rounds             SMALLINT CHECK (rounds IS NULL OR rounds >= 0),
  correct_count      SMALLINT CHECK (correct_count IS NULL OR correct_count >= 0),
  error_count        SMALLINT CHECK (error_count IS NULL OR error_count >= 0),
  -- Cuadrícula: la secuencia más larga repetida bien. Cadena: la cadena más
  -- larga invertida bien. `0` es un cero real: jugó y no acertó.
  max_span           SMALLINT CHECK (max_span IS NULL OR max_span >= 0),
  max_attempted_span SMALLINT CHECK (max_attempted_span IS NULL OR max_attempted_span >= 0),
  score              INTEGER  CHECK (score IS NULL OR score >= 0),
  level_before       SMALLINT CHECK (level_before IS NULL OR level_before >= 1),
  level_after        SMALLINT CHECK (level_after IS NULL OR level_after >= 1),
  partial_count      SMALLINT CHECK (partial_count IS NULL OR partial_count >= 0),
  personal_best      BOOLEAN,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (gym_session_id, idempotency_key),
  CONSTRAINT gym_attempt_id_estudiante_unico UNIQUE (id, student_id),
  CONSTRAINT gym_attempt_de_una_sesion_propia
    FOREIGN KEY (gym_session_id, student_id)
    REFERENCES gym_session (id, student_id) ON DELETE CASCADE,

  CONSTRAINT gym_attempt_completo_tiene_fin
    CHECK ((status = 'COMPLETED') = (completed_at IS NOT NULL)),
  CONSTRAINT gym_attempt_termina_despues_de_empezar
    CHECK (completed_at IS NULL OR completed_at >= started_at),
  -- Cada juego lleva lo suyo, y **no lleva lo de otro**: una puntuación en la
  -- cadena o un nivel en la cuadrícula serían magnitudes mezcladas.
  CONSTRAINT gym_attempt_semilla_de_juego_con_rondas
    CHECK ((game = 'REAL_RECALL') = (seed IS NULL AND start_length IS NULL)),
  CONSTRAINT gym_attempt_plan_de_recuerdo
    CHECK ((game = 'REAL_RECALL') = (plan IS NOT NULL)),
  CONSTRAINT gym_attempt_puntuacion_solo_cuadricula
    CHECK (score IS NULL OR game = 'FLASH_GRID'),
  CONSTRAINT gym_attempt_nivel_solo_cadena
    CHECK ((level_before IS NULL AND level_after IS NULL) OR game = 'REVERSE_CHAIN'),
  CONSTRAINT gym_attempt_parciales_solo_recuerdo
    CHECK (partial_count IS NULL OR game = 'REAL_RECALL'),
  -- Completado exige su resultado.
  CONSTRAINT gym_attempt_completo_con_resultado CHECK (
    status <> 'COMPLETED' OR (
      correct_count IS NOT NULL AND error_count IS NOT NULL
      AND (game <> 'FLASH_GRID' OR (score IS NOT NULL AND max_span IS NOT NULL AND rounds IS NOT NULL))
      AND (game <> 'REVERSE_CHAIN' OR (level_after IS NOT NULL AND max_span IS NOT NULL))
      AND (game <> 'REAL_RECALL' OR partial_count IS NOT NULL)
    )
  )
);

COMMENT ON TABLE gym_attempt IS
  'Un intento de un juego de Gimnasia cognitiva (ADR-102). El resultado lo calcula el servidor con la '
  'semilla y las respuestas; el cliente no manda puntuaciones.';

-- Un intento abierto por sesión, y un completado por juego dentro de la sesión.
CREATE UNIQUE INDEX gym_attempt_uno_abierto
  ON gym_attempt (gym_session_id) WHERE status = 'STARTED';
CREATE UNIQUE INDEX gym_attempt_uno_completo_por_juego
  ON gym_attempt (gym_session_id, game) WHERE status = 'COMPLETED';
CREATE INDEX gym_attempt_estudiante_juego_idx
  ON gym_attempt (student_id, game, completed_at DESC) WHERE status = 'COMPLETED';
CREATE INDEX gym_attempt_institution_idx ON gym_attempt (institution_id);

ALTER TABLE gym_attempt ENABLE ROW LEVEL SECURITY;

-- ── Las preguntas de Recuerdo real ───────────────────────────────────────────
--
-- ⚠️ **Mismo patrón que `formative_content`** (ADR-087): `DRAFT` por defecto,
-- procedencia completa y `verification_status` que sólo mueve
-- `corroborar_procedencia()` (`I9`). Una pregunta nace sin mostrarse.
--
-- ⚠️ **Es de la materia, no de la cátedra** (ADR-060): cuelga de `course`.
-- `course_id NULL` es contenido general de Achieve, igual para todos.
--
-- ⚠️ **Ninguna columna supone una carrera.** Una definición de Derecho, una
-- fórmula y un paso de un algoritmo son la misma fila con otro texto.

CREATE TABLE recall_item (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Clave natural: recargar la fuente no duplica ni rompe los repasos.
  code      TEXT NOT NULL UNIQUE,
  course_id UUID REFERENCES course(id) ON DELETE CASCADE,
  topic_id  UUID REFERENCES topic(id) ON DELETE SET NULL,

  prompt      TEXT NOT NULL CHECK (length(btrim(prompt)) > 0 AND char_length(prompt) <= 1000),
  answer_type TEXT NOT NULL
                CHECK (answer_type IN ('SHORT_ANSWER','MULTIPLE_CHOICE','TRUE_FALSE','SELF_ASSESSED')),
  -- Opción múltiple: `[{"id":"a","text":"…"}]`. Nunca marca la correcta.
  options          JSONB,
  -- Lo que se acepta como correcto en una cerrada: textos, el id de la opción o
  -- `true`/`false`. **Nunca sale hacia el cliente antes de confirmar.**
  accepted_answers TEXT[],
  -- La respuesta de referencia que se muestra después de confirmar.
  canonical_answer TEXT NOT NULL CHECK (length(btrim(canonical_answer)) > 0),
  explanation      TEXT,
  version          INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

  publication_status TEXT NOT NULL DEFAULT 'DRAFT'
                       CHECK (publication_status IN ('DRAFT','PUBLISHED','RETIRED')),
  published_at       TIMESTAMPTZ,

  source_type TEXT NOT NULL CHECK (source_type IN
              ('institution','instructor','student','community','public_web','inference')),
  source_ref  TEXT NOT NULL CHECK (length(btrim(source_ref)) > 0),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
                      CHECK (verification_status IN ('unverified','corroborated','official','disputed')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT recall_item_publicado_con_fecha
    CHECK (publication_status <> 'PUBLISHED' OR published_at IS NOT NULL),
  CONSTRAINT recall_item_opciones_solo_multiple CHECK (
    (answer_type = 'MULTIPLE_CHOICE') = (options IS NOT NULL)
    AND (options IS NULL OR (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) BETWEEN 2 AND 6))
  ),
  -- Una cerrada sin respuestas aceptadas no se puede corregir; una abierta con
  -- ellas invitaría a corregirla sola, que es lo que ADR-102 §8 prohíbe.
  CONSTRAINT recall_item_aceptadas_solo_cerradas CHECK (
    (answer_type = 'SELF_ASSESSED') = (accepted_answers IS NULL)
    AND (accepted_answers IS NULL OR cardinality(accepted_answers) >= 1)
  ),
  CONSTRAINT recall_item_verdadero_falso CHECK (
    answer_type <> 'TRUE_FALSE' OR accepted_answers <@ ARRAY['true','false']::TEXT[]
  )
);

COMMENT ON TABLE recall_item IS
  'Una pregunta de Recuerdo real (ADR-102). DRAFT por defecto: sólo lo PUBLISHED se le muestra a un '
  'estudiante. Las sintéticas de la demo (code SYN-) se ven sólo con MODO_PRUEBA=1 y se rotulan.';

CREATE INDEX recall_item_curso_idx ON recall_item (course_id, publication_status);

-- RLS activo y sin políticas: `accepted_answers` no llega a nadie por PostgREST.
ALTER TABLE recall_item ENABLE ROW LEVEL SECURITY;

-- ── Los repasos ──────────────────────────────────────────────────────────────
--
-- ⚠️ **Append-only.** Cada respuesta confirmada es un hecho: el próximo repaso
-- de una pregunta es el del repaso más reciente, y la cantidad de intentos se
-- cuenta. Nada se reescribe.

CREATE TABLE recall_review (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  recall_item_id UUID NOT NULL REFERENCES recall_item(id) ON DELETE CASCADE,
  -- Con qué versión de la pregunta se respondió.
  item_version   INTEGER NOT NULL CHECK (item_version >= 1),
  gym_attempt_id UUID NOT NULL,
  -- El lugar en la cola de la sesión. Único: una misma pregunta no se responde
  -- dos veces en el mismo lugar, aunque dos pedidos lleguen juntos.
  position       SMALLINT NOT NULL CHECK (position >= 0),

  outcome     TEXT NOT NULL CHECK (outcome IN ('NOT_RECALLED','PARTIAL','RECALLED','EASY')),
  -- `TRUE` ⇒ la corrigió el servidor (cerrada). `FALSE` ⇒ la clasificó el
  -- estudiante al ver la referencia (abierta).
  auto_graded BOOLEAN NOT NULL,
  -- Lo que respondió en una cerrada, corto. **Una abierta no se guarda**: no
  -- hace falta para nada y es texto libre del estudiante.
  answer      TEXT CHECK (answer IS NULL OR char_length(answer) <= 200),

  policy_version TEXT NOT NULL CHECK (length(btrim(policy_version)) > 0),
  next_review_on DATE NOT NULL,
  answered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idempotency_key TEXT NOT NULL CHECK (length(btrim(idempotency_key)) > 0),

  UNIQUE (student_id, idempotency_key),
  UNIQUE (gym_attempt_id, position),
  CONSTRAINT recall_review_de_un_intento_propio
    FOREIGN KEY (gym_attempt_id, student_id)
    REFERENCES gym_attempt (id, student_id) ON DELETE CASCADE,
  CONSTRAINT recall_review_abierta_sin_texto
    CHECK (auto_graded OR answer IS NULL)
);

COMMENT ON TABLE recall_review IS
  'Un repaso confirmado de Recuerdo real (ADR-102). Append-only: el próximo repaso es el del más reciente.';

CREATE INDEX recall_review_estudiante_item_idx
  ON recall_review (student_id, recall_item_id, answered_at DESC);
CREATE INDEX recall_review_institution_idx ON recall_review (institution_id);

ALTER TABLE recall_review ENABLE ROW LEVEL SECURITY;

-- Append-only de verdad, como `product_event` (I12): ni el backend reescribe un repaso.
REVOKE UPDATE, DELETE, TRUNCATE ON recall_review FROM service_role, anon, authenticated;
