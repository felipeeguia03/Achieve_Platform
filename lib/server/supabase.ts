import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * El único punto del código donde se construye un cliente con `service_role`.
 *
 * `import "server-only"` no es decorativo: hace que el build **falle** si algún
 * componente de cliente importa este módulo, aunque sea por accidente a través
 * de una cadena de imports. ADR-005 fija que `service_role` vive únicamente en
 * el backend, y una regla que depende de que nadie se equivoque no es una regla.
 *
 * **`service_role` saltea RLS.** Eso es deliberado y es la razón por la que la
 * autorización real vive en Service: RLS es el cierre de la superficie
 * autoexpuesta de Supabase, no la autorización primaria
 * ([`architecture.md`](../../docs/architecture.md) §3.6).
 */
let cliente: SupabaseClient | null = null;

export function clienteDeServicio(): SupabaseClient {
  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Falla temprano y con nombre. Una clave ausente que se descubre como un 500
  // en la primera request es media hora de depuración por una línea de env.
  if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL. Ver .env.local.example");
  if (!clave) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY. Ver .env.local.example");

  cliente = createClient(url, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}
