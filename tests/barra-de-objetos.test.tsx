import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

/**
 * La barra del espacio de trabajo, montada — [ADR-088](../docs/decisions.md#adr-088).
 *
 * Los tests del dominio prueban las reglas; éstos prueban **lo que ADR-088
 * prometió del lado de la pantalla**: los roles ARIA, el teclado, que cerrar el
 * que se está mirando lleve al vecino, y que la memoria se restaure sin
 * parpadeo.
 */

const push = vi.fn();
let rutaActual = "/hoy";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => rutaActual.split("?")[0],
  useSearchParams: () => new URLSearchParams(rutaActual.split("?")[1] ?? ""),
}));

/** La identidad sale de Auth, y acá se fija: el test no levanta Supabase. */
vi.mock("@/lib/client/api", () => ({
  identidadDeSesion: () => Promise.resolve("est-SYN-ana"),
}));

const { ProveedorDeEspacioDeTrabajo } = await import("@/components/shell/espacio-de-trabajo");
const { BarraDeObjetos } = await import("@/components/shell/barra-de-objetos");
const { claveDeAlmacenamiento } = await import("@/lib/client/espacio-de-trabajo/persistencia");

const ANA = "est-SYN-ana";

/** Siembra la memoria como si el estudiante ya hubiera abierto estos objetos. */
function sembrar(cantidad: number, activo: string | null = null) {
  window.localStorage.setItem(
    claveDeAlmacenamiento(ANA),
    JSON.stringify({
      objetos: Array.from({ length: cantidad }, (_, i) => ({
        tipo: "materia",
        entidadId: `ce-${i + 1}`,
        etiqueta: `Materia ${i + 1}`,
        etiquetaSecundaria: null,
        // `/materia` es una ruta del grafo: `validarContra` la acepta.
        ruta: `/materia?cursada=ce-${i + 1}`,
        abiertoEn: `2026-09-10T0${i}:00:00.000Z`,
        visitadoEn: `2026-09-10T0${i}:00:00.000Z`,
      })),
      activo,
    }),
  );
}

function Montada() {
  return (
    <ProveedorDeEspacioDeTrabajo>
      <BarraDeObjetos onAbrirPaleta={() => {}} />
    </ProveedorDeEspacioDeTrabajo>
  );
}

/** Espera a que la memoria se haya leído: antes de eso no se dibuja nada. */
async function montar() {
  const utils = render(<Montada />);
  await waitFor(() => expect(screen.getByRole("tablist")).toBeInTheDocument());
  return utils;
}

beforeEach(() => {
  window.localStorage.clear();
  push.mockClear();
  rutaActual = "/hoy";
});

