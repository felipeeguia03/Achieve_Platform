/**
 * 🧪 **LABORATORIO DESCARTABLE — fixture canónico de «Mi Plan vivo» V2.**
 *
 * ⚠️ **DATOS EXCLUSIVOS DE DEMOSTRACIÓN.** Materias, clases, aulas, comisiones,
 * parcial, disponibilidad, duraciones, confianzas, fuentes, notas y reflexiones son
 * **inventados**. Nada sale de la base ni de un engine, y nada se lee en producción.
 *
 * ## Qué cambió respecto de V1
 *
 * V1 escribía **a mano** dónde iba cada propuesta en cada escenario. V2 permite
 * combinar hasta cinco pasos, reubicar y renegociar, y eso no se puede preparar a
 * mano. Por eso la ubicación la hace un **acomodador local del laboratorio**
 * (`proyeccion.ts`): determinista, codicioso, sin partir bloques. **No es el motor
 * del producto ni una propuesta de motor**: es lo mínimo para que las combinaciones
 * se vean coherentes. Lo sigue decidiendo [ADR-109](../../../../docs/decisions.md#adr-109).
 *
 * ## Las cuentas del plan real (verificadas por test)
 *
 * | | Minutos | Se lee |
 * |---|---:|---|
 * | Trabajo pendiente esta semana | 60 (compromiso) + 60+45+45+45+60+60+75+110 = **560** | 9 h 20 |
 * | Disponibilidad declarada útil | 60+90+105+60+60+75 = **450** | 7 h 30 |
 * | Trabajo sin ubicar (guía de elasticidad) | **110** | 1 h 50 |
 * | Margen | **0** | 0 min |
 *
 * Son las mismas cifras de V1, a propósito: la diferencia entre versiones tiene que
 * ser la interacción, no los números.
 */

import type {
  ClaseDelCursado,
  Compromiso,
  Evaluacion,
  Franja,
  HechoHistorico,
  LabMateria,
  LabMateriaId,
  Prioridad,
  Tema,
  VentanaDeDisponibilidad,
  WorkItem,
} from "./tipos";

export const LAB_ES_DEMO = true as const;

/** El reloj fijo del laboratorio. No se adelanta en V2. */
export const AHORA = { dia: "2026-09-14", hora: "17:30", iso: "2026-09-14T17:30:00-03:00" } as const;

export const SEMANA: readonly string[] = [
  "2026-09-14",
  "2026-09-15",
  "2026-09-16",
  "2026-09-17",
  "2026-09-18",
  "2026-09-19",
  "2026-09-20",
];

export const MAXIMO_DE_PASOS = 5;

export const MATERIAS: Readonly<Record<LabMateriaId, LabMateria>> = {
  ANALISIS: { id: "ANALISIS", nombre: "Análisis Matemático I", corto: "Análisis", color: "var(--materia-1)" },
  ECONOMIA: { id: "ECONOMIA", nombre: "Economía", corto: "Economía", color: "var(--materia-2)" },
  ARQUITECTURA: { id: "ARQUITECTURA", nombre: "Arquitectura de Computadoras", corto: "Arquitectura", color: "var(--materia-4)" },
};

const LUN = "2026-09-14";
const MAR = "2026-09-15";
const MIE = "2026-09-16";
const JUE = "2026-09-17";
const VIE = "2026-09-18";
const SAB = "2026-09-19";

const f = (dia: string, desde: string, hasta: string): Franja => ({ dia, desde, hasta });

