/**
 * El índice que alimenta la paleta de comandos.
 *
 * Vive del lado de `lib/fixtures/` porque necesita el catálogo, y la dirección
 * permitida es **fixtures → navigation**, nunca al revés. La lógica de búsqueda
 * está en `lib/navigation/paleta.ts` y no conoce estos datos.
 *
 * **Cero red:** se arma una vez, en memoria, a partir del catálogo estático.
 */

import { normalizar, type EntradaDePaleta } from "@/lib/navigation/paleta";
import { nodoIds, nodos, type NodoId } from "@/lib/navigation/surfaces";
import { escenarios, type EscenarioId } from "./scenarios";

/** Qué vista de escenario corresponde a cada ruta, para armar la URL. */
const VISTA_POR_RUTA: Record<string, keyof (typeof escenarios)[EscenarioId]> = {
  "/hoy": "hoy",
  "/materia": "materia",
  "/accion": "accion",
  "/compromiso": "compromiso",
  "/evidencia": "evidencia",
  "/progreso": "progreso",
  "/examen/activar": "ux07",
  "/examen/overview": "ux08",
  "/examen/paso": "ux09",
};

/**
 * Las pantallas que el buscador ofrece.
 *
 * ⚠️ **Son los nodos con ruta, no las nueve superficies** — Enmienda 6 de
 * [ADR-088](../../docs/decisions.md#adr-088). Con `superficieIds`, *Formación* y
 * el índice de *Materias* **no estaban en el buscador**: los dos tienen
 * `wireframe: null` a propósito —no son una décima superficie— y el filtro los
 * dejaba afuera de un lugar donde sí corresponde que estén. Se busca *"a qué
 * pantalla voy"*, y ésas son dos pantallas.
 *
 * La afirmación de que las superficies son nueve **no se toca**: `superficieIds`
 * sigue devolviendo nueve y su guard sigue en pie. Lo que cambia es qué lista
 * usa el buscador.
 */
export const indiceDePaleta: readonly EntradaDePaleta[] = [
  ...nodoIds
    .filter((id) => nodos[id].ruta !== null)
    .map((id: NodoId): EntradaDePaleta => {
      const nodo = nodos[id];
      /*
        ⚠️ **Una pantalla del buscador navega, y no trae objeto** — ADR-088,
        Enmienda 7. Elegirla es ir; lo que se abre en ventana desde acá son las
        materias, con su cursada, en las entradas de más abajo.
      */
      return {
        tipo: "superficie",
        titulo: nodo.nombre,
        detalle: nodo.pregunta ?? "",
        url: nodo.ruta!,
        indice: normalizar(`${id} ${nodo.nombre} ${nodo.pregunta ?? ""}`),
      };
    }),
  ...(Object.keys(escenarios) as EscenarioId[]).flatMap((id): EntradaDePaleta[] => {
    const escenario = escenarios[id];
    const ruta = Object.entries(VISTA_POR_RUTA).find(([, v]) => escenario[v] !== undefined)?.[0];
    if (ruta === undefined) return [];
    return [
      {
        tipo: "escenario",
        titulo: id,
        detalle: escenario.proposito,
        url: `${ruta}?escenario=${id}`,
        indice: normalizar(`${id} ${escenario.proposito}`),
      },
    ];
  }),
];
