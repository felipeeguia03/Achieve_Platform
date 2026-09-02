import "server-only";

import type { DestinoDeEscalamiento } from "../servicios/escalamiento";
import { clienteDeServicio } from "../supabase";

/**
 * La cola sintética — Etapa B6.6.3.
 *
 * ⚠️ **No es el CRM.** Es el destino de demostración que hace observable el
 * último eslabón del MVP mientras el contrato está congelado
 * ([ADR-035](../../../docs/decisions.md#adr-035)). Cuando llegue el adaptador
 * real, se cambia **una línea** en el composition root.
 *
 * **La idempotencia vive en el índice**, no en un `SELECT` previo: dos
 * transiciones simultáneas de la misma señal pasarían las dos por un chequeo en
 * el código y encolarían dos casos. El `UNIQUE` sobre `risk_signal_id` es lo
 * único que no tiene carrera.
 */
export const colaSintetica: DestinoDeEscalamiento = {
  async escalar(caso) {
    const { data, error } = await clienteDeServicio()
      .from("escalation_sink")
      .insert({
        institution_id: caso.institutionId,
        risk_signal_id: caso.riskSignalId,
        student_id: caso.studentId,
        explanation: caso.explanation,
      })
      .select("id")
      .maybeSingle();

    // `23505` es la violación de unicidad: la señal ya estaba encolada. **No es
    // un error**, es la idempotencia haciendo su trabajo.
    if (error?.code === "23505") {
      const { data: previo } = await clienteDeServicio()
        .from("escalation_sink")
        .select("id")
        .eq("risk_signal_id", caso.riskSignalId)
        .maybeSingle();
      return { id: (previo?.id as string) ?? "", duplicado: true };
    }
    if (error) throw new Error(`No se pudo encolar el caso: ${error.message}`);
    return { id: (data?.id as string) ?? "", duplicado: false };
  },
};

/**
 * Lo que hay en la cola, para poder mirarlo — **sólo demostración**.
 *
 * **No está en el puerto a propósito.** El puerto es *adónde va un caso*; esto
 * es *qué quedó en el destino de mentira*. El adaptador del CRM no va a tener
 * una función así, y ponerla en la interfaz obligaría a inventarle una.
 */
export async function colaPendiente(institutionId: string) {
  const { data, error } = await clienteDeServicio()
    .from("escalation_sink")
    .select("id, risk_signal_id, student_id, explanation, delivery_status, created_at")
    .eq("institution_id", institutionId)
    .eq("delivery_status", "pendiente")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`No se pudo leer la cola sintética: ${error.message}`);
  return (data ?? []).map((f) => ({
    escalationId: f.id as string,
    riskSignalId: f.risk_signal_id as string,
    platformStudentId: f.student_id as string,
    explanation: f.explanation as string,
    deliveryStatus: f.delivery_status as string,
    createdAt: f.created_at as string,
  }));
}
