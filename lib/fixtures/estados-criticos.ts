/**
 * Los estados críticos de `UX02`–`UX06` que faltaban.
 *
 * Las seis pantallas venían del prototipo como **maquetas de una sola vista
 * cada una**. Acá se completan las coberturas que el roadmap lista para la
 * Etapa 0.7, con el copy de las specs `VI.2`–`VI.6`.
 */

import type { Escenario } from "./types";
import type {
  CompromisoProps,
  EvidenciaProps,
  FilaDato,
  MateriaProps,
  ProgresoProps,
  ProximaAccionProps,
} from "@/lib/domain/view-models";

const OFICIAL = "Cátedra · oficial";

function esc(id: string, proposito: string, vista: Partial<Escenario>, cubre: readonly string[]): Escenario {
  return { id, origen: "local", proposito, cubre, contextos: {}, ...vista };
}

// ═════════════════════════════════════════════════════════════════════════════
// UX02 · Materia / Cursado
// ═════════════════════════════════════════════════════════════════════════════

const materiaBase: MateriaProps = {
  estado: "NORMAL",
  materia: "Análisis Matemático II",
  examen: "Parcial 1",
  chip: { tono: "urgencia", texto: "Necesita atención" },
  ultimoAvance: "avance hace 2 días",
  hero: {
    nivel: "ACTION_RECOMMENDED",
    variante: null,
    contexto: "Unidad 3",
    titulo: "Resolver ejercicios 8–14",
    razon: "prepara la próxima clase.",
    tiempoOEstado: "60–75 min",
    evidenciaEsperada: "7 ejercicios",
    queSigue: null,
    chip: null,
  },
  catedraYVos: null,
  unidades: [],
  dimensiones: [],
  // La base no declara actividad: los escenarios que la necesitan la agregan.
  actividadReciente: null,
  aviso: null,
  capturaDeClase: "Pasó algo en clase",
};

/** Confianza alta y dominio bajo: dos hechos separados, sin Action local. */
export const FX_LOCAL_MAT_CONFIANZA_VS_DOMINIO = esc(
  "FX-LOCAL-MAT-CONFIANZA-VS-DOMINIO",
  "Confianza alta con dominio no evaluado: dimensiones separadas, sin generar una Action",
  {
    materia: {
      ...materiaBase,
      estado: "CONFIANZA_VS_DOMINIO",
      dimensiones: [
        { label: "Confianza", valor: "alta · declarada ayer" },
        { label: "Dominio", valor: "no evaluado", ausencia: "SIN_ASIGNAR" },
        { label: "Práctica", valor: "12 ejercicios" },
        { label: "Recorrido", valor: "U1–U3" },
        { label: "Recencia", valor: "hace 2 días" },
      ],
    },
  },
  ["C01-019", "SC-PROG-01"],
);

/** Cátedra y estudiante en columnas separadas, con su provenance. */
export const FX_LOCAL_MAT_PROVENANCE = esc(
  "FX-LOCAL-MAT-PROVENANCE",
  "Cátedra y alumno como dos fuentes separadas: ninguna capa eleva la verificación",
  {
    materia: {
      ...materiaBase,
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
        { label: "U3", valor: "necesita atención", tono: "urgencia" },
      ],
    },
  },
  ["C01-002", "SC-GOV-01"],
);

/** Contexto académico incompleto: no se inventa una recomendación. */
export const FX_LOCAL_MAT_CONTEXTO_INCOMPLETO = esc(
  "FX-LOCAL-MAT-CONTEXTO-INCOMPLETO",
  "Contexto de cursado incompleto: se dice qué falta y no se genera una recomendación",
  {
    materia: {
      ...materiaBase,
      estado: "CONTEXTO_INCOMPLETO",
      examen: null,
      chip: { tono: "urgencia", texto: "Falta contexto" },
      ultimoAvance: null,
      hero: {
        nivel: "CONTEXT_INCOMPLETE",
        variante: null,
        contexto: null,
        titulo: "Falta confirmar tu cursado de esta materia.",
        razon: "sin el contexto de cursado no podemos proponerte una acción.",
        tiempoOEstado: null,
        evidenciaEsperada: null,
        queSigue: null,
        chip: null,
      },
      aviso: "No pudimos confirmar tu comisión en esta materia.",
      // `VI.2` §8.7: preview de 2–3 entradas, la misma verdad que la Bitácora.
    actividadReciente: [
      { titulo: "Presentaste evidencia", detalle: "20:29", provenance: "Reportado por vos · sin verificar" },
      { titulo: "Empezaste", detalle: "19:41", provenance: "Reportado por vos · sin verificar" },
      { titulo: "Te comprometiste", detalle: "17:37", provenance: "Reportado por vos · sin verificar" },
    ],
    capturaDeClase: null,
    },
  },
  ["C01-003", "SC-DAY-05"],
);

