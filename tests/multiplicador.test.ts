import { describe, expect, it } from "vitest";

import {
  MINIMO_DE_OBSERVACIONES,
  TECHO,
  conMultiplicador,
  estimacionCentral,
  multiplicadorDe,
  type Observacion,
} from "@/lib/domain/multiplicador";

/**
 * El multiplicador personal — [ADR-074](../docs/decisions.md#adr-074).
 *
 * Lo que estos tests protegen es **el piso de `1.0`**. Es la regresión más
 * probable: alguien va a mirar a un estudiante que tarda la mitad de lo
 * estimado y va a querer premiarlo con menos horas. ADR-070 lo cerró — el
 * Personal Engine puede pedir más tiempo, nunca prometer que vas a necesitar
 * menos.
 */

const o = (minutosReales: number, min: number | null = 40, max: number | null = 60): Observacion => ({
  minutosReales,
  estimadoMin: min,
  estimadoMax: max,
});

/** Cinco observaciones idénticas: el mínimo para que calibre. */
const cinco = (minutosReales: number) => Array.from({ length: 5 }, () => o(minutosReales));

describe("El piso de 1.0 (ADR-070)", () => {
  it("quien tarda la MITAD de lo estimado igual queda en 1.0", () => {
    // El multiplicador puede pedir más tiempo; nunca prometer que vas a
    // necesitar menos.
    const m = multiplicadorDe(cinco(25)); // estimado central 50
    expect(m.estado).toBe("CALIBRADO");
    expect(m.valor).toBe(1);
  });

  it("quien tarda el doble sube, y hasta ahí", () => {
    expect(multiplicadorDe(cinco(75)).valor).toBe(1.5);
    expect(multiplicadorDe(cinco(100)).valor).toBe(2);
  });

  it("el techo corta: más del doble no es calibración, es otra cosa", () => {
    // Sistemáticamente más del doble significa que algo más está pasando, y eso
    // lo tiene que ver una persona — no un coeficiente que sigue creciendo.
    expect(multiplicadorDe(cinco(500)).valor).toBe(TECHO);
    expect(TECHO).toBe(2);
  });
});

describe("Sin historia no se calibra, y no es null", () => {
  it("con menos del mínimo, el valor es 1.0 y el estado lo dice", () => {
    const m = multiplicadorDe(Array.from({ length: MINIMO_DE_OBSERVACIONES - 1 }, () => o(120)));
    expect(m.estado).toBe("SIN_HISTORIA");
    // ⚠️ `1`, no `null`: sin historia no se penaliza ni se premia a nadie, y
    // quien lo consuma no tiene que decidir qué hacer con una ausencia.
    expect(m.valor).toBe(1);
  });

  it("sin ninguna observación, tampoco", () => {
    const m = multiplicadorDe([]);
    expect(m.estado).toBe("SIN_HISTORIA");
    expect(m.valor).toBe(1);
    expect(m.observaciones).toBe(0);
  });

  it("justo en el mínimo, ya calibra", () => {
    expect(multiplicadorDe(cinco(90)).estado).toBe("CALIBRADO");
  });
});

describe("Mediana, no promedio", () => {
  it("una sesión que se fue de cauce no mueve todas las demás", () => {
    // Cuatro sesiones normales y una de seis horas. El promedio daría ~2,3× y
    // se comería el techo; la mediana no se entera.
    const m = multiplicadorDe([o(50), o(50), o(50), o(50), o(360)]);
    expect(m.valor).toBe(1);
  });
});

describe("Lo que no cuenta como observación", () => {
  it("una Action sin estimación no compara nada", () => {
    const m = multiplicadorDe(Array.from({ length: 5 }, () => o(120, null, null)));
    expect(m.estado).toBe("SIN_HISTORIA");
    expect(m.observaciones).toBe(0);
  });

  it("con una sola punta del rango, se usa ésa", () => {
    expect(estimacionCentral(o(0, null, 60))).toBe(60);
    expect(estimacionCentral(o(0, 40, null))).toBe(40);
    expect(estimacionCentral(o(0, 40, 60))).toBe(50);
    expect(estimacionCentral(o(0, null, null))).toBeNull();
  });

  it("minutos reales en cero o negativos no son un dato", () => {
    const m = multiplicadorDe([o(0), o(-5), o(90), o(90), o(90)]);
    expect(m.observaciones).toBe(3);
    expect(m.estado).toBe("SIN_HISTORIA");
  });
});

describe("Los dos factores quedan separados", () => {
  it("`conMultiplicador` no colapsa base y coeficiente en un solo número", () => {
    // La pantalla tiene que poder explicar de dónde sale cada mitad, y un
    // producto ya calculado no se puede desarmar (ADR-068).
    // 75 sobre un central de 50 es 1,5×.
    const m = multiplicadorDe(cinco(75));
    expect(m.valor).toBe(1.5);
    expect(conMultiplicador(120, m)).toBe(180);
  });

  it("sobre `null` sigue siendo `null`: sin estimación no hay qué multiplicar", () => {
    expect(conMultiplicador(null, multiplicadorDe(cinco(90)))).toBeNull();
  });

  it("sin historia, no cambia nada", () => {
    expect(conMultiplicador(120, multiplicadorDe([]))).toBe(120);
  });
});

describe("Lo que el módulo no puede hacer", () => {
  it("no recibe nada de otro estudiante: el tipo no lo admite", () => {
    const obs: Observacion = o(60);
    expect(Object.keys(obs).sort()).toEqual(["estimadoMax", "estimadoMin", "minutosReales"]);
  });

  it("declara con qué regla se calculó", () => {
    expect(multiplicadorDe(cinco(60)).regla).toBe("multiplicador-v1");
  });
});
