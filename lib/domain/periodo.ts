/**
 * El período académico — [ADR-061](../../docs/decisions.md#adr-061), decidido por
 * el Product Owner el 5 de septiembre de 2026.
 *
 * ## Tres conceptos que dejan de ser uno
 *
 * El owner los separó textualmente, y este módulo existe para que no se vuelvan
 * a juntar:
 *
 * | Concepto | Qué es | Dónde vive |
 * |---|---|---|
 * | **Año lectivo** | `2026` | `enrollment.academic_year` |
 * | **Semestre del estudiante** | en cuál está cursando **ahora** | `enrollment.semester` |
 * | **Período de dictado** | en cuál se dicta **una materia del plan** | `curriculum_requirement.term` + `is_annual` |
 *
 * ⚠️ **La anualidad no es un tercer valor del semestre del estudiante.** Textual:
 * *"una persona puede estar en el segundo semestre y cursar simultáneamente
 * materias anuales"*. Es una propiedad de la materia, y una anual **aparece en
 * los dos semestres del mismo año lectivo**.
 *
 * ## Por qué hay un normalizador y no un `trim().toUpperCase()`
 *
 * > *"Debe evitar que valores como `1`, `primer semestre`, `2026-1` y `S1`
 * > representen el mismo concepto de maneras diferentes."*
 *
 * Los CSV administrativos vienen como vienen. La regla es **normalizar en la
 * entrada y guardar un solo valor canónico**, y **rechazar** lo que no se
 * reconoce en vez de adivinarlo — que es la misma regla de *omitir, no inventar*
 * aplicada a un parser.
 */

/** El semestre en el que cursa el estudiante. Vocabulario cerrado. */
export type Semestre = "FIRST_SEMESTER" | "SECOND_SEMESTER";

/**
 * El período en el que **el plan dicta una materia**.
 *
 * `ANNUAL` **no se guarda en `term`**: se guarda como `is_annual = true` con
 * `term` en `NULL`, y hay `CHECK` en la base. Acá es un valor del tipo porque el
 * importador necesita nombrarlo antes de traducirlo a esas dos columnas.
 */
export type PeriodoDeDictado = Semestre | "ANNUAL";

export const SEMESTRES: readonly Semestre[] = ["FIRST_SEMESTER", "SECOND_SEMESTER"] as const;

/** Las grafías que un CSV administrativo puede traer, y su valor canónico. */
const GRAFIAS: ReadonlyMap<string, PeriodoDeDictado> = new Map([
  ["1", "FIRST_SEMESTER"],
  ["s1", "FIRST_SEMESTER"],
  ["1c", "FIRST_SEMESTER"],
  ["primer semestre", "FIRST_SEMESTER"],
  ["primer cuatrimestre", "FIRST_SEMESTER"],
  ["first_semester", "FIRST_SEMESTER"],
  ["2", "SECOND_SEMESTER"],
  ["s2", "SECOND_SEMESTER"],
  ["2c", "SECOND_SEMESTER"],
  ["segundo semestre", "SECOND_SEMESTER"],
  ["segundo cuatrimestre", "SECOND_SEMESTER"],
  ["second_semester", "SECOND_SEMESTER"],
  ["anual", "ANNUAL"],
  ["annual", "ANNUAL"],
]);

/**
 * El período de dictado que declara una fila de plan. `null` ⇒ **no se reconoce
 * y no se adivina**: quien llama decide si eso es un dato ausente o un error.
 *
 * ⚠️ **`'2026-1'` se rechaza a propósito.** Es una **clave de período
 * calendario** —año lectivo más semestre—, no un período de dictado. Aceptarlo
 * acá sería exactamente la confusión que ADR-061 vino a cerrar: la fila del plan
 * dice *"esta materia se dicta en el primer semestre"*, **de cualquier año**.
 */
export function normalizarPeriodoDeDictado(
  entrada: string | null | undefined,
): PeriodoDeDictado | null {
  if (entrada === null || entrada === undefined) return null;
  const clave = entrada.trim().toLowerCase();
  if (clave === "") return null;
  return GRAFIAS.get(clave) ?? null;
}

/**
 * La clave textual de un período calendario: `'2026-2'`.
 *
 * Existe porque `enrollment.term` y `course_offering.term` la usan desde la Fase
 * B1 y **este corte no las retira** — hay `UNIQUE (student_id, program_id, term)`
 * detrás—. El año y el semestre viven además en columnas propias; esto es la
 * forma compuesta, y **se deriva de ellas para que no puedan discrepar**.
 */
export function claveDePeriodo(anio: number, semestre: Semestre): string {
  return `${anio}-${semestre === "FIRST_SEMESTER" ? 1 : 2}`;
}

/** El inverso. `null` ⇒ la clave no tiene esa forma; no se completa nada. */
export function leerClaveDePeriodo(
  term: string | null | undefined,
): { anio: number; semestre: Semestre } | null {
  const m = /^(\d{4})-([12])$/.exec((term ?? "").trim());
  if (!m) return null;
  return { anio: Number(m[1]), semestre: m[2] === "1" ? "FIRST_SEMESTER" : "SECOND_SEMESTER" };
}

/**
 * ¿Esta fila del plan se cursa en el semestre en el que está el estudiante?
 *
 * **Una anual, sí — en los dos.** Y una fila **sin período declarado también**:
 * `term` en `NULL` significa *"no sabemos en qué semestre se dicta"*, que es el
 * estado del Plan 2016 por [ADR-053](../../docs/decisions.md#adr-053).
 * Ocultarla convertiría una ausencia de dato en una afirmación —*"no se dicta
 * ahora"*— que nadie hizo.
 */
export function seDictaEn(
  fila: { periodo: Semestre | null; esAnual: boolean },
  semestre: Semestre,
): boolean {
  if (fila.esAnual) return true;
  if (fila.periodo === null) return true;
  return fila.periodo === semestre;
}
