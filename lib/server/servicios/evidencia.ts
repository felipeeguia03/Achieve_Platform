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
  /**
   * `I4`: crea la nueva y enlaza las dos, atómicamente.
   *
   * `nuevaId` lo elige quien llama porque la clave del objeto en Storage se
   * deriva de él y el archivo ya está arriba cuando esto corre — Etapa B6.9.2.
   */
  resubmitirAtomico(
    institutionId: string,
    anteriorId: string,
    canal: "WEB" | "WHATSAPP",
    claveDeIdempotencia?: string,
    nuevaId?: string,
    subidaPor?: string,
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
  /**
   * Pedir un reenvío **exige decir por qué** — Etapa B6.9.2. Sin motivo, el
   * estudiante recibe *"volvé a entregarla"* y nada que corregir.
   */
  | { estado: "FALTA_MOTIVO" }
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
  extra: { reviewInstanceId?: string; motivo?: string } = {},
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

  // **Pedir un reenvío sin decir por qué es indistinguible de un clic.** El
  // estudiante tiene que volver a entregar algo, y sin motivo no sabe qué
  // corregir. Mismo criterio que `D5` de la corroboración.
  if (hacia === "RESUBMISSION_REQUESTED" && !extra.motivo?.trim()) {
    return { estado: "FALTA_MOTIVO" };
  }

  const guardado = await deps.repo.cambiarEstadoSi(institutionId, id, actual.state, hacia, {
    ...(extra.reviewInstanceId ? { review_instance_id: extra.reviewInstanceId } : {}),
    ...(hacia === "RESUBMISSION_REQUESTED" ? { resubmission_reason: extra.motivo } : {}),
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
/** Lo que hace falta para registrar la entrega. */
export interface EntregaDeEvidencia {
  evidenciaId: string;
  commitmentId: string;
  estudianteId: string;
  claveDeIdempotencia: string;
}

/** La huella de la fila que ya usó una clave, para poder compararla. */
export interface HuellaDeEvidencia {
  evidenciaId: string;
  estudianteId: string;
  commitmentId: string | null;
}

export type ResultadoDeEntrega =
  | { estado: "OK"; evidenciaId: string; duplicado: boolean }
  | { estado: "COMPROMISO_NO_ENTREGABLE"; motivo: string }
  /** La clave existe con otro dueño, otro compromiso u otro contenido. */
  | { estado: "CONFLICTO_DE_CLAVE" };

export interface RepositorioDeEntrega {
  huellaDeClave(institutionId: string, clave: string): Promise<HuellaDeEvidencia | null>;
  /** `INSERT` en `SUBMITTED`. `null` ⇒ el compromiso no es de este estudiante. */
  crearEntregada(
    institutionId: string,
    datos: EntregaDeEvidencia,
  ): Promise<{ actionId: string } | null>;
}

/**
 * Registra la entrega — D3·A del paquete de decisión.
 *
 * ## Qué NO significa esto
 *
 * **`SUBMITTED` no es suficiencia, ni revisión, ni progreso.** La fila nace con
 * las tres señales en `not_evaluated` justamente para que nadie las lea como un
 * juicio que nadie emitió: quién juzga es D4, y es otra operación.
 *
 * ## Por qué la fila se crea después de subir
 *
 * El objeto de storage **no lo nombra el cliente** —su clave se deriva de la
 * institución y del id de la evidencia—, así que el id se reserva antes de
 * subir y la fila se escribe cuando la subida ya cerró. Si el estudiante
 * abandona a mitad, queda un objeto huérfano y **ninguna fila que afirme una
 * entrega que no ocurrió**, que es el error caro de los dos.
 */
export async function entregarEvidencia(
  deps: { repo: RepositorioDeEntrega; eventos: PublicadorDeEventos },
  institutionId: string,
  datos: EntregaDeEvidencia,
): Promise<ResultadoDeEntrega> {
  const huella = await deps.repo.huellaDeClave(institutionId, datos.claveDeIdempotencia);
  if (huella) {
    const mismo =
      huella.estudianteId === datos.estudianteId &&
      huella.commitmentId === datos.commitmentId &&
      huella.evidenciaId === datos.evidenciaId;
    return mismo
      ? { estado: "OK", evidenciaId: huella.evidenciaId, duplicado: true }
      : { estado: "CONFLICTO_DE_CLAVE" };
  }

  const creada = await deps.repo.crearEntregada(institutionId, datos);
  if (!creada) {
    return {
      estado: "COMPROMISO_NO_ENTREGABLE",
      motivo: "El compromiso no existe, no es de este estudiante o su estado no admite entregar.",
    };
  }

  await deps.eventos.publicar({
    nombre: "EvidenceSubmitted",
    institutionId,
    actorId: datos.estudianteId,
    sujetoTipo: "evidence",
    sujetoId: datos.evidenciaId,
    causa: "->SUBMITTED",
    payload: { commitmentId: datos.commitmentId, actionId: creada.actionId },
  });

  return { estado: "OK", evidenciaId: datos.evidenciaId, duplicado: false };
}

export async function resubmitir(
  deps: { repo: RepositorioDeEvidencias; eventos: PublicadorDeEventos },
  institutionId: string,
  anteriorId: string,
  canal: "WEB" | "WHATSAPP",
  claveDeIdempotencia?: string,
  actorId: string | null = null,
  /** El id reservado por `?firmar=`: la clave del objeto se deriva de él. */
  nuevaId?: string,
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
    nuevaId,
    actorId ?? undefined,
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
