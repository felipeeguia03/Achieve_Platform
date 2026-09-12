/**
 * Cómo una superficie entra a la barra de objetos — [ADR-088](../../docs/decisions.md#adr-088),
 * Enmienda 6.
 *
 * ## Qué cambia
 *
 * Hasta la Enmienda 5, **lo único que se podía abrir era una materia**: el resto
 * del producto se navegaba y nada quedaba en la barra. El owner lo pidió al
 * revés — *"que todo pueda ponerse en la barra de pestañas, no sólo las
 * materias"*—, y esto es el mapa que lo hace posible: para cada nodo del grafo
 * con ruta, **qué objeto es** cuando alguien lo abre.
 *
 * ## ⚠️ Es un mapa, no una lista nueva de destinos
 *
 * No se inventa ninguna superficie, no se agrega ninguna ruta y no se toca
 * `menu.ts`. Cada entrada apunta a un nodo que **ya existe** en `surfaces.ts` y
 * reusa su ruta; la etiqueta sale del menú cuando el menú tiene una —*"Hoy"*,
 * *"Progreso"*— y del nombre del nodo cuando no —*"Paso de Protocolo"*—. Un
 * nombre inventado acá sería una segunda forma de llamar a la misma pantalla,
 * que es `A-04` (`AGENTS.md` §4).
 *
 * ## ⚠️ `UX02` no está, y no es un olvido
 *
 * La materia **se abre con su cursada**: `materia:<cursadaId>`, que es la
 * identidad que ADR-088 §1 le dio y la que hace que dos materias sean dos
 * fichas. Un objeto `UX02` pelado sería *«la materia»* en singular, y la barra
 * volvería a tener el problema que ADR-077 cerró: el plural de una promesa
 * incumplida. Quien abre una materia es `objetoDeMateria`.
 */

import { nodos, type NodoId } from "./surfaces";
import { menu } from "./menu";
import type { ObjetoPorAbrir, TipoDeObjeto } from "@/lib/domain/espacio-de-trabajo";

/**
 * Qué **tipo de objeto** es cada superficie.
 *
 * ⚠️ **Siete de las nueve ya tenían tipo, y eso no es casualidad**: la pantalla
 * de una `Action` es una acción, la de una `Evidence` es una evidencia. Los dos
 * que hubo que agregar —`hoy` y `materias`— son las dos que no hablan de **una**
 * entidad sino de todas, y por eso su `entidadId` es el `NodoId`.
 *
 * Un nodo que no está acá **no se puede abrir como objeto**, y eso es una
 * respuesta válida: `EJECUCION` y los dos sub-nodos de `UX04` no tienen
 * pantalla, así que no hay nada que poner en una ficha.
 */
const TIPO_POR_NODO: Partial<Record<NodoId, TipoDeObjeto>> = {
  UX01: "hoy",
  UX02_INDICE: "materias",
  UX03: "accion",
  UX04: "compromiso",
  UX05: "evidencia",
  UX06: "bitacora",
  FORMACION: "formacion",
  UX07: "modo-examen",
  UX08: "modo-examen",
  UX09: "modo-examen",
};

/** Los nodos que se pueden abrir como objeto, en el orden del grafo. */
export const nodosAbribles: readonly NodoId[] = (
  Object.keys(TIPO_POR_NODO) as NodoId[]
).filter((id) => nodos[id].ruta !== null);

/**
 * Con qué nombre aparece en la ficha.
 *
 * El del menú si lo tiene —*"Modo Examen"* en vez de *"Activación de Modo
 * Examen"*, que a 160 px se corta—, y si no el del nodo. **Ninguno se escribe
 * acá**: los dos ya existen y esto sólo elige cuál.
 */
function etiquetaDe(id: NodoId): string {
  return menu.find((i) => i.nodo === id)?.etiqueta ?? nodos[id].nombre;
}

/**
 * El objeto de una superficie, listo para `abrir`.
 *
 * `null` ⇒ **ese nodo no se abre como objeto**, porque no tiene pantalla o
 * porque su identidad es otra (ver `UX02` arriba). No se inventa una ruta ni un
 * id para completar la ficha: es §2.7, *omitir, no inventar*.
 */
export function objetoDeSuperficie(id: NodoId): ObjetoPorAbrir | null {
  const tipo = TIPO_POR_NODO[id];
  const ruta = nodos[id].ruta;
  if (tipo === undefined || ruta === null) return null;

  return {
    tipo,
    // El `NodoId` **es** el id de la superficie: `bitacora:UX06` es una clave
    // estable, legible en la URL y distinta de la de cualquier fila del dominio.
    entidadId: id,
    etiqueta: etiquetaDe(id),
    /*
      ⚠️ **Sin contexto, y es la misma razón que en una materia.** El contexto de
      un objeto es *a qué pertenece* —"Unidad 2 · Economía"—; una superficie no
      pertenece a nada, y meterle su pregunta —*"¿Qué necesito hacer ahora?"*—
      empujaría la etiqueta a `Ho…` en una ficha de 160 px, que es `A-07`.
    */
    etiquetaSecundaria: null,
    ruta,
  };
}

/**
 * El objeto de una materia — el que ya existía, ahora en un solo lugar.
 *
 * ⚠️ **Estaba escrito dos veces, en `/hoy` y en `/materias`, y con el mismo
 * comentario copiado.** Dos lugares que construyen el mismo objeto son dos
 * lugares donde se escribe distinto la etiqueta el día que alguien la cambie —
 * y la etiqueta es lo que el estudiante lee en la barra. La ruta la sigue
 * poniendo quien llama, porque sale del registro canónico de CTAs y **eso no se
 * duplica acá**.
 */
export function objetoDeMateria(
  cursadaId: string,
  nombre: string,
  ruta: string,
): ObjetoPorAbrir {
  return {
    tipo: "materia",
    entidadId: cursadaId,
    etiqueta: nombre,
    /*
      ⚠️ **La evaluación NO va acá, y se probó mirándolo.** *"Parcial 1 ·
      práctico · sáb 26 sept"* como contexto empujaba el nombre de la materia a
      `ANALISI…`, que es el anti-patrón `A-07` que ADR-088 §3 se comprometió a no
      reproducir. Una materia **es** el objeto: va sola, entera y legible.
    */
    etiquetaSecundaria: null,
    ruta,
  };
}
