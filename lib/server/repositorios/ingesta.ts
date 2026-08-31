import "server-only";

import type { GuiaDeMateria, RepositorioDeIngesta } from "../servicios/ingesta";
import { clienteDeServicio } from "../supabase";

/**
 * Ingesta del ADL. Todo pasa por `ingerir_materia`, que hace curso, cursada,
 * unidades, prerequisitos y evaluaciones **en una transacción**: media materia
 * cargada es peor que ninguna, porque nadie sabe qué falta.
 *
 * **`verification_status` no viaja como parámetro.** Queda en su default
 * `unverified` (`I9`).
 */
export const ingestaReal: RepositorioDeIngesta = {
  async existeInstitucion(institutionId) {
    const { data, error } = await clienteDeServicio()
      .from("institution")
      .select("id")
      .eq("id", institutionId)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer institution: ${error.message}`);
    return Boolean(data);
  },

  async ingerirMateria(institutionId, guia: GuiaDeMateria) {
    const { data, error } = await clienteDeServicio().rpc("ingerir_materia", {
      p_institution_id: institutionId,
      p_source_type: guia.fuente.tipo,
      p_source_ref: guia.fuente.referencia,
      p_observed_at: guia.fuente.observadoEn,
      p_confidence: guia.fuente.confianza ?? null,
      p_course_code: guia.curso.codigo,
      p_course_name: guia.curso.nombre,
      p_term: guia.cursada.periodo,
      p_commission: guia.cursada.comision ?? null,
      p_unidades: guia.unidades,
      p_prerequisitos: guia.prerequisitos ?? [],
      p_evaluaciones: guia.evaluaciones ?? [],
    });
    if (error) throw new Error(`No se pudo ingerir la materia: ${error.message}`);
    const fila = ((data ?? []) as Record<string, unknown>[])[0];
    if (!fila) throw new Error("La ingesta no devolvió resultado");
    return {
      cursadaId: fila.cursada_id as string,
      unidades: Number(fila.unidades),
      evaluaciones: Number(fila.evaluaciones),
    };
  },
};
