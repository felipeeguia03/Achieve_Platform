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
import { nodos, superficieIds, type NodoId } from "@/lib/navigation/surfaces";
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

export const indiceDePaleta: readonly EntradaDePaleta[] = [
  ...superficieIds
    .filter((id) => nodos[id].ruta !== null)
    .map((id: NodoId): EntradaDePaleta => {
      const nodo = nodos[id];
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
