/**
 * 🧪 **SPIKE DESCARTABLE — fixture canónico de «Mi Plan vivo».**
 *
 * ⚠️ **DATOS EXCLUSIVOS DE DEMOSTRACIÓN.** Materias, clases, aulas, parcial,
 * disponibilidad, duraciones, confianzas y fuentes son **inventados** para que el
 * Product Owner pueda mirar una pantalla. Ninguno sale de la base, del Academic
 * Decision Engine ni del Personal Engine, y nada de esto se lee en producción.
 *
 * ⚠️ **Las ubicaciones de cada escenario están escritas a mano.** No hay un
 * algoritmo detrás: es la respuesta preparada a *"¿cómo se vería si…?"*. Lo que
 * **no** está escrito a mano son los totales y los márgenes, que se calculan en
 * `proyecciones.ts` a partir de los bloques — así una cifra no puede contradecir
 * lo que se ve.
 *
 * ## Las cuentas del estado inicial
 *
 * | | Minutos | Se lee |
 * |---|---:|---|
 * | Trabajo pendiente (probable) | 60+45+45+60+45+60+60+75+110 = **560** | 9 h 20 |
 * | Disponibilidad de la semana | 60+90+105+60+60+75 = **450** | 7 h 30 |
 * | Sin ubicar (guía de elasticidad) | **110** | 1 h 50 |
 * | Margen | **0** | — |
 *
 * **Un ajuste respecto del pedido, y se dice:** *"Resolver Práctica 2: Límites ·
 * 50–65 min"* se mantuvo, y su duración **probable** quedó en 60 para que el bloque
 * del lunes (18:00–19:00) cierre las cuentas. Si se estira al máximo, pasa 5
 * minutos del bloque, y la pantalla lo dice.
 */

import type {
  SpikeDisponibilidad,
  SpikeElemento,
  SpikeEstado,
  SpikeFranjaHoraria,
  SpikeMateria,
  SpikeMateriaId,
  SpikeScenario,
} from "./tipos";

export const SPIKE_ES_DEMO = true as const;

/** El reloj fijo del laboratorio. */
export const AHORA_INICIAL = "2026-09-14T17:30:00-03:00";
/** El salto de *Adelantar reloj*: posterior al compromiso del miércoles. */
export const AHORA_ADELANTADO = "2026-09-17T19:10:00-03:00";

export const SEMANA: readonly string[] = [
  "2026-09-14",
  "2026-09-15",
  "2026-09-16",
  "2026-09-17",
  "2026-09-18",
  "2026-09-19",
  "2026-09-20",
];

export const MATERIAS: Readonly<Record<SpikeMateriaId, SpikeMateria>> = {
  ANALISIS: { id: "ANALISIS", nombre: "Análisis Matemático I", corto: "Análisis", color: "var(--materia-1)" },
  ECONOMIA: { id: "ECONOMIA", nombre: "Economía", corto: "Economía", color: "var(--materia-2)" },
  ARQUITECTURA: { id: "ARQUITECTURA", nombre: "Arquitectura de Computadoras", corto: "Arquitectura", color: "var(--materia-4)" },
};

const f = (dia: string, desde: string, hasta: string): SpikeFranjaHoraria => ({ dia, desde, hasta });

const LUN = "2026-09-14";
const MAR = "2026-09-15";
const MIE = "2026-09-16";
const JUE = "2026-09-17";
const VIE = "2026-09-18";
const SAB = "2026-09-19";

/** Ids que el resto del spike nombra. */
export const ID = {
  PARCIAL: "EVA-SYN-SPIKE-ANA-P1",
  COMPROMISO: "COM-SYN-SPIKE-001",
  TRABAJO_DEL_COMPROMISO: "TRB-SYN-SPIKE-001",
  LIMITES: "ACC-SYN-SPIKE-LIM",
  REPASO_LIMITES: "ACC-SYN-SPIKE-REPLIM",
  TEORIA_DERIVADAS: "ACC-SYN-SPIKE-TEODER",
  PRACTICA_DERIVADAS: "ACC-SYN-SPIKE-PRADER",
  PARCIAL_DE_PRACTICA: "ACC-SYN-SPIKE-PARPRA",
  ECONOMIA_U3: "ACC-SYN-SPIKE-ECOU3",
  CACHE: "ACC-SYN-SPIKE-CACHE",
  ELASTICIDAD: "ACC-SYN-SPIKE-ELAST",
} as const;

