/**
 * Los hechos de la Bitácora, traducidos a copy. **Una sola vez.**
 *
 * `product_event.event_name` guarda `EvidenceValidated`, y eso es un enum
 * técnico: `AGENTS.md` §2.6 prohíbe que un enum sea copy visible. La traducción
 * vive en `lib/content/` por el mismo motivo que `provenance.ts` — convertir un
 * hecho del sistema en la frase que lee el estudiante **es contenido**, no
 * dominio.
 *
 * ## Un evento sin traducción no se muestra
 *
 * `EVENTOS` no es exhaustivo a propósito: están los hechos que `VI.6` nombra
 * como parte del ciclo del estudiante. Quedan afuera, entre otros,
 * `CommitmentDue` y `CommitmentClosed` —transiciones que dispara el reloj del
 * lifecycle, no la persona— y `AcademicDataIngested`, que es un hecho de la
 * plataforma. Una Bitácora que lista cada cambio de estado interno deja de ser
 * *"qué hice"* y pasa a ser un log.
 *
 * **Lo que no está acá se omite**, no se muestra con su nombre técnico ni con
 * una frase inventada. Es la misma regla de siempre: omitir, no inventar.
 */

const EVENTOS: Record<string, string> = {
  // El ciclo del compromiso.
  CommitmentConfirmed: "Te comprometiste",
  CommitmentStarted: "Empezaste",
  CommitmentCompleted: "Cerraste el compromiso",
  CommitmentMissed: "Compromiso incumplido",
  CommitmentRenegotiated: "Renegociaste el compromiso",
  CommitmentRescueCreated: "Creaste un rescate",
  /**
   * El hecho que el producto quiere medir: la recuperación. Y **no dice que el
   * incumplimiento se borró** — el `MISSED` original sigue ahí, que es el
   * invariante `I3`.
   */
  RescueSucceeded: "Recuperaste lo que habías incumplido",

  // El ciclo de la evidencia. Los siete estados ya tienen copy en `UX05`; acá
  // son hechos ocurridos, así que van en pasado y con sujeto.
  EvidenceSubmitted: "Presentaste evidencia",
  EvidenceUnderReview: "Entró en revisión",
  EvidenceSufficient: "Cumplió el criterio de la Action",
  EvidenceInsufficient: "Necesita cambios",
  EvidenceResubmissionRequested: "Te pidieron volver a entregarla",
  /**
   * **No dice "la cátedra".** `evidence` no guarda `source_type` ni
   * `verification_status`, así que quién validó no es un dato que la base
   * tenga. Nombrar a la cátedra acá sería elevar la verificación desde la UI,
   * que es exactamente `I9`.
   */
  EvidenceValidated: "La validaron",
  EvidenceResubmitted: "Volviste a entregarla",

  /**
   * El resultado de progreso — Etapa B3.1.
   *
   * Son **dos hechos distintos y se llaman distinto**. Un no-cambio confirmado
   * no es la ausencia de un cambio: es que alguien miró y lo dijo, igual que
   * `ADR-020` decidió para la fila de dimensiones. Mostrarlos con la misma
   * frase sería volver a fundir las dos cosas en la Bitácora, después de
   * haberlas separado en la pantalla.
   */
  ProgressUpdated: "Tu progreso cambió",
  ProgressNoChangeConfirmed: "Revisaron tu progreso y no cambió",
};

/** `null` ⇒ el hecho no tiene copy aprobada y **la entrada no se renderiza**. */
export function tituloDeHecho(evento: string): string | null {
  return EVENTOS[evento] ?? null;
}
