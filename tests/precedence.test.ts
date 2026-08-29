import { describe, expect, it } from "vitest";
import {
  compareByDefaultOrder,
  heroLevelsInPrecedenceOrder,
  selectHeroLevel,
  type HeroInput,
  type HeroLevel,
} from "@/lib/domain/precedence";

/** El input neutro: nada aplica, así que cae al último nivel. */
const nada: HeroInput = {
  action: "NONE",
  commitment: "NONE",
  rescue: "NONE",
  actionRecommended: false,
  contextIncomplete: false,
  evidenceInfoOnly: false,
};

/** Un input mínimo que produce exactamente cada uno de los nueve niveles. */
const inputPorNivel: Record<HeroLevel, HeroInput> = {
  IN_PROGRESS: { ...nada, action: "IN_PROGRESS" },
  EVIDENCE_PENDING: { ...nada, action: "EVIDENCE_PENDING" },
  COMMITMENT_NEXT: { ...nada, commitment: "CONFIRMED_OR_DUE" },
  RESCUE_REQUIRED: { ...nada, rescue: "REQUIRED" },
  COMMITMENT_MISSED: { ...nada, commitment: "MISSED" },
  ACTION_RECOMMENDED: { ...nada, actionRecommended: true },
  CONTEXT_INCOMPLETE: { ...nada, contextIncomplete: true },
  EVIDENCE_INFO: { ...nada, evidenceInfoOnly: true },
  NO_ACTION_AVAILABLE: { ...nada },
};

describe("selectHeroLevel — los nueve niveles de product.md §10.2", () => {
  it("la lista de niveles tiene los nueve, sin repetidos", () => {
    expect(heroLevelsInPrecedenceOrder).toHaveLength(9);
    expect(new Set(heroLevelsInPrecedenceOrder).size).toBe(9);
  });

  // Un test por nivel, como pide el Done de la Etapa 0.2.
  for (const nivel of heroLevelsInPrecedenceOrder) {
    it(`alcanza el nivel ${nivel}`, () => {
      expect(selectHeroLevel(inputPorNivel[nivel])).toBe(nivel);
    });
  }

  it("un rescate materializado también produce COMMITMENT_NEXT", () => {
    expect(selectHeroLevel({ ...nada, rescue: "MATERIALIZED" })).toBe("COMMITMENT_NEXT");
  });
});

describe("selectHeroLevel — el primero que aplique gana (VI.1 §3.2)", () => {
  it("con TODAS las condiciones activas gana el nivel 1", () => {
    const todo: HeroInput = {
      action: "IN_PROGRESS",
      commitment: "CONFIRMED_OR_DUE",
      rescue: "REQUIRED",
      actionRecommended: true,
      contextIncomplete: true,
      evidenceInfoOnly: true,
    };
    expect(selectHeroLevel(todo)).toBe("IN_PROGRESS");
  });

  it("cada nivel gana sobre todos los que vienen después", () => {
    // Se activan las condiciones del nivel i y las de TODOS los posteriores.
    // El resultado tiene que ser siempre el nivel i.
    for (let i = 0; i < heroLevelsInPrecedenceOrder.length; i++) {
      const nivel = heroLevelsInPrecedenceOrder[i];
      let input: HeroInput = { ...nada };
      for (let j = heroLevelsInPrecedenceOrder.length - 1; j >= i; j--) {
        input = { ...input, ...soloLoQueActiva(inputPorNivel[heroLevelsInPrecedenceOrder[j]]) };
      }
      expect(selectHeroLevel(input), `nivel ${nivel} debía ganar`).toBe(nivel);
    }
  });

  it("EVIDENCE_PENDING gana sobre una recomendación nueva del ADE", () => {
    expect(selectHeroLevel({ ...nada, action: "EVIDENCE_PENDING", actionRecommended: true }))
      .toBe("EVIDENCE_PENDING");
  });

  it("RESCUE_REQUIRED gana sobre COMMITMENT_MISSED, pero pierde con COMMITMENT_NEXT", () => {
    expect(selectHeroLevel({ ...nada, rescue: "REQUIRED", commitment: "MISSED" })).toBe("RESCUE_REQUIRED");
    expect(selectHeroLevel({ ...nada, rescue: "REQUIRED", commitment: "CONFIRMED_OR_DUE" })).toBe("COMMITMENT_NEXT");
  });
});

/** Devuelve solo los campos que este input activa respecto del neutro. */
function soloLoQueActiva(input: HeroInput): Partial<HeroInput> {
  const delta: Partial<HeroInput> = {};
  for (const clave of Object.keys(input) as (keyof HeroInput)[]) {
    if (input[clave] !== nada[clave]) {
      Object.assign(delta, { [clave]: input[clave] });
    }
  }
  return delta;
}

describe("compareByDefaultOrder — los dos relojes de DD2, nunca fusionados", () => {
  it("el Commitment más próximo a vencer va primero", () => {
    const antes = { commitmentDueAt: "2026-08-29T19:00", examDaysAway: 30 };
    const despues = { commitmentDueAt: "2026-08-30T19:00", examDaysAway: 1 };
    expect(compareByDefaultOrder(antes, despues)).toBeLessThan(0);
  });

  it("el examen desempata solo cuando el Commitment no distingue", () => {
    const a = { commitmentDueAt: null, examDaysAway: 2 };
    const b = { commitmentDueAt: null, examDaysAway: 9 };
    expect(compareByDefaultOrder(a, b)).toBeLessThan(0);
  });

  it("un examen inminente NO adelanta a un Commitment que vence antes", () => {
    // Los dos criterios están ordenados, no sumados: si estuvieran fusionados
    // en un score, el examen de mañana ganaría.
    const conCompromiso = { commitmentDueAt: "2026-08-29T19:00", examDaysAway: null };
    const examenMañana = { commitmentDueAt: null, examDaysAway: 1 };
    expect(compareByDefaultOrder(conCompromiso, examenMañana)).toBeLessThan(0);
  });

  it("la ausencia ordena al final: no tener dato no es urgencia cero", () => {
    const sinDatos = { commitmentDueAt: null, examDaysAway: null };
    const conDatos = { commitmentDueAt: null, examDaysAway: 40 };
    expect(compareByDefaultOrder(sinDatos, conDatos)).toBeGreaterThan(0);
  });

  it("es estable ante elementos equivalentes", () => {
    const x = { commitmentDueAt: null, examDaysAway: null };
    expect(compareByDefaultOrder(x, { ...x })).toBe(0);
  });
});
