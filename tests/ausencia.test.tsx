import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Ausencia, Fila } from "@/components/screens/design-system";

/**
 * Etapa A2.3 — la primitiva `Ausencia` y el dock que no se construye.
 *
 * Dos reglas distintas conviven acá porque las dos salen del mismo hallazgo
 * ([ADR-019](../docs/decisions.md#adr-019)): al abrir las capturas para
 * especificar el dock, la fuente dijo que no, y la etapa se reasignó a la
 * primitiva que sí faltaba.
 */

const ROOT = process.cwd();
const SELF = "tests/ausencia.test.tsx";

function archivosFuente(dir: string): string[] {
  const abs = resolve(ROOT, dir);
  let entradas: string[];
  try {
    entradas = readdirSync(abs);
  } catch {
    return [];
  }
  return entradas.flatMap((entrada) => {
    const full = join(abs, entrada);
    if (statSync(full).isDirectory()) return archivosFuente(join(dir, entrada));
    return /\.(ts|tsx)$/.test(entrada) ? [join(dir, entrada)] : [];
  });
}

// ── P-09: los tratamientos de ausencia se ven distinto ───────────────────────

describe("P-09 · la ausencia se tipa", () => {
  it("sin-asignar y cero real se ven distinto", () => {
    const { container } = render(
      <>
        <Ausencia tipo="SIN_ASIGNAR">no evaluado</Ausencia>
        <Ausencia tipo="CERO_REAL">0</Ausencia>
      </>,
    );
    const sinAsignar = container.querySelector('[data-ausencia="SIN_ASIGNAR"]') as HTMLElement;
    const cero = container.querySelector('[data-ausencia="CERO_REAL"]') as HTMLElement;

    expect(sinAsignar).not.toBeNull();
    expect(cero).not.toBeNull();
    expect(sinAsignar.style.fontStyle).toBe("italic");
    expect(cero.style.fontStyle).not.toBe("italic");
  });

  /**
   * La prueba que `design-system.md` §7 fija: imprimir en blanco y negro. Si la
   * única diferencia fuera el color, `P-06` se rompe y la distinción se pierde
   * en una fotocopia.
   */
  it("la distinción sobrevive sin color", () => {
    const { container } = render(
      <>
        <Ausencia tipo="SIN_ASIGNAR">no evaluado</Ausencia>
        <Ausencia tipo="CERO_REAL">0</Ausencia>
      </>,
    );
    const marcas = [...container.querySelectorAll("[data-ausencia]")].map((el) => {
      const { fontStyle, fontVariantNumeric } = (el as HTMLElement).style;
      return `${fontStyle}|${fontVariantNumeric}`;
    });
    expect(new Set(marcas).size).toBe(marcas.length);
  });

  it("un cero real no se atenúa: es un valor, no una ausencia", () => {
    const { container } = render(<Ausencia tipo="CERO_REAL">0</Ausencia>);
    const cero = container.querySelector('[data-ausencia="CERO_REAL"]') as HTMLElement;
    expect(cero.style.color).toContain("--foreground");
    expect(cero.style.color).not.toContain("--muted-foreground");
  });
});

// ── Un dato adverso no es una ausencia ───────────────────────────────────────

describe("un dato presente y adverso no se dibuja como ausencia", () => {
  it("`tono` produce chip, no itálica atenuada", () => {
    const { container } = render(<Fila label="Estado" value="incumplido" tono="urgencia" />);
    expect(container.querySelector("[data-ausencia]")).toBeNull();
    expect(screen.getByText("incumplido")).toBeTruthy();
  });

  /**
   * El caso concreto que motivó la corrección: el compromiso original de una
   * renegociación. Un `Commitment` `MISSED` nunca se edita para parecer
   * cumplido, y pintarlo con el gris del vacío es la versión visual de eso.
   */
  it("ningún fixture marca como ausencia una palabra de estado adverso", () => {
    const ADVERSAS = /incumplid|vencid|necesita atención|falta /i;
    // Se lee la fuente y no el objeto: así entra todo fixture nuevo sin que
    // haya que acordarse de sumarlo a una lista de imports.
    const culpables = archivosFuente("lib/fixtures")
      .flatMap((f) => readFileSync(resolve(ROOT, f), "utf8").split("\n").map((l, i) => [f, i + 1, l] as const))
      .filter(([, , linea]) => /ausencia:\s*"/.test(linea) && ADVERSAS.test(linea))
      .map(([f, n, linea]) => `${f}:${n} ${linea.trim()}`);
    expect(culpables).toEqual([]);
  });

  /**
   * Este test existe porque los unitarios **no alcanzaron**. `Fila` dibujaba el
   * chip correctamente y `FilaDato` llevaba el `tono`, pero seis de siete
   * llamadas no lo pasaban: *"incumplido"* volvía a salir como texto común.
   * Sólo se vio abriendo el navegador.
   *
   * La regla: si una llamada proyecta `ausencia`, proyecta también `tono`. Son
   * las dos mitades de "qué clase de cosa es este valor", y pasar una sola deja
   * la otra en silencio.
   */
  it("toda llamada a `Fila` que pasa `ausencia` pasa también `tono`", () => {
    const culpables = archivosFuente("components/screens")
      .flatMap((f) => {
        const src = readFileSync(resolve(ROOT, f), "utf8");
        return [...src.matchAll(/<Fila\b[^>]*?\/>/g)].map((m) => [f, m[0]] as const);
      })
      .filter(([, tag]) => /ausencia=/.test(tag) && !/tono=/.test(tag))
      .map(([f, tag]) => `${f}: ${tag.replace(/\s+/g, " ")}`);
    expect(culpables).toEqual([]);
  });
});

// ── ADR-019: el dock no se construye ─────────────────────────────────────────

describe("ADR-019 · el dock inferior no se construye", () => {
  /**
   * La captura 07 lo desaconseja para flujos lineales, y `A-07` —uno de los
   * nueve anti-patrones— es un defecto suyo. `design-system-capturas.md` lo
   * descarta en §7.4, §10.1 y §11.3. Sin este test, la regla vive sólo en un
   * markdown y vuelve en dos meses.
   */
  it("no hay componente de dock ni de multiventana en el shell", () => {
    const fuentes = ["app", "components/screens", "components/shell", "lib"].flatMap(archivosFuente);
    const culpables = fuentes
      .filter((f) => f !== SELF)
      .filter((f) => /dock|multiventana|ficha-abierta|ventana-interna/i.test(f));
    expect(culpables).toEqual([]);
  });

  it("`design-system-capturas.md` sigue descartándolo, y no en un solo lugar", () => {
    const doc = readFileSync(resolve(ROOT, "docs/design-system-capturas.md"), "utf8");
    const descartes = doc.split("\n").filter((l) => /dock/i.test(l) && /no aplica|no se copia|requiere multiventana/i.test(l));
    expect(descartes.length).toBeGreaterThanOrEqual(2);
  });

  /**
   * El breadcrumb es la respuesta de Achieve a "no perder el lugar". Si
   * desapareciera, el argumento de ADR-019 se quedaría sin sustento y habría
   * que reabrir la decisión en vez de descubrirlo por una queja de usuario.
   */
  it("el breadcrumb —lo que reemplaza al dock— sigue existiendo", () => {
    const topbar = readFileSync(resolve(ROOT, "components/shell/barra-superior.tsx"), "utf8");
    expect(topbar).toMatch(/breadcrumb|miga/i);
  });
});
