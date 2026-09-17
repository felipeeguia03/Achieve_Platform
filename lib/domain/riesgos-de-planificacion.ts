/**
 * **Riesgos de planificación** — [ADR-093](../../docs/decisions.md#adr-093).
 *
 * Lo que `UX01` muestra bajo *Riesgos detectados*. Cinco reglas sobre hechos
 * que ya existen: fechas de evaluación, temas cargados y su cobertura, última
 * actividad (lo que sabe el Academic Engine) y la brecha entre horas
 * declaradas y trabajo estimado (lo que sabe el Personal Engine).
 *
 * ## ⚠️ Esto NO es el Risk Engine, y la frontera importa
 *
 * `RiskSignal` es otra cosa: detecta **patrones de error** del estudiante
 * (`HP0-06-*`), se persiste, emite eventos y puede pedir una persona. Sus
 * umbrales son `C01-021`, y ese residuo **sigue abierto**. Nada de acá:
 *
 * - escribe `risk_signal` ni ninguna otra tabla — es una proyección pura;
 * - emite un evento, abre una intervención o cambia el estado general;
 * - habla de la persona. Las cinco reglas miran **el calendario y la carga**,
 *   no cómo aprende nadie: *«el sistema debe reconocer patrones, no etiquetar
 *   personas»* ([ADR-037](../../docs/decisions.md#adr-037)).
 *
 * ## Los umbrales
 *
 * Los decidió el owner el 11 de septiembre de 2026 **sin pasar por la
 * psicopedagoga**, por instrucción explícita, con los números que propuso el
 * equipo. Viven en una sola constante versionada para que cambiarlos sea una
 * línea y una versión nueva, no una búsqueda.
 *
 * ## Por qué hay una sola regla por materia
 *
 * Una materia a cuatro días, sin cobertura y sin actividad cumple dos reglas a
 * la vez, y son **la misma causa** contada dos veces (`C-02`). Se muestra la
 * más específica, en el orden de `PRECEDENCIA_POR_MATERIA`. Las encimadas y el
 * plan no son de una materia y no compiten.
 */

export const REGLAS_DE_PLANIFICACION = {
  version: "PLAN-v0.1",
  /** Más allá de este horizonte ninguna regla mira una evaluación. */
  horizonteDias: 21,
  /** `COBERTURA_BAJA_CERCA`: la evaluación está a esta distancia o menos… */
  cercaniaDias: 7,
  /** …y la cobertura (ponderada por horas, ADR-072) no llega a esta fracción. */
  coberturaMinima: 0.5,
  /** `SIN_ACTIVIDAD_CERCA`: evaluación a esta distancia o menos… */
  actividadHorizonteDias: 14,
  /** …y sin actividad registrada en esta cantidad de días o más. */
  sinActividadDias: 10,
  /** `EVALUACIONES_ENCIMADAS`: dos fechas a esta distancia o menos (mismo día o el siguiente). */
  separacionDias: 1,
} as const;

export interface MateriaParaRiesgo {
  cursadaId: string;
  nombre: string;
  /** `null` ⇒ no hay evaluación con fecha futura, y **ninguna regla la mira**. */
  evaluacion: { fecha: string; dias: number; rotulo: string | null } | null;
  /** Cuántos temas tiene cargados la materia. `0` ⇒ no se puede estimar nada. */
  temasCargados: number;
  /**
   * `0`–`1`, ponderada por horas. `null` ⇒ **no se puede calcular**, y entonces
   * la regla de cobertura no dispara: sin datos no es cero (`AGENTS.md` §2.5).
   */
  cobertura: number | null;
  /** `null` ⇒ nunca registró actividad en esta materia, que es un hecho, no un cero. */
  diasSinActividad: number | null;
}

export interface EntradaDeRiesgos {
  materias: readonly MateriaParaRiesgo[];
  /**
   * El tramo del reparto — [ADR-075](../../docs/decisions.md#adr-075) §A3.
   * `null` ⇒ no hay reparto. **Sólo `CRITICA` dispara**: el umbral de `2×` ya
   * lo fijó la psicopedagoga, así que esta regla no inventa uno nuevo.
   */
  tramoDelReparto: "ENTRA" | "AJUSTABLE" | "CRITICA" | "SIN_DATOS" | null;
}

