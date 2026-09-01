import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { activacionDe, activarPreparacion, resolverSesion } from "@/lib/server/composicion";

/**
 * Controller de `UX07` — Etapa B5.5.
 *
 * `GET` proyecta la activación; `POST` la ejecuta. Están en la misma ruta
 * porque son la misma decisión vista antes y después: leer con un verbo y
 * escribir con otro es lo que evita que un prefetch active una preparación.
 */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const cursada = new URL(request.url).searchParams.get("cursada");
  const props = await activacionDe(sesion.estudiante.institutionId, sesion.estudiante.id, cursada);
  if (!props) return NextResponse.json({ error: "Sin cursada activa" }, { status: 404 });

  return NextResponse.json(props);
}

/**
 * `POST` — `CTA-011`. `RECOMMENDED → ACTIVE`, y **nada más**.
 *
 * `SIN_PROTOCOLO` sale `409` y no `500`: que una evaluación oral no tenga
 * protocolo es un estado legítimo del mundo (`C01-047`), no una falla.
 */
export async function POST(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const cuerpo = (await request.json().catch(() => null)) as { preparacion?: string } | null;
  if (!cuerpo?.preparacion) {
    return NextResponse.json({ error: "Falta `preparacion`" }, { status: 400 });
  }

  const resultado = await activarPreparacion(
    sesion.estudiante.institutionId,
    cuerpo.preparacion,
    sesion.estudiante.id,
  );

  switch (resultado.estado) {
    case "OK":
      return NextResponse.json({ preparacion: resultado.entidad.id, status: resultado.entidad.state });
    case "NO_ENCONTRADO":
      return NextResponse.json({ error: "Preparación no encontrada" }, { status: 404 });
    case "SIN_PROTOCOLO":
      return NextResponse.json(
        { error: "Esta modalidad todavía no tiene protocolo en Achieve" },
        { status: 409 },
      );
    case "TRANSICION_PROHIBIDA":
      return NextResponse.json(
        { error: `No se puede activar desde ${resultado.desde}` },
        { status: 409 },
      );
    case "CONFLICTO":
      return NextResponse.json({ error: "Otra operación se adelantó" }, { status: 409 });
  }
}
