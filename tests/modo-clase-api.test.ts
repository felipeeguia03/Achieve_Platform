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
const RUTAS = [
  "app/api/clase/route.ts",
  "app/api/clase/fin/route.ts",
  "app/api/clase/marca/route.ts",
  // ADR-099
  "app/api/clase/apunte/route.ts",
  "app/api/clase/material/route.ts",
  "app/api/clase/material/firma/route.ts",
  "app/api/clase/grabacion/route.ts",
  "app/api/clase/grabacion/firma/route.ts",
  "app/api/clase/grabacion/etiqueta/route.ts",
];
const MATERIAL = LEER("lib/server/servicios/clase-material.ts") + LEER("lib/server/repositorios/clase-material.ts");
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
    // ADR-099: apuntes, material y grabaciones no publican ningún evento.
    expect(codigo(MATERIAL)).not.toMatch(/publicar\(|nombre:\s*"/);
    const marcar = SERVICIO.slice(SERVICIO.indexOf("export async function marcar"));
    expect(codigo(marcar)).not.toContain("publicar(");
  });

  it("no hay reloj del cliente: el momento de la marca sale de `ahora()` del servidor", () => {
    expect(SERVICIO).toContain("segundosEntre(clase.iniciadaEn, d.ahora())");
    expect(LEER("app/api/clase/marca/route.ts")).not.toMatch(/cuerpo\??\.segundos/);
  });
});

describe("lo que se guarda de una clase · ADR-099", () => {
  it("no toca Evidence, progreso, Actions ni reportes de clase", () => {
    const c = codigo(MATERIAL);
    expect(c).not.toMatch(/from\("(evidence|progress_entry|topic_progress|action|commitment|class_event_record|class_session)"\)/);
    expect(c).not.toMatch(/"evidencia"/);
  });

  it("⛔ sin transcripción ni proveedor de audio", () => {
    const todo = codigo(MATERIAL + LEER("components/superficies/clase.tsx") + RUTAS.map(LEER).join("\n"));
    expect(todo).not.toMatch(/transcri|whisper|speech|openai|anthropic|deepgram/i);
  });

  it("⛔ la grabación no empieza sola: el micrófono se abre sólo desde `empezar`", () => {
    const sup = LEER("components/superficies/clase.tsx");
    expect(sup.match(/getUserMedia\(/g)).toHaveLength(1);
    const empezar = sup.slice(sup.indexOf("async function empezar"), sup.indexOf("async function subirGrabacion"));
    expect(empezar).toContain("getUserMedia(");
    // `empezar` sólo lo llaman el botón (con el aviso confirmado) y la confirmación.
    expect([...sup.matchAll(/void empezar\(\)/g)]).toHaveLength(2);
    expect(sup).toMatch(/if \(!avisoConfirmado\.current\) return setGrabadora\(\{ tipo: "AVISO" \}\)/);
  });

  it("la clave de un objeto la deriva el servidor; el cliente no la propone al firmar", () => {
    for (const r of ["app/api/clase/material/firma/route.ts", "app/api/clase/grabacion/firma/route.ts"]) {
      expect(codigo(LEER(r))).not.toMatch(/c\.clave/);
    }
  });

  it("el tamaño y el tipo guardados salen del storage, no del pedido", () => {
    const servicio = LEER("lib/server/servicios/clase-material.ts");
    expect(servicio).toMatch(/bytes: objeto\.bytes/);
    expect(servicio).toMatch(/mime: objeto\.mime/);
  });

  it("ya no hay autosave del texto único: `/api/clase` no tiene PATCH", () => {
    expect(codigo(LEER("app/api/clase/route.ts"))).not.toMatch(/export async function PATCH/);
  });
});