export type Riesgo =
  | {
      regla: "EVALUACION_SIN_TEMAS";
      cursadaId: string;
      nombre: string;
      fecha: string;
      dias: number;
      rotulo: string | null;
    }
  | {
      regla: "COBERTURA_BAJA_CERCA";
      cursadaId: string;
      nombre: string;
      dias: number;
      /** `0`–`100`, redondeado. */
      porcentaje: number;
    }
  | {
      regla: "SIN_ACTIVIDAD_CERCA";
      cursadaId: string;
      nombre: string;
      dias: number;
      /** `null` ⇒ nunca registró actividad. */
      diasSinActividad: number | null;
    }
  | {
      regla: "EVALUACIONES_ENCIMADAS";
      /** La fecha de la primera del grupo. */
      fecha: string;
      dias: number;
      /** `true` ⇒ todas caen el mismo día. */
      mismoDia: boolean;
      materias: ReadonlyArray<{ cursadaId: string; nombre: string }>;
    }
  | { regla: "PLAN_NO_ENTRA" };

export type ReglaDePlanificacion = Riesgo["regla"];

/** Cuál gana cuando una materia cumple más de una: la más específica primero. */
export const PRECEDENCIA_POR_MATERIA = [
  "EVALUACION_SIN_TEMAS",
  "COBERTURA_BAJA_CERCA",
  "SIN_ACTIVIDAD_CERCA",
] as const satisfies readonly ReglaDePlanificacion[];

function riesgoDeMateria(m: MateriaParaRiesgo): Riesgo | null {
  const R = REGLAS_DE_PLANIFICACION;
  const e = m.evaluacion;
  if (e === null || e.dias < 0 || e.dias > R.horizonteDias) return null;

  if (m.temasCargados === 0) {
    return {
      regla: "EVALUACION_SIN_TEMAS",
      cursadaId: m.cursadaId,
      nombre: m.nombre,
      fecha: e.fecha,
      dias: e.dias,
      rotulo: e.rotulo,
    };
  }

  if (e.dias <= R.cercaniaDias && m.cobertura !== null && m.cobertura < R.coberturaMinima) {
    return {
      regla: "COBERTURA_BAJA_CERCA",
      cursadaId: m.cursadaId,
      nombre: m.nombre,
      dias: e.dias,
      porcentaje: Math.round(m.cobertura * 100),
    };
  }

  const sinActividad = m.diasSinActividad === null || m.diasSinActividad >= R.sinActividadDias;
  if (e.dias <= R.actividadHorizonteDias && sinActividad) {
    return {
      regla: "SIN_ACTIVIDAD_CERCA",
      cursadaId: m.cursadaId,
      nombre: m.nombre,
      dias: e.dias,
      diasSinActividad: m.diasSinActividad,
    };
  }

  return null;
}

/**
 * Agrupa las evaluaciones que caen a `separacionDias` o menos de la anterior.
 * Una cadena de tres días seguidos es **un** grupo, no dos pares.
 */
function encimadas(materias: readonly MateriaParaRiesgo[]): Riesgo[] {
  const R = REGLAS_DE_PLANIFICACION;
  const conFecha = materias
    .filter((m) => m.evaluacion !== null && m.evaluacion.dias >= 0 && m.evaluacion.dias <= R.horizonteDias)
    .map((m) => ({ m, e: m.evaluacion! }))
    .sort((a, b) => a.e.dias - b.e.dias);

  const grupos: Array<typeof conFecha> = [];
  for (const x of conFecha) {
    const ultimo = grupos.at(-1);
    const anterior = ultimo?.at(-1);
    if (ultimo && anterior && x.e.dias - anterior.e.dias <= R.separacionDias) ultimo.push(x);
    else grupos.push([x]);
  }

  return grupos
    .filter((g) => g.length >= 2)
    .map((g) => ({
      regla: "EVALUACIONES_ENCIMADAS" as const,
      fecha: g[0].e.fecha,
      dias: g[0].e.dias,
      mismoDia: g.every((x) => x.e.dias === g[0].e.dias),
      materias: g.map((x) => ({ cursadaId: x.m.cursadaId, nombre: x.m.nombre })),
    }));
}

/**
 * Las reglas, aplicadas. **El orden es por fecha, no por gravedad**: ordenar
 * por gravedad sería decidir qué riesgo pesa más, y eso no lo decidió nadie.
 * El del plan va al final porque no tiene fecha.
 */
export function riesgosDePlanificacion(e: EntradaDeRiesgos): Riesgo[] {
  const conFecha = [
    ...e.materias.map(riesgoDeMateria).filter((r): r is Riesgo => r !== null),
    ...encimadas(e.materias),
  ];
  const dias = (r: Riesgo) => ("dias" in r ? r.dias : Number.POSITIVE_INFINITY);
  // `sort` es estable: a igual fecha se conserva el orden de entrada.
  const ordenados = conFecha.sort((a, b) => dias(a) - dias(b));

  return e.tramoDelReparto === "CRITICA" ? [...ordenados, { regla: "PLAN_NO_ENTRA" }] : ordenados;
}
