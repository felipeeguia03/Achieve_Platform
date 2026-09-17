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
 * Debajo de esto la calibración es **provisional**, no un patrón estable.
 *
 * [ADR-075](../../docs/decisions.md#adr-075) §B3: *"Con 5 observaciones válidas,
 * permitir calibración provisional; con menos de 10, **no describirla como
 * patrón estable**."*
 *
 * ⚠️ **El rótulo es interno.** Textual: *"no exponer ese rótulo como evaluación
 * personal"*.
 */
export const OBSERVACIONES_PARA_PATRON_ESTABLE = 10;

/**
 * Días distintos que tienen que aportar las observaciones — §B3.
 *
 * Cinco registros del mismo día son una tarde, no una tendencia.
 */
export const DIAS_DISTINTOS_MINIMOS = 3;

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
  /**
   * El día en que se registró, `YYYY-MM-DD`. Sirve para exigir **días
   * distintos** ([ADR-075](../../docs/decisions.md#adr-075) §B3): cinco
   * registros del mismo día son una tarde, no una tendencia.
   */
  dia: string;
  /**
   * El tipo general de actividad. §B3 exige que las observaciones sean **del
   * mismo tipo**: comparar una lectura con un laboratorio no compara nada.
   */
  tipo: string;
}

/**
 * Qué tan lejos está la calibración de ser un patrón — §B3.
 *
 * ⚠️ **Es interno y no se muestra.** *"No exponer ese rótulo como evaluación
 * personal."* Existe para que quien lea el dato adentro del sistema sepa cuánto
 * pesa, no para devolvérselo al estudiante.
 */
export type Confianza = "sin_historia" | "baja" | "suficiente";

