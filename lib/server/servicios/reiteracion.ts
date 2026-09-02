import {
  evaluarReiteracion,
  umbralDesdeConfig,
  type CalidadDeEvidencia,
  type ConfianzaDeClasificacion,
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
  /**
   * Categoría secundaria (`9.5`). **No cuenta**: es contexto para la persona
   * que recibe el caso, no un segundo contador.
   */
  secondaryErrorTypeId?: string | null;
  /**
   * El objetivo de aprendizaje o demanda (`9.1`, B6.7.2). **Es la cuarta
   * dimensión de la unidad de conteo**, y sin él no hay comparabilidad que
   * afirmar.
   */
  learningObjectiveId?: string | null;
  /** `9.6`. Obligatoria cuando la observación se corrobora. */
  evidenceQuality?: CalidadDeEvidencia | null;
  errorIdentifiable?: boolean | null;
  classificationConfidence?: ConfianzaDeClasificacion | null;
  /** Contexto de `9.1`. **No entra al contador.** */
  taskFormat?: string | null;
  supportOffered?: string | null;
  correctionDelivered?: boolean | null;
  correctionAccessible?: boolean | null;
  learnerEngaged?: boolean | null;
  newIndependentAttempt?: boolean | null;
  sameErrorConfidence?: ConfianzaDeClasificacion | null;
  attemptIdentity?: string | null;
  equivalentNotIdentical?: boolean | null;
  spacedOrNoImmediateModel?: boolean | null;
  note?: string | null;
  recordedBy?: string | null;
  claveDeIdempotencia?: string;
}

/**
 * Una familia de error, tal como la declara el vocabulario **vigente** —
 * B6.7.1, `9.5`.
 *
 * `esFamilia = false` es 'clasificación incierta': está en el catálogo porque
 * *"no se pudo determinar"* **es una respuesta**, y no cuenta.
 */
export interface FamiliaDeError {
  canonicalId: string;
  /** El rótulo de la versión vigente. Es el que se le muestra a una persona. */
  label: string;
  esFamilia: boolean;
}

/** Una corrección humana de la clasificación de una observación (`9.5`). */
export interface CorreccionDeClasificacion {
  institutionId: string;
  observacionId: string;
  aTipoDeErrorId: string;
  aSecundariaId?: string | null;
  /** Obligatorio: una reclasificación sin motivo no se puede auditar. */
  motivo: string;
  /** Identidad externa. **Quién puede corregir sigue sin definirse.** */
  corregidoPor?: string | null;
}

/** Una necesidad de apoyo. **No es un error y no evalúa nada** (`9.5`). */
export interface NecesidadDeApoyo {
  institutionId: string;
  examPreparationId: string;
  supportNeedTypeId: string;
  evidenceId?: string | null;
  topicId?: string | null;
  note?: string | null;
  recordedBy?: string | null;
  claveDeIdempotencia?: string;
}

export interface RepositorioDeReiteracion {
  registrarObservacion(entrada: ErrorObservado): Promise<{ id: string; duplicado: boolean }>;
  /** La versión vigente de una regla, o `null` si no hay ninguna. */
  reglaVigente(canonicalId: string): Promise<ReglaDeRiesgo | null>;
  /** A qué familia pertenece una fila del catálogo, sea de la versión que sea. */
  familiaDelTipo(errorTypeId: string): Promise<string | null>;
  /**
   * La familia según el vocabulario **vigente**, o `null` si ninguna versión
   * vigente la declara — que es lo que le pasa a 'dependencia de ayuda externa'.
   */
  familiaVigente(canonicalId: string): Promise<FamiliaDeError | null>;
  /**
   * Las observaciones de una **familia** dentro de una preparación, ordenadas.
   *
   * Trae la familia **entera**, con el objetivo de cada una: separar lo
   * comparable de lo meramente repetido es del evaluador puro, y filtrar por
   * objetivo acá dejaría sin base el número de `repeticionDetectada`.
   */
  observaciones(
    institutionId: string,
    examPreparationId: string,
    canonicalId: string,
  ): Promise<ObservacionPersistida[]>;
  /** Datos de la preparación, para poder scopear la señal. */
  preparacion(
    institutionId: string,
    examPreparationId: string,
  ): Promise<{ studentId: string; courseEnrollmentId: string } | null>;
  /** Escribe la corrección y actualiza la clasificación **en una transacción**. */
  corregirClasificacion(entrada: CorreccionDeClasificacion): Promise<{
    correccionId: string;
    desdeCanonicalId: string;
    aCanonicalId: string;
    examPreparationId: string;
    /** El objetivo no cambia con una reclasificación: los pares a re-evaluar
     *  son `(familia vieja, objetivo)` y `(familia nueva, mismo objetivo)`. */
    learningObjectiveId: string | null;
  }>;
  /** Registra una condición de desempeño. **Ningún contador la lee.** */
  registrarNecesidadDeApoyo(
    entrada: NecesidadDeApoyo,
  ): Promise<{ id: string; duplicado: boolean }>;
  sincronizarEpisodio(entrada: {
    institutionId: string;
    examPreparationId: string;
    canonicalId: string;
    learningObjectiveId: string | null;
    hayActividad: boolean;
    recuperada: boolean;
  }): Promise<{ id: string; previousId: string | null; status: "active" | "recovered" } | null>;
  contextoParaRevision(
    institutionId: string,
    examPreparationId: string,
    canonicalId?: string,
    learningObjectiveId?: string | null,
  ): Promise<Record<string, unknown>>;
  registrarDisparadorTemprano(entrada: DisparadorTemprano): Promise<{
    id: string;
    duplicado: boolean;
  }>;
}

