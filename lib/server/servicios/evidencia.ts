import { canTransition, evidenceOwnerTransitions } from "@/lib/domain/state-machines";
import type { EvidenceState } from "@/lib/domain/types";
import type { PublicadorDeEventos } from "./eventos";

/**
 * Service de `Evidence` — Etapa B2.3.
 *
 * **Enviar no es suficiencia; suficiencia no es validación; validación no es
 * dominio** (`AGENTS.md` §2.1). Las cuatro son estados distintos y este Service
 * no colapsa ninguno en otro.
 *
 * ### Cómo se leen juntas la máquina e `I4`
 *
 * `evidenceOwnerTransitions` tiene `RESUBMISSION_REQUESTED → SUBMITTED`, e
 * `I4` dice que una resubmission **crea una Evidence nueva**. No se
 * contradicen: **la máquina dice qué se permite, `I4` dice cómo se persiste.**
 *
 * Implementar la arista como un `UPDATE` de la misma fila sería lo natural y
 * rompería `I4` en silencio — la entrega anterior desaparecería, y con ella la
 * prueba de qué se había entregado primero. Por eso `resubmitir()` no usa
 * `transicionar()`.
 */
export interface Evidencia {
  id: string;
  institutionId: string;
  actionId: string;
  state: EvidenceState;
  /** `null` mientras nadie la haya sucedido. */
  supersededById: string | null;
  reviewInstanceId: string | null;
}

export interface RepositorioDeEvidencias {
  porId(institutionId: string, id: string): Promise<Evidencia | null>;
  cambiarEstadoSi(
    institutionId: string,
    id: string,
    esperado: EvidenceState,
    nuevo: EvidenceState,
    columnas?: Readonly<Record<string, unknown>>,
  ): Promise<Evidencia | null>;
  /** `I4`: crea la nueva y enlaza las dos, atómicamente. */
  resubmitirAtomico(
    institutionId: string,
    anteriorId: string,
    canal: "WEB" | "WHATSAPP",
    claveDeIdempotencia?: string,
  ): Promise<Evidencia | null>;
}

export type ResultadoDeEvidencia =
  | { estado: "OK"; evidencia: Evidencia }
  | { estado: "NO_ENCONTRADA" }
  | { estado: "TRANSICION_PROHIBIDA"; desde: EvidenceState; hacia: EvidenceState }
  /**
   * `I5`: `UNDER_REVIEW` exige una **instancia real** de revisión. Un método de
   * validación configurado no alcanza — configurar cómo se revisaría no es
   * haber creado una revisión.
   */
  | { estado: "FALTA_INSTANCIA_DE_REVISION" }
  | { estado: "CONFLICTO" };

/** `RESUBMISSION_REQUESTED` → `EvidenceResubmissionRequested`. Ver el guard. */
export function nombreDeEventoDeEvidence(hacia: EvidenceState): string {
  return `Evidence${hacia.charAt(0)}${hacia.slice(1).toLowerCase().replace(/_(.)/g, (_, c) => c.toUpperCase())}`;
}

export async function transicionar(
  deps: { repo: RepositorioDeEvidencias; eventos: PublicadorDeEventos },
  institutionId: string,
  id: string,
  hacia: EvidenceState,
  extra: { reviewInstanceId?: string } = {},
  actorId: string | null = null,
): Promise<ResultadoDeEvidencia> {
  const actual = await deps.repo.porId(institutionId, id);
  if (!actual) return { estado: "NO_ENCONTRADA" };

  if (!canTransition(evidenceOwnerTransitions, actual.state, hacia)) {
    return { estado: "TRANSICION_PROHIBIDA", desde: actual.state, hacia };
  }

  // I5 antes de tocar la base. El `CHECK` de la tabla es el cierre; que el
  // Service lo diga primero es lo que permite un error entendible en vez de
  // una violación de constraint.
  if (hacia === "UNDER_REVIEW" && !extra.reviewInstanceId && !actual.reviewInstanceId) {
    return { estado: "FALTA_INSTANCIA_DE_REVISION" };
  }

  const guardado = await deps.repo.cambiarEstadoSi(institutionId, id, actual.state, hacia, {
    ...(extra.reviewInstanceId ? { review_instance_id: extra.reviewInstanceId } : {}),
    ...(hacia === "SUBMITTED" ? { submitted_at: new Date().toISOString() } : {}),
  });
  if (!guardado) return { estado: "CONFLICTO" };

  await deps.eventos.publicar({
    nombre: nombreDeEventoDeEvidence(hacia),
    institutionId,
    actorId,
    sujetoTipo: "evidence",
    sujetoId: guardado.id,
    causa: `${actual.state}->${hacia}`,
  });

  return { estado: "OK", evidencia: guardado };
}

/**
 * `I4` — la resubmission **crea una Evidence nueva y preserva la anterior**.
 *
 * La anterior conserva su estado, su contenido y su fecha: es el registro de
 * qué se entregó primero, y borrarlo haría imposible explicar por qué se pidió
 * una segunda entrega.
 */
export async function resubmitir(
  deps: { repo: RepositorioDeEvidencias; eventos: PublicadorDeEventos },
  institutionId: string,
  anteriorId: string,
  canal: "WEB" | "WHATSAPP",
  claveDeIdempotencia?: string,
  actorId: string | null = null,
): Promise<ResultadoDeEvidencia> {
  const anterior = await deps.repo.porId(institutionId, anteriorId);
  if (!anterior) return { estado: "NO_ENCONTRADA" };

  // **No alcanza con `canTransition(..., "SUBMITTED")`.** `EXPECTED` también
  // admite `SUBMITTED`, pero eso es la PRIMERA entrega, no una resubmission:
  // dejarlo pasar crearía una segunda fila para algo que nunca se entregó.
  // Resubmitir exige que la anterior haya sido devuelta para resubmitir.
  if (anterior.state !== "RESUBMISSION_REQUESTED") {
    return { estado: "TRANSICION_PROHIBIDA", desde: anterior.state, hacia: "SUBMITTED" };
  }
  // Una cadena de resubmission es lineal: si ya tiene sucesora, no hay otra.
  if (anterior.supersededById) return { estado: "CONFLICTO" };

  const nueva = await deps.repo.resubmitirAtomico(
    institutionId,
    anteriorId,
    canal,
    claveDeIdempotencia,
  );
  if (!nueva) return { estado: "CONFLICTO" };

  await deps.eventos.publicar({
    nombre: "EvidenceResubmitted",
    institutionId,
    actorId,
    sujetoTipo: "evidence",
    sujetoId: nueva.id,
    causa: `sucede:${anteriorId}`,
  });

  return { estado: "OK", evidencia: nueva };
}
