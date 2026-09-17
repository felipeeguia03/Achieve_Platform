import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ID } from "@/app/demo/plan-vivo-spike/_spike/fixture";
import { SpikePlanVivo } from "@/app/demo/plan-vivo-spike/_spike/spike-plan-vivo";

/**
 * 🧪 **Spike descartable «Mi Plan vivo»** — la pantalla.
 *
 * Se prueba lo que el pedido declaró innegociable de la interacción: simular no
 * escribe ni pide nada, la simulación se abre y se cierra por mouse, foco, clic y
 * Escape, lo institucional no se mueve, y Plan y Calendario dicen lo mismo del
 * mismo compromiso.
 */

const escenario = (c: HTMLElement) => c.querySelector<HTMLElement>("[data-escenario]")!.dataset.escenario;
const celdaDe = (c: HTMLElement, id: string) =>
  c.querySelector<HTMLElement>(`[data-spike-id="${id}"]`)?.closest<HTMLElement>("[data-celda]")?.dataset.celda ?? null;
const tarjeta = (c: HTMLElement) => c.querySelector<HTMLElement>("[data-tarjeta-accion]")!;

/** jsdom no tiene `PointerEvent`: el tipo de puntero se pega a mano. React arma `onPointerEnter` desde `pointerover`. */
function puntero(el: HTMLElement, tipo: "pointerover" | "pointerout", pointerType: "mouse" | "touch") {
  const ev = new MouseEvent(tipo, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, "pointerType", { value: pointerType });
  act(() => {
    el.dispatchEvent(ev);
  });
}

let fetchEspia: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchEspia = vi.fn();
  vi.stubGlobal("fetch", fetchEspia);
});
afterEach(() => vi.unstubAllGlobals());

describe("El plan actual", () => {
  it("arranca en el lunes 17:30, sin simulación, con el encabezado narrativo y el rótulo de laboratorio", () => {
    const { container } = render(<SpikePlanVivo escenario={null} vista={null} />);
    expect(escenario(container)).toBe("BASE");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Tu semana todavía no entra");
    expect(container).toHaveTextContent("Tenés 9 h 20 de trabajo pendiente estimado y 7 h 30 disponibles. Quedan 1 h 50 por ubicar.");
    expect(container).toHaveTextContent("Laboratorio · Datos de demostración");
    expect(container.querySelector("[data-ribete]")).toBeNull();
  });

  it("la recomendada lleva rango, confianza con fuente y evidencia esperada, sin puntaje", () => {
    const { container } = render(<SpikePlanVivo escenario={null} vista={null} />);
    const t = tarjeta(container);
    expect(t).toHaveTextContent("Resolver Práctica 2: Límites");
    expect(t).toHaveTextContent("50–65 min");
    expect(t).toHaveTextContent("media · fuente:");
    expect(t).toHaveTextContent("fotografía legible de los ejercicios resueltos");
    expect(container.textContent).not.toMatch(/\d+\s*\/\s*100/);
  });

  it("el trabajo que no entra está a la vista, en Por ubicar", () => {
    const { container } = render(<SpikePlanVivo escenario={null} vista={null} />);
    const banda = container.querySelector<HTMLElement>('[data-banda="por-ubicar"]')!;
    expect(within(banda).getByText("Resolver guía de elasticidad")).toBeInTheDocument();
  });
});

