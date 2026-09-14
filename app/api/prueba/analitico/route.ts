import { NextResponse } from "next/server";

import { analiticoSinteticoDePrueba } from "@/lib/server/composicion";
import { estudianteDelRecorrido } from "@/lib/server/recorrido-http";

/**
 * `GET /api/prueba/analitico` — **un analítico sintético** para recorrer
 * `/recorrido` sin un documento real.
 *
 * ⚠️⚠️ **INTERNO Y SINTÉTICO. NO ES UNA CAPACIDAD DEL PRODUCTO.** Sin
 * `MODO_PRUEBA=1` responde `404`. Devuelve un PDF armado sobre el plan del
 * estudiante de la sesión, con los patrones que el recorrido sabe preguntar.
 * **No es el analítico de nadie** ([ADR-006](../../../../docs/decisions.md#adr-006)).
 */
export async function GET(request: Request) {
  if (process.env.MODO_PRUEBA !== "1") return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const r = await estudianteDelRecorrido(request);
  if ("error" in r) return r.error;
  const pdf = await analiticoSinteticoDePrueba(r.estudiante.institutionId, r.estudiante.id);
  if (!pdf) return NextResponse.json({ error: "Sin plan para simular" }, { status: 404 });
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: { "content-type": "application/pdf", "content-disposition": 'attachment; filename="analitico-sintetico.pdf"' },
  });
}
