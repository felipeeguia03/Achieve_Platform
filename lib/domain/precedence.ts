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

/**
 * Las variantes que discriminan la CTA dentro de un nivel
 * ([ADR-017](../../docs/decisions.md)).
 *
 * `product.md` §10.2 ofrecía dos verbos en los niveles 3 y 8 sin decir cuál
 * aplica. No era una decisión abierta: era un resumen que perdió el
 * discriminador. `VI.1` §3.2 lo fija — el nivel 3 se decide **por lifecycle y
 * tiempo acordado**, y el 8 **por lifecycle de la Evidence**.
 */
export type HeroVariante =
  /** Commitment acordado a futuro → `Ver compromiso`. */
  | "COMMITMENT_PROXIMO"
  /** Commitment startable now → `Empezar`. */
  | "COMMITMENT_STARTABLE"
  /** Rescate materializado y startable now → `Empezar rescate`. */
  | "RESCATE_STARTABLE"
  /** Evidence `SUBMITTED`/`UNDER_REVIEW` sin acción posterior → `Ver evidencia`. */
  | "EVIDENCIA_ENVIADA"
  /** Evidence `VALIDATED` sin acción posterior → `Ver avance`. */
  | "EVIDENCIA_VALIDADA";

export interface ResultadoHero {
  nivel: HeroLevel;
  variante: HeroVariante | null;
}

export type HeroInput = {
  action: "NONE" | "IN_PROGRESS" | "EVIDENCE_PENDING";
  /**
   * `PROXIMO` = acordado a futuro. `STARTABLE` = iniciable ahora según el
   * owner — nunca según un reloj local.
   */
  commitment: "NONE" | "PROXIMO" | "STARTABLE" | "MISSED";
  /**
   * `MATERIALIZED` **no es un nivel**: sólo declara que el objeto en juego es
   * un rescate, para que la CTA diga `Empezar rescate` en vez de `Empezar`.
   *
   * `VI.1` §3.2: *"RESCUE_MATERIALIZED no describe por sí solo qué necesita
   * hacer el alumno ahora, por eso participa en la precedencia según su
   * lifecycle real"*. Una Action de rescate `IN_PROGRESS` es nivel 1;
   * `EVIDENCE_PENDING`, nivel 2; un Commitment de rescate `PROXIMO`/`STARTABLE`,
   * nivel 3. **Un compromiso actual no es desplazado por un rescate anterior
   * sólo por ser un rescate.**
   */
  rescate: RescueCondition;
  actionRecommended: boolean;
  contextIncomplete: boolean;
  /** El lifecycle de una Evidence informativa, sin acción posterior válida. */
  evidenciaInformativa: "NONE" | "ENVIADA" | "VALIDADA";
};

/**
 * VI.1 §3.2 — **el primero que aplique gana.** No se reordena por riesgo ni por
 * proximidad de examen (§3.3): son modificadores, no reemplazantes.
 */
export function selectHeroLevel(input: HeroInput): ResultadoHero {
  if (input.action === "IN_PROGRESS") return { nivel: "IN_PROGRESS", variante: null };
  if (input.action === "EVIDENCE_PENDING") return { nivel: "EVIDENCE_PENDING", variante: null };

  // Nivel 3 — el discriminador es el tiempo acordado, no la prioridad académica.
  if (input.commitment === "PROXIMO") {
    return { nivel: "COMMITMENT_NEXT", variante: "COMMITMENT_PROXIMO" };
  }
  if (input.commitment === "STARTABLE") {
    return {
      nivel: "COMMITMENT_NEXT",
      variante: input.rescate === "MATERIALIZED" ? "RESCATE_STARTABLE" : "COMMITMENT_STARTABLE",
    };
  }

  if (input.rescate === "REQUIRED") return { nivel: "RESCUE_REQUIRED", variante: null };
  if (input.commitment === "MISSED") return { nivel: "COMMITMENT_MISSED", variante: null };
  if (input.actionRecommended) return { nivel: "ACTION_RECOMMENDED", variante: null };
  if (input.contextIncomplete) return { nivel: "CONTEXT_INCOMPLETE", variante: null };

  // Nivel 8 — el discriminador es el lifecycle de la Evidence.
  if (input.evidenciaInformativa === "ENVIADA") {
    return { nivel: "EVIDENCE_INFO", variante: "EVIDENCIA_ENVIADA" };
  }
  if (input.evidenciaInformativa === "VALIDADA") {
    return { nivel: "EVIDENCE_INFO", variante: "EVIDENCIA_VALIDADA" };
  }

  return { nivel: "NO_ACTION_AVAILABLE", variante: null };
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
