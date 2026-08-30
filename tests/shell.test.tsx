import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Item, NavegacionLateral } from "@/components/shell/navegacion-lateral";
import { BarraSuperior } from "@/components/shell/barra-superior";
import { menu, rutaDelItem } from "@/lib/navigation/menu";
import { migasDe, padreDeMiga } from "@/lib/navigation/migas";
import { nodos, superficieIds, type NodoId } from "@/lib/navigation/surfaces";
import { ctaIds, ctaRegistry } from "@/lib/navigation/cta-registry";

describe("El menú deriva del grafo", () => {
  it("todo ítem apunta a un nodo que existe y tiene ruta", () => {
    for (const item of menu) {
      expect(superficieIds, item.nodo).toContain(item.nodo);
      expect(rutaDelItem(item)).toBe(nodos[item.nodo].ruta);
    }
  });

  it("no incluye pasos de flujo que sólo se abren desde su origen", () => {
    // UX03–UX05 son pasos del loop, no destinos que uno elige. Ofrecerlos en el
    // menú sería dejar entrar a una evidencia sin la acción que la pide.
    const enMenu = new Set(menu.map((m) => m.nodo));
    for (const nodo of ["UX03", "UX04", "UX05"] as NodoId[]) {
      expect(enMenu, `${nodo} no debería estar en el menú`).not.toContain(nodo);
    }
  });

  it("el menú no duplica ninguna CTA del registro canónico", () => {
    // La navegación lateral es orientación, no una acción de dominio.
    const destinosDeCta = new Set(ctaIds.map((id) => ctaRegistry[id].destino));
    const soloPorMenu = menu.filter((m) => !destinosDeCta.has(m.nodo));
    // UX07 es justamente el que ninguna CTA alcanza (ADR-016): el menú lo cubre
    // sin inventar una CTA-019.
    expect(soloPorMenu.map((m) => m.nodo)).toEqual(["UX07"]);
  });

  it("un contador sólo aparece si tiene número", () => {
    for (const item of menu) {
      expect(item.contador === null || typeof item.contador === "number").toBe(true);
    }
  });
});

describe("Breadcrumb", () => {
  it("cada superficie tiene su camino, y termina en sí misma sin enlace", () => {
    for (const id of superficieIds) {
      const migas = migasDe(id);
      expect(migas.length, id).toBeGreaterThan(0);
      expect(migas[migas.length - 1].href, `${id} no debe enlazarse a sí misma`).toBeNull();
    }
  });

  it("UX01 es raíz: su breadcrumb tiene un solo elemento", () => {
    expect(migasDe("UX01")).toHaveLength(1);
  });

  it("el árbol de padres no tiene ciclos", () => {
    for (const id of superficieIds) {
      const vistos = new Set<NodoId>();
      let actual: NodoId | undefined = id;
      while (actual !== undefined) {
        expect(vistos, `ciclo en el breadcrumb de ${id}`).not.toContain(actual);
        vistos.add(actual);
        actual = padreDeMiga[actual];
      }
    }
  });

  it("todo eslabón intermedio enlaza a una ruta real", () => {
    for (const id of superficieIds) {
      for (const miga of migasDe(id).slice(0, -1)) {
        expect(miga.href, `${id}`).not.toBeNull();
        expect(Object.values(nodos).map((n) => n.ruta)).toContain(miga.href);
      }
    }
  });
});

