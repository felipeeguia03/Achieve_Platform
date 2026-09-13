import "server-only";

import { clienteDeServicio } from "../supabase";

/**
 * La cuenta de Auth del estudiante — [ADR-097 · Enmienda 2](../../../docs/decisions.md#adr-097-enmienda-2).
 *
 * Tres cosas y ninguna de negocio: **la foto de perfil**, **las sesiones
 * abiertas** y **cerrar una**. El nombre y la contraseña no pasan por acá: los
 * escribe el navegador contra Auth, que es lo único que el cliente de Supabase
 * del navegador puede tocar (ADR-005).
 *
 * ⚠️ **El `authUserId` sale siempre del token verificado.** Si el navegador lo
 * mandara, podría leer o cerrar las sesiones de otra persona.
 */
const BUCKET = "foto-de-perfil";

/** Cinco minutos, como la evidencia: alcanza para subir, no para compartir. */
const SEGUNDOS_DE_FIRMA = 300;

export interface SesionDeAuth {
  id: string;
  userAgent: string | null;
  ip: string | null;
  ultimoUso: string;
}

export interface RepositorioDeCuentaDeAuth {
  sesiones(authUserId: string): Promise<SesionDeAuth[]>;
  cerrarSesion(authUserId: string, sesionId: string): Promise<boolean>;
  firmarSubidaDeFoto(authUserId: string): Promise<{ url: string }>;
  firmarLecturaDeFoto(authUserId: string): Promise<string | null>;
}

/** Una sola foto por identidad, y la clave no la elige el cliente. */
const claveDeFoto = (authUserId: string) => `${authUserId}/foto`;

export const cuentaDeAuthReal: RepositorioDeCuentaDeAuth = {
  async sesiones(authUserId) {
    const { data, error } = await clienteDeServicio().rpc("sesiones_de_auth", { p_user_id: authUserId });
    if (error) throw new Error(`No se pudieron leer las sesiones: ${error.message}`);
    return ((data ?? []) as { id: string; user_agent: string | null; ip: string | null; ultimo_uso: string }[]).map(
      (s) => ({ id: s.id, userAgent: s.user_agent, ip: s.ip, ultimoUso: s.ultimo_uso }),
    );
  },

  async cerrarSesion(authUserId, sesionId) {
    const { data, error } = await clienteDeServicio().rpc("cerrar_sesion_de_auth", {
      p_user_id: authUserId,
      p_session_id: sesionId,
    });
    if (error) throw new Error(`No se pudo cerrar la sesión: ${error.message}`);
    return data === true;
  },

  async firmarSubidaDeFoto(authUserId) {
    const { data, error } = await clienteDeServicio()
      .storage.from(BUCKET)
      .createSignedUploadUrl(claveDeFoto(authUserId), { upsert: true });
    if (error) throw new Error(`No se pudo firmar la subida: ${error.message}`);
    return { url: data.signedUrl };
  },

  async firmarLecturaDeFoto(authUserId) {
    // Sin foto cargada Storage contesta «no encontrado»: eso es `null`, no un error.
    const { data, error } = await clienteDeServicio()
      .storage.from(BUCKET)
      .createSignedUrl(claveDeFoto(authUserId), SEGUNDOS_DE_FIRMA);
    if (error) return null;
    return data.signedUrl;
  },
};
