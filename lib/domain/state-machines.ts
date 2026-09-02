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
  InterventionStatus,
  RiskSignalStatus,
  VerificationStatus,
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
 * Los estados del lifecycle de `ExamPreparation`, **después de ADR-011**.
 *
 * `BUILDING`, `READY_BY_PROTOCOL` y `NOT_READY` ya no están acá, y no es una
 * omisión: eran la contradicción `CR-UX08-01`. ADR-011 decidió que readiness
 * tiene **una sola fuente** y que es `PreparationReadiness`; dejarlos en este
 * enum sería mantener la segunda verdad que ese ADR prohíbe.
 */
export const examPreparationStates: readonly ExamPreparationStatus[] = [
  "RECOMMENDED",
  "ACTIVE",
  "REPLANNED",
  "BLOCKED",
  "EXAM_TAKEN",
  "CLOSED",
  "CANCELLED",
  "EXPLICITLY_ABANDONED",
] as const;

/**
 * Y ahora sí, la tabla de transiciones que `data-model.md` §3.4 no traía.
 *
 * Sale de la máquina que `product.md` §5.4 dibuja, **quitándole los tres nodos
 * de readiness**. El original era:
 *
 * ```
 * RECOMMENDED → ACTIVE → BUILDING → READY_BY_PROTOCOL → EXAM_TAKEN → CLOSED
 *                     ↘ NOT_READY / BLOCKED
 *                     ↘ CANCELLED / EXPLICITLY_ABANDONED (conservan historial)
 * ```
 *
 * Sacados `BUILDING`, `READY_BY_PROTOCOL` y `NOT_READY`, la cadena central se
 * cierra en `ACTIVE → EXAM_TAKEN`. **No es un atajo nuevo:** es el mismo camino
 * sin los nodos que dejaron de pertenecer a esta entidad.
 *
 * `BLOCKED` queda **sin salida declarada**, y tampoco se le inventa una. El
 * diagrama no dibuja el retorno y `C01-025` —ownership y lifecycle de
 * `ExamPreparation`— sigue `OPEN`. Deny-by-default: lo que nadie declaró, no
 * se puede.
 */
export const examPreparationTransitions: Readonly<
  Record<ExamPreparationStatus, readonly ExamPreparationStatus[]>
> = {
  RECOMMENDED: ["ACTIVE"],
  // REPLANNED no entra por la transición genérica: `replanificar_preparacion`
  // crea la versión y cambia el estado en una sola transacción (ADR-038).
  ACTIVE: ["BLOCKED", "EXAM_TAKEN", "CANCELLED", "EXPLICITLY_ABANDONED"],
  REPLANNED: ["BLOCKED", "EXAM_TAKEN", "CANCELLED", "EXPLICITLY_ABANDONED"],
  BLOCKED: [],
  EXAM_TAKEN: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
  EXPLICITLY_ABANDONED: [],
} as const;

/**
 * `RiskSignal` — Fase B6.
 *
 * Sale del diagrama de `product.md` §5.5:
 *
 * ```
 * OPEN ──────────────► INTERVENTION_REQUIRED ──► RESOLVED
 *  │                                          ↘  ESCALATED
 *  └──► EXPIRED
 *
 * ACKNOWLEDGED  ·  legacy
 * ```
 *
 * **`OPEN → INTERVENTION_REQUIRED` es directo** — [ADR-034](../../docs/decisions.md#adr-034), que
 * cerró `C01-022`. La necesidad de una persona la declara la Plataforma desde
 * `risk_rule.modo`, y **no depende de que alguien haya visto la señal**.
 *
 * La versión anterior obligaba a pasar por `ACKNOWLEDGED`, y era un peaje sin
 * cobrador: se dibujó cuando la cola de operador iba a vivir acá. Con el
 * operador en el CRM ([ADR-033](../../docs/decisions.md#adr-033)) nadie podía
 * producir ese paso, y `abrir_intervencion()` rechazaba todo lo demás — la
 * máquina no se podía recorrer.
 *
 * **`ACKNOWLEDGED` queda como legacy y conserva sus salidas.** No se borra el
 * valor ni las filas: una señal anterior a ADR-034 conserva su significado
 * —*"alguien tomó conocimiento"*— y tiene que poder terminar su recorrido.
 * **Ninguna señal nueva entra ahí**: no es destino de ningún estado vivo, el
 * Service lo excluye por tipo y un trigger lo rechaza en la base.
 *
 * Que el operador se haya hecho cargo es un hecho de la `Intervention`
 * —`interventionTransitions`, `open → acknowledged`—, y siempre lo fue.
 *
 * **`RESOLVED` sólo se alcanza desde `INTERVENTION_REQUIRED`, y eso es el Done
 * de la fase, no una restricción de más.** El spec: *"el dashboard no es el
 * final del Risk Engine. El final es una señal resuelta, escalada o
 * explícitamente cerrada con resultado"*. Si `ACKNOWLEDGED → RESOLVED`
 * existiera, una señal podría marcarse resuelta sin que nadie la trabajara, que
 * es exactamente el tablero en verde con nada detrás.
 *
 * **`EXPIRED` es la salida de las que dejaron de ser relevantes** —*"una señal
 * puede expirar si deja de ser relevante; se guarda la causa histórica"*— y en
 * el lifecycle vivo llega **sólo desde `OPEN`**: al salir `ACKNOWLEDGED` del
 * recorrido, es la única puerta que queda. Dejar expirar una que ya pidió una
 * persona borraría una obligación humana pendiente, y el Done dice que ninguna
 * señal queda sin outcome.
 *
 * La arista `ACKNOWLEDGED → EXPIRED` **se conserva para las filas históricas**,
 * pero el reloj ya no las levanta: `senalesVencidas()` filtra `OPEN` y nada
 * más. Una señal vieja no se vence sola; alguien tiene que moverla.
 *
 * `ESCALATED` queda sin salida declarada: el spec dibuja la bifurcación y no el
 * retorno. Qué pasa después de escalar es `C01-022` y `C01-044`.
 */
