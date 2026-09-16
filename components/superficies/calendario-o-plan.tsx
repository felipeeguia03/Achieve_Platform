"use client";

import { usePlanVivoActivo } from "@/lib/client/plan-vivo-flag";
import type { PropsDeSuperficie } from "./consulta";
import { VistaDeCalendario } from "./calendario";
import { VistaDePlanVivo } from "./plan-vivo";

/**
 * El nodo `CALENDARIO` elige su vista — [ADR-110](../../docs/decisions.md#adr-110).
 *
 * Sin `PLAN_VIVO_CALENDAR_INTEGRATION=1`, **exactamente** ADR-100. Con el flag,
 * el Plan vivo. No es otra ruta ni otro nodo.
 */
export function VistaDelCalendario(props: PropsDeSuperficie) {
  return usePlanVivoActivo() ? <VistaDePlanVivo {...props} /> : <VistaDeCalendario {...props} />;
}
