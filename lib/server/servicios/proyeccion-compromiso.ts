import { MOTIVO_DE_CAMBIO, t } from "@/lib/content/es-AR";
import { cambioDeHorarioPosible } from "@/lib/domain/renegociacion";
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
  /** La del **estudiante**: a qué hora ve él su propio día. */
  zona: string;
  /**
   * La de la **institución** ([ADR-049](../../../docs/decisions.md#adr-049)):
   * define el «día calendario» del cambio de horario. No es la de arriba.
   */
  zonaInstitucional: string;
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
/** El estado del lifecycle, sin el encuadre de rescate o renegociación. */
function lifecycleDe(e: EstadoDeCompromiso): EstadoCompromiso {
  return ESTADOS.has(e.state as EstadoCompromiso) ? (e.state as EstadoCompromiso) : "DRAFT";
}

function estadoDe(e: EstadoDeCompromiso): EstadoCompromiso {
  if (e.esRescate) return "RESCATE";
  if (e.esRenegociacion) return "RENEGOCIACION";
  return lifecycleDe(e);
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
/**
 * ## Y la decide el **lifecycle**, no el encuadre — ADR-050
 *
 * Hasta acá la CTA salía de `estadoDe()`, donde el rescate y la renegociación
 * ganan sobre el lifecycle. Eso valía cuando el sucesor todavía no existía y la
 * pantalla servía para confirmarlo. **Desde ADR-050 no existe ese momento:** el
 * cambio de horario se confirma en el bloque y el sucesor nace `CONFIRMED`, así
 * que la pantalla que se ve después ofrecía *«Confirmar compromiso»* sobre algo
 * ya confirmado — y sobre un sucesor incumplido, en vez de *«Retomar»*.
 *
 * El encuadre no se pierde: de dónde viene el compromiso lo cuenta el bloque
 * del original, que sigue arriba y sin editar. Lo que la CTA tiene que decir es
 * **qué hacer ahora**, y eso lo sabe el lifecycle.
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

/**
 * El bloque de «Cambiar horario» — ADR-050.
 *
 * **Devuelve `null` sólo cuando no hay nada que decir**: un estado terminal no
 * necesita explicar que no se puede mover algo que ya terminó. En todos los
 * demás casos devuelve la oferta **o el motivo**, porque un botón apagado sin
 * explicación es lo que el Product Owner descartó expresamente.
 */
function cambioDeHorarioDe(e: EstadoDeCompromiso): CompromisoProps["cambioDeHorario"] {
  const r = cambioDeHorarioPosible({
    estado: e.state as Parameters<typeof cambioDeHorarioPosible>[0]["estado"],
    // Un compromiso que ya es sucesor de otro gastó la única renegociación de
    // su cadena. `esRenegociacion` es ese hecho.
    renegociadoDeId: e.esRenegociacion ? e.compromisoId : null,
    inicioOriginal: e.inicioEn,
    ahora: e.instante,
    zonaInstitucional: e.zonaInstitucional,
  });

  if (r.sePuede) {
    return {
      sePuede: true,
      horaActual: hora(e.inicioEn, e.zonaDelAcuerdo),
      // La etiqueta se lee en la zona **del acuerdo**, igual que el horario
      // actual: si no, el estudiante compararía dos relojes distintos.
      horarios: r.horarios.map((valor) => ({ valor, etiqueta: hora(valor, e.zonaDelAcuerdo) })),
    };
  }

  /*
    `MOTIVO_DE_CAMBIO` es la única tabla motivo→copy, y vive en `es-AR.ts`
    porque la comparte con la pantalla: ahí se usa cuando el servidor
    contradice lo que acá se proyectó. Dos tablas serían dos verdades.

    Un motivo sin copy —`SIN_ACUERDO_ORIGINAL`— devuelve `null`: la pantalla
    no dice nada en vez de mostrar un código.
  */
  const motivo = MOTIVO_DE_CAMBIO[r.motivo];
  return motivo ? { sePuede: false, motivo } : null;
}

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
    // Por lo mismo: un sucesor incumplido sigue siendo un incumplido, y el
    // aviso que lo dice no lo tapa el encuadre de la renegociación.
    aviso: lifecycleDe(e) === "MISSED" ? t("COMPROMISO.AVISO_INCUMPLIDO") : null,
    original: e.original ? originalDe(e.original, e.esRescate) : null,
    ctaPrimaria: ctaDe(lifecycleDe(e)),
    cambioDeHorario: cambioDeHorarioDe(e),
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