/** Sin recomendación del ADE: empty honesto, sin generar una. */
export const FX_LOCAL_MAT_SIN_RECOMENDACION = esc(
  "FX-LOCAL-MAT-SIN-RECOMENDACION",
  "El ADE confirma ausencia: empty honesto, sin recomendación inventada",
  {
    materia: {
      ...materiaBase,
      estado: "SIN_RECOMENDACION",
      chip: { tono: "exito", texto: "Bajo control" },
      hero: {
        nivel: "NO_ACTION_AVAILABLE",
        variante: null,
        contexto: null,
        titulo: "No hay una próxima acción para esta materia.",
        razon: null,
        tiempoOEstado: null,
        evidenciaEsperada: null,
        queSigue: null,
        chip: null,
      },
    },
  },
  ["C01-006", "SC-ADE-02"],
);

// ═════════════════════════════════════════════════════════════════════════════
// UX03 · Próxima Acción
// ═════════════════════════════════════════════════════════════════════════════

const accionBase: ProximaAccionProps = {
  estado: "NORMAL",
  contexto: "Cursado · Análisis II",
  unidad: "Unidad 3",
  titulo: "Resolver ejercicios 8–14",
  razon: "prepara la próxima clase.",
  duracion: "60–75 min",
  recurso: "Guía 3",
  evidenciaEsperada: "7 ejercicios resueltos",
  criterioCierre: "están completos y adjuntás la producción acordada.",
  queSigue: "definís cuándo vas a hacerla.",
  provenanceRecurso: OFICIAL,
  aviso: null,
  ctaPrimaria: { texto: "Me comprometo", habilitada: true },
};

/** Acción de incertidumbre: el objetivo es reducir la duda, no producir. */
export const FX_LOCAL_ACC_INCERTIDUMBRE = esc(
  "FX-LOCAL-ACC-INCERTIDUMBRE",
  "Acción de incertidumbre: sin entregable, porque el objetivo es reducir la duda",
  {
    accion: {
      ...accionBase,
      estado: "INCERTIDUMBRE",
      titulo: "Identificar qué parte del método no te cierra",
      razon: "todavía no sabemos dónde está la dificultad.",
      // Sin contrato de entregable, la línea desaparece: no se inventa.
      evidenciaEsperada: null,
      criterioCierre: null,
    },
  },
  ["C01-008", "SC-DAY-03"],
);

/** La razón del ADE no está confirmada: se dice, no se presenta como hecho. */
export const FX_LOCAL_ACC_RAZON_NO_CONFIRMADA = esc(
  "FX-LOCAL-ACC-RAZON-NO-CONFIRMADA",
  "Razón no confirmada: no se presenta como un hecho de la cátedra",
  {
    accion: {
      ...accionBase,
      estado: "RAZON_NO_CONFIRMADA",
      razon: "el ritmo de la cátedra sugiere esta unidad.",
      provenanceRecurso: "Estimado por Achieve · sin verificar",
      aviso: "Esta razón todavía no está confirmada por la cátedra.",
    },
  },
  ["C01-006", "SC-ADE-01"],
);

/** Sin recurso configurado: la línea desaparece y no bloquea. */
export const FX_LOCAL_ACC_SIN_RECURSO = esc(
  "FX-LOCAL-ACC-SIN-RECURSO",
  "Recurso faltante: se omite la línea entera y la acción sigue disponible",
  {
    accion: { ...accionBase, estado: "SIN_RECURSO", recurso: null, provenanceRecurso: null },
  },
  ["C01-008", "SC-DAY-03"],
);

/** Bloqueada: no hay CTA que ofrecer, y no se deja una deshabilitada. */
export const FX_LOCAL_ACC_BLOQUEADA = esc(
  "FX-LOCAL-ACC-BLOQUEADA",
  "Action BLOCKED: sin CTA primaria, con la causa que el owner declara",
  {
    accion: {
      ...accionBase,
      estado: "BLOQUEADA",
      aviso: "Esta acción está bloqueada hasta que la cátedra publique la guía.",
      queSigue: null,
      ctaPrimaria: null,
    },
  },
  ["C01-007", "SC-DAY-02"],
);

