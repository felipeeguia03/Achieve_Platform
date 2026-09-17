import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { firmarGrabacionDeClase, resolverSesion } from "@/lib/server/composicion";

/**
 * `/api/clase/grabacion/firma` — la URL firmada para subir una grabación ·
 * [ADR-099](../../../../../docs/decisions.md#adr-099) §2.
 *
 * ⛔ **No empieza nada.** Se pide cuando el estudiante ya grabó y tocó *Detener*.
 * Sólo con la clase activa.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function sesionDe(request: Request) {
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

const leer = async (request: Request) => ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
const malPedido = (error: string) => NextResponse.json({ error }, { status: 400 });


/** `POST { clase, mime, bytes }` → `{ clave, url, token }`. */
export async function POST(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;
  const c = await leer(request);
  if (typeof c.clase !== "string" || !UUID.test(c.clase)) return NextResponse.json({ error: "No se encontró esa clase" }, { status: 404 });

  const r = await firmarGrabacionDeClase(s.estudiante.institutionId, {
    studentId: s.estudiante.id,
    claseId: c.clase,
    mime: c.mime,
    bytes: c.bytes,
  });
  switch (r.estado) {
    case "OK":
      return NextResponse.json({ clave: r.clave, url: r.url, token: r.token });
    case "NO_ENCONTRADA":
      return NextResponse.json({ error: "No se encontró esa clase" }, { status: 404 });
    case "TIPO_NO_ADMITIDO":
      return malPedido("Ese formato de audio no se puede subir");
    case "DEMASIADO_GRANDE":
      return malPedido("La grabación supera los 50 MB");
    case "CLASE_TERMINADA":
      return NextResponse.json({ error: "La clase ya terminó", motivo: "CLASE_TERMINADA" }, { status: 409 });
  }
}
