import { afterEach, describe, expect, it, vi } from "vitest";

import { crearClienteDeCrm, ErrorDeCrm } from "@/lib/server/repositorios/crm";
import {
  autorizarPorPadron,
  type ClienteDeCrm,
  type RepositorioDeInstituciones,
} from "@/lib/server/servicios/autorizacion";

/**
 * Etapa B1.6 — contract tests del endpoint de autorización.
 *
 * Cubren lo que el Done de la Fase B1 exige: `authorized:true`, **los tres
 * rechazos**, `400`, `401` y reintento de red/5xx. **Con datos sintéticos:**
 * ADR-006 sigue `PENDING` y ninguna llamada sale a un CRM real.
 */

const ENTRADA = { email: "sintetico@example.test", platformStudentId: "11111111-1111-1111-1111-111111111111" };
const CRM_INST = "cccccccc-cccc-cccc-cccc-cccccccccccc";

function responde(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as unknown as Response);
}

afterEach(() => vi.unstubAllGlobals());

// ── El cliente HTTP contra el contrato de §1 ─────────────────────────────────

describe("B1.6 · el cliente traduce el contrato tal cual", () => {
  const cliente = () => crearClienteDeCrm({ baseUrl: "http://crm.test", secreto: "s3cr3t0" });

  it("`authorized:true` devuelve institución y estudiante del CRM", async () => {
    vi.stubGlobal("fetch", responde(200, { authorized: true, institutionId: CRM_INST, studentId: "s-1" }));
    await expect(cliente().autorizar(ENTRADA)).resolves.toEqual({
      authorized: true,
      institutionId: CRM_INST,
      studentId: "s-1",
    });
  });

  /**
   * Los tres rechazos viajan como **`200` con `authorized:false`**. Tratarlos
   * como error de red los volvería reintentables, y el estudiante quedaría
   * esperando por algo que ya fue contestado.
   */
  it.each(["not_in_roster", "institution_terminated", "ambiguous"] as const)(
    "`%s` es un 200, no un error",
    async (reason) => {
      vi.stubGlobal("fetch", responde(200, { authorized: false, reason }));
      await expect(cliente().autorizar(ENTRADA)).resolves.toEqual({ authorized: false, reason });
    },
  );

  it("`401` es problema del secreto, no del estudiante", async () => {
    vi.stubGlobal("fetch", responde(401, { error: "unauthorized" }));
    await expect(cliente().autorizar(ENTRADA)).rejects.toMatchObject({ clase: "AUTENTICACION" });
  });

  it("`400` es problema del body, no del padrón", async () => {
    vi.stubGlobal("fetch", responde(400, { error: "invalid_request" }));
    await expect(cliente().autorizar(ENTRADA)).rejects.toMatchObject({ clase: "CONTRATO" });
  });

  it("`5xx` y la caída de red son la misma clase: reintentable", async () => {
    vi.stubGlobal("fetch", responde(503, {}));
    await expect(cliente().autorizar(ENTRADA)).rejects.toMatchObject({ clase: "RED" });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    await expect(cliente().autorizar(ENTRADA)).rejects.toBeInstanceOf(ErrorDeCrm);
  });

  it("sin secreto no sale la llamada", async () => {
    const espia = responde(200, {});
    vi.stubGlobal("fetch", espia);
    await expect(
      crearClienteDeCrm({ baseUrl: "http://crm.test", secreto: "" }).autorizar(ENTRADA),
    ).rejects.toMatchObject({ clase: "AUTENTICACION" });
    expect(espia).not.toHaveBeenCalled();
  });
});

// ── El Service: traducción de institución y la regla de alta manual ──────────

function deps(respuesta: unknown, mapeadas: Record<string, string> = {}) {
  const crm: ClienteDeCrm = {
    async autorizar() {
      if (respuesta instanceof Error) throw respuesta;
      return respuesta as never;
    },
  };
  const instituciones: RepositorioDeInstituciones = {
    async porIdDeCrm(id) {
      return mapeadas[id] ?? null;
    },
  };
  return { crm, instituciones };
}

describe("B1.6 · la institución del CRM se traduce, no se adopta", () => {
  it("autorizado y mapeado devuelve el `institution_id` de Plataforma", async () => {
    const r = await autorizarPorPadron(
      deps({ authorized: true, institutionId: CRM_INST, studentId: "s-1" }, { [CRM_INST]: "inst-propia" }),
      ENTRADA,
    );
    expect(r).toEqual({ estado: "AUTORIZADO", institutionId: "inst-propia", crmStudentId: "s-1" });
  });

  /**
   * ADR-005 ítem 6: una institución desconocida **no se crea sola**. Dar de
   * alta una institución es firmar un convenio, no un efecto secundario de un
   * login.
   */
  it("autorizado pero sin mapear NO da acceso y NO crea la institución", async () => {
    const r = await autorizarPorPadron(
      deps({ authorized: true, institutionId: CRM_INST, studentId: "s-1" }),
      ENTRADA,
    );
    expect(r).toEqual({ estado: "INSTITUCION_NO_DADA_DE_ALTA", crmInstitutionId: CRM_INST });
  });

  it("el id de Plataforma nunca es el del CRM", async () => {
    const r = await autorizarPorPadron(
      deps({ authorized: true, institutionId: CRM_INST, studentId: "s-1" }, { [CRM_INST]: "inst-propia" }),
      ENTRADA,
    );
    expect(r).toMatchObject({ institutionId: "inst-propia" });
    expect(JSON.stringify(r)).not.toContain(CRM_INST);
  });

  /**
   * Una caída de red no es un "no". Decirle al estudiante que su institución no
   * lo habilitó cuando se cayó una conexión es mentirle sobre su situación, y
   * además le esconde que hay que reintentar.
   */
  it("una integración caída no se confunde con un rechazo", async () => {
    const r = await autorizarPorPadron(deps(new Error("ECONNREFUSED")), ENTRADA);
    expect(r.estado).toBe("INTEGRACION_CAIDA");
  });

  it.each(["not_in_roster", "institution_terminated", "ambiguous"] as const)(
    "el rechazo `%s` viaja sin reinterpretarse",
    async (reason) => {
      const r = await autorizarPorPadron(deps({ authorized: false, reason }), ENTRADA);
      expect(r).toEqual({ estado: "RECHAZADO", razon: reason });
    },
  );
});
