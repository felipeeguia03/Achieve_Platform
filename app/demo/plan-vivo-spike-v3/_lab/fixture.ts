/**
 * 🧪 **LABORATORIO DESCARTABLE V3 — fixture canónico.**
 *
 * ⚠️ **DATOS EXCLUSIVOS DE DEMOSTRACIÓN.** Materias, clases, aulas, comisiones,
 * evaluaciones, disponibilidad, duraciones, confianzas, fuentes y registros son
 * **inventados**. Nada sale de la base ni de un engine, y nada se lee en producción.
 *
 * ## Las cuentas del plan real, al martes 15 a las 17:30 (verificadas por test)
 *
 * | | Minutos | Se lee |
 * |---|---:|---|
 * | Disponibilidad futura | 90+90+90+120+90+150+120+90 = **840** | 14 h |
 * | Comprometido (Resumir Unidad 4) | **60** | 1 h |
 * | Sin ubicar | 60+90+45+45+60+60+30+40 = **430** | 7 h 10 |
 * | Trabajo pendiente | 60 + 430 = **490** | 8 h 10 |
 * | Margen antes del parcial | 630 − 60 − (60+90+45+45+60) = **270** | 4 h 30 |
 *
 * **Ninguna cifra se escribe en la pantalla**: todas salen de `motor.ts`.
 */

import { instante } from "./formato";
import type {
  Accion,
  Clase,
  CompromisoDelFixture,
  Evaluacion,
  Materia,
  MateriaId,
  Prioridad,
  Registro,
  Tema,
  Tramo,
  VentanaDelFixture,
} from "./tipos";

export const LAB_ES_DEMO = true as const;

/** El reloj del laboratorio. */
export const AHORA = { fecha: "2026-09-15", hora: "17:30" } as const;
/** El reloj adelantado de `?escenario=reloj`. */
export const AHORA_ADELANTADO = { fecha: "2026-09-17", hora: "19:10" } as const;

export const MAXIMO_DE_PASOS = 5;
/** Por debajo de este margen antes de una evaluación, ubicar algo avisa. */
export const MARGEN_MINIMO = 60;

