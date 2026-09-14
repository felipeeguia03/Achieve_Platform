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
  // ⚠️ **La precedencia vive en la base** —`bloques_de_cursada()`, ADR-105 §5—:
  // no sabe > declarados > comisión confirmada > (comisión desconocida: ninguno) >
  // los de su offering. Antes esta función juntaba los dos dueños a mano, y eso
  // mostraba el horario de la materia a quien dijo «no sé mi comisión».
  const { data, error } = await clienteDeServicio().rpc("bloques_de_cursadas", {
    p_institution_id: institutionId,
    p_student_id: studentId,
  });
  if (error) throw new Error(`No se pudieron leer los horarios: ${error.message}`);

  return ((data ?? []) as Array<{
    cursadaId: string;
    bloqueId: string;
    dia: number;
    desde: string;
    hasta: string;
    aula: string | null;
    fuente: string;
  }>).map((b) => ({
    cursadaId: b.cursadaId,
    bloqueId: b.bloqueId,
    dia: b.dia,
    desde: b.desde,
    hasta: b.hasta,
    aula: b.aula ?? null,
    // ADR-094: el aula hereda la procedencia del bloque.
    estimada: b.fuente === "inference",
  }));
}

export const horariosReal = { delEstudiante, deCursadas };
