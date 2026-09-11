import "server-only";

import type { InsumosDeSemana, RepositorioDeTablero } from "../servicios/proyeccion-tablero";
import { clienteDeServicio } from "../supabase";

/**
 * Lo que el tablero de `UX01` necesita y el reparto no trae —
 * [ADR-093](../../../docs/decisions.md#adr-093).
 *
 * ⚠️ **Sólo lee.** Tres consultas sobre tablas que ya existen, con el
 * `institution_id` en el `WHERE` (Parte I §29), y ninguna escritura. No hay
 * migración: el patrón es el de `compromiso.ts`.
 *
 * ⚠️ **La disponibilidad es la declarada, y nada más** — `source = 'declared'`.
 * [ADR-074](../../../docs/decisions.md#adr-074) prohíbe derivarla de lo que el
 * estudiante cumplió, y esta lectura no lo hace por la puerta de atrás.
 */

/** Los que todavía pueden ocurrir. Un `MISSED` lo muestra el Hero, no la semana. */
const PENDIENTES = ["CONFIRMED", "DUE", "STARTED"];

type FilaDeCompromiso = {
  start_at: string;
  planned_minutes: number;
  action:
    | { objective: string; course_enrollment_id: string }
    | Array<{ objective: string; course_enrollment_id: string }>
    | null;
};

async function insumosDeSemana(
  institutionId: string,
  studentId: string,
  desde: string,
  hasta: string,
): Promise<InsumosDeSemana> {
  const db = clienteDeServicio();

  const disponibilidad = await db
    .from("availability")
    .select("day_of_week, start_time, end_time, capacity_min")
    .eq("student_id", studentId)
    .eq("source", "declared");
  if (disponibilidad.error) {
    throw new Error(`No se pudo leer la disponibilidad: ${disponibilidad.error.message}`);
  }
  const franjas = ((disponibilidad.data ?? []) as Array<Record<string, unknown>>).map((d) => ({
    dia: (d.day_of_week as number | null) ?? null,
    desde: (d.start_time as string | null) ?? null,
    hasta: (d.end_time as string | null) ?? null,
    minutos: (d.capacity_min as number | null) ?? null,
  }));

  const cursadas = await db
    .from("course_enrollment")
    .select("id, offering_id")
    .eq("institution_id", institutionId)
    .eq("student_id", studentId)
    .eq("status", "active");
  if (cursadas.error) throw new Error(`No se pudieron leer las cursadas: ${cursadas.error.message}`);
  const filas = (cursadas.data ?? []) as Array<{ id: string; offering_id: string | null }>;
  if (filas.length === 0) return { clases: [], compromisos: [], disponibilidad: franjas };

  const ids = filas.map((f) => f.id);
  const porOferta = new Map(
    filas.filter((f) => f.offering_id !== null).map((f) => [f.offering_id as string, f.id]),
  );

  // Los dos dueños posibles del bloque (ADR-083): la cursada o su oferta.
  const duenios = [
    `course_enrollment_id.in.(${ids.join(",")})`,
    ...(porOferta.size > 0 ? [`offering_id.in.(${[...porOferta.keys()].join(",")})`] : []),
  ].join(",");
  const bloques = await db
    .from("class_schedule_block")
    .select("day_of_week, start_time, end_time, offering_id, course_enrollment_id")
    .eq("institution_id", institutionId)
    .or(duenios);
  if (bloques.error) throw new Error(`No se pudieron leer los horarios: ${bloques.error.message}`);
  const clases = ((bloques.data ?? []) as Array<Record<string, unknown>>).flatMap((b) => {
    const cursadaId =
      (b.course_enrollment_id as string | null) ?? porOferta.get(b.offering_id as string) ?? null;
    return cursadaId
      ? [{ cursadaId, dia: b.day_of_week as number, desde: b.start_time as string, hasta: b.end_time as string }]
      : [];
  });

  const pendientes = await db
    .from("commitment")
    .select("start_at, planned_minutes, action:action_id!inner(objective, course_enrollment_id)")
    .eq("institution_id", institutionId)
    .in("state", PENDIENTES)
    .gte("start_at", desde)
    .lt("start_at", hasta)
    .in("action.course_enrollment_id", ids)
    .order("start_at", { ascending: true });
  if (pendientes.error) throw new Error(`No se pudieron leer los compromisos: ${pendientes.error.message}`);
  const compromisos = ((pendientes.data ?? []) as unknown as FilaDeCompromiso[]).flatMap((c) => {
    const a = Array.isArray(c.action) ? c.action[0] : c.action;
    return a
      ? [{ cursadaId: a.course_enrollment_id, inicio: c.start_at, minutos: c.planned_minutes, titulo: a.objective }]
      : [];
  });

  return { clases, compromisos, disponibilidad: franjas };
}

export const tableroReal: RepositorioDeTablero = { insumosDeSemana };
