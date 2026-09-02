import { NextResponse } from "next/server";

import { esSecretoDeServicio, tokenDelHeader } from "@/lib/server/http";
import { colaPendienteDeDemo } from "@/lib/server/composicion";

/**
 * `GET /api/escalamiento` — mirar la cola **sintética** de escalamiento.
 *
 * ⚠️⚠️ **INTERNO Y SINTÉTICO. NO ES EL CRM, Y NO ES UNA CONSOLA DE OPERADOR.**
 *
 * Existe para una sola cosa: que el recorrido del MVP se pueda **verificar
 * entero** —*"encontrar exactamente un caso pendiente"*— mientras el contrato
 * con el CRM está congelado ([ADR-035](../../../docs/decisions.md#adr-035)).
 *
 * ## Tres cerrojos, y ninguno sobra
 *
 * 1. **Apagado por defecto.** Sin `ESCALAMIENTO_SINTETICO=1` responde `404`, no
 *    `403`: un `403` confirmaría que la ruta existe. Un despliegue que no la
 *    declara **no la tiene**.
 * 2. **Secreto de servicio.** Nunca un JWT de estudiante: la cola es de casos
 *    ajenos, y ningún estudiante puede ver los de otro.
 * 3. **Sólo lee.** No hay `POST`, no hay `PATCH`. No se puede tocar
 *    `risk_signal` ni `intervention` desde acá, ni marcar nada como entregado:
 *    el estado de entrega es de quien entrega, y todavía no existe.
 *
 * ## Cuando llegue el CRM
 *
 * Esta ruta **se borra**. No es un paso hacia la consola del operador: esa
 * superficie es del CRM ([ADR-033](../../../docs/decisions.md#adr-033)) y no
 * debe existir acá.
 */
export async function GET(request: Request) {
  // Cerrojo 1. Va **primero**: si la ruta no está habilitada, ni siquiera se
  // mira el token — comparar un secreto que no debería existir en ese entorno
  // es una vía para descubrir que existe.
  if (process.env.ESCALAMIENTO_SINTETICO !== "1") {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const token = tokenDelHeader(request.headers.get("authorization"));
  if (!esSecretoDeServicio(token, process.env.RELOJ_SHARED_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const institutionId = new URL(request.url).searchParams.get("institucion");
  if (!institutionId) {
    // Explícita, como en el reloj: una cola que se lee "de todas" es una que un
    // día se lee de una institución que no correspondía (`I11`).
    return NextResponse.json({ error: "Falta ?institucion=<uuid>" }, { status: 400 });
  }

  const casos = await colaPendienteDeDemo(institutionId);
  return NextResponse.json({
    sintetica: true,
    advertencia: "Cola de demostración. No es el CRM y no es una consola de operador.",
    pendientes: casos.length,
    casos,
  });
}
