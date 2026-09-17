import { NextResponse } from "next/server";

import { empezarFocus, focusDe, proyectarSesionDeFocus } from "@/lib/server/composicion";
import { estudianteDeFocus, sesionNoEncontrada, UUID } from "@/lib/server/focus-http";

/**
 * `/api/focus` — **Modo Focus** · [ADR-104](../../../docs/decisions.md#adr-104).
 *
 * ⚠️ **Nada de esto crea `Evidence`, progreso ni cumplimiento.** Empezar lleva el
 * compromiso a `STARTED` y la acción a `IN_PROGRESS` por sus máquinas, y nada más.
 */

/** `GET` — la sesión abierta y, sin ninguna, sobre qué se podría empezar. `?sesion=<id>`, una sesión. */
export async function GET(request: Request) {
  const s = await estudianteDeFocus(request);
  if ("error" in s) return s.error;
  const { institutionId, id, timezone } = s.estudiante;

  const sesionId = new URL(request.url).searchParams.get("sesion");
  if (sesionId && !UUID.test(sesionId)) return sesionNoEncontrada();
  const vista = await focusDe(institutionId, id, timezone, sesionId);
  return vista ? NextResponse.json(vista) : sesionNoEncontrada();
}

/**
 * `POST { compromiso?, cursada? }` — empezar (`CTA-026`). Sin `compromiso`, el
 * que proyectan Hoy o Materia. Repetirlo devuelve la misma sesión.
 */
export async function POST(request: Request) {
  const s = await estudianteDeFocus(request);
  if ("error" in s) return s.error;
  const { institutionId, id, timezone } = s.estudiante;

  const cuerpo = (await request.json().catch(() => ({}))) as { compromiso?: string | null; cursada?: string | null } | null;
  const compromisoId = cuerpo?.compromiso ?? null;
  const cursadaId = cuerpo?.cursada ?? null;
  if ((compromisoId && !UUID.test(compromisoId)) || (cursadaId && !UUID.test(cursadaId))) {
    return NextResponse.json({ error: "No se encontró ese compromiso" }, { status: 404 });
  }

  const r = await empezarFocus(institutionId, { studentId: id, compromisoId, cursadaId });
  switch (r.estado) {
    case "OK":
      return NextResponse.json(
        { sesion: await proyectarSesionDeFocus(institutionId, r.sesion, timezone), duplicado: r.duplicado },
        { status: r.duplicado ? 200 : 201 },
      );
    // No es un error técnico: hay otra sesión abierta, y la pantalla la ofrece.
    case "YA_HAY_OTRA_ABIERTA":
      return NextResponse.json(
        { error: "Ya tenés una sesión de Focus abierta", motivo: "YA_HAY_OTRA_ABIERTA", sesion: r.sesion.id },
        { status: 409 },
      );
    case "NO_INICIABLE":
      return NextResponse.json({ error: "Este compromiso no se puede empezar ahora", motivo: "NO_INICIABLE" }, { status: 409 });
    case "SIN_COMPROMISO":
      return NextResponse.json({ error: "No hay un compromiso para empezar" }, { status: 404 });
  }
}
