import { recomendar, type ContextoDelAde, type SalidaDelAde } from "@/lib/domain/ade";
import { validarRecomendacion } from "@/lib/domain/validador-de-recomendacion";
import type { PublicadorDeEventos } from "./eventos";

/**
 * El ADE, conectado — Fase B4.
 *
 * Lee el contexto académico, llama al Engine puro y **materializa** la
 * recomendación como una `Action` con su `ActionRecommendation`.
 *
 * **La decisión sigue siendo del Engine puro.** Este Service no elige nada:
 * arma el contexto, delega y persiste. Si acá apareciera un `if` sobre qué
 * unidad conviene, la lógica estaría en dos lados.
 */
export interface RepositorioDelMotor {
  /** Todo lo que el Engine necesita, en una lectura. */
  contextoDe(institutionId: string, courseEnrollmentId: string): Promise<ContextoDelAde | null>;
  /**
   * Crea la `Action` y su `ActionRecommendation` primaria **atómicamente**.
   * Media recomendación es peor que ninguna: una Action sin razón no se puede
   * mostrar (`P-01`).
   */
  materializar(
    institutionId: string,
    courseEnrollmentId: string,
    rec: Extract<SalidaDelAde, { rama: "NEW" }>["recomendacion"],
  ): Promise<{ actionId: string } | null>;
}

export type ResultadoDelMotor =
  | { estado: "RECOMENDADA"; actionId: string }
  /** El Engine confirmó que no hay nada que proponer. Es una respuesta, no una falla. */
  | { estado: "SIN_RECOMENDACION"; motivo: "CONFIRMADA" | "CONTEXTO_INCOMPLETO"; detalle: string }
  | { estado: "CURSADA_DESCONOCIDA" }
  /** Se recomendó pero otra corrida se adelantó. No se apilan dos Actions. */
  | { estado: "CONFLICTO" }
  /**
   * **El validador la rechazó y no se publicó nada.** Es la rama `ERROR` del
   * contrato: se decidió algo y no se puede mostrar. Etapa B4.1.
   */
  | { estado: "RECHAZADA_POR_VALIDADOR"; campo: string; afirma: string; texto: string }
  /**
   * El Engine necesita algo que todavía no llegó. **La v1 determinista no la
   * produce** —no hay cálculo asincrónico ni fuente externa—, pero tiene su
   * propio estado en vez de colapsarse con `CONTEXTO_INCOMPLETO`: son cosas
   * distintas, y el día que la v2 la produzca el llamador no debe leer una por
   * la otra.
   */
  | { estado: "PENDIENTE"; detalle: string };

export async function recomendarPara(
  deps: { repo: RepositorioDelMotor; eventos: PublicadorDeEventos },
  institutionId: string,
  courseEnrollmentId: string,
  ahora: string = new Date().toISOString(),
): Promise<ResultadoDelMotor> {
  const contextoBase = await deps.repo.contextoDe(institutionId, courseEnrollmentId);
  if (!contextoBase) return { estado: "CURSADA_DESCONOCIDA" };

  const salida = recomendar({ ...contextoBase, ahora });

  if (salida.rama === "NONE") {
    // **No se materializa nada, y tampoco es un error.** `NONE` confirmado y
    // contexto incompleto son distintos, y el llamador necesita saber cuál.
    return { estado: "SIN_RECOMENDACION", motivo: salida.motivo, detalle: salida.detalle };
  }
  // Las otras dos ramas del contrato. La v1 determinista no las produce —no hay
  // fuente externa que falle ni cálculo asincrónico—, pero **cada una tiene su
  // salida**: colapsarlas en "contexto incompleto" haría que el día que la v2
  // las produzca, el llamador lea una cosa por otra.
  if (salida.rama === "PENDING") return { estado: "PENDIENTE", detalle: salida.detalle };
  if (salida.rama === "ERROR") {
    return {
      estado: "RECHAZADA_POR_VALIDADOR",
      campo: "engine",
      afirma: "el Engine no pudo decidir",
      texto: salida.detalle,
    };
  }

  /**
   * **El validador, antes de materializar** ([ADR-004](../../../docs/decisions.md#adr-004)).
   *
   * Va acá y no después de escribir porque lo que no se puede mostrar **no se
   * persiste**: una Action con una razón que afirma dominio ya es un dato malo
   * en la base aunque nadie la vea, y el próximo que la lea no va a saber que
   * estaba mal.
   *
   * Y no se publica evento: no ocurrió ningún hecho de producto. Lo que ocurrió
   * es que el Engine propuso algo impublicable, y eso lo sabe el llamador.
   */
  const validacion = validarRecomendacion(salida.recomendacion);
  if (validacion.estado === "RECHAZADA") {
    return {
      estado: "RECHAZADA_POR_VALIDADOR",
      campo: validacion.campo,
      afirma: validacion.afirma,
      texto: validacion.texto,
    };
  }

  const creada = await deps.repo.materializar(institutionId, courseEnrollmentId, salida.recomendacion);
  if (!creada) return { estado: "CONFLICTO" };

  await deps.eventos.publicar({
    nombre: "ActionRecommended",
    institutionId,
    actorId: null, // Lo produjo el Engine, no una persona.
    sujetoTipo: "action",
    sujetoId: creada.actionId,
    causa: `ade-v1:${courseEnrollmentId}`,
    // La razón va al payload porque es **contenido** del hecho, y además es lo
    // único que un día podría contener texto de una fuente externa.
    payload: { razon: salida.recomendacion.razon },
  });

  return { estado: "RECOMENDADA", actionId: creada.actionId };
}
