/**
 * Academic Decision Engine — v1 determinista
 * ([ADR-004](../../docs/decisions.md#adr-004), `ACCEPTED (v1 provisional)`).
 *
 * Responde *"¿qué conviene hacer ahora?"*. **Puro:** sin React, sin I/O, sin
 * reloj propio. El tiempo entra como parámetro, igual que en las matrices de
 * precedencia — un Engine que lee `Date.now()` no se puede testear ni explicar.
 *
 * ⚠️ **v1 provisional.** `C01-006` sigue `OPEN`. Esta versión **no modela al
 * estudiante, no predice y no aprende**: ordena por costo de no actuar con
 * reglas escritas. Cuando el contrato se cierre, esto se reemplaza o se
 * envuelve.
 */

import { usaPesos } from "./duracion";

/** Las cuatro ramas que el spec congela. No hay una quinta. */
export type RamaDelAde = "NEW" | "NONE" | "ERROR" | "PENDING";

/**
 * `academic_context_blocker` (`C01-050`) es **semánticamente distinto de
 * `NONE`**: el primero es falta de contexto académico, el segundo es una
 * ausencia que el ADE ya confirmó. Colapsarlos le diría al estudiante "no hay
 * nada que hacer" cuando en realidad falta cargar su cursado.
 */
export type MotivoDeAusencia = "CONFIRMADA" | "CONTEXTO_INCOMPLETO";

export interface UnidadCandidata {
  topicId: string;
  nombre: string;
  /** Orden declarado en el programa. **No implica prerequisito.** */
  orden: number | null;
  /** Prerequisitos **explícitos**. Nunca derivados del orden. */
  requiere: readonly string[];
  /** `null` = no hay información. Distinto de `0`. */
  practicaValor: number | null;
  practicaEstado: "value" | "not_evaluated" | "no_information";
  dominioValor: number | null;
  dominioEstado: "value" | "not_evaluated" | "no_information";
  /** Cuándo se tocó por última vez. `null` = nunca. */
  recenciaEn: string | null;
  /**
   * Peso relativo declarado de la unidad — cuánto de la materia ocupa, y de ahí
   * cuántos minutos pide. `null` = **no declarado, y no es `1`**.
   *
   * ⚠️ **No es dificultad.** Que una unidad sea larga y que sea difícil son dos
   * afirmaciones distintas, y la segunda no la declaró nadie.
   */
  peso: number | null;
  /** Recursos disponibles para esta unidad. Sin recurso no hay acción ejecutable. */
  recursos: readonly { id: string; titulo: string }[];
}

export interface ContextoDelAde {
  courseEnrollmentId: string;
  materia: string;
  unidades: readonly UnidadCandidata[];
  /** Evaluación más próxima, si la hay. Sin fecha **no se estima**. */
  proximaEvaluacion: { titulo: string; fecha: string | null; temas: readonly string[] } | null;
  /** Minutos que el estudiante declaró tener. `null` = no declaró. */
  minutosDisponibles: number | null;
  /** ¿Ya hay una Action viva para esta cursada? El ADE no propone encima. */
  hayAccionViva: boolean;
  ahora: string;
}

/** La salida mínima que el spec exige (Parte I §9.2). Los siete campos. */
export interface RecomendacionDelAde {
  materia: string;
  topicId: string;
  objetivo: string;
  verbo: string;
  alcance: string;
  minutosMin: number;
  minutosMax: number;
  recursoId: string | null;
  evidenciaEsperada: string;
  criterioDeCierre: string;
  /** Por qué ésta. Es obligatoria: sin razón no se muestra (`P-01`). */
  razon: string;
  /**
   * Ordena, **nunca se muestra** (`P-03`). Que exista un número no autoriza a
   * pintarlo: el spec prohíbe magnitudes de máquina visibles.
   */
  prioridad: number;
}

