/**
 * Cuándo se recomienda Modo Examen — [ADR-048](../../docs/decisions.md#adr-048).
 *
 * ## Las dos cosas que la decisión desacopla, y son las caras
 *
 * ⚠️ **No depende de `PreparationReadiness`.** Textual del Product Owner: *"los
 * umbrales de readiness continúan abiertos y **no deben bloquear este
 * disparador**"*. Son dos decisiones distintas y `C01-029` sigue abierta. Este
 * módulo no importa nada de readiness, y ese vacío es la decisión.
 *
 * ⚠️ **Sin fecha confiable no se emite, y no se inventa una.** *"El sistema no
 * inventa una ni emite automáticamente el evento"*. Por eso la fecha entra
 * `string | null` y el `null` tiene su propio motivo, en vez de resolverse con
 * un default que nadie declaró.
 */

/** Catorce días calendario, **incluyendo el día 14**. */
export const DIAS_DE_VENTANA = 14;

export type VentanaDeExamen =
  | { recomendar: true; diasRestantes: number }
  | {
      recomendar: false;
      motivo:
        /** No hay fecha. **No se estima una**: la recomendación no sale. */
        | "SIN_FECHA"
        /** La fecha ya pasó: conocida, pero no vigente. */
        | "FECHA_PASADA"
        /** Todavía falta más que la ventana. */
        | "TODAVIA_LEJOS";
      diasRestantes: number | null;
    };

/** `YYYY-MM-DD` en la zona pedida. El día calendario, no el instante. */
function diaEn(instante: string, zona: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: zona,
  }).format(new Date(instante));
}

/**
 * Días calendario entre dos fechas `YYYY-MM-DD`.
 *
 * Se cuentan sobre `Date.UTC` de los tres números, **no sobre los instantes**:
 * así el resultado no lo mueve un cambio de horario de verano en el medio, que
 * es lo que convertiría trece días en trece días y veintitrés horas.
 */
function diasEntre(desde: string, hasta: string): number {
  const [ad, am, aa] = [desde.slice(8, 10), desde.slice(5, 7), desde.slice(0, 4)];
  const [bd, bm, ba] = [hasta.slice(8, 10), hasta.slice(5, 7), hasta.slice(0, 4)];
  const a = Date.UTC(Number(aa), Number(am) - 1, Number(ad));
  const b = Date.UTC(Number(ba), Number(bm) - 1, Number(bd));
  return Math.round((b - a) / 86_400_000);
}

export function ventanaDeExamen(entrada: {
  /** `assessment_date`, ya en `YYYY-MM-DD`. `null` ⇒ no se conoce. */
  fechaDeExamen: string | null;
  ahora: string;
  /** La zona de la **institución** (ADR-049), no la del estudiante. */
  zonaInstitucional: string;
}): VentanaDeExamen {
  if (!entrada.fechaDeExamen) {
    return { recomendar: false, motivo: "SIN_FECHA", diasRestantes: null };
  }

  const dias = diasEntre(diaEn(entrada.ahora, entrada.zonaInstitucional), entrada.fechaDeExamen);

  // "Conocida y **vigente**": el día del examen todavía cuenta, el siguiente no.
  if (dias < 0) return { recomendar: false, motivo: "FECHA_PASADA", diasRestantes: dias };
  if (dias > DIAS_DE_VENTANA) {
    return { recomendar: false, motivo: "TODAVIA_LEJOS", diasRestantes: dias };
  }
  return { recomendar: true, diasRestantes: dias };
}
