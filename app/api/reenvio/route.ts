import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { reenviarEvidencia, resolverSesion } from "@/lib/server/composicion";

/**
 * `POST /api/reenvio` — **la salida de una entrega devuelta** · Etapa B6.9.2.
 *
 * Con **JWT del estudiante**: volver a entregar es suyo. La contraparte de
 * `/api/pedido-de-reenvio`, que va con secreto de servicio porque es del que
 * evalúa.
 *
 * ## Por qué es una ruta propia y no un modo de `/api/evidencia`
 *
 * La primera entrega **crea** una evidencia contra un compromiso; ésta crea
 * **otra que sucede a una anterior** y la preserva (`I4`). Mismo criterio que
 * `/api/rescate`: cuando el efecto es otro, la ruta es otra.
 *
 * ## El archivo va primero, igual que en la primera entrega
 *
 * `?firmar=` reserva el id y devuelve la URL; el cliente sube; **recién después
 * llega acá**. Si el estudiante abandona a mitad queda un objeto huérfano y
 * ninguna fila que afirme una entrega que no ocurrió, que es el error caro de
 * los dos (`D3·A`).
 */
export async function POST(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const cuerpo = (await request.json().catch(() => null)) as {
    anterior?: string;
    evidencia?: string;
    clave?: string;
  } | null;

  if (!cuerpo?.anterior || !cuerpo.evidencia || !cuerpo.clave) {
    return NextResponse.json({ error: "Faltan `anterior`, `evidencia` y `clave`" }, { status: 400 });
  }

  const resultado = await reenviarEvidencia(sesion.estudiante.institutionId, {
    anteriorId: cuerpo.anterior,
    nuevaId: cuerpo.evidencia,
    estudianteId: sesion.estudiante.id,
    claveDeIdempotencia: cuerpo.clave,
  });

  switch (resultado.estado) {
    case "OK":
      return NextResponse.json({ evidencia: resultado.evidenciaId }, { status: 201 });
    // Un `404` seco: que exista y sea de otro, o que no exista, es la misma
    // respuesta. Distinguirlas sería un detector de entregas ajenas.
    case "NO_ES_SUYA":
      return NextResponse.json({ error: "No se encontró esa entrega" }, { status: 404 });
    case "NO_DEVUELTA":
      return NextResponse.json(
        { error: `Sólo se reenvía una entrega devuelta; ésa está ${resultado.desde}` },
        { status: 409 },
      );
    case "CONFLICTO":
      return NextResponse.json({ error: "Esa entrega ya tiene un reenvío" }, { status: 409 });
  }
}
