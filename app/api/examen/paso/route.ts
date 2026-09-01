import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { completarPasoDeProtocolo, pasoDe, resolverSesion } from "@/lib/server/composicion";

/** `GET /api/examen/paso?preparacion=<uuid>&paso=<uuid>` — Controller de `UX09`. */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const preparacion = params.get("preparacion");
  const paso = params.get("paso");
  if (!preparacion || !paso) {
    return NextResponse.json({ error: "Faltan `preparacion` y `paso`" }, { status: 400 });
  }

  const props = await pasoDe(
    sesion.estudiante.institutionId,
    sesion.estudiante.id,
    preparacion,
    paso,
  );
  if (!props) return NextResponse.json({ error: "Paso no encontrado" }, { status: 404 });

  return NextResponse.json(props);
}

/**
 * `POST` — completar el paso, **otra vez si hace falta**.
 *
 * El cuerpo puede traer `tema`: la fuente profesional habla de repetir *"varias
 * veces sobre un mismo tema"*, y sin el tema la vuelta se puede contar pero no
 * se puede leer.
 *
 * Un rechazo sale `409`, no `500`: que un paso no reentrante ya esté completado
 * es una respuesta del dominio, no una falla del servidor.
 */
export async function POST(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const cuerpo = (await request.json().catch(() => null)) as
    | { preparacion?: string; paso?: string; tema?: string; clave?: string }
    | null;
  if (!cuerpo?.preparacion || !cuerpo.paso) {
    return NextResponse.json({ error: "Faltan `preparacion` y `paso`" }, { status: 400 });
  }

  const resultado = await completarPasoDeProtocolo({
    institutionId: sesion.estudiante.institutionId,
    preparacionId: cuerpo.preparacion,
    pasoId: cuerpo.paso,
    topicId: cuerpo.tema ?? null,
    confirmadoPor: sesion.estudiante.id,
    claveDeIdempotencia: cuerpo.clave,
  });

  if (resultado.estado === "RECHAZADO") {
    return NextResponse.json({ error: resultado.motivo }, { status: 409 });
  }

  return NextResponse.json({
    completion: resultado.completionId,
    vuelta: resultado.vuelta,
    duplicado: resultado.duplicado,
  });
}
