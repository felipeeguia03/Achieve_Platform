/**
 * Registro canónico de CTAs — `CTA-001` … `CTA-019`.
 *
 * Owner canónico: `docs/product-spec-source.md` Parte III §5, que es explícito:
 * *"Ningún otro artifact mantiene una copia normativa de este registro."* Este
 * archivo es la **transcripción ejecutable** de esa tabla, no una segunda
 * fuente: cada fila conserva sus siete campos de contrato observable más el
 * octavo de trazabilidad.
 *
 * ── La única fila que NO viene de esa tabla ─────────────────────────────────
 *
 * **`CTA-019` es una corrección aprobada del registro**, no una transcripción:
 * [ADR-016](../../docs/decisions.md#adr-016), decidido por el owner el 1 de
 * septiembre de 2026. El spec describe en `§VI.7` §9 y §13 una entrada manual
 * `UX02 → UX07` —elegir entre `Assessments` de la misma cursada, revisar,
 * confirmar— que **ninguna de las 18 filas cubría**. La ausencia era un olvido
 * del registro, no una decisión, y así se cerró.
 *
 * `product-spec-source.md` **no se edita** (`AGENTS.md` §1.1): la corrección
 * vive en el ADR y en `product.md` §10.3.
 *
 * ── Aparición y habilitación son dos cosas distintas ────────────────────────
 *
 * Decisión aprobada de la Etapa 0.3:
 *
 *   - **`aparece`** responde *¿existe el contrato y el objeto está en el estado
 *     que esta CTA supone?* Si da `false`, la CTA **no se renderiza**. No se
 *     renderiza deshabilitada, no se renderiza en gris: desaparece.
 *   - **`habilitada`** responde *¿falta algo que el estudiante puede completar
 *     acá mismo?* Si da `false`, la CTA se renderiza **deshabilitada**, con
 *     tratamiento propio —opacidad, cursor y `aria-disabled`— distinto de
 *     secundario (anti-patrón `A-08`).
 *
 * El propio spec distingue los dos casos: el estado de error de `CTA-017` dice
 * literalmente *"ocultar **o** no habilitar"*. Ocultar el botón de enviar
 * evidencia mientras falta el adjunto escondería qué va a pasar al terminar;
 * ocultar una renegociación no elegible es correcto, porque el estudiante no
 * puede volverla elegible desde esa pantalla.
 *
 * ── Lo que ninguna CTA hace ─────────────────────────────────────────────────
 *
 * Una CTA **solicita**; no escribe estado. `resultadoAutoritativo` describe lo
 * que el owner produce si acepta, no lo que el cliente puede presumir. El
 * frontend no marca `ACCEPTED` hasta recibir confirmación (AGENTS.md §2.3).
 */

import type { NodoId } from "./surfaces";
import type { ContextoCTA } from "./context";

export type CtaId =
  | "CTA-001" | "CTA-002" | "CTA-003" | "CTA-004" | "CTA-005" | "CTA-006"
  | "CTA-007" | "CTA-008" | "CTA-009" | "CTA-010" | "CTA-011" | "CTA-012"
  | "CTA-013" | "CTA-014" | "CTA-015" | "CTA-016" | "CTA-017" | "CTA-018"
  /** Corrección aprobada del registro. Ver ADR-016. */
  | "CTA-019";

export interface Cta {
  id: CtaId;
  /** Superficies donde puede aparecer. Columna *Origen* del spec. */
  origen: readonly NodoId[];
  /** Columna *Condición de aparición*, literal. */
  condicion: string;
  /** Columna *Acción solicitada*. Solicita: no muta. */
  accionSolicitada: string;
  /**
   * Columna *Destino*. `null` cuando el spec declara que la CTA no navega
   * —permanece en la misma superficie y cambia su estado.
   */
  destino: NodoId | null;
  /** Columna *Resultado autoritativo*. Lo produce el owner, no el cliente. */
  resultadoAutoritativo: string;
  /** Columna *Fallback*: a dónde se vuelve de forma segura. */
  fallback: { nodo: NodoId | null; descripcion: string };
  /** Columna *Estado de error*. */
  estadoError: string;
  /** Columna *Escenario de aceptación*. Trazabilidad con el spec. */
  escenarios: readonly string[];
  /** Si NO se cumple, la CTA no se renderiza. */
  aparece: (c: ContextoCTA) => boolean;
  /** Si se cumple `aparece` pero esto no, se renderiza deshabilitada. */
  habilitada: (c: ContextoCTA) => boolean;
}

