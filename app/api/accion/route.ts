import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { accionDe, resolverSesion } from "@/lib/server/composicion";

/**
 * `GET /api/accion` — Controller de `UX03`. Etapa B2.6.
 *
 * `?accion=<uuid>` opcional: sin él, la Action viva del estudiante.
 */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  // El alta primero (ADR-052). El estudiante que no la completó no cae en un
  // HOY que afirma cosas sobre un recorrido que todavía no existe.
  const pendiente = altaPendiente(sesion.alta);
  if (pendiente) return NextResponse.json(pendiente, { status: 409 });

  const accion = new URL(request.url).searchParams.get("accion");
  const props = await accionDe(sesion.estudiante.institutionId, sesion.estudiante.id, accion);
  if (!props) return NextResponse.json({ error: "Sin acción vigente" }, { status: 404 });

  return NextResponse.json(props);
}
