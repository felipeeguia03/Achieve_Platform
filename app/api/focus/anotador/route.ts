import { NextResponse } from "next/server";

import { guardarAnotadorDeFocus } from "@/lib/server/composicion";
import { estudianteDeFocus, sesionNoEncontrada, UUID } from "@/lib/server/focus-http";

/**
 * `POST /api/focus/anotador { sesion, texto }` — *Para después* ·
 * [ADR-104](../../../../docs/decisions.md#adr-104) §12.
 *
 * ⛔ **Privado.** No emite eventos y no lo lee ninguna otra ruta que la de su
 * sesión. `POST` y no `PATCH` porque la pantalla lo manda también con
 * `keepalive` al irse, y ahí sólo vale lo más simple.
 */
export async function POST(request: Request) {
  const s = await estudianteDeFocus(request);
  if ("error" in s) return s.error;

  const cuerpo = (await request.json().catch(() => null)) as { sesion?: string; texto?: string | null } | null;
  if (!cuerpo?.sesion || !UUID.test(cuerpo.sesion)) return sesionNoEncontrada();
  if (cuerpo.texto !== null && cuerpo.texto !== undefined && typeof cuerpo.texto !== "string") {
    return NextResponse.json({ error: "`texto` es texto" }, { status: 400 });
  }

  const r = await guardarAnotadorDeFocus(s.estudiante.institutionId, {
    studentId: s.estudiante.id,
    sesionId: cuerpo.sesion,
    texto: cuerpo.texto ?? null,
  });
  switch (r.estado) {
    case "OK":
      return NextResponse.json({ guardado: true });
    case "DEMASIADO_LARGO":
      return NextResponse.json({ error: "Demasiado largo" }, { status: 400 });
    case "NO_ENCONTRADA":
      return sesionNoEncontrada();
  }
}
