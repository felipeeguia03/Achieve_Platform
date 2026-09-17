-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Fase B6.21 — el bloque horario, la única entidad nueva
--
-- [ADR-063](../../docs/decisions.md#adr-063), decidido por el Product Owner el 5
-- de septiembre de 2026 y **sin construir desde entonces**. El plan de
-- implementación lo dice sin vueltas (`plan-periodo-comision-horarios.md` §0):
-- *"la única entidad genuinamente nueva es el bloque horario"*.
--
-- ## Dos hechos distintos, y ninguno se disfraza del otro
--
-- > *"1. El horario publicado de una comisión pertenece a `course_offering`.
-- > 2. El horario declarado personalmente por un estudiante que todavía no
-- > conoce su comisión pertenece a `course_enrollment`."*
--
-- > *"**No crear una comisión ficticia** ni utilizar la offering con
-- > `commission IS NULL` para guardar el horario personal."*
--
-- Con dos prohibiciones de forma, textuales: *"deben mantenerse las FK reales,
-- la procedencia y la diferencia semántica. **No usar JSON opaco ni
-- identificadores fabricados**"*.
--
-- Por eso: **dos FK reales, exactamente una por fila**, con `CHECK` de
-- exclusividad — el mismo patrón que `topic_belongs_somewhere` (ADR-060) y que
-- `una_sola_forma` (ADR-051). No hay columna `owner_type`, no hay JSON.
--
-- ## Por qué `class_session` no servía
--
-- `class_session` es **una clase dictada**, con su fecha. El bloque horario es
-- **la regla semanal**. Derivar la regla desde sus instancias —«se dictó tres
-- martes seguidos, entonces cursa los martes»— es inferir, y sería inferencia
-- presentada como horario de la institución.
--
-- ## Por qué NO se mezcla con `availability`
--
-- ADR-063, textual: *"uno expresa cuándo está cursando y el otro cuándo puede
-- estudiar"*. `availability` sigue siendo del estudiante y sigue alimentando
-- `minutosPorSemana` en `insumos_de_reparto()`. **Esta migración no toca el
-- reparto**, y eso es una decisión, no una omisión: ver el ADR.
--
-- ## Lo que este bloque NO lleva
--
-- ⛔ **No lleva `kind`.** El plan lo listaba como opcional y **ningún ADR declara
-- su vocabulario**: «teórico», «práctico», «laboratorio» serían tres palabras
-- inventadas acá. Una columna que nada restringe y nada lee es el defecto de
-- `reflection.difficulty` —dos escritores, cero lectores— repetido a sabiendas.
-- Cuando el vocabulario se decida es un `ALTER TABLE`.
--
-- ⛔ **No lleva aula.** ADR-062 modeló el bloque sin aula, y la captura del owner
-- pedía «Aula 305». No hay dónde ponerlo **a propósito**.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS class_schedule_block (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,

  -- Los dos dueños posibles. **Exactamente uno**, y son FK reales.
  offering_id          UUID REFERENCES course_offering(id)   ON DELETE CASCADE,
  course_enrollment_id UUID REFERENCES course_enrollment(id) ON DELETE CASCADE,

  -- `0`–`6`, domingo a sábado: **la misma convención que `availability`**.
  -- Dos escalas de día en la misma base es una de esas cosas que se descubren
  -- el día que se comparan, y comparar es exactamente lo que va a pasar acá.
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,

  -- Procedencia obligatoria desde el primer día (ADR-063 §"un horario declarado
  -- se usa sin corroborar"). El horario publicado entra `institution`; el que
  -- declara el estudiante entra `student`/`unverified` **y nadie lo eleva**.
  source_type TEXT NOT NULL CHECK (source_type IN
                ('institution','instructor','student','community','public_web','inference')),
  source_ref  TEXT,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence  NUMERIC(3,2) CHECK (confidence BETWEEN 0 AND 1),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
                        CHECK (verification_status IN
                          ('unverified','corroborated','official','disputed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT bloque_tiene_un_solo_dueno
    CHECK (num_nonnulls(offering_id, course_enrollment_id) = 1),
  -- Un bloque que termina antes de empezar no es un horario raro: es un dato
  -- roto, y entra a la base o no entra.
  CONSTRAINT bloque_termina_despues_de_empezar CHECK (end_time > start_time)
);

COMMENT ON TABLE class_schedule_block IS
  'El horario semanal de cursado (ADR-063). Dos dueños excluyentes: offering_id es el horario '
  'publicado de una comisión; course_enrollment_id es el que declara un estudiante que todavía '
  'no sabe su comisión. NO es class_session (una clase dictada) ni availability (cuándo puede '
  'estudiar).';

COMMENT ON COLUMN class_schedule_block.day_of_week IS
  '0-6, domingo a sábado. La misma escala que availability.day_of_week, a propósito.';

COMMENT ON COLUMN class_schedule_block.verification_status IS
  'Un horario declarado por el estudiante se usa como restricción personal SIN corroborar y '
  'sin elevarse (ADR-063). Elevarlo es corroborar_procedencia() y sólo eso (I9).';

-- El mismo mínimo que el resto de las tablas del estudiante.
ALTER TABLE class_schedule_block ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS class_schedule_block_offering_idx
  ON class_schedule_block (offering_id) WHERE offering_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS class_schedule_block_cursada_idx
  ON class_schedule_block (course_enrollment_id) WHERE course_enrollment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS class_schedule_block_institution_idx
  ON class_schedule_block (institution_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ⛔ Lo que ADR-063 pide y este corte NO trae: `course_enrollment.schedule_status`
--
-- El ADR es explícito: *"No crear una fila horaria negativa para representar
-- desconocimiento. **Guardar el estado explícito en la cursada** y las filas de
-- horario únicamente cuando exista al menos un bloque conocido."*
--
-- **La columna se escribió, se probó y se sacó.** El motivo es concreto y está
-- medido: el estado se pondría en `KNOWN` al ingerir el horario, pero
-- `course_enrollment` **se crea después** de la ingesta —lo hace `db-demo.sh` y
-- lo hace el alta—, así que el `UPDATE` no tocaba ninguna fila y las tres
-- materias del mundo demo quedaban en `UNKNOWN` **con sus bloques cargados**.
-- Una columna que miente en el caso normal es peor que no tenerla.
--
-- Y el arreglo no es un trigger: es que **el estado que el ADR describe es una
-- declaración del estudiante** —*"todavía no sé mis horarios"*— y **la pantalla
-- que la recoge no existe todavía**. Es el cuarto paso del alta, que pregunta
-- comisión y horario juntos y arrastra ADR-062 entero: otro corte.
--
-- **La columna llega con su escritor.** Mientras tanto, «no se sabe» se contesta
-- con la ausencia de bloques, que es un hecho y no puede desincronizarse.
--
-- ⚠️ **Y esa ausencia sigue sin leerse como disponibilidad.** *Sin datos no es
-- cero*: la pantalla omite la sección, no dibuja una semana libre.
-- ─────────────────────────────────────────────────────────────────────────────
