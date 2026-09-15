import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ESCENARIOS_DE_URL } from "@/app/demo/plan-vivo-spike-v3/_lab/estado";
import { ID } from "@/app/demo/plan-vivo-spike-v3/_lab/fixture";
import { HORA_INICIO } from "@/app/demo/plan-vivo-spike-v3/_lab/formato";
import { LabPlanVivoV3 } from "@/app/demo/plan-vivo-spike-v3/_lab/lab-v3";

/**
 * 🧪 **Laboratorio descartable «Mi Plan vivo» V3** — la pantalla.
 *
 * Lo innegociable de la interacción: un solo «Ahora», lo fijo sin arrastre, soltar
 * que ubica o bloquea con motivo, advertencias que dejan seguir, compromisos que no
 * se mueven sin confirmar, simulación que no toca el plan real y un Gantt que sólo
 * cambia al simular. Y ningún pedido a la red.
 */

let fetchEspia: ReturnType<typeof vi.fn>;
let consultas: Record<string, boolean> = {};

beforeEach(() => {
  fetchEspia = vi.fn();
  vi.stubGlobal("fetch", fetchEspia);
  consultas = {};
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: !!consultas[q], media: q, addEventListener: () => {}, removeEventListener: () => {} }));
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
});
afterEach(() => {
  expect(fetchEspia).not.toHaveBeenCalled();
  cleanup();
  vi.unstubAllGlobals();
});

const abrir = (escenario: string | null = null) => render(<LabPlanVivoV3 escenario={escenario} />);
const $ = (c: ParentNode, sel: string) => c.querySelector<HTMLElement>(sel);
const $$ = (c: ParentNode, sel: string) => Array.from(c.querySelectorAll<HTMLElement>(sel));
const bloque = (c: HTMLElement, clave: string) => $(c, `[data-calendario] [data-lab-clave="${clave}"]`);
const dialogo = () => document.querySelector<HTMLElement>("[data-dialogo]");
const boton = (c: HTMLElement, nombre: RegExp | string) => within(c).getByRole("button", { name: nombre });
const lectura = (c: HTMLElement, dato: string) => $(c, `[data-lectura-dato="${dato}"] dd`)!.textContent;
const filaGantt = (c: HTMLElement, tema: string) => $(c, `[data-gantt-tema="${tema}"]`)!;
const PX = 48;
const yDe = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return ((h - HORA_INICIO) * 60 + m) * (PX / 60);
};

/** Arrastra desde un elemento y suelta en un día y hora. jsdom mide todo en cero, así que `clientY` es la hora. */
function arrastrar(origen: HTMLElement, c: HTMLElement, fecha: string, hhmm: string) {
  const columna = $(c, `[data-columna="${fecha}"]`)!;
  // jsdom no tiene DragEvent: un MouseEvent lleva clientY, y React lo lee igual.
  const disparar = (el: HTMLElement, tipo: string, clientY: number) => {
    const ev = new MouseEvent(tipo, { bubbles: true, cancelable: true, clientY });
    Object.defineProperty(ev, "dataTransfer", { value: { setData: () => {}, getData: () => "" } });
    act(() => {
      el.dispatchEvent(ev);
    });
  };
  disparar(origen, "dragstart", 0);
  disparar(columna, "dragover", yDe(hhmm));
  disparar(columna, "drop", yDe(hhmm));
}
const cartaDe = (c: HTMLElement, id: string) => $(c, `[data-bandeja-item="${id}"]`)!;

