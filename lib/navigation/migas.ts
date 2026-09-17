/**
 * El breadcrumb de cada superficie.
 *
 * Se deriva del grafo y del menú: la miga anterior es el nodo desde el que se
 * llega, y el último elemento es la superficie actual, sin enlace.
 *
 * **No se inventa jerarquía.** Si una superficie no cuelga de ninguna otra, su
 * breadcrumb es de un solo elemento.
 *
 * ## Cada sección del menú es una raíz — ADR-088, Enmienda 7
 *
 * ⚠️ **Nada cuelga de `Hoy` por ser `Hoy`.** Hasta la Enmienda 6 todas las
 * cadenas empezaban ahí —*Hoy › Materias › Análisis*, *Hoy › Formación*— y el
 * owner lo pidió al revés: *"no todos salen de hoy, sino que salen de esas
 * pantallas"*. Las cinco secciones de la barra lateral son **lugares a los que
 * se va**, no pasos de un recorrido que arranca en `Hoy`; la miga lo dice.
 *
 * El flujo de ejecución —acción, compromiso, evidencia— tampoco cuelga de `Hoy`:
 * lo decidió el owner, y la cadena empieza en la acción.
 */

import { nodos, type NodoId } from "./surfaces";
import { menu } from "./menu";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";

export interface Miga {
  etiqueta: string;
  href: string | null;
}

/** De quién cuelga cada superficie en el breadcrumb. Ausente ⇒ es raíz. */
const padre: Partial<Record<NodoId, NodoId>> = {
  // ADR-077: el cursado cuelga del índice. Es el recorrido que pidió el owner
  // —*"primero una pantalla con todas las materias y luego podés entrar a cada
  // una"*— y la miga lo dice: `Materias › Análisis`.
  UX02: "UX02_INDICE",
  UX04: "UX03",
  UX05: "UX04",
  /*
    ⚠️ **`UX07` ya no cuelga de `UX02`, aunque se llegue desde una materia.**
    Llegar a Modo Examen desde la materia es `CTA-019`; llegar desde la barra
    lateral es ir a la sección. La miga no puede saber por cuál entraste —no hay
    un historial que consultar, y no se inventa uno—, así que **la sección
    gana**: lo que está en el menú es raíz.
  */
  UX08: "UX07",
  UX09: "UX08",
  // ADR-099 §9: la clase cuelga **de su materia** — *Materias › Arquitectura de
  // computadoras I › Clase práctica jueves 18/05*. Qué materia, y a qué URL
  // vuelve, lo dice la pantalla con `intermedia`.
  CLASE: "UX02",
};

/** Las secciones de la barra lateral. **Ninguna tiene padre**, y hay test. */
const RAICES = new Set<NodoId>(menu.map((i) => i.nodo));

const ETIQUETAS: Partial<Record<NodoId, string>> = {
  UX01: "Hoy",
  UX02_INDICE: "Materias",
  FORMACION: "Formación",
  CALENDARIO: "Calendario",
  PLAN_VIVO: "Mi plan",
  GIMNASIA: "Gimnasia",
  RECORRIDO: "Recorrido",
  CLASE: "Clase",
  FOCUS: "Focus",
  UX02: "Materia",
  UX03: "Próxima acción",
  UX04: "Compromiso",
  UX05: "Evidencia",
  UX06: "Progreso",
  UX07: "Modo Examen",
  UX08: "Preparación",
  UX09: "Paso",
};

/** Con qué nombre aparece un nodo en la miga. */
export function etiquetaDeMiga(id: NodoId): string {
  return ETIQUETAS[id] ?? id;
}

/** La cadena desde la raíz hasta el nodo, inclusive. */
export function cadenaDe(nodo: NodoId): NodoId[] {
  const cadena: NodoId[] = [];
  let actual: NodoId | undefined = nodo;
  // Se sube por la cadena de padres. El `while` termina porque `padre` es un
  // árbol declarado a mano, sin ciclos, y hay un test que lo verifica.
  while (actual !== undefined) {
    cadena.unshift(actual);
    actual = padre[actual];
  }
  return cadena;
}

