import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { MateriaCursado } from "@/components/screens/materia-cursado";
import { copy } from "@/lib/content/es-AR";
import { ctaRegistry } from "@/lib/navigation/cta-registry";
import { proyectarMateria, type EstadoDeMateria } from "@/lib/server/servicios/proyeccion-materia";
import { getEscenario } from "@/lib/fixtures";

/**
 * **Fase B6.23 — el Gantt por tema, con el layout que pidió el owner.**
 *
 * Lo que este archivo protege son las **tres cosas que la captura pedía y el
 * producto no puede decir**, más la que sí puede y no estaba.
 */

const base: EstadoDeMateria = {
  instante: "2026-09-09T15:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  cursadaId: "ce-1",
  evidenciasEnviadas: 0,
  materia: "Análisis Matemático II",
  examen: null,
  accion: null,
  compromiso: null,
  rescatePendiente: false,
  evidencia: "NONE",
  contextoIncompleto: false,
  // Por defecto **nada estimado**: los casos viejos miden lo que medían.
  contenido: null,
  ultimoAvanceEn: null,
  unidades: [],
  clases: [],
  cargaDeclarada: null,
  dimensiones: null,
  horario: [],
  actividadReciente: [],
};

const unidad = (over: Partial<EstadoDeMateria["unidades"][number]>) => ({
  id: "u1",
  codigo: "T1",
  nombre: "Series numéricas",
  ultimoAvanceEn: null,
  dominio: null,
  practica: null,
  recorrido: null,
  peso: null,
  primeraClaseEn: null,
  ultimaClaseEn: null,
  evaluaEn: null,
  evidencia: "sin_evidencia" as const,
  ...over,
});

// ─────────────────────────────────────────────────────────────────────────────

describe("§1 · Las palabras que la captura usaba y están prohibidas", () => {
  const textos = Object.values(copy);

  it("ninguna copy dice `dominado`", () => {
    /*
      La captura rotulaba la columna `Sin empezar · Leído · Practicado ·
      Dominado`. **`Dominado` es la primera prohibición de ADR-072** —el dominio
      requiere evaluación— y el corte que sostiene toda la cadena
      `preparar ≠ enviar ≠ suficiencia ≠ validación ≠ dominio`. Un estudiante
      marcándose «dominado» no evalúa nada: declara.
    */
    expect(textos.filter((t) => /\bdominad[oa]s?\b/i.test(t))).toEqual([]);
  });

  it("y la leyenda del Gantt no habla de `nivel`", () => {
    // ADR-075 §C1, textual: *"su rótulo visible debe ser `actividad
    // registrada`, no `dominio`, `nivel`, `rendimiento` ni `avance de
    // aprendizaje`"*. La captura decía *"el relleno de cada barra es el nivel
    // del tema"*.
    for (const prohibida of [/\bnivel\b/i, /\brendimiento\b/i, /avance de aprendizaje/i]) {
      expect(textos.filter((t) => prohibida.test(t))).toEqual([]);
    }
  });

  it("ni ninguna fila muestra una fracción tipo `3/3`", () => {
    // Un puntaje. `C01-019` sigue con residuo abierto: no hay unidad en la que
    // expresar una dimensión, y `3/3` la inventa.
    const p = proyectarMateria({
      ...base,
      unidades: [unidad({ evidencia: "criterio_alcanzado", primeraClaseEn: "2026-09-01" })],
      clases: [],
    });
    for (const u of p.gantt!.unidades) expect(u.etiqueta).not.toMatch(/\d\s*\/\s*\d/);
  });
});

describe("§2 · Un tema se ubica sólo si hay dos hechos que lo ubiquen", () => {
  it("sin primera clase no hay barra, y se dice por qué", () => {
    const p = proyectarMateria({ ...base, unidades: [unidad({})] });
    const u = p.gantt!.unidades[0];
    expect(u.desde).toBeNull();
    expect(u.hasta).toBeNull();
    expect(u.nota).toBe("Todavía no se dictó");
  });

  it("con primera clase y evaluación, la barra va de una a otra", () => {
    const p = proyectarMateria({
      ...base,
      unidades: [unidad({ primeraClaseEn: "2026-09-01", evaluaEn: "2026-09-20" })],
    });
    const u = p.gantt!.unidades[0];
    expect(u.desde).not.toBeNull();
    expect(u.hasta!).toBeGreaterThan(u.desde!);
    expect(u.nota).toBeNull();
  });

  it("sin evaluación, termina en la última clase que lo dictó", () => {
    // No se estira hasta el examen de la materia: **este tema no está declarado
    // en su alcance**, y suponerlo sería inventar qué evalúa la cátedra.
    const conEval = proyectarMateria({
      ...base,
      unidades: [unidad({ primeraClaseEn: "2026-09-01", evaluaEn: "2026-09-25" })],
    }).gantt!.unidades[0];
    const sinEval = proyectarMateria({
      ...base,
      unidades: [unidad({ primeraClaseEn: "2026-09-01", ultimaClaseEn: "2026-09-05" })],
    }).gantt!.unidades[0];
    expect(sinEval.hasta!).toBeLessThan(conEval.hasta!);
  });

  it("el orden de la base es el de la pantalla", () => {
    const p = proyectarMateria({
      ...base,
      unidades: [
        unidad({ id: "a", codigo: "T1", nombre: "Uno" }),
        unidad({ id: "b", codigo: "T2", nombre: "Dos" }),
      ],
    });
    expect(p.gantt!.unidades.map((u) => u.nombre)).toEqual(["Uno", "Dos"]);
  });

  it("y el eje es el mismo que el del índice de materias", async () => {
    // `marcasDelEje` vive en `lib/domain/ventana.ts` y la usan las dos
    // superficies. Dos copias serían dos escalas para el mismo eje.
    const { marcasDelEje, ejeDelPeriodo } = await import("@/lib/domain/ventana");
    const p = proyectarMateria({
      ...base,
      unidades: [unidad({ primeraClaseEn: "2026-09-01", evaluaEn: "2026-09-20" })],
    });
    expect(p.gantt!.eje).toEqual(marcasDelEje("2026-09-09", ejeDelPeriodo("2026-09-09", ["2026-09-20"])));
  });
});