const fija = (
  id: string,
  materia: SpikeMateriaId,
  tipo: string,
  titulo: string,
  franja: SpikeFranjaHoraria,
): SpikeElemento => ({
  id,
  carril: "FACULTAD",
  materia,
  tipo,
  titulo,
  estado: "INSTITUCIONAL",
  rango: null,
  confianza: null,
  evidenciaEsperada: null,
  requiere: [],
  franjaFija: franja,
});

/** El catálogo: todo lo que puede aparecer en alguna proyección. */
export const CATALOGO: readonly SpikeElemento[] = [
  // ── Facultad: no se mueve nunca ──────────────────────────────────────────
  fija("CLS-SYN-SPIKE-ANA-LUN", "ANALISIS", "Clase", "Unidad 2 · Límites", f(LUN, "14:00", "16:00")),
  fija("CLS-SYN-SPIKE-ECO-MAR", "ECONOMIA", "Clase", "Unidad 3 · Elasticidad", f(MAR, "16:00", "18:00")),
  fija("CLS-SYN-SPIKE-ARQ-MAR", "ARQUITECTURA", "Clase", "Unidad 4 · Memoria", f(MAR, "19:00", "21:00")),
  fija("CLS-SYN-SPIKE-ANA-MIE", "ANALISIS", "Clase", "Unidad 3 · Derivadas", f(MIE, "14:00", "16:00")),
  fija("CLS-SYN-SPIKE-ECO-JUE", "ECONOMIA", "Clase", "Unidad 3 · Práctico", f(JUE, "14:00", "16:00")),
  fija("CLS-SYN-SPIKE-ARQ-JUE", "ARQUITECTURA", "Clase", "Unidad 5 · Caché", f(JUE, "16:30", "18:30")),
  fija(ID.PARCIAL, "ANALISIS", "Parcial", "Primer parcial · Unidades 1 a 3", f(VIE, "18:00", "20:00")),

  // ── Lo que ya pasó antes del reloj: hechos, no trabajo pendiente ─────────
  {
    id: "EVD-SYN-SPIKE-ECO-G2",
    carril: "ACCIONES",
    materia: "ECONOMIA",
    tipo: "Guía",
    titulo: "Guía 2 · Oferta y demanda",
    estado: "EVIDENCIA_PENDIENTE",
    rango: null,
    confianza: null,
    evidenciaEsperada: "fotografía de la guía resuelta",
    requiere: [],
    franjaFija: f(LUN, "10:00", "11:00"),
  },
  {
    id: "PRG-SYN-SPIKE-ARQ-P1",
    carril: "ACCIONES",
    materia: "ARQUITECTURA",
    tipo: "Práctica",
    titulo: "Práctica 1 · Memoria virtual",
    estado: "PROGRESO_REGISTRADO",
    rango: null,
    confianza: null,
    evidenciaEsperada: "fotografía de los ejercicios resueltos",
    requiere: [],
    franjaFija: f(LUN, "11:30", "12:30"),
  },

  // ── El compromiso confirmado: no se reubica ──────────────────────────────
  {
    id: ID.COMPROMISO,
    carril: "COMPROMISOS",
    materia: "ARQUITECTURA",
    tipo: "Compromiso",
    titulo: "Resumir Unidad 4: Jerarquía de memoria",
    estado: "COMPROMISO_CONFIRMADO",
    rango: { min: 60, max: 60, probable: 60 },
    confianza: null,
    evidenciaEsperada: "resumen de una carilla",
    requiere: [],
    franjaFija: f(MIE, "17:00", "18:00"),
  },
  /**
   * El **trabajo** del compromiso, separado del compromiso. Sólo aparece cuando el
   * compromiso se incumple: el hecho histórico queda en su lugar, y lo que falta
   * hacer sigue pendiente sin hora.
   */
  {
    id: ID.TRABAJO_DEL_COMPROMISO,
    carril: "ACCIONES",
    materia: "ARQUITECTURA",
    tipo: "Trabajo pendiente",
    titulo: "Resumir Unidad 4: Jerarquía de memoria",
    estado: "NECESITA_REUBICACION",
    rango: { min: 60, max: 60, probable: 60 },
    confianza: null,
    evidenciaEsperada: "resumen de una carilla",
    requiere: [],
    franjaFija: null,
  },

  // ── Propuestas: se pueden reordenar ──────────────────────────────────────
  {
    id: ID.LIMITES,
    carril: "ACCIONES",
    materia: "ANALISIS",
    tipo: "Práctica",
    titulo: "Resolver Práctica 2: Límites",
    estado: "SUGERIDA",
    rango: { min: 50, max: 65, probable: 60 },
    confianza: { nivel: "media", fuente: "3 prácticas de Análisis registradas; ninguna de Límites" },
    evidenciaEsperada: "fotografía legible de los ejercicios resueltos",
    requiere: [],
    franjaFija: null,
  },
  {
    id: ID.REPASO_LIMITES,
    carril: "ACCIONES",
    materia: "ANALISIS",
    tipo: "Repaso",
    titulo: "Repasar Límites antes de Derivadas",
    estado: "SUGERIDA",
    rango: { min: 35, max: 55, probable: 45 },
    confianza: { nivel: "baja", fuente: "estimación por defecto del demo: no hay repasos registrados" },
    evidenciaEsperada: null,
    requiere: [ID.LIMITES],
    franjaFija: null,
  },
  {
    id: ID.TEORIA_DERIVADAS,
    carril: "ACCIONES",
    materia: "ANALISIS",
    tipo: "Teoría",
    titulo: "Repasar teoría de Derivadas",
    estado: "SUGERIDA",
    rango: { min: 40, max: 55, probable: 45 },
    confianza: { nivel: "media", fuente: "duración de las clases de la Unidad 3" },
    evidenciaEsperada: "esquema con las reglas de derivación",
    requiere: [ID.LIMITES],
    franjaFija: null,
  },
  {
    id: ID.PRACTICA_DERIVADAS,
    carril: "ACCIONES",
    materia: "ANALISIS",
    tipo: "Práctica",
    titulo: "Resolver Práctica 3: Derivadas (ej. 1 a 6)",
    estado: "SUGERIDA",
    rango: { min: 40, max: 60, probable: 45 },
    confianza: { nivel: "baja", fuente: "primera práctica de Derivadas: sin registros comparables" },
    evidenciaEsperada: "fotografía de los ejercicios 1 a 6",
    requiere: [ID.TEORIA_DERIVADAS],
    franjaFija: null,
  },
  {
    id: ID.PARCIAL_DE_PRACTICA,
    carril: "ACCIONES",
    materia: "ANALISIS",
    tipo: "Práctica",
    titulo: "Resolver un parcial de práctica",
    estado: "SUGERIDA",
    rango: { min: 55, max: 75, probable: 60 },
    confianza: { nivel: "baja", fuente: "sin parciales de práctica registrados" },
    evidenciaEsperada: "fotografía del parcial resuelto",
    requiere: [ID.PRACTICA_DERIVADAS],
    franjaFija: null,
  },
  {
    id: ID.ECONOMIA_U3,
    carril: "ACCIONES",
    materia: "ECONOMIA",
    tipo: "Lectura",
    titulo: "Leer Unidad 3 de Economía",
    estado: "SUGERIDA",
    rango: { min: 50, max: 70, probable: 60 },
    confianza: { nivel: "alta", fuente: "5 lecturas de Economía registradas" },
    evidenciaEsperada: "tres preguntas de la unidad respondidas por escrito",
    requiere: [],
    franjaFija: null,
  },
  {
    id: ID.CACHE,
    carril: "ACCIONES",
    materia: "ARQUITECTURA",
    tipo: "Práctica",
    titulo: "Resolver ejercicios de Caché",
    estado: "SUGERIDA",
    rango: { min: 60, max: 90, probable: 75 },
    confianza: { nivel: "media", fuente: "2 prácticas de Arquitectura registradas" },
    evidenciaEsperada: "fotografía de los ejercicios resueltos",
    requiere: [],
    franjaFija: null,
  },
  {
    id: ID.ELASTICIDAD,
    carril: "ACCIONES",
    materia: "ECONOMIA",
    tipo: "Guía",
    titulo: "Resolver guía de elasticidad",
    estado: "SUGERIDA",
    rango: { min: 95, max: 130, probable: 110 },
    confianza: { nivel: "baja", fuente: "guía nueva: sin registros comparables" },
    evidenciaEsperada: null,
    requiere: [],
    franjaFija: null,
  },
];

