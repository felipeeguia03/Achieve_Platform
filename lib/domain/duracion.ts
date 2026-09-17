/**
 * Cuántos minutos lleva cada tema — [ADR-068](../../docs/decisions.md#adr-068)
 * y [ADR-069](../../docs/decisions.md#adr-069).
 *
 * ## Por qué esto es una derivación y no una columna
 *
 * Repartir los minutos de una clase entre los temas que cubrió **no se
 * persiste**. Persistirlo congelaría una estimación como si fuera un hecho, y
 * —lo que importa más— **se volvería mentira sola**: cuando una clase posterior
 * vuelve sobre el mismo tema, el reparto anterior deja de ser correcto y nadie
 * lo recalcula.
 *
 * Mismo criterio que `topic_progress`: *"No hay columna de score agregado y no
 * se agrega."*
 *
 * ## Las dos fuentes, y qué aporta cada una
 *
 * | | De dónde | Qué aporta |
 * |---|---|---|
 * | **Observada** | `class_session.duration_min` del libro de temas | La **distribución** |
 * | **Declarada** | `course_offering.declared_total_min` del programa | El **total** |
 *
 * Con las dos, el total manda y el libro reparte. Con una sola, esa. **Con
 * ninguna no hay estimación y no se inventa una** — el mismo principio que
 * `assessment.assessment_date`: *omitir, no inventar*.
 *
 * ## Lo que este módulo no hace
 *
 * **No sabe nada del estudiante.** Esto es Academic Engine puro: qué tan largo
 * es un tema para cualquiera. El multiplicador personal se aplica después, y se
 * guarda separado para que la pantalla pueda explicar de dónde sale cada mitad.
 */

/** La versión de la regla. Cambiarla **no** reescribe estimaciones viejas. */
export const REGLA_DE_DURACION = "duracion-v1";

export type TipoDeClase = "clase" | "parcial" | "recuperatorio" | "consulta" | "no_dictada";

export interface SesionDeClase {
  /** `null` = nadie lo confirmó todavía (ADR-069). */
  tipo: TipoDeClase | null;
  /** `null` = no se sabe cuánto duró. **No es cero.** */
  minutos: number | null;
  /** Los temas que la sesión cubrió. Puede estar vacío. */
  temas: readonly string[];
}

export interface TemaDeclarado {
  id: string;
  /** `null` = no declarado. **No es `1.0`.** */
  peso: number | null;
}

export type MinutosPorTema =
  | {
      estado: "OK";
      /** Sólo los temas con minutos atribuibles. Un tema ausente **no es cero**. */
      minutos: Readonly<Record<string, number>>;
      origen: "observada" | "declarada" | "reconciliada";
      regla: string;
    }
  | {
      estado: "SIN_DATOS";
      /** Llega a la pantalla: *"sin clases cargadas — no puedo estimar"*. */
      motivo: "sin_duracion_conocida" | "sin_temas_declarados";
    };

/**
 * **Sólo `clase` aporta minutos, y `null` cuenta como clase.**
 *
 * Un parcial ocupa el aula pero no dicta tema; una consulta y un recuperatorio,
 * tampoco. Pero el 97% de las filas del corpus son clases sin confirmar, así
 * que tratar lo desconocido como no-clase perdería casi todo el tiempo de
 * cursada.
 *
 * **Se elige el error chico**: contar un parcial mal clasificado suma unos
 * minutos de más; descartar todo lo no confirmado dejaría el Gantt vacío.
 */
export function dictaTema(s: SesionDeClase): boolean {
  return s.tipo === null || s.tipo === "clase";
}

/**
 * **El peso es todo-o-nada por materia.**
 *
 * Si alguna unidad tiene peso declarado y otra no, la materia se trata como sin
 * pesos. Un peso faltante no es `1.0`: es ausencia de dato, y mezclar
 * declarados con defaults produce un reparto que **parece medido y no lo es**.
 */
