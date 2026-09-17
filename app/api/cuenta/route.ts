import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { cuentaDe, resolverSesion } from "@/lib/server/composicion";

/**
 * `GET /api/cuenta` — dónde estudia el estudiante, para el topbar
 * ([ADR-097](../../../docs/decisions.md#adr-097)).
 *
 * ⚠️ **No exige el alta completa**, a diferencia de las nueve superficies. El
 * topbar se dibuja también durante el alta, y ahí la carrera puede no estar
 * declarada todavía: la respuesta la trae en `null` y la línea no se dibuja.
 *
 * ⚠️ **No acepta parámetros.** La institución y la carrera salen de la sesión.
 */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  return NextResponse.json(
    await cuentaDe(sesion.estudiante.institutionId, sesion.alta.declaracion?.carreraId ?? null),
  );
}