/** Reemplazada: el ADE emitió otra. La original no se maquilla. */
export const FX_LOCAL_ACC_REEMPLAZADA = esc(
  "FX-LOCAL-ACC-REEMPLAZADA",
  "Action REPLACED: se dice que fue reemplazada, sin ocultar que existió",
  {
    accion: {
      ...accionBase,
      estado: "REEMPLAZADA",
      aviso: "Esta acción fue reemplazada por una recomendación más reciente.",
      queSigue: null,
      ctaPrimaria: null,
    },
  },
  ["C01-006", "SC-ADE-01"],
);

/** Corrección de un dato: enviar la corrección NO eleva la verificación. */
export const FX_LOCAL_ACC_CORRECCION = esc(
  "FX-LOCAL-ACC-CORRECCION",
  "Corrección de dato: enviarla no vuelve oficial un reporte del estudiante",
  {
    accion: {
      ...accionBase,
      estado: "CORRECCION",
      provenanceRecurso: "Reportado por vos · sin verificar",
      aviso: "Tu corrección queda registrada como reporte tuyo hasta que la cátedra la confirme.",
    },
  },
  ["C01-002", "SC-GOV-01"],
);

// ═════════════════════════════════════════════════════════════════════════════
// UX04 · Compromiso — los ocho estados del lifecycle y sus bordes
// ═════════════════════════════════════════════════════════════════════════════

const compromisoBase: CompromisoProps = {
  estado: "DRAFT",
  contexto: "Unidad 3 · Acción aceptada",
  titulo: "Resolver ejercicios 8–14",
  fecha: "Sáb 30 ago",
  hora: "19:00",
  tiempoDeclarado: "70 min",
  notaEstimacion: "Estimación 60–75 · cubre el mínimo. Zona horaria: Córdoba.",
  evidenciaEsperada: "7 ejercicios",
  criterioCierre: "completos y adjuntos",
  estadoResultante: null,
  aviso: null,
  original: null,
  ctaPrimaria: null,
};

/**
 * El compromiso original de una renegociación. **"Incumplido" no es una
 * ausencia: es un dato presente y adverso**, y hasta la Etapa A2.3 se dibujaba
 * en la itálica atenuada reservada al vacío. Eso ablandaba visualmente el
 * único estado que el dominio prohíbe ablandar —un `Commitment` `MISSED` nunca
 * se edita para parecer cumplido—. Chip de urgencia, que es lo que
 * `design-system-capturas.md` §1.6 da al dato adverso.
 */
const ORIGINAL: FilaDato[] = [
  { label: "Fecha", valor: "Mié 27 ago" },
  { label: "Hora", valor: "19:00" },
  { label: "Estado", valor: "incumplido", tono: "urgencia" },
];

function compromiso(
  id: string,
  proposito: string,
  vista: Partial<CompromisoProps>,
  cubre: readonly string[] = ["C01-010", "SC-DAY-03"],
): Escenario {
  return esc(id, proposito, { compromiso: { ...compromisoBase, ...vista } }, cubre);
}

export const FX_LOCAL_COM_CONFIRMED = compromiso(
  "FX-LOCAL-COM-CONFIRMED",
  "Commitment CONFIRMED: acordado, todavía no iniciado",
  {
    estado: "CONFIRMED",
    estadoResultante: { tono: "humano", texto: "Acordado" },
    ctaPrimaria: { texto: "Renegociar", habilitada: true },
  },
);

export const FX_LOCAL_COM_DUE = compromiso(
  "FX-LOCAL-COM-DUE",
  "Commitment DUE: el owner coordina el inicio, nunca un reloj local",
  {
    estado: "DUE",
    fecha: "Hoy",
    estadoResultante: { tono: "urgencia", texto: "Es la hora acordada" },
    ctaPrimaria: { texto: "Empezar", habilitada: true },
  },
);

export const FX_LOCAL_COM_STARTED = compromiso(
  "FX-LOCAL-COM-STARTED",
  "Commitment STARTED: no admite renegociación retroactiva",
  {
    estado: "STARTED",
    estadoResultante: { tono: "humano", texto: "En curso" },
    // STARTED no admite RENEGOTIATED: no se ofrece edición retroactiva.
    aviso: "Un compromiso ya iniciado no se renegocia.",
    ctaPrimaria: { texto: "Continuar", habilitada: true },
  },
);

