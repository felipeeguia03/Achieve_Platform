import "server-only";

import type { CommitmentState } from "@/lib/domain/types";
import type { RepositorioDeReloj } from "../servicios/reloj";
import { clienteDeServicio } from "../supabase";
import { institucionReal } from "./institucion";

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
   *
   * **Sólo `OPEN`** desde [ADR-034](../../../docs/decisions.md#adr-034):
   * `ACKNOWLEDGED` quedó legacy y sus filas ya no se vencen solas.
   */
  async senalesVencidas(institutionId, ahora, limite) {
    const { data, error } = await clienteDeServicio()
      .from("risk_signal")
      .select("id, status")
      .eq("institution_id", institutionId)
      .eq("status", "OPEN")
      .not("valid_until", "is", null)
      .lt("valid_until", ahora)
      .order("valid_until", { ascending: true })
      .limit(limite);

    if (error) throw new Error(`No se pudieron leer señales vencidas: ${error.message}`);
    return (data ?? []).map((f) => ({
      id: f.id as string,
      status: f.status as "OPEN",
    }));
  },

  /**
   * Los candidatos del disparador de Modo Examen — ADR-048.
   *
   * La consulta trae **la fecha, no el veredicto**: el filtro de los catorce
   * días vive en `lib/domain/ventana-de-examen.ts`. Sí filtra lo que no es una
   * decisión —sin fecha, o con preparación ya creada—, porque eso es qué filas
   * existen, no qué regla se aplica.
   */
  async candidatosDeModoExamen(institutionId, limite) {
    const { data, error } = await clienteDeServicio().rpc("candidatos_de_modo_examen", {
      p_institution_id: institutionId,
      p_limite: limite,
    });
    if (error) throw new Error(`No se pudieron leer candidatos de Modo Examen: ${error.message}`);

    return ((data ?? []) as Array<Record<string, unknown>>).map((f) => ({
      assessmentId: f.assessment_id as string,
      studentId: f.student_id as string,
      courseEnrollmentId: f.course_enrollment_id as string,
      fechaDeExamen: f.assessment_date as string,
    }));
  },

  async recomendarModoExamen(institutionId, candidato) {
    const { data, error } = await clienteDeServicio().rpc("recomendar_modo_examen", {
      p_institution_id: institutionId,
      p_assessment_id: candidato.assessmentId,
      p_student_id: candidato.studentId,
      p_course_enrollment_id: candidato.courseEnrollmentId,
    });
    if (error) throw new Error(`No se pudo recomendar Modo Examen: ${error.message}`);

    // Cero filas ⇒ ya existía. Es la condición 3 y la 4 de ADR-048 sostenidas
    // por `UNIQUE (student_id, assessment_id)`, no un fallo.
    const filas = (data ?? []) as Array<{ id: string }>;
    return filas.length > 0 ? { id: filas[0].id } : null;
  },

  async zonaInstitucional(institutionId) {
    return institucionReal.zonaHoraria(institutionId);
  },
};
