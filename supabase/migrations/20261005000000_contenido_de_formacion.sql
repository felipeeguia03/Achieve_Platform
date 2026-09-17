-- Achieve Platform · Fase B6.25 — el contenido de Formación.
--
-- [ADR-087](../../docs/decisions.md#adr-087). La biblioteca del alumno, con las
-- cinco piezas de prioridad máxima de la psicopedagoga
-- (`docs/formacion-prioridad-maxima-source.md`).
--
-- ⚠️ **Las columnas las dicta el contenido, no el diseñador.** Las cinco piezas
-- traen exactamente las mismas seis partes, y esa forma **es** la que el spec
-- pide en su §3.9: *contenido → aplicación real → evidencia → feedback*. Una
-- entidad de «título + video» dejaría afuera la acción y la evidencia, y con
-- ellas Formación vuelve a ser la videoteca pasiva que el §13 prohíbe.
--
-- ⚠️ **No hay columna de video, y es deliberado.** La autora declara que faltan
-- los guiones. Precedente exacto: `course_enrollment.schedule_status` se
-- escribió, se probó y se sacó porque no tenía escritor — *la columna llega con
-- su escritor*. El video llega con su guion.
--
-- ⚠️ **Tampoco hay `eje` ni `area`.** El índice temático tiene diecisiete áreas
-- y cinco ejes, pero **el documento de las cinco piezas no dice a cuál pertenece
-- cada una**. Asignarlas sería inferencia presentada como clasificación de la
-- autora. Llegan cuando alguien las declare.
--
-- ⚠️ **No lleva `institution_id`.** Este contenido no es de ninguna institución:
-- es de Achieve, escrito por la psicopedagoga, y es el mismo para todos. `I11`
-- aísla datos **de** una institución; esto no lo es. Por la misma razón **no
-- entra en `limpiar_mundo`**: es catálogo, como el plan de estudios, y no el
-- mundo de negocio que `db-aislamiento.sh` vacía.

CREATE TABLE IF NOT EXISTS formative_content (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Clave natural: permite recargar la fuente sin duplicar ni perder el vínculo
  -- con las `action` que ya nacieron de esta pieza.
  code TEXT NOT NULL UNIQUE,

  -- ── Las seis partes, tal como vienen de la fuente ────────────────────────
  --
  -- El título es **la frase del estudiante**, no un rótulo de catálogo:
  -- «No sé por dónde empezar a estudiar». Es como la autora las nombra, y es lo
  -- que hace que alguien se reconozca en la lista.
  title             TEXT NOT NULL,
  problem           TEXT NOT NULL,
  objective         TEXT NOT NULL,
  explanation       TEXT NOT NULL,
  next_action       TEXT NOT NULL,
  expected_evidence TEXT NOT NULL,
  -- El material descargable. `NULL` = la pieza no declara uno; **no es un
  -- archivo vacío**, y la línea desaparece en vez de mostrarse sin destino.
  material          TEXT,

  sequence INTEGER,

  -- ── Se le puede mostrar a un estudiante, o no ────────────────────────────
  --
  -- `D5` de ADR-087: el contenido queda fuera de producción hasta que la
  -- psicopedagoga confirme su vigencia y autorice publicarlo. **No hace falta un
  -- mecanismo nuevo**: es la misma columna que ADR-051 definió para el catálogo,
  -- con la misma pregunta y el mismo default.
  --
  -- ⚠️ **NO es `verification_status`, y no se colapsan.** «¿Se le puede mostrar?»
  -- y «¿alguien con autoridad lo verificó?» son dos preguntas: que la autora
  -- autorice publicar **no corrobora** su contenido, y viceversa.
  publication_status TEXT NOT NULL DEFAULT 'DRAFT'
                     CHECK (publication_status IN ('DRAFT','PUBLISHED','RETIRED')),
  published_at       TIMESTAMPTZ,

  -- ── Procedencia, igual que el resto del ADL (`data-model.md` §4) ─────────
  source_type TEXT NOT NULL CHECK (source_type IN
              ('institution','instructor','student','community','public_web','inference')),
  source_ref  TEXT NOT NULL CHECK (length(btrim(source_ref)) > 0),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- `verification_status` **no se pasa nunca**: nace `unverified` y sólo
  -- `corroborar_procedencia()` lo mueve (`I9`).
  verification_status TEXT NOT NULL DEFAULT 'unverified'
                      CHECK (verification_status IN
                             ('unverified','corroborated','official','disputed')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Publicado exige fecha de publicación: «está publicado» sin cuándo es una
  -- afirmación que nadie puede auditar después.
  CONSTRAINT formacion_publicada_con_fecha
    CHECK (publication_status <> 'PUBLISHED' OR published_at IS NOT NULL)
);

COMMENT ON TABLE formative_content IS
  'Contenido de Formación (ADR-087). Global: no pertenece a ninguna institución ni a ninguna '
  'materia. DRAFT por defecto; sólo lo PUBLISHED se le muestra a un estudiante.';

COMMENT ON COLUMN formative_content.title IS
  'La frase del estudiante, como la nombra la autora: «No sé por dónde empezar a estudiar».';

COMMENT ON COLUMN formative_content.publication_status IS
  'DRAFT por defecto: una pieza nace sin mostrarse. Lo levanta la psicopedagoga al confirmar '
  'vigencia (ADR-087 D5). No es verification_status y ninguna capa los reconcilia (ADR-051).';

-- ⚠️ **RLS activo y sin políticas: nadie llega por la API pública.**
--
-- Mismo patrón que el resto del ADL. La lectura pasa por
-- `biblioteca_de_formacion()` con `service_role`, que es quien filtra por
-- publicación (`D5`). Sin esto, `anon` podría listar la tabla entera —incluidas
-- las piezas `DRAFT`— y el gate de la psicopedagoga se saltearía por PostgREST.
ALTER TABLE formative_content ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS formative_content_publicado_idx
  ON formative_content (publication_status, sequence);

-- ── Lo que V1 NO hace, y es deliberado · ADR-087 Enmienda 2 ─────────────────
--
-- ⚠️ **`action` no se toca.** La biblioteca de V1 es de **solo lectura**: no
-- crea acciones, no las marca y no se vincula a ellas. `action.formative_content_id`
-- y la columna `origin` pertenecen a la vertical de aplicación (V2), y entran
-- **con** la escritura que las usa.
--
-- Agregarlas ahora dejaría en el esquema la mitad de un contrato que nadie
-- cumple, que es exactamente lo que la Enmienda 2 prohíbe.
