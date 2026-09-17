/**
 * Punto de entrada de la capa de navegación.
 *
 * `lib/navigation/` no importa `lib/fixtures/`: la dirección es
 * fixtures → navigation, nunca al revés. El grafo y el registro describen el
 * contrato; los escenarios lo instancian.
 */

export { nodos, nodoIds, superficieIds, superficieExiste, type Nodo, type NodoId } from "./surfaces";
export { contexto, contextoVacio, type ContextoCTA } from "./context";
export { ctaRegistry, ctaIds, ctasVisibles, type Cta, type CtaId } from "./cta-registry";
export {
  aristas,
  aristasCanonicas,
  alcanzablesDesde,
  goldenPath,
  entradasA,
  rutaDe,
  salidasDe,
  type Arista,
  type ClaseDeArista,
} from "./golden-path";

export {
  recorridoFocusGroup,
  siguienteEstacion,
  siguienteUrl,
  urlDe,
  INICIO_DEL_RECORRIDO,
  type Estacion,
} from "./focus-group";

// `export { } from` re-exporta, pero **no trae los nombres al scope**: sin
// este import, `rutaConocida` no compila.
import { nodos, nodoIds } from "./surfaces";
import { ctaRegistry, type CtaId } from "./cta-registry";
import { rutaDe } from "./golden-path";

/**
 * La ruta a la que lleva una CTA, o `null` si no navega.
 *
 * Devuelve `null` en tres casos que **no son lo mismo**, y por eso el que llama
 * decide qué hacer con cada uno:
 *
 *   - la CTA no navega por contrato (`destino: null`): permanece y cambia el
 *     estado de su propia superficie;
 *   - el destino es un nodo sin pantalla (`EJECUCION`, los flujos internos de
 *     `UX04`);
 *   - el destino es una superficie que todavía no se construyó (`UX07`–`UX09`).
 */
export function rutaDeCta(id: CtaId): string | null {
  const destino = ctaRegistry[id].destino;
  return destino === null ? null : rutaDe(destino);
}

/**
 * La ruta de una CTA **con el objeto que transporta** —
 * [ADR-054](../../docs/decisions.md#adr-054).
 *
 * El nombre del parámetro sale de `Cta.parametro`, no de la página: así el
 * contrato de qué viaja vive en el registro canónico y renombrarlo se hace en un
 * solo lugar.
 *
 * **`valor` en `null` devuelve la ruta pelada**, y eso no es un caso degradado:
 * es el Track A, donde un escenario declara un mundo y **no hay
 * `course_enrollment` que nombrar**. Inventar un id para completar la URL sería
 * exactamente lo que *omitir, no inventar* prohíbe.
 *
 * Devuelve `null` si la CTA no navega, igual que `rutaDeCta`.
 */
export function rutaDeCtaCon(id: CtaId, valor: string | null): string | null {
  const ruta = rutaDeCta(id);
  const parametro = ctaRegistry[id].parametro;
  if (ruta === null || valor === null || parametro === undefined) return ruta;
  return `${ruta}?${parametro.nombre}=${encodeURIComponent(valor)}`;
}

/**
 * ¿Es una ruta que la aplicación reconoce? — [ADR-088](../../docs/decisions.md#adr-088) §4.
 *
 * El espacio de trabajo restaura rutas desde el navegador, y **una ruta
 * restaurada no se confía**: `localStorage` se edita a mano. Esto la valida
 * contra el grafo antes de que llegue a un `router.push`.
 *
 * ⚠️ **Compara sólo el camino.** Los parámetros son del objeto —qué cursada,
 * qué tema— y no se enumeran acá: el grafo describe destinos, no instancias.
 */
export function rutaConocida(ruta: string): boolean {
  if (!ruta.startsWith("/")) return false;
  const camino = ruta.split("?")[0];
  if (camino === undefined) return false;
  return nodoIds.some((id) => nodos[id].ruta === camino);
}