export const FX_LOCAL_COM_COMPLETED = compromiso(
  "FX-LOCAL-COM-COMPLETED",
  "Commitment COMPLETED: cerrar no implica que exista Evidence",
  {
    estado: "COMPLETED",
    estadoResultante: { tono: "exito", texto: "Cumplido" },
    // Un Commitment COMPLETED no implica que exista Evidence (§2.1).
    aviso: "Cerrar el compromiso no presenta la evidencia acordada.",
    ctaPrimaria: { texto: "Subir evidencia", habilitada: true },
  },
);

export const FX_LOCAL_COM_MISSED = compromiso(
  "FX-LOCAL-COM-MISSED",
  "Commitment MISSED: su única salida es CLOSED, y no se edita para parecer cumplido",
  {
    estado: "MISSED",
    fecha: "Mié 27 ago",
    estadoResultante: { tono: "urgencia", texto: "Incumplido" },
    aviso: "Este compromiso no se edita. El rescate es un acuerdo nuevo.",
    ctaPrimaria: { texto: "Retomar", habilitada: true },
  },
  ["C01-010", "SC-DAY-04"],
);

export const FX_LOCAL_COM_RENEGOTIATED = compromiso(
  "FX-LOCAL-COM-RENEGOTIATED",
  "Commitment RENEGOTIATED: terminal, el nuevo es otra fila",
  {
    estado: "RENEGOTIATED",
    estadoResultante: { tono: "humano", texto: "Renegociado" },
    aviso: "Este compromiso fue reemplazado por uno nuevo. Los dos se conservan.",
    ctaPrimaria: null,
  },
  ["C01-010", "SC-REN-01"],
);

export const FX_LOCAL_COM_CLOSED = compromiso(
  "FX-LOCAL-COM-CLOSED",
  "Commitment CLOSED: estado terminal, sin operación que ofrecer",
  {
    estado: "CLOSED",
    fecha: "Mié 27 ago",
    estadoResultante: { tono: "urgencia", texto: "Cerrado" },
    ctaPrimaria: null,
  },
);

export const FX_LOCAL_COM_CAPACIDAD_INSUFICIENTE = compromiso(
  "FX-LOCAL-COM-CAPACIDAD-INSUFICIENTE",
  "El tiempo declarado no cubre la estimación: se dice, y no se corrige solo",
  {
    estado: "CAPACIDAD_INSUFICIENTE",
    tiempoDeclarado: "20 min",
    aviso: "Declaraste 20 min y la estimación es de 60–75. Podés confirmarlo igual.",
    // No se bloquea: el estudiante decide. Se le dice el costo.
    ctaPrimaria: { texto: "Confirmar compromiso", habilitada: true },
  },
);

export const FX_LOCAL_COM_FECHA_INVALIDA = compromiso(
  "FX-LOCAL-COM-FECHA-INVALIDA",
  "Fecha inválida: sin datos válidos no hay confirmación que ofrecer",
  {
    estado: "FECHA_INVALIDA",
    fecha: null,
    hora: null,
    aviso: "Elegí una fecha y una hora para poder confirmar.",
    ctaPrimaria: { texto: "Confirmar compromiso", habilitada: false },
  },
);

export const FX_LOCAL_COM_RENEGOCIACION = compromiso(
  "FX-LOCAL-COM-RENEGOCIACION",
  "Renegociación elegible: el original queda visible y no editable",
  {
    estado: "RENEGOCIACION",
    fecha: "Dom 31 ago",
    original: ORIGINAL,
    ctaPrimaria: { texto: "Confirmar renegociación", habilitada: true },
  },
  ["C01-010", "SC-REN-01"],
);

export const FX_LOCAL_COM_RENEGOCIACION_NO_ELEGIBLE = compromiso(
  "FX-LOCAL-COM-RENEGOCIACION-NO-ELEGIBLE",
  "Renegociación no elegible: no se ofrece confirmación y el original queda intacto",
  {
    estado: "RENEGOCIACION_NO_ELEGIBLE",
    original: ORIGINAL,
    aviso: "Este compromiso ya no puede renegociarse.",
    ctaPrimaria: null,
  },
  ["C01-010", "SC-REN-02"],
);

export const FX_LOCAL_COM_RESCATE = compromiso(
  "FX-LOCAL-COM-RESCATE",
  "Rescate: acuerdo nuevo que preserva el incumplido, no lo edita",
  {
    estado: "RESCATE",
    contexto: "Unidad 3 · Rescate",
    titulo: "Retomar los ejercicios 8–14",
    fecha: "Dom 31 ago",
    original: ORIGINAL,
    ctaPrimaria: { texto: "Confirmar rescate", habilitada: true },
  },
  ["C01-010", "SC-DAY-04"],
);

