-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · La duración entra al modelo académico
--
-- Ejecuta [ADR-068](../../docs/decisions.md#adr-068) y
-- [ADR-069](../../docs/decisions.md#adr-069).
--
-- **Lo único que le faltaba a la capa académica era el tiempo.** `topic` con
-- `parent_id`, `topic_prerequisite` explícita, `class_session_topic` muchos a
-- muchos, `assessment_topic`, `learning_objective` y `topic_progress` ya
-- estaban. `class_session` guardaba `session_date` y nada más: sin hora, sin
-- duración, sin distinguir teórico de práctico, y sin distinguir una clase de
-- un parcial.
--
-- ## Lo que esta migración NO agrega, y es la decisión más importante
--
-- **No hay columna de minutos por tema.** Repartir los minutos de una clase
-- entre los temas que cubrió es una **derivación**, y se calcula al leer:
-- `lib/domain/duracion.ts`, versionada por la regla que la produjo.
--
-- Persistirla la congelaría como si fuera un hecho, y **se volvería mentira
-- sola**: cuando una clase posterior vuelve sobre el mismo tema, el reparto
-- anterior deja de ser correcto y nadie lo recalcula.
--
-- Es el mismo criterio que ya rige en `topic_progress`: *"No hay columna de
-- score agregado y no se agrega."*
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1 · La sesión de clase, con su tiempo ────────────────────────────────────

ALTER TABLE class_session
  ADD COLUMN duration_min  INTEGER,
  ADD COLUMN session_time  TIME,
  -- Tres valores, no dos. El corpus de libros de temas usa `TEORICO-PRACTICO`
  -- mezclado dentro de una misma corrida: modelarlo con dos obligaría a elegir
  -- uno de los dos y perder el dato.
  ADD COLUMN stream        TEXT,
  ADD COLUMN session_kind  TEXT;

ALTER TABLE class_session
  ADD CONSTRAINT class_session_stream_vocabulario
    CHECK (stream IS NULL OR stream IN ('teorico','practico','teorico_practico')),
  -- Los cinco valores salen del corpus, no de la imaginación: `NORMAL` (988
  -- filas), `RECUPERATORIO` (18), `CONSULTA` (9), `PARCIAL` y el asterisco que
  -- el pie del libro define como *"CLASE NO DICTADA"*.
  ADD CONSTRAINT class_session_kind_vocabulario
    CHECK (session_kind IS NULL OR session_kind IN
            ('clase','parcial','recuperatorio','consulta','no_dictada')),
  -- Una clase de cero minutos no es una clase corta: es un dato mal cargado.
  -- `NULL` sigue siendo legítimo — *no sabemos cuánto duró*.
  ADD CONSTRAINT class_session_duracion_positiva
    CHECK (duration_min IS NULL OR duration_min > 0);

COMMENT ON COLUMN class_session.duration_min IS
  'Minutos observados de esta sesión. NULL = no se sabe. Los minutos por tema NO se persisten: '
  'son una derivación de lib/domain/duracion.ts (ADR-068).';
COMMENT ON COLUMN class_session.stream IS
  'teorico | practico | teorico_practico. Son corridas con asistencia separada. NULL = desconocido.';
COMMENT ON COLUMN class_session.session_kind IS
  'ADR-069. NUNCA lo escribe el importador solo: lo propone y una persona lo confirma. '
  'La columna `tipo` del libro dice NORMAL en 988 de ~1016 filas y el parcial vive en texto libre, '
  'con 25% de falsos positivos medidos. Sólo `clase` aporta minutos; NULL cuenta como clase.';

-- Las dos consultas del Gantt filtran por esto: la del tiempo por comisión y la
-- del tipo. Sin índice, cada materia escanea toda la tabla.
CREATE INDEX class_session_por_offering_y_fecha
    ON class_session (offering_id, session_date);

-- ── 2 · La carga horaria declarada por el programa ───────────────────────────
--
-- El total top-down, que es una fuente distinta de la suma de las sesiones. Las
-- dos conviven: el programa da el total y el libro da la distribución.

ALTER TABLE course_offering
  ADD COLUMN declared_total_min    INTEGER,
  -- **El texto literal que se leyó**, no la interpretación. El programa declara
  -- la carga en formatos que no se parecen entre sí —`60 horas`, `26 Hs`,
  -- `3 horas prácticas + 2 teóricas semanales`, `Instancias Supervisadas: 30
  -- horas`—, y cuando la normalización esté mal se va a poder ver por qué sin
  -- volver al PDF.
  --
  -- Precedente directo: `curriculum_requirement.year_source`, *"qué se vio para
  -- afirmar el año, y qué no se pudo leer"*.
  ADD COLUMN declared_total_source TEXT;

ALTER TABLE course_offering
  -- Un total sin fuente es un número que nadie puede auditar; una fuente sin
  -- total es un texto que no afirma nada. Van juntos o no van.
  ADD CONSTRAINT carga_declarada_completa_o_ausente
    CHECK ((declared_total_min IS NULL AND declared_total_source IS NULL)
        OR (declared_total_min IS NOT NULL AND declared_total_source IS NOT NULL
            AND declared_total_min > 0));

COMMENT ON COLUMN course_offering.declared_total_source IS
  'El texto literal del programa. Se guarda junto al número normalizado para poder auditar la lectura.';

-- ── 3 · El peso del tema ─────────────────────────────────────────────────────
--
-- ⚠️ **Un peso faltante NO es `1.0`**: es ausencia de dato. La regla de que el
-- peso es **todo-o-nada por materia** vive en `lib/domain/duracion.ts` y no en
-- un CHECK, porque un CHECK de fila no puede mirar a las demás filas de la
-- misma comisión sin un trigger — y un trigger acá sería una regla de negocio
-- en la base, que es lo que ADR-005 evita.

ALTER TABLE topic ADD COLUMN weight NUMERIC;

ALTER TABLE topic
  ADD CONSTRAINT topic_peso_no_negativo
    CHECK (weight IS NULL OR weight > 0);

COMMENT ON COLUMN topic.weight IS
  'Peso relativo declarado. NULL = no declarado, NO 1.0. Si alguna unidad de la materia lo tiene '
  'y otra no, la materia se trata como sin pesos (ADR-068): mezclar declarados con defaults '
  'produciría un reparto que parece medido y no lo es.';
