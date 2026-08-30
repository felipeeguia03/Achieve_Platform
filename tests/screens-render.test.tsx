import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HoyAutogestion } from "@/components/screens/hoy-autogestion";
import { Evidencia } from "@/components/screens/evidencia";
import { getEscenario, proyectarHoy } from "@/lib/fixtures";
import type { EscenarioId } from "@/lib/fixtures";

/**
 * Guard de la parametrización de la Etapa 0.2.
 *
 * El copy salió de los componentes a `lib/content/` y los datos a
 * `lib/fixtures/`, así que varias frases que antes eran un literal ahora se
 * **componen** en tiempo de render. Estas aserciones son las frases exactas que
 * dibujaba el árbol de la Etapa 0.1 (commit `2c2ac8b`): si una composición se
 * rompe, se rompe acá.
 */

function renderHoy(id: EscenarioId) {
  const props = proyectarHoy(getEscenario(id));
  if (!props) throw new Error(`${id} no proyecta UX01`);
  return render(<HoyAutogestion {...props} />);
}

describe("UX01 — el copy de la Etapa 0.1 se preserva en los cinco niveles", () => {
  it("ACTION_RECOMMENDED (FX-DAY-BASE)", () => {
    renderHoy("FX-DAY-BASE");
    expect(screen.getByText("Resolver ejercicios 1–5")).toBeInTheDocument();
    expect(screen.getByText("Porque: consolida lo visto hoy.")).toBeInTheDocument();
    expect(screen.getByText("40 min · Entregá: 5 ejercicios")).toBeInTheDocument();
    expect(screen.getByText("Después: queda definido cuándo vas a hacerla.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Comprometerme" })).toBeInTheDocument();
    expect(screen.getByText("BAJO CONTROL")).toBeInTheDocument();
  });

  it("IN_PROGRESS (FX-LOCAL-DAY-IN-PROGRESS)", () => {
    renderHoy("FX-LOCAL-DAY-IN-PROGRESS");
    expect(screen.getByText("Porque: prepara la próxima clase.")).toBeInTheDocument();
    expect(screen.getByText("En curso · Entregá: 7 ejercicios")).toBeInTheDocument();
    // Sin prefijo "Después:" — así estaba en la 0.1.
    expect(screen.getByText("Al terminar, subís la evidencia acordada.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
    expect(screen.getByText("ACCIÓN EN CURSO")).toBeInTheDocument();
  });

  it("EVIDENCE_PENDING (FX-EVD-BASE)", () => {
    renderHoy("FX-EVD-BASE");
    expect(screen.getByText("Subí los ejercicios 8–14")).toBeInTheDocument();
    expect(screen.getByText("Porque: la acción se cierra con evidencia verificable.")).toBeInTheDocument();
    // Sin duración: la línea empieza por la evidencia esperada.
    expect(screen.getByText("Entregá: foto/archivo de 7 ejercicios")).toBeInTheDocument();
    expect(screen.getByText("Después: la evidencia queda pendiente de validación.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subir evidencia" })).toBeInTheDocument();
    expect(screen.getByText("FALTA CERRAR ESTA ACCIÓN")).toBeInTheDocument();
  });

  it("RESCUE_REQUIRED (FX-MISSED)", () => {
    renderHoy("FX-MISSED");
    expect(screen.getByText("Análisis II · Compromiso incumplido")).toBeInTheDocument();
    expect(screen.getByText("Necesitamos rearmar este compromiso.")).toBeInTheDocument();
    expect(screen.getByText("Porque: el compromiso de las 19:00 quedó incumplido.")).toBeInTheDocument();
    expect(screen.getByText("Primero necesitamos acordar cómo retomar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retomar" })).toBeInTheDocument();
    expect(screen.getByText("NECESITA RECUPERACIÓN")).toBeInTheDocument();
  });

  it("NO_ACTION_AVAILABLE (FX-ADE-NONE) — empty honesto", () => {
    renderHoy("FX-ADE-NONE");
    expect(
      screen.getByText(/Hoy no hay una acción recomendada\./),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver materias" })).toBeInTheDocument();
    expect(screen.getByText("SIN ACCIONES POR AHORA")).toBeInTheDocument();
  });
});

describe("UX01 — omitir, no inventar", () => {
  it("sin recomendación no se dibuja una línea de tiempo ni de evidencia", () => {
    renderHoy("FX-ADE-NONE");
    expect(screen.queryByText(/Entregá:/)).toBeNull();
    expect(screen.queryByText(/Porque:/)).toBeNull();
    expect(screen.queryByText(/Después:/)).toBeNull();
  });

  it("en el rescate no aparece la línea operativa: no hay tiempo ni evidencia que mostrar", () => {
    renderHoy("FX-MISSED");
    expect(screen.queryByText(/Entregá:/)).toBeNull();
  });

  it("una materia sin avance registrado no dice 'hace 0 días'", () => {
    // La tercera materia de FX-DAY-BASE tiene ultimoAvance en null.
    renderHoy("FX-DAY-BASE");
    fireEvent.click(screen.getByLabelText("Siguiente"));
    fireEvent.click(screen.getByLabelText("Siguiente"));
    expect(screen.getByText("Sin avance registrado")).toBeInTheDocument();
    expect(screen.queryByText(/Último avance/)).toBeNull();
  });
});

describe("UX01 — el conmutador de demo se fue en la Etapa 0.2", () => {
  it("no quedan los chips A · Al día / B · En curso / C · Evidencia / D1 · Rescate", () => {
    renderHoy("FX-DAY-BASE");
    for (const chip of ["A · Al día", "B · En curso", "C · Evidencia", "D1 · Rescate"]) {
      expect(screen.queryByText(chip)).toBeNull();
    }
  });
});

describe("UX05 — el adjunto es estado local, no de dominio", () => {
  it("la CTA arranca deshabilitada y el adjunto la habilita", () => {
    const props = getEscenario("FX-EVD-BASE").evidencia!;
    render(<Evidencia {...props} />);

    const enviar = screen.getByRole("button", { name: "Enviar evidencia" });
    expect(enviar).toBeDisabled();
    expect(screen.getByText(/Todavía no adjuntaste la producción\./)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Adjuntar evidencia"));

    expect(screen.getByText("foto_01.jpg cargada")).toBeInTheDocument();
    expect(enviar).toBeEnabled();
    // Adjuntar NO produce SUBMITTED: la frase que lo aclara sigue en pantalla.
    expect(
      screen.getByText("Enviar: queda SUBMITTED; sigue validación. No implica suficiencia ni dominio."),
    ).toBeInTheDocument();
  });
});
