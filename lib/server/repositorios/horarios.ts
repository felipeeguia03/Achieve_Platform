import "server-only";

import type { BloqueSemanal } from "@/lib/domain/superposicion";
import type { BloqueDeCursada } from "../servicios/proyeccion-materias";
import { clienteDeServicio } from "../supabase";

/**
 * Los bloques de clase conocidos del estudiante —
 * [ADR-064](../../../docs/decisions.md#adr-064).
 *
 * **Todos, no los de una materia**: comprometerse a estudiar Cálculo el martes
 * a las 18:30 choca con la clase de Física de 18 a 20 igual que con la de
 * Cálculo.
 *
 * Devuelve `[]` cuando no se sabe nada, y **eso no se distingue de «no hay
 * clase»** a propósito: sin horarios cargados, la regla no bloquea nada y el
 * comportamiento es el de antes de que existiera (ADR-064).
 */
async function delEstudiante(
  institutionId: string,
  studentId: string,
): Promise<readonly BloqueSemanal[]> {
  const { data, error } = await clienteDeServicio().rpc("horarios_del_estudiante", {
    p_institution_id: institutionId,
    p_student_id: studentId,
  });
  if (error) throw new Error(`No se pudieron leer los horarios de cursado: ${error.message}`);
  return (data as BloqueSemanal[] | null) ?? [];
}

/**
 * Los bloques **con su cursada y su aula** — ADR-094 y ADR-095.
 *
 * ⚠️ **Por qué no sale de `insumos_de_reparto`.** Esa función tiene prohibido
 * mirar `class_schedule_block` (ADR-063, con guard): el presupuesto de estudio
 * sale de `availability` y de nada más, porque restarle las horas de cursada las
 * contaría dos veces. El horario para mostrar es otra pregunta, y va por acá.
 *
 * ⚠️ **Una sola lectura para las dos superficies.** La usan el índice de
 * materias y el tablero de `UX01`: dos consultas podrían divergir, y entonces la
 * misma materia tendría dos horarios.
 */
async function deCursadas(institutionId: string, studentId: string): Promise<BloqueDeCursada[]> {
  const db = clienteDeServicio();

  const cursadas = await db
    .from("course_enrollment")
    .select("id, offering_id")
    .eq("institution_id", institutionId)
    .eq("student_id", studentId)
    .eq("status", "active");
  if (cursadas.error) throw new Error(`No se pudieron leer las cursadas: ${cursadas.error.message}`);
  const filas = (cursadas.data ?? []) as Array<{ id: string; offering_id: string | null }>;
  if (filas.length === 0) return [];

  const ids = filas.map((f) => f.id);
  const porOferta = new Map(
    filas.filter((f) => f.offering_id !== null).map((f) => [f.offering_id as string, f.id]),
  );
  const ofertas = [...porOferta.keys()];

  // Los dos dueños posibles del bloque (ADR-083): la cursada o su oferta.
  const duenios = [
    `course_enrollment_id.in.(${ids.join(",")})`,
    ...(ofertas.length > 0 ? [`offering_id.in.(${ofertas.join(",")})`] : []),
  ].join(",");
  const bloques = await db
    .from("class_schedule_block")
    .select("day_of_week, start_time, end_time, offering_id, course_enrollment_id, room, source_type")
    .eq("institution_id", institutionId)
    .or(duenios)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });
  if (bloques.error) throw new Error(`No se pudieron leer los horarios: ${bloques.error.message}`);

  return ((bloques.data ?? []) as Array<Record<string, unknown>>).flatMap((b) => {
    const cursadaId =
      (b.course_enrollment_id as string | null) ?? porOferta.get(b.offering_id as string) ?? null;
    return cursadaId
      ? [
          {
            cursadaId,
            dia: b.day_of_week as number,
            desde: b.start_time as string,
            hasta: b.end_time as string,
            aula: (b.room as string | null) ?? null,
            // ADR-094: el aula hereda la procedencia del bloque.
            estimada: b.source_type === "inference",
          },
        ]
      : [];
  });
}

export const horariosReal = { delEstudiante, deCursadas };