describe("hidratación", () => {
  it("**sin memoria leída no dibuja nada**: no hay parpadeo de objetos ajenos", () => {
    sembrar(2);
    render(<Montada />);
    // El primer render es síncrono y la identidad llega en una promesa: acá
    // todavía no puede haber barra.
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("después de leer, restaura lo que había", async () => {
    sembrar(3);
    await montar();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("sin nada abierto la barra **no existe**", async () => {
    render(<Montada />);
    await waitFor(() => expect(push).not.toHaveBeenCalled());
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });
});

describe("roles y estado seleccionado — requisito 3", () => {
  it("es un `tablist` con un `tab` por objeto", async () => {
    sembrar(3);
    await montar();
    expect(screen.getByRole("tablist")).toHaveAccessibleName("Lo que tenés abierto");
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("el activo lo marca **la URL**, no un estado aparte", async () => {
    sembrar(3);
    rutaActual = "/materia?cursada=ce-2";
    await montar();

    const tabs = screen.getAllByRole("tab");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
  });

  it("en una ruta que no es de ningún objeto, ninguno queda seleccionado", async () => {
    sembrar(2);
    rutaActual = "/progreso";
    await montar();
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toHaveAttribute("aria-selected", "false");
    }
  });

  it("sólo el activo es tabulable: la barra es **una** parada de tabulación", async () => {
    sembrar(3);
    rutaActual = "/materia?cursada=ce-2";
    await montar();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.filter((t) => t.getAttribute("tabindex") === "0")).toHaveLength(1);
  });

  it("cada objeto lleva su nombre completo accesible aunque el ancho lo corte", async () => {
    sembrar(2);
    await montar();
    expect(screen.getAllByRole("tab")[0]).toHaveAttribute("title", "Materia 1");
  });
});

describe("teclado", () => {
  it("las flechas mueven el foco entre objetos", async () => {
    sembrar(3);
    await montar();
    const tabs = screen.getAllByRole("tab");

    tabs[0]?.focus();
    fireEvent.keyDown(tabs[0] as HTMLElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(tabs[1]);

    fireEvent.keyDown(tabs[1] as HTMLElement, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(tabs[0]);
  });

  it("`Home` y `End` van a los extremos", async () => {
    sembrar(4);
    await montar();
    const tabs = screen.getAllByRole("tab");

    fireEvent.keyDown(tabs[1] as HTMLElement, { key: "End" });
    expect(document.activeElement).toBe(tabs[3]);
    fireEvent.keyDown(tabs[3] as HTMLElement, { key: "Home" });
    expect(document.activeElement).toBe(tabs[0]);
  });

  it("`Delete` cierra; **`Escape` no cierra nada**", async () => {
    sembrar(3);
    await montar();

    fireEvent.keyDown(screen.getAllByRole("tab")[0] as HTMLElement, { key: "Escape" });
    expect(screen.getAllByRole("tab")).toHaveLength(3);

    fireEvent.keyDown(screen.getAllByRole("tab")[0] as HTMLElement, { key: "Delete" });
    await waitFor(() => expect(screen.getAllByRole("tab")).toHaveLength(2));
  });
});

describe("activar y cerrar", () => {
  /**
   * **Cambió con la Enmienda 1 de ADR-088, y es la conducta que pidió el owner.**
   *
   * Antes tocar una ficha te sacaba de la pantalla; ahora **despliega el panel
   * encima**, y la URL lo dice. Consultar en qué anda una materia dejó de costar
   * perder Hoy y volver.
   */
  it("tocar una ficha despliega el panel, y **no te saca de la pantalla**", async () => {
    sembrar(3);
    await montar();
    fireEvent.click(screen.getAllByRole("tab")[2] as HTMLElement);
    expect(push).toHaveBeenCalledWith("/hoy?abierto=materia%3Ace-3");
  });

  it("volver a tocarla la minimiza: el parámetro se va, el objeto queda", async () => {
    sembrar(3);
    rutaActual = "/hoy?abierto=materia:ce-2";
    await montar();

    fireEvent.click(screen.getAllByRole("tab")[1] as HTMLElement);
    expect(push).toHaveBeenCalledWith("/hoy");
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("con el panel desplegado, **el activo es el del panel** y no el de la ruta", async () => {
    sembrar(3);
    // La ruta es la de `ce-1`, pero el panel muestra `ce-3`.
    rutaActual = "/materia?cursada=ce-1&abierto=materia:ce-3";
    await montar();

    const tabs = screen.getAllByRole("tab");
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
  });

  it("un `abierto=` que no corresponde a ningún objeto abierto se ignora", async () => {
    sembrar(2);
    rutaActual = "/hoy?abierto=materia:ce-99";
    await montar();
    // Sin ventana huérfana: ninguno queda seleccionado por un parámetro inventado.
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toHaveAttribute("aria-selected", "false");
    }
  });

  it("cerrar **el que se está mirando** lleva al vecino más reciente — §10.7", async () => {
    sembrar(3);
    rutaActual = "/materia?cursada=ce-1";
    await montar();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar: Materia 1" }));
    // `ce-3` es el de `visitadoEn` más alto entre los que quedan.
    expect(push).toHaveBeenCalledWith("/materia?cursada=ce-3");
  });

  /**
   * ⚠️ **Cambió con la Enmienda 3, y la diferencia es exactamente el
   * multiventana.**
   *
   * Con una sola ventana, cerrar su objeto desplegaba la del vecino: era eso o
   * dejar la pantalla sin nada. Con varias, abrir una ventana que el estudiante
   * no pidió **encima de las que ya tenía** es un escritorio que se reordena
   * solo. Se lleva la suya, y **sólo la suya**.
   */
  it("cerrar el objeto de una ventana se lleva su ventana, y no abre otra", async () => {
    sembrar(3);
    rutaActual = "/hoy?abierto=materia:ce-1";
    await montar();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar: Materia 1" }));
    // Sin ventana huérfana y sin ventana nueva, **sin sacar al estudiante de `/hoy`**.
    expect(push).toHaveBeenCalledWith("/hoy");
  });

  it("con tres ventanas, cerrar una deja las otras dos donde estaban", async () => {
    sembrar(3);
    rutaActual = "/hoy?abierto=materia:ce-1,materia:ce-2,materia:ce-3";
    await montar();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar: Materia 2" }));
    expect(push).toHaveBeenCalledWith("/hoy?abierto=materia%3Ace-1%2Cmateria%3Ace-3");
  });

  /** El pedido del owner, en su forma más literal: dos o tres a la vez. */
  it("desplegar una ficha **no baja las que ya estaban**", async () => {
    sembrar(3);
    rutaActual = "/hoy?abierto=materia:ce-1";
    await montar();

    fireEvent.click(screen.getAllByRole("tab")[2] as HTMLElement);
    expect(push).toHaveBeenCalledWith("/hoy?abierto=materia%3Ace-1%2Cmateria%3Ace-3");
  });

  it("volver a tocar una desplegada la baja, y las otras se quedan", async () => {
    sembrar(3);
    rutaActual = "/hoy?abierto=materia:ce-1,materia:ce-3";
    await montar();

    fireEvent.click(screen.getAllByRole("tab")[0] as HTMLElement);
    expect(push).toHaveBeenCalledWith("/hoy?abierto=materia%3Ace-3");
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  /**
   * ⚠️ **La de adelante es la última de la lista, no la primera.** Si el orden
   * se leyera al revés, `Escape` bajaría la de atrás y el activo de la barra
   * marcaría una ventana tapada.
   */
  it("el activo es **la ventana de adelante**, la última del apilamiento", async () => {
    sembrar(3);
    rutaActual = "/hoy?abierto=materia:ce-3,materia:ce-1";
    await montar();

    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[2]).toHaveAttribute("aria-selected", "false");
  });

  it("cerrar el último con el panel abierto deja la pantalla sin panel y entera", async () => {
    sembrar(1);
    rutaActual = "/hoy?abierto=materia:ce-1";
    await montar();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar: Materia 1" }));
    expect(push).toHaveBeenCalledWith("/hoy");
  });

  it("cerrar uno **de fondo** no mueve a nadie de pantalla", async () => {
    sembrar(3);
    rutaActual = "/materia?cursada=ce-1";
    await montar();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar: Materia 2" }));
    expect(push).not.toHaveBeenCalled();
  });

  it("cerrar el último no rompe la pantalla ni navega a ningún lado", async () => {
    sembrar(1);
    rutaActual = "/materia?cursada=ce-1";
    await montar();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar: Materia 1" }));
    await waitFor(() => expect(screen.queryByRole("tablist")).not.toBeInTheDocument());
    expect(push).not.toHaveBeenCalled();
  });

  it("lo que se cierra **no vuelve** en la próxima lectura", async () => {
    sembrar(2);
    await montar();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar: Materia 1" }));

    await waitFor(() => {
      const guardado = JSON.parse(window.localStorage.getItem(claveDeAlmacenamiento(ANA)) ?? "{}");
      expect(guardado.objetos).toHaveLength(1);
    });
  });
});

describe("desbordamiento — requisito 5, y la corrección de `A-07`", () => {
  it("con más de cinco, el resto va al menú con su contador", async () => {
    sembrar(7);
    await montar();

    expect(screen.getAllByRole("tab")).toHaveLength(5);
    expect(screen.getByRole("button", { name: /Ver los demás \(2\)/ })).toBeInTheDocument();
  });

  it("el menú lista los que no entraron, con su nombre entero", async () => {
    sembrar(7);
    await montar();

    fireEvent.click(screen.getByRole("button", { name: /Ver los demás/ }));
    expect(screen.getByRole("menu")).toHaveTextContent("Materia 6");
    expect(screen.getByRole("menu")).toHaveTextContent("Materia 7");
  });

  it("**el activo siempre se ve**, aunque haya quedado más allá del corte", async () => {
    sembrar(8);
    rutaActual = "/materia?cursada=ce-8";
    await montar();

    const seleccionado = screen.getAllByRole("tab").find((t) => t.getAttribute("aria-selected") === "true");
    expect(seleccionado).toHaveAttribute("title", "Materia 8");
  });
});

describe("reordenar sin mouse — requisito 3", () => {
  it("el menú del objeto ofrece moverlo a izquierda y derecha", async () => {
    sembrar(3);
    await montar();

    fireEvent.contextMenu(screen.getAllByRole("tab")[1] as HTMLElement);
    const menu = screen.getByRole("menu");
    expect(menu).toHaveTextContent("Mover a la izquierda");
    expect(menu).toHaveTextContent("Mover a la derecha");
  });

  it("mover a la izquierda cambia el orden de verdad", async () => {
    sembrar(3);
    await montar();

    fireEvent.contextMenu(screen.getAllByRole("tab")[1] as HTMLElement);
    fireEvent.click(screen.getByRole("menuitem", { name: "Mover a la izquierda" }));

    await waitFor(() =>
      expect(screen.getAllByRole("tab")[0]).toHaveAttribute("title", "Materia 2"),
    );
  });

  it("en el primero, «mover a la izquierda» se deshabilita con tratamiento propio (`A-08`)", async () => {
    sembrar(3);
    await montar();

    fireEvent.contextMenu(screen.getAllByRole("tab")[0] as HTMLElement);
    expect(screen.getByRole("menuitem", { name: "Mover a la izquierda" })).toBeDisabled();
  });
});

describe("cambio de identidad", () => {
  it("lo guardado por otro estudiante **no se muestra**", async () => {
    // Beto dejó tres objetos en este navegador; entra Ana.
    window.localStorage.setItem(
      claveDeAlmacenamiento("est-SYN-beto"),
      JSON.stringify({
        objetos: [
          {
            tipo: "materia", entidadId: "ce-9", etiqueta: "Materia de Beto",
            etiquetaSecundaria: null, ruta: "/materia?cursada=ce-9",
            abiertoEn: "2026-09-10T00:00:00.000Z", visitadoEn: "2026-09-10T00:00:00.000Z",
          },
        ],
        activo: null,
      }),
    );

    render(<Montada />);
    await waitFor(() => expect(push).not.toHaveBeenCalled());
    expect(screen.queryByText("Materia de Beto")).not.toBeInTheDocument();
  });
});

describe("el objeto que ya no está disponible — §10.7", () => {
  it("una ruta que la aplicación no reconoce se descarta al restaurar", async () => {
    window.localStorage.setItem(
      claveDeAlmacenamiento(ANA),
      JSON.stringify({
        objetos: [
          {
            tipo: "materia", entidadId: "ce-1", etiqueta: "Materia 1",
            etiquetaSecundaria: null, ruta: "/materia?cursada=ce-1",
            abiertoEn: "2026-09-10T00:00:00.000Z", visitadoEn: "2026-09-10T00:00:00.000Z",
          },
          {
            tipo: "materia", entidadId: "ce-2", etiqueta: "Ruta inventada",
            etiquetaSecundaria: null, ruta: "/pantalla-que-no-existe",
            abiertoEn: "2026-09-10T00:00:00.000Z", visitadoEn: "2026-09-10T00:00:00.000Z",
          },
        ],
        activo: null,
      }),
    );

    await montar();
    expect(screen.getAllByRole("tab")).toHaveLength(1);
    expect(screen.queryByText("Ruta inventada")).not.toBeInTheDocument();
  });

  it("memoria corrupta: la barra no aparece y **la aplicación no se rompe**", async () => {
    window.localStorage.setItem(claveDeAlmacenamiento(ANA), "{roto");
    render(<Montada />);
    await waitFor(() => expect(push).not.toHaveBeenCalled());
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });
});
