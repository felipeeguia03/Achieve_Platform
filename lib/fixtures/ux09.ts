/**
 * Los 31 estados críticos de `UX09`, de `product-spec-source.md` §VI.9 §22.
 *
 * El nivel de precedencia lo calcula `selectStepLevel`; el fixture declara la
 * condición. Los copies de ausencia y de error son los literales de §27.
 *
 * Prefijo `FX-LOCAL-PASO-`: el registro canónico del spec §7 no nombra estos
 * escenarios.
 */

import { contexto } from "@/lib/navigation/context";
import { selectStepLevel, type StepInput } from "@/lib/domain/step-precedence";
import type { Escenario } from "./types";
import type {
  BloqueDePaso,
  PasoProtocoloProps,
  RecursoConfigurado,
} from "@/lib/domain/view-models";

const ASSESSMENT = "Parcial 1";
const MATERIA = "Análisis II";
const VOLVER = "VOLVER AL OVERVIEW";

// Copies de ausencia, literales de §27.
const bloque = (titulo: string, valor: string | null, ausencia: string): BloqueDePaso => ({
  titulo,
  valor,
  ausencia,
});

const OBJETIVO = (v: string | null = "Consolidar el método de sustitución en integrales definidas.") =>
  bloque("OBJETIVO DEL PASO", v, "Objetivo de este paso no disponible");
const EXPLICACION = (v: string | null = "Resolvé la guía en orden y anotá los pasos intermedios.") =>
  bloque("CÓMO TRABAJARLO", v, "Explicación no disponible");
const ENTREGABLE = (v: string | null = "Siete ejercicios resueltos con su desarrollo.") =>
  bloque("ENTREGABLE ESPERADO", v, "Entregable de este paso no disponible");
const CRITERIO = (v: string | null = "Cada ejercicio muestra la sustitución elegida y su justificación.") =>
  bloque("CRITERIO ESPERADO", v, "Criterio de este paso no disponible");

const RECURSO: RecursoConfigurado = {
  nombre: "Guía 3 · Integrales por sustitución",
  tipo: "Documento",
  provenance: "Cátedra · oficial",
  derechos: "Uso permitido dentro de la materia",
};

const nada: StepInput = {
  action: "NONE",
  commitment: "NONE",
  rescate: "NONE",
  evidence: "NONE",
  recomendacionPrimariaVigente: false,
  recursoDisponible: false,
  cierreNoConfirmado: true,
  gateAutoritativo: false,
  progreso: "NONE",
  nuevoCurrentDisponible: false,
};

type Vista = Omit<PasoProtocoloProps, "nivel" | "variante">;

function paso(input: StepInput, vista: Partial<Vista>): PasoProtocoloProps {
  const { nivel, variante } = selectStepLevel(input);
  return {
    nivel,
    variante,
    assessment: ASSESSMENT,
    materia: MATERIA,
    modalidad: "Práctico",
    labelDelPaso: "Práctica dirigida",
    version: "Protocolo v3",
    objetivo: OBJETIVO(),
    explicacion: EXPLICACION(),
    entregable: ENTREGABLE(),
    criterio: CRITERIO(),
    recurso: input.recursoDisponible ? RECURSO : null,
    avisoRecurso: "Este paso no tiene un recurso configurado",
    estadoDominante: "PASO DISPONIBLE",
    avisoDeApertura: "Abriste este paso. Abrirlo no lo completa.",
    aviso: null,
    ctaPrimaria: { texto: VOLVER, habilitada: true },
    despues: null,
    secundarios: [],
    fuenteDelContenido: "protocolo de la cátedra",
    ctaRetorno: VOLVER,
    ...vista,
  };
}

function esc(
  id: string,
  proposito: string,
  input: StepInput,
  vista: Partial<Vista>,
  cubre: readonly string[] = ["C01-026", "SC-EX-03"],
): Escenario {
  return {
    id,
    origen: "local",
    proposito,
    cubre,
    contextos: {
      UX09: contexto({
        navegacionDisponible: true,
        progresoDisponible: true,
        recomendacionPrimariaVigente: input.recomendacionPrimariaVigente,
        reflectionConfigurada: false,
      }),
    },
    ux09: paso(input, vista),
  };
}