export function usaPesos(temas: readonly TemaDeclarado[]): boolean {
  return temas.length > 0 && temas.every((t) => t.peso !== null && t.peso > 0);
}

/** El peso efectivo de cada tema: el declarado, o `1` parejo para todos. */
function pesos(temas: readonly TemaDeclarado[]): Map<string, number> {
  const conPesos = usaPesos(temas);
  return new Map(temas.map((t) => [t.id, conPesos ? t.peso! : 1]));
}

/**
 * Los minutos de una sesión, repartidos entre los temas que cubrió.
 *
 * ⚠️ **Una sesión sin temas no reparte nada, y sus minutos no se pierden en
 * otro lado.** Es tiempo de clase que no se puede atribuir: inventarle un
 * destino sería exactamente lo que el modelo evita.
 */
function repartir(
  s: SesionDeClase,
  peso: Map<string, number>,
  acumulador: Map<string, number>,
): void {
  if (!dictaTema(s) || s.minutos === null || s.temas.length === 0) return;

  // Sólo entre los temas que la materia declara. Un `class_session_topic` que
  // apunta a un tema de otra comisión no reparte.
  const destinos = s.temas.filter((t) => peso.has(t));
  if (destinos.length === 0) return;

  const total = destinos.reduce((a, t) => a + peso.get(t)!, 0);
  for (const t of destinos) {
    acumulador.set(t, (acumulador.get(t) ?? 0) + (s.minutos * peso.get(t)!) / total);
  }
}

/**
 * Los minutos de clase que le corresponden a cada tema de una materia.
 *
 * @param temas        Las unidades **declaradas** de la materia.
 * @param sesiones     Las sesiones del libro de temas.
 * @param totalDeclarado La carga horaria del programa, en minutos. `null` si no la hay.
 */
export function minutosPorTema(
  temas: readonly TemaDeclarado[],
  sesiones: readonly SesionDeClase[],
  totalDeclarado: number | null = null,
): MinutosPorTema {
  if (temas.length === 0) return { estado: "SIN_DATOS", motivo: "sin_temas_declarados" };

  const peso = pesos(temas);
  const observado = new Map<string, number>();
  for (const s of sesiones) repartir(s, peso, observado);

  const sumaObservada = [...observado.values()].reduce((a, b) => a + b, 0);

  // Sin ninguna de las dos fuentes no hay estimación. **No se devuelve cero**:
  // una barra vacía por falta de datos y una por falta de trabajo no son lo
  // mismo, y quien lea esto tiene que poder distinguirlas.
  if (sumaObservada === 0 && totalDeclarado === null) {
    return { estado: "SIN_DATOS", motivo: "sin_duracion_conocida" };
  }

  // Sólo el total: se reparte entre las unidades declaradas, por peso.
  if (sumaObservada === 0) {
    const totalPesos = temas.reduce((a, t) => a + peso.get(t.id)!, 0);
    return {
      estado: "OK",
      origen: "declarada",
      regla: REGLA_DE_DURACION,
      minutos: Object.fromEntries(
        temas.map((t) => [t.id, (totalDeclarado! * peso.get(t.id)!) / totalPesos]),
      ),
    };
  }

  // Sólo el libro: la suma observada, tal cual.
  if (totalDeclarado === null) {
    return {
      estado: "OK",
      origen: "observada",
      regla: REGLA_DE_DURACION,
      minutos: Object.fromEntries(observado),
    };
  }

  // Las dos: el total manda y el libro reparte.
  //
  // ⚠️ **El denominador es lo atribuible, no todo lo observado.** Una sesión sin
  // temas no participa del reparto, y si contara en el denominador cada tema
  // recibiría menos de lo que le toca — una dilución silenciosa que nadie
  // podría explicar mirando la pantalla.
  return {
    estado: "OK",
    origen: "reconciliada",
    regla: REGLA_DE_DURACION,
    minutos: Object.fromEntries(
      [...observado].map(([t, m]) => [t, (totalDeclarado * m) / sumaObservada]),
    ),
  };
}

