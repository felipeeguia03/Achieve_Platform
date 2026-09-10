import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IndiceDeMaterias } from "@/components/screens/indice-de-materias";
import { migasDe } from "@/lib/navigation/migas";
import type { MateriasProps } from "@/lib/domain/view-models";

/**
 * Pedido del owner, 9 de septiembre de 2026: **la fila entera abre la materia**,
 * y la última miga dice **qué materia** en vez de «Materia».
 */
const eje = {
  hoy: 0.4,
  marcas: [
    { etiqueta: "−2 sem", posicion: 0, esHoy: false },
    { etiqueta: "hoy", posicion: 0.4, esHoy: true },
    { etiqueta: "+3 sem", posicion: 1, esHoy: false },
  ],
};

const base: MateriasProps = {
  fecha: "martes 9 de septiembre",
  eje,
  proximaEvaluacion: null,
  aclaracion: null,
  materias: [
    {
      cursadaId: "ce-emprendedorismo",
      nombre: "EMPRENDEDORISMO",
      evaluacion: "Final · mixta · dom 13 sept",
      faltan: "4 d",
      cobertura: null,
      sinCobertura: "0 de 6 temas tiene alguna evidencia",
      ultimoAvance: null,
      ventana: { desde: 0.1, hasta: 0.6, inicioDesconocido: false },
      etiqueta: "Abrir",
      tono: "neutral",
    },
  ],
};

describe("La fila del índice abre la materia desde cualquier parte", () => {
  /**
   * ⚠️ Se hace clic en el **nombre**, no en el botón: es justamente la parte
   * que antes no hacía nada y la que el owner señaló.
   */
  it("un clic sobre el nombre abre esa cursada", () => {
    const abiertas: string[] = [];
    render(<IndiceDeMaterias {...base} onAbrirMateria={(id) => abiertas.push(id)} />);
    fireEvent.click(screen.getByText("EMPRENDEDORISMO"));
    expect(abiertas).toEqual(["ce-emprendedorismo"]);
  });

  /**
   * ⚠️ **El botón sigue existiendo.** Es el único elemento enfocable de la fila:
   * si se lo saca, quien navega con teclado se queda sin forma de entrar. El
   * clic en la fila es una comodidad de mouse **encima** del control, no en vez
   * de él (`P-07`).
   */
  it("y el botón visible sigue estando, con su etiqueta", () => {
    render(<IndiceDeMaterias {...base} onAbrirMateria={() => {}} />);
    expect(screen.getByRole("button", { name: "Abrir" })).toBeInTheDocument();
  });

  /**
   * ⚠️ **Una sola navegación por clic.** El botón vive dentro de la fila, así
   * que sin `stopPropagation` su clic dispara también el de la fila y la app
   * navega dos veces. No se nota mirando: se nota en el historial.
   */
  it("el clic sobre el botón no navega dos veces", () => {
    const abiertas: string[] = [];
    render(<IndiceDeMaterias {...base} onAbrirMateria={(id) => abiertas.push(id)} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
    expect(abiertas).toHaveLength(1);
  });

  it("sin manejador, la fila no promete que se puede abrir", () => {
    const { container } = render(<IndiceDeMaterias {...base} />);
    const fila = container.querySelector("li");
    expect(fila).not.toBeNull();
    expect(fila!.style.cursor).toBe("default");
  });
});

describe("La última miga nombra el objeto abierto", () => {
  it("dice la materia, no «Materia»", () => {
    const migas = migasDe("UX02", "Emprendedorismo");
    expect(migas.map((m) => m.etiqueta)).toEqual(["Hoy", "Materias", "Emprendedorismo"]);
  });

  /**
   * ⚠️ **Sólo la última.** Las anteriores son nodos del grafo: si se
   * renombraran con el objeto, el camino de vuelta dejaría de nombrar a dónde
   * lleva.
   */
  it("las anteriores siguen siendo las del grafo, y conservan su enlace", () => {
    const migas = migasDe("UX02", "Emprendedorismo");
    expect(migas[0]).toEqual({ etiqueta: "Hoy", href: "/hoy" });
    expect(migas[1].etiqueta).toBe("Materias");
    expect(migas[1].href).not.toBeNull();
    expect(migas[2].href).toBeNull();
  });

  /**
   * ⚠️ **Vacío no borra la miga.** Mientras la pantalla carga todavía no hay
   * nombre, y un hueco ahí le sacaría al usuario la referencia de dónde está.
   */
  it("sin nombre —o con uno en blanco— vuelve a la etiqueta del nodo", () => {
    for (const vacio of [undefined, null, "", "   "]) {
      expect(migasDe("UX02", vacio).at(-1)!.etiqueta).toBe("Materia");
    }
  });

  it("no toca las superficies que no abren un objeto", () => {
    expect(migasDe("UX01").map((m) => m.etiqueta)).toEqual(["Hoy"]);
  });
});
