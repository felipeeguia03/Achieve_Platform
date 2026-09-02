import "server-only";

import type { SourceType, VerificationStatus } from "@/lib/domain/types";
import type {
  Corroboracion,
  RepositorioDeCorroboracion,
  TablaConProcedencia,
} from "../servicios/corroboracion";
import { clienteDeServicio } from "../supabase";

/**
 * La escritura de `verification_status` — Etapa B2b.2, invariante `I9`.
 *
 * **Este repositorio no expone un update genérico del campo, y es literal lo
 * que `I9` pide:** *"Repository no expone un update genérico del campo"*. La
 * única escritura pasa por `corroborar_procedencia()`, que valida la transición,
 * exige fuente concreta y deja el hecho registrado en la misma transacción.
 *
 * Si algún día hiciera falta corregir un `verification_status` a mano, **eso
 * también es una corroboración** —con su fuente y su motivo—, no un `UPDATE`.
 */
export const corroboracionReal: RepositorioDeCorroboracion = {
  async corroborar(entrada: Corroboracion) {
    const { data, error } = await clienteDeServicio().rpc("corroborar_procedencia", {
      p_institution_id: entrada.institutionId,
      p_subject_table: entrada.tabla,
      p_subject_id: entrada.sujetoId,
      p_to_status: entrada.hacia,
      p_source_type: entrada.fuente,
      p_source_ref: entrada.referencia,
      p_reason: entrada.motivo,
      p_corroborated_by: entrada.corroboradoPor ?? null,
    });
    if (error) throw new Error(error.message);
    const fila = (
      data as Array<{ corroboration_id: string; from_status: string; to_status: string }>
    )[0];
    if (!fila) throw new Error("La corroboración no devolvió fila");
    return {
      corroboracionId: fila.corroboration_id,
      desde: fila.from_status as VerificationStatus,
      hacia: fila.to_status as VerificationStatus,
    };
  },

  async historial(institutionId: string, tabla: TablaConProcedencia, sujetoId: string) {
    const { data, error } = await clienteDeServicio()
      .from("provenance_corroboration")
      .select(
        "id, from_status, to_status, source_type, source_ref, reason, corroborated_by, corroborated_at",
      )
      .eq("institution_id", institutionId)
      .eq("subject_table", tabla)
      .eq("subject_id", sujetoId)
      .order("corroborated_at", { ascending: true });

    if (error) throw new Error(`No se pudo leer el historial: ${error.message}`);
    return (data ?? []).map((f) => ({
      id: f.id as string,
      desde: f.from_status as VerificationStatus,
      hacia: f.to_status as VerificationStatus,
      fuente: f.source_type as SourceType,
      referencia: f.source_ref as string,
      motivo: f.reason as string,
      corroboradoPor: (f.corroborated_by as string | null) ?? null,
      corroboradoEn: f.corroborated_at as string,
    }));
  },
};
