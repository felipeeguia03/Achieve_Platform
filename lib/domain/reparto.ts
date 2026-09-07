/**
 * El reparto de horas entre materias — [ADR-073](../../docs/decisions.md#adr-073).
 *
 * ## Qué es, y qué explícitamente no es
 *
 * Todo lo de la Fase B6.15 es **por materia**: cuánto lleva ésta, cuánto
 * cubriste de ésta. Esto es **entre materias**, y por eso introduce algo que el
 * producto no tenía: **un presupuesto finito**.
 *
 * **Es una proyección.** No crea `Commitment`, no agenda y no reemplaza al ADE,
 * que sigue proponiendo una acción por vez.
 * [ADR-064](../../docs/decisions.md#adr-064) fijó que el ADE decide *qué* y
 * *cuánto* y el `Commitment` decide *cuándo*; esto es un tercer objeto y **no se
 * mete en esa frontera**.
 *
 * ## Las dos cosas que tiene prohibido decir
 *
 * 1. **Si vas a llegar.** Ni «no llegás» ni «apurate»: las dos son predicciones,
 *    y [ADR-058](../../docs/decisions.md#adr-058) las cerró. Cuando falta
 *    tiempo, se muestran **las dos cifras y ninguna conclusión**.
 * 2. **Qué materia recortar.** Decidir cuál se sacrifica es una decisión de
 *    vida. Hoy no hay datos ni validación para sostenerla.
 */

/** La versión de la regla. Cambiarla **no** reescribe repartos viejos. */
export const REGLA_DE_REPARTO = "reparto-v1";

export interface MateriaEnElReparto {
  cursadaId: string;
  nombre: string;
  /**
   * Minutos que le faltan. `null` = no se puede estimar —la materia está
   * degradada— y **no es cero**: entra al reparto sin pedir nada, y se dice.
   */
  minutosPendientes: number | null;
  /** Días hasta la próxima evaluación. `null` = sin fecha declarada. */
  diasHastaEvaluacion: number | null;
}

export interface Reparto {
  /** Minutos por semana que el estudiante declaró. `null` = no contestó. */
  minutosPorSemana: number | null;
  /** Lo que el conjunto de materias pide, sumado. `null` = nada estimable. */
  minutosRequeridos: number | null;
  /**
   * ⚠️ **El hueco, como hecho y sin veredicto.** Positivo = falta tiempo.
   * `null` cuando falta alguna de las dos cifras — no se completa con un cero,
   * que se leería como «justo alcanza».
   */
  huecoSemanal: number | null;
  /**
   * Lo que el conjunto demanda **por semana**. Es la cifra que se compara con
   * `minutosPorSemana`, y está en la misma unidad a propósito
   * ([ADR-075](../../docs/decisions.md#adr-075)).
   */
  demandaSemanalTotal: number | null;
  materias: Array<{
    cursadaId: string;
    nombre: string;
    /** Minutos semanales que le tocan del presupuesto. `null` ⇒ no se reparte. */
    minutosAsignados: number | null;
    /** Por qué le tocó eso. La explicabilidad es obligatoria acá. */
    motivo: MotivoDeReparto;
  }>;
  regla: string;
}

export type MotivoDeReparto =
  /** Se repartió por urgencia: lo que falta, dividido por los días que quedan. */
  | "POR_URGENCIA"
  /** Hay pendiente pero no hay fecha: entra al reparto con la urgencia más baja. */
  | "SIN_FECHA"
  /** No se puede estimar cuánto falta. **No pide nada, y no es que no necesite.** */
  | "SIN_ESTIMACION"
  /** No se declaró disponibilidad: no hay presupuesto que repartir. */
  | "SIN_DISPONIBILIDAD";

/**
 * Cuánta presión semanal ejerce una materia.
 *
 * `minutos pendientes ÷ semanas que quedan`. Es lo que hace que **cargar una
 * materia reorganice a las demás**: entra una con parcial en diez días y su
 * demanda semanal es enorme, así que se lleva más del presupuesto.
 *
 * ⚠️ **Sin fecha, el denominador es un horizonte fijo y declarado.** Estimar
 * cuándo cae un examen que nadie declaró sería inventar la fecha por la puerta
 * de atrás; usar `Infinity` la dejaría fuera del reparto, que tampoco es cierto:
 * la materia existe y hay que estudiarla.
 */
export const HORIZONTE_SIN_FECHA_EN_SEMANAS = 12;

export function demandaSemanal(m: MateriaEnElReparto): number | null {
  if (m.minutosPendientes === null) return null;
  const semanas =
    m.diasHastaEvaluacion === null
      ? HORIZONTE_SIN_FECHA_EN_SEMANAS
      : // Nunca menos de una semana: con el examen mañana, la demanda es lo que
        // falta, no lo que falta multiplicado por siete.
        Math.max(m.diasHastaEvaluacion / 7, 1);
  return m.minutosPendientes / semanas;
}

/**
 * El reparto.
 *
 * @param minutosPorSemana Lo declarado. `null` ⇒ no contestó la pregunta.
 */
