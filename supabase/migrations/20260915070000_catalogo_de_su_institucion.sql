-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.14.7 — el alta ofrece la institución del estudiante
--
-- [ADR-052](../../docs/decisions.md#adr-052). Encontrado recorriendo el alta a
-- mano: el selector ofrecía **todas** las instituciones con plan publicado, y
-- elegir una distinta de la suya terminaba en un `404` que la pantalla mostraba
-- como *"No pudimos guardar tu respuesta. Probá de nuevo en un momento"*.
--
-- **Dos cosas mal, y la segunda es peor.** Ofrecer algo que siempre falla, y
-- después mentir sobre por qué: reintentar no iba a funcionar nunca.
--
-- `student.institution_id` **lo fija el padrón** y es la raíz del aislamiento
-- institucional: un estudiante pertenece a una institución y no puede elegir
-- otra. Así que la pregunta *"¿dónde estudiás?"* no es una pregunta — es un dato
-- que ya tenemos. Se muestra para confirmar, como la facultad y como el plan.
--
-- Es la misma regla que el alta ya venía aplicando dos veces: **no se agrega un
-- paso que el sistema puede contestar solo.**
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.catalogo_ofrecible();

CREATE OR REPLACE FUNCTION public.catalogo_ofrecible(p_institution_id UUID)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'institucionId', i.id,
    'nombre', i.name,
    'carreras', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
               'carreraId', ap.id,
               'nombre', ap.name,
               'facultad', au.name,
               -- `false` ⇒ la carrera existe y **todavía no tiene plan
               -- publicado**. Se muestra y no se sigue: ocultarla haría creer
               -- que Achieve no cubre esa carrera.
               'tienePlan', EXISTS (
                 SELECT 1 FROM curriculum_plan cp
                  WHERE cp.program_id = ap.id AND cp.publication_status = 'PUBLISHED')
             ) ORDER BY ap.name), '[]'::jsonb)
        FROM academic_program ap
        LEFT JOIN academic_unit au ON au.id = ap.academic_unit_id
       WHERE ap.institution_id = i.id
         AND ap.name <> 'Sin programa declarado'
    )
  )
  FROM institution i
  WHERE i.id = p_institution_id;
$$;

COMMENT ON FUNCTION public.catalogo_ofrecible IS
  'Las carreras de LA institución del estudiante — la del padrón, que sale de la sesión y '
  'nunca del request. Ofrecer otra sería ofrecer algo que el aislamiento institucional va a '
  'rechazar siempre (ADR-052).';

REVOKE ALL ON FUNCTION public.catalogo_ofrecible FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.catalogo_ofrecible TO service_role;
