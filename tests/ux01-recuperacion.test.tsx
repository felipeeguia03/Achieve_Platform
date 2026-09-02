import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HoyAutogestion } from "@/components/screens/hoy-autogestion";
import { proyectarDia, type EstadoDelDia } from "@/lib/server/servicios/proyeccion-hoy";

/**
 * `UX01` con una señal propia — Etapa B6.6.2.
 *
 * ⚠️ La regla que produce estas señales es `PROVISIONAL`
 * ([ADR-036](../docs/decisions.md#adr-036)). Lo que se prueba acá no es el
 * umbral: es **qué llega a la pantalla y qué no**.
 */
const base: EstadoDelDia = {
  instante: "2026-09-02T15:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  accion: null,
  compromiso: null,
  rescatePendiente: false,
  evidencia: "NONE",
  contextoIncompleto: false,
  materias: [],
  bitacoraDisponible: true,
};

const razon = "Error de procedimiento: volvió a aparecer después de una acción correctiva, 3 veces en esta preparación";
const elevada = {
  severidad: "intervencion" as const,
  razon,
  necesitaPersona: true,
};

function dibujar(riesgo?: EstadoDelDia["riesgo"]) {
  return render(<HoyAutogestion {...proyectarDia({ ...base, riesgo })} />);
}

describe("UX01 · la explicación de la propia señal", () => {
  it("sin señal no dibuja la sección: no hay un «todo bien» inventado", () => {
    const { container } = dibujar();
    expect(container.querySelector("section[aria-label]")).toBeNull();
  });

  it("con una dificultad reiterada, explica qué pasó y qué sigue", () => {
    dibujar({ severidad: "riesgo", razon, necesitaPersona: false });
    expect(screen.getByText(/Volvimos varias veces/i)).toBeTruthy();
    // El hecho concreto llega tal cual: es lo que hace útil la explicación.
    expect(screen.getByText(new RegExp("volvió a aparecer"))).toBeTruthy();
  });

  it("cuando el caso fue elevado, se lo dice sin nombrar el mecanismo", () => {
    dibujar(elevada);
    expect(screen.getByText(/acompañamiento/i)).toBeTruthy();
  });

  /**
   * `VI.1` §3.3, en la pantalla y no sólo en la proyección: el riesgo **no gana
   * el Hero**. Un botón acá competiría con la única CTA primaria de la
   * superficie, que es `C-02` roto en la pantalla donde el estudiante decide.
   */
  it("la sección no trae ninguna CTA", () => {
    const { container } = dibujar(elevada);
    const seccion = container.querySelector("section[aria-label]")!;
    expect(seccion.querySelectorAll("button")).toHaveLength(0);
    expect(seccion.querySelectorAll("a")).toHaveLength(0);
  });

  it("no se filtra el mecanismo a la pantalla", () => {
    const { container } = dibujar(elevada);
    const texto = container.textContent ?? "";
    for (const interno of [
      "risk_signal", "RiskSignal", "INTERVENTION_REQUIRED", "rule_version",
      "HP0-06", "AUTOMATICA", "threshold", "operator", "severidad",
    ]) {
      expect(texto, `se filtró "${interno}"`).not.toContain(interno);
    }
  });

  it("y el resto de la pantalla queda igual que sin señal", () => {
    // Regresión: la sección se agrega, no reemplaza. El estado general sí
    // cambia —es lo único que el riesgo puede modificar—.
    const sin = dibujar();
    const textoSin = sin.container.textContent ?? "";
    sin.unmount();
    const con = dibujar(elevada);
    const textoCon = con.container.textContent ?? "";
    expect(textoCon.length).toBeGreaterThan(textoSin.length);
    expect(textoCon).toContain("NECESITA RECUPERACIÓN");
    expect(textoSin).not.toContain("NECESITA RECUPERACIÓN");
  });
});