export type SalidaDelAde =
  | { rama: "NEW"; recomendacion: RecomendacionDelAde }
  | { rama: "NONE"; motivo: MotivoDeAusencia; detalle: string }
  | { rama: "PENDING"; detalle: string }
  | { rama: "ERROR"; detalle: string };

/** Minutos por defecto cuando el estudiante no declaró disponibilidad. */
const BLOQUE_POR_DEFECTO = { min: 30, max: 45 };

/**
 * ¿Está habilitada? Una unidad con prerequisitos sin trabajar no se recomienda:
 * el spec pide prerequisitos explícitos justamente para poder respetarlos.
 */
function habilitada(u: UnidadCandidata, trabajadas: ReadonlySet<string>): boolean {
  return u.requiere.every((r) => trabajadas.has(r));
}

/**
 * Cuánto puede sumar el peso al costo · ADR-086.
 *
 * Deliberadamente **por debajo de la señal de práctica (`300`) y muy por debajo
 * de la de evaluación (`1000`)**: que una unidad sea larga inclina el orden
 * entre unidades parecidas, pero **no le gana a que otra entre en el parcial**.
 * Está a la altura de la recencia (`0..60`) porque son la misma clase de señal:
 * ajustan, no deciden.
 */
const PESO_MAXIMO_EN_EL_COSTO = 120;

/**
 * El peso de cada unidad, normalizado a `0..1` contra el más pesado de la
 * materia. Vacío si la materia no usa pesos.
 *
 * ⚠️ **Todo o nada, y la regla no se reimplementa acá:** la decide `usaPesos()`,
 * la misma que reparte los minutos en `duracion.ts`. Si el ADE y el reparto
 * discreparan sobre qué materia tiene pesos, el estudiante vería un orden
 * justificado por una duración que la otra pantalla no muestra.
 */
function pesosRelativos(unidades: readonly UnidadCandidata[]): Map<string, number> {
  if (!usaPesos(unidades.map((u) => ({ id: u.topicId, peso: u.peso })))) return new Map();
  const mayor = Math.max(...unidades.map((u) => u.peso!));
  if (!(mayor > 0)) return new Map();
  return new Map(unidades.map((u) => [u.topicId, u.peso! / mayor]));
}

/**
 * Costo de no actuar. **Más alto = más urgente.**
 *
 * Las cuatro señales son las que el spec ya distingue, y ninguna se fusiona con
 * otra en un score visible: esto ordena y muere acá adentro.
 */
function costoDeNoActuar(
  u: UnidadCandidata,
  ctx: ContextoDelAde,
  pesoRelativo: ReadonlyMap<string, number>,
): number {
  let costo = 0;

  // 1. Entra en la próxima evaluación. Es lo que más cuesta no hacer.
  if (ctx.proximaEvaluacion?.temas.includes(u.topicId)) costo += 1000;

  // 2. Nunca se practicó. `no_information` y `not_evaluated` NO son cero: son
  //    desconocido, y desconocido cerca de un examen es más caro que un valor
  //    bajo conocido.
  if (u.practicaEstado !== "value") costo += 300;
  else if (u.practicaValor !== null) costo += Math.max(0, 200 - u.practicaValor * 20);

  // 3. Hace mucho que no se toca. Sin fecha, se trata como nunca tocada.
  const dias = u.recenciaEn
    ? Math.floor((Date.parse(ctx.ahora) - Date.parse(u.recenciaEn)) / 86_400_000)
    : 999;
  costo += Math.min(dias, 60);

  // 4. Pide más tiempo · ADR-086. **Más peso, antes se arranca**: la unidad
  //    larga es la que no llega si se deja para el final, y el estudiante no
  //    puede comprimirla después. La dirección es una decisión del owner
  //    (9 sep 2026) y hay test que falla si se invierte.
  //
  //    ⚠️ Sin pesos declarados el término es **cero para todas**, no `1` para
  //    todas: una materia sin pesos se ordena exactamente como antes.
  costo += (pesoRelativo.get(u.topicId) ?? 0) * PESO_MAXIMO_EN_EL_COSTO;

  // Desempate estable por orden del programa: sin esto, dos unidades empatadas
  // cambian de recomendación entre corridas y el estudiante ve otra cosa cada
  // vez que refresca.
  costo -= (u.orden ?? 999) / 1000;
  return costo;
}

