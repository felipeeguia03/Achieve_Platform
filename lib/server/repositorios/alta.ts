import "server-only";

import { clienteDeServicio } from "../supabase";

/**
 * El alta del estudiante — Etapa B6.14.4,
 * [ADR-052](../../../docs/decisions.md#adr-052).
 *
 * ⚠️ **Ninguna función de acá escribe `student.whatsapp`.** ADR-042 §4 autoriza
 * probar con teléfonos sintéticos, pero el schema dice que ninguna capa escribe
 * esa columna mientras [ADR-006](../../../docs/decisions.md#adr-006) siga
 * abierto, y este ADR eligió no contradecirlo: se persiste **el
 * consentimiento**, y la tabla no tiene dónde poner un número.
 */

export interface EstadoDelAltaEnBase {
  consentimientoRespondido: boolean;
  carreraDeclarada: boolean;
  materiasConfirmadas: boolean;
  declaracion: {
    inscripcionId: string;
    carreraId: string;
    planId: string;
    anio: number;
    periodo: string;
    confirmadaEn: string | null;
  } | null;
}

async function estado(institutionId: string, studentId: string): Promise<EstadoDelAltaEnBase> {
  const { data, error } = await clienteDeServicio().rpc("estado_del_alta", {
    p_institution_id: institutionId,
    p_student_id: studentId,
  });
  if (error) throw new Error(`No se pudo leer el estado del alta: ${error.message}`);
  return data as EstadoDelAltaEnBase;
}

/**
 * El consentimiento, append-only. **Retirarlo es una fila nueva**, nunca un
 * `UPDATE`: si el `GRANTED` se pisara, nadie podría decir después qué se
 * consintió ni cuándo.
 */
async function registrarConsentimiento(
  institutionId: string,
  studentId: string,
  decision: "GRANTED" | "DECLINED" | "WITHDRAWN",
  policyVersion: string,
): Promise<void> {
  const { error } = await clienteDeServicio().from("whatsapp_consent").insert({
    institution_id: institutionId,
    student_id: studentId,
    decision,
    policy_version: policyVersion,
  });
  if (error) throw new Error(`No se pudo registrar el consentimiento: ${error.message}`);
}

/** Declarar carrera y año. Deja `confirmed_at` en `NULL`: declarar no es confirmar. */
async function declararCarrera(args: {
  institutionId: string;
  studentId: string;
  programId: string;
  curriculumPlanId: string;
  curriculumYear: number;
  term: string;
}): Promise<string> {
  const { data, error } = await clienteDeServicio().rpc("declarar_carrera", {
    p_institution_id: args.institutionId,
    p_student_id: args.studentId,
    p_program_id: args.programId,
    p_curriculum_plan_id: args.curriculumPlanId,
    p_curriculum_year: args.curriculumYear,
    p_term: args.term,
  });
  if (error) throw new Error(`No se pudo declarar la carrera: ${error.message}`);
  return data as string;
}

export interface SeleccionDeRequisito {
  requisitoId: string;
  /** La materia concreta. En un cupo, la opción elegida del catálogo. */
  materiaId?: string;
  /** El nombre que el estudiante escribió porque no está en el catálogo. */
  nombreEscrito?: string;
}

/**
 * La confirmación entera, en una transacción de base.
 *
 * **La idempotencia no está acá:** está en los `UNIQUE` de `course_enrollment`
 * y `requirement_declaration`, que existen desde su migración. Un doble submit
 * escribe las mismas filas.
 */
async function confirmar(args: {
  institutionId: string;
  studentId: string;
  programId: string;
  curriculumPlanId: string;
  curriculumYear: number;
  term: string;
  selecciones: SeleccionDeRequisito[];
}): Promise<{ inscripcionId: string; cursadas: number; declaraciones: number; esPrimera: boolean }> {
  const { data, error } = await clienteDeServicio().rpc("confirmar_mapa_academico", {
    p_institution_id: args.institutionId,
    p_student_id: args.studentId,
    p_program_id: args.programId,
    p_curriculum_plan_id: args.curriculumPlanId,
    p_curriculum_year: args.curriculumYear,
    p_term: args.term,
    p_selecciones: args.selecciones.map((s) => ({
      requisitoId: s.requisitoId,
      materiaId: s.materiaId ?? null,
      nombreEscrito: s.nombreEscrito ?? null,
    })),
  });
  if (error) throw new Error(`No se pudo confirmar el mapa académico: ${error.message}`);

  const [fila] = (data ?? []) as {
    inscripcion_id: string;
    cursadas: number;
    declaraciones: number;
    es_primera: boolean;
  }[];
  return {
    inscripcionId: fila.inscripcion_id,
    cursadas: fila.cursadas,
    declaraciones: fila.declaraciones,
    esPrimera: fila.es_primera,
  };
}

/** Las cursadas activas del estudiante, para invocar al ADE sobre cada una. */
async function cursadasActivas(institutionId: string, studentId: string): Promise<string[]> {
  const { data, error } = await clienteDeServicio()
    .from("course_enrollment")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("student_id", studentId)
    .eq("status", "active");
  if (error) throw new Error(`No se pudieron leer las cursadas: ${error.message}`);
  return ((data ?? []) as { id: string }[]).map((f) => f.id);
}

export const altaReal = {
  estado,
  registrarConsentimiento,
  declararCarrera,
  confirmar,
  cursadasActivas,
};
