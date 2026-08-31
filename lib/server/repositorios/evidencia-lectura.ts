import "server-only";

import type { EstadoDeEvidencia, RepositorioDeEvidencia } from "../servicios/proyeccion-evidencia";
import { clienteDeServicio } from "../supabase";

/**
 * Lectura de `UX05`.
 *
 * `reflexionRequerida` viaja hasta la función de base **como parámetro**: no hay
 * ninguna tabla de configuración que consultar, porque `C01-051` no está
 * decidido. Ver `proyeccion-evidencia.ts`.
 */
export const evidenciaLecturaReal: RepositorioDeEvidencia = {
  async estadoDeEvidencia(institutionId, studentId, ahora, evidenceId = null, reflexionRequerida = false) {
    const { data, error } = await clienteDeServicio().rpc("estado_de_evidencia", {
      p_institution_id: institutionId,
      p_student_id: studentId,
      p_ahora: ahora,
      p_evidence_id: evidenceId,
      p_reflexion_requerida: reflexionRequerida,
    });
    if (error) throw new Error(`No se pudo leer la evidencia: ${error.message}`);
    return (data as EstadoDeEvidencia | null) ?? null;
  },
};
