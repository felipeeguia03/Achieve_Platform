import { NextResponse } from "next/server";

import { esSecretoDeServicio, tokenDelHeader } from "@/lib/server/http";
import { pedirReenvio } from "@/lib/server/composicion";

/**
 * `POST /api/pedido-de-reenvio` — **el eslabón que faltaba** · Etapa B6.9.2.
 *
 * Entre *"esta entrega no alcanza"* y *"entregá de nuevo"* hay dos decisiones,
 * no una: la máquina las tiene separadas —`SUBMITTED → INSUFFICIENT →
 * RESUBMISSION_REQUESTED`— porque juzgar que algo no alcanza **no obliga** a
 * pedir otra cosa. Hasta acá nadie escribía el segundo estado, así que
 * `resubmitir()` —que lo exige— era inalcanzable.
 *
 * **Secreto de servicio, nunca el JWT del estudiante.** Nadie se pide a sí
 * mismo que vuelva a entregar. Es el mismo actor que valida, y `C01-030` sigue
 * abierta: quién es esa identidad no se valida contra nada.
 *
 * **El motivo es obligatorio.** Sin él el estudiante recibe una orden y ninguna
 * pista de qué corregir, que es lo mismo que no pedirle nada.
 *
 * ## Por qué no se recibe quién lo pide
 *
 * `product_event.actor_id` es `uuid` y quien evalúa hoy es **identidad externa
 * sin FK** (`C01-030`, `OPEN`). Aceptar un `pedidoPor` obligaría a fabricar un
 * UUID para llenar la columna —inventar una identidad— o a romper con un `500`
 * en cuanto llegue cualquier cosa que no sea un UUID, que es exactamente lo que
 * pasó la primera vez que se corrió esto.
 *
 * Misma decisión que tomó la validación en [ADR-040](../../../docs/decisions.md#adr-040):
 * **el actor del evento es `null`** —lo produjo un proceso, no una persona— y
 * lo que sí queda escrito es **el motivo**, en la fila. Cuando `C01-030` se
 * cierre, quién pidió el reenvío entra por donde entre la identidad del que
 * valida, y por el mismo camino.
 */
export async function POST(request: Request) {
  const token = tokenDelHeader(request.headers.get("authorization"));
  if (!esSecretoDeServicio(token, process.env.RELOJ_SHARED_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cuerpo = (await request.json().catch(() => null)) as {
    institucionId?: string;
    evidenciaId?: string;
    motivo?: string;
  } | null;

  if (!cuerpo?.institucionId || !cuerpo.evidenciaId || !cuerpo.motivo?.trim()) {
    return NextResponse.json(
      { error: "Faltan `institucionId`, `evidenciaId` y `motivo`" },
      { status: 400 },
    );
  }

  const resultado = await pedirReenvio(cuerpo.institucionId, cuerpo.evidenciaId, cuerpo.motivo);

  switch (resultado.estado) {
    case "OK":
      return NextResponse.json({ evidencia: resultado.evidencia.id, estado: resultado.evidencia.state });
    case "NO_ENCONTRADA":
      return NextResponse.json({ error: "No se encontró esa evidencia" }, { status: 404 });
    case "TRANSICION_PROHIBIDA":
      return NextResponse.json(
        { error: `Sólo se pide reenvío de una entrega insuficiente; ésa está ${resultado.desde}` },
        { status: 409 },
      );
    case "FALTA_MOTIVO":
      return NextResponse.json({ error: "Pedir un reenvío exige decir por qué" }, { status: 400 });
    default:
      return NextResponse.json({ error: "Alguien se adelantó" }, { status: 409 });
  }
}
