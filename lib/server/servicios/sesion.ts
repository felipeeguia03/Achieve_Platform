import "server-only";

import { clienteDeServicio } from "../supabase";
import { porIdentidadDeAuth, type EstudianteDeSesion } from "../repositorios/estudiante";

/**
 * Service de sesión: resuelve **quién** hace la request y con qué alcance
 * institucional. No lee headers —eso es del Controller— ni escribe SQL —eso es
 * del Repository—.
 *
 * El scoping institucional nace acá: `institutionId` sale del `student` de la
 * base y **nunca** de algo que mande el cliente. Aceptar un `institutionId` del
 * request sería regalar el aislamiento que Parte I §29 exige.
 */
export type ResultadoDeSesion =
  | { estado: "OK"; estudiante: EstudianteDeSesion }
  /** Token ausente, vencido o inválido. */
  | { estado: "NO_AUTENTICADO" }
  /**
   * Identidad de auth válida, pero sin `student` en el padrón. **No es 401 ni
   * un error del sistema:** es el caso que `student.auth_user_id NULL` admite a
   * propósito, y quién puede darse de alta lo decide el contrato de
   * elegibilidad (`platform-integration-contract.md`), no esta capa.
   */
  | { estado: "SIN_PADRON"; authUserId: string };

export async function resolverSesion(tokenBearer: string | null): Promise<ResultadoDeSesion> {
  if (!tokenBearer) return { estado: "NO_AUTENTICADO" };

  // La verificación de firma y vencimiento la hace el proveedor de auth. No se
  // decodifica el JWT a mano: un `atob` del payload lee claims sin comprobar
  // nada, y es el error clásico que convierte un token falsificado en sesión.
  const { data, error } = await clienteDeServicio().auth.getUser(tokenBearer);
  if (error || !data.user) return { estado: "NO_AUTENTICADO" };

  const estudiante = await porIdentidadDeAuth(data.user.id);
  if (!estudiante) return { estado: "SIN_PADRON", authUserId: data.user.id };

  return { estado: "OK", estudiante };
}
