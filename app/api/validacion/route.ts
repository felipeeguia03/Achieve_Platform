import { NextResponse } from "next/server";

import { esSecretoDeServicio, tokenDelHeader } from "@/lib/server/http";
import { validarEvidencia } from "@/lib/server/composicion";

/**
 * `POST /api/validacion` — la validación declarativa del MVP (D4·A, D5·A).
 *
 * ## Por qué no lleva JWT de estudiante
 *
 * **Nadie valida su propia evidencia.** Entregar y juzgar lo entregado son dos
 * actos con dos dueños, y colapsarlos convertiría el circuito en una
 * autoafirmación. Mismo secreto de servicio que `/api/reloj` y
 * `/api/observacion`, comparado en tiempo constante.
 *
 * ## Qué hace, en orden y explícito
 *
 * `SUBMITTED → SUFFICIENT → VALIDATED`, y **después** invoca el registro de
 * progreso. El progreso no se deriva de que la evidencia esté `VALIDATED`: lo
 * registra esta operación porque alguien decidió validar.
 *
 * ## Idempotencia
 *
 * Reentrante de punta a punta: cada transición comprueba su estado antes de
 * actuar y el progreso lleva su clave derivada de la evidencia. Correrla dos
 * veces deja el mismo mundo que correrla una.
 */
export async function POST(request: Request) {
  const token = tokenDelHeader(request.headers.get("authorization"));
  if (!esSecretoDeServicio(token, process.env.RELOJ_SHARED_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cuerpo = (await request.json().catch(() => null)) as {
    institucion?: string;
    evidencia?: string;
    validadaPor?: string;
    cambios?: { dimension: string; valor?: number; texto?: string }[];
    sinCambio?: boolean;
    razon?: string;
    suficiente?: boolean;
  } | null;

  if (!cuerpo?.institucion || !cuerpo.evidencia) {
    return NextResponse.json({ error: "Faltan `institucion` y `evidencia`" }, { status: 400 });
  }

  const resultado = await validarEvidencia({
    institutionId: cuerpo.institucion,
    evidenciaId: cuerpo.evidencia,
    // Identidad externa, sin FK: quién puede validar es `C01-030`, y sigue
    // abierto. No se inventa un rol.
    validadaPor: cuerpo.validadaPor ?? "validador-sintetico",
    // Por defecto la entrega alcanza. Declarar `suficiente: false` es lo que
    // deja la `Action` esperando otra entrega, sin tocar la que no alcanzó.
    suficiente: cuerpo.suficiente,
    cambios: cuerpo.cambios,
    noCambioExplicito: cuerpo.sinCambio,
    razonDeNoCambio: cuerpo.razon ?? null,
  });

  switch (resultado.estado) {
    case "OK":
      return NextResponse.json({
        evidencia: resultado.evidenciaId,
        yaEstaba: resultado.yaEstaba,
        progreso: resultado.progreso,
        accion: resultado.accionId,
        accionCompletada: resultado.accionCompletada,
      });
    case "INSUFICIENTE":
      // No es un error: es el juicio. La `Action` sigue `COMMITTED`.
      return NextResponse.json({
        evidencia: resultado.evidenciaId,
        accion: resultado.accionId,
        suficiente: false,
        accionCompletada: false,
      });
    case "CADENA_INVALIDA":
      // `404` y no `403`: decir "existe pero no es tuya" ya cuenta que existe.
      return NextResponse.json({ error: "Evidencia inexistente" }, { status: 404 });
    case "NO_ENCONTRADA":
      return NextResponse.json({ error: "Evidencia inexistente" }, { status: 404 });
    case "NO_VALIDABLE":
      // Que una evidencia no esté en un estado validable es una respuesta del
      // dominio, no una falla del servidor.
      return NextResponse.json(
        { error: `No se puede validar desde ${resultado.desde}` },
        { status: 409 },
      );
    case "PROGRESO_RECHAZADO":
      // `I10`: declarar cero dimensiones sin afirmar un no-cambio no dice nada.
      return NextResponse.json(
        { error: "El progreso fue rechazado", detalle: resultado.detalle },
        { status: 422 },
      );
  }
}
