import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { catalogoOfrecible, resolverSesion } from "@/lib/server/composicion";

/**
 * `GET /api/alta` — dónde está el estudiante en el alta, y qué puede elegir.
 *
 * Etapa B6.14.4, [ADR-052](../../../docs/decisions.md#adr-052).
 *
 * **Es la única ruta del estudiante que no devuelve `409 ALTA_INCOMPLETA`**, y
 * es obvio por qué: si el alta se gateara a sí misma, no habría forma de
 * completarla.
 *
 * Devuelve el catálogo junto con el estado porque las dos cosas se usan en la
 * misma pantalla y en el mismo instante. **Nunca un plan `DRAFT`:** el filtro
 * vive en `catalogo_ofrecible()`, no en este archivo.
 */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  return NextResponse.json({
    alta: sesion.alta,
    instituciones: await catalogoOfrecible(),
  });
}