// ═════════════════════════════════════════════════════════════════════════════
// UX05 · Evidencia — los siete estados y los bordes de la entrega
// ═════════════════════════════════════════════════════════════════════════════

const evidenciaBase: EvidenciaProps = {
  estado: "EXPECTED",
  contexto: "Cursado · Análisis II",
  titulo: "Resolver ejercicios 8–14",
  unidad: "Unidad 3",
  evidenciaEsperada: "7 completos y adjuntos",
  criterioCierre: "producción inspeccionable",
  formatosPermitidos: "foto o archivo",
  nombreAdjuntoDemo: "foto_01.jpg",
  estadoVisible: null,
  aviso: null,
  reflection: { titulo: "Agregar reflexión (opcional)", requerida: false },
  ctaPrimaria: { texto: "Enviar evidencia", habilitada: true },
  adjuntoPrevio: null,
};

function evidencia(
  id: string,
  proposito: string,
  vista: Partial<EvidenciaProps>,
  cubre: readonly string[] = ["C01-012", "SC-EV-01"],
): Escenario {
  return esc(id, proposito, { evidencia: { ...evidenciaBase, ...vista } }, cubre);
}

export const FX_LOCAL_EVD_SUBMITTED = evidencia(
  "FX-LOCAL-EVD-SUBMITTED",
  "Evidence SUBMITTED: recibida, sin suficiencia ni revisión",
  {
    estado: "SUBMITTED",
    estadoVisible: "EVIDENCIA ENVIADA",
    aviso: "Enviada. Esto no confirma suficiencia ni que alguien la haya revisado.",
    adjuntoPrevio: "foto_01.jpg enviada",
    ctaPrimaria: null,
  },
);

export const FX_LOCAL_EVD_UNDER_REVIEW = evidencia(
  "FX-LOCAL-EVD-UNDER-REVIEW",
  "Evidence UNDER_REVIEW: exige una revisión real, sin prometer persona ni hora",
  {
    estado: "UNDER_REVIEW",
    estadoVisible: "EVIDENCIA EN REVISIÓN",
    // Sin persona ni SLA inventados: no se promete quién ni cuándo.
    aviso: "En revisión. Todavía no hay un cambio de progreso confirmado.",
    adjuntoPrevio: "foto_01.jpg enviada",
    ctaPrimaria: null,
  },
  ["C01-016", "SC-REV-01"],
);

export const FX_LOCAL_EVD_SUFFICIENT = evidencia(
  "FX-LOCAL-EVD-SUFFICIENT",
  "Evidence SUFFICIENT: criterio mínimo cumplido, sin ProgressUpdated",
  {
    estado: "SUFFICIENT",
    estadoVisible: "CUMPLE EL CRITERIO MÍNIMO",
    aviso: "El progreso todavía no fue actualizado.",
    adjuntoPrevio: "foto_01.jpg enviada",
    ctaPrimaria: null,
  },
  ["C01-013", "SC-EV-02"],
);

export const FX_LOCAL_EVD_INSUFFICIENT = evidencia(
  "FX-LOCAL-EVD-INSUFFICIENT",
  "Evidence INSUFFICIENT: no es un fracaso y no habilita reenvío por sí sola",
  {
    estado: "INSUFFICIENT",
    estadoVisible: "NO ALCANZÓ EL CRITERIO MÍNIMO",
    aviso: "Sólo se reenvía si la cátedra lo solicita.",
    adjuntoPrevio: "foto_01.jpg enviada",
    ctaPrimaria: null,
  },
  ["C01-013", "SC-EV-02"],
);

export const FX_LOCAL_EVD_RESUBMISSION_REQUESTED = evidencia(
  "FX-LOCAL-EVD-RESUBMISSION-REQUESTED",
  "RESUBMISSION_REQUESTED: la anterior se preserva y nace una nueva",
  {
    estado: "RESUBMISSION_REQUESTED",
    estadoVisible: "TE PIDIERON UNA CORRECCIÓN",
    aviso: "Tu entrega anterior se conserva. Esta es una entrega nueva.",
    ctaPrimaria: { texto: "Enviar corrección", habilitada: true },
  },
  ["C01-015", "SC-EV-03"],
);