export const ID = {
  CLASE_ANA_LUN: "CLS-SYN-LAB-ANA-LUN",
  CLASE_ECO_MAR: "CLS-SYN-LAB-ECO-MAR",
  CLASE_ARQ_MAR: "CLS-SYN-LAB-ARQ-MAR",
  CLASE_ANA_MIE: "CLS-SYN-LAB-ANA-MIE",
  CLASE_ECO_JUE: "CLS-SYN-LAB-ECO-JUE",
  CLASE_ARQ_JUE: "CLS-SYN-LAB-ARQ-JUE",
  PARCIAL: "EVA-SYN-LAB-ANA-P1",
  HECHO_ARQ: "HEC-SYN-LAB-ARQ-P1",
  HECHO_ECO: "HEC-SYN-LAB-ECO-G2",
  COMPROMISO_INCUMPLIDO: "COM-SYN-LAB-000",
  COMPROMISO: "COM-SYN-LAB-001",
  LIMITES: "ACC-SYN-LAB-LIM",
  TEORIA_DERIVADAS: "ACC-SYN-LAB-TEODER",
  PRACTICA_DERIVADAS: "ACC-SYN-LAB-PRADER",
  REFUERZO_LIMITES: "ACC-SYN-LAB-REFLIM",
  SIMULACRO: "ACC-SYN-LAB-SIMULACRO",
  ECONOMIA_U3: "ACC-SYN-LAB-ECOU3",
  CACHE: "ACC-SYN-LAB-CACHE",
  ELASTICIDAD: "ACC-SYN-LAB-ELAST",
} as const;

// ── Temas (Gantt académico) ───────────────────────────────────────────────────

export const TEMAS: readonly Tema[] = [
  {
    id: "TEM-ANA-1",
    materia: "ANALISIS",
    unidad: "U1",
    nombre: "Funciones",
    catedra: { estado: "DADA", cuando: "semana del 31 de agosto", fuente: "clases registradas", claseId: null },
    vos: "PROGRESO_REGISTRADO",
  },
  {
    id: "TEM-ANA-2",
    materia: "ANALISIS",
    unidad: "U2",
    nombre: "Límites",
    catedra: { estado: "DADA", cuando: "lunes 14", fuente: "registro de la clase del lunes", claseId: ID.CLASE_ANA_LUN },
    vos: "SIN_PROGRESO",
  },
  {
    id: "TEM-ANA-3",
    materia: "ANALISIS",
    unidad: "U3",
    nombre: "Derivadas",
    catedra: { estado: "ESPERADA", cuando: "miércoles 16", fuente: "cronograma de la cátedra", claseId: ID.CLASE_ANA_MIE, confianza: "media" },
    vos: "SIN_PROGRESO",
  },
  {
    id: "TEM-ECO-1",
    materia: "ECONOMIA",
    unidad: "U1",
    nombre: "Mercados",
    catedra: { estado: "DADA", cuando: "semana del 31 de agosto", fuente: "clases registradas", claseId: null },
    vos: "PROGRESO_REGISTRADO",
  },
  {
    id: "TEM-ECO-2",
    materia: "ECONOMIA",
    unidad: "U2",
    nombre: "Oferta y demanda",
    catedra: { estado: "DADA", cuando: "semana del 7 de septiembre", fuente: "clases registradas", claseId: null },
    vos: "EVIDENCIA_SIN_PROGRESO",
  },
  {
    id: "TEM-ECO-3",
    materia: "ECONOMIA",
    unidad: "U3",
    nombre: "Elasticidad",
    catedra: { estado: "ESPERADA", cuando: "martes 15", fuente: "cronograma de la cátedra", claseId: ID.CLASE_ECO_MAR, confianza: "alta" },
    vos: "SIN_PROGRESO",
  },
  {
    id: "TEM-ARQ-3",
    materia: "ARQUITECTURA",
    unidad: "U3",
    nombre: "Memoria virtual",
    catedra: { estado: "DADA", cuando: "semana del 7 de septiembre", fuente: "clases registradas", claseId: null },
    vos: "PROGRESO_REGISTRADO",
  },
  {
    id: "TEM-ARQ-4",
    materia: "ARQUITECTURA",
    unidad: "U4",
    nombre: "Jerarquía de memoria",
    catedra: { estado: "ESPERADA", cuando: "martes 15", fuente: "cronograma de la cátedra", claseId: ID.CLASE_ARQ_MAR, confianza: "media" },
    vos: "SIN_PROGRESO",
  },
  {
    id: "TEM-ARQ-5",
    materia: "ARQUITECTURA",
    unidad: "U5",
    nombre: "Caché",
    catedra: { estado: "ESPERADA", cuando: "jueves 17", fuente: "cronograma de la cátedra", claseId: ID.CLASE_ARQ_JUE, confianza: "baja" },
    vos: "SIN_PROGRESO",
  },
];

