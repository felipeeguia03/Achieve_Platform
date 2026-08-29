import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`token --${name} no existe en app/globals.css`);
  return match[1].trim().split(/\s/)[0].replace(/;$/, "");
}

describe("app/globals.css — tokens de color", () => {
  it("tiene exactamente tres semánticos: éxito, urgencia y humano (DD6)", () => {
    // La cuarta ranura queda deliberadamente vacía. design-system.md §2.3:
    // "un quinto color divide por dos el valor de los anteriores".
    expect(token("exito-fill")).toBe("#34c759");
    expect(token("exito-texto")).toBe("#23883c");
    expect(token("urgencia-fill")).toBe("#f472b6");
    expect(token("urgencia-texto")).toBe("#9c3d68");
    expect(token("humano")).toBe("#0071e3");
  });

  it("--destructive reusa --urgencia-texto: el rescate ES urgencia, no un 4º color", () => {
    expect(token("destructive")).toBe(token("urgencia-texto"));
  });

  it("los charts heredan solo de los 3 semánticos + ink, sin colores nuevos", () => {
    // Deuda detectada por DD6 y reconciliada en la Etapa 0.1: --chart-2 era
    // #ff9500, el naranja anterior a la corrección de DD6, huérfano de esa
    // corrección. Ver docs/design-system.md §1.5.
    expect(token("chart-1")).toBe(token("exito-fill"));
    expect(token("chart-2")).toBe(token("urgencia-fill"));
    expect(token("chart-3")).toBe(token("humano"));
    expect(token("chart-2")).not.toBe("#ff9500");

    const ink = ["#86868b", "#48484a"];
    expect(ink).toContain(token("chart-4"));
    expect(ink).toContain(token("chart-5"));
  });

  it("--muted-foreground conserva la corrección de contraste WCAG AA medida", () => {
    // #86868b daba 3.33:1 y falla AA. #707070 da 4.55:1 mínimo.
    expect(token("muted-foreground")).toBe("#707070");
  });

  it("--primary es ink, nunca un color semántico (I-06)", () => {
    expect(token("primary")).toBe("#1d1d1f");
  });
});
