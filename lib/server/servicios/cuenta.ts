import { nombreVisibleDeCarrera } from "@/lib/content/es-AR";

import type { RepositorioDeCuenta } from "../repositorios/cuenta";

/**
 * Lo que el topbar dice de la cuenta — [ADR-097](../../../docs/decisions.md#adr-097).
 *
 * `null` en cualquiera de los dos ⇒ **la línea no se dibuja**. Omitir, no
 * inventar: sin carrera declarada el topbar dice la institución sola.
 */
export interface CuentaProps {
  institucion: string | null;
  carrera: string | null;
}

export async function cuenta(
  repo: RepositorioDeCuenta,
  institutionId: string,
  carreraId: string | null,
): Promise<CuentaProps> {
  const [institucion, carrera] = await Promise.all([
    repo.nombreDeInstitucion(institutionId),
    carreraId === null ? Promise.resolve(null) : repo.nombreDeCarrera(institutionId, carreraId),
  ]);
  return {
    institucion,
    // «UCC Sistemas» y no «INGENIERIA DE SISTEMAS»: presentación, no renombre (ADR-086).
    carrera: carrera === null ? null : nombreVisibleDeCarrera(carrera),
  };
}
