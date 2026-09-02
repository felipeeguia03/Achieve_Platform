import "server-only";

import type { RiskSignalStatus, SeveridadDeRiesgo } from "@/lib/domain/types";
import type { RepositorioDeSenales, Senal } from "../servicios/riesgo";
import { clienteDeServicio } from "../supabase";

/**
 * Repository de `risk_signal` — Fase B6.
 *
 * El alta va por función de base por la idempotencia (`I8`): una detección
 * reintentada no puede aparecer como dos señales. Y `RESOLVED` también, porque
 * su condición mira dos tablas y tiene que verlas en la misma transacción.
 */
const COLUMNAS = "id, institution_id, status, student_id, severity, reason, review_context";

function aDominio(f: Record<string, unknown>): Senal {
  return {
    id: f.id as string,
    institutionId: f.institution_id as string,
    state: f.status as RiskSignalStatus,
    studentId: f.student_id as string,
    severity: f.severity as SeveridadDeRiesgo,
    reason: f.reason as string,
    reviewContext: (f.review_context as Record<string, unknown> | null) ?? {},
  };
}

export const senalesReal: RepositorioDeSenales = {
  async porId(institutionId, id) {
    const { data, error } = await clienteDeServicio()
      .from("risk_signal")
      .select(COLUMNAS)
      .eq("institution_id", institutionId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer risk_signal: ${error.message}`);
    return data ? aDominio(data) : null;
  },

  async cambiarEstadoSi(institutionId, id, esperado, nuevo, columnas = {}) {
    const { data, error } = await clienteDeServicio()
      .from("risk_signal")
      .update({ status: nuevo, ...columnas })
      .eq("institution_id", institutionId)
      .eq("id", id)
      .eq("status", esperado)
      .select(COLUMNAS)
      .maybeSingle();
    if (error) throw new Error(`No se pudo actualizar risk_signal: ${error.message}`);
    return data ? aDominio(data) : null;
  },

  async registrar(entrada) {
    const { data, error } = await clienteDeServicio().rpc("registrar_senal_b6_7_3", {
      p_institution_id: entrada.institutionId,
      p_student_id: entrada.studentId,
      p_course_enrollment_id: entrada.courseEnrollmentId ?? null,
      p_signal_type: entrada.signalType,
      p_severity: entrada.severity,
      p_reason: entrada.reason,
      p_source_ref: entrada.sourceRef ?? null,
      p_risk_rule_id: entrada.riskRuleId ?? null,
      p_rule_version: entrada.ruleVersion ?? null,
      p_valid_until: entrada.validUntil ?? null,
      p_idempotency_key: entrada.claveDeIdempotencia ?? null,
      p_reiteration_episode_id: entrada.reiterationEpisodeId ?? null,
      p_review_context: entrada.reviewContext ?? {},
    });
    if (error) throw new Error(`No se pudo registrar la señal: ${error.message}`);
    const fila = (data as Array<{ signal_id: string; duplicado: boolean }>)[0];
    if (!fila) throw new Error("El registro de la señal no devolvió fila");
    return { id: fila.signal_id, duplicado: fila.duplicado };
  },

  async resolver(institutionId, id) {
    const { data, error } = await clienteDeServicio().rpc("resolver_senal", {
      p_institution_id: institutionId,
      p_risk_signal_id: id,
    });
    if (error) throw new Error(`No se pudo resolver la señal: ${error.message}`);
    const fila = (data as Array<{ resuelta: boolean; motivo: string | null }>)[0];
    if (!fila) throw new Error("La resolución no devolvió fila");
    return { resuelta: fila.resuelta, motivo: fila.motivo };
  },
};
