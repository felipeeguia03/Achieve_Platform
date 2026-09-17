import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { esSecretoDeServicio } from "@/lib/server/http";

/**
 * Etapa B4.2 — el reloj tiene ejecución operativa.
 *
 * El reloj estaba construido, probado y **nadie lo llamaba**: era la pieza que
 * faltaba para que el producto se mueva solo. `product.md` §226 dice que la UI
 * no declara `MISSED` ni `DUE` por el paso del tiempo —lo hace el owner del
 * lifecycle—, y ese owner no servía de nada sin nadie que lo despierte.
 */

const LEER = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("B4.2 · el secreto de servicio", () => {
  it("acepta el secreto correcto", () => {
    expect(esSecretoDeServicio("s3cr3to", "s3cr3to")).toBe(true);
  });

  it("rechaza uno distinto, y uno de otro largo", () => {
    expect(esSecretoDeServicio("s3cr3ta", "s3cr3to")).toBe(false);
    expect(esSecretoDeServicio("s3cr3to-mas-largo", "s3cr3to")).toBe(false);
  });

  /**
   * El caso que decide si el endpoint es seguro o es un agujero: **sin secreto
   * configurado no entra nadie.** Un endpoint que se abre solo cuando falta una
   * variable de entorno es peor que uno que no existe, porque falla justo
   * cuando el despliegue está mal hecho.
   */
  it("sin secreto configurado, nadie entra", () => {
    expect(esSecretoDeServicio("lo-que-sea", undefined)).toBe(false);
    expect(esSecretoDeServicio("lo-que-sea", "")).toBe(false);
    expect(esSecretoDeServicio(null, "s3cr3to")).toBe(false);
    // Ni siquiera vacío contra vacío.
    expect(esSecretoDeServicio("", "")).toBe(false);
  });

  it("compara en tiempo constante: no sale antes en el primer byte distinto", () => {
    // No se mide el tiempo —sería un test frágil—: se verifica que el código no
    // use comparación de strings, que es lo que produce la fuga.
    const fuente = LEER("lib/server/http.ts");
    const cuerpo = fuente.slice(fuente.indexOf("export function esSecretoDeServicio"));
    expect(cuerpo).toContain("^");
    expect(cuerpo, "una comparación directa filtra el secreto de a un byte").not.toMatch(
      /recibido\s*===\s*esperado/,
    );
  });
});

describe("B4.2 · el endpoint del reloj", () => {
  const ruta = LEER("app/api/reloj/route.ts");

  it("es POST: muta estado", () => {
    // Un `GET` que cambia el mundo es lo que hace que un prefetch del navegador
    // declare incumplido un compromiso.
    expect(ruta).toContain("export async function POST");
    expect(ruta).not.toContain("export async function GET");
  });

  it("no se autentica con el JWT de un estudiante", () => {
    // No lo dispara una persona: lo llama un scheduler.
    expect(ruta).toContain("esSecretoDeServicio");
    expect(ruta).not.toContain("resolverSesion");
  });

  it("exige la institución explícita", () => {
    // Un reloj que corre sobre "todas" es un reloj que un día corre sobre una
    // que no debía (`I11`).
    expect(ruta).toContain("institucion");
    expect(ruta).toContain("400");
  });

  it("el 401 no cuenta cómo está desplegado el sistema", () => {
    expect(ruta).toContain('{ error: "No autorizado" }');
    expect(ruta).not.toMatch(/RELOJ_SHARED_SECRET[^)]*\}\s*,\s*\{\s*status:\s*401/);
  });
});

describe("B4.2 · la demo corre el mismo camino que producción", () => {
  it("el script llama al endpoint, no al Service", () => {
    // Si importara `correrReloj` directo, la demo ejercitaría un camino que en
    // producción no existe —sin autenticación, sin borde HTTP— y el primer
    // problema aparecería recién al desplegar.
    const script = LEER("scripts/reloj.mjs");
    expect(script).toContain("/api/reloj");
    expect(script).not.toContain("composicion");
  });

  it("y falla claro si falta el secreto, en vez de intentar y recibir 401", () => {
    expect(LEER("scripts/reloj.mjs")).toContain("RELOJ_SHARED_SECRET");
  });
});
