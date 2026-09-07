/**
 * El multiplicador personal — [ADR-074](../../docs/decisions.md#adr-074).
 *
 * **Cuánto le lleva a esta persona el trabajo, comparado con lo estimado.**
 *
 * ## Lo que este módulo NO hace, y es la decisión de fondo
 *
 * **No toca la disponibilidad.** `availability` es *cuándo podés estudiar* —
 * capacidad—, y un `Commitment` cumplido es *cuándo estudiaste* — conducta.
 * Derivar lo primero de lo segundo hace que una mala semana reduzca el
 * presupuesto, y después reparta menos porque se hizo menos. Es un espiral, y
 * lo construiría el producto.
 *
 * Lo que se calibra acá es **la tarea frente a la persona**, no su vida.
 *
 * ## Y lo que tiene prohibido
 *
 * - **Bajar de `1.0`.** [ADR-070](../../docs/decisions.md#adr-070): el `1.5` es
 *   un piso. El Personal Engine puede pedir más tiempo; **no puede prometer que
 *   vas a necesitar menos.**
 * - **Comparar estudiantes.** No recibe nada de nadie más. No hay percentiles.
 * - **Mostrarse como un número sobre la persona.** *"Tardás 1,8× lo normal"* es
 *   etiquetar. Lo que se ve es el efecto —más minutos— no el coeficiente.
 */

/** La versión de la regla. Cambiarla **no** recalcula estimaciones viejas. */
export const REGLA_DE_MULTIPLICADOR = "multiplicador-v1";

/**
 * Debajo de esto no se calibra: con dos observaciones la mediana es ruido con
 * forma de dato.
 */
export const MINIMO_DE_OBSERVACIONES = 5;

/**
 * El techo, y **tiene significado**.
 *
 * Que a alguien le lleve sistemáticamente más del doble de lo estimado no es un
 * caso de calibración: es que algo más está pasando —el material no alcanza, la
 * estimación está mal, hay una dificultad que nadie miró— y eso lo tiene que ver
 * una persona, no un coeficiente que sigue creciendo.
 */
export const TECHO = 2;

export interface Observacion {
  /** Lo que el estudiante declaró que tardó. */
  minutosReales: number;
  /** La estimación de la `Action`. `null` en cualquiera de las dos ⇒ no compara. */
  estimadoMin: number | null;
  estimadoMax: number | null;
}

export type Multiplicador =
  | { estado: "CALIBRADO"; valor: number; observaciones: number; regla: string }
  | {
      estado: "SIN_HISTORIA";
      /** **`1.0`, no `null`.** Sin historia no se penaliza ni se premia a nadie. */
      valor: 1;
      observaciones: number;
      regla: string;
    };

/**
 * La estimación central de una `Action`.
 *
 * Con las dos puntas, el punto medio. Con una sola, ésa. Sin ninguna, `null`:
 * **no se inventa un rango** para poder dividir.
 */
export function estimacionCentral(o: Observacion): number | null {
  if (o.estimadoMin !== null && o.estimadoMax !== null) return (o.estimadoMin + o.estimadoMax) / 2;
  return o.estimadoMax ?? o.estimadoMin ?? null;
}

function mediana(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * El multiplicador del estudiante.
 *
 * ⚠️ **Una observación sin estimación no cuenta**, y tampoco una con minutos
 * reales en cero o negativos: no son datos malos, son datos que no comparan
 * nada.
 */
export function multiplicadorDe(observaciones: readonly Observacion[]): Multiplicador {
  const ratios: number[] = [];
  for (const o of observaciones) {
    const central = estimacionCentral(o);
    if (central === null || central <= 0) continue;
    if (!Number.isFinite(o.minutosReales) || o.minutosReales <= 0) continue;
    ratios.push(o.minutosReales / central);
  }

  if (ratios.length < MINIMO_DE_OBSERVACIONES) {
    return {
      estado: "SIN_HISTORIA",
      valor: 1,
      observaciones: ratios.length,
      regla: REGLA_DE_MULTIPLICADOR,
    };
  }

  // El piso es `1.0` y el techo es `TECHO`. El piso no es una precaución
  // numérica: es ADR-070. El techo no es una precaución tampoco — ver arriba.
  const valor = Math.min(TECHO, Math.max(1, mediana(ratios)));

  return {
    estado: "CALIBRADO",
    valor,
    observaciones: ratios.length,
    regla: REGLA_DE_MULTIPLICADOR,
  };
}

/**
 * Aplica el multiplicador a unos minutos base.
 *
 * Existe como función y no como una multiplicación suelta para que **los dos
 * factores queden separados en el código igual que en los datos**: la pantalla
 * tiene que poder explicar de dónde sale cada mitad, y un producto ya calculado
 * no se puede desarmar ([ADR-068](../../docs/decisions.md#adr-068)).
 */
export function conMultiplicador(minutosBase: number | null, m: Multiplicador): number | null {
  return minutosBase === null ? null : minutosBase * m.valor;
}
