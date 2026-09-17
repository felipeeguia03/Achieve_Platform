import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { requisitosDelPlan, resolverSesion } from "@/lib/server/composicion";

/**
 * `GET /api/catalogo/plan?plan=<id>` — los requisitos de un plan publicado, con
 * lo que este estudiante ya declaró.
 *
 * Etapa B6.14.4. Trae **el plan entero**, no sólo el año elegido: la pantalla
 * ofrece *"Agregar materias de otros años"* sin un segundo viaje, y quién se
 * preselecciona lo decide `lib/domain/alta.ts`.
 *
 * ⚠️ **Un plan `DRAFT` devuelve `404`.** No "una lista vacía": eso le diría al
 * estudiante que su carrera no tiene materias.
 */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const plan = new URL(request.url).searchParams.get("plan");
  if (!plan) return NextResponse.json({ error: "Falta el plan" }, { status: 400 });

  const r = await requisitosDelPlan(plan, sesion.estudiante.id);
  if (r === null) return NextResponse.json({ error: "No se encontró ese plan" }, { status: 404 });

  return NextResponse.json(r);
}
