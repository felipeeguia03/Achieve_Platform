import { NextResponse } from "next/server";

import { iniciarSesionDeGimnasia } from "@/lib/server/composicion";
import { claveDe, cuerpoDe, estudianteDe, invalido, rechazado } from "../_sesion";

/**
 * `POST /api/gimnasia/sesion { origen, juego?, clave }` — empezar la rutina
 * (`CTA-024`, `origen: "ROUTINE"`) o un juego suelto (`CTA-025`,
 * `origen: "SINGLE_GAME"`) · [ADR-102](../../../../docs/decisions.md#adr-102).
 *
 * `201` · `200` repetido (misma clave) · `409 YA_HAY_OTRA_ABIERTA` con la sesión
 * para retomarla · `409 SIN_PREGUNTAS` · `400`.
 */
export async function POST(request: Request) {
  const s = await estudianteDe(request);
  if ("error" in s) return s.error;
  const cuerpo = await cuerpoDe(request);
  const clave = claveDe(cuerpo?.clave);
  if (!cuerpo || !clave) return invalido("Falta `clave`");

  const r = await iniciarSesionDeGimnasia(s.institutionId, {
    ...s.estudiante,
    origen: cuerpo.origen,
    juego: cuerpo.juego ?? null,
    clave,
  });
  switch (r.estado) {
    case "OK":
      return NextResponse.json({ sesion: r.sesion, duplicado: r.duplicado }, { status: r.duplicado ? 200 : 201 });
    case "YA_HAY_OTRA_ABIERTA":
      return rechazado("Tenés una rutina sin terminar", "YA_HAY_OTRA_ABIERTA", { sesion: r.sesion });
    case "SIN_PREGUNTAS":
      return rechazado("Todavía no hay preguntas para repasar", "SIN_PREGUNTAS");
    case "PEDIDO_INVALIDO":
      return invalido("`origen` o `juego` no son válidos");
  }
}
