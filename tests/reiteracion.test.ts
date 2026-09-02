import { describe, expect, it } from "vitest";

import {
  evaluarReiteracion,
  umbralDesdeConfig,
  type ObservacionDeError,
  type UmbralDeReiteracion,
} from "@/lib/domain/reiteracion";

/**
 * La regla provisional de `C01-021` — Etapa B6.5, [ADR-036](../docs/decisions.md#adr-036).
 *
 * ⚠️ Los números de acá **son los del Product Owner**, provisionales y sin
 * validación psicopedagógica. Lo que estos tests fijan no es que 3 sea el
 * número correcto: es que **el conteo sea determinístico** y que el umbral
 * llegue de afuera. Si mañana ella dice 4, cambia una fila de configuración y
 * estos tests siguen valiendo con otro `UMBRAL`.
 */
const UMBRAL: UmbralDeReiteracion = {
  apariciones: { atencion: 2, intervencion: 3 },
  reincidenciaTrasCorrectiva: "intervencion",
  reiniciaConResolucionLimpia: true,
  soloCorroboradas: true,
};

let reloj = 0;
function err(o: Partial<ObservacionDeError> = {}): ObservacionDeError {
  reloj++;
  return {
    kind: "error",
    corroborated: true,
    observedAt: `2026-09-0${reloj}T10:00:00.000Z`,
    trasAccionCorrectiva: false,
    ...o,
  };
}
function limpia(o: Partial<ObservacionDeError> = {}): ObservacionDeError {
  return err({ kind: "resolucion_limpia", ...o });
}

describe("C01-021 provisional · el conteo", () => {
  it("la primera aparición no pide nada", () => {
    reloj = 0;
    const r = evaluarReiteracion([err()], UMBRAL, "Error de cálculo");
    expect(r).toMatchObject({ apariciones: 1, severidad: null, necesitaPersona: false });
    // Sin severidad no hay motivo, y sin motivo no hay señal: `registrarSenal`
    // rechaza una causa vacía.
    expect(r.motivo).toBeNull();
  });

  it("la segunda es `atencion`, y todavía no llama a una persona", () => {
    reloj = 0;
    const r = evaluarReiteracion([err(), err()], UMBRAL, "Error de cálculo");
    expect(r).toMatchObject({ apariciones: 2, severidad: "atencion", necesitaPersona: false });
    expect(r.motivo).toBe("Error de cálculo: 2 veces en la preparación de este examen");
  });

  it("la tercera pide una persona", () => {
    reloj = 0;
    const r = evaluarReiteracion([err(), err(), err()], UMBRAL, "Error de cálculo");
    expect(r).toMatchObject({ apariciones: 3, severidad: "intervencion", necesitaPersona: true });
  });

  it("el mismo tipo cuenta aunque el tema sea otro", () => {
    // Decisión del PO, textual: el tema *"es contexto explicativo"*. El
    // evaluador ni siquiera recibe el tema — es la forma más fuerte de que no
    // pueda influir.
    reloj = 0;
    const r = evaluarReiteracion([err(), err(), err()], UMBRAL, "Error conceptual");
    expect(r.apariciones).toBe(3);
  });
});

describe("C01-021 provisional · lo que reinicia y lo que no cuenta", () => {
  it("una resolución limpia reinicia el contador de ese tipo", () => {
    reloj = 0;
    const r = evaluarReiteracion([err(), err(), limpia(), err()], UMBRAL, "Error de cálculo");
    expect(r).toMatchObject({ apariciones: 1, severidad: null });
  });

  it("y después del reinicio se vuelve a contar desde cero", () => {
    reloj = 0;
    const r = evaluarReiteracion(
      [err(), err(), limpia(), err(), err(), err()],
      UMBRAL,
      "Error de cálculo",
    );
    expect(r).toMatchObject({ apariciones: 3, severidad: "intervencion" });
  });

  it("una observación sin corroborar no cuenta", () => {
    // Punto 6 de `C01-036`: un error inferido, ambiguo o no corroborado no
    // incrementa el contador.
    reloj = 0;
    const r = evaluarReiteracion(
      [err(), err({ corroborated: false }), err({ corroborated: false })],
      UMBRAL,
      "Error de cálculo",
    );
    expect(r).toMatchObject({ apariciones: 1, severidad: null });
  });

  it("y tampoco reinicia: una resolución que nadie verificó no borra nada", () => {
    // La simetría importa. Si lo no corroborado no suma pero sí resta, alcanza
    // con declarar una resolución para apagar una señal.
    reloj = 0;
    const r = evaluarReiteracion(
      [err(), err(), limpia({ corroborated: false }), err()],
      UMBRAL,
      "Error de cálculo",
    );
    expect(r).toMatchObject({ apariciones: 3, severidad: "intervencion" });
  });
});

