import { describe, expect, it } from "vitest";

import {
  renegociar,
  rescatar,
  transicionar,
  type Compromiso,
  type RepositorioDeCompromisos,
} from "@/lib/server/servicios/compromiso";
import type { EventoDeProducto, PublicadorDeEventos } from "@/lib/server/servicios/eventos";
import type { CommitmentState } from "@/lib/domain/types";
import { commitmentTransitions } from "@/lib/domain/state-machines";

/**
 * Etapa B1.4 — unit tests del Service con un Repository falso, sin HTTP ni base
 * real, como pide `architecture.md` §3.7.
 *
 * Lo que **no** se prueba acá, porque un doble no lo puede demostrar: que el
 * compare-and-swap gane una sola escritura bajo concurrencia real. Eso corre
 * contra Postgres en `scripts/db-aislamiento.sh`. Un test que simule la carrera
 * con un mock sólo probaría que el mock la simula.
 */

/** Repository falso, con lo mínimo: una fila y un contador de escrituras. */
function repoFalso(inicial: Compromiso, opciones: { seLoLlevanOtro?: boolean } = {}) {
  const publicados: EventoDeProducto[] = [];
  let fila: Compromiso | null = { ...inicial };
  const escrituras: Array<{ esperado: CommitmentState; nuevo: CommitmentState; marcas?: object }> = [];

  const acuerdos: Array<{ tipo: string; esperado?: string }> = [];
  const creado: Compromiso = { ...inicial, id: "c-2" };

  const repo: RepositorioDeCompromisos = {
    async renegociarAtomico(inst, originalId, esperado) {
      acuerdos.push({ tipo: "renegociar", esperado });
      if (opciones.seLoLlevanOtro) return null;
      if (!fila || fila.institutionId !== inst || fila.id !== originalId) return null;
      if (fila.state !== esperado) return null;
      fila = { ...fila, state: "RENEGOTIATED" };
      return creado;
    },
    async crearRescateAtomico(inst, rescatadoId) {
      acuerdos.push({ tipo: "rescatar" });
      if (opciones.seLoLlevanOtro) return null;
      if (!fila || fila.institutionId !== inst || fila.id !== rescatadoId) return null;
      // El incumplido NO se toca: sigue MISSED.
      if (fila.state !== "MISSED") return null;
      return creado;
    },
    async porId(institutionId, id) {
      if (!fila || fila.institutionId !== institutionId || fila.id !== id) return null;
      return { ...fila };
    },
    async cambiarEstadoSi(institutionId, id, esperado, nuevo, marcas) {
      escrituras.push({ esperado, nuevo, marcas });
      // Simula que otra request se adelantó: el estado esperado ya no está.
      if (opciones.seLoLlevanOtro) return null;
      if (!fila || fila.institutionId !== institutionId || fila.id !== id) return null;
      if (fila.state !== esperado) return null;
      fila = { ...fila, state: nuevo };
      return { ...fila };
    },
  };
  const eventos: PublicadorDeEventos = {
    async publicar(e) {
      publicados.push(e);
    },
  };
  return { deps: { repo, eventos }, repo, eventos, escrituras, publicados, acuerdos, creado, actual: () => fila };
}

const BASE: Compromiso = {
  id: "c-1",
  institutionId: "inst-A",
  actionId: "a-1",
  state: "CONFIRMED",
  rescuesCommitmentId: null,
};

describe("B1.4 · el Service ejecuta la máquina de estados del dominio", () => {
  it("permite una transición declarada", async () => {
    const { deps, actual } = repoFalso(BASE);
    const r = await transicionar(deps, "inst-A", "c-1", "DUE");
    expect(r.estado).toBe("OK");
    expect(actual()?.state).toBe("DUE");
  });

  /**
   * El invariante más caro del producto: un `MISSED` nunca se edita para
   * parecer cumplido. No hace falta una regla nueva — la máquina no tiene esa
   * arista— y este test existe para que se rompa ruidosamente si alguien la
   * agrega.
   */
  it("I1 · un MISSED no vuelve a COMPLETED, y no llega a tocar la base", async () => {
    const { deps, escrituras, actual } = repoFalso({ ...BASE, state: "MISSED" });
    const r = await transicionar(deps, "inst-A", "c-1", "COMPLETED");

    expect(r.estado).toBe("TRANSICION_PROHIBIDA");
    expect(escrituras, "una transición prohibida no merece un viaje a la base").toEqual([]);
    expect(actual()?.state).toBe("MISSED");
  });

  it("ninguna transición prohibida de la tabla llega a escribir", async () => {
    const estados = Object.keys(commitmentTransitions) as CommitmentState[];
    for (const desde of estados) {
      for (const hacia of estados) {
        if (commitmentTransitions[desde].includes(hacia)) continue;
        const { deps, escrituras } = repoFalso({ ...BASE, state: desde });
        const r = await transicionar(deps, "inst-A", "c-1", hacia);
        expect(r.estado, `${desde} → ${hacia}`).toBe("TRANSICION_PROHIBIDA");
        expect(escrituras, `${desde} → ${hacia}`).toEqual([]);
      }
    }
  });
});

