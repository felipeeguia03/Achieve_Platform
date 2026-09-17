import { NextResponse } from "next/server";

import { esFechaDeCalendario, lunesDe } from "@/lib/domain/calendario";
import { fechaEnZona } from "@/lib/domain/zona";
import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { planVivoDe, resolverSesion } from "@/lib/server/composicion";

/**
 * `GET /api/plan-vivo?semana=YYYY-MM-DD` — [ADR-110](../../../docs/decisions.md#adr-110).
 *
 * La base del plan de una semana: disponibilidad, clases, evaluaciones,
 * compromisos y el trabajo por ubicar, **sin** nada de lo que el estudiante
 * movió. **Sólo lee.**
 *
 * Sin flag desde [ADR-110 · Enmienda 2](../../../docs/decisions.md#adr-110-enmienda-2).
 */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }
  const pendiente = altaPendiente(sesion.alta);
  if (pendiente) return NextResponse.json(pendiente, { status: 409 });

  const { institutionId, id, timezone } = sesion.estudiante;
  const pedida = new URL(request.url).searchParams.get("semana");
  if (pedida !== null && !esFechaDeCalendario(pedida)) {
    return NextResponse.json({ error: "Semana inválida: YYYY-MM-DD" }, { status: 400 });
  }
  const semana = lunesDe(pedida ?? fechaEnZona(Date.now(), timezone));
  return NextResponse.json(await planVivoDe(institutionId, id, timezone, semana));
}