describe("C01-021 provisional · la reincidencia tras una correctiva", () => {
  it("volver a fallar después de una acción correctiva pide una persona sin esperar la tercera", () => {
    reloj = 0;
    const r = evaluarReiteracion(
      [err(), err({ trasAccionCorrectiva: true })],
      UMBRAL,
      "Error de procedimiento",
    );
    expect(r).toMatchObject({ apariciones: 2, severidad: "intervencion", necesitaPersona: true });
    expect(r.motivo).toContain("volvió a aparecer después de una acción correctiva");
  });

  it("pero una PRIMERA aparición tras una correctiva no es una reincidencia", () => {
    // "Una **nueva** aparición", dijo el PO. Un primer error no es volver a
    // equivocarse, y tratarlo así castigaría a alguien que recién empieza.
    reloj = 0;
    const r = evaluarReiteracion([err({ trasAccionCorrectiva: true })], UMBRAL, "Error conceptual");
    expect(r).toMatchObject({ apariciones: 1, severidad: null });
  });

  it("una resolución limpia posterior también borra la reincidencia", () => {
    reloj = 0;
    const r = evaluarReiteracion(
      [err(), err({ trasAccionCorrectiva: true }), limpia(), err()],
      UMBRAL,
      "Error conceptual",
    );
    expect(r).toMatchObject({ apariciones: 1, severidad: null });
  });
});

describe("C01-021 provisional · determinismo y ausencia de umbral", () => {
  it("el orden de entrada no cambia el resultado: se ordena por fecha", () => {
    const a: ObservacionDeError[] = [
      { kind: "error", corroborated: true, observedAt: "2026-09-03T10:00:00Z", trasAccionCorrectiva: false },
      { kind: "resolucion_limpia", corroborated: true, observedAt: "2026-09-02T10:00:00Z", trasAccionCorrectiva: false },
      { kind: "error", corroborated: true, observedAt: "2026-09-01T10:00:00Z", trasAccionCorrectiva: false },
    ];
    const enOrden = evaluarReiteracion([...a].reverse(), UMBRAL, "x");
    const desordenado = evaluarReiteracion(a, UMBRAL, "x");
    expect(desordenado).toEqual(enOrden);
    expect(desordenado.apariciones).toBe(1);
  });

  it("correr dos veces sobre lo mismo da lo mismo: no hay azar", () => {
    reloj = 0;
    const obs = [err(), err(), err()];
    expect(evaluarReiteracion(obs, UMBRAL, "x")).toEqual(evaluarReiteracion(obs, UMBRAL, "x"));
  });

  it("sin apariciones no hay nada que decir", () => {
    expect(evaluarReiteracion([], UMBRAL, "x")).toMatchObject({
      apariciones: 0,
      severidad: null,
      motivo: null,
    });
  });

  it("una regla sin umbral no produce un umbral por defecto", () => {
    // `HP0-06-2` y `HP0-06-3` siguen así. Devolver un default sería inventar la
    // decisión que nadie tomó.
    expect(umbralDesdeConfig(null)).toBeNull();
    expect(umbralDesdeConfig({})).toBeNull();
    expect(umbralDesdeConfig({ apariciones: { atencion: 2 } })).toBeNull();
  });

  it("el umbral se lee tal como está en la configuración", () => {
    const u = umbralDesdeConfig({
      apariciones: { atencion: 4, intervencion: 7 },
      reincidencia_tras_correctiva: "riesgo",
      reinicia_con_resolucion_limpia: true,
      solo_corroboradas: true,
    });
    expect(u).toEqual({
      apariciones: { atencion: 4, intervencion: 7 },
      reincidenciaTrasCorrectiva: "riesgo",
      reiniciaConResolucionLimpia: true,
      soloCorroboradas: true,
    });
    // Y con otro umbral, el mismo conteo da otra cosa: la regla no está fijada
    // en el código.
    reloj = 0;
    expect(evaluarReiteracion([err(), err()], u!, "x").severidad).toBeNull();
  });
});
