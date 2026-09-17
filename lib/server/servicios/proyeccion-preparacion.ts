import {
  selectOverviewLevel,
  type NivelOverview,
  type OverviewInput,
  type VarianteOverview,
} from "@/lib/domain/overview-precedence";
import type {
  DatoDeEvaluacion,
  FilaDato,
  OverviewExamenProps,
  PasoDelRecorrido,
} from "@/lib/domain/view-models";
import { provenanceVisible, type SourceType, type VerificationStatus } from "@/lib/content/provenance";
import { fechaDeCalendario, haceCuanto } from "./tiempo";
import { fuenteDeContenido } from "./proyeccion-paso";

/**
 * `UX08` proyectada desde datos persistidos (Etapa B5.5).
 *
 * La matriz de precedencia sigue en `overview-precedence.ts` y no se toca: acá
 * sólo se traduce el mundo persistido a sus diez entradas. Es el mismo reparto
 * que en `UX01` y `UX02` — **la función decide, los datos declaran la
 * condición**.
 *
 * ## Las tres cosas que esta superficie se sigue negando a decir
 *
 * **Readiness.** No hay card, no hay score, no hay porcentaje. `preparation_readiness`
 * existe y nadie la escribe: los umbrales son `C01-029`. Lo único que sale es
 * el `status` recibido, que es lifecycle, con su descargo literal al lado.
 *
 * **"Paso 5 de 12".** `product.md` §8.1 lo prohíbe, y desde `HUMAN-P0-01 v1.0`
 * además sería falso: en el tramo reentrante no existe "el siguiente".
 *
 * **Que repetir sea retroceder.** Un paso con tres vueltas se muestra como
 * `CONFIRMADO` con su recencia, nunca como recaída (`product.md` §8.2).
 */
export interface PasoDePreparacion {
  id: string;
  canonicalId: string;
  label: string;
  requisito: "NO_CONFIGURADA" | "OPCIONAL" | "OBLIGATORIO";
  reentrante: boolean;
  vueltas: number;
  ultimaEn: string | null;
  esActual: boolean;
}

export interface EstadoDePreparacion {
  instante: string;
  zona: string;
  preparacionId: string;
  status: string;
  materia: string;
  evaluacion: string;
  fechaEn: string | null;
  modalidad: string | null;
  fuenteEvaluacion: SourceType | null;
  verificacionEvaluacion: VerificationStatus | null;
  protocolo: {
    version: string;
    alcance: string;
    contenido: string | null;
    contenidoVersion: string | null;
  } | null;
  pasos: PasoDePreparacion[];
  accion: { status: string; objetivo: string | null } | null;
  compromiso: { state: string; inicioEn: string | null } | null;
  rescatePendiente: boolean;
  evidencia: string;
  ultimoProgresoEn: string | null;
  readiness: { state: string; explicacion: string; reglaVersion: string } | null;
}

export interface RepositorioDePreparacionLectura {
  estadoDePreparacion(
    institutionId: string,
    studentId: string,
    ahora: string,
    preparacionId?: string | null,
  ): Promise<EstadoDePreparacion | null>;
}

const MODALIDADES: Record<string, string> = {
  practico: "Práctico",
  teorico_escrito: "Teórico escrito",
};

const CURSADO = "Cursado, sus cinco dimensiones y la Bitácora continúan disponibles.";
const VOLVER = "VOLVER A CURSADO";

/**
 * El descargo va **pegado al status y no en una nota al pie**.
 *
 * `product.md` §5.4: `READY_BY_PROTOCOL` *"no predice ni garantiza aprobación.
 * Nunca se dice «listo para rendir»"*. Ninguno de estos estados es un
 * pronóstico, y decirlo al lado del valor es la diferencia entre acompañar y
 * prometer algo que el producto no puede sostener.
 */
const DESCARGO: Record<string, string> = {
  RECOMMENDED: "Todavía no la activaste.",
  ACTIVE: "Es el estado de la preparación, no un pronóstico del examen.",
  REPLANNED: "El plan cambió; la preparación y su historial siguen activos.",
  BLOCKED: "Está bloqueada por una condición del protocolo.",
  EXAM_TAKEN: "Ya rendiste; la preparación queda como registro.",
  CLOSED: "Cerrada. Su historial se conserva.",
  CANCELLED: "El examen fue cancelado. Su historial se conserva.",
  EXPLICITLY_ABANDONED: "La dejaste de forma explícita. Su historial se conserva.",
};

