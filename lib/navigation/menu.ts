/**
 * El menú de la navegación lateral.
 *
 * Deriva del grafo: cada ítem apunta a un nodo que **ya existe** en
 * `surfaces.ts`. No se inventan destinos ni se agregan superficies por el
 * hecho de necesitar una entrada de menú.
 *
 * **La navegación lateral no es una CTA.** No solicita una acción de dominio,
 * no muta nada y no compite con la acción primaria de la pantalla: es
 * orientación. Por eso vive acá y no en `cta-registry.ts`.
 */

import { nodos, type NodoId } from "./surfaces";

export interface ItemDeMenu {
  nodo: NodoId;
  /** El nombre corto que se ve en la barra. */
  etiqueta: string;
  /**
   * Contador a la derecha del ítem. `null` ⇒ no se muestra nada.
   *
   * Sólo lleva número lo que **cambia una decisión**. Un contador que no cambia
   * qué hace el estudiante es ruido.
   */
  contador: number | null;
}

/**
 * El orden es el del loop diario, no alfabético ni por frecuencia: primero
 * dónde estoy hoy, después el contexto de la materia, después el historial.
 *
 * `UX03`–`UX05` **no están** en el menú: son pasos de un flujo que se abren
 * desde su origen, no destinos que uno elige. Ponerlos sería ofrecer entrar a
 * una evidencia sin la acción que la pide.
 */
export const menu: readonly ItemDeMenu[] = [
  { nodo: "UX01", etiqueta: "Hoy", contador: null },
  { nodo: "UX02", etiqueta: "Materias", contador: null },
  { nodo: "UX06", etiqueta: "Progreso", contador: null },
  { nodo: "UX07", etiqueta: "Modo Examen", contador: null },
] as const;

/**
 * **Hoy ningún ítem lleva contador, y es una decisión** — `D-06` de
 * `design-system-capturas.md` §14.2, cerrada por
 * [ADR-021](../../docs/decisions.md#adr-021).
 *
 * La regla de la captura 02 es precisa: *"un solo badge numérico en todo el
 * menú: **el del trabajo pendiente que caduca**. Si todo tiene badge, nada
 * tiene badge."*
 *
 * **En Achieve, lo que caduca es el `Commitment`.** Es el único objeto que el
 * estudiante acordó hacer *para un momento*, y al pasar ese momento cambia a
 * `MISSED` de forma irreversible —nunca se edita para parecer cumplido—. Nada
 * más caduca: una `Action` se reemplaza, una `Evidence` `SUBMITTED` espera a
 * otra persona, y la Bitácora sólo acumula.
 *
 * Así que el badge **no va en Progreso**, donde estaba: iba en la única
 * superficie que no tiene nada que vencer.
 *
 * **Y todavía no va en ninguna.** El número que había en Progreso era un
 * literal `1`, no un dato: una cifra en pantalla sin un hecho detrás. Bajo el
 * Track A cada ruta proyecta su propio escenario y sólo `/hoy` conoce el
 * estado del `Commitment`, así que un badge real aparecería en `Hoy` y
 * desaparecería en las otras tres — que es peor que no tenerlo, porque el
 * estudiante leería su ausencia como *"no hay nada por vencer"*.
 *
 * **Vuelve cuando haya de dónde contarlo**, con el `Commitment` como fuente y
 * en `Hoy`. El componente ya sabe dibujarlo, y `tests/shell.test.tsx` verifica
 * el anti-patrón `A-03` sobre un ítem sintético para no depender de que el
 * menú de producción tenga un número.
 */

/** Todo ítem apunta a un nodo con ruta: un menú no lleva a un lugar que no existe. */
export function rutaDelItem(item: ItemDeMenu): string {
  const ruta = nodos[item.nodo].ruta;
  if (ruta === null) throw new Error(`El menú apunta a ${item.nodo}, que no tiene ruta`);
  return ruta;
}
