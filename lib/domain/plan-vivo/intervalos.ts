import type { Intervalo } from "./tipos";

/**
 * Aritmética de intervalos semiabiertos. **Pura y sin zona**: los instantes ya
 * llegan absolutos. Portada del laboratorio V3 (`_lab/motor.ts`), sin sus
 * globales.
 */

export const MINUTO = 60_000;

export const seSuperponen = (a: Intervalo, b: Intervalo): boolean => a.ini < b.fin && b.ini < a.fin;

export const duracion = (xs: readonly Intervalo[]): number => xs.reduce((s, x) => s + (x.fin - x.ini), 0);

/** Ordena y funde. No muta la entrada. */
export function unir(xs: readonly Intervalo[]): Intervalo[] {
  const orden = xs
    .filter((x) => x.fin > x.ini)
    .map((x) => ({ ini: x.ini, fin: x.fin }))
    .sort((a, b) => a.ini - b.ini);
  const out: Intervalo[] = [];
  for (const x of orden) {
    const u = out[out.length - 1];
    if (u && x.ini <= u.fin) u.fin = Math.max(u.fin, x.fin);
    else out.push(x);
  }
  return out;
}

export function intersectar(a: readonly Intervalo[], b: readonly Intervalo[]): Intervalo[] {
  const out: Intervalo[] = [];
  const ua = unir(a);
  const ub = unir(b);
  for (const x of ua)
    for (const y of ub) {
      const ini = Math.max(x.ini, y.ini);
      const fin = Math.min(x.fin, y.fin);
      if (fin > ini) out.push({ ini, fin });
    }
  return unir(out);
}

export function restar(base: readonly Intervalo[], quitar: readonly Intervalo[]): Intervalo[] {
  let resto = unir(base);
  for (const q of unir(quitar)) {
    const siguiente: Intervalo[] = [];
    for (const r of resto) {
      if (!seSuperponen(r, q)) {
        siguiente.push(r);
        continue;
      }
      if (q.ini > r.ini) siguiente.push({ ini: r.ini, fin: q.ini });
      if (q.fin < r.fin) siguiente.push({ ini: q.fin, fin: r.fin });
    }
    resto = siguiente;
  }
  return resto;
}

/** `true` ⇒ `x` cae entero dentro de alguno de `xs`. */
export function contenido(x: Intervalo, xs: readonly Intervalo[]): boolean {
  return unir(xs).some((y) => y.ini <= x.ini && x.fin <= y.fin);
}

/**
 * El primer inicio, desde `desde`, donde entra **entero** un bloque de
 * `minutos` y termina a más tardar en `hasta`. Alinea a múltiplos de 15 min:
 * nadie empieza a estudiar a las 18:07.
 *
 * ⚠️ **Fragmentación:** dos huecos de 30 min no alojan un bloque de 60. No se
 * parte el trabajo.
 */
export function primerHueco(
  huecos: readonly Intervalo[],
  desde: number,
  minutos: number,
  hasta = Number.POSITIVE_INFINITY,
): number | null {
  const largo = minutos * MINUTO;
  for (const h of unir(huecos)) {
    const ini = alinear(Math.max(h.ini, desde));
    if (ini + largo <= h.fin && ini + largo <= hasta) return ini;
  }
  return null;
}

const CUARTO = 15 * MINUTO;
export const alinear = (t: number): number => Math.ceil(t / CUARTO) * CUARTO;