export const FX_LOCAL_EVD_VALIDATED = evidencia(
  "FX-LOCAL-EVD-VALIDATED",
  "Evidence VALIDATED: cierre del método, no dominio ni cambio dimensional",
  {
    estado: "VALIDATED",
    estadoVisible: "EVIDENCIA VALIDADA",
    aviso: "Validar cierra el método. No demuestra dominio por sí solo.",
    adjuntoPrevio: "foto_01.jpg validada",
    ctaPrimaria: null,
  },
  ["C01-013", "SC-EV-02"],
);

export const FX_LOCAL_EVD_SUBIENDO = evidencia(
  "FX-LOCAL-EVD-SUBIENDO",
  "Upload en progreso: no se presume el resultado",
  {
    estado: "SUBIENDO",
    estadoVisible: "SUBIENDO",
    aviso: "Estamos subiendo tu archivo. Todavía no se envió.",
    ctaPrimaria: { texto: "Enviar evidencia", habilitada: false },
  },
  ["C01-015", "SC-ERR-02"],
);

export const FX_LOCAL_EVD_UPLOAD_FALLIDO = evidencia(
  "FX-LOCAL-EVD-UPLOAD-FALLIDO",
  "Upload fallido: un error no es un envío, y no se reintenta a ciegas",
  {
    estado: "UPLOAD_FALLIDO",
    estadoVisible: "NO PUDIMOS SUBIR EL ARCHIVO",
    aviso: "El archivo no se subió. Tu entrega anterior conserva su estado.",
    ctaPrimaria: { texto: "Reintentar", habilitada: true },
  },
  ["C01-015", "SC-ERR-02"],
);

export const FX_LOCAL_EVD_ARTEFACTO_FORMAL = evidencia(
  "FX-LOCAL-EVD-ARTEFACTO-FORMAL",
  "Artefacto formal: el formato lo fija la cátedra, no la app",
  {
    estado: "ARTEFACTO_FORMAL",
    evidenciaEsperada: "Informe en PDF con carátula de la cátedra",
    formatosPermitidos: "archivo PDF",
    criterioCierre: "sigue la plantilla publicada por la cátedra",
  },
  ["C01-012", "SC-EV-01"],
);

export const FX_LOCAL_EVD_TARDIA = evidencia(
  "FX-LOCAL-EVD-TARDIA",
  "Evidence tardía: no borra el incumplimiento del Commitment",
  {
    estado: "TARDIA",
    estadoVisible: "ENTREGA FUERA DE TÉRMINO",
    // MISSED persiste ante Evidence tardía.
    aviso: "El compromiso sigue incumplido. Entregar ahora no lo cambia.",
    ctaPrimaria: { texto: "Enviar evidencia", habilitada: true },
  },
  ["C01-014", "SC-DAY-04"],
);

export const FX_LOCAL_EVD_REFLECTION_REQUERIDA = evidencia(
  "FX-LOCAL-EVD-REFLECTION-REQUERIDA",
  "Reflection REQUIRED: su ausencia bloquea sólo el submit dependiente",
  {
    reflection: { titulo: "Contanos cómo te fue (requerido)", requerida: true },
    aviso: "Necesitás completar la reflexión para poder enviar.",
    ctaPrimaria: { texto: "Enviar evidencia", habilitada: false },
  },
  ["C01-012", "SC-REF-02"],
);

// ═════════════════════════════════════════════════════════════════════════════
// UX06 · Progreso / Bitácora
// ═════════════════════════════════════════════════════════════════════════════

const progresoBase: ProgresoProps = {
  estado: "CAMBIO_CONFIRMADO",
  contexto: "Avance · Análisis II · Unidad 3",
  estadoEvidencia: { tono: "exito", texto: "Evidencia validada" },
  detalleEvidencia: "Ejercicios 8–14 · validada 20:26",
  cambioConfirmado: [],
  fuenteCambio: null,
  sinCambioConfirmado: [],
  fuenteSinCambio: null,
  queSigue: null,
  aviso: null,
  bitacora: null,
  ctaPrimaria: null,
};

/**
 * Los tres estados de no-cambio.
 *
 * ⚠️ **Sólo dos de los tres se distinguen visualmente hoy.** *"conserva su
 * estado"* y *"no evaluado"* son ausencias de clase distinta —una es un
 * no-cambio declarado por el owner, la otra es una dimensión nunca medida— y
 * las dos caen en `SIN_ASIGNAR`. Separarlas exige decidir qué vocabulario de
 * ausencia usa Achieve, que es una pregunta de dominio y no de estilo: queda
 * abierta en [ADR-020](../../docs/decisions.md#adr-020).
 *
 * Lo que sí se distingue es *"alta · declarada ayer"*: un dato presente.
 */
