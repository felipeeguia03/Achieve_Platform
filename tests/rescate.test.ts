import { describe, expect, it } from "vitest";

import { rescatar, type Compromiso, type RepositorioDeCompromisos } from "@/lib/server/servicios/compromiso";
import { commitmentTransitions } from "@/lib/domain/state-machines";

/**
 * Etapa B6.9.1 — **la salida del camino que no salió bien**.
 *
 * Lo que estos tests protegen no es que el rescate funcione: eso ya estaba
 * probado desde la Fase B2. Es que **exista una salida**, y que la salida no
 * borre el incumplimiento.
 */
describe("B6.9.1 · el incumplimiento tiene salida, y no se edita", () => {
  it("la máquina no admite ningún camino de MISSED a cumplido", () => {
    // Si alguna vez alguien agrega uno, esto rompe **antes** que cualquier
    // pantalla: es la garantía de la que cuelga todo el resto.
    expect(commitmentTransitions.MISSED).toEqual(["CLOSED"]);
    for (const desde of ["COMPLETED", "RENEGOTIATED", "CLOSED"] as const) {
      expect(commitmentTransitions[desde]).toEqual([]);
    }
  });

  it("un MISSED no se puede comprometer de nuevo: sólo se rescata", () => {
    // El rescate no aparece como destino de ninguna transición **a propósito**:
    // no es un estado, es otra fila.
    expect(commitmentTransitions.CONFIRMED).not.toContain("COMPLETED");
    expect(Object.values(commitmentTransitions).flat()).not.toContain("RESCUE");
  });

  const incumplido: Compromiso = {
    id: "c-missed",
    institutionId: "inst-A",
    actionId: "a-1",
    rescuesCommitmentId: null,
    renegotiatedFromId: null,
    scheduledFor: "2026-09-02T19:00:00.000Z",
    state: "MISSED",
  };

  function repo(fila: Compromiso | null, creado: Compromiso | null = null) {
    const escrituras: string[] = [];
    const r = {
      async porId() {
        return fila;
      },
      async cambiarEstadoSi() {
        escrituras.push("cambiarEstadoSi");
        return null;
      },
      async renegociarAtomico() {
        escrituras.push("renegociarAtomico");
        return null;
      },
      async crearRescateAtomico() {
        escrituras.push("crearRescateAtomico");
        return creado;
      },
    } as unknown as RepositorioDeCompromisos;
    return { repo: r, escrituras };
  }

  const ACUERDO = { startAt: "2026-09-05T12:00:00.000Z", timezone: "America/Argentina/Cordoba", plannedMinutes: 45 };

  it("rescatar un MISSED crea otro objeto y publica que se creó, no que se cumplió", async () => {
    const publicados: string[] = [];
    const { repo: r } = repo(incumplido, { ...incumplido, id: "c-rescate", state: "CONFIRMED", rescuesCommitmentId: "c-missed" });
    const eventos = { async publicar(e: { nombre: string }) { publicados.push(e.nombre); } };

    const resultado = await rescatar({ repo: r, eventos }, "inst-A", "c-missed", ACUERDO, "est-1");

    expect(resultado.estado).toBe("OK");
    // `CommitmentRescueCreated` dice que el rescate se creó. `RescueSucceeded`
    // es otro hecho y llega después, cuando el rescate se completa: crear no es
    // recuperar.
    expect(publicados).toEqual(["CommitmentRescueCreated"]);
    expect(publicados).not.toContain("RescueSucceeded");
  });

  it("lo que no está incumplido no se rescata, y no se escribe nada", async () => {
    const { repo: r, escrituras } = repo({ ...incumplido, state: "CONFIRMED" });
    const eventos = { async publicar() {} };

    const resultado = await rescatar({ repo: r, eventos }, "inst-A", "c-missed", ACUERDO, "est-1");

    expect(resultado).toEqual({ estado: "NO_INCUMPLIDO", desde: "CONFIRMED" });
    expect(escrituras).toEqual([]);
  });

  it("si otro se adelantó, el rescate no se inventa", async () => {
    const { repo: r } = repo(incumplido, null);
    const publicados: string[] = [];
    const eventos = { async publicar(e: { nombre: string }) { publicados.push(e.nombre); } };

    expect((await rescatar({ repo: r, eventos }, "inst-A", "c-missed", ACUERDO, "est-1")).estado).toBe("CONFLICTO");
    // Y sobre todo: no se publica un hecho de algo que no ocurrió.
    expect(publicados).toEqual([]);
  });
});
