import { describe, expect, it } from "vitest";

import {
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

  const repo: RepositorioDeCompromisos = {
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
  return { deps: { repo, eventos }, repo, eventos, escrituras, publicados, actual: () => fila };
}

const BASE: Compromiso = {
  id: "c-1",
  institutionId: "inst-A",
  actionId: "a-1",
  state: "CONFIRMED",
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
  it("un MISSED no vuelve a COMPLETED, y no llega a tocar la base", async () => {
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
