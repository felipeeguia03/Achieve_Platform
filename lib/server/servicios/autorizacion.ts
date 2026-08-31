/**
 * Autorización de padrón contra el CRM — Etapa B1.6.
 *
 * `platform-integration-contract.md` §1. **El CRM define la respuesta; la
 * Plataforma la hace cumplir.** Este Service no interpreta el padrón ni
 * inventa criterios: traduce la respuesta del contrato a una decisión, y
 * traduce la institución externa a la propia.
 */

/** Lo que el contrato devuelve, tal cual. */
export type RespuestaDelCrm =
  | { authorized: true; institutionId: string; studentId: string }
  | { authorized: false; reason: "not_in_roster" | "institution_terminated" | "ambiguous" };

export interface ClienteDeCrm {
  /**
   * `POST /api/service/v1/authorize`.
   *
   * **Lanza** ante `400`, `401` o fallo de red/5xx: no son "no autorizado",
   * son fallas de la integración, y confundirlas le diría al estudiante que su
   * institución no lo habilitó cuando en realidad se cayó una conexión.
   */
  autorizar(input: {
    email: string;
    platformStudentId: string;
  }): Promise<RespuestaDelCrm>;
}

export interface RepositorioDeInstituciones {
  /** `null` si esa institución del CRM no está mapeada en Plataforma. */
  porIdDeCrm(crmInstitutionId: string): Promise<string | null>;
}

export type ResultadoDeAutorizacion =
  | { estado: "AUTORIZADO"; institutionId: string; crmStudentId: string }
  /** El CRM dijo que no. La razón viaja tal cual: no se reinterpreta. */
  | { estado: "RECHAZADO"; razon: RespuestaDelCrm extends { authorized: false } ? never : string }
  /**
   * El CRM autorizó, pero esa institución **no está dada de alta en
   * Plataforma**. No se crea sola (ADR-005 ítem 6): dar de alta una
   * institución es firmar un convenio, no un efecto secundario de un login.
   */
  | { estado: "INSTITUCION_NO_DADA_DE_ALTA"; crmInstitutionId: string }
  /** Falla de la integración, no del padrón. Se reintenta; no se le dice "no". */
  | { estado: "INTEGRACION_CAIDA"; detalle: string };

export async function autorizarPorPadron(
  deps: { crm: ClienteDeCrm; instituciones: RepositorioDeInstituciones },
  input: { email: string; platformStudentId: string },
): Promise<ResultadoDeAutorizacion> {
  let respuesta: RespuestaDelCrm;
  try {
    respuesta = await deps.crm.autorizar(input);
  } catch (e) {
    // Una caída de red no es un "no". Decirle al estudiante que su institución
    // no lo habilitó cuando se cayó una conexión es mentirle sobre su situación.
    return { estado: "INTEGRACION_CAIDA", detalle: e instanceof Error ? e.message : String(e) };
  }

  if (!respuesta.authorized) {
    return { estado: "RECHAZADO", razon: respuesta.reason } as ResultadoDeAutorizacion;
  }

  const institutionId = await deps.instituciones.porIdDeCrm(respuesta.institutionId);
  if (!institutionId) {
    return { estado: "INSTITUCION_NO_DADA_DE_ALTA", crmInstitutionId: respuesta.institutionId };
  }

  return { estado: "AUTORIZADO", institutionId, crmStudentId: respuesta.studentId };
}
