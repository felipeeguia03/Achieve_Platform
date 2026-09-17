import { NextResponse } from "next/server";

import { borrarAnalitico, subirAnalitico } from "@/lib/server/composicion";
import { estudianteDelRecorrido } from "@/lib/server/recorrido-http";
import { BYTES_MAXIMOS } from "@/lib/domain/analitico";

/**
 * `POST /api/recorrido/analitico` — subir el analítico (multipart, campo
 * `archivo`). `DELETE` — borrarlo. [ADR-106](../../../../docs/decisions.md#adr-106).
 *
 * ⚠️ **El archivo no se loguea ni vuelve en ningún error.** Las respuestas dicen
 * el motivo canónico, nunca el contenido.
 *
 * ⚠️ **El tipo lo decide la firma de bytes**, no el `Content-Type` ni la
 * extensión que mande el navegador.
 */
const MENSAJE: Record<string, string> = {
  VACIO: "El archivo está vacío.",
  TIPO_NO_ADMITIDO: "Por ahora aceptamos PDF, PNG o JPG.",
  DEMASIADO_GRANDE: "El archivo supera los 10 MB.",
  CORRUPTO: "No pudimos abrir el archivo: parece estar dañado.",
  PROTEGIDO: "El PDF tiene contraseña. Subí una versión sin protección.",
  DEMASIADAS_PAGINAS: "El PDF tiene más de 20 páginas.",
};

export async function POST(request: Request) {
  const r = await estudianteDelRecorrido(request);
  if ("error" in r) return r.error;

  const declarado = Number(request.headers.get("content-length") ?? "0");
  if (declarado > BYTES_MAXIMOS + 64 * 1024) {
    return NextResponse.json({ error: MENSAJE.DEMASIADO_GRANDE, motivo: "DEMASIADO_GRANDE" }, { status: 413 });
  }
  const form = await request.formData().catch(() => null);
  const archivo = form?.get("archivo");
  if (!archivo || typeof archivo === "string") {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }
  const bytes = new Uint8Array(await archivo.arrayBuffer());

  const resultado = await subirAnalitico(r.estudiante.institutionId, r.estudiante.id, bytes);
  switch (resultado.estado) {
    case "PROCESADO":
      return NextResponse.json(resultado, { status: resultado.repetido ? 200 : 201 });
    case "FALLIDO":
      // Un fallo de extracción **no es un error del pedido**: quedó registrado con su motivo.
      return NextResponse.json(resultado, { status: 201 });
    case "ARCHIVO_INVALIDO":
      return NextResponse.json({ error: MENSAJE[resultado.motivo], motivo: resultado.motivo }, { status: 400 });
    case "SIN_CONSENTIMIENTO":
      return NextResponse.json({ error: "Antes de subirlo, tenés que aceptar cómo lo vamos a usar." }, { status: 409 });
    case "SIN_PLAN":
      return NextResponse.json({ error: "Todavía no tenemos tu plan de estudios para reconocer las materias." }, { status: 409 });
  }
}

export async function DELETE(request: Request) {
  const r = await estudianteDelRecorrido(request);
  if ("error" in r) return r.error;
  const resultado = await borrarAnalitico(r.estudiante.institutionId, r.estudiante.id);
  return NextResponse.json(resultado);
}
