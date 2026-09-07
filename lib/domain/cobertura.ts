/**
 * La cobertura de una materia — [ADR-072](../../docs/decisions.md#adr-072).
 *
 * ## Cobertura no es readiness, y ése es todo el punto
 *
 * | | Qué afirma | Quién lo produce |
 * |---|---|---|
 * | **Cobertura** | Cuántas de tus unidades tienen evidencia enviada | Hechos del estudiante |
 * | **Readiness** | Si estás en condiciones de rendir | `preparation_readiness` |
 *
 * [ADR-058](../../docs/decisions.md#adr-058) cerró la readiness **sin porcentaje
 * y sin predicción de aprobación**. Este módulo no la toca: no lee
 * `topic_progress.domain_value`, no compara estudiantes y no ordena nada.
 *
 * El texto que produce es el del Product Owner, literal:
 *
 * > **1 de 9 temas · 26% de las horas**
 * >
 * > *\* temas marcados por vos sobre el total cargado. No es una nota ni una
 * > predicción.*
 */

import { REGLA_DE_DURACION } from "./duracion";

/** La versión de la regla. Cambiarla **no** reescribe coberturas viejas. */
export const REGLA_DE_COBERTURA = "cobertura-v1";

/**
 * Los estados de `Evidence` que cuentan como *"trabajaste sobre este tema"*.
 *
 * ⚠️ **`EXPECTED` no está**: es una evidencia que se espera, no una que llegó.
 *
 * ⚠️ **`INSUFFICIENT` sí está, y es contraintuitivo a propósito.** La barra mide
 * **que trabajaste**, no que lo hayas hecho bien. Que una entrega no alcance es
 * una afirmación de **suficiencia**, y suficiencia no es cobertura — el mismo
 * corte que separa `preparar ≠ enviar ≠ suficiencia ≠ validación ≠ dominio`.
 * Bajarle la barra a alguien porque su entrega no alcanzó sería usarla como
 * nota, que es justo lo que la nota al pie niega.
 */
export const ESTADOS_QUE_CUENTAN = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SUFFICIENT",
  "INSUFFICIENT",
  "RESUBMISSION_REQUESTED",
  "VALIDATED",
] as const;

export type EstadoDeEvidencia = (typeof ESTADOS_QUE_CUENTAN)[number] | "EXPECTED";

export function cuentaComoTrabajado(estado: EstadoDeEvidencia): boolean {
  return (ESTADOS_QUE_CUENTAN as readonly string[]).includes(estado);
}

export interface TemaConCobertura {
  id: string;
  /** `null` = no se sabe cuánto lleva. **No es cero.** */
  minutos: number | null;
  /** Si tiene al menos una evidencia en un estado que cuenta. */
  trabajado: boolean;
}

export type Cobertura =
  | {
      estado: "OK";
      /** `0..1`, ponderada por horas. La barra se dibuja con esto. */
      fraccionDeHoras: number;
      temasTrabajados: number;
      /** Sólo los temas **con minutos conocidos**: son los del denominador. */
      temasContados: number;
      /** Los que quedaron afuera por no tener minutos. Se dice, no se esconde. */
      temasSinMinutos: number;
      regla: string;
    }
  | {
      estado: "SIN_DATOS";
      /** Llega a la pantalla: *"sin clases cargadas — no puedo estimar"*. */
      motivo: "sin_temas_declarados" | "sin_minutos_conocidos";
      /** Aunque no haya barra, el conteo de temas sí se puede mostrar. */
      temasTrabajados: number;
      temasDeclarados: number;
    };

/**
 * La cobertura de una materia.
 *
 * ⚠️ **Un tema sin minutos conocidos NO entra al denominador.** Si entrara como
 * cero, no cambiaría nada; si entrara con un valor inventado, cargar el libro de
 * temas **bajaría** la cobertura sin que el estudiante hubiera hecho nada mal.
 * Queda afuera y se declara en `temasSinMinutos`, para que la pantalla pueda
 * decir sobre cuántos está hablando.
 *
 * ⚠️ **El denominador son los temas declarados de la materia**, no el alcance de
 * la próxima evaluación. La nota al pie lo dice: *"sobre el total cargado"*.
 */
export function coberturaDeMateria(temas: readonly TemaConCobertura[]): Cobertura {
  const trabajados = temas.filter((t) => t.trabajado).length;

  if (temas.length === 0) {
    return {
      estado: "SIN_DATOS",
      motivo: "sin_temas_declarados",
      temasTrabajados: 0,
      temasDeclarados: 0,
    };
  }

  const conMinutos = temas.filter((t) => t.minutos !== null && t.minutos > 0);
  if (conMinutos.length === 0) {
    // Hay temas, pero nadie sabe cuánto llevan. El conteo se puede mostrar; la
    // barra, no — y no se rellena con un reparto parejo inventado.
    return {
      estado: "SIN_DATOS",
      motivo: "sin_minutos_conocidos",
      temasTrabajados: trabajados,
      temasDeclarados: temas.length,
    };
  }

  const total = conMinutos.reduce((a, t) => a + t.minutos!, 0);
  const cubierto = conMinutos.filter((t) => t.trabajado).reduce((a, t) => a + t.minutos!, 0);

  return {
    estado: "OK",
    fraccionDeHoras: cubierto / total,
    // El conteo es sobre **todos** los temas, no sólo los del denominador: el
    // estudiante trabajó sobre ellos aunque no sepamos cuánto duran.
    temasTrabajados: trabajados,
    temasContados: temas.length,
    temasSinMinutos: temas.length - conMinutos.length,
    regla: `${REGLA_DE_COBERTURA}+${REGLA_DE_DURACION}`,
  };
}

/**
 * El porcentaje **para mostrar**, ya redondeado.
 *
 * ⚠️ **Nunca redondea a `100` lo que no llegó, ni a `0` lo que sí empezó.** Un
 * `99,6%` mostrado como `100%` le dice al estudiante que terminó cuando no
 * terminó; un `0,4%` mostrado como `0%` borra el único trabajo que hizo.
 */
export function porcentajeDeHoras(c: Cobertura): number | null {
  if (c.estado !== "OK") return null;
  const p = c.fraccionDeHoras * 100;
  if (p > 0 && p < 1) return 1;
  if (p < 100 && p > 99) return 99;
  return Math.round(p);
}

/**
 * Los minutos que **faltan** en una materia: los de los temas sin trabajar.
 *
 * Es lo que consume el reparto entre materias
 * ([ADR-073](../../docs/decisions.md#adr-073)).
 *
 * ⚠️ **`null` cuando no se puede estimar, y eso no es cero.** Una materia sin
 * libro de temas no *"no necesita tiempo"*: no sabemos cuánto necesita, y el
 * reparto tiene que poder decir esa diferencia.
 *
 * ⚠️ **Un tema sin minutos conocidos no suma**, esté trabajado o no. Es el mismo
 * corte que el denominador de la cobertura: contarlo con un valor inventado
 * haría que cargar el libro de temas cambiara el pendiente sin que pasara nada.
 */
export function minutosPendientes(temas: readonly TemaConCobertura[]): number | null {
  const conMinutos = temas.filter((t) => t.minutos !== null && t.minutos > 0);
  if (conMinutos.length === 0) return null;
  return conMinutos.filter((t) => !t.trabajado).reduce((a, t) => a + t.minutos!, 0);
}
