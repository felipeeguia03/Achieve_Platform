import "server-only";

import { clienteDeServicio } from "../supabase";

/**
 * De quién es la cuenta, para el topbar — [ADR-097](../../../docs/decisions.md#adr-097).
 *
 * ⚠️ **Sólo lectura, y sólo nombres.** Lo que el topbar muestra es *dónde
 * estudiás*: el nombre de la institución y el de la carrera declarada en el
 * alta. No hay organizaciones entre las que cambiar —el estudiante pertenece a
 * una institución, y la decide el padrón del CRM ([ADR-039](../../../docs/decisions.md#adr-039))—.
 *
 * ⚠️ **El estudiante no tiene nombre en la base**, y no se inventa uno: el
 * avatar sale del email de la sesión, en el navegador.
 */
export interface RepositorioDeCuenta {
  nombreDeInstitucion(institutionId: string): Promise<string | null>;
  nombreDeCarrera(institutionId: string, carreraId: string): Promise<string | null>;
}

export const cuentaReal: RepositorioDeCuenta = {
  async nombreDeInstitucion(institutionId) {
    const { data, error } = await clienteDeServicio()
      .from("institution")
      .select("name")
      .eq("id", institutionId)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer la institución: ${error.message}`);
    return data?.name ?? null;
  },

  async nombreDeCarrera(institutionId, carreraId) {
    // Se filtra también por institución: un id de carrera de otra institución
    // no puede devolver nada, aunque la sesión lo trajera.
    const { data, error } = await clienteDeServicio()
      .from("academic_program")
      .select("name")
      .eq("id", carreraId)
      .eq("institution_id", institutionId)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer la carrera: ${error.message}`);
    return data?.name ?? null;
  },
};
