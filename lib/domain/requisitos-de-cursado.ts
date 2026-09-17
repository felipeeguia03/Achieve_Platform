/**
 * Los requisitos de cursado de una materia — [ADR-108](../../docs/decisions.md#adr-108).
 *
 * Qué pide la cátedra para **promocionar** y para **regularizar**, y cómo viene
 * el estudiante contra cada cosa: *piden 80 %, venís 86 %, quedan 6 clases*.
 *
 * ⚠️ **Hoy todo lo que entra acá es simulado.** Achieve no tiene las condiciones
 * de la cátedra, ni asistencia, ni las notas de los parciales: los insumos salen
 * de `lib/server/simulacion/requisitos.ts` y sólo con `MODO_PRUEBA=1`. Esta
 * aritmética, en cambio, **no es simulada**: es la cuenta que se haría con datos
 * reales, y por eso vive en el dominio y tiene tests.
 *
 * ## Tres cosas que esta cuenta tiene prohibido hacer
 *
 * 1. **Leer «no rendiste» como `0`.** Un parcial sin nota es `null`, y una
 *    materia sin clases dadas no tiene asistencia: es `SIN_DATOS`, no `0 %`.
 * 2. **Dar un veredicto de la materia.** Cada requisito se evalúa solo. *¿Estás
 *    promocionando?* lo contesta la cátedra, no una suma de filas.
 * 3. **Suponer recuperatorios.** Si un parcial quedó debajo del mínimo se dice
 *    eso y nada más: qué salida tiene es regla de la cátedra, y no la tenemos.
 *
 * **Puro:** sin I/O, sin React.
 */

export type Regimen = "PROMOCION" | "REGULAR";

export type EstadoDeRequisito =
  /** Con lo que hay, lo cumple, y con margen. */
  | "CUMPLE"
  /** Todavía se puede, pero sin margen: ya está por debajo o no puede faltar más de una vez. */
  | "AJUSTADO"
  /** Con lo que queda, ya no se alcanza. */
  | "NO_ALCANZA"
  /** No hay nada que medir todavía. **No es cero.** */
  | "SIN_DATOS";

/** Lo que pide la cátedra en un régimen. Porcentajes en `0`–`100`. */
export interface CondicionesDeRegimen {
  /** La nota mínima en **cada** parcial. */
  notaMinima: number;
  /** Qué parte de los trabajos prácticos tiene que estar aprobada. */
  tpsAprobados: number;
  asistenciaTeorico: number;
  asistenciaPractico: number;
}

export interface CondicionesDeCursado {
  /** `null` ⇒ **la materia no tiene promoción**, y se dice. */
  promocion: CondicionesDeRegimen | null;
  regular: CondicionesDeRegimen;
}

export interface Asistencia {
  /** Clases del período. */
  total: number;
  /** Las que ya se dieron. */
  dadas: number;
  /** A cuántas de las dadas fue. */
  asistidas: number;
}

export interface SituacionDeCursado {
  /** En orden. `nota: null` ⇒ **todavía no se rindió**. */
  parciales: ReadonlyArray<{ nombre: string; nota: number | null }>;
  tps: {
    total: number;
    /** Los que ya tenían que estar entregados. */
    vencidos: number;
    aprobados: number;
  };
  teorico: Asistencia;
  practico: Asistencia;
}

export type FilaDeRequisito =
  | {
      tipo: "PARCIALES";
      estado: EstadoDeRequisito;
      notaMinima: number;
      parciales: ReadonlyArray<{ nombre: string; nota: number | null }>;
    }
  | {
      tipo: "TPS";
      estado: EstadoDeRequisito;
      porcentaje: number;
      total: number;
      vencidos: number;
      aprobados: number;
      /** Cuántos tienen que estar aprobados al terminar. */
      requeridos: number;
    }
  | {
      tipo: "ASISTENCIA_TEORICO" | "ASISTENCIA_PRACTICO";
      estado: EstadoDeRequisito;
      porcentaje: number;
      /** `null` ⇒ no se dio ninguna clase: no hay porcentaje. */
      venis: number | null;
      quedan: number;
      /**
       * A cuántas de las que quedan puede faltar y todavía llegar. Negativo ⇒ ya
       * no llega aunque vaya a todas.
       */
      faltasDisponibles: number;
    };

