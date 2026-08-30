/**
 * Los 28 estados críticos de `UX08`, de `product-spec-source.md` §VI.8 §16.
 *
 * El **nivel de precedencia no se escribe acá**: lo calcula
 * `selectOverviewLevel` a partir de la condición del dominio que el escenario
 * declara. Un fixture dice en qué estado está el mundo; nunca la respuesta.
 *
 * `FX-EXAM-BASE` ya existe en el catálogo con la vista de `UX07`; acá se
 * definen escenarios nuevos, todos con prefijo `FX-LOCAL-OV-` porque el
 * registro del spec §7 no los nombra.
 */

import { contexto } from "@/lib/navigation/context";
import { selectOverviewLevel, type OverviewInput } from "@/lib/domain/overview-precedence";
import type { Escenario } from "./types";
import type {
  DatoDeEvaluacion,
  FilaDato,
  OverviewExamenProps,
  PasoDelRecorrido,
} from "@/lib/domain/view-models";

const MATERIA = "Análisis II";
const EVALUACION = "Parcial 1";
const OFICIAL = "Cátedra · oficial";
const CURSADO = "Cursado, sus cinco dimensiones y la Bitácora continúan disponibles.";
const VOLVER = "VOLVER A CURSADO";

function dato(label: string, valor: string, provenance: string | null = OFICIAL): DatoDeEvaluacion {
  return { label, valor, provenance, anterior: null };
}

const DATOS: DatoDeEvaluacion[] = [dato("Fecha", "07 sep 2026"), dato("Modalidad", "Práctico")];

const RECORRIDO: PasoDelRecorrido[] = [
  { label: "Repaso de la unidad", estado: "CONFIRMADO" },
  { label: "Práctica dirigida", estado: "ACTUAL" },
];

const PENDIENTE_BASE: FilaDato[] = [{ label: "Dominio", valor: "no evaluado", ausencia: "SIN_ASIGNAR" }];

const nada: OverviewInput = {
  action: "NONE",
  commitment: "NONE",
  rescate: "NONE",
  evidence: "NONE",
  recomendacionPrimariaVigente: false,
  pasoActualDisponible: false,
  gateAutoritativo: false,
  progreso: "NONE",
};

type Vista = Omit<OverviewExamenProps, "nivel" | "variante">;

function ov(input: OverviewInput, vista: Partial<Vista>): OverviewExamenProps {
  const { nivel, variante } = selectOverviewLevel(input);
  return {
    nivel,
    variante,
    materia: MATERIA,
    evaluacion: EVALUACION,
    datos: DATOS,
    estadoDominante: "PREPARACIÓN ACTIVA",
    objeto: null,
    ctaPrimaria: null,
    despues: null,
    secundarios: [],
    aviso: null,
    recorrido: RECORRIDO,
    cambioConfirmado: [],
    pendiente: PENDIENTE_BASE,
    fuenteProgreso: null,
    statusRecibido: null,
    cursadoPersistente: CURSADO,
    ctaRetorno: VOLVER,
    ...vista,
  };
}

function esc(
  id: string,
  proposito: string,
  input: OverviewInput,
  vista: Partial<Vista>,
  cubre: readonly string[] = ["C01-024", "SC-EX-02"],
): Escenario {
  return {
    id,
    origen: "local",
    proposito,
    cubre,
    contextos: {
      UX08: contexto({
        navegacionDisponible: true,
        progresoDisponible: true,
        pasoActualAutoritativo: input.pasoActualDisponible,
        hayGate: input.gateAutoritativo,
        objetoDeMayorPrecedencia: selectOverviewLevel(input).nivel < 7,
        recomendacionPrimariaVigente: input.recomendacionPrimariaVigente,
      }),
    },
    ux08: ov(input, vista),
  };
}

// ── 1. ACTIVE recién activada · sin asumir paso ──────────────────────────────
export const FX_LOCAL_OV_ACTIVA = esc(
  "FX-LOCAL-OV-ACTIVA",
  "ACTIVE recién activada: identidad y estado, sin asumir un paso",
  { ...nada },
  {
    estadoDominante: "PREPARACIÓN ACTIVA",
    recorrido: null,
    aviso: "Todavía no hay un paso para abrir.",
    ctaPrimaria: { texto: "VOLVER A CURSADO", habilitada: true },
  },
  ["C01-024", "SC-EX-01"],
);

