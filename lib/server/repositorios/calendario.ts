import "server-only";

import { sumarDias } from "@/lib/domain/calendario";
import type { InsumosDelCalendario, RepositorioDeCalendario } from "../servicios/proyeccion-calendario";
import { clienteDeServicio } from "../supabase";
import { horariosReal } from "./horarios";

/**
 * Lo que el calendario lee — [ADR-100](../../../docs/decisions.md#adr-100).
 *
 * ⚠️ **Sólo lee.** Consultas sobre tablas que ya existen, con el
 * `institution_id` en el `WHERE` donde la tabla lo tiene, y ninguna escritura.
 *
 * ⚠️ **Los bloques salen de `horarios.ts`, no de una consulta propia** (ADR-095):
 * Hoy y Materias leen los mismos, y dos consultas podrían divergir.
 *
 * ⚠️ **Los instantes se piden con un día de margen a cada lado.** El rango llega
 * en fechas locales y la base guarda UTC: un compromiso de las 23:00 del último
 * día, en Córdoba, es del día siguiente en UTC. La proyección recorta por fecha
 * local.
 */

/** Todo menos `DRAFT`: un borrador no es un compromiso tomado. */
const ESTADOS_LEIDOS = ["CONFIRMED", "DUE", "STARTED", "COMPLETED", "MISSED", "CLOSED"];

type Uno<T> = T | T[] | null;
const uno = <T>(v: Uno<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

async function insumos(
  institutionId: string,
  studentId: string,
  desde: string,
  hasta: string,
  hoy: string,
): Promise<InsumosDelCalendario> {
  const db = clienteDeServicio();

  const cursadas = await db
    .from("course_enrollment")
    .select("id, offering_id, oferta:offering_id(course:course_id(name))")
    .eq("institution_id", institutionId)
    .eq("student_id", studentId)
    .eq("status", "active");
  if (cursadas.error) throw new Error(`No se pudieron leer las cursadas: ${cursadas.error.message}`);

  const filas = (cursadas.data ?? []) as unknown as Array<{
    id: string;
    offering_id: string | null;
    oferta: Uno<{ course: Uno<{ name: string | null }> }>;
  }>;
  const vacio: InsumosDelCalendario = {
    materias: [],
    bloques: [],
    evaluaciones: [],
    proximaEvaluacion: null,
    compromisos: [],
    clasesAbiertas: [],
  };
  if (filas.length === 0) return vacio;

  const materias = filas.flatMap((f) => {
    const nombre = uno(uno(f.oferta)?.course ?? null)?.name ?? null;
    // Sin nombre no hay qué rotular: la cursada se omite, no se llama «Materia».
    return nombre ? [{ cursadaId: f.id, nombre }] : [];
  });
  const ids = filas.map((f) => f.id);
  const porOferta = new Map(
    filas.filter((f) => f.offering_id !== null).map((f) => [f.offering_id as string, f.id]),
  );
  const ofertas = [...porOferta.keys()];

  const inicio = `${sumarDias(desde, -1)}T00:00:00Z`;
  const fin = `${sumarDias(hasta, 2)}T00:00:00Z`;
  // ADR-067: la evaluación declarada por otro estudiante no es de éste.
  const visibles = `declared_by.is.null,declared_by.eq.${studentId}`;

  const [bloques, evaluaciones, proxima, compromisos, abiertas] = await Promise.all([
    horariosReal.deCursadas(institutionId, studentId),
    ofertas.length === 0
      ? Promise.resolve({ data: [], error: null })
      : db
          .from("assessment")
          .select("id, offering_id, assessment_type, title, assessment_date, assessment_time, modality")
          .in("offering_id", ofertas)
          .or(visibles)
          .gte("assessment_date", desde)
          .lte("assessment_date", hasta),
    ofertas.length === 0
      ? Promise.resolve({ data: [], error: null })
      : db
          .from("assessment")
          .select("assessment_date")
          .in("offering_id", ofertas)
          .or(visibles)
          .gte("assessment_date", hoy)
          .order("assessment_date", { ascending: true })
          .limit(1),
    db
      .from("commitment")
      .select("id, start_at, planned_minutes, state, action:action_id!inner(objective, course_enrollment_id)")
      .eq("institution_id", institutionId)
      .in("state", ESTADOS_LEIDOS)
      .gte("start_at", inicio)
      .lt("start_at", fin)
      .in("action.course_enrollment_id", ids)
      .order("start_at", { ascending: true }),
    db
      .from("student_class_session")
      .select("id, course_enrollment_id, class_schedule_block_id, status, started_at")
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .gte("started_at", inicio)
      .lt("started_at", fin),
  ]);

  if (evaluaciones.error) throw new Error(`No se pudieron leer las evaluaciones: ${evaluaciones.error.message}`);
  if (proxima.error) throw new Error(`No se pudo leer la próxima evaluación: ${proxima.error.message}`);
  if (compromisos.error) throw new Error(`No se pudieron leer los compromisos: ${compromisos.error.message}`);
  if (abiertas.error) throw new Error(`No se pudieron leer las clases: ${abiertas.error.message}`);

  return {
    materias,
    bloques,
    evaluaciones: ((evaluaciones.data ?? []) as Array<Record<string, unknown>>).flatMap((e) => {
      const cursadaId = porOferta.get(e.offering_id as string);
      const fecha = e.assessment_date as string | null;
      return cursadaId && fecha
        ? [
            {
              id: e.id as string,
              cursadaId,
              tipo: (e.assessment_type as string | null) ?? null,
              titulo: (e.title as string | null) ?? null,
              fecha,
              hora: (e.assessment_time as string | null) ?? null,
              modalidad: (e.modality as string | null) ?? null,
            },
          ]
        : [];
    }),
    proximaEvaluacion:
      ((proxima.data ?? []) as Array<{ assessment_date: string | null }>)[0]?.assessment_date ?? null,
    compromisos: (
      (compromisos.data ?? []) as unknown as Array<{
        id: string;
        start_at: string;
        planned_minutes: number;
        state: string;
        action: Uno<{ objective: string; course_enrollment_id: string }>;
      }>
    ).flatMap((c) => {
      const a = uno(c.action);
      return a
        ? [
            {
              id: c.id,
              cursadaId: a.course_enrollment_id,
              inicio: c.start_at,
              minutos: c.planned_minutes,
              estado: c.state,
              titulo: a.objective,
            },
          ]
        : [];
    }),
    clasesAbiertas: ((abiertas.data ?? []) as Array<Record<string, unknown>>).map((c) => ({
      id: c.id as string,
      cursadaId: c.course_enrollment_id as string,
      iniciadaEn: c.started_at as string,
      estado: c.status === "ACTIVE" ? ("ACTIVE" as const) : ("ENDED" as const),
      bloqueId: (c.class_schedule_block_id as string | null) ?? null,
    })),
  };
}

export const calendarioReal: RepositorioDeCalendario = { insumos };