describe("El calendario es la única vista temporal", () => {
  it("no hay selector Plan | Calendario, y sí Plan real | Escenario y los dos modos", () => {
    const { container: c } = abrir();
    expect(within(c).queryByRole("button", { name: /^Calendario$/ })).toBeNull();
    expect($(c, "[data-plano-boton=REAL]")).toBeTruthy();
    expect($(c, "[data-plano-boton=ESCENARIO]")).toBeTruthy();
    expect(boton(c, "Modo limpio")).toBeTruthy();
    expect(boton(c, "Explicar movimientos")).toBeTruthy();
    expect(boton(c, "Reajustar disponibilidad")).toBeTruthy();
  });

  it("hay un solo «Ahora», en el día actual", () => {
    const { container: c } = abrir();
    expect($$(c, "[data-ahora]")).toHaveLength(1);
    expect(c.textContent!.match(/Ahora ·/g)).toHaveLength(1);
    expect($(c, "[data-ahora]")!.closest("[data-columna]")!.getAttribute("data-columna")).toBe("2026-09-15");
  });

  it("el alto de un bloque es su duración probable", () => {
    const { container: c } = abrir();
    expect(bloque(c, ID.CLASE_ANA_MIE)!.style.height).toBe(`${2 * PX}px`);
    expect(bloque(c, ID.COMPROMISO_U4)!.style.height).toBe(`${PX}px`);
  });

  it("lo pasado aparece donde ocurrió y no en la bandeja", () => {
    const { container: c } = abrir();
    expect(bloque(c, ID.REG_LIM_TEORIA)!.closest("[data-columna]")!.getAttribute("data-columna")).toBe("2026-09-14");
    expect($(c, "[data-bandeja]")!.textContent).not.toContain("Leer teoría de Límites");
    expect(bloque(c, ID.COMPROMISO_PIPELINE)!.getAttribute("aria-label")).toContain("Compromiso incumplido");
  });

  it("todos los escenarios de URL abren sin errores", () => {
    for (const e of ESCENARIOS_DE_URL) {
      const { container, unmount } = abrir(e);
      expect($(container, "[data-calendario]"), e).toBeTruthy();
      unmount();
    }
  });
});

describe("Lo fijo no se arrastra; lo propuesto sí", () => {
  it("clases, evaluaciones e historia no son arrastrables; una sugerencia y un compromiso futuro sí", () => {
    const { container: c } = abrir("ubicacion");
    for (const clave of [ID.CLASE_ANA_MIE, ID.PARCIAL, ID.ENTREGA_BD, ID.REG_LIM_TEORIA, ID.COMPROMISO_PIPELINE]) expect(bloque(c, clave)!.getAttribute("draggable"), clave).toBe("false");
    expect(bloque(c, `${ID.LIMITES}#sugerida`)!.getAttribute("draggable")).toBe("true");
    expect(bloque(c, ID.COMPROMISO_U4)!.getAttribute("draggable")).toBe("true");
  });

  it("soltar una clase en otro lado no hace nada", () => {
    const { container: c } = abrir();
    arrastrar(bloque(c, ID.CLASE_ANA_MIE)!, c, "2026-09-18", "14:00");
    expect(dialogo()).toBeNull();
    expect(bloque(c, ID.CLASE_ANA_MIE)!.closest("[data-columna]")!.getAttribute("data-columna")).toBe("2026-09-16");
  });

  it("un Focus en curso no se arrastra", () => {
    const { container: c } = abrir("reloj");
    const focus = $(c, '[data-calendario] [data-tipo="FOCUS"]')!;
    expect(focus.getAttribute("draggable")).toBe("false");
    expect(focus.getAttribute("aria-label")).toContain("Focus en curso");
  });
});

