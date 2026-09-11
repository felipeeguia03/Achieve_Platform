"use client";

/**
 * El movimiento del escritorio — [ADR-088](../../docs/decisions.md#adr-088), Enmienda 4.
 *
 * Cuando se toca una ficha, la ventana **sale de la ficha**: crece desde ella
 * hasta su marco. Al minimizarla, vuelve a entrar. Es el efecto de escala de un
 * escritorio, y lo que hace es contestar sin texto *"¿de dónde salió esto y a
 * dónde se fue?"* — que es la pregunta que un dock deja abierta cuando las cosas
 * aparecen y desaparecen en el lugar.
 *
 * ## Los números salen de `design-system-capturas.md` §2.5
 *
 * ⚠️ **Y están escritos acá porque §2.5 nunca se tokenizó.** El documento
 * especifica `--curva` y `--duracion`; `app/globals.css` no los tiene, y ese
 * archivo **no se reescribe** (regla 6 de `CLAUDE.md`). Así que se citan con su
 * fuente en vez de inventarse — y el día que los tokens existan, esto es un
 * `var()` y nada más.
 */

import { desdeLaFicha, type Rect } from "@/lib/domain/marco-de-panel";

/** §2.5, rango observado 180–220 ms. *"Nunca `ease` de 400 ms."* */
export const DURACION = 200;

/**
 * §2.5. Es una curva **con sobrepaso**: la ventana pasa un poco de su tamaño y
 * vuelve, que es lo que la hace leer como algo que salta y no como algo que se
 * estira.
 */
export const CURVA = "cubic-bezier(.34, 1.56, .64, 1)";

/**
 * ⚠️ **`prefers-reduced-motion` apaga esto entero, y no es opcional.**
 *
 * §2.5 cierra con *"la pantalla debe funcionar entera con
 * `prefers-reduced-motion`"*. Para quien pidió menos movimiento, una ventana que
 * se dispara desde el pie de la pantalla no es una ayuda de orientación: es
 * exactamente el gesto que tiene desactivado. Sin animación la ventana aparece
 * puesta, que es el comportamiento que había antes de esta enmienda y que
 * funciona.
 *
 * Fuera del navegador devuelve `true` —sin animación—: durante el SSR no hay
 * `matchMedia`, y arrancar con movimiento para después apagarlo sería el salto
 * que `P-12` prohíbe.
 */