export interface DisparadorTemprano {
  institutionId: string;
  examPreparationId: string;
  triggerCanonicalId: string;
  evidenceId?: string | null;
  note?: string | null;
  recordedBy?: string | null;
  claveDeIdempotencia?: string;
}

export type ResultadoDeReiteracion =
  | { estado: "SIN_UMBRAL"; motivo: string }
  | { estado: "NO_ENCONTRADA" }
  /**
   * La clasificación existe y **no alimenta el contador** — B6.7.1, `9.5`. Son
   * dos casos, y el `motivo` dice cuál: 'clasificación incierta', que está en el
   * catálogo declarándose no-familia; y una familia que el vocabulario vigente
   * ya no declara, como 'dependencia de ayuda externa'.
   *
   * **No es un error ni un `SIN_SENAL`:** no es que no alcanzó el umbral, es que
   * no se cuenta.
   */
  | { estado: "NO_CUENTA"; motivo: string }
  /** Se evaluó y todavía no alcanza ningún umbral. **No es un error.** */
  | {
      estado: "SIN_SENAL";
      /** Apariciones **comparables**. */
      apariciones: number;
      /** Misma familia, sin exigir comparabilidad — `9.1`. */
      repeticionDetectada: number;
      noInterpretables: number;
    }
  | {
      estado: "OK";
      senalId: string;
      apariciones: number;
      repeticionDetectada: number;
      noInterpretables: number;
      duplicado: boolean;
      /** La señal quedó en `INTERVENTION_REQUIRED`. */
      necesitaPersona: boolean;
    };

/** La regla de `C01-036`. Un solo `canonical_id`: no se agregan otras acá. */
export const REGLA_ERROR_REITERADO = "HP0-06-1";

/** Las dependencias que necesita cualquiera de las evaluaciones de esta etapa. */
export interface DepsDeReiteracion {
  repo: RepositorioDeReiteracion;
  senales: RepositorioDeSenales;
  eventos: PublicadorDeEventos;
  auditor: Auditor;
  destino?: DestinoDeEscalamiento;
}

/**
 * Evalúa la reiteración de **un tipo de error dentro de una preparación**, y
 * registra la señal si corresponde.
 *
 * Se llama después de registrar una observación. No corre sola ni en un loop:
 * el barrido de toda una institución sería un motor general, y esta etapa
 * construye **una** regla.
 *
 * Recibe una **fila del catálogo** —que puede ser de cualquier versión— y
 * resuelve su familia antes de contar. Ver `evaluarFamilia`.
 */
export async function evaluarYRegistrar(
  deps: DepsDeReiteracion,
  institutionId: string,
  examPreparationId: string,
  errorTypeId: string,
  objetivoId: string | null = null,
): Promise<ResultadoDeReiteracion> {
  const canonicalId = await deps.repo.familiaDelTipo(errorTypeId);
  if (!canonicalId) return { estado: "NO_ENCONTRADA" };
  return evaluarFamilia(deps, institutionId, examPreparationId, canonicalId, objetivoId);
}

