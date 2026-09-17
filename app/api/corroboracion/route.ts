import { NextResponse } from "next/server";

import { esSecretoDeServicio, tokenDelHeader } from "@/lib/server/http";
import { corroborarProcedenciaDelADL } from "@/lib/server/composicion";
import {
  TABLAS_CON_PROCEDENCIA,
  type TablaConProcedencia,
} from "@/lib/server/servicios/corroboracion";
import type { SourceType, VerificationStatus } from "@/lib/domain/types";

/**
 * `POST /api/corroboracion` — elevar o disputar un `verification_status`.
 *
 * La operación explícita que el invariante `I9` exige y que hasta acá no
 * existía: *"Operación explícita del owner en Service + **autorización y
 * auditoría**"*. Etapa B2b.2.
 *
 * ## Por qué secreto de servicio, y nunca un JWT de estudiante
 *
 * ⚠️ **Quién puede corroborar no está definido:** `C01-030` —autorización,
 * permisos y privacidad institucional— sigue `OPEN`, y la Plataforma no tiene
 * identidad de institución ni de docente ([ADR-023](../../../docs/decisions.md#adr-023),
 * [ADR-033](../../../docs/decisions.md#adr-033)).
 *
 * Y aunque estuviera definido, **no sería el estudiante**: corroborar su propia
 * carga la vaciaría de sentido, exactamente como en `POST /api/observacion`.
 * Alguien confirmando lo que él mismo declaró no es verificación: es la misma
 * afirmación dos veces.
 *
 * Así que se usa el patrón de `POST /api/reloj`: un secreto de servicio, porque
 * del otro lado **no hay una persona autenticada**, y `corroboradoPor` viaja
 * como identidad externa sin validar.
 *
 * ## Lo que este endpoint no puede hacer
 *
 * **No puede producir `official`.** Ese estado significa que la institución lo
 * afirma, y el secreto de servicio autentica al sistema llamante, no a una
 * autoridad académica. El rechazo lo dice con su razón.
 *
 * **No puede bajar a `unverified`.** Borraría que alguien lo miró.
 */
function esTabla(v: unknown): v is TablaConProcedencia {
  return typeof v === "string" && (TABLAS_CON_PROCEDENCIA as readonly string[]).includes(v);
}

const FUENTES: readonly SourceType[] = [
  "institution",
  "instructor",
  "student",
  "community",
  "public_web",
  "inference",
];

function esFuente(v: unknown): v is SourceType {
  return typeof v === "string" && (FUENTES as readonly string[]).includes(v);
}

const ESTADOS: readonly VerificationStatus[] = [
  "unverified",
  "corroborated",
  "official",
  "disputed",
];

function esEstado(v: unknown): v is VerificationStatus {
  return typeof v === "string" && (ESTADOS as readonly string[]).includes(v);
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

  if (typeof cuerpo.institucionId !== "string" || typeof cuerpo.sujetoId !== "string") {
    return NextResponse.json({ error: "Falta institucionId o sujetoId" }, { status: 400 });
  }
  if (!esTabla(cuerpo.tabla)) {
    return NextResponse.json({ error: "La tabla no lleva procedencia" }, { status: 400 });
  }
  if (!esEstado(cuerpo.hacia)) {
    return NextResponse.json({ error: "Estado de destino inválido" }, { status: 400 });
  }
  if (!esFuente(cuerpo.fuente)) {
    return NextResponse.json({ error: "Falta la clase de fuente" }, { status: 400 });
  }
  for (const campo of ["referencia", "motivo"] as const) {
    if (typeof cuerpo[campo] !== "string" || (cuerpo[campo] as string).trim().length === 0) {
      return NextResponse.json({ error: `Falta ${campo}` }, { status: 400 });
    }
  }

  const r = await corroborarProcedenciaDelADL({
    institutionId: cuerpo.institucionId,
    tabla: cuerpo.tabla,
    sujetoId: cuerpo.sujetoId,
    hacia: cuerpo.hacia,
    fuente: cuerpo.fuente,
    referencia: cuerpo.referencia as string,
    motivo: cuerpo.motivo as string,
    corroboradoPor: typeof cuerpo.corroboradoPor === "string" ? cuerpo.corroboradoPor : null,
  });

  if (r.estado === "RECHAZADA") {
    // Un rechazo de dominio no es un `500`: la regla dijo que no, y por qué.
    return NextResponse.json({ error: r.motivo }, { status: 422 });
  }

  return NextResponse.json({
    corroboracionId: r.corroboracionId,
    desde: r.desde,
    hacia: r.hacia,
  });
}