describe("Escenario 2 — simular Límites", () => {
  it("el hover del mouse la abre y al salir vuelve; con la marca permanente mientras dura", () => {
    const { container } = render(<SpikePlanVivo escenario={null} vista={null} />);
    puntero(tarjeta(container), "pointerover", "mouse");
    expect(escenario(container)).toBe("COMPLETION_SIMULATION");
    expect(container.querySelector('[data-ribete="simulacion"]')).toHaveTextContent("Simulación · Todavía no cambió tu plan");
    expect(container).toHaveTextContent("Si completás esta acción, la evidencia resulta suficiente y después se registra el progreso…");
    puntero(tarjeta(container), "pointerout", "mouse");
    expect(escenario(container)).toBe("BASE");
  });

  it("un toque no dispara el hover: fija con el clic", () => {
    const { container } = render(<SpikePlanVivo escenario={null} vista={null} />);
    puntero(tarjeta(container), "pointerover", "touch");
    expect(escenario(container)).toBe("BASE");
    fireEvent.click(tarjeta(container));
    expect(escenario(container)).toBe("COMPLETION_SIMULATION");
  });

  it("el foco la abre, Enter/clic la fija, perder el foco no la cierra y Escape sí", () => {
    const { container } = render(<SpikePlanVivo escenario={null} vista={null} />);
    act(() => tarjeta(container).focus());
    expect(escenario(container)).toBe("COMPLETION_SIMULATION");
    fireEvent.click(tarjeta(container));
    expect(tarjeta(container)).toHaveAttribute("aria-pressed", "true");
    act(() => tarjeta(container).blur());
    expect(escenario(container)).toBe("COMPLETION_SIMULATION");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(escenario(container)).toBe("BASE");
  });

  it("«Volver al plan actual» la cierra", () => {
    const { container } = render(<SpikePlanVivo escenario="simulacion" vista={null} />);
    fireEvent.click(screen.getByRole("button", { name: /Volver al plan actual/ }));
    expect(escenario(container)).toBe("BASE");
  });

  it("Derivadas se adelanta, deja huella, y clases, parcial y compromiso no se mueven", () => {
    const { container } = render(<SpikePlanVivo escenario={null} vista={null} />);
    const fijos = ["CLS-SYN-SPIKE-ANA-MIE", ID.PARCIAL, ID.COMPROMISO];
    const antes = fijos.map((id) => celdaDe(container, id));
    expect(celdaDe(container, ID.PRACTICA_DERIVADAS)).toBe("ACCIONES|2026-09-16");

    fireEvent.click(tarjeta(container));
    expect(celdaDe(container, ID.PRACTICA_DERIVADAS)).toBe("ACCIONES|2026-09-15");
    expect(container.querySelector(`[data-huella-de="${ID.PRACTICA_DERIVADAS}"]`)).not.toBeNull();
    expect(fijos.map((id) => celdaDe(container, id))).toEqual(antes);
    expect(container.querySelector(`[data-spike-id="${ID.LIMITES}"]`)).toHaveAttribute("data-estado", "PROGRESO_REGISTRADO");
    expect(container.querySelector(`[data-spike-id="${ID.LIMITES}"]`)).toHaveAttribute("data-hipotetico", "true");
    expect(container).toHaveTextContent("Margen 45 min");
  });
});