/**
 * Evalúa **una familia** dentro de una preparación — B6.7.1.
 *
 * ## Por qué se cuenta por familia y no por fila del catálogo
 *
 * `error_observation.error_type_id` apunta a una **fila de versión**. Cuando
 * entra una versión nueva del vocabulario, lo ya observado sigue apuntando a la
 * anterior, y un contador que filtre por ese id vería **dos tipos distintos
 * donde hay una sola familia**: se partiría al medio, en silencio, justo en el
 * eslabón que el MVP existe para demostrar.
 *
 * La identidad de un error es el `canonical_id`; la versión dice **qué
 * definición estaba vigente** cuando alguien lo clasificó. Contar por familia es
 * lo que permite versionar el vocabulario sin reescribir una sola observación.
 *
 * ## Lo que no cuenta, y por qué no es lo mismo que no llegar al umbral
 *
 * **Sólo se evalúa una familia que el vocabulario vigente todavía declara como
 * familia.** De ahí salen los dos `NO_CUENTA`:
 *
 * - **'Clasificación incierta'** está en el catálogo con `es_familia = FALSE`.
 *   Contar repeticiones de *"no se pudo determinar"* como si fueran el mismo
 *   error es el falso positivo que ella marcó.
 * - **'Dependencia de ayuda externa'** no tiene fila vigente: `9.5` la sacó de
 *   los errores. Lo que hace que deje de contar **no es haber editado la fila
 *   que el Product Owner escribió** —ésa queda intacta y apagada— sino que
 *   ninguna versión vigente la declara familia.
 */
export async function evaluarFamilia(
  deps: DepsDeReiteracion,
  institutionId: string,
  examPreparationId: string,
  canonicalId: string,
  objetivoId: string | null = null,
): Promise<ResultadoDeReiteracion> {
  const familia = await deps.repo.familiaVigente(canonicalId);
  if (!familia) {
    return {
      estado: "NO_CUENTA",
      motivo: `el vocabulario vigente ya no declara «${canonicalId}» como familia de error`,
    };
  }
  if (!familia.esFamilia) {
    return {
      estado: "NO_CUENTA",
      motivo: `«${familia.label}» está en el catálogo y no cuenta para la reiteración`,
    };
  }

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
    canonicalId,
  );
  if (observaciones.length === 0) {
    return { estado: "SIN_SENAL", apariciones: 0, repeticionDetectada: 0, noInterpretables: 0 };
  }

  // La etiqueta sale de la versión **vigente**, no de la que tuviera la primera
  // observación: lo que se le muestra a una persona es cómo se llama hoy.
  const r = evaluarReiteracion(observaciones, umbral, familia.label, objetivoId);
  const episodio = await deps.repo.sincronizarEpisodio({
    institutionId,
    examPreparationId,
    canonicalId,
    learningObjectiveId: objetivoId,
    hayActividad: r.apariciones > 0 || r.aciertosLimpios > 0,
    recuperada: r.recuperada,
  });
  if (r.severidad === null || r.motivo === null) {
    return {
      estado: "SIN_SENAL",
      apariciones: r.apariciones,
      repeticionDetectada: r.repeticionDetectada,
      noInterpretables: r.noInterpretables,
    };
  }

  const contexto = await deps.repo.contextoParaRevision(
    institutionId,
    examPreparationId,
    canonicalId,
    objetivoId,
  );

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
      // Por **familia y objetivo**, no por fila de versión: si no, cargar una
      // versión nueva del vocabulario emitiría de nuevo señales ya emitidas, y
      // dos objetivos distintos compartirían una sola señal.
      claveDeIdempotencia:
        `c01-021:${examPreparationId}:${canonicalId}:${objetivoId ?? "sin-objetivo"}:${r.apariciones}`,
      reiterationEpisodeId: episodio?.id ?? null,
      reviewContext: {
        ...contexto,
        aparicionesComparables: r.apariciones,
        repeticionDetectada: r.repeticionDetectada,
        noInterpretables: r.noInterpretables,
        episodioAnteriorId: episodio?.previousId ?? null,
      },
    },
  );

  if (registro.estado !== "OK") {
    return {
      estado: "SIN_SENAL",
      apariciones: r.apariciones,
      repeticionDetectada: r.repeticionDetectada,
      noInterpretables: r.noInterpretables,
    };
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
    repeticionDetectada: r.repeticionDetectada,
    noInterpretables: r.noInterpretables,
    duplicado: registro.duplicado,
    necesitaPersona: r.necesitaPersona,
  };
}

type TriggerConfigurado = { canonicalId: string; label: string };

