/**
 * Los nodos del Golden Path.
 *
 * Owner canónico: `docs/product.md` §10 (las nueve superficies) y
 * `product-spec-source.md` Parte III §5, que en la columna *Origen* nombra
 * además tres nodos que **no son superficies**: `ejecución`, el *flujo de
 * renegociación* y el *rescate*, estos dos últimos dentro de `UX04`. Se modelan
 * tal cual: un nodo sin ruta no es un olvido, es un momento del loop que no
 * tiene pantalla propia.
 *
 * `UX04/rescate` es un nodo separado de `UX04` por la misma razón que lo es el
 * flujo de renegociación, y por una de fondo: **el rescate es otro objeto, no
 * una edición del original** (AGENTS.md §2.4). Colapsarlo en `UX04` haría que
 * `CTA-015` pareciera volver sobre el Commitment incumplido.
 *
 * **No existe `UX10`.** Mapeo canónico obligatorio: `WF-S10 → UX08`,
 * `WF-S11 → UX09`.
 */

export type NodoId =
  | "UX01"
  | "UX02"
  | "UX03"
  | "UX04"
  | "UX04_RENEGOCIACION"
  | "UX04_RESCATE"
  | "UX05"
  | "UX06"
  | "UX07"
  | "UX08"
  | "UX09"
  | "EJECUCION";

export interface Nodo {
  id: NodoId;
  wireframe: string | null;
  nombre: string;
  /** La pregunta que la superficie responde. `null` en los nodos sin pantalla. */
  pregunta: string | null;
  /**
   * `null` ⇒ el nodo no tiene URL propia.
   *
   * Dos razones distintas, y no se confunden: `EJECUCION` y
   * `UX04_RENEGOCIACION` **no son superficies** y nunca van a tener ruta;
   * `UX07`–`UX09` sí son superficies y su ruta llega con el componente, en las
   * Etapas 0.4–0.6.
   */
  ruta: string | null;
  /** Qué etapa la construye. `null` ⇒ ya existe. */
  pendienteDeEtapa: string | null;
}

export const nodos: Readonly<Record<NodoId, Nodo>> = {
  UX01: {
    id: "UX01",
    wireframe: "WF-S01",
    nombre: "Hoy / Autogestión",
    pregunta: "¿Qué necesito hacer ahora?",
    ruta: "/hoy",
    pendienteDeEtapa: null,
  },
  UX02: {
    id: "UX02",
    wireframe: "WF-S02",
    nombre: "Materia / Cursado",
    pregunta: "¿Cómo vengo en esta materia y qué hago?",
    ruta: "/materia",
    pendienteDeEtapa: null,
  },
  UX03: {
    id: "UX03",
    wireframe: "WF-S05",
    nombre: "Próxima Acción",
    pregunta: "¿Qué significa esta acción y qué debo producir?",
    ruta: "/accion",
    pendienteDeEtapa: null,
  },
  UX04: {
    id: "UX04",
    wireframe: "WF-S06",
    nombre: "Compromiso",
    pregunta: "¿Cuándo y bajo qué acuerdo real lo haré?",
    ruta: "/compromiso",
    pendienteDeEtapa: null,
  },
  UX04_RENEGOCIACION: {
    id: "UX04_RENEGOCIACION",
    wireframe: null,
    nombre: "UX04 · flujo de renegociación",
    pregunta: null,
    ruta: null,
    pendienteDeEtapa: null,
  },
  UX04_RESCATE: {
    id: "UX04_RESCATE",
    wireframe: null,
    nombre: "UX04 · rescate",
    pregunta: null,
    ruta: null,
    pendienteDeEtapa: null,
  },
  UX05: {
    id: "UX05",
    wireframe: "WF-S07",
    nombre: "Evidencia",
    pregunta: "¿Cómo presento la producción acordada?",
    ruta: "/evidencia",
    pendienteDeEtapa: null,
  },
  UX06: {
    id: "UX06",
    wireframe: "WF-S08",
    nombre: "Progreso / Bitácora",
    pregunta: "¿Qué cambió realmente y qué sigue?",
    ruta: "/progreso",
    pendienteDeEtapa: null,
  },
  UX07: {
    id: "UX07",
    wireframe: "WF-S09",
    nombre: "Activación de Modo Examen",
    pregunta: "¿Qué examen activo y qué implica?",
    ruta: "/examen/activar",
    pendienteDeEtapa: null,
  },
  UX08: {
    id: "UX08",
    wireframe: "WF-S10",
    nombre: "Modo Examen / Overview",
    pregunta: "¿Dónde estoy en la preparación y qué atiendo?",
    ruta: null,
    pendienteDeEtapa: "0.5",
  },
  UX09: {
    id: "UX09",
    wireframe: "WF-S11",
    nombre: "Paso de Protocolo",
    pregunta: "¿Qué exige este hito y cómo lo completo?",
    ruta: null,
    pendienteDeEtapa: "0.6",
  },
  EJECUCION: {
    id: "EJECUCION",
    wireframe: null,
    nombre: "Ejecución",
    pregunta: null,
    ruta: null,
    pendienteDeEtapa: null,
  },
} as const;

export const nodoIds = Object.keys(nodos) as NodoId[];

/** Las nueve superficies del estudiante, sin los nodos que no tienen pantalla. */
export const superficieIds = nodoIds.filter((id) => nodos[id].wireframe !== null);

/** Una superficie existe cuando ya tiene componente y ruta. */
export function superficieExiste(id: NodoId): boolean {
  return nodos[id].ruta !== null;
}
