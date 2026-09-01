import "server-only";

import type { CommitmentState } from "@/lib/domain/types";
import type { AcuerdoNuevo } from "../servicios/compromiso";
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

/**
 * La implementación concreta, tipada contra el contrato que declara el Service.
 * Si el Service cambia lo que necesita, esto deja de compilar acá y no en una
 * request.
 */
export const compromisosReal: RepositorioDeCompromisos & {
  porClaveDeIdempotencia: typeof porClaveDeIdempotencia;
} = { porId, cambiarEstadoSi, porClaveDeIdempotencia, renegociarAtomico, crearRescateAtomico };
