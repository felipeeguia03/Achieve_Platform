import "server-only";

import type { BloqueDeCursada, EstadoDeComision, EstadoDeHorario, RespuestaDeCursada } from "@/lib/domain/cursada";
import { clienteDeServicio } from "../supabase";

/**
 * El cuarto paso del alta, contra Postgres —
 * [ADR-105](../../../docs/decisions.md#adr-105).
 *
 * Dos funciones de base y ninguna consulta propia: qué se ofrece
 * (`opciones_de_cursada`) y qué se contestó (`declarar_cursada`). La precedencia
 * de bloques vive en `bloques_de_cursada()` y **no se repite acá**.
 */

export interface BloqueLeido extends BloqueDeCursada {
  /** `institution` · `inference` (simulado) · `student`… — la procedencia del bloque. */
  fuente?: string;
}

export interface CursadaDelPaso {
  cursadaId: string;
  materia: string;
  periodo: string;
  comision: { estado: EstadoDeComision | null; ofertaId: string | null; nombre: string | null };
  horario: { estado: EstadoDeHorario | null };
  comisiones: { ofertaId: string; nombre: string; bloques: BloqueLeido[] }[];
  bloquesDeLaMateria: BloqueLeido[];
  bloquesDeclarados: BloqueLeido[];
}

/** Lo que la base rechaza con motivo, y el Service contesta como producto. */
export type RechazoDeCursada = "CURSADA_AJENA" | "COMISION_INVALIDA" | "HORARIO_SIN_BLOQUES";

export class CursadaRechazada extends Error {
  constructor(public readonly motivo: RechazoDeCursada) {
    super(motivo);
  }
}

const hhmm = (h: string) => (h ?? "").slice(0, 5);
const aBloque = (b: BloqueLeido): BloqueLeido => ({ ...b, desde: hhmm(b.desde), hasta: hhmm(b.hasta) });

async function opciones(institutionId: string, studentId: string): Promise<CursadaDelPaso[]> {
  const { data, error } = await clienteDeServicio().rpc("opciones_de_cursada", {
    p_institution_id: institutionId,
    p_student_id: studentId,
  });
  if (error) throw new Error(`No se pudieron leer las opciones de cursada: ${error.message}`);
  return ((data ?? []) as CursadaDelPaso[]).map((c) => ({
    ...c,
    comisiones: c.comisiones.map((o) => ({ ...o, bloques: o.bloques.map(aBloque) })),
    bloquesDeLaMateria: c.bloquesDeLaMateria.map(aBloque),
    bloquesDeclarados: c.bloquesDeclarados.map(aBloque),
  }));
}

async function declarar(
  institutionId: string,
  studentId: string,
  respuestas: readonly RespuestaDeCursada[],
): Promise<{ cursadas: number; faltan: number }> {
  const { data, error } = await clienteDeServicio().rpc("declarar_cursada", {
    p_institution_id: institutionId,
    p_student_id: studentId,
    p_cursadas: respuestas,
  });
  if (error) {
    const motivo = (["CURSADA_AJENA", "COMISION_INVALIDA", "HORARIO_SIN_BLOQUES"] as const).find((m) =>
      error.message.includes(m),
    );
    if (motivo) throw new CursadaRechazada(motivo);
    throw new Error(`No se pudo guardar la cursada: ${error.message}`);
  }
  return data as { cursadas: number; faltan: number };
}

export const cursadaReal = { opciones, declarar };