export function movimientoReducido(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Dónde está la ficha de un objeto, ahora.
 *
 * `null` ⇒ **no está a la vista**, y entonces no hay de dónde salir. Pasa de
 * verdad: con seis objetos abiertos, el sexto vive en el menú de desbordamiento
 * y su ficha no existe en el DOM. Ahí la ventana aparece sin animación en vez de
 * salir disparada desde una coordenada inventada.
 */
export function rectDeLaFicha(clave: string): Rect | null {
  if (typeof document === "undefined") return null;
  const nodo = document.querySelector<HTMLElement>(
    `[data-objeto="${CSS.escape(clave)}"]`,
  );
  if (!nodo) return null;
  const r = nodo.getBoundingClientRect();
  // Una ficha de tamaño cero todavía no está maquetada. Medirla daría una
  // animación que sale de un punto, no de la ficha.
  if (r.width === 0 || r.height === 0) return null;
  return { x: r.left, y: r.top, ancho: r.width, alto: r.height };
}

/** Los dos fotogramas del efecto, en el orden «desde la ficha» → «puesta». */
function fotogramas(caja: Rect, ficha: Rect): Keyframe[] {
  const d = desdeLaFicha(caja, ficha);
  return [
    {
      transform: `translate(${d.x}px, ${d.y}px) scale(${d.escalaX}, ${d.escalaY})`,
      opacity: 0,
    },
    { transform: "translate(0px, 0px) scale(1, 1)", opacity: 1 },
  ];
}

/**
 * Dónde está la ventana **de verdad**, medida del DOM.
 *
 * ⚠️ **No se usa el `Marco`, y se probó que importa.** A menos de 768 px la
 * ventana no se dibuja con el marco sino con un `inset`, así que el marco dice
 * una cosa y la caja mide otra: animar desde el marco mandaría la ventana a
 * salir de un rectángulo que no es el suyo. El DOM siempre sabe la verdad.
 */
function rectDeLaCaja(nodo: HTMLElement): Rect | null {
  const r = nodo.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  return { x: r.left, y: r.top, ancho: r.width, alto: r.height };
}

/**
 * La ventana sale de su ficha.
 *
 * Devuelve la animación, o `null` si no se animó nada — sin ficha a la vista o
 * con el movimiento reducido, que son los dos casos en que **aparecer puesta es
 * lo correcto**.
 */
export function salirDeLaFicha(nodo: HTMLElement, clave: string): Animation | null {
  if (movimientoReducido()) return null;
  const ficha = rectDeLaFicha(clave);
  const caja = rectDeLaCaja(nodo);
  if (!ficha || !caja) return null;
  /*
    `fill: "backwards"` y no `"both"`: la ventana toma el primer fotograma
    **antes** de arrancar —si no, se ve un frame a tamaño completo y recién ahí
    salta a la ficha—, pero al terminar **suelta** el `transform`. Dejándolo
    puesto, cualquier cosa `fixed` de adentro pasaría a medirse contra la ventana
    en vez de contra la pantalla.
  */
  return nodo.animate(fotogramas(caja, ficha), {
    duration: DURACION,
    easing: CURVA,
    fill: "backwards",
  });
}

/**
 * La ventana se guarda en su ficha, y **recién entonces** se minimiza.
 *
 * ⚠️ **La animación corre ANTES de tocar el estado, y ése fue el defecto.** La
 * primera versión minimizaba primero y retenía la ventana desmontada para
 * animarla: React alcanzaba a sacarla del árbol en el frame del medio y a
 * volver a montarla, así que lo que se veía era una ventana nueva
 * desvaneciéndose en el lugar — se midió en el navegador, muestreando el
 * `transform` cada 28 ms, y la escala **no se movía de 1**.
 *
 * Haciéndolo al revés no hay nada que retener: la ventana sigue montada porque
 * la URL todavía no cambió, se encoge, y al terminar se minimiza de verdad.
 *
 * Es el mismo recorrido de la apertura al revés, y **sin sobrepaso**: la curva
 * de §2.5 se pasa de largo y vuelve, que saliendo se ve como una ventana
 * rebotando contra la barra. Al irse la curva es de entrada pura, que es lo que
 * la hace leer como *guardarse*.
 *
 * ⚠️ **Y acá `fill: "forwards"` sí**: la ventana tiene que **quedarse chica**
 * hasta que la saquen del árbol. Sin eso, en el último fotograma vuelve a su
 * tamaño completo y se ve un destello justo antes de desaparecer.
 *
 * Sin ficha a la vista o con el movimiento reducido **minimiza en el acto**: no
 * hay animación que esperar, y esperar igual sería un cuarto de segundo de nada.
 */
export function guardarEnLaFicha(clave: string, alTerminar: () => void): void {
  const nodo = ventanaDe(clave);
  const ficha = rectDeLaFicha(clave);
  const caja = nodo ? rectDeLaCaja(nodo) : null;

  if (movimientoReducido() || !nodo || !ficha || !caja) {
    alTerminar();
    return;
  }

  const animacion = nodo.animate([...fotogramas(caja, ficha)].reverse(), {
    duration: DURACION,
    easing: "cubic-bezier(.4, 0, 1, 1)",
    fill: "forwards",
  });

  /*
    ⚠️ **`onfinish` y `oncancel`, las dos.** Si la animación se cancela —porque
    la ventana se desmontó por otro camino— y sólo estuviera `onfinish`, el
    minimizado **no ocurriría nunca** y la ficha quedaría marcada como desplegada
    sobre una ventana que ya no está.
  */
  let disparado = false;
  const unaVez = () => {
    if (disparado) return;
    disparado = true;
    alTerminar();
  };
  animacion.onfinish = unaVez;
  animacion.oncancel = unaVez;
}

/**
 * Dónde está la ventana de un objeto, ahora.
 *
 * ⚠️ **La barra la busca así, y por el mismo motivo que la ventana busca la
 * ficha.** Tocar una ficha desplegada la minimiza, y ese gesto nace en la barra
 * — que no tiene el nodo de la ventana ni tiene por qué tenerlo. Un `data-` en
 * cada punta es lo que hace que los dos gestos animen igual sin que ninguno de
 * los dos componentes conozca al otro.
 */
export function ventanaDe(clave: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(`[data-ventana="${CSS.escape(clave)}"]`);
}
