import "server-only";

import type { Auditor } from "../servicios/auditoria";
import { clienteDeServicio } from "../supabase";

/**
 * `audit_log`, que existía desde la B1.5 y **nadie escribía**.
 *
 * Es append-only por privilegios: `service_role` no puede hacer `UPDATE` ni
 * `DELETE` sobre ella, y `db:verify` lo comprueba en cada corrida. Por eso el
 * `insert` es la única operación que este Repository expone.
 */
export const auditorReal: Auditor = {
  async registrar(entrada) {
    const { error } = await clienteDeServicio().from("audit_log").insert({
      institution_id: entrada.institutionId,
      actor_id: entrada.actorId,
      action: entrada.accion,
      target_type: entrada.targetType,
      target_id: entrada.targetId,
      before_value: entrada.antes ?? null,
      after_value: entrada.despues ?? null,
    });
    // Una auditoría que falla en silencio no es una auditoría.
    if (error) throw new Error(`No se pudo auditar: ${error.message}`);
  },
};