describe("Escenario 3 — cinco horas más", () => {
  it("vista previa sin guardar, aplicar sólo en el demo, y restablecer", () => {
    const { container } = render(<SpikePlanVivo escenario={null} vista={null} />);
    fireEvent.click(screen.getByRole("button", { name: /Reajustar disponibilidad/ }));
    fireEvent.click(screen.getByRole("button", { name: "Esta semana tengo 5 horas más" }));
    expect(escenario(container)).toBe("EXTRA_AVAILABILITY_PREVIEW");
    expect(container).toHaveTextContent("Vista previa · No guardada");
    expect(container).toHaveTextContent(
      "Agregar disponibilidad no reduce el trabajo académico. Le da al plan más lugares posibles para ubicarlo.",
    );
    expect(celdaDe(container, ID.COMPROMISO)).toBe("COMPROMISOS|2026-09-16");

    fireEvent.click(screen.getByRole("button", { name: "Aplicar solamente en este demo" }));
    expect(escenario(container)).toBe("EXTRA_AVAILABILITY_APPLIED");

    fireEvent.click(screen.getAllByRole("button", { name: /Restablecer fixture/ })[0]);
    expect(escenario(container)).toBe("BASE");
  });

  it("descartar vuelve al plan actual", () => {
    const { container } = render(<SpikePlanVivo escenario="disponibilidad" vista={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Descartar" }));
    expect(escenario(container)).toBe("BASE");
  });
});

describe("Escenario 4 — adelantar el reloj", () => {
  function adelantar() {
    const r = render(<SpikePlanVivo escenario={null} vista={null} />);
    fireEvent.click(screen.getByRole("button", { name: /Adelantar reloj/ }));
    fireEvent.click(screen.getByRole("button", { name: "Jueves 17 de septiembre · 19:10" }));
    return r;
  }

  it("el compromiso queda incumplido en su lugar y su trabajo pide reubicación", () => {
    const { container } = adelantar();
    expect(escenario(container)).toBe("TIME_ADVANCED_MISSED");
    const com = container.querySelector(`[data-spike-id="${ID.COMPROMISO}"]`)!;
    expect(com).toHaveAttribute("data-estado", "INCUMPLIDO");
    expect(celdaDe(container, ID.COMPROMISO)).toBe("COMPROMISOS|2026-09-16");
    expect(com).toHaveTextContent("17:00–18:00");
    const banda = container.querySelector<HTMLElement>('[data-banda="reubicar"]')!;
    expect(within(banda).getByText("Resumir Unidad 4: Jerarquía de memoria")).toBeInTheDocument();
    expect(container.querySelector("[data-reloj]")).toHaveTextContent("jueves 17 de sep · 19:10");
  });

  it("«Reorganizar sin cortar» muestra una propuesta sin confirmar, y «Ver qué pasó» separa los tres hechos", () => {
    const { container } = adelantar();
    fireEvent.click(screen.getByRole("button", { name: "Ver qué pasó" }));
    const quePaso = container.querySelector<HTMLElement>('[data-seccion="que-paso"]')!;
    expect(quePaso).toHaveTextContent("Lo que pasó");
    expect(quePaso).toHaveTextContent("Lo que sigue pendiente");
    expect(quePaso).toHaveTextContent("Lo que falta decidir");

    fireEvent.click(screen.getByRole("button", { name: "Reorganizar sin cortar" }));
    expect(escenario(container)).toBe("RESCUE_PREVIEW");
    const propuesta = container.querySelector(`[data-spike-id="${ID.TRABAJO_DEL_COMPROMISO}"]`)!;
    expect(propuesta).toHaveAttribute("data-estado", "PROPUESTA_SIN_CONFIRMAR");
    expect(propuesta).toHaveAttribute("data-hipotetico", "true");
    expect(container.querySelector(`[data-spike-id="${ID.COMPROMISO}"]`)).toHaveAttribute("data-estado", "INCUMPLIDO");
  });
});

describe("Plan y Calendario dicen lo mismo", () => {
  const detalle = (c: HTMLElement) => c.querySelector<HTMLElement>("[data-detalle-calendario]")!;

  it("el compromiso seleccionado en el plan abre en el calendario con los mismos datos", () => {
    const { container } = render(<SpikePlanVivo escenario={null} vista={null} />);
    const bloque = container.querySelector<HTMLElement>(`[data-spike-id="${ID.COMPROMISO}"]`)!;
    fireEvent.click(bloque);
    fireEvent.click(within(container.querySelector<HTMLElement>('[data-seccion="seleccion"]')!).getByRole("button", { name: /Ver en Calendario/ }));

    const d = detalle(container);
    expect(d).toHaveTextContent(ID.COMPROMISO);
    expect(d).toHaveTextContent("Arquitectura de Computadoras");
    expect(d).toHaveTextContent("Resumir Unidad 4: Jerarquía de memoria");
    expect(d).toHaveTextContent("miércoles 16 de sep");
    expect(d).toHaveTextContent("17:00–18:00");
    expect(d).toHaveTextContent("1 h");
    expect(d.querySelector("[data-estado-calendario]")).toHaveTextContent("Confirmado");
    expect(bloque).toHaveTextContent("17:00–18:00");
  });

  it("si el reloj lo incumple, el calendario también lo dice", () => {
    const { container } = render(<SpikePlanVivo escenario="reloj" vista="calendario" />);
    expect(detalle(container).querySelector("[data-estado-calendario]")).toHaveTextContent("Incumplido");
    expect(container.querySelector(`[data-cal-id="${ID.COMPROMISO}"]`)).toHaveTextContent("Incumplido");
  });
});

describe("Simular no escribe ni pide nada", () => {
  it("después de recorrer los cuatro escenarios, nadie llamó a la red", () => {
    const { container } = render(<SpikePlanVivo escenario={null} vista={null} />);
    puntero(tarjeta(container), "pointerover", "mouse");
    fireEvent.click(tarjeta(container));
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: /Reajustar disponibilidad/ }));
    fireEvent.click(screen.getByRole("button", { name: "Esta semana tengo 5 horas más" }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar solamente en este demo" }));
    fireEvent.click(screen.getAllByRole("button", { name: /Restablecer fixture/ })[0]);
    fireEvent.click(screen.getByRole("button", { name: /Adelantar reloj/ }));
    fireEvent.click(screen.getByRole("button", { name: "Jueves 17 de septiembre · 19:10" }));
    fireEvent.click(screen.getByRole("button", { name: "Reorganizar sin cortar" }));
    expect(fetchEspia).not.toHaveBeenCalled();
  });
});