// ── Facultad: no se mueve ─────────────────────────────────────────────────────

const COMISION = "Comisión B (simulada)";

const futura = (
  id: string,
  materia: LabMateriaId,
  titulo: string,
  franja: Franja,
  aula: string,
  temasEsperados: string[],
  confianza: "baja" | "media" | "alta",
  materialesPrevios: string[],
): ClaseDelCursado => ({
  kind: "CLASE",
  id,
  materia,
  titulo,
  franja,
  comision: COMISION,
  aula,
  fuente: "Cronograma publicado por la cátedra (simulado)",
  registro: null,
  esperado: { temasEsperados, confianza, materialesPrevios },
});

export const CLASES: readonly ClaseDelCursado[] = [
  {
    kind: "CLASE",
    id: ID.CLASE_ANA_LUN,
    materia: "ANALISIS",
    titulo: "Unidad 2 · Límites",
    franja: f(LUN, "14:00", "16:00"),
    comision: COMISION,
    aula: "Aula 204 (simulada)",
    fuente: "Registro de clase del estudiante y cronograma de la cátedra (simulados)",
    registro: {
      asistencia: "Asististe · registrada en Modo Clase",
      temasConfirmados: ["TEM-ANA-2"],
      notas: ["El docente marcó el ejercicio 7 como posible evaluación.", "Límites laterales: revisar la definición."],
      resumen: "Grabación de 1 h 42 con 3 etiquetas (simulada). Sin transcripción.",
      accionesGeneradas: [ID.LIMITES],
    },
    esperado: null,
  },
  futura(ID.CLASE_ECO_MAR, "ECONOMIA", "Unidad 3 · Elasticidad", f(MAR, "16:00", "18:00"), "Aula 12 (simulada)", ["TEM-ECO-3"], "alta", [
    "Capítulo 4 del libro de la cátedra",
  ]),
  futura(ID.CLASE_ARQ_MAR, "ARQUITECTURA", "Unidad 4 · Jerarquía de memoria", f(MAR, "19:00", "21:00"), "Laboratorio 3 (simulado)", ["TEM-ARQ-4"], "media", [
    "Diapositivas de la Unidad 4",
  ]),
  futura(ID.CLASE_ANA_MIE, "ANALISIS", "Unidad 3 · Derivadas", f(MIE, "14:00", "16:00"), "Aula 204 (simulada)", ["TEM-ANA-3"], "media", [
    "Apunte de Derivadas",
    "Práctica 3",
  ]),
  futura(ID.CLASE_ECO_JUE, "ECONOMIA", "Unidad 3 · Práctico", f(JUE, "14:00", "16:00"), "Aula 12 (simulada)", ["TEM-ECO-3"], "media", [
    "Guía de elasticidad",
  ]),
  futura(ID.CLASE_ARQ_JUE, "ARQUITECTURA", "Unidad 5 · Caché", f(JUE, "16:30", "18:30"), "Laboratorio 3 (simulado)", ["TEM-ARQ-5"], "baja", []),
];

