import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { escenarioIds, escenarios, proyectarHoy } from "@/lib/fixtures";
import { selectHeroLevel } from "@/lib/domain/precedence";

const spec = readFileSync(resolve(process.cwd(), "docs/product-spec-source.md"), "utf8");
const todos = escenarioIds.map((id) => escenarios[id]);

describe("Catálogo de escenarios", () => {
  it("la clave del catálogo coincide con el id del escenario", () => {
    for (const id of escenarioIds) expect(escenarios[id].id).toBe(id);
  });

  it("cada escenario declara propósito y qué contratos cubre", () => {
    for (const e of todos) {
      expect(e.proposito.length, e.id).toBeGreaterThan(0);
      expect(e.cubre.length, e.id).toBeGreaterThan(0);
    }
  });

  it("un id de origen `spec` existe realmente en product-spec-source.md", () => {
    // Conservar los IDs del spec solo sirve si son los del spec. Si alguien
    // inventa un FX- con forma canónica, este test lo caza.
    for (const e of todos.filter((x) => x.origen === "spec")) {
      expect(spec, `${e.id} no aparece en el spec`).toContain(e.id);
    }
  });

  it("un id de origen `local` lleva prefijo FX-LOCAL- y NO está en el spec", () => {
    for (const e of todos.filter((x) => x.origen === "local")) {
      expect(e.id.startsWith("FX-LOCAL-"), `${e.id} debe llevar prefijo FX-LOCAL-`).toBe(true);
      expect(spec).not.toContain(e.id);
    }
  });

  it("los contratos C01 y escenarios SC citados existen en el spec", () => {
    for (const e of todos) {
      for (const ref of e.cubre) {
        expect(spec, `${e.id} cita ${ref}, que no está en el spec`).toContain(ref);
      }
    }
  });
});

describe("Cero datos reales (AGENTS.md §1.3)", () => {
  const serializado = JSON.stringify(todos);

  it("sin emails ni teléfonos", () => {
    expect(serializado).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
    expect(serializado).not.toMatch(/\+?\d[\d\s().-]{8,}\d/);
  });

  it("sin URLs a sistemas reales", () => {
    expect(serializado).not.toMatch(/https?:\/\//i);
  });
});

describe("proyectarHoy — el nivel lo decide el dominio, no el fixture", () => {
  const conHoy = todos.filter((e) => e.hoy !== undefined);

  it("hay escenarios de UX01 que proyectar", () => {
    expect(conHoy.length).toBeGreaterThan(0);
  });

  it("el nivel proyectado es exactamente el que devuelve selectHeroLevel", () => {
    for (const e of conHoy) {
      const props = proyectarHoy(e);
      expect(props, e.id).not.toBeNull();
      const esperado = selectHeroLevel(e.hoy!.heroInput);
      expect(props!.hero.nivel, e.id).toBe(esperado.nivel);
      expect(props!.hero.variante, e.id).toBe(esperado.variante);
    }
  });

  it("cada escenario de UX01 trae su estado general resuelto", () => {
    for (const e of conHoy) {
      expect(proyectarHoy(e)!.estadoGeneral.length, e.id).toBeGreaterThan(0);
    }
  });

  it("un escenario sin vista de UX01 proyecta null, no un objeto vacío", () => {
    const sinHoy = todos.find((e) => e.hoy === undefined);
    expect(sinHoy).toBeDefined();
    expect(proyectarHoy(sinHoy!)).toBeNull();
  });

  it("los NUEVE niveles de UX01 están cubiertos por el catálogo", () => {
    // Cerrado en la Etapa 0.7, con ADR-017. Hasta la 0.6 eran cinco.
    const cubiertos = new Set(conHoy.map((e) => selectHeroLevel(e.hoy!.heroInput).nivel));
    expect(cubiertos.size).toBe(9);
  });

  it("las cinco variantes de CTA también", () => {
    const variantes = new Set(
      conHoy.map((e) => selectHeroLevel(e.hoy!.heroInput).variante).filter((v) => v !== null),
    );
    expect(variantes).toEqual(
      new Set([
        "COMMITMENT_PROXIMO",
        "COMMITMENT_STARTABLE",
        "RESCATE_STARTABLE",
        "EVIDENCIA_ENVIADA",
        "EVIDENCIA_VALIDADA",
      ]),
    );
  });
});

describe("Omitir, no inventar (AGENTS.md §2.7)", () => {
  it("una ausencia se escribe como null, nunca como placeholder de texto", () => {
    const prohibidos = ["N/A", "n/a", "TBD", "—", "...", "undefined", "null", "-"];
    for (const e of todos) {
      for (const valor of valoresDeTexto(e)) {
        expect(prohibidos, `${e.id} usa un placeholder: "${valor}"`).not.toContain(valor.trim());
      }
    }
  });

  it("ningún string está vacío: o hay dato, o hay null", () => {
    for (const e of todos) {
      for (const valor of valoresDeTexto(e)) {
        expect(valor.trim().length, `${e.id} tiene un string vacío`).toBeGreaterThan(0);
      }
    }
  });
});

function valoresDeTexto(valor: unknown, acumulado: string[] = []): string[] {
  if (typeof valor === "string") acumulado.push(valor);
  else if (Array.isArray(valor)) valor.forEach((v) => valoresDeTexto(v, acumulado));
  else if (valor !== null && typeof valor === "object") {
    Object.values(valor).forEach((v) => valoresDeTexto(v, acumulado));
  }
  return acumulado;
}
