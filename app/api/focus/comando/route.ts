import { NextResponse } from "next/server";

import { comandoDeFocus, proyectarSesionDeFocus } from "@/lib/server/composicion";
import { estudianteDeFocus, sesionNoEncontrada, UUID } from "@/lib/server/focus-http";
import type { ComandoEntrante } from "@/lib/server/servicios/focus";

const TIPOS = ["PAUSAR", "CONTINUAR", "VOLVER_ANTES", "LATIDO", "POMODORO", "RECUPERAR"];

/**
 * `POST /api/focus/comando { sesion, comando }` — pausar, continuar, pasar a
 * Pomodoro, volver antes, latir o recuperar · [ADR-104](../../../../docs/decisions.md#adr-104).
 *
 * **El instante lo pone el servidor.** El cuerpo no lleva ningún tiempo: un reloj
 * del cliente no escribe dominio (AGENTS.md §2.3). Un comando que ya no
 * corresponde a la fase contesta `409` con la sesión como está.
 */
export async function POST(request: Request) {
  const s = await estudianteDeFocus(request);
  if ("error" in s) return s.error;
  const { institutionId, id, timezone } = s.estudiante;

  const cuerpo = (await request.json().catch(() => null)) as { sesion?: string; comando?: { tipo?: string } } | null;
  if (!cuerpo?.sesion || !UUID.test(cuerpo.sesion)) return sesionNoEncontrada();
  if (!cuerpo.comando?.tipo || !TIPOS.includes(cuerpo.comando.tipo)) {
    return NextResponse.json({ error: "Comando desconocido" }, { status: 400 });
  }

  const r = await comandoDeFocus(institutionId, {
    studentId: id,
    sesionId: cuerpo.sesion,
    comando: cuerpo.comando as ComandoEntrante,
  });
  switch (r.estado) {
    case "OK":
      return NextResponse.json({ sesion: await proyectarSesionDeFocus(institutionId, r.sesion, timezone) });
    case "FASE_INVALIDA":
      return NextResponse.json(
        { error: "La sesión ya no está en ese momento", motivo: "FASE_INVALIDA", fase: r.fase },
        { status: 409 },
      );
    case "CONFIGURACION_INVALIDA":
      return NextResponse.json({ error: "La configuración no es válida" }, { status: 400 });
    case "DEMASIADO_LARGO":
      return NextResponse.json({ error: "Demasiado largo" }, { status: 400 });
    case "NO_ENCONTRADA":
      return sesionNoEncontrada();
  }
}
