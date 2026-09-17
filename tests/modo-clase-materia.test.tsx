/**
 * Modo Clase, corte 6 — *Tus clases* en `UX02` · [ADR-098](../docs/decisions.md#adr-098) §9.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MateriaCursado } from "@/components/screens/materia-cursado";
import { getEscenario } from "@/lib/fixtures";
import type { ClaseEnLista, MateriaProps, TusClases } from "@/lib/domain/view-models";

const BASE = getEscenario("FX-DAY-BASE").materia as MateriaProps;

const clase = (over: Partial<ClaseEnLista> = {}): ClaseEnLista => ({
  id: "cl-1",
  estado: "ENDED",
  fecha: "jue 17 sep",
  iniciadaEn: "2026-09-17T11:00:00Z",
  duracionMinutos: 107,
  resumen: { QUESTION: 3, IMPORTANT: 0, ASSESSMENT: 2, REVIEW: 0 },
  ...over,
});

function montar(tus: TusClases | null, extra: { onEntrarAClase?: () => void; onAbrirClase?: (c: ClaseEnLista) => void } = {}) {
  render(<MateriaCursado {...BASE} tusClases={tus} {...extra} />);
  return document.querySelector("[data-tus-clases]") as HTMLElement | null;
}

describe("Tus clases", () => {
  it("sin datos que llegaron, la sección no está", () => {
    expect(montar(null)).toBeNull();
  });

  it("cada clase dice fecha, duración y sólo las marcas que hubo, derivadas", () => {
    const s = montar({ clases: [clase()], entrada: "INICIAR" })!;
    expect(s).toHaveTextContent("jue 17 sep");
    expect(s).toHaveTextContent("1 h 47 min · 3 No entendí · 2 Posible evaluación");
    expect(s).not.toHaveTextContent("0 Importante");
  });

  it("una clase sin marcas lo dice, y una abierta dice «En curso» en vez de duración", () => {
    const s = montar({
      clases: [clase({ id: "a", estado: "ACTIVE", duracionMinutos: null, resumen: { QUESTION: 0, IMPORTANT: 0, ASSESSMENT: 0, REVIEW: 0 } })],
      entrada: "VOLVER",
    })!;
    expect(s).toHaveTextContent("En curso · sin marcas");
  });

  it("vacía, lo dice sin inventar clases", () => {
    const s = montar({ clases: [], entrada: "INICIAR" })!;
    expect(s).toHaveTextContent("Todavía no abriste ninguna clase de esta materia.");
  });

  it("se distingue de las clases de la semana y de las dictadas", () => {
    const s = montar({ clases: [], entrada: "INICIAR" })!;
    expect(s).toHaveTextContent("Las clases que abriste en Achieve");
    expect(s.closest("[data-horario]")).toBeNull();
  });

  it("«Iniciar clase» es CTA-022, y abrir una clase es navegación con su id", () => {
    const entrar = vi.fn();
    const abrir = vi.fn();
    const s = montar({ clases: [clase()], entrada: "INICIAR" }, { onEntrarAClase: entrar, onAbrirClase: abrir })!;
    fireEvent.click(within(s).getByRole("button", { name: "Iniciar clase" }));
    expect(entrar).toHaveBeenCalled();
    fireEvent.click(within(s).getByRole("button", { name: /jue 17 sep/ }));
    expect(abrir).toHaveBeenCalledWith(expect.objectContaining({ id: "cl-1" }));
  });

  it("con la clase de esta materia abierta dice «Volver a la clase»", () => {
    const s = montar({ clases: [], entrada: "VOLVER" }, { onEntrarAClase: vi.fn() })!;
    expect(within(s).getByRole("button", { name: "Volver a la clase" })).toBeInTheDocument();
  });

  it("con otra clase abierta de otra materia no ofrece entrar", () => {
    const s = montar({ clases: [], entrada: null }, { onEntrarAClase: vi.fn() })!;
    expect(within(s).queryByRole("button", { name: /Iniciar clase|Volver a la clase/ })).toBeNull();
  });

  it("el panel de clases de la semana sigue sin botones", () => {
    montar({ clases: [clase()], entrada: "INICIAR" }, { onEntrarAClase: vi.fn(), onAbrirClase: vi.fn() });
    const horario = document.querySelector("[data-horario]");
    if (horario) expect(horario.querySelectorAll("button, a, input")).toHaveLength(0);
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });
});
