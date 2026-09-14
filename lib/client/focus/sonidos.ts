/**
 * Los sonidos de Modo Focus, **calculados** — [ADR-104](../../../docs/decisions.md#adr-104) §19
 * y su Enmienda 1.
 *
 * ## No hay grabaciones
 *
 * Cada sonido es aritmética sobre números al azar: ruido filtrado, gotas,
 * envolventes lentas. **No sale de ningún archivo ni de ninguna biblioteca de
 * sonidos**, así que no hay autor, licencia ni atribución que respetar. Tampoco
 * imita una grabación en particular: se parece a la lluvia como se parece un
 * ruido filtrado, no como una toma de campo.
 *
 * ## Un loop que no se nota
 *
 * Se calculan **24 segundos** que el navegador repite. Toda modulación lenta
 * tiene un período que divide 24 (8 s, 12 s, 24 s), así que la costura cae en la
 * misma fase y el oído no la encuentra.
 *
 * **Puro:** sin Web Audio. Recibe la frecuencia de muestreo y un generador al
 * azar, y devuelve muestras en `[-1, 1]`. Por eso se puede probar sin navegador.
 */

import type { Sonido } from "@/lib/domain/sesion-de-focus";

export const DURACION_DEL_LOOP = 24;

export type Aleatorio = () => number;

/** Coeficiente de un filtro de un polo para una frecuencia de corte. */
const polo = (fc: number, sr: number) => 1 - Math.exp((-2 * Math.PI * fc) / sr);

/** Lleva el pico a `techo` sin cambiar la forma. Un buffer mudo queda mudo. */
function normalizar(datos: Float32Array, techo = 0.9): Float32Array {
  let pico = 0;
  for (const v of datos) pico = Math.max(pico, Math.abs(v));
  if (pico === 0) return datos;
  const k = techo / pico;
  for (let i = 0; i < datos.length; i++) datos[i]! *= k;
  return datos;
}

/** Una envolvente de 0 a 1 con período `p` segundos, suave arriba y abajo. */
const onda = (t: number, p: number, fase = 0) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p + fase);

function marron(sr: number, rnd: Aleatorio): Float32Array {
  const n = sr * DURACION_DEL_LOOP;
  const d = new Float32Array(n);
  let ultimo = 0;
  for (let i = 0; i < n; i++) {
    ultimo = (ultimo + 0.02 * (rnd() * 2 - 1)) / 1.02;
    d[i] = ultimo;
  }
  return normalizar(d);
}

function rosa(sr: number, rnd: Aleatorio): Float32Array {
  // Filtro de Paul Kellet: ruido rosa a partir de blanco.
  const n = sr * DURACION_DEL_LOOP;
  const d = new Float32Array(n);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) {
    const w = rnd() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    d[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
    b6 = w * 0.115926;
  }
  return normalizar(d);
}

/**
 * **Lluvia**: un siseo parejo de agua (ruido sin graves) y encima gotas —
 * ráfagas de ruido de pocos milisegundos que se apagan solas— a razón de unas
 * treinta por segundo, con intensidad al azar. Debajo, un rumor grave apenas.
 */
function lluvia(sr: number, rnd: Aleatorio): Float32Array {
  const n = sr * DURACION_DEL_LOOP;
  const d = new Float32Array(n);
  const aPasaAltos = polo(500, sr);
  const aGrave = polo(120, sr);
  let bajo = 0;
  let grave = 0;
  const gotasPorMuestra = 30 / sr;
  let gota = 0; // amplitud de la gota que suena
  let decaimiento = 0;
  for (let i = 0; i < n; i++) {
    const w = rnd() * 2 - 1;
    bajo += aPasaAltos * (w - bajo);
    const siseo = w - bajo; // lo que queda arriba de 500 Hz
    grave += aGrave * (rnd() * 2 - 1 - grave);
    if (rnd() < gotasPorMuestra) {
      gota = 0.15 + 0.85 * rnd() ** 2; // muchas chicas, pocas grandes
      decaimiento = Math.exp(-1 / (sr * (0.002 + 0.006 * rnd())));
    }
    const golpe = gota * (rnd() * 2 - 1);
    gota *= decaimiento;
    d[i] = 0.18 * siseo + 1.0 * golpe + 0.8 * grave;
  }
  return normalizar(d);
}

