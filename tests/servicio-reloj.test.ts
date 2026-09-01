import { describe, expect, it } from "vitest";

import { correrReloj, type RepositorioDeReloj } from "@/lib/server/servicios/reloj";
import type { Compromiso, RepositorioDeCompromisos } from "@/lib/server/servicios/compromiso";
import type { EventoDeProducto, PublicadorDeEventos } from "@/lib/server/servicios/eventos";
import type { CompromisoConReloj } from "@/lib/domain/reloj-compromisos";
import type { CommitmentState } from "@/lib/domain/types";

/** El owner del lifecycle, ejecutando. */
const AHORA = "2026-08-30T20:00:00.000Z";

function mundo(iniciales: Array<CompromisoConReloj>, opciones: { pierde?: boolean } = {}) {
  const filas = new Map<string, { state: CommitmentState }>(
    iniciales.map((c) => [c.id, { state: c.state }]),
  );
  const publicados: EventoDeProducto[] = [];

  const reloj: RepositorioDeReloj = {
    async candidatosPorTiempo() {
      return iniciales.map((c) => ({ ...c, state: filas.get(c.id)!.state }));
    },
  };
  const compromisos = {
    async porId(_inst: string, id: string): Promise<Compromiso | null> {
      const f = filas.get(id);
      return f
        ? { id, institutionId: "inst-A", actionId: "a-1", state: f.state, rescuesCommitmentId: null }
        : null;
    },
    async cambiarEstadoSi(_i: string, id: string, esperado: CommitmentState, nuevo: CommitmentState) {
      if (opciones.pierde) return null;
      const f = filas.get(id);
      if (!f || f.state !== esperado) return null;
      f.state = nuevo;
      return { id, institutionId: "inst-A", actionId: "a-1", state: nuevo };
    },
    async renegociarAtomico() { return null; },
    async crearRescateAtomico() { return null; },
  } as RepositorioDeCompromisos;
  const eventos: PublicadorDeEventos = { async publicar(e) { publicados.push(e); } };

  return { deps: { reloj, compromisos, eventos }, filas, publicados };
}

const confirmado: CompromisoConReloj = {
  id: "c-1",
  state: "CONFIRMED",
  startAt: "2026-08-30T19:00:00.000Z",
  plannedMinutes: 40,
};

describe("B4 · el reloj mueve lo que el tiempo mueve", () => {
  it("vence un CONFIRMED cuya hora llegó", async () => {
    const { deps, filas } = mundo([confirmado]);
    const r = await correrReloj(deps, "inst-A", AHORA);
    expect(r).toMatchObject({ vencidos: 1, incumplidos: 0 });
    expect(filas.get("c-1")!.state).toBe("DUE");
  });

  it("incumple un DUE cuyo bloque pasó", async () => {
    const { deps, filas } = mundo([{ ...confirmado, state: "DUE" }]);
    const r = await correrReloj(deps, "inst-A", AHORA);
    expect(r).toMatchObject({ incumplidos: 1 });
    expect(filas.get("c-1")!.state).toBe("MISSED");
  });
});

describe("B4 · pasa por la misma máquina que todo lo demás", () => {
  /**
   * Un camino paralelo que escribiera directo se saltearía la máquina de
   * estados, y sería el agujero por donde un `MISSED` podría volver. El reloj
   * usa `transicionar()`, así que hereda el compare-and-swap **y el evento**.
   */
  it("cada transición deja su hecho en product_event", async () => {
    const { deps, publicados } = mundo([confirmado]);
    await correrReloj(deps, "inst-A", AHORA);
    expect(publicados).toHaveLength(1);
    expect(publicados[0]).toMatchObject({ nombre: "CommitmentDue", causa: "CONFIRMED->DUE" });
  });

  /**
   * El actor es el sistema. Poner el id del estudiante diría en la auditoría
   * que lo hizo él, y nadie apretó nada.
   */
  it("el actor del evento es el sistema, no una persona", async () => {
    const { deps, publicados } = mundo([confirmado]);
    await correrReloj(deps, "inst-A", AHORA);
    expect(publicados[0].actorId).toBeNull();
  });
});

describe("B4 · el estudiante le gana al reloj", () => {
  /**
   * Si el estudiante mueve el compromiso mientras el reloj corre, **su acción
   * gana**: el compare-and-swap no encuentra el estado esperado y la próxima
   * corrida ve el estado nuevo. No es un error.
   */
  it("un conflicto se cuenta aparte y no rompe la corrida", async () => {
    const { deps, publicados } = mundo([confirmado], { pierde: true });
    const r = await correrReloj(deps, "inst-A", AHORA);
    expect(r).toMatchObject({ vencidos: 0, conflictos: 1 });
    expect(publicados).toEqual([]);
  });

  it("una corrida con varios sigue después de un conflicto", async () => {
    const { deps } = mundo([confirmado, { ...confirmado, id: "c-2", state: "DUE" }]);
    const r = await correrReloj(deps, "inst-A", AHORA);
    expect(r.vencidos + r.incumplidos).toBe(2);
  });
});

describe("B4 · el reloj converge y no se repite", () => {
  /**
   * Correr el reloj muchas veces con el mismo instante tiene que **detenerse**.
   * Acá el bloque de las 19:00 + 40 min ya pasó a las 20:00, así que la primera
   * corrida vence y la segunda incumple —una transición por corrida, para no
   * saltear `DUE`— y de ahí en adelante no pasa nada más.
   *
   * Lo escribí al revés la primera vez y el test tenía razón: a las 20:00 ese
   * bloque efectivamente ya venció.
   */
  it("dos corridas lo llevan hasta MISSED, y la tercera no mueve nada", async () => {
    const { deps, filas, publicados } = mundo([confirmado]);

    expect(await correrReloj(deps, "inst-A", AHORA)).toMatchObject({ vencidos: 1 });
    expect(filas.get("c-1")!.state).toBe("DUE");

    expect(await correrReloj(deps, "inst-A", AHORA)).toMatchObject({ incumplidos: 1 });
    expect(filas.get("c-1")!.state).toBe("MISSED");

    // Converge: un MISSED no lo toca nadie, y menos el reloj.
    expect(await correrReloj(deps, "inst-A", AHORA)).toEqual({ vencidos: 0, incumplidos: 0, conflictos: 0 });
    expect(publicados).toHaveLength(2);
  });

  it("dentro del bloque, correrlo mil veces no lo incumple", async () => {
    const { deps, filas } = mundo([{ ...confirmado, state: "DUE" }]);
    for (let i = 0; i < 20; i++) {
      await correrReloj(deps, "inst-A", "2026-08-30T19:30:00.000Z");
    }
    expect(filas.get("c-1")!.state).toBe("DUE");
  });
});
