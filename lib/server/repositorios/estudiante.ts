import "server-only";

import { clienteDeServicio } from "../supabase";

/**
 * Repository de `student`. **Única capa que toca Postgres** para esta entidad
 * ([`architecture.md`](../../../docs/architecture.md) §3.2). No decide permisos
 * ni transiciones: traduce filas a objetos de dominio y nada más.
 */
export interface EstudianteDeSesion {
  id: string;
  institutionId: string;
  timezone: string;
}

/**
 * Busca el estudiante ligado a una identidad de auth.
 *
 * `null` es una respuesta legítima y no un error: `student.auth_user_id` admite
 * `NULL`, así que existe el caso de una identidad de auth sin estudiante del
 * padrón. Quién puede darse de alta lo decide el contrato de elegibilidad, no
 * este repositorio.
 *
 * **No selecciona `whatsapp`.** Es dato personal gateado por ADR-006, y la
 * forma más barata de no filtrarlo es no leerlo.
 */
export async function porIdentidadDeAuth(authUserId: string): Promise<EstudianteDeSesion | null> {
  const { data, error } = await clienteDeServicio()
    .from("student")
    .select("id, institution_id, timezone")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer student: ${error.message}`);
  if (!data) return null;

  return { id: data.id, institutionId: data.institution_id, timezone: data.timezone };
}
