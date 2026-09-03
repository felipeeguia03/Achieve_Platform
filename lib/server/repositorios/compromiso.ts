import "server-only";

import type { CommitmentState } from "@/lib/domain/types";
import type { AcuerdoNuevo, ConfirmacionDeCompromiso, HuellaDeCompromiso } from "../servicios/compromiso";
import type { Compromiso, RepositorioDeCompromisos } from "../servicios/compromiso";
import { clienteDeServicio } from "../supabase";

/**
 * Repository de `commitment`. Única capa que toca Postgres para esta entidad.
 * **No decide permisos ni transiciones** — sólo persiste, con el guard atómico
 * que la decisión de arriba necesita para no perderse en una carrera.
 */
const COLUMNAS = "id, institution_id, action_id, state, rescues_commitment_id";

function aDominio(fila: Record<string, unknown>): Compromiso {
  return {
    id: fila.id as string,
    institutionId: fila.institution_id as string,
    actionId: fila.action_id as string,
    rescuesCommitmentId: (fila.rescues_commitment_id as string | null) ?? null,
    state: fila.state as CommitmentState,
  };
}

/**
 * Lee un compromiso **dentro de una institución**.
 *
 * El `institution_id` viaja en el `WHERE`, no se comprueba después de leer:
 * traer la fila y compararla en memoria ya la sacó de su compartimento, y basta
 * un `console.log` mal puesto para que se filtre. Parte I §29 pide segregación,
 * no verificación posterior.
 */
async function porId(institutionId: string, id: string): Promise<Compromiso | null> {
  const { data, error } = await clienteDeServicio()
    .from("commitment")
    .select(COLUMNAS)
    .eq("institution_id", institutionId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer commitment: ${error.message}`);
  return data ? aDominio(data) : null;
}

/** Busca por clave de idempotencia. Ver `servicios/compromiso.ts`. */
async function porClaveDeIdempotencia(
  institutionId: string,
  clave: string,
): Promise<Compromiso | null> {
  const { data, error } = await clienteDeServicio()
    .from("commitment")
    .select(COLUMNAS)
    .eq("institution_id", institutionId)
    .eq("idempotency_key", clave)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer commitment: ${error.message}`);
  return data ? aDominio(data) : null;
}

/**
 * Cambia el estado **sólo si sigue siendo el que el Service leyó**.
 *
 * Es un compare-and-swap: el estado esperado va en el `WHERE`, así que dos
 * requests concurrentes que leen `CONFIRMED` y quieren escribir estados
 * distintos **no pueden ganar las dos**. La segunda actualiza cero filas y
 * recibe `null`.
 *
 * Sin esto, la validación del Service es correcta y aun así se pierde: los dos
 * comprueban contra el mismo estado viejo y los dos escriben. La transición
 * prohibida no aparece en el código, aparece en la base.
 */
async function cambiarEstadoSi(
  institutionId: string,
  id: string,
  esperado: CommitmentState,
  nuevo: CommitmentState,
  marcas: Readonly<Record<string, string>> = {},
): Promise<Compromiso | null> {
  const { data, error } = await clienteDeServicio()
    .from("commitment")
    .update({ state: nuevo, ...marcas })
    .eq("institution_id", institutionId)
    .eq("id", id)
    .eq("state", esperado)
    .select(COLUMNAS)
    .maybeSingle();

  if (error) throw new Error(`No se pudo actualizar commitment: ${error.message}`);
  return data ? aDominio(data) : null;
}

/**
 * Renegociación y rescate pasan por funciones de base porque **necesitan que
 * dos escrituras ocurran juntas** (I2, I3). Lo que decide sigue en el Service:
 * estas llamadas ya vienen con la transición validada.
 */
async function renegociarAtomico(
  institutionId: string,
  originalId: string,
  esperado: CommitmentState,
  acuerdo: AcuerdoNuevo,
): Promise<Compromiso | null> {
  const { data, error } = await clienteDeServicio().rpc("renegociar_compromiso", {
    p_institution_id: institutionId,
    p_original_id: originalId,
    p_estado_esperado: esperado,
    p_start_at: acuerdo.startAt,
    p_timezone: acuerdo.timezone,
    p_planned_minutes: acuerdo.plannedMinutes,
    p_idempotency_key: acuerdo.claveDeIdempotencia ?? null,
  });
  if (error) throw new Error(`No se pudo renegociar: ${error.message}`);
  const filas = (data ?? []) as Record<string, unknown>[];
  return filas.length > 0 ? aDominio(filas[0]) : null;
}

async function crearRescateAtomico(
  institutionId: string,
  rescatadoId: string,
  acuerdo: AcuerdoNuevo,
): Promise<Compromiso | null> {
  const { data, error } = await clienteDeServicio().rpc("crear_rescate", {
    p_institution_id: institutionId,
    p_rescatado_id: rescatadoId,
    p_start_at: acuerdo.startAt,
    p_timezone: acuerdo.timezone,
    p_planned_minutes: acuerdo.plannedMinutes,
    p_idempotency_key: acuerdo.claveDeIdempotencia ?? null,
  });
  if (error) throw new Error(`No se pudo crear el rescate: ${error.message}`);
  const filas = (data ?? []) as Record<string, unknown>[];
  return filas.length > 0 ? aDominio(filas[0]) : null;
}

/** Los estados en que un compromiso todavía ocupa a la `Action`. */
const VIVOS = ["CONFIRMED", "DUE", "STARTED"];

