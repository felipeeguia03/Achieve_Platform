-- Achieve Platform · Fase B6.25 — la lectura de la biblioteca de Formación.
--
-- [ADR-087](../../docs/decisions.md#adr-087).
--
-- ⚠️ **Sólo lo `PUBLISHED` sale de acá.** `D5`: el contenido queda fuera de
-- producción hasta que la psicopedagoga confirme su vigencia. El filtro está en
-- la función y no en la proyección **a propósito**: una capa de arriba que se
-- olvide de filtrar no puede exponer lo que la base nunca le mandó.
--
-- ⚠️ **No clasifica al estudiante, y no puede.** `D1` prohíbe proxies, puntajes
-- y umbrales mientras no exista el Student Model. Esta función **no lee
-- evidencias, ni compromisos, ni tiempo de uso**: la biblioteca es la misma para
-- todos, y eso es la decisión, no una simplificación.
--
-- ⚠️ **No mira NADA del estudiante, y por eso recibe su id sin usarlo para
-- filtrar contenido.** V1 es de solo lectura: la biblioteca es idéntica para
-- todos y **se lee aunque no haya ninguna cursada** (`D2`, Enmienda 2 E2.3).
-- La elegibilidad de cursadas pertenece a la vertical de aplicación (V2).

CREATE OR REPLACE FUNCTION public.biblioteca_de_formacion(
  p_institution_id UUID,
  p_student_id     UUID
) RETURNS JSONB
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
               -- `NULL` = la pieza no declara material. La línea desaparece.
               'material', f.material,
               -- Procedencia, junto al dato (product.md §7). **No se traduce
               -- acá**: `provenanceVisible()` es el único traductor.
               'fuente', f.source_type,
               'verificacion', f.verification_status)
               ORDER BY f.sequence NULLS LAST, f.code)
        FROM formative_content f
       WHERE f.publication_status = 'PUBLISHED'), '[]'::jsonb)
  )
  FROM student s
 WHERE s.id = p_student_id AND s.institution_id = p_institution_id;
$$;

COMMENT ON FUNCTION public.biblioteca_de_formacion IS
  'La biblioteca de Formación (ADR-087). Sólo piezas PUBLISHED. No clasifica al estudiante: D1 '
  'prohíbe proxies mientras no exista el Student Model. V1 es de solo lectura: no devuelve cursadas.';

REVOKE ALL ON FUNCTION public.biblioteca_de_formacion FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.biblioteca_de_formacion TO authenticated, service_role;
