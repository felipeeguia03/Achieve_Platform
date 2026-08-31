import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { resolverSesion } from "@/lib/server/servicios/sesion";

/**
 * `GET /api/sesion` — Controller. Etapa B1.3.
 *
 * Valida el JWT y traduce el resultado del Service a HTTP. **No contiene reglas
 * de negocio ni consultas** ([`architecture.md`](../../../docs/architecture.md)
 * §3.2): si algo acá decide sobre el dominio, está en la capa equivocada.
 *
 * Es el endpoint que prueba la frontera de auth de punta a punta. No expone
 * superficie de producto: dice quién sos y bajo qué institución, que es lo que
 * el resto de `/api/*` va a necesitar dar por resuelto.
 *
 * **No devuelve `whatsapp` ni ningún dato personal**: el Repository ni siquiera
 * lo selecciona (ADR-006).
 */
export async function GET(request: Request) {
  const token = tokenDelHeader(request.headers.get("authorization"));
  const sesion = await resolverSesion(token);

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 403 y no 404: la identidad es válida, lo que falta es habilitación de
  // padrón. Un 404 haría creer que el endpoint no existe.
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  return NextResponse.json({
    platformStudentId: sesion.estudiante.id,
    institutionId: sesion.estudiante.institutionId,
    timezone: sesion.estudiante.timezone,
  });
}
