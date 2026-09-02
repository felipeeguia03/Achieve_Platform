import {
  evaluarReiteracion,
  umbralDesdeConfig,
  type ObservacionDeError,
} from "@/lib/domain/reiteracion";
import type { Auditor } from "./auditoria";
import type { PublicadorDeEventos } from "./eventos";
import type { DestinoDeEscalamiento } from "./escalamiento";
import { registrarSenal, transicionar, type RepositorioDeSenales } from "./riesgo";

/**
 * El primer productor de señales del sistema — Etapa B6.5.
 *
 * ⚠️ **PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION**
 * ([ADR-036](../../../docs/decisions.md#adr-036)). Hasta acá la Fase B6 tenía un
 * guard estático que rompía si aparecía un evaluador, **y estaba bien**: el
 * guard existía para forzar que alguien cerrara `C01-021` y `C01-036` antes de
 * que un agente inventara el umbral. El Product Owner los cerró, de forma
 * provisional y explícita, y por eso este archivo puede existir.
 *
 * ## Lo que este Service no decide
 *
 * **No sabe cuántas apariciones hacen falta.** El umbral llega desde
 * `risk_rule.threshold_config`, que es configuración versionada. Si la regla
 * vigente no tiene umbral, **este Service no evalúa nada** y lo dice — no cae a
 * un default.
 *
 * **No infiere errores.** Lee observaciones que alguien registró como hechos.
 * Un error inferido no llega hasta acá: lo filtra `corroborated`.
 *
 * ## La idempotencia, y por qué la clave incluye el conteo
 *
 * *"Las señales no deben duplicarse por reprocesamiento del mismo evento o
 * evidencia."* La clave es `(preparación, tipo, apariciones)`: reprocesar la
 * misma evidencia da el mismo conteo, y por lo tanto la misma clave y la misma
 * señal. Una aparición nueva da un conteo nuevo, y ahí sí corresponde otra
 * señal — porque el mundo cambió.
 */

/** La regla vigente, tal como está guardada. */
export interface ReglaDeRiesgo {
  id: string;
  canonicalId: string;
  version: string;
  signalType: string;
  /** `null` ⇒ nadie fijó el umbral. El Service no inventa uno. */
  thresholdConfig: unknown;
}

export interface ObservacionPersistida extends ObservacionDeError {
  errorTypeId: string;
  etiqueta: string;
}

/** Un hecho a registrar. **El Service no lo deduce: lo recibe.** */
export interface ErrorObservado {
  institutionId: string;
  examPreparationId: string;
  errorTypeId: string;
  kind: "error" | "resolucion_limpia";
  corroborated: boolean;
  evidenceId?: string | null;
  topicId?: string | null;
  /** Contra qué acción correctiva ocurrió. Declarado, nunca inferido. */
  afterActionId?: string | null;
  note?: string | null;
  recordedBy?: string | null;
  claveDeIdempotencia?: string;
}

export interface RepositorioDeReiteracion {
  registrarObservacion(entrada: ErrorObservado): Promise<{ id: string; duplicado: boolean }>;
  /** La versión vigente de una regla, o `null` si no hay ninguna. */
  reglaVigente(canonicalId: string): Promise<ReglaDeRiesgo | null>;
  /** Las observaciones de un tipo dentro de una preparación, ordenadas. */
  observaciones(
    institutionId: string,
    examPreparationId: string,
    errorTypeId: string,
  ): Promise<ObservacionPersistida[]>;
  /** Datos de la preparación, para poder scopear la señal. */
  preparacion(
    institutionId: string,
    examPreparationId: string,
  ): Promise<{ studentId: string; courseEnrollmentId: string } | null>;
}

export type ResultadoDeReiteracion =
  | { estado: "SIN_UMBRAL"; motivo: string }
  | { estado: "NO_ENCONTRADA" }
  /** Se evaluó y todavía no alcanza ningún umbral. **No es un error.** */
  | { estado: "SIN_SENAL"; apariciones: number }
  | {
      estado: "OK";
      senalId: string;
      apariciones: number;
      duplicado: boolean;
      /** La señal quedó en `INTERVENTION_REQUIRED`. */
      necesitaPersona: boolean;
    };

/** La regla de `C01-036`. Un solo `canonical_id`: no se agregan otras acá. */
export const REGLA_ERROR_REITERADO = "HP0-06-1";

/**
 * Evalúa la reiteración de **un tipo de error dentro de una preparación**, y
 * registra la señal si corresponde.
 *
 * Se llama después de registrar una observación. No corre sola ni en un loop:
 * el barrido de toda una institución sería un motor general, y esta etapa
 * construye **una** regla.
 */