const siempre = () => true;

export const ctaRegistry: Readonly<Record<CtaId, Cta>> = {
  "CTA-001": {
    id: "CTA-001",
    origen: ["UX01"],
    condicion: "Course visible",
    accionSolicitada: "abrir materia",
    destino: "UX02",
    resultadoAutoritativo: "ninguno; navegación",
    fallback: { nodo: "UX01", descripcion: "conservar Hoy" },
    estadoError: "Course no disponible: empty/reintento",
    escenarios: ["SC-DAY-01"],
    aparece: (c) => c.courseVisible,
    habilitada: siempre,
  },

  "CTA-002": {
    id: "CTA-002",
    origen: ["UX01", "UX02"],
    condicion: "ActionRecommendation primaria vigente",
    accionSolicitada: "abrir próxima acción",
    destino: "UX03",
    resultadoAutoritativo: "ninguno",
    fallback: { nodo: null, descripcion: "permanecer en origen" },
    estadoError: "recomendación vencida: releer",
    escenarios: ["SC-DAY-02"],
    // Si el ADE devuelve varias sin una principal, eso es error de contrato:
    // no se elige una (AGENTS.md §2.2).
    aparece: (c) => c.recomendacionPrimariaVigente,
    habilitada: siempre,
  },

  "CTA-003": {
    id: "CTA-003",
    origen: ["UX03"],
    condicion: "Action RECOMMENDED vigente",
    accionSolicitada: "aceptar Action",
    destino: "UX04",
    // Aceptar una Action NO crea un Commitment (AGENTS.md §2.1).
    resultadoAutoritativo: "ActionAccepted / Action ACCEPTED",
    fallback: { nodo: "UX03", descripcion: "conservar recomendación" },
    estadoError: "reconciliar; no duplicar",
    escenarios: ["SC-DAY-02", "SC-ERR-01"],
    aparece: (c) => c.actionStatus === "RECOMMENDED" && c.recomendacionPrimariaVigente,
    habilitada: siempre,
  },

  "CTA-004": {
    id: "CTA-004",
    origen: ["UX04"],
    condicion: "Action ACCEPTED; datos válidos",
    accionSolicitada: "confirmar Commitment",
    destino: "UX01",
    resultadoAutoritativo: "CommitmentCreated; Commitment CONFIRMED; Action COMMITTED",
    fallback: { nodo: "UX04", descripcion: "mantener draft" },
    estadoError: "reconciliar identidad",
    escenarios: ["SC-DAY-03", "SC-ERR-01"],
    // Aparición: la Action está aceptada. Habilitación: los datos del draft
    // están completos, y eso el estudiante lo resuelve en esta misma pantalla.
    aparece: (c) => c.actionStatus === "ACCEPTED",
    habilitada: (c) => c.commitmentState === "DRAFT",
  },

  "CTA-005": {
    id: "CTA-005",
    origen: ["UX01", "UX04"],
    condicion: "Commitment iniciable según owner",
    accionSolicitada: "empezar",
    destino: "EJECUCION",
    resultadoAutoritativo: "CommitmentStarted; Commitment STARTED; Action IN_PROGRESS",
    fallback: { nodo: null, descripcion: "conservar estado" },
    estadoError: "relectura",
    escenarios: ["SC-DAY-03"],
    // Lo declara el owner. Abrir la pantalla o arrancar un timer no inicia nada.
    aparece: (c) => c.commitmentIniciable,
    habilitada: siempre,
  },

  "CTA-006": {
    id: "CTA-006",
    origen: ["EJECUCION"],
    condicion: "cierre conductual permitido",
    accionSolicitada: "finalizar ejecución",
    destino: "UX05",
    resultadoAutoritativo: "Commitment COMPLETED; Action normalmente EVIDENCE_PENDING",
    fallback: { nodo: "EJECUCION", descripcion: "mantener ejecución" },
    estadoError: "error sin submit automático",
    escenarios: ["SC-DAY-03"],
    // Registra cierre conductual: NO crea ni envía Evidence.
    aparece: (c) => c.cierreConductualPermitido,
    habilitada: siempre,
  },

  "CTA-007": {
    id: "CTA-007",
    origen: ["UX05"],
    condicion: "contenido/tipo válidos y Reflection requerida válida o no requerida",
    accionSolicitada: "enviar Evidence",
    destino: null,
    resultadoAutoritativo: "EvidenceSubmitted; SUBMITTED",
    fallback: { nodo: null, descripcion: "conservar draft local/seguro" },
    estadoError: "reconciliar; no duplicar",
    escenarios: ["SC-EV-01", "SC-REF-02", "SC-ERR-02"],
    // Aparición: hay una Evidence esperada. Habilitación: el contenido está y
    // la Reflection requerida es válida — las dos cosas se completan acá mismo.
    aparece: (c) => c.evidenceState === "EXPECTED",
    habilitada: (c) => c.contenidoEvidenciaValido && c.reflectionRequerida !== "INVALIDA",
  },

  "CTA-008": {
    id: "CTA-008",
    origen: ["UX05"],
    condicion: "RESUBMISSION_REQUESTED",
    accionSolicitada: "reenviar corrección",
    destino: null,
    // La original se preserva: nace una Evidence nueva (invariante I4).
    resultadoAutoritativo: "nueva entrega confirmada, original preservada",
    fallback: { nodo: null, descripcion: "conservar anterior" },
    estadoError: "relectura",
    escenarios: ["SC-EV-03"],
    aparece: (c) => c.evidenceState === "RESUBMISSION_REQUESTED",
    habilitada: (c) => c.contenidoEvidenciaValido,
  },

  "CTA-009": {
    id: "CTA-009",
    origen: ["UX01", "UX02", "UX05", "UX08", "UX09"],
    condicion: "Progress/Bitácora disponible",
    accionSolicitada: "ver progreso",
    destino: "UX06",
    resultadoAutoritativo: "ninguno; lectura",
    fallback: { nodo: null, descripcion: "volver al origen" },
    estadoError: "mostrar estado no disponible",
    escenarios: ["SC-PROG-01"],
    aparece: (c) => c.progresoDisponible,
    habilitada: siempre,
  },

  "CTA-010": {
    id: "CTA-010",
    origen: ["UX06", "UX08", "UX09"],
    condicion: "navegación disponible",
    accionSolicitada: "volver a Hoy",
    destino: "UX01",
    // Volver a Hoy NO abandona la ExamPreparation.
    resultadoAutoritativo: "ninguno; no abandona ExamPreparation",
    fallback: { nodo: "UX02", descripcion: "volver a Materia" },
    estadoError: "navegación segura",
    escenarios: ["SC-DAY-05", "SC-EX-05"],
    aparece: (c) => c.navegacionDisponible,
    habilitada: siempre,
  },

  "CTA-011": {
    id: "CTA-011",
    origen: ["UX07"],
    condicion: "Assessment elegible y confirmación explícita",
    accionSolicitada: "activar Modo Examen",
    destino: "UX08",
    // Activar NO crea Action, protocolo completo, Evidence, Progress ni readiness.
    resultadoAutoritativo: "ExamPreparationActivated; ACTIVE",
    fallback: { nodo: "UX07", descripcion: "permanecer UX07" },
    estadoError: "relectura sin doble activación",
    escenarios: ["SC-EX-01"],
    // El baseline es RECOMMENDED → CTA del estudiante → ACTIVE. No existe
    // variante auto-activa.
    aparece: (c) => c.assessmentElegible,
    habilitada: (c) => c.confirmacionExplicita,
  },

  "CTA-012": {
    id: "CTA-012",
    origen: ["UX08"],
    condicion: "paso actual autoritativo, sin gate ni objeto de mayor precedencia",
    accionSolicitada: "abrir paso actual",
    destino: "UX09",
    resultadoAutoritativo: "ninguno; navegación",
    fallback: { nodo: "UX02", descripcion: "Overview degradado/UX02" },
    estadoError: "paso inconsistente: no abrir",
    escenarios: ["SC-EX-02", "SC-EX-03"],
    // La UI no elige el paso: lo provee el owner, versionado e inequívoco.
    aparece: (c) => c.pasoActualAutoritativo && !c.hayGate && !c.objetoDeMayorPrecedencia,
    habilitada: siempre,
  },

  "CTA-013": {
    id: "CTA-013",
    origen: ["UX08", "UX09"],
    condicion: "recomendación primaria real emitida por ADE",
    accionSolicitada: "continuar con acción",
    destino: "UX03",
    resultadoAutoritativo: "ninguno en origen",
    fallback: { nodo: "UX08", descripcion: "volver a Overview" },
    estadoError: "recomendación vencida: releer",
    escenarios: ["SC-EX-04"],
    aparece: (c) => c.recomendacionPrimariaVigente,
    habilitada: siempre,
  },

  "CTA-014": {
    id: "CTA-014",
    origen: ["UX01", "UX02", "UX03", "UX04", "UX05", "UX06", "UX07", "UX08", "UX09", "EJECUCION"],
    condicion: "existe operación idempotente/relectura",
    accionSolicitada: "reintentar",
    destino: null,
    // Solo el owner confirma el resultado. No presumir éxito.
    resultadoAutoritativo: "sólo el owner confirma resultado",
    fallback: { nodo: null, descripcion: "conservar último estado conocido" },
    estadoError: "no presumir éxito",
    escenarios: ["SC-ERR-01", "SC-ERR-02", "SC-ERR-03", "SC-ADE-03"],
    // Sin operación idempotente no se ofrece reintentar: reintentar a ciegas
    // duplica. Ante respuesta incierta se relee por identidad (P3).
    aparece: (c) => c.errorRecuperableConOperacionIdempotente,
    habilitada: siempre,
  },

  "CTA-015": {
    id: "CTA-015",
    origen: ["UX01", "UX04"],
    condicion: "Commitment MISSED/RESCUE_REQUIRED autoritativo",
    accionSolicitada: "iniciar rescate",
    // El spec dice "UX04/rescate": un flujo propio, no una vuelta sobre el
    // Commitment incumplido. El original se preserva.
    destino: "UX04_RESCATE",
    // El original se preserva: el rescate es otro objeto (No Cortar, §2.4).
    resultadoAutoritativo: "rescate creado/confirmado; original preservado",
    fallback: { nodo: null, descripcion: "mantener original visible" },
    estadoError: "fallo no altera original",
    escenarios: ["SC-DAY-04"],
    aparece: (c) => c.commitmentState === "MISSED" || c.rescate === "REQUIRED",
    habilitada: siempre,
  },

  "CTA-016": {
    id: "CTA-016",
    origen: ["UX05", "UX09"],
    condicion: "Reflection configurada y visible",
    accionSolicitada: "guardar/confirmar Reflection",
    destino: null,
    resultadoAutoritativo: "Reflection separada válida",
    fallback: { nodo: null, descripcion: "omitir si opcional; corregir si requerida" },
    estadoError: "inválida: no crear/confirmar",
    escenarios: ["SC-REF-01", "SC-REF-02", "SC-REF-03"],
    aparece: (c) => c.reflectionConfigurada,
    habilitada: siempre,
  },

  "CTA-017": {
    id: "CTA-017",
    origen: ["UX01", "UX04"],
    condicion: "Commitment CONFIRMED o DUE y elegibilidad autoritativa vigente",
    accionSolicitada: "Renegociar",
    destino: "UX04_RENEGOCIACION",
    resultadoAutoritativo: "ninguno al abrir; original visible y no editable",
    fallback: { nodo: "UX04", descripcion: "mantener Commitment vigente" },
    estadoError: "elegibilidad ausente/inconsistente: ocultar o no habilitar; releer owner",
    escenarios: ["SC-REN-01", "SC-REN-02"],
    // STARTED, MISSED o elegibilidad denegada ⇒ no se ofrece edición
    // retroactiva. Acá se oculta: el estudiante no puede volverla elegible.
    aparece: (c) =>
      (c.commitmentState === "CONFIRMED" || c.commitmentState === "DUE") &&
      c.renegociacionElegible,
    habilitada: siempre,
  },

  "CTA-018": {
    id: "CTA-018",
    origen: ["UX04_RENEGOCIACION"],
    condicion: "elegibilidad revalidada; nueva fecha, hora y capacidad válidas; misma Action",
    accionSolicitada: "Confirmar renegociación",
    destino: "UX01",
    resultadoAutoritativo:
      "original RENEGOTIATED; nuevo Commitment CONFIRMED para el mismo action_id; " +
      "CommitmentRenegotiated; old/new preservados",
    fallback: {
      nodo: "UX04",
      descripcion: "conservar propuesta no autoritativa y Commitment original sin cambios",
    },
    estadoError:
      "respuesta incierta/incompatible: reconciliar old/new; no duplicar ni presumir mutación",
    escenarios: ["SC-REN-01", "SC-REN-02"],
    // Aparición: el flujo está abierto y la elegibilidad sigue vigente.
    // Habilitación: la propuesta es válida, y eso se completa en el formulario.
    aparece: (c) => c.renegociacionElegible,
    habilitada: (c) => c.propuestaRenegociacionValida,
  },

  /**
   * `UX02 → UX07`. **La entrada manual a Modo Examen** — [ADR-016](../../docs/decisions.md#adr-016).
   *
   * Aparición y habilitación se separan igual que en el resto, y acá la
   * distinción importa: la CTA aparece cuando la materia **tiene una evaluación
   * elegible**; si no la tiene, no se renderiza, porque el estudiante no puede
   * crear una `Assessment` desde `UX02` —dar de alta una evaluación no
   * registrada **no se implementa** (Etapa 0.4)—.
   *
   * **No activa nada.** Llegar a `UX07` no crea `ExamPreparation` ni la pone
   * `ACTIVE`: eso lo hace `CTA-011`, con confirmación explícita del estudiante,
   * y esta CTA sólo lo lleva a la pantalla donde decide.
   */
  "CTA-019": {
    id: "CTA-019",
    origen: ["UX02"],
    condicion: "Assessment existente y elegible en la misma cursada",
    accionSolicitada: "preparar el examen",
    destino: "UX07",
    // Navegar no produce ningún hecho. El alta de la preparación es CTA-011.
    resultadoAutoritativo: "ninguno; navegación",
    fallback: { nodo: "UX02", descripcion: "permanecer en la materia" },
    estadoError: "mostrar Modo Examen no disponible; no presumir preparación",
    escenarios: ["SC-EX-01"],
    aparece: (c) => c.assessmentElegible,
    habilitada: () => true,
  },
} as const;

export const ctaIds = Object.keys(ctaRegistry) as CtaId[];

/**
 * Las CTAs que corresponde renderizar en una superficie, dado el contexto.
 *
 * Una CTA cuya condición de aparición no se cumple **no está en el resultado**.
 * No se devuelve marcada como oculta ni deshabilitada: no está.
 */
export function ctasVisibles(nodo: NodoId, contexto: ContextoCTA): Cta[] {
  return ctaIds
    .map((id) => ctaRegistry[id])
    .filter((cta) => cta.origen.includes(nodo) && cta.aparece(contexto));
}
