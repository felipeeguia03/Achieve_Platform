import {
  ESTADOS_CORROBORABLES,
  puedeCorroborar,
} from "@/lib/domain/state-machines";
import type { SourceType, VerificationStatus } from "@/lib/domain/types";
import type { Auditor } from "./auditoria";

/**
 * La corroboración — Etapa B2b.2, invariante `I9`.
 *
 * > *"Ninguna capa eleva un `verification_status`. **Operación explícita del
 * > owner en Service + autorización y auditoría**; Repository no expone un
 * > update genérico del campo."* — `data-model.md` §11
 *
 * ## Por qué existe
 *
 * La B2b.1 dejó al ingestor sin ninguna forma de elevar el campo —no es que no
 * deba: **no tiene por dónde**—, y eso estaba bien. Pero sin esta operación
 * **todo el ADL queda `unverified` para siempre**, y la distinción entre *"lo
 * cargó un estudiante"* y *"alguien lo verificó"* nunca se puede ejercer.
 *
 * ## Lo que este Service no decide
 *
 * ⚠️ **No sabe quién puede corroborar.** `C01-030` —autorización, permisos y
 * privacidad institucional— sigue `OPEN`. `corroboradoPor` es una identidad
 * externa y **no se valida contra nada**; lo que sí queda es registrado.
 *
 * ⚠️ **No puede producir `official`.** Ese estado significa que la institución
 * lo afirma, y la Plataforma no puede autenticar a una institución hoy. Ver
 * `provenanceTransitions`.
 *
 * ⚠️ **No corrobora nada por su cuenta.** Recibe un hecho: alguien miró una
 * fuente concreta y afirma algo. Deducirlo —por ejemplo, "si dos estudiantes
 * cargaron lo mismo, está corroborado"— sería fabricar verificación, que es
 * exactamente lo que `I9` existe para impedir.
 */

/** Las cinco tablas que llevan `verification_status`. */
export const TABLAS_CON_PROCEDENCIA = [
  "class_session",
  "assessment",
  "class_event_record",
  "assessment_criterion",
  "learning_objective",
] as const;

export type TablaConProcedencia = (typeof TABLAS_CON_PROCEDENCIA)[number];

export interface Corroboracion {
  institutionId: string;
  tabla: TablaConProcedencia;
  sujetoId: string;
  hacia: VerificationStatus;
  /** Qué clase de fuente sostiene la afirmación. */
  fuente: SourceType;
  /**
   * La referencia concreta. **Obligatoria**: *"lo dijo alguien"* no se puede
   * volver a mirar, así que no se puede corroborar nunca. Es la misma regla que
   * la B2b.1 le puso al ingestor.
   */
  referencia: string;
  /** Por qué. Una corroboración sin motivo es indistinguible de un clic. */
  motivo: string;
  /** Identidad externa. **Quién puede corroborar sigue sin definirse.** */
  corroboradoPor?: string | null;
}

export interface RepositorioDeCorroboracion {
  /** Escribe el hecho y actualiza la fila **en una transacción**. */
  corroborar(entrada: Corroboracion): Promise<{
    corroboracionId: string;
    desde: VerificationStatus;
    hacia: VerificationStatus;
  }>;
  /** El historial de un sujeto, para poder explicar por qué está como está. */
  historial(
    institutionId: string,
    tabla: TablaConProcedencia,
    sujetoId: string,
  ): Promise<
    {
      id: string;
      desde: VerificationStatus;
      hacia: VerificationStatus;
      fuente: SourceType;
      referencia: string;
      motivo: string;
      corroboradoPor: string | null;
      corroboradoEn: string;
    }[]
  >;
}

export type ResultadoDeCorroboracion =
  | { estado: "RECHAZADA"; motivo: string }
  | {
      estado: "OK";
      corroboracionId: string;
      desde: VerificationStatus;
      hacia: VerificationStatus;
    };

/**
 * Corrobora la procedencia de una fila del ADL.
 *
 * **Valida antes de llamar a la base, y la base valida de nuevo.** No es
 * redundancia gratuita: acá se rechaza con un mensaje que sirve, y allá se
 * impone aunque alguien un día llame a la función sin pasar por este Service.
 *
 * **Audita siempre que escribe**, con el estado de antes y el de después — que
 * es lo que distingue auditar de loguear, y lo que `I9` pide por nombre.
 */
export async function corroborarProcedencia(
  deps: { repo: RepositorioDeCorroboracion; auditor: Auditor },
  entrada: Corroboracion,
): Promise<ResultadoDeCorroboracion> {
  if (!ESTADOS_CORROBORABLES.includes(entrada.hacia)) {
    // El caso que más importa nombrar bien: `official`.
    return {
      estado: "RECHAZADA",
      motivo:
        entrada.hacia === "official"
          ? "nadie puede declarar official: hace falta autenticar a la institución (C01-030, OPEN)"
          : `una corroboración no puede producir ${entrada.hacia}`,
    };
  }
  if (entrada.referencia.trim().length === 0) {
    return {
      estado: "RECHAZADA",
      motivo: "una corroboración sin referencia concreta no se puede volver a mirar",
    };
  }
  if (entrada.motivo.trim().length === 0) {
    return { estado: "RECHAZADA", motivo: "una corroboración sin motivo no se puede auditar" };
  }

  let r: Awaited<ReturnType<RepositorioDeCorroboracion["corroborar"]>>;
  try {
    r = await deps.repo.corroborar(entrada);
  } catch (e) {
    return { estado: "RECHAZADA", motivo: e instanceof Error ? e.message : "no se pudo corroborar" };
  }

  await deps.auditor.registrar({
    institutionId: entrada.institutionId,
    // Quién lo hizo. `null` no sería cierto acá: lo hizo alguien.
    actorId: entrada.corroboradoPor ?? null,
    accion: "provenance.corroborate",
    targetType: entrada.tabla,
    targetId: entrada.sujetoId,
    antes: { verificationStatus: r.desde },
    despues: {
      verificationStatus: r.hacia,
      sourceType: entrada.fuente,
      sourceRef: entrada.referencia,
    },
  });

  return { estado: "OK", corroboracionId: r.corroboracionId, desde: r.desde, hacia: r.hacia };
}

/** Chequeo puro de la transición, para poder explicarla sin tocar la base. */
export function transicionValida(
  desde: VerificationStatus,
  hacia: VerificationStatus,
): boolean {
  return puedeCorroborar(desde, hacia);
}
