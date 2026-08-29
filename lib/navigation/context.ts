/**
 * El contexto autoritativo que una CTA lee para decidir si aparece.
 *
 * **La UI proyecta, nunca decide** (AGENTS.md §2.2). Cada campo de acá es un
 * resultado que el owner ya produjo: la pantalla lo relee, no lo calcula. Por
 * eso no hay ningún campo derivado — nada de "estáAtrasado" ni "esUrgente".
 *
 * En el Track A lo declara cada escenario del catálogo. En el Track B lo emite
 * el backend, y ni las CTAs ni las pantallas cambian.
 */

import type { ActionStatus, CommitmentState, EvidenceState } from "@/lib/domain/types";
import type { RescueCondition } from "@/lib/domain/state-machines";

export interface ContextoCTA {
  // ── Contexto académico ────────────────────────────────────────────────────
  courseVisible: boolean;
  /** Emitida por el ADE y todavía vigente. Vencida ⇒ `false`: se relee. */
  recomendacionPrimariaVigente: boolean;

  // ── Loop de ejecución ─────────────────────────────────────────────────────
  actionStatus: ActionStatus | null;
  commitmentState: CommitmentState | null;
  /** Lo declara el owner. Abrir la pantalla o un timer local NO lo produce. */
  commitmentIniciable: boolean;
  cierreConductualPermitido: boolean;
  /** Condición derivada de la proyección, no un estado persistido. */
  rescate: RescueCondition;

  // ── Renegociación ─────────────────────────────────────────────────────────
  /** Elegibilidad autoritativa vigente. Ausente o inconsistente ⇒ `false`. */
  renegociacionElegible: boolean;
  /** Nueva fecha, hora y capacidad válidas, sobre la misma Action. */
  propuestaRenegociacionValida: boolean;

  // ── Evidencia y reflexión ─────────────────────────────────────────────────
  evidenceState: EvidenceState | null;
  /** Contenido y tipo válidos para enviar. */
  contenidoEvidenciaValido: boolean;
  reflectionRequerida: "NO_REQUERIDA" | "VALIDA" | "INVALIDA";
  reflectionConfigurada: boolean;

  // ── Lectura y navegación ──────────────────────────────────────────────────
  progresoDisponible: boolean;
  navegacionDisponible: boolean;

  // ── Modo Examen ───────────────────────────────────────────────────────────
  assessmentElegible: boolean;
  /** El estudiante confirmó explícitamente. No existe variante auto-activa. */
  confirmacionExplicita: boolean;
  pasoActualAutoritativo: boolean;
  /** Un gate del protocolo impide abrir el paso. */
  hayGate: boolean;
  /** Existe un objeto de mayor precedencia que el paso actual. */
  objetoDeMayorPrecedencia: boolean;

  // ── Errores ───────────────────────────────────────────────────────────────
  /**
   * Hay un error recuperable Y existe una operación idempotente o una
   * relectura por identidad. Sin eso no se ofrece reintentar: reintentar a
   * ciegas duplica.
   */
  errorRecuperableConOperacionIdempotente: boolean;
}

/**
 * El contexto neutro: nada disponible, nada en curso, nada elegible.
 *
 * Los escenarios se escriben **desde acá**, activando solo lo que su momento
 * del loop declara. Es lo contrario de un default optimista: si un escenario se
 * olvida de declarar algo, la CTA no aparece — deny-by-default.
 */
export const contextoVacio: ContextoCTA = {
  courseVisible: false,
  recomendacionPrimariaVigente: false,
  actionStatus: null,
  commitmentState: null,
  commitmentIniciable: false,
  cierreConductualPermitido: false,
  rescate: "NONE",
  renegociacionElegible: false,
  propuestaRenegociacionValida: false,
  evidenceState: null,
  contenidoEvidenciaValido: false,
  reflectionRequerida: "NO_REQUERIDA",
  reflectionConfigurada: false,
  progresoDisponible: false,
  navegacionDisponible: false,
  assessmentElegible: false,
  confirmacionExplicita: false,
  pasoActualAutoritativo: false,
  hayGate: false,
  objetoDeMayorPrecedencia: false,
  errorRecuperableConOperacionIdempotente: false,
};

/**
 * Construye un contexto activando solo lo que este momento del loop declara.
 *
 * **Esto no contradice "escenarios completos y explícitos"** (decisión de la
 * Etapa 0.2). Esa regla existe para que un escenario no herede de OTRO
 * escenario, que es donde se esconden las reglas de negocio. Acá la base es
 * `contextoVacio`: una constante documentada, todo en falso, igual para todos.
 * Lo que queda explícito en cada escenario es exactamente lo que ese escenario
 * activa — que es la información que importa leer.
 */
export function contexto(activa: Partial<ContextoCTA>): ContextoCTA {
  return { ...contextoVacio, ...activa };
}
