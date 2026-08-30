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
