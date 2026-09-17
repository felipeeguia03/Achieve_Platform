/**
 * `PLAN_VIVO=1` — [ADR-110](../../docs/decisions.md#adr-110) y su
 * [Enmienda 1](../../docs/decisions.md#adr-110-enmienda-1).
 *
 * **Se lee en el servidor, en cada pedido.** Sin la variable no hay Plan vivo en
 * ningún lado: `/plan` responde `404`, `GET /api/plan-vivo` responde `404` y la
 * barra lateral no dibuja *Mi plan*.
 *
 * ⚠️ **Se llamaba `PLAN_VIVO_CALENDAR_INTEGRATION`**, y el nombre dejó de ser
 * cierto con la Enmienda 1: ya no integra nada al Calendario, que volvió a ser
 * exactamente ADR-100. `PLAN_VIVO` es el nombre que ADR-109 D-09 había propuesto.
 *
 * No importa `server-only` a propósito: el layout y las páginas también lo leen,
 * y los tests lo prueban sin levantar Next.
 */
export function planVivoActivo(): boolean {
  return process.env.PLAN_VIVO === "1";
}
