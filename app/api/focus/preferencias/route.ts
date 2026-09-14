import { NextResponse } from "next/server";

import { guardarPreferenciasDeFocus } from "@/lib/server/composicion";
import { estudianteDeFocus } from "@/lib/server/focus-http";

/**
 * `POST /api/focus/preferencias` — sonido, volumen, último modo y preset ·
 * [ADR-104](../../../../docs/decisions.md#adr-104) §18. **Preferencia, no perfil.**
 */
export async function POST(request: Request) {
  const s = await estudianteDeFocus(request);
  if ("error" in s) return s.error;
  const cuerpo = await request.json().catch(() => null);
  const r = await guardarPreferenciasDeFocus(s.estudiante.institutionId, { studentId: s.estudiante.id, preferencias: cuerpo });
  return r.estado === "OK"
    ? NextResponse.json({ preferencias: r.preferencias })
    : NextResponse.json({ error: "Preferencias inválidas" }, { status: 400 });
}
