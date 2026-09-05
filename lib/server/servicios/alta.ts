import {
  resolverVersionDePlan,
  siguientePaso,
  RUTA_DEL_PASO,
  type PasoDelAlta,
  type PlanCandidato,
} from "@/lib/domain/alta";
import type { EstadoDelAltaEnBase, SeleccionDeRequisito } from "../repositorios/alta";
import type { PublicadorDeEventos } from "./eventos";
import type { PlanPublicado, RequisitoDelPlan } from "../repositorios/catalogo";

/**
 * Service del alta académica — Etapa B6.14.4,
 * [ADR-052](../../../docs/decisions.md#adr-052).
 *
 * Cierra el hueco que [ADR-039](../../../docs/decisions.md#adr-039) dejó
 * declarado: *"entre el `authorized: true` del CRM y la primera acción del
 * estudiante no hay ninguna pantalla definida"*.
 *
 * **No conoce la persistencia.** Recibe los repositorios por inyección, como
 * manda `architecture.md` §3.2.
 */

/** La versión de la política que el estudiante acepta o rechaza. */
export const VERSION_DE_POLITICA = "whatsapp-v1-sintetica";

export interface RepositorioDelAlta {
  estado(institutionId: string, studentId: string): Promise<EstadoDelAltaEnBase>;
  registrarConsentimiento(
    institutionId: string,
    studentId: string,
    decision: "GRANTED" | "DECLINED" | "WITHDRAWN",
    policyVersion: string,
  ): Promise<void>;
  declararCarrera(args: {
    institutionId: string;
    studentId: string;
    programId: string;
    curriculumPlanId: string;
    curriculumYear: number;
    term: string;
  }): Promise<string>;
  confirmar(args: {
    institutionId: string;
    studentId: string;
    programId: string;
    curriculumPlanId: string;
    curriculumYear: number;
    term: string;
    selecciones: SeleccionDeRequisito[];
  }): Promise<{ inscripcionId: string; cursadas: number; declaraciones: number; esPrimera: boolean }>;
  cursadasActivas(institutionId: string, studentId: string): Promise<string[]>;
}

export interface RepositorioDelCatalogo {
  planesDeCarrera(programId: string): Promise<PlanPublicado[]>;
  requisitos(
    curriculumPlanId: string,
    studentId: string,
  ): Promise<{ planId: string; requisitos: RequisitoDelPlan[] } | null>;
  duenioDelPlan(
    curriculumPlanId: string,
  ): Promise<{ institutionId: string; programId: string } | null>;
}

export interface EstadoDelAlta {
  completa: boolean;
  paso: PasoDelAlta | null;
  /** A dónde mandar al estudiante. `null` ⇒ el alta terminó. */
  siguiente: string | null;
  declaracion: EstadoDelAltaEnBase["declaracion"];
}

export async function estadoDelAlta(
  repo: RepositorioDelAlta,
  institutionId: string,
  studentId: string,
): Promise<EstadoDelAlta> {
  const base = await repo.estado(institutionId, studentId);
  const paso = siguientePaso(base);
  return {
    completa: paso === null,
    paso,
    siguiente: paso === null ? null : RUTA_DEL_PASO[paso],
    declaracion: base.declaracion,
  };
}

/**
 * La decisión sobre WhatsApp, cualquiera que sea.
 *
 * ⚠️ **Rechazar no bloquea el alta** (ADR-042 §2): *"el estudiante puede
 * rechazar u omitir WhatsApp sin perder el acceso. No recibe acompañamiento por
 * ese canal, y nada más"*.
 *
 * ⚠️ **No se emite nada al CRM.** El flujo E sigue congelado por
 * [ADR-035](../../../docs/decisions.md#adr-035), y aunque no lo estuviera, la
 * confirmación sólo puede decir *"recibimos tu solicitud"*: la Plataforma **no
 * observa** el estado del otro lado.
 */
