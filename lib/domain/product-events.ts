/**
 * El Product Event Model — transcripción ejecutable de `product-spec-source.md`
 * §16, *"instrumentación P0"*: **23 eventos**.
 *
 * `C01-023` sigue `OPEN` y su nota dice *"artifact ausente"*: no existe un
 * documento de Product Event Model completo. Pero **la tabla P0 sí existe en el
 * spec**, con 23 eventos y su uso, y el spec es explícito sobre el límite:
 * *"evento nuevo para cada interacción: **no está aprobado** en Product Event
 * Model"*.
 *
 * Este archivo es la transcripción, no una segunda fuente —la misma regla que el
 * registro de CTAs—, y agrega tres cosas que la tabla no tiene y el código
 * necesita:
 *
 * 1. **Si está instrumentado o no**, y con qué fase si no lo está. Sin eso el
 *    catálogo es una lista de deseos y no un mapa de cobertura.
 * 2. **Si se le muestra al estudiante en la Bitácora.** Es una propiedad del
 *    evento, no una decisión que cada pantalla toma por su cuenta.
 * 3. **Las extensiones**: lo que el backend emite y el P0 no lista. No se borran
 *    —son hechos reales, y `product_event` es append-only— pero dejan de estar
 *    invisibles.
 *
 * **Puro:** sin React, sin I/O, sin copy. La copy de la Bitácora vive en
 * `lib/content/bitacora.ts` y hay un guard que exige que las dos listas
 * coincidan.
 */

/** Dónde vive el hecho. `PENDIENTE` nombra la fase que lo va a instrumentar. */
export type Instrumentacion = { estado: "EMITIDO" } | { estado: "PENDIENTE"; fase: string };

/**
 * El nivel del hecho — [ADR-027](../../docs/decisions.md#adr-027).
 *
 * Aprobar los ocho eventos de transición **no significa mezclarlos** con los de
 * negocio: son cosas de naturaleza distinta y quien lea el catálogo tiene que
 * poder distinguirlas de un vistazo.
 *
 * - **`NEGOCIO`** — lo que el producto existe para producir y medir. Un cambio
 *   de progreso confirmado, una recomendación emitida, una recuperación.
 * - **`TRANSICION`** — el objeto cambió de estado. Es trazabilidad del
 *   lifecycle: necesaria, y de otro nivel.
 * - **`TELEMETRIA`** — uso e interacción. **Ninguno instrumentado hoy**, y su
 *   naming sigue pendiente dentro de `C01-023`.
 */
export type NivelDeEvento = "NEGOCIO" | "TRANSICION" | "TELEMETRIA";

export interface EventoDeProducto {
  /** La columna *Uso* de §16, **textual**. Hay test que lo verifica. */
  uso: string;
  nivel: NivelDeEvento;
  instrumentacion: Instrumentacion;
  /**
   * Si el estudiante lo ve en su Bitácora.
   *
   * No todo hecho es de él: `RiskSignalCreated` y `InterventionStarted` son
   * operativos, y `AcademicMapMinimumReached` es de la plataforma. La Bitácora
   * es **memoria privada del estudiante**, no un log del sistema (`VI.6` §6).
   */
  enBitacora: boolean;
}

const emitido: Instrumentacion = { estado: "EMITIDO" };
const pendiente = (fase: string): Instrumentacion => ({ estado: "PENDIENTE", fase });

/**
 * Los 23 de §16, **en el orden del spec**.
 *
 * La mayoría todavía no se emite, y no es deuda: son superficies que no existen.
 * `RiskSignalCreated` necesita el Risk Engine (B6), `ExamPreparationActivated`
 * necesita tablas de examen (B5), `AssessmentTaken` necesita que alguien rinda.
 */
