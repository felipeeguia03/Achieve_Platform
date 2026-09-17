import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, fireEvent, waitFor, within } from "@testing-library/react";

/**
 * Las ventanas internas — [ADR-088](../docs/decisions.md#adr-088), Enmiendas 1, 3 y 7.
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
const { areaDe } = await import("@/lib/domain/marco-de-panel");
const { VISTA_POR_CAMINO } = await import("@/components/superficies/registro");
const { nodoIds, nodos } = await import("@/lib/navigation/surfaces");

const ANA = "est-SYN-ana";

function sembrar(
  objetos: Array<{ tipo: string; id: string; etiqueta: string; ruta?: string }>,
) {
  window.localStorage.setItem(
    claveDeAlmacenamiento(ANA),
    JSON.stringify({
      objetos: objetos.map((o, i) => ({
        tipo: o.tipo,
        entidadId: o.id,
        etiqueta: o.etiqueta,
        etiquetaSecundaria: null,
        /*
          Por defecto la materia, que es el caso de casi todos estos tests. Se
          puede pisar: desde la Enmienda 6 **la ruta decide qué dibuja la
          ventana**, así que una ruta que el registro no conoce es la única
          forma de ejercitar el caso «sin vista».
        */
        ruta: o.ruta ?? `/materia?cursada=${o.id}`,
        abiertoEn: `2026-09-10T0${i}:00:00.000Z`,
        visitadoEn: `2026-09-10T0${i}:00:00.000Z`,
      })),
      activo: null,
    }),
  );
}

/** El nombre que la pantalla declara con `useMigaDelObjeto`, como lo pasa el Shell. */
let nombreEnPantalla: string | null = null;

