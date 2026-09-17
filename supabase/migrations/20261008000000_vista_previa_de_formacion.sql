-- Achieve Platform · Fase B6.27 — la vista previa de Formación, para la demo.
--
-- [ADR-087](../../docs/decisions.md#adr-087) Enmienda 3.
--
-- ⚠️ **No reemplaza a `biblioteca_de_formacion()`, y no la toca.** Ésa sigue
-- siendo la única lectura del camino real, y sigue devolviendo sólo `PUBLISHED`
-- (`D5`). Ésta existe para que la demo **pueda ver** las piezas de la autora
-- mientras están en borrador, y la llama `formacionDe()` sólo con
-- `MODO_PRUEBA=1`.
--
-- ⚠️ **No publica nada.** Devuelve cada pieza **con** su estado de publicación,
-- para que la pantalla la rotule «Borrador». `publication_status` no se escribe.
--
-- ⚠️ **Nunca devuelve `RETIRED`.** Una pieza retirada lo fue por una razón, y
-- una demo no es motivo para mostrarla.
--
-- ⚠️ **No clasifica al estudiante** (`D1`): no recibe estudiante, y no lee
-- evidencias, compromisos, progreso ni cursadas.

CREATE OR REPLACE FUNCTION public.vista_previa_de_formacion()
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'piezas', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', f.id,
               'codigo', f.code,
               'titulo', f.title,
               'problema', f.problem,
               'objetivo', f.objective,
               'explicacion', f.explanation,
               'accionPosterior', f.next_action,
               'evidenciaEsperada', f.expected_evidence,
               'material', f.material,
               'fuente', f.source_type,
               'verificacion', f.verification_status,
               'publicacion', f.publication_status)
               ORDER BY f.sequence NULLS LAST, f.code)
        FROM formative_content f
       WHERE f.publication_status IN ('DRAFT', 'PUBLISHED')), '[]'::jsonb)
  );
$$;

COMMENT ON FUNCTION public.vista_previa_de_formacion IS
  'Vista previa de Formación para la demo (ADR-087 Enmienda 3). DRAFT y PUBLISHED, nunca RETIRED, '
  'con su estado para rotularlo. No publica. Sólo service_role, y sólo la llama MODO_PRUEBA=1.';

-- ⚠️ **Sólo `service_role`.** A diferencia de la biblioteca, `authenticated` no
-- la ejecuta: un estudiante con su token no puede leer borradores por PostgREST.
REVOKE ALL ON FUNCTION public.vista_previa_de_formacion FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vista_previa_de_formacion TO service_role;