describe("Ubicar", () => {
  it("clic selecciona y muestra la sugerencia, sin simular ni ubicar", () => {
    const { container: c } = abrir();
    fireEvent.click(within(cartaDe(c, ID.LIMITES)).getByRole("button", { name: /Resolver Práctica 2 de Límites/ }));
    expect($(c, "[data-inspector]")!.getAttribute("data-seleccion")).toBe(ID.LIMITES);
    expect($(c, "[data-sugerencia]")!.textContent).toContain("Te conviene ubicarla acá porque entra completa, ocurre antes de la clase de Derivadas y conserva");
    expect(bloque(c, `${ID.LIMITES}#sugerida`)).toBeTruthy();
    expect($(c, "[data-escenario]")).toBeNull();
  });

  it("aceptar el horario sugerido deja una propuesta ubicada: no compromiso, mismo pendiente, mismo Gantt", () => {
    const { container: c } = abrir("ubicacion");
    const gantt = $(c, "[data-gantt]")!.innerHTML;
    const pendiente = lectura(c, "pendiente");
    fireEvent.click(boton($(c, "[data-inspector]")!, /Aceptar horario sugerido/));
    const b = bloque(c, ID.LIMITES)!;
    expect(b.dataset.ubicacion).toBe("ELEGIDA");
    expect(b.dataset.tipo).toBe("PROPUESTA");
    expect(lectura(c, "pendiente")).toBe(pendiente);
    expect($(c, "[data-gantt]")!.innerHTML).toBe(gantt);
    expect(boton($(c, "[data-inspector]")!, /Comprometerme/)).toBeTruthy();
    expect($(c, "[data-anuncio]")!.textContent).toContain("Sigue siendo una propuesta");
  });

  it("arrastrar desde la bandeja a un hueco válido ubica sin preguntar", () => {
    const { container: c } = abrir();
    arrastrar(cartaDe(c, ID.LIMITES), c, "2026-09-15", "19:00");
    expect(dialogo()).toBeNull();
    expect(bloque(c, ID.LIMITES)!.closest("[data-columna]")!.getAttribute("data-columna")).toBe("2026-09-15");
    expect(cartaDe(c, ID.LIMITES).textContent).toContain("todavía no es compromiso");
  });

  it("Elegir horario es la alternativa accesible al arrastre", () => {
    const { container: c } = abrir();
    fireEvent.click(within(cartaDe(c, ID.CINEMATICA)).getByRole("button", { name: /Elegir horario/ }));
    const d = dialogo()!;
    fireEvent.change(within(d).getByLabelText("Día"), { target: { value: "2026-09-19" } });
    fireEvent.change(within(d).getByLabelText("Hora"), { target: { value: String(10 * 60) } });
    expect($(d, "[data-validacion-elegir]")!.textContent).toContain("Entra completa");
    fireEvent.click(boton(d, "Ubicar acá"));
    expect(bloque(c, ID.CINEMATICA)!.closest("[data-columna]")!.getAttribute("data-columna")).toBe("2026-09-19");
  });

  it("encima de una clase: conflicto duro con motivo y alternativas; no se ubica", () => {
    const { container: c } = abrir();
    arrastrar(cartaDe(c, ID.LIMITES), c, "2026-09-16", "14:00");
    const d = dialogo()!;
    expect(d.textContent).toContain("Esta acción no puede quedarse acá");
    expect($(d, "[role=alert]")!.textContent).toContain("Se superpone con la clase de Análisis Matemático I");
    expect(within(d).queryByRole("button", { name: /igual/ })).toBeNull();
    expect(bloque(c, ID.LIMITES)).toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(dialogo()).toBeNull();
  });

  it("una menos prioritaria en el lugar crítico avisa, y Ubicar igual la ubica", () => {
    const { container: c } = abrir();
    arrastrar(cartaDe(c, ID.ECONOMIA_U2), c, "2026-09-15", "19:00");
    const d = dialogo()!;
    expect(d.textContent).toContain("Hay una acción más prioritaria");
    expect(d.textContent).toContain("Si ubicás Economía el martes a las 19:00, Límites pierde el último bloque completo antes de la clase de Derivadas.");
    expect($(c, "[data-vista-previa]")).toBeTruthy();
    fireEvent.click(boton(d, "Ubicar igual"));
    expect(dialogo()).toBeNull();
    expect(bloque(c, ID.ECONOMIA_U2)!.dataset.ubicacion).toBe("ELEGIDA");
  });

  it("Volver y revisar no ubica y lleva a la acción afectada", () => {
    const { container: c } = abrir("prioridad");
    fireEvent.click(boton(dialogo()!, "Volver y revisar"));
    expect(bloque(c, ID.ECONOMIA_U2)).toBeNull();
    expect($(c, "[data-inspector]")!.getAttribute("data-seleccion")).toBe(ID.LIMITES);
  });

  it("misma prioridad se reordena sin advertencia", () => {
    const { container: c } = abrir();
    arrastrar(cartaDe(c, ID.REFUERZO_LIMITES), c, "2026-09-17", "19:00");
    expect(dialogo()).toBeNull();
    expect(bloque(c, ID.REFUERZO_LIMITES)!.dataset.ubicacion).toBe("ELEGIDA");
  });
});

