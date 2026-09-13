import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { menu } from "@/lib/navigation/menu";
import { colorDeMateria } from "@/lib/domain/color-de-materia";
import { iniciales } from "@/components/shell/cuenta";

/**
 * **El modo noche, medido** — [ADR-097](../docs/decisions.md#adr-097).
 *
 * `design-system-capturas.md` §12.4 decía que no habría modo oscuro *"mientras
 * no exista una segunda tabla de contrastes medida, no estimada"*. Ésta es la
 * tabla: lee los tokens **de `app/globals.css`**, no una copia, y calcula el
 * contraste WCAG de cada par en los dos temas. Si alguien toca un valor y el par
 * baja de su mínimo, rompe acá.
 */
const ROOT = process.cwd();
const LEER = (p: string) => readFileSync(resolve(ROOT, p), "utf8");
const CSS = LEER("app/globals.css");

function bloque(selector: string): Record<string, string> {
  const inicio = CSS.indexOf(`${selector} {`);
  expect(inicio, selector).toBeGreaterThanOrEqual(0);
  const cuerpo = CSS.slice(inicio, CSS.indexOf("\n}", inicio));
  const tokens: Record<string, string> = {};
  for (const m of cuerpo.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)) tokens[m[1]!] = m[2]!;
  return tokens;
}

const CLARO = bloque(":root");
// El oscuro sólo redefine: lo que no redefine hereda del claro.
const OSCURO = { ...CLARO, ...bloque(':root[data-tema="oscuro"]') };

