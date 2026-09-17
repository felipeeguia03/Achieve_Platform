/**
 * El tema claro u oscuro — [ADR-097](../../docs/decisions.md#adr-097).
 *
 * ## Tres estados, no dos
 *
 * - **Sin elección guardada** ⇒ sigue al sistema. Es el arranque por defecto, y
 *   si la computadora pasa a oscuro a la tarde, Achieve pasa con ella.
 * - **`claro`** u **`oscuro`** guardado ⇒ el estudiante eligió con el botón, y
 *   esa elección gana sobre el sistema en este navegador.
 *
 * ⚠️ **No hay forma de «volver a seguir al sistema» desde la pantalla**, y es a
 * propósito: el botón alterna entre dos cosas que se ven. Un tercer estado
 * invisible —«automático»— sería un botón que a veces no cambia nada.
 *
 * ## Por qué `localStorage` y no la base
 *
 * Es una preferencia **de este navegador**, como el tamaño de la letra: la
 * computadora de la facultad y el teléfono pueden querer cosas distintas. No es
 * un dato del estudiante y no viaja al backend.
 */

export type Tema = "claro" | "oscuro";

/** La clave en `localStorage`. La lee también el script de `app/layout.tsx`. */
export const CLAVE_DE_TEMA = "achieve.tema";

/** El atributo que activa el bloque oscuro de `globals.css`. */
export const ATRIBUTO_DE_TEMA = "data-tema";

/** La elección guardada. `null` ⇒ no eligió, o el navegador no deja leer. */
export function temaGuardado(): Tema | null {
  try {
    const valor = window.localStorage.getItem(CLAVE_DE_TEMA);
    return valor === "claro" || valor === "oscuro" ? valor : null;
  } catch {
    return null;
  }
}

/** El tema del sistema operativo. */
export function temaDelSistema(): Tema {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "oscuro"
    : "claro";
}

/** El que corresponde ahora: la elección si hay, y si no el del sistema. */
export function temaVigente(): Tema {
  return temaGuardado() ?? temaDelSistema();
}

/** Lo pinta en `<html>`. Claro es la ausencia del atributo: el `:root` de siempre. */
export function aplicarTema(tema: Tema): void {
  const raiz = document.documentElement;
  if (tema === "oscuro") raiz.setAttribute(ATRIBUTO_DE_TEMA, "oscuro");
  else raiz.removeAttribute(ATRIBUTO_DE_TEMA);
}

/** Elegir con el botón: se aplica y se recuerda. */
export function elegirTema(tema: Tema): void {
  aplicarTema(tema);
  try {
    window.localStorage.setItem(CLAVE_DE_TEMA, tema);
  } catch {
    // Sin almacenamiento —ventana privada— el cambio vale para esta visita.
  }
}

/**
 * El script que corre **antes de pintar**, en el `<head>`.
 *
 * ⚠️ **Es un string y no una función importada, a propósito.** Tiene que
 * ejecutarse antes de que React hidrate: si esperara al bundle, la página se
 * vería clara un instante y después saltaría a oscura, que es `P-12` en su forma
 * más molesta. Repite la lógica de `temaVigente` porque no puede importarla.
 */
export const SCRIPT_DE_TEMA = `(function(){try{var v=localStorage.getItem(${JSON.stringify(
  CLAVE_DE_TEMA,
)});var o=v==="oscuro"||(v!=="claro"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(o)document.documentElement.setAttribute(${JSON.stringify(
  ATRIBUTO_DE_TEMA,
)},"oscuro");}catch(e){}})();`;