/**
 * La huella de la fila que ya usó una clave de idempotencia.
 *
 * Trae el dueño y el payload **para poder compararlos**, no para mostrarlos:
 * el Service decide con esto si la clave repetida es el mismo pedido o un
 * conflicto, y en el segundo caso nada de esto sale por la respuesta.
 */
async function huellaDeClave(
  institutionId: string,
  clave: string,
): Promise<HuellaDeCompromiso | null> {
  const { data, error } = await clienteDeServicio()
    .from("commitment")
    .select(`${COLUMNAS}, start_at, timezone_at_commit, planned_minutes, action:action_id(course_enrollment:course_enrollment_id(student_id))`)
    .eq("institution_id", institutionId)
    .eq("idempotency_key", clave)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer commitment por clave: ${error.message}`);
  if (!data) return null;

  const fila = data as Record<string, unknown>;
  const accion = fila.action as { course_enrollment?: { student_id?: string } } | null;
  return {
    compromiso: aDominio(fila),
    estudianteId: accion?.course_enrollment?.student_id ?? "",
    startAt: new Date(fila.start_at as string).toISOString(),
    timezone: fila.timezone_at_commit as string,
    plannedMinutes: fila.planned_minutes as number,
  };
}

/**
 * `INSERT` del primer compromiso de una `Action`, ya en `CONFIRMED` (D1·A).
 *
 * Las dos guardas —que la `Action` sea de este estudiante y que no tenga otro
 * compromiso vivo— se hacen acá y con el `institution_id` en el `WHERE`, por lo
 * mismo que `porId`: comparar después de traer la fila ya la sacó de su
 * compartimento.
 *
 * **La carrera la corta el `UNIQUE (idempotency_key)`**, no esta lectura: dos
 * requests simultáneas con la misma clave hacen que una inserte y la otra
 * falle, y el Service resuelve la fallida por `huellaDeClave`.
 */
async function crearConfirmado(
  institutionId: string,
  datos: ConfirmacionDeCompromiso,
): Promise<{ compromiso: Compromiso; comprometible: boolean; yaViva: boolean }> {
  const vacio = { id: "", institutionId, actionId: datos.actionId, rescuesCommitmentId: null, state: "DRAFT" as CommitmentState };

  const { data: accion, error: errAccion } = await clienteDeServicio()
    .from("action")
    .select("id, status, course_enrollment:course_enrollment_id(student_id)")
    .eq("institution_id", institutionId)
    .eq("id", datos.actionId)
    .maybeSingle();
  if (errAccion) throw new Error(`No se pudo leer action: ${errAccion.message}`);

  const duenio = (accion as { course_enrollment?: { student_id?: string } } | null)
    ?.course_enrollment?.student_id;
  const status = (accion as { status?: string } | null)?.status;
  // `COMMITTED` en adelante ya pasó por acá; `BLOCKED`, `CANCELLED` y
  // `REPLACED` no admiten un acuerdo nuevo.
  if (!accion || duenio !== datos.estudianteId || (status !== "RECOMMENDED" && status !== "ACCEPTED")) {
    return { compromiso: vacio, comprometible: false, yaViva: false };
  }

  const { data: vivos, error: errVivos } = await clienteDeServicio()
    .from("commitment")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("action_id", datos.actionId)
    .in("state", VIVOS)
    .limit(1);
  if (errVivos) throw new Error(`No se pudo leer commitment: ${errVivos.message}`);
  if ((vivos ?? []).length > 0) return { compromiso: vacio, comprometible: true, yaViva: true };

  const { data, error } = await clienteDeServicio()
    .from("commitment")
    .insert({
      institution_id: institutionId,
      action_id: datos.actionId,
      start_at: datos.startAt,
      timezone_at_commit: datos.timezone,
      planned_minutes: datos.plannedMinutes,
      state: "CONFIRMED",
      idempotency_key: datos.claveDeIdempotencia,
    })
    .select(COLUMNAS)
    .single();
  if (error) throw new Error(`No se pudo crear el compromiso: ${error.message}`);

  return { compromiso: aDominio(data as Record<string, unknown>), comprometible: true, yaViva: false };
}

/**
 * El compromiso **vivo de una `Action`**, si lo tiene.
 *
 * No sirve preguntar "cuál es el compromiso del estudiante": después de una
 * vuelta cerrada eso devuelve el `COMPLETED` de la vuelta anterior, y la vista
 * concluye que ya hay compromiso cuando la acción nueva no tiene ninguno. La
 * pregunta correcta cuelga de la `Action`.
 */
async function vivoDeAccion(institutionId: string, actionId: string): Promise<Compromiso | null> {
  const { data, error } = await clienteDeServicio()
    .from("commitment")
    .select(COLUMNAS)
    .eq("institution_id", institutionId)
    .eq("action_id", actionId)
    .in("state", VIVOS)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer commitment vivo: ${error.message}`);
  return data ? aDominio(data) : null;
}

/**
 * La implementación concreta, tipada contra el contrato que declara el Service.
 * Si el Service cambia lo que necesita, esto deja de compilar acá y no en una
 * request.
 */
export const compromisosReal: RepositorioDeCompromisos & {
  porClaveDeIdempotencia: typeof porClaveDeIdempotencia;
  huellaDeClave: typeof huellaDeClave;
  crearConfirmado: typeof crearConfirmado;
  vivoDeAccion: typeof vivoDeAccion;
} = { porId, cambiarEstadoSi, porClaveDeIdempotencia, renegociarAtomico, crearRescateAtomico, huellaDeClave, crearConfirmado, vivoDeAccion };