function disparadoresDesdeConfig(config: unknown): {
  severidad: "intervencion";
  triggers: TriggerConfigurado[];
} | null {
  if (config === null || typeof config !== "object") return null;
  const c = config as Record<string, unknown>;
  if (c.early_review_severity !== "intervencion" || !Array.isArray(c.early_review_triggers)) {
    return null;
  }
  const triggers = c.early_review_triggers.flatMap((fila) => {
    if (fila === null || typeof fila !== "object") return [];
    const f = fila as Record<string, unknown>;
    return typeof f.canonical_id === "string" && typeof f.label === "string"
      ? [{ canonicalId: f.canonical_id, label: f.label }]
      : [];
  });
  return triggers.length > 0 ? { severidad: "intervencion", triggers } : null;
}

/** `9.2`: el contador no es el único camino hacia una persona. */
export async function registrarDisparadorTemprano(
  deps: DepsDeReiteracion,
  entrada: DisparadorTemprano,
): Promise<
  | { estado: "RECHAZADA"; motivo: string }
  | { estado: "OK"; observacionId: string; senalId: string; duplicado: boolean }
> {
  const regla = await deps.repo.reglaVigente(REGLA_ERROR_REITERADO);
  const configuracion = regla ? disparadoresDesdeConfig(regla.thresholdConfig) : null;
  const trigger = configuracion?.triggers.find(
    (fila) => fila.canonicalId === entrada.triggerCanonicalId,
  );
  if (!regla || !configuracion || !trigger) {
    return { estado: "RECHAZADA", motivo: "el disparador temprano no está configurado" };
  }

  let observacion: { id: string; duplicado: boolean };
  try {
    observacion = await deps.repo.registrarDisparadorTemprano(entrada);
  } catch (e) {
    return { estado: "RECHAZADA", motivo: e instanceof Error ? e.message : "no se pudo registrar" };
  }
  const prep = await deps.repo.preparacion(entrada.institutionId, entrada.examPreparationId);
  if (!prep) return { estado: "RECHAZADA", motivo: "la preparación no pertenece a la institución" };
  const contexto = await deps.repo.contextoParaRevision(
    entrada.institutionId,
    entrada.examPreparationId,
  );
  const registro = await registrarSenal(
    { repo: deps.senales, eventos: deps.eventos, auditor: deps.auditor },
    {
      institutionId: entrada.institutionId,
      studentId: prep.studentId,
      courseEnrollmentId: prep.courseEnrollmentId,
      signalType: "revision_temprana",
      severity: configuracion.severidad,
      // Etiqueta literal de la configuración profesional; no se infiere una
      // explicación clínica ni se etiqueta a la persona.
      reason: trigger.label,
      sourceRef: `early_review_observation:${observacion.id}`,
      riskRuleId: regla.id,
      ruleVersion: regla.version,
      claveDeIdempotencia: `adr-037:9.2:${entrada.examPreparationId}:${observacion.id}`,
      reviewContext: { ...contexto, disparadorTemprano: trigger.canonicalId },
    },
  );
  if (registro.estado !== "OK") return { estado: "RECHAZADA", motivo: registro.motivo };
  if (!registro.duplicado) {
    await transicionar(
      { repo: deps.senales, eventos: deps.eventos, auditor: deps.auditor, destino: deps.destino },
      entrada.institutionId,
      registro.senalId,
      "INTERVENTION_REQUIRED",
      null,
    );
  }
  return {
    estado: "OK",
    observacionId: observacion.id,
    senalId: registro.senalId,
    duplicado: observacion.duplicado || registro.duplicado,
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
  deps: DepsDeReiteracion,
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
    entrada.learningObjectiveId ?? null,
  );

  return { estado: "OK", observacionId: registro.id, duplicado: registro.duplicado, evaluacion };
}