// ── 2. ACTIVE + Recommendation ───────────────────────────────────────────────
export const FX_LOCAL_OV_RECOMENDACION = esc(
  "FX-LOCAL-OV-RECOMENDACION",
  "Recomendación primaria vigente del ADE: COMPROMETERME, sin recálculo local",
  { ...nada, recomendacionPrimariaVigente: true, pasoActualDisponible: true },
  {
    estadoDominante: "PREPARACIÓN ACTIVA",
    objeto: "U4 · Resolver ejercicios 12–18",
    ctaPrimaria: { texto: "COMPROMETERME", habilitada: true },
    despues: "abrís la acción y la aceptación. El Commitment se confirma aparte.",
    secundarios: ["Hay un paso del recorrido disponible."],
  },
  ["C01-024", "SC-EX-04"],
);

// ── 3. ACTIVE + IN_PROGRESS ──────────────────────────────────────────────────
export const FX_LOCAL_OV_IN_PROGRESS = esc(
  "FX-LOCAL-OV-IN-PROGRESS",
  "Action IN_PROGRESS: gana el nivel 1 sobre todo lo demás",
  { ...nada, action: "IN_PROGRESS", commitment: "MISSED", evidence: "UNDER_REVIEW" },
  {
    estadoDominante: "ACCIÓN EN CURSO",
    objeto: "U4 · Resolver ejercicios 12–18",
    ctaPrimaria: { texto: "CONTINUAR", habilitada: true },
    despues: "al terminar, presentás la evidencia acordada.",
    secundarios: [
      "Hay un compromiso incumplido sin resolver.",
      "Una evidencia anterior sigue en revisión.",
    ],
  },
);

// ── 4. ACTIVE + Commitment vigente · las tres variantes del nivel 3 ──────────
export const FX_LOCAL_OV_COMMITMENT_CONFIRMED = esc(
  "FX-LOCAL-OV-COMMITMENT-CONFIRMED",
  "Commitment CONFIRMED futuro: se abre sin iniciar",
  { ...nada, commitment: "CONFIRMED_FUTURO" },
  {
    estadoDominante: "PREPARACIÓN ACTIVA",
    objeto: "Sáb 30 ago · 19:00 · Resolver ejercicios 12–18",
    ctaPrimaria: { texto: "VER COMPROMISO", habilitada: true },
    despues: "se abre el detalle. Abrirlo no lo inicia.",
  },
);

export const FX_LOCAL_OV_COMMITMENT_DUE = esc(
  "FX-LOCAL-OV-COMMITMENT-DUE",
  "Commitment DUE: iniciable según el owner, nunca por un timer local",
  { ...nada, commitment: "DUE" },
  {
    estadoDominante: "PREPARACIÓN ACTIVA",
    objeto: "Hoy · 19:00 · Resolver ejercicios 12–18",
    ctaPrimaria: { texto: "EMPEZAR", habilitada: true },
    despues: "el owner coordina el inicio. Abrir la pantalla no lo inicia.",
  },
);

export const FX_LOCAL_OV_COMMITMENT_STARTED = esc(
  "FX-LOCAL-OV-COMMITMENT-STARTED",
  "Commitment STARTED: se coordina con la Action",
  { ...nada, commitment: "STARTED" },
  {
    estadoDominante: "ACCIÓN EN CURSO",
    objeto: "U4 · Resolver ejercicios 12–18",
    ctaPrimaria: { texto: "CONTINUAR", habilitada: true },
  },
);

// ── 5. ACTIVE + MISSED ───────────────────────────────────────────────────────
export const FX_LOCAL_OV_MISSED = esc(
  "FX-LOCAL-OV-MISSED",
  "Compromiso incumplido: RETOMAR con el original visible y preservado",
  { ...nada, commitment: "MISSED", rescate: "REQUIRED", recomendacionPrimariaVigente: true },
  {
    estadoDominante: "COMPROMISO INCUMPLIDO",
    objeto: "Mié 27 ago · 19:00 · Resolver ejercicios 8–14",
    ctaPrimaria: { texto: "RETOMAR", habilitada: true },
    despues: "se abre la resolución. Retomar no borra ni edita el original.",
    secundarios: ["Hay una recomendación esperando, y no reemplaza a esto."],
  },
);

