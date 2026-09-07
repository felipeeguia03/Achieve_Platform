import { minutosPorTema, type SesionDeClase, type TipoDeClase } from "@/lib/domain/duracion";
import { minutosPendientes } from "@/lib/domain/cobertura";
import {
  demandaSemanal,
  faltaTiempo,
  repartir,
  type MateriaEnElReparto,
} from "@/lib/domain/reparto";
import type { RepartoProjection } from "@/lib/domain/view-models";

/**
 * El reparto de horas entre materias, proyectado — [ADR-073](../../../docs/decisions.md#adr-073).
 *
 * Encadena las tres derivaciones: `duracion.ts` dice cuánto lleva cada tema,
 * `cobertura.ts` cuánto de eso falta, y `reparto.ts` cómo se parte el
 * presupuesto entre materias.
 *
 * ## Las dos cosas que esta proyección tiene prohibido decir
 *
 * 1. **Si vas a llegar.** Cuando falta tiempo se muestran **las dos cifras y
 *    ninguna conclusión**: ni *"no llegás"* ni *"apurate"*, que son predicciones
 *    y [ADR-058](../../../docs/decisions.md#adr-058) las cerró.
 * 2. **Qué materia recortar.** Cuando el presupuesto no alcanza, todas se
 *    achican en la misma proporción. Si una recibiera cero, eso sería proponer
 *    abandonarla.
 *
 * ⚠️ **Y no agenda.** [ADR-064](../../../docs/decisions.md#adr-064) deja el
 * *cuándo* en el `Commitment`; esto es sólo el presupuesto.
 */

export interface InsumosDeReparto {
  /** `null` ⇒ **no contestó la pregunta**, que no es lo mismo que cero. */
  minutosPorSemana: number | null;
  materias: Array<{
    cursadaId: string;
    nombre: string;
    diasHastaEvaluacion: number | null;
    /**
     * Los temas que entran en la próxima evaluación, **declarados**. Vacío ⇒
     * nadie lo declaró, y entonces cuenta la materia entera.
     */
    alcance: string[];
    cargaDeclarada: { minutos: number; texto: string } | null;
    unidades: Array<{ id: string; peso: number | null; trabajado: boolean }>;
    clases: Array<{ minutos: number | null; tipo: TipoDeClase | null; temas: string[] }>;
  }>;
}

export interface RepositorioDeReparto {
  insumos(institutionId: string, studentId: string, ahora: string): Promise<InsumosDeReparto>;
}

/** Cuánto le falta a una materia. `null` ⇒ no se puede estimar. */
function pendientesDe(m: InsumosDeReparto["materias"][number]): number | null {
  const sesiones: SesionDeClase[] = m.clases.map((c) => ({
    tipo: c.tipo,
    minutos: c.minutos,
    temas: c.temas,
  }));
  const reparto = minutosPorTema(
    m.unidades.map((u) => ({ id: u.id, peso: u.peso })),
    sesiones,
    m.cargaDeclarada?.minutos ?? null,
  );
  if (reparto.estado !== "OK") return null;

  // ⚠️ **Sólo lo que entra en la próxima evaluación.** Sin este corte, un
  // parcial que cubre dos unidades exigiría la materia entera y el número
  // saldría al doble.
  //
  // Vacío ⇒ nadie declaró el alcance, y entonces se cuenta todo. Es la misma
  // salida que `contexto_del_ade()`: el alcance se declara, **nunca se infiere
  // del texto de `scope`**.
  const enAlcance =
    m.alcance.length === 0 ? m.unidades : m.unidades.filter((u) => m.alcance.includes(u.id));

  return minutosPendientes(
    enAlcance.map((u) => ({
      id: u.id,
      minutos: reparto.minutos[u.id] ?? null,
      trabajado: u.trabajado,
    })),
  );
}

/** `90` → `"1,5 h"`. Redondeo a la media hora: la precisión al minuto es falsa. */
export function enHoras(minutos: number): string {
  const h = Math.round((minutos / 60) * 2) / 2;
  return `${String(h).replace(".", ",")} h`;
}

export function proyectarReparto(i: InsumosDeReparto): RepartoProjection | null {
  // Sin materias no hay nada que repartir, y una sección vacía diciendo «no hay
  // nada» es peor que no dibujarla.
  if (i.materias.length === 0) return null;

  const materias: MateriaEnElReparto[] = i.materias.map((m) => ({
    cursadaId: m.cursadaId,
    nombre: m.nombre,
    minutosPendientes: pendientesDe(m),
    diasHastaEvaluacion: m.diasHastaEvaluacion,
  }));

  const r = repartir(materias, i.minutosPorSemana);

  const demandas = materias.map(demandaSemanal).filter((d): d is number => d !== null);
  const totalSemanal = demandas.length === 0 ? null : demandas.reduce((a, b) => a + b, 0);

  return {
    // ⚠️ Las dos cifras, y ninguna conclusión. El componente las muestra; no las
    // compara para escribir un veredicto.
    disponible: r.minutosPorSemana === null ? null : enHoras(r.minutosPorSemana),
    // ⚠️ **Lo requerido es la demanda SEMANAL, no el pendiente total.** Comparar
    // «6 h por semana» contra «48 h que faltan en total» sería comparar dos
    // cosas distintas y exagerar el hueco. `demandaSemanal` vive en el dominio y
    // se importa: reimplementarla acá duplicaría el horizonte de las materias
    // sin fecha en dos lugares.
    requerido:
      totalSemanal === null ? null : enHoras(totalSemanal),
    falta: faltaTiempo(r),
    materias: r.materias.map((m) => ({
      cursadaId: m.cursadaId,
      nombre: m.nombre,
      // `null` ⇒ no se reparte, y el motivo dice por qué. **No es cero**: cero
      // diría que esta materia no necesita tiempo esta semana.
      asignado: m.minutosAsignados === null ? null : enHoras(m.minutosAsignados),
      motivo: m.motivo,
    })),
    regla: r.regla,
  };
}
