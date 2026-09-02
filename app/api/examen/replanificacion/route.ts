import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { replanificarPreparacion, resolverSesion } from "@/lib/server/composicion";

/** Mismo examen, misma preparación, una versión más del plan. */
export async function POST(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }
  const c = (await request.json().catch(() => null)) as
    | { preparacion?: string; motivo?: string; nuevaFecha?: string; clave?: string }
    | null;
  if (!c?.preparacion || !c.motivo) {
    return NextResponse.json({ error: "Faltan preparación y motivo" }, { status: 400 });
  }
  const resultado = await replanificarPreparacion({
    institutionId: sesion.estudiante.institutionId,
    preparacionId: c.preparacion,
    motivo: c.motivo,
    nuevaFecha: c.nuevaFecha ?? null,
    creadoPor: sesion.estudiante.id,
    claveDeIdempotencia: c.clave,
  });
  if (resultado.estado === "RECHAZADO") {
    return NextResponse.json({ error: resultado.motivo }, { status: 409 });
  }
  return NextResponse.json(resultado);
}
