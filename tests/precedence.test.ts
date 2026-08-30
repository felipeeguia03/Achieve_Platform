import { describe, expect, it } from "vitest";
import {
  compareByDefaultOrder,
  heroLevelsInPrecedenceOrder,
  selectHeroLevel,
  type HeroInput,
  type HeroLevel,
} from "@/lib/domain/precedence";
import { ctaPara, estadoGeneralPara } from "@/lib/content/hero";

const nada: HeroInput = {
  action: "NONE",
  commitment: "NONE",
  rescate: "NONE",
  actionRecommended: false,
  contextIncomplete: false,
  evidenciaInformativa: "NONE",
};

const inputPorNivel: Record<HeroLevel, HeroInput> = {
  IN_PROGRESS: { ...nada, action: "IN_PROGRESS" },
  EVIDENCE_PENDING: { ...nada, action: "EVIDENCE_PENDING" },
  COMMITMENT_NEXT: { ...nada, commitment: "PROXIMO" },
  RESCUE_REQUIRED: { ...nada, rescate: "REQUIRED" },
  COMMITMENT_MISSED: { ...nada, commitment: "MISSED" },
  ACTION_RECOMMENDED: { ...nada, actionRecommended: true },
  CONTEXT_INCOMPLETE: { ...nada, contextIncomplete: true },
  EVIDENCE_INFO: { ...nada, evidenciaInformativa: "ENVIADA" },
  NO_ACTION_AVAILABLE: { ...nada },
};

describe("selectHeroLevel — los nueve niveles de VI.1 §3.2", () => {
  it("la lista tiene los nueve, sin repetidos", () => {
    expect(heroLevelsInPrecedenceOrder).toHaveLength(9);
    expect(new Set(heroLevelsInPrecedenceOrder).size).toBe(9);
  });

  for (const nivel of heroLevelsInPrecedenceOrder) {
    it(`alcanza el nivel ${nivel}`, () => {
      expect(selectHeroLevel(inputPorNivel[nivel]).nivel).toBe(nivel);
    });
  }
});

describe("ADR-017 — los discriminadores que §10.2 había perdido", () => {
  it("nivel 3: el tiempo acordado decide el verbo", () => {
    expect(selectHeroLevel({ ...nada, commitment: "PROXIMO" }).variante).toBe("COMMITMENT_PROXIMO");
    expect(selectHeroLevel({ ...nada, commitment: "STARTABLE" }).variante).toBe("COMMITMENT_STARTABLE");
  });

  it("nivel 3: un rescate startable dice 'Empezar rescate'", () => {
    const r = selectHeroLevel({ ...nada, commitment: "STARTABLE", rescate: "MATERIALIZED" });
    expect(r.variante).toBe("RESCATE_STARTABLE");
    expect(ctaPara(r.nivel, r.variante)).toBe("Empezar rescate");
  });

  it("nivel 8: el lifecycle de la Evidence decide el verbo", () => {
    const enviada = selectHeroLevel({ ...nada, evidenciaInformativa: "ENVIADA" });
    const validada = selectHeroLevel({ ...nada, evidenciaInformativa: "VALIDADA" });
    expect(ctaPara(enviada.nivel, enviada.variante)).toBe("Ver evidencia");
    expect(ctaPara(validada.nivel, validada.variante)).toBe("Ver avance");
  });

  it("los nueve niveles tienen CTA y estado general, sin caer al default", () => {
    for (const nivel of heroLevelsInPrecedenceOrder) {
      const r = selectHeroLevel(inputPorNivel[nivel]);
      expect(ctaPara(r.nivel, r.variante).length, nivel).toBeGreaterThan(0);
      expect(estadoGeneralPara(nivel).length, nivel).toBeGreaterThan(0);
    }
    // Cada nivel tiene su propio estado general: ninguno reusa el de otro.
    const estados = heroLevelsInPrecedenceOrder.map(estadoGeneralPara);
    expect(new Set(estados).size).toBe(9);
  });
});

describe("RESCUE_MATERIALIZED no es un nivel propio (VI.1 §3.2)", () => {
  it("una Action de rescate IN_PROGRESS es nivel 1, no nivel 3", () => {
    expect(selectHeroLevel({ ...nada, action: "IN_PROGRESS", rescate: "MATERIALIZED" }).nivel).toBe("IN_PROGRESS");
  });

  it("una Action de rescate EVIDENCE_PENDING es nivel 2", () => {
    expect(selectHeroLevel({ ...nada, action: "EVIDENCE_PENDING", rescate: "MATERIALIZED" }).nivel).toBe("EVIDENCE_PENDING");
  });

  it("un rescate materializado SIN commitment vigente no gana el nivel 3", () => {
    // Antes de ADR-017 esto devolvía COMMITMENT_NEXT por el solo hecho de
    // existir el rescate, y desplazaba a la recomendación sin objeto que abrir.
    expect(selectHeroLevel({ ...nada, rescate: "MATERIALIZED", actionRecommended: true }).nivel)
      .toBe("ACTION_RECOMMENDED");
  });

  it("un compromiso actual no es desplazado por un rescate anterior", () => {
    const r = selectHeroLevel({ ...nada, commitment: "PROXIMO", rescate: "MATERIALIZED" });
    expect(r.nivel).toBe("COMMITMENT_NEXT");
    expect(r.variante).toBe("COMMITMENT_PROXIMO");
  });
});

