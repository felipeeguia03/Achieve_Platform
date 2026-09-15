/**
 * 🧪 LABORATORIO DESCARTABLE V3 — aritmética de hora de pared.
 *
 * ⚠️ **No reemplaza a `lib/domain/zona.ts`.** Todo el fixture vive en una sola zona
 * sin horario de verano y se mide en **minutos desde el lunes 14 a las 00:00** de la
 * semana del laboratorio. Un día anterior da minutos negativos, uno posterior da más
 * de `7 × 1440`: así el Gantt puede ubicar fechas fuera de la semana sin otro reloj.
 */

export const ZONA_DEL_LAB = "America/Argentina/Cordoba";

/** El lunes de la semana del laboratorio. */
export const LUNES = "2026-09-14";
export const DIA = 1440;
export const FIN_DE_SEMANA = 7 * DIA;

/** La grilla del calendario: de 07:00 a 23:00. */
export const HORA_INICIO = 7;
export const HORA_FIN = 23;

const MS_DIA = 86_400_000;

export function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Días entre el lunes del laboratorio y `fecha` (`YYYY-MM-DD`). */
export function diasDesdeElLunes(fecha: string): number {
  return Math.round((Date.parse(`${fecha}T00:00:00Z`) - Date.parse(`${LUNES}T00:00:00Z`)) / MS_DIA);
}

/** `martes 15, 19:00` → `1860`. */
export function instante(fecha: string, hhmm: string): number {
  return diasDesdeElLunes(fecha) * DIA + aMinutos(hhmm);
}

export function fechaDe(minuto: number): string {
  const dias = Math.floor(minuto / DIA);
  return new Date(Date.parse(`${LUNES}T00:00:00Z`) + dias * MS_DIA).toISOString().slice(0, 10);
}

/** Minuto dentro del día, `0`–`1439`. */
export const minutoDelDia = (minuto: number) => ((minuto % DIA) + DIA) % DIA;

export function horaDe(minuto: number): string {
  const m = minutoDelDia(minuto);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** `560` → `9 h 20`. `45` → `45 min`. `0` → `0 min`. Negativo → `−45 min`. */
export function enHoras(minutos: number): string {
  const signo = minutos < 0 ? "−" : "";
  const abs = Math.abs(Math.round(minutos));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${signo}${m} min`;
  if (m === 0) return `${signo}${h} h`;
  return `${signo}${h} h ${String(m).padStart(2, "0")}`;
}

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function partes(fecha: string) {
  const [a, m, d] = fecha.split("-").map(Number);
  return { semana: new Date(Date.UTC(a, m - 1, d)).getUTCDay(), numero: d, mes: m - 1 };
}

/** `2026-09-17` → `jue 17`. */
export const diaCorto = (fecha: string) => `${DIAS[partes(fecha).semana]} ${partes(fecha).numero}`;
/** `2026-09-17` → `jueves 17`. */
export const diaMedio = (fecha: string) => `${DIAS_LARGOS[partes(fecha).semana]} ${partes(fecha).numero}`;
/** `2026-09-17` → `jueves 17 de sep`. */
export const diaLargo = (fecha: string) => `${diaMedio(fecha)} de ${MESES[partes(fecha).mes]}`;
/** `2026-09-17` → `jueves`. */
export const nombreDelDia = (fecha: string) => DIAS_LARGOS[partes(fecha).semana];
/** `2026-09-17` → `17 sep`. */
export const fechaCorta = (fecha: string) => `${partes(fecha).numero} ${MESES[partes(fecha).mes]}`;

/** `jue 17, 19:00–20:00`. */
export const tramoCorto = (ini: number, fin: number) => `${diaCorto(fechaDe(ini))}, ${horaDe(ini)}–${horaDe(fin)}`;
/** `jueves 17, 19:00–20:00`. */
export const tramoMedio = (ini: number, fin: number) => `${diaMedio(fechaDe(ini))}, ${horaDe(ini)}–${horaDe(fin)}`;

/** Redondea hacia arriba al múltiplo de `paso` minutos. */
export const redondearArriba = (minuto: number, paso = 5) => Math.ceil(minuto / paso) * paso;

/** `el parcial de X` → `del parcial de X`; `la entrega` → `de la entrega`. */
export const deArticulo = (frase: string) => (frase.startsWith("el ") ? `del ${frase.slice(3)}` : `de ${frase}`);

export const SEMANA: readonly string[] = Array.from({ length: 7 }, (_, i) => fechaDe(i * DIA));
