import { examPreparationTransitions } from "@/lib/domain/state-machines";
import type { ExamPreparationStatus } from "@/lib/domain/types";
import type { PublicadorDeEventos } from "./eventos";
import {
  transicionarEntidad,
  type EntidadConEstado,
  type RepositorioTransicionable,
  type ResultadoDeTransicion,
} from "./transiciones";

/**
 * Service de `ExamPreparation` (Fase B5).
 *
 * Reusa `transicionarEntidad` por la misma razón que `Action` y `Commitment`:
 * leer con scoping, validar contra la máquina del dominio, escribir con
 * compare-and-swap y publicar después de ganar es la misma secuencia, y una
 * tercera copia divergiría en el orden.
 *
 * ## Lo que activar NO hace
 *
 * `product.md` §5.4 es taxativo: *"Activar produce `ACTIVE` y **nada más**: no
 * crea Action, Commitment, Evidence, Progress, protocolo completo ni
 * readiness"*. Acá se cumple literal — lo único que se escribe además del
 * estado es **qué versión del protocolo rige esta preparación**, que no es
 * crear el protocolo sino anotar contra cuál corre. Sin eso, cambiar la versión
 * vigente le reescribiría el recorrido a alguien que ya arrancó.
 */
export interface Preparacion extends EntidadConEstado<ExamPreparationStatus> {
  assessmentId: string;
  examProtocolId: string | null;
}

export interface RepositorioDePreparaciones
  extends RepositorioTransicionable<ExamPreparationStatus, Preparacion> {
  /** El protocolo vigente para la modalidad de esa evaluación, o `null`. */
  protocoloVigente(assessmentId: string): Promise<{ id: string; version: string } | null>;
  /** Agrega una vuelta al paso. La reentrancia la decide el contenido. */
  completarPaso(entrada: PasoCompletado): Promise<ResultadoDeCompletion>;
}

export interface PasoCompletado {
  institutionId: string;
  preparacionId: string;
  pasoId: string;
  /** `null` ⇒ no se trabajó sobre un tema en particular. **No es "todos"**. */
  topicId: string | null;
  confirmadoPor: string;
  claveDeIdempotencia?: string;
}

export type ResultadoDeCompletion =
  | { estado: "OK"; completionId: string; vuelta: number; duplicado: boolean }
  | { estado: "RECHAZADO"; motivo: string };

export type ResultadoDeActivacion =
  | ResultadoDeTransicion<ExamPreparationStatus, Preparacion>
  /**
   * La modalidad de la evaluación no tiene protocolo vigente. `C01-047` deja
   * `oral` fuera de P0: activar contra el protocolo de otra modalidad sería
   * darle al estudiante un recorrido que nadie diseñó para su examen.
   */
  | { estado: "SIN_PROTOCOLO" };

/**
 * `RECOMMENDED → ACTIVE`, por el CTA del estudiante.
 *
 * El spec fuente lo fija en `UX07-PO-P1-01`: *"la misma entrada produce siempre
 * `RECOMMENDED` → CTA → `ACTIVE`"*. **No existe camino que cree una preparación
 * ya activa**, y por eso esta función transiciona y no inserta: la aparición de
 * `RECOMMENDED` la produce el owner de la señal, y cuándo la produce es
 * `C01-024`, todavía abierto.
 */
export async function activar(
  deps: { repo: RepositorioDePreparaciones; eventos: PublicadorDeEventos },
  institutionId: string,
  id: string,
  actorId: string | null = null,
  ahora: () => Date = () => new Date(),
): Promise<ResultadoDeActivacion> {
  const actual = await deps.repo.porId(institutionId, id);
  if (!actual) return { estado: "NO_ENCONTRADO" };

  const protocolo = await deps.repo.protocoloVigente(actual.assessmentId);
  if (!protocolo) return { estado: "SIN_PROTOCOLO" };

  return transicionarEntidad(
    deps,
    {
      entidad: "ExamPreparation",
      transiciones: examPreparationTransitions,
      sujetoTipo: "exam_preparation",
      nombreDeEvento: nombreDeEventoDePreparacion,
      columnasPara: (_hacia, cuando) => ({
        activated_at: cuando.toISOString(),
        exam_protocol_id: protocolo.id,
      }),
    },
    institutionId,
    id,
    "ACTIVE",
    actorId,
    ahora,
  );
}

/**
 * `ACTIVE → EXAM_TAKEN | BLOCKED | ABANDONED`, y `EXAM_TAKEN → CLOSED`.
 *
 * Abandonar **conserva el historial** (`product.md` §5.4): la fila no se borra
 * y sus completions tampoco. Es la misma regla de *No Cortar* que impide editar
 * un `Commitment` `MISSED`.
 */
export function transicionar(
  deps: { repo: RepositorioDePreparaciones; eventos: PublicadorDeEventos },
  institutionId: string,
  id: string,
  hacia: ExamPreparationStatus,
  actorId: string | null = null,
  ahora: () => Date = () => new Date(),
) {
  return transicionarEntidad(
    deps,
    {
      entidad: "ExamPreparation",
      transiciones: examPreparationTransitions,
      sujetoTipo: "exam_preparation",
      nombreDeEvento: nombreDeEventoDePreparacion,
    },
    institutionId,
    id,
    hacia,
    actorId,
    ahora,
  );
}

/**
 * El nombre del evento por destino.
 *
 * `ACTIVE` produce `ExamPreparationActivated`, que es uno de los 23 del Product
 * Event Model y hasta esta fase **nadie emitía**. Los otros destinos no tienen
 * nombre en el catálogo, y no se les inventa uno: entran como eventos de nivel
 * `TRANSICION`, con la misma forma que ADR-027 fijó para los ocho del loop
 * diario.
 */
export function nombreDeEventoDePreparacion(hacia: ExamPreparationStatus): string {
  if (hacia === "ACTIVE") return "ExamPreparationActivated";
  return `ExamPreparation${hacia.charAt(0)}${hacia.slice(1).toLowerCase().replace(/_(.)/g, (_, c) => c.toUpperCase())}`;
}

/**
 * Completa un paso — **otra vez, si hace falta**.
 *
 * `ProtocolStepCompleted` era uno de los eventos `pendiente` del catálogo. Se
 * emite **por cada vuelta**, no sólo por la primera: `HUMAN-P0-01 v1.0` dice
 * que volver sobre un tema es parte del método, y un evento que sólo registrara
 * la primera pasada convertiría las siguientes en trabajo invisible.
 *
 * El payload lleva la vuelta y el tema. Repetir **no es retroceder**
 * (`product.md` §8.2) y ninguna superficie lo presenta como incumplimiento.
 */
export async function completarPaso(
  deps: { repo: RepositorioDePreparaciones; eventos: PublicadorDeEventos },
  entrada: PasoCompletado,
): Promise<ResultadoDeCompletion> {
  const resultado = await deps.repo.completarPaso(entrada);
  if (resultado.estado !== "OK" || resultado.duplicado) return resultado;

  await deps.eventos.publicar({
    nombre: "ProtocolStepCompleted",
    institutionId: entrada.institutionId,
    actorId: entrada.confirmadoPor,
    sujetoTipo: "protocol_step_completion",
    sujetoId: resultado.completionId,
    causa: `vuelta:${resultado.vuelta}`,
    payload: { pasoId: entrada.pasoId, temaId: entrada.topicId, vuelta: resultado.vuelta },
  });

  return resultado;
}
