import "server-only";

import type { BloqueSemanal } from "@/lib/domain/superposicion";
import { clienteDeServicio } from "../supabase";

/**
 * Los bloques de clase conocidos del estudiante —
 * [ADR-064](../../../docs/decisions.md#adr-064).
 *
 * **Todos, no los de una materia**: comprometerse a estudiar Cálculo el martes
 * a las 18:30 choca con la clase de Física de 18 a 20 igual que con la de
 * Cálculo.
 *
 * Devuelve `[]` cuando no se sabe nada, y **eso no se distingue de «no hay
 * clase»** a propósito: sin horarios cargados, la regla no bloquea nada y el
 * comportamiento es el de antes de que existiera (ADR-064).
 */
async function delEstudiante(
  institutionId: string,
  studentId: string,
): Promise<readonly BloqueSemanal[]> {
  const { data, error } = await clienteDeServicio().rpc("horarios_del_estudiante", {
    p_institution_id: institutionId,
    p_student_id: studentId,
  });
  if (error) throw new Error(`No se pudieron leer los horarios de cursado: ${error.message}`);
  return (data as BloqueSemanal[] | null) ?? [];
}

export const horariosReal = { delEstudiante };