// ── 6. ACTIVE + Evidence requerida ───────────────────────────────────────────
export const FX_LOCAL_OV_EVIDENCE_PENDING = esc(
  "FX-LOCAL-OV-EVIDENCE-PENDING",
  "Evidence requerida: vence a la recomendación",
  { ...nada, action: "EVIDENCE_PENDING", recomendacionPrimariaVigente: true },
  {
    estadoDominante: "FALTA PRESENTAR EVIDENCIA",
    objeto: "U4 · Resolver ejercicios 12–18",
    ctaPrimaria: { texto: "SUBIR EVIDENCIA", habilitada: true },
    despues: "enviar deja la evidencia recibida. No implica suficiencia ni validación.",
  },
);

// ── 7. UNDER_REVIEW · las dos ramas ──────────────────────────────────────────
export const FX_LOCAL_OV_UNDER_REVIEW_SIN_GATE = esc(
  "FX-LOCAL-OV-UNDER-REVIEW-SIN-GATE",
  "UNDER_REVIEW sin gate: queda secundaria ante un paso accionable",
  { ...nada, evidence: "UNDER_REVIEW", pasoActualDisponible: true },
  {
    estadoDominante: "EVIDENCIA EN REVISIÓN",
    objeto: "Práctica dirigida",
    ctaPrimaria: { texto: "ABRIR PASO ACTUAL", habilitada: true },
    despues: "se abre el paso. Abrirlo no lo completa.",
    secundarios: ["Tu evidencia sigue en revisión. Todavía sin cambio de progreso confirmado."],
  },
);

export const FX_LOCAL_OV_UNDER_REVIEW_CON_GATE = esc(
  "FX-LOCAL-OV-UNDER-REVIEW-CON-GATE",
  "UNDER_REVIEW con gate autoritativo: el paso no se presenta y VER EVIDENCIA pasa a primaria",
  { ...nada, evidence: "UNDER_REVIEW", pasoActualDisponible: true, gateAutoritativo: true },
  {
    estadoDominante: "EVIDENCIA EN REVISIÓN",
    objeto: "Ejercicios 12–18",
    // Sin persona ni SLA inventados: no se promete quién revisa ni cuándo.
    ctaPrimaria: { texto: "VER EVIDENCIA", habilitada: true },
    despues: "se abre el detalle. Abrirlo no la valida.",
    aviso: "El recorrido no puede avanzar hasta que se resuelva la revisión.",
  },
);

// ── 8. ProgressUpdated · 9a y 9b ─────────────────────────────────────────────
export const FX_LOCAL_OV_PROGRESS_UPDATED = esc(
  "FX-LOCAL-OV-PROGRESS-UPDATED",
  "ProgressUpdated con destino canónico: sólo changed_dimensions",
  { ...nada, progreso: "PROGRESS_UPDATED" },
  {
    estadoDominante: "CAMBIO CONFIRMADO",
    ctaPrimaria: { texto: "VER AVANCE", habilitada: true },
    cambioConfirmado: [{ label: "Práctica", valor: "12 → 19 ejercicios" }],
    fuenteProgreso: "Evidence validada",
    recorrido: null,
  },
  ["C01-024", "SC-PROG-01"],
);

export const FX_LOCAL_OV_PROGRESS_ENTRY = esc(
  "FX-LOCAL-OV-PROGRESS-ENTRY",
  "ProgressEntry histórica: actividad registrada, sin atribuir causalidad",
  { ...nada, progreso: "PROGRESS_ENTRY" },
  {
    estadoDominante: "CAMBIO CONFIRMADO",
    ctaPrimaria: { texto: "VER BITÁCORA", habilitada: true },
    aviso: "Actividad registrada; hito todavía no confirmado.",
    recorrido: null,
  },
  ["C01-024", "SC-PROG-01"],
);

export const FX_LOCAL_OV_PROGRESO_AMBIGUO = esc(
  "FX-LOCAL-OV-PROGRESO-AMBIGUO",
  "Destino de progreso ambiguo: no se elige localmente, se cae al fallback",
  { ...nada, progreso: "AMBIGUO" },
  {
    estadoDominante: "PREPARACIÓN ACTIVA",
    recorrido: null,
    // VER AVANCE y VER BITÁCORA nunca son alternativas locales.
    ctaPrimaria: { texto: "VOLVER A CURSADO", habilitada: true },
  },
);