export const EVALUACIONES: readonly Evaluacion[] = [
  {
    kind: "EVALUACION",
    id: ID.PARCIAL,
    materia: "ANALISIS",
    titulo: "Primer parcial · Unidades 1 a 3",
    franja: f(VIE, "18:00", "20:00"),
    modalidad: "Escrito, presencial, 2 horas",
    alcance: {
      temas: ["TEM-ANA-1", "TEM-ANA-2", "TEM-ANA-3"],
      estado: "PROVISIONAL",
      detalle: "Las unidades 1 y 2 están confirmadas; la 3 está pendiente de confirmación.",
    },
    fuente: "Aviso de la cátedra en el aula virtual (simulado)",
    accionesRelacionadas: [ID.LIMITES, ID.TEORIA_DERIVADAS, ID.PRACTICA_DERIVADAS, ID.REFUERZO_LIMITES, ID.SIMULACRO],
    restricciones: [
      "La fecha y la hora no se mueven desde el plan.",
      "El trabajo de Análisis se ubica antes de las 18:00 del viernes.",
    ],
  },
];

// ── Lo que ya ocurrió ─────────────────────────────────────────────────────────

export const HECHOS: readonly HechoHistorico[] = [
  {
    kind: "HECHO",
    id: ID.HECHO_ECO,
    materia: "ECONOMIA",
    tipo: "Guía",
    titulo: "Resolver Guía 2: Oferta y demanda",
    franja: f(LUN, "10:00", "11:00"),
    temas: ["TEM-ECO-2"],
    duracionEstimada: { min: 50, probable: 60, max: 70 },
    duracionReal: 60,
    focus: "Sesión de Focus de 60 min",
    evidencia: { descripcion: "fotografía de la guía resuelta", estado: "ENVIADA_SIN_REVISAR" },
    reflexion: null,
    progresoRegistrado: null,
    impactoEnElPlan: [
      "Salió del trabajo pendiente de la semana: 10 h 20 → 9 h 20.",
      "La guía de elasticidad sigue esperando la Unidad 3.",
    ],
    cambioEnGantt: "Ninguno todavía: la evidencia no se revisó.",
  },
  {
    kind: "HECHO",
    id: ID.HECHO_ARQ,
    materia: "ARQUITECTURA",
    tipo: "Práctica",
    titulo: "Resolver Práctica 1: Memoria virtual",
    franja: f(LUN, "11:30", "12:30"),
    temas: ["TEM-ARQ-3"],
    duracionEstimada: { min: 45, probable: 50, max: 60 },
    duracionReal: 55,
    focus: "Sesión de Focus de 55 min",
    evidencia: { descripcion: "fotografía de los ejercicios resueltos", estado: "SUFICIENTE" },
    reflexion: "El ejercicio 4 me llevó más de lo que pensaba.",
    progresoRegistrado: { temas: ["TEM-ARQ-3"], cuando: "lunes 14, 13:10" },
    impactoEnElPlan: [
      "El refuerzo de Memoria virtual dejó de hacer falta.",
      "Resumir la Unidad 4 quedó como lo siguiente de Arquitectura.",
    ],
    cambioEnGantt: "Arquitectura · Memoria virtual pasó a progreso registrado.",
  },
];

// ── Compromisos ───────────────────────────────────────────────────────────────

export const COMPROMISOS: readonly Compromiso[] = [
  {
    kind: "COMPROMISO",
    id: ID.COMPROMISO_INCUMPLIDO,
    materia: "ANALISIS",
    titulo: "Leer teoría de Derivadas",
    prioridad: "PRIMERO",
    franja: f(LUN, "08:00", "08:45"),
    evidencia: "esquema con las reglas de derivación",
    estado: "INCUMPLIDO",
    promesaOriginal: f(LUN, "08:00", "08:45"),
    renegociaciones: [],
    realizado: "No se empezó.",
    trabajoPendienteId: ID.TEORIA_DERIVADAS,
    impacto: { temas: ["TEM-ANA-3"], produceProgreso: false, explicacion: "Era una lectura: no movía el Gantt." },
  },
  {
    kind: "COMPROMISO",
    id: ID.COMPROMISO,
    materia: "ARQUITECTURA",
    titulo: "Resumir Unidad 4: Jerarquía de memoria",
    prioridad: "ENSEGUIDA",
    franja: f(MIE, "17:00", "18:00"),
    evidencia: "resumen de una carilla",
    estado: "CONFIRMADO",
    promesaOriginal: f(MIE, "17:00", "18:00"),
    renegociaciones: [],
    realizado: "Todavía no llegó su horario.",
    trabajoPendienteId: null,
    impacto: {
      temas: ["TEM-ARQ-4"],
      produceProgreso: true,
      explicacion: "Con el resumen revisado como suficiente, se registra progreso en Jerarquía de memoria.",
    },
  },
];

