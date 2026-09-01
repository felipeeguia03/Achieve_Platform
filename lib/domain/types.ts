/**
 * Tipos del dominio de Achieve.
 *
 * Owner canónico: `docs/data-model.md` §3, §4, §5 y §13. Estos mismos tipos los
 * consume el backend en el Track B (`data-model.md` §13): cuando `lib/fixtures/`
 * se reemplace por llamadas reales, esta capa no cambia.
 *
 * Regla de esta carpeta (AGENTS.md §6): `lib/domain/` es puro. Sin I/O, sin
 * React, sin fetch. Testeable en aislamiento.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Máquinas de estado · data-model.md §3
// ─────────────────────────────────────────────────────────────────────────────

export type ActionStatus =
  | "RECOMMENDED"
  | "ACCEPTED"
  | "COMMITTED"
  | "IN_PROGRESS"
  | "EVIDENCE_PENDING"
  | "COMPLETED"
  | "BLOCKED"
  | "CANCELLED"
  | "REPLACED";

export type CommitmentState =
  | "DRAFT"
  | "CONFIRMED"
  | "DUE"
  | "STARTED"
  | "COMPLETED"
  | "RENEGOTIATED"
  | "MISSED"
  | "CLOSED";

export type EvidenceState =
  | "EXPECTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SUFFICIENT"
  | "INSUFFICIENT"
  | "RESUBMISSION_REQUESTED"
  | "VALIDATED";

/**
 * El lifecycle de la preparación, **sin readiness**.
 *
 * `BUILDING`, `READY_BY_PROTOCOL` y `NOT_READY` estaban acá y se fueron con
 * ADR-011: son estados de `PreparationReadiness`, que es su única fuente. Un
 * tipo que los siguiera aceptando dejaría que el compilador aprobara la segunda
 * verdad que la decisión eliminó.
 */
export type ExamPreparationStatus =
  | "RECOMMENDED"
  | "ACTIVE"
  | "BLOCKED"
  | "EXAM_TAKEN"
  | "CLOSED"
  | "ABANDONED";

/** Los tres estados de readiness. Viven en `PreparationReadiness` (ADR-011). */
export type PreparationReadinessState = "NOT_READY" | "BUILDING" | "READY_BY_PROTOCOL";

export type RiskSignalStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "INTERVENTION_REQUIRED"
  | "RESOLVED"
  | "ESCALATED"
  | "EXPIRED";

/**
 * La escala de severidad, cerrada por `data-model.md` §10.
 *
 * **Es un dato, no un cálculo.** Qué severidad le corresponde a cada situación
 * es `C01-021`, y las tres reglas de `HUMAN-P0-06 v1.0` entraron **sin
 * severidad asignada**: nadie se la puso, y ausente no es `bajo`.
 */
export type SeveridadDeRiesgo = "bajo" | "atencion" | "riesgo" | "intervencion";

export type InterventionStatus = "open" | "acknowledged" | "closed";

/**
 * Los cinco resultados que cierran una intervención (`data-model.md` §10).
 *
 * ⚠️ **Cuál de los cinco cierra el circuito formalmente y cuál lo escala sigue
 * siendo `C01-044`** — el spec §32 lo pregunta textual: *"¿Qué outcomes cierran
 * formalmente una intervención?"*. El vocabulario está congelado; su semántica
 * operativa, no.
 */
export type ResultadoDeIntervencion =
  | "recuperado"
  | "replanificado"
  | "sin_respuesta"
  | "escalado"
  | "falso_positivo";

// ─────────────────────────────────────────────────────────────────────────────
// Provenance · data-model.md §4
//
// `source_type`, `verification_status` y el contexto de observación son TRES
// datos distintos. Ninguna capa eleva un `verificationStatus` (invariante I9).
// Los enums nunca aparecen como copy visible (AGENTS.md §2.6).
// ─────────────────────────────────────────────────────────────────────────────

export type SourceType =
  | "institution"
  | "instructor"
  | "student"
  | "community"
  | "public_web"
  | "inference";

export type VerificationStatus = "unverified" | "corroborated" | "official" | "disputed";

export type RightsStatus = "unknown" | "allowed" | "restricted";

export interface Provenance {
  sourceType: SourceType;
  sourceRef: string | null;
  observedAt: string;
  validFrom: string | null;
  validUntil: string | null;
  /** 0..1, operativa. NO es la confianza declarada por el estudiante. */
  confidence: number | null;
  verificationStatus: VerificationStatus;
  uploadedBy: string | null;
  rightsStatus: RightsStatus | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ausencia tipada · data-model.md §5, product.md §6, architecture.md P4
//
// Cuatro estados que NUNCA se colapsan. "Sin datos no es cero".
// `unavailable` es operativo: lo produce la lectura ante un fallo y no se
// persiste.
// ─────────────────────────────────────────────────────────────────────────────

export type DimensionValue =
  | { kind: "value"; value: number; unit: string; observedAt: string }
  | { kind: "not_evaluated" }
  | { kind: "no_information" }
  | { kind: "unavailable" };

/** Las cinco dimensiones de progreso, separadas y nunca fusionadas en un número. */
export interface TopicProgressDimensions {
  /** Recorrido */
  exposure: DimensionValue;
  /** Práctica */
  practice: DimensionValue;
  /** Dominio */
  domain: DimensionValue;
  /** Confianza — autorreporte del estudiante, con fecha */
  confidence: DimensionValue;
  /** Recencia */
  recency: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Entidades · data-model.md §13
// ─────────────────────────────────────────────────────────────────────────────

export interface Action {
  id: string;
  courseEnrollmentId: string;
  topicId: string | null;
  examPreparationId: string | null;
  objective: string;
  verb: string;
  scope: string;
  /** `null` ⇒ se omite la línea de tiempo. Omitir, no inventar (AGENTS.md §2.7). */
  estimatedMinutes: { min: number; max: number } | null;
  /** `null` ⇒ no se inventa el requisito de evidencia. */
  expectedEvidence: string | null;
  completionCriterion: string | null;
  status: ActionStatus;
}

export interface Commitment {
  id: string;
  actionId: string;
  /** Fecha y hora acordadas, en la zona declarada. `null` ⇒ todavía no acordadas. */
  scheduledFor: string | null;
  timezone: string | null;
  declaredMinutes: number | null;
  state: CommitmentState;
  /** Renegociación: el original queda `RENEGOTIATED` y el nuevo lo referencia. */
  renegotiatedFromId: string | null;
  /** Rescate: solo puede apuntar a un Commitment `MISSED` (invariante I3). */
  rescuesCommitmentId: string | null;
}

export interface Evidence {
  id: string;
  commitmentId: string | null;
  protocolStepId: string | null;
  state: EvidenceState;
  /** `UNDER_REVIEW` exige una instancia real, no un método configurado (I5). */
  reviewInstanceRef: string | null;
  /** Resubmission: la anterior se preserva, nunca se sobrescribe (I4). */
  supersedesId: string | null;
  supersededById: string | null;
  submittedAt: string | null;
}

export interface Reflection {
  id: string;
  evidenceId: string | null;
  requirement: "OPTIONAL" | "REQUIRED";
  content: string | null;
}

/** Recomendación del ADE. Exactamente una principal por contexto (I6). */
export interface ActionRecommendation {
  id: string;
  actionId: string;
  isPrimary: boolean;
  /** La línea `Porque:` — DD10. `null` ⇒ se omite la línea. */
  reason: string | null;
  provenance: Provenance | null;
}
