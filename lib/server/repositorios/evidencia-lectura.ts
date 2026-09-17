import "server-only";

import type { EstadoDeEvidencia, RepositorioDeEvidencia } from "../servicios/proyeccion-evidencia";
import { clienteDeServicio } from "../supabase";

/**
 * Lectura de `UX05`.
 *
 * El requisito de `Reflection` ya **no viaja como parámetro**: vive en
 * `action.reflection_requirement`, congelado al crear la Action
 * ([ADR-026](../../../docs/decisions.md#adr-026)), y la función de base lo lee
 * de ahí. Mientras `C01-051` estuvo abierto entraba de afuera para no elegir un
 * default desde el código; ya no hace falta.
 */
export const evidenciaLecturaReal: RepositorioDeEvidencia = {
  async estadoDeEvidencia(institutionId, studentId, ahora, evidenceId = null) {
    const { data, error } = await clienteDeServicio().rpc("estado_de_evidencia", {
      p_institution_id: institutionId,
      p_student_id: studentId,
      p_ahora: ahora,
      p_evidence_id: evidenceId,
    });
    if (error) throw new Error(`No se pudo leer la evidencia: ${error.message}`);
    return (data as EstadoDeEvidencia | null) ?? null;
  },
};
