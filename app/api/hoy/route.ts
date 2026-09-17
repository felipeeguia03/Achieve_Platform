import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { diaDe, resolverSesion } from "@/lib/server/composicion";

/**
 * `GET /api/hoy` — Controller de `UX01`.
 *
 * Devuelve exactamente el `HoyProps` que la pantalla ya sabe recibir. **La
 * superficie no cambia**: cambia de dónde salen los datos, que es lo que la
 * frontera de la Fase 0 venía preparando.
 *
 * El `institutionId` y el `studentId` salen de la sesión, **nunca del
 * request**: aceptarlos de afuera sería regalar el aislamiento.
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

  const props = await diaDe(sesion.estudiante.institutionId, sesion.estudiante.id);
  if (!props) return NextResponse.json({ error: "Sin datos del día" }, { status: 404 });

  return NextResponse.json(props);
}