export async function evaluarYRegistrar(
  deps: {
    repo: RepositorioDeReiteracion;
    senales: RepositorioDeSenales;
    eventos: PublicadorDeEventos;
    auditor: Auditor;
    destino?: DestinoDeEscalamiento;
  },
  institutionId: string,
  examPreparationId: string,
  errorTypeId: string,
): Promise<ResultadoDeReiteracion> {
  const regla = await deps.repo.reglaVigente(REGLA_ERROR_REITERADO);
  if (!regla) return { estado: "NO_ENCONTRADA" };

  const umbral = umbralDesdeConfig(regla.thresholdConfig);
  if (!umbral) {
    // La regla existe y **nadie le puso umbral**. No se evalúa, y se dice.
    return {
      estado: "SIN_UMBRAL",
      motivo: `la regla ${regla.canonicalId} ${regla.version} no tiene umbral configurado`,
    };
  }

  const prep = await deps.repo.preparacion(institutionId, examPreparationId);
  if (!prep) return { estado: "NO_ENCONTRADA" };

  const observaciones = await deps.repo.observaciones(
    institutionId,
    examPreparationId,
    errorTypeId,
  );
  if (observaciones.length === 0) return { estado: "SIN_SENAL", apariciones: 0 };

  const r = evaluarReiteracion(observaciones, umbral, observaciones[0].etiqueta);
  if (r.severidad === null || r.motivo === null) {
    return { estado: "SIN_SENAL", apariciones: r.apariciones };
  }

  const registro = await registrarSenal(
    { repo: deps.senales, eventos: deps.eventos, auditor: deps.auditor },
    {
      institutionId,
      studentId: prep.studentId,
      courseEnrollmentId: prep.courseEnrollmentId,
      signalType: regla.signalType,
      severity: r.severidad,
      // La causa, en texto. Sin esto `registrarSenal` la rechaza.
      reason: r.motivo,
      sourceRef: `exam_preparation:${examPreparationId}`,
      riskRuleId: regla.id,
      // La versión que la produjo. Cambiar el umbral no reescribe esta señal.
      ruleVersion: regla.version,
      claveDeIdempotencia: `c01-021:${examPreparationId}:${errorTypeId}:${r.apariciones}`,
    },
  );

  if (registro.estado !== "OK") {
    return { estado: "SIN_SENAL", apariciones: r.apariciones };
  }

  // Y si la regla dice que hace falta una persona, la señal lo pide **acá
  // mismo**: `OPEN → INTERVENTION_REQUIRED` es directo desde
  // [ADR-034](../../../docs/decisions.md#adr-034), y quien lo declara es
  // `risk_rule`, no alguien que la haya mirado.
  //
  // El actor es `null`: **nadie apretó nada**. Lo produjo la regla.
  if (r.necesitaPersona && !registro.duplicado) {
    await transicionar(
      {
        repo: deps.senales,
        eventos: deps.eventos,
        auditor: deps.auditor,
        destino: deps.destino,
      },
      institutionId,
      registro.senalId,
      "INTERVENTION_REQUIRED",
      null,
    );
  }

  return {
    estado: "OK",
    senalId: registro.senalId,
    apariciones: r.apariciones,
    duplicado: registro.duplicado,
    necesitaPersona: r.necesitaPersona,
  };
}

/**
 * Registra el hecho y **después** evalúa. En ese orden y no al revés: evaluar
 * antes de registrar dejaría la señal contando una aparición que todavía no
 * está en la base, y un reintento la contaría dos veces.
 *
 * Una observación que la base rechaza —por ejemplo, corroborar contra una
 * evidencia que nadie evaluó— **no evalúa nada**: no hubo hecho nuevo.
 */
export async function observarError(
  deps: {
    repo: RepositorioDeReiteracion;
    senales: RepositorioDeSenales;
    eventos: PublicadorDeEventos;
    auditor: Auditor;
    destino?: DestinoDeEscalamiento;
  },
  entrada: ErrorObservado,
): Promise<
  | { estado: "RECHAZADA"; motivo: string }
  | { estado: "OK"; observacionId: string; duplicado: boolean; evaluacion: ResultadoDeReiteracion }
> {
  let registro: { id: string; duplicado: boolean };
  try {
    registro = await deps.repo.registrarObservacion(entrada);
  } catch (e) {
    return { estado: "RECHAZADA", motivo: e instanceof Error ? e.message : "no se pudo registrar" };
  }

  const evaluacion = await evaluarYRegistrar(
    deps,
    entrada.institutionId,
    entrada.examPreparationId,
    entrada.errorTypeId,
  );

  return { estado: "OK", observacionId: registro.id, duplicado: registro.duplicado, evaluacion };
}
