import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import {
  institucionesDePrueba,
  reiniciarAltaDePrueba,
  resolverSesion,
} from "@/lib/server/composicion";

/**
 * `/api/prueba/alta` — **reiniciar el alta de un estudiante sintético**.
 *
 * ⚠️⚠️ **INTERNO Y SINTÉTICO. NO ES UNA CAPACIDAD DEL PRODUCTO.**
 *
 * Existe para una sola cosa: recorrer el tramo de alta muchas veces seguidas
 * —cómo toma las materias, cómo se comporta con otro catálogo— sin bajar a la
 * terminal a correr `npm run db:demo`, que además vuelve a sembrar el mundo
 * entero y se lleva puesto lo que uno estaba mirando.
 *
 * ## Tres cerrojos, y ninguno sobra
 *
 * 1. **Apagada por defecto.** Sin `MODO_PRUEBA=1` responde `404`, no `403`: un
 *    `403` confirmaría que la ruta existe. Un despliegue que no declara la
 *    variable **no la tiene**. Mismo patrón que `GET /api/escalamiento`.
 * 2. **JWT del estudiante, y sólo sobre sí mismo.** **No lleva secreto de
 *    servicio, a propósito:** un secreto podría reiniciar a cualquiera, y esta
 *    operación no tiene por qué poder tocar a otro. El `studentId` sale de la
 *    sesión y nunca del cuerpo.
 * 3. **No devuelve `409 ALTA_INCOMPLETA`.** Igual que `GET /api/alta`, y por lo
 *    mismo: gatear el reinicio detrás del alta lo volvería inútil justo cuando
 *    hace falta — a mitad del alta, para volver a empezar.
 *
 * ## Cuando ADR-006 abra
 *
 * **Esta ruta se borra.** No es un paso hacia una consola de administración:
 * con personas reales, «borrarle a alguien lo que declaró» es una operación de
 * privacidad con su propio contrato ([ADR-006](../../../../docs/decisions.md#adr-006),
 * `C01-017`), no un botón.
 */

/** Cerrojo 1. Va primero en las dos verbos: ni se mira el token. */
function apagada(): boolean {
  return process.env.MODO_PRUEBA !== "1";
}

const NO_ENCONTRADO = { error: "No encontrado" };

/**
 * `GET` — con qué catálogos se puede probar.
 *
 * Devuelve **sólo instituciones con plan publicado**. Una sin plan no es una
 * opción: es el pozo del que salió la Etapa B6.14.7. La UCC no aparece, y no
 * por una lista negra — su Plan 2016 está en `DRAFT`
 * ([ADR-053](../../../../docs/decisions.md#adr-053)).
 */
export async function GET(request: Request) {
  if (apagada()) return NextResponse.json(NO_ENCONTRADO, { status: 404 });

  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  return NextResponse.json({
    sintetico: true,
    advertencia: "Modo prueba. No es una capacidad del producto.",
    institucionActual: sesion.estudiante.institutionId,
    instituciones: await institucionesDePrueba(),
  });
}

/**
 * `POST` — dejar al estudiante como antes de empezar el alta.
 *
 * Cuerpo opcional: `{ institucion?: <uuid> }`. **Simula el padrón**, no le
 * devuelve al estudiante una elección que
 * [ADR-052](../../../../docs/decisions.md#adr-052) le sacó: el alta sigue
 * ofreciendo sólo la institución del padrón. Acá se mueve la ficha, que es lo
 * que haría un backoffice, y **sólo a una institución con plan publicado**.
 */
export async function POST(request: Request) {
  if (apagada()) return NextResponse.json(NO_ENCONTRADO, { status: 404 });

  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const cuerpo = (await request.json().catch(() => null)) as { institucion?: string } | null;
  // Vacío no es un dato: sin institución en el cuerpo, el estudiante se queda
  // donde está, que es el caso normal.
  const nueva = cuerpo?.institucion?.trim() || null;

  const r = await reiniciarAltaDePrueba(
    sesion.estudiante.institutionId,
    sesion.estudiante.id,
    nueva,
  );

  switch (r.estado) {
    case "OK":
      return NextResponse.json({
        sintetico: true,
        borrado: r.borrado,
        // A dónde ir ahora. Sale del dominio, no de un literal en el cliente.
        siguiente: r.siguiente,
      });
    case "INSTITUCION_SIN_PLAN":
      return NextResponse.json(
        {
          error: "Esa institución no tiene ningún plan publicado",
          motivo: "INSTITUCION_SIN_PLAN",
        },
        { status: 409 },
      );
    case "OTRA_INSTITUCION":
      return NextResponse.json(
        { error: "El estudiante no es de esa institución", motivo: "OTRA_INSTITUCION" },
        { status: 409 },
      );
  }
}
