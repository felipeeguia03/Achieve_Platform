import "server-only";

import { clienteDeServicio } from "../supabase";

/**
 * El catálogo curricular — Etapa B6.14.4,
 * [ADR-051](../../../docs/decisions.md#adr-051).
 *
 * Todo pasa por las funciones de lectura de la base, como el resto de la B2.6:
 * una llamada por pregunta, para que la pantalla no arme una foto inconsistente
 * entre viajes.
 *
 * ⚠️ **Ninguna lectura de acá devuelve un plan `DRAFT`.** El filtro vive en SQL
 * y no en este archivo, para que no dependa de que alguien se acuerde de
 * agregarlo. Hay test contra Postgres.
 */

export interface InstitucionOfrecible {
  institucionId: string;
  nombre: string;
  carreras: {
    carreraId: string;
    nombre: string;
    facultad: string | null;
    /** `false` ⇒ existe y **todavía no tiene plan publicado**. Se muestra y no se sigue. */
    tienePlan: boolean;
  }[];
}

export interface PlanPublicado {
  id: string;
  version: string;
  validFrom: string | null;
  validUntil: string | null;
}

export interface RequisitoDelPlan {
  requisitoId: string;
  codigo: string;
  nombre: string;
  tipo: string;
  anio: number | null;
  nombreCortado: boolean;
  materiaId: string | null;
  opciones: { materiaId: string; nombre: string }[];
  declarado: { cursadaId: string | null; nombreEscrito: string | null } | null;
}

/**
 * Las carreras de **la** institución del estudiante.
 *
 * `institutionId` sale de la sesión, nunca del request: es la raíz del
 * aislamiento, y el padrón ya la fijó. Ofrecer otra sería ofrecer algo que
 * `confirmarMapaAcademico` va a rechazar siempre.
 */
async function ofrecible(institutionId: string): Promise<InstitucionOfrecible | null> {
  const { data, error } = await clienteDeServicio().rpc("catalogo_ofrecible", {
    p_institution_id: institutionId,
  });
  if (error) throw new Error(`No se pudo leer el catálogo: ${error.message}`);
  return (data ?? null) as InstitucionOfrecible | null;
}

async function planesDeCarrera(programId: string): Promise<PlanPublicado[]> {
  const { data, error } = await clienteDeServicio().rpc("planes_publicados", {
    p_program_id: programId,
  });
  if (error) throw new Error(`No se pudieron leer los planes: ${error.message}`);
  return (data ?? []) as PlanPublicado[];
}

/**
 * `null` ⇒ **el plan no está publicado**, que no es lo mismo que un plan sin
 * requisitos. Colapsarlos le diría al estudiante que su carrera no tiene
 * materias.
 */
async function requisitos(
  curriculumPlanId: string,
  studentId: string,
): Promise<{ planId: string; requisitos: RequisitoDelPlan[] } | null> {
  const { data, error } = await clienteDeServicio().rpc("requisitos_del_plan", {
    p_curriculum_plan_id: curriculumPlanId,
    p_student_id: studentId,
  });
  if (error) throw new Error(`No se pudieron leer los requisitos: ${error.message}`);
  return (data ?? null) as { planId: string; requisitos: RequisitoDelPlan[] } | null;
}

/** A qué institución y carrera pertenece un plan. El cliente no lo manda. */
async function duenioDelPlan(
  curriculumPlanId: string,
): Promise<{ institutionId: string; programId: string } | null> {
  const { data, error } = await clienteDeServicio()
    .from("curriculum_plan")
    .select("program_id, academic_program:program_id(institution_id)")
    .eq("id", curriculumPlanId)
    .eq("publication_status", "PUBLISHED")
    .maybeSingle();
  if (error) throw new Error(`No se pudo resolver el plan: ${error.message}`);

  const fila = data as { program_id?: string; academic_program?: { institution_id?: string } } | null;
  if (!fila?.program_id || !fila.academic_program?.institution_id) return null;
  return { institutionId: fila.academic_program.institution_id, programId: fila.program_id };
}

export const catalogoReal = { ofrecible, planesDeCarrera, requisitos, duenioDelPlan };