/**
 * **Mar**: ruido grave que sube y baja como una ola. Dos ondulaciones de 8 y
 * 12 segundos se superponen para que no suene a metrónomo, y en la cresta se
 * abre el agudo, que es la espuma.
 */
function mar(sr: number, rnd: Aleatorio): Float32Array {
  const n = sr * DURACION_DEL_LOOP;
  const d = new Float32Array(n);
  let marron = 0;
  let espuma = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const w = rnd() * 2 - 1;
    marron = (marron + 0.02 * w) / 1.02;
    const ola = 0.6 * onda(t, 8) ** 2 + 0.4 * onda(t, 12, 1.3) ** 3;
    // El filtro de la espuma se abre con la ola: más ola, más agudo.
    espuma += polo(300 + 2500 * ola, sr) * (w - espuma);
    d[i] = (0.25 + 0.75 * ola) * (3.2 * marron + 0.35 * ola * espuma);
  }
  return normalizar(d);
}

/**
 * **Viento**: ruido que pasa por un filtro cuya frecuencia se desplaza despacio
 * —ese silbido que sube y baja— con ráfagas de 8 y 12 segundos que cambian la
 * intensidad.
 */
function viento(sr: number, rnd: Aleatorio): Float32Array {
  const n = sr * DURACION_DEL_LOOP;
  const d = new Float32Array(n);
  let bajo = 0;
  let banda = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const w = rnd() * 2 - 1;
    const rafaga = 0.5 * onda(t, 12) + 0.3 * onda(t, 8, 2.1) + 0.2 * onda(t, 24, 0.7);
    const corte = 180 + 900 * rafaga;
    // Dos polos: un pasa bajos a `corte` menos uno más grave dan una banda.
    banda += polo(corte, sr) * (w - banda);
    bajo += polo(corte / 4, sr) * (banda - bajo);
    d[i] = (0.2 + 0.8 * rafaga) * (banda - 0.7 * bajo);
  }
  return normalizar(d);
}

/**
 * **Chimenea**: un rumor grave y parejo, la llama, y encima chasquidos —clics de
 * uno a tres milisegundos— unas diez veces por segundo, con algún estallido más
 * fuerte de vez en cuando.
 */
function chimenea(sr: number, rnd: Aleatorio): Float32Array {
  const n = sr * DURACION_DEL_LOOP;
  const d = new Float32Array(n);
  let rumor = 0;
  let rumorSuave = 0;
  const aRumor = polo(90, sr);
  let chasquido = 0;
  let decaimiento = 0;
  const chasquidosPorMuestra = 10 / sr;
  for (let i = 0; i < n; i++) {
    const w = rnd() * 2 - 1;
    rumor = (rumor + 0.02 * w) / 1.02;
    rumorSuave += aRumor * (rumor - rumorSuave);
    if (rnd() < chasquidosPorMuestra) {
      chasquido = rnd() < 0.08 ? 0.9 + 0.1 * rnd() : 0.2 + 0.5 * rnd();
      decaimiento = Math.exp(-1 / (sr * (0.001 + 0.002 * rnd())));
    }
    const clic = chasquido * (rnd() * 2 - 1);
    chasquido *= decaimiento;
    d[i] = 2.5 * rumorSuave + 1.6 * clic;
  }
  return normalizar(d);
}

const GENERADORES: Readonly<Record<Exclude<Sonido, "NINGUNO">, (sr: number, rnd: Aleatorio) => Float32Array>> = {
  MARRON: marron,
  ROSA: rosa,
  LLUVIA: lluvia,
  MAR: mar,
  VIENTO: viento,
  CHIMENEA: chimenea,
};

/** Las muestras de un sonido. `NINGUNO` no tiene. */
export function muestrasDe(sonido: Sonido, sr: number, rnd: Aleatorio = Math.random): Float32Array | null {
  return sonido === "NINGUNO" ? null : GENERADORES[sonido](sr, rnd);
}
