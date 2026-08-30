/**
 * El breadcrumb de cada superficie.
 *
 * Se deriva del grafo y del menú: la miga anterior es el nodo desde el que se
 * llega, y el último elemento es la superficie actual, sin enlace.
 *
 * **No se inventa jerarquía.** Si una superficie no cuelga de ninguna otra —
 * `UX01` es la raíz—, su breadcrumb es de un solo elemento.
 */

import { nodos, type NodoId } from "./surfaces";

export interface Miga {
  etiqueta: string;
  href: string | null;
}

/** De quién cuelga cada superficie en el breadcrumb. `null` ⇒ es raíz. */
const padre: Partial<Record<NodoId, NodoId>> = {
  UX02: "UX01",
  UX03: "UX01",
  UX04: "UX03",
  UX05: "UX04",
  UX06: "UX01",
  UX07: "UX02",
  UX08: "UX07",
  UX09: "UX08",
};

const ETIQUETAS: Partial<Record<NodoId, string>> = {
  UX01: "Hoy",
  UX02: "Materia",
  UX03: "Próxima acción",
  UX04: "Compromiso",
  UX05: "Evidencia",
  UX06: "Progreso",
  UX07: "Modo Examen",
  UX08: "Preparación",
  UX09: "Paso",
};

export function migasDe(nodo: NodoId): Miga[] {
  const cadena: NodoId[] = [];
  let actual: NodoId | undefined = nodo;
  // Se sube por la cadena de padres. El `while` termina porque `padre` es un
  // árbol declarado a mano, sin ciclos, y hay un test que lo verifica.
  while (actual !== undefined) {
    cadena.unshift(actual);
    actual = padre[actual];
  }
  return cadena.map((id, i) => ({
    etiqueta: ETIQUETAS[id] ?? id,
    href: i === cadena.length - 1 ? null : nodos[id].ruta,
  }));
}

export { padre as padreDeMiga };
