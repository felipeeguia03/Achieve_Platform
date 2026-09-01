import { t } from "@/lib/content/es-AR";
import type { RequisitoDeReflexion } from "./reflexion";
import type { EstadoEvidencia, EvidenciaProps } from "@/lib/domain/view-models";

/**
 * `UX05` proyectada desde datos persistidos — Etapa B2.6.
 *
 * ## El requisito de `Reflection` — `ADR-026`
 *
 * Viene de `action.reflection_requirement`, congelado al crear la Action, y es
 * **ternario**. La diferencia que el booleano anterior borraba:
 *
 * | Requisito | Se ofrece la `CTA-016` | Bloquea el submit |
 * |---|---|---|
 * | `NO_CONFIGURADA` | no | no |
 * | `OPTIONAL` | **sí** | no |
 * | `REQUIRED` | sí | **sólo ese submit** |
 *
 * `OPTIONAL` no es *"no hay Reflection"*: la `CTA-016` aparece cuando está
 * **configurada** —así lo dice su condición en el registro canónico— y omitirla
 * es válido. Con el booleano, `false` no ofrecía nada, así que la Reflection
 * opcional no existía en la UI.
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
  requisitoDeReflexion: RequisitoDeReflexion;
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
    // `ADR-026`: se ofrece cuando está **configurada** —igual que la condición
    // de aparición de la `CTA-016`—, y `requerida` sólo marca si además bloquea.
    reflection:
      e.requisitoDeReflexion === "NO_CONFIGURADA"
        ? null
        : {
            titulo: t("CTA.AGREGAR_REFLEXION"),
            requerida: e.requisitoDeReflexion === "REQUIRED",
          },
    ctaPrimaria: ctaDe(e, estado),
    adjuntoPrevio: e.adjuntoPrevio,
  };
}

/**
 * Expuesto para el test: la Reflection bloquea el envío y **nada más**.
 *
 * Sólo `REQUIRED` bloquea. `OPTIONAL` se ofrece y se puede omitir — que es lo
 * que *opcional* quiere decir.
 */
export function envioBloqueadoPorReflexion(e: EstadoDeEvidencia): boolean {
  return e.requisitoDeReflexion === "REQUIRED" && !e.reflexionPresente;
}
