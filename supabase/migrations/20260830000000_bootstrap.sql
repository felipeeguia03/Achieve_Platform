-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B1.1 — bootstrap
--
-- Establece las convenciones de `docs/data-model.md` §6 como código ejecutable,
-- para que no vivan sólo en un markdown. NO crea tablas de dominio: la capa
-- académica es la B1.2.
--
-- Habilitado por ADR-005 (Bloque A, `ACCEPTED` 30 ago 2026).
-- ⚠️ ADR-006 sigue `PENDING`: este entorno corre SÓLO con datos sintéticos.
-- ─────────────────────────────────────────────────────────────────────────────

-- `gen_random_uuid()` es nativa desde PG13, pero data-model.md §6 la nombra
-- explícitamente: se declara la extensión para que la convención no dependa de
-- qué versión de Postgres levante el proveedor.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Convención: `updated_at` en toda tabla mutable ───────────────────────────
--
-- Va en un trigger y no en el Repository a propósito, y no contradice la regla
-- de ADR-005 de no poner reglas de negocio en la base: esto no es una regla de
-- negocio, es un invariante de plomería que tiene que valer **sin importar qué
-- camino de código escribió**. En el Repository, un método que se olvide de
-- tocarlo produce un timestamp falso en silencio.
--
-- Cada tabla mutable la engancha explícitamente. No hay magia que la aplique
-- sola: una tabla sin su trigger es un error visible en la migración, no una
-- omisión silenciosa.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
  'Plomería de auditoría, no regla de negocio (ADR-005). Engancharla explícitamente por tabla.';

-- ── RLS deny-by-default, verificable ─────────────────────────────────────────
--
-- data-model.md §6: "Todas las tablas quedan con RLS deny-by-default para
-- cerrar la superficie autoexpuesta de Supabase. El backend usa `service_role`,
-- por lo que autorización y scoping siguen siendo responsabilidad de
-- Controller/Service/Repository."
--
-- RLS es el CIERRE, no la autorización primaria. Esta función existe para que
-- "todas las tablas" sea una afirmación que se pueda comprobar en vez de una
-- que se confía: devuelve las tablas de `public` que NO tienen RLS. Un test la
-- consulta y falla si devuelve algo.
CREATE OR REPLACE FUNCTION public.tablas_sin_rls()
RETURNS TABLE (nombre TEXT)
LANGUAGE sql
STABLE
AS $$
  SELECT c.relname::TEXT
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND NOT c.relrowsecurity
    AND c.relname NOT LIKE 'pg_%';
$$;

COMMENT ON FUNCTION public.tablas_sin_rls() IS
  'Verifica el deny-by-default de data-model.md §6. Debe devolver cero filas.';