export const ORDEN_DE_PRIORIDAD: readonly Prioridad[] = ["MUY_ALTA", "ALTA", "MEDIA", "BAJA"];
export const NOMBRE_DE_PRIORIDAD: Readonly<Record<Prioridad, string>> = {
  MUY_ALTA: "Muy alta",
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

const COMISION = "Comisión B (simulada)";

export const MATERIAS: Readonly<Record<MateriaId, Materia>> = {
  ANALISIS: { id: "ANALISIS", nombre: "Análisis Matemático I", corto: "Análisis", color: "var(--materia-1)", comision: COMISION },
  FISICA: { id: "FISICA", nombre: "Física I", corto: "Física", color: "var(--materia-2)", comision: "Comisión A (simulada)" },
  ECONOMIA: { id: "ECONOMIA", nombre: "Economía", corto: "Economía", color: "var(--materia-3)", comision: COMISION },
  ARQUITECTURA: { id: "ARQUITECTURA", nombre: "Arquitectura de Computadoras", corto: "Arquitectura", color: "var(--materia-4)", comision: COMISION },
  BASES: { id: "BASES", nombre: "Base de Datos", corto: "Bases", color: "var(--materia-6)", comision: "Comisión C (simulada)" },
};
export const ORDEN_DE_MATERIAS: readonly MateriaId[] = ["ANALISIS", "FISICA", "ECONOMIA", "ARQUITECTURA", "BASES"];

const LUN = "2026-09-14";
const MAR = "2026-09-15";
const MIE = "2026-09-16";
const JUE = "2026-09-17";
const VIE = "2026-09-18";
const SAB = "2026-09-19";
const DOM = "2026-09-20";

const t = (fecha: string, desde: string, hasta: string): Tramo => ({ fecha, desde, hasta });

export const ID = {
  PARCIAL: "EVA-SYN-V3-ANA-P1",
  ENTREGA_BD: "EVA-SYN-V3-BD-TP1",
  PARCIAL_FIS: "EVA-SYN-V3-FIS-P1",
  PARCIAL_ECO: "EVA-SYN-V3-ECO-P1",
  ENTREGA_ARQ: "EVA-SYN-V3-ARQ-E1",

  CLASE_ANA_LUN: "CLS-SYN-V3-ANA-LUN",
  CLASE_ANA_MIE: "CLS-SYN-V3-ANA-MIE",
  CLASE_FIS_MAR: "CLS-SYN-V3-FIS-MAR",
  CLASE_FIS_JUE: "CLS-SYN-V3-FIS-JUE",
  CLASE_ECO_MAR: "CLS-SYN-V3-ECO-MAR",
  CLASE_ECO_VIE: "CLS-SYN-V3-ECO-VIE",
  CLASE_ARQ_LUN: "CLS-SYN-V3-ARQ-LUN",
  CLASE_ARQ_JUE: "CLS-SYN-V3-ARQ-JUE",
  CLASE_BD_MIE: "CLS-SYN-V3-BD-MIE",

  LIMITES: "ACC-SYN-V3-LIM",
  NORMALIZAR: "ACC-SYN-V3-BDNOR",
  TEORIA_DERIVADAS: "ACC-SYN-V3-TEODER",
  REFUERZO_LIMITES: "ACC-SYN-V3-REFLIM",
  PRACTICA_DERIVADAS: "ACC-SYN-V3-PRADER",
  CINEMATICA: "ACC-SYN-V3-FISCIN",
  PIPELINE: "ACC-SYN-V3-ARQPIP",
  ECONOMIA_U2: "ACC-SYN-V3-ECOU2",
  RESUMEN_U4: "ACC-SYN-V3-ARQU4",

  COMPROMISO_U4: "COM-SYN-V3-ARQU4",
  COMPROMISO_PIPELINE: "COM-SYN-V3-ARQPIP",

  REG_LIM_TEORIA: "REG-SYN-V3-LIMTEO",
  REG_PIPELINE: "REG-SYN-V3-PIP",
  REG_CINEMATICA: "REG-SYN-V3-CIN",
  REG_CONSIGNA: "REG-SYN-V3-TP",
} as const;

// ── Temas (Gantt de Materia) ──────────────────────────────────────────────────────

export const TEMAS: readonly Tema[] = [
  { id: "TEM-V3-ANA-1", materia: "ANALISIS", codigo: "U1", nombre: "Funciones", primeraClase: t("2026-08-31", "14:00", "16:00"), evaluacionId: ID.PARCIAL },
  { id: "TEM-V3-ANA-2", materia: "ANALISIS", codigo: "U2", nombre: "Límites", primeraClase: t("2026-09-07", "14:00", "16:00"), evaluacionId: ID.PARCIAL },
  { id: "TEM-V3-ANA-3", materia: "ANALISIS", codigo: "U3", nombre: "Derivadas", primeraClase: t(LUN, "14:00", "16:00"), evaluacionId: ID.PARCIAL },
  { id: "TEM-V3-ANA-4", materia: "ANALISIS", codigo: "U4", nombre: "Aplicaciones de la derivada", primeraClase: null, evaluacionId: null },

  { id: "TEM-V3-FIS-1", materia: "FISICA", codigo: "U1", nombre: "Vectores", primeraClase: t("2026-09-01", "08:00", "10:00"), evaluacionId: ID.PARCIAL_FIS },
  { id: "TEM-V3-FIS-2", materia: "FISICA", codigo: "U2", nombre: "Cinemática", primeraClase: t("2026-09-08", "08:00", "10:00"), evaluacionId: ID.PARCIAL_FIS },

  { id: "TEM-V3-ECO-1", materia: "ECONOMIA", codigo: "U1", nombre: "Mercados", primeraClase: t("2026-09-01", "14:00", "16:00"), evaluacionId: ID.PARCIAL_ECO },
  { id: "TEM-V3-ECO-2", materia: "ECONOMIA", codigo: "U2", nombre: "Oferta y demanda", primeraClase: t("2026-09-08", "14:00", "16:00"), evaluacionId: ID.PARCIAL_ECO },
  { id: "TEM-V3-ECO-3", materia: "ECONOMIA", codigo: "U3", nombre: "Elasticidad", primeraClase: null, evaluacionId: ID.PARCIAL_ECO },

  { id: "TEM-V3-ARQ-3", materia: "ARQUITECTURA", codigo: "U3", nombre: "Pipeline", primeraClase: t("2026-09-07", "18:00", "20:00"), evaluacionId: ID.ENTREGA_ARQ },
  { id: "TEM-V3-ARQ-4", materia: "ARQUITECTURA", codigo: "U4", nombre: "Jerarquía de memoria", primeraClase: t("2026-09-10", "11:00", "13:00"), evaluacionId: ID.ENTREGA_ARQ },

  { id: "TEM-V3-BD-1", materia: "BASES", codigo: "U1", nombre: "Modelo relacional", primeraClase: t("2026-09-02", "19:00", "21:00"), evaluacionId: null },
  { id: "TEM-V3-BD-2", materia: "BASES", codigo: "U2", nombre: "Normalización", primeraClase: t("2026-09-09", "19:00", "21:00"), evaluacionId: ID.ENTREGA_BD },
];

// ── Facultad: no se mueve ─────────────────────────────────────────────────────────

const clase = (id: string, materia: MateriaId, titulo: string, tramo: Tramo, aula: string, temas: string[], registro: Clase["registro"] = null): Clase => ({
  kind: "CLASE",
  id,
  materia,
  titulo,
  tramo,
  aula,
  fuente: registro ? "Registro de clase del estudiante (simulado)" : "Horario publicado por la cátedra (simulado)",
  temas,
  registro,
});

export const CLASES: readonly Clase[] = [
  clase(ID.CLASE_ANA_LUN, "ANALISIS", "Derivadas: introducción", t(LUN, "14:00", "16:00"), "Aula 204 (simulada)", ["TEM-V3-ANA-3"], {
    asistencia: "Asististe · registrada en Modo Clase (simulado)",
    notas: ["El docente definió la derivada como límite del cociente incremental.", "Marcado como posible evaluación: recta tangente."],
  }),
  clase(ID.CLASE_FIS_MAR, "FISICA", "Cinemática: movimiento rectilíneo", t(MAR, "08:00", "10:00"), "Aula 110 (simulada)", ["TEM-V3-FIS-2"], {
    asistencia: "Asististe · registrada en Modo Clase (simulado)",
    notas: ["Se resolvieron los ejercicios 3 y 5 de la guía.", "Revisar: gráficos de posición contra tiempo."],
  }),
  clase(ID.CLASE_ECO_MAR, "ECONOMIA", "Oferta y demanda: equilibrio", t(MAR, "14:00", "16:00"), "Aula 12 (simulada)", ["TEM-V3-ECO-2"], {
    asistencia: "Asististe · registrada en Modo Clase (simulado)",
    notas: ["Desplazamientos de la curva frente a movimientos sobre la curva."],
  }),
  clase(ID.CLASE_ARQ_LUN, "ARQUITECTURA", "Pipeline: riesgos de datos", t(LUN, "18:00", "20:00"), "Laboratorio 3 (simulado)", ["TEM-V3-ARQ-3"], {
    asistencia: "Asististe · registrada en Modo Clase (simulado)",
    notas: ["El ejercicio del pipeline de cinco etapas vuelve en la entrega."],
  }),
  clase(ID.CLASE_ANA_MIE, "ANALISIS", "Derivadas: reglas de derivación", t(MIE, "14:00", "16:00"), "Aula 204 (simulada)", ["TEM-V3-ANA-3"]),
  clase(ID.CLASE_BD_MIE, "BASES", "Normalización: formas normales", t(MIE, "19:00", "21:00"), "Laboratorio 1 (simulado)", ["TEM-V3-BD-2"]),
  clase(ID.CLASE_FIS_JUE, "FISICA", "Cinemática: movimiento en el plano", t(JUE, "08:00", "10:00"), "Aula 110 (simulada)", ["TEM-V3-FIS-2"]),
  clase(ID.CLASE_ARQ_JUE, "ARQUITECTURA", "Jerarquía de memoria", t(JUE, "11:00", "13:00"), "Laboratorio 3 (simulado)", ["TEM-V3-ARQ-4"]),
  clase(ID.CLASE_ECO_VIE, "ECONOMIA", "Elasticidad", t(VIE, "10:00", "12:00"), "Aula 12 (simulada)", ["TEM-V3-ECO-3"]),
];

export const EVALUACIONES: readonly Evaluacion[] = [
  {
    kind: "EVALUACION",
    id: ID.ENTREGA_BD,
    materia: "BASES",
    titulo: "Cierre de entrega del TP 1",
    corto: "la entrega de Bases",
    tramo: t(JUE, "21:00", "21:30"),
    modalidad: "Entrega en el aula virtual",
    alcance: ["TEM-V3-BD-2"],
    alcanceDetalle: "Caso práctico de normalización hasta tercera forma normal.",
    fuente: "Consigna publicada por la cátedra (simulada)",
    confianza: "alta",
  },
  {
    kind: "EVALUACION",
    id: ID.PARCIAL,
    materia: "ANALISIS",
    titulo: "Primer parcial · Unidades 1 a 3",
    corto: "el parcial de Análisis",
    tramo: t(VIE, "18:00", "20:00"),
    modalidad: "Escrito, presencial, 2 horas",
    alcance: ["TEM-V3-ANA-1", "TEM-V3-ANA-2", "TEM-V3-ANA-3"],
    alcanceDetalle: "Las unidades 1 y 2 están confirmadas; la 3 figura en el cronograma, sin confirmar.",
    fuente: "Aviso de la cátedra en el aula virtual (simulado)",
    confianza: "media",
  },
  {
    kind: "EVALUACION",
    id: ID.ENTREGA_ARQ,
    materia: "ARQUITECTURA",
    titulo: "Entrega de ejercicios · Unidades 3 y 4",
    corto: "la entrega de Arquitectura",
    tramo: t("2026-09-25", "23:00", "23:30"),
    modalidad: "Entrega en el aula virtual",
    alcance: ["TEM-V3-ARQ-3", "TEM-V3-ARQ-4"],
    alcanceDetalle: "Ejercicios de pipeline y de jerarquía de memoria.",
    fuente: "Cronograma de la cátedra (simulado)",
    confianza: "media",
  },
  {
    kind: "EVALUACION",
    id: ID.PARCIAL_FIS,
    materia: "FISICA",
    titulo: "Primer parcial · Unidades 1 y 2",
    corto: "el parcial de Física",
    tramo: t("2026-09-28", "08:00", "10:00"),
    modalidad: "Escrito, presencial",
    alcance: ["TEM-V3-FIS-1", "TEM-V3-FIS-2"],
    alcanceDetalle: "Vectores y cinemática.",
    fuente: "Cronograma de la cátedra (simulado)",
    confianza: "alta",
  },
  {
    kind: "EVALUACION",
    id: ID.PARCIAL_ECO,
    materia: "ECONOMIA",
    titulo: "Primer parcial · Unidades 1 a 3",
    corto: "el parcial de Economía",
    tramo: t("2026-10-01", "14:00", "16:00"),
    modalidad: "Escrito, presencial",
    alcance: ["TEM-V3-ECO-1", "TEM-V3-ECO-2", "TEM-V3-ECO-3"],
    alcanceDetalle: "La unidad 3 todavía no se dictó.",
    fuente: "Cronograma de la cátedra (simulado)",
    confianza: "baja",
  },
];

// ── Lo que ya ocurrió ─────────────────────────────────────────────────────────────

const validado = (id: string, materia: MateriaId, tema: string, titulo: string, tramo: Tramo, cuando: string): Registro => ({
  kind: "REGISTRO",
  id,
  materia,
  tema,
  titulo,
  tramo,
  duracionEstimada: { min: 45, probable: 60, max: 75 },
  estado: "EVIDENCIA_VALIDADA",
  evidencia: { descripcion: "fotografía de los ejercicios resueltos", revision: "SUFICIENTE" },
  progreso: { cuando },
  pieza: true,
  sesion: null,
  cambioEnPlan: ["Registrado antes de esta semana."],
});

export const REGISTROS: readonly Registro[] = [
  validado("REG-SYN-V3-FUN1", "ANALISIS", "TEM-V3-ANA-1", "Leer teoría de Funciones", t("2026-08-31", "18:00", "19:00"), "1 de septiembre"),
  validado("REG-SYN-V3-FUN2", "ANALISIS", "TEM-V3-ANA-1", "Resolver Práctica 1 de Funciones", t("2026-09-03", "18:00", "19:00"), "4 de septiembre"),
  validado("REG-SYN-V3-VEC", "FISICA", "TEM-V3-FIS-1", "Resolver ejercicios de Vectores", t("2026-09-05", "10:00", "11:00"), "7 de septiembre"),
  validado("REG-SYN-V3-MER", "ECONOMIA", "TEM-V3-ECO-1", "Resolver guía de Mercados", t("2026-09-04", "16:00", "17:00"), "5 de septiembre"),
  validado("REG-SYN-V3-OYD", "ECONOMIA", "TEM-V3-ECO-2", "Resolver guía de Oferta y demanda", t("2026-09-11", "16:00", "17:00"), "12 de septiembre"),
  validado("REG-SYN-V3-REL", "BASES", "TEM-V3-BD-1", "Resolver ejercicios de modelo relacional", t("2026-09-06", "10:00", "11:00"), "8 de septiembre"),
  {
    kind: "REGISTRO",
    id: ID.REG_LIM_TEORIA,
    materia: "ANALISIS",
    tema: "TEM-V3-ANA-2",
    titulo: "Leer teoría de Límites",
    tramo: t(LUN, "10:00", "11:05"),
    duracionEstimada: { min: 40, probable: 50, max: 60 },
    estado: "EVIDENCIA_VALIDADA",
    evidencia: { descripcion: "esquema con las propiedades de los límites", revision: "SUFICIENTE" },
    progreso: { cuando: "lunes 14, 13:20" },
    pieza: true,
    sesion: "Sesión de Focus de 65 min (simulada)",
    cambioEnPlan: ["Límites pasó a 1 de 2 actividades con recorrido registrado.", "La Práctica 2 de Límites quedó como la acción más prioritaria."],
  },
  {
    kind: "REGISTRO",
    id: ID.REG_PIPELINE,
    materia: "ARQUITECTURA",
    tema: "TEM-V3-ARQ-3",
    titulo: "Resolver ejercicio de pipeline",
    tramo: t(LUN, "11:15", "11:50"),
    duracionEstimada: { min: 25, probable: 30, max: 40 },
    estado: "COMPLETADA",
    evidencia: { descripcion: "diagrama del pipeline de cinco etapas", revision: "INSUFICIENTE" },
    progreso: null,
    pieza: false,
    sesion: "Sesión de Focus de 35 min (simulada)",
    cambioEnPlan: ["La evidencia no alcanzó: faltaba marcar los riesgos de datos.", "Generó «Corregir ejercicio de pipeline»."],
  },
  {
    kind: "REGISTRO",
    id: ID.REG_CINEMATICA,
    materia: "FISICA",
    tema: "TEM-V3-FIS-2",
    titulo: "Resolver guía 1 de Cinemática",
    tramo: t(LUN, "16:30", "17:20"),
    duracionEstimada: { min: 45, probable: 50, max: 60 },
    estado: "EVIDENCIA_ENVIADA",
    evidencia: { descripcion: "fotografía de la guía resuelta", revision: "SIN_REVISAR" },
    progreso: null,
    pieza: true,
    sesion: "Sesión de Focus de 50 min (simulada)",
    cambioEnPlan: ["Salió del trabajo pendiente de la semana.", "El Gantt no cambia hasta que la evidencia se revise."],
  },
  {
    kind: "REGISTRO",
    id: ID.REG_CONSIGNA,
    materia: "BASES",
    tema: "TEM-V3-BD-2",
    titulo: "Leer la consigna del TP 1",
    tramo: t(MAR, "12:00", "12:30"),
    duracionEstimada: { min: 20, probable: 30, max: 30 },
    estado: "COMPLETADA",
    evidencia: { descripcion: "no pedía evidencia", revision: "SIN_EVIDENCIA_REQUERIDA" },
    progreso: null,
    pieza: false,
    sesion: null,
    cambioEnPlan: ["«Normalizar caso práctico» quedó con la duración estimada de la consigna: 1 h 30."],
  },
];

// ── Compromisos ───────────────────────────────────────────────────────────────────

export const COMPROMISOS: readonly CompromisoDelFixture[] = [
  {
    id: ID.COMPROMISO_PIPELINE,
    accionId: ID.PIPELINE,
    tramo: t(MAR, "10:30", "11:00"),
    evidencia: "diagrama corregido con los riesgos de datos marcados",
    estado: "INCUMPLIDO",
    confirmadoEl: "lunes 14, 12:00",
  },
  {
    id: ID.COMPROMISO_U4,
    accionId: ID.RESUMEN_U4,
    tramo: t(JUE, "15:00", "16:00"),
    evidencia: "resumen de una carilla",
    estado: "CONFIRMADO",
    confirmadoEl: "lunes 14, 20:10",
  },
];

// ── Trabajo académico propuesto ───────────────────────────────────────────────────

const DERIVADAS_MIE = { fecha: MIE, hora: "14:00", motivo: "la clase de Derivadas" };

/** En este orden el motor recorre cada nivel de prioridad. */
export const ACCIONES: readonly Accion[] = [
  {
    kind: "ACCION",
    id: ID.LIMITES,
    materia: "ANALISIS",
    tema: "TEM-V3-ANA-2",
    tipo: "Práctica",
    titulo: "Resolver Práctica 2 de Límites",
    corto: "Límites",
    duracion: { min: 50, probable: 60, max: 65 },
    confianza: { nivel: "media", fuente: "3 prácticas de Análisis registradas; ninguna de Límites" },
    prioridad: "MUY_ALTA",
    razonCorta: "Desbloquea Derivadas",
    razones: [
      "Es el primer hueco de práctica del parcial más cercano.",
      "Desbloquea la práctica de Derivadas.",
      "Entra completa en el bloque del martes a la noche.",
      "Hace seis días que no trabajás este tema.",
    ],
    evidencia: "fotografía legible de los ejercicios 1 a 8",
    requiere: [],
    noAntesDe: null,
    convieneAntesDe: DERIVADAS_MIE,
    antesDe: ID.PARCIAL,
    seRetiraSi: null,
    recorrido: true,
    explicacionRecorrido: "Con evidencia suficiente, Límites suma recorrido registrado.",
    origen: "La generó la clase del lunes 7.",
    alternativas: [
      "Leer teoría de Derivadas tiene prioridad alta, pero no destraba nada.",
      "Normalizar caso práctico tiene fecha más cercana y todavía entra el miércoles.",
    ],
  },
  {
    kind: "ACCION",
    id: ID.NORMALIZAR,
    materia: "BASES",
    tema: "TEM-V3-BD-2",
    tipo: "Práctica",
    titulo: "Normalizar caso práctico",
    corto: "Normalización",
    duracion: { min: 70, probable: 90, max: 100 },
    confianza: { nivel: "baja", fuente: "primer caso práctico de la materia: sin registros comparables" },
    prioridad: "ALTA",
    razonCorta: "Cierra el jueves 21:00",
    razones: ["Es lo que se entrega en el TP 1.", "Necesita un bloque de una hora y media seguida."],
    evidencia: "el caso normalizado hasta tercera forma normal",
    requiere: [],
    noAntesDe: null,
    convieneAntesDe: null,
    antesDe: ID.ENTREGA_BD,
    seRetiraSi: null,
    recorrido: true,
    explicacionRecorrido: "Con evidencia suficiente, Normalización suma recorrido registrado.",
    origen: "La generó la consigna del TP 1.",
    alternativas: ["Es la única acción con fecha esta semana además de las de Análisis."],
  },
  {
    kind: "ACCION",
    id: ID.TEORIA_DERIVADAS,
    materia: "ANALISIS",
    tema: "TEM-V3-ANA-3",
    tipo: "Teoría",
    titulo: "Leer teoría de Derivadas",
    corto: "Teoría de Derivadas",
    duracion: { min: 40, probable: 45, max: 55 },
    confianza: { nivel: "media", fuente: "duración de las lecturas de Análisis registradas" },
    prioridad: "ALTA",
    razonCorta: "Entra en el parcial",
    razones: ["La unidad 3 figura en el parcial.", "Ordena lo que se vio el lunes antes de practicar."],
    evidencia: "esquema con las reglas de derivación",
    requiere: [],
    noAntesDe: null,
    convieneAntesDe: null,
    antesDe: ID.PARCIAL,
    seRetiraSi: null,
    recorrido: true,
    explicacionRecorrido: "Con el esquema revisado como suficiente, Derivadas suma recorrido registrado. No afirma dominio.",
    origen: null,
    alternativas: ["Comparte prioridad con el refuerzo de Límites: se pueden intercambiar sin aviso."],
  },
  {
    kind: "ACCION",
    id: ID.REFUERZO_LIMITES,
    materia: "ANALISIS",
    tema: "TEM-V3-ANA-2",
    tipo: "Refuerzo",
    titulo: "Reforzar Límites con ejercicios extra",
    corto: "Refuerzo de Límites",
    duracion: { min: 40, probable: 45, max: 55 },
    confianza: { nivel: "baja", fuente: "estimación por defecto del laboratorio" },
    prioridad: "ALTA",
    razonCorta: "Se retira si Límites queda constatada",
    razones: ["Reserva tiempo por si la Práctica 2 no queda constatada antes del parcial."],
    evidencia: "cuatro ejercicios de límites laterales",
    requiere: [],
    noAntesDe: null,
    convieneAntesDe: null,
    antesDe: ID.PARCIAL,
    seRetiraSi: { id: ID.LIMITES, motivo: "Si la Práctica 2 de Límites queda con evidencia suficiente, el refuerzo deja de hacer falta." },
    recorrido: false,
    explicacionRecorrido: "Es un refuerzo: no suma una actividad nueva al recorrido del tema.",
    origen: null,
    alternativas: ["Comparte prioridad con la teoría de Derivadas: se pueden intercambiar sin aviso."],
  },
  {
    kind: "ACCION",
    id: ID.PRACTICA_DERIVADAS,
    materia: "ANALISIS",
    tema: "TEM-V3-ANA-3",
    tipo: "Práctica",
    titulo: "Resolver Práctica 3 de Derivadas",
    corto: "Práctica de Derivadas",
    duracion: { min: 50, probable: 60, max: 75 },
    confianza: { nivel: "baja", fuente: "primera práctica de Derivadas: sin registros comparables" },
    prioridad: "ALTA",
    razonCorta: "Depende de Límites",
    razones: ["Entra en el parcial.", "Usa las reglas que se dan el miércoles.", "Se apoya en la Práctica 2 de Límites."],
    evidencia: "fotografía de los ejercicios 1 a 6",
    requiere: [ID.LIMITES],
    noAntesDe: { fecha: MIE, hora: "16:00", motivo: "las reglas de derivación se dan en la clase del miércoles 14:00–16:00" },
    convieneAntesDe: null,
    antesDe: ID.PARCIAL,
    seRetiraSi: null,
    recorrido: true,
    explicacionRecorrido: "Con evidencia suficiente, Derivadas suma recorrido registrado. Práctica constatada no es dominio.",
    origen: null,
    alternativas: ["Sin Límites resuelta antes, esta práctica no constata Derivadas."],
  },
  {
    kind: "ACCION",
    id: ID.CINEMATICA,
    materia: "FISICA",
    tema: "TEM-V3-FIS-2",
    tipo: "Práctica",
    titulo: "Resolver ejercicios de Cinemática",
    corto: "Cinemática",
    duracion: { min: 45, probable: 60, max: 70 },
    confianza: { nivel: "media", fuente: "2 guías de Física registradas" },
    prioridad: "MEDIA",
    razonCorta: "Parcial de Física el 28",
    razones: ["Completa la unidad 2 antes del parcial del 28.", "La guía 1 ya se envió y espera revisión."],
    evidencia: "fotografía de la guía 2 resuelta",
    requiere: [],
    noAntesDe: null,
    convieneAntesDe: null,
    antesDe: null,
    seRetiraSi: null,
    recorrido: true,
    explicacionRecorrido: "Con evidencia suficiente, Cinemática suma recorrido registrado.",
    origen: null,
    alternativas: ["Comparte prioridad con Corregir ejercicio de pipeline: se pueden intercambiar sin aviso."],
  },
  {
    kind: "ACCION",
    id: ID.PIPELINE,
    materia: "ARQUITECTURA",
    tema: "TEM-V3-ARQ-3",
    tipo: "Corrección",
    titulo: "Corregir ejercicio de pipeline",
    corto: "Pipeline",
    duracion: { min: 25, probable: 30, max: 40 },
    confianza: { nivel: "alta", fuente: "el primer intento llevó 35 min" },
    prioridad: "MEDIA",
    razonCorta: "Retoma el compromiso del martes",
    razones: ["La evidencia del lunes no alcanzó.", "El compromiso del martes 10:30 quedó incumplido y el trabajo sigue pendiente."],
    evidencia: "diagrama corregido con los riesgos de datos marcados",
    requiere: [],
    noAntesDe: null,
    convieneAntesDe: null,
    antesDe: null,
    seRetiraSi: null,
    recorrido: true,
    explicacionRecorrido: "Con la corrección suficiente, Pipeline suma recorrido registrado.",
    origen: "Pedido de reenvío sobre la evidencia del lunes 14.",
    alternativas: ["Comparte prioridad con Cinemática: se pueden intercambiar sin aviso."],
  },
  {
    kind: "ACCION",
    id: ID.ECONOMIA_U2,
    materia: "ECONOMIA",
    tema: "TEM-V3-ECO-2",
    tipo: "Repaso",
    titulo: "Repasar Unidad 2",
    corto: "Economía",
    duracion: { min: 30, probable: 40, max: 45 },
    confianza: { nivel: "alta", fuente: "5 repasos de Economía registrados" },
    prioridad: "BAJA",
    razonCorta: "Sin evaluación esta semana",
    razones: ["Economía no tiene evaluación hasta el 1 de octubre.", "Prepara la clase de Elasticidad del viernes."],
    evidencia: "tres preguntas de la unidad respondidas",
    requiere: [],
    noAntesDe: null,
    convieneAntesDe: null,
    antesDe: null,
    seRetiraSi: null,
    recorrido: false,
    explicacionRecorrido: "Repasar no suma una actividad nueva: Oferta y demanda ya tiene recorrido registrado.",
    origen: null,
    alternativas: ["Es la de menor prioridad: conviene después de lo que tiene fecha."],
  },
  {
    kind: "ACCION",
    id: ID.RESUMEN_U4,
    materia: "ARQUITECTURA",
    tema: "TEM-V3-ARQ-4",
    tipo: "Resumen",
    titulo: "Resumir Unidad 4: Jerarquía de memoria",
    corto: "Resumen de la Unidad 4",
    duracion: { min: 50, probable: 60, max: 70 },
    confianza: { nivel: "media", fuente: "2 resúmenes de Arquitectura registrados" },
    prioridad: "MEDIA",
    razonCorta: "Prepara la clase del jueves",
    razones: ["Se da en la clase del jueves 11:00."],
    evidencia: "resumen de una carilla",
    requiere: [],
    noAntesDe: null,
    convieneAntesDe: null,
    antesDe: null,
    seRetiraSi: null,
    recorrido: true,
    explicacionRecorrido: "Con el resumen revisado como suficiente, Jerarquía de memoria suma recorrido registrado.",
    origen: null,
    alternativas: [],
  },
];

// ── Disponibilidad ────────────────────────────────────────────────────────────────

export const VENTANAS: readonly VentanaDelFixture[] = [
  { id: "DSP-SYN-V3-LUN-1", tramo: t(LUN, "10:00", "12:00") },
  { id: "DSP-SYN-V3-LUN-2", tramo: t(LUN, "16:30", "17:30") },
  { id: "DSP-SYN-V3-MAR-1", tramo: t(MAR, "10:30", "12:30") },
  { id: "DSP-SYN-V3-MAR-2", tramo: t(MAR, "19:00", "20:30") },
  { id: "DSP-SYN-V3-MIE", tramo: t(MIE, "16:30", "18:00") },
  { id: "DSP-SYN-V3-JUE-1", tramo: t(JUE, "15:00", "16:30") },
  { id: "DSP-SYN-V3-JUE-2", tramo: t(JUE, "19:00", "21:00") },
  { id: "DSP-SYN-V3-VIE-1", tramo: t(VIE, "08:30", "10:00") },
  { id: "DSP-SYN-V3-VIE-2", tramo: t(VIE, "14:00", "16:30") },
  { id: "DSP-SYN-V3-SAB", tramo: t(SAB, "10:00", "12:00") },
  { id: "DSP-SYN-V3-DOM", tramo: t(DOM, "17:00", "18:30") },
];

/** Las cinco horas que *Reajustar disponibilidad* ofrece previsualizar. */
export const CINCO_HORAS: readonly VentanaDelFixture[] = [
  { id: "DSP-SYN-V3-X-MIE", tramo: t(MIE, "09:00", "11:00") },
  { id: "DSP-SYN-V3-X-JUE", tramo: t(JUE, "16:30", "18:00") },
  { id: "DSP-SYN-V3-X-SAB", tramo: t(SAB, "14:00", "15:30") },
];

export const instanteDe = (tramo: Tramo) => ({ ini: instante(tramo.fecha, tramo.desde), fin: instante(tramo.fecha, tramo.hasta) });
