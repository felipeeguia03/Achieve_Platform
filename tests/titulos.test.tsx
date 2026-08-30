import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TituloDePanel, AccionDeObjeto } from "@/components/screens/design-system";
import { SUBCOPY_PENDIENTE } from "@/lib/content/es-AR";

/**
 * Etapa A2.4 — `D-01`, `D-02` y `D-07` de `design-system-capturas.md` §14.2.
 */

const RAIZ = process.cwd();

function pantallas(): string[] {
  const dir = "components/screens";
  return readdirSync(resolve(RAIZ, dir))
    .filter((f) => f.endsWith(".tsx") && f !== "design-system.tsx")
    .map((f) => join(dir, f));
}

// ── D-01 · toda superficie tiene título de documento ─────────────────────────

describe("D-01 · cada superficie tiene un `h1`, y uno solo", () => {
  /**
   * Antes de la A2.4 ninguna de las nueve tenía `<h1>` y cuatro no tenían
   * encabezado alguno: para un lector de pantalla, la pantalla no se llamaba
   * nada. El guard es estático porque la alternativa —renderizar las nueve— ya
   * la cubren `screens-render`, `ux07`, `ux08` y `ux09`.
   */
  it("las nueve superficies dibujan su cabecera con `TituloDePanel`", () => {
    const sinCabecera = pantallas().filter(
      (f) => !/<TituloDePanel\b/.test(readFileSync(resolve(RAIZ, f), "utf8")),
    );
    expect(sinCabecera).toEqual([]);
  });

  it("ninguna superficie se dibuja su propio `h1` por fuera de la primitiva", () => {
    const propios = pantallas().filter((f) => /<h1\b/.test(readFileSync(resolve(RAIZ, f), "utf8")));
    expect(propios).toEqual([]);
  });

  it("con título, hay exactamente un `h1` y es el título", () => {
    const { container } = render(<TituloDePanel eyebrow="Programación" titulo="Cursado" />);
    const h1 = container.querySelectorAll("h1");
    expect(h1).toHaveLength(1);
    expect(h1[0].textContent).toBe("Cursado");
  });

  /**
   * Cuatro superficies se identifican hoy sólo por su eyebrow. Promoverlo les
   * da título de documento sin agregar una palabra; ponerles un título nuevo
   * sería escribir copy de dominio.
   */
  it("sin título, el eyebrow se promueve a `h1` — y no se inventa texto", () => {
    const { container } = render(<TituloDePanel eyebrow="← Modo Examen · Parcial 1" />);
    const h1 = container.querySelectorAll("h1");
    expect(h1).toHaveLength(1);
    expect(h1[0].textContent).toBe("← Modo Examen · Parcial 1");
  });
});

// ── D-02 · la subcopy se omite mientras no esté escrita ──────────────────────

describe("D-02 · la subcopy no se inventa", () => {
  it("`null` no dibuja subcopy: omitir, no inventar", () => {
    const { container } = render(<TituloDePanel eyebrow="X" titulo="Y" subcopy={null} />);
    expect(container.querySelectorAll("p.subcopy")).toHaveLength(0);
  });

  it("escrita, se dibuja bajo el título", () => {
    const { container } = render(<TituloDePanel eyebrow="X" titulo="Y" subcopy="Qué es y por qué importa." />);
    expect(container.textContent).toContain("Qué es y por qué importa.");
  });

  /**
   * No falla: **informa**. Mientras haya superficies sin subcopy, esta lista
   * las nombra en cada corrida, para que la deuda de contenido no se olvide por
   * no verse. Cuando se escriban todas, el `console.info` desaparece solo.
   */
  it("informa qué superficies siguen sin subcopy", () => {
    const pendientes = Object.entries(SUBCOPY_PENDIENTE)
      .filter(([, v]) => v === null)
      .map(([k]) => k);
    if (pendientes.length > 0) {
      console.info(`D-02 · subcopy pendiente en: ${pendientes.join(", ")} — la escribe una persona.`);
    }
    expect(Object.keys(SUBCOPY_PENDIENTE)).toHaveLength(9);
  });
});

// ── D-07 · las acciones del objeto no compiten con la CTA primaria ───────────

describe("D-07 · acciones secundarias arriba a la derecha", () => {
  /**
   * El defecto que introduje al mover `CTA-009` arriba: la pill quedó en la
   * cabecera **y** el botón viejo siguió al pie. La misma acción dos veces en
   * una pantalla rompe `C-02` —un concepto, un lugar— y agrega ruido en la
   * única superficie donde el estudiante decide. Lo vi en una captura de
   * pantalla, no en un test; ahora hay test.
   */
  it("ninguna superficie ofrece la misma acción arriba y al pie", () => {
    const duplicadas = pantallas().flatMap((f) => {
      const src = readFileSync(resolve(RAIZ, f), "utf8");
      const arriba = [...src.matchAll(/<AccionDeObjeto[^>]*>\{?([^<}]+)\}?<\/AccionDeObjeto>/g)].map((m) => m[1].trim());
      const abajo = [...src.matchAll(/<CTASecundaria[^>]*>\{?([^<}]+)\}?<\/CTASecundaria>/g)].map((m) => m[1].trim());
      return arriba.filter((a) => abajo.includes(a)).map((a) => `${f}: ${a}`);
    });
    expect(duplicadas).toEqual([]);
  });

  it("`AccionDeObjeto` no es una CTA primaria", () => {
    const { container } = render(<AccionDeObjeto>Ver progreso</AccionDeObjeto>);
    const boton = container.querySelector("button") as HTMLElement;
    expect(boton.getAttribute("data-cta-primaria")).toBeNull();
    // Ancho de contenido, no ancho completo: §11.9.3.
    expect(boton.className).not.toContain("w-full");
  });
});
