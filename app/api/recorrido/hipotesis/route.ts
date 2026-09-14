import { NextResponse } from "next/server";

import { rechazarHipotesisDelRecorrido } from "@/lib/server/composicion";
import { estudianteDelRecorrido, UUID_DEL_RECORRIDO } from "@/lib/server/recorrido-http";

/**
 * `POST /api/recorrido/hipotesis` — *«Esto no me representa»*. ADR-107 §5. La
 * hipótesis queda `RECHAZADA` con su fecha; **no se borra**.
 */
export async function POST(request: Request) {
  const r = await estudianteDelRecorrido(request);
  if ("error" in r) return r.error;
  const cuerpo = (await request.json().catch(() => null)) as { hipotesis?: string } | null;
  if (!cuerpo?.hipotesis || !UUID_DEL_RECORRIDO.test(cuerpo.hipotesis)) {
    return NextResponse.json({ error: "Falta la hipótesis" }, { status: 400 });
  }
  const res = await rechazarHipotesisDelRecorrido(r.estudiante.institutionId, r.estudiante.id, cuerpo.hipotesis);
  if (res.estado === "NO_ENCONTRADA") return NextResponse.json({ error: "No encontramos esa observación" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
