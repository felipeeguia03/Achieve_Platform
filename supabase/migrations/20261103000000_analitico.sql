-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · El analítico: la historia académica del estudiante
--
-- [ADR-106](../../docs/decisions.md#adr-106), autorizado por el owner el 13 de
-- septiembre de 2026 — **sólo datos sintéticos**: ADR-006 sigue intacto.
--
-- ## Tres tablas y un bucket
--
-- | Tabla | Qué es |
-- |---|---|
-- | `academic_record_consent` | el consentimiento, **append-only** y versionado (patrón de `whatsapp_consent`) |
-- | `academic_document` | el archivo subido: hash, tipo real, estado del procesamiento |
-- | `academic_record_entry` | cada resultado: **crudo e interpretado por separado**, su vínculo con el plan y su revisión |
--
-- ## Lo que estas tablas NO son, y cada ausencia es la decisión
--
-- ⛔ **No crean `course_enrollment`.** El analítico es el pasado; la cursada, el
-- presente (ADR-106 §2). Ninguna función de acá escribe esa tabla.
-- ⛔ **No escriben `topic_progress`, `evidence` ni progreso.** Aprobar hace años
-- no es dominio hoy.
-- ⛔ **No elevan procedencia.** Todo entra `student` / `unverified` aunque el
-- documento lo emita la universidad: lo trajo el estudiante (ADR-029, `I9`).
-- ⛔ **No guardan el contenido del archivo en una columna.** El archivo vive en
-- el bucket privado; en la base, sólo las filas que se extrajeron.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1 · El consentimiento ────────────────────────────────────────────────────

CREATE TABLE academic_record_consent (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  decision       TEXT NOT NULL CHECK (decision IN ('GRANTED','WITHDRAWN')),
  -- Qué texto aceptó. Sin esto, un cambio de política dejaría consentimientos
  -- que nadie puede decir a qué se referían.
  policy_version TEXT NOT NULL CHECK (length(btrim(policy_version)) > 0),
  decided_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE academic_record_consent IS
  'ADR-106 §3: consentimiento para procesar el analítico. Append-only: retirarlo es una fila '
  'WITHDRAWN, nunca un UPDATE del GRANTED.';

-- Append-only de verdad para el backend: sin UPDATE. El DELETE queda para el
-- borrado del estudiante (CASCADE), que es otra operación.
REVOKE UPDATE ON academic_record_consent FROM service_role, anon, authenticated;

CREATE INDEX academic_record_consent_student_idx ON academic_record_consent (student_id, decided_at DESC);

-- ── 2 · El documento ─────────────────────────────────────────────────────────

CREATE TABLE academic_document (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id     UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id         UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  -- El plan contra el que se vinculó. Un estudiante que cambió de plan no mezcla.
  curriculum_plan_id UUID REFERENCES curriculum_plan(id) ON DELETE SET NULL,
  consent_id         UUID NOT NULL REFERENCES academic_record_consent(id) ON DELETE RESTRICT,

  -- ⚠️ **Sólo lo procesado guarda el archivo.** Uno que no se pudo leer no se
  -- retiene: guardar lo que no sirve es retener un dato personal sin finalidad.
  storage_key    TEXT UNIQUE,
  content_sha256 TEXT NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  -- El tipo **real**, por firma de bytes: la extensión no cuenta.
  mime_type      TEXT NOT NULL CHECK (mime_type IN ('application/pdf','image/png','image/jpeg')),
  byte_size      INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 10485760),
  page_count     INTEGER CHECK (page_count IS NULL OR page_count BETWEEN 1 AND 20),

  status         TEXT NOT NULL CHECK (status IN ('PROCESSED','FAILED')),
  failure_reason TEXT CHECK (failure_reason IS NULL OR failure_reason IN
                   ('EXTRACCION_NO_DISPONIBLE','NO_PARECE_UN_ANALITICO','SIN_RESULTADOS')),
  -- Qué extractor lo leyó. Hoy sólo `SINTETICO-v1` (ADR-106 §5).
  extractor      TEXT NOT NULL,

  source_type         TEXT NOT NULL DEFAULT 'student' CHECK (source_type = 'student'),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status = 'unverified'),

  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,

  -- El mismo archivo dos veces es el mismo documento.
  UNIQUE (student_id, content_sha256),
  CONSTRAINT documento_fallido_dice_por_que CHECK ((status = 'FAILED') = (failure_reason IS NOT NULL)),
  CONSTRAINT solo_lo_procesado_guarda_archivo CHECK ((status = 'PROCESSED') = (storage_key IS NOT NULL)),
  CONSTRAINT solo_se_confirma_lo_procesado CHECK (confirmed_at IS NULL OR status = 'PROCESSED')
);

