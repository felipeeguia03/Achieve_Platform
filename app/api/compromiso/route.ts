import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { compromisoDe, resolverSesion } from "@/lib/server/composicion";

/** `GET /api/compromiso` — Controller de `UX04`. `?compromiso=<uuid>` opcional. */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("compromiso");
  const props = await compromisoDe(sesion.estudiante.institutionId, sesion.estudiante.id, id);
  if (!props) return NextResponse.json({ error: "Sin compromiso registrado" }, { status: 404 });

  return NextResponse.json(props);
}
