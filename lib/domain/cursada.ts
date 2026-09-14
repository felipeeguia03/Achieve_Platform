/**
 * El cuarto paso del alta: comisión y horarios —
 * [ADR-105](../../docs/decisions.md#adr-105), que construye
 * [ADR-062](../../docs/decisions.md#adr-062) y [ADR-063](../../docs/decisions.md#adr-063).
 *
 * **Puro:** sin React, sin I/O. Valida lo que el estudiante contestó y resume
 * lo que eso habilita. Nada de acá elige una comisión ni completa un horario.
 *
 * ## Tres afirmaciones distintas, y ninguna implica otra
 *
 * 1. El estudiante **cursa** la materia — ya lo dijo en `/alta/materias`.
 * 2. **Pertenece** a una comisión — `EstadoDeComision`.
 * 3. **Tiene clase** tales días — `EstadoDeHorario`.
 *
 * Comisión desconocida con horario conocido es un caso de primera clase
 * (ADR-063: *«comisión desconocida, pero días y horarios conocidos»*).
 */

/** ADR-062, los cuatro estados. En la base, `NULL` es «todavía no se preguntó». */
export type EstadoDeComision = "CONFIRMED" | "UNKNOWN" | "NOT_LISTED" | "NOT_APPLICABLE";

/** ADR-063. `UNKNOWN` **no deja filas**: la ausencia no es disponibilidad. */
export type EstadoDeHorario = "KNOWN" | "UNKNOWN";

export interface BloqueDeCursada {
  /** `0`–`6`, domingo a sábado: la escala de `availability` y del bloque. */
  dia: number;
  /** `HH:MM`. */
  desde: string;
  hasta: string;
  aula?: string;
}

export interface RespuestaDeCursada {
  cursadaId: string;
  comision: { estado: EstadoDeComision; ofertaId?: string; nombre?: string };
  horario: { estado: EstadoDeHorario; bloques?: BloqueDeCursada[] };
}

/** Lo que el catálogo ofrece para una cursada, ya leído. */
export interface OpcionesDeUnaCursada {
  cursadaId: string;
  materia: string;
  comisiones: { ofertaId: string; nombre: string; bloques: BloqueDeCursada[] }[];
  /** Los bloques de la materia sin comisión (el horario de antes). */
  bloquesDeLaMateria: BloqueDeCursada[];
}

const HORA = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const hhmm = (h: string) => h.slice(0, 5);

/**
 * De dónde salen los bloques de una cursada — **espejo de
 * `bloques_de_cursada()`** (ADR-105 §5). Existe para que la pantalla pueda decir
 * qué horario va a quedar **antes** de guardar, con la misma regla que la base.
 */
export type OrigenDeLosBloques = "NINGUNO" | "DECLARADOS" | "COMISION" | "MATERIA";

export function origenDeLosBloques(r: {
  horario: EstadoDeHorario | null;
  comision: EstadoDeComision | null;
  hayDeclarados: boolean;
}): OrigenDeLosBloques {
  if (r.horario === "UNKNOWN") return "NINGUNO";
  if (r.hayDeclarados) return "DECLARADOS";
  if (r.comision === "CONFIRMED") return "COMISION";
  if (r.comision === "UNKNOWN" || r.comision === "NOT_LISTED") return "NINGUNO";
  return "MATERIA";
}

/** Un bloque de cursada con forma de bloque. `null` ⇒ válido. */
export function motivoDeBloqueInvalido(b: BloqueDeCursada): string | null {
  if (!Number.isInteger(b.dia) || b.dia < 0 || b.dia > 6) return "el día va de 0 (domingo) a 6 (sábado)";
  if (!HORA.test(b.desde) || !HORA.test(b.hasta)) return "la hora va en formato HH:MM";
  if (hhmm(b.hasta) <= hhmm(b.desde)) return "la clase termina antes de empezar";
  return null;
}

/**
 * Valida **una** respuesta contra lo que el catálogo ofrece. `null` ⇒ válida.
 *
 * ⚠️ **Lo que se rechaza es lo que no es un dato**, nunca un «no sé»:
 * `UNKNOWN` en las dos preguntas es una respuesta completa.
 */
