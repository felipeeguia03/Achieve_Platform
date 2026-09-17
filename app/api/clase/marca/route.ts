import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { completarMarcaDeClase, marcarEnClase, resolverSesion } from "@/lib/server/composicion";

/**
 * `/api/clase/marca` — marcar un momento de la clase ·
 * [ADR-098](../../../../docs/decisions.md#adr-098) §3.
 *
 * ⚠️ **Una marca no es un reporte de clase** (`class_event_record`, `C01-004`)
 * **ni un evento de producto**. Es un señalador del estudiante.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function sesionDe(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) } as const;
  }
  if (sesion.estado === "SIN_PADRON") {
    return { error: NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 }) } as const;
  }
  const pendiente = altaPendiente(sesion.alta);
  if (pendiente) return { error: NextResponse.json(pendiente, { status: 409 }) } as const;
  return { estudiante: sesion.estudiante } as const;
}

/** `POST { clase, tipo, clave, texto? }` — un toque. `201`, o `200` si es un reintento. */
export async function POST(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;

  const cuerpo = (await request.json().catch(() => null)) as {
    clase?: string;
    tipo?: unknown;
    clave?: string;
    texto?: string | null;
  } | null;
  if (!cuerpo?.clase || typeof cuerpo.clave !== "string") {
    return NextResponse.json({ error: "Faltan `clase`, `tipo` y `clave`" }, { status: 400 });
  }
  if (!UUID.test(cuerpo.clase)) return NextResponse.json({ error: "No se encontró esa clase" }, { status: 404 });

  const r = await marcarEnClase(s.estudiante.institutionId, {
    studentId: s.estudiante.id,
    claseId: cuerpo.clase,
    tipo: cuerpo.tipo,
    clave: cuerpo.clave,
    texto: typeof cuerpo.texto === "string" ? cuerpo.texto : null,
  });
  switch (r.estado) {
    case "OK":
      return NextResponse.json(
        { marca: r.marca.id, segundos: r.marca.segundos, duplicado: r.duplicado },
        { status: r.duplicado ? 200 : 201 },
      );
    case "NO_ENCONTRADA":
      return NextResponse.json({ error: "No se encontró esa clase" }, { status: 404 });
    case "TIPO_INVALIDO":
      return NextResponse.json({ error: "`tipo` no es una marca" }, { status: 400 });
    case "SIN_CLAVE":
      return NextResponse.json({ error: "Falta `clave`" }, { status: 400 });
    case "DEMASIADO_LARGO":
      return NextResponse.json({ error: "El texto supera el máximo" }, { status: 400 });
    case "CLASE_TERMINADA":
      return NextResponse.json({ error: "La clase ya terminó", motivo: "CLASE_TERMINADA" }, { status: 409 });
    case "CONFLICTO_DE_CLAVE":
      return NextResponse.json({ error: "La clave ya se usó para otra marca" }, { status: 409 });
  }
}

/** `PATCH { marca, texto }` — *"¿Qué no entendiste?"*, después. */
export async function PATCH(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;

  const cuerpo = (await request.json().catch(() => null)) as { marca?: string; texto?: unknown } | null;
  if (!cuerpo?.marca || !(typeof cuerpo.texto === "string" || cuerpo.texto === null)) {
    return NextResponse.json({ error: "Faltan `marca` y `texto`" }, { status: 400 });
  }
  if (!UUID.test(cuerpo.marca)) return NextResponse.json({ error: "No se encontró esa marca" }, { status: 404 });

  const r = await completarMarcaDeClase(s.estudiante.institutionId, {
    studentId: s.estudiante.id,
    marcaId: cuerpo.marca,
    texto: cuerpo.texto,
  });
  switch (r.estado) {
    case "OK":
      return NextResponse.json({ marca: r.marca.id, texto: r.marca.texto });
    case "NO_ENCONTRADA":
      return NextResponse.json({ error: "No se encontró esa marca" }, { status: 404 });
    case "DEMASIADO_LARGO":
      return NextResponse.json({ error: "El texto supera el máximo" }, { status: 400 });
  }
}
