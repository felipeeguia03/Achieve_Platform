import { NextResponse } from "next/server";

import { esSecretoDeServicio, tokenDelHeader } from "@/lib/server/http";
import { corregirClasificacionDeError } from "@/lib/server/composicion";

/**
 * `POST /api/observacion/correccion` — corregir la clasificación de un error.
 *
 * Cierra la última pieza de `9.5`: *"Incluir 'clasificación incierta' y **opción
 * de corrección humana**"* ([ADR-037](../../../../docs/decisions.md#adr-037)).
 *
 * ## Por qué existe la ruta y no sólo la función
 *
 * Porque una función de dominio que nadie llama es la situación que la Fase
 * B6.6 existió para arreglar: la regla estaba construida, probada, y corría en
 * los tests y en ningún otro lado.
 *
 * ## Por qué secreto de servicio
 *
 * ⚠️ **Quién puede corregir una clasificación no está definido.** La
 * psicopedagoga lo puso textual entre lo que hay que resolver antes de un
 * piloto: *"cómo se define una 'tarea comparable' y **quién puede corregir una
 * clasificación de error**"*. Inventar el rol acá sería exactamente lo que
 * `AGENTS.md` §1.1 prohíbe, así que se usa el mismo patrón que
 * `POST /api/observacion`: del otro lado **no hay una persona autenticada**, y
 * `corregidoPor` viaja como identidad externa sin validar contra nada.
 *
 * ## Lo que no hace
 *
 * **No retracta señales.** Una señal ya emitida fue cierta bajo la clasificación
 * vigente entonces. Re-evalúa las dos familias afectadas hacia adelante y
 * devuelve las dos evaluaciones.
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

  const requeridos = ["institucionId", "observacionId", "aTipoDeErrorId", "motivo"] as const;
  for (const campo of requeridos) {
    if (typeof cuerpo[campo] !== "string" || (cuerpo[campo] as string).trim().length === 0) {
      return NextResponse.json({ error: `Falta ${campo}` }, { status: 400 });
    }
  }

  const r = await corregirClasificacionDeError({
    institutionId: cuerpo.institucionId as string,
    observacionId: cuerpo.observacionId as string,
    aTipoDeErrorId: cuerpo.aTipoDeErrorId as string,
    aSecundariaId: typeof cuerpo.aSecundariaId === "string" ? cuerpo.aSecundariaId : null,
    motivo: cuerpo.motivo as string,
    corregidoPor: typeof cuerpo.corregidoPor === "string" ? cuerpo.corregidoPor : null,
  });

  if (r.estado === "RECHAZADA") {
    // Un rechazo de dominio no es un `500`: la base dijo que no, y por qué.
    return NextResponse.json({ error: r.motivo }, { status: 422 });
  }

  return NextResponse.json({
    correccionId: r.correccionId,
    desde: r.desde,
    hacia: r.hacia,
  });
}
