import type { RepositorioDeIdentidad } from "../repositorios/identidad";

/**
 * Service de sesión: resuelve **quién** hace la request y con qué alcance
 * institucional.
 *
 * **No conoce la persistencia ni el proveedor de auth.** Recibe los dos por
 * inyección, como pide §3.2. Antes importaba el cliente de Supabase
 * directamente — lo cazó `tests/frontera-backend.test.ts`, no una relectura.
 *
 * El scoping institucional nace acá: `institutionId` sale del `student` de la
 * base y **nunca** de algo que mande el cliente.
 */
export interface EstudianteDeSesion {
  id: string;
  institutionId: string;
  timezone: string;
}

export interface RepositorioDeEstudiantes {
  porIdentidadDeAuth(authUserId: string): Promise<EstudianteDeSesion | null>;
}

export type ResultadoDeSesion =
  | { estado: "OK"; estudiante: EstudianteDeSesion }
  /** Token ausente, vencido o inválido. */
  | { estado: "NO_AUTENTICADO" }
  /**
   * Identidad válida, sin `student` en el padrón. **No es 401 ni un error del
   * sistema:** es el caso que `student.auth_user_id NULL` admite a propósito, y
   * quién puede darse de alta lo decide el contrato de elegibilidad.
   */
  | { estado: "SIN_PADRON"; authUserId: string };

export async function resolverSesion(
  deps: { identidad: RepositorioDeIdentidad; estudiantes: RepositorioDeEstudiantes },
  token: string | null,
): Promise<ResultadoDeSesion> {
  if (!token) return { estado: "NO_AUTENTICADO" };

  const usuario = await deps.identidad.usuarioDeToken(token);
  if (!usuario) return { estado: "NO_AUTENTICADO" };

  const estudiante = await deps.estudiantes.porIdentidadDeAuth(usuario.authUserId);
  if (!estudiante) return { estado: "SIN_PADRON", authUserId: usuario.authUserId };

  return { estado: "OK", estudiante };
}