/**
 * @param etiquetaFinal El objeto que esta pantalla abrió, si abrió uno.
 *
 *   ⚠️ **Reemplaza o agrega, y lo decide el nodo, no quien llama.** En una
 *   pantalla que **es** de un objeto —`UX02` es *«Materia»* hasta que se sabe
 *   cuál— el nombre reemplaza a la última miga: `Materias › Análisis`. En una
 *   **sección del menú**, en cambio, el objeto es algo que se abrió *adentro*, y
 *   renombrar la sección borraría el camino de vuelta: `Formación › Tengo mucho
 *   para estudiar…`, con *Formación* enlazada.
 *
 *   ⚠️ **Vacío o ausente no borra nada**, lo deja como estaba. Una miga sin
 *   texto no sería una miga: sería un hueco donde el usuario perdería dónde está
 *   mientras la pantalla carga.
 */
export function migasDe(
  nodo: NodoId,
  etiquetaFinal?: string | null,
  /**
   * La miga del medio con nombre y enlace propios — ADR-099 §9. Reemplaza a la
   * del **padre** del nodo; sin ella, el padre queda genérico (*Materia*).
   */
  intermedia?: { etiqueta: string; href: string } | null,
  /**
   * De dónde se llegó, cuando no es la sección de siempre — ADR-110 · Enm. 6:
   * desde Mi plan, la materia es *Mi plan › Análisis II* y no *Materias ›
   * Análisis II*. Reemplaza a la sección raíz de la cadena.
   */
  origen?: { etiqueta: string; href: string } | null,
): Miga[] {
  /*
    ⚠️ **La miga del objeto se escribe con mayúscula sólo en la primera letra.**
    Los nombres del Plan 2016 llegan en mayúsculas de la fuente oficial, y
    *Materias › ARQUITECTURA COMPUTADORAS* desequilibra la línea entera. Es
    presentación, no renombre — el dato de la base no se toca (ver
    `nombreDeObjeto`).
  */
  const propio = nombreDeObjeto((etiquetaFinal ?? "").trim());
  const cadena = cadenaDe(nodo);
  const agrega = propio !== "" && RAICES.has(nodo);

  const migas = cadena.map((id, i) => {
    const ultima = i === cadena.length - 1 && !agrega;
    if (intermedia && i === cadena.length - 2 && !agrega) {
      return { etiqueta: nombreDeObjeto(intermedia.etiqueta.trim()) || etiquetaDeMiga(id), href: intermedia.href };
    }
    return {
      etiqueta: ultima && propio ? propio : etiquetaDeMiga(id),
      href: ultima ? null : nodos[id].ruta,
    };
  });
  const completas = agrega ? [...migas, { etiqueta: propio, href: null }] : migas;
  if (!origen || RAICES.has(nodo)) return completas;
  const sinSeccion = RAICES.has(cadena[0]) ? completas.slice(1) : completas;
  return [{ etiqueta: origen.etiqueta, href: origen.href }, ...sinSeccion];
}

/**
 * **El origen viaja en la URL** — [ADR-110 · Enmienda 6](../../docs/decisions.md#adr-110-enmienda-6).
 *
 * `?desde=plan` (o `?desde=plan:2026-09-14`, con la semana que se estaba
 * mirando). No hay historial que consultar, y no se inventa uno: lo que no se
 * reconoce se ignora y la miga queda como siempre.
 */
export const PARAM_ORIGEN = "desde";

const ORIGEN_PLAN = /^plan(?::(\d{4}-\d{2}-\d{2}))?$/;

export function origenDeLaConsulta(valor: string | null): { etiqueta: string; href: string } | null {
  const m = valor ? ORIGEN_PLAN.exec(valor) : null;
  const ruta = nodos.PLAN_VIVO.ruta;
  if (!m || !ruta) return null;
  return { etiqueta: etiquetaDeMiga("PLAN_VIVO"), href: m[1] ? `${ruta}?semana=${m[1]}` : ruta };
}

/** La ruta de un objeto abierto desde Mi plan, con el camino de vuelta. */
export function desdeElPlan(ruta: string, semana: string | null): string {
  const [camino = "", consulta = ""] = ruta.split("?");
  const params = new URLSearchParams(consulta);
  params.set(PARAM_ORIGEN, semana ? `plan:${semana}` : "plan");
  return `${camino}?${params.toString()}`;
}

export { padre as padreDeMiga, RAICES as seccionesDelMenu };
