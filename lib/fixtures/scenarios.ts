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

/** El catálogo. Orden estable: el `id` es la clave. */
export const escenarios = {
  "FX-DAY-BASE": FX_DAY_BASE,
  "FX-LOCAL-DAY-IN-PROGRESS": FX_LOCAL_DAY_IN_PROGRESS,
  "FX-EVD-BASE": FX_EVD_BASE,
  "FX-MISSED": FX_MISSED,
  "FX-ADE-NONE": FX_ADE_NONE,
  "FX-LOCAL-PROG-VALIDATED": FX_LOCAL_PROG_VALIDATED,
} as const satisfies Record<string, Escenario>;

export type EscenarioId = keyof typeof escenarios;
