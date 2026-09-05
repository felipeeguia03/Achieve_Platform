import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { confirmarMapaAcademico, resolverSesion } from "@/lib/server/composicion";

/**
 * `POST /api/alta/materias` — **el mapa académico mínimo, confirmado**.
 *
 * Etapa B6.14.4, [ADR-052](../../../../docs/decisions.md#adr-052). Es el
 * momento en que el alta termina y el estudiante entra a `HOY`.
 *
 * ## Idempotencia
 *
 * **No vive acá.** Vive en `UNIQUE (student_id, offering_id)` de
 * `course_enrollment` —que existe desde la B1.3— y en
 * `UNIQUE (student_id, curriculum_requirement_id)` de `requirement_declaration`.
 * Un doble clic escribe las mismas filas, y no porque el handler se acuerde.
 *
 * ## El ADE corre después, y lo llama el Service
 *
 * El estudiante **no autoriza una recomendación**: la Plataforma reacciona a un
 * hecho de dominio, con el mismo patrón que
 * [ADR-040](../../../../docs/decisions.md#adr-040) ya usa tras cerrar una
 * `Action`. `POST /api/recomendacion` sigue siendo secreto de servicio.
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
    plan?: string;
    anio?: number;
    periodo?: string;
    selecciones?: { requisito?: string; materia?: string; nombreEscrito?: string }[];
  } | null;

  if (!cuerpo?.plan || typeof cuerpo.anio !== "number" || !cuerpo.periodo) {
    return NextResponse.json({ error: "Faltan plan, año o período" }, { status: 400 });
  }

  const selecciones = (cuerpo.selecciones ?? [])
    .filter((s): s is { requisito: string } & typeof s => typeof s.requisito === "string")
    .map((s) => ({
      requisitoId: s.requisito,
      materiaId: s.materia,
      nombreEscrito: s.nombreEscrito,
    }));

  const r = await confirmarMapaAcademico(sesion.estudiante.institutionId, sesion.estudiante.id, {
    curriculumPlanId: cuerpo.plan,
    curriculumYear: cuerpo.anio,
    term: cuerpo.periodo,
    selecciones,
  });

  switch (r.estado) {
    case "OK":
      return NextResponse.json(
        {
          inscripcion: r.inscripcionId,
          cursadas: r.cursadas,
          declaraciones: r.declaraciones,
          // Cuántas cursadas quedaron con una acción materializada. **Puede ser
          // `0` y no es un error**: una materia sin unidades cargadas todavía no
          // le da al ADE sobre qué decidir.
          recomendadas: r.recomendadas,
        },
        { status: 201 },
      );
    case "SIN_SELECCION":
      return NextResponse.json(
        { error: "Marcá al menos una materia para poder empezar" },
        { status: 400 },
      );
    case "PLAN_NO_DISPONIBLE":
    case "OTRA_INSTITUCION":
      return NextResponse.json({ error: "No se encontró ese plan" }, { status: 404 });
  }
}
