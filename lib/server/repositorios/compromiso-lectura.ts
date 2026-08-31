import "server-only";

import type { EstadoDeCompromiso, RepositorioDeCompromiso } from "../servicios/proyeccion-compromiso";
import { clienteDeServicio } from "../supabase";

/** Lectura de `UX04`. Separada de la mutación, igual que en `UX03`. */
export const compromisoLecturaReal: RepositorioDeCompromiso = {
  async estadoDeCompromiso(institutionId, studentId, ahora, commitmentId = null) {
    const { data, error } = await clienteDeServicio().rpc("estado_de_compromiso", {
      p_institution_id: institutionId,
      p_student_id: studentId,
      p_ahora: ahora,
      p_commitment_id: commitmentId,
    });
    if (error) throw new Error(`No se pudo leer el compromiso: ${error.message}`);
    return (data as EstadoDeCompromiso | null) ?? null;
  },
};
