-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B1.3 — privilegios de tabla, explícitos
--
-- Encontrado al probar `/api/sesion` de punta a punta: el endpoint devolvía 500
-- con "permission denied for table student". Las tablas creadas por las
-- migraciones no llevaban GRANT para `service_role`, que es el rol con el que
-- entra el backend.
--
-- **Se declara el GRANT en vez de confiar en los privilegios por defecto.** Un
-- privilegio heredado de una configuración del proveedor es un privilegio que
-- nadie revisó, y el día que cambie el default el fallo aparece en producción.
--
-- `anon` y `authenticated` **no reciben nada, y es la decisión**: el frontend
-- nunca lee ni escribe tablas de negocio (`architecture.md` §3.2). Si alguna
-- vez una de esas dos aparece con privilegios sobre una tabla de dominio, es un
-- agujero, no una comodidad.
-- ─────────────────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Que la regla valga también para las tablas que todavía no existen.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

-- ── Verificable, como el deny-by-default ─────────────────────────────────────
--
-- Dos funciones simétricas: una comprueba que el backend PUEDE entrar, la otra
-- que el frontend NO. Sin la segunda, agregar un GRANT de más pasa inadvertido.

CREATE OR REPLACE FUNCTION public.tablas_sin_acceso_de_servicio()
RETURNS TABLE (nombre TEXT)
LANGUAGE sql STABLE AS $$
  SELECT c.relname::TEXT
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND NOT has_table_privilege('service_role', c.oid, 'SELECT');
$$;

CREATE OR REPLACE FUNCTION public.tablas_expuestas_al_cliente()
RETURNS TABLE (nombre TEXT, rol TEXT)
LANGUAGE sql STABLE AS $$
  SELECT c.relname::TEXT, r.rolname::TEXT
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN (SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated')) r
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND has_table_privilege(r.rolname, c.oid, 'SELECT');
$$;

COMMENT ON FUNCTION public.tablas_expuestas_al_cliente() IS
  'Debe devolver cero filas: el frontend no toca tablas de negocio (architecture.md §3.2).';