// ── 1–2. Paso disponible con contenido completo ──────────────────────────────
export const FX_LOCAL_PASO_COMPLETO = esc(
  "FX-LOCAL-PASO-COMPLETO",
  "Paso autoritativo con los cinco bloques configurados: abrir el recurso no completa",
  { ...nada, recursoDisponible: true },
  {
    ctaPrimaria: { texto: "ABRIR RECURSO", habilitada: true },
    despues: "Abrís el recurso. Esto no inicia ni completa el paso.",
  },
);

// ── 3. Sin Resource · copy honesto, sin bloqueo ──────────────────────────────
export const FX_LOCAL_PASO_SIN_RECURSO = esc(
  "FX-LOCAL-PASO-SIN-RECURSO",
  "Sin recurso configurado: se dice, y no bloquea el paso",
  { ...nada },
  { aviso: null },
);

// ── 4. Sin entregable · no se infiere un ProtocolArtifact ────────────────────
export const FX_LOCAL_PASO_SIN_ENTREGABLE = esc(
  "FX-LOCAL-PASO-SIN-ENTREGABLE",
  "Sin entregable: no se infiere el artefacto ni se crea Evidence",
  { ...nada },
  { entregable: ENTREGABLE(null) },
);

// ── 5. Sin criterion · no se evalúa ni se completa ───────────────────────────
export const FX_LOCAL_PASO_SIN_CRITERIO = esc(
  "FX-LOCAL-PASO-SIN-CRITERIO",
  "Sin criterio: no se evalúa localmente ni se ofrece completar",
  { ...nada },
  { criterio: CRITERIO(null) },
);

// ── 6. ProtocolStep no disponible ────────────────────────────────────────────
export const FX_LOCAL_PASO_NO_DISPONIBLE = esc(
  "FX-LOCAL-PASO-NO-DISPONIBLE",
  "Sin current step autoritativo: no se elige uno por sequence",
  { ...nada },
  {
    labelDelPaso: null,
    objetivo: OBJETIVO(null),
    explicacion: EXPLICACION(null),
    entregable: ENTREGABLE(null),
    criterio: CRITERIO(null),
    estadoDominante: "SIN ACCIÓN DISPONIBLE",
    avisoDeApertura: null,
    aviso: "No hay un paso actual disponible",
  },
);

// ── 7. ExamProtocol/version no disponible ────────────────────────────────────
// Se oculta el contenido no verificable; no se usa un template global.
export const FX_LOCAL_PASO_SIN_VERSION = esc(
  "FX-LOCAL-PASO-SIN-VERSION",
  "Sin versión de protocolo: se oculta el contenido no verificable",
  { ...nada },
  {
    version: null,
    objetivo: OBJETIVO(null),
    explicacion: EXPLICACION(null),
    entregable: ENTREGABLE(null),
    criterio: CRITERIO(null),
    estadoDominante: "CONTENIDO INCOMPLETO",
    avisoDeApertura: null,
    aviso: "No podemos confirmar la versión de este paso",
    fuenteDelContenido: "desconocida",
  },
);

// ── 8. Versión inconsistente · se separan, no se mezclan ─────────────────────
export const FX_LOCAL_PASO_VERSION_INCONSISTENTE = esc(
  "FX-LOCAL-PASO-VERSION-INCONSISTENTE",
  "Versión inconsistente entre paso y preparación: no se hace merge",
  { ...nada },
  {
    version: "Protocolo v2",
    estadoDominante: "HAY DATOS CONTRADICTORIOS",
    avisoDeApertura: null,
    aviso: "Este paso corresponde a otra versión del protocolo",
    ctaPrimaria: { texto: "REINTENTAR", habilitada: true },
  },
);

// ── 9. Paso visible, ruta no disponible ──────────────────────────────────────
export const FX_LOCAL_PASO_RUTA_NO_DISPONIBLE = esc(
  "FX-LOCAL-PASO-RUTA-NO-DISPONIBLE",
  "Contenido en lectura pero destino fallido: sin CTA muerta",
  { ...nada },
  {
    estadoDominante: "PASO DISPONIBLE",
    aviso: "No pudimos abrir el recurso configurado",
    // No se ofrece una CTA cuyo destino no existe.
    ctaPrimaria: { texto: VOLVER, habilitada: true },
  },
);

