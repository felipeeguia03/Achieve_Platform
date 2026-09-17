import "server-only";

import { clienteDeServicio } from "../supabase";

/**
 * Acceso al proveedor de auth. Vive con los Repositories porque es
 * infraestructura: el Service no tiene por qué saber que la identidad la
 * verifica Supabase (§3.2).
 */
export interface RepositorioDeIdentidad {
  /** `null` si el token es inválido, vencido o desconocido. */
  usuarioDeToken(token: string): Promise<{ authUserId: string } | null>;
}

export const identidadReal: RepositorioDeIdentidad = {
  async usuarioDeToken(token) {
    // La firma y el vencimiento los comprueba el proveedor. No se decodifica el
    // JWT a mano: un `atob` del payload lee claims sin verificar nada, y es el
    // error clásico que convierte un token falsificado en sesión.
    const { data, error } = await clienteDeServicio().auth.getUser(token);
    if (error || !data.user) return null;
    return { authUserId: data.user.id };
  },
};

/**
 * La identidad **y la sesión** del token — para «Dispositivos activos»
 * ([ADR-097 · Enmienda 2](../../../docs/decisions.md#adr-097-enmienda-2)).
 *
 * El claim `session_id` se lee **después** de que el proveedor verificó el
 * token: sin esa verificación, decodificarlo sería creerle a cualquiera.
 */
export async function identidadYSesionDeToken(
  token: string,
): Promise<{ authUserId: string; sesionId: string | null } | null> {
  const usuario = await identidadReal.usuarioDeToken(token);
  if (!usuario) return null;
  let sesionId: string | null = null;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")) as {
      session_id?: unknown;
    };
    if (typeof payload.session_id === "string") sesionId = payload.session_id;
  } catch {
    sesionId = null;
  }
  return { ...usuario, sesionId };
}
