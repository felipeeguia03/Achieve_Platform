/**
 * Matriz de precedencia operativa de `UX09` (Paso de Protocolo).
 *
 * Owner canónico: `product-spec-source.md` §VI.9 §19.
 *
 * ── Por qué es una función aparte ───────────────────────────────────────────
 *
 * Se parece mucho a la de `UX08` (`overview-precedence.ts`), pero **no es la
 * misma matriz**, y unificarlas acoplaría dos documentos normativos distintos:
 * un cambio en §13 alteraría en silencio el comportamiento de `UX09`, y al
 * revés. Cada línea de acá es trazable a §19.
 *
 * Las diferencias reales:
 *
 * | | `UX08` §13 | `UX09` §19 |
 * |---|---|---|
 * | Nivel 7 | `ABRIR PASO ACTUAL` | **`ABRIR RECURSO`** |
 * | Nivel 10 | *(no existe)* | **paso completado → abrir el nuevo current** |
 * | Fallback | `VOLVER A CURSADO` | **`VOLVER AL OVERVIEW`** |
 *
 * Once niveles ordenados, en catorce filas: §19 abre el 3 en `3a`/`3b`/`3c` y
 * el 9 en `9a`/`9b`.
 *
 * Como las otras dos: **la función decide, el fixture declara la condición.**
 * `WF-S11` no compara materias ni recomendaciones.
 */

import type { RescueCondition } from "./state-machines";

export type NivelPaso = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type VariantePaso =
  | "COMMITMENT_CONFIRMED_FUTURO"
  | "COMMITMENT_DUE"
  | "COMMITMENT_STARTED"
  | "PROGRESS_UPDATED"
  | "PROGRESS_ENTRY";

export interface ResultadoPaso {
  nivel: NivelPaso;
  variante: VariantePaso | null;
}

export interface StepInput {
  action: "NONE" | "IN_PROGRESS" | "EVIDENCE_PENDING";
  commitment: "NONE" | "CONFIRMED_FUTURO" | "DUE" | "STARTED" | "MISSED";
  rescate: RescueCondition;
  evidence: "NONE" | "INFORMATIVA" | "RESUBMISSION_REQUESTED" | "UNDER_REVIEW";
  recomendacionPrimariaVigente: boolean;
  /** Hay un `Resource` real configurado y su ruta es válida. */
  recursoDisponible: boolean;
  /** El cierre del paso todavía no fue confirmado por el owner. */
  cierreNoConfirmado: boolean;
  /** Un gate autoritativo impide actuar sobre el paso durante la revisión. */
  gateAutoritativo: boolean;
  progreso: "NONE" | "PROGRESS_UPDATED" | "PROGRESS_ENTRY" | "AMBIGUO";
  /**
   * El paso ya está completado **y** el owner entregó un nuevo current con
   * ruta real. Abrirlo no completa el nuevo paso.
   */
  nuevoCurrentDisponible: boolean;
}

export function selectStepLevel(input: StepInput): ResultadoPaso {
  // 1 — la Action en curso vence a MISSED previo, Evidence informativa,
  // progreso y recomendación.
  if (input.action === "IN_PROGRESS") return { nivel: 1, variante: null };

  // 2 — vence a recomendación y a Resource.
  if (input.action === "EVIDENCE_PENDING") return { nivel: 2, variante: null };

  // 3a / 3b / 3c — Commitment vigente vence a recomendación y a Resource.
  if (input.commitment === "CONFIRMED_FUTURO") {
    return { nivel: 3, variante: "COMMITMENT_CONFIRMED_FUTURO" };
  }
  if (input.commitment === "DUE") return { nivel: 3, variante: "COMMITMENT_DUE" };
  if (input.commitment === "STARTED") return { nivel: 3, variante: "COMMITMENT_STARTED" };

  // 4 — MISSED vence a una recomendación no aceptada. No crea rescate ni borra
  // el MISSED.
  if (input.commitment === "MISSED" || input.rescate === "REQUIRED") {
    return { nivel: 4, variante: null };
  }

  // 5 — vence a recomendación y a Resource. Conserva la anterior.
  if (input.evidence === "RESUBMISSION_REQUESTED") return { nivel: 5, variante: null };

  // 6 — la recomendación vence a Resource, Evidence informativa y
  // ProgressUpdated.
  if (input.recomendacionPrimariaVigente) return { nivel: 6, variante: null };

  // 7 — Resource accionable. Conserva prioridad sobre una Evidence
  // meramente informativa cuando NO existe gate autoritativo.
  //
  // Abrir el recurso es **navegación, no transición**: no produce evento de
  // dominio, no cambia estado y no registra progreso (§19.3).
  if (input.recursoDisponible && input.cierreNoConfirmado && !input.gateAutoritativo) {
    return { nivel: 7, variante: null };
  }

  // 8 — Evidence informativa, o gate real durante la revisión. El gate no se
  // inventa: llega del owner.
  if (input.evidence === "INFORMATIVA" || input.evidence === "UNDER_REVIEW") {
    return { nivel: 8, variante: null };
  }

  // 9a / 9b — cada CTA exige su destino canónico. `AMBIGUO` no se resuelve acá.
  if (input.progreso === "PROGRESS_UPDATED") return { nivel: 9, variante: "PROGRESS_UPDATED" };
  if (input.progreso === "PROGRESS_ENTRY") return { nivel: 9, variante: "PROGRESS_ENTRY" };

  // 10 — el paso está completado y hay un nuevo current con ruta real.
  //
  // La completion autoritativa invalida las acciones locales del paso
  // completado; por eso este nivel va después de todos los lifecycles.
  if (input.nuevoCurrentDisponible) return { nivel: 10, variante: null };

  // 11 — sin objeto, sin destino o sin ruta. Conserva la preparación y su
  // estado; la UI no genera una Action para evitar el empty state.
  return { nivel: 11, variante: null };
}

export const nivelesPaso: readonly NivelPaso[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
