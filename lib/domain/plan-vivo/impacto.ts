/**
 * **Impacto académico del Plan vivo** — [ADR-110](../../../docs/decisions.md#adr-110).
 *
 * Dos lecturas, **siempre hipotéticas**:
 *
 * - **Individual:** qué pasaría si se hiciera un trabajo — qué tema toca y qué
 *   trabajo deja de esperar.
 * - **Del escenario:** qué pasaría si se cumpliera todo lo que está ubicado o
 *   comprometido en la semana, con evidencia suficiente.
 *
 * ⚠️ **No es una predicción de aprobación ni afirma dominio** (`product.md`
 * §13). Lo que muestra en el Gantt se rotula *supuesto*, y el Gantt real no se
 * toca: se devuelve una copia.
 */

import type { GanttProjection } from "../view-models";
import type { PlanningProjection, PlanningWorkItem, PlanVivoBase } from "./tipos";

export interface ImpactoIndividual {
  itemId: string;
  cursadaId: string;
  tema: string | null;
  /** Trabajo que hoy espera a éste y quedaría libre. */
  desbloquea: readonly string[];
}

export function impactoIndividual(base: PlanVivoBase, itemId: string): ImpactoIndividual | null {
  const item = base.items.find((i) => i.id === itemId);
  if (!item) return null;
  return {
    itemId,
    cursadaId: item.cursadaId,
    tema: item.tema,
    desbloquea: base.items.filter((i) => i.dependencies.some((d) => d.itemId === itemId)).map((i) => i.id),
  };
}

export interface ImpactoDeMateria {
  cursadaId: string;
  /** Temas que el escenario supone trabajados. */
  temas: readonly string[];
  /** Minutos probables que seguirían pendientes al cumplir el escenario. */
  pendienteFinal: number;
  /** Trabajo con evaluación que **tiene lugar** antes de ella en el escenario. */
  llegan: readonly string[];
  /** Trabajo con evaluación que **sigue sin lugar**. */
  noLlegan: readonly string[];
}

/**
 * Supone cumplido **todo lo ubicado y comprometido** dentro del horizonte.
 * Recibe la proyección que ya está en pantalla: no recalcula otro mundo.
 */
export function impactoDelEscenario(base: PlanVivoBase, p: PlanningProjection, hechos: readonly string[]): ImpactoDeMateria[] {
  const ubicadas = new Set(p.placedItems.map((x) => x.itemId));
  const comprometidas = new Set(base.fijos.filter((f) => f.itemId && f.tipo !== "HISTORIA").map((f) => f.itemId as string));
  const cumple = (i: PlanningWorkItem) => ubicadas.has(i.id) || comprometidas.has(i.id) || hechos.includes(i.id);

  return base.materias.map((m) => {
    const deLaMateria = base.items.filter((i) => i.cursadaId === m.cursadaId);
    const cumplidas = deLaMateria.filter(cumple);
    return {
      cursadaId: m.cursadaId,
      temas: cumplidas.map((i) => i.tema).filter((t): t is string => !!t),
      pendienteFinal: deLaMateria.filter((i) => !cumple(i)).reduce((s, i) => s + (i.durationRange?.likelyMinutes ?? 0), 0),
      llegan: cumplidas.filter((i) => i.deadline).map((i) => i.id),
      noLlegan: deLaMateria.filter((i) => i.deadline && !cumple(i)).map((i) => i.id),
    };
  });
}

/**
 * El Gantt de la materia con los temas supuestos. **Copia**: el original no
 * cambia. La fila se busca por nombre porque `GanttProjection` no trae el id del
 * tema; si no se encuentra, la fila queda como estaba (**omitir, no inventar**).
 */
export function ganttConSupuestos(gantt: GanttProjection, temas: readonly string[], etiqueta: string): GanttProjection {
  if (temas.length === 0) return gantt;
  const buscados = new Set(temas.map(normalizar));
  return {
    ...gantt,
    unidades: gantt.unidades.map((u) =>
      buscados.has(normalizar(u.nombre)) && u.estado !== "criterio_alcanzado"
        ? { ...u, estado: "criterio_alcanzado", etiqueta, nota: null }
        : u,
    ),
  };
}

const normalizar = (t: string) => t.trim().toLocaleLowerCase("es-AR");