describe("Navegación lateral", () => {
  const render1 = (colapsada: boolean, activo: NodoId | null = "UX01") =>
    render(<NavegacionLateral nodoActivo={activo} colapsada={colapsada} onAlternar={() => {}} />);

  it("marca el ítem activo con aria-current, no sólo con color", () => {
    render1(false);
    const activo = screen.getByRole("link", { current: "page" });
    expect(activo).toHaveTextContent("Hoy");
  });

  it("colapsada conserva el nombre de cada ítem, visible", () => {
    // `A-03`: "los íconos sin etiqueta obligan a recordar en un producto que
    // en todo lo demás evita el recuerdo". La etiqueta baja de tamaño, no se va.
    const { container } = render1(true);
    for (const item of menu) {
      expect(screen.getByRole("link", { name: new RegExp(item.etiqueta) })).toBeInTheDocument();
      // Visible de verdad: no escondida con sr-only.
      expect(container.textContent, item.etiqueta).toContain(item.etiqueta);
    }
    expect(container.querySelectorAll(".sr-only")).toHaveLength(0);
  });

  /**
   * `A-03` es una regla del **componente**, no del menú de producción: un modo
   * compacto reduce tamaño, nunca cantidad de información. Se prueba sobre un
   * ítem sintético con contador porque hoy ningún ítem real lleva número
   * ([ADR-021](../docs/decisions.md#adr-021)) — atar el test al menú de
   * producción haría que la regla dejara de verificarse justo cuando el menú
   * cambia, que es cuando más falta hace.
   */
  it("colapsar NO degrada el contador a un punto (anti-patrón A-03)", () => {
    const conNumero = { nodo: "UX01", etiqueta: "Hoy", contador: 17 } as const;

    for (const colapsada of [false, true]) {
      const { container, unmount } = render(
        <Item item={conNumero} activo={false} colapsada={colapsada} />,
      );
      const contador = container.querySelector("[data-contador]");
      expect(contador, `colapsada=${colapsada}`).not.toBeNull();
      // Sigue siendo un número, no un punto: es la regla entera.
      expect(contador!.textContent, `colapsada=${colapsada}`).toBe("17");
      // Y la etiqueta no desaparece para ganar ancho.
      expect(container.textContent, `colapsada=${colapsada}`).toContain("Hoy");
      unmount();
    }
  });

  /**
   * El contador que había en Progreso era un literal `1`: una cifra en pantalla
   * sin un hecho detrás. Este guard impide que vuelva a colarse un número
   * inventado en el menú.
   */
  it("ningún contador del menú es un literal sin fuente", () => {
    for (const item of menu) {
      expect(item.contador, `${item.etiqueta}`).toBeNull();
    }
  });

  it("el control de colapsar declara su estado", () => {
    const { unmount } = render1(false);
    expect(screen.getByLabelText("Colapsar la navegación")).toHaveAttribute("aria-expanded", "true");
    unmount();
    render1(true);
    expect(screen.getByLabelText("Expandir la navegación")).toHaveAttribute("aria-expanded", "false");
  });

  it("alterna al hacer clic", () => {
    let veces = 0;
    render(<NavegacionLateral nodoActivo="UX01" colapsada={false} onAlternar={() => veces++} />);
    fireEvent.click(screen.getByLabelText("Colapsar la navegación"));
    expect(veces).toBe(1);
  });

  it("no dibuja conmutador de tema", () => {
    // §12.4: no hay paleta oscura. Un control que no cambia nada sería prometer
    // lo que no se sostiene.
    const { container } = render1(false);
    expect(container.textContent).not.toMatch(/tema|oscuro|claro/i);
  });

  it("no contiene ninguna CTA primaria", () => {
    // I-06: una sola acción destacada por pantalla, y la barra no lo es.
    const { container } = render1(false);
    expect(container.querySelectorAll("[data-cta-primaria]")).toHaveLength(0);
  });
});

describe("Barra superior", () => {
  it("el elemento actual no se enlaza", () => {
    render(<BarraSuperior migas={migasDe("UX09")} onAbrirPaleta={() => {}} />);
    expect(screen.getByText("Paso")).toHaveAttribute("aria-current", "page");
  });

  it("el buscador muestra su atajo adentro del control que dispara (I-04)", () => {
    render(<BarraSuperior migas={migasDe("UX01")} onAbrirPaleta={() => {}} />);
    const boton = screen.getByRole("button", { name: /Buscar/ });
    expect(boton).toHaveTextContent("⌘K");
    expect(boton).toHaveAttribute("aria-keyshortcuts");
  });

  it("el atajo no elimina su camino visible (P-07): el control se puede tocar", () => {
    let abierto = 0;
    render(<BarraSuperior migas={migasDe("UX01")} onAbrirPaleta={() => abierto++} />);
    fireEvent.click(screen.getByRole("button", { name: /Buscar/ }));
    expect(abierto).toBe(1);
  });

  it("no lleva la CTA primaria de la pantalla", () => {
    const { container } = render(<BarraSuperior migas={migasDe("UX01")} onAbrirPaleta={() => {}} />);
    expect(container.querySelectorAll("[data-cta-primaria]")).toHaveLength(0);
  });
});


// ── A2.5 · las nueve superficies viven dentro del shell ──────────────────────

const RAIZ = process.cwd();

function paginas(dir: string): string[] {
  const abs = resolve(RAIZ, dir);
  return readdirSync(abs).flatMap((entrada) => {
    const full = join(abs, entrada);
    if (statSync(full).isDirectory()) return paginas(join(dir, entrada));
    return entrada === "page.tsx" ? [join(dir, entrada)] : [];
  });
}

describe("A2.5 · las nueve superficies dentro del shell", () => {
  /**
   * El criterio de la etapa, hecho verificable. Una superficie fuera del shell
   * no se rompe: se ve *casi* igual y pierde la navegación, que es la clase de
   * regresión que nadie nota hasta que un estudiante se queda sin salida.
   */
  it("toda ruta del estudiante envuelve su superficie en `Shell`, con su nodo", () => {
    const rutas = paginas("app/(student)");
    expect(rutas.length).toBe(9);

    const sinShell = rutas.filter((f) => {
      const src = readFileSync(resolve(RAIZ, f), "utf8");
      return !/<Shell\s+nodo="UX0[1-9]"/.test(src);
    });
    expect(sinShell).toEqual([]);
  });

  /**
   * Cada ruta declara un nodo distinto. Dos rutas con el mismo nodo darían un
   * breadcrumb que miente y un ítem activo en el lugar equivocado.
   */
  it("cada ruta declara un nodo propio, sin repetirse", () => {
    const nodos = paginas("app/(student)")
      .map((f) => readFileSync(resolve(RAIZ, f), "utf8").match(/<Shell\s+nodo="(UX0[1-9])"/)?.[1])
      .filter(Boolean);
    expect(new Set(nodos).size).toBe(9);
  });
});
