import type { RepositorioDeIdentidad } from "../repositorios/identidad";
import type { EstadoDelAlta } from "./alta";

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
  /**
   * `alta` viaja con la sesión — Etapa B6.14.4,
   * [ADR-052](../../../docs/decisions.md#adr-052).
   *
   * **Va acá y no en cada Controller** porque es la misma pregunta para las
   * nueve superficies, y resolverla nueve veces sería nueve lugares donde
   * olvidarse. Lo que cada Controller decide es qué hacer con ella: las nueve
   * devuelven `409`; las rutas del propio alta no, o el estudiante no podría
   * completarla nunca.
   */
  | { estado: "OK"; estudiante: EstudianteDeSesion; alta: EstadoDelAlta }
  /** Token ausente, vencido o inválido. */
  | { estado: "NO_AUTENTICADO" }
  /**
   * Identidad válida, sin `student` en el padrón. **No es 401 ni un error del
   * sistema:** es el caso que `student.auth_user_id NULL` admite a propósito, y
   * quién puede darse de alta lo decide el contrato de elegibilidad.
   */
  | { estado: "SIN_PADRON"; authUserId: string };

export async function resolverSesion(
  deps: {
    identidad: RepositorioDeIdentidad;
    estudiantes: RepositorioDeEstudiantes;
    /** Cómo se lee el estado del alta. Inyectado, como todo lo demás (§3.2). */
    alta: (institutionId: string, studentId: string) => Promise<EstadoDelAlta>;
  },
  token: string | null,
): Promise<ResultadoDeSesion> {
  if (!token) return { estado: "NO_AUTENTICADO" };

  const usuario = await deps.identidad.usuarioDeToken(token);
  if (!usuario) return { estado: "NO_AUTENTICADO" };

  const estudiante = await deps.estudiantes.porIdentidadDeAuth(usuario.authUserId);
  if (!estudiante) return { estado: "SIN_PADRON", authUserId: usuario.authUserId };

  const alta = await deps.alta(estudiante.institutionId, estudiante.id);
  return { estado: "OK", estudiante, alta };
}
