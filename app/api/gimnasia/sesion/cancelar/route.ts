import { NextResponse } from "next/server";

import { cancelarSesionDeGimnasia } from "@/lib/server/composicion";
import { cuerpoDe, estudianteDe, noEncontrado, UUID } from "../../_sesion";

/**
 * `POST /api/gimnasia/sesion/cancelar { sesion }` — descartar la sesión ·
 * [ADR-102](../../../../../docs/decisions.md#adr-102).
 *
 * **Idempotente:** `200` también si ya estaba cerrada. Lo terminado adentro
 * queda guardado. `404` si no es suya.
 */
export async function POST(request: Request) {
  const s = await estudianteDe(request);
  if ("error" in s) return s.error;
  const cuerpo = await cuerpoDe(request);
  const sesionId = cuerpo?.sesion;
  if (typeof sesionId !== "string" || !UUID.test(sesionId)) return noEncontrado("esa sesión");

  const r = await cancelarSesionDeGimnasia(s.institutionId, { studentId: s.estudiante.studentId, sesionId });
  return r.estado === "OK"
    ? NextResponse.json({ sesion: r.sesion, duplicado: r.duplicado })
    : noEncontrado("esa sesión");
}
