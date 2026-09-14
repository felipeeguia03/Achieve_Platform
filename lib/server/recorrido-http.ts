import "server-only";

import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "./http";
import { resolverSesion } from "./composicion";

/**
 * La sesión del estudiante para las rutas de `/recorrido` —
 * [ADR-106](../../docs/decisions.md#adr-106) y [ADR-107](../../docs/decisions.md#adr-107).
 * `401`, `403` sin padrón, `409` con el alta pendiente (ADR-052): el recorrido
 * vive **después** de HOY.
 *
 * ⚠️ **El estudiante sale de la sesión, nunca del pedido**, y lo ajeno es `404`.
 */
export async function estudianteDelRecorrido(request: Request) {
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

export const UUID_DEL_RECORRIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
