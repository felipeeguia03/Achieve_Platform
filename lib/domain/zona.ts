/**
 * Aritmética de zona horaria — el poco de tiempo que el dominio necesita saber.
 *
 * Existe porque **había una sola copia y hacían falta dos**: `renegociacion.ts`
 * traía su `desplazamiento()` privado y `superposicion.ts` necesitaba lo mismo.
 * Copiarlo habría sido dos verdades sobre husos horarios, que es la clase de
 * duplicación que no se nota hasta el primer cambio de horario de verano.
 *
 * ## Por qué no se escribe un offset a mano
 *
 * Un `-03:00` hardcodeado se rompe en la primera institución con horario de
 * verano, y se rompe **en silencio**: da un resultado plausible una hora
 * corrido. Todo lo de acá le pregunta el offset real a `Intl` para el instante
 * concreto, que es lo único que sabe si ese día la zona estaba adelantada.
 */

/** Cuánto adelanta la zona respecto de UTC en ese instante, en milisegundos. */
export function desplazamiento(instante: number, zona: string): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: zona,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(instante));
  const v = (tipo: string) => Number(p.find((x) => x.type === tipo)?.value);
  const hora = v("hour") === 24 ? 0 : v("hour");
  return Date.UTC(v("year"), v("month") - 1, v("day"), hora, v("minute"), v("second")) - instante;
}

/** `YYYY-MM-DD` en la zona pedida: **el día calendario**, no el instante. */
export function fechaEnZona(instante: number, zona: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: zona,
  }).format(new Date(instante));
}

/**
 * `0`–`6`, domingo a sábado, de un `YYYY-MM-DD`.
 *
 * **La misma escala que `availability.day_of_week` y `class_schedule_block`**
 * ([ADR-063](../../docs/decisions.md#adr-063)). Se calcula en UTC a propósito:
 * la fecha ya viene resuelta en su zona, y volver a aplicarle un huso la
 * correría un día.
 */
export function diaDeSemana(fecha: string): number {
  return new Date(`${fecha}T00:00:00Z`).getUTCDay();
}

/**
 * El instante en que, en esa zona, ese día empieza esa hora de pared.
 *
 * `hhmm` acepta `HH:MM` y `HH:MM:SS` — Postgres entrega `TIME` con segundos.
 *
 * **Dos pasadas, y la segunda no es paranoia.** El offset se le pregunta a la
 * zona *para un instante*, pero el instante es justo lo que se está buscando:
 * con la estimación de la primera pasada alcanza salvo cuando el resultado cae
 * del otro lado de un cambio de hora, y ahí la segunda lo corrige.
 */
export function instanteEnZona(fecha: string, hhmm: string, zona: string): number {
  const [h, m] = hhmm.split(":");
  const pared = Date.UTC(
    Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7)) - 1, Number(fecha.slice(8, 10)),
    Number(h), Number(m),
  );
  const primera = pared - desplazamiento(pared, zona);
  return pared - desplazamiento(primera, zona);
}
