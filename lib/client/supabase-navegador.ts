import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * El cliente de Supabase **del navegador**. Etapa B2.6.
 *
 * Usa la clave `anon` y sirve para **una sola cosa: Auth**. Es la frontera que
 * `AGENTS.md` §6 y [ADR-005](../../docs/decisions.md#adr-005) fijan — *Supabase
 * del lado cliente se limita a Auth y Realtime Broadcast: nunca
 * `supabase.from(...)` ni Postgres Changes sobre datos de negocio*.
 *
 * Los datos de negocio viajan por `/api/*`, con el token que sale de acá en el
 * header. Que la clave `anon` no alcance ninguna tabla no es un accidente
 * afortunado: `db:verify` lo comprueba en cada corrida.
 *
 * **No importa `lib/server/supabase.ts`** y no puede: ese módulo tiene
 * `import "server-only"` y construye el cliente con `service_role`.
 */
let cliente: SupabaseClient | null = null;

export function clienteDeNavegador(): SupabaseClient {
  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Mismo criterio que el cliente de servicio: fallar temprano y con nombre.
  // Una clave ausente que aparece como un 401 silencioso es exactamente el bug
  // que esta etapa vino a arreglar.
  if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL. Ver .env.local.example");
  if (!clave) throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY. Ver .env.local.example");

  cliente = createClient(url, clave, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return cliente;
}
