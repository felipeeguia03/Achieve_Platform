import { NextResponse } from "next/server";

import { preguntaDeRecuerdo, responderRecuerdo } from "@/lib/server/composicion";
import { claveDe, cuerpoDe, estudianteDe, invalido, noEncontrado, rechazado, UUID } from "../_sesion";

/**
 * **Recuerdo real** · [ADR-102](../../../../docs/decisions.md#adr-102) §8.
 *
 * - `GET ?intento=` — la pregunta que toca, **sin respuesta**. Para retomar.
 * - `POST { intento, item, accion, respuesta?, resultado?, clave }`:
 *   - `RESPONDER` una cerrada: corrige el servidor, guarda y devuelve la referencia.
 *   - `REVELAR` una abierta ya escrita: devuelve la referencia **sin guardar**.
 *   - `AUTOEVALUAR` la abierta: guarda lo que el estudiante clasificó.
 *
 * ⚠️ **La respuesta de referencia sólo sale después de confirmar, y sólo de la
 * pregunta que toca.** `409 NO_TOCA` para cualquier otra.
 */
export async function GET(request: Request) {
  const s = await estudianteDe(request);
  if ("error" in s) return s.error;
  const intentoId = new URL(request.url).searchParams.get("intento");
  if (!intentoId || !UUID.test(intentoId)) return noEncontrado("ese repaso");
  const r = await preguntaDeRecuerdo(s.institutionId, { ...s.estudiante, intentoId });
  return r.estado === "OK" ? NextResponse.json({ pregunta: r.pregunta }) : noEncontrado("ese repaso");
}

export async function POST(request: Request) {
  const s = await estudianteDe(request);
  if ("error" in s) return s.error;
  const cuerpo = await cuerpoDe(request);
  if (!cuerpo) return invalido("Falta el cuerpo");
  if (typeof cuerpo.intento !== "string" || !UUID.test(cuerpo.intento)) return noEncontrado("ese repaso");
  if (typeof cuerpo.item !== "string" || !UUID.test(cuerpo.item)) return noEncontrado("esa pregunta");
  const clave = claveDe(cuerpo.clave);
  if (cuerpo.accion !== "REVELAR" && !clave) return invalido("Falta `clave`");

  const r = await responderRecuerdo(s.institutionId, {
    ...s.estudiante,
    intentoId: cuerpo.intento,
    itemId: cuerpo.item,
    accion: cuerpo.accion,
    respuesta: cuerpo.respuesta ?? null,
    resultado: cuerpo.resultado ?? null,
    clave: clave ?? "",
  });
  switch (r.estado) {
    case "OK":
      return NextResponse.json({ ...r.registrada, duplicado: r.duplicado }, { status: r.duplicado ? 200 : 201 });
    case "REVELADA":
      return NextResponse.json({ respuestaCanonica: r.respuestaCanonica, explicacion: r.explicacion });
    case "NO_ENCONTRADO":
      return noEncontrado("esa pregunta");
    case "INTENTO_CERRADO":
      return rechazado("Este repaso ya terminó", "INTENTO_CERRADO");
    case "NO_TOCA":
      return rechazado("Esa no es la pregunta que toca", "NO_TOCA");
    case "TIPO_INCORRECTO":
      return invalido("Esa acción no corresponde a este tipo de pregunta");
    case "RESPUESTA_INVALIDA":
      return invalido("La respuesta no es válida");
  }
}
