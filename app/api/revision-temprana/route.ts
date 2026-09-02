import { NextResponse } from "next/server";

import { esSecretoDeServicio, tokenDelHeader } from "@/lib/server/http";
import { registrarDisparadorTempranoDeEstudiante } from "@/lib/server/composicion";

/**
 * `POST /api/revision-temprana` — `9.2` de ADR-037.
 *
 * Registra un criterio cualitativo configurado y pide una persona sin esperar
 * al tercer error comparable. Sigue siendo una ruta de servicio sobre datos
 * sintéticos; no autentica ni inventa un rol humano.
 */
export async function POST(request: Request) {
  const token = tokenDelHeader(request.headers.get("authorization"));
  if (!esSecretoDeServicio(token, process.env.RELOJ_SHARED_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  for (const campo of ["institucionId", "preparacionId", "disparador"] as const) {
    if (typeof cuerpo[campo] !== "string") {
      return NextResponse.json({ error: `Falta ${campo}` }, { status: 400 });
    }
  }
  const r = await registrarDisparadorTempranoDeEstudiante({
    institutionId: cuerpo.institucionId as string,
    examPreparationId: cuerpo.preparacionId as string,
    triggerCanonicalId: cuerpo.disparador as string,
    evidenceId: typeof cuerpo.evidenciaId === "string" ? cuerpo.evidenciaId : null,
    note: typeof cuerpo.nota === "string" ? cuerpo.nota : null,
    recordedBy: typeof cuerpo.registradoPor === "string" ? cuerpo.registradoPor : null,
    claveDeIdempotencia:
      typeof cuerpo.claveDeIdempotencia === "string" ? cuerpo.claveDeIdempotencia : undefined,
  });
  if (r.estado === "RECHAZADA") {
    return NextResponse.json({ error: r.motivo }, { status: 422 });
  }
  return NextResponse.json(r);
}
