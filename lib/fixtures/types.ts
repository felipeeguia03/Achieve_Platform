/**
 * Forma del catálogo de escenarios sintéticos.
 *
 * **Escenarios completos y explícitos** (decisión aprobada de la Etapa 0.2). Un
 * objeto por escenario, con su estado escrito literal. Nada hereda de nada y no
 * hay merges: el arnés QA original demostró que la composición implícita
 * produce reglas de negocio escondidas en comparaciones de string. Es verboso a
 * propósito — un escenario se lee entero, de arriba a abajo.
 *
 * **Cero datos reales** (AGENTS.md §1.3): identificadores `*-SYN-*`, materias
 * ficticias, nombres genéricos.
 */

import type { HeroInput } from "@/lib/domain/precedence";
import type {
  Chip,
  CompromisoProps,
  EvidenciaProps,
  FilaDato,
  MateriaProps,
  MateriaResumen,
  ProgresoProps,
  ProximaAccionProps,
} from "@/lib/domain/view-models";

/**
 * De dónde sale el ID del escenario.
 *
 * - `spec`: el ID es del registro canónico de `product-spec-source.md` §7. Un
 *   `grep` del ID en el spec devuelve su definición.
 * - `local`: el spec no nombra este escenario. Lleva prefijo `FX-LOCAL-` para
 *   que nadie lo busque en el spec y no lo encuentre. **No se inventan IDs con
 *   forma canónica.**
 */
export type OrigenDelId = "spec" | "local";

/**
 * El contenido del Hero. El **nivel no se escribe acá**: lo decide
 * `selectHeroLevel(heroInput)` en la proyección. Un fixture declara la
 * condición del dominio, nunca la respuesta.
 */
export interface HeroContenido {
  contexto: string | null;
  titulo: string | null;
  razon: string | null;
  tiempoOEstado: string | null;
  evidenciaEsperada: string | null;
  queSigue: { texto: string; conPrefijo: boolean } | null;
  chip: Chip | null;
}

export interface EscenarioHoy {
  fecha: string;
  heroInput: HeroInput;
  heroContenido: HeroContenido;
  materias: MateriaResumen[];
  /** `null` ⇒ se usa el estado general que corresponde al nivel calculado. */
  estadoGeneral: string | null;
}

export interface Escenario {
  id: string;
  origen: OrigenDelId;
  /** Para qué existe, en una línea. Copiado del registro del spec cuando aplica. */
  proposito: string;
  /** Contratos `C01` y escenarios `SC-*` que este fixture toca. Trazabilidad. */
  cubre: readonly string[];
  hoy?: EscenarioHoy;
  materia?: MateriaProps;
  accion?: ProximaAccionProps;
  compromiso?: CompromisoProps;
  evidencia?: EvidenciaProps;
  progreso?: ProgresoProps;
}

export type { FilaDato };