describe("B1.4 · scoping institucional", () => {
  /**
   * Desde afuera, "no existe" y "existe en otra institución" tienen que ser
   * indistinguibles: un 404 distinto de un 403 confirma que el objeto existe,
   * y eso ya es una filtración entre tenants.
   */
  it("otra institución recibe NO_ENCONTRADO, no un error distinto", async () => {
    const { deps, escrituras } = repoFalso(BASE);
    const r = await transicionar(deps, "inst-B", "c-1", "DUE");
    expect(r.estado).toBe("NO_ENCONTRADO");
    expect(escrituras).toEqual([]);
  });
});

describe("B1.4 · el conflicto no se confunde con lo prohibido", () => {
  it("si otro se adelantó, es CONFLICTO y no TRANSICION_PROHIBIDA", async () => {
    const { deps } = repoFalso(BASE, { seLoLlevanOtro: true });
    const r = await transicionar(deps, "inst-A", "c-1", "DUE");
    // Distinguirlos importa: de un conflicto se reintenta; de lo prohibido no.
    expect(r.estado).toBe("CONFLICTO");
  });

  it("el estado esperado viaja al Repository: es el compare-and-swap", async () => {
    const { deps, escrituras } = repoFalso(BASE);
    await transicionar(deps, "inst-A", "c-1", "DUE");
    expect(escrituras[0].esperado).toBe("CONFIRMED");
  });
});

describe("B1.4 · marcas de tiempo", () => {
  it("STARTED, COMPLETED y MISSED escriben la suya", async () => {
    const reloj = () => new Date("2026-08-30T12:00:00.000Z");
    const casos: Array<[CommitmentState, CommitmentState, string]> = [
      ["DUE", "STARTED", "started_at"],
      ["STARTED", "COMPLETED", "completed_at"],
      ["DUE", "MISSED", "missed_at"],
    ];
    for (const [desde, hacia, columna] of casos) {
      const { deps, escrituras } = repoFalso({ ...BASE, state: desde });
      await transicionar(deps, "inst-A", "c-1", hacia, null, reloj);
      expect(escrituras[0].marcas, `${desde} → ${hacia}`).toEqual({
        [columna]: "2026-08-30T12:00:00.000Z",
      });
    }
  });

  it("una transición sin marca propia no inventa columnas", async () => {
    const { deps, escrituras } = repoFalso(BASE);
    await transicionar(deps, "inst-A", "c-1", "DUE");
    expect(escrituras[0].marcas).toEqual({});
  });
});

describe("B1.5 · cada transición deja su hecho en `product_event`", () => {
  it("publica el evento con actor, institución, objeto y causa", async () => {
    const { deps, publicados } = repoFalso(BASE);
    await transicionar(deps, "inst-A", "c-1", "DUE", "actor-9");

    expect(publicados).toHaveLength(1);
    expect(publicados[0]).toMatchObject({
      nombre: "CommitmentDue",
      institutionId: "inst-A",
      actorId: "actor-9",
      sujetoTipo: "commitment",
      sujetoId: "c-1",
      causa: "CONFIRMED->DUE",
    });
  });

  /**
   * Un evento de algo que perdió la carrera sería un hecho que no ocurrió. El
   * `product_event` es el registro de lo que pasó, no de lo que se intentó.
   */
  it("no publica si la escritura perdió la carrera", async () => {
    const { deps, publicados } = repoFalso(BASE, { seLoLlevanOtro: true });
    const r = await transicionar(deps, "inst-A", "c-1", "DUE");
    expect(r.estado).toBe("CONFLICTO");
    expect(publicados).toEqual([]);
  });

  it("no publica si la transición estaba prohibida", async () => {
    const { deps, publicados } = repoFalso({ ...BASE, state: "MISSED" });
    await transicionar(deps, "inst-A", "c-1", "COMPLETED");
    expect(publicados).toEqual([]);
  });

  /**
   * El hecho va en columnas propias y el `payload` queda vacío salvo que haga
   * falta. Es la separación que ADR-006 necesita para que una eventual purga
   * no tenga que borrar la fila entera.
   */
  it("el hecho no viaja dentro del payload", async () => {
    const { deps, publicados } = repoFalso(BASE);
    await transicionar(deps, "inst-A", "c-1", "DUE", "actor-9");
    expect(publicados[0].payload ?? {}).toEqual({});
  });
});

const ACUERDO = { startAt: "2026-09-02T19:00:00.000Z", timezone: "America/Argentina/Cordoba", plannedMinutes: 70 };

