/**
 * El catálogo de escenarios sintéticos del Track A.
 *
 * Nomenclatura (decisión aprobada de la Etapa 0.2): se conservan los IDs del
 * registro canónico de fixtures de `product-spec-source.md` §7. Un ID `FX-*`
 * sin prefijo `LOCAL` se puede buscar en el spec y aparece su definición.
 *
 * Alcance de esta etapa: los escenarios base que hacen que UX01–UX06 rendericen
 * lo mismo que rendían hardcodeadas, más los niveles de precedencia que UX01 ya
 * sabe dibujar. **La cobertura completa de estados críticos es la Etapa 0.7.**
 */

import { contexto } from "@/lib/navigation/context";
import { escenariosUX07 } from "./ux07";
import { escenariosUX08 } from "./ux08";
import { escenariosUX09 } from "./ux09";
import type { Escenario } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// FX-DAY-BASE — el escenario troncal del loop diario.
// Spec §7: "Course + recomendación + Action + disponibilidad".
// ─────────────────────────────────────────────────────────────────────────────

export const FX_DAY_BASE: Escenario = {
  id: "FX-DAY-BASE",
  origen: "spec",
  proposito: "Course + recomendación + Action + disponibilidad",
  cubre: ["C01-003", "C01-006", "C01-007", "C01-011", "SC-DAY-01", "SC-DAY-02"],

  contextos: {
    UX01: contexto({
      courseVisible: true,
      recomendacionPrimariaVigente: true,
      progresoDisponible: true,
    }),
    UX02: contexto({ courseVisible: true, recomendacionPrimariaVigente: true, progresoDisponible: true }),
    // La Action está recomendada y todavía no aceptada: se puede aceptar.
    UX03: contexto({ recomendacionPrimariaVigente: true, actionStatus: "RECOMMENDED" }),
    // Aceptada, con el draft del Commitment abierto. Aceptar NO creó el
    // Commitment: por eso `commitmentState` es DRAFT y no CONFIRMED.
    UX04: contexto({ actionStatus: "ACCEPTED", commitmentState: "DRAFT" }),
  },

  hoy: {
    fecha: "vie 28 ago",
    estadoGeneral: null,
    heroInput: {
      action: "NONE",
      commitment: "NONE",
      rescue: "NONE",
      actionRecommended: true,
      contextIncomplete: false,
      evidenceInfoOnly: false,
    },
    heroContenido: {
      contexto: "Programación · Unidad 4",
      titulo: "Resolver ejercicios 1–5",
      razon: "consolida lo visto hoy.",
      tiempoOEstado: "40 min",
      evidenciaEsperada: "5 ejercicios",
      queSigue: { texto: "queda definido cuándo vas a hacerla.", conPrefijo: true },
      chip: null,
    },
    materias: [
      { nombre: "Programación", estado: "Bajo control", ultimoAvance: "hoy", tono: "neutral" },
      { nombre: "Análisis Matemático II", estado: "Necesita atención", ultimoAvance: "hace 2 días", tono: "urgencia" },
      { nombre: "Álgebra", estado: "Bajo control", ultimoAvance: null, tono: "neutral" },
    ],
  },

  materia: {
    materia: "Análisis Matemático II",
    examen: "Parcial 1",
    estado: { tono: "urgencia", texto: "Necesita atención" },
    ultimoAvance: "avance hace 2 días",
    hero: {
      nivel: "ACTION_RECOMMENDED",
      contexto: "Unidad 3",
      titulo: "Resolver ejercicios 8–14",
      razon: "prepara la próxima clase.",
      tiempoOEstado: "60–75 min",
      evidenciaEsperada: "7 ejercicios",
      queSigue: null,
      chip: null,
    },
    catedraYVos: {
      catedra: {
        titulo: "Reporte de clase",
        contenido: "U4 iniciada",
        detalle: "reportado por vos · sin corroborar",
        tono: "neutral",
      },
      vos: {
        titulo: "Vos",
        contenido: "U3 con práctica pendiente",
        detalle: "Brecha: existe y requiere atención",
        tono: "urgencia",
      },
    },
    unidades: [
      { label: "U1", valor: "práctica registrada" },
      { label: "U2", valor: "en construcción" },
      { label: "U3", valor: "necesita atención", tono: "urgencia" },
      { label: "U4", valor: "recorrido inicial" },
    ],
  },

  accion: {
    contexto: "Cursado · Análisis II",
    unidad: "Unidad 3",
    titulo: "Resolver ejercicios 8–14",
    razon: "prepara la próxima clase.",
    duracion: "60–75 min",
    recurso: "Guía 3 · Cátedra · oficial",
    evidenciaEsperada: "7 ejercicios resueltos",
    criterioCierre: "están completos y adjuntás la producción acordada.",
    queSigue: "definís cuándo vas a hacerla.",
  },

  compromiso: {
    contexto: "Unidad 3 · Acción aceptada",
    titulo: "Resolver ejercicios 8–14",
    fecha: "Sáb 23 ago ▾",
    hora: "19:00 ▾",
    tiempoDeclarado: "70 min ▾",
    notaEstimacion: "Estimación 60–75 · cubre el mínimo. Zona horaria: Córdoba.",
    evidenciaEsperada: "7 ejercicios",
    criterioCierre: "completos y adjuntos",
    estadoResultante: { tono: "humano", texto: "CONFIRMED" },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FX-LOCAL-DAY-IN-PROGRESS — Action ya iniciada.
//
// El registro del spec §7 NO nombra este escenario. Lleva prefijo FX-LOCAL-
// para no simular un ID canónico: buscarlo en el spec no devuelve nada, y eso
// tiene que ser evidente desde el nombre.
// ─────────────────────────────────────────────────────────────────────────────

export const FX_LOCAL_DAY_IN_PROGRESS: Escenario = {
  id: "FX-LOCAL-DAY-IN-PROGRESS",
  origen: "local",
  proposito: "Action IN_PROGRESS: el nivel 1 de precedencia gana sobre todo lo demás",
  cubre: ["C01-007", "SC-DAY-03"],
  contextos: {
    UX01: contexto({ courseVisible: true, actionStatus: "IN_PROGRESS", commitmentState: "STARTED", progresoDisponible: true }),
    // STARTED no admite renegociación: no se ofrece edición retroactiva.
    UX04: contexto({ actionStatus: "IN_PROGRESS", commitmentState: "STARTED" }),
  },
  hoy: {
    fecha: "vie 28 ago",
    estadoGeneral: null,
    heroInput: {
      action: "IN_PROGRESS",
      commitment: "NONE",
      rescue: "NONE",
      actionRecommended: false,
      contextIncomplete: false,
      evidenceInfoOnly: false,
    },
    heroContenido: {
      contexto: "Análisis II · Unidad 3",
      titulo: "Resolver ejercicios 8–14",
      razon: "prepara la próxima clase.",
      tiempoOEstado: "En curso",
      evidenciaEsperada: "7 ejercicios",
      queSigue: { texto: "Al terminar, subís la evidencia acordada.", conPrefijo: false },
      chip: null,
    },
    materias: [
      { nombre: "Análisis Matemático II", estado: "En curso", ultimoAvance: "hoy", tono: "neutral" },
      { nombre: "Programación", estado: "Bajo control", ultimoAvance: "ayer", tono: "neutral" },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FX-EVD-BASE — Evidence esperada y criterio sintético.
// Spec §7: "Evidence esperada y criterio sintético · submit/validación".
// ─────────────────────────────────────────────────────────────────────────────

export const FX_EVD_BASE: Escenario = {
  id: "FX-EVD-BASE",
  origen: "spec",
  proposito: "Evidence esperada y criterio sintético",
  cubre: ["C01-012", "C01-013", "C01-014", "SC-EV-01"],

  contextos: {
    UX01: contexto({ courseVisible: true, actionStatus: "EVIDENCE_PENDING", progresoDisponible: true }),
    // Evidence esperada, sin contenido todavía: CTA-007 aparece deshabilitada.
    UX05: contexto({ actionStatus: "EVIDENCE_PENDING", evidenceState: "EXPECTED", progresoDisponible: true }),
  },

  hoy: {
    fecha: "vie 28 ago",
    estadoGeneral: null,
    heroInput: {
      action: "EVIDENCE_PENDING",
      commitment: "NONE",
      rescue: "NONE",
      actionRecommended: false,
      contextIncomplete: false,
      evidenceInfoOnly: false,
    },
    heroContenido: {
      contexto: "Análisis II · Unidad 3",
      titulo: "Subí los ejercicios 8–14",
      razon: "la acción se cierra con evidencia verificable.",
      tiempoOEstado: null,
      evidenciaEsperada: "foto/archivo de 7 ejercicios",
      queSigue: { texto: "la evidencia queda pendiente de validación.", conPrefijo: true },
      chip: null,
    },
    materias: [
      { nombre: "Análisis Matemático II", estado: "Falta evidencia", ultimoAvance: "hoy", tono: "urgencia" },
    ],
  },

  evidencia: {
    contexto: "Cursado · Análisis II",
    titulo: "Resolver ejercicios 8–14",
    unidad: "Unidad 3",
    evidenciaEsperada: "7 completos y adjuntos",
    criterioCierre: "producción inspeccionable",
    formatosPermitidos: "foto o archivo",
    nombreAdjuntoDemo: "foto_01.jpg",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FX-MISSED — Commitment original MISSED + alternativa de rescate.
// Spec §7: "rescate · preserva original".
//
// No Cortar (AGENTS.md §2.4): el original NUNCA se edita para parecer cumplido.
// `RESCUE_REQUIRED` no es un estado, es una condición derivada: existe un
// MISSED sin objeto de rescate vinculado.
// ─────────────────────────────────────────────────────────────────────────────

export const FX_MISSED: Escenario = {
  id: "FX-MISSED",
  origen: "spec",
  proposito: "Commitment original MISSED + alternativa de rescate; preserva el original",
  cubre: ["C01-010", "SC-DAY-04", "SC-REN-01"],
  contextos: {
    UX01: contexto({ courseVisible: true, commitmentState: "MISSED", rescate: "REQUIRED", progresoDisponible: true }),
    // MISSED no habilita renegociar: la única salida del original es CLOSED y
    // el rescate es otro objeto.
    UX04: contexto({ commitmentState: "MISSED", rescate: "REQUIRED" }),
  },
  hoy: {
    fecha: "vie 28 ago",
    estadoGeneral: null,
    heroInput: {
      action: "NONE",
      commitment: "MISSED",
      rescue: "REQUIRED",
      actionRecommended: false,
      contextIncomplete: false,
      evidenceInfoOnly: false,
    },
    heroContenido: {
      contexto: null,
      titulo: "Necesitamos rearmar este compromiso.",
      razon: "el compromiso de las 19:00 quedó incumplido.",
      tiempoOEstado: null,
      evidenciaEsperada: null,
      queSigue: { texto: "Primero necesitamos acordar cómo retomar.", conPrefijo: false },
      chip: { tono: "urgencia", texto: "Análisis II · Compromiso incumplido" },
    },
    materias: [
      { nombre: "Análisis Matemático II", estado: "Compromiso incumplido", ultimoAvance: "hace 2 días", tono: "urgencia" },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FX-ADE-NONE — el ADE confirma que no hay recomendación.
// Spec §7: "ADE confirma ausencia · empty honesto · volver a Materia/Hoy".
//
// Ausencia confirmada NO es error, y NO es "no cargó todavía" (AGENTS.md §2.5).
// ─────────────────────────────────────────────────────────────────────────────

export const FX_ADE_NONE: Escenario = {
  id: "FX-ADE-NONE",
  origen: "spec",
  proposito: "El ADE confirma ausencia de recomendación: empty honesto",
  cubre: ["C01-006", "SC-ADE-02"],
  contextos: {
    // El ADE confirmó ausencia: no hay recomendación primaria vigente, así que
    // CTA-002 no se renderiza. El Course sigue visible: CTA-001 sí.
    UX01: contexto({ courseVisible: true, progresoDisponible: true }),
  },
  hoy: {
    fecha: "vie 28 ago",
    estadoGeneral: null,
    heroInput: {
      action: "NONE",
      commitment: "NONE",
      rescue: "NONE",
      actionRecommended: false,
      contextIncomplete: false,
      evidenceInfoOnly: false,
    },
    heroContenido: {
      contexto: null,
      titulo: null,
      razon: null,
      tiempoOEstado: null,
      evidenciaEsperada: null,
      queSigue: null,
      chip: null,
    },
    materias: [
      { nombre: "Programación", estado: "Bajo control", ultimoAvance: "hoy", tono: "neutral" },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FX-LOCAL-PROG-VALIDATED — Evidence validada con un ProgressUpdated real.
//
// El registro del spec §7 no incluye un FX de progreso; SC-PROG-01 es el
// escenario que lo ejercita. Prefijo FX-LOCAL- por la misma razón que arriba.
//
// VALIDATED no produce ProgressUpdated por sí solo (AGENTS.md §2.1): acá el
// ProgressUpdated existe, y por eso hay una dimensión en "Cambio confirmado".
// Las que no cambiaron van abajo, y sus tres formas de no-cambio se distinguen
// entre sí.
// ─────────────────────────────────────────────────────────────────────────────

export const FX_LOCAL_PROG_VALIDATED: Escenario = {
  id: "FX-LOCAL-PROG-VALIDATED",
  origen: "local",
  proposito: "Evidence VALIDATED con ProgressUpdated real y tres estados de no-cambio distinguibles",
  cubre: ["C01-018", "C01-019", "C01-020", "SC-PROG-01"],
  contextos: {
    UX06: contexto({ navegacionDisponible: true }),
  },
  progreso: {
    contexto: "Avance · Análisis II · Unidad 3",
    estadoEvidencia: { tono: "exito", texto: "Evidencia validada" },
    detalleEvidencia: "Ejercicios 8–14 · validada 20:26",
    cambioConfirmado: [
      { label: "Práctica", valor: "12 → 19 ejercicios" },
      { label: "Recencia", valor: "hoy" },
    ],
    fuenteCambio: "Evidence validada",
    sinCambioConfirmado: [
      { label: "Recorrido", valor: "conserva su estado", ausente: true },
      { label: "Dominio", valor: "no evaluado", ausente: true },
      { label: "Confianza", valor: "alta · declarada ayer" },
    ],
    queSigue: "Reforzar cambio de variables.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Escenarios de navegación.
//
// Los que siguen declaran **contexto sin vista**: dicen en qué estado está el
// mundo para que las CTAs correspondientes sean alcanzables, pero todavía no
// traen props de pantalla. Dibujar estos estados es la Etapa 0.7; declararlos
// es lo que hace verificable el registro de CTAs hoy.
// ─────────────────────────────────────────────────────────────────────────────

/** Commitment confirmado por el owner y en condiciones de arrancar. */
export const FX_LOCAL_COMMITMENT_CONFIRMED: Escenario = {
  id: "FX-LOCAL-COMMITMENT-CONFIRMED",
  origen: "local",
  proposito: "Commitment CONFIRMED e iniciable según el owner, y su cierre conductual",
  cubre: ["C01-010", "C01-011", "SC-DAY-03"],
  contextos: {
    UX01: contexto({
      courseVisible: true,
      actionStatus: "COMMITTED",
      commitmentState: "CONFIRMED",
      // Lo declara el owner. Abrir la pantalla o un timer local no inicia nada.
      commitmentIniciable: true,
      progresoDisponible: true,
    }),
    UX04: contexto({
      actionStatus: "COMMITTED",
      commitmentState: "CONFIRMED",
      commitmentIniciable: true,
    }),
    // Cierre conductual permitido. Finalizar NO crea ni envía Evidence.
    EJECUCION: contexto({
      actionStatus: "IN_PROGRESS",
      commitmentState: "STARTED",
      cierreConductualPermitido: true,
    }),
  },
};

/** Evidence devuelta para corrección. La original se preserva (invariante I4). */
export const FX_LOCAL_EVD_RESUBMISSION: Escenario = {
  id: "FX-LOCAL-EVD-RESUBMISSION",
  origen: "local",
  proposito: "Evidence en RESUBMISSION_REQUESTED: se reenvía una nueva, la anterior se preserva",
  cubre: ["C01-012", "C01-015", "SC-EV-03"],
  contextos: {
    UX05: contexto({
      actionStatus: "EVIDENCE_PENDING",
      evidenceState: "RESUBMISSION_REQUESTED",
      contenidoEvidenciaValido: true,
      progresoDisponible: true,
    }),
  },
};

/**
 * FX-REN-ELIGIBLE — spec §7: "Commitment original CONFIRMED o DUE, elegibilidad
 * autoritativa vigente, misma Action y nueva fecha/hora/capacidad válidas".
 *
 * Renegociar ANTES del vencimiento es válido y crea un Commitment nuevo; el
 * original queda RENEGOTIATED y no se edita.
 */
export const FX_REN_ELIGIBLE: Escenario = {
  id: "FX-REN-ELIGIBLE",
  origen: "spec",
  proposito:
    "Renegociación positiva: original no editable; sólo el owner confirma old/new y CommitmentRenegotiated",
  cubre: ["C01-010", "SC-REN-01"],
  contextos: {
    UX01: contexto({
      courseVisible: true,
      commitmentState: "CONFIRMED",
      renegociacionElegible: true,
      progresoDisponible: true,
    }),
    UX04: contexto({
      commitmentState: "CONFIRMED",
      renegociacionElegible: true,
    }),
    UX04_RENEGOCIACION: contexto({
      commitmentState: "CONFIRMED",
      renegociacionElegible: true,
      propuestaRenegociacionValida: true,
    }),
  },
};

/**
 * FX-REN-INELIGIBLE — spec §7: "Commitment STARTED o MISSED, o elegibilidad
 * denegada/inconsistente". **Control negativo:** no se ofrece confirmación y el
 * original queda intacto.
 */
export const FX_REN_INELIGIBLE: Escenario = {
  id: "FX-REN-INELIGIBLE",
  origen: "spec",
  proposito:
    "Renegociación negativa: no ofrecer confirmación; original intacto; continuar, bloqueo o rescate",
  cubre: ["C01-010", "SC-REN-02"],
  contextos: {
    // CONFIRMED pero con elegibilidad denegada por el owner: CTA-017 se oculta.
    UX01: contexto({ courseVisible: true, commitmentState: "CONFIRMED", progresoDisponible: true }),
    UX04: contexto({ commitmentState: "CONFIRMED" }),
    // El flujo no se abre, así que CTA-018 tampoco aparece.
    UX04_RENEGOCIACION: contexto({ commitmentState: "CONFIRMED" }),
  },
};

/**
 * FX-REFL-OPT — spec §7: "Reflection OPTIONAL versionada · rama opcional ·
 * omisión válida". La Reflection es un objeto separado de la Evidence.
 */
export const FX_REFL_OPT: Escenario = {
  id: "FX-REFL-OPT",
  origen: "spec",
  proposito: "Reflection OPTIONAL versionada: la omisión es válida",
  cubre: ["C01-012", "SC-REF-01"],
  contextos: {
    UX05: contexto({
      actionStatus: "EVIDENCE_PENDING",
      evidenceState: "EXPECTED",
      contenidoEvidenciaValido: true,
      reflectionConfigurada: true,
      reflectionRequerida: "NO_REQUERIDA",
      progresoDisponible: true,
    }),
  },
};

/**
 * FX-ERROR-IDEM — spec §7: "respuesta perdida/duplicada · idempotencia visual ·
 * relectura/reconciliación".
 *
 * Ante una respuesta incierta se relee por identidad antes de reintentar; nunca
 * se reintenta a ciegas (`P3`). Sólo el owner confirma el resultado.
 */
export const FX_ERROR_IDEM: Escenario = {
  id: "FX-ERROR-IDEM",
  origen: "spec",
  proposito: "Respuesta perdida o duplicada: relectura y reconciliación, sin presumir éxito",
  cubre: ["C01-009", "C01-015", "SC-ERR-01"],
  contextos: {
    UX04: contexto({
      actionStatus: "ACCEPTED",
      commitmentState: "DRAFT",
      errorRecuperableConOperacionIdempotente: true,
    }),
  },
};

/** El catálogo. Orden estable: el `id` es la clave. */
export const escenarios = {
  "FX-DAY-BASE": FX_DAY_BASE,
  "FX-LOCAL-DAY-IN-PROGRESS": FX_LOCAL_DAY_IN_PROGRESS,
  "FX-EVD-BASE": FX_EVD_BASE,
  "FX-MISSED": FX_MISSED,
  "FX-ADE-NONE": FX_ADE_NONE,
  "FX-LOCAL-PROG-VALIDATED": FX_LOCAL_PROG_VALIDATED,
  "FX-LOCAL-COMMITMENT-CONFIRMED": FX_LOCAL_COMMITMENT_CONFIRMED,
  "FX-LOCAL-EVD-RESUBMISSION": FX_LOCAL_EVD_RESUBMISSION,
  "FX-REN-ELIGIBLE": FX_REN_ELIGIBLE,
  "FX-REN-INELIGIBLE": FX_REN_INELIGIBLE,
  "FX-REFL-OPT": FX_REFL_OPT,
  "FX-ERROR-IDEM": FX_ERROR_IDEM,
  // Los 22 estados críticos de UX07 viven en su propio archivo: la matriz de
  // VI.7 §16 es larga y merece leerse entera y de corrido.
  ...escenariosUX07,
  ...escenariosUX08,
  ...escenariosUX09,
} as const satisfies Record<string, Escenario>;

export type EscenarioId = keyof typeof escenarios;
