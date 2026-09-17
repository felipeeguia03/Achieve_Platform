import { riskSignalTransitions } from "@/lib/domain/state-machines";
import type { RiskSignalStatus, SeveridadDeRiesgo } from "@/lib/domain/types";
import type { Auditor } from "./auditoria";
import type { DestinoDeEscalamiento } from "./escalamiento";
import type { PublicadorDeEventos } from "./eventos";
import {
  transicionarEntidad,
  type EntidadConEstado,
  type RepositorioTransicionable,
  type ResultadoDeTransicion,
} from "./transiciones";

/**
 * Service de `RiskSignal` — Fase B6.
 *
 * ## Lo que este Service NO hace, y es la decisión central de la fase
 *
 * **No decide que hay riesgo.** No hay una función que mire el mundo y produzca
 * señales: `C01-021` —Risk Engine v1 y sujeto de `RiskSignal`— sigue `OPEN`, y
 * las tres situaciones que `HUMAN-P0-06 v1.0` nombró están cargadas como
 * configuración **con sus umbrales sin fijar** (`C01-036`, y es de la
 * psicopedagoga). Lo que hay acá es la persistencia de una señal que su owner
 * ya produjo, con su razón y con la versión de la regla que la produjo.
 *
 * Es el mismo reparto que en la B3 con el progreso: *el Service recibe el
 * resultado; no decide que hubo progreso*. Y por el mismo motivo — inventar el
 * umbral sería inventar cuándo se le dice a una persona que un estudiante está
 * en problemas.
 *
 * ## Lo que sí garantiza
 *
 * **Que ninguna señal exista sin causa legible.** `reason` es obligatoria acá y
 * en la base, y el spec lo pide dos veces: *"nunca un score opaco como única
 * salida"*, *"toda señal de riesgo relevante debe mostrar causas operables"*.
 */
export interface Senal extends EntidadConEstado<RiskSignalStatus> {
  studentId: string;
  severity: SeveridadDeRiesgo;
  reason: string;
  /** Contexto estructurado para la persona; nunca reemplaza la causa legible. */
  reviewContext: Record<string, unknown>;
}

/** Una señal detectada por su owner. **El Service no la deduce: la recibe.** */
export interface SenalDetectada {
  institutionId: string;
  studentId: string;
  courseEnrollmentId?: string | null;
  signalType: string;
  severity: SeveridadDeRiesgo;
  /** Por qué. Sin esto no hay señal — ni acá ni en la base. */
  reason: string;
  sourceRef?: string | null;
  /** Contra qué regla se detectó, y en qué versión. */
  riskRuleId?: string | null;
  ruleVersion?: string | null;
  validUntil?: string | null;
  /** `I8` del lado del servidor: reintentar no duplica la señal. */
  claveDeIdempotencia?: string;
  reiterationEpisodeId?: string | null;
  reviewContext?: Record<string, unknown>;
}

export interface RepositorioDeSenales
  extends RepositorioTransicionable<RiskSignalStatus, Senal> {
  registrar(entrada: SenalDetectada): Promise<{ id: string; duplicado: boolean }>;
  /** `RESOLVED` con su condición: exige una intervención con outcome. */
  resolver(
    institutionId: string,
    id: string,
  ): Promise<{ resuelta: boolean; motivo: string | null }>;
}

export type ResultadoDeSenal =
  | { estado: "OK"; senalId: string; duplicado: boolean }
  | { estado: "RECHAZADA"; motivo: string };

export type ResultadoDeResolucion =
  | { estado: "OK" }
  /**
   * La señal no llegó a resolverse **porque nadie registró un outcome**. No es
   * un error del sistema: es el circuito diciendo que todavía no cerró.
   */
  | { estado: "SIN_OUTCOME"; motivo: string };

const MARCA_DE_TIEMPO: Partial<Record<RiskSignalStatus, string>> = {
  // Legacy (ADR-034): ningún escritor nuevo llega acá. Se conserva porque la
  // columna existe y las filas que la tienen siguen siendo válidas.
  ACKNOWLEDGED: "acknowledged_at",
  ESCALATED: "escalated_at",
  EXPIRED: "expired_at",
};

