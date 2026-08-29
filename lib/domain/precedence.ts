/**
 * Precedencia operativa del Hero de UX01.
 *
 * Owner canónico: `docs/product.md` §10.2. Extraída de
 * `components/screens/hoy-autogestion.tsx` como función pura en la Etapa 0.2.
 *
 * Esta es la ÚNICA lógica de selección que vive en el frontend, y no contradice
 * "la UI proyecta, nunca decide" (AGENTS.md §2.2) porque separa dos
 * responsabilidades distintas:
 *
 *   - **Prioridad académica** → la decide el ADE: qué materia y qué trabajo
 *     tienen más valor ahora. El frontend NO la calcula.
 *   - **Precedencia operativa de lifecycle** → la decide TodayView: qué objeto
 *     YA priorizado o YA iniciado exige una conducta inmediata. Es
 *     determinista y está especificada.
 *
 * Los estados de riesgo y de examen activo son **modificadores**, no
 * reemplazantes: cambian el estado general y el contexto, nunca la CTA. La
 * proyección no puede sustituir la recomendación principal por otra materia
 * debido a fecha de examen, riesgo, dificultad, brecha, antigüedad o
 * starvation.
 */

import type { RescueCondition } from "./state-machines";

/** Los nueve niveles de `product.md` §10.2, en orden de precedencia. */
export type HeroLevel =
  | "IN_PROGRESS"
  | "EVIDENCE_PENDING"
  | "COMMITMENT_NEXT"
  | "RESCUE_REQUIRED"
  | "COMMITMENT_MISSED"
  | "ACTION_RECOMMENDED"
  | "CONTEXT_INCOMPLETE"
  | "EVIDENCE_INFO"
  | "NO_ACTION_AVAILABLE";

export type HeroInput = {
  action: "NONE" | "IN_PROGRESS" | "EVIDENCE_PENDING";
  commitment: "NONE" | "CONFIRMED_OR_DUE" | "MISSED";
  rescue: RescueCondition;
  actionRecommended: boolean;
  contextIncomplete: boolean;
  evidenceInfoOnly: boolean;
};

/**
 * VI.1 §3.2 — **el primero que aplique gana.** No se reordena por riesgo ni por
 * proximidad de examen (§3.3).
 */
export function selectHeroLevel(input: HeroInput): HeroLevel {
  if (input.action === "IN_PROGRESS") return "IN_PROGRESS";
  if (input.action === "EVIDENCE_PENDING") return "EVIDENCE_PENDING";
  if (input.commitment === "CONFIRMED_OR_DUE" || input.rescue === "MATERIALIZED") {
    return "COMMITMENT_NEXT";
  }
  if (input.rescue === "REQUIRED") return "RESCUE_REQUIRED";
  if (input.commitment === "MISSED") return "COMMITMENT_MISSED";
  if (input.actionRecommended) return "ACTION_RECOMMENDED";
  if (input.contextIncomplete) return "CONTEXT_INCOMPLETE";
  if (input.evidenceInfoOnly) return "EVIDENCE_INFO";
  return "NO_ACTION_AVAILABLE";
}

/** Los nueve niveles en orden, para tests exhaustivos y para el catálogo. */
export const heroLevelsInPrecedenceOrder: readonly HeroLevel[] = [
  "IN_PROGRESS",
  "EVIDENCE_PENDING",
  "COMMITMENT_NEXT",
  "RESCUE_REQUIRED",
  "COMMITMENT_MISSED",
  "ACTION_RECOMMENDED",
  "CONTEXT_INCOMPLETE",
  "EVIDENCE_INFO",
  "NO_ACTION_AVAILABLE",
] as const;

/**
 * El orden por defecto de las listas, definido por `DD2`
 * (`domain-translation-dd1-dd10.md`): **Commitment más próximo a vencer
 * primero, proximidad del examen en segundo lugar.**
 *
 * Los dos relojes NUNCA se fusionan en un solo número: son criterios
 * ordenados, no una suma ponderada. `null` ordena al final — ausencia de dato
 * no es urgencia cero, simplemente no compite por el primer lugar.
 */
export function compareByDefaultOrder(
  a: { commitmentDueAt: string | null; examDaysAway: number | null },
  b: { commitmentDueAt: string | null; examDaysAway: number | null },
): number {
  const byCommitment = compareNullableAsc(a.commitmentDueAt, b.commitmentDueAt);
  if (byCommitment !== 0) return byCommitment;
  return compareNullableAsc(a.examDaysAway, b.examDaysAway);
}

function compareNullableAsc<T extends string | number>(a: T | null, b: T | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -1 : a > b ? 1 : 0;
}