function luminancia(hex: string): number {
  const canal = (i: number) => {
    const c = Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
}

function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

/** [texto, fondo, mínimo]. 4.5 es texto normal (AA); 3 es marca gráfica. */
const PARES: ReadonlyArray<readonly [string, string, number]> = [
  ["foreground", "background", 4.5],
  ["foreground", "card", 4.5],
  ["muted-foreground", "card", 4.5],
  ["muted-foreground", "background", 4.5],
  ["muted-foreground", "muted", 4.5],
  ["primary-foreground", "primary", 4.5],
  ["exito-texto", "card", 4.5],
  ["urgencia-texto", "card", 4.5],
  ["urgencia-texto", "background", 4.5],
  ["exito-tinte-texto", "exito-tinte", 4.5],
  ["urgencia-tinte-texto", "urgencia-tinte", 4.5],
  ["humano-tinte-texto", "humano-tinte", 4.5],
  ["humano-texto", "card", 4.5],
  ...[1, 2, 3, 4, 5, 6].flatMap(
    (n) =>
      [
        [`materia-${n}`, "card", 3],
        [`materia-${n}`, "background", 3],
      ] as const,
  ),
];

describe.each([
  ["claro", CLARO],
  ["oscuro", OSCURO],
] as const)("la tabla de contrastes del tema %s", (_nombre, tema) => {
  it.each(PARES)("%s sobre %s llega a %d:1", (texto, fondo, minimo) => {
    expect(tema[texto], `falta --${texto}`).toBeDefined();
    expect(tema[fondo], `falta --${fondo}`).toBeDefined();
    expect(contraste(tema[texto]!, tema[fondo]!)).toBeGreaterThanOrEqual(minimo);
  });
});

describe("el tema oscuro es un bloque de tokens, no estilos sueltos", () => {
  it("redefine las superficies, la acción primaria invertida y los tres semánticos", () => {
    const oscuro = bloque(':root[data-tema="oscuro"]');
    for (const token of ["background", "card", "foreground", "primary", "primary-foreground", "exito-texto", "urgencia-texto", "humano"]) {
      expect(oscuro[token], token).toBeDefined();
    }
    // La acción primaria se invierte: clara sobre oscuro, como en las capturas.
    expect(luminancia(oscuro.primary!)).toBeGreaterThan(luminancia(oscuro.background!));
  });

  it("los colores de materia son tokens, así cambian con el tema", () => {
    expect(colorDeMateria("ce-1")).toMatch(/^var\(--materia-[1-6]\)$/);
  });

  it("el cromo translúcido no usa un literal que sólo sirve en claro", () => {
    expect(CSS).toMatch(/\.chrome-translucent \{\n\s*background: var\(--chrome\);/);
  });
});

describe("el tema se elige antes de pintar", () => {
  it("el layout corre el script en el <head>, antes del bundle", () => {
    const layout = LEER("app/layout.tsx");
    expect(layout).toContain("SCRIPT_DE_TEMA");
    expect(layout).toContain("suppressHydrationWarning");
  });

  it("el script sigue al sistema cuando no hay elección, y la elección gana", async () => {
    const { SCRIPT_DE_TEMA } = await import("@/lib/client/tema");
    const correr = (guardado: string | null, sistemaOscuro: boolean) => {
      const atributos: Record<string, string> = {};
      const entorno = {
        localStorage: { getItem: () => guardado },
        window: { matchMedia: () => ({ matches: sistemaOscuro }) },
        document: { documentElement: { setAttribute: (k: string, v: string) => (atributos[k] = v) } },
      };
      new Function("localStorage", "window", "document", SCRIPT_DE_TEMA)(
        entorno.localStorage,
        entorno.window,
        entorno.document,
      );
      return atributos["data-tema"] ?? "claro";
    };
    expect(correr(null, true)).toBe("oscuro");
    expect(correr(null, false)).toBe("claro");
    expect(correr("claro", true)).toBe("claro");
    expect(correr("oscuro", false)).toBe("oscuro");
  });
});

describe("el menú lateral y la cuenta", () => {
  /** El defecto que se vio en la captura: Materias y Formación con el sol de Hoy. */
  it("cada ítem del menú tiene su propio ícono", () => {
    const nav = LEER("components/shell/navegacion-lateral.tsx");
    for (const item of menu) {
      expect(nav, item.nodo).toMatch(new RegExp(`\\b${item.nodo}: [A-Z]\\w+`));
    }
  });

  it("salir se mudó al menú del avatar, y el pie del menú lateral es el tema", () => {
    const nav = LEER("components/shell/navegacion-lateral.tsx");
    expect(nav).not.toContain("cerrarSesion");
    expect(nav).toContain("ConmutadorDeTema");
    expect(LEER("components/shell/cuenta.tsx")).toContain("cerrarSesion");
  });

  /**
   * ⚠️ **Sin «Crear organización» ni «Administrar cuenta».** El estudiante tiene
   * una sola institución, que decide el padrón, y no hay cuenta que administrar
   * desde acá (ADR-039). Tampoco hay campanita: no existe nada que notificar.
   */
  it("la cuenta no promete lo que Achieve no tiene", () => {
    const cuenta = LEER("components/shell/cuenta.tsx");
    // Se mira lo que se dibuja y lo que se importa, no los comentarios: el de
    // arriba del componente explica justamente por qué no están.
    expect(cuenta).not.toMatch(/>\s*(Crear organizaci|Administrar cuenta)/);
    expect(cuenta).not.toMatch(/import \{[^}]*\bBell\b/);
  });

  it("las iniciales salen del email, que es lo único que hay", () => {
    expect(iniciales("felipe.eguia@example.com")).toBe("FE");
    expect(iniciales("ana@example.org")).toBe("AN");
  });
});

describe("los chips de estado, tintados", () => {
  it("usan el tinte y el texto medido del tono, no el relleno sólido", () => {
    const ds = LEER("components/screens/design-system.tsx");
    const chip = ds.slice(ds.indexOf("export function EstadoChip"), ds.indexOf("export function MarcaDeMateria"));
    expect(chip).toContain("var(--${tone}-tinte)");
    expect(chip).toContain("var(--${tone}-tinte-texto)");
    expect(chip).not.toContain("#ffffff");
  });
});
