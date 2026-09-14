import { NextResponse } from "next/server";

import { AnaliticoRechazado, revisarResultadoDelAnalitico } from "@/lib/server/composicion";
import { estudianteDelRecorrido, UUID_DEL_RECORRIDO } from "@/lib/server/recorrido-http";

/**
 * `POST /api/recorrido/revision` — confirmar, corregir, *No estoy seguro* o *No es
 * de mi plan* sobre un resultado. ADR-106 §8. **El crudo no se toca.**
 */
export async function POST(request: Request) {
  const r = await estudianteDelRecorrido(request);
  if ("error" in r) return r.error;
  const cuerpo = (await request.json().catch(() => null)) as {
    resultado?: string;
    decision?: string;
    requisito?: string | null;
    estado?: string | null;
  } | null;
  if (!cuerpo?.resultado || !UUID_DEL_RECORRIDO.test(cuerpo.resultado) || !cuerpo.decision) {
    return NextResponse.json({ error: "Faltan el resultado o la decisión" }, { status: 400 });
  }
  if (cuerpo.requisito && !UUID_DEL_RECORRIDO.test(cuerpo.requisito)) {
    return NextResponse.json({ error: "Materia inválida" }, { status: 400 });
  }
  try {
    const res = await revisarResultadoDelAnalitico(r.estudiante.institutionId, r.estudiante.id, {
      resultadoId: cuerpo.resultado,
      decision: cuerpo.decision,
      requisitoId: cuerpo.requisito ?? null,
      estado: cuerpo.estado ?? null,
    });
    if (res.estado === "DATOS_INVALIDOS") return NextResponse.json({ error: res.motivo }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AnaliticoRechazado) {
      return e.motivo === "RESULTADO_AJENO"
        ? NextResponse.json({ error: "No encontramos ese resultado" }, { status: 404 })
        : NextResponse.json({ error: "Esa materia no es de tu plan" }, { status: 400 });
    }
    throw e;
  }
}
