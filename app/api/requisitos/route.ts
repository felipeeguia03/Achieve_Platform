import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { requisitosSimuladosDe, resolverSesion } from "@/lib/server/composicion";

/**
 * `GET /api/requisitos?cursada=` — los requisitos de cursado **simulados** de una
 * materia ([ADR-108](../../../docs/decisions.md#adr-108)).
 *
 * 1. **Apagada por defecto.** Sin `MODO_PRUEBA=1` responde `404`, no `403`, y
 *    el botón *Requisitos* de la materia no se dibuja.
 * 2. **Con el JWT del estudiante**, nunca con secreto de servicio, y sólo sobre
 *    una cursada suya: una ajena es `404`.
 *
 * ## Cuando haya condiciones de cursado de verdad
 *
 * **Esta ruta se borra**, junto con `lib/server/simulacion/requisitos.ts`. Las
 * condiciones reales llegan del programa con su procedencia, y la asistencia y
 * las notas son datos de una persona: tocan ADR-006.
 */

/** Cerrojo. Va primero: ni se mira el token. */
function apagada(): boolean {
  return process.env.MODO_PRUEBA !== "1";
}

export async function GET(request: Request) {
  if (apagada()) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }
  if (!sesion.alta.completa) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const cursada = new URL(request.url).searchParams.get("cursada");
  if (!cursada) return NextResponse.json({ error: "Falta la cursada" }, { status: 400 });

  const requisitos = await requisitosSimuladosDe(
    sesion.estudiante.institutionId,
    sesion.estudiante.id,
    sesion.estudiante.timezone,
    cursada,
  );
  if (!requisitos) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(requisitos);
}