/** `ACKNOWLEDGED` → `RiskSignalAcknowledged`. Lo usa el guard del catálogo. */
export function nombreDeEventoDeSenal(hacia: RiskSignalStatus): string {
  const camel = hacia
    .toLowerCase()
    .replace(/_(.)/g, (_, c: string) => c.toUpperCase());
  return `RiskSignal${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
}

/**
 * Persiste una señal que su owner ya produjo.
 *
 * **Rechaza la señal sin razón antes de tocar la base.** Podría dejárselo al
 * `NOT NULL`, y no: un `500` de Postgres no explica que lo que falta es la
 * explicabilidad, que es una regla de producto y no una restricción técnica.
 */
export async function registrarSenal(
  deps: { repo: RepositorioDeSenales; eventos: PublicadorDeEventos; auditor: Auditor },
  entrada: SenalDetectada,
): Promise<ResultadoDeSenal> {
  if (entrada.reason.trim() === "") {
    return {
      estado: "RECHAZADA",
      motivo: "una señal sin causa legible no es una señal: es un score opaco",
    };
  }

  const { id, duplicado } = await deps.repo.registrar(entrada);

  // Un duplicado no vuelve a publicar el hecho: el hecho ocurrió una vez.
  if (!duplicado) {
    await deps.eventos.publicar({
      nombre: "RiskSignalCreated",
      institutionId: entrada.institutionId,
      // Ninguna persona la creó: la produjo el owner de la señal.
      actorId: null,
      sujetoTipo: "risk_signal",
      sujetoId: id,
      causa: entrada.signalType,
      payload: { severidad: entrada.severity, regla: entrada.riskRuleId ?? null },
    });
    await deps.auditor.registrar({
      institutionId: entrada.institutionId,
      actorId: null,
      accion: "risk_signal.create",
      targetType: "risk_signal",
      targetId: id,
      despues: { signalType: entrada.signalType, severity: entrada.severity },
    });
  }

  return { estado: "OK", senalId: id, duplicado };
}

/**
 * Mueve una señal de estado.
 *
 * **Dos destinos no entran por acá, y por motivos distintos.**
 *
 * `RESOLVED` tiene su propia función, porque tiene una condición que la máquina
 * no puede expresar: exige una intervención con outcome.
 *
 * `ACKNOWLEDGED` quedó **legacy** con [ADR-034](../../../docs/decisions.md#adr-034),
 * y se excluye **del tipo**: ningún escritor nuevo puede pedirlo, ni por error
 * ni por refactor. Que el operador se hizo cargo es un hecho de la
 * `Intervention`, y tiene su propio estado desde la B6. Las filas históricas
 * **salen** de `ACKNOWLEDGED` sin problema — lo prohibido es entrar.
 */
export async function transicionar(
  deps: {
    repo: RepositorioDeSenales;
    eventos: PublicadorDeEventos;
    auditor: Auditor;
    /**
     * Adónde va el caso cuando la señal pide una persona — B6.6.3.
     *
     * Opcional a propósito: **que no haya destino no puede impedir que una
     * señal pida ayuda.** El circuito de dominio ya cerraba sin esto.
     */
    destino?: DestinoDeEscalamiento;
  },
  institutionId: string,
  id: string,
  hacia: Exclude<RiskSignalStatus, "RESOLVED" | "ACKNOWLEDGED">,
  actorId: string | null = null,
  ahora: () => Date = () => new Date(),
): Promise<ResultadoDeTransicion<RiskSignalStatus, Senal>> {
  const resultado = await transicionarEntidad(
    deps,
    {
      entidad: "RiskSignal",
      transiciones: riskSignalTransitions,
      sujetoTipo: "risk_signal",
      nombreDeEvento: nombreDeEventoDeSenal,
      columnasPara: (h, cuando) => {
        const col = MARCA_DE_TIEMPO[h];
        return col ? { [col]: cuando.toISOString() } : {};
      },
    },
    institutionId,
    id,
    hacia,
    actorId,
    ahora,
  );

  if (resultado.estado === "OK") {
    await deps.auditor.registrar({
      institutionId,
      actorId,
      accion: "risk_signal.transition",
      targetType: "risk_signal",
      targetId: id,
      despues: { status: hacia },
    });

    // El caso sale hacia donde sea que vaya — B6.6.3.
    //
    // Va **acá y no en el llamador** para que todo camino que llegue a
    // `INTERVENTION_REQUIRED` escale, incluido el que todavía no existe. Un
    // segundo camino que no encolara sería un caso que pide una persona y no
    // llega a ninguna cola.
    //
    // Sólo en la transición: la señal **entra** una vez a ese estado, y el
    // compare-and-swap garantiza que dos escrituras simultáneas no la muevan
    // dos veces. Y el destino además es idempotente por señal.
    if (hacia === "INTERVENTION_REQUIRED" && deps.destino) {
      await deps.destino.escalar({
        institutionId,
        riskSignalId: id,
        studentId: resultado.entidad.studentId,
        // La causa que ya registró la señal. **No se reescribe.**
        explanation: resultado.entidad.reason,
        reviewContext: resultado.entidad.reviewContext,
      });
    }
  }

  return resultado;
}

/**
 * `INTERVENTION_REQUIRED → RESOLVED`, **si hubo una intervención con outcome**.
 *
 * La condición no vive en la máquina de estados porque la máquina mira una fila
 * y esto mira dos tablas. Vive en la función de base, en una transacción, y acá
 * se traduce a un resultado que la superficie puede mostrar: *"todavía no
 * cerró"* no es un `500`.
 */
export async function resolver(
  deps: { repo: RepositorioDeSenales; eventos: PublicadorDeEventos; auditor: Auditor },
  institutionId: string,
  id: string,
  actorId: string | null = null,
): Promise<ResultadoDeResolucion> {
  const r = await deps.repo.resolver(institutionId, id);
  if (!r.resuelta) {
    return { estado: "SIN_OUTCOME", motivo: r.motivo ?? "la señal no se pudo resolver" };
  }

  await deps.eventos.publicar({
    nombre: nombreDeEventoDeSenal("RESOLVED"),
    institutionId,
    actorId,
    sujetoTipo: "risk_signal",
    sujetoId: id,
    causa: "INTERVENTION_REQUIRED->RESOLVED",
  });
  await deps.auditor.registrar({
    institutionId,
    actorId,
    accion: "risk_signal.resolve",
    targetType: "risk_signal",
    targetId: id,
    despues: { status: "RESOLVED" },
  });

  return { estado: "OK" };
}
