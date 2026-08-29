/**
 * Las cuatro máquinas de estado, como tablas de transición explícitas.
 *
 * Owner canónico: `docs/data-model.md` §3, derivado de `product.md` §5.
 * AGENTS.md §6: "Las máquinas de estado son tablas de transición explícitas,
 * no `if` encadenados. Las transiciones prohibidas tienen test."
 *
 * Estas tablas son la MISMA especificación que el Service del Track B va a
 * ejecutar (data-model.md §11, invariante I1). Acá no hay I/O: son datos y
 * funciones puras.
 */

import type {
  ActionStatus,
  CommitmentState,
  EvidenceState,
  ExamPreparationStatus,
} from "./types";

export const actionTransitions: Readonly<Record<ActionStatus, readonly ActionStatus[]>> = {
  RECOMMENDED: ["ACCEPTED", "BLOCKED", "CANCELLED", "REPLACED"],
  ACCEPTED: ["COMMITTED", "BLOCKED", "CANCELLED", "REPLACED"],
  COMMITTED: ["IN_PROGRESS", "BLOCKED", "CANCELLED", "REPLACED"],
  IN_PROGRESS: ["EVIDENCE_PENDING", "COMPLETED", "BLOCKED"],
  EVIDENCE_PENDING: ["COMPLETED", "BLOCKED"],
  COMPLETED: [],
  BLOCKED: ["RECOMMENDED", "ACCEPTED", "COMMITTED", "IN_PROGRESS", "CANCELLED"],
  CANCELLED: [],
  REPLACED: [],
} as const;

/**
 * `MISSED` es casi terminal por diseño: su única salida es `CLOSED`.
 *
 * No existe camino de `MISSED` a `COMPLETED`, `CONFIRMED` ni `RENEGOTIATED`.
 * Esto implementa *No Cortar* (AGENTS.md §2.4): el rescate es un objeto
 * separado, no una edición del original.
 *
 * `STARTED` NO admite `RENEGOTIATED`: renegociar es válido solo ANTES del
 * vencimiento.
 */
export const commitmentTransitions: Readonly<Record<CommitmentState, readonly CommitmentState[]>> = {
  DRAFT: ["CONFIRMED"],
  CONFIRMED: ["DUE", "STARTED", "RENEGOTIATED", "MISSED"],
  DUE: ["STARTED", "RENEGOTIATED", "MISSED"],
  STARTED: ["COMPLETED", "MISSED"],
  COMPLETED: [],
  RENEGOTIATED: [],
  MISSED: ["CLOSED"],
  CLOSED: [],
} as const;

/**
 * `RESUBMISSION_REQUESTED → SUBMITTED` NO ocurre sobre la misma fila. La
 * Evidence anterior queda en `RESUBMISSION_REQUESTED` con `supersededById`
 * apuntando a la nueva, que nace en `SUBMITTED` con `supersedesId` apuntando a
 * la anterior (invariante I4). La tabla declara la transición del lifecycle;
 * la identidad de la fila la resuelve el owner.
 */
export const evidenceOwnerTransitions: Readonly<Record<EvidenceState, readonly EvidenceState[]>> = {
  EXPECTED: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "SUFFICIENT", "INSUFFICIENT"],
  UNDER_REVIEW: ["SUFFICIENT", "INSUFFICIENT"],
  SUFFICIENT: ["VALIDATED"],
  INSUFFICIENT: ["RESUBMISSION_REQUESTED"],
  RESUBMISSION_REQUESTED: ["SUBMITTED"],
  VALIDATED: [],
} as const;

/**
 * ⚠️ `BUILDING`, `READY_BY_PROTOCOL` y `NOT_READY` colisionan con la entidad
 * separada `PreparationReadiness`. Esa contradicción es ADR-011 (`CR-UX08-01`)
 * y sigue `PENDING`: hasta resolverla NO se implementa `PreparationReadiness`.
 *
 * `data-model.md` §3.4 declara los estados pero **no** su tabla de
 * transiciones. Omitir, no inventar (AGENTS.md §2.7): acá no se aproxima una.
 * Se cierra en la Fase B5.
 */
export const examPreparationStates: readonly ExamPreparationStatus[] = [
  "RECOMMENDED",
  "ACTIVE",
  "BUILDING",
  "READY_BY_PROTOCOL",
  "NOT_READY",
  "BLOCKED",
  "EXAM_TAKEN",
  "CLOSED",
  "ABANDONED",
] as const;

// ─────────────────────────────────────────────────────────────────────────────

/** Una transición es válida solo si la tabla la declara. Deny-by-default. */
export function canTransition<S extends string>(
  table: Readonly<Record<S, readonly S[]>>,
  from: S,
  to: S,
): boolean {
  const allowed = table[from];
  return allowed !== undefined && allowed.includes(to);
}

export function isTerminal<S extends string>(
  table: Readonly<Record<S, readonly S[]>>,
  state: S,
): boolean {
  return (table[state]?.length ?? 0) === 0;
}

export class ForbiddenTransitionError extends Error {
  constructor(
    readonly entity: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Transición prohibida en ${entity}: ${from} → ${to}`);
    this.name = "ForbiddenTransitionError";
  }
}

/** Lanza si la transición no está declarada. El Track B la ejecuta en Service. */
export function assertTransition<S extends string>(
  entity: string,
  table: Readonly<Record<S, readonly S[]>>,
  from: S,
  to: S,
): void {
  if (!canTransition(table, from, to)) {
    throw new ForbiddenTransitionError(entity, from, to);
  }
}

/**
 * `RESCUE_REQUIRED` y `RESCUE_MATERIALIZED` NO son estados: son condiciones
 * derivadas de la proyección (data-model.md §3.2 y §12).
 */
export type RescueCondition = "NONE" | "REQUIRED" | "MATERIALIZED";
