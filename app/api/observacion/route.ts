import { NextResponse } from "next/server";

import { esSecretoDeServicio, tokenDelHeader } from "@/lib/server/http";
import { observarErrorDeEstudiante } from "@/lib/server/composicion";
import type {
  CalidadDeEvidencia,
  ConfianzaDeClasificacion,
} from "@/lib/domain/reiteracion";

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
 *
 * **No registra una necesidad de apoyo.** Eso **no es un error** —`9.5`,
 * [ADR-037](../../../docs/decisions.md#adr-037)— y tiene su propia ruta,
 * `POST /api/apoyo`, que no evalúa ninguna regla.
 *
 * **No decide qué es comparable.** Recibe `objetivoId` y lo pasa. Cómo se define
 * una *"tarea comparable"* es de la psicopedagoga, y sigue abierto: sin objetivo
 * declarado la regla cuenta la repetición y **no escala** (`9.1`, B6.7.2).
 */
/** Los tres estados de `9.6`. Un valor que no esté acá **no se guarda**. */
function esCalidad(v: unknown): v is CalidadDeEvidencia {
  return (
    v === "suficiente_de_logro" ||
    v === "suficiente_para_identificar_error" ||
    v === "no_interpretable"
  );
}

function esConfianza(v: unknown): v is ConfianzaDeClasificacion {
  return v === "alta" || v === "media" || v === "baja";
}

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
    // Categoría secundaria (`9.5`). **No cuenta**: es contexto para la persona
    // que recibe el caso, no un segundo contador.
    secondaryErrorTypeId: typeof cuerpo.secundariaId === "string" ? cuerpo.secundariaId : null,
    // **La cuarta dimensión de la unidad de conteo** (`9.1`, B6.7.2). Sin esto
    // no hay comparabilidad que afirmar, y la regla no escala.
    learningObjectiveId: typeof cuerpo.objetivoId === "string" ? cuerpo.objetivoId : null,
    // `9.6`. La base la exige cuando la observación se corrobora.
    evidenceQuality: esCalidad(cuerpo.calidadDeEvidencia) ? cuerpo.calidadDeEvidencia : null,
    // **Sin default optimista**, por la misma razón que `corroborada`: el camino
    // más corto tiene que ser el que NO cuenta.
    errorIdentifiable: cuerpo.errorIdentificable === true,
    classificationConfidence: esConfianza(cuerpo.confianzaDeClasificacion)
      ? cuerpo.confianzaDeClasificacion
      : null,
    taskFormat: typeof cuerpo.formatoDeTarea === "string" ? cuerpo.formatoDeTarea : null,
    supportOffered: typeof cuerpo.ayudaOfrecida === "string" ? cuerpo.ayudaOfrecida : null,
    // `9.3`: las cinco se declaran por separado. `trasAccionId` solo ya no
    // demuestra que la corrección haya sido válida.
    correctionDelivered:
      typeof cuerpo.correccionEntregada === "boolean" ? cuerpo.correccionEntregada : null,
    correctionAccessible:
      typeof cuerpo.correccionAccesible === "boolean" ? cuerpo.correccionAccesible : null,
    learnerEngaged:
      typeof cuerpo.estudianteSeInvolucro === "boolean" ? cuerpo.estudianteSeInvolucro : null,
    newIndependentAttempt:
      typeof cuerpo.nuevoIntentoIndependiente === "boolean"
        ? cuerpo.nuevoIntentoIndependiente
        : null,
    sameErrorConfidence: esConfianza(cuerpo.confianzaMismoError)
      ? cuerpo.confianzaMismoError
      : null,
    // `9.4`: dos aciertos no pueden ser dos replays del mismo intento.
    attemptIdentity: typeof cuerpo.identidadDeIntento === "string" ? cuerpo.identidadDeIntento : null,
    equivalentNotIdentical:
      typeof cuerpo.tareaEquivalenteNoIdentica === "boolean"
        ? cuerpo.tareaEquivalenteNoIdentica
        : null,
    spacedOrNoImmediateModel:
      typeof cuerpo.espaciadaOSinModeloInmediato === "boolean"
        ? cuerpo.espaciadaOSinModeloInmediato
        : null,
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
