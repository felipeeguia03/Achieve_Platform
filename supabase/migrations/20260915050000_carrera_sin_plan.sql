-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.14.5 — la carrera que existe y todavía no tiene plan
--
-- `catalogo_ofrecible()` listaba **sólo carreras con plan publicado**, y con eso
-- el estado honesto *"Todavía no tenemos el plan de esta carrera"* quedaba
-- inalcanzable: una carrera sin plan simplemente no aparecía.
--
-- Y no aparecer es peor que aparecer sin plan. El estudiante busca la suya, no
-- la encuentra, y concluye que Achieve no cubre su universidad — cuando lo que
-- pasa es que **todavía no cargamos su plan**, que es una frase que sí se puede
-- decir y que además dice cuándo va a cambiar.
--
-- ⚠️ **La institución sigue filtrada.** Se listan las carreras de una
-- institución que ya tiene al menos un plan publicado; una institución entera
-- sin nada publicado no se ofrece. Elegir universidad y carrera de una
-- institución real es `C01-042`, y [ADR-006](../../docs/decisions.md#adr-006) §5
-- dice que no se puede adelantar.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.catalogo_ofrecible()
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(x ORDER BY x->>'nombre'), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'institucionId', i.id,
      'nombre', i.name,
      'carreras', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
                 'carreraId', ap.id,
                 'nombre', ap.name,
                 'facultad', au.name,
                 -- Si es `false`, la pantalla dice que todavía no tenemos el
                 -- plan y **no sigue**. No se inventan materias.
                 'tienePlan', EXISTS (
                   SELECT 1 FROM curriculum_plan cp
                    WHERE cp.program_id = ap.id AND cp.publication_status = 'PUBLISHED')
               ) ORDER BY ap.name), '[]'::jsonb)
          FROM academic_program ap
          LEFT JOIN academic_unit au ON au.id = ap.academic_unit_id
         WHERE ap.institution_id = i.id
           -- El contenedor centinela de `ingerir_materia()` no es una carrera
           -- que nadie elija: no se ofrece.
           AND ap.name <> 'Sin programa declarado'
      )
    ) AS x
    FROM institution i
   WHERE EXISTS (
     SELECT 1 FROM academic_program ap2
       JOIN curriculum_plan cp2 ON cp2.program_id = ap2.id
      WHERE ap2.institution_id = i.id AND cp2.publication_status = 'PUBLISHED')
  ) s;
$$;

COMMENT ON FUNCTION public.catalogo_ofrecible() IS
  'Instituciones con al menos un plan publicado, y TODAS sus carreras — con `tienePlan` '
  'diciendo cuáles se pueden cursar. Una carrera sin plan se muestra y no se puede elegir; '
  'ocultarla haría creer que Achieve no cubre esa universidad (ADR-052).';
