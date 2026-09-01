import "server-only";

import type { ExamPreparationStatus } from "@/lib/domain/types";
import type {
  Preparacion,
  RepositorioDePreparaciones,
  ResultadoDeCompletion,
} from "../servicios/preparacion";
import { clienteDeServicio } from "../supabase";

/**
 * Repository de `exam_preparation`. Mismo contrato que los de `action` y
 * `commitment`: scoping en el `WHERE`, escritura con compare-and-swap.
 *
 * La completion **no** pasa por el cliente: va por `completar_paso_de_protocolo`
 * porque el número de vuelta se asigna dentro de la transacción. Contarlo acá y
 * después insertar es la condición de carrera que produce dos vueltas número 3.
 */
const COLUMNAS = "id, institution_id, status, assessment_id, exam_protocol_id";

function aDominio(f: Record<string, unknown>): Preparacion {
  return {
    id: f.id as string,
    institutionId: f.institution_id as string,
    state: f.status as ExamPreparationStatus,
    assessmentId: f.assessment_id as string,
    examProtocolId: (f.exam_protocol_id as string | null) ?? null,
  };
}

export const preparacionesReal: RepositorioDePreparaciones = {
  async porId(institutionId, id) {
    const { data, error } = await clienteDeServicio()
      .from("exam_preparation")
      .select(COLUMNAS)
      .eq("institution_id", institutionId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer exam_preparation: ${error.message}`);
    return data ? aDominio(data) : null;
  },

  async cambiarEstadoSi(institutionId, id, esperado, nuevo, columnas = {}) {
    const { data, error } = await clienteDeServicio()
      .from("exam_preparation")
      .update({ status: nuevo, ...columnas })
      .eq("institution_id", institutionId)
      .eq("id", id)
      .eq("status", esperado)
      .select(COLUMNAS)
      .maybeSingle();
    if (error) throw new Error(`No se pudo actualizar exam_preparation: ${error.message}`);
    return data ? aDominio(data) : null;
  },

  async protocoloVigente(assessmentId) {
    const { data, error } = await clienteDeServicio().rpc("protocolo_vigente", {
      p_assessment_id: assessmentId,
    });
    if (error) throw new Error(`No se pudo resolver el protocolo: ${error.message}`);
    const fila = (data as Array<{ protocol_id: string; version: string }>)[0];
    return fila ? { id: fila.protocol_id, version: fila.version } : null;
  },

  async completarPaso(entrada): Promise<ResultadoDeCompletion> {
    const { data, error } = await clienteDeServicio().rpc("completar_paso_de_protocolo", {
      p_institution_id: entrada.institutionId,
      p_exam_preparation_id: entrada.preparacionId,
      p_protocol_step_id: entrada.pasoId,
      p_topic_id: entrada.topicId,
      p_confirmed_by: entrada.confirmadoPor,
      p_idempotency_key: entrada.claveDeIdempotencia ?? null,
    });

    // La función levanta excepción cuando el paso no es reentrante y ya está
    // completado, o cuando la preparación no está `ACTIVE`. Son rechazos de
    // negocio, no fallas: viajan como resultado y no como error 500.
    if (error) return { estado: "RECHAZADO", motivo: error.message };

    const fila = (data as Array<{ completion_id: string; occurrence: number; duplicado: boolean }>)[0];
    if (!fila) throw new Error("La completion no devolvió fila");
    return {
      estado: "OK",
      completionId: fila.completion_id,
      vuelta: fila.occurrence,
      duplicado: fila.duplicado,
    };
  },
};
