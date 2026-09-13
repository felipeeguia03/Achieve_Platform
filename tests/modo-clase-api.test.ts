/**
 * Modo Clase, corte 3 — las fronteras de la API · [ADR-098](../docs/decisions.md#adr-098).
 *
 * El comportamiento se probó contra la base con sesión real (`modo-clase.md`
 * §E, 401 · 404 ajeno · 409 · idempotencia). Esto protege lo que un refactor
 * rompe sin que ningún test de comportamiento se entere.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const LEER = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
const RUTAS = ["app/api/clase/route.ts", "app/api/clase/fin/route.ts", "app/api/clase/marca/route.ts"];
const SERVICIO = LEER("lib/server/servicios/clase.ts");
const REPO = LEER("lib/server/repositorios/clase.ts");
/** El código sin comentarios: lo que se ejecuta, no lo que explica. */
const codigo = (ts: string) => ts.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("cada ruta de Modo Clase", () => {
  for (const ruta of RUTAS) {
    const fuente = LEER(ruta);
    it(`${ruta}: sesión, padrón y alta antes que nada`, () => {
      expect(fuente).toContain("resolverSesion(tokenDelHeader(");
      expect(fuente).toContain('{ status: 401 }');
      expect(fuente).toContain('{ status: 403 }');
      expect(fuente).toContain("altaPendiente(");
    });

    it(`${ruta}: el estudiante sale de la sesión, nunca del pedido`, () => {
      expect(codigo(fuente)).not.toMatch(/cuerpo\??\.(estudiante|studentId|institucion|institutionId)\b/);
    });

    it(`${ruta}: no habla con la base`, () => {
      expect(fuente).not.toMatch(/supabase|clienteDeServicio/);
    });

    it(`${ruta}: lo ajeno es 404, nunca 403 por la clase`, () => {
      expect(fuente).not.toMatch(/(NO_ENCONTRADA|CURSADA_AJENA|BLOQUE_AJENO)"?:?[\s\S]{0,120}status: 403/);
    });
  }
});

describe("lo que Modo Clase no produce (ADR-098 §10)", () => {
  it("el Service no toca Evidence, progreso, Actions, compromisos ni reportes de clase", () => {
    const c = codigo(SERVICIO + REPO);
    expect(c).not.toMatch(/from\("(evidence|progress_entry|topic_progress|action|commitment|class_event_record)"\)/);
    expect(c).not.toMatch(/registrar_progreso|ProgressUpdated|EvidenceSubmitted/);
  });

  it("la clase dictada sólo se lee: ninguna escritura sobre `class_session`", () => {
    expect(codigo(REPO)).not.toMatch(/from\("class_session"\)\s*\.(insert|update|upsert|delete)/);
  });

  it("sólo se publican los dos eventos declarados, y ninguno por marca", () => {
    const publicados = [...SERVICIO.matchAll(/nombre:\s*"([A-Za-z]+)"/g)].map((m) => m[1]);
    expect(publicados.sort()).toEqual(["ClassSessionEnded", "ClassSessionStarted"]);
    const marcar = SERVICIO.slice(SERVICIO.indexOf("export async function marcar"));
    expect(codigo(marcar)).not.toContain("publicar(");
  });

  it("no hay reloj del cliente: el momento de la marca sale de `ahora()` del servidor", () => {
    expect(SERVICIO).toContain("segundosEntre(clase.iniciadaEn, d.ahora())");
    expect(LEER("app/api/clase/marca/route.ts")).not.toMatch(/cuerpo\??\.segundos/);
  });
});