/** La disponibilidad declarada de la semana: 7 h 30. */
export const DISPONIBILIDAD_BASE: readonly SpikeDisponibilidad[] = [
  { id: "DSP-SYN-SPIKE-LUN", ...f(LUN, "18:00", "19:00"), agregada: false },
  { id: "DSP-SYN-SPIKE-MAR", ...f(MAR, "14:00", "15:30"), agregada: false },
  { id: "DSP-SYN-SPIKE-MIE", ...f(MIE, "17:00", "18:45"), agregada: false },
  { id: "DSP-SYN-SPIKE-JUE", ...f(JUE, "19:30", "20:30"), agregada: false },
  { id: "DSP-SYN-SPIKE-VIE", ...f(VIE, "15:00", "16:00"), agregada: false },
  { id: "DSP-SYN-SPIKE-SAB", ...f(SAB, "10:00", "11:15"), agregada: false },
];

/** *"Esta semana tengo 5 horas más"*: 110 + 135 + 55 = 300 minutos. */
export const DISPONIBILIDAD_EXTRA: readonly SpikeDisponibilidad[] = [
  { id: "DSP-SYN-SPIKE-X-MAR", ...f(MAR, "10:00", "11:50"), agregada: true },
  { id: "DSP-SYN-SPIKE-X-JUE", ...f(JUE, "10:00", "12:15"), agregada: true },
  { id: "DSP-SYN-SPIKE-X-SAB", ...f(SAB, "11:15", "12:10"), agregada: true },
];