export const riskSignalTransitions: Readonly<
  Record<RiskSignalStatus, readonly RiskSignalStatus[]>
> = {
  OPEN: ["INTERVENTION_REQUIRED", "EXPIRED"],
  /** **Legacy** (ADR-034). Nadie entra; las filas históricas salen. */
  ACKNOWLEDGED: ["INTERVENTION_REQUIRED", "EXPIRED"],
  INTERVENTION_REQUIRED: ["RESOLVED", "ESCALATED"],
  RESOLVED: [],
  ESCALATED: [],
  EXPIRED: [],
} as const;

/**
 * `Intervention` — Fase B6.
 *
 * `data-model.md` §10 declara los tres estados y **ninguna tabla de
 * transiciones**, así que se toma el orden del Golden Path D del spec:
 * *selecciona caso → contexto → intervención → resultado*. Reconocer no es
 * decorativo: es el momento en que una persona se hace cargo, y sin él
 * "cerrada" no distingue una intervención trabajada de una despachada.
 *
 * `closed` es terminal. Reabrir una intervención cerrada sería editar un hecho
 * con su outcome ya registrado — *No Cortar*, la misma regla que impide tocar
 * un `Commitment` `MISSED`.
 */
export const interventionTransitions: Readonly<
  Record<InterventionStatus, readonly InterventionStatus[]>
> = {
  open: ["acknowledged"],
  acknowledged: ["closed"],
  closed: [],
} as const;

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

/**
 * `Provenance.verificationStatus` — Etapa B2b.2, invariante `I9`.
 *
 * > *"Ninguna capa eleva un `verification_status`. **Operación explícita del
 * > owner en Service + autorización y auditoría**; Repository no expone un
 * > update genérico del campo."* — `data-model.md` §11
 *
 * La máquina existe acá para poder **leerla y testearla sin base**, y está
 * además impuesta en `corroborar_procedencia()`: que las dos digan lo mismo se
 * verifica, y que sólo una de las dos exista sería peor de las dos formas.
 *
 * ## Las tres reglas que la explican
 *
 * **Nada vuelve a `unverified`.** Bajar a *"nadie lo miró"* borraría que alguien
 * lo miró, y el historial de corroboraciones dejaría de cerrar contra el estado.
 *
 * **`disputed` no es terminal.** Una disputa que se resuelve tiene que poder
 * volver, con la misma exigencia de fuente concreta. Dejarla terminal dejaría
 * varada para siempre una fila disputada por error — el mismo criterio con el
 * que [ADR-034](../../docs/decisions.md#adr-034) le conservó las salidas a
 * `ACKNOWLEDGED`.
 *
 * ⚠️ **A `official` no llega nadie, y no es un olvido.** `official` significa
 * que **la institución lo afirma**, y la Plataforma no puede autenticar a una
 * institución hoy: `C01-030` está `OPEN`,
 * [ADR-023](../../docs/decisions.md#adr-023) sacó la identidad de docente y
 * [ADR-033](../../docs/decisions.md#adr-033) mandó las superficies de operador
 * al CRM. El estado se conserva —una fila puede venir así de otro lado— y
 * **conserva su salida**, pero ninguna operación lo produce. Alcanzarlo hoy
 * sería fabricar autoridad.
 */
export const provenanceTransitions: Readonly<
  Record<VerificationStatus, readonly VerificationStatus[]>
> = {
  unverified: ["corroborated", "disputed"],
  corroborated: ["disputed"],
  disputed: ["corroborated"],
  /** Nadie entra. Conserva su salida para que una fila así no quede varada. */
  official: ["disputed"],
} as const;

/** Los estados que una corroboración puede **producir**. `official` no está. */
export const ESTADOS_CORROBORABLES: readonly VerificationStatus[] = [
  "corroborated",
  "disputed",
] as const;

export function puedeCorroborar(
  desde: VerificationStatus,
  hacia: VerificationStatus,
): boolean {
  if (!ESTADOS_CORROBORABLES.includes(hacia)) return false;
  return provenanceTransitions[desde].includes(hacia);
}
