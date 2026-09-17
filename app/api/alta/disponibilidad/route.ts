import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { declararDisponibilidad, resolverSesion } from "@/lib/server/composicion";

/**
 * `POST /api/alta/disponibilidad` — [ADR-073](../../../../docs/decisions.md#adr-073).
 *
 * El paso del alta que faltaba, y la tabla que nadie escribía: `availability`
 * existe desde la Fase B1 y sólo la sembraba `db-demo.sh`.
 *
 * ## Lo que esta ruta no hace
 *
 * **No exige `altaPendiente`.** Es un paso *del* alta: pedirle que el alta esté
 * completa sería pedirle que ya haya pasado por sí mismo.
 *
 * **No agenda nada.** Declarar cuándo podés estudiar no crea `Commitment`:
 * [ADR-064](../../../../docs/decisions.md#adr-064) deja el *cuándo* en el
 * compromiso, y esto es sólo el presupuesto.
 *
 * ⚠️ **Una lista vacía es una respuesta válida**, y devuelve `201` igual. Es el
 * «no sé» del ADR: marca la pregunta como contestada, no deja bloques, y el
 * alta sigue.
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
    bloques?: Array<{ dia: number; desde?: string; hasta?: string; minutos: number }>;
  } | null;

  if (!cuerpo) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });

  const resultado = await declararDisponibilidad(
    sesion.estudiante.institutionId,
    sesion.estudiante.id,
    cuerpo.bloques ?? [],
  );

  switch (resultado.estado) {
    case "OK":
      return NextResponse.json({ bloques: resultado.bloques }, { status: 201 });
    case "DATOS_INVALIDOS":
      return NextResponse.json({ error: resultado.motivo }, { status: 400 });
    case "ESTUDIANTE_DESCONOCIDO":
      return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 });
  }
}
