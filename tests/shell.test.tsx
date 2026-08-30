import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NavegacionLateral } from "@/components/shell/navegacion-lateral";
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

  it("colapsada conserva el nombre accesible de cada ítem", () => {
    // Se ve sólo el ícono, pero el lector de pantalla sigue leyendo el nombre.
    render1(true);
    for (const item of menu) {
      expect(screen.getByRole("link", { name: item.etiqueta })).toBeInTheDocument();
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
    render(<BarraSuperior migas={migasDe("UX09")} />);
    expect(screen.getByText("Paso")).toHaveAttribute("aria-current", "page");
  });

  it("el buscador se ofrece deshabilitado, con tratamiento propio (A-08)", () => {
    // Todavía no existe la paleta de comandos (A2.2). No se ofrece un campo que
    // no busca nada, y deshabilitado no se confunde con secundario.
    const { container } = render(<BarraSuperior migas={migasDe("UX01")} />);
    const buscador = container.querySelector('[aria-disabled="true"]')!;
    expect(buscador).not.toBeNull();
    expect((buscador as HTMLElement).style.cursor).toBe("not-allowed");
    expect((buscador as HTMLElement).style.opacity).not.toBe("");
  });

  it("no lleva la CTA primaria de la pantalla", () => {
    const { container } = render(<BarraSuperior migas={migasDe("UX01")} />);
    expect(container.querySelectorAll("[data-cta-primaria]")).toHaveLength(0);
  });
});
