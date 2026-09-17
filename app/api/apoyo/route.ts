import { NextResponse } from "next/server";

import { esSecretoDeServicio, tokenDelHeader } from "@/lib/server/http";
import { registrarNecesidadDeApoyoDeEstudiante } from "@/lib/server/composicion";

/**
 * `POST /api/apoyo` — registrar una **necesidad de apoyo para avanzar**.
 *
 * > *"La necesidad de ayuda **puede ser esperable y productiva**; denominarla
 * > 'dependencia' corre el riesgo de **estigmatizar**."* — `9.5`,
 * > [ADR-037](../../../docs/decisions.md#adr-037).
 *
 * ## Por qué es una ruta aparte de `/api/observacion`
 *
 * Porque **no es un error**, y esa es la decisión entera. Meterlo como un `kind`
 * más del endpoint de observación de errores volvería a fundir las dos cosas en
 * la superficie, después de haberlas separado en el modelo de datos.
 *
 * ## Lo que este endpoint no puede hacer
 *
 * **No evalúa ninguna regla, y no tiene por dónde.** Escribe en una tabla que
 * ningún contador lee, y el Service que llama no recibe ni el repositorio de
 * señales ni el destino de escalamiento. Registrar que alguien necesitó ayuda
 * **no lo acerca a una escalada**.
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

  const requeridos = ["institucionId", "preparacionId", "tipoDeApoyoId"] as const;
  for (const campo of requeridos) {
    if (typeof cuerpo[campo] !== "string") {
      return NextResponse.json({ error: `Falta ${campo}` }, { status: 400 });
    }
  }

  const r = await registrarNecesidadDeApoyoDeEstudiante({
    institutionId: cuerpo.institucionId as string,
    examPreparationId: cuerpo.preparacionId as string,
    supportNeedTypeId: cuerpo.tipoDeApoyoId as string,
    evidenceId: typeof cuerpo.evidenciaId === "string" ? cuerpo.evidenciaId : null,
    topicId: typeof cuerpo.temaId === "string" ? cuerpo.temaId : null,
    note: typeof cuerpo.nota === "string" ? cuerpo.nota : null,
    claveDeIdempotencia:
      typeof cuerpo.claveDeIdempotencia === "string" ? cuerpo.claveDeIdempotencia : undefined,
  });

  if (r.estado === "RECHAZADA") {
    return NextResponse.json({ error: r.motivo }, { status: 422 });
  }

  return NextResponse.json({ observacionId: r.observacionId, duplicado: r.duplicado });
}