export async function decidirWhatsapp(
  repo: RepositorioDelAlta,
  institutionId: string,
  studentId: string,
  decision: "GRANTED" | "DECLINED" | "WITHDRAWN",
): Promise<{ estado: "OK" }> {
  await repo.registrarConsentimiento(institutionId, studentId, decision, VERSION_DE_POLITICA);
  return { estado: "OK" };
}

export type ResolucionDeCarrera =
  | { estado: "OK"; planId: string; version: string }
  /** Más de una versión vigente: la elige el estudiante, no el sistema. */
  | { estado: "AMBIGUA"; planes: readonly PlanCandidato[] }
  /** La carrera no tiene plan publicado. **No se inventan materias.** */
  | { estado: "SIN_PLAN" };

/**
 * Qué versión del plan le corresponde a esta carrera.
 *
 * **No se agrega un paso que el sistema puede contestar solo.** Con una sola
 * versión publicada se infiere y se muestra para confirmar; con varias se
 * pregunta, porque elegir por el estudiante le cambiaría la carrera en silencio.
 */
export async function resolverPlan(
  catalogo: RepositorioDelCatalogo,
  programId: string,
  ahora: string,
): Promise<ResolucionDeCarrera> {
  const planes = await catalogo.planesDeCarrera(programId);
  const r = resolverVersionDePlan(planes, ahora);
  if (r.estado === "SIN_PLAN") return { estado: "SIN_PLAN" };
  if (r.estado === "AMBIGUA") return { estado: "AMBIGUA", planes: r.planes };
  return { estado: "OK", planId: r.plan.id, version: r.plan.version };
}

export type ResultadoDeDeclaracion =
  | { estado: "OK"; inscripcionId: string }
  | { estado: "PLAN_NO_DISPONIBLE" }
  /** El plan no es de la institución del estudiante. **El scoping sale de la sesión.** */
  | { estado: "OTRA_INSTITUCION" };

export async function declararCarrera(
  deps: { alta: RepositorioDelAlta; catalogo: RepositorioDelCatalogo },
  institutionId: string,
  studentId: string,
  entrada: { curriculumPlanId: string; curriculumYear: number; term: string },
): Promise<ResultadoDeDeclaracion> {
  const duenio = await deps.catalogo.duenioDelPlan(entrada.curriculumPlanId);
  // `null` cubre las dos cosas: el plan no existe, o existe y está `DRAFT`.
  if (!duenio) return { estado: "PLAN_NO_DISPONIBLE" };
  if (duenio.institutionId !== institutionId) return { estado: "OTRA_INSTITUCION" };

  const inscripcionId = await deps.alta.declararCarrera({
    institutionId,
    studentId,
    programId: duenio.programId,
    curriculumPlanId: entrada.curriculumPlanId,
    curriculumYear: entrada.curriculumYear,
    term: entrada.term,
  });
  return { estado: "OK", inscripcionId };
}

export type ResultadoDeConfirmacion =
  | {
      estado: "OK";
      inscripcionId: string;
      cursadas: number;
      declaraciones: number;
      /** Cuántas cursadas terminaron con una recomendación materializada. */
      recomendadas: number;
    }
  | { estado: "PLAN_NO_DISPONIBLE" }
  | { estado: "OTRA_INSTITUCION" }
  /** Confirmar sin ninguna materia dejaría al estudiante en un HOY vacío. */
  | { estado: "SIN_SELECCION" };

/**
 * Confirmar el mapa académico mínimo.
 *
 * El spec lo define así (§7.3): *"suficiente información para producir al menos
 * una próxima acción académica real. **No es necesario completar toda la
 * carrera** para empezar a recibir valor"*.
 *
 * ### Por qué llama al ADE, y por qué después
 *
 * **El estudiante no autoriza una recomendación:** la Plataforma reacciona a un
 * hecho de dominio que acaba de ocurrir. Es el mismo patrón que
 * [ADR-040](../../../docs/decisions.md#adr-040) ya usa — la validación cierra la
 * `Action` y **después** invoca al ADE—, y por eso se llama al Service y no a
 * `POST /api/recomendacion`, que sigue siendo secreto de servicio.
 *
 * **Después, nunca antes:** el ADE necesita la `course_enrollment` escrita para
 * tener sobre qué decidir. Y si una cursada no tiene unidades cargadas devuelve
 * `CONTEXTO_INCOMPLETO`, que **no es un error**: es el estado honesto de una
 * materia de la que todavía no se sabe nada.
 */
