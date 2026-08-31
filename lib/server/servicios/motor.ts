import { recomendar, type ContextoDelAde, type SalidaDelAde } from "@/lib/domain/ade";
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
  | { estado: "CONFLICTO" };

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
  // `ERROR` y `PENDING` no los produce la v1 determinista: no hay fuente
  // externa que falle ni cálculo asincrónico. Quedan en el tipo porque el
  // contrato los exige y la v2 los va a usar.
  if (salida.rama !== "NEW") {
    return { estado: "SIN_RECOMENDACION", motivo: "CONTEXTO_INCOMPLETO", detalle: salida.detalle };
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
