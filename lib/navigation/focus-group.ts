/**
 * El recorrido de focus group.
 *
 * Una **secuencia coherente de escenarios**: el mismo estudiante avanzando por
 * el loop, no nueve pantallas sueltas. Cada estación declara cómo se llega a
 * ella, y el CTA principal de cada una lleva a la siguiente.
 *
 * ── Qué es y qué no es ─────────────────────────────────────────────────────
 *
 * **No es un contrato de producto.** El registro canónico de CTAs sigue siendo
 * `cta-registry.ts` y este archivo no lo amplía: es el guion de una sesión, y
 * por eso vive aparte. Donde el recorrido avanza sin una CTA que lo respalde,
 * la estación lo **declara explícitamente** en vez de simularlo.
 *
 * ── Los dos huecos que el recorrido atraviesa ──────────────────────────────
 *
 * 1. **`UX05` no tiene entrada directa.** El spec la rutea `UX04 → ejecución →
 *    UX05`, y `ejecución` es un nodo **sin pantalla**. El recorrido recorre las
 *    dos aristas canónicas de una vez: `CTA-005` sale de `UX04` y `CTA-006`
 *    llega a `UX05`. No se inventa una transición — se atraviesa un nodo que no
 *    tiene superficie.
 * 2. ~~Ninguna CTA lleva a `UX07`.~~ **Cerrada el 1 de septiembre de 2026** por
 *    [ADR-016](../../docs/decisions.md#adr-016): la entrada manual
 *    `UX02 → UX07` que el spec describe en `§VI.7` §9 era un olvido del
 *    registro, y ahora es `CTA-019`. La estación se alcanza **por clic**, y el
 *    recorrido dejó de necesitar al facilitador.
 */

import type { CtaId } from "./cta-registry";
import type { NodoId } from "./surfaces";

export interface Estacion {
  nodo: NodoId;
  ruta: string;
  /**
   * El escenario que esta estación muestra. `null` ⇒ la ruta usa su escenario
   * por defecto y la URL queda limpia.
   */
  escenario: string | null;
  /** Qué pregunta responde esta pantalla, para el guion del facilitador. */
  pregunta: string;
  /**
   * Cómo se llega desde la estación anterior.
   *
   * `cta` es el contrato que respalda el paso. `atraviesa` nombra los nodos sin
   * pantalla que se recorren en el camino. `facilitador` marca que **no hay CTA
   * que lo respalde** y que el paso lo da la persona que conduce la sesión.
   */
  llegada:
    | { tipo: "inicio" }
    | { tipo: "cta"; cta: CtaId; atraviesa?: readonly NodoId[] }
    | { tipo: "facilitador"; motivo: string };
}

