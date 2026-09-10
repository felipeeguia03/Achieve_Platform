import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { formacionDe, resolverSesion } from "@/lib/server/composicion";

/**
 * `GET /api/formacion` — la biblioteca, [ADR-087](../../../docs/decisions.md#adr-087).
 *
 * Devuelve `FormacionProps`: las piezas **publicadas** y las cursadas a las que
 * se pueden aplicar.
 *
 * ⚠️ **No acepta parámetros, y no puede aceptarlos.** `D1` prohíbe clasificar
 * al estudiante mientras no exista el Student Model: un filtro por «nivel» o
 * por «perfil» sería exactamente el proxy que la decisión cierra. La biblioteca
 * es la misma para todos.
 *
 * ⚠️ **Cero piezas NO es `404`.** Mientras la psicopedagoga no confirme
 * vigencia (`D5`) todo está `DRAFT` y esto devuelve una lista vacía **con su
 * aviso**. Un `404` diría que la biblioteca no existe, y existe: está vacía.
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
    await formacionDe(sesion.estudiante.institutionId, sesion.estudiante.id),
  );
}
