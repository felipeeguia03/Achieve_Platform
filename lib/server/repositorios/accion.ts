import "server-only";

import type { ActionStatus } from "@/lib/domain/types";
import type { Accion, RepositorioDeAcciones } from "../servicios/accion";
import { clienteDeServicio } from "../supabase";

/**
 * Repository de `action`. Mismo contrato que el de `commitment`: lectura con
 * scoping en el `WHERE` y escritura con compare-and-swap.
 */
const COLUMNAS = "id, institution_id, course_enrollment_id, status";

function aDominio(f: Record<string, unknown>): Accion {
  return {
    id: f.id as string,
    institutionId: f.institution_id as string,
    courseEnrollmentId: f.course_enrollment_id as string,
    state: f.status as ActionStatus,
  };
}

export const accionesReal: RepositorioDeAcciones = {
  async porId(institutionId, id) {
    const { data, error } = await clienteDeServicio()
      .from("action")
      .select(COLUMNAS)
      .eq("institution_id", institutionId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer action: ${error.message}`);
    return data ? aDominio(data) : null;
  },

  async cambiarEstadoSi(institutionId, id, esperado, nuevo, columnas = {}) {
    const { data, error } = await clienteDeServicio()
      .from("action")
      // `status` en la base, `state` en el dominio: la traducción es trabajo
      // del Repository, no del Service.
      .update({ status: nuevo, ...columnas })
      .eq("institution_id", institutionId)
      .eq("id", id)
      .eq("status", esperado)
      .select(COLUMNAS)
      .maybeSingle();
    if (error) throw new Error(`No se pudo actualizar action: ${error.message}`);
    return data ? aDominio(data) : null;
  },
};
