import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { copy, type CopyId } from "@/lib/content/es-AR";

/**
 * Auditoría de conformidad de `design-system.md` §9, en lo que es verificable
 * mecánicamente.
 *
 * **Lo que no se puede automatizar no se marca como pasado.** El recorrido con
 * `Tab`, el lector de pantalla y la prueba de datos sucios reales se corren
 * aparte y se reportan en `docs/roadmap.md` con su resultado real.
 */

const ROOT = process.cwd();

function archivos(dir: string): string[] {
  const abs = resolve(ROOT, dir);
  let entradas: string[];
  try {
    entradas = readdirSync(abs);
  } catch {
    return [];
  }
  return entradas.flatMap((e) => {
    const full = join(abs, e);
    if (statSync(full).isDirectory()) return archivos(join(dir, e));
    return /\.(ts|tsx)$/.test(e) ? [join(dir, e)] : [];
  });
}

const pantallas = archivos("components/screens").map((p) => ({
  path: p,
  code: readFileSync(resolve(ROOT, p), "utf8"),
}));

const textos = Object.entries(copy) as [CopyId, string][];

describe("Bloque 2 · Contenido", () => {
  it("`C-01` — una sola persona gramatical: voseo, sin usted", () => {
    // El anti-patrón A-05 es exactamente una grieta de tono.
    const enUsted = /\b(usted|debe usted|su evidencia|ingrese|complete|suba|envíe|revise)\b/i;
    const grietas = textos.filter(([, texto]) => enUsted.test(texto));
    expect(grietas.map(([id]) => id)).toEqual([]);
  });

  it("`C-01` — las formas imperativas usan voseo", () => {
    // "Entregá", "Subí", "Resolvé": acento en la última sílaba.
    const imperativosProhibidos = /\b(Entrega|Sube|Resuelve|Contanos|Elige|Agrega)\b/;
    // Sin excepciones desde la Etapa 0.7: "Entrega:" de UX02 se unificó a
    // "Entregá:", la forma de UX01.
    const grietas = textos.filter(([, texto]) => imperativosProhibidos.test(texto));
    expect(grietas.map(([id]) => id)).toEqual([]);
  });

  it("`C-02` — un concepto, una palabra: no hay deriva de vocabulario (A-04)", () => {
    // AGENTS.md §4. Si un mismo objeto aparece con dos nombres, es A-04.
    const derivas: [string, RegExp][] = [
      ["Action", /\b(tarea|to-?do|actividad)\b/i],
      ["Commitment", /\b(promesa|cita)\b/i],
      ["Evidence", /\b(adjunto formal|archivo entregado)\b/i],
      ["Reflection", /\b(diario|comentario)\b/i],
    ];
    /**
     * La única excepción, y no es una concesión: **`VI.2` §8.7 llama a la
     * sección "Actividad reciente"**, y es el nombre de un historial de hechos,
     * no otro nombre para una `Action`. El guard sigue cazando cualquier otro
     * uso de la palabra; esta clave se exceptúa por su nombre exacto y con el
     * spec como respaldo, verificado abajo.
     */
    const DEL_SPEC = new Set(["MATERIA.ACTIVIDAD"]);

    for (const [concepto, patron] of derivas) {
      const grietas = textos.filter(
        ([id, texto]) => patron.test(texto) && !DEL_SPEC.has(id),
      );
      expect(grietas.map(([id]) => id), `deriva de ${concepto}`).toEqual([]);
    }
  });

  it("una excepción de vocabulario existe porque el spec la nombra así", () => {
    // Sin esto, "está en el spec" sería una afirmación de un comentario.
    const spec = readFileSync(resolve(process.cwd(), "docs/product-spec-source.md"), "utf8");
    expect(spec).toContain("Actividad reciente");
  });

  it("`C-03` — ningún placeholder genérico", () => {
    const genericos = ["Lorem", "TODO", "TBD", "Texto de ejemplo", "xxx"];
    for (const [id, texto] of textos) {
      for (const g of genericos) expect(texto, id).not.toContain(g);
    }
  });

  it("`C-06` — ninguna etiqueta emite un veredicto sobre la persona", () => {
    // A-06: se describe la situación, nunca se rotula al estudiante.
    const veredictos = /\b(en riesgo|irresponsable|vago|desorganizado|mal alumno|abandonó)\b/i;
    const grietas = textos.filter(([, texto]) => veredictos.test(texto));
    expect(grietas.map(([id]) => id)).toEqual([]);
  });

  it("`C-07` — las frases de regla viven en contenido versionado, no en el JSX", () => {
    const literales = /"(Porque:|Entregá:|Después:|Cerrás cuando:|Fuente:)/;
    expect(pantallas.filter(({ code }) => literales.test(code)).map(({ path }) => path)).toEqual([]);
  });
});

