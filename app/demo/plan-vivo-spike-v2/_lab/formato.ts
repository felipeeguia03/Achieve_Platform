/**
 * 🧪 LABORATORIO DESCARTABLE — aritmética de hora de pared.
 *
 * ⚠️ **Copia deliberada del `formato.ts` de V1**, con dos agregados: no se
 * comparte para no tocar V1. **No reemplaza a `lib/domain/zona.ts`**: todo el
 * fixture vive en una sola zona sin horario de verano y se mide en *minutos de la
 * semana* (`lunes 00:00` = 0), que es exactamente lo que producción no puede hacer.
 */

import { SEMANA } from "./fixture";
import type { Franja } from "./tipos";

export const ZONA_DEL_LAB = "America/Argentina/Cordoba";

export function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function aHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function duracionDe(f: { desde: string; hasta: string }): number {
  return aMinutos(f.hasta) - aMinutos(f.desde);
}

/** Minuto de la semana del laboratorio. `lunes 14, 17:30` → `1050`. */
export function enSemana(dia: string, hhmm: string): number {
  const i = SEMANA.indexOf(dia);
  if (i < 0) throw new Error(`${dia} está fuera de la semana del laboratorio`);
  return i * 1440 + aMinutos(hhmm);
}

export const inicioDe = (f: Franja) => enSemana(f.dia, f.desde);
export const finDe = (f: Franja) => enSemana(f.dia, f.hasta);

/** Minuto de la semana → franja. `a` y `b` tienen que caer el mismo día. */
export function franjaDe(a: number, b: number): Franja {
  const dia = SEMANA[Math.floor(a / 1440)];
  return { dia, desde: aHora(a % 1440), hasta: aHora(b - Math.floor(a / 1440) * 1440) };
}

export const mismaFranja = (a: Franja | null, b: Franja | null) =>
  a === b || (a !== null && b !== null && a.dia === b.dia && a.desde === b.desde && a.hasta === b.hasta);

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

function partes(dia: string) {
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

/** `2026-09-17` → `jueves 17`. */
export function diaMedio(dia: string): string {
  const p = partes(dia);
  return `${DIAS_LARGOS[p.semana]} ${p.numero}`;
}

export const franjaCorta = (f: Franja) => `${diaCorto(f.dia)} ${f.desde}–${f.hasta}`;
export const franjaLarga = (f: Franja) => `${diaLargo(f.dia)}, ${f.desde}–${f.hasta}`;
