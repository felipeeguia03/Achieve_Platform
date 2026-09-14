import { NextResponse } from "next/server";

import { responderPreguntaDelRecorrido } from "@/lib/server/composicion";
import { estudianteDelRecorrido } from "@/lib/server/recorrido-http";

/**
 * `POST /api/recorrido/respuesta` — contestar, saltear, *No estoy seguro* o
 * *Prefiero no responder*. [ADR-107](../../../../docs/decisions.md#adr-107).
 * Append-only: contestar de nuevo es otra fila.
 */
const ESTADOS = ["ANSWERED", "UNSURE", "PREFER_NOT_TO_SAY", "SKIPPED"] as const;

export async function POST(request: Request) {
  const r = await estudianteDelRecorrido(request);
  if ("error" in r) return r.error;
  const cuerpo = (await request.json().catch(() => null)) as {
    clave?: string;
    estado?: string;
    opciones?: unknown;
    textoLibre?: unknown;
  } | null;
  const estado = ESTADOS.find((e) => e === cuerpo?.estado);
  if (!cuerpo?.clave || !estado) return NextResponse.json({ error: "Faltan la pregunta o el estado" }, { status: 400 });
  const opciones = Array.isArray(cuerpo.opciones) ? cuerpo.opciones.filter((o): o is string => typeof o === "string") : [];
  const textoLibre = typeof cuerpo.textoLibre === "string" && cuerpo.textoLibre.trim() ? cuerpo.textoLibre : null;

  const res = await responderPreguntaDelRecorrido(r.estudiante.institutionId, r.estudiante.id, {
    clave: cuerpo.clave,
    estado,
    opciones,
    textoLibre,
  });
  switch (res.estado) {
    case "OK":
      return NextResponse.json(res, { status: 201 });
    case "NO_DISPONIBLE":
      return NextResponse.json({ error: "Esa pregunta ya no está" }, { status: 404 });
    case "DATOS_INVALIDOS":
      return NextResponse.json({ error: res.motivo }, { status: 400 });
  }
}