// ── 10–11. Apertura de sesión y visita previa ────────────────────────────────
export const FX_LOCAL_PASO_PRIMERA_APERTURA = esc(
  "FX-LOCAL-PASO-PRIMERA-APERTURA",
  "Primera apertura: sólo apertura de sesión, sin persistir estado",
  { ...nada, recursoDisponible: true },
  {
    ctaPrimaria: { texto: "ABRIR RECURSO", habilitada: true },
    despues: "Abrís el recurso. Esto no inicia ni completa el paso.",
  },
);

export const FX_LOCAL_PASO_SIN_CAMBIO_CONFIRMADO = esc(
  "FX-LOCAL-PASO-SIN-CAMBIO-CONFIRMADO",
  "Abierto antes, sin progreso: no hay contrato de visita, y no se afirma haber visitado",
  { ...nada, recursoDisponible: true },
  {
    ctaPrimaria: { texto: "ABRIR RECURSO", habilitada: true },
    secundarios: ["Todavía no hay un cambio de progreso confirmado."],
  },
);

// ── 12–16. Los lifecycles que vencen al recurso ──────────────────────────────
export const FX_LOCAL_PASO_RECOMENDACION = esc(
  "FX-LOCAL-PASO-RECOMENDACION",
  "Recomendación principal: vence al recurso accionable",
  { ...nada, recomendacionPrimariaVigente: true, recursoDisponible: true },
  {
    estadoDominante: "PRÓXIMA ACCIÓN DISPONIBLE",
    ctaPrimaria: { texto: "COMPROMETERME", habilitada: true },
    despues: "Abrís la recomendación. El Commitment se confirma en un flujo separado.",
    secundarios: ["El recurso del paso sigue disponible."],
  },
);

export const FX_LOCAL_PASO_IN_PROGRESS = esc(
  "FX-LOCAL-PASO-IN-PROGRESS",
  "Action IN_PROGRESS: vence a MISSED previo, Evidence informativa, progreso y recomendación",
  {
    ...nada,
    action: "IN_PROGRESS",
    commitment: "MISSED",
    evidence: "INFORMATIVA",
    recomendacionPrimariaVigente: true,
    recursoDisponible: true,
    progreso: "PROGRESS_UPDATED",
  },
  {
    estadoDominante: "ACCIÓN EN CURSO",
    ctaPrimaria: { texto: "CONTINUAR", habilitada: true },
    despues: "Abrís la Action vigente. Terminarla usa su cierre configurado.",
    secundarios: [
      "Hay un compromiso incumplido sin resolver.",
      "El recurso del paso sigue disponible.",
    ],
  },
);

export const FX_LOCAL_PASO_COMMITMENT_CONFIRMED = esc(
  "FX-LOCAL-PASO-COMMITMENT-CONFIRMED",
  "Commitment CONFIRMED futuro: se abre sin iniciar",
  { ...nada, commitment: "CONFIRMED_FUTURO", recursoDisponible: true },
  {
    estadoDominante: "COMPROMISO VIGENTE",
    ctaPrimaria: { texto: "VER COMPROMISO", habilitada: true },
    despues: "Abrís el compromiso. Verlo no lo inicia.",
  },
);

export const FX_LOCAL_PASO_COMMITMENT_DUE = esc(
  "FX-LOCAL-PASO-COMMITMENT-DUE",
  "Commitment DUE: sólo el owner confirma STARTED",
  { ...nada, commitment: "DUE", recursoDisponible: true },
  {
    estadoDominante: "ES MOMENTO DE EMPEZAR",
    ctaPrimaria: { texto: "EMPEZAR", habilitada: true },
    despues: "El owner coordina el inicio. Abrir la pantalla no lo inicia.",
  },
);

export const FX_LOCAL_PASO_COMMITMENT_STARTED = esc(
  "FX-LOCAL-PASO-COMMITMENT-STARTED",
  "Commitment STARTED con Action coherente",
  { ...nada, commitment: "STARTED", recursoDisponible: true },
  {
    estadoDominante: "TRABAJO INICIADO",
    ctaPrimaria: { texto: "CONTINUAR", habilitada: true },
  },
);

