import type { SeveridadDeRiesgo } from "./types";

/**
 * La regla mínima de `C01-021`, **pura** — Etapa B6.5.
 *
 * ⚠️ **PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION.** Los números no están
 * acá: llegan en `UmbralDeReiteracion`, que sale de `risk_rule.threshold_config`
 * ([ADR-036](../../docs/decisions.md#adr-036)). Este archivo sabe **cómo se
 * cuenta**, no **cuánto hace falta** — y esa separación es lo que permite que la
 * psicopedagoga cambie el umbral cargando una fila, sin tocar código.
 *
 * ## Lo que cuenta, y lo que no
 *
 * **Cuenta el tipo de error, no el tema.** Decisión del PO, textual: el tema
 * *"es contexto explicativo"*, y dos errores del mismo tipo cuentan aunque
 * ocurran en ejercicios distintos.
 *
 * **No cuenta lo que nadie corroboró.** Un error inferido o ambiguo no
 * incrementa nada, y tampoco reinicia nada: una resolución limpia que nadie
 * verificó no puede borrar un contador.
 *
 * **No hay probabilidad ni score.** Es un conteo sobre una lista ordenada. El
 * mismo input da el mismo output siempre, y por eso los tests son
 * determinísticos.
 */

/** Una observación, ya normalizada. El orden lo pone quien la lee. */
export interface ObservacionDeError {
  kind: "error" | "resolucion_limpia";
  /** Sin esto no cuenta ni reinicia: es el punto 6 de `C01-036`. */
  corroborated: boolean;
  observedAt: string;
  /** Ocurrió después de una acción correctiva. **Declarado, nunca inferido.** */
  trasAccionCorrectiva: boolean;
}

/** Lo que sale de `threshold_config`. Ningún número está hardcodeado acá. */
export interface UmbralDeReiteracion {
  apariciones: { atencion: number; intervencion: number };
  /** Severidad de una reaparición tras una correctiva. `null` ⇒ no aplica. */
  reincidenciaTrasCorrectiva: SeveridadDeRiesgo | null;
  reiniciaConResolucionLimpia: boolean;
  soloCorroboradas: boolean;
}

export interface Reiteracion {
  /** Apariciones desde el último reinicio. */
  apariciones: number;
  /** `null` ⇒ todavía no alcanza ningún umbral. **No es "bajo".** */
  severidad: SeveridadDeRiesgo | null;
  necesitaPersona: boolean;
  /**
   * Por qué, en texto. El spec lo exige dos veces: *"nunca un score opaco como
   * única salida"*. Sin esto la señal no se puede ni registrar.
   */
  motivo: string | null;
}

/**
 * Cuenta las apariciones del mismo tipo desde el último reinicio, y traduce el
 * conteo a severidad.
 *
 * **La reincidencia tras una correctiva exige que ya hubiera pasado antes.** El
 * PO lo dijo como *"una **nueva** aparición después de una acción correctiva
 * fallida"*, y una primera aparición no es una reincidencia: sería castigar el
 * primer error de alguien que justo venía de otra cosa.
 */
export function evaluarReiteracion(
  observaciones: readonly ObservacionDeError[],
  umbral: UmbralDeReiteracion,
  etiquetaDelTipo: string,
): Reiteracion {
  const ordenadas = [...observaciones].sort((a, b) => a.observedAt.localeCompare(b.observedAt));

  let apariciones = 0;
  let ultimaTrasCorrectiva = false;

  for (const o of ordenadas) {
    // Ni cuenta ni reinicia: una observación sin corroborar no es un hecho.
    if (umbral.soloCorroboradas && !o.corroborated) continue;

    if (o.kind === "resolucion_limpia") {
      if (umbral.reiniciaConResolucionLimpia) {
        apariciones = 0;
        ultimaTrasCorrectiva = false;
      }
      continue;
    }

    apariciones++;
    ultimaTrasCorrectiva = o.trasAccionCorrectiva;
  }

  if (apariciones === 0) {
    return { apariciones: 0, severidad: null, necesitaPersona: false, motivo: null };
  }

  const reincide =
    umbral.reincidenciaTrasCorrectiva !== null && ultimaTrasCorrectiva && apariciones >= 2;

  const severidad: SeveridadDeRiesgo | null = reincide
    ? umbral.reincidenciaTrasCorrectiva
    : apariciones >= umbral.apariciones.intervencion
      ? "intervencion"
      : apariciones >= umbral.apariciones.atencion
        ? "atencion"
        : null;

  if (severidad === null) {
    return { apariciones, severidad: null, necesitaPersona: false, motivo: null };
  }

  const veces = `${apariciones} ${apariciones === 1 ? "vez" : "veces"}`;
  const motivo = reincide
    ? `${etiquetaDelTipo}: volvió a aparecer después de una acción correctiva, ${veces} en esta preparación`
    : `${etiquetaDelTipo}: ${veces} en la preparación de este examen`;

  return { apariciones, severidad, necesitaPersona: severidad === "intervencion", motivo };
}

/**
 * Lee el umbral desde el JSON de configuración.
 *
 * **Devuelve `null` si la regla no tiene umbral**, y eso no es un error: es una
 * regla que nadie configuró todavía, y el llamador tiene que no evaluar nada.
 * Poner defaults acá sería inventar el umbral que `C01-036` no cerró.
 */
export function umbralDesdeConfig(config: unknown): UmbralDeReiteracion | null {
  if (config === null || typeof config !== "object") return null;
  const c = config as Record<string, unknown>;
  const ap = c.apariciones as Record<string, unknown> | undefined;
  if (!ap || typeof ap.atencion !== "number" || typeof ap.intervencion !== "number") return null;

  const reincidencia = c.reincidencia_tras_correctiva;
  return {
    apariciones: { atencion: ap.atencion, intervencion: ap.intervencion },
    reincidenciaTrasCorrectiva:
      typeof reincidencia === "string" ? (reincidencia as SeveridadDeRiesgo) : null,
    reiniciaConResolucionLimpia: c.reinicia_con_resolucion_limpia === true,
    soloCorroboradas: c.solo_corroboradas === true,
  };
}
