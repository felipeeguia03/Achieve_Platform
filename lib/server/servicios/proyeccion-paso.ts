import {
  selectStepLevel,
  type NivelPaso,
  type StepInput,
  type VariantePaso,
} from "@/lib/domain/step-precedence";
import type { BloqueDePaso, PasoProtocoloProps } from "@/lib/domain/view-models";
import { haceCuanto } from "./tiempo";

/**
 * `UX09` proyectada desde datos persistidos (Etapa B5.5).
 *
 * `WF-S11` **renderiza contenido recibido**: no deriva, no resume con
 * significado nuevo, no completa y no corrige contenido pedagógico (§VI.9
 * §12.1). Los cuatro bloques salen tal como los cargó la versión del protocolo,
 * y un `null` se muestra con el copy de ausencia de §27 — nunca con una versión
 * generada, que es la tentación obvia y la que convertiría a un agente en autor
 * de criterio pedagógico.
 */
export interface VueltaDePaso {
  occurrence: number;
  completadoEn: string;
  tema: string | null;
}

export interface EstadoDePaso {
  instante: string;
  zona: string;
  preparacionId: string;
  status: string;
  materia: string;
  evaluacion: string;
  modalidad: string | null;
  pasoId: string;
  label: string;
  objetivo: string | null;
  explicacion: string | null;
  entregable: string | null;
  criterio: string | null;
  requisito: "NO_CONFIGURADA" | "OPCIONAL" | "OBLIGATORIO";
  reentrante: boolean;
  version: string;
  contenido: string | null;
  contenidoVersion: string | null;
  vueltas: VueltaDePaso[];
  accion: { status: string; objetivo: string | null } | null;
  compromiso: { state: string } | null;
  evidencia: string;
}

export interface RepositorioDePasoLectura {
  estadoDePaso(
    institutionId: string,
    studentId: string,
    ahora: string,
    preparacionId: string,
    pasoId: string,
  ): Promise<EstadoDePaso | null>;
}

const MODALIDADES: Record<string, string> = {
  practico: "Práctico",
  teorico_escrito: "Teórico escrito",
};

/** Copy de ausencia de §27. Cada bloque tiene el suyo: no se colapsan. */
const AUSENCIA = {
  objetivo: "Este paso no tiene un objetivo configurado.",
  explicacion: "Este paso no tiene una explicación configurada.",
  entregable: "Este paso no declara un entregable.",
  criterio: "Este paso no tiene un criterio de cierre configurado.",
} as const;

function bloque(titulo: string, valor: string | null, ausencia: string): BloqueDePaso {
  return { titulo, valor, ausencia };
}

const ESTADO_DOMINANTE: Record<NivelPaso, string> = {
  1: "ACCIÓN EN CURSO",
  2: "EVIDENCIA PENDIENTE",
  3: "COMPROMISO VIGENTE",
  4: "COMPROMISO INCUMPLIDO",
  5: "NUEVA PRESENTACIÓN SOLICITADA",
  6: "PRÓXIMA ACCIÓN DISPONIBLE",
  7: "PASO DISPONIBLE",
  8: "EVIDENCIA EN REVISIÓN",
  9: "CAMBIO CONFIRMADO",
  10: "PASO ANTERIOR COMPLETADO",
  11: "SIN ACCIÓN DISPONIBLE",
};

const CTA: Partial<Record<NivelPaso, string>> = {
  1: "CONTINUAR",
  2: "PRESENTAR EVIDENCIA",
  3: "VER COMPROMISO",
  4: "RECUPERAR",
  5: "PRESENTAR DE NUEVO",
  6: "COMPROMETERME",
  8: "VER EVIDENCIA",
  9: "VER AVANCE",
};