export const FX_LOCAL_PASO_MISSED = esc(
  "FX-LOCAL-PASO-MISSED",
  "Compromiso incumplido: RETOMAR no crea rescate ni borra el MISSED",
  { ...nada, commitment: "MISSED", rescate: "REQUIRED", recomendacionPrimariaVigente: true },
  {
    estadoDominante: "COMPROMISO INCUMPLIDO",
    ctaPrimaria: { texto: "RETOMAR", habilitada: true },
    secundarios: ["El compromiso original conserva su estado."],
  },
);

export const FX_LOCAL_PASO_EVIDENCE_PENDING = esc(
  "FX-LOCAL-PASO-EVIDENCE-PENDING",
  "Evidence requerida: vence a recomendación y a recurso",
  { ...nada, action: "EVIDENCE_PENDING", recursoDisponible: true, recomendacionPrimariaVigente: true },
  {
    estadoDominante: "EVIDENCIA PENDIENTE",
    ctaPrimaria: { texto: "SUBIR EVIDENCIA", habilitada: true },
    despues: "Abrís Evidence. Enviarla la deja SUBMITTED cuando el owner confirma recepción.",
  },
);

// ── 17–21. Los cinco estados de Evidence, ninguno es progreso ────────────────
function conEvidencia(id: string, proposito: string, mensaje: string, gate = false): Escenario {
  return esc(
    id,
    proposito,
    { ...nada, evidence: gate ? "UNDER_REVIEW" : "INFORMATIVA", recursoDisponible: true, gateAutoritativo: gate },
    gate
      ? {
          estadoDominante: "EVIDENCIA EN REVISIÓN",
          ctaPrimaria: { texto: "VER EVIDENCIA", habilitada: true },
          despues: "Abrís Evidence. Abrirla no la valida.",
          secundarios: [mensaje],
        }
      : {
          // Sin gate, el recurso accionable conserva prioridad.
          ctaPrimaria: { texto: "ABRIR RECURSO", habilitada: true },
          despues: "Abrís el recurso. Esto no inicia ni completa el paso.",
          secundarios: [mensaje],
        },
  );
}

export const FX_LOCAL_PASO_EVIDENCE_SUBMITTED = conEvidencia(
  "FX-LOCAL-PASO-EVIDENCE-SUBMITTED",
  "Evidence SUBMITTED: recibida, no suficiente",
  "Evidencia recibida. Esto no confirma suficiencia ni dominio.",
);

export const FX_LOCAL_PASO_EVIDENCE_UNDER_REVIEW = conEvidencia(
  "FX-LOCAL-PASO-EVIDENCE-UNDER-REVIEW",
  "Evidence UNDER_REVIEW sin gate: el recurso conserva prioridad",
  "Evidencia en revisión. Esto no confirma progreso.",
);

export const FX_LOCAL_PASO_GATE_REAL = conEvidencia(
  "FX-LOCAL-PASO-GATE-REAL",
  "Gate autoritativo durante la revisión: VER EVIDENCIA pasa a primaria",
  "El protocolo no permite avanzar hasta que se resuelva la revisión.",
  true,
);

export const FX_LOCAL_PASO_EVIDENCE_INSUFFICIENT = conEvidencia(
  "FX-LOCAL-PASO-EVIDENCE-INSUFFICIENT",
  "Evidence INSUFFICIENT: no es un fracaso, y no habilita reenvío por sí sola",
  "La evidencia no alcanzó el criterio mínimo. Sólo se reenvía si el owner lo solicita.",
);

export const FX_LOCAL_PASO_EVIDENCE_SUFFICIENT = conEvidencia(
  "FX-LOCAL-PASO-EVIDENCE-SUFFICIENT",
  "Evidence SUFFICIENT sin ProgressUpdated: mínimo cumplido, cambio pendiente",
  "La evidencia cumple el criterio mínimo. El progreso todavía no fue actualizado.",
);

