import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

/**
 * La ventana interna — [ADR-088](../docs/decisions.md#adr-088), Enmienda 1.
 *
 * Lo que se prueba acá es **la parte cara del multiventana**: los tres
 * requisitos innegociables que una ventana interna ejercita de verdad —URL,
 * trampa de foco y jerarquía de `Escape`— y la distinción entre minimizar y
 * cerrar, que es donde un dock se vuelve confuso si las dos cosas hacen lo
 * mismo.
 */

const push = vi.fn();
let rutaActual = "/hoy";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => rutaActual.split("?")[0],
  useSearchParams: () => new URLSearchParams(rutaActual.split("?")[1] ?? ""),
}));

const pedir = vi.fn();
vi.mock("@/lib/client/api", () => ({
  identidadDeSesion: () => Promise.resolve("est-SYN-ana"),
  pedir: (...args: unknown[]) => pedir(...args),
}));

const { ProveedorDeEspacioDeTrabajo } = await import("@/components/shell/espacio-de-trabajo");
const { PanelDeObjeto } = await import("@/components/shell/panel-de-objeto");
const { BarraDeObjetos } = await import("@/components/shell/barra-de-objetos");
const { claveDeAlmacenamiento } = await import("@/lib/client/espacio-de-trabajo/persistencia");

const ANA = "est-SYN-ana";

function sembrar(objetos: Array<{ tipo: string; id: string; etiqueta: string }>) {
  window.localStorage.setItem(
    claveDeAlmacenamiento(ANA),
    JSON.stringify({
      objetos: objetos.map((o, i) => ({
        tipo: o.tipo,
        entidadId: o.id,
        etiqueta: o.etiqueta,
        etiquetaSecundaria: null,
        ruta: `/materia?cursada=${o.id}`,
        abiertoEn: `2026-09-10T0${i}:00:00.000Z`,
        visitadoEn: `2026-09-10T0${i}:00:00.000Z`,
      })),
      activo: null,
    }),
  );
}

function Montado() {
  return (
    <ProveedorDeEspacioDeTrabajo>
      <BarraDeObjetos onAbrirPaleta={() => {}} />
      <PanelDeObjeto />
    </ProveedorDeEspacioDeTrabajo>
  );
}

async function montar() {
  const utils = render(<Montado />);
  await waitFor(() => expect(screen.getByRole("tablist")).toBeInTheDocument());
  return utils;
}

beforeEach(() => {
  window.localStorage.clear();
  push.mockClear();
  pedir.mockReset();
  pedir.mockResolvedValue({ estado: "ERROR" });
  rutaActual = "/hoy";
});

