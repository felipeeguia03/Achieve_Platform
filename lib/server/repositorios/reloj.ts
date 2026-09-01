import "server-only";

import type { CommitmentState } from "@/lib/domain/types";
import type { RepositorioDeReloj } from "../servicios/reloj";
import { clienteDeServicio } from "../supabase";

/**
 * Candidatos del reloj. **Sólo `CONFIRMED` y `DUE`**: el resto no depende del
 * tiempo, y traerlos sería pasear filas para descartarlas.
 *
 * Ordena por `start_at` para que el más vencido se atienda primero cuando el
 * límite corta.
 */
export const relojReal: RepositorioDeReloj = {
  async candidatosPorTiempo(institutionId, limite) {
    const { data, error } = await clienteDeServicio()
      .from("commitment")
      .select("id, state, start_at, planned_minutes")
      .eq("institution_id", institutionId)
      .in("state", ["CONFIRMED", "DUE"])
      .order("start_at", { ascending: true })
      .limit(limite);

    if (error) throw new Error(`No se pudieron leer candidatos del reloj: ${error.message}`);

    return (data ?? []).map((f) => ({
      id: f.id as string,
      state: f.state as CommitmentState,
      startAt: f.start_at as string,
      plannedMinutes: Number(f.planned_minutes),
    }));
  },

  /**
   * El filtro por estado va en el `WHERE` y no en el código: traer una señal en
   * `INTERVENTION_REQUIRED` para después descartarla es pasear la posibilidad
   * de expirarla por error.
   */
  async senalesVencidas(institutionId, ahora, limite) {
    const { data, error } = await clienteDeServicio()
      .from("risk_signal")
      .select("id, status")
      .eq("institution_id", institutionId)
      .in("status", ["OPEN", "ACKNOWLEDGED"])
      .not("valid_until", "is", null)
      .lt("valid_until", ahora)
      .order("valid_until", { ascending: true })
      .limit(limite);

    if (error) throw new Error(`No se pudieron leer señales vencidas: ${error.message}`);
    return (data ?? []).map((f) => ({
      id: f.id as string,
      status: f.status as "OPEN" | "ACKNOWLEDGED",
    }));
  },
};
