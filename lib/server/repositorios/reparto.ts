import "server-only";

import type { InsumosDeReparto } from "../servicios/proyeccion-reparto";
import { clienteDeServicio } from "../supabase";

/**
 * Los insumos del reparto — [ADR-073](../../../docs/decisions.md#adr-073).
 *
 * **Una función aparte de `estado_del_dia()`, y a propósito.** Repartir necesita
 * de cada materia lo mismo que `estado_de_materia()` devuelve de una sola: las
 * sesiones con su duración, los temas que cubrieron y la carga declarada. Con
 * dieciséis materias eso es más payload que el resto de `HOY` junto, y
 * `estado_del_dia()` es el camino caliente.
 */
export const repartoReal = {
  async insumos(institutionId: string, studentId: string, ahora: string): Promise<InsumosDeReparto> {
    const { data, error } = await clienteDeServicio().rpc("insumos_de_reparto", {
      p_institution_id: institutionId,
      p_student_id: studentId,
      p_ahora: ahora,
    });
    if (error) throw new Error(`No se pudieron leer los insumos del reparto: ${error.message}`);
    return data as InsumosDeReparto;
  },
};
