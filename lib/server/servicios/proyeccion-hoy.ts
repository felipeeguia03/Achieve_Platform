import { selectHeroLevel, type HeroInput } from "@/lib/domain/precedence";
import { t } from "@/lib/content/es-AR";
import type { HoyProps, MateriaResumen, RecuperacionProjection } from "@/lib/domain/view-models";
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
    /**
     * El id de la `Action` — §7.6 de [ADR-034](../../../docs/decisions.md#adr-034).
     *
     * **No lo usa `UX01`**, y no llega a la pantalla: existe porque el flujo C
     * del contrato con el CRM necesita poder referenciar la acción. La lectura
     * lo devuelve; la proyección lo deja pasar de largo, y hay guard.
     */
    id: string;
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
  /**
   * `cursadaId` es `course_enrollment.id` —**la cursada**, no la materia del
   * catálogo—: es lo que identifica *esta materia para este estudiante*, y lo
   * que ya aceptan `estado_de_materia()` y `GET /api/materia`. Igual que
   * `accion.id`, **no llega a la pantalla**.
   */
  materias: Array<
    Omit<MateriaResumen, "ultimoAvance"> & { cursadaId: string; ultimoAvanceEn: string | null }
  >;
  bitacoraDisponible: boolean;
  /**
   * La señal de riesgo viva más severa, con su explicación — Fase B6.
   *
   * **Viaja fuera de `HeroInput` a propósito.** `VI.1` §3.3: el riesgo es un
   * estado **modificador, no reemplazante**; *"no gana automáticamente el
   * Hero"* y *"no puede interrumpir `IN_PROGRESS` ni `EVIDENCE_PENDING` sólo
   * por severidad"*. Si entrara a la matriz de precedencia, la primera
   * refactorización lo convertiría en un nivel más.
   */
  riesgo?: {
    severidad: "bajo" | "atencion" | "riesgo" | "intervencion";
    /** *"Explicación útil"* (§4.1). Nunca un score. */
    razon: string;
    /** La señal misma dice que necesita una persona. **No es un umbral local.** */
    necesitaPersona: boolean;
    /**
     * En qué estado está el acompañamiento, si alguien lo tomó — B6.6.2.
     *
     * `null` ⇒ nadie todavía. **No viene con quién**: la identidad del operador
     * es del CRM y no le suma nada al estudiante.
     */
    intervencion?: "open" | "acknowledged" | "closed" | null;
  } | null;
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

/**
 * Lo que el estudiante ve de su propia señal — Etapa B6.6.2.
 *
 * **Traduce, no evalúa.** Los seis estados salen de dos campos canónicos —el
 * estado de la señal y el de la intervención— y de nada más. Si acá se contara
 * algo o se comparara un umbral, habría dos verdades sobre el mismo estudiante,
 * que es lo que `VI.6` §8.3 prohíbe para el historial y vale igual para esto.
 *
 * **Una señal resuelta no se muestra como activa**, y de hecho no llega: la
 * lectura sólo trae señales vivas. El estado `RESUELTA` existe en el tipo para
 * que la derivación esté completa, no porque haya un camino que lo produzca hoy.
 */
function proyectarRecuperacion(e: EstadoDelDia): RecuperacionProjection | null {
  const r = e.riesgo;
  // Sin señal viva **la sección no existe**. Dibujarla vacía diciendo "todo
  // bien" sería afirmar una lectura que nadie hizo (`P-09`).
  if (!r) return null;

  // Mientras no pida una persona, es una dificultad que se puede trabajar sola.
  if (!r.necesitaPersona) {
    return {
      estado: "REITERADA",
      titulo: t("HOY.RECUPERACION.TITULO"),
      explicacion: t("HOY.RECUPERACION.EXPLICACION"),
      // La causa concreta, tal como la registró quien produjo la señal.
      detalle: r.razon,
      queSigue: t("HOY.RECUPERACION.QUE_HACER"),
    };
  }

  // Pide una persona. Lo que cambia de acá para abajo es **si ya la tomaron**,
  // que es la diferencia entre "avisamos" y "te están acompañando".
  const estado =
    r.intervencion === "closed"
      ? "RESUELTA"
      : r.intervencion === "acknowledged"
        ? "EN_CURSO"
        : r.intervencion === "open"
          ? "TOMADA"
          : "ELEVADA";

  const queSigue =
    estado === "EN_CURSO"
      ? t("HOY.RECUPERACION.QUE_HACER_EN_CURSO")
      : estado === "TOMADA"
        ? t("HOY.RECUPERACION.QUE_HACER_TOMADO")
        : t("HOY.RECUPERACION.QUE_HACER_ELEVADO");

  return {
    estado,
    titulo: t("HOY.RECUPERACION.TITULO_ELEVADO"),
    explicacion: t("HOY.RECUPERACION.EXPLICACION_ELEVADO"),
    detalle: r.razon,
    queSigue,
  };
}

export function proyectarDia(e: EstadoDelDia): HoyProps {
  const { nivel, variante } = selectHeroLevel(aEntradaDeHero(e));

  /**
   * Lo único que el riesgo puede cambiar acá — Fase B6.
   *
   * `VI.1` §3.3 lo autoriza con todas las letras: *"cambiar el estado general a
   * Necesita recuperación"*. **No toca el Hero, ni la CTA, ni el orden de las
   * materias**, y `aEntradaDeHero` ni siquiera lo recibe.
   *
   * El disparador es que **la señal esté pidiendo una persona**, no una
   * severidad: qué severidad cambia el estado general es `C01-021`, abierto, y
   * elegir una acá sería inventar el umbral por el que a un estudiante se le
   * dice que está en problemas.
   */
  const necesitaRecuperacion = e.riesgo?.necesitaPersona === true;
  const recuperacion = proyectarRecuperacion(e);

  // La línea operativa: tiempo si lo hay, estado si la Action ya arrancó.
  const tiempoOEstado =
    e.accion?.status === "IN_PROGRESS"
      ? "En curso"
      : e.accion?.minutosMax
        ? `${e.accion.minutosMax} min`
        : null;

  return {
    fecha: fechaCorta(e.instante, e.zona),
    // Reusa la clave de `RESCUE_REQUIRED`: el spec le da a los dos casos la
    // misma frase —*"Necesita recuperación"*—, y dos claves con el mismo texto
    // son dos lugares donde arreglar el próximo cambio de copy.
    estadoGeneral: necesitaRecuperacion
      ? ESTADO.RESCUE_REQUIRED
      : (ESTADO[nivel] ?? ESTADO.NO_ACTION),
    recuperacion,
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
