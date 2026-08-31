import "server-only";

import type { EstadoDeProgreso, RepositorioDeProgreso } from "../servicios/proyeccion-progreso";
import { clienteDeServicio } from "../supabase";

/**
 * Lectura de `UX06`.
 *
 * Una sola llamada, como las otras cuatro superficies de la B2.6: la pantalla
 * mira evidencia, resultado de progreso, dimensiones e historial a la vez, y
 * varias lecturas dan una foto inconsistente entre sí.
 */
export const progresoLecturaReal: RepositorioDeProgreso = {
  async estadoDeProgreso(institutionId, studentId, ahora, evidenceId = null) {
    const { data, error } = await clienteDeServicio().rpc("estado_de_progreso", {
      p_institution_id: institutionId,
      p_student_id: studentId,
      p_ahora: ahora,
      p_evidence_id: evidenceId,
    });
    if (error) throw new Error(`No se pudo leer el progreso: ${error.message}`);
    return (data as EstadoDeProgreso | null) ?? null;
  },
};
