import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { cerrarSesionDeDispositivo, dispositivosDe, identidadDeCuenta } from "@/lib/server/composicion";

/**
 * `GET /api/cuenta/dispositivos` — las sesiones abiertas de esta identidad
 * ([ADR-097 · Enmienda 2](../../../../docs/decisions.md#adr-097-enmienda-2)).
 *
 * ⚠️ **No acepta parámetros.** De quién son las sesiones lo dice el token.
 */
export async function GET(request: Request) {
  const identidad = await identidadDeCuenta(tokenDelHeader(request.headers.get("authorization")));
  if (!identidad) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  return NextResponse.json({ dispositivos: await dispositivosDe(identidad.authUserId, identidad.sesionId) });
}

/**
 * `POST /api/cuenta/dispositivos` `{ sesion }` — cierra la sesión de otro
 * dispositivo. **La de éste no**: para eso está «Cerrar sesión», que además
 * limpia el espacio de trabajo del navegador (ADR-088 §4).
 */
export async function POST(request: Request) {
  const identidad = await identidadDeCuenta(tokenDelHeader(request.headers.get("authorization")));
  if (!identidad) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const cuerpo = (await request.json().catch(() => ({}))) as { sesion?: unknown };
  if (typeof cuerpo.sesion !== "string" || !/^[0-9a-f-]{36}$/i.test(cuerpo.sesion)) {
    return NextResponse.json({ error: "Falta la sesión" }, { status: 400 });
  }
  if (cuerpo.sesion === identidad.sesionId) {
    return NextResponse.json({ error: "Para salir de este dispositivo usá «Cerrar sesión»" }, { status: 409 });
  }

  const cerrada = await cerrarSesionDeDispositivo(identidad.authUserId, cuerpo.sesion);
  if (!cerrada) return NextResponse.json({ error: "Esa sesión ya no está abierta" }, { status: 404 });
  return NextResponse.json({ cerrada: true });
}
