import { describe, expect, it } from "vitest";
import {
  nivelesOverview,
  selectOverviewLevel,
  type OverviewInput,
} from "@/lib/domain/overview-precedence";

const nada: OverviewInput = {
  action: "NONE",
  commitment: "NONE",
  rescate: "NONE",
  evidence: "NONE",
  recomendacionPrimariaVigente: false,
  pasoActualDisponible: false,
  gateAutoritativo: false,
  progreso: "NONE",
};

describe("Los diez niveles de VI.8 §13 son alcanzables", () => {
  const minimos: Record<number, OverviewInput> = {
    1: { ...nada, action: "IN_PROGRESS" },
    2: { ...nada, action: "EVIDENCE_PENDING" },
    3: { ...nada, commitment: "DUE" },
    4: { ...nada, rescate: "REQUIRED" },
    5: { ...nada, evidence: "RESUBMISSION_REQUESTED" },
    6: { ...nada, recomendacionPrimariaVigente: true },
    7: { ...nada, pasoActualDisponible: true },
    8: { ...nada, evidence: "INFORMATIVA" },
    9: { ...nada, progreso: "PROGRESS_UPDATED" },
    10: { ...nada },
  };

  for (const nivel of nivelesOverview) {
    it(`alcanza el nivel ${nivel}`, () => {
      expect(selectOverviewLevel(minimos[nivel]).nivel).toBe(nivel);
    });
  }

  it("las tres variantes del nivel 3", () => {
    expect(selectOverviewLevel({ ...nada, commitment: "CONFIRMED_FUTURO" })).toEqual({ nivel: 3, variante: "COMMITMENT_CONFIRMED_FUTURO" });
    expect(selectOverviewLevel({ ...nada, commitment: "DUE" })).toEqual({ nivel: 3, variante: "COMMITMENT_DUE" });
    expect(selectOverviewLevel({ ...nada, commitment: "STARTED" })).toEqual({ nivel: 3, variante: "COMMITMENT_STARTED" });
  });

  it("las dos variantes del nivel 4", () => {
    expect(selectOverviewLevel({ ...nada, rescate: "REQUIRED" }).variante).toBe("RESCUE_REQUIRED");
    expect(selectOverviewLevel({ ...nada, rescate: "MATERIALIZED" }).variante).toBe("RESCATE_REAL");
  });

  it("9a y 9b: cada CTA exige su destino canónico inequívoco", () => {
    expect(selectOverviewLevel({ ...nada, progreso: "PROGRESS_UPDATED" }).variante).toBe("PROGRESS_UPDATED");
    expect(selectOverviewLevel({ ...nada, progreso: "PROGRESS_ENTRY" }).variante).toBe("PROGRESS_ENTRY");
  });

  it("ante destino ambiguo NO se elige: cae al siguiente fallback aplicable", () => {
    // "VER AVANCE y VER BITÁCORA nunca son alternativas locales."
    expect(selectOverviewLevel({ ...nada, progreso: "AMBIGUO" }).nivel).toBe(10);
  });
});

describe("Los conflictos que §13 declara, uno por uno", () => {
  it("IN_PROGRESS vence a un MISSED previo", () => {
    expect(selectOverviewLevel({ ...nada, action: "IN_PROGRESS", commitment: "MISSED", rescate: "REQUIRED" }).nivel).toBe(1);
  });

  it("EVIDENCE_PENDING vence a la recomendación", () => {
    expect(selectOverviewLevel({ ...nada, action: "EVIDENCE_PENDING", recomendacionPrimariaVigente: true }).nivel).toBe(2);
  });

  it("un Commitment vigente vence a la recomendación", () => {
    expect(selectOverviewLevel({ ...nada, commitment: "DUE", recomendacionPrimariaVigente: true }).nivel).toBe(3);
  });

  it("MISSED vence a una recomendación no aceptada", () => {
    expect(selectOverviewLevel({ ...nada, commitment: "MISSED", recomendacionPrimariaVigente: true }).nivel).toBe(4);
  });

  it("la recomendación vence a un ProgressUpdated informativo", () => {
    expect(selectOverviewLevel({ ...nada, recomendacionPrimariaVigente: true, progreso: "PROGRESS_UPDATED" }).nivel).toBe(6);
  });

  it("UNDER_REVIEW queda secundaria ante un paso accionable sin gate", () => {
    expect(selectOverviewLevel({ ...nada, evidence: "UNDER_REVIEW", pasoActualDisponible: true }).nivel).toBe(7);
  });

  it("con gate autoritativo el paso no se presenta, y VER EVIDENCIA pasa a primaria", () => {
    expect(
      selectOverviewLevel({ ...nada, evidence: "UNDER_REVIEW", pasoActualDisponible: true, gateAutoritativo: true }).nivel,
    ).toBe(8);
  });

  it("los lifecycles accionables 1–6 vencen al paso", () => {
    for (const input of [
      { ...nada, action: "IN_PROGRESS" } as OverviewInput,
      { ...nada, action: "EVIDENCE_PENDING" } as OverviewInput,
      { ...nada, commitment: "DUE" } as OverviewInput,
      { ...nada, rescate: "REQUIRED" } as OverviewInput,
      { ...nada, evidence: "RESUBMISSION_REQUESTED" } as OverviewInput,
      { ...nada, recomendacionPrimariaVigente: true } as OverviewInput,
    ]) {
      expect(selectOverviewLevel({ ...input, pasoActualDisponible: true }).nivel).toBeLessThanOrEqual(6);
    }
  });

  it("Evidence informativa y ProgressUpdated NO ocultan un paso accionable", () => {
    expect(selectOverviewLevel({ ...nada, evidence: "INFORMATIVA", pasoActualDisponible: true }).nivel).toBe(7);
    expect(selectOverviewLevel({ ...nada, progreso: "PROGRESS_UPDATED", pasoActualDisponible: true }).nivel).toBe(7);
  });

  it("cada nivel gana sobre todos los posteriores", () => {
    const activa: Record<number, Partial<OverviewInput>> = {
      1: { action: "IN_PROGRESS" },
      2: { action: "EVIDENCE_PENDING" },
      3: { commitment: "DUE" },
      4: { rescate: "REQUIRED" },
      5: { evidence: "RESUBMISSION_REQUESTED" },
      6: { recomendacionPrimariaVigente: true },
      7: { pasoActualDisponible: true },
      8: { evidence: "INFORMATIVA" },
      9: { progreso: "PROGRESS_UPDATED" },
      10: {},
    };
    for (const nivel of nivelesOverview) {
      let input: OverviewInput = { ...nada };
      for (let j = 10; j >= nivel; j--) input = { ...input, ...activa[j] };
      expect(selectOverviewLevel(input).nivel, `nivel ${nivel} debía ganar`).toBe(nivel);
    }
  });
});
