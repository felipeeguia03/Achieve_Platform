/**
 * Modo Clase, corte 4 — la pantalla · [ADR-098](../docs/decisions.md#adr-098).
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { ModoClase, type ModoClaseProps } from "@/components/screens/modo-clase";
import { ctaRegistry, ctasVisibles } from "@/lib/navigation/cta-registry";
import { contexto, contextoVacio } from "@/lib/navigation/context";
import { migasDe } from "@/lib/navigation/migas";
import { nodos, superficieIds } from "@/lib/navigation/surfaces";
import type { ClaseProps } from "@/lib/domain/view-models";

const CLASE: ClaseProps = {
  id: "cl-1",
  cursadaId: "cur-analisis",
  materia: "ANÁLISIS MATEMÁTICO II",
  estado: "ACTIVE",
  iniciadaEn: new Date(Date.now() - 43 * 60_000).toISOString(),
  terminadaEn: null,
  fecha: "jue 17 sep",
  horario: { desde: "08:00", hasta: "10:00" },
  horarioEstimado: false,
  aula: null,
  comision: null,
  docente: null,
  unidadDeUltimaClase: 4,
  apuntes: "",
  apuntesGuardadosEn: null,
  marcas: [
    { id: "m-2", tipo: "ASSESSMENT", segundos: 900, texto: "entra en el parcial", creadaEn: "2026-09-17T11:15:00Z" },
    { id: "m-1", tipo: "QUESTION", segundos: 120, texto: null, creadaEn: "2026-09-17T11:02:00Z" },
  ],
  resumen: { QUESTION: 1, IMPORTANT: 0, ASSESSMENT: 1, REVIEW: 0 },
  duracionMinutos: null,
};

function montar(over: Partial<ModoClaseProps> = {}, clase: Partial<ClaseProps> = {}) {
  const props: ModoClaseProps = {
    clase: { ...CLASE, ...clase },
    apuntes: "",
    estadoDeApuntes: "GUARDADO",
    onApuntes: vi.fn(),
    pendientes: [],
    onMarcar: vi.fn(),
    onReintentarMarca: vi.fn(),
    onDetalle: vi.fn(),
    onFinalizar: vi.fn(),
    finalizando: false,
    errorAlFinalizar: false,
    recienGuardada: false,
    ...over,
  };
  return { props, ...render(<ModoClase {...props} />) };
}

describe("durante la clase", () => {
  it("las cuatro marcas están a un toque, y cada toque manda su tipo", () => {
    const { props } = montar();
    const nombres = ["No entendí", "Importante", "Posible evaluación", "Revisar"];
    for (const nombre of nombres) expect(screen.getByRole("button", { name: nombre })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "No entendí" }));
    fireEvent.click(screen.getByRole("button", { name: "Posible evaluación" }));
    expect(props.onMarcar).toHaveBeenNthCalledWith(1, "QUESTION");
    expect(props.onMarcar).toHaveBeenNthCalledWith(2, "ASSESSMENT");
  });

  it("marcar no abre un formulario", () => {
    montar();
    fireEvent.click(screen.getByRole("button", { name: "Importante" }));
    expect(screen.queryByRole("textbox", { name: /contá qué pasó/i })).toBeNull();
  });

  it("una sola CTA principal: Finalizar clase", () => {
    const { props, container } = montar();
    expect(container.querySelectorAll("[data-cta-primaria]")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Finalizar clase" }));
    expect(props.onFinalizar).toHaveBeenCalled();
  });

  it("los apuntes se escriben sin botón de guardar, y el estado se anuncia", () => {
    const { props } = montar({ estadoDeApuntes: "GUARDANDO" });
    fireEvent.change(screen.getByRole("textbox", { name: "Apuntes" }), { target: { value: "Cambio de variables" } });
    expect(props.onApuntes).toHaveBeenCalledWith("Cambio de variables");
    expect(screen.getByText("Guardando…")).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByRole("button", { name: /guardar apuntes/i })).toBeNull();
  });

  it("si no se pudieron guardar los apuntes, lo dice", () => {
    montar({ estadoDeApuntes: "ERROR" });
    expect(screen.getByText("No pudimos guardar tus apuntes. Reintentando…")).toBeInTheDocument();
  });

  it("los momentos van en el orden en que ocurrieron", () => {
    const { container } = montar();
    const tipos = [...container.querySelectorAll("[data-momento]")].map((e) => e.getAttribute("data-momento"));
    // La proyección ordena; la pantalla dibuja lo que recibe.
    expect(tipos).toEqual(["ASSESSMENT", "QUESTION"]);
  });

  it("una marca que no se guardó ofrece reintentar con su clave", () => {
    const { props } = montar({ pendientes: [{ clave: "k-9", tipo: "REVIEW", segundos: 30, estado: "ERROR" }] });
    fireEvent.click(screen.getByRole("button", { name: "No se guardó. Tocá para reintentar" }));
    expect(props.onReintentarMarca).toHaveBeenCalledWith("k-9");
  });

  it("el texto de una marca se agrega después, y va con su id", () => {
    const { props } = montar();
    const momento = document.querySelector('[data-momento="QUESTION"]') as HTMLElement;
    fireEvent.click(within(momento).getByRole("button", { name: "Contá qué pasó" }));
    fireEvent.change(within(momento).getByRole("textbox"), { target: { value: "el jacobiano" } });
    fireEvent.click(within(momento).getByRole("button", { name: "Guardar" }));
    expect(props.onDetalle).toHaveBeenCalledWith("m-1", "el jacobiano");
  });

  it("si no se pudo finalizar, dice que lo guardado está guardado", () => {
    montar({ errorAlFinalizar: true });
    expect(screen.getByRole("alert")).toHaveTextContent("Tus apuntes y marcas están guardados");
  });
});

describe("lo que la pantalla dice, y lo que no", () => {
  it("la unidad es la de la última clase dada, dicho así", () => {
    montar();
    expect(screen.getByText("Un. 4 · la unidad de la última clase dada")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/unidad actual/i);
  });

  it("sin unidad, sin comisión, sin docente y sin aula, esas líneas no están", () => {
    montar({}, { unidadDeUltimaClase: null });
    expect(document.body).not.toHaveTextContent(/Un\.|Comisión|Aula/);
  });

  it("con comisión, aula y docente, los dice en la línea del horario", () => {
    montar({}, { comision: "A", aula: "3.12", docente: "Docente SYN" });
    expect(screen.getByText("08:00–10:00 · Aula 3.12 · Comisión A · Docente SYN")).toBeInTheDocument();
  });

  it("un horario estimado se dice estimado", () => {
    montar({}, { horarioEstimado: true });
    expect(screen.getByText("Horario estimado por Achieve, no publicado por la facultad")).toBeInTheDocument();
  });

  it("una clase iniciada a mano no inventa horario", () => {
    montar({}, { horario: null, horarioEstimado: null });
    expect(screen.getByText("Iniciada fuera de horario")).toBeInTheDocument();
  });

  it("no hay grabación, ni checkpoint, ni vocabulario prohibido", () => {
    montar();
    const texto = document.body.textContent ?? "";
    expect(texto).not.toMatch(/grab|micr[oó]fono|audio/i);
    expect(texto).not.toMatch(/c[oó]mo te qued|entend[ií] bien|estoy perdido/i);
    expect(texto).not.toMatch(/\bnotas?\b|modo estudio/i);
    // «Parcial» no es un rótulo: era falso con un final o un TP. El texto que
    // el estudiante escribe puede decirlo, y es suyo.
    for (const boton of screen.getAllByRole("button")) expect(boton.textContent).not.toMatch(/parcial/i);
  });

  it("el texto de la marca que escribió el estudiante se muestra tal cual", () => {
    montar();
    expect(screen.getByText("entra en el parcial")).toBeInTheDocument();
  });
});

describe("con la clase terminada", () => {
  const terminada: Partial<ClaseProps> = {
    estado: "ENDED",
    terminadaEn: "2026-09-17T12:47:00Z",
    duracionMinutos: 107,
  };

  it("no se marca ni se finaliza: no hay CTA principal", () => {
    const { container } = montar({}, terminada);
    expect(screen.queryByRole("button", { name: "No entendí" })).toBeNull();
    expect(container.querySelectorAll("[data-cta-primaria]")).toHaveLength(0);
  });

  it("muestra la duración y cuántas marcas de cada tipo, derivadas", () => {
    montar({}, terminada);
    const resumen = document.querySelector("[data-resumen]") as HTMLElement;
    expect(resumen).toHaveTextContent("1 h 47 min");
    expect(resumen).toHaveTextContent("1 No entendí");
    expect(resumen).toHaveTextContent("0 Importante");
  });

  it("los apuntes siguen siendo editables", () => {
    montar({ apuntes: "Cambio de variables" }, terminada);
    expect(screen.getByRole("textbox", { name: "Apuntes" })).not.toBeDisabled();
  });

  it("el acuse «Clase guardada» sólo aparece justo después de finalizar", () => {
    const { unmount } = montar({}, terminada);
    expect(screen.queryByText("Clase guardada")).toBeNull();
    unmount();
    montar({ recienGuardada: true }, terminada);
    expect(screen.getByRole("status")).toHaveTextContent("Clase guardada");
  });
});

describe("el lugar de Modo Clase en la navegación", () => {
  it("`CLASE` tiene ruta y no es superficie: siguen siendo nueve", () => {
    expect(nodos.CLASE.ruta).toBe("/clase");
    expect(nodos.CLASE.wireframe).toBeNull();
    expect(superficieIds).toHaveLength(9);
    expect(superficieIds).not.toContain("CLASE");
  });

  it("`CTA-023` aparece sólo con la clase activa; deny-by-default", () => {
    expect(ctasVisibles("CLASE", contextoVacio)).toEqual([]);
    expect(ctasVisibles("CLASE", contexto({ claseActiva: true })).map((c) => c.id)).toEqual(["CTA-023"]);
  });

  it("`CTA-022` no aparece si hay otra clase activa de otra materia", () => {
    expect(ctasVisibles("UX02", contexto({ courseVisible: true })).map((c) => c.id)).not.toContain("CTA-022");
    expect(ctaRegistry["CTA-022"].destino).toBe("CLASE");
  });

  it("la miga dice de qué materia es la clase", () => {
    // La superficie ya pasa el nombre de la materia por `nombreDeObjeto`.
    expect(migasDe("CLASE", "Clase de Análisis matemático II").map((m) => m.etiqueta)).toEqual([
      "Materias",
      "Clase de Análisis matemático II",
    ]);
  });

  it("la pantalla no pide nada a la red", () => {
    const fuente = readFileSync(resolve(process.cwd(), "components/screens/modo-clase.tsx"), "utf8");
    expect(fuente).not.toMatch(/fetch\(|enviar\(|pedir\(|localStorage/);
  });
});
