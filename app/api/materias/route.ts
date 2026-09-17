import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { materiasDe, resolverSesion } from "@/lib/server/composicion";

/**
 * `GET /api/materias` — el área «Materias», [ADR-077](../../../docs/decisions.md#adr-077).
 *
 * Devuelve `MateriasProps`: todas las cursadas activas del estudiante, ordenadas
 * por próxima evaluación.
 *
 * ⚠️ **No acepta parámetros.** El `institutionId` y el `studentId` salen de la
 * sesión, nunca del request, y no hay nada que elegir: son todas las materias
 * del estudiante o ninguna.
 *
 * ⚠️ **Y no devuelve `404` cuando no hay materias.** Un estudiante con el alta
 * completa y sin cursadas es un estado válido —el índice dice que no hay— y un
 * `404` lo trataría como un error del sistema.
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
    await materiasDe(
      sesion.estudiante.institutionId,
      sesion.estudiante.id,
      sesion.estudiante.timezone,
    ),
  );
}
