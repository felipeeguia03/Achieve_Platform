"use client";

import { createContext, useContext } from "react";

/**
 * El flag del Plan vivo, del lado del navegador — [ADR-110](../../docs/decisions.md#adr-110).
 *
 * **Lo decide el servidor**: el layout lee `PLAN_VIVO_CALENDAR_INTEGRATION` y lo
 * baja por contexto. Así el Calendario elige su vista igual en la página que
 * adentro de una ventana del espacio de trabajo. Sin provider, `false`.
 */
const Contexto = createContext(false);

export function ProveedorDePlanVivo({ activo, children }: { activo: boolean; children: React.ReactNode }) {
  return <Contexto.Provider value={activo}>{children}</Contexto.Provider>;
}

export const usePlanVivoActivo = () => useContext(Contexto);
