import { t } from "@/lib/content/es-AR";
import type { EstadoEvidencia, EvidenciaProps } from "@/lib/domain/view-models";

/**
 * `UX05` proyectada desde datos persistidos — Etapa B2.6.
 *
 * ## `C01-051` no se cierra desde acá
 *
 * Si una `Reflection` es obligatoria o no es **configuración que nadie decidió**
 * (`C01-051`, `OPEN`, gate `H`). La Etapa B2.4 resolvió esto en el Service de
 * escritura —*el requisito entra por parámetro, no hay tabla de configuración ni
 * default*— y esta proyección sostiene el mismo criterio: `reflexionRequerida`
 * llega de afuera. Elegir un default acá cerraría `C01-051` desde el código, que
 * es exactamente lo que el anexo de decisiones existe para impedir.
 *
 * ## Lo que el lifecycle sí decide
 *
 * Los siete estados de `Evidence` son contrato cerrado y se proyectan tal cual.
 * Dos reglas que se rompen solas si uno mira el schema sin mirar el producto:
 *
 * - **`UNDER_REVIEW` exige una instancia real de revisión.** Un método
 *   configurado no alcanza (`I5`), así que si el hecho no llegó, la pantalla no
 *   dice que alguien está revisando.
 * - **`SUBMITTED` no es suficiencia.** Enviar no es suficiente, suficiente no es
 *   validado, validado no es dominio.
 */

export interface EstadoDeEvidencia {
  instante: string;
  zona: string;
  evidenciaId: string;
  lifecycle: string;
  materia: string;
  unidad: string | null;
  objetivo: string;
  evidenciaEsperada: string | null;
  criterioCierre: string | null;
  reflexionRequerida: boolean;
  reflexionPresente: boolean;
  adjuntoPrevio: string | null;
  esResubmission: boolean;
  razonResubmission: string | null;
  revisionReal: boolean;
  tardia: boolean;
}

export interface RepositorioDeEvidencia {
  estadoDeEvidencia(
    institutionId: string,
    studentId: string,
    ahora: string,
    evidenceId?: string | null,
    reflexionRequerida?: boolean,
  ): Promise<EstadoDeEvidencia | null>;
}

const LIFECYCLE = new Set<EstadoEvidencia>([
  "EXPECTED", "SUBMITTED", "UNDER_REVIEW", "SUFFICIENT",
  "INSUFFICIENT", "RESUBMISSION_REQUESTED", "VALIDATED",
]);

/** El lifecycle en copy de producto. **El enum crudo nunca se muestra.** */
const VISIBLE: Record<string, string> = {
  EXPECTED: "Todavía no entregaste esta evidencia",
  SUBMITTED: "Entregada · todavía no revisada",
  UNDER_REVIEW: "En revisión",
  SUFFICIENT: "Suficiente · falta validar",
  INSUFFICIENT: "Necesita cambios",
  RESUBMISSION_REQUESTED: "Te pidieron volver a entregarla",
  VALIDATED: "Validada",
};

function estadoDe(e: EstadoDeEvidencia): EstadoEvidencia {
  // Tardía gana como encuadre: cambia qué significa la entrega, no su lifecycle.
  if (e.tardia && e.lifecycle === "SUBMITTED") return "TARDIA";
  return LIFECYCLE.has(e.lifecycle as EstadoEvidencia)
    ? (e.lifecycle as EstadoEvidencia)
    : "EXPECTED";
}

/**
 * La CTA. **`null` ⇒ no hay entrega posible y no se renderiza.**
 *
 * Una Reflection requerida y ausente **bloquea el envío, y sólo eso**: no emite
 * ningún juicio sobre la evidencia ni sobre el dominio (Etapa B2.4).
 */
function ctaDe(e: EstadoDeEvidencia, estado: EstadoEvidencia): EvidenciaProps["ctaPrimaria"] {
  if (estado === "EXPECTED" || estado === "RESUBMISSION_REQUESTED") {
    return { texto: t("CTA.ENVIAR_EVIDENCIA"), habilitada: !envioBloqueadoPorReflexion(e) };
  }
  // Enviada, en revisión o validada: no hay nada que el estudiante pueda hacer
  // acá, y una CTA deshabilitada de adorno sería peor que ninguna.
  return null;
}

export function proyectarEvidencia(e: EstadoDeEvidencia): EvidenciaProps {
  const estado = estadoDe(e);

  return {
    estado,
    contexto: `Cursado · ${e.materia}`,
    titulo: e.objetivo,
    unidad: e.unidad,
    evidenciaEsperada: e.evidenciaEsperada,
    criterioCierre: e.criterioCierre,
    // Qué formatos acepta una Action es contenido ejecutable: `C01-008`, gate
    // `H`. Sin ese contrato la línea desaparece en vez de inventar una lista.
    formatosPermitidos: null,
    // El nombre del adjunto sintético es del Track A; con datos reales el
    // adjunto es el que ya subió el estudiante, o ninguno.
    nombreAdjuntoDemo: "",
    estadoVisible: VISIBLE[e.lifecycle] ?? null,
    aviso: e.esResubmission ? e.razonResubmission : null,
    // ⚠️ `C01-051`: el requisito llega por parámetro. Si nadie lo declaró, no se
    // ofrece una Reflection obligatoria que nadie configuró.
    reflection: e.reflexionRequerida
      ? { titulo: t("CTA.AGREGAR_REFLEXION"), requerida: true }
      : null,
    ctaPrimaria: ctaDe(e, estado),
    adjuntoPrevio: e.adjuntoPrevio,
  };
}

/** Expuesto para el test: la Reflection bloquea el envío y **nada más**. */
export function envioBloqueadoPorReflexion(e: EstadoDeEvidencia): boolean {
  return e.reflexionRequerida && !e.reflexionPresente;
}
