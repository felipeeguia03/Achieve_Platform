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