const NO_CAMBIO: FilaDato[] = [
  // `ADR-020`, 1 sep 2026: **dato**, no ausencia. Alguien miró y confirmó.
  { label: "Recorrido", valor: "conserva su estado" },
  // Ausencia real: el eje existe y nadie lo midió.
  { label: "Dominio", valor: "no evaluado", ausencia: "SIN_ASIGNAR" },
  { label: "Confianza", valor: "alta · declarada ayer" },
];

export const FX_LOCAL_PROG_SIN_CAMBIO_EXPLICITO = esc(
  "FX-LOCAL-PROG-SIN-CAMBIO-EXPLICITO",
  "El owner declaró explícitamente que no hubo cambio: distinto de no tener datos",
  {
    progreso: {
      ...progresoBase,
      estado: "SIN_CAMBIO_EXPLICITO",
      aviso: "Todavía no hay un cambio de progreso confirmado.",
      sinCambioConfirmado: NO_CAMBIO,
      fuenteSinCambio: "resultado de progreso confirmado",
    },
  },
  ["C01-018", "SC-PROG-01"],
);

export const FX_LOCAL_PROG_SIN_DATOS = esc(
  "FX-LOCAL-PROG-SIN-DATOS",
  "Sin información suficiente: no es cero, y no es un no-cambio declarado",
  {
    progreso: {
      ...progresoBase,
      estado: "SIN_DATOS",
      estadoEvidencia: { tono: "humano", texto: "Sin datos suficientes" },
      detalleEvidencia: "Todavía no hay evidencia registrada en esta unidad.",
      aviso: "Sin información suficiente para mostrar un avance.",
      sinCambioConfirmado: [{ label: "Dominio", valor: "no evaluado", ausencia: "SIN_ASIGNAR" }],
    },
  },
  ["C01-019", "SC-PROG-01"],
);

export const FX_LOCAL_PROG_NO_DISPONIBLE = esc(
  "FX-LOCAL-PROG-NO-DISPONIBLE",
  "Falla de lectura: una falla NO es un no-cambio",
  {
    progreso: {
      ...progresoBase,
      estado: "NO_DISPONIBLE",
      estadoEvidencia: { tono: "urgencia", texto: "No pudimos cargar el progreso" },
      detalleEvidencia: "Tu evidencia conserva su estado.",
      aviso: "No pudimos cargar el progreso. Tu evidencia conserva su estado.",
      ctaPrimaria: { texto: "Reintentar", habilitada: true },
    },
  },
  ["C01-019", "SC-ERR-02"],
);

/**
 * Bitácora agrupada por ciclo, con provenance diversa.
 *
 * Los cuatro eventos del mismo ciclo se muestran **juntos**, no como cuatro
 * avances independientes.
 */
export const FX_LOCAL_PROG_BITACORA = esc(
  "FX-LOCAL-PROG-BITACORA",
  "Bitácora agrupada por ciclo, con provenance diversa y sin duplicar avances",
  {
    progreso: {
      ...progresoBase,
      cambioConfirmado: [{ label: "Práctica", valor: "12 → 19 ejercicios" }],
      fuenteCambio: "Evidence validada",
      sinCambioConfirmado: NO_CAMBIO,
      fuenteSinCambio: "resultado de progreso confirmado",
      bitacora: [
        {
          ciclo: "Ciclo del 28 de agosto",
          entradas: [
            { titulo: "Te comprometiste", detalle: "Resolver ejercicios 8–14 · 19:00", provenance: "Reportado por vos · sin verificar" },
            { titulo: "Empezaste", detalle: "19:04", provenance: "Reportado por vos · sin verificar" },
            { titulo: "Presentaste evidencia", detalle: "foto_01.jpg", provenance: "Reportado por vos · sin verificar" },
            { titulo: "La cátedra la validó", detalle: "20:26", provenance: OFICIAL },
          ],
        },
        {
          ciclo: "Ciclo del 25 de agosto",
          entradas: [
            { titulo: "Compromiso incumplido", detalle: "Resolver ejercicios 1–7 · 19:00", provenance: null },
          ],
        },
      ],
      queSigue: "Reforzar cambio de variables.",
      ctaPrimaria: { texto: "Ver siguiente acción", habilitada: true },
    },
  },
  ["C01-020", "SC-PROG-01"],
);

