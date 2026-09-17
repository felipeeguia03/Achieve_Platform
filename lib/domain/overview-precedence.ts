/**
 * Matriz de precedencia operativa de `UX08` (Modo Examen / Overview).
 *
 * Owner canónico: `product-spec-source.md` §VI.8 §13.
 *
 * **Es una matriz distinta de la de `UX01`** (`precedence.ts`). Aquélla ordena
 * el día del estudiante; ésta ordena una preparación de examen concreta. El
 * spec es explícito: *"Sólo se consideran objetos vinculados inequívocamente a
 * esta preparación/Assessment o contexto autorizado; **no se comparan
 * materias**."*
 *
 * Diez niveles ordenados, en catorce filas: el spec abre el 3 en tres variantes,
 * el 4 en dos y el 9 en `9a`/`9b`. Se conserva su numeración —aplanarla a
 * catorce rompería la trazabilidad contra §13— y la variante viaja al lado.
 *
 * Como en `UX01`: **la función decide, el fixture declara la condición.** Acá no
 * se rankea nada académico; se resuelve precedencia operativa de lifecycle, que
 * es determinista y está especificada.
 */

import type { RescueCondition } from "./state-machines";

export type NivelOverview = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type VarianteOverview =
  | "COMMITMENT_CONFIRMED_FUTURO"
  | "COMMITMENT_DUE"
  | "COMMITMENT_STARTED"
  | "RESCUE_REQUIRED"
  | "RESCATE_REAL"
  | "PROGRESS_UPDATED"
  | "PROGRESS_ENTRY";

export interface ResultadoOverview {
  nivel: NivelOverview;
  variante: VarianteOverview | null;
}

export interface OverviewInput {
  action: "NONE" | "IN_PROGRESS" | "EVIDENCE_PENDING";
  commitment: "NONE" | "CONFIRMED_FUTURO" | "DUE" | "STARTED" | "MISSED";
  rescate: RescueCondition;
  evidence: "NONE" | "INFORMATIVA" | "RESUBMISSION_REQUESTED" | "UNDER_REVIEW";
  recomendacionPrimariaVigente: boolean;
  /** El owner provee un paso actual y su ruta. La UI **no elige** el paso. */
  pasoActualDisponible: boolean;
  /** Una condición autoritativa del protocolo bloquea la transición. */
  gateAutoritativo: boolean;
  /**
   * `null` ⇒ no hay `ProgressUpdated` ni `ProgressEntry` que mostrar.
   *
   * `VER AVANCE` y `VER BITÁCORA` **nunca son alternativas locales**: cada una
   * exige su destino canónico inequívoco. Si el destino es ambiguo, esto es
   * `"AMBIGUO"` y se cae al siguiente fallback operativo aplicable.
   */
  progreso: "NONE" | "PROGRESS_UPDATED" | "PROGRESS_ENTRY" | "AMBIGUO";
}

/**
 * El primero que aplique gana.
 *
 * Los conflictos que §13 declara explícitamente salen de este orden, no de
 * casos especiales: `IN_PROGRESS` vence a un `MISSED` previo,
 * `EVIDENCE_PENDING` vence a la recomendación, un Commitment vigente vence a la
 * recomendación, `MISSED` vence a una recomendación no aceptada, y la
 * recomendación vence a un `ProgressUpdated` informativo.
 */
export function selectOverviewLevel(input: OverviewInput): ResultadoOverview {
  // 1 — trabajo iniciado.
  if (input.action === "IN_PROGRESS") return { nivel: 1, variante: null };

  // 2 — cierre requerido.
  if (input.action === "EVIDENCE_PENDING") return { nivel: 2, variante: null };

  // 3 — acuerdo vigente, en sus tres formas.
  if (input.commitment === "CONFIRMED_FUTURO") {
    return { nivel: 3, variante: "COMMITMENT_CONFIRMED_FUTURO" };
  }
  if (input.commitment === "DUE") return { nivel: 3, variante: "COMMITMENT_DUE" };
  if (input.commitment === "STARTED") return { nivel: 3, variante: "COMMITMENT_STARTED" };

  // 4 — incumplimiento. Un rescate materializado tiene su propio lifecycle.
  if (input.rescate === "MATERIALIZED") return { nivel: 4, variante: "RESCATE_REAL" };
  if (input.rescate === "REQUIRED" || input.commitment === "MISSED") {
    return { nivel: 4, variante: "RESCUE_REQUIRED" };
  }

  // 5 — nueva presentación. La anterior se preserva.
  if (input.evidence === "RESUBMISSION_REQUESTED") return { nivel: 5, variante: null };

  // 6 — recomendación vigente del ADE. La UI no recalcula.
  if (input.recomendacionPrimariaVigente) return { nivel: 6, variante: null };

  // 7 — paso actual accionable.
  //
  // Los lifecycles de los niveles 1–6 vencen al paso, pero una Evidence
  // meramente informativa y un ProgressUpdated NO lo ocultan. Un gate
  // autoritativo sí: entonces el paso no se presenta como disponible.
  if (input.pasoActualDisponible && !input.gateAutoritativo) {
    return { nivel: 7, variante: null };
  }

  // 8 — Evidence informativa, sin niveles 1–7.
  //
  // `UNDER_REVIEW` queda secundaria ante un paso accionable sin gate; si el
  // gate real deja el paso no disponible, pasa a primaria acá.
  if (input.evidence === "INFORMATIVA" || input.evidence === "UNDER_REVIEW") {
    return { nivel: 8, variante: null };
  }

  // 9a / 9b — cada CTA exige su destino canónico inequívoco.
  if (input.progreso === "PROGRESS_UPDATED") return { nivel: 9, variante: "PROGRESS_UPDATED" };
  if (input.progreso === "PROGRESS_ENTRY") return { nivel: 9, variante: "PROGRESS_ENTRY" };
  // `AMBIGUO` cae al siguiente fallback operativo: no se elige localmente.

  // 10 — sin objeto ni destino. Estado honesto: no se genera nada.
  return { nivel: 10, variante: null };
}

/** Los diez niveles en orden, para tests exhaustivos. */
export const nivelesOverview: readonly NivelOverview[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
