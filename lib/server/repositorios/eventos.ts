import "server-only";

import type { PublicadorDeEventos } from "../servicios/eventos";
import { clienteDeServicio } from "../supabase";

/**
 * Escritura en `product_event`. **Sólo INSERT**: la tabla no tiene `UPDATE` ni
 * `DELETE` concedidos ni para `service_role` (I12), así que este módulo no
 * podría reescribir el pasado aunque lo intentara.
 */
export const eventosReal: PublicadorDeEventos = {
  async publicar(evento) {
    const { error } = await clienteDeServicio().from("product_event").insert({
      event_name: evento.nombre,
      institution_id: evento.institutionId,
      actor_id: evento.actorId,
      subject_type: evento.sujetoTipo,
      subject_id: evento.sujetoId,
      cause_ref: evento.causa,
      payload: evento.payload ?? {},
    });
    if (error) throw new Error(`No se pudo publicar el evento: ${error.message}`);
  },
};