export const escenariosEstadosCriticos = {
  "FX-LOCAL-MAT-CONFIANZA-VS-DOMINIO": FX_LOCAL_MAT_CONFIANZA_VS_DOMINIO,
  "FX-LOCAL-MAT-PROVENANCE": FX_LOCAL_MAT_PROVENANCE,
  "FX-LOCAL-MAT-CONTEXTO-INCOMPLETO": FX_LOCAL_MAT_CONTEXTO_INCOMPLETO,
  "FX-LOCAL-MAT-SIN-RECOMENDACION": FX_LOCAL_MAT_SIN_RECOMENDACION,
  "FX-LOCAL-ACC-INCERTIDUMBRE": FX_LOCAL_ACC_INCERTIDUMBRE,
  "FX-LOCAL-ACC-RAZON-NO-CONFIRMADA": FX_LOCAL_ACC_RAZON_NO_CONFIRMADA,
  "FX-LOCAL-ACC-SIN-RECURSO": FX_LOCAL_ACC_SIN_RECURSO,
  "FX-LOCAL-ACC-BLOQUEADA": FX_LOCAL_ACC_BLOQUEADA,
  "FX-LOCAL-ACC-REEMPLAZADA": FX_LOCAL_ACC_REEMPLAZADA,
  "FX-LOCAL-ACC-CORRECCION": FX_LOCAL_ACC_CORRECCION,
  "FX-LOCAL-COM-CONFIRMED": FX_LOCAL_COM_CONFIRMED,
  "FX-LOCAL-COM-DUE": FX_LOCAL_COM_DUE,
  "FX-LOCAL-COM-STARTED": FX_LOCAL_COM_STARTED,
  "FX-LOCAL-COM-COMPLETED": FX_LOCAL_COM_COMPLETED,
  "FX-LOCAL-COM-MISSED": FX_LOCAL_COM_MISSED,
  "FX-LOCAL-COM-RENEGOTIATED": FX_LOCAL_COM_RENEGOTIATED,
  "FX-LOCAL-COM-CLOSED": FX_LOCAL_COM_CLOSED,
  "FX-LOCAL-COM-CAPACIDAD-INSUFICIENTE": FX_LOCAL_COM_CAPACIDAD_INSUFICIENTE,
  "FX-LOCAL-COM-FECHA-INVALIDA": FX_LOCAL_COM_FECHA_INVALIDA,
  "FX-LOCAL-COM-RENEGOCIACION": FX_LOCAL_COM_RENEGOCIACION,
  "FX-LOCAL-COM-RENEGOCIACION-NO-ELEGIBLE": FX_LOCAL_COM_RENEGOCIACION_NO_ELEGIBLE,
  "FX-LOCAL-COM-RESCATE": FX_LOCAL_COM_RESCATE,
  "FX-LOCAL-EVD-SUBMITTED": FX_LOCAL_EVD_SUBMITTED,
  "FX-LOCAL-EVD-UNDER-REVIEW": FX_LOCAL_EVD_UNDER_REVIEW,
  "FX-LOCAL-EVD-SUFFICIENT": FX_LOCAL_EVD_SUFFICIENT,
  "FX-LOCAL-EVD-INSUFFICIENT": FX_LOCAL_EVD_INSUFFICIENT,
  "FX-LOCAL-EVD-RESUBMISSION-REQUESTED": FX_LOCAL_EVD_RESUBMISSION_REQUESTED,
  "FX-LOCAL-EVD-VALIDATED": FX_LOCAL_EVD_VALIDATED,
  "FX-LOCAL-EVD-SUBIENDO": FX_LOCAL_EVD_SUBIENDO,
  "FX-LOCAL-EVD-UPLOAD-FALLIDO": FX_LOCAL_EVD_UPLOAD_FALLIDO,
  "FX-LOCAL-EVD-ARTEFACTO-FORMAL": FX_LOCAL_EVD_ARTEFACTO_FORMAL,
  "FX-LOCAL-EVD-TARDIA": FX_LOCAL_EVD_TARDIA,
  "FX-LOCAL-EVD-REFLECTION-REQUERIDA": FX_LOCAL_EVD_REFLECTION_REQUERIDA,
  "FX-LOCAL-PROG-SIN-CAMBIO-EXPLICITO": FX_LOCAL_PROG_SIN_CAMBIO_EXPLICITO,
  "FX-LOCAL-PROG-SIN-DATOS": FX_LOCAL_PROG_SIN_DATOS,
  "FX-LOCAL-PROG-NO-DISPONIBLE": FX_LOCAL_PROG_NO_DISPONIBLE,
  "FX-LOCAL-PROG-BITACORA": FX_LOCAL_PROG_BITACORA,
} as const satisfies Record<string, Escenario>;
