import { describe, expect, it } from "vitest";

import { transicionesPorTiempo, type CompromisoConReloj } from "@/lib/domain/reloj-compromisos";

/**
 * El owner del lifecycle. `product.md` §226: la UI no declara `MISSED` ni
 * `DUE` por el paso del tiempo — lo hace esto.
 */
const T = (iso: string) => iso;
const base: CompromisoConReloj = {
  id: "c-1",
  state: "CONFIRMED",
  startAt: "2026-08-30T19:00:00.000Z",
  plannedMinutes: 40,
};

describe("reloj · CONFIRMED pasa a DUE cuando llega la hora", () => {
  it("antes de la hora, nada", () => {
    expect(transicionesPorTiempo([base], T("2026-08-30T18:59:00.000Z"))).toEqual([]);
  });

  it("a la hora exacta, sí", () => {
    expect(transicionesPorTiempo([base], T("2026-08-30T19:00:00.000Z"))).toMatchObject([
      { id: "c-1", desde: "CONFIRMED", hacia: "DUE" },
    ]);
  });
});

describe("reloj · DUE pasa a MISSED cuando el bloque pasó sin empezar", () => {
  const vencido = { ...base, state: "DUE" as const };

  it("durante el bloque acordado, todavía no", () => {
    expect(transicionesPorTiempo([vencido], T("2026-08-30T19:39:00.000Z"))).toEqual([]);
  });

  it("pasado el bloque, se incumple", () => {
    expect(transicionesPorTiempo([vencido], T("2026-08-30T19:40:00.000Z"))).toMatchObject([
      { id: "c-1", hacia: "MISSED" },
    ]);
  });

  it("un bloque más largo aguanta más", () => {
    const largo = { ...vencido, plannedMinutes: 120 };
    expect(transicionesPorTiempo([largo], T("2026-08-30T20:00:00.000Z"))).toEqual([]);
    expect(transicionesPorTiempo([largo], T("2026-08-30T21:00:00.000Z"))).toHaveLength(1);
  });
});

describe("reloj · no se saltea DUE", () => {
  /**
   * Un `CONFIRMED` cuyo bloque ya pasó entero pasa **primero a `DUE`**. Saltar
   * derecho a `MISSED` borraría de la Bitácora que alguna vez llegó su hora.
   */
  it("un CONFIRMED muy vencido va a DUE, no a MISSED", () => {
    const r = transicionesPorTiempo([base], T("2026-09-15T00:00:00.000Z"));
    expect(r).toMatchObject([{ hacia: "DUE" }]);
  });

  it("y en la corrida siguiente ya sí pasa a MISSED", () => {
    const yaDue = { ...base, state: "DUE" as const };
    expect(transicionesPorTiempo([yaDue], T("2026-09-15T00:00:00.000Z"))).toMatchObject([
      { hacia: "MISSED" },
    ]);
  });
});

describe("reloj · lo que NO toca", () => {
  /**
   * *No Cortar*: un `MISSED` no vuelve, y un `COMPLETED` no se toca. El reloj
   * sólo empuja hacia adelante los dos estados que dependen del tiempo.
   */
  it("no toca MISSED, COMPLETED, CLOSED, STARTED, DRAFT ni RENEGOTIATED", () => {
    const otros = ["MISSED", "COMPLETED", "CLOSED", "STARTED", "DRAFT", "RENEGOTIATED"] as const;
    for (const state of otros) {
      const r = transicionesPorTiempo([{ ...base, state }], T("2030-01-01T00:00:00.000Z"));
      expect(r, state).toEqual([]);
    }
  });

  it("un `startAt` inválido se ignora en vez de romper la corrida", () => {
    expect(transicionesPorTiempo([{ ...base, startAt: "no es fecha" }], T("2030-01-01T00:00:00.000Z"))).toEqual([]);
  });

  it("un `ahora` inválido no mueve nada", () => {
    expect(transicionesPorTiempo([base], "cualquier cosa")).toEqual([]);
  });
});

describe("reloj · es puro", () => {
  it("dos corridas con el mismo instante dan lo mismo", () => {
    const lista = [base, { ...base, id: "c-2", state: "DUE" as const }];
    const a = JSON.stringify(transicionesPorTiempo(lista, T("2026-08-30T20:00:00.000Z")));
    const b = JSON.stringify(transicionesPorTiempo(lista, T("2026-08-30T20:00:00.000Z")));
    expect(a).toBe(b);
  });

  it("no lee el reloj del sistema", () => {
    // Con un `ahora` del pasado no pasa nada, aunque hoy sea después.
    expect(transicionesPorTiempo([base], T("2020-01-01T00:00:00.000Z"))).toEqual([]);
  });
});