describe("Compromisos", () => {
  it("Comprometerme convierte la propuesta en compromiso: sale de la bandeja, no cambia progreso ni Gantt", () => {
    const { container: c } = abrir("ubicacion");
    fireEvent.click(boton($(c, "[data-inspector]")!, /Aceptar horario sugerido/));
    const gantt = $(c, "[data-gantt]")!.innerHTML;
    const pendiente = lectura(c, "pendiente");
    fireEvent.click(boton($(c, "[data-inspector]")!, /Comprometerme/));
    const d = dialogo()!;
    expect(d.textContent).toContain("fotografía legible de los ejercicios 1 a 8");
    fireEvent.click(boton(d, "Confirmar compromiso"));
    const b = bloque(c, `COM-LOCAL-${ID.LIMITES}`)!;
    expect(b.dataset.tipo).toBe("COMPROMISO");
    expect(b.dataset.estado).toBe("CONFIRMADO");
    expect(cartaDe(c, ID.LIMITES)).toBeNull();
    expect(lectura(c, "pendiente")).toBe(pendiente);
    expect($(c, "[data-gantt]")!.innerHTML).toBe(gantt);
  });

  it("arrastrar un compromiso abre la renegociación, y cancelar conserva el horario original", () => {
    const { container: c } = abrir();
    const antes = bloque(c, ID.COMPROMISO_U4)!.style.top;
    arrastrar(bloque(c, ID.COMPROMISO_U4)!, c, "2026-09-18", "14:00");
    const d = dialogo()!;
    expect(d.textContent).toContain("Cambiar horario del compromiso");
    expect($(d, "[data-antes]")!.textContent).toContain("jueves 17, 15:00–16:00");
    expect($(d, "[data-despues]")!.textContent).toContain("viernes 18, 14:00–15:00");
    fireEvent.click(boton(d, "Cancelar"));
    expect(bloque(c, ID.COMPROMISO_U4)!.closest("[data-columna]")!.getAttribute("data-columna")).toBe("2026-09-17");
    expect(bloque(c, ID.COMPROMISO_U4)!.style.top).toBe(antes);
  });

  it("confirmar la renegociación lo mueve y lo anota", () => {
    const { container: c } = abrir("renegociacion");
    fireEvent.click(boton(dialogo()!, "Cambiar horario"));
    expect(bloque(c, ID.COMPROMISO_U4)!.closest("[data-columna]")!.getAttribute("data-columna")).toBe("2026-09-18");
    expect($(c, "[data-bitacora]")!.textContent).toContain("Cambiaste el horario");
  });
});

