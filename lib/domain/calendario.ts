/**
 * El calendario del estudiante — [ADR-100](../../docs/decisions.md#adr-100).
 *
 * Aritmética de **fechas de calendario** (`YYYY-MM-DD`), sin zona y sin React.
 * Todo se calcula en UTC a propósito, por la misma razón que `diaDeSemana` en
 * `zona.ts`: la fecha ya viene resuelta en su zona, y aplicarle un huso de nuevo
 * la correría un día.
 *
 * ## Lo que este archivo NO hace
 *
 * ⚠️ **No crea clases.** Expandir el horario semanal sobre las fechas de un mes
 * es **proyectar una regla que ya existe** (`class_schedule_block`), no escribir
 * `class_session`: no hay fila nueva, no se mueve el Gantt y no se afirma que la
 * clase se dictó. El estudiante ve «cursás los martes de 14 a 16» dibujado sobre
 * los martes, que es exactamente lo que el bloque dice.
 *
 * ⚠️ **No sabe cuándo termina el cursado.** El período no tiene fechas en el
 * schema (ADR-060…065, corte 2 sin hacer), así que el horario se proyecta sobre
 * toda fecha pedida. La pantalla lo dice en la leyenda; **no se inventa un fin
 * de cuatrimestre**.
 */

export type VistaDeCalendario = "dia" | "semana" | "mes";

const DIA_MS = 86_400_000;

function aUtc(fecha: string): number {
  return Date.UTC(Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7)) - 1, Number(fecha.slice(8, 10)));
}

function deUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** `fecha` corrida `n` días (negativo hacia atrás). */
export function sumarDias(fecha: string, n: number): string {
  return deUtc(aUtc(fecha) + n * DIA_MS);
}

/** `0`–`6`, domingo a sábado — la escala de `class_schedule_block.day_of_week`. */
export function diaDeLaSemana(fecha: string): number {
  return new Date(aUtc(fecha)).getUTCDay();
}

/** El lunes de la semana de `fecha`. La semana del calendario arranca en lunes. */
export function lunesDe(fecha: string): string {
  const dia = diaDeLaSemana(fecha);
  return sumarDias(fecha, dia === 0 ? -6 : 1 - dia);
}

/** Todas las fechas de `desde` a `hasta`, **las dos inclusive**. */
export function fechasEntre(desde: string, hasta: string): string[] {
  const fechas: string[] = [];
  for (let ms = aUtc(desde); ms <= aUtc(hasta); ms += DIA_MS) fechas.push(deUtc(ms));
  return fechas;
}

/** Días de calendario de `desde` a `hasta`. Negativo si `hasta` es anterior. */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aUtc(hasta) - aUtc(desde)) / DIA_MS);
}

/** El mismo día del mes corrido `n` meses, recortado al último día si no existe. */
export function sumarMeses(fecha: string, n: number): string {
  const anio = Number(fecha.slice(0, 4));
  const mes = Number(fecha.slice(5, 7)) - 1 + n;
  const ultimo = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  const dia = Math.min(Number(fecha.slice(8, 10)), ultimo);
  return deUtc(Date.UTC(anio, mes, dia));
}

/**
 * La grilla del mes: de lunes a domingo, **semanas enteras**. Arranca en el
 * lunes de la semana del día 1 y termina en el domingo de la del último día,
 * así que tiene cuatro, cinco o seis filas según el mes.
 */
export function grillaDelMes(fecha: string): { desde: string; hasta: string } {
  const primero = `${fecha.slice(0, 7)}-01`;
  const ultimo = sumarDias(sumarMeses(primero, 1), -1);
  return { desde: lunesDe(primero), hasta: sumarDias(lunesDe(ultimo), 6) };
}

/**
 * Qué fechas muestra una vista anclada en `fecha`.
 *
 * ⚠️ **Se pide siempre la grilla del mes**, también en día y semana. Moverse
 * entre semanas del mismo mes no vuelve a pedir nada, y la semana que cruza el
 * cambio de mes queda entera adentro porque la grilla va de lunes a domingo.
 */
export function rangoDeVista(vista: VistaDeCalendario, fecha: string): { desde: string; hasta: string } {
  if (vista === "dia") return { desde: fecha, hasta: fecha };
  if (vista === "semana") return { desde: lunesDe(fecha), hasta: sumarDias(lunesDe(fecha), 6) };
  return grillaDelMes(fecha);
}

/** A dónde lleva «anterior» / «siguiente» en cada vista. */
export function desplazarVista(vista: VistaDeCalendario, fecha: string, sentido: 1 | -1): string {
  if (vista === "dia") return sumarDias(fecha, sentido);
  if (vista === "semana") return sumarDias(fecha, 7 * sentido);
  return sumarMeses(`${fecha.slice(0, 7)}-01`, sentido);
}

/**
 * Las fechas en que cae un bloque semanal dentro del rango.
 *
 * Un `dia` fuera de `0`–`6` no cae nunca: se omite, igual que en `UX02` y en el
 * índice de materias, en vez de dibujarse como un día cualquiera.
 */
export function fechasDelBloque(dia: number, desde: string, hasta: string): string[] {
  if (!Number.isInteger(dia) || dia < 0 || dia > 6) return [];
  return fechasEntre(desde, hasta).filter((f) => diaDeLaSemana(f) === dia);
}

/** `"14:00:00"` → minutos desde medianoche. `null` si no se puede leer. */
export function minutosDelDia(hhmm: string | null): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/** Cuántos días acepta un pedido: la grilla más larga, seis semanas. Evita que una URL pida un año. */
export const MAXIMO_DE_DIAS_POR_PEDIDO = 42;

/** `true` si el texto es una fecha `YYYY-MM-DD` real (no un 31 de febrero). */
export function esFechaDeCalendario(texto: string | null): texto is string {
  if (!texto || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  return deUtc(aUtc(texto)) === texto;
}
