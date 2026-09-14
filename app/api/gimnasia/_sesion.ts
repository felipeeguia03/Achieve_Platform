import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { resolverSesion } from "@/lib/server/composicion";

/**
 * La sesión de las rutas de **Gimnasia cognitiva** — [ADR-102](../../../docs/decisions.md#adr-102).
 *
 * `401` sin token, `403` sin padrón, `409 ALTA_INCOMPLETA` antes que nada —igual
 * que las nueve superficies—. El estudiante, su institución y su zona **salen de
 * la sesión, nunca del pedido**: no hay `studentId` que mandar.
 */
export async function estudianteDe(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) } as const;
  }
  if (sesion.estado === "SIN_PADRON") {
    return { error: NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 }) } as const;
  }
  const pendiente = altaPendiente(sesion.alta);
  if (pendiente) return { error: NextResponse.json(pendiente, { status: 409 }) } as const;
  const { institutionId, id, timezone } = sesion.estudiante;
  return { institutionId, estudiante: { studentId: id, zona: timezone } } as const;
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lo ajeno es `404`, nunca `403`: `403` confirmaría que existe. */
export const noEncontrado = (que: string) => NextResponse.json({ error: `No se encontró ${que}` }, { status: 404 });

export const rechazado = (error: string, motivo: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, motivo, ...extra }, { status: 409 });

export const invalido = (error: string) => NextResponse.json({ error }, { status: 400 });

/** El cuerpo como objeto, o `null`. Nunca lanza. */
export async function cuerpoDe(request: Request): Promise<Record<string, unknown> | null> {
  const c = await request.json().catch(() => null);
  return c && typeof c === "object" && !Array.isArray(c) ? (c as Record<string, unknown>) : null;
}

/** Una clave de idempotencia usable: texto corto, no vacío. */
export const claveDe = (v: unknown): string | null =>
  typeof v === "string" && v.trim() !== "" && v.length <= 100 ? v : null;