COMMENT ON TABLE academic_document IS
  'ADR-106: el analítico que subió el estudiante. student/unverified siempre: nada lo eleva. El '
  'archivo vive en el bucket privado analiticos; acá no se guarda su contenido.';

CREATE INDEX academic_document_student_idx ON academic_document (student_id, uploaded_at DESC);

-- ── 3 · Los resultados ───────────────────────────────────────────────────────

CREATE TABLE academic_record_entry (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  document_id    UUID NOT NULL REFERENCES academic_document(id) ON DELETE CASCADE,
  ordinal        INTEGER NOT NULL CHECK (ordinal >= 1),

  -- Crudo: **tal como vino**, y no se edita.
  raw_label  TEXT NOT NULL CHECK (length(btrim(raw_label)) > 0),
  raw_code   TEXT,
  raw_status TEXT,
  raw_grade  TEXT,
  raw_date   TEXT,
  raw_period TEXT,

  -- Interpretado. `grade NULL` ≠ `0`; `UNKNOWN` ≠ desaprobado.
  status    TEXT NOT NULL CHECK (status IN
              ('APPROVED','PROMOTED','REGULARIZED','FAILED','ABSENT','EQUIVALENCE','UNKNOWN')),
  grade     NUMERIC(4,2) CHECK (grade IS NULL OR grade BETWEEN 0 AND 10),
  exam_date DATE,

  -- El vínculo, **sólo** con un requisito del plan del estudiante.
  -- RESTRICT, como `requirement_declaration`: un SET NULL dejaría la regla sin vínculo.
  curriculum_requirement_id UUID REFERENCES curriculum_requirement(id) ON DELETE RESTRICT,
  match_rule       TEXT NOT NULL CHECK (match_rule IN ('CODE','NAME_EXACT','STUDENT_CHOICE','NONE')),
  match_confidence NUMERIC(3,2) CHECK (match_confidence IS NULL OR match_confidence BETWEEN 0 AND 1),

  review_state TEXT NOT NULL CHECK (review_state IN
                 ('AUTO','NEEDS_REVIEW','CONFIRMED','CORRECTED','UNSURE','NOT_IN_PLAN')),
  reviewed_at  TIMESTAMPTZ,

  source_type         TEXT NOT NULL DEFAULT 'student' CHECK (source_type = 'student'),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status = 'unverified'),

  UNIQUE (document_id, ordinal),
  CONSTRAINT vinculo_con_regla CHECK ((match_rule = 'NONE') = (curriculum_requirement_id IS NULL)),
  -- Lo automático sólo sale de las dos reglas deterministas.
  CONSTRAINT automatico_sale_de_una_regla CHECK (review_state <> 'AUTO' OR match_rule IN ('CODE','NAME_EXACT')),
  CONSTRAINT fuera_del_plan_sin_vinculo CHECK (review_state <> 'NOT_IN_PLAN' OR curriculum_requirement_id IS NULL),
  CONSTRAINT revisado_tiene_fecha CHECK (
    (review_state IN ('AUTO','NEEDS_REVIEW')) = (reviewed_at IS NULL))
);

COMMENT ON TABLE academic_record_entry IS
  'ADR-106 §6: un resultado del analítico. raw_* es lo que vino y no se edita; status/grade/fecha '
  'son la interpretación. NUNCA crea ni sugiere una course_enrollment.';

CREATE INDEX academic_record_entry_document_idx ON academic_record_entry (document_id);
CREATE INDEX academic_record_entry_student_idx ON academic_record_entry (student_id);

ALTER TABLE academic_record_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_document       ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_record_entry   ENABLE ROW LEVEL SECURITY;

