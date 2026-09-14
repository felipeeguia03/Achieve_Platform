/**
 * Si la barra lateral está recogida — [ADR-101](../../docs/decisions.md#adr-101).
 *
 * ⚠️ **Vive fuera del `Shell`, y es el arreglo.** Cada ruta de `app/(student)`
 * monta su propio `<Shell>`, así que un `useState` adentro nacía de nuevo en
 * cada navegación: recogías la barra, abrías otra pantalla y se volvía a abrir.
 *
 * ## Por qué `localStorage`
 *
 * Es la misma clase de preferencia que el tema (ADR-097): **de este
 * navegador**, no del estudiante. No viaja al backend.
 */

import { useSyncExternalStore } from "react";

/** La clave en `localStorage`. */
export const CLAVE_DE_BARRA = "achieve.barra-lateral";

const suscriptores = new Set<() => void>();

/*
  El respaldo cuando `localStorage` tira —ventana privada—: vale mientras dure
  la pestaña, que es lo que hace falta para que navegar no la reabra.
*/
let enMemoria = false;

/** `true` ⇒ recogida. Sin elección guardada, expandida. */
export function barraRecogida(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_DE_BARRA) === "recogida";
  } catch {
    return enMemoria;
  }
}

export function recogerBarra(recogida: boolean): void {
  enMemoria = recogida;
  try {
    if (recogida) window.localStorage.setItem(CLAVE_DE_BARRA, "recogida");
    else window.localStorage.removeItem(CLAVE_DE_BARRA);
  } catch {
    // Queda `enMemoria`.
  }
  suscriptores.forEach((f) => f());
}

function suscribir(f: () => void): () => void {
  suscriptores.add(f);
  // Otra pestaña que la recoge también la recoge acá.
  const alGuardar = (e: StorageEvent) => {
    if (e.key === CLAVE_DE_BARRA) f();
  };
  window.addEventListener("storage", alGuardar);
  return () => {
    suscriptores.delete(f);
    window.removeEventListener("storage", alGuardar);
  };
}

/**
 * ⚠️ **`useSyncExternalStore` y no `useState` + `useEffect`.** Al hidratar usa
 * el valor del servidor —expandida— y corrige después; pero al **navegar** el
 * `Shell` nuevo monta leyendo el valor del cliente de una: la barra no se
 * asoma abierta un frame entre pantalla y pantalla.
 */
export function useBarraRecogida(): [boolean, () => void] {
  const recogida = useSyncExternalStore(suscribir, barraRecogida, () => false);
  return [recogida, () => recogerBarra(!barraRecogida())];
}
