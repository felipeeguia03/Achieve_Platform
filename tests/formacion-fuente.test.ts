import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * La fuente de Formación se conserva **literal**.
 *
 * Mismo precedente que [ADR-031](../docs/decisions.md#adr-031) fijó para el
 * protocolo de examen: *"la fuente no se corrige, ni los tipeos"*. Una fuente
 * corregida deja de ser la fuente, y con ella se pierde la posibilidad de
 * preguntarle a la autora si quiso decir eso.
 */
const FUENTE = readFileSync(
  resolve(process.cwd(), "docs/formacion-prioridad-maxima-source.md"),
  "utf8",
);

/**
 * El texto con los saltos de línea colapsados.
 *
 * ⚠️ **El wrap a 100 columnas es formato del repositorio, no de la autora**: su
 * texto es prosa corrida. Comparar contra el archivo crudo haría fallar el guard
 * por dónde cae un salto de línea, que no es lo que se está cuidando.
 */
const CORRIDO = FUENTE.replace(/\s+/g, " ");

describe("ADR-087 · la fuente de Formación no se edita", () => {
  /**
   * ⚠️ **Si esto falla, alguien "arregló" la ortografía de la psicopedagoga.**
   * No es un error del test: es el test haciendo su trabajo.
   */
  it("los tipeos del original siguen ahí", () => {
    for (const tipeo of [
      "temas mas recurrentes",
      "tambien percibida",
      "erroneamente",
      "no sabe como distribuirlo",
      "cuales contenidos",
      "elk aprendizaje en si",
      "útil,sirve de guia y aveces",
      "en silecio o modo avion",
    ]) {
      expect(CORRIDO, `se corrigió «${tipeo}»`).toContain(tipeo);
    }
  });

  it("están las cinco piezas, con su título tal como las nombra el estudiante", () => {
    for (const titulo of [
      "No sé por dónde empezar a estudiar",
      "Tengo mucho para estudiar y no me alcanza el tiempo",
      "Leo, lo entiendo, pero después no me acuerdo",
      "¿Cómo sé si realmente sé un tema?",
      "Me distraigo fácil con el celu",
    ]) {
      expect(CORRIDO).toContain(titulo);
    }
  });

  /**
   * ⚠️ **Las seis partes son el contrato.** Sin la acción posterior y la
   * evidencia, Formación vuelve a ser la videoteca pasiva que el `§13` del
   * spec prohíbe. Si una pieza futura entra sin ellas, esto lo dice.
   */
  it("cada pieza trae acción posterior, evidencia y material", () => {
    const piezas = FUENTE.split(/^### \d+\. /m).slice(1);
    expect(piezas).toHaveLength(5);
    for (const p of piezas) {
      expect(p).toMatch(/Acci[óo]n (concreta )?posterior/i);
      expect(p).toMatch(/Evidencia/i);
      expect(p).toMatch(/Material|Checklist/i);
    }
  });

  /**
   * La autora dice que faltan los guiones. Mientras eso sea cierto, el
   * documento tiene que **decirlo**: prometer un video que no existe es peor
   * que no tenerlo.
   */
  it("declara que los guiones todavía no existen", () => {
    expect(FUENTE).toContain("faltan los guiones");
    expect(FUENTE).toMatch(/vigencia no está confirmada|Recibido no es aprobado/i);
  });
});
