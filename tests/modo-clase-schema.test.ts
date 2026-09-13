import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { TIPOS_DE_MARCA, MAXIMO_DE_APUNTES, MAXIMO_DE_TEXTO_DE_MARCA } from "@/lib/domain/sesion-de-clase";

/**
 * Modo Clase, corte 2 — el schema · [ADR-098](../docs/decisions.md#adr-098).
 *
 * Lo que la base garantiza lo prueba `scripts/db-aislamiento.sh` contra
 * Postgres. Esto protege **las ausencias**, que ningún `INSERT` puede probar:
 * lo que la migración decidió no tener.
 */

const RAIZ = process.cwd();
const LEER = (p: string) => readFileSync(resolve(RAIZ, p), "utf8");
const sinComentarios = (sql: string) => sql.replace(/^\s*--.*$/gm, "");

const MIGRACION = sinComentarios(LEER("supabase/migrations/20261009000000_modo_clase.sql"));
const tabla = (nombre: string) => {
  const inicio = MIGRACION.indexOf(`CREATE TABLE ${nombre} (`);
  return MIGRACION.slice(inicio, MIGRACION.indexOf(");\n", inicio));
};

describe("student_class_session", () => {
  const sql = tabla("student_class_session");

  it("es una tabla nueva: no escribe en `class_session`, la clase dictada", () => {
    expect(MIGRACION).not.toMatch(/(INSERT INTO|ALTER TABLE)\s+class_session\b/);
  });

  it("cuelga de una cursada del mismo estudiante", () => {
    expect(sql).toContain("REFERENCES course_enrollment (id, student_id)");
  });

  it("sin unidad, sin comprensión y sin audio — las tres ausencias de ADR-098", () => {
    expect(sql).not.toMatch(/topic_id|unit/);
    expect(sql).not.toMatch(/understanding|comprension|confidence/);
    expect(MIGRACION).not.toMatch(/audio|storage_ref|transcript/i);
  });

  it("sólo dos estados, y una sola activa por estudiante", () => {
    expect(sql).toContain("CHECK (status IN ('ACTIVE','ENDED'))");
    expect(MIGRACION).toContain("ON student_class_session (student_id) WHERE status = 'ACTIVE'");
  });

  it("el límite de apuntes es el mismo que el del dominio", () => {
    expect(sql).toContain(`char_length(notes) <= ${MAXIMO_DE_APUNTES}`);
  });
});

describe("class_marker", () => {
  const sql = tabla("class_marker");

  it("sus tipos son exactamente los del dominio", () => {
    const enSql = sql.match(/marker_type IN \(([^)]+)\)/)?.[1].split(",").map((s) => s.trim().replace(/'/g, ""));
    expect(enSql).toEqual([...TIPOS_DE_MARCA]);
  });

  it("es idempotente por clave dentro de la clase", () => {
    expect(sql).toContain("UNIQUE (student_class_session_id, idempotency_key)");
  });

  it("el límite del texto es el mismo que el del dominio", () => {
    expect(sql).toContain(`char_length(detail) <= ${MAXIMO_DE_TEXTO_DE_MARCA}`);
  });

  it("no es un reporte de clase: no toca `class_event_record`", () => {
    expect(MIGRACION).not.toMatch(/(REFERENCES|INSERT INTO|ALTER TABLE)\s+class_event_record\b/);
  });
});

describe("las reglas de siempre", () => {
  it("las dos tablas tienen RLS", () => {
    expect(MIGRACION).toContain("ALTER TABLE student_class_session ENABLE ROW LEVEL SECURITY;");
    expect(MIGRACION).toContain("ALTER TABLE class_marker ENABLE ROW LEVEL SECURITY;");
  });

  it("y entran a `limpiar_mundo` antes que la cursada que referencian", () => {
    const script = LEER("scripts/db-aislamiento.sh");
    const marca = script.indexOf("delete from class_marker;");
    const clase = script.indexOf("delete from student_class_session;");
    const cursada = script.indexOf("delete from course_enrollment;");
    expect(marca).toBeGreaterThan(-1);
    expect(marca).toBeLessThan(clase);
    expect(clase).toBeLessThan(cursada);
  });

  it("la migración es la última: no reescribe una aplicada", () => {
    const todas = readdirSync(resolve(RAIZ, "supabase/migrations")).sort();
    expect(todas.indexOf("20261009000000_modo_clase.sql")).toBe(todas.length - 1);
  });
});