describe("cuándo existe la ventana", () => {
  it("sin `abierto=` no hay panel", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    await montar();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("con `abierto=` se despliega, y lo nombra el objeto", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();

    const panel = screen.getByRole("dialog");
    expect(panel).toHaveAccessibleName("Unidad 1");
    expect(panel).toHaveAttribute("aria-modal", "true");
  });

  /**
   * **Requisito 1 del multiventana, ejercitado de verdad.** El panel vive en la
   * URL: por eso se puede compartir, el botón atrás lo cierra y recargar lo
   * repone. Un panel que viviera sólo en memoria no tendría ninguna de las tres.
   */
  it("una clave inventada en la URL **no abre una ventana huérfana**", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    rutaActual = "/hoy?abierto=unidad:no-existe";
    await montar();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("minimizar no es cerrar — y por eso son dos botones", () => {
  it("minimizar guarda el panel y **deja el objeto en la barra**", async () => {
    sembrar([
      { tipo: "unidad", id: "u1", etiqueta: "Unidad 1" },
      { tipo: "unidad", id: "u2", etiqueta: "Unidad 2" },
    ]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();

    fireEvent.click(screen.getByRole("button", { name: "Minimizar" }));
    expect(push).toHaveBeenCalledWith("/hoy");
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  it("cerrar saca el objeto de la barra", async () => {
    sembrar([
      { tipo: "unidad", id: "u1", etiqueta: "Unidad 1" },
      { tipo: "unidad", id: "u2", etiqueta: "Unidad 2" },
    ]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();

    /*
      La ficha y el panel tienen **el mismo nombre accesible** para cerrar, y
      está bien: hacen exactamente lo mismo. Por eso hay que decir cuál se toca.
    */
    const enElPanel = within(screen.getByRole("dialog"));
    fireEvent.click(enElPanel.getByRole("button", { name: "Cerrar: Unidad 1" }));
    await waitFor(() => expect(screen.getAllByRole("tab")).toHaveLength(1));
  });

  it("tocar afuera minimiza; **nunca cierra**", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();

    const fondo = screen.getByRole("dialog").parentElement as HTMLElement;
    fireEvent.mouseDown(fondo);
    expect(push).toHaveBeenCalledWith("/hoy");
    expect(screen.getAllByRole("tab")).toHaveLength(1);
  });
});

describe("`Escape` con dos capas — requisito 4", () => {
  it("sin nada encima, `Escape` minimiza", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(push).toHaveBeenCalledWith("/hoy");
  });

  /**
   * ⚠️ **La capa de arriba gana, y ésa es toda la jerarquía.** Los menús de la
   * barra escuchan en captura y frenan el evento; el panel escucha normal. Con un
   * menú abierto, `Escape` cierra el menú y **el panel se queda**.
   */
  it("con un menú abierto, `Escape` cierra el menú y el panel se queda", async () => {
    sembrar([
      { tipo: "unidad", id: "u1", etiqueta: "Unidad 1" },
      { tipo: "unidad", id: "u2", etiqueta: "Unidad 2" },
    ]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();

    fireEvent.contextMenu(screen.getAllByRole("tab")[0] as HTMLElement);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("`Escape` **nunca cierra el objeto**: cerrar es destructivo", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getAllByRole("tab")).toHaveLength(1);
  });
});

describe("trampa de foco — requisito 3", () => {
  it("al abrirse, el foco entra al panel", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });

  it("`Tab` circula adentro: del último vuelve al primero", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();

    const panel = screen.getByRole("dialog");
    const focos = panel.querySelectorAll<HTMLElement>("button");
    const primero = focos[0] as HTMLElement;
    const ultimo = focos[focos.length - 1] as HTMLElement;

    ultimo.focus();
    fireEvent.keyDown(panel, { key: "Tab" });
    expect(document.activeElement).toBe(primero);

    primero.focus();
    fireEvent.keyDown(panel, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(ultimo);
  });
});

describe("el panel consulta; la superficie trabaja", () => {
  it("lo dice en pantalla, para que no parezca un lugar donde se opera", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Comprometerte, empezar y entregar se hacen en la materia",
    );
  });

  it("«Ver como página» lleva a la superficie del objeto", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();

    fireEvent.click(screen.getByRole("button", { name: /Ver como página/ }));
    expect(push).toHaveBeenCalledWith("/materia?cursada=u1");
  });

  /**
   * `AGENTS.md` §2.7 — *omitir, no inventar*. Un tipo sin vista **lo dice** y
   * ofrece el camino que sí existe, en vez de caer a una pantalla parecida.
   */
  it("un tipo sin vista propia lo dice, y ofrece abrirlo como página", async () => {
    sembrar([{ tipo: "evidencia", id: "ev-1", etiqueta: "Evidencia del TP2" }]);
    rutaActual = "/hoy?abierto=evidencia:ev-1";
    await montar();

    const panel = screen.getByRole("dialog");
    expect(panel).toHaveTextContent("Todavía no se puede ver este objeto acá");
    expect(panel).toHaveTextContent("Abrilo como página para verlo completo");
  });

  it("una materia que no carga degrada con su reintento, **sin inventar contenido**", async () => {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    rutaActual = "/hoy?abierto=materia:ce-1";
    await montar();

    await waitFor(() => expect(pedir).toHaveBeenCalledWith("/api/materia?cursada=ce-1"));
    expect(screen.getByRole("dialog")).not.toHaveTextContent("Álgebra II");
  });
});
