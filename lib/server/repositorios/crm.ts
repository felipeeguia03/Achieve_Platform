import "server-only";

import type { ClienteDeCrm, RespuestaDelCrm } from "../servicios/autorizacion";

/**
 * Cliente HTTP del CRM. `platform-integration-contract.md` §1.
 *
 * El secreto compartido **no es un JWT de usuario**: es máquina a máquina y
 * vive sólo en variables de entorno del backend.
 */
export class ErrorDeCrm extends Error {
  constructor(
    readonly clase: "CONTRATO" | "AUTENTICACION" | "RED",
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "ErrorDeCrm";
  }
}

export function crearClienteDeCrm(opciones?: { baseUrl?: string; secreto?: string }): ClienteDeCrm {
  return {
    async autorizar(input) {
      const baseUrl = opciones?.baseUrl ?? process.env.CRM_BASE_URL;
      const secreto = opciones?.secreto ?? process.env.CRM_SHARED_SECRET;
      if (!baseUrl) throw new ErrorDeCrm("RED", "Falta CRM_BASE_URL");
      if (!secreto) throw new ErrorDeCrm("AUTENTICACION", "Falta CRM_SHARED_SECRET");

      let respuesta: Response;
      try {
        respuesta = await fetch(`${baseUrl}/api/service/v1/authorize`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secreto}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
      } catch (e) {
        throw new ErrorDeCrm("RED", e instanceof Error ? e.message : String(e));
      }

      // El contrato es explícito: un "no autorizado" viaja como 200 con
      // `authorized:false`. Un 4xx/5xx es otra cosa y no se confunde con un no.
      if (respuesta.status === 401) throw new ErrorDeCrm("AUTENTICACION", "Secreto rechazado por el CRM");
      if (respuesta.status === 400) throw new ErrorDeCrm("CONTRATO", "El CRM rechazó el body");
      if (!respuesta.ok) throw new ErrorDeCrm("RED", `CRM respondió ${respuesta.status}`);

      return (await respuesta.json()) as RespuestaDelCrm;
    },
  };
}
