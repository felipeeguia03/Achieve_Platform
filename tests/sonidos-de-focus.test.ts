/**
 * Los sonidos de Modo Focus, calculados — [ADR-104](../docs/decisions.md#adr-104) §19 y su
 * Enmienda 1.
 *
 * No se puede escuchar desde un test; se puede medir. Lo que se fija acá es lo
 * que distingue a cada sonido de un ruido cualquiera, y que ninguno sale de un
 * archivo.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { SONIDOS } from "@/lib/domain/sesion-de-focus";
import { DURACION_DEL_LOOP, muestrasDe } from "@/lib/client/focus/sonidos";
import { copy } from "@/lib/content/es-AR";

/** Un generador con semilla: la misma medición en cada corrida. */
function semilla(s: number) {
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SR = 8000;
const medir = (d: Float32Array) => {
  let pico = 0;
  let suma = 0;
  let nan = 0;
  for (const v of d) {
    if (!Number.isFinite(v)) nan++;
    pico = Math.max(pico, Math.abs(v));
    suma += v * v;
  }
  const rms = Math.sqrt(suma / d.length);
  const ventanas = Array.from({ length: DURACION_DEL_LOOP }, (_, w) => {
    let q = 0;
    for (let i = w * SR; i < (w + 1) * SR; i++) q += d[i]! ** 2;
    return Math.sqrt(q / SR);
  });
  return { pico, rms, cresta: pico / rms, nan, ventanas };
};

const CON_SONIDO = SONIDOS.filter((s) => s !== "NINGUNO");
const medidas = Object.fromEntries(CON_SONIDO.map((s) => [s, medir(muestrasDe(s, SR, semilla(7))!)]));

describe("ADR-104 · Enm. 1 · los sonidos", () => {
  it("son siete opciones: sin sonido, lluvia, mar, viento, chimenea, ruido marrón y rosa", () => {
    expect([...SONIDOS]).toEqual(["NINGUNO", "LLUVIA", "MAR", "VIENTO", "CHIMENEA", "MARRON", "ROSA"]);
    for (const s of SONIDOS) expect(copy[`FOCUS.SONIDO.${s}` as keyof typeof copy], s).toBeTruthy();
  });

  it("sin sonido no calcula nada", () => {
    expect(muestrasDe("NINGUNO", SR)).toBeNull();
  });

  it.each(CON_SONIDO)("%s: un loop de 24 s, sin valores rotos, normalizado y audible", (s) => {
    const d = muestrasDe(s, SR, semilla(3))!;
    const m = medir(d);
    expect(d.length).toBe(SR * DURACION_DEL_LOOP);
    expect(m.nan).toBe(0);
    expect(m.pico).toBeLessThanOrEqual(0.9 + 1e-6);
    expect(m.pico).toBeGreaterThan(0.85);
    expect(m.rms).toBeGreaterThan(0.03);
  });

  it("la lluvia y la chimenea tienen golpes que sobresalen: gotas y chasquidos, no un siseo parejo", () => {
    expect(medidas.LLUVIA!.cresta).toBeGreaterThan(medidas.MARRON!.cresta * 1.5);
    expect(medidas.CHIMENEA!.cresta).toBeGreaterThan(medidas.MARRON!.cresta * 2);
  });

  it("el mar y el viento suben y bajan; la lluvia no", () => {
    const variacion = (s: string) => Math.max(...medidas[s]!.ventanas) / Math.min(...medidas[s]!.ventanas);
    expect(variacion("MAR")).toBeGreaterThan(3);
    expect(variacion("VIENTO")).toBeGreaterThan(2);
    expect(variacion("LLUVIA")).toBeLessThan(1.5);
  });

  it("la costura del loop no se oye: el mar empieza y termina en la misma fase", () => {
    const v = medidas.MAR!.ventanas;
    expect(Math.abs(v[0]! - v[v.length - 1]!) / v[0]!).toBeLessThan(0.3);
  });
});

describe("ADR-104 §19 · sin archivos de audio", () => {
  function archivos(dir: string): string[] {
    return readdirSync(resolve(process.cwd(), dir)).flatMap((e) => {
      const p = join(dir, e);
      return statSync(resolve(process.cwd(), p)).isDirectory() ? archivos(p) : [p];
    });
  }

  it("no hay grabaciones en `public/` y el motor no pide nada por red", () => {
    expect(archivos("public").filter((p) => /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(p))).toEqual([]);
    for (const p of ["lib/client/focus/audio.ts", "lib/client/focus/sonidos.ts"]) {
      const c = readFileSync(resolve(process.cwd(), p), "utf8");
      expect(c, p).not.toMatch(/fetch\(|decodeAudioData|https?:\/\/|new Audio\(/);
    }
  });
});
