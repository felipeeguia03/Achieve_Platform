import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { borrarEtiquetaDeGrabacion, etiquetarGrabacion, resolverSesion } from "@/lib/server/composicion";

/**
 * `/api/clase/grabacion/etiqueta` — etiquetar una grabación ·
 * [ADR-099](../../../../../docs/decisions.md#adr-099) §3.
 *
 * ⚠️ **Una etiqueta no es una marca**: es texto del estudiante sobre un archivo.
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


/** `POST { grabacion, texto, segundo? }` — `segundo: null` ⇒ de la grabación entera. */
export async function POST(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;
  const c = await leer(request);
  if (typeof c.grabacion !== "string" || !UUID.test(c.grabacion)) {
    return NextResponse.json({ error: "No se encontró esa grabación" }, { status: 404 });
  }
  const r = await etiquetarGrabacion(s.estudiante.institutionId, {
    studentId: s.estudiante.id,
    grabacionId: c.grabacion,
    texto: c.texto,
    segundo: c.segundo ?? null,
  });
  switch (r.estado) {
    case "OK":
      return NextResponse.json({ etiqueta: r.etiqueta }, { status: 201 });
    case "NO_ENCONTRADA":
      return NextResponse.json({ error: "No se encontró esa grabación" }, { status: 404 });
    case "ETIQUETA_INVALIDA":
      return malPedido("La etiqueta no es válida");
  }
}

/** `DELETE { etiqueta }`. */
export async function DELETE(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;
  const c = await leer(request);
  if (typeof c.etiqueta !== "string" || !UUID.test(c.etiqueta)) {
    return NextResponse.json({ error: "No se encontró esa etiqueta" }, { status: 404 });
  }
  const r = await borrarEtiquetaDeGrabacion(s.estudiante.institutionId, { studentId: s.estudiante.id, etiquetaId: c.etiqueta });
  return r.estado === "OK"
    ? NextResponse.json({ borrada: c.etiqueta })
    : NextResponse.json({ error: "No se encontró esa etiqueta" }, { status: 404 });
}