function Montado() {
  return (
    <ProveedorDeEspacioDeTrabajo nombreEnPantalla={nombreEnPantalla}>
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

/**
 * Montar sin nada guardado: no hay barra que esperar. Los controles aparecen
 * recién con la memoria leída, así que cada test los busca con `findBy`.
 */
async function montarVacio() {
  const utils = render(<Montado />);
  await act(async () => {});
  return utils;
}

beforeEach(() => {
  window.localStorage.clear();
  push.mockClear();
  pedir.mockReset();
  pedir.mockResolvedValue({ estado: "ERROR" });
  rutaActual = "/hoy";
  nombreEnPantalla = null;
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
 * El semáforo de la pantalla — [ADR-088](../docs/decisions.md#adr-088),
 * Enmienda 7: minimizar y achicar, arriba a la derecha, **sin cruz**, y sólo en
 * las pantallas que son de un objeto.
 */
describe("los controles de la pantalla", () => {
  it("en la pantalla de una materia aparecen, **aunque no esté guardada**", async () => {
    rutaActual = "/materia?cursada=ce-1";
    nombreEnPantalla = "Álgebra";
    await montarVacio();

    const grupo = await screen.findByRole("group", { name: "Controles de esta ventana" });
    expect(within(grupo).getByRole("button", { name: "Minimizar: Álgebra" })).toBeInTheDocument();
    expect(within(grupo).getByRole("button", { name: "Restaurar el tamaño: Álgebra" })).toBeInTheDocument();
    // Entrar no guarda nada: no hay barra.
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  /**
   * ⚠️ **Sin cruz.** La pantalla completa no se cierra: se sale de ella. Cerrar
   * es sacar la ficha de la barra, y eso se hace en la ficha.
   */
  it("no hay cruz en la pantalla completa", async () => {
    rutaActual = "/materia?cursada=ce-1";
    nombreEnPantalla = "Álgebra";
    await montarVacio();

    const grupo = await screen.findByRole("group", { name: "Controles de esta ventana" });
    expect(within(grupo).queryByRole("button", { name: /Cerrar/ })).not.toBeInTheDocument();
    expect(within(grupo).getAllByRole("button")).toHaveLength(2);
  });

  it("en una sección del menú no hay controles", async () => {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    for (const ruta of ["/hoy", "/materias", "/progreso", "/formacion"]) {
      rutaActual = ruta;
      const { unmount } = await montar();
      expect(screen.queryByRole("group", { name: "Controles de esta ventana" }), ruta).not.toBeInTheDocument();
      unmount();
    }
  });

  it("minimizar la guarda en la barra y lleva a Hoy", async () => {
    rutaActual = "/materia?cursada=ce-1";
    nombreEnPantalla = "Álgebra";
    await montarVacio();

    fireEvent.click(await screen.findByRole("button", { name: "Minimizar: Álgebra" }));
    expect(push).toHaveBeenCalledWith("/hoy");
    expect(await screen.findByRole("tab", { name: /Álgebra/ })).toBeInTheDocument();
  });

  it("achicar la guarda y la vuelve ventana sobre Materias", async () => {
    rutaActual = "/materia?cursada=ce-1";
    nombreEnPantalla = "Álgebra";
    await montarVacio();

    fireEvent.click(await screen.findByRole("button", { name: "Restaurar el tamaño: Álgebra" }));
    expect(push).toHaveBeenCalledWith("/materias?abierto=materia%3Ace-1");
    expect(await screen.findByRole("tab", { name: /Álgebra/ })).toBeInTheDocument();
  });

  it("un video de Formación se achica sobre Formación", async () => {
    rutaActual = "/formacion?pieza=p-3";
    nombreEnPantalla = "Tengo mucho para estudiar";
    await montarVacio();

    fireEvent.click(
      await screen.findByRole("button", { name: "Restaurar el tamaño: Tengo mucho para estudiar" }),
    );
    expect(push).toHaveBeenCalledWith("/formacion?abierto=formacion%3Ap-3");
  });

  /**
   * ⚠️ **Guardada, manda la guardada.** Volviendo desde su ventana, la pantalla
   * todavía no declaró su nombre; sin esto los controles parpadearían.
   */
  it("si ya está en la barra, los controles están aunque la pantalla no se haya nombrado", async () => {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    rutaActual = "/materia?cursada=ce-1";
    await montar();
    expect(screen.getByRole("button", { name: "Minimizar: Álgebra" })).toBeInTheDocument();
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
    /*
      ⚠️ **Sobre `Hoy`, y no sobre la materia misma.** Desde la Enmienda 6 una
      ventana **no se dibuja encima de su propia superficie** —ver el bloque de
      abajo—, así que `/materia?cursada=ce-1&abierto=materia:ce-1` no tiene
      ventana que mirarle el color: tiene la materia entera.
    */
    rutaActual = "/hoy?abierto=materia:ce-1";
    await montar();

    const cabecera = screen.getByRole("dialog").querySelector("header") as HTMLElement;
    expect(cabecera).not.toBeNull();
    /*
      Desde ADR-097 el color es un token por tema (`var(--materia-N)`), y es el
      mismo token que devuelve la función del índice. jsdom no desarma un
      shorthand con `var()` en sus partes, así que se lee el estilo escrito.
    */
    expect(cabecera.getAttribute("style")).toContain(`3px solid ${colorDeMateria("ce-1")}`);
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

});

describe("la ventana dibuja la superficie, no una versión propia", () => {
  /**
   * ⚠️ **Cambió con la Enmienda 6, y lo decidió el owner.**
   *
   * Hasta la Enmienda 5 la ventana aclaraba al pie *"acá sólo se consulta"* y
   * dibujaba una versión reducida de `UX02`. Ahora monta **el mismo componente
   * que la ruta**, con sus CTAs vivas; la aclaración se retiró porque era falsa.
   *
   * Lo que este test fija es que no vuelva a haber dos versiones: el panel no
   * importa ninguna pantalla de `components/screens/` por su cuenta.
   */
  it("no tiene una versión propia de ninguna pantalla", () => {
    const panel = readFileSync(
      resolve(process.cwd(), "components/shell/panel-de-objeto.tsx"),
      "utf8",
    );
    expect(panel).not.toMatch(/from "@\/components\/screens\//);
    expect(panel).toMatch(/VISTA_POR_CAMINO/);
  });

  /**
   * ⚠️ **Expandir reemplaza a «Ver como página»** — Enmienda 7. Eran dos
   * controles que terminaban mostrando lo mismo.
   */
  it("expandir lleva a la pantalla del objeto, y ya no hay «Ver como página»", async () => {
    sembrar([{ tipo: "unidad", id: "u1", etiqueta: "Unidad 1" }]);
    rutaActual = "/hoy?abierto=unidad:u1";
    await montar();

    expect(screen.queryByRole("button", { name: /Ver como página/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Expandir: Unidad 1/ }));
    expect(push).toHaveBeenCalledWith("/materia?cursada=u1");
  });

  /**
   * ⚠️ **La red de seguridad de `Contenido` es eso, una red: hoy no se alcanza.**
   *
   * El panel dibuja *«Todavía no se puede ver este objeto acá»* cuando la ruta
   * del objeto no está en el registro — y el espacio de trabajo **ya descarta**
   * las rutas que la aplicación no reconoce (`validarContra`), así que para
   * llegar a ese mensaje harían falta las dos cosas a la vez: una ruta del grafo
   * **sin** vista registrada.
   *
   * Lo que corresponde probar entonces no es el mensaje: es que eso no pase.
   * Este test es lo que hace que agregar una pantalla al grafo y olvidarse de
   * registrarla rompa acá, en vez de aparecer como una ventana vacía en el
   * navegador de alguien.
   */
  it("toda ruta que la aplicación reconoce tiene su vista registrada", () => {
    for (const id of nodoIds) {
      const ruta = nodos[id].ruta;
      if (ruta === null) continue;
      expect(VISTA_POR_CAMINO[ruta], `${id} (${ruta}) no tiene vista`).toBeDefined();
    }
  });

  it("una materia que no carga degrada con su reintento, **sin inventar contenido**", async () => {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    rutaActual = "/hoy?abierto=materia:ce-1";
    await montar();

    await waitFor(() => expect(pedir).toHaveBeenCalledWith("/api/materia?cursada=ce-1"));
    expect(screen.getByRole("dialog")).not.toHaveTextContent("Álgebra II");
  });
});

/**
 * Un objeto, un lugar — [ADR-088](../docs/decisions.md#adr-088), Enmienda 6.
 *
 * Lo pidió el owner: *"si una pestaña se está mostrando atrás, no puede ser
 * abierta simultáneamente"*. Acá se prueba la mitad de integración; la regla
 * pura está en `espacio-de-trabajo.test.ts`.
 */
describe("la ventana no se dibuja encima de su propia superficie", () => {
  it("estando en la materia, su ventana no existe aunque la URL la traiga", async () => {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    rutaActual = "/materia?cursada=ce-1&abierto=materia:ce-1";
    await montar();

    // La ficha sigue en la barra: el objeto está abierto, lo que no hay es una
    // segunda copia de la misma materia flotando encima de la primera.
    expect(screen.getByRole("tab", { name: /Álgebra/ })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("las otras ventanas sí se dibujan: se saca una, no el escritorio", async () => {
    sembrar([
      { tipo: "materia", id: "ce-1", etiqueta: "Álgebra" },
      { tipo: "materia", id: "ce-2", etiqueta: "Economía" },
    ]);
    rutaActual = "/materia?cursada=ce-1&abierto=materia:ce-1,materia:ce-2";
    await montar();

    const ventanas = screen.getAllByRole("dialog");
    expect(ventanas).toHaveLength(1);
    expect(ventanas[0]).toHaveAccessibleName("Economía");
  });

  /**
   * ⚠️ **La clave sigue en la URL, y por eso vuelve.** Si el filtro borrara la
   * ventana en vez de ocultarla, minimizar la superficie dejaría al estudiante
   * con la materia en la barra y sin la ventana que tenía puesta — y nada
   * explicaría adónde se fue.
   */
  it("al minimizar la superficie, la ventana vuelve", async () => {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    rutaActual = "/materia?cursada=ce-1&abierto=materia:ce-1";
    await montar();

    const controles = within(
      screen.getByRole("group", { name: "Controles de esta ventana" }),
    );
    fireEvent.click(controles.getByRole("button", { name: "Minimizar: Álgebra" }));

    // Vuelve al origen **con su ventana puesta**, no sin ella.
    expect(push).toHaveBeenCalledWith("/hoy?abierto=materia%3Ace-1");
  });

  /**
   * ⚠️ **Cambió con la Enmienda 9.** La ficha del objeto que se está mirando
   * entero minimizaba la superficie (Enmienda 6). Ahora **no hace nada**: ya
   * está a la vista, y bajarla es el botón de minimizar.
   */
  it("tocar su ficha **no** baja la superficie — Enmienda 9", async () => {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    rutaActual = "/materia?cursada=ce-1";
    await montar();

    fireEvent.click(screen.getByRole("tab", { name: /Álgebra/ }));
    expect(push).not.toHaveBeenCalled();
  });
});

/**
 * El mosaico, del lado del DOM — Enmienda 6.
 *
 * La aritmética se prueba en `marco-de-panel.test.ts`. Acá se prueba lo que esa
 * no puede: que el gesto exista, que **no dispare dos cosas a la vez** y que se
 * pueda llegar sin mouse.
 */
describe("acomodar la ventana en media pantalla", () => {
  async function conVentana() {
    sembrar([{ tipo: "materia", id: "ce-1", etiqueta: "Álgebra" }]);
    rutaActual = "/hoy?abierto=materia:ce-1";
    await montar();
    return screen.getByRole("button", { name: /Expandir: Álgebra/ });
  }

  it("el gesto está dicho en el control, no escondido", async () => {
    const expandir = await conVentana();
    // `I-04`: el atajo se muestra dentro del control que dispara. Un gesto que
    // hay que descubrir es `P-07` al revés.
    expect(expandir).toHaveAttribute("title", expect.stringContaining("Mantené apretado"));
    expect(expandir).toHaveAttribute("aria-haspopup", "menu");
  });

  it("se llega sin mouse: `↓` con el foco puesto abre las zonas", async () => {
    const expandir = await conVentana();
    fireEvent.keyDown(expandir, { key: "ArrowDown" });

    const menu = screen.getByRole("menu", { name: "Acomodar en la pantalla" });
    expect(within(menu).getByRole("menuitem", { name: "Mitad izquierda" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Mitad derecha" })).toBeInTheDocument();
  });

  it("elegir una zona la manda ahí, y el control pasa a decir «Restaurar»", async () => {
    const expandir = await conVentana();
    fireEvent.keyDown(expandir, { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("menuitem", { name: "Mitad izquierda" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Restaurar el tamaño: Álgebra/ })).toBeInTheDocument(),
    );
    // Media pantalla: el ancho de la ventana es la mitad del área utilizable.
    const ventana = screen.getByRole("dialog");
    expect(Number.parseFloat(ventana.style.width)).toBeCloseTo(
      areaDe({ ancho: window.innerWidth, alto: window.innerHeight }).ancho / 2,
      3,
    );
  });

  /**
   * ⚠️ **Desde una zona, el control restaura y no va a la página.** Si expandir
   * navegara siempre, no habría forma de sacar una ventana del mosaico sin
   * arrastrarla.
   */
  it("en una zona, «Restaurar» la saca del mosaico sin navegar", async () => {
    const expandir = await conVentana();
    fireEvent.keyDown(expandir, { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("menuitem", { name: "Mitad izquierda" }));

    const restaurar = await screen.findByRole("button", { name: /Restaurar el tamaño: Álgebra/ });
    fireEvent.click(restaurar);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Expandir: Álgebra/ })).toBeInTheDocument(),
    );
    expect(push).not.toHaveBeenCalled();
  });

  /**
   * ⚠️ **El clic de soltar no cuenta cuando el long-press ya disparó.**
   *
   * Es un defecto que se ve enseguida y se explica mal: mantener apretado abría
   * el menú **y al soltar expandía la ventana**, así que el menú quedaba
   * flotando sobre algo que ya había hecho la otra cosa.
   */
  it("mantener apretado abre el menú y NO expande al soltar", async () => {
    /*
      ⚠️ **El reloj falso se enciende DESPUÉS de montar.** Con los timers falsos
      puestos desde el arranque, el `waitFor` de `montar` no avanza nunca —la
      hidratación del espacio de trabajo espera una promesa— y el test se
      cuelga cinco segundos en vez de probar nada.
    */
    const expandir = await conVentana();
    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(expandir);
      // `act` porque el que abre el menú es un `setState` de adentro del
      // `setTimeout`: sin él React no vuelve a renderizar y el menú no existe.
      act(() => void vi.advanceTimersByTime(600));
      fireEvent.pointerUp(expandir);
      fireEvent.click(expandir);

      expect(screen.getByRole("menu", { name: "Acomodar en la pantalla" })).toBeInTheDocument();
      // Sigue diciendo «Expandir», y no navegó a la materia.
      expect(screen.getByRole("button", { name: /Expandir: Álgebra/ })).toBeInTheDocument();
      expect(push).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
