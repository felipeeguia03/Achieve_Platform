import { NextResponse } from "next/server";

import { gimnasiaDe } from "@/lib/server/composicion";
import { estudianteDe } from "./_sesion";

/**
 * `GET /api/gimnasia` — la pantalla principal de Gimnasia cognitiva, **en una
 * lectura** · [ADR-102](../../../docs/decisions.md#adr-102).
 *
 * ⚠️ **No acepta parámetros.** Nada del pedido cambia qué se le muestra a quién:
 * la rutina, la dificultad y las preguntas las decide el servidor con la
 * historia real del estudiante.
 *
 * ⚠️ **Nunca devuelve una respuesta de pregunta.** Sólo cantidades.
 */
export async function GET(request: Request) {
  const s = await estudianteDe(request);
  if ("error" in s) return s.error;
  return NextResponse.json(await gimnasiaDe(s.institutionId, s.estudiante));
}