describe("Bloque 4 · Datos", () => {
  it("`P-03` — ninguna magnitud de máquina llega cruda", () => {
    // DD5: sin scores, porcentajes, readiness numérica ni probabilidad.
    for (const [id, texto] of textos) {
      expect(texto, id).not.toMatch(/\d+\s?%/);
      expect(texto, id).not.toMatch(/\bscore\b/i);
    }
  });

  it("`P-09` — vacío, no-cargado, sin-asignar y cero se ven distinto", () => {
    // Las cuatro formas tienen copy propio y ninguno se reusa para otra.
    const formas = [
      "COMUN.SIN_AVANCE",
      "HOY.ESTADO.EVIDENCE_INFO",
      "HOY.ESTADO.CONTEXT_INCOMPLETE",
      "HOY.VACIO",
    ] as CopyId[];
    const valores = formas.map((f) => copy[f]);
    expect(new Set(valores).size).toBe(formas.length);
  });
});

describe("Bloque 5 · Visual", () => {
  it("`A-08` — deshabilitado tiene tratamiento propio, distinto de secundario", () => {
    const ds = readFileSync(resolve(ROOT, "components/screens/design-system.tsx"), "utf8");
    const cta = ds.slice(ds.indexOf("export function CTAPrincipal"));
    // Opacidad/color propios más el atributo nativo que los lectores anuncian.
    expect(cta).toContain("disabled");
    expect(cta).toContain('disabled ? "var(--border)"');
    expect(cta).toContain('disabled ? "var(--muted-foreground)"');
  });

  it("`P-06` — ningún estado se comunica sólo por color", () => {
    // Todo chip lleva texto además del tono: EstadoChip recibe children.
    const ds = readFileSync(resolve(ROOT, "components/screens/design-system.tsx"), "utf8");
    const chip = ds.slice(ds.indexOf("export function EstadoChip"));
    expect(chip).toContain("children");
  });

  it("`V-02` — la monoespaciada sólo para lo que se compara carácter por carácter", () => {
    // El eyebrow se corrigió a sans en su momento; que no vuelva.
    const css = readFileSync(resolve(ROOT, "app/globals.css"), "utf8");
    const eyebrow = css.slice(css.indexOf(".eyebrow"), css.indexOf(".eyebrow") + 400);
    expect(eyebrow).not.toContain("--font-mono");
  });
});

describe("Bloque 6 · Interacción", () => {
  it("`I-01` — todo estado compartible tiene URL", () => {
    // Cada ruta acepta ?escenario= y por eso cualquier estado crítico se puede
    // abrir y compartir por link.
    const rutas = archivos("app").filter((p) => p.endsWith("page.tsx"));
    const conEscenario = rutas.filter((p) =>
      readFileSync(resolve(ROOT, p), "utf8").includes("escenario"),
    );
    // Todas menos la raíz, que sólo redirige.
    expect(conEscenario.length).toBe(rutas.length - 1);
  });

  it("`I-05` — el bloqueante va arriba de la CTA, no debajo", () => {
    for (const { path, code } of pantallas) {
      const aviso = code.indexOf("{aviso &&");
      const cta = code.indexOf("<CTAPrincipal");
      if (aviso === -1 || cta === -1) continue;
      expect(aviso, `${path}: el aviso bloqueante va después de la CTA`).toBeLessThan(cta);
    }
  });
});
