import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { progresoDe, resolverSesion } from "@/lib/server/composicion";

/**
 * `GET /api/progreso` — Controller de `UX06`. `?evidencia=<uuid>` opcional.
 *
 * Sin cursada activa devuelve `404`, no una pantalla vacía: no hay progreso de
 * una materia que el estudiante no está cursando, y dibujar el esqueleto sin
 * datos sería el mismo fallback silencioso que la `B2.6` vino a sacar.
 */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("evidencia");
  const props = await progresoDe(sesion.estudiante.institutionId, sesion.estudiante.id, id);
  if (!props) return NextResponse.json({ error: "Sin cursada activa" }, { status: 404 });

  return NextResponse.json(props);
}