export const catalogoP0: Readonly<Record<string, EventoDeProducto>> = {
  StudentRegistered: {
    uso: "Cuenta creada.",
    nivel: "NEGOCIO",
    // El alta de la identidad sintética la hace un script fuera del producto: el
    // spec no tiene pantalla de registro y no se inventa una.
    instrumentacion: pendiente("B7 · con consentimiento real"),
    enBitacora: false,
  },
  StudentActivated: {
    uso: "Mapa mínimo + primera acción + compromiso/evidencia esperada.",
    nivel: "NEGOCIO",
    instrumentacion: pendiente("B7 · con consentimiento real"),
    enBitacora: false,
  },
  AcademicMapMinimumReached: {
    uso: "Existe información suficiente para conducción.",
    nivel: "NEGOCIO",
    // La ingesta del ADL emite `AcademicDataIngested`, que es otra cosa: dice
    // que entró material, no que ya alcance para conducir.
    instrumentacion: pendiente("B2b · cuando el ADL declare suficiencia"),
    enBitacora: false,
  },
  CourseViewed: {
    uso: "Materia abierta.",
    nivel: "TELEMETRIA",
    // Abrir una pantalla no es un hecho de dominio, y el spec advierte contra un
    // evento por interacción. Se instrumenta cuando exista analítica de uso.
    instrumentacion: pendiente("B8 · analítica del piloto"),
    enBitacora: false,
  },
  ActionRecommended: {
    uso: "Engine emitió acción.",
    nivel: "NEGOCIO",
    instrumentacion: emitido,
    enBitacora: false,
  },
  ActionAccepted: {
    uso: "Alumno aceptó acción.",
    nivel: "NEGOCIO",
    instrumentacion: emitido,
    enBitacora: false,
  },
  CommitmentCreated: {
    uso: "Compromiso confirmado.",
    nivel: "NEGOCIO",
    // El backend lo emite como `CommitmentConfirmed`, por el estado al que
    // transiciona. Ver `EXTENSIONES`.
    instrumentacion: pendiente("B3.3 · reconciliar el nombre con §16"),
    enBitacora: false,
  },
  CommitmentStarted: {
    uso: "Confirmación/inferencia de inicio.",
    nivel: "TRANSICION",
    instrumentacion: emitido,
    enBitacora: true,
  },
  CommitmentRenegotiated: {
    uso: "Cambio responsable antes del vencimiento.",
    nivel: "NEGOCIO",
    instrumentacion: emitido,
    enBitacora: true,
  },
  CommitmentMissed: {
    uso: "Incumplimiento.",
    nivel: "TRANSICION",
    instrumentacion: emitido,
    enBitacora: true,
  },
  EvidenceSubmitted: {
    uso: "Evidencia recibida.",
    nivel: "TRANSICION",
    instrumentacion: emitido,
    enBitacora: true,
  },
  EvidenceValidated: {
    uso: "Evidencia suficiente/validada.",
    nivel: "TRANSICION",
    instrumentacion: emitido,
    enBitacora: true,
  },
  ProgressUpdated: {
    uso: "Cambió Topic/CourseProgress.",
    nivel: "NEGOCIO",
    instrumentacion: emitido,
    enBitacora: true,
  },
  ExamPreparationRecommended: {
    uso: "Modo Examen recomendado.",
    nivel: "NEGOCIO",
    instrumentacion: pendiente("B5 · no hay tablas de examen"),
    enBitacora: false,
  },
  ExamPreparationActivated: {
    uso: "Alumno activó preparación.",
    nivel: "NEGOCIO",
    instrumentacion: pendiente("B5 · no hay tablas de examen"),
    enBitacora: false,
  },
  ProtocolStepCompleted: {
    uso: "Hito cerrado.",
    nivel: "NEGOCIO",
    instrumentacion: pendiente("B5 · y el tramo 9–18 es reentrante (ADR-025)"),
    enBitacora: false,
  },
  SimulationCompleted: {
    uso: "Simulación registrada.",
    nivel: "NEGOCIO",
    instrumentacion: pendiente("B5 · no hay tablas de examen"),
    enBitacora: false,
  },
  RiskSignalCreated: {
    uso: "Señal generada.",
    nivel: "NEGOCIO",
    instrumentacion: pendiente("B6 · no hay Risk Engine"),
    enBitacora: false,
  },
  InterventionStarted: {
    uso: "Humano/automático intervino.",
    nivel: "NEGOCIO",
    instrumentacion: pendiente("B6 · y el Operador depende de ADR-003"),
    enBitacora: false,
  },
  InterventionResolved: {
    uso: "Outcome registrado.",
    nivel: "NEGOCIO",
    instrumentacion: pendiente("B6 · y el Operador depende de ADR-003"),
    enBitacora: false,
  },
  RescueSucceeded: {
    uso: "Retorno después de incumplimiento.",
    nivel: "NEGOCIO",
    // Etapa B3.3. Se emite cuando el compromiso que rescata a un `MISSED` llega
    // a `COMPLETED` — **además** de `CommitmentCompleted`, porque son dos hechos
    // distintos que ocurren juntos. `CommitmentRescueCreated` sigue existiendo y
    // dice otra cosa: que el rescate se creó, no que funcionó.
    instrumentacion: emitido,
    enBitacora: true,
  },
  AssessmentTaken: {
    uso: "Alumno rindió.",
    nivel: "NEGOCIO",
    instrumentacion: pendiente("B5 · no hay tablas de examen"),
    enBitacora: false,
  },
  AssessmentOutcomeRecorded: {
    uso: "Resultado registrado.",
    nivel: "NEGOCIO",
    instrumentacion: pendiente("B5 · no hay tablas de examen"),
    enBitacora: false,
  },
};

/**
 * Los eventos que §16 no lista y que **[ADR-027](../../docs/decisions.md#adr-027)
 * aprobó** el 1 de septiembre de 2026 como parte del modelo oficial.
 *
 * ## De dónde salieron
 *
 * La maquinaria compartida de transiciones emite un evento **por cada estado al
 * que se llega**, así que `EvidenceSufficient` o `CommitmentDue` existían en la
 * base desde B1/B2 mientras `product.md` §11 declaraba que *"no existen"*. El
 * catálogo de la Etapa B3.2 destapó la contradicción; ADR-027 la cerró.
 *
 * ## Por qué se aprobaron en vez de retirarlos
 *
 * Dos razones, y las dos son de hecho consumado y no de preferencia:
 *
 * 1. **`product_event` es append-only (`I12`).** Dejar de emitirlos no borra los
 *    que ya están, y borrarlos sería reescribir el pasado.
 * 2. **Cuatro sostienen la Bitácora.** *"En revisión"*, *"Cumplió el criterio"*,
 *    *"Necesita cambios"* y *"Te pidieron volver a entregarla"* son hechos que
 *    el estudiante ve.
 *
 * **Son de nivel `TRANSICION`**, y esa clasificación es la mitad de la decisión:
 * aprobarlos no los vuelve hechos de negocio. Un cambio de estado es
 * trazabilidad del lifecycle; que el estudiante haya recuperado un compromiso
 * incumplido es otra cosa.
 */
