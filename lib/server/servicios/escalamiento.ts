/**
 * El puerto hacia donde va un caso que necesita una persona — Etapa B6.6.3.
 *
 * **El dominio no sabe adónde va.** Hoy aterriza en una cola sintética local;
 * mañana va a ser el CRM por el flujo A del contrato
 * ([`contrato-riesgo-candidato-v0.2.md`](../../../docs/contrato-riesgo-candidato-v0.2.md)),
 * probablemente pasando antes por un outbox. **Ninguna de esas tres cosas
 * cambia una línea de la regla de riesgo**, y ése es el único motivo por el que
 * este puerto existe.
 *
 * Es el mismo criterio con el que [ADR-032](../../../docs/decisions.md#adr-032)
 * dejó `DirectorioDeOperadores`: que la ausencia de una integración **sea un
 * lugar y no un descuido**.
 *
 * ## Lo que el puerto no tiene, a propósito
 *
 * Ni endpoint, ni HMAC, ni payload del CRM, ni política de reintentos. Todo eso
 * llega con el contrato, que [ADR-035](../../../docs/decisions.md#adr-035)
 * difirió. Inventarlo ahora obligaría a rehacerlo.
 */

/** Un caso listo para que alguien lo tome. */
export interface CasoEscalado {
  institutionId: string;
  riskSignalId: string;
  /** La identidad canónica que los dos sistemas comparten. */
  studentId: string;
  /**
   * La causa, en una frase. **Sale de la señal**: acá no se evalúa nada de
   * nuevo, ni se reescribe lo que la regla dijo.
   */
  explanation: string;
  /** Evidencia, apoyos y conteos que la persona necesita para leer el caso. */
  reviewContext: Record<string, unknown>;
}

export interface DestinoDeEscalamiento {
  /**
   * Deja el caso en el destino. **Idempotente por señal**: un replay devuelve el
   * mismo caso y no encola un segundo.
   */
  escalar(caso: CasoEscalado): Promise<{ id: string; duplicado: boolean }>;
}

/**
 * El destino de hoy, cuando no hay ninguno configurado.
 *
 * **No falla y no encola**: que el canal no exista no puede impedir que una
 * señal pida una persona. El circuito de dominio ya está cerrado sin esto, y
 * frenarlo detrás de una integración ausente sería exactamente lo que
 * `ADR-032` decidió no hacer con el directorio de operadores.
 */
export const sinDestino: DestinoDeEscalamiento = {
  async escalar() {
    return { id: "", duplicado: false };
  },
};
