import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { materiaDe, resolverSesion } from "@/lib/server/composicion";

/**
 * `GET /api/materia` — Controller de `UX02`. Etapa B2.6.
 *
 * Devuelve exactamente el `MateriaProps` que la pantalla ya sabe recibir.
 *
 * Acepta `?cursada=<uuid>` **opcional**. Sin él, el Service elige la cursada de
 * la Action viva. El `institutionId` y el `studentId` **nunca** vienen del
 * request: salen de la sesión, y el scoping por institución los usa a los dos.
 */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const cursada = new URL(request.url).searchParams.get("cursada");
  const props = await materiaDe(
    sesion.estudiante.institutionId,
    sesion.estudiante.id,
    cursada,
  );
  if (!props) return NextResponse.json({ error: "Sin cursado activo" }, { status: 404 });

  return NextResponse.json(props);
}