const ESTADO_DOMINANTE: Record<NivelOverview, string> = {
  1: "ACCIÓN EN CURSO",
  2: "FALTA PRESENTAR EVIDENCIA",
  3: "COMPROMISO VIGENTE",
  4: "COMPROMISO INCUMPLIDO",
  5: "NUEVA PRESENTACIÓN SOLICITADA",
  6: "PRÓXIMA ACCIÓN DISPONIBLE",
  7: "PASO DISPONIBLE",
  8: "EVIDENCIA EN REVISIÓN",
  9: "CAMBIO CONFIRMADO",
  // Sin objeto de precedencia, lo dominante es el estado de la preparación —y
  // **no siempre es "activa"**: una `RECOMMENDED` que anunciara "PREPARACIÓN
  // ACTIVA" estaría afirmando una activación que el estudiante no hizo.
  10: "PREPARACIÓN ACTIVA",
};

const SIN_OBJETO: Record<string, string> = {
  RECOMMENDED: "PREPARACIÓN RECOMENDADA",
  ACTIVE: "PREPARACIÓN ACTIVA",
  REPLANNED: "PREPARACIÓN REPLANIFICADA",
  BLOCKED: "PREPARACIÓN BLOQUEADA",
  EXAM_TAKEN: "EXAMEN RENDIDO",
  CLOSED: "PREPARACIÓN CERRADA",
  CANCELLED: "EXAMEN CANCELADO",
  EXPLICITLY_ABANDONED: "PREPARACIÓN ABANDONADA",
};

const CTA: Partial<Record<NivelOverview, string>> = {
  1: "CONTINUAR",
  2: "PRESENTAR EVIDENCIA",
  3: "VER COMPROMISO",
  4: "RECUPERAR",
  5: "PRESENTAR DE NUEVO",
  6: "COMPROMETERME",
  7: "ABRIR PASO ACTUAL",
  8: "VER EVIDENCIA",
  9: "VER AVANCE",
};

/** Traduce el mundo persistido a las diez entradas de §13. */
function aEntradaDeOverview(e: EstadoDePreparacion): OverviewInput {
  const s = e.accion?.status;
  const c = e.compromiso?.state;
  return {
    action: s === "IN_PROGRESS" ? "IN_PROGRESS" : s === "EVIDENCE_PENDING" ? "EVIDENCE_PENDING" : "NONE",
    commitment:
      c === "MISSED"
        ? "MISSED"
        : c === "DUE"
          ? "DUE"
          : c === "STARTED"
            ? "STARTED"
            : c === "CONFIRMED"
              ? "CONFIRMED_FUTURO"
              : "NONE",
    rescate: e.rescatePendiente ? "REQUIRED" : "NONE",
    evidence:
      e.evidencia === "RESUBMISSION_REQUESTED"
        ? "RESUBMISSION_REQUESTED"
        : e.evidencia === "UNDER_REVIEW"
          ? "UNDER_REVIEW"
          : e.evidencia === "SUBMITTED" || e.evidencia === "VALIDATED"
            ? "INFORMATIVA"
            : "NONE",
    recomendacionPrimariaVigente: s === "RECOMMENDED",
    // **La UI no elige el paso.** Sale disponible sólo si el owner del
    // protocolo dejó un `current_step_id`, que hoy nadie escribe.
    pasoActualDisponible: e.pasos.some((p) => p.esActual),
    // El gate autoritativo llega del owner; no se deriva de la preparación.
    gateAutoritativo: false,
    progreso: e.ultimoProgresoEn ? "PROGRESS_ENTRY" : "NONE",
  };
}

/**
 * El recorrido, sin posición y sin porcentaje.
 *
 * Un paso con vueltas es `CONFIRMADO`; el `ACTUAL` **sólo** lo marca el owner.
 * Sin `current_step_id` no hay ninguno actual, y eso es correcto: derivarlo de
 * la posición en la lista es lo que §8.1 prohíbe y `HUMAN-P0-01` volvió falso.
 */
