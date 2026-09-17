import { NextResponse } from "next/server";

import { esSecretoDeServicio, tokenDelHeader } from "@/lib/server/http";
import { recomendarPara } from "@/lib/server/composicion";

/**
 * `POST /api/recomendacion?institucion=<uuid>&cursada=<uuid>` — la ejecución
 * operativa del ADE.
 *
 * ## Por qué existe
 *
 * **El mismo hueco que la B4.2 le cerró al reloj, del otro lado.** El Engine
 * puro, el validador determinista, el repositorio y `recomendarPara` en el
 * composition root están construidos y probados desde la Fase B4 — y sus
 * únicos llamadores eran los tests. Sin nadie que lo despierte, `UX01` proyecta
 * *"sin acciones por ahora"* para siempre: no porque no haya nada que
 * recomendar, sino porque nadie preguntó.
 *
 * ## Qué NO decide este endpoint
 *
 * **Nada del dominio.** Arma la llamada y devuelve el resultado tal cual: qué
 * unidad conviene lo decide el Engine puro, y si la recomendación se puede
 * mostrar lo decide el validador — antes de materializar. Un `if` acá sobre
 * qué recomendar pondría la lógica en dos lados.
 *
 * **Con qué frecuencia corre.** Igual que el reloj, eso es operación y
 * [ADR-005](../../../docs/decisions.md#adr-005) la dejó `DEFERRED`.
 *
 * ## Seguridad
 *
 * **No lo dispara una persona**: el ADE decide, y una decisión del sistema no
 * se autentica con el JWT de un estudiante. Mismo secreto de servicio que
 * `POST /api/reloj`, comparado en tiempo constante.
 *
 * `POST` y no `GET` porque **muta estado**: materializa una `Action` con su
 * `ActionRecommendation`.
 */
export async function POST(request: Request) {
  const token = tokenDelHeader(request.headers.get("authorization"));
  if (!esSecretoDeServicio(token, process.env.RELOJ_SHARED_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const institutionId = params.get("institucion");
  const courseEnrollmentId = params.get("cursada");

  // Las dos son explícitas, por la misma razón que el reloj pide la
  // institución: un ADE que corre sobre "todas las cursadas" es un ADE que un
  // día decide sobre una que no debía (`I11`).
  if (!institutionId || !courseEnrollmentId) {
    return NextResponse.json(
      { error: "Faltan ?institucion=<uuid> y ?cursada=<uuid>" },
      { status: 400 },
    );
  }

  const resultado = await recomendarPara(institutionId, courseEnrollmentId);

  // `SIN_RECOMENDACION` **no es un error**: el Engine confirmó que no hay nada
  // que proponer, y eso es una respuesta. `RECHAZADA_POR_VALIDADOR` tampoco es
  // un 500: es la rama `ERROR` del contrato funcionando, y el cuerpo dice qué
  // afirmación no se pudo sostener.
  const estado = resultado.estado === "CURSADA_DESCONOCIDA" ? 404 : 200;
  return NextResponse.json(resultado, { status: estado });
}