/**
 * Una proyección preparada. **Sólo** puede decidir dónde van los elementos sin
 * `franjaFija`, y cambiar estados.
 */
export interface SpikeEscenarioPreparado {
  escenario: SpikeScenario;
  ahora: string;
  conDisponibilidadExtra: boolean;
  /** Elementos movibles presentes, y su franja (`null` = sin ubicar). */
  ubicaciones: Readonly<Record<string, SpikeFranjaHoraria | null>>;
  estados: Readonly<Record<string, SpikeEstado>>;
  /** Lo que se dibuja como resultado hipotético. */
  hipoteticos: readonly string[];
  proximaAccion: string | null;
  siguienteAccion: string | null;
  /** Contra qué proyección se compara para dibujar huellas y el diff. */
  referencia: SpikeScenario | null;
}

const UBICACION_BASE: Record<string, SpikeFranjaHoraria | null> = {
  [ID.LIMITES]: f(LUN, "18:00", "19:00"),
  [ID.REPASO_LIMITES]: f(MAR, "14:00", "14:45"),
  [ID.TEORIA_DERIVADAS]: f(MAR, "14:45", "15:30"),
  [ID.PRACTICA_DERIVADAS]: f(MIE, "18:00", "18:45"),
  [ID.PARCIAL_DE_PRACTICA]: f(JUE, "19:30", "20:30"),
  [ID.ECONOMIA_U3]: f(VIE, "15:00", "16:00"),
  [ID.CACHE]: f(SAB, "10:00", "11:15"),
  [ID.ELASTICIDAD]: null,
};

const UBICACION_CON_EXTRA: Record<string, SpikeFranjaHoraria | null> = {
  ...UBICACION_BASE,
  [ID.ELASTICIDAD]: f(MAR, "10:00", "11:50"),
  [ID.CACHE]: f(JUE, "10:00", "11:15"),
  [ID.ECONOMIA_U3]: f(JUE, "11:15", "12:15"),
};

const UBICACION_RELOJ: Record<string, SpikeFranjaHoraria | null> = {
  [ID.TRABAJO_DEL_COMPROMISO]: null,
  [ID.LIMITES]: f(JUE, "19:30", "20:30"),
  [ID.REPASO_LIMITES]: f(VIE, "15:00", "15:45"),
  [ID.TEORIA_DERIVADAS]: null,
  [ID.PRACTICA_DERIVADAS]: null,
  [ID.PARCIAL_DE_PRACTICA]: null,
  [ID.ECONOMIA_U3]: null,
  [ID.CACHE]: f(SAB, "10:00", "11:15"),
  [ID.ELASTICIDAD]: null,
};