// ── 9. Sin recomendación ─────────────────────────────────────────────────────
export const FX_LOCAL_OV_SIN_RECOMENDACION = esc(
  "FX-LOCAL-OV-SIN-RECOMENDACION",
  "Sin recomendación: se ofrece el paso real, no se genera una",
  { ...nada, pasoActualDisponible: true },
  {
    estadoDominante: "TODAVÍA NO HAY UNA PRÓXIMA ACCIÓN",
    objeto: "Práctica dirigida",
    ctaPrimaria: { texto: "ABRIR PASO ACTUAL", habilitada: true },
    aviso: "Todavía no hay una próxima acción.",
  },
);

// ── 10. Sin recorrido ────────────────────────────────────────────────────────
export const FX_LOCAL_OV_SIN_RECORRIDO = esc(
  "FX-LOCAL-OV-SIN-RECORRIDO",
  "Sin protocolo: recorrido no disponible, sin listar doce pasos",
  { ...nada },
  {
    estadoDominante: "PREPARACIÓN ACTIVA",
    recorrido: null,
    aviso: "Recorrido todavía no disponible.",
    ctaPrimaria: { texto: "VOLVER A CURSADO", habilitada: true },
  },
);

// ── 11–18. Las ocho variantes de fecha ───────────────────────────────────────
function conFecha(
  id: string,
  proposito: string,
  fecha: DatoDeEvaluacion,
  extra: Partial<Vista> = {},
): Escenario {
  return esc(id, proposito, { ...nada, pasoActualDisponible: true }, {
    datos: [fecha, dato("Modalidad", "Práctico")],
    objeto: "Práctica dirigida",
    ctaPrimaria: { texto: "ABRIR PASO ACTUAL", habilitada: true },
    ...extra,
  });
}

export const FX_LOCAL_OV_FECHA_CONFIRMADA = conFecha(
  "FX-LOCAL-OV-FECHA-CONFIRMADA",
  "Fecha confirmada por la cátedra",
  dato("Fecha", "07 sep 2026"),
);

export const FX_LOCAL_OV_FECHA_REPORTADA = conFecha(
  "FX-LOCAL-OV-FECHA-REPORTADA",
  "Fecha reportada por el estudiante: nunca parece oficial",
  dato("Fecha", "07 sep 2026", "Reportado por vos · sin verificar"),
);

export const FX_LOCAL_OV_FECHA_ESTIMADA = conFecha(
  "FX-LOCAL-OV-FECHA-ESTIMADA",
  "Fecha estimada: conserva label y estado",
  dato("Fecha", "07 sep 2026 · Estimada", "Estimado por Achieve · sin verificar"),
);

export const FX_LOCAL_OV_FECHA_DESCONOCIDA = conFecha(
  "FX-LOCAL-OV-FECHA-DESCONOCIDA",
  "Fecha desconocida: sin countdown",
  dato("Fecha", "Desconocida", null),
);

export const FX_LOCAL_OV_FECHA_MODIFICADA = conFecha(
  "FX-LOCAL-OV-FECHA-MODIFICADA",
  "Fecha modificada: vigente más anterior, sin fusionarlas",
  { label: "Fecha", valor: "14 sep 2026", provenance: OFICIAL, anterior: "07 sep 2026" },
);

export const FX_LOCAL_OV_FECHA_PROXIMA = conFecha(
  "FX-LOCAL-OV-FECHA-PROXIMA",
  "Fecha próxima: el relativo sólo con cálculo del owner",
  dato("Fecha", "07 sep 2026 · faltan 9 días"),
);

export const FX_LOCAL_OV_FECHA_HOY = conFecha(
  "FX-LOCAL-OV-FECHA-HOY",
  "Examen en el día: 'Hoy rendís' sólo si es autoritativo",
  dato("Fecha", "Hoy rendís · 29 ago 2026"),
);

export const FX_LOCAL_OV_FECHA_PASADA = conFecha(
  "FX-LOCAL-OV-FECHA-PASADA",
  "Fecha pasada sin cierre: fecha factual y status preservado",
  dato("Fecha", "12 ago 2026"),
  { aviso: "La fecha de esta evaluación ya pasó. La preparación conserva su estado." },
);

