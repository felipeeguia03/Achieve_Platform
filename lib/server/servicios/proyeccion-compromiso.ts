import { t } from "@/lib/content/es-AR";
import type { CompromisoProps, EstadoCompromiso, FilaDato } from "@/lib/domain/view-models";

/**
 * `UX04` proyectada desde datos persistidos — Etapa B2.6.
 *
 * ## Lo que la pantalla muestra del original, y por qué entero
 *
 * Cuando el compromiso es una **renegociación** o un **rescate**, el original
 * viaja completo y **no editable**. Los invariantes `I2` e `I3` dicen que el
 * original se preserva; mostrarlo es lo que hace verificable esa promesa para
 * el estudiante. *No Cortar*: el incumplido sigue incumplido, y el rescate lo
 * apunta sin borrarlo.
 *
 * **La hora se muestra en la zona congelada del acuerdo**, no en la actual del
 * estudiante. Si alguien acordó las 23:00 en Córdoba y después viaja, el
 * compromiso siguió siendo el de las 23:00 de aquella noche: recalcularlo
 * reescribiría el acuerdo.
 */

export interface EstadoDeCompromiso {
  instante: string;
  zona: string;
  compromisoId: string;
  state: string;
  materia: string;
  objetivo: string;
  inicioEn: string;
  zonaDelAcuerdo: string;
  minutosPlanificados: number;
  evidenciaEsperada: string | null;
  criterioCierre: string | null;
  esRenegociacion: boolean;
  esRescate: boolean;
  original: {
    state: string;
    inicioEn: string;
    zonaDelAcuerdo: string;
    minutosPlanificados: number;
  } | null;
  yaEmpezo: boolean;
}

export interface RepositorioDeCompromiso {
  estadoDeCompromiso(
    institutionId: string,
    studentId: string,
    ahora: string,
    commitmentId?: string | null,
  ): Promise<EstadoDeCompromiso | null>;
}

const ESTADOS = new Set<EstadoCompromiso>([
  "DRAFT", "CONFIRMED", "DUE", "STARTED", "COMPLETED", "RENEGOTIATED", "MISSED", "CLOSED",
]);

function fecha(instante: string, zona: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short", day: "numeric", month: "short", timeZone: zona,
  }).format(new Date(instante)).replace(/[.,]/g, "");
}

function hora(instante: string, zona: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: zona,
  }).format(new Date(instante));
}

/**
 * El estado visible. El rescate y la renegociación **ganan sobre el lifecycle**
 * porque describen de qué se trata esta pantalla; el lifecycle sigue visible en
 * el chip.
 */
function estadoDe(e: EstadoDeCompromiso): EstadoCompromiso {
  if (e.esRescate) return "RESCATE";
  if (e.esRenegociacion) return "RENEGOCIACION";
  return ESTADOS.has(e.state as EstadoCompromiso) ? (e.state as EstadoCompromiso) : "DRAFT";
}

/**
 * La CTA. **`null` ⇒ no se renderiza.**
 *
 * Un `COMPLETED`, un `CLOSED` y un `RENEGOTIATED` no ofrecen nada: son
 * terminales o casi.
 *
 * ## El `MISSED` sí ofrece una, y no es la misma — Etapa B6.9.1
 *
 * **Nunca** ofrece confirmar: un incumplimiento no se edita para parecer
 * cumplido. Ofrece **`CTA-015` · «Retomar»**, que empieza *otro objeto* —el
 * rescate—, y por eso el texto es distinto y el destino también.
 *
 * Hasta acá esta función devolvía `null` para `MISSED`, y **eso contradecía al
 * fixture `FX-LOCAL-COM-MISSED`**, que es el diseño aprobado de la pantalla y
 * tiene la CTA. La consecuencia no era cosmética: el estudiante que incumplía
 * **se quedaba sin ninguna salida** —la máquina no admite `MISSED → CONFIRMED`
 * y `POST /api/compromiso` sólo crea el primero de una `Action`—, así que el
 * loop terminaba ahí.
 */
function ctaDe(estado: EstadoCompromiso): CompromisoProps["ctaPrimaria"] {
  if (estado === "DRAFT" || estado === "RENEGOCIACION" || estado === "RESCATE") {
    return { texto: t("CTA.CONFIRMAR_COMPROMISO"), habilitada: true };
  }
  if (estado === "MISSED") return { texto: t("CTA.RETOMAR"), habilitada: true };
  if (estado === "CONFIRMED" || estado === "DUE") {
    return { texto: t("CTA.EMPEZAR"), habilitada: true };
  }
  if (estado === "STARTED") return { texto: t("CTA.SUBIR_EVIDENCIA"), habilitada: true };
  return null;
}

const CHIP: Partial<Record<EstadoCompromiso, { tono: "urgencia" | "exito" | "humano"; texto: string }>> = {
  CONFIRMED: { tono: "humano", texto: "Acordado" },
  DUE: { tono: "urgencia", texto: "Vencido" },
  STARTED: { tono: "humano", texto: "En curso" },
  COMPLETED: { tono: "exito", texto: "Cumplido" },
  MISSED: { tono: "urgencia", texto: "Incumplido" },
  RENEGOTIATED: { tono: "humano", texto: "Renegociado" },
};

export function proyectarCompromiso(e: EstadoDeCompromiso): CompromisoProps {
  const estado = estadoDe(e);

  return {
    estado,
    contexto: `Cursado · ${e.materia}`,
    titulo: e.objetivo,
    fecha: fecha(e.inicioEn, e.zonaDelAcuerdo),
    hora: hora(e.inicioEn, e.zonaDelAcuerdo),
    tiempoDeclarado: `${e.minutosPlanificados} min`,
    // La nota nombra la zona del acuerdo. Sin ella, dos horarios idénticos en
    // pantalla podrían ser instantes distintos.
    notaEstimacion: `Acordado en ${e.zonaDelAcuerdo.split("/").pop()?.replace(/_/g, " ")}`,
    evidenciaEsperada: e.evidenciaEsperada,
    criterioCierre: e.criterioCierre,
    estadoResultante: CHIP[estado] ?? null,
    // El incumplido dice por qué su pantalla no se edita. Los demás estados no
    // tienen nada que avisar, y un aviso vacío ocupa lugar sin decir nada.
    aviso: estado === "MISSED" ? t("COMPROMISO.AVISO_INCUMPLIDO") : null,
    original: e.original ? originalDe(e.original, e.esRescate) : null,
    ctaPrimaria: ctaDe(estado),
  };
}

/** El original, como filas de sólo lectura. Sus valores no se recalculan. */
function originalDe(
  o: NonNullable<EstadoDeCompromiso["original"]>,
  esRescate: boolean,
): readonly FilaDato[] {
  return [
    { label: esRescate ? "Compromiso incumplido" : "Compromiso original", valor: o.state },
    { label: "Fecha", valor: `${fecha(o.inicioEn, o.zonaDelAcuerdo)} · ${hora(o.inicioEn, o.zonaDelAcuerdo)}` },
    { label: "Tiempo declarado", valor: `${o.minutosPlanificados} min` },
  ];
}