export const ESCENARIOS: Readonly<Record<SpikeScenario, SpikeEscenarioPreparado>> = {
  BASE: {
    escenario: "BASE",
    ahora: AHORA_INICIAL,
    conDisponibilidadExtra: false,
    ubicaciones: UBICACION_BASE,
    estados: {},
    hipoteticos: [],
    proximaAccion: ID.LIMITES,
    siguienteAccion: ID.REPASO_LIMITES,
    referencia: null,
  },

  /**
   * *Si completás Límites, la evidencia resulta suficiente y se registra el
   * progreso.* Límites queda hecho en su bloque; el repaso previo deja de hacer
   * falta; Derivadas se adelanta al martes; el miércoles queda margen.
   */
  COMPLETION_SIMULATION: {
    escenario: "COMPLETION_SIMULATION",
    ahora: AHORA_INICIAL,
    conDisponibilidadExtra: false,
    ubicaciones: (() => {
      const u: Record<string, SpikeFranjaHoraria | null> = {
        ...UBICACION_BASE,
        [ID.TEORIA_DERIVADAS]: f(MAR, "14:00", "14:45"),
        [ID.PRACTICA_DERIVADAS]: f(MAR, "14:45", "15:30"),
      };
      delete u[ID.REPASO_LIMITES];
      return u;
    })(),
    estados: { [ID.LIMITES]: "PROGRESO_REGISTRADO" },
    hipoteticos: [ID.LIMITES, ID.TEORIA_DERIVADAS, ID.PRACTICA_DERIVADAS],
    proximaAccion: ID.LIMITES,
    siguienteAccion: ID.TEORIA_DERIVADAS,
    referencia: "BASE",
  },

  EXTRA_AVAILABILITY_PREVIEW: {
    escenario: "EXTRA_AVAILABILITY_PREVIEW",
    ahora: AHORA_INICIAL,
    conDisponibilidadExtra: true,
    ubicaciones: UBICACION_CON_EXTRA,
    estados: {},
    hipoteticos: [ID.ELASTICIDAD, ID.CACHE, ID.ECONOMIA_U3],
    proximaAccion: ID.LIMITES,
    siguienteAccion: ID.REPASO_LIMITES,
    referencia: "BASE",
  },

  EXTRA_AVAILABILITY_APPLIED: {
    escenario: "EXTRA_AVAILABILITY_APPLIED",
    ahora: AHORA_INICIAL,
    conDisponibilidadExtra: true,
    ubicaciones: UBICACION_CON_EXTRA,
    estados: {},
    hipoteticos: [],
    proximaAccion: ID.LIMITES,
    siguienteAccion: ID.REPASO_LIMITES,
    referencia: "BASE",
  },

  /**
   * Jueves 19:10. Nada se registró desde el lunes: el compromiso del miércoles no
   * se empezó. Queda **incumplido en su lugar**; su trabajo sigue pendiente y sin
   * hora; la disponibilidad de lunes a miércoles ya pasó.
   */
  TIME_ADVANCED_MISSED: {
    escenario: "TIME_ADVANCED_MISSED",
    ahora: AHORA_ADELANTADO,
    conDisponibilidadExtra: false,
    ubicaciones: UBICACION_RELOJ,
    estados: { [ID.COMPROMISO]: "INCUMPLIDO" },
    hipoteticos: [],
    proximaAccion: ID.LIMITES,
    siguienteAccion: ID.REPASO_LIMITES,
    referencia: "BASE",
  },

  /**
   * *Reorganizar sin cortar*, en vista previa: el trabajo del compromiso podría ir
   * el sábado a las 10:00, y para eso Caché queda por ubicar. **No se confirma.**
   */
  RESCUE_PREVIEW: {
    escenario: "RESCUE_PREVIEW",
    ahora: AHORA_ADELANTADO,
    conDisponibilidadExtra: false,
    ubicaciones: {
      ...UBICACION_RELOJ,
      [ID.TRABAJO_DEL_COMPROMISO]: f(SAB, "10:00", "11:00"),
      [ID.CACHE]: null,
    },
    estados: { [ID.COMPROMISO]: "INCUMPLIDO", [ID.TRABAJO_DEL_COMPROMISO]: "PROPUESTA_SIN_CONFIRMAR" },
    hipoteticos: [ID.TRABAJO_DEL_COMPROMISO, ID.CACHE],
    proximaAccion: ID.LIMITES,
    siguienteAccion: ID.REPASO_LIMITES,
    referencia: "TIME_ADVANCED_MISSED",
  },
};

/** Las alternativas a la recomendada, con razones cualitativas. **Sin puntajes.** */
export const ALTERNATIVAS: readonly { id: string; razones: readonly string[] }[] = [
  { id: ID.ECONOMIA_U3, razones: ["tiene una fecha posterior", "entra en tu disponibilidad"] },
  { id: ID.CACHE, razones: ["tiene una fecha posterior", "necesita un bloque más largo que el de hoy"] },
  { id: ID.TEORIA_DERIVADAS, razones: ["requiere completar Límites primero"] },
];
