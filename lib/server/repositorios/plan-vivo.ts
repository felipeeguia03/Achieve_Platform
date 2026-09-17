import "server-only";

import { sumarDias } from "@/lib/domain/calendario";
import type { InsumosDelPlan, RepositorioDelPlan } from "../servicios/proyeccion-plan-vivo";
import { clienteDeServicio } from "../supabase";
import { calendarioReal } from "./calendario";
import { motorReal } from "./motor";

/**
 * Las lecturas del Plan vivo — [ADR-110](../../../docs/decisions.md#adr-110).
 *
 * **Sólo lee.** Reutiliza la lectura del Calendario (ADR-100) y el contexto del
 * ADE (`contexto_del_ade`), y agrega tres cosas que ninguna de las dos trae: la
 * disponibilidad declarada, la `Action` viva de cada cursada y qué compromiso
 * tiene un Focus abierto.
 *
 * ⚠️ **Del Focus sólo se lee `commitment_id`.** El anotador es privado (ADR-104).
 */
export const planVivoReal: RepositorioDelPlan = {
  async insumos(institutionId, studentId, semana, hoy): Promise<InsumosDelPlan> {
    const db = clienteDeServicio();
    const calendario = await calendarioReal.insumos(institutionId, studentId, semana, sumarDias(semana, 6), hoy);
    const cursadas = calendario.materias.map((m) => m.cursadaId);

    const [disponibilidad, acciones, compromisos, focus, contextos] = await Promise.all([
      db
        .from("availability")
        .select("day_of_week, start_time, end_time, capacity_min")
        .eq("student_id", studentId)
        .eq("source", "declared"),
      cursadas.length === 0
        ? Promise.resolve({ data: [], error: null })
        : db
            .from("action")
            .select("id, course_enrollment_id, topic_id, objective, status, estimated_minutes_min, estimated_minutes_max, expected_evidence")
            .eq("institution_id", institutionId)
            .in("course_enrollment_id", cursadas)
            .not("status", "in", "(COMPLETED,CANCELLED,REPLACED)"),
      cursadas.length === 0
        ? Promise.resolve({ data: [], error: null })
        : db
            .from("commitment")
            .select("id, action_id, state, action:action_id!inner(course_enrollment_id)")
            .eq("institution_id", institutionId)
            .in("state", ["CONFIRMED", "DUE", "STARTED"])
            .in("action.course_enrollment_id", cursadas),
      db
        .from("focus_session")
        .select("commitment_id")
        .eq("institution_id", institutionId)
        .eq("student_id", studentId)
        .eq("status", "OPEN")
        .maybeSingle(),
      Promise.all(
        cursadas.map(async (id) => ({ cursadaId: id, contexto: await motorReal.contextoDe(institutionId, id) })),
      ),
    ]);

    if (disponibilidad.error) throw new Error(`No se pudo leer la disponibilidad: ${disponibilidad.error.message}`);
    if (acciones.error) throw new Error(`No se pudieron leer las acciones: ${acciones.error.message}`);
    if (compromisos.error) throw new Error(`No se pudieron leer los compromisos: ${compromisos.error.message}`);
    if (focus.error) throw new Error(`No se pudo leer la sesión de Focus: ${focus.error.message}`);

    return {
      calendario,
      disponibilidad: ((disponibilidad.data ?? []) as Array<Record<string, unknown>>).map((d) => ({
        dia: d.day_of_week as number,
        desde: (d.start_time as string | null) ?? null,
        hasta: (d.end_time as string | null) ?? null,
        minutos: (d.capacity_min as number | null) ?? null,
      })),
      contextos: contextos.flatMap((c) => (c.contexto ? [{ cursadaId: c.cursadaId, contexto: c.contexto }] : [])),
      accionesVivas: ((acciones.data ?? []) as Array<Record<string, unknown>>).map((a) => ({
        id: a.id as string,
        cursadaId: a.course_enrollment_id as string,
        topicId: (a.topic_id as string | null) ?? null,
        objetivo: a.objective as string,
        estado: a.status as string,
        minutosMin: (a.estimated_minutes_min as number | null) ?? null,
        minutosMax: (a.estimated_minutes_max as number | null) ?? null,
        evidencia: (a.expected_evidence as string | null) ?? null,
      })),
      compromisosVivos: ((compromisos.data ?? []) as unknown as Array<{ id: string; action_id: string }>).map((c) => ({
        id: c.id,
        actionId: c.action_id,
      })),
      compromisoConFocus: (focus.data as { commitment_id: string } | null)?.commitment_id ?? null,
    };
  },
};
