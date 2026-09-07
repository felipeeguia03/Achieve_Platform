import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import { declararEvaluacion, resolverSesion } from "@/lib/server/composicion";

/**
 * `POST /api/evaluacion` — **el alta de evaluación** · [ADR-067](../../../docs/decisions.md#adr-067).
 *
 * Con JWT del estudiante, porque la evaluación que declara es de su cursada.
 *
 * ## Lo que esta ruta no hace
 *
 * **No activa Modo Examen.** Declarar que existe un final no es empezar a
 * prepararlo: eso es `CTA-011` sobre `POST /api/examen/activacion`, con
 * confirmación explícita.
 *
 * **No escribe el alcance.** Qué unidades entran es `assessment_topic`, que se
 * declara aparte y nunca se infiere del texto de `scope`.
 *
 * **No eleva procedencia.** La fila entra `unverified` y se queda ahí.
 */
export async function POST(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  // El alta primero (ADR-052). Declarar una evaluación sobre un mapa académico
  // que todavía no existe no tendría a qué cursada colgarse.
  const pendiente = altaPendiente(sesion.alta);
  if (pendiente) return NextResponse.json(pendiente, { status: 409 });

  const cuerpo = (await request.json().catch(() => null)) as {
    cursada?: string;
    tipo?: string;
    titulo?: string;
    fecha?: string;
    hora?: string;
    modalidad?: string;
    alcance?: string;
  } | null;

  if (!cuerpo) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });

  const resultado = await declararEvaluacion(sesion.estudiante.institutionId, sesion.estudiante.id, {
    cursadaId: cuerpo.cursada ?? "",
    tipo: cuerpo.tipo ?? "",
    titulo: cuerpo.titulo ?? "",
    fecha: cuerpo.fecha,
    hora: cuerpo.hora,
    modalidad: cuerpo.modalidad,
    alcance: cuerpo.alcance,
  });

  switch (resultado.estado) {
    case "OK":
      return NextResponse.json({ evaluacion: resultado.evaluacionId }, { status: 201 });
    case "DATOS_INVALIDOS":
      // El motivo llega a la pantalla: un 400 sin explicación deja al
      // estudiante sin saber qué corregir.
      return NextResponse.json({ error: resultado.motivo }, { status: 400 });
    case "CURSADA_AJENA":
      // `404` y no `403`: contestar distinto diría cuáles ids existen.
      return NextResponse.json({ error: "Esa materia no es tuya" }, { status: 404 });
  }
}
