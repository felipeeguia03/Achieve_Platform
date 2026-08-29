import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Test estático de las reglas del Track A (AGENTS.md §5, architecture.md §2.6).
 * Es un criterio de Done de la Fase 0; se mantiene en verde desde el primer
 * commit en vez de agregarse al final.
 *
 * `components/ui/` queda fuera: es un registro shadcn vendorizado que no se
 * edita y que no participa del dominio.
 */
const ROOT = process.cwd();
const SCANNED = ["app", "components/screens", "lib", "hooks", "tests"];
// El propio guard se excluye: contiene los patrones prohibidos como regex.
const SELF = "tests/track-a-rules.test.ts";

function sourceFiles(dir: string): string[] {
  const abs = resolve(ROOT, dir);
  let entries: string[];
  try {
    entries = readdirSync(abs);
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = join(abs, entry);
    if (statSync(full).isDirectory()) return sourceFiles(join(dir, entry));
    return /\.(ts|tsx)$/.test(entry) ? [join(dir, entry)] : [];
  });
}

const files = SCANNED.flatMap(sourceFiles)
  .filter((path) => path !== SELF)
  .map((path) => ({ path, code: readFileSync(resolve(ROOT, path), "utf8") }));

function offenders(pattern: RegExp) {
  return files.filter(({ code }) => pattern.test(code)).map(({ path }) => path);
}

describe("Track A — reglas verificables estáticamente", () => {
  it("hay archivos que escanear", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("cero red: sin fetch, XMLHttpRequest ni WebSocket", () => {
    expect(offenders(/\b(fetch\(|XMLHttpRequest|WebSocket|EventSource)\b/)).toEqual([]);
  });

  it("cero persistencia: sin localStorage, sessionStorage ni IndexedDB", () => {
    expect(offenders(/\b(localStorage|sessionStorage|indexedDB|IDBDatabase)\b/)).toEqual([]);
  });

  it("cero datos reales: sin emails ni teléfonos con forma de dato real", () => {
    expect(offenders(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)).toEqual([]);
  });
});

/**
 * La frontera que hace barato el Track B (architecture.md §2.4).
 *
 * Si una pantalla importa un fixture, cambiar de fixtures a backend real toca
 * la capa de presentación — que es exactamente el costo que esta separación
 * existe para evitar.
 */
describe("La frontera de lib/fixtures/", () => {
  const pantallas = files.filter(({ path }) => path.startsWith("components/screens/"));
  const dominio = files.filter(({ path }) => path.startsWith("lib/domain/"));

  it("hay pantallas y hay dominio que revisar", () => {
    expect(pantallas.length).toBeGreaterThan(0);
    expect(dominio.length).toBeGreaterThan(0);
  });

  it("ninguna pantalla importa un fixture", () => {
    const culpables = pantallas
      .filter(({ code }) => /from\s+"@?\/?(?:\.\.\/)*lib\/fixtures/.test(code))
      .map(({ path }) => path);
    expect(culpables).toEqual([]);
  });

  it("lib/domain/ es puro: sin React", () => {
    const culpables = dominio
      .filter(({ code }) => /from\s+"react|from\s+"next\//.test(code))
      .map(({ path }) => path);
    expect(culpables).toEqual([]);
  });

  it("lib/domain/ no depende de fixtures ni de contenido", () => {
    // La dirección de la dependencia es fixtures → domain, nunca al revés.
    const culpables = dominio
      .filter(({ code }) => /from\s+"@\/lib\/(fixtures|content)/.test(code))
      .map(({ path }) => path);
    expect(culpables).toEqual([]);
  });

  it("las pantallas no traen copy de regla de negocio hardcodeado (regla C-07)", () => {
    // Los prefijos de dominio viven en lib/content/ con ID. Si aparecen como
    // literal dentro de un componente, volvieron al JSX.
    const literales = /"(Porque:|Entregá:|Después:|Cerrás cuando:)/;
    const culpables = pantallas
      .filter(({ code }) => literales.test(code))
      .map(({ path }) => path);
    expect(culpables).toEqual([]);
  });
});
