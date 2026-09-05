import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { decidirWhatsapp, resolverSesion } from "@/lib/server/composicion";

/**
 * `POST /api/alta/whatsapp` — el consentimiento, con JWT del estudiante.
 *
 * Etapa B6.14.4. Implementa el tramo 2 del alta que
 * [ADR-042](../../../../docs/decisions.md#adr-042) aprobó.
 *
 * ## Lo que esta ruta NO hace, y no es un olvido
 *
 * **No escribe `student.whatsapp`.** ADR-042 §4 autoriza probar con teléfonos
 * sintéticos, pero el schema dice que ninguna capa escribe esa columna mientras
 * [ADR-006](../../../../docs/decisions.md#adr-006) siga abierto.
 * [ADR-052](../../../../docs/decisions.md#adr-052) eligió no contradecirlo: se
 * registra **la decisión**, y `whatsapp_consent` **no tiene columna de número**.
 * No es que no se llene: es que no existe dónde.
 *
 * **No emite nada al CRM.** El flujo E sigue congelado por
 * [ADR-035](../../../../docs/decisions.md#adr-035).
 *
 * **`DECLINED` es una respuesta válida y devuelve `200`.** ADR-042 §2: *"el
 * estudiante puede rechazar u omitir WhatsApp sin perder el acceso"*.
 */
export async function POST(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const cuerpo = (await request.json().catch(() => null)) as { decision?: string } | null;
  const decision = cuerpo?.decision;

  if (decision !== "GRANTED" && decision !== "DECLINED" && decision !== "WITHDRAWN") {
    return NextResponse.json({ error: "Decisión inválida" }, { status: 400 });
  }

  await decidirWhatsapp(sesion.estudiante.institutionId, sesion.estudiante.id, decision);

  // La confirmación sólo puede decir lo que el estudiante hizo. **Nunca** que el
  // CRM vinculó el número ni que alguien va a escribirle: la Plataforma no
  // observa ese estado (ADR-042 §5-6).
  return NextResponse.json({ registrado: true }, { status: 201 });
}
