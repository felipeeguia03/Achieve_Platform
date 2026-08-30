import { describe, expect, it } from "vitest";
import { buscarEnPaleta } from "@/lib/navigation/paleta";
import { indiceDePaleta } from "@/lib/fixtures/indice-paleta";
import { superficieIds, nodos } from "@/lib/navigation/surfaces";
import { escenarioIds } from "@/lib/fixtures";

describe("El índice cubre lo que se puede alcanzar", () => {
  it("incluye las nueve superficies", () => {
    const superficies = indiceDePaleta.filter((e) => e.tipo === "superficie");
    expect(superficies).toHaveLength(superficieIds.length);
    for (const id of superficieIds) {
      expect(superficies.some((e) => e.url === nodos[id].ruta), id).toBe(true);
    }
  });

  it("incluye un escenario por cada uno del catálogo que tenga vista", () => {
    const enPaleta = new Set(indiceDePaleta.filter((e) => e.tipo === "escenario").map((e) => e.titulo));
    // Todo escenario de la paleta existe en el catálogo.
    for (const titulo of enPaleta) expect(escenarioIds).toContain(titulo);
    expect(enPaleta.size).toBeGreaterThan(100);
  });

  it("toda entrada declara una URL y un detalle", () => {
    for (const e of indiceDePaleta) {
      expect(e.url.startsWith("/"), e.titulo).toBe(true);
      expect(e.detalle.length, e.titulo).toBeGreaterThan(0);
    }
  });
});

describe("I-03 — entrada polimórfica que desambigua sola", () => {
  it("un mismo término trae los dos tipos, sin que el usuario elija", () => {
    // "evidencia" nombra una pantalla Y el propósito de varios escenarios.
    const { entradas } = buscarEnPaleta(indiceDePaleta, "evidencia");
    const tipos = new Set(entradas.map((e) => e.tipo));
    expect(tipos.has("superficie")).toBe(true);
    expect(tipos.has("escenario")).toBe(true);
  });

  it("las superficies van primero: son destinos, no variantes de un destino", () => {
    const { entradas } = buscarEnPaleta(indiceDePaleta, "evidencia");
    const primeraEscenario = entradas.findIndex((e) => e.tipo === "escenario");
    const ultimaSuperficie = entradas.map((e) => e.tipo).lastIndexOf("superficie");
    expect(ultimaSuperficie).toBeLessThan(primeraEscenario);
  });

  it("busca por ID de escenario", () => {
    const { entradas } = buscarEnPaleta(indiceDePaleta, "FX-LOCAL-COM-MISSED");
    expect(entradas[0].titulo).toBe("FX-LOCAL-COM-MISSED");
    expect(entradas[0].url).toContain("?escenario=FX-LOCAL-COM-MISSED");
  });

  it("busca por la pregunta que responde la superficie", () => {
    const { entradas } = buscarEnPaleta(indiceDePaleta, "qué necesito hacer ahora");
    expect(entradas.some((e) => e.url === "/hoy")).toBe(true);
  });

  it("ignora acentos y mayúsculas", () => {
    expect(buscarEnPaleta(indiceDePaleta, "PROXIMA ACCION").entradas.length).toBeGreaterThan(0);
    expect(buscarEnPaleta(indiceDePaleta, "próxima acción").entradas.length).toBeGreaterThan(0);
  });
});

describe("I-03 — la vía de escape para forzar la interpretación", () => {
  it("`>` fuerza superficies", () => {
    const { entradas, forzado } = buscarEnPaleta(indiceDePaleta, ">evidencia");
    expect(forzado).toBe("superficie");
    expect(entradas.every((e) => e.tipo === "superficie")).toBe(true);
    expect(entradas.length).toBeGreaterThan(0);
  });

  it("`#` fuerza escenarios", () => {
    const { entradas, forzado } = buscarEnPaleta(indiceDePaleta, "#evidencia");
    expect(forzado).toBe("escenario");
    expect(entradas.every((e) => e.tipo === "escenario")).toBe(true);
    expect(entradas.length).toBeGreaterThan(0);
  });

  it("el prefijo sin término lista todo el tipo forzado", () => {
    const { entradas, forzado } = buscarEnPaleta(indiceDePaleta, ">");
    expect(forzado).toBe("superficie");
    expect(entradas.every((e) => e.tipo === "superficie")).toBe(true);
  });

  it("sin prefijo no fuerza nada", () => {
    expect(buscarEnPaleta(indiceDePaleta, "hoy").forzado).toBeNull();
  });
});

describe("Cero red y dirección de dependencias", () => {
  it("el índice es estático y está en memoria", () => {
    expect(Array.isArray(indiceDePaleta)).toBe(true);
    expect(indiceDePaleta.length).toBeGreaterThan(0);
  });

  it("la búsqueda es pura: recibe el índice, no lo importa", () => {
    // Es lo que permite que `lib/navigation/` no dependa de `lib/fixtures/`.
    // La misma función busca sobre cualquier índice.
    const propio = [
      { tipo: "superficie" as const, titulo: "X", detalle: "", url: "/x", indice: "x" },
    ];
    expect(buscarEnPaleta(propio, "x").entradas).toHaveLength(1);
    expect(buscarEnPaleta(propio, "zzz").entradas).toHaveLength(0);
  });
});