-- ── 4 · El bucket privado ────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('analiticos', 'analiticos', FALSE, 10485760, ARRAY['application/pdf','image/png','image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- ── 5 · Registrar un documento con sus filas, en una transacción ─────────────
--
-- `p_filas`: `[{ ordinal, crudo: {nombre,codigo,estado,nota,fecha,periodo},
-- estado, nota, fecha, requisitoId, regla, confianza, revision }]`. La
-- interpretación y el vínculo los calcula el dominio (`lib/domain/analitico.ts`);
-- acá queda **lo que sólo la base puede asegurar**: que el requisito sea del
-- plan del estudiante y que el mismo archivo no se registre dos veces.

CREATE OR REPLACE FUNCTION public.registrar_analitico(
  p_institution_id UUID,
  p_student_id     UUID,
  p_documento      JSONB,
  p_filas          JSONB
)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_consent UUID;
  v_plan    UUID;
  v_doc     UUID;
  v_ya      UUID;
  f         JSONB;
BEGIN
  -- El mismo archivo **procesado** es el mismo documento. Uno que había fallado
  -- se reintenta: el extractor puede no ser el mismo.
  SELECT id INTO v_ya FROM academic_document
   WHERE student_id = p_student_id AND content_sha256 = p_documento->>'sha256' AND status = 'PROCESSED';
  IF v_ya IS NOT NULL THEN
    RETURN jsonb_build_object('documentoId', v_ya, 'repetido', TRUE);
  END IF;
  DELETE FROM academic_document
   WHERE student_id = p_student_id AND content_sha256 = p_documento->>'sha256' AND status = 'FAILED';

  SELECT c.id INTO v_consent FROM academic_record_consent c
   WHERE c.student_id = p_student_id AND c.institution_id = p_institution_id
   ORDER BY c.decided_at DESC, c.id DESC LIMIT 1;
  IF v_consent IS NULL OR (SELECT decision FROM academic_record_consent WHERE id = v_consent) <> 'GRANTED' THEN
    RAISE EXCEPTION 'SIN_CONSENTIMIENTO: no hay consentimiento vigente para procesar el analítico'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT e.curriculum_plan_id INTO v_plan FROM enrollment e
   WHERE e.student_id = p_student_id AND e.confirmed_at IS NOT NULL
   ORDER BY e.created_at DESC LIMIT 1;

  INSERT INTO academic_document
    (institution_id, student_id, curriculum_plan_id, consent_id, storage_key, content_sha256,
     mime_type, byte_size, page_count, status, failure_reason, extractor)
  VALUES
    (p_institution_id, p_student_id, v_plan, v_consent, NULLIF(p_documento->>'clave',''), p_documento->>'sha256',
     p_documento->>'tipo', (p_documento->>'bytes')::INTEGER, NULLIF(p_documento->>'paginas','')::INTEGER,
     p_documento->>'estado', NULLIF(p_documento->>'motivo',''), p_documento->>'extractor')
  RETURNING id INTO v_doc;

  FOR f IN SELECT * FROM jsonb_array_elements(COALESCE(p_filas, '[]'::jsonb)) LOOP
    IF NULLIF(f->>'requisitoId','') IS NOT NULL AND NOT EXISTS (
         SELECT 1 FROM curriculum_requirement cr
          WHERE cr.id = (f->>'requisitoId')::UUID AND cr.curriculum_plan_id = v_plan) THEN
      RAISE EXCEPTION 'REQUISITO_DE_OTRO_PLAN: el requisito % no es del plan del estudiante', f->>'requisitoId'
        USING ERRCODE = 'foreign_key_violation';
    END IF;
    INSERT INTO academic_record_entry
      (institution_id, student_id, document_id, ordinal, raw_label, raw_code, raw_status, raw_grade,
       raw_date, raw_period, status, grade, exam_date, curriculum_requirement_id, match_rule,
       match_confidence, review_state)
    VALUES
      (p_institution_id, p_student_id, v_doc, (f->>'ordinal')::INTEGER,
       f->'crudo'->>'nombre', f->'crudo'->>'codigo', f->'crudo'->>'estado', f->'crudo'->>'nota',
       f->'crudo'->>'fecha', f->'crudo'->>'periodo',
       f->>'estado', NULLIF(f->>'nota','')::NUMERIC, NULLIF(f->>'fecha','')::DATE,
       NULLIF(f->>'requisitoId','')::UUID, f->>'regla', NULLIF(f->>'confianza','')::NUMERIC, f->>'revision');
  END LOOP;

  RETURN jsonb_build_object('documentoId', v_doc, 'repetido', FALSE);
END;
$$;

-- ── 6 · Revisar una fila ─────────────────────────────────────────────────────
--
-- `p_decision`: `CONFIRMED` (con requisito) · `CORRECTED` (otro requisito u otro
-- estado) · `UNSURE` · `NOT_IN_PLAN`. **El crudo no se toca.**

CREATE OR REPLACE FUNCTION public.revisar_resultado(
  p_institution_id UUID,
  p_student_id     UUID,
  p_entry_id       UUID,
  p_decision       TEXT,
  p_requisito_id   UUID,
  p_estado         TEXT
)
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  v_plan UUID;
BEGIN
  SELECT d.curriculum_plan_id INTO v_plan
    FROM academic_record_entry r JOIN academic_document d ON d.id = r.document_id
   WHERE r.id = p_entry_id AND r.student_id = p_student_id AND r.institution_id = p_institution_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESULTADO_AJENO: el resultado no es del estudiante' USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF p_requisito_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM curriculum_requirement WHERE id = p_requisito_id AND curriculum_plan_id = v_plan) THEN
    RAISE EXCEPTION 'REQUISITO_DE_OTRO_PLAN: el requisito no es del plan del estudiante'
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  UPDATE academic_record_entry
     SET review_state = p_decision,
         reviewed_at  = NOW(),
         status       = COALESCE(p_estado, status),
         curriculum_requirement_id = CASE WHEN p_decision IN ('UNSURE','NOT_IN_PLAN') THEN NULL
                                          ELSE COALESCE(p_requisito_id, curriculum_requirement_id) END,
         match_rule   = CASE WHEN p_decision IN ('UNSURE','NOT_IN_PLAN') THEN 'NONE'
                             WHEN p_requisito_id IS NOT NULL AND p_requisito_id IS DISTINCT FROM curriculum_requirement_id
                               THEN 'STUDENT_CHOICE'
                             ELSE match_rule END,
         match_confidence = CASE WHEN p_decision IN ('UNSURE','NOT_IN_PLAN') THEN NULL
                                 WHEN p_requisito_id IS NOT NULL AND p_requisito_id IS DISTINCT FROM curriculum_requirement_id
                                   THEN NULL
                                 ELSE match_confidence END
   WHERE id = p_entry_id;
END;
$$;

-- ── 7 · Lo que ve `/recorrido` ───────────────────────────────────────────────
--
-- El documento **vigente** —el último procesado— con sus filas, el consentimiento
-- vigente, y los requisitos del plan para elegir al revisar. Los documentos
-- anteriores no se pisan: se cuentan.

CREATE OR REPLACE FUNCTION public.recorrido_del_estudiante(
  p_institution_id UUID,
  p_student_id     UUID
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH vigente AS (
    SELECT d.* FROM academic_document d
     WHERE d.student_id = p_student_id AND d.institution_id = p_institution_id AND d.status = 'PROCESSED'
     ORDER BY d.uploaded_at DESC, d.id DESC LIMIT 1
  ),
  ultimo AS (
    SELECT d.* FROM academic_document d
     WHERE d.student_id = p_student_id AND d.institution_id = p_institution_id
     ORDER BY d.uploaded_at DESC, d.id DESC LIMIT 1
  ),
  plan AS (
    SELECT e.curriculum_plan_id AS id FROM enrollment e
     WHERE e.student_id = p_student_id AND e.confirmed_at IS NOT NULL
     ORDER BY e.created_at DESC LIMIT 1
  )
  SELECT jsonb_build_object(
    'consentimiento', (SELECT jsonb_build_object('decision', c.decision, 'version', c.policy_version, 'en', c.decided_at)
                         FROM academic_record_consent c
                        WHERE c.student_id = p_student_id AND c.institution_id = p_institution_id
                        ORDER BY c.decided_at DESC, c.id DESC LIMIT 1),
    'ultimoFallido', (SELECT jsonb_build_object('motivo', u.failure_reason, 'en', u.uploaded_at)
                        FROM ultimo u WHERE u.status = 'FAILED'),
    'documentosAnteriores', (SELECT count(*) FROM academic_document d
                              WHERE d.student_id = p_student_id AND d.status = 'PROCESSED'
                                AND d.id <> COALESCE((SELECT id FROM vigente), '00000000-0000-0000-0000-000000000000')),
    'documento', (SELECT jsonb_build_object(
                    'id', v.id, 'subidoEn', v.uploaded_at, 'confirmadoEn', v.confirmed_at,
                    'tipo', v.mime_type, 'paginas', v.page_count,
                    'resultados', COALESCE((
                      SELECT jsonb_agg(jsonb_build_object(
                               'id', r.id, 'ordinal', r.ordinal,
                               'crudo', jsonb_build_object('nombre', r.raw_label, 'codigo', r.raw_code,
                                         'estado', r.raw_status, 'nota', r.raw_grade, 'fecha', r.raw_date,
                                         'periodo', r.raw_period),
                               'estado', r.status, 'nota', r.grade, 'fecha', r.exam_date,
                               'requisitoId', r.curriculum_requirement_id,
                               'requisito', cr.label, 'anio', cr.curriculum_year, 'materiaId', cr.course_id,
                               'regla', r.match_rule, 'revision', r.review_state)
                               ORDER BY r.ordinal)
                        FROM academic_record_entry r
                        LEFT JOIN curriculum_requirement cr ON cr.id = r.curriculum_requirement_id
                       WHERE r.document_id = v.id), '[]'::jsonb))
                    FROM vigente v),
    'requisitos', COALESCE((
       SELECT jsonb_agg(jsonb_build_object('requisitoId', cr.id, 'codigo', cr.code, 'nombre', cr.label,
                                           'nombreCortado', cr.label_truncated, 'anio', cr.curriculum_year)
                        ORDER BY cr.ordinal)
         FROM curriculum_requirement cr WHERE cr.curriculum_plan_id = (SELECT id FROM plan)), '[]'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION public.registrar_analitico TO service_role;
GRANT EXECUTE ON FUNCTION public.revisar_resultado TO service_role;
GRANT EXECUTE ON FUNCTION public.recorrido_del_estudiante TO service_role;
