import { describe, expect, it } from "vitest";

import { chequearParaEnviar, cuelgaDeAlgo } from "@/lib/server/servicios/reflexion";
import { t } from "@/lib/content/es-AR";

/**
 * Etapa B6.10 — **la reflexión existe y se exige**.
 *
 * Los tres estados del requisito ya estaban probados desde la B2.4. Lo que
 * estos tests protegen es lo que faltaba: que el bloqueo **no viva sólo en la
 * pantalla**, y que la pantalla no llame *"opcional"* a algo que bloquea.
 */
describe("B6.10 · el requisito de Reflection se hace cumplir, no se muestra", () => {
  it("sólo REQUIRED bloquea, y sólo cuando falta", () => {
    expect(chequearParaEnviar("REQUIRED", null).estado).toBe("FALTA_REFLEXION_REQUERIDA");
    expect(chequearParaEnviar("OPTIONAL", null).estado).toBe("OK");
    expect(chequearParaEnviar("NO_CONFIGURADA", null).estado).toBe("OK");
    expect(chequearParaEnviar("REQUIRED", { actionId: "a", note: "algo" }).estado).toBe("OK");
  });

  it("una reflexión en blanco no destraba nada", () => {
    // Escrita para destrabar un botón, entra a la Bitácora idéntica a una real
    // (ADR-026). Por eso vacía se rechaza incluso cuando es obligatoria.
    expect(chequearParaEnviar("REQUIRED", { actionId: "a", note: "   " }).estado).toBe("REFLEXION_VACIA");
  });

  it("una reflexión cuelga de algo, o no se guarda", () => {
    expect(cuelgaDeAlgo({ note: "algo" })).toBe(false);
    expect(cuelgaDeAlgo({ actionId: "a", note: "algo" })).toBe(true);
    expect(cuelgaDeAlgo({ evidenceId: "e", note: "algo" })).toBe(true);
    expect(cuelgaDeAlgo({ protocolStepId: "p", note: "algo" })).toBe(true);
  });

  it("cuando bloquea, el texto no la llama opcional", () => {
    // Decirle "opcional" a lo que apaga el botón es decirle al estudiante lo
    // contrario de lo que va a pasar.
    expect(t("CTA.REFLEXION_REQUERIDA")).not.toMatch(/opcional/i);
    expect(t("CTA.AGREGAR_REFLEXION")).toMatch(/opcional/i);
    // Y la pantalla dice **por qué** no puede enviar, en vez de mostrar una CTA
    // apagada sin explicación. La copy la aprobó el owner en ADR-044.
    expect(t("EVIDENCIA.FALTA_REFLEXION")).toBe("Contanos cómo te fue para enviar la evidencia.");
    expect(t("CTA.REFLEXION_REQUERIDA")).toBe("Contanos cómo te fue (requerido)");
  });
});
