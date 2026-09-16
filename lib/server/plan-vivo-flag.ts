/**
 * `PLAN_VIVO_CALENDAR_INTEGRATION=1` — [ADR-110](../../docs/decisions.md#adr-110).
 *
 * **Se lee en el servidor, en cada pedido.** Sin la variable, `/calendario` es
 * exactamente ADR-100 y `GET /api/plan-vivo` responde `404`. No importa
 * `server-only` a propósito: el layout y la página también lo leen, y los tests
 * lo prueban sin levantar Next.
 */
export function planVivoEnCalendario(): boolean {
  return process.env.PLAN_VIVO_CALENDAR_INTEGRATION === "1";
}
