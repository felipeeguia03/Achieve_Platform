import { describe, expect, it } from "vitest";

import { aceptar, transicionar, type Accion, type RepositorioDeAcciones } from "@/lib/server/servicios/accion";
import type { EventoDeProducto, PublicadorDeEventos } from "@/lib/server/servicios/eventos";
import { actionTransitions } from "@/lib/domain/state-machines";
import type { ActionStatus } from "@/lib/domain/types";

/** Etapa B2.1 — Service de `Action`, con Repository falso (§3.7). */

function falso(estado: ActionStatus, opciones: { seLoLlevanOtro?: boolean } = {}) {
  let fila: Accion | null = {
    id: "act-1",
    institutionId: "inst-A",
    state: estado,
    courseEnrollmentId: "ce-1",
  };
  const escrituras: Array<{ esperado: ActionStatus; nuevo: ActionStatus; columnas?: object }> = [];
  const publicados: EventoDeProducto[] = [];

  const repo: RepositorioDeAcciones = {
    async porId(inst, id) {
      if (!fila || fila.institutionId !== inst || fila.id !== id) return null;
      return { ...fila };
    },
    async cambiarEstadoSi(inst, id, esperado, nuevo, columnas) {
      escrituras.push({ esperado, nuevo, columnas });
      if (opciones.seLoLlevanOtro) return null;
      if (!fila || fila.institutionId !== inst || fila.state !== esperado) return null;
      fila = { ...fila, state: nuevo };
      return { ...fila };
    },
  };
  const eventos: PublicadorDeEventos = {
    async publicar(e) {
      publicados.push(e);
    },
  };
  return { deps: { repo, eventos }, escrituras, publicados, actual: () => fila };
}

describe("B2.1 · la máquina de `Action`", () => {
  it("ninguna transición prohibida de la tabla llega a escribir", async () => {
    const estados = Object.keys(actionTransitions) as ActionStatus[];
    for (const desde of estados) {
      for (const hacia of estados) {
        if (actionTransitions[desde].includes(hacia)) continue;
        const { deps, escrituras } = falso(desde);
        const r = await transicionar(deps, "inst-A", "act-1", hacia, {
          razonDeBloqueo: "x",
          reemplazadaPorId: "act-2",
        });
        expect(r.estado, `${desde} → ${hacia}`).toBe("TRANSICION_PROHIBIDA");
        expect(escrituras, `${desde} → ${hacia}`).toEqual([]);
      }
    }
  });

  it("otra institución recibe NO_ENCONTRADO, indistinguible de inexistente", async () => {
    const { deps } = falso("RECOMMENDED");
    expect((await transicionar(deps, "inst-B", "act-1", "ACCEPTED")).estado).toBe("NO_ENCONTRADO");
  });
});

describe("B2.1 · aceptar una Action NO crea un Commitment", () => {
  /**
   * El invariante que `AGENTS.md` §2.1 pone primero. En la pantalla,
   * *"Comprometerme"* y aceptar parecen el mismo gesto; en el dominio son dos
   * operaciones, y el Commitment nace recién cuando el estudiante confirma.
   */
  it("`aceptar` sólo mueve el estado y publica un evento de Action", async () => {
    const { deps, publicados, actual } = falso("RECOMMENDED");
    const r = await aceptar(deps, "inst-A", "act-1", "actor-1");

    expect(r.estado).toBe("OK");
    expect(actual()?.state).toBe("ACCEPTED");
    expect(publicados).toHaveLength(1);
    expect(publicados[0].nombre).toBe("ActionAccepted");
    // Nada relacionado con Commitment: ni evento, ni sujeto.
    expect(publicados[0].sujetoTipo).toBe("action");
    expect(JSON.stringify(publicados)).not.toMatch(/commitment/i);
  });
});

describe("B2.1 · BLOCKED explica, o no ocurre", () => {
  /**
   * `P-01`: la interfaz explica la regla de negocio. Un `BLOCKED` sin razón
   * deja al estudiante con un estado y sin nada que hacer con él.
   */
  it("bloquear sin razón se rechaza antes de tocar la base", async () => {
    const { deps, escrituras, publicados } = falso("RECOMMENDED");
    const r = await transicionar(deps, "inst-A", "act-1", "BLOCKED");
    expect(r.estado).toBe("FALTA_RAZON");
    expect(escrituras).toEqual([]);
    expect(publicados).toEqual([]);
  });

  it("con razón, la persiste", async () => {
    const { deps, escrituras } = falso("RECOMMENDED");
    await transicionar(deps, "inst-A", "act-1", "BLOCKED", { razonDeBloqueo: "sin recurso" });
    expect(escrituras[0].columnas).toMatchObject({ blocked_reason: "sin recurso" });
  });

  /**
   * Salir de `BLOCKED` limpia la razón. Conservarla haría que la pantalla
   * mostrara un bloqueo que ya no existe — y `UX03` muestra esa línea.
   */
  it("salir de BLOCKED borra la razón", async () => {
    const { deps, escrituras } = falso("BLOCKED");
    await transicionar(deps, "inst-A", "act-1", "ACCEPTED");
    expect(escrituras[0].columnas).toMatchObject({ blocked_reason: null });
  });
});
