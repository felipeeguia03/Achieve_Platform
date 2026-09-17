import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { resolverSesion, responderReentradaDeProtocolo } from "@/lib/server/composicion";

/** El estudiante responde la explicación que UX09 ya mostró. */
export async function POST(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }
  const cuerpo = (await request.json().catch(() => null)) as
    | { propuesta?: string; decision?: string }
    | null;
  if (!cuerpo?.propuesta || !["ACEPTAR", "PEDIR_OTRA_OPCION"].includes(cuerpo.decision ?? "")) {
    return NextResponse.json({ error: "Propuesta o decisión inválida" }, { status: 400 });
  }
  const resultado = await responderReentradaDeProtocolo({
    institutionId: sesion.estudiante.institutionId,
    studentId: sesion.estudiante.id,
    propuestaId: cuerpo.propuesta,
    decision: cuerpo.decision as "ACEPTAR" | "PEDIR_OTRA_OPCION",
    respondidaPor: sesion.estudiante.id,
  });
  if (resultado.estado === "RECHAZADO") {
    return NextResponse.json({ error: resultado.motivo }, { status: 409 });
  }
  return NextResponse.json(resultado);
}
