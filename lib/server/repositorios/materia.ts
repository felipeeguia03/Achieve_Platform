import "server-only";

import type { EstadoDeMateria, RepositorioDeMateria } from "../servicios/proyeccion-materia";
import { clienteDeServicio } from "../supabase";

/**
 * Lee el estado de una materia. Una sola función de base, por el mismo motivo
 * que `estado_del_dia`: cursado, Action, Commitment, Evidence, unidades y
 * progreso leídos por separado dan una foto inconsistente entre sí.
 */
export const materiaReal: RepositorioDeMateria = {
  async estadoDeMateria(institutionId, studentId, ahora, courseEnrollmentId = null) {
    const { data, error } = await clienteDeServicio().rpc("estado_de_materia", {
      p_institution_id: institutionId,
      p_student_id: studentId,
      p_ahora: ahora,
      p_course_enrollment_id: courseEnrollmentId,
    });
    if (error) throw new Error(`No se pudo leer la materia: ${error.message}`);
    return (data as EstadoDeMateria | null) ?? null;
  },
};
