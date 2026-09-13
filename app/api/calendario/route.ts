import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { calendarioDe, resolverSesion } from "@/lib/server/composicion";
import {
  MAXIMO_DE_DIAS_POR_PEDIDO,
  diasEntre,
  esFechaDeCalendario,
} from "@/lib/domain/calendario";

/**
 * `GET /api/calendario?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` —
 * [ADR-100](../../../docs/decisions.md#adr-100).
 *
 * Devuelve `CalendarioProps`: clases del horario semanal, evaluaciones con fecha
 * y compromisos del estudiante, entre las dos fechas **inclusive**.
 *
 * ⚠️ **El estudiante sale de la sesión, nunca del request.** Lo único que se
 * elige es el rango, y se acota: una URL no puede pedir un año entero.
 */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const pendiente = altaPendiente(sesion.alta);
  if (pendiente) return NextResponse.json(pendiente, { status: 409 });

  const params = new URL(request.url).searchParams;
  const desde = params.get("desde");
  const hasta = params.get("hasta");
  if (!esFechaDeCalendario(desde) || !esFechaDeCalendario(hasta)) {
    return NextResponse.json({ error: "Rango inválido: desde y hasta son fechas YYYY-MM-DD" }, { status: 400 });
  }
  const dias = diasEntre(desde, hasta) + 1;
  if (dias < 1 || dias > MAXIMO_DE_DIAS_POR_PEDIDO) {
    return NextResponse.json({ error: `Rango inválido: entre 1 y ${MAXIMO_DE_DIAS_POR_PEDIDO} días` }, { status: 400 });
  }

  return NextResponse.json(
    await calendarioDe(
      sesion.estudiante.institutionId,
      sesion.estudiante.id,
      sesion.estudiante.timezone,
      desde,
      hasta,
    ),
  );
}