/**
 * Corrige la clasificación de una observación — B6.7.1, `9.5`.
 *
 * > *"Incluir 'clasificación incierta' y **opción de corrección humana**."*
 *
 * **La corrección no borra nada.** Se registra de qué a qué, con motivo
 * obligatorio, y recién entonces la observación pasa a llevar la clasificación
 * nueva. Es la misma idea que ella pidió para el reinicio del contador —*"cerrar
 * el estado activo, no eliminar datos previos"*— aplicada a la taxonomía.
 *
 * **Se re-evalúan las dos familias**, porque las dos cambiaron: una perdió una
 * aparición y la otra la ganó.
 *
 * ⚠️ **Una señal ya emitida no se retracta.** Fue cierta bajo la clasificación
 * vigente en ese momento, y `risk_signal` guarda la `rule_version` que la
 * produjo. Retractarla exigiría una transición del lifecycle que **nadie
 * definió** —ni [ADR-037](../../../docs/decisions.md#adr-037) ni
 * [ADR-034](../../../docs/decisions.md#adr-034)—, y esta etapa no la inventa. Lo
 * que sí llega a la persona es el historial de correcciones, que es lo que ella
 * pidió: *"la persona debe recibir el caso con la evidencia y el historial de
 * apoyos, no sólo con un contador"*.
 *
 * ⚠️ **Quién puede corregir sigue sin definirse.** Ella lo puso entre lo que hay
 * que evaluar antes de un piloto: *"quién puede corregir una clasificación de
 * error"*. `corregidoPor` es una identidad externa y no se valida contra nada.
 */
export async function corregirClasificacion(
  deps: DepsDeReiteracion,
  entrada: CorreccionDeClasificacion,
): Promise<
  | { estado: "RECHAZADA"; motivo: string }
  | {
      estado: "OK";
      correccionId: string;
      /** La familia de la que salió, ya re-evaluada. */
      desde: { canonicalId: string; evaluacion: ResultadoDeReiteracion };
      /** La familia a la que fue, ya re-evaluada. */
      hacia: { canonicalId: string; evaluacion: ResultadoDeReiteracion };
    }
> {
  if (entrada.motivo.trim().length === 0) {
    return { estado: "RECHAZADA", motivo: "una reclasificación sin motivo no se puede auditar" };
  }

  let r: Awaited<ReturnType<RepositorioDeReiteracion["corregirClasificacion"]>>;
  try {
    r = await deps.repo.corregirClasificacion(entrada);
  } catch (e) {
    return { estado: "RECHAZADA", motivo: e instanceof Error ? e.message : "no se pudo corregir" };
  }

  // **El objetivo no cambia con una reclasificación**, así que los dos pares a
  // re-evaluar son `(familia vieja, objetivo)` y `(familia nueva, mismo
  // objetivo)`. Re-evaluar la familia entera volvería a mezclar lo no
  // comparable, que es justo lo que la B6.7.2 vino a arreglar.
  const desde = await evaluarFamilia(
    deps,
    entrada.institutionId,
    r.examPreparationId,
    r.desdeCanonicalId,
    r.learningObjectiveId,
  );
  // Si la corrección no cambió de familia —cambió sólo la secundaria— no se
  // evalúa dos veces lo mismo: sería registrar la misma señal por duplicado.
  const hacia =
    r.aCanonicalId === r.desdeCanonicalId
      ? desde
      : await evaluarFamilia(
          deps,
          entrada.institutionId,
          r.examPreparationId,
          r.aCanonicalId,
          r.learningObjectiveId,
        );

  return {
    estado: "OK",
    correccionId: r.correccionId,
    desde: { canonicalId: r.desdeCanonicalId, evaluacion: desde },
    hacia: { canonicalId: r.aCanonicalId, evaluacion: hacia },
  };
}

/**
 * Registra una **necesidad de apoyo para avanzar** — B6.7.1, `9.5`.
 *
 * > *"La necesidad de ayuda **puede ser esperable y productiva**; denominarla
 * > 'dependencia' corre el riesgo de **estigmatizar**."*
 *
 * **No evalúa nada, y no puede.** Escribe en una tabla que ningún contador lee,
 * y por eso esta función no recibe `senales` ni `destino`: registrar que alguien
 * necesitó ayuda **no puede acercarlo a una escalada**. Que la firma no tenga
 * por dónde hacerlo es más fuerte que un comentario pidiendo que no se haga.
 */
export async function registrarNecesidadDeApoyo(
  deps: { repo: RepositorioDeReiteracion },
  entrada: NecesidadDeApoyo,
): Promise<
  | { estado: "RECHAZADA"; motivo: string }
  | { estado: "OK"; observacionId: string; duplicado: boolean }
> {
  try {
    const r = await deps.repo.registrarNecesidadDeApoyo(entrada);
    return { estado: "OK", observacionId: r.id, duplicado: r.duplicado };
  } catch (e) {
    return { estado: "RECHAZADA", motivo: e instanceof Error ? e.message : "no se pudo registrar" };
  }
}
