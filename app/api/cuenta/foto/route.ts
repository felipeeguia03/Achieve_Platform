import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { firmarSubidaDeFoto, fotoDePerfil, identidadDeCuenta } from "@/lib/server/composicion";

/**
 * `GET /api/cuenta/foto` — la foto de perfil, con URL firmada de corta duración
 * ([ADR-097 · Enmienda 2](../../../../docs/decisions.md#adr-097-enmienda-2)).
 * `{ url: null }` ⇒ no cargó ninguna, y el avatar dibuja las iniciales.
 */
export async function GET(request: Request) {
  const identidad = await identidadDeCuenta(tokenDelHeader(request.headers.get("authorization")));
  if (!identidad) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  return NextResponse.json({ url: await fotoDePerfil(identidad.authUserId) });
}

/**
 * `POST /api/cuenta/foto` — firma la subida. El archivo va **directo** del
 * navegador a Storage, que hace cumplir el tamaño y los tipos del bucket.
 */
export async function POST(request: Request) {
  const identidad = await identidadDeCuenta(tokenDelHeader(request.headers.get("authorization")));
  if (!identidad) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  return NextResponse.json(await firmarSubidaDeFoto(identidad.authUserId));
}
