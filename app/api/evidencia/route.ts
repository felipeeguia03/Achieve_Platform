import { NextResponse } from "next/server";

import { tokenDelHeader } from "@/lib/server/http";
import {
  compromisoVigenteDe,
  devueltaDe,
  entregaEsperadaDe,
  entregarEvidencia,
  evidenciaDe,
  firmarSubidaDeEvidencia,
  resolverSesion,
} from "@/lib/server/composicion";

/**
 * `GET /api/evidencia` — Controller de `UX05`. `?evidencia=<uuid>` opcional.
 *
 * ⚠️ **No acepta el requisito de Reflection desde el request.** `C01-051` está
 * `OPEN`: si el cliente pudiera mandarlo, el navegador estaría decidiendo una
 * regla de negocio abierta. Cuando se cierre, entra por configuración del lado
 * del servidor.
 */
export async function GET(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));

  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("evidencia");
  const { institutionId, id: studentId } = sesion.estudiante;

  /*
    Si el compromiso vigente todavía no tiene entrega, manda la vista esperada.
    Va **antes** que la proyección real por una razón concreta: la lectura
    devuelve la última evidencia del estudiante, que sin este corte sería la de
    otra acción — y `UX05` mostraría una entrega ajena al compromiso que el
    estudiante acaba de tomar.
  */
  if (!id) {
    const esperada = await entregaEsperadaDe(institutionId, studentId);
    if (esperada) {
      return NextResponse.json({
        ...esperada.props,
        compromiso: esperada.compromisoId,
        accion: esperada.accionId,
      });
    }
  }

  const props = await evidenciaDe(institutionId, studentId, id);
  if (!props) return NextResponse.json({ error: "Sin evidencia registrada" }, { status: 404 });

  // A qué compromiso se adjunta la entrega. No es contenido de la pantalla
  // —`EvidenciaProps` no lo muestra—, es lo que el cliente necesita para poder
  // entregar. Sale de la misma lectura que ya proyecta `UX04`.
  const vigente = await compromisoVigenteDe(institutionId, studentId);
  // Y si lo que hay es una entrega **devuelta**, cuál es: el reenvío necesita a
  // quién sucede, y el cliente no puede inventarlo — Etapa B6.9.2.
  const devuelta = props.estado === "RESUBMISSION_REQUESTED" ? await devueltaDe(institutionId, studentId) : null;
  return NextResponse.json({
    ...props,
    compromiso: vigente?.compromisoId ?? null,
    ...(devuelta ? { anterior: devuelta.anteriorId } : {}),
  });
}

/**
 * `POST /api/evidencia` — la entrega, en dos tiempos.
 *
 * **`?firmar=<nombre>`** reserva el id y devuelve la URL firmada. No escribe
 * ninguna fila: si el estudiante abandona, no queda una entrega que no ocurrió.
 *
 * **Sin `?firmar`** registra la entrega, con el archivo ya arriba. `clave` la
 * genera el cliente (D2·A): repetirla con el mismo dueño, compromiso y
 * evidencia devuelve la fila existente; con otro dueño o contenido es `409`
 * sin exponerla.
 *
 * ⚠️ **Entregar no es suficiencia ni progreso.** La fila nace `SUBMITTED` con
 * las tres señales en `not_evaluated`. Quién juzga es otra operación, y va con
 * secreto de servicio.
 */
export async function POST(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (sesion.estado === "SIN_PADRON") {
    return NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 });
  }

  const institutionId = sesion.estudiante.institutionId;
  const firmar = new URL(request.url).searchParams.get("firmar");
  if (firmar) {
    return NextResponse.json(await firmarSubidaDeEvidencia(institutionId, firmar));
  }

  const cuerpo = (await request.json().catch(() => null)) as {
    compromiso?: string;
    evidencia?: string;
    clave?: string;
  } | null;

  if (!cuerpo?.compromiso || !cuerpo.evidencia || !cuerpo.clave) {
    return NextResponse.json(
      { error: "Faltan `compromiso`, `evidencia` y `clave`" },
      { status: 400 },
    );
  }

  const resultado = await entregarEvidencia(institutionId, {
    evidenciaId: cuerpo.evidencia,
    commitmentId: cuerpo.compromiso,
    estudianteId: sesion.estudiante.id,
    claveDeIdempotencia: cuerpo.clave,
  });

  switch (resultado.estado) {
    // El requisito de Reflection se hace cumplir **acá**, no en el botón — la
    // proyección lo apagaba y nadie más lo miraba (Etapa B6.10).
    case "FALTA_REFLEXION_REQUERIDA":
      return NextResponse.json(
        { error: "Esta acción pide una reflexión antes de entregar" },
        { status: 409 },
      );
    case "OK":
      return NextResponse.json(
        { evidencia: resultado.evidenciaId, duplicado: resultado.duplicado },
        { status: resultado.duplicado ? 200 : 201 },
      );
    case "CONFLICTO_DE_CLAVE":
      return NextResponse.json({ error: "La clave ya se usó para otro pedido" }, { status: 409 });
    case "COMPROMISO_NO_ENTREGABLE":
      return NextResponse.json({ error: resultado.motivo }, { status: 409 });
  }
}