// ── 19–21. Las tres modalidades ──────────────────────────────────────────────
function conModalidad(id: string, proposito: string, valor: string, extra: Partial<Vista> = {}) {
  return esc(id, proposito, { ...nada, pasoActualDisponible: true }, {
    datos: [dato("Fecha", "07 sep 2026"), dato("Modalidad", valor)],
    objeto: "Práctica dirigida",
    ctaPrimaria: { texto: "ABRIR PASO ACTUAL", habilitada: true },
    ...extra,
  });
}

export const FX_LOCAL_OV_PRACTICO = conModalidad(
  "FX-LOCAL-OV-PRACTICO",
  "Modalidad práctica: soportada en P0",
  "Práctico",
);

export const FX_LOCAL_OV_TEORICO = conModalidad(
  "FX-LOCAL-OV-TEORICO",
  "Modalidad teórica escrita: soportada en P0",
  "Teórico escrito",
);

export const FX_LOCAL_OV_ORAL = esc(
  "FX-LOCAL-OV-ORAL",
  "Modalidad oral: valor real visible, sin forzar el protocolo P0",
  { ...nada },
  {
    datos: [dato("Fecha", "07 sep 2026"), dato("Modalidad", "Oral")],
    estadoDominante: "RECORRIDO FUERA DE P0",
    recorrido: null,
    aviso: "El recorrido para esta modalidad todavía no está disponible.",
    ctaPrimaria: { texto: "VOLVER A CURSADO", habilitada: true },
  },
);

// ── 22. Confianza alta + dominio bajo ────────────────────────────────────────
// Se muestran separadas. La confianza NO es dominio, y la UI no genera una
// Action a partir de la brecha.
export const FX_LOCAL_OV_CONFIANZA_VS_DOMINIO = esc(
  "FX-LOCAL-OV-CONFIANZA-VS-DOMINIO",
  "Confianza alta y dominio bajo: dimensiones separadas, sin Action local",
  { ...nada, pasoActualDisponible: true },
  {
    objeto: "Práctica dirigida",
    ctaPrimaria: { texto: "ABRIR PASO ACTUAL", habilitada: true },
    pendiente: [
      { label: "Confianza", valor: "alta · declarada ayer" },
      { label: "Dominio", valor: "no evaluado", ausencia: "SIN_ASIGNAR" },
    ],
  },
);

// ── 23. Datos contradictorios ────────────────────────────────────────────────
export const FX_LOCAL_OV_CONTRADICTORIOS = esc(
  "FX-LOCAL-OV-CONTRADICTORIOS",
  "Datos contradictorios: versiones separadas, sin resolver localmente",
  { ...nada },
  {
    datos: [
      {
        label: "Fecha",
        valor: "07 sep 2026",
        provenance: "Dato en revisión · hay versiones distintas",
        anterior: null,
        enRevision: true,
      },
      dato("Modalidad", "Práctico"),
    ],
    estadoDominante: "HAY DATOS CONTRADICTORIOS",
    aviso: "Hay versiones distintas de este dato.",
    recorrido: null,
    ctaPrimaria: { texto: "VOLVER A CURSADO", habilitada: true },
  },
);

// ── 24. Datos no disponibles ─────────────────────────────────────────────────
// Error técnico, no empty state académico.
export const FX_LOCAL_OV_NO_DISPONIBLE = esc(
  "FX-LOCAL-OV-NO-DISPONIBLE",
  "Lectura fallida: error con reintento, no un empty state académico",
  { ...nada },
  {
    datos: [],
    estadoDominante: "NO PUDIMOS CARGAR LA PREPARACIÓN",
    aviso: "No pudimos cargar el progreso. Tu evidencia conserva su estado.",
    recorrido: null,
    pendiente: [],
    ctaPrimaria: { texto: "REINTENTAR", habilitada: true },
  },
  ["C01-024", "SC-ERR-02"],
);

// ── 25. Varias preparaciones ─────────────────────────────────────────────────
export const FX_LOCAL_OV_VARIAS_PREPARACIONES = esc(
  "FX-LOCAL-OV-VARIAS-PREPARACIONES",
  "Varias preparaciones: ésta se muestra aislada, sin ranking entre materias",
  { ...nada, pasoActualDisponible: true },
  {
    objeto: "Práctica dirigida",
    ctaPrimaria: { texto: "ABRIR PASO ACTUAL", habilitada: true },
    secundarios: ["Tenés otras preparaciones activas. Cada una se abre desde su materia."],
  },
);

