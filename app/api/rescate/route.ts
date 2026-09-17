import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import { rescatarCompromiso, resolverSesion } from "@/lib/server/composicion";

/**
 * `POST /api/rescate` — **la salida de un incumplimiento** · Etapa B6.9.1.
 *
 * Es una acción **del estudiante**, y por eso va con su JWT y no con el secreto
 * de servicio: quien decide volver a comprometerse después de fallar es él.
 * Nadie más puede hacerlo por él, y él no puede hacerlo por otro.
 *
 * ## Por qué es una ruta propia y no un modo de `/api/compromiso`
 *
 * No crean lo mismo. `POST /api/compromiso` crea **el primer** compromiso de
 * una `Action` y la lleva a `COMMITTED`; esto crea **otro objeto** que apunta a
 * un incumplimiento y **no toca la `Action`**, que ya está `COMMITTED` desde la
 * vuelta anterior. Meterlos en la misma ruta con una bandera obligaría a leer
 * la bandera para saber qué hace el endpoint, que es como se cuelan los
 * efectos que nadie esperaba.
 *
 * ## Lo que esta ruta no puede hacer, y no es una omisión
 *
 * **No edita el incumplimiento.** El original sigue `MISSED` para siempre
 * (`I3`, *No Cortar*), y esa garantía no está acá: está en `crear_rescate` y en
 * la máquina de estados, donde no se puede aflojar por descuido.
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
    rescatado?: string;
    inicio?: string;
    zona?: string;
    minutos?: number;
    clave?: string;
  } | null;

  if (!cuerpo?.rescatado || !cuerpo.inicio || !cuerpo.zona || !cuerpo.minutos || !cuerpo.clave) {
    return NextResponse.json(
      { error: "Faltan `rescatado`, `inicio`, `zona`, `minutos` y `clave`" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(cuerpo.minutos) || cuerpo.minutos <= 0) {
    return NextResponse.json({ error: "`minutos` tiene que ser un entero positivo" }, { status: 400 });
  }

  const resultado = await rescatarCompromiso(sesion.estudiante.institutionId, {
    rescatadoId: cuerpo.rescatado,
    estudianteId: sesion.estudiante.id,
    // Normalizado antes de comparar, igual que en `/api/compromiso`: dos
    // representaciones del mismo instante son el mismo pedido.
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
    // **Un `404` seco.** Que exista y sea de otro, o que no exista, es la misma
    // respuesta: distinguirlas convertiría la ruta en un detector de qué
    // compromisos tienen otros alumnos.
    case "NO_ES_SUYO":
      return NextResponse.json({ error: "No se encontró ese compromiso" }, { status: 404 });
    case "NO_INCUMPLIDO":
      return NextResponse.json(
        { error: `Sólo se rescata un compromiso incumplido; ése está ${resultado.desde}` },
        { status: 409 },
      );
    case "CONFLICTO":
      return NextResponse.json({ error: "Ese incumplimiento ya tiene rescate" }, { status: 409 });
    case "CONFLICTO_DE_CLAVE":
      return NextResponse.json({ error: "La clave ya se usó para otro pedido" }, { status: 409 });
  }
}
