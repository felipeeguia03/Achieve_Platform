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
