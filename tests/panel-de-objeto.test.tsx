import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

/**
 * Las ventanas internas — [ADR-088](../docs/decisions.md#adr-088), Enmiendas 1 y 3.
 *
 * Lo que se prueba acá es **la parte cara del multiventana**: que el escritorio
 * entero viva en la URL, que `Escape` baje **una** ventana y no todas, y la
 * distinción entre minimizar y cerrar, que es donde un dock se vuelve confuso si
 * las dos cosas hacen lo mismo.
 *
 * ⚠️ **La trampa de foco ya no se prueba porque ya no existe**, y eso es la
 * Enmienda 3: con varias ventanas no modales, atrapar el `Tab` encerraría al
 * teclado en la última que se abrió. Lo que sigue probándose es la otra mitad —
 * el foco entra al abrirse y vuelve a donde estaba al bajarse.
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
const { BarraDeSuperficie } = await import("@/components/shell/barra-de-superficie");
const { claveDeAlmacenamiento } = await import("@/lib/client/espacio-de-trabajo/persistencia");
const { colorDeMateria } = await import("@/lib/domain/color-de-materia");

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

/** `#b04a2f` → `rgb(176, 74, 47)`, que es como el DOM devuelve un color. */
function comoRgb(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

function Montado() {
  return (
    <ProveedorDeEspacioDeTrabajo>
      <BarraDeSuperficie />
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

    /*
      ⚠️ **Y NO es modal** — Enmienda 3. Anunciarlo como modal le diría al lector
      de pantalla que el resto de la página no existe, cuando el resto de la
      página es lo que se sigue usando.
    */
    expect(panel).not.toHaveAttribute("aria-modal");
  });

  /** El pedido del owner: dos o tres cuadros, y **todos existen**. */
  it("con tres claves se despliegan tres ventanas, apiladas en ese orden", async () => {
    sembrar([
      { tipo: "unidad", id: "u1", etiqueta: "Unidad 1" },
      { tipo: "unidad", id: "u2", etiqueta: "Unidad 2" },
      { tipo: "unidad", id: "u3", etiqueta: "Unidad 3" },
    ]);
    rutaActual = "/hoy?abierto=unidad:u1,unidad:u3";
    await montar();

    const ventanas = screen.getAllByRole("dialog");
    expect(ventanas).toHaveLength(2);
    expect(ventanas[0]).toHaveAccessibleName("Unidad 1");
    expect(ventanas[1]).toHaveAccessibleName("Unidad 3");
  });

  it("una clave inventada **entre dos válidas** no se lleva puestas a las válidas", async () => {
    sembrar([
      { tipo: "unidad", id: "u1", etiqueta: "Unidad 1" },
      { tipo: "unidad", id: "u2", etiqueta: "Unidad 2" },
    ]);
    rutaActual = "/hoy?abierto=unidad:u1,unidad:no-existe,unidad:u2";
    await montar();
    expect(screen.getAllByRole("dialog")).toHaveLength(2);
  });

  it("la misma clave dos veces es **una** ventana, no dos", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    rutaActual = "/hoy?abierto=unidad:u1,unidad:u1";
    await montar();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
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

    /*
      ⚠️ **El control se nombra con el objeto, y con varias ventanas hace
      falta.** «Minimizar» a secas repetido tres veces no le dice a nadie —ni a
      un lector de pantalla— cuál de las tres se está por bajar.
    */
    fireEvent.click(screen.getByRole("button", { name: "Minimizar: Unidad 1" }));
    expect(push).toHaveBeenCalledWith("/hoy");
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  it("minimizar una de tres baja **sólo esa**", async () => {
    sembrar([
      { tipo: "unidad", id: "u1", etiqueta: "Unidad 1" },
      { tipo: "unidad", id: "u2", etiqueta: "Unidad 2" },
      { tipo: "unidad", id: "u3", etiqueta: "Unidad 3" },
    ]);
    rutaActual = "/hoy?abierto=unidad:u1,unidad:u2,unidad:u3";
    await montar();

    fireEvent.click(screen.getByRole("button", { name: "Minimizar: Unidad 2" }));
    expect(push).toHaveBeenCalledWith("/hoy?abierto=unidad%3Au1%2Cunidad%3Au3");
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

  /**
   * ⚠️ **Se invirtió con la Enmienda 3, y es a propósito.**
   *
   * Con una ventana modal, tocar afuera para bajarla era correcto. Con tres, el
   * afuera es **la pantalla que seguís usando**: cada clic en `Hoy` bajaría el
   * escritorio entero, que es lo contrario de para lo que sirve tenerlo.
   */
  it("tocar afuera **no baja nada**: la pantalla de atrás se sigue usando", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();

    const contenedor = screen.getByRole("dialog").parentElement as HTMLElement;
    fireEvent.mouseDown(contenedor);
    fireEvent.pointerDown(contenedor);
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
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

describe("el foco, sin trampa — Enmienda 3", () => {
  it("al abrirse, el foco entra a la ventana", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });

  /**
   * ⚠️ **`Tab` tiene que poder salir, y por eso el manejador lo ignora.**
   *
   * La Enmienda 1 lo interceptaba para hacerlo circular adentro. Con tres
   * ventanas no modales eso encerraría al teclado en una de las tres: quien no
   * usa mouse no podría llegar ni a las otras ventanas ni a la barra.
   */
  it("`Tab` **no** queda atrapado adentro de la ventana", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();

    const panel = screen.getByRole("dialog");
    const focos = panel.querySelectorAll<HTMLElement>("button");
    const ultimo = focos[focos.length - 1] as HTMLElement;

    ultimo.focus();
    fireEvent.keyDown(panel, { key: "Tab" });
    // Nadie movió el foco: lo mueve el navegador, como en cualquier página.
    expect(document.activeElement).toBe(ultimo);
  });
});

/**
 * La superficie con su semáforo — el primer tramo del pedido del owner:
 * *"primero quiero que se abra la materia normal, luego se puede minimizar con
 * un botón arriba"*.
 */
describe("la barra de título de la superficie", () => {
  it("en la pantalla del objeto aparece su semáforo", async () => {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    rutaActual = "/materia?cursada=ce-1";
    await montar();

    expect(screen.getByRole("button", { name: "Minimizar: Álgebra" })).toBeInTheDocument();
    // Ya está expandida: el tercer control **reduce**, no expande.
    expect(
      screen.getByRole("button", { name: "Restaurar el tamaño: Álgebra" }),
    ).toBeInTheDocument();
  });

  /**
   * ⚠️ **El nombre NO se repite acá — Enmienda 5.**
   *
   * Con el nombre puesto, el mismo texto aparecía **tres veces en los primeros
   * 250 px**: la miga, esta barra y el eyebrow de `UX02`. Es `C-02`: repetir no
   * es reforzar.
   */
  it("el semáforo va solo: el nombre no se repite en la barra de título", async () => {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    rutaActual = "/materia?cursada=ce-1";
    await montar();

    const barra = screen.getByRole("group", { name: "Controles de esta ventana" });
    expect(barra).not.toHaveTextContent("Álgebra");

    /*
      Y no se pierde nada accesible: **cada control lleva el nombre adentro**, así
      que un lector de pantalla sigue sabiendo de qué ventana son estos botones.
    */
    expect(within(barra).getByRole("button", { name: "Cerrar: Álgebra" })).toBeInTheDocument();
  });

  /**
   * ⚠️ **El color es identidad, y tiene que ser EL MISMO que en la lista.**
   *
   * Sale de `colorDeMateria`, la función que usa el índice: si la ventana
   * calculara el suyo, el día que alguien toque la paleta la lista y el
   * escritorio dirían colores distintos para la misma materia — y el color
   * pasaría a mentir sobre la identidad en vez de fijarla.
   */
  it("la ventana lleva el color de su materia, el mismo que en la lista", async () => {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    rutaActual = "/materia?cursada=ce-1&abierto=materia:ce-1";
    await montar();

    const cabecera = screen.getByRole("dialog").querySelector("header") as HTMLElement;
    expect(cabecera).not.toBeNull();
    expect(cabecera.style.borderTopWidth).toBe("3px");
    // jsdom serializa el color a `rgb()`, así que se compara ahí.
    expect(cabecera.style.borderTopColor).toBe(comoRgb(colorDeMateria("ce-1")));
  });

  /**
   * ⚠️ **Un tipo sin color razonado NO lleva color.** El argumento que sostiene
   * esto contra ADR-075 §C1 se escribió mirando materias y **sigue pendiente de
   * la psicopedagoga**: estirarlo a una evidencia sería pintar estados, que es
   * justo donde un color se lee como juicio.
   */
  it("un objeto que no es materia no lleva color", async () => {
    sembrar([{ tipo: "evidencia", id: "ev-1", etiqueta: "Evidencia del TP2" }]);
    rutaActual = "/hoy?abierto=evidencia:ev-1";
    await montar();

    const cabecera = screen.getByRole("dialog").querySelector("header") as HTMLElement;
    expect(cabecera.style.borderTopWidth).toBe("");
  });

  it("en una pantalla que no es de ningún objeto abierto, no hay semáforo", async () => {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    rutaActual = "/hoy";
    await montar();
    expect(screen.queryByRole("button", { name: /Minimizar/ })).not.toBeInTheDocument();
  });

  /**
   * ⚠️ **Minimizar no cierra, y ésa es toda la distinción.** El objeto queda en
   * la barra; lo que se va es la pantalla.
   */
  it("minimizar la superficie deja el objeto en la barra y vuelve a `Hoy`", async () => {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    rutaActual = "/materia?cursada=ce-1";
    await montar();

    fireEvent.click(screen.getByRole("button", { name: "Minimizar: Álgebra" }));
    expect(push).toHaveBeenCalledWith("/hoy");
    expect(screen.getAllByRole("tab")).toHaveLength(1);
  });

  it("el tercer control la convierte en ventana sobre la pantalla de la que salió", async () => {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    rutaActual = "/materia?cursada=ce-1";
    await montar();

    fireEvent.click(screen.getByRole("button", { name: "Restaurar el tamaño: Álgebra" }));
    expect(push).toHaveBeenCalledWith("/hoy?abierto=materia%3Ace-1");
  });

  it("cerrar desde la superficie saca el objeto y no deja la pantalla huérfana", async () => {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    rutaActual = "/materia?cursada=ce-1";
    await montar();

    /*
      La ✕ de la ficha y el semáforo de la superficie tienen **el mismo nombre
      accesible**, y está bien: hacen lo mismo. Por eso hay que decir cuál se
      toca.
    */
    const enLaSuperficie = within(
      screen.getByRole("group", { name: "Controles de esta ventana" }),
    );
    fireEvent.click(enLaSuperficie.getByRole("button", { name: "Cerrar: Álgebra" }));
    expect(push).toHaveBeenCalledWith("/hoy");
    await waitFor(() => expect(screen.queryByRole("tab")).not.toBeInTheDocument());
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
