-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.14.2 — el catálogo curricular
--
-- [ADR-051](../../docs/decisions.md#adr-051). Declara la estructura curricular
-- que hasta hoy nadie declaraba.
--
-- El estado previo está escrito en el propio SQL del ingestor
-- (`20260830090000_ingesta_adl.sql:48`):
--
--   "El ingestor asistido no conoce programa ni plan: el material de una
--    materia no los trae. Se usa un contenedor por institución, explícito y
--    reconocible, en vez de inventar una estructura curricular que nadie
--    declaró."
--
-- Ese comentario era correcto. Ahora hay una estructura declarada, y esta
-- migración es dónde ponerla.
--
-- ⚠️ **Tres eslabones del grafo canónico del spec (§5.1) no eran columna de
-- nada:** `Facultad`, `Año` y `Semestre`. Los tres entran acá.
--
-- ⚠️ ADR-006 sigue `PROVISIONAL`: sólo datos sintéticos, y el plan real de una
-- institución entra `DRAFT` (ADR-053).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. La facultad ───────────────────────────────────────────────────────────
--
-- `Universidad → Facultad → Carrera` del §5.1. Es opcional en `academic_program`
-- a propósito: una institución puede no declararla, y **no se infiere**.

CREATE TABLE academic_unit (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  key            TEXT NOT NULL,
  name           TEXT NOT NULL,
  UNIQUE (institution_id, key)
);

COMMENT ON TABLE academic_unit IS
  'Facultad o unidad académica. El eslabón que product-spec-source.md §5.1 nombra y el '
  'schema no tenía. Opcional en academic_program: si la fuente no la declara, se omite.';

-- ── 2. Claves estables para importar sin adivinar ────────────────────────────
--
-- El CSV administrativo trae claves, no UUID. Sin ellas, reimportar el mismo
-- archivo crearía instituciones y carreras duplicadas.

ALTER TABLE institution ADD COLUMN key TEXT UNIQUE;

COMMENT ON COLUMN institution.key IS
  'Clave estable para importación administrativa. NULL en las instituciones creadas antes '
  'de la B6.14; no se les inventa una.';

ALTER TABLE academic_program
  ADD COLUMN academic_unit_id UUID REFERENCES academic_unit(id) ON DELETE RESTRICT,
  ADD COLUMN key              TEXT;

-- Índice **parcial**: el programa centinela de `ingerir_materia()` no tiene
-- clave, y no se le pone una. Un UNIQUE total lo obligaría.
CREATE UNIQUE INDEX academic_program_key_idx
  ON academic_program (institution_id, key) WHERE key IS NOT NULL;

CREATE INDEX academic_program_unit_idx ON academic_program (academic_unit_id);
CREATE INDEX academic_unit_institution_idx ON academic_unit (institution_id);

-- ── 3. El plan se publica; no se corrobora ───────────────────────────────────
--
-- ⚠️ **`publication_status` NO es `verification_status`, y es la distinción que
-- ADR-051 se niega a colapsar.** Son dos preguntas distintas:
--
--   publication_status  → ¿esto se le puede mostrar a un estudiante?
--   verification_status → ¿alguien con autoridad verificó que es cierto?
--
-- Un plan puede estar publicado y sin corroborar —con su procedencia a la
-- vista— y puede estar corroborado y todavía sin publicar.
--
-- Y hay un costo concreto en colapsarlas: `verification_status` tiene **una
-- sola escritura en todo el repositorio** (`corroborar_procedencia()`, `I9`),
-- con guard sobre todas las migraciones. Su propio SQL avisa que "agregar una
-- sexta tabla con Provenance es agregar un valor acá". Esta migración **no lo
-- hace**: ninguna tabla nueva lleva `verification_status`. Mismo criterio que
-- `resource`, que deliberadamente tampoco lo lleva.

-- ⚠️ **No se agrega `plan_code`.** El CSV administrativo trae esa columna y
-- `curriculum_plan.version` ya es exactamente eso — la clave natural del plan,
-- con su `UNIQUE (program_id, version)`. Dos columnas para el mismo concepto es
-- el anti-patrón `A-04`: el importador mapea `plan_code` → `version`.
ALTER TABLE curriculum_plan
  ADD COLUMN publication_status TEXT NOT NULL DEFAULT 'DRAFT'
                                  CHECK (publication_status IN ('DRAFT','PUBLISHED','RETIRED')),
  ADD COLUMN published_at       TIMESTAMPTZ,
  -- Procedencia del plan. Mismo enum que el resto del ADL (`data-model.md` §4).
  ADD COLUMN source_type        TEXT CHECK (source_type IN
                                  ('institution','instructor','student','community','public_web','inference')),
  ADD COLUMN source_ref         TEXT,
  ADD COLUMN observed_at        TIMESTAMPTZ,
  ADD COLUMN content_hash       TEXT;

-- Publicar exige poder decir de dónde salió. "Lo dijo alguien" no se puede
-- volver a mirar — es la misma regla que la B2b.1 puso en el ingestor.
ALTER TABLE curriculum_plan
  ADD CONSTRAINT plan_publicado_con_fuente CHECK (
    publication_status <> 'PUBLISHED'
    OR (source_type IS NOT NULL AND source_ref IS NOT NULL AND length(btrim(source_ref)) > 0));

ALTER TABLE curriculum_plan
  ADD CONSTRAINT plan_publicado_con_fecha CHECK (
    publication_status <> 'PUBLISHED' OR published_at IS NOT NULL);

COMMENT ON COLUMN curriculum_plan.publication_status IS
  'DRAFT por defecto: un plan nace sin ofrecerse. SÓLO un plan PUBLISHED se le muestra a un '
  'estudiante. No es verification_status —esa pregunta es si alguien lo verificó— y ninguna '
  'capa los reconcilia (ADR-051).';

COMMENT ON COLUMN curriculum_plan.content_hash IS
  'Identificador del contenido con el que se importó la versión. Permite decir "esto cambió" '
  'sin comparar 57 filas a mano (spec §6.2, paso 8: detectar cambios y versionar).';

-- ── 4. El requisito curricular ───────────────────────────────────────────────
--
-- **No toda fila de un plan es una materia.** El Plan 2016 tiene 57 filas y al
-- menos seis no lo son: dos electivas, un seminario sin clasificar, una
-- acreditación de idioma, una práctica profesional y un trabajo final.
--
-- Modelarlas como `course` haría que el alta le preguntara al estudiante "¿estás
-- cursando Acreditación de Inglés?" como si fuera una materia, y que el ADE
-- buscara unidades y recursos de un trabajo final.

CREATE TABLE curriculum_requirement (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_plan_id UUID NOT NULL REFERENCES curriculum_plan(id) ON DELETE RESTRICT,

  -- El orden de la fuente. **NO es el año**: son dos datos, por eso son dos
  -- columnas. Derivar uno del otro es exactamente lo que ADR-053 prohíbe.
  ordinal INTEGER NOT NULL,
  code    TEXT NOT NULL,

  -- El texto **visible**, tal como se leyó. Si la fuente lo trae cortado, entra
  -- cortado: `label_truncated` lo declara y nadie lo completa por intuición.
  label TEXT NOT NULL,

  requirement_type TEXT NOT NULL CHECK (requirement_type IN (
    'COURSE',                 -- materia concreta. El único tipo que puede apuntar a un course
    'ELECTIVE_SLOT',          -- un cupo abstracto del plan. NO es una materia
    'SEMINAR_SLOT',
    'LANGUAGE_REQUIREMENT',
    'PROFESSIONAL_PRACTICE',
    'CAPSTONE',
    'UNKNOWN'                 -- la fuente no permite clasificarla. No es un default: es un dato
  )),

  -- NULL = UNKNOWN. **Nunca se infiere por posición** (ADR-053).
  curriculum_year SMALLINT CHECK (curriculum_year IS NULL OR curriculum_year BETWEEN 1 AND 12),
  -- Qué se vio para afirmar el año, y qué no se pudo leer.
  year_source     TEXT,
  -- El "Semestre" del §5.1. NULL = desconocido, no ausente.
  term            TEXT,
  is_annual       BOOLEAN,

  -- La materia concreta, cuando el requisito es una materia.
  course_id UUID REFERENCES course(id) ON DELETE RESTRICT,

  -- El cupo, expresable desde el día uno aunque el Plan 2016 no lo use. Quedan
  -- NULL y declarados, **no en cero**: sin datos no es cero.
  min_options      SMALLINT,
  max_options      SMALLINT,
  required_credits NUMERIC,
  valid_from       DATE,
  valid_until      DATE,

  -- Qué parte del dato todavía no se puede afirmar.
  label_truncated BOOLEAN NOT NULL DEFAULT FALSE,
  needs_review    BOOLEAN NOT NULL DEFAULT TRUE,

  -- Procedencia, sin `verification_status` (ver §3 de esta migración).
  source_type TEXT NOT NULL CHECK (source_type IN
                ('institution','instructor','student','community','public_web','inference')),
  source_ref  TEXT NOT NULL CHECK (length(btrim(source_ref)) > 0),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence  NUMERIC(3,2) CHECK (confidence BETWEEN 0 AND 1),

  UNIQUE (curriculum_plan_id, ordinal),
  UNIQUE (curriculum_plan_id, code),

  CONSTRAINT curso_solo_si_es_course
    CHECK (course_id IS NULL OR requirement_type = 'COURSE'),
  CONSTRAINT cupo_coherente
    CHECK (min_options IS NULL OR max_options IS NULL OR min_options <= max_options)
);

COMMENT ON TABLE curriculum_requirement IS
  'La fila del plan (ADR-051). No toda fila es una materia: ELECTIVA I es un cupo, ACRED. '
  'INGLES una acreditación y TRABAJO FINAL un capstone. Cada una va a necesitar su propia '
  'experiencia, y ninguna la podría tener si entrara como course.';

COMMENT ON COLUMN curriculum_requirement.ordinal IS
  'El orden de la fuente. NO es el año. Que la fila 11 abra un grupo no dice que sea segundo año.';

COMMENT ON COLUMN curriculum_requirement.label IS
  'El texto VISIBLE de la fuente, sin completar. Un nombre truncado entra truncado con '
  'label_truncated = TRUE: completarlo por intuición es inventar contenido de dominio.';

COMMENT ON COLUMN curriculum_requirement.curriculum_year IS
  'NULL = la fuente no lo declara. Nunca se deriva de ordinal. year_source dice qué se vio.';

CREATE INDEX curriculum_requirement_plan_idx   ON curriculum_requirement (curriculum_plan_id);
CREATE INDEX curriculum_requirement_course_idx ON curriculum_requirement (course_id);
-- La consulta caliente del alta: los requisitos de un año de un plan.
CREATE INDEX curriculum_requirement_anio_idx
  ON curriculum_requirement (curriculum_plan_id, curriculum_year);

-- ── 5. Qué materia concreta puede satisfacer un cupo ─────────────────────────
--
-- N:N: una opción puede servir a varios cupos. **Lo que el estudiante elige no
-- entra acá** — seleccionar una opción no modifica el catálogo.

CREATE TABLE elective_option (
  curriculum_requirement_id UUID NOT NULL REFERENCES curriculum_requirement(id) ON DELETE CASCADE,
  course_id                 UUID NOT NULL REFERENCES course(id) ON DELETE RESTRICT,
  source_type TEXT NOT NULL CHECK (source_type IN
                ('institution','instructor','student','community','public_web','inference')),
  source_ref  TEXT NOT NULL CHECK (length(btrim(source_ref)) > 0),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (curriculum_requirement_id, course_id)
);

COMMENT ON TABLE elective_option IS
  'Qué materia concreta puede satisfacer un cupo electivo. Una opción puede pertenecer a '
  'varios cupos. Lo que el estudiante declara NO entra acá: va a requirement_declaration.';

CREATE INDEX elective_option_course_idx ON elective_option (course_id);

-- Una opción sólo cuelga de un cupo. Un CHECK no puede mirar otra tabla, así
-- que es un trigger — el mismo camino que `institution_zona_valida` (ADR-049).
--
-- ⚠️ **No calcula ni escribe nada: sólo levanta.** Está anotado en el guard de
-- `tests/servicio-progreso.test.ts`, que es la conversación que ese guard
-- existe para forzar.
CREATE OR REPLACE FUNCTION public.elective_option_solo_sobre_cupo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_tipo TEXT;
BEGIN
  SELECT requirement_type INTO v_tipo
    FROM curriculum_requirement WHERE id = NEW.curriculum_requirement_id;
  IF v_tipo NOT IN ('ELECTIVE_SLOT','SEMINAR_SLOT') THEN
    RAISE EXCEPTION 'elective_option sólo cuelga de un cupo; el requisito es %', v_tipo
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.elective_option_solo_sobre_cupo() IS
  'Una opción electiva colgada de una materia concreta no significa nada. Se rechaza en la '
  'escritura porque service_role escribe la tabla directo.';

CREATE TRIGGER elective_option_solo_sobre_cupo
  BEFORE INSERT OR UPDATE ON elective_option
  FOR EACH ROW EXECUTE FUNCTION public.elective_option_solo_sobre_cupo();

-- ── 6. Un duplicado latente, de paso ─────────────────────────────────────────
--
-- `UNIQUE (course_id, term, commission)` no dedupe cuando `commission` es NULL:
-- en Postgres dos NULL no chocan. Dos cursadas de la misma materia sin comisión
-- declarada son hoy dos filas distintas, y lo único que lo esquiva es que
-- `ingerir_materia()` lee con `IS NOT DISTINCT FROM` antes de insertar — que es
-- una carrera, no una garantía.
--
-- El alta crea una cursada por defecto **sin comisión** para cada materia que el
-- estudiante confirma, así que esto pasa de latente a inmediato.
--
-- Es más estricto, nunca más permisivo: no rompe nada que hoy funcione.
ALTER TABLE course_offering DROP CONSTRAINT course_offering_course_id_term_commission_key;
ALTER TABLE course_offering
  ADD CONSTRAINT course_offering_course_id_term_commission_key
  UNIQUE NULLS NOT DISTINCT (course_id, term, commission);

-- ── RLS deny-by-default (data-model.md §6) ───────────────────────────────────
ALTER TABLE academic_unit           ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_requirement  ENABLE ROW LEVEL SECURITY;
ALTER TABLE elective_option         ENABLE ROW LEVEL SECURITY;