export interface RegimenEvaluado {
  regimen: Regimen;
  filas: FilaDeRequisito[];
}

export interface RequisitosDeCursado {
  /** Siempre `true` mientras los insumos sean simulados. La pantalla lo rotula. */
  simulados: true;
  /** `PROMOCION` primero, si la materia la tiene; después `REGULAR`. */
  regimenes: RegimenEvaluado[];
  /** La materia no promociona: se dice arriba de *Regular*, en vez de omitirlo en silencio. */
  sinPromocion: boolean;
}

/** Cuántos de `total` son el `porcentaje`, redondeando para arriba: 75 % de 10 son 8. */
export function necesarias(total: number, porcentaje: number): number {
  return Math.ceil((total * porcentaje) / 100 - 1e-9);
}

export function evaluarParciales(
  notaMinima: number,
  parciales: SituacionDeCursado["parciales"],
): FilaDeRequisito {
  const rendidos = parciales.filter((p) => p.nota !== null);
  const estado: EstadoDeRequisito =
    rendidos.length === 0
      ? "SIN_DATOS"
      : rendidos.some((p) => (p.nota as number) < notaMinima)
        ? "NO_ALCANZA"
        : "CUMPLE";
  return { tipo: "PARCIALES", estado, notaMinima, parciales };
}

export function evaluarTps(porcentaje: number, tps: SituacionDeCursado["tps"]): FilaDeRequisito {
  const requeridos = necesarias(tps.total, porcentaje);
  const posibles = tps.aprobados + (tps.total - tps.vencidos);
  const alDia = tps.aprobados >= necesarias(tps.vencidos, porcentaje);
  const estado: EstadoDeRequisito =
    tps.vencidos === 0
      ? "SIN_DATOS"
      : posibles < requeridos
        ? "NO_ALCANZA"
        : alDia
          ? "CUMPLE"
          : "AJUSTADO";
  return { tipo: "TPS", estado, porcentaje, total: tps.total, vencidos: tps.vencidos, aprobados: tps.aprobados, requeridos };
}

export function evaluarAsistencia(
  tipo: "ASISTENCIA_TEORICO" | "ASISTENCIA_PRACTICO",
  porcentaje: number,
  a: Asistencia,
): FilaDeRequisito {
  const quedan = Math.max(0, a.total - a.dadas);
  const faltasDisponibles = a.asistidas + quedan - necesarias(a.total, porcentaje);
  const venis = a.dadas === 0 ? null : Math.round((a.asistidas / a.dadas) * 100);
  const estado: EstadoDeRequisito =
    venis === null
      ? "SIN_DATOS"
      : faltasDisponibles < 0
        ? "NO_ALCANZA"
        : venis < porcentaje || (quedan > 0 && faltasDisponibles <= 1)
          ? "AJUSTADO"
          : "CUMPLE";
  return { tipo, estado, porcentaje, venis, quedan, faltasDisponibles };
}

export function evaluarRegimen(
  regimen: Regimen,
  c: CondicionesDeRegimen,
  s: SituacionDeCursado,
): RegimenEvaluado {
  return {
    regimen,
    filas: [
      evaluarParciales(c.notaMinima, s.parciales),
      evaluarTps(c.tpsAprobados, s.tps),
      evaluarAsistencia("ASISTENCIA_PRACTICO", c.asistenciaPractico, s.practico),
      evaluarAsistencia("ASISTENCIA_TEORICO", c.asistenciaTeorico, s.teorico),
    ],
  };
}

/** La misma situación contra los dos regímenes: lo que cambia es lo que piden. */
export function evaluarRequisitos(c: CondicionesDeCursado, s: SituacionDeCursado): RequisitosDeCursado {
  return {
    simulados: true,
    regimenes: [
      ...(c.promocion ? [evaluarRegimen("PROMOCION", c.promocion, s)] : []),
      evaluarRegimen("REGULAR", c.regular, s),
    ],
    sinPromocion: c.promocion === null,
  };
}
