"use client";

/**
 * De dónde saca sus parámetros una superficie — [ADR-088](../../docs/decisions.md#adr-088),
 * Enmienda 6.
 *
 * ## El problema que resuelve
 *
 * Hasta acá, cada pantalla leía `?cursada=` y `?escenario=` con
 * `useSearchParams()`, o sea **de la barra de direcciones**. Eso alcanzaba
 * mientras una superficie fuera siempre *la* pantalla; con la Enmienda 6 la
 * misma superficie se dibuja **adentro de una ventana**, y ahí la barra de
 * direcciones dice otra cosa: estás en `/hoy?abierto=materia:abc` y la ventana
 * tiene que mostrar `materia?cursada=abc`.
 *
 * Sin esto, dos ventanas de dos materias distintas mostrarían **la misma**: las
 * dos leerían el mismo `?cursada=` de la URL del navegador —o ninguno, y el
 * backend elegiría—. Se ve enseguida y es difícil de diagnosticar, porque cada
 * ventana está bien por separado.
 *
 * ## Cómo se usa
 *
 * La pantalla no pasa nada y lee la URL, como siempre. La ventana pasa **la
 * consulta de la ruta de su objeto**, que es la que la abrió.
 *
 * ⚠️ **`useSearchParams()` se llama igual en los dos casos**, aunque no se use:
 * es un hook, y llamarlo condicionalmente rompe React. El costo es nulo y la
 * alternativa —dos componentes, uno por origen— sería la segunda versión de
 * cada pantalla que este archivo existe para evitar.
 */

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Lo que toda superficie acepta para poder vivir adentro de una ventana.
 *
 * `consulta` ausente ⇒ **la de la barra de direcciones**, que es el caso de la
 * pantalla y el que no cambió.
 */
export interface PropsDeSuperficie {
  consulta?: URLSearchParams;
}

/** La consulta propia si la hay, y si no la del navegador. */
export function useConsulta(propia?: URLSearchParams): URLSearchParams {
  const deLaUrl = useSearchParams();
  return propia ?? deLaUrl;
}

/**
 * La consulta que le corresponde a la ventana de un objeto.
 *
 * ⚠️ **Se memoiza por el texto de la ruta y no por el objeto.** `new
 * URLSearchParams` en cada render devolvería un valor distinto cada vez, y toda
 * pantalla que tenga la consulta entre las dependencias de un efecto —pedir
 * datos, por ejemplo— volvería a pedirlos sesenta veces por segundo mientras se
 * arrastra la ventana.
 */
export function useConsultaDeRuta(ruta: string): URLSearchParams {
  return useMemo(() => new URLSearchParams(ruta.split("?")[1] ?? ""), [ruta]);
}