describe("§3 · La tarjeta de evaluación no completa lo que falta", () => {
  it("sin evaluación no hay tarjeta ni entrada a Modo Examen", () => {
    // Sin `Assessment` no hay qué activar, y ofrecerlo llevaría a una pantalla
    // que dice que no hay nada.
    const p = proyectarMateria(base);
    expect(p.evaluacion).toBeNull();
    expect(p.modoExamen).toBeNull();
  });

  it("una evaluación sin fecha conserva su título y no se le estima una", () => {
    const p = proyectarMateria({
      ...base,
      examen: { titulo: "Final", fechaEn: null, tipo: null, modalidad: null },
    });
    expect(p.evaluacion!.titulo).toBe("Final");
    // Sin fecha no hay cuenta de días, y sin modalidad no se dice «escrito».
    expect(p.evaluacion!.detalle).toBeNull();
  });

  it("el detalle omite cada parte que falta, y no la completa", () => {
    const p = proyectarMateria({
      ...base,
      evidenciasEnviadas: 2,
      examen: { titulo: "Final", fechaEn: "2026-09-15", tipo: "final", modalidad: "escrito" },
    });
    expect(p.evaluacion!.detalle).toBe("6 días · escrito · 2 evidencias enviadas");
  });

  it("una evaluación ya pasada no muestra días en negativo", () => {
    const p = proyectarMateria({
      ...base,
      examen: { titulo: "Parcial", fechaEn: "2026-09-01", tipo: null, modalidad: "oral" },
    });
    expect(p.evaluacion!.detalle).toBe("oral");
  });
});

describe("§4 · `CTA-019` entra a Modo Examen desde la materia", () => {
  it("está declarada con origen en `UX02` y destino `UX07`", () => {
    expect(ctaRegistry["CTA-019"].origen).toContain("UX02");
    expect(ctaRegistry["CTA-019"].destino).toBe("UX07");
  });

  it("y transporta la cursada, como `CTA-001` y `CTA-009`", () => {
    // `UX07` elige entre los `Assessment` **de esta cursada**: sin el id
    // elegiría por su cuenta, que es el defecto que ADR-054 cerró.
    expect(ctaRegistry["CTA-019"].parametro?.nombre).toBe("cursada");
  });

  it("la pantalla la ofrece y avisa con el clic", () => {
    const ver = vi.fn();
    render(
      <MateriaCursado
        {...getEscenario("FX-DAY-BASE").materia!}
        modoExamen="Activar Modo Examen"
        onModoExamen={ver}
      />,
    );
    screen.getByText("Activar Modo Examen").click();
    expect(ver).toHaveBeenCalledTimes(1);
  });

  it("sin evaluación no se renderiza: no se renderiza deshabilitada", () => {
    render(
      <MateriaCursado {...getEscenario("FX-DAY-BASE").materia!} evaluacion={null} modoExamen={null} />,
    );
    expect(screen.queryByText("Activar Modo Examen")).toBeNull();
  });
});

describe("§5 · La pantalla proyecta y no decide", () => {
  const props = getEscenario("FX-DAY-BASE").materia!;

  it("dibuja el panel de temas con su eje", () => {
    /*
      Se proyecta un estado real en vez de usar el fixture: `FX-DAY-BASE`
      declara un mundo **anterior a la B6.15** y trae `gantt: null`, así que la
      pantalla —correctamente— no dibuja el panel. Probar con él no probaría el
      panel: probaría que sin datos no se dibuja, que es otro test.
    */
    const conTemas = proyectarMateria({
      ...base,
      unidades: [unidad({ primeraClaseEn: "2026-09-01", evaluaEn: "2026-09-20" })],
      clases: [{ tipo: null, minutos: 120, temas: ["Series numéricas"] }],
    });
    render(<MateriaCursado {...conTemas} />);
    expect(screen.getByText("Temas del programa")).toBeTruthy();
    expect(screen.getByText("hoy")).toBeTruthy();
    expect(screen.getByText("Series numéricas")).toBeTruthy();
  });

  it("y sin unidades no dibuja un panel vacío", () => {
    render(<MateriaCursado {...props} />);
    expect(screen.queryByText("Temas del programa")).toBeNull();
  });

  it("y una sola CTA primaria, como manda `I-06`", () => {
    // La entrada a Modo Examen es **secundaria**: la acción que esta pantalla
    // propone sigue siendo la próxima acción. Dos primarias serían dos
    // propuestas compitiendo.
    const { container } = render(<MateriaCursado {...props} />);
    expect(container.querySelectorAll("[data-cta-primaria]")).toHaveLength(1);
  });
});
