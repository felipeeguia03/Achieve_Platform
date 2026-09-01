import { interventionTransitions } from "@/lib/domain/state-machines";
import type { InterventionStatus, ResultadoDeIntervencion } from "@/lib/domain/types";
import type { Auditor } from "./auditoria";
import type { PublicadorDeEventos } from "./eventos";
import type { DirectorioDeOperadores } from "./operadores";
import {
  transicionarEntidad,
  type EntidadConEstado,
  type RepositorioTransicionable,
} from "./transiciones";

/**
 * Service de `Intervention` — Fase B6.
 *
 * Es la mitad humana del circuito cerrado: *causa → owner → playbook → SLA →
 * intervención → outcome*. De esos seis eslabones, este Service garantiza
 * **owner** y **outcome**, y **declara faltantes** playbook y SLA — porque
 * `C01-044` es explícito, *"no se inventan valores"*, y su gate es antes del
 * piloto.
 *
 * Un playbook inventado sería una instrucción escrita por un agente sobre qué
 * hacer con un estudiante que está mal. Un SLA inventado sería una promesa de
 * tiempo de respuesta que nadie se comprometió a cumplir.
 */
export interface Intervencion extends EntidadConEstado<InterventionStatus> {
  studentId: string;
  riskSignalId: string | null;
  ownerOperatorId: string;
  ownerVerified: boolean;
  playbookId: string | null;
}

export interface AperturaDeIntervencion {
  institutionId: string;
  /** `null` ⇒ el operador intervino sin una señal previa. Es válido. */
  riskSignalId: string | null;
  studentId: string;
  ownerOperatorId: string;
  playbookId?: string | null;
  /** Si no viene y el playbook declara SLA, sale de ahí. Si no, queda `null`. */
  slaAt?: string | null;
  claveDeIdempotencia?: string;
}

export interface CierreDeIntervencion {
  institutionId: string;
  intervencionId: string;
  outcome: ResultadoDeIntervencion;
  nota?: string | null;
  registradoPor: string;
  minutosHumanos?: number | null;
}

export interface RepositorioDeIntervenciones
  extends RepositorioTransicionable<InterventionStatus, Intervencion> {
  abrir(
    entrada: AperturaDeIntervencion & { ownerVerified: boolean },
  ): Promise<{ id: string; slaAt: string | null; duplicado: boolean }>;
  /** Cierra y registra el outcome **en una transacción**. */
  cerrar(entrada: CierreDeIntervencion): Promise<{ cerrada: boolean; yaEstaba: boolean }>;
}

export type ResultadoDeApertura =
  | { estado: "OK"; intervencionId: string; slaAt: string | null; duplicado: boolean; ownerVerified: boolean }
  /** El directorio del CRM respondió que ese operador no existe. */
  | { estado: "OPERADOR_DESCONOCIDO" }
  /** La señal no está pidiendo intervención, o no existe en esa institución. */
  | { estado: "RECHAZADA"; motivo: string };

export type ResultadoDeCierre =
  | { estado: "OK"; yaEstaba: boolean }
  | { estado: "TRANSICION_PROHIBIDA"; desde: InterventionStatus }
  | { estado: "NO_ENCONTRADA" }
  | { estado: "RECHAZADA"; motivo: string };

/** `acknowledged` → `InterventionAcknowledged`. */
export function nombreDeEventoDeIntervencion(hacia: InterventionStatus): string {
  if (hacia === "closed") return "InterventionResolved";
  return `Intervention${hacia.charAt(0).toUpperCase()}${hacia.slice(1)}`;
}

/**
 * Abre una intervención con dueño.
 *
 * **El dueño se verifica contra el directorio del CRM, y hoy no hay
 * directorio.** El puerto devuelve `SIN_DIRECTORIO`, la intervención se abre
 * igual y queda marcada `ownerVerified: false`. Frenarla sería dejar el dominio
 * de la fase parado detrás de un contrato que lleva otra persona; darla por
 * verificada sería peor: el día que el contrato exista, nadie podría distinguir
 * las que se comprobaron de las que no.
 *
 * Un `DESCONOCIDO` **sí frena**: eso no es una integración que falta, es el CRM
 * diciendo que esa persona no puede tomar el caso.
 */
