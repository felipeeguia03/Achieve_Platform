import "server-only";

import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "./http";
import { resolverSesion } from "./composicion";

/**
 * La sesión del estudiante para las rutas de **Modo Focus** —
 * [ADR-104](../../docs/decisions.md#adr-104). Las cinco rutas la resuelven
 * igual: `401`, `403` sin padrón, `409` con el alta pendiente (ADR-052).
 *
 * ⚠️ **Lo ajeno es `404`, nunca `403`**, y el estudiante sale de la sesión, nunca
 * del pedido.
 */
export async function estudianteDeFocus(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) } as const;
  }
  if (sesion.estado === "SIN_PADRON") {
    return { error: NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 }) } as const;
  }
  const pendiente = altaPendiente(sesion.alta);
  if (pendiente) return { error: NextResponse.json(pendiente, { status: 409 }) } as const;
  return { estudiante: sesion.estudiante } as const;
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const sesionNoEncontrada = () => NextResponse.json({ error: "No se encontró esa sesión" }, { status: 404 });
