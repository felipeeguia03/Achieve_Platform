import "server-only";

import type { InterventionStatus } from "@/lib/domain/types";
import type { Intervencion, RepositorioDeIntervenciones } from "../servicios/intervencion";
import { clienteDeServicio } from "../supabase";

/**
 * Repository de `intervention` — Fase B6.
 *
 * Abrir y cerrar van por función de base. Cerrar, sobre todo: el estado y el
 * outcome se escriben **en la misma transacción**, y media escritura deja una
 * intervención cerrada sin resultado, que es exactamente lo que el Done de la
 * fase prohíbe.
 */
const COLUMNAS =
  "id, institution_id, status, student_id, risk_signal_id, owner_operator_id, owner_verified, playbook_id";

function aDominio(f: Record<string, unknown>): Intervencion {
  return {
    id: f.id as string,
    institutionId: f.institution_id as string,
    state: f.status as InterventionStatus,
    studentId: f.student_id as string,
    riskSignalId: (f.risk_signal_id as string | null) ?? null,
    ownerOperatorId: f.owner_operator_id as string,
    ownerVerified: f.owner_verified as boolean,
    playbookId: (f.playbook_id as string | null) ?? null,
  };
}

export const intervencionesReal: RepositorioDeIntervenciones = {
  async porId(institutionId, id) {
    const { data, error } = await clienteDeServicio()
      .from("intervention")
      .select(COLUMNAS)
      .eq("institution_id", institutionId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer intervention: ${error.message}`);
    return data ? aDominio(data) : null;
  },

  async cambiarEstadoSi(institutionId, id, esperado, nuevo, columnas = {}) {
    const { data, error } = await clienteDeServicio()
      .from("intervention")
      .update({ status: nuevo, ...columnas })
      .eq("institution_id", institutionId)
      .eq("id", id)
      .eq("status", esperado)
      .select(COLUMNAS)
      .maybeSingle();
    if (error) throw new Error(`No se pudo actualizar intervention: ${error.message}`);
    return data ? aDominio(data) : null;
  },

  async abrir(entrada) {
    const { data, error } = await clienteDeServicio().rpc("abrir_intervencion", {
      p_institution_id: entrada.institutionId,
      p_risk_signal_id: entrada.riskSignalId,
      p_student_id: entrada.studentId,
      p_owner_operator_id: entrada.ownerOperatorId,
      p_owner_verified: entrada.ownerVerified,
      p_playbook_id: entrada.playbookId ?? null,
      p_sla_at: entrada.slaAt ?? null,
      p_idempotency_key: entrada.claveDeIdempotencia ?? null,
    });
    if (error) throw new Error(error.message);
    const fila = (data as Array<{ intervention_id: string; sla_at: string | null; duplicado: boolean }>)[0];
    if (!fila) throw new Error("La apertura no devolvió fila");
    return { id: fila.intervention_id, slaAt: fila.sla_at, duplicado: fila.duplicado };
  },

  async cerrar(entrada) {
    const { data, error } = await clienteDeServicio().rpc("cerrar_intervencion", {
      p_institution_id: entrada.institutionId,
      p_intervention_id: entrada.intervencionId,
      p_outcome: entrada.outcome,
      p_note: entrada.nota ?? null,
      p_recorded_by: entrada.registradoPor,
      p_human_minutes: entrada.minutosHumanos ?? null,
    });
    if (error) throw new Error(error.message);
    const fila = (data as Array<{ cerrada: boolean; ya_estaba: boolean }>)[0];
    if (!fila) throw new Error("El cierre no devolvió fila");
    return { cerrada: fila.cerrada, yaEstaba: fila.ya_estaba };
  },
};
