import { NextResponse } from "next/server";

import { perfilDelRecorrido, recorridoDelEstudiante } from "@/lib/server/composicion";
import { estudianteDelRecorrido } from "@/lib/server/recorrido-http";

/**
 * `GET /api/recorrido` — el analítico vigente, su revisión y el consentimiento.
 * [ADR-106](../../../docs/decisions.md#adr-106). Privado: nada de esto viaja al
 * CRM ni a la institución.
 */
export async function GET(request: Request) {
  const r = await estudianteDelRecorrido(request);
  if ("error" in r) return r.error;
  const [recorrido, perfil] = await Promise.all([
    recorridoDelEstudiante(r.estudiante.institutionId, r.estudiante.id),
    perfilDelRecorrido(r.estudiante.institutionId, r.estudiante.id),
  ]);
  // `pruebaDisponible` enciende *Usar un analítico sintético*. Sin `MODO_PRUEBA=1`
  // el botón no llega al HTML y la ruta que lo sirve responde `404`.
  return NextResponse.json({ ...recorrido, perfil, pruebaDisponible: process.env.MODO_PRUEBA === "1" });
}
