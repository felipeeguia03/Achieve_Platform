import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ID } from "@/app/demo/plan-vivo-spike-v2/_lab/fixture";
import { LabPlanVivo } from "@/app/demo/plan-vivo-spike-v2/_lab/lab-plan-vivo";

/**
 * 🧪 **Laboratorio descartable «Mi Plan vivo» V2** — la pantalla.
 *
 * Se prueba lo que el pedido declaró innegociable de la interacción: un solo
 * «Ahora», clic que selecciona sin simular, hover que previsualiza sin agregar,
 * una pila de hasta cinco que se deshace, avisos que no bloquean, lo inmóvil sin
 * controles, el plan real intacto y ningún pedido a la red.
 */

let fetchEspia: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchEspia = vi.fn();
  vi.stubGlobal("fetch", fetchEspia);
});
afterEach(() => {
  expect(fetchEspia).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

const abrir = (escenario: string | null = null, extra: { vista?: string; modo?: string } = {}) =>
  render(<LabPlanVivo escenario={escenario} vista={extra.vista ?? null} modo={extra.modo ?? null} />);

const $ = <T extends Element = HTMLElement>(c: ParentNode, sel: string) => c.querySelector<T & HTMLElement>(sel);
const bloque = (c: HTMLElement, clave: string) => $(c, `[data-plan-semanal] [data-lab-clave="${clave}"]`)!;
const celdaDe = (c: HTMLElement, clave: string) => bloque(c, clave)?.closest<HTMLElement>("[data-celda]")?.dataset.celda ?? null;
const inspector = (c: HTMLElement) => $(c, "[data-inspector]")!;
const pasos = (c: HTMLElement) => c.querySelectorAll("[data-paso]").length;
const plano = (c: HTMLElement) => $(c, "[data-plan-semanal]")!.dataset.plano;
const simularEnInspector = (c: HTMLElement, id: string) => fireEvent.click($(inspector(c), `[data-simular="${id}"]`)!);
const indicador = (c: HTMLElement, id: string) => $(c, `[data-indicador="${id}"] dd`)!.textContent;

/** jsdom no tiene `PointerEvent`: React arma `onPointerEnter` desde `pointerover`. */
function puntero(el: HTMLElement, tipo: "pointerover" | "pointerout", pointerType: "mouse" | "touch") {
  const ev = new MouseEvent(tipo, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, "pointerType", { value: pointerType });
  act(() => {
    el.dispatchEvent(ev);
  });
}

function simularConfirmando(c: HTMLElement, id: string) {
  fireEvent.click(bloque(c, id) ?? $(c, `[data-estacion="${id}"] button`)!);
  simularEnInspector(c, id);
  const igual = document.querySelector("[data-dialogo]")
    ? within(document.querySelector<HTMLElement>("[data-dialogo]")!).queryByRole("button", { name: /Simular igual|Explorar el intento igual/ })
    : null;
  if (igual) fireEvent.click(igual);
}

describe("El marcador «Ahora» y los carriles", () => {
  it("hay un solo marcador global, en la cabecera de hoy, y ninguno por fila", () => {
    const { container } = abrir();
    const ahoras = container.querySelectorAll("[data-ahora]");
    expect(ahoras).toHaveLength(1);
    expect(ahoras[0]).toHaveTextContent("Ahora · lunes 14 · 17:30");
    expect(ahoras[0].closest("[data-dia]")).toHaveAttribute("data-dia", "2026-09-14");
    expect(ahoras[0].closest("[data-celda]")).toBeNull();
    const conAhora = [...container.querySelectorAll("[data-celda]")].filter((x) => /Ahora/.test(x.textContent ?? ""));
    expect(conAhora).toEqual([]);
  });

  it("la fila se llama Trabajo académico, separa Ya ocurrió de Por venir, y disponibilidad y margen van aparte", () => {
    const { container } = abrir();
    const encabezados = [...container.querySelectorAll("[role=rowheader]")].map((x) => x.textContent);
    expect(encabezados).toEqual(["Facultad", "Compromisos", "Trabajo académico", "Disponibilidad declarada", "Margen"]);
    const hoy = $(container, '[data-celda="TRABAJO|2026-09-14"]')!;
    const texto = hoy.textContent!;
    expect(texto.indexOf("Ya ocurrió")).toBeLessThan(texto.indexOf("Resolver Guía 2"));
    expect(texto.indexOf("Por venir")).toBeGreaterThan(texto.indexOf("Resolver Práctica 1"));
    expect(texto.indexOf("Por venir")).toBeLessThan(texto.indexOf("Resolver Práctica 2"));
    expect(container).not.toHaveTextContent("Disponible y margen");
  });

  it("los indicadores dicen el horizonte y su definición", () => {
    const { container } = abrir();
    expect(container).toHaveTextContent("Trabajo pendiente esta semana");
    expect(container).toHaveTextContent("Horizonte: lunes 14 a domingo 20");
    expect(container).toHaveTextContent("entre 8 h 05 y 11 h");
    expect(indicador(container, "pendiente")).toBe("9 h 20");
    expect(indicador(container, "disponible")).toBe("7 h 30");
    expect(indicador(container, "sin-ubicar")).toBe("1 h 50");
    expect(indicador(container, "margen")).toBe("0 min");
    expect(container).not.toHaveTextContent("Trabajo pendiente estimado");
  });
});

describe("Inspector universal", () => {
  it("una propuesta futura: objetivo, prioridad, rango, confianza, evidencia, dependencias y acciones", () => {
    const { container } = abrir();
    fireEvent.click(bloque(container, ID.PRACTICA_DERIVADAS));
    const i = inspector(container);
    expect(i).toHaveAttribute("data-inspector", "WORKITEM");
    for (const texto of ["Los ejercicios 1 a 6 resueltos.", "Prioridad: Enseguida", "40–60 min · probable 45", "baja · fuente:", "fotografía de los ejercicios 1 a 6", "Resolver Práctica 2: Límites (pendiente)"])
      expect(i).toHaveTextContent(texto);
    for (const nombre of ["Simular este workitem", "Reubicar en el escenario", "Elegir cuándo"]) expect(within(i).getByRole("button", { name: nombre })).toBeInTheDocument();
  });

  it("una teoría avisa que no mueve el progreso académico por sí sola", () => {
    const { container } = abrir();
    fireEvent.click(bloque(container, ID.TEORIA_DERIVADAS));
    expect(inspector(container)).toHaveTextContent("No mueve el progreso académico por sí solo");
  });

  it("un hecho histórico: cuándo, duración real, evidencia, progreso y detalle, sin controles de movimiento", () => {
    const { container } = abrir("historico");
    const i = inspector(container);
    expect(i).toHaveAttribute("data-inspector", "HECHO");
    for (const texto of ["lunes 14 de sep, 11:30–12:30", "Sesión de Focus de 55 min", "Suficiente", "El ejercicio 4", "U3 · Memoria virtual"]) expect(i).toHaveTextContent(texto);
    expect(within(i).queryByRole("button", { name: /Reubicar|Cambiar horario|Simular|Elegir cuándo/ })).toBeNull();
    fireEvent.click(within(i).getByRole("button", { name: "Ver detalle" }));
    expect($(i, "[data-detalle-historico]")).toHaveTextContent("Memoria virtual pasó a progreso registrado");
  });

  it("una evidencia enviada sin progreso lo dice tal cual", () => {
    const { container } = abrir();
    fireEvent.click(bloque(container, ID.HECHO_ECO));
    expect($(inspector(container), "[data-sin-progreso]")).toHaveTextContent("Esta actividad todavía no modificó el progreso académico.");
  });

  it("una clase pasada: asistencia, comisión, aula, temas confirmados, notas y acciones generadas", () => {
    const { container } = abrir("clase-pasada");
    const i = inspector(container);
    for (const texto of ["Asististe", "Comisión B (simulada)", "Aula 204 (simulada)", "Temas confirmados", "ejercicio 7", "Grabación de 1 h 42"]) expect(i).toHaveTextContent(texto);
    expect(within(i).getByRole("button", { name: "Resolver Práctica 2: Límites" })).toBeInTheDocument();
    fireEvent.click(within(i).getByRole("button", { name: "Abrir registro de clase" }));
    expect($(i, "[data-registro-clase]")).toBeInTheDocument();
    expect($(i, "[data-inmovil]")).toBeInTheDocument();
    expect(within(i).queryByRole("button", { name: /Reubicar|Cambiar horario|Simular/ })).toBeNull();
  });

  it("una clase futura no presenta los temas como hechos", () => {
    const { container } = abrir("clase-futura");
    const i = inspector(container);
    expect(i).toHaveTextContent("Temas esperados");
    expect(i).toHaveTextContent("según el cronograma de la cátedra · pendiente de confirmación");
    expect(i).not.toHaveTextContent("Temas confirmados");
    expect(within(i).getByRole("button", { name: "Abrir Modo Clase" })).toBeInTheDocument();
    expect(within(i).queryByRole("button", { name: /Reubicar|Cambiar horario|Simular/ })).toBeNull();
  });

  it("la evaluación: modalidad, alcance provisional, restricciones y acciones relacionadas, sin mover", () => {
    const { container } = abrir("evaluacion");
    const i = inspector(container);
    for (const texto of ["Escrito, presencial", "provisional", "antes de las 18:00 del viernes", "Modo Examen"]) expect(i).toHaveTextContent(texto);
    expect(within(i).queryByRole("button", { name: /Reubicar|Cambiar horario|Simular/ })).toBeNull();
  });

  it("el compromiso: promesa original, cambios de horario y realizado frente a lo prometido", () => {
    const { container } = abrir();
    fireEvent.click(bloque(container, ID.COMPROMISO));
    const i = inspector(container);
    expect(i).toHaveAttribute("data-inspector", "COMPROMISO");
    for (const texto of ["Resumir Unidad 4", "miércoles 16 de sep, 17:00–18:00", "resumen de una carilla", "Promesa original", "Realizado frente a lo prometido"]) expect(i).toHaveTextContent(texto);
    expect(within(i).getByRole("button", { name: "Cambiar horario" })).toBeInTheDocument();
  });

  it("la disponibilidad: origen, trabajo que la ocupa, tiempo ocupado y margen", () => {
    const { container } = abrir();
    fireEvent.click($(container, '[data-ventana="DSP-SYN-LAB-MIE"]')!);
    const i = inspector(container);
    expect(i).toHaveAttribute("data-inspector", "DISPONIBILIDAD");
    for (const texto of ["Recurrente", "Resumir Unidad 4", "Reforzar Límites", "Tiempo ocupado", "Margen restante"]) expect(i).toHaveTextContent(texto);
  });

  it("el trabajo por ubicar dice por qué no entra", () => {
    const { container } = abrir();
    fireEvent.click(within($(container, '[data-banda="por-ubicar"]')!).getByRole("button", { name: /Resolver guía de elasticidad/ }));
    expect(inspector(container)).toHaveTextContent("Por ubicar: ninguna ventana libre dura lo que necesita.");
  });
});

describe("Selección, hover y simulación", () => {
  it("el hover previsualiza sin agregar, y al salir vuelve", () => {
    const { container } = abrir();
    const estacion = $(container, `[data-estacion="${ID.LIMITES}"]`)!;
    puntero(estacion, "pointerover", "mouse");
    expect(plano(container)).toBe("VISTA_PREVIA");
    expect(indicador(container, "pendiente")).toBe("7 h 35");
    expect(pasos(container)).toBe(0);
    puntero(estacion, "pointerout", "mouse");
    expect(plano(container)).toBe("REAL");
    expect(indicador(container, "pendiente")).toBe("9 h 20");
  });

  it("un toque no previsualiza, y Escape cierra la vista previa del foco", () => {
    const { container } = abrir();
    puntero($(container, `[data-estacion="${ID.LIMITES}"]`)!, "pointerover", "touch");
    expect(plano(container)).toBe("REAL");
    act(() => $(inspectorOProxima(container), `[data-simular="${ID.LIMITES}"]`)!.focus());
    expect(plano(container)).toBe("VISTA_PREVIA");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(plano(container)).toBe("REAL");
  });

  it("el clic selecciona y abre el inspector, pero no simula", () => {
    const { container } = abrir();
    fireEvent.click(bloque(container, ID.LIMITES));
    expect(inspector(container)).toHaveAttribute("data-inspector", "WORKITEM");
    expect(bloque(container, ID.LIMITES)).toHaveAttribute("aria-pressed", "true");
    expect(bloque(container, ID.LIMITES)).toHaveAttribute("data-estado", "PROPUESTA");
    expect(pasos(container)).toBe(0);
  });

  it("el botón agrega el paso, pasa al escenario y lo rotula; el plan real sigue igual", () => {
    const { container } = abrir();
    fireEvent.click(bloque(container, ID.LIMITES));
    simularEnInspector(container, ID.LIMITES);
    expect(pasos(container)).toBe(1);
    expect(plano(container)).toBe("ESCENARIO");
    expect($(container, "[data-ribete]")).toHaveTextContent("Escenario hipotético · Tu plan real no cambió");
    expect(bloque(container, ID.LIMITES)).toHaveAttribute("data-estado", "SIMULADO");
    expect(bloque(container, ID.LIMITES)).toHaveTextContent("Simulado · paso 1");
    expect($(container, "[data-anuncio]")).toHaveTextContent("Paso 1 agregado al escenario");

    fireEvent.click(within($(container, "[data-segmentado=plano]")!).getByRole("button", { name: "Tu plan real" }));
    expect(bloque(container, ID.LIMITES)).toHaveAttribute("data-estado", "PROPUESTA");
    expect(indicador(container, "pendiente")).toBe("9 h 20");
  });

  it("la pila acumula, deshace, vuelve a un paso y restablece", () => {
    const { container } = abrir();
    for (const id of [ID.LIMITES, ID.TEORIA_DERIVADAS, ID.PRACTICA_DERIVADAS]) simularConfirmando(container, id);
    expect([...container.querySelectorAll("[data-paso]")].map((x) => x.textContent)).toEqual(["1. Límites", "2. Teoría de Derivadas", "3. Derivadas"]);
    expect(indicador(container, "pendiente")).toBe("6 h 05");

    fireEvent.click(screen.getByRole("button", { name: "Deshacer último" }));
    expect(pasos(container)).toBe(2);
    fireEvent.click($(container, '[data-paso="1"]')!);
    fireEvent.click(screen.getByRole("button", { name: "Volver a este paso 1" }));
    expect(pasos(container)).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Restablecer escenario" }));
    expect(pasos(container)).toBe(0);
    expect(indicador(container, "pendiente")).toBe("9 h 20");
  });

  it("con cinco pasos no se agrega un sexto y se explica por qué", () => {
    const { container } = abrir();
    for (const id of [ID.LIMITES, ID.TEORIA_DERIVADAS, ID.PRACTICA_DERIVADAS, ID.SIMULACRO, ID.ECONOMIA_U3]) simularConfirmando(container, id);
    expect(pasos(container)).toBe(5);
    expect($(container, "[data-maximo]")).toHaveTextContent("El límite existe para que el escenario siga siendo comprensible");
    fireEvent.click(bloque(container, ID.CACHE));
    const boton = $(inspector(container), `[data-simular="${ID.CACHE}"]`)!;
    expect(boton).toBeDisabled();
    expect($(inspector(container), '[data-no-simulable="MAXIMO"]')).toBeInTheDocument();
  });

  it("refrescar vuelve siempre al plan real", () => {
    const primera = abrir();
    simularConfirmando(primera.container, ID.LIMITES);
    primera.unmount();
    const { container } = abrir();
    expect(pasos(container)).toBe(0);
    expect(plano(container)).toBe("REAL");
  });
});

/** La franja de acción recomendada o el inspector: los dos tienen el botón. */
const inspectorOProxima = (c: HTMLElement) => $(c, "[data-proxima]") ?? inspector(c);

describe("Prioridad blanda", () => {
  it("igual prioridad sin dependencia: se simula sin advertencia", () => {
    const { container } = abrir();
    fireEvent.click(bloque(container, ID.TEORIA_DERIVADAS));
    simularEnInspector(container, ID.TEORIA_DERIVADAS);
    expect(document.querySelector("[data-dialogo]")).toBeNull();
    expect(pasos(container)).toBe(1);
  });

  it("menor prioridad: avisa qué posterga y su costo, no bloquea, registra el orden elegido y muestra el riesgo", () => {
    const { container } = abrir("tres-pasos");
    fireEvent.click(bloque(container, ID.ECONOMIA_U3));
    const disparador = $(inspector(container), `[data-simular="${ID.ECONOMIA_U3}"]`)!;
    act(() => disparador.focus());
    fireEvent.click(disparador);
    const dialogo = screen.getByRole("dialog", { name: "Hay trabajo más prioritario antes" });
    expect(dialogo).toHaveTextContent("Todavía quedaría Parcial de práctica.");
    expect(dialogo).toHaveTextContent("Podés probar este orden igualmente");
    expect($(dialogo, "[data-costo]")).toHaveTextContent("queda a 2 h del parcial");
    expect(document.activeElement).toHaveTextContent("Volver al orden recomendado");

    fireEvent.click(within(dialogo).getByRole("button", { name: "Simular igual" }));
    expect(pasos(container)).toBe(4);
    expect($(container, '[data-paso="4"]')).toHaveTextContent("orden elegido por vos");
    expect($(container, '[data-riesgo="agregado"]')).toHaveTextContent("Resolver un parcial de práctica queda a 2 h del parcial.");
  });

  it("Volver al orden recomendado cierra sin simular y selecciona la recomendada", () => {
    const { container } = abrir();
    fireEvent.click(bloque(container, ID.ECONOMIA_U3));
    simularEnInspector(container, ID.ECONOMIA_U3);
    fireEvent.click(screen.getByRole("button", { name: "Volver al orden recomendado" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(pasos(container)).toBe(0);
    expect(bloque(container, ID.LIMITES)).toHaveAttribute("aria-pressed", "true");
  });

  it("Escape cierra el aviso y devuelve el foco a lo que lo abrió", () => {
    const { container } = abrir();
    fireEvent.click(bloque(container, ID.ECONOMIA_U3));
    const disparador = $(inspector(container), `[data-simular="${ID.ECONOMIA_U3}"]`)!;
    act(() => disparador.focus());
    fireEvent.click(disparador);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(disparador);
  });
});

describe("Dependencia académica", () => {
  it("avisa, permite explorar el intento, no mueve el Gantt y deja la acción correctiva", () => {
    const { container } = abrir();
    fireEvent.click(bloque(container, ID.PRACTICA_DERIVADAS));
    simularEnInspector(container, ID.PRACTICA_DERIVADAS);
    const dialogo = screen.getByRole("dialog", { name: "Le falta un prerequisito" });
    expect(within(dialogo).getByRole("button", { name: "Simular primero Límites" })).toBeInTheDocument();
    fireEvent.click(within(dialogo).getByRole("button", { name: "Explorar el intento igual" }));

    expect($(container, '[data-paso="1"]')).toHaveTextContent("sin prerequisito");
    expect(bloque(container, `${ID.PRACTICA_DERIVADAS}#intento`)).toHaveAttribute("data-estado", "INTENTO");
    expect(bloque(container, ID.PRACTICA_DERIVADAS)).toHaveAttribute("data-estado", "PROPUESTA");
    expect($(container, '[data-gantt-materia="ANALISIS"] [data-pista="escenario"] [data-gantt-tema="TEM-ANA-3"]')).toHaveAttribute("data-estado-pista", "SIN_CAMBIO");
    expect($(container, '[data-gantt-nota]')).toHaveTextContent("no mueve el Gantt");
    expect($(container, `[data-estacion="${ID.SIMULACRO}"]`)).toHaveAttribute("data-estado-estacion", expect.stringContaining("Bloqueado por dependencia"));
    expect($(container, "[data-proxima]")).toHaveAttribute("data-proxima", ID.LIMITES);
  });

  it("«Simular primero» agrega el prerequisito, y después la práctica sí constata", () => {
    const { container } = abrir();
    fireEvent.click(bloque(container, ID.PRACTICA_DERIVADAS));
    simularEnInspector(container, ID.PRACTICA_DERIVADAS);
    fireEvent.click(screen.getByRole("button", { name: "Simular primero Límites" }));
    expect($(container, '[data-paso="1"]')).toHaveTextContent("Límites");
    simularConfirmando(container, ID.PRACTICA_DERIVADAS);
    expect($(container, '[data-pista="escenario"] [data-gantt-tema="TEM-ANA-3"]')).toHaveAttribute("data-estado-pista", "SIMULADO");
  });
});

describe("Qué se puede mover", () => {
  it("una propuesta se reubica con previsualización y confirmación, y sigue siendo propuesta", () => {
    const { container } = abrir();
    fireEvent.click(bloque(container, ID.ECONOMIA_U3));
    fireEvent.click(within(inspector(container)).getByRole("button", { name: "Reubicar en el escenario" }));
    fireEvent.click($(container, '[data-hueco="2026-09-19 10:00"]')!);
    expect(plano(container)).toBe("VISTA_PREVIA");
    expect($(container, "[data-antes-despues]")).toHaveTextContent("Antes: vie 18 15:00–16:00 → Después: sáb 19 10:00–11:00");
    expect(pasos(container)).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar en el escenario" }));
    expect(celdaDe(container, ID.ECONOMIA_U3)).toBe("TRABAJO|2026-09-19");
    expect(bloque(container, ID.ECONOMIA_U3)).toHaveAttribute("data-estado", "PROPUESTA");
    expect(bloque(container, ID.ECONOMIA_U3)).toHaveTextContent("reubicada");
  });

  it("clases, evaluación y hechos no tienen controles de movimiento", () => {
    const { container } = abrir();
    for (const clave of [ID.CLASE_ANA_LUN, ID.CLASE_ANA_MIE, ID.PARCIAL, ID.HECHO_ARQ]) {
      fireEvent.click(bloque(container, clave));
      expect(within(inspector(container)).queryByRole("button", { name: /Reubicar|Cambiar horario|Elegir cuándo|Simular/ }), clave).toBeNull();
      expect(bloque(container, clave)).not.toHaveAttribute("data-movil");
    }
  });

  it("un compromiso sólo cambia con Cambiar horario y confirmación, y conserva la promesa original", () => {
    const { container } = abrir();
    fireEvent.click(bloque(container, ID.COMPROMISO));
    fireEvent.click(within(inspector(container)).getByRole("button", { name: "Cambiar horario" }));
    fireEvent.click($(container, '[data-hueco="2026-09-17 19:30"]')!);
    expect(celdaDe(container, ID.COMPROMISO)).toBe("COMPROMISOS|2026-09-17");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(celdaDe(container, ID.COMPROMISO)).toBe("COMPROMISOS|2026-09-16");

    fireEvent.click(within(inspector(container)).getByRole("button", { name: "Cambiar horario" }));
    fireEvent.click($(container, '[data-hueco="2026-09-17 19:30"]')!);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar en el escenario" }));
    expect(celdaDe(container, ID.COMPROMISO)).toBe("COMPROMISOS|2026-09-17");
    expect(bloque(container, `${ID.COMPROMISO}#promesa`)).toHaveAttribute("data-estado", "PROMESA_ANTERIOR");
    expect($(inspector(container), "[data-promesa-original]")).toHaveTextContent("miércoles 16 de sep, 17:00–18:00");
    expect($(inspector(container), "[data-renegociaciones]")).toHaveTextContent("mié 16 17:00–18:00 → jue 17 19:30–20:30");
  });

  it("quitar la franja de un compromiso no lo mueve: pide resolverlo primero", () => {
    const { container } = abrir();
    fireEvent.click($(container, '[data-ventana="DSP-SYN-LAB-MIE"]')!);
    fireEvent.click($(inspector(container), "[data-quitar-ventana]")!);
    const dialogo = screen.getByRole("dialog", { name: "Esta franja tiene un compromiso" });
    expect(dialogo).toHaveTextContent("No lo movemos solo.");
    fireEvent.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(celdaDe(container, ID.COMPROMISO)).toBe("COMPROMISOS|2026-09-16");
    expect($(container, '[data-ventana="DSP-SYN-LAB-MIE"]')).not.toHaveAttribute("data-quitada");
  });
});

describe("Plan real frente a escenario, modos y Gantt", () => {
  it("Modo explicado dibuja huellas; Modo limpio no, pero conserva la etiqueta y el por qué", () => {
    const explicado = abrir("prioridad-inferior");
    expect(explicado.container.querySelectorAll("[data-huella-de]").length).toBeGreaterThan(0);
    explicado.unmount();
    const { container } = abrir("prioridad-inferior", { modo: "limpio" });
    expect(container.querySelectorAll("[data-huella-de]")).toHaveLength(0);
    expect($(container, "[data-ribete]")).toHaveTextContent("Escenario hipotético · Tu plan real no cambió");
    const resumen = $(container, "[data-resumen-limpio]")!;
    fireEvent.click(within(resumen).getByRole("button", { name: "Ver por qué cambió" }));
    expect(resumen).toHaveTextContent("Resolver un parcial de práctica");
  });

  it("el Gantt muestra las tres pistas por tema; el escenario mueve sólo la suya", () => {
    const { container } = abrir("tres-pasos");
    const analisis = $(container, '[data-gantt-materia="ANALISIS"]')!;
    expect($(analisis, '[data-frase="catedra"]')).toHaveTextContent("La cátedra llegó hasta Límites.");
    expect($(analisis, '[data-frase="vos"]')).toHaveTextContent("Vos tenés progreso registrado hasta Funciones.");
    expect($(analisis, '[data-frase="escenario"]')).toHaveTextContent("Si cumplís este escenario… llegarías hasta Derivadas.");
    expect($(analisis, '[data-pista="vos"] [data-gantt-tema="TEM-ANA-2"]')).toHaveAttribute("data-estado-pista", "SIN_PROGRESO");
    expect($(analisis, '[data-pista="escenario"] [data-gantt-tema="TEM-ANA-2"]')).toHaveAttribute("data-estado-pista", "SIMULADO");
    expect($(analisis, '[data-pista="catedra"] [data-gantt-tema="TEM-ANA-3"]')).toHaveAttribute("data-estado-pista", "ESPERADA");
    expect($(container, '[data-pista="vos"] [data-gantt-tema="TEM-ARQ-3"]')).toHaveAttribute("data-estado-pista", "PROGRESO_REGISTRADO");
    expect($(container, "[data-gantt]")!.textContent).not.toMatch(/\d+\s*%|readiness|probabilidad/i);
  });

  it("seleccionar una clase resalta sus temas en el Gantt, confirmados o esperados", () => {
    const { container } = abrir("clase-futura");
    expect($(container, '[data-pista="catedra"] [data-gantt-tema="TEM-ANA-3"]')!.className).toMatch(/ganttResaltado/);
    expect($(container, "[data-gantt-nota]")).toHaveTextContent("Clase esperada: Derivadas, según el cronograma de la cátedra, pendiente de confirmación.");
  });
});

describe("Calendario sincronizado", () => {
  it("la reubicación aparece sólo en el calendario del escenario, y la promesa original sigue a la vista", () => {
    const { container } = abrir("calendario");
    expect($(container, "[data-ribete-calendario]")).toHaveTextContent("Escenario hipotético");
    expect($(container, `[data-cal-clave="${ID.ECONOMIA_U3}"]`)).toHaveAttribute("aria-label", expect.stringContaining("sábado 19"));
    expect($(container, `[data-cal-clave="${ID.COMPROMISO}"]`)).toHaveAttribute("aria-label", expect.stringContaining("jueves 17"));
    expect($(container, `[data-cal-clave="${ID.COMPROMISO}#promesa"]`)).toHaveAttribute("data-estado", "PROMESA_ANTERIOR");

    fireEvent.click(within($(container, "[data-segmentado=plano]")!).getByRole("button", { name: "Tu plan real" }));
    expect($(container, `[data-cal-clave="${ID.ECONOMIA_U3}"]`)).toHaveAttribute("aria-label", expect.stringContaining("viernes 18"));
    expect($(container, `[data-cal-clave="${ID.COMPROMISO}"]`)).toHaveAttribute("aria-label", expect.stringContaining("miércoles 16"));
    expect($(container, `[data-cal-clave="${ID.COMPROMISO}#promesa"]`)).toBeNull();
  });

  it("el calendario y el plan leen el mismo objeto: seleccionar en uno abre el mismo inspector", () => {
    const { container } = abrir("renegociado", { vista: "calendario" });
    fireEvent.click($(container, `[data-cal-clave="${ID.COMPROMISO}"]`)!);
    expect(inspector(container)).toHaveTextContent("jueves 17 de sep, 19:30–20:30");
    fireEvent.click(within($(container, "[data-segmentado=vista]")!).getByRole("button", { name: "Plan" }));
    expect(bloque(container, ID.COMPROMISO)).toHaveAttribute("aria-pressed", "true");
    expect(bloque(container, ID.COMPROMISO)).toHaveTextContent("19:30–20:30");
  });
});

describe("Accesibilidad", () => {
  it("la acción recomendada va antes que el plan en el orden del documento", () => {
    const { container } = abrir();
    const proxima = $(container, "[data-proxima]")!;
    const plan = $(container, "[data-plan-semanal]")!;
    expect(proxima.compareDocumentPosition(plan) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("todos los bloques y estaciones son botones con nombre", () => {
    const { container } = abrir();
    for (const b of container.querySelectorAll<HTMLElement>("[data-lab-clave], [data-ventana], [data-estacion] > button")) {
      expect(b.tagName).toBe("BUTTON");
      expect((b.getAttribute("aria-label") ?? b.textContent ?? "").length).toBeGreaterThan(5);
    }
  });

  it("ningún estado depende sólo del color, y lo simulado no baja su opacidad", () => {
    const css = readFileSync(resolve(process.cwd(), "app/demo/plan-vivo-spike-v2/_lab/lab.module.css"), "utf8");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css.match(/\.simulado\s*\{[^}]*\}/)?.[0]).not.toContain("opacity");
    const { container } = abrir("un-paso");
    expect(bloque(container, ID.LIMITES)).toHaveTextContent("Simulado · paso 1");
  });
});