// ── Trabajo académico propuesto ───────────────────────────────────────────────

const NO_ANTES_DE_CACHE = { dia: JUE, hora: "18:30", motivo: "Caché se da en la clase del jueves 17." };

/** En el orden en que el acomodador los recorre dentro de cada prioridad. */
export const WORKITEMS: readonly WorkItem[] = [
  {
    kind: "WORKITEM",
    id: ID.LIMITES,
    materia: "ANALISIS",
    tipo: "Práctica",
    titulo: "Resolver Práctica 2: Límites",
    objetivo: "Los ejercicios 1 a 8 resueltos, con el procedimiento a la vista.",
    prioridad: "PRIMERO",
    razonDePrioridad: "Entra en el parcial del viernes, Límites no tiene práctica registrada y habilita la práctica de Derivadas.",
    requiere: [],
    duracion: { min: 50, probable: 60, max: 65 },
    confianza: { nivel: "media", fuente: "3 prácticas de Análisis registradas; ninguna de Límites" },
    evidencia: "fotografía legible de los ejercicios resueltos",
    impacto: { temas: ["TEM-ANA-2"], produceProgreso: true, explicacion: "Con evidencia suficiente, se registra progreso en Límites." },
    noAntesDe: null,
    antesDe: ID.PARCIAL,
    seRetiraSi: null,
    origen: "La generó la clase del lunes 14.",
    alternativas: ["Comparte prioridad con la teoría de Derivadas: se pueden intercambiar."],
  },
  {
    kind: "WORKITEM",
    id: ID.TEORIA_DERIVADAS,
    materia: "ANALISIS",
    tipo: "Teoría",
    titulo: "Leer teoría de Derivadas",
    objetivo: "Un esquema con las reglas de derivación del apunte.",
    prioridad: "PRIMERO",
    razonDePrioridad: "Prepara la clase del miércoles y retoma el compromiso del lunes que no se empezó.",
    requiere: [],
    duracion: { min: 40, probable: 45, max: 55 },
    confianza: { nivel: "media", fuente: "duración de las lecturas de Análisis registradas" },
    evidencia: "esquema con las reglas de derivación",
    impacto: {
      temas: ["TEM-ANA-3"],
      produceProgreso: false,
      explicacion: "Leer teoría reduce trabajo pendiente, pero no mueve el Gantt hasta que exista evidencia suficiente de práctica.",
    },
    noAntesDe: null,
    antesDe: ID.PARCIAL,
    seRetiraSi: null,
    origen: "Es el trabajo del compromiso del lunes 14, 08:00, que quedó incumplido.",
    alternativas: ["Comparte prioridad con Límites: se pueden intercambiar."],
  },
  {
    kind: "WORKITEM",
    id: ID.PRACTICA_DERIVADAS,
    materia: "ANALISIS",
    tipo: "Práctica",
    titulo: "Resolver Práctica 3: Derivadas",
    objetivo: "Los ejercicios 1 a 6 resueltos.",
    prioridad: "ENSEGUIDA",
    razonDePrioridad: "Entra en el parcial; se apoya en Límites.",
    requiere: [ID.LIMITES],
    duracion: { min: 40, probable: 45, max: 60 },
    confianza: { nivel: "baja", fuente: "primera práctica de Derivadas: sin registros comparables" },
    evidencia: "fotografía de los ejercicios 1 a 6",
    impacto: { temas: ["TEM-ANA-3"], produceProgreso: true, explicacion: "Con evidencia suficiente, se registra progreso en Derivadas." },
    noAntesDe: null,
    antesDe: ID.PARCIAL,
    seRetiraSi: null,
    origen: null,
    alternativas: ["Depende de Límites: sin esa práctica, no constata Derivadas."],
  },
  {
    kind: "WORKITEM",
    id: ID.REFUERZO_LIMITES,
    materia: "ANALISIS",
    tipo: "Refuerzo",
    titulo: "Reforzar Límites con ejercicios extra",
    objetivo: "Cuatro ejercicios extra de Límites laterales.",
    prioridad: "ENSEGUIDA",
    razonDePrioridad: "Reserva tiempo por si Límites todavía no queda constatado antes del parcial.",
    requiere: [],
    duracion: { min: 35, probable: 45, max: 55 },
    confianza: { nivel: "baja", fuente: "estimación por defecto del laboratorio" },
    evidencia: null,
    impacto: { temas: ["TEM-ANA-2"], produceProgreso: false, explicacion: "Es un refuerzo: no suma un tema al Gantt." },
    noAntesDe: null,
    antesDe: ID.PARCIAL,
    seRetiraSi: {
      id: ID.LIMITES,
      motivo: "Si la Práctica 2 queda con evidencia suficiente, el refuerzo deja de hacer falta.",
    },
    origen: null,
    alternativas: ["Deja de hacer falta si Límites queda constatado."],
  },
  {
    kind: "WORKITEM",
    id: ID.SIMULACRO,
    materia: "ANALISIS",
    tipo: "Simulacro",
    titulo: "Resolver un parcial de práctica",
    objetivo: "Un parcial de práctica completo, en 2 horas o menos.",
    prioridad: "ENSEGUIDA",
    razonDePrioridad: "Ensaya el formato del parcial con las tres unidades.",
    requiere: [ID.PRACTICA_DERIVADAS],
    duracion: { min: 55, probable: 60, max: 75 },
    confianza: { nivel: "baja", fuente: "sin parciales de práctica registrados" },
    evidencia: "fotografía del parcial resuelto",
    impacto: {
      temas: ["TEM-ANA-1", "TEM-ANA-2", "TEM-ANA-3"],
      produceProgreso: false,
      explicacion: "Muestra cómo te va con el formato, pero no registra progreso de un tema por sí solo.",
    },
    noAntesDe: null,
    antesDe: ID.PARCIAL,
    seRetiraSi: null,
    origen: null,
    alternativas: ["Depende de la práctica de Derivadas."],
  },
  {
    kind: "WORKITEM",
    id: ID.ECONOMIA_U3,
    materia: "ECONOMIA",
    tipo: "Lectura",
    titulo: "Leer Unidad 3 de Economía",
    objetivo: "Tres preguntas de la unidad respondidas por escrito.",
    prioridad: "DESPUES",
    razonDePrioridad: "Economía no tiene evaluación esta semana; prepara la guía de elasticidad.",
    requiere: [],
    duracion: { min: 50, probable: 60, max: 70 },
    confianza: { nivel: "alta", fuente: "5 lecturas de Economía registradas" },
    evidencia: "tres preguntas de la unidad respondidas por escrito",
    impacto: { temas: ["TEM-ECO-3"], produceProgreso: false, explicacion: "Es una lectura: no mueve el progreso académico por sí sola." },
    noAntesDe: null,
    antesDe: null,
    seRetiraSi: null,
    origen: null,
    alternativas: ["Comparte prioridad con Caché: se pueden intercambiar."],
  },
  {
    kind: "WORKITEM",
    id: ID.CACHE,
    materia: "ARQUITECTURA",
    tipo: "Práctica",
    titulo: "Resolver ejercicios de Caché",
    objetivo: "La guía de ejercicios de caché resuelta.",
    prioridad: "DESPUES",
    razonDePrioridad: "Arquitectura no tiene evaluación esta semana, y el tema se da el jueves.",
    requiere: [],
    duracion: { min: 60, probable: 75, max: 90 },
    confianza: { nivel: "media", fuente: "2 prácticas de Arquitectura registradas" },
    evidencia: "fotografía de los ejercicios resueltos",
    impacto: { temas: ["TEM-ARQ-5"], produceProgreso: true, explicacion: "Con evidencia suficiente, se registra progreso en Caché." },
    noAntesDe: NO_ANTES_DE_CACHE,
    antesDe: null,
    seRetiraSi: null,
    origen: null,
    alternativas: ["Comparte prioridad con la lectura de Economía: se pueden intercambiar."],
  },
  {
    kind: "WORKITEM",
    id: ID.ELASTICIDAD,
    materia: "ECONOMIA",
    tipo: "Guía",
    titulo: "Resolver guía de elasticidad",
    objetivo: "La guía de elasticidad resuelta.",
    prioridad: "DESPUES",
    razonDePrioridad: "Es la práctica de la Unidad 3; conviene después de leerla.",
    requiere: [ID.ECONOMIA_U3],
    duracion: { min: 95, probable: 110, max: 130 },
    confianza: { nivel: "baja", fuente: "guía nueva: sin registros comparables" },
    evidencia: "fotografía de la guía resuelta",
    impacto: { temas: ["TEM-ECO-3"], produceProgreso: true, explicacion: "Con evidencia suficiente, se registra progreso en Elasticidad." },
    noAntesDe: null,
    antesDe: null,
    seRetiraSi: null,
    origen: null,
    alternativas: ["Depende de la lectura de la Unidad 3."],
  },
];

