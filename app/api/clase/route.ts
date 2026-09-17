import { NextResponse } from "next/server";

import { altaPendiente, tokenDelHeader } from "@/lib/server/http";
import {
  claseActivaDe,
  claseDe,
  clasesDeCursada,
  iniciarClase,
  resolverSesion,
} from "@/lib/server/composicion";

/**
 * `/api/clase` — **Modo Clase** · [ADR-098](../../../docs/decisions.md#adr-098).
 *
 * ⚠️ **Lo ajeno es `404`, nunca `403`**: `403` confirmaría que la clase existe.
 * El `institutionId` y el estudiante salen de la sesión, nunca del pedido.
 *
 * ⚠️ **Nada de esto crea `Evidence`, progreso ni `Action`s.** Abrir una clase no
 * es evidencia de nada.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function sesionDe(request: Request) {
  const sesion = await resolverSesion(tokenDelHeader(request.headers.get("authorization")));
  if (sesion.estado === "NO_AUTENTICADO") {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) } as const;
  }
  if (sesion.estado === "SIN_PADRON") {
    return { error: NextResponse.json({ error: "Sin habilitación de padrón" }, { status: 403 }) } as const;
  }
  // El alta primero (ADR-052), igual que las nueve superficies.
  const pendiente = altaPendiente(sesion.alta);
  if (pendiente) return { error: NextResponse.json(pendiente, { status: 409 }) } as const;
  return { estudiante: sesion.estudiante } as const;
}

const noEncontrada = () => NextResponse.json({ error: "No se encontró esa clase" }, { status: 404 });

/**
 * `GET` — sin parámetros, la clase activa (`{ activa: null }` si no hay);
 * `?clase=<id>`, una clase; `?cursada=<id>`, las de una materia **sin apuntes**.
 */
export async function GET(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;
  const { institutionId, id, timezone } = s.estudiante;

  const params = new URL(request.url).searchParams;
  const claseId = params.get("clase");
  const cursadaId = params.get("cursada");

  if (claseId) {
    if (!UUID.test(claseId)) return noEncontrada();
    const clase = await claseDe(institutionId, id, claseId, timezone);
    return clase ? NextResponse.json(clase) : noEncontrada();
  }
  if (cursadaId) {
    if (!UUID.test(cursadaId)) return NextResponse.json({ error: "No se encontró esa materia" }, { status: 404 });
    const clases = await clasesDeCursada(institutionId, id, cursadaId, timezone);
    return clases
      ? NextResponse.json({ clases })
      : NextResponse.json({ error: "No se encontró esa materia" }, { status: 404 });
  }
  return NextResponse.json({ activa: await claseActivaDe(institutionId, id, timezone) });
}

/** `POST { cursada, bloque? }` — iniciar una clase (`CTA-022`). */
export async function POST(request: Request) {
  const s = await sesionDe(request);
  if ("error" in s) return s.error;

  const cuerpo = (await request.json().catch(() => null)) as { cursada?: string; bloque?: string | null } | null;
  if (!cuerpo?.cursada || !UUID.test(cuerpo.cursada)) {
    return NextResponse.json({ error: "Falta `cursada`" }, { status: 400 });
  }
  if (cuerpo.bloque && !UUID.test(cuerpo.bloque)) {
    return NextResponse.json({ error: "`bloque` no es un identificador" }, { status: 400 });
  }

  const r = await iniciarClase(s.estudiante.institutionId, {
    studentId: s.estudiante.id,
    cursadaId: cuerpo.cursada,
    bloqueId: cuerpo.bloque ?? null,
  });
  switch (r.estado) {
    case "OK":
      return NextResponse.json({ clase: r.clase.id, duplicado: r.duplicado }, { status: r.duplicado ? 200 : 201 });
    // No es un error técnico: hay otra clase abierta, y la respuesta dice cuál
    // para poder volver a ella.
    case "YA_HAY_OTRA_ACTIVA":
      return NextResponse.json(
        { error: "Ya tenés una clase abierta", motivo: "YA_HAY_OTRA_ACTIVA", clase: r.clase.id },
        { status: 409 },
      );
    case "CURSADA_AJENA":
      return NextResponse.json({ error: "No se encontró esa materia" }, { status: 404 });
    case "BLOQUE_AJENO":
      return NextResponse.json({ error: "Ese horario no es de esa materia" }, { status: 404 });
  }
}

// ⚠️ **Ya no hay `PATCH`** (ADR-099 §4): los apuntes son entradas y viven en
// `/api/clase/apunte`. El texto único de ADR-098 quedó sin escritor.