export const recorridoFocusGroup: readonly Estacion[] = [
  {
    nodo: "UX01",
    ruta: "/hoy",
    escenario: null,
    pregunta: "¿Qué necesito hacer ahora?",
    llegada: { tipo: "inicio" },
  },
  {
    nodo: "UX03",
    ruta: "/accion",
    escenario: null,
    pregunta: "¿Qué significa esta acción y qué debo producir?",
    llegada: { tipo: "cta", cta: "CTA-002" },
  },
  {
    nodo: "UX04",
    ruta: "/compromiso",
    escenario: null,
    pregunta: "¿Cuándo y bajo qué acuerdo real lo haré?",
    llegada: { tipo: "cta", cta: "CTA-003" },
  },
  {
    nodo: "UX04",
    ruta: "/compromiso",
    escenario: "FX-LOCAL-COM-DUE",
    pregunta: "Llegó la hora acordada. ¿Qué puedo hacer?",
    llegada: { tipo: "cta", cta: "CTA-004" },
  },
  {
    nodo: "UX05",
    ruta: "/evidencia",
    escenario: null,
    pregunta: "¿Cómo presento la producción acordada?",
    // Empezar lleva a ejecución, y finalizar la ejecución lleva a Evidencia.
    // `ejecución` no tiene pantalla, así que el recorrido lo atraviesa.
    llegada: { tipo: "cta", cta: "CTA-005", atraviesa: ["EJECUCION"] },
  },
  {
    nodo: "UX06",
    ruta: "/progreso",
    escenario: null,
    pregunta: "¿Qué cambió realmente y qué sigue?",
    llegada: { tipo: "cta", cta: "CTA-007" },
  },
  {
    nodo: "UX02",
    ruta: "/materia",
    escenario: null,
    pregunta: "¿Cómo vengo en esta materia y qué hago?",
    llegada: { tipo: "cta", cta: "CTA-010" },
  },
  {
    nodo: "UX07",
    ruta: "/examen/activar",
    escenario: null,
    pregunta: "¿Qué examen activo y qué implica?",
    // `CTA-019`: la entrada manual desde la materia (ADR-016). Antes era el
    // único paso del recorrido que no tenía contrato detrás.
    llegada: { tipo: "cta", cta: "CTA-019" },
  },
  {
    nodo: "UX08",
    ruta: "/examen/overview",
    // El escenario por defecto de la ruta es una preparación recién activada,
    // cuya CTA es "VOLVER A CURSADO". Encadenarla al paso haría que el botón
    // dijera una cosa y llevara a otra. Acá corresponde el escenario con
    // handoff disponible, cuya CTA sí es ABRIR PASO ACTUAL.
    escenario: "FX-LOCAL-OV-HANDOFF-DISPONIBLE",
    pregunta: "¿Dónde estoy en la preparación y qué atiendo?",
    llegada: { tipo: "cta", cta: "CTA-011" },
  },
  {
    nodo: "UX09",
    ruta: "/examen/paso",
    escenario: null,
    pregunta: "¿Qué exige este hito y cómo lo completo?",
    llegada: { tipo: "cta", cta: "CTA-012" },
  },
] as const;

/** La URL de una estación, con su escenario si lo tiene. */
export function urlDe(estacion: Estacion): string {
  return estacion.escenario === null
    ? estacion.ruta
    : `${estacion.ruta}?escenario=${estacion.escenario}`;
}

/**
 * La estación siguiente, dado dónde estás.
 *
 * Se identifica por ruta **y** escenario, porque el recorrido pasa dos veces
 * por `/compromiso` con estados distintos.
 */
export function siguienteEstacion(ruta: string, escenario: string | null): Estacion | null {
  const i = recorridoFocusGroup.findIndex(
    (e) => e.ruta === ruta && e.escenario === escenario,
  );
  if (i === -1 || i === recorridoFocusGroup.length - 1) return null;
  return recorridoFocusGroup[i + 1];
}

/**
 * La URL a la que lleva el CTA principal de una estación del recorrido.
 *
 * **Devuelve `null` cuando la estación siguiente se alcanza por navegación del
 * facilitador.** Encadenarla desde un CTA sería crear en los hechos la
 * `CTA-019` que [ADR-016](../../docs/decisions.md) deja explícitamente sin
 * decidir: el botón de `UX02` pasaría a llevar a `UX07` sin ningún contrato que
 * lo respalde.
 *
 * El marcador `facilitador` no es decorativo: acá es donde manda.
 */
export function siguienteUrl(ruta: string, escenario: string | null): string | null {
  const siguiente = siguienteEstacion(ruta, escenario);
  if (siguiente === null || siguiente.llegada.tipo === "facilitador") return null;
  return urlDe(siguiente);
}

/**
 * El punto de partida. **El reset es volver acá con una recarga completa.**
 *
 * Es determinista sin ningún mecanismo extra porque el Track A no persiste
 * nada: no hay `localStorage`, ni `sessionStorage`, ni `IndexedDB`, ni red. Lo
 * único que sobrevive a una navegación de cliente es el estado local de un
 * componente montado, y una recarga lo descarta.
 */
export const INICIO_DEL_RECORRIDO = "/hoy";