describe("El primero que aplique gana (VI.1 §3.2)", () => {
  it("con todas las condiciones activas gana el nivel 1", () => {
    expect(selectHeroLevel({
      action: "IN_PROGRESS", commitment: "STARTABLE", rescate: "REQUIRED",
      actionRecommended: true, contextIncomplete: true, evidenciaInformativa: "VALIDADA",
    }).nivel).toBe("IN_PROGRESS");
  });

  it("cada nivel gana sobre todos los posteriores", () => {
    const activa: Record<HeroLevel, Partial<HeroInput>> = {
      IN_PROGRESS: { action: "IN_PROGRESS" },
      EVIDENCE_PENDING: { action: "EVIDENCE_PENDING" },
      COMMITMENT_NEXT: { commitment: "PROXIMO" },
      RESCUE_REQUIRED: { rescate: "REQUIRED" },
      COMMITMENT_MISSED: { commitment: "MISSED" },
      ACTION_RECOMMENDED: { actionRecommended: true },
      CONTEXT_INCOMPLETE: { contextIncomplete: true },
      EVIDENCE_INFO: { evidenciaInformativa: "ENVIADA" },
      NO_ACTION_AVAILABLE: {},
    };
    for (let i = 0; i < heroLevelsInPrecedenceOrder.length; i++) {
      const nivel = heroLevelsInPrecedenceOrder[i];
      let input: HeroInput = { ...nada };
      for (let j = heroLevelsInPrecedenceOrder.length - 1; j >= i; j--) {
        input = { ...input, ...activa[heroLevelsInPrecedenceOrder[j]] };
      }
      expect(selectHeroLevel(input).nivel, `nivel ${nivel} debía ganar`).toBe(nivel);
    }
  });

  it("EVIDENCE_PENDING gana sobre una recomendación nueva del ADE", () => {
    expect(selectHeroLevel({ ...nada, action: "EVIDENCE_PENDING", actionRecommended: true }).nivel)
      .toBe("EVIDENCE_PENDING");
  });

  it("RESCUE_REQUIRED gana sobre COMMITMENT_MISSED, pero pierde con un compromiso vigente", () => {
    expect(selectHeroLevel({ ...nada, rescate: "REQUIRED", commitment: "MISSED" }).nivel).toBe("RESCUE_REQUIRED");
    expect(selectHeroLevel({ ...nada, rescate: "REQUIRED", commitment: "PROXIMO" }).nivel).toBe("COMMITMENT_NEXT");
  });
});

describe("compareByDefaultOrder — los dos relojes de DD2, nunca fusionados", () => {
  it("el Commitment más próximo a vencer va primero", () => {
    expect(compareByDefaultOrder(
      { commitmentDueAt: "2026-08-29T19:00", examDaysAway: 30 },
      { commitmentDueAt: "2026-08-30T19:00", examDaysAway: 1 },
    )).toBeLessThan(0);
  });

  it("el examen desempata solo cuando el Commitment no distingue", () => {
    expect(compareByDefaultOrder(
      { commitmentDueAt: null, examDaysAway: 2 },
      { commitmentDueAt: null, examDaysAway: 9 },
    )).toBeLessThan(0);
  });

  it("un examen inminente NO adelanta a un Commitment que vence antes", () => {
    expect(compareByDefaultOrder(
      { commitmentDueAt: "2026-08-29T19:00", examDaysAway: null },
      { commitmentDueAt: null, examDaysAway: 1 },
    )).toBeLessThan(0);
  });

  it("la ausencia ordena al final: no tener dato no es urgencia cero", () => {
    expect(compareByDefaultOrder(
      { commitmentDueAt: null, examDaysAway: null },
      { commitmentDueAt: null, examDaysAway: 40 },
    )).toBeGreaterThan(0);
  });

  it("es estable ante elementos equivalentes", () => {
    const x = { commitmentDueAt: null, examDaysAway: null };
    expect(compareByDefaultOrder(x, { ...x })).toBe(0);
  });
});
