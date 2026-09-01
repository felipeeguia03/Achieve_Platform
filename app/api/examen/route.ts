import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { preparacionDe, resolverSesion } from "@/lib/server/composicion";

/**
 * `GET /api/examen` — Controller de `UX08`. `?preparacion=<uuid>` opcional.
 *
 * Sin preparación devuelve `404` y no un overview vacío: un Modo Examen sin
 * preparación no existe, y dibujar el esqueleto sería el fallback silencioso
 * que la B2.6 vino a sacar.
 */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("preparacion");
  const props = await preparacionDe(sesion.estudiante.institutionId, sesion.estudiante.id, id);
  if (!props) return NextResponse.json({ error: "Sin preparación de examen" }, { status: 404 });

  return NextResponse.json(props);
}