// ── 26. Status posterior recibido ────────────────────────────────────────────
// Sin card de readiness, sin score y sin porcentaje: sólo el valor recibido con
// su descargo literal (ADR-011 · §18).
export const FX_LOCAL_OV_READY_BY_PROTOCOL = esc(
  "FX-LOCAL-OV-READY-BY-PROTOCOL",
  "Status READY_BY_PROTOCOL recibido: se muestra el valor con su descargo, sin card",
  { ...nada, pasoActualDisponible: true },
  {
    objeto: "Práctica dirigida",
    ctaPrimaria: { texto: "ABRIR PASO ACTUAL", habilitada: true },
    statusRecibido: {
      valor: "La fuente de preparación informa que cumpliste las condiciones del protocolo vigente.",
      descargo: "Esto no predice ni garantiza el resultado.",
    },
  },
);

// ── 27. Handoff disponible ───────────────────────────────────────────────────
export const FX_LOCAL_OV_HANDOFF_DISPONIBLE = esc(
  "FX-LOCAL-OV-HANDOFF-DISPONIBLE",
  "Handoff disponible: se abre el paso actual",
  { ...nada, pasoActualDisponible: true },
  {
    objeto: "Práctica dirigida",
    ctaPrimaria: { texto: "ABRIR PASO ACTUAL", habilitada: true },
    despues: "se abre el paso. Abrirlo no lo completa.",
  },
  ["C01-024", "SC-EX-03"],
);

// ── 28. Handoff no disponible ────────────────────────────────────────────────
export const FX_LOCAL_OV_HANDOFF_NO_DISPONIBLE = esc(
  "FX-LOCAL-OV-HANDOFF-NO-DISPONIBLE",
  "Handoff no disponible: retorno honesto, la preparación no se revierte",
  { ...nada },
  {
    estadoDominante: "PREPARACIÓN ACTIVA",
    aviso: "Todavía no hay un paso para abrir.",
    recorrido: null,
    ctaPrimaria: { texto: "VOLVER A CURSADO", habilitada: true },
  },
  ["C01-024", "SC-EX-05"],
);

// ── Nivel 5 · Evidence RESUBMISSION_REQUESTED ────────────────────────────────
// La anterior se preserva: reenviar crea una Evidence nueva (invariante I4).
export const FX_LOCAL_OV_RESUBMISSION = esc(
  "FX-LOCAL-OV-RESUBMISSION",
  "Evidence devuelta para corrección: se prepara una nueva y la anterior se preserva",
  { ...nada, evidence: "RESUBMISSION_REQUESTED", recomendacionPrimariaVigente: true },
  {
    estadoDominante: "FALTA PRESENTAR EVIDENCIA",
    objeto: "Ejercicios 12–18",
    ctaPrimaria: { texto: "PREPARAR NUEVA EVIDENCIA", habilitada: true },
    despues: "se abre el flujo de entrega. La evidencia anterior no se sobrescribe.",
    secundarios: ["Hay una recomendación esperando, y no reemplaza a esto."],
  },
  ["C01-024", "SC-EV-03"],
);

// ── Nivel 4 · rescate materializado, con su propio lifecycle ─────────────────
// El original MISSED sigue visible y sin editar: el rescate es otro objeto.
export const FX_LOCAL_OV_RESCATE_REAL = esc(
  "FX-LOCAL-OV-RESCATE-REAL",
  "Rescate materializado: tiene su lifecycle propio y el original MISSED se preserva",
  { ...nada, rescate: "MATERIALIZED", commitment: "MISSED" },
  {
    estadoDominante: "COMPROMISO INCUMPLIDO",
    objeto: "Rescate · Sáb 30 ago · 19:00",
    ctaPrimaria: { texto: "VER COMPROMISO", habilitada: true },
    despues: "se abre el rescate. El compromiso incumplido sigue visible y sin editar.",
    secundarios: ["El compromiso original del miércoles conserva su estado."],
  },
);

