/**
 * **Plan vivo en el Calendario** — [ADR-110](../../../docs/decisions.md#adr-110).
 *
 * Los tipos de la capa de planificación. **Puro:** sin React, sin I/O, sin reloj.
 * Los instantes son milisegundos desde época (UTC); la zona entra sólo al dibujar
 * y al guardar disponibilidad, por `lib/domain/zona.ts`.
 *
 * ## Lo que esta capa NO es
 *
 * - **No es una segunda fuente de verdad.** `PlanningWorkItem` es una
 *   **proyección**: o apunta a una `Action` real (`actionId`) o es un
 *   **candidato** que salió del orden del ADE y que no es fila de nada (ADR-109
 *   D-02 · A). Un candidato no se compromete y la UI no lo llama *acción*.
 * - **No persiste.** Propuestas, fijados y simulación viven en la sesión del
 *   navegador (ADR-110, respuesta del owner). Recargar los pierde.
 * - **No muestra prioridad como magnitud** (`P-03`). `costo` ordena y muere acá,
 *   igual que `action_recommendation.priority`.
 */

// ── Los tres ejes de estado, y el panel ─────────────────────────────────────────

export type PlanningContext = "REAL" | "SIMULATION";
export type PlacementStrategy = "AUTOMATIC" | "MANUAL";
/** Sólo se muestra con `MANUAL`. */
export type ManualPresentation = "GUIDED" | "FREE";
/** La explicación no es un modo: es un panel que se abre a pedido. */
export type ExplanationState = "CLOSED" | "OPEN";

// ── Tiempo ──────────────────────────────────────────────────────────────────────

/** Semiabierto: `[ini, fin)`. Terminar justo cuando empieza otro **no** es conflicto. */
export interface Intervalo {
  ini: number;
  fin: number;
}

// ── De dónde sale cada afirmación ───────────────────────────────────────────────

export interface Fuente {
  tipo: "assessment" | "topic" | "topic_progress" | "topic_prerequisite" | "action";
  id: string | null;
}

/**
 * Una señal del ADE que ordenó el trabajo. **Enuncia el hecho**, nunca el
 * cálculo (`P-03`, `C-06`): *«Entra en Primer parcial.»*, no *«prioridad alta»*.
 */
export interface RazonDePrioridad {
  tipo: "EVALUACION" | "SIN_PRACTICA" | "PRACTICA_REGISTRADA" | "RECENCIA" | "PESO";
  texto: string;
  fuente: Fuente;
}

export interface PriorityExplanation {
  /** La primera razón, la que se ve sin abrir nada. */
  principal: string;
  razones: readonly RazonDePrioridad[];
}

/**
 * Una dependencia **dura** y explícita: `topic_prerequisite`. Nunca se deriva
 * del número de unidad. No hay dependencias blandas: su criterio es de la
 * psicopedagoga (ADR-110).
 */
export interface Dependency {
  topicId: string;
  /** El trabajo pendiente que la satisface. `null` ⇒ ya está satisfecha. */
  itemId: string | null;
  kind: "HARD";
  /** Nombre del tema requerido, para el texto. */
  reason: string;
  source: Fuente;
}

export interface RangoDeDuracion {
  minMinutes: number;
  /**
   * **Punto medio**, no una moda observada — ADR-109 D-03 · A, aplicada
   * provisionalmente por ADR-110.
   */
  likelyMinutes: number;
  maxMinutes: number;
}

export interface Plazo {
  /** Instante en que empieza la evaluación. El trabajo tiene que terminar antes. */
  instante: number;
  evaluacionId: string;
  titulo: string;
}

export interface PlanningWorkItem {
  /** `action:<uuid>` o `candidato:<cursada>:<topic>`. */
  id: string;
  sourceType: "ACTION" | "CANDIDATO";
  /** Sólo con `ACTION`. Un candidato no es fila y no se compromete. */
  actionId: string | null;
  cursadaId: string;
  materia: string;
  topicId: string | null;
  title: string;
  /** `null` ⇒ sin estimación: **no se ubica** y la línea se omite. */
  durationRange: RangoDeDuracion | null;
  /**
   * Ordena, **nunca se muestra**. Sale de `costoDeNoActuar` del ADE: más alto,
   * más urgente.
   */
  costo: number;
  priority: PriorityExplanation;
  dependencies: readonly Dependency[];
  deadline: Plazo | null;
  expectedEvidence: string | null;
  /** Con compromiso vivo, el trabajo ya tiene horario y no se mueve. */
  commitmentId: string | null;
  /** `true` ⇒ la `Action` admite comprometerse (`RECOMMENDED`/`ACCEPTED`). */
  comprometible: boolean;
}

// ── Lo que no se mueve ─────────────────────────────────────────────────────────

