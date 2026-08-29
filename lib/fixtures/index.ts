/**
 * Acceso al catálogo de escenarios.
 *
 * **Las pantallas nunca importan de acá** (AGENTS.md §6). Las rutas leen un
 * escenario, lo proyectan a props tipadas y se las pasan al componente. Esa
 * frontera es lo que hace barato el Track B: cuando el backend exista, cambia
 * lo que hay adentro de estas funciones y ninguna pantalla se toca.
 */

import { selectHeroLevel } from "@/lib/domain/precedence";
import type { HoyProps } from "@/lib/domain/view-models";
import { estadoGeneralPara } from "@/lib/content/hero";
import { escenarios, type EscenarioId } from "./scenarios";
import type { Escenario } from "./types";

export { escenarios, type EscenarioId } from "./scenarios";
export type { Escenario } from "./types";

export function getEscenario(id: EscenarioId): Escenario {
  return escenarios[id];
}

export const escenarioIds = Object.keys(escenarios) as EscenarioId[];

/**
 * Proyecta un escenario a las props de UX01.
 *
 * El **nivel del Hero no viene del fixture**: lo calcula `selectHeroLevel` a
 * partir de la condición del dominio que el escenario declara. Un fixture dice
 * en qué estado está el mundo; nunca dice qué debería mostrarse.
 */
export function proyectarHoy(escenario: Escenario): HoyProps | null {
  const hoy = escenario.hoy;
  if (!hoy) return null;

  const nivel = selectHeroLevel(hoy.heroInput);

  return {
    fecha: hoy.fecha,
    estadoGeneral: hoy.estadoGeneral ?? estadoGeneralPara(nivel),
    hero: { nivel, ...hoy.heroContenido },
    materias: hoy.materias,
  };
}