export type Multiplicador =
  | {
      estado: "CALIBRADO";
      valor: number;
      observaciones: number;
      /** `baja` entre 5 y 9. **Interno**: no se le muestra al estudiante. */
      confianza: Confianza;
      regla: string;
    }
  | {
      estado: "SIN_HISTORIA";
      /** **`1.0`, no `null`.** Sin historia no se penaliza ni se premia a nadie. */
      valor: 1;
      observaciones: number;
      confianza: Confianza;
      /** Por qué no calibró. Sirve para explicarlo, no para juzgar a nadie. */
      motivo: "POCAS" | "POCOS_DIAS" | "DESACTIVADO";
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
/** Las que sí comparan algo: con estimación y con minutos reales positivos. */
export function validas(observaciones: readonly Observacion[]): Observacion[] {
  return observaciones.filter((o) => {
    const central = estimacionCentral(o);
    if (central === null || central <= 0) return false;
    return Number.isFinite(o.minutosReales) && o.minutosReales > 0;
  });
}

function ratio(o: Observacion): number {
  return o.minutosReales / estimacionCentral(o)!;
}

/**
 * El multiplicador del estudiante, **por tipo de actividad**.
 *
 * ⚠️ **Una observación sin estimación no cuenta**, y tampoco una con minutos
 * reales en cero o negativos: no son datos malos, son datos que no comparan
 * nada.
 *
 * @param activo `false` ⇒ el estudiante desactivó el ajuste (§B4). Devuelve
 *   `1.0` con motivo, **sin dejar de contar las observaciones**: apagarlo no
 *   borra la historia.
 */
export function multiplicadorDe(
  observaciones: readonly Observacion[],
  activo = true,
): Multiplicador {
  const utiles = validas(observaciones);

  if (!activo) {
    return {
      estado: "SIN_HISTORIA",
      valor: 1,
      observaciones: utiles.length,
      confianza: "sin_historia",
      motivo: "DESACTIVADO",
      regla: REGLA_DE_MULTIPLICADOR,
    };
  }

  if (utiles.length < MINIMO_DE_OBSERVACIONES) {
    return {
      estado: "SIN_HISTORIA",
      valor: 1,
      observaciones: utiles.length,
      confianza: "sin_historia",
      motivo: "POCAS",
      regla: REGLA_DE_MULTIPLICADOR,
    };
  }

  // ⚠️ **Días distintos, no sólo cantidad** — §B3. Cinco registros de una misma
  // tarde describen una tarde: *"importa tanto la calidad y comparabilidad de
  // las observaciones como la cantidad"*.
  if (new Set(utiles.map((o) => o.dia)).size < DIAS_DISTINTOS_MINIMOS) {
    return {
      estado: "SIN_HISTORIA",
      valor: 1,
      observaciones: utiles.length,
      confianza: "sin_historia",
      motivo: "POCOS_DIAS",
      regla: REGLA_DE_MULTIPLICADOR,
    };
  }

  // El piso es `1.0` y el techo es `TECHO`. El piso no es una precaución
  // numérica: es ADR-070. El techo no es una precaución tampoco — ver arriba.
  const valor = Math.min(TECHO, Math.max(1, mediana(utiles.map(ratio))));

  return {
    estado: "CALIBRADO",
    valor,
    observaciones: utiles.length,
    confianza: utiles.length >= OBSERVACIONES_PARA_PATRON_ESTABLE ? "suficiente" : "baja",
    regla: REGLA_DE_MULTIPLICADOR,
  };
}

/**
 * Agrupa por tipo de actividad — §B3: *"exigir que provengan … del mismo tipo
 * general de actividad"*.
 *
 * Comparar una lectura con un laboratorio no compara nada, y §B3 pide además
 * *"reiniciar o separar la serie cuando cambia sustancialmente el tipo de
 * tarea"*.
 */
export function porTipo(observaciones: readonly Observacion[]): Map<string, Observacion[]> {
  const m = new Map<string, Observacion[]>();
  for (const o of observaciones) m.set(o.tipo, [...(m.get(o.tipo) ?? []), o]);
  return m;
}

// ── La señal de revisión de calibración · §B2 ────────────────────────────────

/** Cuántas de las últimas cinco tienen que superar el techo. */
export const OCURRENCIAS_PARA_REVISION = 3;
/** Sobre cuántas se mira. */
export const VENTANA_DE_REVISION = 5;
/** Y en cuántos días distintos, para que no sea una sola tarde mala. */
export const DIAS_MINIMOS_PARA_REVISION = 2;

export type RevisionDeCalibracion =
  | { estado: "NO_CORRESPONDE" }
  | {
      estado: "CORRESPONDE";
      /** Cuántas de las últimas cinco superaron el techo. */
      ocurrencias: number;
      /** Las observaciones que la produjeron. §B4 exige poder verlas. */
      desdeElDia: string;
    };

/**
 * ¿Corresponde revisar la calibración? — [ADR-075](../../docs/decisions.md#adr-075) §B2.
 *
 * ⚠️ **No es una señal de riesgo del estudiante, y la diferencia no es de
 * matiz.** Textual: *"Crear una señal de **revisión de calibración**, no una
 * etiqueta de riesgo personal"*, y superar el techo una vez *"puede señalar un
 * error de estimación, una tarea mal definida, interrupciones, registro
 * inexacto, material insuficiente o ayuda no contabilizada"*.
 *
 * > *"**Psicopedagogía no debe ser el primer destino automático de un error de
 * > tiempo.**"* Primero el owner académico de la estimación; después un
 * > referente humano; evaluación psicopedagógica **sólo si convergen otras
 * > señales**.
 *
 * @param observaciones En orden cronológico. Se miran **las últimas cinco**.
 */
export function revisionDeCalibracion(
  observaciones: readonly Observacion[],
): RevisionDeCalibracion {
  const ultimas = validas(observaciones).slice(-VENTANA_DE_REVISION);
  const superan = ultimas.filter((o) => ratio(o) >= TECHO);

  if (superan.length < OCURRENCIAS_PARA_REVISION) return { estado: "NO_CORRESPONDE" };

  // *"realizadas en al menos dos días"*: una sola tarde mala no es un patrón.
  const dias = new Set(superan.map((o) => o.dia));
  if (dias.size < DIAS_MINIMOS_PARA_REVISION) return { estado: "NO_CORRESPONDE" };

  return {
    estado: "CORRESPONDE",
    ocurrencias: superan.length,
    desdeElDia: [...dias].sort()[0],
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
