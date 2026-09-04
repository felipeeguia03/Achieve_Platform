import { describe, expect, it } from "vitest";

import {
  confirmarCompromiso,
  type ConfirmacionDeCompromiso,
  type HuellaDeCompromiso,
  type RepositorioDeConfirmacion,
} from "@/lib/server/servicios/compromiso";
import {
  entregarEvidencia,
  type EntregaDeEvidencia,
  type HuellaDeEvidencia,
  type RepositorioDeEntrega,
} from "@/lib/server/servicios/evidencia";
import type { EventoDeProducto, PublicadorDeEventos } from "@/lib/server/servicios/eventos";

/**
 * D2·A y la precisión 2 del CTO, probadas donde se deciden.
 *
 * La clave de idempotencia repetida **sólo** resuelve a la fila existente si
 * coinciden dueño, recurso y payload. Con cualquiera de los tres distinto es
 * conflicto, y la fila existente **no sale por la respuesta**.
 *
 * Lo que estos tests **no** demuestran, porque un doble no puede: que el
 * `UNIQUE (idempotency_key)` corte dos requests simultáneas. Eso lo garantiza
 * Postgres y se verifica contra la base real.
 */

const INST = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function eventos(): PublicadorDeEventos & { publicados: EventoDeProducto[] } {
  const publicados: EventoDeProducto[] = [];
  return {
    publicados,
    async publicar(e) {
      publicados.push(e);
    },
  };
}

// ── Commitment ───────────────────────────────────────────────────────────────

const PEDIDO: ConfirmacionDeCompromiso = {
  actionId: "ac000000-0000-0000-0000-000000000001",
  estudianteId: "e5000000-0000-0000-0000-000000000001",
  startAt: "2026-09-03T11:30:00.000Z",
  timezone: "America/Argentina/Cordoba",
  plannedMinutes: 45,
  claveDeIdempotencia: "clave-1",
};

const HUELLA: HuellaDeCompromiso = {
  compromiso: {
    id: "co000000-0000-0000-0000-000000000001",
    institutionId: INST,
    actionId: PEDIDO.actionId,
    rescuesCommitmentId: null,
    renegotiatedFromId: null,
    scheduledFor: PEDIDO.startAt,
    state: "CONFIRMED",
  },
  estudianteId: PEDIDO.estudianteId,
  startAt: PEDIDO.startAt,
  timezone: PEDIDO.timezone,
  plannedMinutes: PEDIDO.plannedMinutes,
};

function repoDeConfirmacion(huella: HuellaDeCompromiso | null) {
  let creados = 0;
  const repo: RepositorioDeConfirmacion = {
    async huellaDeClave() {
      return huella;
    },
    async crearConfirmado() {
      creados += 1;
      return { compromiso: HUELLA.compromiso, comprometible: true, yaViva: false };
    },
  };
  return { repo, creados: () => creados };
}

