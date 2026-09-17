import "server-only";

import type { EstadoDelDia, RepositorioDeHoy } from "../servicios/proyeccion-hoy";
import { clienteDeServicio } from "../supabase";

/**
 * Lee el estado del día de un estudiante. Una sola función de base: la
 * proyección de `UX01` mira Action, Commitment, Evidence y materias a la vez, y
 * cuatro viajes darían una foto inconsistente entre sí.
 */
export const hoyReal: RepositorioDeHoy = {
  async estadoDelDia(institutionId, studentId, ahora) {
    const { data, error } = await clienteDeServicio().rpc("estado_del_dia", {
      p_institution_id: institutionId,
      p_student_id: studentId,
      p_ahora: ahora,
    });
    if (error) throw new Error(`No se pudo leer el día: ${error.message}`);
    return (data as EstadoDelDia | null) ?? null;
  },
};