export function repartir(
  materias: readonly MateriaEnElReparto[],
  minutosPorSemana: number | null,
): Reparto {
  const demandas = materias.map((m) => ({ m, d: demandaSemanal(m) }));
  const estimables = demandas.filter((x) => x.d !== null);
  const totalDemanda = estimables.reduce((a, x) => a + x.d!, 0);

  const minutosRequeridos =
    estimables.length === 0
      ? null
      : estimables.reduce((a, x) => a + (x.m.minutosPendientes ?? 0), 0);

  // ⚠️ El hueco necesita **las dos** cifras. Con una sola, `null`: un cero se
  // leería como «justo alcanza», que es una afirmación que nadie hizo.
  const huecoSemanal =
    minutosPorSemana === null || totalDemanda === 0 ? null : totalDemanda - minutosPorSemana;

  return {
    minutosPorSemana,
    minutosRequeridos,
    huecoSemanal,
    demandaSemanalTotal: estimables.length === 0 ? null : totalDemanda,
    regla: REGLA_DE_REPARTO,
    materias: demandas.map(({ m, d }) => ({
      cursadaId: m.cursadaId,
      nombre: m.nombre,
      minutosAsignados:
        d === null || minutosPorSemana === null || totalDemanda === 0
          ? null
          : // Proporcional a la presión. Cuando el presupuesto alcanza, cada
            // una recibe su demanda; cuando no, todas se achican en la misma
            // proporción — **el sistema no elige cuál se sacrifica**.
            (minutosPorSemana * d) / totalDemanda,
      motivo:
        d === null
          ? "SIN_ESTIMACION"
          : minutosPorSemana === null
            ? "SIN_DISPONIBILIDAD"
            : m.diasHastaEvaluacion === null
              ? "SIN_FECHA"
              : "POR_URGENCIA",
    })),
  };
}

/**
 * ¿Falta tiempo? `null` cuando no se puede saber.
 *
 * ⚠️ **Es un booleano sobre dos números, no un juicio.** Quien lo consuma tiene
 * prohibido convertirlo en «no vas a llegar»: lo que se muestra son las dos
 * cifras.
 */
export function faltaTiempo(r: Reparto): boolean | null {
  return r.huecoSemanal === null ? null : r.huecoSemanal > 0;
}

// ── Los tramos del déficit · ADR-075 §A3 ─────────────────────────────────────
//
// La psicopedagoga, textual: *"No existe un punto de corte psicopedagógico
// universal. Para el MVP propongo esta regla provisional."*
//
// ⚠️ **`2` es un umbral operativo provisional, no un corte clínico.** Ella lo
// dijo con esas palabras: *"es una decisión prudencial de producto que deberá
// validarse"*. Se versiona con la regla y se revisa después del piloto.

export const UMBRAL_DE_BRECHA_CRITICA = 2;

/** A partir de acá, una brecha crítica pide conversación con una persona. */
export const DIAS_PARA_REVISION_HUMANA = 7;

export type TramoDeBrecha =
  /** `≤1`. Entra. **Sin prometer resultados.** */
  | "ENTRA"
  /** `1–2`. Las dos cifras en primer plano, y se ofrece reorganizar. */
  | "AJUSTABLE"
  /**
   * `>2`, o sin horas declaradas habiendo trabajo pendiente. El número pasa a
   * **detalle secundario** y el mensaje cualitativo va primero: más allá de ese
   * punto *"el dato bruto pierde capacidad de orientar por sí solo"*.
   */
  | "CRITICA"
  /**
   * ⚠️ **Falta un dato, y entonces NO se muestra una comparación cerrada.**
   * Textual: *"Mostrar «faltan datos para estimar» y pedir el dato ausente."*
   */
  | "SIN_DATOS";

export function tramoDeBrecha(r: Reparto): TramoDeBrecha {
  const requerido = totalDemandado(r);

  // Sin disponibilidad declarada o sin nada estimable, no hay comparación que
  // hacer — y una comparación a medias es peor que ninguna.
  if (requerido === null) return "SIN_DATOS";
  if (r.minutosPorSemana === null) return "SIN_DATOS";

  // «available = 0 con trabajo pendiente» es crítica por regla explícita: la
  // división no está definida y el caso sí.
  if (r.minutosPorSemana === 0) return requerido > 0 ? "CRITICA" : "ENTRA";

  const razon = requerido / r.minutosPorSemana;
  if (razon <= 1) return "ENTRA";
  return razon <= UMBRAL_DE_BRECHA_CRITICA ? "AJUSTABLE" : "CRITICA";
}

/**
 * Lo que el conjunto de materias demanda **por semana**. `null` ⇒ nada
 * estimable.
 *
 * ⚠️ **Es una tasa semanal, igual que `minutosPorSemana`**, y por eso se pueden
 * comparar. Que las dos cifras estén sobre el mismo horizonte es la corrección
 * central de [ADR-075](../../docs/decisions.md#adr-075): el cálculo ya lo
 * estaba, **la pantalla no lo decía**, y una cifra sin su unidad al lado de otra
 * que sí la tiene se lee como un total acumulado.
 */
export function totalDemandado(r: Reparto): number | null {
  return r.demandaSemanalTotal;
}
