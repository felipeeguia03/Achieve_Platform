import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * El aula del bloque horario — [ADR-094](../docs/decisions.md#adr-094).
 *
 * El aula **no tiene procedencia propia**: hereda la del bloque. Por eso la
 * única escritura que existe —el simulador— sólo toca bloques `inference`, y
 * la pantalla marca como estimado todo bloque `inference`. Si alguna de las dos
 * cosas se afloja, un aula inventada se lee como dato de la facultad.
 */

const LEER = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("la columna", () => {
  const MIGRACION = LEER("supabase/migrations/20261006000000_aula_del_bloque.sql");

  it("es nullable: NULL es «no se sabe dónde», no «sin aula»", () => {
    expect(MIGRACION).toMatch(/ADD COLUMN IF NOT EXISTS room TEXT;/);
    expect(MIGRACION).not.toMatch(/room TEXT NOT NULL|room TEXT DEFAULT/);
  });

  it("no agrega una procedencia paralela: es la del bloque", () => {
    expect(MIGRACION).not.toMatch(/room_source|room_verification/);
  });
});

describe("el simulador", () => {
  const SCRIPT = LEER("scripts/simular-aulas.mjs");

  it("sólo escribe sobre bloques `inference`, y la regla vive en el WHERE", () => {
    expect(SCRIPT).toContain("const SOLO_SIMULADOS = `b.source_type = 'inference'`;");
    expect(SCRIPT).toMatch(/update class_schedule_block b set room = \$\{AULA\} where \$\{CUALES\}/);
    expect(SCRIPT).toContain("const CUALES = REHACER ? SOLO_SIMULADOS : `${SOLO_SIMULADOS} AND b.room IS NULL`;");
  });

  it("no inserta, no borra y no toca la procedencia", () => {
    expect(SCRIPT).not.toMatch(/insert into|delete from|set source_type|verification_status\s*=/i);
  });

  it("es un simulacro salvo que se pida `--aplicar`", () => {
    expect(SCRIPT).toContain('const APLICAR = process.argv.includes("--aplicar");');
  });
});

describe("la lectura", () => {
  it("marca como estimado todo bloque `inference`", () => {
    expect(LEER("lib/server/repositorios/tablero.ts")).toContain('estimada: b.source_type === "inference"');
  });
});
