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

  it("sin unidad y sin comprensión — las ausencias de ADR-098 que siguen", () => {
    expect(sql).not.toMatch(/topic_id|unit/);
    expect(sql).not.toMatch(/understanding|comprension|confidence/);
    // El audio de ADR-098 quedó afuera de esta migración; ADR-099 lo trae en la suya.
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

  it("la migración va después de todas las anteriores: no reescribe una aplicada", () => {
    const todas = readdirSync(resolve(RAIZ, "supabase/migrations")).sort();
    // ADR-099 agregó la suya después; ésta sigue siendo posterior a todo lo previo.
    expect(todas.indexOf("20261009000000_modo_clase.sql")).toBe(todas.indexOf("20261010000000_modo_clase_material.sql") - 1);
  });
});

describe("ADR-099 · lo que se guarda de una clase", () => {
  const SQL = sinComentarios(LEER("supabase/migrations/20261010000000_modo_clase_material.sql"));

  it("cuatro tablas, todas colgadas de la clase del estudiante, con RLS", () => {
    for (const t of ["class_note_entry", "class_attachment", "class_recording"]) {
      expect(SQL).toMatch(new RegExp(`CREATE TABLE ${t} \\([\\s\\S]*?REFERENCES student_class_session\\(id\\) ON DELETE CASCADE`));
      expect(SQL).toContain(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`);
    }
    expect(SQL).toContain("REFERENCES class_recording(id) ON DELETE CASCADE");
    expect(SQL).toContain("ALTER TABLE class_recording_tag ENABLE ROW LEVEL SECURITY");
  });

  it("los límites son los del dominio", async () => {
    const d = await import("@/lib/domain/sesion-de-clase");
    expect(SQL).toContain(`char_length(body) <= ${d.MAXIMO_DE_ENTRADA}`);
    expect(SQL).toContain(`size_bytes <= ${d.MAXIMO_DE_ARCHIVO}`);
    expect(SQL).toContain(`size_bytes <= ${d.MAXIMO_DE_AUDIO}`);
    expect(SQL).toContain(`BETWEEN 1 AND ${d.DURACION_MAXIMA_DE_GRABACION}`);
    expect(SQL).toContain(`char_length(label) <= ${d.MAXIMO_DE_ETIQUETA}`);
  });

  it("buckets privados, sin políticas para anon ni authenticated", () => {
    expect(SQL).toMatch(/\('clase-audio', 'clase-audio', false,/);
    expect(SQL).toMatch(/\('clase-material', 'clase-material', false,/);
    expect(SQL).not.toMatch(/CREATE POLICY/i);
  });

  it("⛔ sin transcripción, sin Evidence, sin eventos", () => {
    // Ninguna columna para transcripción o resumen (el COMMENT sí puede decir que no hay).
    expect(SQL).not.toMatch(/^\s+\w*(transcri|summary|resumen)\w*\s+(TEXT|JSONB|VARCHAR)/im);
    expect(SQL).not.toMatch(/(REFERENCES|INSERT INTO)\s+(evidence|product_event|class_session)\b/);
  });

  it("los apuntes viejos se copian a entradas, y `notes` queda sin escritor", () => {
    expect(SQL).toMatch(/INSERT INTO class_note_entry[\s\S]*FROM student_class_session/);
    const repo = LEER("lib/server/repositorios/clase.ts");
    expect(repo).not.toMatch(/notes/);
  });
});
