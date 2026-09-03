import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import {
  compromisoDe,
  confirmarCompromiso,
  propuestaDeCompromiso,
  resolverSesion,
} from "@/lib/server/composicion";

/**
 * `GET /api/compromiso` — Controller de `UX04`. `?compromiso=<uuid>` opcional.
 *
 * Si el estudiante todavía no tiene compromiso sobre su acción vigente,
 * devuelve la **propuesta** — que no es una fila: D1·A dice que hasta que
 * confirme no hay nada persistido. Un `GET` no muta estado, y éste tampoco.
 */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const { institutionId, id: studentId } = sesion.estudiante;
  const pedido = new URL(request.url).searchParams.get("compromiso");

  /*
    La propuesta va **primero**, y el orden importa: la lectura devuelve el
    último compromiso del estudiante, que después de una vuelta cerrada es el
    `COMPLETED` de la anterior. Preguntando por él primero, la acción nueva
    parecía tener compromiso y la pantalla se quedaba sin CTA.

    `propuestaDeCompromiso` devuelve `null` si la acción vigente **sí** tiene un
    compromiso vivo, así que este orden no pisa nada real.
  */
  if (!pedido) {
    const propuesta = await propuestaDeCompromiso(institutionId, studentId);
    if (propuesta) {
      return NextResponse.json({ ...propuesta.props, propuesta: datosDeConfirmacion(propuesta) });
    }
  }

  const props = await compromisoDe(institutionId, studentId, pedido);
  if (props) return NextResponse.json(props);

  // Pedir uno puntual por `?compromiso=` y no encontrarlo sí es `404`: se pidió
  // una fila concreta.
  return NextResponse.json({ error: "Sin compromiso registrado" }, { status: 404 });
}

/** Lo que el cliente devuelve tal cual al confirmar. No lo recalcula. */
function datosDeConfirmacion(p: {
  actionId: string;
  startAt: string;
  timezone: string;
  plannedMinutes: number;
}) {
  return { accion: p.actionId, inicio: p.startAt, zona: p.timezone, minutos: p.plannedMinutes };
}

/**
 * `POST /api/compromiso` — **la intención explícita del estudiante.**
 *
 * Es el único camino por el que nace un `Commitment`, y el único por el que la
 * `Action` llega a `COMMITTED`. Aceptar una `Action` no crea un compromiso:
 * lo crea esto, cuando la persona confirma.
 *
 * `clave` es obligatoria y la genera el cliente (D2·A). Repetirla con el mismo
 * dueño, la misma `Action` y el mismo payload devuelve la fila que ya existe
 * —doble clic y reintento—; repetirla con otro dueño, otro recurso u otro
 * contenido es `409` **sin exponer la fila existente**.
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
    accion?: string;
    inicio?: string;
    zona?: string;
    minutos?: number;
    clave?: string;
  } | null;

  if (!cuerpo?.accion || !cuerpo.inicio || !cuerpo.zona || !cuerpo.minutos || !cuerpo.clave) {
    return NextResponse.json(
      { error: "Faltan `accion`, `inicio`, `zona`, `minutos` y `clave`" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(cuerpo.minutos) || cuerpo.minutos <= 0) {
    return NextResponse.json({ error: "`minutos` tiene que ser un entero positivo" }, { status: 400 });
  }

  const resultado = await confirmarCompromiso(sesion.estudiante.institutionId, {
    actionId: cuerpo.accion,
    estudianteId: sesion.estudiante.id,
    // Normalizado antes de comparar: dos representaciones del mismo instante
    // son el mismo pedido, no un conflicto.
    startAt: new Date(cuerpo.inicio).toISOString(),
    timezone: cuerpo.zona,
    plannedMinutes: cuerpo.minutos,
    claveDeIdempotencia: cuerpo.clave,
  });

  switch (resultado.estado) {
    case "OK":
      return NextResponse.json(
        { compromiso: resultado.compromiso.id, duplicado: resultado.duplicado },
        { status: resultado.duplicado ? 200 : 201 },
      );
    case "CONFLICTO_DE_CLAVE":
      return NextResponse.json({ error: "La clave ya se usó para otro pedido" }, { status: 409 });
    case "YA_COMPROMETIDA":
      return NextResponse.json({ error: "Esa acción ya tiene un compromiso vivo" }, { status: 409 });
    case "ACCION_NO_COMPROMETIBLE":
      return NextResponse.json({ error: resultado.motivo }, { status: 409 });
  }
}