export type TipoDeBloqueFijo = "CLASE" | "EVALUACION" | "COMPROMISO" | "FOCUS" | "HISTORIA";

export interface BloqueFijo extends Intervalo {
  id: string;
  tipo: TipoDeBloqueFijo;
  titulo: string;
  cursadaId: string | null;
  /** El trabajo que este bloque ocupa (un compromiso o un Focus). */
  itemId: string | null;
  /** Texto corto de estado: *incumplido*, *en curso*… `null` ⇒ nada que decir. */
  estado: string | null;
  /** Clase con horario estimado por Achieve (`inference`). */
  estimado: boolean;
  /** Ruta del objeto, si la tiene. */
  enlace: string | null;
}

// ── Lo que sí se mueve ─────────────────────────────────────────────────────────

export interface Placement {
  itemId: string;
  ini: number;
  /** `AUTOMATICA` la eligió el planificador; `MANUAL`, el estudiante. */
  origen: "AUTOMATICA" | "MANUAL";
  fijada: boolean;
}

export interface PlacedPlanningItem extends Placement {
  fin: number;
}

// ── Entrada y salida del planificador ───────────────────────────────────────────

export interface PlanningInput {
  ahora: number;
  horizonte: Intervalo;
  disponibilidad: readonly Intervalo[];
  fijos: readonly BloqueFijo[];
  items: readonly PlanningWorkItem[];
  /** Ubicaciones que el estudiante eligió o fijó. Se respetan en los dos modos. */
  ubicaciones: readonly Placement[];
  strategy: PlacementStrategy;
  /** Trabajo que la simulación supone hecho. Vacío en el plan real. */
  hechos: readonly string[];
}

export type CausaDeNoEntrar =
  | "SIN_DURACION"
  | "DEPENDENCIA"
  | "FECHA_LIMITE"
  | "FRAGMENTACION"
  | "CAPACIDAD";

export interface NotFittingItem {
  itemId: string;
  causa: CausaDeNoEntrar;
  /** Con `DEPENDENCIA`: qué falta primero. */
  requiere: string | null;
}

export type MotivoDeConflicto =
  | "CLASE"
  | "EVALUACION"
  | "COMPROMISO"
  | "FOCUS"
  | "HISTORIA"
  | "PASADO"
  | "FUERA_DEL_HORIZONTE"
  | "FECHA_LIMITE"
  | "DEPENDENCIA"
  | "SIN_DURACION";

export interface PlanningConflict {
  itemId: string;
  motivo: MotivoDeConflicto;
  /** El bloque o el trabajo contra el que choca. */
  contra: string | null;
}

export interface PlanningMetrics {
  /** Minutos probables de todo el trabajo pendiente. No cambia al ubicar ni al comprometerse. */
  pendiente: number;
  /** Minutos probables del trabajo ubicado o comprometido. */
  asignado: number;
  sinUbicar: number;
  disponibilidadTotal: number;
  disponibilidadOcupada: number;
  disponibilidadLibre: number;
  noEntra: number;
  /** Cuántos trabajos no tienen duración. **Sin datos no es cero**: se cuentan aparte. */
  sinDuracion: number;
}

export interface PlacementExplanation {
  itemId: string;
  /** Por qué quedó donde quedó, o por qué no entró. */
  texto: string;
}

export interface PlanningProjection {
  placedItems: readonly PlacedPlanningItem[];
  /** Pendiente sin horario ni compromiso, en orden de prioridad. */
  unplacedItems: readonly PlanningWorkItem[];
  /** Lo que el planificador ubicaría con la disponibilidad libre (manual guiado). */
  feasiblePrioritySet: readonly string[];
  notFittingItems: readonly NotFittingItem[];
  conflicts: readonly PlanningConflict[];
  metrics: PlanningMetrics;
  explanations: readonly PlacementExplanation[];
}

// ── Lo que manda el servidor ────────────────────────────────────────────────────

/**
 * La base del plan: todo lo que el servidor sabe, y nada que el estudiante haya
 * movido. `GET /api/plan-vivo`.
 */
export interface PlanVivoBase {
  ahora: number;
  zona: string;
  /** Lunes de la semana, `YYYY-MM-DD`. */
  semana: string;
  horizonte: Intervalo;
  /** Las franjas declaradas, ya expandidas sobre la semana. */
  disponibilidad: readonly Intervalo[];
  /** Las mismas, como se guardan: semanales, en la zona del estudiante. */
  disponibilidadSemanal: ReadonlyArray<{ dia: number; desde: string; hasta: string }>;
  fijos: readonly BloqueFijo[];
  items: readonly PlanningWorkItem[];
  materias: ReadonlyArray<{ cursadaId: string; nombre: string }>;
}
