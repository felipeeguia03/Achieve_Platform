-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B2b.2 — corroboración
--
-- La operación explícita que **sí** puede elevar un `verification_status`, que
-- es lo único que el invariante `I9` deja fuera del resto del sistema:
--
-- > *"Ninguna capa eleva un `verification_status`. **Operación explícita del
-- > owner en Service + autorización y auditoría**; Repository no expone un
-- > update genérico del campo."* — `data-model.md` §11, `I9`
--
-- ## Por qué hace falta
--
-- La B2b.1 dejó el ingestor sin ninguna forma de elevar el campo —no es que no
-- deba: **no tiene por dónde**—, y eso estaba bien. Pero sin la operación que
-- falta, **todo el ADL queda `unverified` para siempre**, y la distinción entre
-- *"lo cargó un estudiante"* y *"alguien lo verificó"* nunca puede ejercerse.
--
-- ## Lo que esta migración NO hace
--
-- ⚠️ **No define quién puede corroborar.** `C01-030` —autorización, permisos y
-- privacidad institucional— sigue `OPEN`, así que `corroborated_by` es una
-- **identidad externa**: UUID sin FK, igual que `intervention.owner_operator_id`
-- y `error_classification_correction.corrected_by`.
--
-- ⚠️ **No alcanza `official`, y no es un olvido.** `official` significa que la
-- institución lo afirma, y la Plataforma **no puede autenticar a una
-- institución hoy**: `C01-030` está abierta, [ADR-023](../../docs/decisions.md#adr-023)
-- sacó la identidad de docente y [ADR-033](../../docs/decisions.md#adr-033) mandó
-- las superficies de operador al CRM. El estado se conserva en el `CHECK` y la
-- máquina declara que **nadie llega**. Alcanzarlo sería fabricar autoridad.
--
-- ⚠️ **No autoriza datos reales.** [ADR-006](../../docs/decisions.md#adr-006)
-- sigue siendo bloqueo absoluto.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1 · El hecho, append-only ───────────────────────────────────────────────
--
-- **Corroborar no es un `UPDATE`: es un hecho que además actualiza una fila.**
-- Si sólo se cambiara el campo, dentro de un año nadie podría decir contra qué
-- se verificó ni quién lo hizo — y ésa es toda la diferencia entre un dato
-- auditable y un dato que alguien tocó.
--
-- Es polimórfica a propósito: **cinco tablas** llevan `verification_status`, y
-- cinco tablas de corroboración serían la misma máquina de transiciones escrita
-- cinco veces, que es como se desincronizan.
CREATE TABLE provenance_corroboration (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,

  -- Qué se corroboró. El `CHECK` es el contrato: agregar una sexta tabla con
  -- Provenance es agregar un valor acá, y el que falte se ve al instante.
  subject_table  TEXT NOT NULL CHECK (subject_table IN
                   ('class_session','assessment','class_event_record',
                    'assessment_criterion','learning_objective')),
  subject_id     UUID NOT NULL,

  from_status    TEXT NOT NULL CHECK (from_status IN
                   ('unverified','corroborated','official','disputed')),
  to_status      TEXT NOT NULL CHECK (to_status IN
                   ('unverified','corroborated','official','disputed')),

  -- **Contra qué se corroboró.** La misma regla que el ingestor de la B2b.1:
  -- una fuente sin referencia concreta se rechaza, porque *"lo dijo alguien"* no
  -- se puede volver a mirar, y entonces no se puede corroborar nunca.
  source_type    TEXT NOT NULL CHECK (source_type IN
                   ('institution','instructor','student','community','public_web','inference')),
  source_ref     TEXT NOT NULL CHECK (length(btrim(source_ref)) > 0),

  -- Por qué. Obligatorio: una corroboración sin motivo es indistinguible de un
  -- clic, y es exactamente el dato que después nadie puede auditar.
  reason         TEXT NOT NULL CHECK (length(btrim(reason)) > 0),

  -- ⚠️ Identidad externa, **sin FK**: quién puede corroborar es `C01-030`.
  corroborated_by UUID,
  corroborated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un no-cambio no es una corroboración.
  CONSTRAINT corroboracion_cambia_el_estado CHECK (from_status <> to_status)
);

CREATE INDEX provenance_corroboration_por_sujeto
  ON provenance_corroboration (subject_table, subject_id, corroborated_at);
CREATE INDEX provenance_corroboration_por_institucion
  ON provenance_corroboration (institution_id, corroborated_at DESC);

COMMENT ON TABLE provenance_corroboration IS
  'I9: la única operación que eleva un verification_status. Append-only, con fuente concreta y motivo.';
COMMENT ON COLUMN provenance_corroboration.corroborated_by IS
  'Identidad externa, sin FK: quién puede corroborar sigue siendo C01-030, OPEN.';

ALTER TABLE provenance_corroboration ENABLE ROW LEVEL SECURITY;

-- ── 2 · La operación ────────────────────────────────────────────────────────
--
-- **Escribe el hecho y después actualiza, en una transacción.** En ese orden:
-- si se actualizara primero, un fallo al registrar dejaría una fila elevada sin
-- nada que explique por qué.
--
-- Las transiciones se validan **acá y también en el dominio**. No es
-- redundancia gratuita: el dominio las declara para que se puedan leer y testear
-- sin base, y la base las impone para que no dependan de que todo el mundo pase
-- por el Service.
--
--   `unverified   → corroborated | disputed`
--   `corroborated → disputed`
--   `disputed     → corroborated`
--   `official     → disputed`
--
-- **Nada vuelve a `unverified`**: bajar a *"nadie lo miró"* borraría que alguien
-- lo miró. Y **nada llega a `official`**, por lo dicho arriba.
--
-- `disputed` **no es terminal**: una disputa que se resuelve tiene que poder
-- volver, con la misma exigencia de evidencia. Dejarla terminal dejaría varada
-- para siempre una fila disputada por error — el mismo criterio con el que
-- [ADR-034](../../docs/decisions.md#adr-034) le conservó las salidas a
-- `ACKNOWLEDGED`.
CREATE OR REPLACE FUNCTION public.corroborar_procedencia(
  p_institution_id  UUID,
  p_subject_table   TEXT,
  p_subject_id      UUID,
  p_to_status       TEXT,
  p_source_type     TEXT,
  p_source_ref      TEXT,
  p_reason          TEXT,
  p_corroborated_by UUID DEFAULT NULL
)
RETURNS TABLE (corroboration_id UUID, from_status TEXT, to_status TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_from  TEXT;
  v_ok    BOOLEAN;
  v_id    UUID;
BEGIN
  IF p_subject_table NOT IN ('class_session','assessment','class_event_record',
                             'assessment_criterion','learning_objective') THEN
    RAISE EXCEPTION 'la tabla % no lleva verification_status', p_subject_table;
  END IF;

  -- **`official` no se alcanza**, y el rechazo lo dice con su razón.
  IF p_to_status = 'official' THEN
    RAISE EXCEPTION 'nadie puede declarar official: hace falta autenticar a la institución (C01-030, OPEN)';
  END IF;
  IF p_to_status = 'unverified' THEN
    RAISE EXCEPTION 'no se vuelve a unverified: bajar a "nadie lo miró" borraría que alguien lo miró';
  END IF;
  IF p_to_status NOT IN ('corroborated','disputed') THEN
    RAISE EXCEPTION 'estado de destino inválido: %', p_to_status;
  END IF;

  -- El estado actual, **con la fila tomada**: dos corroboraciones simultáneas
  -- sobre el mismo sujeto no pueden partir del mismo `from_status`.
  EXECUTE format(
    'SELECT verification_status FROM %I WHERE id = $1 FOR UPDATE', p_subject_table
  ) INTO v_from USING p_subject_id;
  IF v_from IS NULL THEN
    RAISE EXCEPTION 'el sujeto % no existe en %', p_subject_id, p_subject_table;
  END IF;

  -- **El sujeto tiene que ser de esta institución**, y llegar ahí no es igual
  -- para las cinco tablas. `assessment_criterion` y `learning_objective` llevan
  -- `institution_id`; las otras tres cuelgan de una cursada, y la institución
  -- está cinco saltos más arriba:
  --
  --   `offering → course → curriculum_plan → academic_program.institution_id`
  --
  -- **`course` no tiene `institution_id`**, y asumir que sí es el error fácil de
  -- cometer acá: la consulta compila igual porque vive dentro de un `EXECUTE`, y
  -- reventaría recién en la primera llamada real.
  v_ok := FALSE;
  IF p_subject_table = 'learning_objective' THEN
    SELECT EXISTS (SELECT 1 FROM learning_objective
                    WHERE id = p_subject_id AND institution_id = p_institution_id)
      INTO v_ok;
  ELSIF p_subject_table = 'assessment_criterion' THEN
    SELECT EXISTS (SELECT 1 FROM assessment_criterion
                    WHERE id = p_subject_id AND institution_id = p_institution_id)
      INTO v_ok;
  ELSIF p_subject_table = 'assessment' THEN
    SELECT EXISTS (
      SELECT 1 FROM assessment a
        JOIN course_offering o  ON o.id  = a.offering_id
        JOIN course c           ON c.id  = o.course_id
        JOIN curriculum_plan cp ON cp.id = c.curriculum_plan_id
        JOIN academic_program ap ON ap.id = cp.program_id
       WHERE a.id = p_subject_id AND ap.institution_id = p_institution_id)
      INTO v_ok;
  ELSIF p_subject_table = 'class_session' THEN
    SELECT EXISTS (
      SELECT 1 FROM class_session s
        JOIN course_offering o  ON o.id  = s.offering_id
        JOIN course c           ON c.id  = o.course_id
        JOIN curriculum_plan cp ON cp.id = c.curriculum_plan_id
        JOIN academic_program ap ON ap.id = cp.program_id
       WHERE s.id = p_subject_id AND ap.institution_id = p_institution_id)
      INTO v_ok;
  ELSIF p_subject_table = 'class_event_record' THEN
    -- Ésta lleva `offering_id` propio: no hace falta pasar por la sesión.
    SELECT EXISTS (
      SELECT 1 FROM class_event_record r
        JOIN course_offering o  ON o.id  = r.offering_id
        JOIN course c           ON c.id  = o.course_id
        JOIN curriculum_plan cp ON cp.id = c.curriculum_plan_id
        JOIN academic_program ap ON ap.id = cp.program_id
       WHERE r.id = p_subject_id AND ap.institution_id = p_institution_id)
      INTO v_ok;
  END IF;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'el sujeto % no pertenece a la institución %', p_subject_id, p_institution_id;
  END IF;

  IF v_from = p_to_status THEN
    RAISE EXCEPTION 'el sujeto ya está en %: no hay nada que corroborar', v_from;
  END IF;

  -- La máquina, impuesta por la base.
  IF NOT (
       (v_from = 'unverified'   AND p_to_status IN ('corroborated','disputed'))
    OR (v_from = 'corroborated' AND p_to_status = 'disputed')
    OR (v_from = 'disputed'     AND p_to_status = 'corroborated')
    OR (v_from = 'official'     AND p_to_status = 'disputed')
  ) THEN
    RAISE EXCEPTION 'transición de procedencia inválida: % → %', v_from, p_to_status;
  END IF;

  INSERT INTO provenance_corroboration (
    institution_id, subject_table, subject_id, from_status, to_status,
    source_type, source_ref, reason, corroborated_by
  ) VALUES (
    p_institution_id, p_subject_table, p_subject_id, v_from, p_to_status,
    p_source_type, p_source_ref, p_reason, p_corroborated_by
  )
  RETURNING id INTO v_id;

  EXECUTE format('UPDATE %I SET verification_status = $1 WHERE id = $2', p_subject_table)
    USING p_to_status, p_subject_id;

  RETURN QUERY SELECT v_id, v_from, p_to_status;
END;
$$;

REVOKE ALL ON FUNCTION public.corroborar_procedencia FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.corroborar_procedencia TO service_role;

COMMENT ON FUNCTION public.corroborar_procedencia IS
  'I9: la única forma de mover un verification_status. Append-only, con fuente concreta, y official inalcanzable (C01-030).';
