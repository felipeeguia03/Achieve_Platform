-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Administrar cuenta — ADR-097 · Enmienda 2
--
-- Pedida por el owner el 13 de septiembre de 2026, con capturas del software de
-- referencia: perfil (foto, nombre, apellido), contraseña y dispositivos activos.
--
-- ⛔ **Sin tablas de negocio.** El nombre y el apellido van en
-- `auth.users.raw_user_meta_data` —los escribe el propio estudiante por Auth—, y
-- la foto en un bucket privado. Nada de esto lo lee el dominio.
--
-- ⛔ **Sin agregar correos ni eliminar la cuenta.** Quién entra lo decide el
-- padrón del CRM por email (ADR-039), y el borrado espera a ADR-006.
-- ─────────────────────────────────────────────────────────────────────────────

-- La foto de perfil. Privada, igual que `evidencia`: se lee con URL firmada que
-- emite el backend. El límite y los tipos los hace cumplir Storage, no el
-- navegador.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'foto-de-perfil', 'foto-de-perfil', false, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Las sesiones de Auth de UNA identidad, para «Dispositivos activos».
--
-- `auth` no está expuesto por PostgREST, así que se lee con `SECURITY DEFINER`
-- y sólo lo ejecuta `service_role`. El `user_id` lo pone el backend a partir del
-- token verificado, nunca el navegador.
CREATE OR REPLACE FUNCTION public.sesiones_de_auth(p_user_id UUID)
RETURNS TABLE (
  id          UUID,
  user_agent  TEXT,
  ip          TEXT,
  creada_en   TIMESTAMPTZ,
  ultimo_uso  TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT s.id,
         s.user_agent,
         host(s.ip),
         s.created_at,
         GREATEST(s.updated_at, s.refreshed_at AT TIME ZONE 'UTC', s.created_at)
    FROM auth.sessions s
   WHERE s.user_id = p_user_id
     AND (s.not_after IS NULL OR s.not_after > now())
   ORDER BY 5 DESC;
$$;

REVOKE ALL ON FUNCTION public.sesiones_de_auth FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sesiones_de_auth TO service_role;

-- Cierra una sesión de esa identidad. Borrar la fila revoca sus refresh tokens
-- (`ON DELETE CASCADE`): el dispositivo queda afuera cuando vence su access token.
CREATE OR REPLACE FUNCTION public.cerrar_sesion_de_auth(p_user_id UUID, p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH borrada AS (
    DELETE FROM auth.sessions
     WHERE id = p_session_id
       AND user_id = p_user_id
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM borrada);
$$;

REVOKE ALL ON FUNCTION public.cerrar_sesion_de_auth FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cerrar_sesion_de_auth TO service_role;
