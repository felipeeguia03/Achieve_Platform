-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B1.6 — correspondencia de instituciones con el CRM
--
-- ADR-005, ítem 6, cerrado el 30 de agosto de 2026: **tabla de correspondencia**,
-- no identidad compartida.
--
-- Plataforma es dueña de `institution.id`. El UUID que devuelve el CRM es una
-- identidad **externa** y se traduce acá — el mismo criterio que
-- `data-model.md` §6.1 ya fija para el estudiante: *"`studentId` de la
-- respuesta de CRM es una identidad externa distinta… nunca reemplaza
-- `student.id`"*.
--
-- Y el contrato lo respalda: *"cada uno tiene su propio proyecto Supabase…
-- nadie toca la base del otro"*. Compartir la PK del tenant sería la versión
-- silenciosa de compartir base.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE institution_crm_ref (
  -- La institución de Plataforma. Uno a uno: una institución tiene a lo sumo
  -- una contraparte en el CRM.
  institution_id     UUID PRIMARY KEY REFERENCES institution(id) ON DELETE RESTRICT,
  -- El `institutionId` que devuelve `POST /api/service/v1/authorize`.
  crm_institution_id UUID NOT NULL UNIQUE,
  -- Quién y cuándo la dio de alta. El alta es manual (ADR-005 ítem 6), así que
  -- siempre hay alguien detrás.
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by         TEXT
);

COMMENT ON TABLE institution_crm_ref IS
  'Traducción CRM → Plataforma. El alta es manual: una institución desconocida NO se crea sola (ADR-005 ítem 6).';

ALTER TABLE institution_crm_ref ENABLE ROW LEVEL SECURITY;

/**
 * Traduce el `institutionId` del CRM al de Plataforma.
 *
 * Devuelve `NULL` si no hay correspondencia — y ese `NULL` **no se resuelve
 * creando la institución**: dar de alta una institución es firmar un convenio,
 * no un efecto secundario de un login. El Service lo convierte en un rechazo
 * explícito y lo deja registrado para que alguien la dé de alta a mano.
 */
CREATE OR REPLACE FUNCTION public.institucion_de_crm(p_crm_institution_id UUID)
RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT institution_id FROM institution_crm_ref WHERE crm_institution_id = p_crm_institution_id;
$$;

GRANT EXECUTE ON FUNCTION public.institucion_de_crm TO service_role;