export async function confirmarMapaAcademico(
  deps: {
    alta: RepositorioDelAlta;
    catalogo: RepositorioDelCatalogo;
    /**
     * El ADE. Se recibe por inyección y **sólo se mira si recomendó**: qué hizo
     * cuando no, es asunto suyo y ya está escrito en su propio resultado.
     */
    recomendar: (
      institutionId: string,
      courseEnrollmentId: string,
    ) => Promise<{ estado: string }>;
    eventos: PublicadorDeEventos;
  },
  institutionId: string,
  studentId: string,
  entrada: {
    curriculumPlanId: string;
    curriculumYear: number;
    term: string;
    selecciones: SeleccionDeRequisito[];
  },
): Promise<ResultadoDeConfirmacion> {
  const duenio = await deps.catalogo.duenioDelPlan(entrada.curriculumPlanId);
  if (!duenio) return { estado: "PLAN_NO_DISPONIBLE" };
  if (duenio.institutionId !== institutionId) return { estado: "OTRA_INSTITUCION" };

  const utiles = entrada.selecciones.filter(
    (s) => s.materiaId !== undefined || (s.nombreEscrito ?? "").trim().length > 0,
  );
  if (utiles.length === 0) return { estado: "SIN_SELECCION" };

  const escrito = await deps.alta.confirmar({
    institutionId,
    studentId,
    programId: duenio.programId,
    curriculumPlanId: entrada.curriculumPlanId,
    curriculumYear: entrada.curriculumYear,
    term: entrada.term,
    selecciones: utiles,
  });

  /**
   * **`AcademicMapMinimumReached`** — el hecho que el spec §7.3 define como
   * *"suficiente información para producir al menos una próxima acción
   * académica real"*.
   *
   * Va **antes** de llamar al ADE y no después, porque no depende de que el
   * ADE encuentre algo: el mapa mínimo lo alcanza el estudiante al declarar su
   * cursado. Que después no haya nada que recomendar es otra cosa, y tiene su
   * propio estado.
   *
   * `actorId` va `null`: `product_event.actor_id` es un `uuid` sin FK a
   * `student`, y meter ahí el id del estudiante sería inventar una relación que
   * el schema no declara (`C01-030`). Quién lo causó viaja en `causa`.
   *
   * ⚠️ **Sólo la primera vez.** Reconfirmar no vuelve a alcanzar el mapa
   * mínimo: ya estaba alcanzado. `product_event` es append-only, así que dos
   * emisiones serían dos hechos donde ocurrió uno — y duplicarían las
   * activaciones en cualquier análisis del piloto.
   */
  if (escrito.esPrimera) {
    await deps.eventos.publicar({
      nombre: "AcademicMapMinimumReached",
      institutionId,
      actorId: null,
      sujetoTipo: "enrollment",
      sujetoId: escrito.inscripcionId,
      causa: `alta:${studentId}`,
      payload: { cursadas: escrito.cursadas, declaraciones: escrito.declaraciones },
    });
  }

  // El ADE, sobre cada cursada. Una que no pueda recomendar **no es un fallo
  // del alta**: el alta ya ocurrió y quedó escrita.
  let recomendadas = 0;
  for (const cursadaId of await deps.alta.cursadasActivas(institutionId, studentId)) {
    const r = await deps.recomendar(institutionId, cursadaId);
    if (r.estado === "RECOMENDADA") recomendadas++;
  }

  return { estado: "OK", ...escrito, recomendadas };
}