describe("Simulación", () => {
  it("simular pasa al escenario con aviso y no toca el plan real", () => {
    const { container: c } = abrir("ubicacion");
    const gantt = $(c, "[data-gantt]")!.innerHTML;
    fireEvent.click(boton($(c, "[data-inspector]")!, /Simular impacto/));
    expect($(c, "[data-escenario]")!.textContent).toContain("Esto es una simulación. No modifica tu plan real.");
    expect(bloque(c, `SIM-${ID.LIMITES}`)!.getAttribute("aria-label")).toContain("Simulado · paso 1");
    expect($(c, "[data-gantt]")!.innerHTML).not.toBe(gantt);
    expect(filaGantt(c, "TEM-V3-ANA-2").dataset.etiqueta).toBe("Simulado · 2 de 2");

    fireEvent.click($(c, "[data-plano-boton=REAL]")!);
    expect(bloque(c, `SIM-${ID.LIMITES}`)).toBeNull();
    expect(filaGantt(c, "TEM-V3-ANA-2").dataset.etiqueta).toBe("Recorrido registrado · 1 de 2");
    expect($(c, "[data-gantt]")!.innerHTML).toBe(gantt);
  });

  it("sin el prerrequisito, ofrece simularlo primero", () => {
    const { container: c } = abrir();
    fireEvent.click(within(cartaDe(c, ID.PRACTICA_DERIVADAS)).getByRole("button", { name: /Simular impacto/ }));
    fireEvent.click(boton(dialogo()!, /Simular primero Límites/));
    expect($$(c, "[data-paso]").map((x) => x.dataset.paso)).toEqual([ID.LIMITES]);
  });

  it("acumula hasta cinco, deshace el último y reinicia", () => {
    const { container: c } = abrir();
    for (const id of [ID.LIMITES, ID.TEORIA_DERIVADAS, ID.PRACTICA_DERIVADAS, ID.CINEMATICA, ID.PIPELINE]) fireEvent.click(within(cartaDe(c, id)).getByRole("button", { name: /Simular impacto/ }));
    expect($$(c, "[data-paso]")).toHaveLength(5);
    expect($(c, "[data-contador-pasos]")!.textContent).toBe("5 de 5");
    fireEvent.click(within(cartaDe(c, ID.ECONOMIA_U2)).getByRole("button", { name: /Simular impacto/ }));
    expect(dialogo()!.textContent).toContain("límite del laboratorio");
    fireEvent.click(boton(dialogo()!, "Entendido"));
    expect($$(c, "[data-paso]")).toHaveLength(5);
    fireEvent.click(boton(c, /Deshacer último paso/));
    expect($$(c, "[data-paso]").map((x) => x.dataset.paso)).toEqual([ID.LIMITES, ID.TEORIA_DERIVADAS, ID.PRACTICA_DERIVADAS, ID.CINEMATICA]);
    fireEvent.click(boton(c, /Reiniciar escenario/));
    expect($$(c, "[data-paso]")).toHaveLength(0);
  });

  it("el Gantt se mueve de lugar: Derivadas termina antes en el escenario", () => {
    const { container: c } = abrir();
    const fin = Number(filaGantt(c, "TEM-V3-ANA-3").dataset.trabajoFin);
    fireEvent.click(within(cartaDe(c, ID.LIMITES)).getByRole("button", { name: /Simular impacto/ }));
    expect(Number(filaGantt(c, "TEM-V3-ANA-3").dataset.trabajoFin)).toBeLessThan(fin);
    expect(filaGantt(c, "TEM-V3-ANA-3").textContent).toContain("Desbloqueada");
  });

  it("modo limpio resume en una frase; explicar muestra la secuencia y las huellas", () => {
    const { container: c } = abrir("simulacion");
    expect($$(c, "[data-explicacion] li").map((l) => l.dataset.linea)).toEqual(["SIMULADA", "ANTES", "LIBERA", "ADELANTA", "MARGEN", "MARGEN", "GANTT"]);
    expect($(c, "[data-huella=ANTES]")!.textContent).toContain("Antes estaba acá");
    expect($(c, "[data-huella=LIBERA]")!.textContent).toContain("Este espacio se libera");
    fireEvent.click(boton(c, "Modo limpio"));
    expect($(c, "[data-explicacion]")).toBeNull();
    expect($(c, "[data-huella=ANTES]")).toBeNull();
    expect($(c, "[data-resumen-limpio]")!.textContent).toContain("Práctica de Derivadas se adelanta al jueves 19:45");
  });
});

describe("Reloj y disponibilidad", () => {
  it("adelantar el reloj deja el compromiso incumplido en su lugar y ofrece Reorganizar sin cortar", () => {
    const { container: c } = abrir();
    fireEvent.click($(c, "[data-adelantar-reloj]")!);
    expect(c.textContent).toContain("Ahora · 19:10");
    expect(bloque(c, ID.COMPROMISO_U4)!.dataset.estado).toBe("INCUMPLIDO");
    fireEvent.click($(c, "[data-reorganizar-boton]")!);
    fireEvent.click(boton(dialogo()!, "Ubicar estas propuestas"));
    expect(bloque(c, ID.COMPROMISO_U4)!.dataset.estado).toBe("INCUMPLIDO");
    expect(bloque(c, ID.RESUMEN_U4)!.dataset.ubicacion).toBe("ELEGIDA");
  });

  it("reajustar disponibilidad muestra antes de aplicar y aplica sólo al laboratorio", () => {
    const { container: c } = abrir("disponibilidad");
    const d = dialogo()!;
    expect($(d, "[data-capacidad]")!.textContent).toBe("Tiempo disponible: 14 h → 19 h");
    fireEvent.click(boton(d, "Aplicar al laboratorio"));
    expect(lectura(c, "disponible")).toBe("19 h");
  });
});

