import { canTransition, commitmentTransitions } from "@/lib/domain/state-machines";
import type { CommitmentState } from "@/lib/domain/types";
import type { PublicadorDeEventos } from "./eventos";
import {
  transicionarEntidad,
  type EntidadConEstado,
  type RepositorioTransicionable,
  type ResultadoDeTransicion,
} from "./transiciones";

/**
 * Service de `Commitment`.
 *
 * **La máquina de estados no se reescribe acá.** Es la misma
 * `commitmentTransitions` de `lib/domain/`, pura, que el Track A usa para
 * proyectar. Dos tablas de transiciones serían dos verdades sobre el mismo
 * dominio, y divergirían: el propio módulo lo anticipa —*"el Track B la ejecuta
 * en Service"*—.
 *
 * La secuencia —leer con scoping, validar, compare-and-swap, publicar— vive en
 * `transiciones.ts` y la comparte con `Action`.
 */
export interface Compromiso extends EntidadConEstado<CommitmentState> {
  actionId: string;
}

/** Datos del compromiso nuevo. El original nunca se edita más allá del estado. */
export interface AcuerdoNuevo {
  startAt: string;
  timezone: string;
  plannedMinutes: number;
  /** Idempotencia del lado del servidor (I8). */
  claveDeIdempotencia?: string;
}

export interface RepositorioDeCompromisos
  extends RepositorioTransicionable<CommitmentState, Compromiso> {
  /**
   * Marca el original y crea el sucesor **atómicamente**, o no hace nada.
   * `null` ⇒ el original ya no estaba en `esperado`: otro se adelantó.
   */
  renegociarAtomico(
    institutionId: string,
    originalId: string,
    esperado: CommitmentState,
    acuerdo: AcuerdoNuevo,
  ): Promise<Compromiso | null>;
  /** Crea el rescate **sólo si** el rescatado sigue `MISSED`. `null` si no. */
  crearRescateAtomico(
    institutionId: string,
    rescatadoId: string,
    acuerdo: AcuerdoNuevo,
  ): Promise<Compromiso | null>;
}
export type { ResultadoDeTransicion };

const MARCA_DE_TIEMPO: Partial<Record<CommitmentState, string>> = {
  STARTED: "started_at",
  COMPLETED: "completed_at",
  MISSED: "missed_at",
};

/**
 * Mueve un compromiso de estado.
 *
 * `institutionId` **no viene del cliente**: lo resuelve la sesión desde la
 * base. Aceptarlo del request sería regalar el aislamiento de Parte I §29.
 */
/** `MISSED` → `CommitmentMissed`. Exportado por el guard del Product Event Model. */
export function nombreDeEventoDeCommitment(hacia: CommitmentState): string {
  return `Commitment${hacia.charAt(0)}${hacia.slice(1).toLowerCase()}`;
}

export async function transicionar(
  deps: { repo: RepositorioDeCompromisos; eventos: PublicadorDeEventos },
  institutionId: string,
  id: string,
  hacia: CommitmentState,
  actorId: string | null = null,
  ahora: () => Date = () => new Date(),
) {
  return transicionarEntidad(
    deps,
    {
      entidad: "Commitment",
      transiciones: commitmentTransitions,
      sujetoTipo: "commitment",
      nombreDeEvento: nombreDeEventoDeCommitment,
      columnasPara: (h, cuando) => {
        const col = MARCA_DE_TIEMPO[h];
        return col ? { [col]: cuando.toISOString() } : {};
      },
    },
    institutionId,
    id,
    hacia,
    actorId,
    ahora,
  );
}

export type ResultadoDeAcuerdo =
  | { estado: "OK"; compromiso: Compromiso }
  | { estado: "NO_ENCONTRADO" }
  | { estado: "NO_RENEGOCIABLE"; desde: CommitmentState }
  | { estado: "NO_INCUMPLIDO"; desde: CommitmentState }
  | { estado: "CONFLICTO" };

/**
 * Renegociar **crea una fila nueva**; el original queda `RENEGOTIATED` con la
 * nueva apuntándolo (`I2`).
 *
 * **El original no se edita.** Su fecha, su hora y sus minutos quedan como
 * fueron acordados: es el registro de lo que se prometió, y reescribirlo
 * borraría que hubo una renegociación.
 *
 * Quién puede renegociar lo decide la máquina, acá, en TypeScript — `STARTED`
 * no puede, porque renegociar es válido sólo **antes** del vencimiento. La
 * función de base no sabe nada de eso: sólo garantiza que las dos escrituras
 * ocurran juntas.
 */
export async function renegociar(
  deps: { repo: RepositorioDeCompromisos; eventos: PublicadorDeEventos },
  institutionId: string,
  originalId: string,
  acuerdo: AcuerdoNuevo,
  actorId: string | null = null,
): Promise<ResultadoDeAcuerdo> {
  const original = await deps.repo.porId(institutionId, originalId);
  if (!original) return { estado: "NO_ENCONTRADO" };

  if (!canTransition(commitmentTransitions, original.state, "RENEGOTIATED")) {
    return { estado: "NO_RENEGOCIABLE", desde: original.state };
  }

  const nuevo = await deps.repo.renegociarAtomico(
    institutionId,
    originalId,
    original.state,
    acuerdo,
  );
  if (!nuevo) return { estado: "CONFLICTO" };

  await deps.eventos.publicar({
    nombre: "CommitmentRenegotiated",
    institutionId,
    actorId,
    sujetoTipo: "commitment",
    sujetoId: originalId,
    causa: `${original.state}->RENEGOTIATED`,
    // El sucesor va en el payload y no en columnas del hecho: el hecho es que
    // se renegoció; cuál es el sucesor es contenido de ese hecho.
    payload: { sucesorId: nuevo.id },
  });

  return { estado: "OK", compromiso: nuevo };
}

/**
 * Un rescate **sólo** puede apuntar a un `MISSED` (`I3`), y **el incumplido no
 * se toca**: sigue `MISSED` para siempre.
 *
 * Es *No Cortar* (`AGENTS.md` §2.4). Un `Commitment` `MISSED` nunca se edita
 * para parecer cumplido; el rescate es otro objeto, con su propia fecha y su
 * propio acuerdo, que apunta al incumplimiento sin borrarlo.
 */
export async function rescatar(
  deps: { repo: RepositorioDeCompromisos; eventos: PublicadorDeEventos },
  institutionId: string,
  rescatadoId: string,
  acuerdo: AcuerdoNuevo,
  actorId: string | null = null,
): Promise<ResultadoDeAcuerdo> {
  const rescatado = await deps.repo.porId(institutionId, rescatadoId);
  if (!rescatado) return { estado: "NO_ENCONTRADO" };

  if (rescatado.state !== "MISSED") {
    return { estado: "NO_INCUMPLIDO", desde: rescatado.state };
  }

  const rescate = await deps.repo.crearRescateAtomico(institutionId, rescatadoId, acuerdo);
  if (!rescate) return { estado: "CONFLICTO" };

  await deps.eventos.publicar({
    nombre: "CommitmentRescueCreated",
    institutionId,
    actorId,
    sujetoTipo: "commitment",
    sujetoId: rescate.id,
    causa: `rescata:${rescatadoId}`,
  });

  return { estado: "OK", compromiso: rescate };
}
