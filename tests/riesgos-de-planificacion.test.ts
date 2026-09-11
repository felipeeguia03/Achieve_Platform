import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  REGLAS_DE_PLANIFICACION,
  riesgosDePlanificacion,
  type EntradaDeRiesgos,
  type MateriaParaRiesgo,
} from "@/lib/domain/riesgos-de-planificacion";

/**
 * Los riesgos de planificación — [ADR-093](../docs/decisions.md#adr-093).
 *
 * Cada regla se prueba **en su borde**: el umbral que la dispara y el que no.
 * Y se prueban las tres cosas que la hacen honesta: sin datos no dispara, una
 * materia cuenta una sola vez, y el orden es por fecha, no por gravedad.
 */

function m(over: Partial<MateriaParaRiesgo> = {}): MateriaParaRiesgo {
  return {
    cursadaId: "ce-1",
    nombre: "Álgebra",
    evaluacion: { fecha: "2026-09-20", dias: 9, rotulo: "Parcial 1" },
    temasCargados: 8,
    cobertura: 0.6,
    diasSinActividad: 2,
    ...over,
  };
}

const correr = (
  materias: MateriaParaRiesgo[],
  tramoDelReparto: EntradaDeRiesgos["tramoDelReparto"] = null,
) => riesgosDePlanificacion({ materias, tramoDelReparto });

const conFecha = (dias: number) => ({ fecha: `2026-09-${String(11 + dias).padStart(2, "0")}`, dias, rotulo: "Parcial 1" });

describe("los umbrales", () => {
  it("son los que decidió el owner, con su versión", () => {
    // Cambiar un número sin cambiar la versión haría que dos pantallas del mismo
    // día digan cosas distintas sin que nada lo delate.
    expect(REGLAS_DE_PLANIFICACION).toEqual({
      version: "PLAN-v0.1",
      horizonteDias: 21,
      cercaniaDias: 7,
      coberturaMinima: 0.5,
      actividadHorizonteDias: 14,
      sinActividadDias: 10,
      separacionDias: 1,
    });
  });
});

describe("una materia sana no dispara nada", () => {
  it("con fecha, temas, cobertura y actividad", () => {
    expect(correr([m()])).toEqual([]);
  });

  it("sin evaluación con fecha ninguna regla la mira", () => {
    expect(correr([m({ evaluacion: null, temasCargados: 0, cobertura: 0, diasSinActividad: null })])).toEqual([]);
  });

  it("una evaluación pasada tampoco", () => {
    expect(correr([m({ evaluacion: conFecha(-1), cobertura: 0 })])).toEqual([]);
  });
});

describe("EVALUACION_SIN_TEMAS", () => {
  it("dispara dentro del horizonte", () => {
    expect(correr([m({ temasCargados: 0, evaluacion: conFecha(21) })])).toMatchObject([
      { regla: "EVALUACION_SIN_TEMAS", cursadaId: "ce-1", dias: 21, rotulo: "Parcial 1" },
    ]);
  });

  it("no más allá del horizonte", () => {
    expect(correr([m({ temasCargados: 0, evaluacion: conFecha(22) })])).toEqual([]);
  });
});

describe("COBERTURA_BAJA_CERCA", () => {
  it("dispara a 7 días con menos de la mitad", () => {
    expect(correr([m({ evaluacion: conFecha(7), cobertura: 0.49 })])).toMatchObject([
      { regla: "COBERTURA_BAJA_CERCA", porcentaje: 49, dias: 7 },
    ]);
  });

  it("no a 8 días, ni con la mitad justa", () => {
    expect(correr([m({ evaluacion: conFecha(8), cobertura: 0.1 })])).toEqual([]);
    expect(correr([m({ evaluacion: conFecha(3), cobertura: 0.5 })])).toEqual([]);
  });

  /** *Sin datos no es cero* (`AGENTS.md` §2.5): no saber la cobertura no es tenerla baja. */
  it("sin cobertura calculable NO dispara", () => {
    expect(correr([m({ evaluacion: conFecha(3), cobertura: null })])).toEqual([]);
  });
});

