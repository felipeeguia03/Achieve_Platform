import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { avisosSimuladosDe, resolverSesion } from "@/lib/server/composicion";

/**
 * `GET /api/avisos` — los avisos **simulados** de la campanita
 * ([ADR-097 · Enmienda 1](../../../docs/decisions.md#adr-097-enmienda-1)).
 *
 * 1. **Apagada por defecto.** Sin `MODO_PRUEBA=1` responde `404`, no `403`: un
 *    `403` confirmaría que la ruta existe. La campanita, sin respuesta, no se
 *    dibuja.
 * 2. **Con el JWT del estudiante**, nunca con secreto de servicio: las materias
 *    que nombra son las suyas, y salen de la sesión.
 *
 * ## Cuando haya notificaciones de verdad
 *
 * **Esta ruta se borra**, junto con `lib/server/simulacion/avisos.ts`. Lo real
 * tiene su propio diseño —qué, a quién, por qué canal— y no hereda esta forma.
 */

/** Cerrojo. Va primero: ni se mira el token. */
function apagada(): boolean {
  return process.env.MODO_PRUEBA !== "1";
}

export async function GET(request: Request) {
  if (apagada()) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  return NextResponse.json(
    await avisosSimuladosDe(
      sesion.estudiante.institutionId,
      sesion.estudiante.id,
      sesion.estudiante.timezone,
      sesion.alta.completa,
    ),
  );
}
