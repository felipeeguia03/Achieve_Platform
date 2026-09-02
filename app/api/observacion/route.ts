import { NextResponse } from "next/server";

import { esSecretoDeServicio, tokenDelHeader } from "@/lib/server/http";
import { observarErrorDeEstudiante } from "@/lib/server/composicion";

/**
 * `POST /api/observacion` — registrar un error observado y evaluar la regla.
 *
 * ⚠️ **`PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION`** —
 * [ADR-036](../../../docs/decisions.md#adr-036). El umbral que se evalúa acá es
 * una decisión del **Product Owner** sobre datos sintéticos, sin validación
 * psicopedagógica.
 *
 * ## Por qué existe, y por qué es el único endpoint nuevo
 *
 * El circuito estaba construido y probado, y **nadie lo llamaba**: exactamente
 * la situación del reloj antes de la B4. Sin esto, la regla de `C01-021` corre
 * en los tests y en ningún otro lado, y el MVP no puede demostrar el eslabón que
 * más importa — *detectar que el estudiante está trabado*.
 *
 * ## Por qué secreto de servicio y no JWT de estudiante
 *
 * **Registrar un error no es una acción del estudiante.** Es de quien evalúa su
 * entrega, y esa persona —el Reviewer `R1`— **no tiene superficie en la
 * Plataforma**: [ADR-033](../../../docs/decisions.md#adr-033) dejó abierto si es
 * o no un operador, y las superficies de operador son del CRM.
 *
 * Así que se usa el mismo patrón que `POST /api/reloj`: un secreto de servicio,
 * porque del otro lado **no hay una persona autenticada**. Darle un JWT de
 * estudiante permitiría que alguien declarara sus propios errores, y el punto 6
 * de `C01-036` dice que una observación sin corroborar no cuenta — con lo cual
 * sería una función que no hace nada, o una que miente.
 *
 * ## Lo que este endpoint no hace
 *
 * **No barre nada.** Evalúa la reiteración de **un tipo de error en una
 * preparación**, la que acaba de recibir un hecho nuevo. Un barrido por
 * institución sería el motor general que `C01-021` todavía no autoriza.
 *
 * **No infiere el error.** Lo recibe. Si `corroborated` es `true`, la función de
 * base exige la evidencia que lo sostiene, y que alguien la haya evaluado.
 */
export async function POST(request: Request) {
  const token = tokenDelHeader(request.headers.get("authorization"));
  if (!esSecretoDeServicio(token, process.env.RELOJ_SHARED_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const requeridos = ["institucionId", "preparacionId", "tipoDeErrorId"] as const;
  for (const campo of requeridos) {
    if (typeof cuerpo[campo] !== "string") {
      return NextResponse.json({ error: `Falta ${campo}` }, { status: 400 });
    }
  }

  const kind = cuerpo.kind === "resolucion_limpia" ? "resolucion_limpia" : "error";

  const r = await observarErrorDeEstudiante({
    institutionId: cuerpo.institucionId as string,
    examPreparationId: cuerpo.preparacionId as string,
    errorTypeId: cuerpo.tipoDeErrorId as string,
    kind,
    // **Sin corroborar por defecto.** Un default en `true` haría que el camino
    // más corto sea el que infla el contador.
    corroborated: cuerpo.corroborada === true,
    evidenceId: typeof cuerpo.evidenciaId === "string" ? cuerpo.evidenciaId : null,
    topicId: typeof cuerpo.temaId === "string" ? cuerpo.temaId : null,
    afterActionId: typeof cuerpo.trasAccionId === "string" ? cuerpo.trasAccionId : null,
    note: typeof cuerpo.nota === "string" ? cuerpo.nota : null,
    claveDeIdempotencia:
      typeof cuerpo.claveDeIdempotencia === "string" ? cuerpo.claveDeIdempotencia : undefined,
  });

  if (r.estado === "RECHAZADA") {
    // Un rechazo de dominio no es un `500`: la base dijo que no, y por qué.
    return NextResponse.json({ error: r.motivo }, { status: 422 });
  }

  return NextResponse.json({
    observacionId: r.observacionId,
    duplicado: r.duplicado,
    evaluacion: r.evaluacion,
  });
}
