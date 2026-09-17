import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { resolverSesion, terminarClase } from "@/lib/server/composicion";

/**
 * `POST /api/clase/fin { clase }` — terminar la clase (`CTA-023`) ·
 * [ADR-098](../../../../docs/decisions.md#adr-098).
 *
 * **Idempotente:** repetirlo devuelve la misma clase con `200`. **El paso del
 * tiempo no llama acá**: la clase la termina el estudiante.
 */
export async function POST(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }
  const pendiente = altaPendiente(sesion.alta);
  if (pendiente) return NextResponse.json(pendiente, { status: 409 });

  const cuerpo = (await request.json().catch(() => null)) as { clase?: string } | null;
  if (!cuerpo?.clase) return NextResponse.json({ error: "Falta `clase`" }, { status: 400 });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cuerpo.clase)) {
    return NextResponse.json({ error: "No se encontró esa clase" }, { status: 404 });
  }

  const r = await terminarClase(sesion.estudiante.institutionId, {
    studentId: sesion.estudiante.id,
    claseId: cuerpo.clase,
  });
  return r.estado === "OK"
    ? NextResponse.json({ clase: r.clase.id, terminadaEn: r.clase.terminadaEn, duplicado: r.duplicado })
    : NextResponse.json({ error: "No se encontró esa clase" }, { status: 404 });
}
