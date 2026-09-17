import "server-only";

import type { RepositorioDeInstituciones } from "../servicios/autorizacion";
import { clienteDeServicio } from "../supabase";

/**
 * Traducción CRM → Plataforma. **Sólo lee.**
 *
 * No hay método para dar de alta una correspondencia: el alta es manual
 * (ADR-005 ítem 6). Un `crear()` acá sería la puerta por la que una
 * institución termina creándose sola en el primer login.
 */
export const institucionesReal: RepositorioDeInstituciones = {
  async porIdDeCrm(crmInstitutionId) {
    const { data, error } = await clienteDeServicio()
      .from("institution_crm_ref")
      .select("institution_id")
      .eq("crm_institution_id", crmInstitutionId)
      .maybeSingle();
    if (error) throw new Error(`No se pudo traducir la institución: ${error.message}`);
    return data ? (data.institution_id as string) : null;
  },
};
