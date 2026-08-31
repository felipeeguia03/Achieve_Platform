import "server-only";

import type { EstadoDeAccion, RepositorioDeAccion } from "../servicios/proyeccion-accion";
import { clienteDeServicio } from "../supabase";

/**
 * Lectura de `UX03`. Separado de `repositorios/accion.ts`, que es el de
 * **mutación**: leer para proyectar y escribir una transición son dos
 * responsabilidades, y mezclarlas fue lo que en la `B2.1` hizo falta extraer.
 */
export const accionLecturaReal: RepositorioDeAccion = {
  async estadoDeAccion(institutionId, studentId, ahora, actionId = null) {
    const { data, error } = await clienteDeServicio().rpc("estado_de_accion", {
      p_institution_id: institutionId,
      p_student_id: studentId,
      p_ahora: ahora,
      p_action_id: actionId,
    });
    if (error) throw new Error(`No se pudo leer la acción: ${error.message}`);
    return (data as EstadoDeAccion | null) ?? null;
  },
};
