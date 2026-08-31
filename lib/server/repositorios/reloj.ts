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
};
