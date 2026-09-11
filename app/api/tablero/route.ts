import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { resolverSesion, tableroDe } from "@/lib/server/composicion";

/**
 * `GET /api/tablero` — el tablero de `UX01`, [ADR-093](../../../docs/decisions.md#adr-093).
 *
 * Devuelve `TableroProps`: las tarjetas de evaluación, los riesgos de
 * planificación y los próximos 7 días.
 *
 * ⚠️ **No acepta parámetros**, igual que `/api/materias`: el `institutionId` y
 * el `studentId` salen de la sesión, nunca del request.
 *
 * ⚠️ **Sólo lee.** No existe un `POST`: los riesgos no se persisten, no emiten
 * eventos y no abren intervenciones — no son `RiskSignal`.
 */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  // El alta primero (ADR-052), igual que las nueve superficies.
  const pendiente = altaPendiente(sesion.alta);
  if (pendiente) return NextResponse.json(pendiente, { status: 409 });

  return NextResponse.json(
    await tableroDe(
      sesion.estudiante.institutionId,
      sesion.estudiante.id,
      sesion.estudiante.timezone,
    ),
  );
}
