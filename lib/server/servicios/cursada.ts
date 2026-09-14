import {
  motivoDeRespuestaInvalida,
  sinContestar,
  type RespuestaDeCursada,
} from "@/lib/domain/cursada";
import type { CursadaDelPaso, RechazoDeCursada } from "../repositorios/cursada";

/**
 * Service del cuarto paso del alta — [ADR-105](../../../docs/decisions.md#adr-105).
 *
 * **No conoce la persistencia** (`architecture.md` §3.2). Valida con el dominio,
 * exige que **todas** las materias estén contestadas y recién ahí escribe.
 *
 * ⚠️ **No emite eventos.** Si un cambio de comisión es un hecho con evento
 * propio es la fila 19 de `decisiones-abiertas.md`, abierta. Contestar el alta
 * guarda estado, como la disponibilidad (ADR-073).
 */

export interface RepositorioDeCursada {
  opciones(institutionId: string, studentId: string): Promise<CursadaDelPaso[]>;
  declarar(
    institutionId: string,
    studentId: string,
    respuestas: readonly RespuestaDeCursada[],
  ): Promise<{ cursadas: number; faltan: number }>;
}

export type ResultadoDeCursada =
  | { estado: "OK"; cursadas: number }
  | { estado: "DATOS_INVALIDOS"; cursadaId: string | null; motivo: string }
  /** Faltan materias por contestar: el paso no se da por contestado a medias. */
  | { estado: "FALTAN_MATERIAS"; cursadas: string[] }
  | { estado: "RECHAZADO"; motivo: RechazoDeCursada };

export function opcionesDeCursada(repo: RepositorioDeCursada, institutionId: string, studentId: string) {
  return repo.opciones(institutionId, studentId);
}

export async function declararCursada(
  repo: RepositorioDeCursada,
  institutionId: string,
  studentId: string,
  respuestas: readonly RespuestaDeCursada[],
  esRechazo: (e: unknown) => RechazoDeCursada | null,
): Promise<ResultadoDeCursada> {
  const opciones = await repo.opciones(institutionId, studentId);

  for (const r of respuestas) {
    const motivo = motivoDeRespuestaInvalida(r, opciones.find((o) => o.cursadaId === r.cursadaId));
    if (motivo) return { estado: "DATOS_INVALIDOS", cursadaId: r.cursadaId, motivo };
  }
  const ids = new Set(respuestas.map((r) => r.cursadaId));
  if (ids.size !== respuestas.length) {
    return { estado: "DATOS_INVALIDOS", cursadaId: null, motivo: "una materia viene contestada dos veces" };
  }
  const faltan = sinContestar(opciones, respuestas);
  if (faltan.length > 0) return { estado: "FALTAN_MATERIAS", cursadas: faltan };

  try {
    const r = await repo.declarar(institutionId, studentId, respuestas);
    return { estado: "OK", cursadas: r.cursadas };
  } catch (e) {
    const motivo = esRechazo(e);
    if (motivo) return { estado: "RECHAZADO", motivo };
    throw e;
  }
}
