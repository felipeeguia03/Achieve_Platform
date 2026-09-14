import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { declararCursada, opcionesDeCursada, resolverSesion } from "@/lib/server/composicion";
import type { RespuestaDeCursada } from "@/lib/domain/cursada";

/**
 * `GET|POST /api/alta/cursada` — el cuarto paso del alta: comisión y horarios.
 * [ADR-105](../../../../docs/decisions.md#adr-105), que construye ADR-062 y ADR-063.
 *
 * **No exige `altaPendiente`**: es un paso *del* alta, como disponibilidad.
 *
 * ⚠️ **El estudiante sale de la sesión, nunca del pedido.** Una cursada ajena
 * se rechaza en la base con `CURSADA_AJENA`, y se contesta `404`.
 */
async function sesionDelAlta(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) } as const;
  }
  if (sesion.estado === "SIN_PADRON") {
    return { error: NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 }) } as const;
  }
  return { sesion } as const;
}

export async function GET(request: Request) {
  const r = await sesionDelAlta(request);
  if ("error" in r) return r.error;
  const cursadas = await opcionesDeCursada(r.sesion.estudiante.institutionId, r.sesion.estudiante.id);
  return NextResponse.json({ cursadas });
}

export async function POST(request: Request) {
  const r = await sesionDelAlta(request);
  if ("error" in r) return r.error;

  const cuerpo = (await request.json().catch(() => null)) as { cursadas?: RespuestaDeCursada[] } | null;
  if (!cuerpo || !Array.isArray(cuerpo.cursadas)) {
    return NextResponse.json({ error: "Faltan las materias" }, { status: 400 });
  }

  const resultado = await declararCursada(
    r.sesion.estudiante.institutionId,
    r.sesion.estudiante.id,
    cuerpo.cursadas,
  );

  switch (resultado.estado) {
    case "OK":
      return NextResponse.json({ cursadas: resultado.cursadas }, { status: 201 });
    case "DATOS_INVALIDOS":
      return NextResponse.json({ error: resultado.motivo, cursada: resultado.cursadaId }, { status: 400 });
    case "FALTAN_MATERIAS":
      return NextResponse.json(
        { error: "Falta contestar algunas materias", cursadas: resultado.cursadas },
        { status: 400 },
      );
    case "RECHAZADO":
      return resultado.motivo === "CURSADA_AJENA"
        ? NextResponse.json({ error: "No encontramos esa materia" }, { status: 404 })
        : NextResponse.json({ error: resultado.motivo }, { status: 400 });
  }
}
