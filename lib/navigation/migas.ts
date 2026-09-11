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
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";

export interface Miga {
  etiqueta: string;
  href: string | null;
}

/** De quién cuelga cada superficie en el breadcrumb. `null` ⇒ es raíz. */
const padre: Partial<Record<NodoId, NodoId>> = {
  // ADR-077: el cursado cuelga del índice, no de `HOY`. Es el recorrido que
  // pidió el owner —*"primero una pantalla con todas las materias y luego podés
  // entrar a cada una"*— y la miga lo dice: `Hoy › Materias › Materia`.
  UX02_INDICE: "UX01",
  FORMACION: "UX01",
  UX02: "UX02_INDICE",
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
  UX02_INDICE: "Materias",
  FORMACION: "Formación",
  UX02: "Materia",
  UX03: "Próxima acción",
  UX04: "Compromiso",
  UX05: "Evidencia",
  UX06: "Progreso",
  UX07: "Modo Examen",
  UX08: "Preparación",
  UX09: "Paso",
};

/**
 * @param etiquetaFinal Con qué nombrar la **última** miga. Sirve para que una
 *   superficie que abre *un* objeto lo diga: `Hoy › Materias › Emprendedorismo`
 *   en vez de `… › Materia`.
 *
 *   ⚠️ **Sólo reemplaza la última.** Las anteriores son nodos del grafo y su
 *   etiqueta es del nodo, no de lo que uno esté mirando: cambiarlas rompería el
 *   camino de vuelta.
 *
 *   ⚠️ **Vacío o ausente no borra la etiqueta**, la deja como estaba. Una miga
 *   sin texto no sería una miga: sería un hueco donde el usuario perdería dónde
 *   está mientras la pantalla carga.
 */
export function migasDe(nodo: NodoId, etiquetaFinal?: string | null): Miga[] {
  const cadena: NodoId[] = [];
  let actual: NodoId | undefined = nodo;
  // Se sube por la cadena de padres. El `while` termina porque `padre` es un
  // árbol declarado a mano, sin ciclos, y hay un test que lo verifica.
  while (actual !== undefined) {
    cadena.unshift(actual);
    actual = padre[actual];
  }
  /*
    ⚠️ **La última miga se escribe con mayúscula sólo en la primera letra.**

    Los nombres del Plan 2016 llegan en mayúsculas de la fuente oficial, y
    *Hoy › Materias › ARQUITECTURA COMPUTADORAS* desequilibra la línea entera: el
    último tramo pesa más que los dos anteriores juntos, cuando es justamente el
    que **no** lleva a ningún lado. Es presentación, no renombre — el dato de la
    base no se toca (ver `nombreDeObjeto`).
  */
  const propio = nombreDeObjeto((etiquetaFinal ?? "").trim());
  return cadena.map((id, i) => {
    const ultima = i === cadena.length - 1;
    return {
      etiqueta: ultima && propio ? propio : (ETIQUETAS[id] ?? id),
      href: ultima ? null : nodos[id].ruta,
    };
  });
}

export { padre as padreDeMiga };
