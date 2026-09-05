import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { declararCarrera, resolverPlanDeCarrera, resolverSesion } from "@/lib/server/composicion";

/**
 * La carrera y el año — Etapa B6.14.4,
 * [ADR-052](../../../../docs/decisions.md#adr-052).
 *
 * `GET ?carrera=<id>` resuelve **qué versión del plan** le corresponde;
 * `POST` la declara junto con el año.
 *
 * Declarar **no es confirmar**: `enrollment.confirmed_at` queda en `NULL`.
 * Existe para que recargar la pantalla de materias no pierda lo que el
 * estudiante ya contestó.
 */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const carrera = new URL(request.url).searchParams.get("carrera");
  if (!carrera) return NextResponse.json({ error: "Falta la carrera" }, { status: 400 });

  const r = await resolverPlanDeCarrera(carrera);

  // `SIN_PLAN` **no es un error**: es una carrera cuyo plan todavía no está
  // cargado o está en borrador. La pantalla lo dice con todas las letras y no
  // inventa materias, así que viaja como `200` con su estado.
  return NextResponse.json(r);
}

export async function POST(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const cuerpo = (await request.json().catch(() => null)) as {
    plan?: string;
    anio?: number;
    periodo?: string;
  } | null;

  if (!cuerpo?.plan || typeof cuerpo.anio !== "number" || !cuerpo.periodo) {
    return NextResponse.json({ error: "Faltan plan, año o período" }, { status: 400 });
  }

  const r = await declararCarrera(sesion.estudiante.institutionId, sesion.estudiante.id, {
    curriculumPlanId: cuerpo.plan,
    curriculumYear: cuerpo.anio,
    term: cuerpo.periodo,
  });

  switch (r.estado) {
    case "OK":
      return NextResponse.json({ inscripcion: r.inscripcionId }, { status: 201 });
    // Un plan `DRAFT` y un plan inexistente dan **la misma respuesta**: decir
    // "existe pero está en borrador" filtraría el catálogo no publicado.
    case "PLAN_NO_DISPONIBLE":
      return NextResponse.json({ error: "No se encontró ese plan" }, { status: 404 });
    case "OTRA_INSTITUCION":
      return NextResponse.json({ error: "No se encontró ese plan" }, { status: 404 });
  }
}
