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
  // Un cambio de progreso sin ver cambia qué hace el estudiante: por eso lleva
  // número. El resto no lleva, porque un contador que no cambia una decisión
  // es ruido.
  { nodo: "UX06", etiqueta: "Progreso", contador: 1 },
  { nodo: "UX07", etiqueta: "Modo Examen", contador: null },
] as const;

/** Todo ítem apunta a un nodo con ruta: un menú no lleva a un lugar que no existe. */
export function rutaDelItem(item: ItemDeMenu): string {
  const ruta = nodos[item.nodo].ruta;
  if (ruta === null) throw new Error(`El menú apunta a ${item.nodo}, que no tiene ruta`);
  return ruta;
}
