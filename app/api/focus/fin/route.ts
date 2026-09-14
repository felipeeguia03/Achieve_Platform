import { NextResponse } from "next/server";

import { cerrarFocus, proyectarSesionDeFocus, terminarSinSesionDeFocus } from "@/lib/server/composicion";
import { estudianteDeFocus, sesionNoEncontrada, UUID } from "@/lib/server/focus-http";

/**
 * `POST /api/focus/fin` — cerrar una sesión · [ADR-104](../../../../docs/decisions.md#adr-104).
 *
 * - `{ sesion, como: "SAVED", avance? }` — *Salir y guardar* (`CTA-027`).
 * - `{ sesion, como: "DONE", avance? }` — *Terminé · Subir evidencia* (`CTA-006`):
 *   además lleva la acción a `EVIDENCE_PENDING`. **El compromiso sigue `STARTED`**.
 * - `{ sesion, como: "RECUPERADA" }` — *Terminé cuando se cerró*: cierra en el
 *   último latido.
 * - `{ como: "DONE", compromiso? }` — *Terminé* **sin sesión**, para quien trabajó
 *   sin reloj.
 *
 * **Idempotente.** Nada de esto crea `Evidence`: la entrega es `UX05`.
 */
export async function POST(request: Request) {
  const s = await estudianteDeFocus(request);
  if ("error" in s) return s.error;
  const { institutionId, id, timezone } = s.estudiante;

  const cuerpo = (await request.json().catch(() => null)) as {
    sesion?: string | null;
    como?: string;
    avance?: string | null;
    compromiso?: string | null;
  } | null;
  const como = cuerpo?.como;
  if (como !== "SAVED" && como !== "DONE" && como !== "RECUPERADA") {
    return NextResponse.json({ error: "Falta `como`" }, { status: 400 });
  }

  if (!cuerpo?.sesion) {
    if (como !== "DONE") return NextResponse.json({ error: "Falta `sesion`" }, { status: 400 });
    if (cuerpo?.compromiso && !UUID.test(cuerpo.compromiso)) {
      return NextResponse.json({ error: "No se encontró ese compromiso" }, { status: 404 });
    }
    const r = await terminarSinSesionDeFocus(institutionId, { studentId: id, compromisoId: cuerpo?.compromiso ?? null, cursadaId: null });
    switch (r.estado) {
      case "OK":
        return NextResponse.json({ accion: r.accionId });
      case "HAY_UNA_SESION_ABIERTA":
        return NextResponse.json({ error: "Hay una sesión abierta", motivo: "HAY_UNA_SESION_ABIERTA", sesion: r.sesion.id }, { status: 409 });
      case "NO_INICIABLE":
        return NextResponse.json({ error: "Este compromiso no admite terminar ahora", motivo: "NO_INICIABLE" }, { status: 409 });
      case "SIN_COMPROMISO":
        return NextResponse.json({ error: "No hay un compromiso" }, { status: 404 });
    }
  }

  if (!UUID.test(cuerpo.sesion)) return sesionNoEncontrada();
  if (typeof cuerpo.avance !== "undefined" && cuerpo.avance !== null && typeof cuerpo.avance !== "string") {
    return NextResponse.json({ error: "`avance` es texto" }, { status: 400 });
  }

  const r = await cerrarFocus(institutionId, { studentId: id, sesionId: cuerpo.sesion, como, avance: cuerpo.avance ?? null });
  switch (r.estado) {
    case "OK":
      return NextResponse.json({ sesion: await proyectarSesionDeFocus(institutionId, r.sesion, timezone) });
    case "FASE_INVALIDA":
      return NextResponse.json({ error: "La sesión ya no está en ese momento", motivo: "FASE_INVALIDA", fase: r.fase }, { status: 409 });
    case "DEMASIADO_LARGO":
      return NextResponse.json({ error: "El avance es demasiado largo" }, { status: 400 });
    case "CONFIGURACION_INVALIDA":
      return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
    case "NO_ENCONTRADA":
      return sesionNoEncontrada();
  }
}
