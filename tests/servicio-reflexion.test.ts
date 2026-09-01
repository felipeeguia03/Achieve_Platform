import { describe, expect, it } from "vitest";

import {
  chequearParaEnviar,
  cuelgaDeAlgo,
  type ReflexionEntregada,
} from "@/lib/server/servicios/reflexion";

/**
 * Etapa B2.4 — `Reflection`.
 *
 * Se prueba lo que está cerrado. **`C01-051` sigue `OPEN` con gate `H`**: dónde
 * vive el flag `OPTIONAL`/`REQUIRED` y quién lo pone lo decide una persona, así
 * que el requisito entra por parámetro y no hay configuración que testear.
 */
const CON_CONTENIDO: ReflexionEntregada = { actionId: "act-1", actualMinutes: 45 };

describe("B2.4 · si es requerida, bloquea el envío", () => {
  it("REQUIRED y ausente bloquea", () => {
    expect(chequearParaEnviar("REQUIRED", null)).toEqual({ estado: "FALTA_REFLEXION_REQUERIDA" });
  });

  it("REQUIRED y presente con contenido deja enviar", () => {
    expect(chequearParaEnviar("REQUIRED", CON_CONTENIDO)).toEqual({ estado: "OK" });
  });

  it("OPTIONAL y ausente deja enviar", () => {
    expect(chequearParaEnviar("OPTIONAL", null)).toEqual({ estado: "OK" });
  });

  it("`NO_CONFIGURADA` tampoco bloquea: nadie pidió una Reflection (ADR-026)", () => {
    expect(chequearParaEnviar("NO_CONFIGURADA", null)).toEqual({ estado: "OK" });
  });
});

describe("B2.4 · una Reflection vacía no es una Reflection", () => {
  /**
   * Un objeto con todo en blanco después aparece en la Bitácora como si el
   * estudiante hubiera reflexionado. `P-09`: la ausencia se ve como ausencia.
   */
  it("presente pero sin ningún dato se rechaza, sea requerida u opcional", () => {
    for (const requisito of ["REQUIRED", "OPTIONAL"] as const) {
      expect(chequearParaEnviar(requisito, { actionId: "act-1" }), requisito).toEqual({
        estado: "REFLEXION_VACIA",
      });
    }
  });

  it("una nota con sólo espacios no es contenido", () => {
    expect(chequearParaEnviar("REQUIRED", { actionId: "a", note: "   " })).toEqual({
      estado: "REFLEXION_VACIA",
    });
  });

  it("cualquiera de los tres campos alcanza", () => {
    expect(chequearParaEnviar("REQUIRED", { actionId: "a", actualMinutes: 30 }).estado).toBe("OK");
    expect(chequearParaEnviar("REQUIRED", { actionId: "a", difficulty: "esperado" }).estado).toBe("OK");
    expect(chequearParaEnviar("REQUIRED", { actionId: "a", note: "me costó" }).estado).toBe("OK");
  });

  /**
   * `0` minutos es un dato, no una ausencia — es el mismo invariante que
   * `topic_progress` sostiene en la base: sin datos no es cero.
   */
  it("cero minutos es un dato declarado, no un vacío", () => {
    expect(chequearParaEnviar("REQUIRED", { actionId: "a", actualMinutes: 0 }).estado).toBe("OK");
  });
});

describe("B2.4 · la Reflection cuelga de algo", () => {
  it("sin Action, Evidence ni paso, no cuelga de nada", () => {
    expect(cuelgaDeAlgo({ note: "suelta" })).toBe(false);
  });

  it("con cualquiera de los tres, sí", () => {
    expect(cuelgaDeAlgo({ actionId: "a" })).toBe(true);
    expect(cuelgaDeAlgo({ evidenceId: "e" })).toBe(true);
    expect(cuelgaDeAlgo({ protocolStepId: "p" })).toBe(true);
  });
});

describe("B2.4 · lo que este Service NO hace", () => {
  /**
   * "Su ausencia bloquea **sólo** el submit dependiente." Que falte una
   * Reflection requerida no invalida la Evidence, no cambia su estado y no
   * toca el progreso: sólo impide enviar.
   */
  it("no emite juicio sobre la Evidence ni sobre el dominio", () => {
    const r = chequearParaEnviar("REQUIRED", null);
    // El resultado es exactamente eso y nada más: un permiso de envío.
    expect(Object.keys(r)).toEqual(["estado"]);
    expect(JSON.stringify(r)).not.toMatch(/suficien|valid|dominio|progres/i);
  });
});
