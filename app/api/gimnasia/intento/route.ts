import { NextResponse } from "next/server";

import { iniciarIntentoDeGimnasia } from "@/lib/server/composicion";
import { claveDe, cuerpoDe, estudianteDe, invalido, noEncontrado, rechazado, UUID } from "../_sesion";

/**
 * `POST /api/gimnasia/intento { sesion, juego, clave }` — empezar un juego de la
 * sesión · [ADR-102](../../../../docs/decisions.md#adr-102).
 *
 * Devuelve lo que el juego necesita para correr: la semilla y el largo inicial,
 * o la primera pregunta **sin su respuesta**. La dificultad la fija el servidor.
 *
 * `201` · `200` repetido · `409 SESION_CERRADA` · `409 JUEGO_COMPLETADO` ·
 * `409 SIN_PREGUNTAS` · `400 JUEGO_NO_PREVISTO` · `404`.
 */
export async function POST(request: Request) {
  const s = await estudianteDe(request);
  if ("error" in s) return s.error;
  const cuerpo = await cuerpoDe(request);
  const clave = claveDe(cuerpo?.clave);
  if (!cuerpo || !clave) return invalido("Falta `clave`");
  if (typeof cuerpo.sesion !== "string" || !UUID.test(cuerpo.sesion)) return noEncontrado("esa sesión");

  const r = await iniciarIntentoDeGimnasia(s.institutionId, {
    ...s.estudiante,
    sesionId: cuerpo.sesion,
    juego: cuerpo.juego,
    clave,
  });
  switch (r.estado) {
    case "OK":
      return NextResponse.json({ intento: r.intento, duplicado: r.duplicado }, { status: r.duplicado ? 200 : 201 });
    case "NO_ENCONTRADA":
      return noEncontrado("esa sesión");
    case "SESION_CERRADA":
      return rechazado("Esa sesión ya terminó", "SESION_CERRADA");
    case "JUEGO_COMPLETADO":
      return rechazado("Ese ejercicio ya está hecho en esta sesión", "JUEGO_COMPLETADO");
    case "SIN_PREGUNTAS":
      return rechazado("Todavía no hay preguntas para repasar", "SIN_PREGUNTAS");
    case "JUEGO_NO_PREVISTO":
      return invalido("Ese juego no es de esta sesión");
  }
}