export function motivoDeRespuestaInvalida(
  r: RespuestaDeCursada,
  opciones: OpcionesDeUnaCursada | undefined,
): string | null {
  if (!opciones) return "esa materia no está entre las que cursás";

  const { estado, ofertaId, nombre } = r.comision;
  if (!["CONFIRMED", "UNKNOWN", "NOT_LISTED", "NOT_APPLICABLE"].includes(estado)) {
    return "falta contestar la comisión";
  }
  const comision = estado === "CONFIRMED" ? opciones.comisiones.find((c) => c.ofertaId === ofertaId) : undefined;
  if (estado === "CONFIRMED" && !comision) return "esa comisión no es de esta materia";
  if (estado === "NOT_LISTED" && !(nombre ?? "").trim()) return "escribí el nombre de tu comisión";

  if (r.horario.estado !== "KNOWN" && r.horario.estado !== "UNKNOWN") return "falta contestar el horario";
  const bloques = r.horario.estado === "KNOWN" ? (r.horario.bloques ?? []) : [];
  for (const b of bloques) {
    const m = motivoDeBloqueInvalido(b);
    if (m) return m;
  }

  // «Conozco mi horario» tiene que terminar en al menos un bloque, venga de él o
  // de la comisión. Un KNOWN vacío es un dato roto (la base también lo rechaza).
  if (r.horario.estado === "KNOWN" && bloques.length === 0) {
    const origen = origenDeLosBloques({ horario: "KNOWN", comision: estado, hayDeclarados: false });
    const heredados =
      origen === "COMISION" ? (comision?.bloques ?? []) : origen === "MATERIA" ? opciones.bloquesDeLaMateria : [];
    if (heredados.length === 0) return "cargá al menos un día y horario, o elegí «Todavía no sé mi horario»";
  }
  return null;
}

/** Las cursadas que todavía no tienen las dos respuestas. */
export function sinContestar(
  cursadas: readonly OpcionesDeUnaCursada[],
  respuestas: readonly RespuestaDeCursada[],
): string[] {
  const contestadas = new Set(respuestas.map((r) => r.cursadaId));
  return cursadas.filter((c) => !contestadas.has(c.cursadaId)).map((c) => c.cursadaId);
}

/**
 * Pares de clases que se pisan en la semana. **No bloquea**: dos clases a la
 * misma hora pueden ser un error de carga o una realidad, y la pantalla no
 * puede asumir cuál (ADR-064). Se muestra para que el estudiante lo mire.
 *
 * Intervalos semiabiertos: terminar a las 18 y empezar a las 18 no se pisa.
 */
export function clasesQueSeSuperponen(
  bloques: readonly (BloqueDeCursada & { materia: string })[],
): [string, string][] {
  const pares: [string, string][] = [];
  const vistos = new Set<string>();
  for (let i = 0; i < bloques.length; i++) {
    for (let j = i + 1; j < bloques.length; j++) {
      const a = bloques[i];
      const b = bloques[j];
      if (a.materia === b.materia || a.dia !== b.dia) continue;
      if (hhmm(a.desde) < hhmm(b.hasta) && hhmm(b.desde) < hhmm(a.hasta)) {
        const clave = [a.materia, b.materia].sort().join("|");
        if (!vistos.has(clave)) {
          vistos.add(clave);
          pares.push([a.materia, b.materia].sort() as [string, string]);
        }
      }
    }
  }
  return pares;
}

/** El resumen del final del paso: qué quedó sabido y qué no. */
export interface ResumenDeCursada {
  materias: number;
  conHorario: number;
  sinHorario: number;
  comisionDesconocida: number;
}

export function resumenDeCursada(
  respuestas: readonly RespuestaDeCursada[],
  opciones: readonly OpcionesDeUnaCursada[],
): ResumenDeCursada {
  let conHorario = 0;
  let comisionDesconocida = 0;
  for (const r of respuestas) {
    const o = opciones.find((x) => x.cursadaId === r.cursadaId);
    if (r.comision.estado === "UNKNOWN") comisionDesconocida++;
    if (r.horario.estado !== "KNOWN") continue;
    const tieneBloques =
      (r.horario.bloques ?? []).length > 0 ||
      (r.comision.estado === "CONFIRMED" &&
        (o?.comisiones.find((c) => c.ofertaId === r.comision.ofertaId)?.bloques.length ?? 0) > 0) ||
      ((r.comision.estado === "NOT_APPLICABLE") && (o?.bloquesDeLaMateria.length ?? 0) > 0);
    if (tieneBloques) conHorario++;
  }
  return {
    materias: respuestas.length,
    conHorario,
    sinHorario: respuestas.length - conHorario,
    comisionDesconocida,
  };
}
