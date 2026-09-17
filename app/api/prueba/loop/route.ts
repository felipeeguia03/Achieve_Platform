import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { avanzarLoopDePrueba, resolverSesion } from "@/lib/server/composicion";

/**
 * `POST /api/prueba/loop` — **los tres pasos del loop que hoy son de terminal**.
 *
 * ⚠️⚠️ **INTERNO Y SINTÉTICO. NO ES UNA CAPACIDAD DEL PRODUCTO.**
 *
 * `npm run recomendar`, `npm run validar` y `npm run reloj` son procesos que en
 * producción dispara un scheduler o una persona con un rol que **todavía no
 * existe**. Para ajustar el MVP hacen falta con un click, y bajar a la consola
 * en cada vuelta hace que probar cueste más que arreglar.
 *
 * ## ⚠️ Lo que este endpoint rompe a propósito
 *
 * **`validar` deja al estudiante validando su propia evidencia**, que es
 * exactamente lo que el producto prohíbe. No es un descuido: es la consecuencia
 * de que `C01-030` —*quién valida*— siga `OPEN`, y **la razón por la que esta
 * ruta no puede sobrevivir a `MODO_PRUEBA`**.
 *
 * ## Tres cerrojos, los mismos que `/api/prueba/alta`
 *
 * 1. **Apagada por defecto.** Sin `MODO_PRUEBA=1` responde `404`, no `403`: un
 *    `403` confirmaría que existe.
 * 2. **JWT del estudiante, y sólo sobre sí mismo.** **Sin secreto de servicio a
 *    propósito**: un secreto podría correr el loop de cualquiera. El
 *    `studentId` sale de la sesión y nunca del cuerpo.
 * 3. **No reimplementa nada.** Llama a los mismos servicios que las rutas
 *    reales, así que lo que se ejercita es el camino de producción.
 *
 * ## Cuando ADR-006 abra
 *
 * **Esta ruta se borra**, junto con el dock. No es un paso hacia una consola de
 * operación: validar la evidencia de alguien es una operación con actor,
 * procedencia y trazabilidad, no un botón.
 */
function apagada(): boolean {
  return process.env.MODO_PRUEBA !== "1";
}

const PASOS = ["ade", "validar", "reloj"] as const;

export async function POST(request: Request) {
  if (apagada()) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const cuerpo = (await request.json().catch(() => null)) as { paso?: string } | null;
  const paso = PASOS.find((p) => p === cuerpo?.paso);
  if (!paso) {
    return NextResponse.json(
      { error: `\`paso\` tiene que ser uno de: ${PASOS.join(", ")}` },
      { status: 400 },
    );
  }

  const r = await avanzarLoopDePrueba(sesion.estudiante.institutionId, sesion.estudiante.id, paso);

  return NextResponse.json({
    sintetico: true,
    advertencia: "Modo prueba. No es una capacidad del producto.",
    ...r,
  });
}
