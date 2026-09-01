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

export interface EventoDeProducto {
  /** La columna *Uso* de §16, **textual**. Hay test que lo verifica. */
  uso: string;
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
    // El alta de la identidad sintética la hace un script fuera del producto: el
    // spec no tiene pantalla de registro y no se inventa una.
    instrumentacion: pendiente("B7 · con consentimiento real"),
    enBitacora: false,
  },
  StudentActivated: {
    uso: "Mapa mínimo + primera acción + compromiso/evidencia esperada.",
    instrumentacion: pendiente("B7 · con consentimiento real"),
    enBitacora: false,
  },
  AcademicMapMinimumReached: {
    uso: "Existe información suficiente para conducción.",
    // La ingesta del ADL emite `AcademicDataIngested`, que es otra cosa: dice
    // que entró material, no que ya alcance para conducir.
    instrumentacion: pendiente("B2b · cuando el ADL declare suficiencia"),
    enBitacora: false,
  },
  CourseViewed: {
    uso: "Materia abierta.",
    // Abrir una pantalla no es un hecho de dominio, y el spec advierte contra un
    // evento por interacción. Se instrumenta cuando exista analítica de uso.
    instrumentacion: pendiente("B8 · analítica del piloto"),
    enBitacora: false,
  },
  ActionRecommended: { uso: "Engine emitió acción.", instrumentacion: emitido, enBitacora: false },
  ActionAccepted: { uso: "Alumno aceptó acción.", instrumentacion: emitido, enBitacora: false },
  CommitmentCreated: {
    uso: "Compromiso confirmado.",
    // El backend lo emite como `CommitmentConfirmed`, por el estado al que
    // transiciona. Ver `EXTENSIONES`.
    instrumentacion: pendiente("B3.3 · reconciliar el nombre con §16"),
    enBitacora: false,
  },
  CommitmentStarted: {
    uso: "Confirmación/inferencia de inicio.",
    instrumentacion: emitido,
    enBitacora: true,
  },
  CommitmentRenegotiated: {
    uso: "Cambio responsable antes del vencimiento.",
    instrumentacion: emitido,
    enBitacora: true,
  },
  CommitmentMissed: { uso: "Incumplimiento.", instrumentacion: emitido, enBitacora: true },
  EvidenceSubmitted: { uso: "Evidencia recibida.", instrumentacion: emitido, enBitacora: true },
  EvidenceValidated: {
    uso: "Evidencia suficiente/validada.",
    instrumentacion: emitido,
    enBitacora: true,
  },
  ProgressUpdated: {
    uso: "Cambió Topic/CourseProgress.",
    instrumentacion: emitido,
    enBitacora: true,
  },
  ExamPreparationRecommended: {
    uso: "Modo Examen recomendado.",
    instrumentacion: pendiente("B5 · no hay tablas de examen"),
    enBitacora: false,
  },
  ExamPreparationActivated: {
    uso: "Alumno activó preparación.",
    instrumentacion: pendiente("B5 · no hay tablas de examen"),
    enBitacora: false,
  },
  ProtocolStepCompleted: {
    uso: "Hito cerrado.",
    instrumentacion: pendiente("B5 · y el tramo 9–18 es reentrante (ADR-025)"),
    enBitacora: false,
  },
  SimulationCompleted: {
    uso: "Simulación registrada.",
    instrumentacion: pendiente("B5 · no hay tablas de examen"),
    enBitacora: false,
  },
  RiskSignalCreated: {
    uso: "Señal generada.",
    instrumentacion: pendiente("B6 · no hay Risk Engine"),
    enBitacora: false,
  },
  InterventionStarted: {
    uso: "Humano/automático intervino.",
    instrumentacion: pendiente("B6 · y el Operador depende de ADR-003"),
    enBitacora: false,
  },
  InterventionResolved: {
    uso: "Outcome registrado.",
    instrumentacion: pendiente("B6 · y el Operador depende de ADR-003"),
    enBitacora: false,
  },
  RescueSucceeded: {
    uso: "Retorno después de incumplimiento.",
    // Etapa B3.3. Se emite cuando el compromiso que rescata a un `MISSED` llega
    // a `COMPLETED` — **además** de `CommitmentCompleted`, porque son dos hechos
    // distintos que ocurren juntos. `CommitmentRescueCreated` sigue existiendo y
    // dice otra cosa: que el rescate se creó, no que funcionó.
    instrumentacion: emitido,
    enBitacora: true,
  },
  AssessmentTaken: {
    uso: "Alumno rindió.",
    instrumentacion: pendiente("B5 · no hay tablas de examen"),
    enBitacora: false,
  },
  AssessmentOutcomeRecorded: {
    uso: "Resultado registrado.",
    instrumentacion: pendiente("B5 · no hay tablas de examen"),
    enBitacora: false,
  },
};

