import { NextResponse } from "next/server";

import { esSecretoDeServicio, tokenDelHeader } from "@/lib/server/http";
import { proponerReentradaDeProtocolo } from "@/lib/server/composicion";

/**
 * El owner del recorrido propone; el estudiante sólo responde en la ruta
 * hermana. No se inventa identidad de operador mientras ADR-033 siga vigente.
 */
export async function POST(request: Request) {
  const token = tokenDelHeader(request.headers.get("authorization"));
  if (!esSecretoDeServicio(token, process.env.RELOJ_SHARED_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const c = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  for (const campo of [
    "institucionId", "preparacionId", "desdePasoId", "haciaPasoId", "motivo",
    "justificacion", "actividad", "evidenciaVigente",
  ] as const) {
    if (typeof c?.[campo] !== "string") {
      return NextResponse.json({ error: `Falta ${campo}` }, { status: 400 });
    }
  }
  const resultado = await proponerReentradaDeProtocolo({
    institutionId: c!.institucionId as string,
    preparacionId: c!.preparacionId as string,
    desdePasoId: c!.desdePasoId as string,
    haciaPasoId: c!.haciaPasoId as string,
    motivoCanonico: c!.motivo as string,
    justificacion: c!.justificacion as string,
    actividad: c!.actividad as string,
    evidenciaVigente: c!.evidenciaVigente as string,
    propuestaPor: typeof c!.propuestaPor === "string" ? c!.propuestaPor : null,
    claveDeIdempotencia: typeof c!.clave === "string" ? c!.clave : undefined,
  });
  if (resultado.estado === "RECHAZADO") {
    return NextResponse.json({ error: resultado.motivo }, { status: 422 });
  }
  return NextResponse.json(resultado);
}