function aEntradaDePaso(e: EstadoDePaso): StepInput {
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
    rescate: "NONE",
    evidence:
      e.evidencia === "RESUBMISSION_REQUESTED"
        ? "RESUBMISSION_REQUESTED"
        : e.evidencia === "UNDER_REVIEW"
          ? "UNDER_REVIEW"
          : e.evidencia === "SUBMITTED" || e.evidencia === "VALIDATED"
            ? "INFORMATIVA"
            : "NONE",
    recomendacionPrimariaVigente: s === "RECOMMENDED",
    // `protocol_step` no tiene recurso configurado y **no se le inventa uno**.
    recursoDisponible: false,
    // Un paso reentrante nunca queda cerrado: siempre se le puede dar otra
    // vuelta. Uno no reentrante sí, en cuanto tiene su primera completion.
    cierreNoConfirmado: e.reentrante || e.vueltas.length === 0,
    gateAutoritativo: false,
    progreso: "NONE",
    // El nuevo current lo entrega el owner del protocolo, y hoy nadie lo
    // escribe: no se deriva de la posición en la lista.
    nuevoCurrentDisponible: false,
  };
}

export function proyectarPaso(e: EstadoDePaso): PasoProtocoloProps {
  const { nivel, variante } = selectStepLevel(aEntradaDePaso(e));

  const secundarios: string[] = [];
  if (e.vueltas.length > 0) {
    const ultima = e.vueltas[0];
    // *"Lo trabajaste 3 veces"*, no *"lo repetiste 3 veces"*: repetir no es
    // retroceder, y ninguna superficie lo presenta como incumplimiento
    // (`product.md` §8.2).
    secundarios.push(
      e.vueltas.length === 1
        ? `Lo trabajaste una vez, ${haceCuanto(ultima.completadoEn, e.instante, e.zona)}.`
        : `Lo trabajaste ${e.vueltas.length} veces; la última, ${haceCuanto(ultima.completadoEn, e.instante, e.zona)}.`,
    );
    // El tema es parte del hecho: "volviste sobre Series" dice algo que
    // "repetiste el paso 12" no dice.
    const temas = [...new Set(e.vueltas.map((v) => v.tema).filter((t): t is string => t !== null))];
    if (temas.length > 0) secundarios.push(`Sobre: ${temas.join(", ")}.`);
  }
  if (e.reentrante) {
    secundarios.push("Este paso se puede volver a trabajar las veces que haga falta.");
  }

  return {
    nivel,
    variante: variante as VariantePaso | null,
    assessment: e.evaluacion,
    materia: e.materia,
    modalidad: e.modalidad ? (MODALIDADES[e.modalidad] ?? e.modalidad) : "Modalidad no disponible",
    labelDelPaso: e.label,
    version: `Protocolo ${e.version}`,
    objetivo: bloque("Objetivo", e.objetivo, AUSENCIA.objetivo),
    explicacion: bloque("Por qué", e.explicacion, AUSENCIA.explicacion),
    entregable: bloque("Qué entregás", e.entregable, AUSENCIA.entregable),
    criterio: bloque("Criterio de cierre", e.criterio, AUSENCIA.criterio),
    recurso: null,
    avisoRecurso: "Este paso no tiene un recurso configurado.",
    estadoDominante: ESTADO_DOMINANTE[nivel],
    // Abrir no completa. Es la primera línea de §5.6 y la que más veces se
    // rompe sola cuando una pantalla marca "visto" al renderizar.
    avisoDeApertura: "Abriste este paso. Abrirlo no lo completa.",
    aviso: null,
    ctaPrimaria: CTA[nivel] ? { texto: CTA[nivel]!, habilitada: true } : null,
    despues: null,
    secundarios,
    // La procedencia del contenido, dicha en la pantalla y sin oficializarla.
    fuenteDelContenido:
      e.contenido === "EP-SPEC"
        ? "Contenido provisional del equipo, todavía sin confirmación profesional."
        : e.contenido
          ? `Criterio profesional confirmado · ${e.contenido} ${e.contenidoVersion ?? ""}`.trim()
          : "Fuente del contenido no disponible.",
    ctaRetorno: "VOLVER AL OVERVIEW",
  };
}
