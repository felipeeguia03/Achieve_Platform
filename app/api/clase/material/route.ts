import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { abrirMaterialDeClase, borrarMaterialDeClase, registrarArchivoDeClase, registrarLinkDeClase, resolverSesion } from "@/lib/server/composicion";

/**
 * `/api/clase/material` — archivos y links de la clase ·
 * [ADR-099](../../../../docs/decisions.md#adr-099) §5.
 *
 * ⚠️ **No es `Evidence` ni material de cátedra.** Es lo que el estudiante guardó
 * de su clase. Lo ajeno es `404`.
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


const noEncontrado = () => NextResponse.json({ error: "No se encontró ese material" }, { status: 404 });

/** `GET ?material=<id>` → `{ url }`: el link, o una URL firmada de lectura. */
export async function GET(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;
  const id = new URL(request.url).searchParams.get("material");
  if (!id || !UUID.test(id)) return noEncontrado();
  const r = await abrirMaterialDeClase(s.estudiante.institutionId, { studentId: s.estudiante.id, materialId: id });
  return r.estado === "OK" ? NextResponse.json({ url: r.url }) : noEncontrado();
}

/**
 * `POST { clase, link: { url, titulo? } }` · o ·
 * `POST { clase, archivo: { clave, nombre } }` — un archivo **ya subido**.
 */
export async function POST(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;
  const c = await leer(request);
  if (typeof c.clase !== "string" || !UUID.test(c.clase)) return NextResponse.json({ error: "No se encontró esa clase" }, { status: 404 });
  const base = { studentId: s.estudiante.id, claseId: c.clase };
  const link = c.link as Record<string, unknown> | undefined;
  const archivo = c.archivo as Record<string, unknown> | undefined;

  let r;
  if (link && typeof link === "object") {
    r = await registrarLinkDeClase(s.estudiante.institutionId, {
      ...base,
      url: link.url,
      titulo: typeof link.titulo === "string" ? link.titulo : null,
    });
  } else if (archivo && typeof archivo === "object") {
    r = await registrarArchivoDeClase(s.estudiante.institutionId, {
      ...base,
      clave: archivo.clave,
      nombre: texto(archivo.nombre),
    });
  } else {
    return malPedido("Falta `link` o `archivo`");
  }

  switch (r.estado) {
    case "OK":
      return NextResponse.json({ material: r.material, duplicado: r.duplicado }, { status: r.duplicado ? 200 : 201 });
    case "NO_ENCONTRADA":
    // Una clave de otra clase se contesta igual que una clase que no existe.
    case "CLAVE_AJENA":
      return NextResponse.json({ error: "No se encontró esa clase" }, { status: 404 });
    case "NO_SUBIDO":
      return NextResponse.json({ error: "El archivo no terminó de subir", motivo: "NO_SUBIDO" }, { status: 409 });
    case "TIPO_NO_ADMITIDO":
      return malPedido("Ese tipo de archivo no se puede subir");
    case "DEMASIADO_GRANDE":
      return malPedido("El archivo supera los 25 MB");
    case "LINK_INVALIDO":
      return malPedido("El link tiene que empezar con http:// o https://");
  }
}

/** `DELETE { material }` — borra el archivo del storage y la fila. */
export async function DELETE(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;
  const c = await leer(request);
  if (typeof c.material !== "string" || !UUID.test(c.material)) return noEncontrado();
  const r = await borrarMaterialDeClase(s.estudiante.institutionId, { studentId: s.estudiante.id, materialId: c.material });
  return r.estado === "OK" ? NextResponse.json({ borrado: c.material }) : noEncontrado();
}