export const FX_LOCAL_PASO_EVIDENCE_VALIDATED = conEvidencia(
  "FX-LOCAL-PASO-EVIDENCE-VALIDATED",
  "Evidence VALIDATED sin ProgressUpdated: validada, cambio pendiente",
  "Evidencia validada. El progreso todavía no fue actualizado.",
);

export const FX_LOCAL_PASO_RESUBMISSION = esc(
  "FX-LOCAL-PASO-RESUBMISSION",
  "RESUBMISSION_REQUESTED: vence a recomendación y a recurso; conserva la anterior",
  { ...nada, evidence: "RESUBMISSION_REQUESTED", recursoDisponible: true, recomendacionPrimariaVigente: true },
  {
    estadoDominante: "NUEVA PRESENTACIÓN SOLICITADA",
    ctaPrimaria: { texto: "PREPARAR NUEVA EVIDENCIA", habilitada: true },
    secundarios: ["La evidencia anterior se conserva."],
  },
);

// ── 22. ProgressUpdated · 9a y 9b ────────────────────────────────────────────
export const FX_LOCAL_PASO_PROGRESS_UPDATED = esc(
  "FX-LOCAL-PASO-PROGRESS-UPDATED",
  "ProgressUpdated confirmado: sólo changed_dimensions",
  { ...nada, progreso: "PROGRESS_UPDATED" },
  {
    estadoDominante: "CAMBIO CONFIRMADO",
    ctaPrimaria: { texto: "VER AVANCE", habilitada: true },
    despues: "Abrís el resultado confirmado. Sólo verás las dimensiones actualizadas.",
    secundarios: ["Cambio confirmado: Práctica +7 ejercicios."],
  },
  ["C01-026", "SC-PROG-01"],
);

export const FX_LOCAL_PASO_PROGRESS_ENTRY = esc(
  "FX-LOCAL-PASO-PROGRESS-ENTRY",
  "ProgressEntry histórica: se abre la historia sin causalidad inventada",
  { ...nada, progreso: "PROGRESS_ENTRY" },
  {
    estadoDominante: "ACTIVIDAD REGISTRADA",
    ctaPrimaria: { texto: "VER BITÁCORA", habilitada: true },
    secundarios: ["Actividad registrada; hito todavía no confirmado."],
  },
  ["C01-026", "SC-PROG-01"],
);

// ── 23–24. Completion ────────────────────────────────────────────────────────
export const FX_LOCAL_PASO_COMPLETADO_CON_SIGUIENTE = esc(
  "FX-LOCAL-PASO-COMPLETADO-CON-SIGUIENTE",
  "Paso completado con un nuevo current: abrirlo no completa el nuevo",
  { ...nada, cierreNoConfirmado: false, nuevoCurrentDisponible: true },
  {
    estadoDominante: "PASO ANTERIOR COMPLETADO",
    avisoDeApertura: "La fuente del protocolo confirmó el cierre de este paso.",
    ctaPrimaria: { texto: "ABRIR PASO ACTUAL", habilitada: true },
    despues: "Abrís el paso siguiente. Abrirlo no lo completa.",
  },
);

export const FX_LOCAL_PASO_COMPLETADO_SIN_SIGUIENTE = esc(
  "FX-LOCAL-PASO-COMPLETADO-SIN-SIGUIENTE",
  "Paso completado sin siguiente: no se declara el protocolo terminado",
  { ...nada, cierreNoConfirmado: false },
  {
    estadoDominante: "PASO COMPLETADO",
    avisoDeApertura: "La fuente del protocolo confirmó el cierre de este paso.",
    aviso: "Este paso está completado. Todavía no hay otro paso disponible.",
    ctaPrimaria: { texto: VOLVER, habilitada: true },
    despues: "Volvés al Overview. La preparación conserva su estado.",
  },
);

// ── 25–27. Las tres modalidades ──────────────────────────────────────────────
export const FX_LOCAL_PASO_PRACTICO = esc(
  "FX-LOCAL-PASO-PRACTICO",
  "Modalidad práctica: mismo shell P0 con contenido configurado",
  { ...nada, recursoDisponible: true },
  { modalidad: "Práctico", ctaPrimaria: { texto: "ABRIR RECURSO", habilitada: true } },
);

