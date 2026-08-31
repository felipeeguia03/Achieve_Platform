import {
  transicionesPorTiempo,
  type CompromisoConReloj,
} from "@/lib/domain/reloj-compromisos";
import type { PublicadorDeEventos } from "./eventos";
import type { RepositorioDeCompromisos } from "./compromiso";
import { transicionar } from "./compromiso";

/**
 * El owner del lifecycle, ejecutando — Fase B4 / [ADR-024](../../../docs/decisions.md#adr-024).
 *
 * **No decide nada nuevo.** La regla vive en `lib/domain/reloj-compromisos.ts`,
 * pura; acá sólo se aplica cada transición **por la misma vía que cualquier
 * otra**: `transicionar()`, con su compare-and-swap y su evento. Un camino
 * paralelo que escribiera directo se saltearía la máquina de estados, y sería
 * exactamente el agujero por donde un `MISSED` podría volver.
 */
export interface RepositorioDeReloj {
  /** Los que dependen del tiempo. Sólo `CONFIRMED` y `DUE`: el resto no se mueve. */
  candidatosPorTiempo(institutionId: string, limite: number): Promise<CompromisoConReloj[]>;
}

export interface ResumenDeCorrida {
  vencidos: number;
  incumplidos: number;
  /** Perdieron una carrera contra otra escritura. No es error: se reintenta. */
  conflictos: number;
}

export async function correrReloj(
  deps: {
    reloj: RepositorioDeReloj;
    compromisos: RepositorioDeCompromisos;
    eventos: PublicadorDeEventos;
  },
  institutionId: string,
  ahora: string,
  limite = 500,
): Promise<ResumenDeCorrida> {
  const candidatos = await deps.reloj.candidatosPorTiempo(institutionId, limite);
  const pendientes = transicionesPorTiempo(candidatos, ahora);

  const resumen: ResumenDeCorrida = { vencidos: 0, incumplidos: 0, conflictos: 0 };

  for (const t of pendientes) {
    const r = await transicionar(
      { repo: deps.compromisos, eventos: deps.eventos },
      institutionId,
      t.id,
      t.hacia,
      // El actor es el sistema, no una persona: nadie apretó nada. Poner un
      // `actorId` de estudiante acá diría en la auditoría que lo hizo él.
      null,
      () => new Date(ahora),
    );

    if (r.estado === "OK") {
      if (t.hacia === "DUE") resumen.vencidos++;
      else resumen.incumplidos++;
    } else if (r.estado === "CONFLICTO") {
      // El estudiante lo movió mientras corríamos. Su acción gana: la próxima
      // corrida verá el estado nuevo.
      resumen.conflictos++;
    }
    // `TRANSICION_PROHIBIDA` y `NO_ENCONTRADO` no se cuentan como error: el
    // reloj lee una foto y el mundo sigue moviéndose entre la lectura y la
    // escritura. Es lo esperado, no una falla.
  }

  return resumen;
}
