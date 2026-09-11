/**
 * **Los próximos 7 días** — [ADR-093](../../docs/decisions.md#adr-093).
 *
 * Junta en una lista por día lo que ya existe en cuatro lugares:
 *
 * | Qué | De dónde | Motor |
 * |---|---|---|
 * | Evaluaciones | la próxima con fecha de cada materia | Academic |
 * | Clases | `class_schedule_block`, la regla semanal | Academic |
 * | Compromisos | `commitment` pendientes, con su horario acordado | — (el estudiante) |
 * | Franjas para estudiar | `availability` **declarada** | Personal |
 *
 * ## ⚠️ No es una agenda, y hay tres cosas que no hace
 *
 * 1. **No propone cuándo estudiar.** El ADE no agenda
 *    ([ADR-064](../../docs/decisions.md#adr-064)): el *cuándo* vive en el
 *    `Commitment`, y acá sólo aparece si el estudiante ya lo acordó.
 * 2. **No mezcla clases con disponibilidad.** Una dice cuándo cursa, la otra
 *    cuándo puede estudiar ([ADR-083](../../docs/decisions.md#adr-083)); se
 *    listan como dos cosas distintas y ninguna descuenta a la otra.
 * 3. **No completa lo que falta.** Una evaluación sin hora va sin hora; una
 *    franja sin horario va con sus minutos o no va.
 *
 * Es puro: recibe instantes y fechas ya leídos, y la aritmética de husos es la
 * única que hay, la de `zona.ts`.
 */
import { desplazamiento, diaDeSemana, fechaEnZona } from "./zona";

export interface EntradaDeSemana {
  /** `YYYY-MM-DD`, en la zona del estudiante. */
  hoy: string;
  zona: string;
  evaluaciones: ReadonlyArray<{ cursadaId: string; nombre: string; fecha: string; rotulo: string | null }>;
  clases: ReadonlyArray<{ cursadaId: string; nombre: string; dia: number; desde: string; hasta: string }>;
  compromisos: ReadonlyArray<{ cursadaId: string; nombre: string; inicio: string; minutos: number; titulo: string }>;
  disponibilidad: ReadonlyArray<{ dia: number | null; desde: string | null; hasta: string | null; minutos: number | null }>;
}

export type ItemDeSemana =
  | { tipo: "EVALUACION"; cursadaId: string; nombre: string; rotulo: string | null }
  | { tipo: "COMPROMISO"; cursadaId: string; nombre: string; hora: string; minutos: number; titulo: string }
  | { tipo: "CLASE"; cursadaId: string; nombre: string; desde: string; hasta: string }
  | { tipo: "DISPONIBLE"; desde: string | null; hasta: string | null; minutos: number | null };

export interface DiaDeSemana {
  /** `YYYY-MM-DD`. */
  fecha: string;
  /** `0` es hoy. */
  offset: number;
  items: ItemDeSemana[];
}

const hhmm = (t: string) => t.slice(0, 5);

function sumarDias(fecha: string, n: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** La hora de pared de un instante en la zona, `HH:MM`. */
function horaEnZona(instante: number, zona: string): string {
  return new Date(instante + desplazamiento(instante, zona)).toISOString().slice(11, 16);
}

/** Lo que va sin hora va primero; después, por hora de inicio. */
function claveDeOrden(i: ItemDeSemana): string {
  switch (i.tipo) {
    case "EVALUACION":
      return "00:00:0";
    case "COMPROMISO":
      return `${i.hora}:2`;
    case "CLASE":
      return `${hhmm(i.desde)}:1`;
    case "DISPONIBLE":
      return i.desde ? `${hhmm(i.desde)}:3` : "99:99:3";
  }
}

export function semanaDe(e: EntradaDeSemana, cantidad = 7): DiaDeSemana[] {
  return Array.from({ length: cantidad }, (_, offset) => {
    const fecha = sumarDias(e.hoy, offset);
    const dia = diaDeSemana(fecha);

    const items: ItemDeSemana[] = [
      ...e.evaluaciones
        .filter((ev) => ev.fecha.slice(0, 10) === fecha)
        .map((ev) => ({ tipo: "EVALUACION" as const, cursadaId: ev.cursadaId, nombre: ev.nombre, rotulo: ev.rotulo })),
      ...e.compromisos
        .filter((c) => fechaEnZona(Date.parse(c.inicio), e.zona) === fecha)
        .map((c) => ({
          tipo: "COMPROMISO" as const,
          cursadaId: c.cursadaId,
          nombre: c.nombre,
          hora: horaEnZona(Date.parse(c.inicio), e.zona),
          minutos: c.minutos,
          titulo: c.titulo,
        })),
      ...e.clases
        .filter((c) => c.dia === dia)
        .map((c) => ({
          tipo: "CLASE" as const,
          cursadaId: c.cursadaId,
          nombre: c.nombre,
          desde: hhmm(c.desde),
          hasta: hhmm(c.hasta),
        })),
      ...e.disponibilidad
        // Una franja sin día no se puede ubicar en ninguno: se omite.
        .filter((d) => d.dia === dia && (d.desde !== null || d.minutos !== null))
        .map((d) => ({
          tipo: "DISPONIBLE" as const,
          desde: d.desde ? hhmm(d.desde) : null,
          hasta: d.hasta ? hhmm(d.hasta) : null,
          minutos: d.minutos,
        })),
    ];

    items.sort((a, b) => claveDeOrden(a).localeCompare(claveDeOrden(b)));
    return { fecha, offset, items };
  });
}