describe("confirmar un compromiso, dos veces", () => {
  it("sin clave previa lo crea y publica el hecho", async () => {
    const { repo, creados } = repoDeConfirmacion(null);
    const ev = eventos();

    const r = await confirmarCompromiso({ repo, eventos: ev }, INST, PEDIDO);

    expect(r).toMatchObject({ estado: "OK", duplicado: false });
    expect(creados()).toBe(1);
    expect(ev.publicados.map((e) => e.nombre)).toEqual(["CommitmentConfirmed"]);
  });

  it("el doble clic devuelve la misma fila y **no crea una segunda**", async () => {
    const { repo, creados } = repoDeConfirmacion(HUELLA);
    const ev = eventos();

    const r = await confirmarCompromiso({ repo, eventos: ev }, INST, PEDIDO);

    expect(r).toEqual({ estado: "OK", compromiso: HUELLA.compromiso, duplicado: true });
    expect(creados()).toBe(0);
    // El hecho ya se publicó la primera vez. Publicarlo de nuevo diría que el
    // estudiante se comprometió dos veces, y `product_event` es append-only.
    expect(ev.publicados).toHaveLength(0);
  });

  it.each([
    ["otro estudiante", { estudianteId: "e5000000-0000-0000-0000-000000000002" }],
    ["otra Action", { actionId: "ac000000-0000-0000-0000-000000000009" }],
    ["otro horario", { startAt: "2026-09-04T11:30:00.000Z" }],
    ["otra duración", { plannedMinutes: 90 }],
    ["otra zona", { timezone: "America/Argentina/Buenos_Aires" }],
  ])("la misma clave con %s es conflicto, y no filtra la fila", async (_caso, cambio) => {
    const { repo, creados } = repoDeConfirmacion(HUELLA);

    const r = await confirmarCompromiso({ repo, eventos: eventos() }, INST, { ...PEDIDO, ...cambio });

    expect(r).toEqual({ estado: "CONFLICTO_DE_CLAVE" });
    expect(creados()).toBe(0);
    // Ni el id ni nada de la fila existente aparecen en la respuesta.
    expect(JSON.stringify(r)).not.toContain(HUELLA.compromiso.id);
  });
});

// ── Evidence ─────────────────────────────────────────────────────────────────

const ENTREGA: EntregaDeEvidencia = {
  evidenciaId: "ev000000-0000-0000-0000-000000000001",
  commitmentId: HUELLA.compromiso.id,
  estudianteId: PEDIDO.estudianteId,
  claveDeIdempotencia: "clave-2",
};

const HUELLA_EV: HuellaDeEvidencia = {
  evidenciaId: ENTREGA.evidenciaId,
  estudianteId: ENTREGA.estudianteId,
  commitmentId: ENTREGA.commitmentId,
};

function repoDeEntrega(huella: HuellaDeEvidencia | null) {
  let creadas = 0;
  const repo: RepositorioDeEntrega = {
    async huellaDeClave() {
      return huella;
    },
    async crearEntregada() {
      creadas += 1;
      return { actionId: PEDIDO.actionId };
    },
  };
  return { repo, creadas: () => creadas };
}

describe("entregar una evidencia, dos veces", () => {
  it("sin clave previa la registra y publica `EvidenceSubmitted`", async () => {
    const { repo, creadas } = repoDeEntrega(null);
    const ev = eventos();

    const r = await entregarEvidencia({ repo, eventos: ev }, INST, ENTREGA);

    expect(r).toEqual({ estado: "OK", evidenciaId: ENTREGA.evidenciaId, duplicado: false });
    expect(creadas()).toBe(1);
    expect(ev.publicados.map((e) => e.nombre)).toEqual(["EvidenceSubmitted"]);
  });

  it("el reintento devuelve la misma evidencia y no duplica", async () => {
    const { repo, creadas } = repoDeEntrega(HUELLA_EV);
    const ev = eventos();

    const r = await entregarEvidencia({ repo, eventos: ev }, INST, ENTREGA);

    expect(r).toEqual({ estado: "OK", evidenciaId: ENTREGA.evidenciaId, duplicado: true });
    expect(creadas()).toBe(0);
    expect(ev.publicados).toHaveLength(0);
  });

  it.each([
    ["otro estudiante", { estudianteId: "e5000000-0000-0000-0000-000000000002" }],
    ["otro compromiso", { commitmentId: "co000000-0000-0000-0000-000000000009" }],
    ["otra evidencia", { evidenciaId: "ev000000-0000-0000-0000-000000000009" }],
  ])("la misma clave con %s es conflicto, y no filtra la fila", async (_caso, cambio) => {
    const { repo, creadas } = repoDeEntrega(HUELLA_EV);

    const r = await entregarEvidencia({ repo, eventos: eventos() }, INST, { ...ENTREGA, ...cambio });

    expect(r).toEqual({ estado: "CONFLICTO_DE_CLAVE" });
    expect(creadas()).toBe(0);
  });
});
