/**
 * El puerto de auditoría — Fase B6.
 *
 * `audit_log` existe desde la Etapa B1.5, es append-only y **nadie la
 * escribía**. Esta fase es donde deja de ser decorativa, porque es la primera
 * que el spec nombra explícitamente: *"Auditoría: registrar cambios de caminos,
 * `RiskSignals`, `Evidence`, intervenciones y accesos críticos"* (Parte I §31).
 *
 * **Es distinta de `product_event`, y las dos existen a propósito.** El evento
 * de producto dice *qué le pasó al estudiante* y alimenta la Bitácora y las
 * métricas; la auditoría dice *quién tocó qué y cómo estaba antes*, y existe
 * para responderle a una institución o a un regulador. Un mismo hecho puede
 * generar los dos, y ninguno reemplaza al otro.
 */
export interface EntradaDeAuditoria {
  institutionId: string;
  /** Quién lo hizo. `null` sólo si lo hizo el sistema. */
  actorId: string | null;
  /** Verbo de la acción: `risk_signal.transition`, `intervention.close`. */
  accion: string;
  targetType: string;
  targetId: string;
  /** Cómo estaba antes y cómo quedó. Es lo que distingue auditar de loguear. */
  antes?: Record<string, unknown> | null;
  despues?: Record<string, unknown> | null;
}

export interface Auditor {
  registrar(entrada: EntradaDeAuditoria): Promise<void>;
}