export const FX_LOCAL_PASO_TEORICO = esc(
  "FX-LOCAL-PASO-TEORICO",
  "Modalidad teórica escrita: el mismo shell, sin lógica de ruta distinta",
  { ...nada, recursoDisponible: true },
  {
    modalidad: "Teórico escrito",
    labelDelPaso: "Resumen guiado",
    ctaPrimaria: { texto: "ABRIR RECURSO", habilitada: true },
  },
);

export const FX_LOCAL_PASO_ORAL = esc(
  "FX-LOCAL-PASO-ORAL",
  "Modalidad oral: no se adapta el protocolo P0, se vuelve",
  { ...nada },
  {
    modalidad: "Oral",
    labelDelPaso: null,
    objetivo: OBJETIVO(null),
    explicacion: EXPLICACION(null),
    entregable: ENTREGABLE(null),
    criterio: CRITERIO(null),
    estadoDominante: "RECORRIDO FUERA DE P0",
    avisoDeApertura: null,
    aviso: "El protocolo para esta modalidad todavía no está disponible.",
  },
);

// ── 28–30. Contradicción, error y provenance desconocida ─────────────────────
export const FX_LOCAL_PASO_CONTRADICTORIOS = esc(
  "FX-LOCAL-PASO-CONTRADICTORIOS",
  "Dos recomendaciones sin principal: la UI no prioriza",
  { ...nada },
  {
    estadoDominante: "HAY DATOS CONTRADICTORIOS",
    avisoDeApertura: null,
    aviso: "No podemos identificar una única próxima acción",
    ctaPrimaria: { texto: "REINTENTAR", habilitada: true },
  },
);

export const FX_LOCAL_PASO_NO_CARGA = esc(
  "FX-LOCAL-PASO-NO-CARGA",
  "Falla temporal: error técnico con reintento, no un empty semántico",
  { ...nada },
  {
    labelDelPaso: null,
    objetivo: OBJETIVO(null),
    explicacion: EXPLICACION(null),
    entregable: ENTREGABLE(null),
    criterio: CRITERIO(null),
    estadoDominante: "NO PUDIMOS CARGAR EL ESTADO ACTUAL",
    avisoDeApertura: null,
    aviso: "No pudimos cargar el estado actual",
    ctaPrimaria: { texto: "REINTENTAR", habilitada: true },
    fuenteDelContenido: "desconocida",
  },
  ["C01-026", "SC-ERR-02"],
);

export const FX_LOCAL_PASO_PROVENANCE_DESCONOCIDA = esc(
  "FX-LOCAL-PASO-PROVENANCE-DESCONOCIDA",
  "Provenance desconocida: el dato se muestra sin oficializarlo",
  { ...nada, recursoDisponible: true },
  {
    recurso: { ...RECURSO, provenance: null, derechos: null },
    ctaPrimaria: { texto: "ABRIR RECURSO", habilitada: true },
    fuenteDelContenido: "desconocida",
  },
);

// ── 31. Retorno seguro ───────────────────────────────────────────────────────
export const FX_LOCAL_PASO_RETORNO_SEGURO = esc(
  "FX-LOCAL-PASO-RETORNO-SEGURO",
  "Sin objeto ni destino accionable: retorno al Overview conservando la preparación",
  { ...nada },
  {
    estadoDominante: "SIN ACCIÓN DISPONIBLE",
    aviso: "No hay una acción disponible desde este paso.",
    despues: "Volvés al Overview. La preparación conserva su estado.",
  },
  ["C01-026", "SC-EX-05"],
);