function recorridoDe(pasos: PasoDePreparacion[]): readonly PasoDelRecorrido[] | null {
  if (pasos.length === 0) return null;
  return pasos.map((p) => ({
    label: p.label,
    estado: p.esActual ? "ACTUAL" : p.vueltas > 0 ? "CONFIRMADO" : "PENDIENTE",
  }));
}

export function proyectarPreparacion(e: EstadoDePreparacion): OverviewExamenProps {
  const { nivel, variante } = selectOverviewLevel(aEntradaDeOverview(e));
  const provenance = provenanceVisible(e.fuenteEvaluacion, e.verificacionEvaluacion);

  const datos: DatoDeEvaluacion[] = [];
  if (e.fechaEn) {
    datos.push({ label: "Fecha", valor: fechaDeCalendario(e.fechaEn), provenance, anterior: null });
  }
  if (e.modalidad) {
    datos.push({
      label: "Modalidad",
      valor: MODALIDADES[e.modalidad] ?? e.modalidad,
      provenance,
      anterior: null,
    });
  }

  // Las vueltas dadas, que es el hecho nuevo que ADR-028 hizo registrable.
  // Van en `pendiente` y no en `cambioConfirmado`: **completar un paso no es un
  // `ProgressUpdated`** — `product.md` §5.6 lo lista entre lo que no produce
  // progreso, y mezclarlos diría que trabajar es aprender.
  const conVueltas = e.pasos.filter((p) => p.vueltas > 0);
  const pendiente: FilaDato[] = [];
  if (conVueltas.length > 0) {
    const repetidos = conVueltas.filter((p) => p.vueltas > 1);
    pendiente.push({
      label: "Pasos trabajados",
      valor: `${conVueltas.length} de ${e.pasos.length}`,
    });
    // "Volviste sobre 2 pasos" y no "repetiste 2 pasos": repetir no es
    // retroceder, y el copy tampoco lo insinúa (§8.2).
    if (repetidos.length > 0) {
      pendiente.push({
        label: "Volviste sobre",
        valor: repetidos.length === 1 ? repetidos[0].label : `${repetidos.length} pasos`,
      });
    }
  }
  if (e.pasos.length > 0 && conVueltas.length === 0) {
    pendiente.push({ label: "Pasos trabajados", valor: "Todavía ninguno", ausencia: "CERO_REAL" });
  }

  // La procedencia del contenido pedagógico, dicha en la pantalla. Un recorrido
  // que el equipo asumió no se muestra igual que uno que confirmó una
  // profesional, y el estudiante tiene derecho a saber cuál está mirando.
  const secundarios: string[] = [];
  if (e.protocolo) {
    // Misma frase que `UX09`, y por eso sale de la misma función: dos
    // superficies que rotulan distinto el mismo contenido son dos verdades.
    secundarios.push(
      `Protocolo ${e.protocolo.version} · ${fuenteDeContenido(e.protocolo.contenido, e.protocolo.contenidoVersion)}`,
    );
  }
  if (e.ultimoProgresoEn) {
    secundarios.push(`Último cambio confirmado ${haceCuanto(e.ultimoProgresoEn, e.instante, e.zona)}.`);
  }

  return {
    nivel,
    variante: variante as VarianteOverview | null,
    materia: e.materia,
    evaluacion: e.evaluacion,
    datos,
    estadoDominante: nivel === 10 ? (SIN_OBJETO[e.status] ?? ESTADO_DOMINANTE[10]) : ESTADO_DOMINANTE[nivel],
    objeto: e.accion?.objetivo ?? null,
    ctaPrimaria: CTA[nivel] ? { texto: CTA[nivel]!, habilitada: true } : null,
    despues: null,
    secundarios,
    // Sin paso actual el aviso lo dice, y no se elige uno por posición.
    aviso: e.pasos.length > 0 && !e.pasos.some((p) => p.esActual) && nivel === 10
      ? "Todavía no hay un paso para abrir."
      : null,
    recorrido: recorridoDe(e.pasos),
    // Ninguna dimensión se afirma acá: el progreso vive en `UX06` y esta
    // superficie no lo recalcula.
    cambioConfirmado: [],
    pendiente,
    fuenteProgreso: null,
    statusRecibido: DESCARGO[e.status]
      ? { valor: e.status, descargo: DESCARGO[e.status] }
      : null,
    cursadoPersistente: CURSADO,
    ctaRetorno: VOLVER,
  };
}