describe("Accesibilidad y responsive", () => {
  it("orden del documento: controles → bandeja → calendario → inspector → Gantt", () => {
    const { container: c } = abrir();
    const orden = ["[role=toolbar]", "[data-bandeja]", "[data-calendario]", "[data-inspector]", "[data-impacto]"].map((s) => $(c, s)!);
    for (let i = 1; i < orden.length; i++) expect(orden[i - 1].compareDocumentPosition(orden[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("Enter sobre un bloque lo abre en el inspector", () => {
    const { container: c } = abrir();
    const b = bloque(c, ID.PARCIAL)!;
    b.focus();
    fireEvent.click(b);
    expect($(c, "[data-inspector]")!.textContent).toContain("Fecha fija");
    expect(b.tagName).toBe("BUTTON");
  });

  it("cada bloque tiene su texto completo y su movilidad en aria-label", () => {
    const { container: c } = abrir();
    for (const b of $$(c, "[data-calendario] [data-lab-clave]")) expect(b.getAttribute("aria-label")!.length).toBeGreaterThan(30);
  });

  it("los mensajes de conflicto y simulación se anuncian", () => {
    const { container: c } = abrir();
    expect($(c, "[data-anuncio]")!.getAttribute("aria-live")).toBe("polite");
    fireEvent.click(within(cartaDe(c, ID.LIMITES)).getByRole("button", { name: /Simular impacto/ }));
    expect($(c, "[data-anuncio]")!.textContent).toContain("No modifica tu plan real");
  });

  it("con prefers-reduced-motion la página lo declara y la duración es cero", () => {
    consultas["(prefers-reduced-motion: reduce)"] = true;
    const { container: c } = abrir();
    expect($(c, "[data-lab-v3]")!.dataset.movimiento).toBe("reducido");
    const css = readFileSync(resolve(process.cwd(), "app/demo/plan-vivo-spike-v3/_lab/lab.module.css"), "utf8");
    expect(css).toMatch(/\[data-movimiento="reducido"\]\s*\{\s*--lab-duracion:\s*0ms/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*--lab-duracion: 0ms/);
  });

  it("a 390 px el calendario muestra un día, con selector, y la bandeja es una lista", () => {
    consultas["(max-width: 700px)"] = true;
    consultas["(max-width: 1180px)"] = true;
    const { container: c } = abrir();
    expect($(c, "[data-dias]")!.dataset.dias).toBe("1");
    expect($$(c, "[data-columna]")).toHaveLength(1);
    expect(within(c).getByRole("group", { name: "Día que se muestra" })).toBeTruthy();
    act(() => {
      fireEvent.click(within(c).getByRole("button", { name: "jue 17" }));
    });
    expect($(c, "[data-columna]")!.dataset.columna).toBe("2026-09-17");
  });

  it("el CSS no deja scroll horizontal de página en móvil: gutter de 16 px, una columna y Gantt con scroll propio", () => {
    const css = readFileSync(resolve(process.cwd(), "app/demo/plan-vivo-spike-v3/_lab/lab.module.css"), "utf8");
    const movil = css.slice(css.indexOf("@media (max-width: 700px)"));
    expect(movil).toMatch(/padding: 10px 16px 72px/);
    expect(movil).toMatch(/--lab-columnas: 1/);
    expect(movil).toMatch(/\.bandejaLista \{\s*flex-direction: column/);
    expect(css).toMatch(/\.ganttScroll \{\s*overflow-x: auto/);
    expect(css).toMatch(/\.carta \{\s*position: relative/);
  });
});