/**
 * Lo que el backend emite y §16 **no lista**.
 *
 * El spec advierte contra *"un evento nuevo para cada interacción"*, y es
 * exactamente lo que pasó sin que nadie lo notara: la maquinaria compartida de
 * transiciones emite un evento **por cada estado al que se llega**, así que
 * `EvidenceSufficient` o `CommitmentDue` existen en la base sin estar aprobados.
 *
 * **No se borran.** Son hechos que ocurrieron, `product_event` es append-only
 * (`I12`) y varios sostienen la Bitácora. Lo que cambia es que dejan de ser
 * invisibles: quedan acá, con el motivo, como insumo de `C01-023` — que es
 * justamente el contrato que falta cerrar.
 */
export const EXTENSIONES: Readonly<Record<string, { porQue: string; enBitacora: boolean }>> = {
  CommitmentConfirmed: {
    porQue: "Es el `CommitmentCreated` de §16, con el nombre del estado al que transiciona",
    enBitacora: true,
  },
  CommitmentDue: {
    porQue: "Lo dispara el reloj del lifecycle, no una persona",
    enBitacora: false,
  },
  CommitmentCompleted: {
    porQue: "Cierre conductual del compromiso; §16 sólo lista el incumplimiento",
    enBitacora: true,
  },
  CommitmentClosed: {
    porQue: "Cierre administrativo de un incumplido. No es un hecho del estudiante",
    enBitacora: false,
  },
  CommitmentRescueCreated: {
    porQue: "Crear el rescate no es `RescueSucceeded`: el éxito es posterior y es otro hecho",
    enBitacora: true,
  },
  EvidenceUnderReview: {
    porQue: "Exige instancia real de revisión (`I5`); el estudiante necesita saberlo",
    enBitacora: true,
  },
  EvidenceSufficient: {
    porQue: "Criterio mínimo cumplido. No es validación, y por eso no es `EvidenceValidated`",
    enBitacora: true,
  },
  EvidenceInsufficient: { porQue: "Devolución del owner sobre la entrega", enBitacora: true },
  EvidenceResubmissionRequested: {
    porQue: "El owner pide otra entrega; la anterior se preserva (`I4`)",
    enBitacora: true,
  },
  EvidenceResubmitted: {
    porQue: "La entrega nueva de una resubmission, con la anterior preservada",
    enBitacora: true,
  },
  ProgressNoChangeConfirmed: {
    porQue:
      "El no-cambio declarado es un hecho distinto del cambio (ADR-020), y llamarlo `Updated` fundiría los dos",
    enBitacora: true,
  },
  AcademicDataIngested: {
    porQue: "Entró material al ADL (ADR-023). Es un hecho de la plataforma, no del estudiante",
    enBitacora: false,
  },
  ActionCommitted: { porQue: "Transición de `Action` al comprometerse", enBitacora: false },
  ActionInProgress: { porQue: "Transición de `Action` al empezar", enBitacora: false },
  ActionEvidencePending: { porQue: "Transición de `Action` al terminar", enBitacora: false },
  ActionCompleted: { porQue: "Transición de `Action` al cerrarse", enBitacora: false },
  ActionBlocked: { porQue: "Transición de `Action` bloqueada por el owner", enBitacora: false },
  ActionCancelled: { porQue: "Transición de `Action` cancelada", enBitacora: false },
  ActionReplaced: { porQue: "El ADE reemplazó la Action por otra", enBitacora: false },
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
