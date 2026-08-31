/**
 * Publicación de eventos de producto. El Service la usa por inyección; no sabe
 * que del otro lado hay una tabla.
 */
export interface EventoDeProducto {
  /** Nombre semántico del hecho: `CommitmentConfirmed`, no `commitment_update`. */
  nombre: string;
  institutionId: string;
  /** Quién lo causó. `null` si lo causó el sistema y no una persona. */
  actorId: string | null;
  sujetoTipo: string;
  sujetoId: string;
  /** Por qué ocurrió: la transición, la request, el job. */
  causa: string | null;
  /**
   * ⚠️ **Lo único que podría contener dato personal.** El resto de las columnas
   * es *el hecho*. Ver ADR-006: la separación existe para que una eventual
   * purga no tenga que borrar la fila entera.
   */
  payload?: Record<string, unknown>;
}

export interface PublicadorDeEventos {
  publicar(evento: EventoDeProducto): Promise<void>;
}