export const escenariosUX08 = {
  "FX-LOCAL-OV-ACTIVA": FX_LOCAL_OV_ACTIVA,
  "FX-LOCAL-OV-RECOMENDACION": FX_LOCAL_OV_RECOMENDACION,
  "FX-LOCAL-OV-IN-PROGRESS": FX_LOCAL_OV_IN_PROGRESS,
  "FX-LOCAL-OV-COMMITMENT-CONFIRMED": FX_LOCAL_OV_COMMITMENT_CONFIRMED,
  "FX-LOCAL-OV-COMMITMENT-DUE": FX_LOCAL_OV_COMMITMENT_DUE,
  "FX-LOCAL-OV-COMMITMENT-STARTED": FX_LOCAL_OV_COMMITMENT_STARTED,
  "FX-LOCAL-OV-MISSED": FX_LOCAL_OV_MISSED,
  "FX-LOCAL-OV-RESCATE-REAL": FX_LOCAL_OV_RESCATE_REAL,
  "FX-LOCAL-OV-RESUBMISSION": FX_LOCAL_OV_RESUBMISSION,
  "FX-LOCAL-OV-EVIDENCE-PENDING": FX_LOCAL_OV_EVIDENCE_PENDING,
  "FX-LOCAL-OV-UNDER-REVIEW-SIN-GATE": FX_LOCAL_OV_UNDER_REVIEW_SIN_GATE,
  "FX-LOCAL-OV-UNDER-REVIEW-CON-GATE": FX_LOCAL_OV_UNDER_REVIEW_CON_GATE,
  "FX-LOCAL-OV-PROGRESS-UPDATED": FX_LOCAL_OV_PROGRESS_UPDATED,
  "FX-LOCAL-OV-PROGRESS-ENTRY": FX_LOCAL_OV_PROGRESS_ENTRY,
  "FX-LOCAL-OV-PROGRESO-AMBIGUO": FX_LOCAL_OV_PROGRESO_AMBIGUO,
  "FX-LOCAL-OV-SIN-RECOMENDACION": FX_LOCAL_OV_SIN_RECOMENDACION,
  "FX-LOCAL-OV-SIN-RECORRIDO": FX_LOCAL_OV_SIN_RECORRIDO,
  "FX-LOCAL-OV-FECHA-CONFIRMADA": FX_LOCAL_OV_FECHA_CONFIRMADA,
  "FX-LOCAL-OV-FECHA-REPORTADA": FX_LOCAL_OV_FECHA_REPORTADA,
  "FX-LOCAL-OV-FECHA-ESTIMADA": FX_LOCAL_OV_FECHA_ESTIMADA,
  "FX-LOCAL-OV-FECHA-DESCONOCIDA": FX_LOCAL_OV_FECHA_DESCONOCIDA,
  "FX-LOCAL-OV-FECHA-MODIFICADA": FX_LOCAL_OV_FECHA_MODIFICADA,
  "FX-LOCAL-OV-FECHA-PROXIMA": FX_LOCAL_OV_FECHA_PROXIMA,
  "FX-LOCAL-OV-FECHA-HOY": FX_LOCAL_OV_FECHA_HOY,
  "FX-LOCAL-OV-FECHA-PASADA": FX_LOCAL_OV_FECHA_PASADA,
  "FX-LOCAL-OV-PRACTICO": FX_LOCAL_OV_PRACTICO,
  "FX-LOCAL-OV-TEORICO": FX_LOCAL_OV_TEORICO,
  "FX-LOCAL-OV-ORAL": FX_LOCAL_OV_ORAL,
  "FX-LOCAL-OV-CONFIANZA-VS-DOMINIO": FX_LOCAL_OV_CONFIANZA_VS_DOMINIO,
  "FX-LOCAL-OV-CONTRADICTORIOS": FX_LOCAL_OV_CONTRADICTORIOS,
  "FX-LOCAL-OV-NO-DISPONIBLE": FX_LOCAL_OV_NO_DISPONIBLE,
  "FX-LOCAL-OV-VARIAS-PREPARACIONES": FX_LOCAL_OV_VARIAS_PREPARACIONES,
  "FX-LOCAL-OV-READY-BY-PROTOCOL": FX_LOCAL_OV_READY_BY_PROTOCOL,
  "FX-LOCAL-OV-HANDOFF-DISPONIBLE": FX_LOCAL_OV_HANDOFF_DISPONIBLE,
  "FX-LOCAL-OV-HANDOFF-NO-DISPONIBLE": FX_LOCAL_OV_HANDOFF_NO_DISPONIBLE,
} as const satisfies Record<string, Escenario>;