describe("SIN_ACTIVIDAD_CERCA", () => {
  it("dispara a 14 días con 10 sin actividad", () => {
    expect(correr([m({ evaluacion: conFecha(14), diasSinActividad: 10 })])).toMatchObject([
      { regla: "SIN_ACTIVIDAD_CERCA", diasSinActividad: 10 },
    ]);
  });

  it("no con 9 días sin actividad, ni con la evaluación a 15", () => {
    expect(correr([m({ evaluacion: conFecha(14), diasSinActividad: 9 })])).toEqual([]);
    expect(correr([m({ evaluacion: conFecha(15), diasSinActividad: 30 })])).toEqual([]);
  });

  it("nunca haber registrado actividad cuenta, y se distingue de un número", () => {
    expect(correr([m({ evaluacion: conFecha(10), diasSinActividad: null })])).toMatchObject([
      { regla: "SIN_ACTIVIDAD_CERCA", diasSinActividad: null },
    ]);
  });
});

describe("una materia cuenta una sola vez", () => {
  it("la más específica gana: a 4 días, sin cobertura y sin actividad es cobertura", () => {
    const r = correr([m({ evaluacion: conFecha(4), cobertura: 0, diasSinActividad: null })]);
    expect(r.map((x) => x.regla)).toEqual(["COBERTURA_BAJA_CERCA"]);
  });

  it("sin temas gana sobre todo lo demás", () => {
    const r = correr([m({ evaluacion: conFecha(4), temasCargados: 0, cobertura: 0, diasSinActividad: null })]);
    expect(r.map((x) => x.regla)).toEqual(["EVALUACION_SIN_TEMAS"]);
  });
});

describe("EVALUACIONES_ENCIMADAS", () => {
  it("dos el mismo día son un riesgo, marcado como mismo día", () => {
    const r = correr([m({ evaluacion: conFecha(6) }), m({ cursadaId: "ce-2", nombre: "Física", evaluacion: conFecha(6) })]);
    expect(r).toMatchObject([{ regla: "EVALUACIONES_ENCIMADAS", mismoDia: true, dias: 6 }]);
  });

  it("días seguidos también; con un día libre entre medio, no", () => {
    const seguidas = correr([m({ evaluacion: conFecha(5) }), m({ cursadaId: "ce-2", evaluacion: conFecha(6) })]);
    expect(seguidas).toMatchObject([{ regla: "EVALUACIONES_ENCIMADAS", mismoDia: false }]);
    const separadas = correr([m({ evaluacion: conFecha(5) }), m({ cursadaId: "ce-2", evaluacion: conFecha(7) })]);
    expect(separadas).toEqual([]);
  });

  it("una cadena de tres días es un grupo, no dos pares", () => {
    const r = correr([
      m({ evaluacion: conFecha(5) }),
      m({ cursadaId: "ce-2", evaluacion: conFecha(6) }),
      m({ cursadaId: "ce-3", evaluacion: conFecha(7) }),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ regla: "EVALUACIONES_ENCIMADAS" });
    expect(r[0]?.regla === "EVALUACIONES_ENCIMADAS" && r[0].materias.map((x) => x.cursadaId)).toEqual([
      "ce-1",
      "ce-2",
      "ce-3",
    ]);
  });
});

describe("PLAN_NO_ENTRA — el Personal Engine", () => {
  it("sólo en el tramo `CRITICA`: el umbral de 2× es de la psicopedagoga", () => {
    expect(correr([], "CRITICA")).toEqual([{ regla: "PLAN_NO_ENTRA" }]);
    for (const tramo of ["ENTRA", "AJUSTABLE", "SIN_DATOS", null] as const) {
      expect(correr([], tramo)).toEqual([]);
    }
  });
});

describe("el orden es por fecha, no por gravedad", () => {
  it("el más cercano primero, y el del plan —que no tiene fecha— al final", () => {
    const r = correr(
      [
        m({ cursadaId: "lejos", temasCargados: 0, evaluacion: conFecha(18) }),
        m({ cursadaId: "cerca", evaluacion: conFecha(3), cobertura: 0.1 }),
      ],
      "CRITICA",
    );
    expect(r.map((x) => ("cursadaId" in x ? x.cursadaId : x.regla))).toEqual(["cerca", "lejos", "PLAN_NO_ENTRA"]);
  });
});

describe("la frontera con el Risk Engine", () => {
  const FUENTE = readFileSync(resolve(process.cwd(), "lib/domain/riesgos-de-planificacion.ts"), "utf8");

  it("es puro: no importa nada del servidor, de `RiskSignal` ni de los eventos", () => {
    const imports = FUENTE.split("\n").filter((l) => l.startsWith("import"));
    expect(imports).toEqual([]);
  });

  it("no escribe: ninguna palabra de persistencia ni de intervención en el código", () => {
    const codigo = FUENTE.replace(/\/\*\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(codigo).not.toMatch(/risk_signal|intervenci|product_event|insert|upsert|fetch\(/i);
  });
});
