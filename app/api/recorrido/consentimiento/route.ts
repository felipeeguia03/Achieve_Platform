import { NextResponse } from "next/server";

import { decidirConsentimientoDelAnalitico } from "@/lib/server/composicion";
import { estudianteDelRecorrido } from "@/lib/server/recorrido-http";

/**
 * `POST /api/recorrido/consentimiento` — ADR-106 §3. Append-only: retirar es una
 * fila nueva. **No premarcado**: sin `decision` explícita no se registra nada.
 */
export async function POST(request: Request) {
  const r = await estudianteDelRecorrido(request);
  if ("error" in r) return r.error;
  const cuerpo = (await request.json().catch(() => null)) as { decision?: string } | null;
  if (cuerpo?.decision !== "GRANTED" && cuerpo?.decision !== "WITHDRAWN") {
    return NextResponse.json({ error: "Falta la decisión" }, { status: 400 });
  }
  await decidirConsentimientoDelAnalitico(r.estudiante.institutionId, r.estudiante.id, cuerpo.decision);
  return NextResponse.json({ decision: cuerpo.decision }, { status: 201 });
}
