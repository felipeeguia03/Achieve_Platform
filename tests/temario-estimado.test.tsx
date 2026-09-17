import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { proyectarMateria, type EstadoDeMateria } from "@/lib/server/servicios/proyeccion-materia";

/**
 * Fase B6.24 · [ADR-086](../docs/decisions.md#adr-086) — contenido estimado.
 *
 * De las 51 materias del Plan 2016, **26 tienen un temario que inventó el
 * sistema** y las otras 25 tienen unidades reales con fechas y pesos que también
 * puso el sistema. Lo que se prueba acá no es que el contenido sea bueno —no lo
 * es, es estimado— sino que **la pantalla nunca lo hace pasar por declarado**.
 *
 * `A-01` del manual de diseño: *"dato roto presentado como transparencia"*.
 */
const RAIZ = process.cwd();

/** El SQL sin sus comentarios: lo que la base ejecuta, no lo que explica. */
const sinComentarios = (sql: string) => sql.replace(/^\s*--.*$/gm, "");

function migraciones(): string {
  const dir = resolve(RAIZ, "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(resolve(dir, f), "utf8"))
    .join("\n");
}

/** La **última** definición de cada función: una migración aplicada no se edita. */
function funcionesVigentes(): Map<string, string> {
  const vigentes = new Map<string, string>();
  for (const fn of migraciones().split(/CREATE OR REPLACE FUNCTION|CREATE FUNCTION/).slice(1)) {
    vigentes.set(fn.trim().split(/[(\s]/)[0], fn);
  }
  return vigentes;
}

const base: EstadoDeMateria = {
  instante: "2026-09-09T15:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  cursadaId: "ce-1",
  evidenciasEnviadas: 0,
  materia: "Sistemas Operativos",
  examen: null,
  accion: null,
  compromiso: null,
  rescatePendiente: false,
  evidencia: "NONE",
  contextoIncompleto: false,
  contenido: null,
  ultimoAvanceEn: null,
  unidades: [
    {
      id: "u1",
      codigo: "U1",
      nombre: "Procesos e hilos",
      ultimoAvanceEn: null,
      primeraClaseEn: "2026-08-05",
      ultimaClaseEn: "2026-08-05",
      evaluaEn: "2026-09-20",
      dominio: null,
      practica: null,
      recorrido: null,
      peso: 3,
      evidencia: "sin_evidencia",
    },
  ],
  clases: [],
  cargaDeclarada: null,
  dimensiones: null,
  horario: [],
  actividadReciente: [],
};

describe("§1 · la pantalla dice de dónde salió el contenido", () => {
  it("un temario inventado se avisa, y nombra a quién lo puso", () => {
    const p = proyectarMateria({ ...base, contenido: "estimado" });
    expect(p.aviso).toBeTruthy();
    expect(p.aviso).toMatch(/Achieve/);
    expect(p.aviso).toMatch(/estim/i);
  });

  it("unidades reales con fechas puestas por el sistema dicen otra cosa", () => {
    const real = proyectarMateria({ ...base, contenido: "calendario_estimado" });
    const inventado = proyectarMateria({ ...base, contenido: "estimado" });
    expect(real.aviso).toBeTruthy();
    // ⚠️ **Los dos avisos son distintos, y tienen que serlo.** Decirle lo mismo
    // a quien tiene el programa oficial de su cátedra y a quien está mirando una
    // lista inventada borra la única diferencia que importa.
    expect(real.aviso).not.toBe(inventado.aviso);
    expect(real.aviso).toMatch(/programa oficial/i);
  });

  /**
   * Sin nada que advertir sobre la procedencia, el aviso **vuelve a lo que
   * decía antes** de ADR-086 — acá, que no hay con qué resumir las dimensiones.
   * Lo que no puede pasar es que hable de estimaciones que no hubo.
   */
  it("sin nada que advertir, no aparece ningún aviso de estimación", () => {
    const p = proyectarMateria({ ...base, contenido: null });
    // `?? ""` porque **las dos formas son correctas**: sin aviso, o con el que
    // la pantalla ya daba por otro motivo. Lo que se prueba es que no habla de
    // estimaciones que no hubo.
    expect(p.aviso ?? "").not.toMatch(/estim/i);
    expect(p.aviso ?? "").not.toMatch(/Achieve/);
  });

  /**
   * ⚠️ **`null` no es «verificado».** Es *"ninguna fila dice `inference`"*, que
   * es mucho menos. Si algún día la pantalla dijera «verificado por la cátedra»
   * a partir de esta ausencia, estaría elevando la procedencia desde la UI.
   */
  it("la ausencia de aviso no afirma que la cátedra lo verificó", () => {
    const p = proyectarMateria({ ...base, contenido: null });
    expect(JSON.stringify(p)).not.toMatch(/verificad|corrobora|oficial/i);
  });
});

describe("§2 · el aviso no apaga la materia", () => {
  /**
   * El owner pidió que el contenido estimado **se tome como válido**: se puede
   * planificar sobre él. Lo que cambia es que se dice de dónde viene, no que la
   * materia quede inutilizable.
   */
  it("una materia estimada conserva su Gantt y sus temas", () => {
    const p = proyectarMateria({ ...base, contenido: "estimado" });
    expect(p.gantt).not.toBeNull();
    expect(p.gantt!.unidades).toHaveLength(1);
    expect(p.gantt!.unidades[0].desde).not.toBeNull();
  });

  it("y el estado general no pasa a CONTEXTO_INCOMPLETO por ser estimada", () => {
    const p = proyectarMateria({ ...base, contenido: "estimado" });
    expect(p.estado).not.toBe("CONTEXTO_INCOMPLETO");
  });
});

describe("§3 · lo que la base garantiza", () => {
  it("`estado_de_materia` deriva el origen de filas, no de una suposición", () => {
    const fn = sinComentarios(funcionesVigentes().get("public.estado_de_materia") ?? "");
    expect(fn).toContain("'contenido'");
    // Los tres valores salen de mirar `source_type`; no hay rama que adivine.
    expect(fn).toContain("'estimado'");
    expect(fn).toContain("'calendario_estimado'");
    expect(fn).toMatch(/source_type = 'inference'/);
  });

  /**
   * ⚠️ **`I9` sigue intacto.** Marcar contenido como estimado es una afirmación
   * sobre `source_type`, y **no toca** `verification_status`: la única escritura
   * de ese campo sigue siendo `corroborar_procedencia()`.
   */
  it("la clave nueva no escribe ni lee verification_status", () => {
    const fn = sinComentarios(funcionesVigentes().get("public.estado_de_materia") ?? "");
    const bloque = fn.slice(fn.indexOf("'contenido'"), fn.indexOf("'evidenciasEnviadas'"));
    expect(bloque).not.toMatch(/verification_status/);
  });

  /**
   * ⚠️ **El generador no puede quedarse sin material.** El ADE chequea el
   * `resource` **después** de rankear y **sólo sobre el ganador**: una unidad sin
   * material que gane el orden devuelve `CONTEXTO_INCOMPLETO` y la materia no se
   * puede recorrer. Con el peso en el ranking cambia quién gana, así que esto
   * dejó de ser una casualidad afortunada.
   */
  it("el generador crea un recurso por unidad", () => {
    const script = readFileSync(resolve(RAIZ, "scripts/simular-temarios.mjs"), "utf8");
    expect(script).toMatch(/insert into resource/i);
    expect(script).toMatch(/from topic t where t\.offering_id/i);
  });

  /**
   * ⚠️ **A una materia con temario real no se le pisan los recursos.** Los suyos
   * dicen `institution`; sobrescribirlos con `inference` la haría pasar por
   * completamente inventada y el estudiante perdería la distinción.
   */
  it("y no toca los de una materia que tiene programa oficial", () => {
    const script = readFileSync(resolve(RAIZ, "scripts/simular-temarios.mjs"), "utf8");
    expect(script).toMatch(/if \(!m\.tieneReales\)/);
  });

  /**
   * ⚠️ **Nada de lo generado se declara `institution`.** Ese `source_type`
   * significa *"lo afirma la institución"*, y la institución no afirmó nada de
   * esto. El guard mira el llamado a la ingesta, no los comentarios.
   */
  it("el generador ingiere como `inference`, nunca como cátedra", () => {
    const script = readFileSync(resolve(RAIZ, "scripts/simular-temarios.mjs"), "utf8");
    const llamada = script.slice(script.indexOf("ingerir_materia("));
    const argumentos = llamada.slice(0, llamada.indexOf(");"));
    expect(argumentos).toContain("'inference'");
    expect(argumentos).not.toContain("'institution'");
    expect(argumentos).not.toContain("'instructor'");
  });
});
