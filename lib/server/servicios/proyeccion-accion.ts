import { provenanceVisible, type SourceType, type VerificationStatus } from "@/lib/content/provenance";
import { t } from "@/lib/content/es-AR";
import type { EstadoAccion, ProximaAccionProps } from "@/lib/domain/view-models";

/**
 * `UX03` proyectada desde datos persistidos — Etapa B2.6.
 *
 * ## Los tres estados críticos que no se derivan, y por qué
 *
 * `EstadoAccion` tiene siete valores. Desde la base salen cuatro
 * —`NORMAL`, `BLOQUEADA`, `REEMPLAZADA`, `SIN_RECURSO`—, y los otros tres
 * **no se infieren**:
 *
 * - `INCERTIDUMBRE` es una Action cuyo objetivo es reducir una duda, no
 *   producir. Se parece a *"sin `expected_evidence`"*, pero eso también pasa
 *   cuando el contrato de contenido está incompleto (`C01-008`, gate `H`).
 *   Confundirlos haría que un dato faltante se muestre como una decisión
 *   pedagógica.
 * - `RAZON_NO_CONFIRMADA` necesita la procedencia **de la razón**, y
 *   `action_recommendation` no la guarda: el ADE emite el texto, no su fuente.
 * - `CORRECCION` es una Action nacida de una corrección de dato, que es
 *   `C01-009`.
 *
 * Los tres siguen alcanzables desde el catálogo sintético con `?escenario=`,
 * que es donde viven los estados críticos.
 */

export interface EstadoDeAccion {
  instante: string;
  zona: string;
  accionId: string;
  status: string;
  materia: string;
  unidad: string | null;
  objetivo: string;
  verbo: string;
  alcance: string;
  razon: string | null;
  minutosMin: number | null;
  minutosMax: number | null;
  evidenciaEsperada: string | null;
  criterioCierre: string | null;
  bloqueoRazon: string | null;
  reemplazada: boolean;
  recurso: {
    titulo: string;
    fuente: SourceType | null;
    verificacion: VerificationStatus | null;
  } | null;
  compromisoVivo: boolean;
}

export interface RepositorioDeAccion {
  estadoDeAccion(
    institutionId: string,
    studentId: string,
    ahora: string,
    actionId?: string | null,
  ): Promise<EstadoDeAccion | null>;
}

/** *"60–75 min"* o *"45 min"*. Sin estimación, la línea entera desaparece. */
function duracionDe(min: number | null, max: number | null): string | null {
  if (min && max && min !== max) return `${min}–${max} min`;
  const uno = max ?? min;
  return uno ? `${uno} min` : null;
}

function estadoDe(e: EstadoDeAccion): EstadoAccion {
  if (e.status === "BLOCKED") return "BLOQUEADA";
  if (e.reemplazada || e.status === "REPLACED") return "REEMPLAZADA";
  if (!e.recurso) return "SIN_RECURSO";
  return "NORMAL";
}

/**
 * La CTA primaria. **`null` ⇒ no se renderiza**, nunca deshabilitada de adorno.
 *
 * Una Action bloqueada no ofrece comprometerse: `P-01` pide que la interfaz
 * explique la regla, y el aviso ya dice por qué. Una que ya tiene compromiso
 * vivo tampoco: comprometerse dos veces con lo mismo no es una operación.
 */
function ctaDe(e: EstadoDeAccion): ProximaAccionProps["ctaPrimaria"] {
  if (e.status === "BLOCKED" || e.reemplazada || e.status === "REPLACED") return null;
  if (e.compromisoVivo) return { texto: t("CTA.VER_COMPROMISO"), habilitada: true };
  return { texto: t("CTA.ME_COMPROMETO"), habilitada: true };
}

export function proyectarAccion(e: EstadoDeAccion): ProximaAccionProps {
  const estado = estadoDe(e);

  return {
    estado,
    contexto: `Cursado · ${e.materia}`,
    unidad: e.unidad ?? "",
    titulo: e.objetivo,
    razon: e.razon,
    duracion: duracionDe(e.minutosMin, e.minutosMax),
    recurso: e.recurso?.titulo ?? null,
    evidenciaEsperada: e.evidenciaEsperada,
    criterioCierre: e.criterioCierre,
    // `queSigue` no está en el contrato de `action` (`C01-008`, gate `H`): la
    // línea desaparece en vez de rellenarse con una frase de relleno.
    queSigue: null,
    // Sin recurso no hay procedencia que mostrar; con recurso, la que haya —y
    // `resource` no guarda verificación, así que dice que no está disponible en
    // vez de presentarlo como oficial.
    provenanceRecurso: e.recurso
      ? provenanceVisible(e.recurso.fuente, e.recurso.verificacion)
      : null,
    // El bloqueo explica o no ocurre: el Service ya rechaza un `BLOCKED` sin
    // razón, así que si llegó acá la tiene.
    aviso: e.status === "BLOCKED" ? e.bloqueoRazon : null,
    ctaPrimaria: ctaDe(e),
  };
}
