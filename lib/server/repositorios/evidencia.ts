import "server-only";

import type {
  EntregaDeEvidencia,
  HuellaDeEvidencia,
  RepositorioDeEntrega,
} from "../servicios/evidencia";
import { clienteDeServicio } from "../supabase";

/**
 * Escritura de `evidence`. La lectura vive aparte, en `evidencia-lectura.ts`,
 * porque proyecta por RPC y esto inserta: son dos caminos distintos a la misma
 * tabla y mezclarlos esconde cuál de los dos muta.
 */

/** Los estados en que un compromiso todavía admite una entrega. */
const ENTREGABLES = ["CONFIRMED", "DUE", "STARTED"];

async function huellaDeClave(
  institutionId: string,
  clave: string,
): Promise<HuellaDeEvidencia | null> {
  const { data, error } = await clienteDeServicio()
    .from("evidence")
    .select("id, commitment_id, action:action_id(course_enrollment:course_enrollment_id(student_id))")
    .eq("institution_id", institutionId)
    .eq("idempotency_key", clave)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer evidence por clave: ${error.message}`);
  if (!data) return null;

  const fila = data as Record<string, unknown>;
  const accion = fila.action as { course_enrollment?: { student_id?: string } } | null;
  return {
    evidenciaId: fila.id as string,
    estudianteId: accion?.course_enrollment?.student_id ?? "",
    commitmentId: (fila.commitment_id as string | null) ?? null,
  };
}

/**
 * `INSERT` de la entrega, ya en `SUBMITTED`.
 *
 * **Las tres señales entran en `not_evaluated`**, no en `none`. No son lo
 * mismo: `none` afirma que se miró y no había nada; `not_evaluated` dice que
 * nadie miró todavía, que es la verdad de una entrega recién hecha. *"Sin datos
 * no es cero."*
 *
 * `validation_method` queda `NULL` a propósito: lo escribe quien juzgue, y
 * cuál método se usó es parte del juicio, no de la entrega.
 */
async function crearEntregada(
  institutionId: string,
  datos: EntregaDeEvidencia,
): Promise<{ actionId: string } | null> {
  const { data: compromiso, error: errCom } = await clienteDeServicio()
    .from("commitment")
    .select("id, action_id, state, action:action_id(course_enrollment:course_enrollment_id(student_id))")
    .eq("institution_id", institutionId)
    .eq("id", datos.commitmentId)
    .maybeSingle();
  if (errCom) throw new Error(`No se pudo leer commitment: ${errCom.message}`);

  const fila = compromiso as Record<string, unknown> | null;
  const duenio = (fila?.action as { course_enrollment?: { student_id?: string } } | null)
    ?.course_enrollment?.student_id;
  if (!fila || duenio !== datos.estudianteId || !ENTREGABLES.includes(fila.state as string)) {
    return null;
  }

  const { error } = await clienteDeServicio().from("evidence").insert({
    id: datos.evidenciaId,
    institution_id: institutionId,
    action_id: fila.action_id as string,
    commitment_id: datos.commitmentId,
    lifecycle_state: "SUBMITTED",
    submission_channel: "WEB",
    uploaded_by: datos.estudianteId,
    submitted_at: new Date().toISOString(),
    signal_execution: "not_evaluated",
    signal_production: "not_evaluated",
    signal_domain: "not_evaluated",
    idempotency_key: datos.claveDeIdempotencia,
  });
  if (error) throw new Error(`No se pudo registrar la entrega: ${error.message}`);

  return { actionId: fila.action_id as string };
}

export const entregaReal: RepositorioDeEntrega = { huellaDeClave, crearEntregada };
