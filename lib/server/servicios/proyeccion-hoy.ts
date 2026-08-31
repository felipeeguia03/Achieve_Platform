import { selectHeroLevel, type HeroInput } from "@/lib/domain/precedence";
import { t } from "@/lib/content/es-AR";
import type { HoyProps, MateriaResumen } from "@/lib/domain/view-models";
import { fechaCorta } from "./tiempo";

/**
 * `UX01` proyectada desde datos persistidos — Etapa B2.5.
 *
 * **La pantalla no cambia.** Recibe el mismo `HoyProps` que le daba el fixture;
 * lo único distinto es de dónde salen los datos. Esa es la frontera que se
 * viene sosteniendo desde la Fase 0, y acá es donde se cobra.
 *
 * **La precedencia no se reescribe:** es la misma `selectHeroLevel` de
 * `lib/domain/`, con sus nueve niveles. Una segunda tabla de precedencia en el
 * backend sería otra verdad sobre la misma pantalla.
 */

/** Lo que hace falta leer para armar el día. */
export interface EstadoDelDia {
  /** Instante ISO. **El formato es presentación y se decide acá**, no en SQL. */
  instante: string;
  /** Zona del estudiante, congelada en su perfil. Nunca el reloj del servidor. */
  zona: string;
  /** Estado de la Action viva, si hay. */
  accion: {
    status: string;
    objetivo: string;
    contexto: string;
    razon: string | null;
    minutosMin: number | null;
    minutosMax: number | null;
    evidenciaEsperada: string | null;
    queSigue: string | null;
  } | null;
  /** Estado del Commitment vigente, si hay. */
  compromiso: { state: string } | null;
  /** ¿Hay un `MISSED` sin rescate? */
  rescatePendiente: boolean;
  /** Lifecycle de la Evidence informativa. */
  evidencia: "NONE" | "ENVIADA" | "VALIDADA";
  /** ¿Falta contexto de cursado? Lo dice el ADE, no un cálculo local. */
  contextoIncompleto: boolean;
  materias: Array<Omit<MateriaResumen, "ultimoAvance"> & { ultimoAvanceEn: string | null }>;
  bitacoraDisponible: boolean;
}

export interface RepositorioDeHoy {
  estadoDelDia(institutionId: string, studentId: string, ahora: string): Promise<EstadoDelDia | null>;
}

/** Traduce el estado persistido a las seis entradas de la matriz. */
function aEntradaDeHero(e: EstadoDelDia): HeroInput {
  const s = e.accion?.status;
  return {
    action:
      s === "IN_PROGRESS" ? "IN_PROGRESS" : s === "EVIDENCE_PENDING" ? "EVIDENCE_PENDING" : "NONE",
    commitment:
      e.compromiso?.state === "MISSED"
        ? "MISSED"
        : e.compromiso?.state === "DUE" || e.compromiso?.state === "STARTED"
          ? "STARTABLE"
          : e.compromiso?.state === "CONFIRMED"
            ? "PROXIMO"
            : "NONE",
    rescate: e.rescatePendiente ? "REQUIRED" : "NONE",
    // Hay recomendación cuando el ADE dejó una Action en `RECOMMENDED`.
    actionRecommended: s === "RECOMMENDED",
    contextIncomplete: e.contextoIncompleto,
    evidenciaInformativa: e.evidencia,
  };
}

const ESTADO: Record<string, string> = {
  ACTION_RECOMMENDED: t("HOY.ESTADO.ACTION_RECOMMENDED"),
  IN_PROGRESS: t("HOY.ESTADO.IN_PROGRESS"),
  EVIDENCE_PENDING: t("HOY.ESTADO.EVIDENCE_PENDING"),
  RESCUE_REQUIRED: t("HOY.ESTADO.RESCUE_REQUIRED"),
  COMMITMENT_NEXT: t("HOY.ESTADO.COMMITMENT_NEXT"),
  COMMITMENT_MISSED: t("HOY.ESTADO.COMMITMENT_MISSED"),
  CONTEXT_INCOMPLETE: t("HOY.ESTADO.CONTEXT_INCOMPLETE"),
  EVIDENCE_INFO: t("HOY.ESTADO.EVIDENCE_INFO"),
  NO_ACTION: t("HOY.ESTADO.DEFECTO"),
};

export function proyectarDia(e: EstadoDelDia): HoyProps {
  const { nivel, variante } = selectHeroLevel(aEntradaDeHero(e));

  // La línea operativa: tiempo si lo hay, estado si la Action ya arrancó.
  const tiempoOEstado =
    e.accion?.status === "IN_PROGRESS"
      ? "En curso"
      : e.accion?.minutosMax
        ? `${e.accion.minutosMax} min`
        : null;

  return {
    fecha: fechaCorta(e.instante, e.zona),
    estadoGeneral: ESTADO[nivel] ?? ESTADO.NO_ACTION,
    hero: {
      nivel,
      variante,
      contexto: e.accion?.contexto ?? null,
      titulo: e.accion?.objetivo ?? null,
      razon: e.accion?.razon ?? null,
      tiempoOEstado,
      evidenciaEsperada: e.accion?.evidenciaEsperada ?? null,
      // El texto es dato; el prefijo "Después:" es copy (`C-07`).
      queSigue: e.accion?.queSigue ? { texto: e.accion.queSigue, conPrefijo: true } : null,
      chip: null,
    },
    materias: e.materias.map((m) => ({
      nombre: m.nombre,
      estado: m.estado,
      tono: m.tono,
      // `null` ⇒ "Sin avance registrado", que no es "hace 0 días".
      ultimoAvance: m.ultimoAvanceEn ? fechaCorta(m.ultimoAvanceEn, e.zona) : null,
    })),
    // `null` ⇒ la CTA **no se renderiza**, en vez de renderizarse deshabilitada.
    verProgreso: e.bitacoraDisponible ? t("CTA.VER_AVANCE") : null,
  };
}