export async function abrir(
  deps: {
    repo: RepositorioDeIntervenciones;
    eventos: PublicadorDeEventos;
    auditor: Auditor;
    operadores: DirectorioDeOperadores;
  },
  entrada: AperturaDeIntervencion,
): Promise<ResultadoDeApertura> {
  const verificacion = await deps.operadores.verificar(
    entrada.institutionId,
    entrada.ownerOperatorId,
  );
  if (verificacion === "DESCONOCIDO") return { estado: "OPERADOR_DESCONOCIDO" };

  let abierta: { id: string; slaAt: string | null; duplicado: boolean };
  try {
    abierta = await deps.repo.abrir({ ...entrada, ownerVerified: verificacion === "CONOCIDO" });
  } catch (e) {
    // La función de base rechaza abrir sobre una señal que no pide
    // intervención. Es un rechazo de dominio, no una falla.
    return { estado: "RECHAZADA", motivo: e instanceof Error ? e.message : "no se pudo abrir" };
  }

  if (!abierta.duplicado) {
    await deps.eventos.publicar({
      nombre: "InterventionStarted",
      institutionId: entrada.institutionId,
      actorId: entrada.ownerOperatorId,
      sujetoTipo: "intervention",
      sujetoId: abierta.id,
      causa: entrada.riskSignalId ? `senal:${entrada.riskSignalId}` : "sin_senal",
    });
    await deps.auditor.registrar({
      institutionId: entrada.institutionId,
      actorId: entrada.ownerOperatorId,
      accion: "intervention.open",
      targetType: "intervention",
      targetId: abierta.id,
      // Queda registrado que el dueño no se pudo verificar, y contra qué.
      despues: { ownerVerified: verificacion === "CONOCIDO", verificacion },
    });
  }

  return {
    estado: "OK",
    intervencionId: abierta.id,
    slaAt: abierta.slaAt,
    duplicado: abierta.duplicado,
    ownerVerified: verificacion === "CONOCIDO",
  };
}

/** `open → acknowledged`. Es el momento en que una persona se hace cargo. */
export function reconocer(
  deps: { repo: RepositorioDeIntervenciones; eventos: PublicadorDeEventos; auditor: Auditor },
  institutionId: string,
  id: string,
  actorId: string,
  ahora: () => Date = () => new Date(),
) {
  return transicionarEntidad(
    deps,
    {
      entidad: "Intervention",
      transiciones: interventionTransitions,
      sujetoTipo: "intervention",
      nombreDeEvento: nombreDeEventoDeIntervencion,
      columnasPara: (_h, cuando) => ({ acknowledged_at: cuando.toISOString() }),
    },
    institutionId,
    id,
    "acknowledged",
    actorId,
    ahora,
  );
}

/**
 * `acknowledged → closed`, **con su resultado, en una sola escritura**.
 *
 * Cerrar sin outcome es el único modo real de romper el Done de esta fase —
 * *"ninguna señal queda sin outcome registrado"*—, y por eso no existe un
 * camino que lo permita: el estado y el resultado se escriben en la misma
 * transacción de base.
 *
 * **Cerrar dos veces devuelve lo de antes y no pisa el outcome.** El resultado
 * de una intervención es el registro de lo que pasó, y reescribirlo por un
 * reintento borraría el original.
 */
export async function cerrar(
  deps: { repo: RepositorioDeIntervenciones; eventos: PublicadorDeEventos; auditor: Auditor },
  entrada: CierreDeIntervencion,
): Promise<ResultadoDeCierre> {
  const actual = await deps.repo.porId(entrada.institutionId, entrada.intervencionId);
  if (!actual) return { estado: "NO_ENCONTRADA" };

  if (actual.state === "open") {
    // Falla antes de tocar la base: la máquina exige reconocerla primero.
    return { estado: "TRANSICION_PROHIBIDA", desde: actual.state };
  }

  let r: { cerrada: boolean; yaEstaba: boolean };
  try {
    r = await deps.repo.cerrar(entrada);
  } catch (e) {
    return { estado: "RECHAZADA", motivo: e instanceof Error ? e.message : "no se pudo cerrar" };
  }

  if (!r.yaEstaba) {
    await deps.eventos.publicar({
      nombre: "InterventionResolved",
      institutionId: entrada.institutionId,
      actorId: entrada.registradoPor,
      sujetoTipo: "intervention",
      sujetoId: entrada.intervencionId,
      causa: "acknowledged->closed",
      payload: { outcome: entrada.outcome },
    });
    await deps.auditor.registrar({
      institutionId: entrada.institutionId,
      actorId: entrada.registradoPor,
      accion: "intervention.close",
      targetType: "intervention",
      targetId: entrada.intervencionId,
      antes: { status: actual.state },
      despues: { status: "closed", outcome: entrada.outcome },
    });
  }

  return { estado: "OK", yaEstaba: r.yaEstaba };
}
