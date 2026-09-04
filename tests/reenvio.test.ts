import { describe, expect, it } from "vitest";

import { transicionar, resubmitir, type RepositorioDeEvidencias } from "@/lib/server/servicios/evidencia";
import { evidenceOwnerTransitions } from "@/lib/domain/state-machines";
import type { EvidenceState } from "@/lib/domain/types";

/**
 * Etapa B6.9.2 — **el otro extremo del camino que no salió bien**.
 *
 * Una entrega devuelta se puede volver a presentar. Lo que estos tests
 * protegen es que el pedido **diga por qué**, que sólo se reenvíe lo que fue
 * devuelto, y que la anterior no se toque.
 */
describe("B6.9.2 · una entrega devuelta se puede volver a presentar", () => {
  it("el único camino a RESUBMISSION_REQUESTED sale de INSUFFICIENT", () => {
    // Si alguien abre otro, el pedido dejaría de significar "alguien lo juzgó
    // y no alcanzó".
    const desdeDondeSePide = Object.entries(evidenceOwnerTransitions)
      .filter(([, hacia]) => (hacia as readonly string[]).includes("RESUBMISSION_REQUESTED"))
      .map(([desde]) => desde);
    expect(desdeDondeSePide).toEqual(["INSUFFICIENT"]);
  });

  type Fila = {
    id: string;
    institutionId: string;
    actionId: string;
    commitmentId: string | null;
    state: EvidenceState;
    reviewInstanceId: string | null;
    supersededById: string | null;
  };

  const evidencia: Fila = {
    id: "ev-1",
    institutionId: "inst-A",
    actionId: "a-1",
    commitmentId: "c-1",
    state: "INSUFFICIENT",
    reviewInstanceId: null,
    supersededById: null,
  };

  function deps(fila: Fila | null, guardado: unknown = { ...evidencia, state: "RESUBMISSION_REQUESTED" }) {
    const columnas: Record<string, unknown>[] = [];
    const publicados: string[] = [];
    const repo = {
      async porId() {
        return fila;
      },
      async cambiarEstadoSi(_i: string, _id: string, _d: string, _h: string, extra: Record<string, unknown>) {
        columnas.push(extra ?? {});
        return guardado;
      },
      async resubmitirAtomico() {
        return { ...evidencia, id: "ev-2", state: "SUBMITTED" as const, supersedesId: "ev-1" };
      },
    } as unknown as RepositorioDeEvidencias;
    return { repo, eventos: { async publicar(e: { nombre: string }) { publicados.push(e.nombre); } }, columnas, publicados };
  }

  it("pedir un reenvío sin motivo no escribe nada", async () => {
    const d = deps(evidencia);
    const r = await transicionar(d, "inst-A", "ev-1", "RESUBMISSION_REQUESTED", { motivo: "   " });

    expect(r.estado).toBe("FALTA_MOTIVO");
    expect(d.columnas).toEqual([]);
    // Y sobre todo: no se publica el hecho de un pedido que no ocurrió.
    expect(d.publicados).toEqual([]);
  });

  it("el motivo se persiste con el pedido: es lo que el estudiante tiene para corregir", async () => {
    const d = deps(evidencia);
    const r = await transicionar(d, "inst-A", "ev-1", "RESUBMISSION_REQUESTED", {
      motivo: "Faltan los ejercicios 15 a 18",
    });

    expect(r.estado).toBe("OK");
    expect(d.columnas[0]).toMatchObject({ resubmission_reason: "Faltan los ejercicios 15 a 18" });
  });

  it("un reenvío nace como fila nueva y no edita la anterior", async () => {
    const devuelta: Fila = { ...evidencia, state: "RESUBMISSION_REQUESTED" };
    const d = deps(devuelta);
    const r = await resubmitir(d, "inst-A", "ev-1", "WEB", "clave-1", "est-1", "ev-2");

    expect(r.estado).toBe("OK");
    if (r.estado === "OK") expect(r.evidencia.id).toBe("ev-2");
    // `cambiarEstadoSi` no se llamó: la anterior conserva estado, contenido y
    // fecha. Es el registro de lo que se entregó primero.
    expect(d.columnas).toEqual([]);
  });

  it("sólo se reenvía lo que fue devuelto", async () => {
    for (const state of ["SUBMITTED", "INSUFFICIENT", "VALIDATED"] as const) {
      const d = deps({ ...evidencia, state } as Fila);
      const r = await resubmitir(d, "inst-A", "ev-1", "WEB", "clave-1", "est-1", "ev-2");
      expect(r.estado).toBe("TRANSICION_PROHIBIDA");
    }
  });
});
