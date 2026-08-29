/**
 * El grafo del Golden Path.
 *
 * Owner canónico: `docs/product-spec-source.md` Parte III §2 (recorrido local),
 * §3 (handoffs) y §6 (contratos de fallback transversales).
 *
 * ── Dos clases de arista ────────────────────────────────────────────────────
 *
 * Decisión aprobada de la Etapa 0.3: el grafo modela **las dos**, y las dos
 * apuntan a nodos reales.
 *
 *   - **Canónica** — el camino que el spec declara. Cada una nace de una CTA,
 *     así que no se escriben a mano: se derivan del registro. Una arista
 *     canónica sin CTA sería una navegación que ningún contrato respalda.
 *   - **Retorno seguro** — a dónde se vuelve cuando algo falla. El spec le da a
 *     cada CTA un `fallback` propio, más los contratos transversales de §6.
 *
 * Modelar el fallback como arista y no como texto permite verificar por test
 * que todo destino de retorno existe y que ningún nodo queda sin salida — que
 * es exactamente lo que la promesa de "retorno seguro" significa.
 *
 * ── Lo que el grafo NO hace ─────────────────────────────────────────────────
 *
 * Navegar no muta. *"El retorno a Hoy relee proyecciones y nunca presume
 * estados por la navegación."* Volver a `UX01`, `UX02` o `UX08` **no abandona**
 * una `ExamPreparation` activa.
 */

import { ctaIds, ctaRegistry, type CtaId } from "./cta-registry";
import { nodos, type NodoId } from "./surfaces";

export type ClaseDeArista = "canonica" | "retornoSeguro";

export interface Arista {
  clase: ClaseDeArista;
  desde: NodoId;
  hasta: NodoId;
  /** Qué contrato la respalda. Toda arista canónica tiene una. */
  cta: CtaId | null;
  /** Por qué se recorre. En las canónicas, la acción solicitada. */
  causa: string;
}

/**
 * Las aristas canónicas, derivadas del registro de CTAs.
 *
 * Una CTA con varios orígenes produce una arista por origen: `CTA-002` sale
 * tanto de `UX01` como de `UX02`. Una CTA sin destino (`destino: null`) no
 * produce arista: permanece en su superficie y cambia el estado, no el nodo.
 */
export const aristasCanonicas: readonly Arista[] = ctaIds.flatMap((id) => {
  const cta = ctaRegistry[id];
  if (cta.destino === null) return [];
  const destino = cta.destino;
  return cta.origen.map(
    (desde): Arista => ({
      clase: "canonica",
      desde,
      hasta: destino,
      cta: id,
      causa: cta.accionSolicitada,
    }),
  );
});

/**
 * Las aristas de retorno seguro, derivadas del `fallback` de cada CTA.
 *
 * Un fallback con `nodo: null` significa *permanecer donde estás* —conservar el
 * draft, mantener la ejecución, no actuar—. Eso no es una arista: es la
 * ausencia de movimiento, que ya es segura.
 *
 * Lo mismo cuando el spec **sí** nombra el nodo pero coincide con el origen:
 * el *"conservar Hoy"* de `CTA-001` es quedarse en `UX01`. Como una CTA puede
 * tener varios orígenes, esto se decide por arista y no por fila: el
 * *"mantener Commitment vigente"* de `CTA-017` es un movimiento real desde
 * `UX01` y ninguno desde `UX04`.
 */
export const aristasDeRetornoDesdeCtas: readonly Arista[] = ctaIds.flatMap((id) => {
  const cta = ctaRegistry[id];
  if (cta.fallback.nodo === null) return [];
  const hasta = cta.fallback.nodo;
  return cta.origen
    .filter((desde) => desde !== hasta)
    .map(
      (desde): Arista => ({
        clase: "retornoSeguro",
        desde,
        hasta,
        cta: id,
        causa: cta.fallback.descripcion,
      }),
    );
});

/**
 * Retornos seguros transversales, de `product-spec-source.md` Parte III §6.
 *
 * No cuelgan de ninguna CTA: valen ante *ausencia autoritativa* y *contexto
 * académico ausente* (`BL-21`, `SC-DAY-05`), donde no hay acción que ofrecer y
 * lo único correcto es un empty honesto con salida.
 */
export const aristasDeRetornoTransversales: readonly Arista[] = [
  { clase: "retornoSeguro", desde: "UX02", hasta: "UX01", cta: null, causa: "ausencia autoritativa: empty honesto y retorno seguro" },
  { clase: "retornoSeguro", desde: "UX03", hasta: "UX01", cta: null, causa: "ausencia autoritativa: empty honesto y retorno seguro" },
  { clase: "retornoSeguro", desde: "UX04", hasta: "UX01", cta: null, causa: "ausencia autoritativa: empty honesto y retorno seguro" },
  { clase: "retornoSeguro", desde: "UX05", hasta: "UX01", cta: null, causa: "ausencia autoritativa: empty honesto y retorno seguro" },
  { clase: "retornoSeguro", desde: "UX04_RENEGOCIACION", hasta: "UX04", cta: null, causa: "renegociación no elegible o incierta: mantener el Commitment original sin cambios" },
  { clase: "retornoSeguro", desde: "UX04_RESCATE", hasta: "UX01", cta: null, causa: "el rescate no altera el original: se conserva visible y se vuelve a Hoy" },
  { clase: "retornoSeguro", desde: "UX07", hasta: "UX02", cta: null, causa: "Assessment no registrada o no elegible: retorno seguro" },
] as const;

export const aristas: readonly Arista[] = [
  ...aristasCanonicas,
  ...aristasDeRetornoDesdeCtas,
  ...aristasDeRetornoTransversales,
];

// ─────────────────────────────────────────────────────────────────────────────

export function salidasDe(nodo: NodoId, clase?: ClaseDeArista): Arista[] {
  return aristas.filter((a) => a.desde === nodo && (clase === undefined || a.clase === clase));
}

export function entradasA(nodo: NodoId, clase?: ClaseDeArista): Arista[] {
  return aristas.filter((a) => a.hasta === nodo && (clase === undefined || a.clase === clase));
}

/**
 * El Golden Path del loop diario: la secuencia que un focus group recorre de
 * punta a punta. `product-spec-source.md` Parte III §2 y §3.
 */
export const goldenPath: readonly NodoId[] = [
  "UX01",
  "UX02",
  "UX03",
  "UX04",
  "EJECUCION",
  "UX05",
  "UX06",
] as const;

/** Nodos alcanzables desde uno dado, por cualquier clase de arista. */
export function alcanzablesDesde(origen: NodoId): Set<NodoId> {
  const vistos = new Set<NodoId>([origen]);
  const pila: NodoId[] = [origen];
  while (pila.length > 0) {
    const actual = pila.pop()!;
    for (const arista of salidasDe(actual)) {
      if (!vistos.has(arista.hasta)) {
        vistos.add(arista.hasta);
        pila.push(arista.hasta);
      }
    }
  }
  return vistos;
}

/** La ruta de un nodo, o `null` si todavía no tiene pantalla. */
export function rutaDe(nodo: NodoId): string | null {
  return nodos[nodo].ruta;
}