describe("B2.2 · I2 · renegociar crea una fila nueva", () => {
  it("el original queda RENEGOTIATED y devuelve el sucesor", async () => {
    const { deps, actual, publicados } = repoFalso(BASE);
    const r = await renegociar(deps, "inst-A", "c-1", ACUERDO, "actor-1");

    expect(r.estado).toBe("OK");
    expect(actual()?.state).toBe("RENEGOTIATED");
    expect(publicados[0].nombre).toBe("CommitmentRenegotiated");
    expect(publicados[0].payload).toMatchObject({ sucesorId: "c-2" });
  });

  /**
   * `STARTED` no admite `RENEGOTIATED` en la máquina: renegociar es válido sólo
   * ANTES del vencimiento. La decisión la toma el Service, en TypeScript.
   */
  it("un compromiso ya empezado no se renegocia, y no llega a la base", async () => {
    const { deps, acuerdos, publicados } = repoFalso({ ...BASE, state: "STARTED" });
    const r = await renegociar(deps, "inst-A", "c-1", ACUERDO);
    expect(r).toEqual({ estado: "NO_RENEGOCIABLE", desde: "STARTED" });
    expect(acuerdos).toEqual([]);
    expect(publicados).toEqual([]);
  });

  it("el estado esperado viaja a la operación atómica", async () => {
    const { deps, acuerdos } = repoFalso(BASE);
    await renegociar(deps, "inst-A", "c-1", ACUERDO);
    expect(acuerdos[0]).toEqual({ tipo: "renegociar", esperado: "CONFIRMED" });
  });

  it("si otro se adelantó es CONFLICTO, y no publica", async () => {
    const { deps, publicados } = repoFalso(BASE, { seLoLlevanOtro: true });
    expect((await renegociar(deps, "inst-A", "c-1", ACUERDO)).estado).toBe("CONFLICTO");
    expect(publicados).toEqual([]);
  });
});

describe("B2.2 · I3 · un rescate sólo apunta a un MISSED", () => {
  it("rescatar un MISSED crea el objeto y NO edita el incumplimiento", async () => {
    const { deps, actual, publicados } = repoFalso({ ...BASE, state: "MISSED" });
    const r = await rescatar(deps, "inst-A", "c-1", ACUERDO, "actor-1");

    expect(r.estado).toBe("OK");
    // No Cortar: el incumplido sigue incumplido.
    expect(actual()?.state).toBe("MISSED");
    expect(publicados[0].nombre).toBe("CommitmentRescueCreated");
  });

  it("no se rescata algo que no está incumplido", async () => {
    for (const desde of ["CONFIRMED", "DUE", "COMPLETED", "CLOSED"] as const) {
      const { deps, acuerdos } = repoFalso({ ...BASE, state: desde });
      const r = await rescatar(deps, "inst-A", "c-1", ACUERDO);
      expect(r, desde).toEqual({ estado: "NO_INCUMPLIDO", desde });
      expect(acuerdos, desde).toEqual([]);
    }
  });

  it("otra institución no puede rescatar nada", async () => {
    const { deps, acuerdos } = repoFalso({ ...BASE, state: "MISSED" });
    expect((await rescatar(deps, "inst-B", "c-1", ACUERDO)).estado).toBe("NO_ENCONTRADO");
    expect(acuerdos).toEqual([]);
  });
});


describe("B3.3 · RescueSucceeded, el hecho que faltaba del P0", () => {
  /**
   * Hasta esta etapa existía `CommitmentRescueCreated` —el rescate se creó— y
   * **nada que dijera si funcionó**. §16 define `RescueSucceeded` como *"retorno
   * después de incumplimiento"*, y eso es justamente lo que el producto quiere
   * medir: la recuperación, no la intención de recuperarse.
   */
  it("completar un rescate lo emite, **además** de CommitmentCompleted", async () => {
    const { deps, publicados } = repoFalso({ ...BASE, state: "STARTED", rescuesCommitmentId: "c-missed" });
    const r = await transicionar(deps, "inst-A", "c-1", "COMPLETED");

    expect(r.estado).toBe("OK");
    const nombres = publicados.map((e) => e.nombre);
    // Dos hechos distintos que ocurren juntos, no uno con dos nombres.
    expect(nombres).toEqual(["CommitmentCompleted", "RescueSucceeded"]);
  });

  it("y dice a qué incumplimiento rescata, sin tocarlo", async () => {
    const { deps, publicados } = repoFalso({ ...BASE, state: "STARTED", rescuesCommitmentId: "c-missed" });
    await transicionar(deps, "inst-A", "c-1", "COMPLETED");
    const rescate = publicados.find((e) => e.nombre === "RescueSucceeded")!;
    // `I3`: el MISSED original conserva su estado. El evento lo referencia, no
    // lo modifica.
    expect(rescate.causa).toBe("rescata:c-missed");
    expect(rescate.sujetoId).toBe("c-1");
  });

  it("completar un compromiso que no rescata nada NO lo emite", async () => {
    const { deps, publicados } = repoFalso({ ...BASE, state: "STARTED" });
    await transicionar(deps, "inst-A", "c-1", "COMPLETED");
    expect(publicados.map((e) => e.nombre)).toEqual(["CommitmentCompleted"]);
  });

  it("un rescate que no llega a COMPLETED tampoco lo emite", async () => {
    // Empezar un rescate no es recuperarse.
    const { deps, publicados } = repoFalso({ ...BASE, state: "DUE", rescuesCommitmentId: "c-missed" });
    await transicionar(deps, "inst-A", "c-1", "STARTED");
    expect(publicados.map((e) => e.nombre)).toEqual(["CommitmentStarted"]);
  });
});