/**
 * Decide. **Una sola recomendación principal, o ninguna** — varias sin
 * principal es error de contrato, no un caso del frontend.
 */
export function recomendar(ctx: ContextoDelAde): SalidaDelAde {
  // Sin unidades no es "no hay nada que hacer": es que falta cargar el cursado.
  if (ctx.unidades.length === 0) {
    return {
      rama: "NONE",
      motivo: "CONTEXTO_INCOMPLETO",
      detalle: "La materia no tiene unidades cargadas todavía.",
    };
  }

  // Ya hay trabajo en curso: el ADE no apila acciones encima.
  if (ctx.hayAccionViva) {
    return { rama: "NONE", motivo: "CONFIRMADA", detalle: "Ya hay una acción en curso." };
  }

  const trabajadas = new Set(
    ctx.unidades.filter((u) => u.practicaEstado === "value").map((u) => u.topicId),
  );
  const elegibles = ctx.unidades.filter((u) => habilitada(u, trabajadas));

  if (elegibles.length === 0) {
    return {
      rama: "NONE",
      motivo: "CONTEXTO_INCOMPLETO",
      detalle: "Todas las unidades dependen de prerequisitos sin trabajar.",
    };
  }

  // Se calcula una vez sobre **todas** las unidades, no sobre las elegibles: el
  // peso relativo es una propiedad de la materia, y que un prerequisito bloquee
  // a la más pesada no cambia cuánto pesa el resto.
  const pesoRelativo = pesosRelativos(ctx.unidades);

  const conCosto = elegibles
    .map((u) => ({ u, costo: costoDeNoActuar(u, ctx, pesoRelativo) }))
    .sort((a, b) => b.costo - a.costo);

  const elegida = conCosto[0].u;

  // Sin recurso configurado no hay acción ejecutable. **No se inventa uno**:
  // se declara la ausencia, que es lo que `omitir, no inventar` pide.
  if (elegida.recursos.length === 0) {
    return {
      rama: "NONE",
      motivo: "CONTEXTO_INCOMPLETO",
      detalle: `«${elegida.nombre}» no tiene material configurado.`,
    };
  }

  const bloque = ctx.minutosDisponibles
    ? { min: Math.min(30, ctx.minutosDisponibles), max: ctx.minutosDisponibles }
    : BLOQUE_POR_DEFECTO;

  return {
    rama: "NEW",
    recomendacion: {
      materia: ctx.materia,
      topicId: elegida.topicId,
      objetivo: elegida.nombre,
      verbo: "Practicar",
      alcance: elegida.nombre,
      minutosMin: bloque.min,
      minutosMax: bloque.max,
      recursoId: elegida.recursos[0].id,
      evidenciaEsperada: "Producción de la práctica",
      criterioDeCierre: "Ejercicios completos y adjuntos",
      razon: razonDe(elegida, ctx),
      prioridad: Math.round(conCosto[0].costo),
    },
  };
}

/**
 * La razón que ve el estudiante. **Enuncia el hecho, no el cálculo**: nunca
 * dice "score 1240" ni "prioridad alta" (`P-03`, `C-06`).
 */
function razonDe(u: UnidadCandidata, ctx: ContextoDelAde): string {
  if (ctx.proximaEvaluacion?.temas.includes(u.topicId)) {
    return `Entra en ${ctx.proximaEvaluacion.titulo}.`;
  }
  if (u.practicaEstado !== "value") return "Todavía no registraste práctica en esta unidad.";
  if (!u.recenciaEn) return "Es la unidad que hace más tiempo no trabajás.";
  return "Consolida lo que venís trabajando.";
}
