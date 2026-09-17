import { describe, expect, it } from "vitest";

import {
  resubmitir,
  transicionar,
  type Evidencia,
  type RepositorioDeEvidencias,
} from "@/lib/server/servicios/evidencia";
import type { EventoDeProducto, PublicadorDeEventos } from "@/lib/server/servicios/eventos";
import { claveDeObjeto } from "@/lib/server/repositorios/almacenamiento";
import { evidenceOwnerTransitions } from "@/lib/domain/state-machines";
import type { EvidenceState } from "@/lib/domain/types";

/** Etapa B2.3 — `Evidence`, resubmission y storage. */

const BASE: Evidencia = {
  id: "ev-1",
  institutionId: "inst-A",
  actionId: "act-1",
  state: "SUBMITTED",
  supersededById: null,
  reviewInstanceId: null,
};

function falso(inicial: Partial<Evidencia> = {}, opciones: { pierde?: boolean } = {}) {
  let fila: Evidencia | null = { ...BASE, ...inicial };
  const historia: Evidencia[] = [];
  const publicados: EventoDeProducto[] = [];

  const repo: RepositorioDeEvidencias = {
    async porId(inst, id) {
      if (!fila || fila.institutionId !== inst || fila.id !== id) return null;
      return { ...fila };
    },
    async cambiarEstadoSi(inst, id, esperado, nuevo, columnas) {
      if (opciones.pierde) return null;
      if (!fila || fila.institutionId !== inst || fila.state !== esperado) return null;
      fila = {
        ...fila,
        state: nuevo,
        reviewInstanceId: (columnas?.review_instance_id as string) ?? fila.reviewInstanceId,
      };
      return { ...fila };
    },
    async resubmitirAtomico(inst, anteriorId) {
      if (opciones.pierde) return null;
      if (!fila || fila.institutionId !== inst || fila.id !== anteriorId) return null;
      // La anterior se PRESERVA: se guarda tal cual antes de crear la nueva.
      historia.push({ ...fila, supersededById: "ev-2" });
      return { ...BASE, id: "ev-2", state: "SUBMITTED" };
    },
  };
  const eventos: PublicadorDeEventos = { async publicar(e) { publicados.push(e); } };
  return { deps: { repo, eventos }, publicados, historia, actual: () => fila };
}

describe("B2.3 · la máquina de `Evidence`", () => {
  it("ninguna transición prohibida llega a escribir", async () => {
    const estados = Object.keys(evidenceOwnerTransitions) as EvidenceState[];
    for (const desde of estados) {
      for (const hacia of estados) {
        if (evidenceOwnerTransitions[desde].includes(hacia)) continue;
        const { deps, publicados } = falso({ state: desde });
        const r = await transicionar(deps, "inst-A", "ev-1", hacia, { reviewInstanceId: "rev-1" });
        expect(r.estado, `${desde} → ${hacia}`).toBe("TRANSICION_PROHIBIDA");
        expect(publicados, `${desde} → ${hacia}`).toEqual([]);
      }
    }
  });

  /**
   * `AGENTS.md` §2.1: enviar no es suficiencia, suficiencia no es validación.
   * La máquina lo sostiene — de `SUBMITTED` no se salta a `VALIDATED`.
   */
  it("de SUBMITTED no se salta a VALIDATED", async () => {
    const { deps } = falso({ state: "SUBMITTED" });
    expect((await transicionar(deps, "inst-A", "ev-1", "VALIDATED")).estado).toBe("TRANSICION_PROHIBIDA");
  });
});

describe("B2.3 · I5 · UNDER_REVIEW exige una revisión real", () => {
  it("sin instancia se rechaza antes de tocar la base", async () => {
    const { deps, publicados, actual } = falso({ state: "SUBMITTED" });
    const r = await transicionar(deps, "inst-A", "ev-1", "UNDER_REVIEW");
    expect(r.estado).toBe("FALTA_INSTANCIA_DE_REVISION");
    expect(actual()?.state).toBe("SUBMITTED");
    expect(publicados).toEqual([]);
  });

  it("con instancia real, avanza", async () => {
    const { deps, actual } = falso({ state: "SUBMITTED" });
    const r = await transicionar(deps, "inst-A", "ev-1", "UNDER_REVIEW", { reviewInstanceId: "rev-1" });
    expect(r.estado).toBe("OK");
    expect(actual()?.state).toBe("UNDER_REVIEW");
  });
});

describe("B2.3 · I4 · la resubmission preserva la anterior", () => {
  it("crea una evidencia NUEVA y conserva la vieja con su estado", async () => {
    const { deps, historia, publicados } = falso({ state: "RESUBMISSION_REQUESTED" });
    const r = await resubmitir(deps, "inst-A", "ev-1", "WEB");

    expect(r.estado).toBe("OK");
    expect(r).toMatchObject({ evidencia: { id: "ev-2" } });
    // La anterior sigue existiendo, con su estado intacto y su sucesora anotada.
    expect(historia[0]).toMatchObject({ id: "ev-1", state: "RESUBMISSION_REQUESTED", supersededById: "ev-2" });
    expect(publicados[0].nombre).toBe("EvidenceResubmitted");
  });

  it("sólo se resubmite lo que fue devuelto para resubmitir", async () => {
    // `EXPECTED` está en la lista a propósito: la máquina lo deja ir a
    // `SUBMITTED`, pero eso es la PRIMERA entrega. Confundirlas creaba una
    // segunda fila para algo que nunca se entregó — lo encontró este test.
    for (const desde of ["EXPECTED", "SUBMITTED", "UNDER_REVIEW", "VALIDATED"] as const) {
      const { deps, historia } = falso({ state: desde });
      const r = await resubmitir(deps, "inst-A", "ev-1", "WEB");
      expect(r.estado, desde).toBe("TRANSICION_PROHIBIDA");
      expect(historia, desde).toEqual([]);
    }
  });

  it("una cadena de resubmission es lineal: no se bifurca", async () => {
    const { deps, historia } = falso({ state: "RESUBMISSION_REQUESTED", supersededById: "ev-9" });
    expect((await resubmitir(deps, "inst-A", "ev-1", "WEB")).estado).toBe("CONFLICTO");
    expect(historia).toEqual([]);
  });
});

describe("B2.3 · la clave del objeto no la elige el cliente", () => {
  /**
   * Si el cliente propusiera la ruta, pediría una firma para la carpeta de otra
   * institución y escribiría ahí. La clave se **deriva**.
   */
  it("empieza por la institución y la evidencia", () => {
    expect(claveDeObjeto("inst-A", "ev-1", "foto.jpg")).toBe("inst-A/ev-1/foto.jpg");
  });

  it("un nombre con `../` no escapa de su carpeta", () => {
    const clave = claveDeObjeto("inst-A", "ev-1", "../../inst-B/robado.jpg");
    expect(clave.startsWith("inst-A/ev-1/")).toBe(true);
    expect(clave).not.toContain("..");
    expect(clave).not.toContain("inst-B/");
  });
});
