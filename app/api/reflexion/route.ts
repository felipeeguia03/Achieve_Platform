import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { registrarReflexion, resolverSesion } from "@/lib/server/composicion";

/**
 * `POST /api/reflexion` — **la reflexión existe** · Etapa B6.10.
 *
 * Con JWT del estudiante, porque reflexionar es suyo y de nadie más. Hasta acá
 * la tabla estaba desde la Fase B1 y **nadie la escribía**: el estudiante no
 * tenía por dónde.
 *
 * ## Lo que esta ruta no hace
 *
 * **No entrega, no valida y no afirma nada sobre el dominio.** Una `Reflection`
 * es autorreporte: es lo más débil que el sistema recoge, y por eso
 * [ADR-026](../../../docs/decisions.md#adr-026) eligió que sólo bloquee el
 * submit donde el contenido versionado lo declare, y nunca el recorrido entero.
 *
 * **No emite evento de producto.** El Product Event Model no declara ninguno
 * para `Reflection`, y `product_event` es append-only: inventar un nombre sería
 * lo que el guard de [ADR-027](../../../docs/decisions.md#adr-027) impide.
 */
export async function POST(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const cuerpo = (await request.json().catch(() => null)) as {
    accion?: string;
    evidencia?: string;
    paso?: string;
    minutosReales?: number;
    dificultad?: "mas_facil" | "esperado" | "mas_dificil";
    nota?: string;
  } | null;

  if (!cuerpo) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });

  const resultado = await registrarReflexion(sesion.estudiante.institutionId, {
    estudianteId: sesion.estudiante.id,
    actionId: cuerpo.accion,
    evidenceId: cuerpo.evidencia,
    protocolStepId: cuerpo.paso,
    actualMinutes: cuerpo.minutosReales,
    difficulty: cuerpo.dificultad,
    note: cuerpo.nota,
  });

  switch (resultado.estado) {
    case "OK":
      return NextResponse.json({ reflexion: resultado.reflexionId }, { status: 201 });
    case "NO_CUELGA_DE_NADA":
      return NextResponse.json(
        { error: "Una reflexión cuelga de una acción, una evidencia o un paso" },
        { status: 400 },
      );
    // Una `Reflection` en blanco entraría a la Bitácora **idéntica** a una
    // real: el estudiante aparecería habiendo reflexionado sin haberlo hecho.
    case "REFLEXION_VACIA":
      return NextResponse.json({ error: "Una reflexión sin ningún dato no es una reflexión" }, { status: 400 });
    case "NO_ES_SUYA":
      return NextResponse.json({ error: "No se encontró esa acción" }, { status: 404 });
  }
}
