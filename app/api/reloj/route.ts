import { NextResponse } from "next/server";

import { esSecretoDeServicio, tokenDelHeader } from "@/lib/server/http";
import { correrReloj } from "@/lib/server/composicion";

/**
 * `POST /api/reloj` — la ejecución operativa del reloj del lifecycle.
 *
 * ## Por qué existe
 *
 * El reloj estaba construido, probado y **nadie lo llamaba**. Era la pieza que
 * faltaba para que el producto se mueva solo: sin esto, un compromiso vencido no
 * pasa a `DUE` ni a `MISSED` hasta que alguien corra algo a mano, y `product.md`
 * §226 es explícito en que esa transición la hace el owner del lifecycle y no la
 * UI.
 *
 * ## Qué NO decide este endpoint
 *
 * **Con qué frecuencia corre.** Eso es operación, y
 * [ADR-005](../../../docs/decisions.md#adr-005) la dejó `DEFERRED`. Acá está la
 * pieza que cualquier scheduler puede llamar —Vercel Cron, GitHub Actions,
 * `pg_cron`, un `curl` en la demo—; elegir cuál es una decisión de despliegue
 * que este endpoint no toma y que no bloquea.
 *
 * ## Seguridad
 *
 * **No lo dispara una persona**, así que no se autentica con el JWT de un
 * estudiante: usa un secreto de servicio en `Authorization: Bearer`. Sin
 * `RELOJ_SHARED_SECRET` configurado, **nadie entra** — ni siquiera con el header
 * correcto.
 *
 * `POST` y no `GET` porque **muta estado**: un `GET` que cambia el mundo es lo
 * que hace que un prefetch del navegador declare un compromiso incumplido.
 */
export async function POST(request: Request) {
  const token = tokenDelHeader(request.headers.get("authorization"));
  if (!esSecretoDeServicio(token, process.env.RELOJ_SHARED_SECRET)) {
    // `401` sin detalle: decir "falta configurar el secreto" le cuenta a quien
    // prueba cómo está desplegado el sistema.
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const institutionId = new URL(request.url).searchParams.get("institucion");
  if (!institutionId) {
    // La institución es explícita: un reloj que corre sobre "todas" es un reloj
    // que un día corre sobre una que no debía (`I11`).
    return NextResponse.json({ error: "Falta ?institucion=<uuid>" }, { status: 400 });
  }

  const resumen = await correrReloj(institutionId);

  // El resumen es la observabilidad: cuántos vencieron, cuántos se incumplieron
  // y cuántos conflictos hubo. Un conflicto **no es un error** — es que el
  // estudiante movió su compromiso mientras el reloj corría, y le ganó.
  return NextResponse.json(resumen);
}
