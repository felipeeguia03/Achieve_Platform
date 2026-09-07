import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { HoyAutogestion } from "@/components/screens/hoy-autogestion";
import { ctaRegistry } from "@/lib/navigation/cta-registry";
import { rutaDeCta, rutaDeCtaCon } from "@/lib/navigation";
import { proyectarDia, type EstadoDelDia } from "@/lib/server/servicios/proyeccion-hoy";
import type { HoyProps, MateriaResumen } from "@/lib/domain/view-models";

/**
 * **[ADR-054](../docs/decisions.md#adr-054), opción `B`** — decidida por el
 * Product Owner el 5 de septiembre de 2026.
 *
 * Lo que se prueba es **una línea del spec que el código contradecía**. `VI.2`
 * §5.2, *Contexto preservado*:
 *
 * > *"Al entrar desde Hoy: **se abre el `CourseEnrollment` seleccionado**"*
 *
 * `CTA-001` no transportaba cuál, y `estado_de_materia()` elegía con un
 * `LIMIT 1`: **abrir la séptima materia de la cola abría la primera**. No era
 * una ausencia —de esas el repo tiene muchas y son honestas—: era **una
 * respuesta equivocada**, que es lo que *"la UI proyecta, nunca decide"* existe
 * para impedir.
 *
 * El owner pidió textualmente verificar *"que seleccionar la segunda, séptima o
 * novena materia no abra la primera"*. Eso es exactamente `§2` de acá abajo.
 */

/** Nueve materias, como las que deja el alta. Cada una con su cursada. */
const NUEVE: MateriaResumen[] = Array.from({ length: 9 }, (_, i) => ({
  cursadaId: `ce-${i + 1}`,
  nombre: `Materia ${i + 1}`,
  estado: null,
  ultimoAvance: null,
  tono: "neutral" as const,
}));

const BASE: HoyProps = {
  fecha: "sáb 5 sep",
  estadoGeneral: "SIN ACCIONES POR AHORA",
  hero: {
    nivel: "NO_ACTION_AVAILABLE",
    variante: null,
    contexto: null,
    titulo: null,
    razon: null,
    tiempoOEstado: null,
    evidenciaEsperada: null,
    queSigue: null,
    chip: null,
  },
  materias: NUEVE,
  recuperacion: null,
  // Fixture anterior a ADR-073: declara un mundo sin reparto.
  reparto: null,
  verProgreso: null,
};

/** Avanza la cola hasta el índice pedido y devuelve la cursada que se abrió. */
function abrirLaMateria(indice: number): string | null | undefined {
  const abierta = vi.fn();
  render(<HoyAutogestion {...BASE} onVerMateria={abierta} />);

  const siguiente = screen.getByLabelText("Siguiente");
  for (let i = 0; i < indice; i++) fireEvent.click(siguiente);

  // La fila visible es el botón que lleva el nombre de la materia.
  fireEvent.click(screen.getByText(`Materia ${indice + 1}`));
  return abierta.mock.calls[0]?.[0];
}

describe("§1 · El registro canónico declara qué transporta CTA-001", () => {
  it("CTA-001 lleva la cursada, y el nombre del parámetro vive en el registro", () => {
    // Si el nombre viviera en la página, renombrarlo tocaría cada llamador.
    expect(ctaRegistry["CTA-001"].parametro).toEqual({
      nombre: "cursada",
      que: "el CourseEnrollment de la fila que se tocó",
    });
  });

  it("es la única que transporta algo: las otras dieciocho no", () => {
    const conParametro = Object.values(ctaRegistry)
      .filter((c) => c.parametro !== undefined)
      .map((c) => c.id);
    expect(conParametro).toEqual(["CTA-001"]);
  });

  it("`rutaDeCtaCon` arma el destino con el nombre declarado", () => {
    expect(rutaDeCtaCon("CTA-001", "ce-7")).toBe(`${rutaDeCta("CTA-001")}?cursada=ce-7`);
  });

  it("sin cursada devuelve la ruta pelada: es el Track A, no un caso degradado", () => {
    // Un escenario declara un mundo y no tiene `course_enrollment` que nombrar.
    // Inventar un id para completar la URL sería lo contrario de omitir.
    expect(rutaDeCtaCon("CTA-001", null)).toBe(rutaDeCta("CTA-001"));
  });

  it("escapa el valor en vez de pegarlo crudo", () => {
    expect(rutaDeCtaCon("CTA-001", "a b&c")).toBe(`${rutaDeCta("CTA-001")}?cursada=a%20b%26c`);
  });
});

describe("§2 · La segunda, la séptima y la novena no abren la primera", () => {
  // Lo que el owner pidió verificar, con sus tres índices.
  for (const [ordinal, indice] of [
    ["segunda", 1],
    ["séptima", 6],
    ["novena", 8],
  ] as const) {
    it(`abrir la ${ordinal} abre la ${ordinal}`, () => {
      const abierta = abrirLaMateria(indice);
      expect(abierta).toBe(`ce-${indice + 1}`);
      // La regresión que esto existe para cazar.
      expect(abierta).not.toBe("ce-1");
    });
  }

  it("y la primera sigue abriendo la primera", () => {
    expect(abrirLaMateria(0)).toBe("ce-1");
  });

  it("una materia sin cursada persistida no inventa un id", () => {
    const abierta = vi.fn();
    render(
      <HoyAutogestion
        {...BASE}
        materias={[{ ...NUEVE[0], cursadaId: null }]}
        onVerMateria={abierta}
      />,
    );
    fireEvent.click(screen.getByText("Materia 1"));
    expect(abierta).toHaveBeenCalledWith(null);
  });
});

describe("§3 · La proyección deja de descartar el id que la base sí devuelve", () => {
  const estado: EstadoDelDia = {
    instante: "2026-09-05T12:00:00.000Z",
    zona: "America/Argentina/Cordoba",
    accion: null,
    compromiso: null,
    rescatePendiente: false,
    evidencia: "NONE",
    contextoIncompleto: false,
    bitacoraDisponible: false,
    materias: [
      { cursadaId: "ce-a", nombre: "Álgebra", estado: null, tono: "neutral", ultimoAvanceEn: null },
      { cursadaId: "ce-b", nombre: "Física", estado: null, tono: "neutral", ultimoAvanceEn: null },
    ],
    riesgo: null,
  };

  it("cada fila viaja con su cursada", () => {
    expect(proyectarDia(estado).materias.map((m) => m.cursadaId)).toEqual(["ce-a", "ce-b"]);
  });

  it("el orden de la base es el orden de la pantalla", () => {
    // Si se reordenara acá, el índice de la cola dejaría de corresponder con la
    // cursada — y volveríamos a abrir la materia equivocada por otra vía.
    expect(proyectarDia(estado).materias.map((m) => m.nombre)).toEqual(["Álgebra", "Física"]);
  });
});
