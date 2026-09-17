import { describe, expect, it } from "vitest";

import {
  MINIMO_DE_OBSERVACIONES,
  TECHO,
  porTipo,
  revisionDeCalibracion,
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

const o = (
  minutosReales: number,
  min: number | null = 40,
  max: number | null = 60,
  dia = "2026-09-01",
  tipo = "resolver",
): Observacion => ({ minutosReales, estimadoMin: min, estimadoMax: max, dia, tipo });

/**
 * Cinco observaciones: el mínimo para que calibre, **en días distintos**.
 * ADR-075 §B3 exige al menos tres — cinco registros de una misma tarde
 * describen una tarde, no una tendencia.
 */
const cinco = (minutosReales: number) =>
  Array.from({ length: 5 }, (_, i) => o(minutosReales, 40, 60, `2026-09-0${i + 1}`));

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
    expect(Object.keys(obs).sort()).toEqual([
      "dia",
      "estimadoMax",
      "estimadoMin",
      "minutosReales",
      "tipo",
    ]);
  });

  it("declara con qué regla se calculó", () => {
    expect(multiplicadorDe(cinco(60)).regla).toBe("multiplicador-v1");
  });
});

describe("Comparabilidad, no sólo cantidad (ADR-075 §B3)", () => {
  it("cinco registros del MISMO día no calibran: son una tarde", () => {
    // *"Importa tanto la calidad y comparabilidad de las observaciones como la
    // cantidad."*
    const mismaTarde = Array.from({ length: 5 }, () => o(75, 40, 60, "2026-09-01"));
    const m = multiplicadorDe(mismaTarde);
    expect(m.estado).toBe("SIN_HISTORIA");
    if (m.estado !== "SIN_HISTORIA") return;
    expect(m.motivo).toBe("POCOS_DIAS");
    // Y aun así se cuentan: no calibrar no es no tener datos.
    expect(m.observaciones).toBe(5);
  });

  it("con tres días distintos ya calibra", () => {
    const tresDias = [
      o(75, 40, 60, "2026-09-01"),
      o(75, 40, 60, "2026-09-01"),
      o(75, 40, 60, "2026-09-02"),
      o(75, 40, 60, "2026-09-03"),
      o(75, 40, 60, "2026-09-03"),
    ];
    expect(multiplicadorDe(tresDias).estado).toBe("CALIBRADO");
  });

  it("la confianza es baja entre 5 y 9, y NO se expone al estudiante", () => {
    // *"Rotular internamente la confianza como baja entre 5 y 9; no exponer ese
    // rótulo como evaluación personal."*
    const m5 = multiplicadorDe(cinco(75));
    expect(m5.confianza).toBe("baja");

    const diez = Array.from({ length: 10 }, (_, i) => o(75, 40, 60, `2026-09-0${(i % 5) + 1}`));
    expect(multiplicadorDe(diez).confianza).toBe("suficiente");
  });

  it("las observaciones se pueden separar por tipo de actividad", () => {
    // Comparar una lectura con un laboratorio no compara nada.
    const mezcla = [...cinco(75), o(30, 40, 60, "2026-09-01", "leer")];
    const grupos = porTipo(mezcla);
    expect(grupos.get("resolver")).toHaveLength(5);
    expect(grupos.get("leer")).toHaveLength(1);
  });
});

describe("La revisión de calibración (ADR-075 §B2)", () => {
  /**
   * ⚠️ **No es una señal de riesgo del estudiante.** Superar el techo *"puede
   * señalar un error de estimación, una tarea mal definida, interrupciones,
   * registro inexacto, material insuficiente o ayuda no contabilizada"*.
   */
  it("una sola vez por encima del techo no dispara nada", () => {
    const casi = [o(50), o(50), o(50), o(50), o(200, 40, 60, "2026-09-05")];
    expect(revisionDeCalibracion(casi).estado).toBe("NO_CORRESPONDE");
  });

  it("tres de las últimas cinco, en dos días distintos, sí", () => {
    const patron = [
      o(50, 40, 60, "2026-09-01"),
      o(50, 40, 60, "2026-09-02"),
      o(200, 40, 60, "2026-09-03"),
      o(200, 40, 60, "2026-09-03"),
      o(200, 40, 60, "2026-09-04"),
    ];
    const r = revisionDeCalibracion(patron);
    expect(r.estado).toBe("CORRESPONDE");
    if (r.estado !== "CORRESPONDE") return;
    expect(r.ocurrencias).toBe(3);
    expect(r.desdeElDia).toBe("2026-09-03");
  });

  it("tres veces el MISMO día no alcanza: una tarde mala no es un patrón", () => {
    const unaTarde = [
      o(50, 40, 60, "2026-09-01"),
      o(50, 40, 60, "2026-09-02"),
      o(200, 40, 60, "2026-09-03"),
      o(200, 40, 60, "2026-09-03"),
      o(200, 40, 60, "2026-09-03"),
    ];
    expect(revisionDeCalibracion(unaTarde).estado).toBe("NO_CORRESPONDE");
  });

  it("mira las últimas cinco, no toda la historia", () => {
    // Un mal tramo viejo, ya superado, no puede convocar a nadie hoy.
    const viejo = [
      o(200, 40, 60, "2026-08-01"),
      o(200, 40, 60, "2026-08-02"),
      o(200, 40, 60, "2026-08-03"),
      o(50, 40, 60, "2026-09-01"),
      o(50, 40, 60, "2026-09-02"),
      o(50, 40, 60, "2026-09-03"),
      o(50, 40, 60, "2026-09-04"),
      o(50, 40, 60, "2026-09-05"),
    ];
    expect(revisionDeCalibracion(viejo).estado).toBe("NO_CORRESPONDE");
  });
});

describe("El estudiante puede desactivar el ajuste (ADR-075 §B4)", () => {
  it("desactivado devuelve 1.0 con su motivo", () => {
    const m = multiplicadorDe(cinco(75), false);
    expect(m.valor).toBe(1);
    expect(m.estado).toBe("SIN_HISTORIA");
    if (m.estado !== "SIN_HISTORIA") return;
    expect(m.motivo).toBe("DESACTIVADO");
  });

  it("apagarlo NO borra la historia: las observaciones se siguen contando", () => {
    // Si se perdieran, volver a encenderlo empezaría de cero, y el estudiante
    // pagaría por haber querido entender qué estaba pasando.
    expect(multiplicadorDe(cinco(75), false).observaciones).toBe(5);
  });
});
