import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { borrarGrabacionDeClase, escucharGrabacionDeClase, registrarGrabacionDeClase, resolverSesion } from "@/lib/server/composicion";

/**
 * `/api/clase/grabacion` — las grabaciones de audio de una clase ·
 * [ADR-099](../../../../docs/decisions.md#adr-099) §2.
 *
 * ⛔ **Sin transcripción.** Se guarda, se escucha, se etiqueta y se borra.
 * Lo ajeno es `404`.
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


const noEncontrada = () => NextResponse.json({ error: "No se encontró esa grabación" }, { status: 404 });

/** `GET ?grabacion=<id>` → `{ url }` firmada para escuchar. */
export async function GET(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;
  const id = new URL(request.url).searchParams.get("grabacion");
  if (!id || !UUID.test(id)) return noEncontrada();
  const r = await escucharGrabacionDeClase(s.estudiante.institutionId, { studentId: s.estudiante.id, grabacionId: id });
  return r.estado === "OK" ? NextResponse.json({ url: r.url }) : noEncontrada();
}

/** `POST { clase, clave, idempotencia, duracion, etiquetas: [{ texto, segundo }] }` — una grabación **ya subida**. */
export async function POST(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;
  const c = await leer(request);
  if (typeof c.clase !== "string" || !UUID.test(c.clase)) return NextResponse.json({ error: "No se encontró esa clase" }, { status: 404 });
  const etiquetas = Array.isArray(c.etiquetas) ? (c.etiquetas as Array<{ texto: unknown; segundo: unknown }>) : [];

  const r = await registrarGrabacionDeClase(s.estudiante.institutionId, {
    studentId: s.estudiante.id,
    claseId: c.clase,
    clave: c.clave,
    idempotencia: texto(c.idempotencia),
    duracion: c.duracion,
    etiquetas,
  });
  switch (r.estado) {
    case "OK":
      return NextResponse.json({ grabacion: r.grabacion.id, duplicado: r.duplicado }, { status: r.duplicado ? 200 : 201 });
    case "NO_ENCONTRADA":
    case "CLAVE_AJENA":
      return NextResponse.json({ error: "No se encontró esa clase" }, { status: 404 });
    case "NO_SUBIDO":
      return NextResponse.json({ error: "La grabación no terminó de subir", motivo: "NO_SUBIDO" }, { status: 409 });
    case "TIPO_NO_ADMITIDO":
      return malPedido("Ese formato de audio no se puede subir");
    case "DEMASIADO_GRANDE":
      return malPedido("La grabación supera los 50 MB");
    case "DURACION_INVALIDA":
      return malPedido("La duración no es válida");
    case "ETIQUETA_INVALIDA":
      return malPedido("Una etiqueta no es válida");
    case "SIN_CLAVE":
      return malPedido("Falta `idempotencia`");
  }
}

/** `DELETE { grabacion }` — borra el audio y la fila, con sus etiquetas. */
export async function DELETE(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;
  const c = await leer(request);
  if (typeof c.grabacion !== "string" || !UUID.test(c.grabacion)) return noEncontrada();
  const r = await borrarGrabacionDeClase(s.estudiante.institutionId, { studentId: s.estudiante.id, grabacionId: c.grabacion });
  return r.estado === "OK" ? NextResponse.json({ borrada: c.grabacion }) : noEncontrada();
}
