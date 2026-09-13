import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { anotarEnClase, borrarApunteDeClase, editarApunteDeClase, resolverSesion } from "@/lib/server/composicion";

/**
 * `/api/clase/apunte` — **los apuntes, una entrada por Enter** ·
 * [ADR-099](../../../../docs/decisions.md#adr-099) §4.
 *
 * ⚠️ **Lo ajeno es `404`, nunca `403`.** El estudiante sale de la sesión.
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

const leer = async (request: Request) => ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
const texto = (v: unknown) => (typeof v === "string" ? v : "");
const malPedido = (error: string) => NextResponse.json({ error }, { status: 400 });


const noEncontrado = () => NextResponse.json({ error: "No se encontró ese apunte" }, { status: 404 });

/** `POST { clase, texto, clave }` — `201`, o `200` si es un reintento. */
export async function POST(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;
  const c = await leer(request);
  if (typeof c.clase !== "string" || !UUID.test(c.clase)) return NextResponse.json({ error: "No se encontró esa clase" }, { status: 404 });

  const r = await anotarEnClase(s.estudiante.institutionId, {
    studentId: s.estudiante.id,
    claseId: c.clase,
    texto: texto(c.texto),
    clave: texto(c.clave),
  });
  switch (r.estado) {
    case "OK":
      return NextResponse.json({ apunte: r.apunte, duplicado: r.duplicado }, { status: r.duplicado ? 200 : 201 });
    case "NO_ENCONTRADA":
      return NextResponse.json({ error: "No se encontró esa clase" }, { status: 404 });
    case "VACIO":
      return malPedido("El apunte está vacío");
    case "DEMASIADO_LARGO":
      return malPedido("El apunte supera el máximo");
    case "SIN_CLAVE":
      return malPedido("Falta `clave`");
  }
}

/** `PATCH { apunte, texto }` — editar una entrada. */
export async function PATCH(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;
  const c = await leer(request);
  if (typeof c.apunte !== "string" || !UUID.test(c.apunte)) return noEncontrado();

  const r = await editarApunteDeClase(s.estudiante.institutionId, {
    studentId: s.estudiante.id,
    apunteId: c.apunte,
    texto: texto(c.texto),
  });
  switch (r.estado) {
    case "OK":
      return NextResponse.json({ apunte: r.apunte });
    case "NO_ENCONTRADA":
      return noEncontrado();
    case "VACIO":
      return malPedido("El apunte está vacío");
    case "DEMASIADO_LARGO":
      return malPedido("El apunte supera el máximo");
  }
}

/** `DELETE { apunte }`. */
export async function DELETE(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;
  const c = await leer(request);
  if (typeof c.apunte !== "string" || !UUID.test(c.apunte)) return noEncontrado();
  const r = await borrarApunteDeClase(s.estudiante.institutionId, { studentId: s.estudiante.id, apunteId: c.apunte });
  return r.estado === "OK" ? NextResponse.json({ borrado: c.apunte }) : noEncontrado();
}