export const escenariosUX09 = {
  "FX-LOCAL-PASO-COMPLETO": FX_LOCAL_PASO_COMPLETO,
  "FX-LOCAL-PASO-SIN-RECURSO": FX_LOCAL_PASO_SIN_RECURSO,
  "FX-LOCAL-PASO-SIN-ENTREGABLE": FX_LOCAL_PASO_SIN_ENTREGABLE,
  "FX-LOCAL-PASO-SIN-CRITERIO": FX_LOCAL_PASO_SIN_CRITERIO,
  "FX-LOCAL-PASO-NO-DISPONIBLE": FX_LOCAL_PASO_NO_DISPONIBLE,
  "FX-LOCAL-PASO-SIN-VERSION": FX_LOCAL_PASO_SIN_VERSION,
  "FX-LOCAL-PASO-VERSION-INCONSISTENTE": FX_LOCAL_PASO_VERSION_INCONSISTENTE,
  "FX-LOCAL-PASO-RUTA-NO-DISPONIBLE": FX_LOCAL_PASO_RUTA_NO_DISPONIBLE,
  "FX-LOCAL-PASO-PRIMERA-APERTURA": FX_LOCAL_PASO_PRIMERA_APERTURA,
  "FX-LOCAL-PASO-SIN-CAMBIO-CONFIRMADO": FX_LOCAL_PASO_SIN_CAMBIO_CONFIRMADO,
  "FX-LOCAL-PASO-RECOMENDACION": FX_LOCAL_PASO_RECOMENDACION,
  "FX-LOCAL-PASO-IN-PROGRESS": FX_LOCAL_PASO_IN_PROGRESS,
  "FX-LOCAL-PASO-COMMITMENT-CONFIRMED": FX_LOCAL_PASO_COMMITMENT_CONFIRMED,
  "FX-LOCAL-PASO-COMMITMENT-DUE": FX_LOCAL_PASO_COMMITMENT_DUE,
  "FX-LOCAL-PASO-COMMITMENT-STARTED": FX_LOCAL_PASO_COMMITMENT_STARTED,
  "FX-LOCAL-PASO-MISSED": FX_LOCAL_PASO_MISSED,
  "FX-LOCAL-PASO-EVIDENCE-PENDING": FX_LOCAL_PASO_EVIDENCE_PENDING,
  "FX-LOCAL-PASO-EVIDENCE-SUBMITTED": FX_LOCAL_PASO_EVIDENCE_SUBMITTED,
  "FX-LOCAL-PASO-EVIDENCE-UNDER-REVIEW": FX_LOCAL_PASO_EVIDENCE_UNDER_REVIEW,
  "FX-LOCAL-PASO-GATE-REAL": FX_LOCAL_PASO_GATE_REAL,
  "FX-LOCAL-PASO-EVIDENCE-INSUFFICIENT": FX_LOCAL_PASO_EVIDENCE_INSUFFICIENT,
  "FX-LOCAL-PASO-EVIDENCE-SUFFICIENT": FX_LOCAL_PASO_EVIDENCE_SUFFICIENT,
  "FX-LOCAL-PASO-EVIDENCE-VALIDATED": FX_LOCAL_PASO_EVIDENCE_VALIDATED,
  "FX-LOCAL-PASO-RESUBMISSION": FX_LOCAL_PASO_RESUBMISSION,
  "FX-LOCAL-PASO-PROGRESS-UPDATED": FX_LOCAL_PASO_PROGRESS_UPDATED,
  "FX-LOCAL-PASO-PROGRESS-ENTRY": FX_LOCAL_PASO_PROGRESS_ENTRY,
  "FX-LOCAL-PASO-COMPLETADO-CON-SIGUIENTE": FX_LOCAL_PASO_COMPLETADO_CON_SIGUIENTE,
  "FX-LOCAL-PASO-COMPLETADO-SIN-SIGUIENTE": FX_LOCAL_PASO_COMPLETADO_SIN_SIGUIENTE,
  "FX-LOCAL-PASO-PRACTICO": FX_LOCAL_PASO_PRACTICO,
  "FX-LOCAL-PASO-TEORICO": FX_LOCAL_PASO_TEORICO,
  "FX-LOCAL-PASO-ORAL": FX_LOCAL_PASO_ORAL,
  "FX-LOCAL-PASO-CONTRADICTORIOS": FX_LOCAL_PASO_CONTRADICTORIOS,
  "FX-LOCAL-PASO-NO-CARGA": FX_LOCAL_PASO_NO_CARGA,
  "FX-LOCAL-PASO-PROVENANCE-DESCONOCIDA": FX_LOCAL_PASO_PROVENANCE_DESCONOCIDA,
  "FX-LOCAL-PASO-RETORNO-SEGURO": FX_LOCAL_PASO_RETORNO_SEGURO,
} as const satisfies Record<string, Escenario>;
