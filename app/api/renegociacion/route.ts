import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { renegociarCompromiso, resolverSesion } from "@/lib/server/composicion";
import { MINUTOS_DE_ANTICIPACION } from "@/lib/domain/renegociacion";

/**
 * `POST /api/renegociacion` — **mover la hora sin romper el acuerdo** ·
 * Etapa B6.11.
 *
 * Es una acción **del estudiante**: quien no puede a la hora que acordó es él,
 * y nadie renegocia por otro. Va con su JWT, no con el secreto de servicio.
 *
 * ## Por qué es una ruta propia
 *
 * Por lo mismo que el rescate: no crea lo mismo que `/api/compromiso`. Acá el
 * original pasa a `RENEGOTIATED` y nace un sucesor que lo apunta (`I2`), todo
 * en una transacción, y la `Action` **no se toca**.
 *
 * ## Los cuatro rechazos, y por qué son distintos
 *
 * Un `409` que dice sólo «no se puede» deja al estudiante sin saber si el
 * problema se arregla cambiando la hora o si ya no hay nada que hacer. Las
 * condiciones de [ADR-046](../../../docs/decisions.md#adr-046) se distinguen:
 * el estado y la cadena **no tienen arreglo desde la pantalla** —la salida es
 * continuar o, si ya incumplió, el rescate—, mientras que la anticipación y el
 * día **se corrigen eligiendo otro horario**.
 */
export async function POST(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const cuerpo = (await request.json().catch(() => null)) as {
    original?: string;
    inicio?: string;
    zona?: string;
    minutos?: number;
    clave?: string;
  } | null;

  if (!cuerpo?.original || !cuerpo.inicio || !cuerpo.zona || !cuerpo.minutos || !cuerpo.clave) {
    return NextResponse.json(
      { error: "Faltan `original`, `inicio`, `zona`, `minutos` y `clave`" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(cuerpo.minutos) || cuerpo.minutos <= 0) {
    return NextResponse.json({ error: "`minutos` tiene que ser un entero positivo" }, { status: 400 });
  }

  const resultado = await renegociarCompromiso(sesion.estudiante.institutionId, {
    originalId: cuerpo.original,
    estudianteId: sesion.estudiante.id,
    // Normalizado antes de comparar, igual que en `/api/compromiso`.
    startAt: new Date(cuerpo.inicio).toISOString(),
    timezone: cuerpo.zona,
    plannedMinutes: cuerpo.minutos,
    claveDeIdempotencia: cuerpo.clave,
  });

  switch (resultado.estado) {
    case "OK":
      return NextResponse.json(
        { compromiso: resultado.compromiso.id, duplicado: resultado.duplicado },
        { status: resultado.duplicado ? 200 : 201 },
      );
    // **Un `404` seco**, igual que en el rescate: existir y ser de otro, o no
    // existir, son la misma respuesta.
    case "NO_ES_SUYO":
      return NextResponse.json({ error: "No se encontró ese compromiso" }, { status: 404 });
    case "NO_RENEGOCIABLE":
      return NextResponse.json(
        { error: `Un compromiso ${resultado.desde} ya no se renegocia`, motivo: "ESTADO_NO_RENEGOCIABLE" },
        { status: 409 },
      );
    case "NO_ELEGIBLE":
      return NextResponse.json({ error: MENSAJE[resultado.motivo], motivo: resultado.motivo }, { status: 409 });
    case "CONFLICTO":
      return NextResponse.json({ error: "Ese compromiso cambió de estado" }, { status: 409 });
    case "CONFLICTO_DE_CLAVE":
      return NextResponse.json({ error: "La clave ya se usó para otro pedido" }, { status: 409 });
    // La institución no tiene zona horaria. **No se sustituye por otra**: sin
    // ella la condición 5 no se puede evaluar, y evaluarla con la zona
    // equivocada sería aplicar otra regla. Es un defecto de datos, no del
    // pedido, y por eso es `5xx`.
    case "SIN_ZONA_INSTITUCIONAL":
      return NextResponse.json(
        { error: "La institución no tiene zona horaria configurada" },
        { status: 503 },
      );
  }
}

type MotivoCorregible = Extract<
  Awaited<ReturnType<typeof renegociarCompromiso>>,
  { estado: "NO_ELEGIBLE" }
>["motivo"];

const MENSAJE: Record<MotivoCorregible, string> = {
  CADENA_YA_RENEGOCIADA: "Este compromiso ya se renegoció una vez",
  ANTICIPACION_INSUFICIENTE: `El nuevo horario tiene que empezar al menos ${MINUTOS_DE_ANTICIPACION} minutos después de ahora`,
  OTRO_DIA_CALENDARIO: "El nuevo horario tiene que ser el mismo día",
  SIN_ACUERDO_ORIGINAL: "Ese compromiso no tiene un horario acordado",
};
