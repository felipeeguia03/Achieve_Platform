import { NextResponse } from "next/server";

import { confirmarAnalitico } from "@/lib/server/composicion";
import { estudianteDelRecorrido, UUID_DEL_RECORRIDO } from "@/lib/server/recorrido-http";

/** `POST /api/recorrido/confirmar` — ADR-106 §8. No exige resolver todo lo pendiente. */
export async function POST(request: Request) {
  const r = await estudianteDelRecorrido(request);
  if ("error" in r) return r.error;
  const cuerpo = (await request.json().catch(() => null)) as { documento?: string } | null;
  if (!cuerpo?.documento || !UUID_DEL_RECORRIDO.test(cuerpo.documento)) {
    return NextResponse.json({ error: "Falta el documento" }, { status: 400 });
  }
  const res = await confirmarAnalitico(r.estudiante.institutionId, r.estudiante.id, cuerpo.documento);
  if (res.estado === "NO_ENCONTRADO") return NextResponse.json({ error: "No encontramos ese analítico" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
