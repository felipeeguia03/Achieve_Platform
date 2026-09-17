import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { copy } from "@/lib/content/es-AR";
import { Evidencia } from "@/components/screens/evidencia";
import { getEscenario } from "@/lib/fixtures";

/**
 * `C-04` elevado — [ADR-022](../docs/decisions.md#adr-022).
 *
 * El vacío dice **qué va a aparecer** y **por qué importa** siempre, y **cómo
 * hacer que aparezca sólo cuando la aparición depende del estudiante**.
 */

/**
 * Los tres vacíos de dominio de Achieve, con quién hace aparecer el dato.
 * `PALETA.VACIO` no está: es el vacío de una herramienta de navegación, no de
 * un dato del producto.
 */
const VACIOS = [
  { id: "HOY.VACIO", dependeDelEstudiante: false, quien: "el Academic Decision Engine" },
  { id: "EVIDENCIA.SIN_ADJUNTO", dependeDelEstudiante: true, quien: "el estudiante" },
  { id: "OVERVIEW.SIN_RECORRIDO_EXPLICA", dependeDelEstudiante: false, quien: "el servicio propietario" },
] as const;

describe("C-04 elevado · el vacío argumenta", () => {
  /**
   * Proxy deliberado: dos cláusulas ⇒ al menos dos oraciones. No prueba que la
   * segunda diga *por qué importa* —eso no lo decide un test—, pero sí atrapa
   * la regresión real: que alguien vuelva a dejar *"Todavía no hay datos."*
   */
  it("ningún vacío es una sola frase de ausencia", () => {
    for (const { id } of VACIOS) {
      const texto = copy[id as keyof typeof copy];
      const oraciones = texto.split(/\.\s/).filter((o) => o.trim().length > 0);
      expect(oraciones.length, `${id}: "${texto}"`).toBeGreaterThanOrEqual(2);
    }
  });

  /**
   * La mitad que más fácil se pierde. Completar el patrón con una acción que el
   * estudiante no puede ejecutar es peor que un vacío corto: le promete una
   * palanca que no tiene.
   */
  it("sólo lleva instrucción el vacío que el estudiante puede resolver", () => {
    // Sin `\b` de cierre: en JS una vocal acentuada no es carácter de palabra,
    // así que `\bhacé\b` nunca casa. El límite de apertura alcanza.
    //
    // `podés` no está en la lista a propósito: en `HOY.VACIO` la frase
    // *"podés revisar tus materias"* ofrece **otra ruta**, no la forma de hacer
    // aparecer la acción. Ofrecer una salida no es prometer una palanca.
    const IMPERATIVOS = /(^|[\s.,])(hacé|tocá|subí|adjuntá|escribí|elegí|cargá|probá)/i;
    for (const { id, dependeDelEstudiante, quien } of VACIOS) {
      const texto = copy[id as keyof typeof copy];
      expect(
        IMPERATIVOS.test(texto),
        `${id} lo hace aparecer ${quien}: ${dependeDelEstudiante ? "falta" : "sobra"} la instrucción`,
      ).toBe(dependeDelEstudiante);
    }
  });

  /**
   * Un vacío que explica **no es un dato que falta**. La itálica atenuada es el
   * tratamiento de `SIN_ASIGNAR` (ADR-019); usar el mismo para las dos cosas
   * rompe la distinción que `P-09` obliga a sostener.
   */
  it("el vacío no usa el tratamiento de una ausencia tipada", () => {
    const escenario = getEscenario("FX-EVD-BASE");
    const props = escenario.evidencia;
    if (!props) throw new Error("FX-EVD-BASE no proyecta UX05");

    const { container } = render(<Evidencia {...props} />);
    const parrafo = [...container.querySelectorAll("p")].find((p) =>
      p.textContent?.includes("Todavía no adjuntaste la producción"),
    );
    expect(parrafo, "el vacío de UX05 debería renderizarse").toBeTruthy();
    expect(parrafo!.style.fontStyle).not.toBe("italic");
    expect(parrafo!.getAttribute("data-ausencia")).toBeNull();
  });

  it("la regla elevada está escrita donde se la busca", () => {
    const ds = readFileSync(resolve(process.cwd(), "docs/design-system.md"), "utf8");
    expect(ds).toContain("sólo si la aparición depende del estudiante");
  });
});
