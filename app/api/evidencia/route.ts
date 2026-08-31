import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { evidenciaDe, resolverSesion } from "@/lib/server/composicion";

/**
 * `GET /api/evidencia` — Controller de `UX05`. `?evidencia=<uuid>` opcional.
 *
 * ⚠️ **No acepta el requisito de Reflection desde el request.** `C01-051` está
 * `OPEN`: si el cliente pudiera mandarlo, el navegador estaría decidiendo una
 * regla de negocio abierta. Cuando se cierre, entra por configuración del lado
 * del servidor.
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
  const props = await evidenciaDe(sesion.estudiante.institutionId, sesion.estudiante.id, id);
  if (!props) return NextResponse.json({ error: "Sin evidencia registrada" }, { status: 404 });

  return NextResponse.json(props);
}
