import { NextResponse } from "next/server";

import { registrarResultadoDeGimnasia } from "@/lib/server/composicion";
import { cuerpoDe, estudianteDe, invalido, noEncontrado, rechazado, UUID } from "../../_sesion";

/**
 * `POST /api/gimnasia/intento/resultado { intento, respuestas }` — confirmar un
 * juego · [ADR-102](../../../../../docs/decisions.md#adr-102).
 *
 * ⚠️ **Se mandan respuestas, nunca puntuaciones.** El servidor rehace la partida
 * con la semilla que él fijó y calcula el resultado. En Recuerdo real,
 * `respuestas` se ignora: es *salir guardando* lo ya confirmado.
 *
 * **Idempotente:** `200` con el mismo resultado si ya estaba confirmado.
 * `409 PARTIDA_SIN_TERMINAR` · `409 INTENTO_REEMPLAZADO` · `409 NADA_RESPONDIDO` ·
 * `400 RESPUESTAS_INVALIDAS` · `404`.
 */
export async function POST(request: Request) {
  const s = await estudianteDe(request);
  if ("error" in s) return s.error;
  const cuerpo = await cuerpoDe(request);
  if (!cuerpo || typeof cuerpo.intento !== "string" || !UUID.test(cuerpo.intento)) return noEncontrado("ese juego");

  const r = await registrarResultadoDeGimnasia(s.institutionId, {
    ...s.estudiante,
    intentoId: cuerpo.intento,
    respuestas: cuerpo.respuestas ?? null,
  });
  switch (r.estado) {
    case "OK":
      return NextResponse.json({ ...r.resultado, duplicado: r.duplicado });
    case "NO_ENCONTRADO":
      return noEncontrado("ese juego");
    case "INTENTO_REEMPLAZADO":
      return rechazado("Ese juego se reemplazó por otro o la sesión se descartó", "INTENTO_REEMPLAZADO");
    case "PARTIDA_SIN_TERMINAR":
      return rechazado("La partida todavía no terminó", "PARTIDA_SIN_TERMINAR");
    case "NADA_RESPONDIDO":
      return rechazado("No confirmaste ninguna respuesta todavía", "NADA_RESPONDIDO");
    case "RESPUESTAS_INVALIDAS":
      return invalido("Las respuestas no corresponden a esta partida");
  }
}