// ── Disponibilidad ────────────────────────────────────────────────────────────

const recurrente = (id: string, franja: Franja, detalle: string): VentanaDeDisponibilidad => ({
  kind: "DISPONIBILIDAD",
  id,
  franja,
  origen: "RECURRENTE",
  detalle,
});

/** La disponibilidad declarada de la semana: 7 h 30. */
export const VENTANAS: readonly VentanaDeDisponibilidad[] = [
  recurrente("DSP-SYN-LAB-LUN", f(LUN, "18:00", "19:00"), "Todos los lunes"),
  recurrente("DSP-SYN-LAB-MAR", f(MAR, "14:00", "15:30"), "Todos los martes"),
  recurrente("DSP-SYN-LAB-MIE", f(MIE, "17:00", "18:45"), "Todos los miércoles"),
  recurrente("DSP-SYN-LAB-JUE", f(JUE, "19:30", "20:30"), "Todos los jueves"),
  recurrente("DSP-SYN-LAB-VIE", f(VIE, "15:00", "16:00"), "Todos los viernes"),
  recurrente("DSP-SYN-LAB-SAB", f(SAB, "10:00", "11:15"), "Todos los sábados"),
];

/** Excepciones que el laboratorio ofrece agregar. No hay editor de horarios libre. */
export const EXCEPCIONES: readonly VentanaDeDisponibilidad[] = [
  { kind: "DISPONIBILIDAD", id: "DSP-SYN-LAB-X-MAR", franja: f(MAR, "10:00", "11:50"), origen: "EXCEPCION", detalle: "Sólo esta semana" },
  { kind: "DISPONIBILIDAD", id: "DSP-SYN-LAB-X-JUE", franja: f(JUE, "10:00", "12:15"), origen: "EXCEPCION", detalle: "Sólo esta semana" },
  { kind: "DISPONIBILIDAD", id: "DSP-SYN-LAB-X-SAB", franja: f(SAB, "11:15", "12:10"), origen: "EXCEPCION", detalle: "Sólo esta semana" },
];

export const ORDEN_DE_PRIORIDAD: readonly Prioridad[] = ["PRIMERO", "ENSEGUIDA", "DESPUES"];
