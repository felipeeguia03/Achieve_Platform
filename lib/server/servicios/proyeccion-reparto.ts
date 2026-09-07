import { minutosPorTema, type SesionDeClase, type TipoDeClase } from "@/lib/domain/duracion";
import { minutosPendientes, type EstadoDeUnidad } from "@/lib/domain/cobertura";
import {
  conMultiplicador,
  multiplicadorDe,
  type Observacion,
} from "@/lib/domain/multiplicador";
import {
  demandaSemanal,
  faltaTiempo,
  repartir,
  tramoDeBrecha,
  type MateriaEnElReparto,
} from "@/lib/domain/reparto";
import { t } from "@/lib/content/es-AR";
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
  /**
   * Lo que el estudiante declaró que tardó, contra lo que la `Action` estimaba
   * ([ADR-074](../../../docs/decisions.md#adr-074)).
   *
   * ⚠️ **Sale de `reflection`, no de los `Commitment` cumplidos.** Lo primero
   * mide la tarea frente a la persona; lo segundo, su conducta. Confundirlas
   * haría que una mala semana le reduzca el presupuesto.
   */
  observaciones: Observacion[];
  /**
   * `false` ⇒ el estudiante apagó el ajuste de duración
   * ([ADR-075](../../../docs/decisions.md#adr-075) §B4).
   */
  calibracionActiva: boolean;
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
    unidades: Array<{ id: string; peso: number | null; evidencia: EstadoDeUnidad }>;
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
      estado: u.evidencia,
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

  // ⚠️ **Los dos factores, separados.** `pendientesDe` es Academic Engine —cuánto
  // lleva el tema para cualquiera— y el multiplicador es Personal Engine —cuánto
  // te lleva a vos—. Se multiplican acá y nunca antes, para que cada mitad se
  // pueda explicar por separado ([ADR-068](../../../docs/decisions.md#adr-068)).
  const mult = multiplicadorDe(i.observaciones ?? [], i.calibracionActiva !== false);

  const materias: MateriaEnElReparto[] = i.materias.map((m) => ({
    cursadaId: m.cursadaId,
    nombre: m.nombre,
    minutosPendientes: conMultiplicador(pendientesDe(m), mult),
    diasHastaEvaluacion: m.diasHastaEvaluacion,
  }));

  const r = repartir(materias, i.minutosPorSemana);

  const demandas = materias.map(demandaSemanal).filter((d): d is number => d !== null);
  const totalSemanal = demandas.length === 0 ? null : demandas.reduce((a, b) => a + b, 0);

  const tramo = tramoDeBrecha(r);
  const disponible = r.minutosPorSemana === null ? null : enHoras(r.minutosPorSemana);
  const requerido = totalSemanal === null ? null : enHoras(totalSemanal);

  return {
    tramo,
    titulo: t(`HOY.REPARTO.${tramo}`),
    // ⚠️ **Las dos cifras llevan su período, y es la corrección de ADR-075.**
    // El cálculo ya estaba sobre el mismo horizonte —las dos son tasas
    // semanales—; la pantalla no lo decía, y una cifra sin unidad al lado de
    // otra que sí la tiene se lee como un total acumulado.
    cifras:
      tramo === "SIN_DATOS" || disponible === null || requerido === null
        ? null
        : t("HOY.REPARTO.CIFRAS").replace("{disponible}", disponible).replace("{requerido}", requerido),
    aclaracion: t("HOY.REPARTO.ESTIMACION"),
    // §A4. En `ENTRA` no hay nada que reorganizar, así que no se ofrece por
    // ofrecer; en todo lo demás **siempre hay al menos una salida**.
    acciones:
      tramo === "ENTRA"
        ? []
        : tramo === "SIN_DATOS"
          ? [t("HOY.REPARTO.ACCION.HORAS")]
          : [
              t("HOY.REPARTO.ACCION.PRIORIZAR"),
              t("HOY.REPARTO.ACCION.HORAS"),
              t("HOY.REPARTO.ACCION.AYUDA"),
            ],
    disponible,
    // ⚠️ **Lo requerido es la demanda SEMANAL, no el pendiente total.** Comparar
    // «6 h por semana» contra «48 h que faltan en total» sería comparar dos
    // cosas distintas y exagerar el hueco. `demandaSemanal` vive en el dominio y
    // se importa: reimplementarla acá duplicaría el horizonte de las materias
    // sin fecha en dos lugares.
    requerido,
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
