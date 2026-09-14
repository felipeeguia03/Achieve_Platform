/**
 * 🧪 SPIKE DESCARTABLE — aritmética de hora de pared para el laboratorio.
 *
 * ⚠️ **No reemplaza a `lib/domain/zona.ts`.** Acá todo el fixture vive en una sola
 * zona (`America/Argentina/Cordoba`, sin horario de verano) y cada instante se
 * escribe con su `-03:00` literal, que es exactamente lo que `zona.ts` prohíbe en
 * producción. Se puede sólo porque estos datos no salen de esta carpeta.
 */

export const ZONA_DEL_SPIKE = "America/Argentina/Cordoba";

/** `HH:MM` → minutos desde las 00:00. */
export function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Minutos desde las 00:00 → `HH:MM`. */
export function aHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function duracionDe(f: { desde: string; hasta: string }): number {
  return aMinutos(f.hasta) - aMinutos(f.desde);
}

/** Instante absoluto en ms de un día + hora de pared del fixture. */
export function instante(dia: string, hhmm: string): number {
  return Date.parse(`${dia}T${hhmm}:00-03:00`);
}

/** `560` → `9 h 20`. `45` → `45 min`. `0` → `0 min`: un cero real se dice. */
export function enHoras(minutos: number): string {
  const signo = minutos < 0 ? "−" : "";
  const abs = Math.abs(minutos);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${signo}${m} min`;
  if (m === 0) return `${signo}${h} h`;
  return `${signo}${h} h ${String(m).padStart(2, "0")}`;
}

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function partes(dia: string): { semana: number; numero: number; mes: number } {
  const [a, m, d] = dia.split("-").map(Number);
  return { semana: new Date(Date.UTC(a, m - 1, d)).getUTCDay(), numero: d, mes: m - 1 };
}

/** `2026-09-17` → `jue 17`. */
export function diaCorto(dia: string): string {
  const p = partes(dia);
  return `${DIAS[p.semana]} ${p.numero}`;
}

/** `2026-09-17` → `jueves 17 de sep`. */
export function diaLargo(dia: string): string {
  const p = partes(dia);
  return `${DIAS_LARGOS[p.semana]} ${p.numero} de ${MESES[p.mes]}`;
}

/** `2026-09-17T19:10:00-03:00` → `{ dia: "2026-09-17", hora: "19:10" }`. Sólo para el fixture. */
export function relojDe(iso: string): { dia: string; hora: string } {
  return { dia: iso.slice(0, 10), hora: iso.slice(11, 16) };
}