export const EXTENSIONES: Readonly<
  Record<string, { porQue: string; nivel: NivelDeEvento; enBitacora: boolean }>
> = {
  CommitmentConfirmed: {
    porQue: "Es el `CommitmentCreated` de §16, con el nombre del estado al que transiciona",
    nivel: "TRANSICION",
    enBitacora: true,
  },
  CommitmentDue: {
    porQue: "Lo dispara el reloj del lifecycle, no una persona",
    nivel: "TRANSICION",
    enBitacora: false,
  },
  CommitmentCompleted: {
    porQue: "Cierre conductual del compromiso; §16 sólo lista el incumplimiento",
    nivel: "TRANSICION",
    enBitacora: true,
  },
  CommitmentClosed: {
    porQue: "Cierre administrativo de un incumplido. No es un hecho del estudiante",
    nivel: "TRANSICION",
    enBitacora: false,
  },
  CommitmentRescueCreated: {
    porQue: "Crear el rescate no es `RescueSucceeded`: el éxito es posterior y es otro hecho",
    nivel: "NEGOCIO",
    enBitacora: true,
  },
  EvidenceUnderReview: {
    porQue: "Exige instancia real de revisión (`I5`); el estudiante necesita saberlo",
    nivel: "TRANSICION",
    enBitacora: true,
  },
  EvidenceSufficient: {
    porQue: "Criterio mínimo cumplido. No es validación, y por eso no es `EvidenceValidated`",
    nivel: "TRANSICION",
    enBitacora: true,
  },
  EvidenceInsufficient: {
    porQue: "Devolución del owner sobre la entrega",
    nivel: "TRANSICION",
    enBitacora: true,
  },
  EvidenceResubmissionRequested: {
    porQue: "El owner pide otra entrega; la anterior se preserva (`I4`)",
    nivel: "TRANSICION",
    enBitacora: true,
  },
  EvidenceResubmitted: {
    porQue: "La entrega nueva de una resubmission, con la anterior preservada",
    nivel: "TRANSICION",
    enBitacora: true,
  },
  ProgressNoChangeConfirmed: {
    porQue:
      "El no-cambio declarado es un hecho distinto del cambio (ADR-020), y llamarlo `Updated` fundiría los dos",
    nivel: "NEGOCIO",
    enBitacora: true,
  },
  AcademicDataIngested: {
    porQue: "Entró material al ADL (ADR-023). Es un hecho de la plataforma, no del estudiante",
    nivel: "NEGOCIO",
    enBitacora: false,
  },
  ActionCommitted: { porQue: "Transición de `Action` al comprometerse", nivel: "TRANSICION", enBitacora: false },
  ActionInProgress: { porQue: "Transición de `Action` al empezar", nivel: "TRANSICION", enBitacora: false },
  ActionEvidencePending: { porQue: "Transición de `Action` al terminar", nivel: "TRANSICION", enBitacora: false },
  ActionCompleted: { porQue: "Transición de `Action` al cerrarse", nivel: "TRANSICION", enBitacora: false },
  ActionBlocked: { porQue: "Transición de `Action` bloqueada por el owner", nivel: "TRANSICION", enBitacora: false },
  ActionCancelled: { porQue: "Transición de `Action` cancelada", nivel: "TRANSICION", enBitacora: false },
  ActionReplaced: { porQue: "El ADE reemplazó la Action por otra", nivel: "TRANSICION", enBitacora: false },
};

/** Todo lo que el sistema puede emitir hoy: el P0 instrumentado más lo declarado. */
export function eventosDeclarados(): string[] {
  return [...Object.keys(catalogoP0), ...Object.keys(EXTENSIONES)];
}

/** Los que el estudiante ve en su Bitácora. La copy vive en `lib/content/`. */
export function eventosDeBitacora(): string[] {
  return [
    ...Object.entries(catalogoP0)
      .filter(([, e]) => e.enBitacora)
      .map(([n]) => n),
    ...Object.entries(EXTENSIONES)
      .filter(([, e]) => e.enBitacora)
      .map(([n]) => n),
  ];
}

/** Los eventos de un nivel, del catálogo y de las extensiones. */
export function eventosDeNivel(nivel: NivelDeEvento): string[] {
  return [
    ...Object.entries(catalogoP0)
      .filter(([, e]) => e.nivel === nivel)
      .map(([n]) => n),
    ...Object.entries(EXTENSIONES)
      .filter(([, e]) => e.nivel === nivel)
      .map(([n]) => n),
  ];
}