/**
 * El total atribuible de una materia. `null` cuando no hay estimación.
 *
 * Existe separado porque la pantalla lo necesita sin recorrer los temas, y
 * porque **sumar `minutos` afuera invitaría a tratar el `SIN_DATOS` como `0`**.
 */
export function minutosDeLaMateria(r: MinutosPorTema): number | null {
  if (r.estado !== "OK") return null;
  return Object.values(r.minutos).reduce((a, b) => a + b, 0);
}

// ── El factor de estudio · ADR-075 §D ────────────────────────────────────────
//
// > *"No encontré respaldo para afirmar que **1,5 horas de estudio autónomo por
// > cada hora de clase** sea una constante psicopedagógica universal."*
//
// La psicopedagoga trajo además la normativa: la Resolución 2598/2023 define el
// Crédito de Referencia del Estudiante en 25–30 horas por crédito y **no
// prescribe una relación fija de 1,5 a 1** entre trabajo autónomo y clase.
//
// El `1,5` deja de ser **el** número y pasa a ser **el último recurso**.

/**
 * El fallback, y sólo eso.
 *
 * ⚠️ **No es una constante con respaldo.** Se usa cuando no hay nada mejor, y
 * cada estimación guarda que se usó éste para poder auditarlo después.
 */
export const FACTOR_DE_ESTUDIO_FALLBACK = 1.5;

/**
 * De dónde salió el factor — el orden que fijó §D.
 *
 * ⚠️ **Dos de los cuatro escalones de la respuesta no viven acá, y conviene
 * decir dónde sí**, para que no parezca que se omitieron:
 *
 * - *"estimación por actividad concreta"* ya existe: son
 *   `action.estimated_minutes_min/max`, que produce el ADE por Action. Este
 *   módulo estima **temas**, no tareas.
 * - *"mediana histórica de actividades comparables"* ya existe: es el
 *   multiplicador de [ADR-074](../../docs/decisions.md#adr-074), y se aplica
 *   **aparte**. Plegarlo acá lo contaría dos veces.
 */
export type FuenteDelFactor =
  /** La cátedra declaró cuántas horas de trabajo autónomo espera. Manda. */
  | "institucional"
  /** No hay nada mejor. Es el `1,5`, y se rotula como lo que es. */
  | "fallback";

export interface FactorDeEstudio {
  valor: number;
  fuente: FuenteDelFactor;
  /** El texto literal que lo respalda, cuando lo hay. §D: *"guardar siempre la fuente"*. */
  respaldo: string | null;
  regla: string;
}

/**
 * Cuántos minutos de estudio por minuto de clase.
 *
 * @param estudioDeclarado Minutos de trabajo autónomo que declara la cátedra.
 * @param claseDeclarada   Minutos de clase sobre los que se declaran.
 */
export function factorDeEstudio(
  estudioDeclarado: { minutos: number; texto: string } | null,
  claseDeclarada: number | null,
): FactorDeEstudio {
  if (estudioDeclarado && claseDeclarada && claseDeclarada > 0) {
    return {
      valor: estudioDeclarado.minutos / claseDeclarada,
      fuente: "institucional",
      respaldo: estudioDeclarado.texto,
      regla: REGLA_DE_DURACION,
    };
  }
  return {
    valor: FACTOR_DE_ESTUDIO_FALLBACK,
    fuente: "fallback",
    // Sin respaldo, y **eso es el dato**: que nadie lo declaró.
    respaldo: null,
    regla: REGLA_DE_DURACION,
  };
}

/**
 * Minutos de clase → minutos de estudio.
 *
 * Función aparte, y por el mismo motivo que `conMultiplicador`: los factores se
 * aplican de a uno y en su lugar, para que la pantalla pueda explicar de dónde
 * sale cada mitad ([ADR-068](../../docs/decisions.md#adr-068)).
 */
export function minutosDeEstudio(minutosDeClase: number | null, f: FactorDeEstudio): number | null {
  return minutosDeClase === null ? null : minutosDeClase * f.valor;
}
