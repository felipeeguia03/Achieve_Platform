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

/** Los escenarios que traen vista de `UX07`, en el orden del catálogo. */
export const escenariosConUX07 = (Object.keys(escenarios) as EscenarioId[]).filter(
  (id) => escenarios[id].ux07 !== undefined,
);

/** Los escenarios que traen vista de `UX08`. */
export const escenariosConUX08 = (Object.keys(escenarios) as EscenarioId[]).filter(
  (id) => escenarios[id].ux08 !== undefined,
);

/**
 * Resuelve el `?escenario=` de la URL.
 *
 * Es un parámetro de **lectura** para poder abrir cualquier estado crítico en
 * el navegador —revisión de diseño, focus group— sin editar código y sin panel
 * de debug en pantalla. No persiste nada: sigue siendo cero red y cero storage.
 *
 * Un id desconocido devuelve `null`. El que llama decide qué hacer; acá no se
 * adivina cuál quiso pedir.
 */
export function escenarioUX07Desde(valor: string | null): EscenarioId | null {
  if (valor === null) return null;
  return escenariosConUX07.find((id) => id === valor) ?? null;
}

/** Los escenarios que traen vista de `UX09`. */
export const escenariosConUX09 = (Object.keys(escenarios) as EscenarioId[]).filter(
  (id) => escenarios[id].ux09 !== undefined,
);

/** Igual que `escenarioUX07Desde`, para `UX08`. */
export function escenarioUX08Desde(valor: string | null): EscenarioId | null {
  if (valor === null) return null;
  return escenariosConUX08.find((id) => id === valor) ?? null;
}

/** Igual, para `UX09`. */
export function escenarioUX09Desde(valor: string | null): EscenarioId | null {
  if (valor === null) return null;
  return escenariosConUX09.find((id) => id === valor) ?? null;
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

  const { nivel, variante } = selectHeroLevel(hoy.heroInput);

  return {
    fecha: hoy.fecha,
    estadoGeneral: hoy.estadoGeneral ?? estadoGeneralPara(nivel),
    hero: { nivel, variante, ...hoy.heroContenido },
    // **Siempre `null` en el Track A**, y no es una omisión: los escenarios
    // declaran un mundo, y en ese mundo no hay Risk Engine. Una recuperación
    // fabricada por un fixture le afirmaría al que mira el catálogo que el
    // sistema detectó algo — que es justo la diferencia entre declarar un
    // estado y haberlo evaluado.
    recuperacion: null,
    materias: hoy.materias,
    // La CTA de lectura aparece sólo si el contexto declara la Bitácora
    // disponible: es la condición de aparición de CTA-009.
    verProgreso: escenario.contextos.UX01?.progresoDisponible === true ? "Ver progreso" : null,
  };
}

/**
 * Resuelve `?escenario=` para una vista cualquiera.
 *
 * Generaliza lo que las Etapas 0.4–0.6 hicieron por pantalla: poder abrir
 * cualquier estado crítico en el navegador sin panel de debug. Es lectura pura
 * — no persiste nada, sigue siendo cero red y cero storage.
 */
export function escenarioDesde(
  valor: string | null,
  vista: "hoy" | "materia" | "accion" | "compromiso" | "evidencia" | "progreso",
): EscenarioId | null {
  if (valor === null) return null;
  const id = (Object.keys(escenarios) as EscenarioId[]).find((x) => x === valor);
  return id !== undefined && escenarios[id][vista] !== undefined ? id : null;
}
