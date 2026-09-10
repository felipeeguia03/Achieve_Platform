import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { HoyAutogestion } from "@/components/screens/hoy-autogestion";
import type {
  HeroProjection,
  HoyProps,
  MateriaEnIndice,
  MateriasProps,
} from "@/lib/domain/view-models";
import type { HeroLevel } from "@/lib/domain/precedence";

/**
 * La capa «anticipar» de `UX01` — [ADR-089](../docs/decisions.md#adr-089).
 *
 * Lo que se prueba no es que el mapa se dibuje: es que **diga la verdad cuando
 * no sabe**. Las tres ausencias que ADR-078 y ADR-072 dejaron escritas —sin
 * fecha de evaluación no hay ventana, sin primera clase el inicio no es un
 * hecho, sin cobertura no se dibuja barra— son exactamente donde una pantalla
 * de panorama se vuelve una pantalla que promete.
 */

const HERO: HeroProjection = {
  nivel: "ACTION_RECOMMENDED",
  variante: null,
  contexto: "Emprendedorismo",
  titulo: "Completá la práctica de Modelo de negocio",
  razon: "el tema entra en el final",
  tiempoOEstado: "45 minutos",
  evidenciaEsperada: null,
  queSigue: null,
  chip: null,
};

const BASE: HoyProps = {
  fecha: "jue 10 sep",
  estadoGeneral: "EN CURSO",
  hero: HERO,
  materias: [],
  recuperacion: null,
  reparto: null,
  verProgreso: null,
  panorama: null,
};

function materia(over: Partial<MateriaEnIndice> = {}): MateriaEnIndice {
  return {
    cursadaId: "ce-1",
    nombre: "Análisis Matemático II",
    evaluacion: "Final · escrito · vie 12 sep",
    faltan: "12 d",
    cobertura: { fraccion: 0.26, texto: "1 de 9 temas · 26% de las horas" },
    sinCobertura: null,
    ultimoAvance: "hace 7 días",
    ventana: { desde: 0.1, hasta: 0.7, inicioDesconocido: false },
    etiqueta: "Abrir",
    tono: "neutral",
    ...over,
  };
}

function panorama(over: Partial<MateriasProps> = {}): MateriasProps {
  return {
    fecha: "jue 10 sep",
    eje: {
      marcas: [
        { etiqueta: "−2 sem", posicion: 0, esHoy: false },
        { etiqueta: "hoy", posicion: 0.4, esHoy: true },
        { etiqueta: "+3 sem", posicion: 1, esHoy: false },
      ],
      hoy: 0.4,
    },
    proximaEvaluacion: "12 días para el próximo final",
    materias: [materia()],
    aclaracion: "Cobertura: temas con evidencia enviada sobre el total cargado.",
    ...over,
  };
}

describe("sin panorama, `UX01` es exactamente la de antes", () => {
  it("no dibuja ni la evaluación ni el mapa", () => {
    render(<HoyAutogestion {...BASE} />);
    expect(screen.queryByLabelText("Próxima evaluación")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Los próximos 14 días")).not.toBeInTheDocument();
  });

  it("el Hero sigue estando: la capa que conduce no depende de la que acompaña", () => {
    render(<HoyAutogestion {...BASE} />);
    expect(screen.getByText("Completá la práctica de Modelo de negocio")).toBeInTheDocument();
  });
});

describe("próxima evaluación", () => {
  it("muestra los días que faltan, la materia y la evaluación", () => {
    render(<HoyAutogestion {...BASE} panorama={panorama()} />);
    const card = screen.getByLabelText("Próxima evaluación");
    expect(card).toHaveTextContent("12 d");
    expect(card).toHaveTextContent("Análisis Matemático II");
    expect(card).toHaveTextContent("Final · escrito · vie 12 sep");
  });

  it("la cobertura va **con su texto**, nunca sola como porcentaje", () => {
    render(<HoyAutogestion {...BASE} panorama={panorama()} />);
    // ADR-072: los dos números conviven a propósito. Una barra sin el conteo
    // sería el score de máquina que el producto se prohíbe.
    expect(screen.getByLabelText("Próxima evaluación")).toHaveTextContent(
      "1 de 9 temas · 26% de las horas",
    );
  });

  it("sin cobertura dice **por qué**, en lugar de dibujar una barra vacía", () => {
    const p = panorama({
      materias: [materia({ cobertura: null, sinCobertura: "todavía no cargaste temas" })],
    });
    render(<HoyAutogestion {...BASE} panorama={p} />);
    expect(screen.getByLabelText("Próxima evaluación")).toHaveTextContent(
      "todavía no cargaste temas",
    );
  });

  /**
   * ⚠️ **La diferencia que más importa de toda la capa.**
   *
   * *"No tenés evaluaciones"* es una afirmación tranquilizadora sobre algo que
   * nadie verificó. Lo que el sistema sabe es que **nadie cargó la fecha**, y
   * eso es *sin datos no es cero* (`AGENTS.md` §2.5).
   */
  it("sin fechas cargadas NO dice «no tenés evaluaciones»", () => {
    const p = panorama({
      materias: [materia({ evaluacion: null, faltan: null, ventana: null })],
      proximaEvaluacion: null,
    });
    render(<HoyAutogestion {...BASE} panorama={p} />);
    const card = screen.getByLabelText("Próxima evaluación");
    expect(card).toHaveTextContent("Ninguna de tus materias tiene fecha de evaluación cargada");
    expect(card.textContent ?? "").not.toMatch(/no ten[ée]s (evaluaciones|ex[áa]menes)/i);
  });

  it("no toma una evaluación ya pasada: sin fecha futura, la fila no cuenta", () => {
    const p = panorama({ materias: [materia({ evaluacion: "Parcial 1", faltan: null })] });
    render(<HoyAutogestion {...BASE} panorama={p} />);
    expect(screen.getByLabelText("Próxima evaluación")).toHaveTextContent(
      "Ninguna de tus materias tiene fecha",
    );
  });
});

describe("el mapa de catorce días", () => {
  it("dibuja una fila por materia y la etiqueta del eje", () => {
    render(<HoyAutogestion {...BASE} panorama={panorama()} />);
    const mapa = screen.getByLabelText("Los próximos 14 días");
    expect(mapa).toHaveTextContent("Análisis Matemático II");
    expect(mapa).toHaveTextContent("hoy");
  });

  /** ADR-078: una barra hasta el borde del eje le inventaría un plazo. */
  it("sin fecha de evaluación **no hay ventana**, y lo dice", () => {
    const p = panorama({ materias: [materia({ ventana: null, faltan: null })] });
    render(<HoyAutogestion {...BASE} panorama={p} />);
    expect(screen.getByLabelText("Los próximos 14 días")).toHaveTextContent(
      "sin ventana de preparación",
    );
  });

  it("lleva la aclaración de cobertura de ADR-072 cuando hay barras", () => {
    render(<HoyAutogestion {...BASE} panorama={panorama()} />);
    expect(screen.getByLabelText("Los próximos 14 días")).toHaveTextContent(
      "Cobertura: temas con evidencia enviada sobre el total cargado.",
    );
  });

  it("explica qué significa una barra: sin eso, las formas no dicen nada", () => {
    render(<HoyAutogestion {...BASE} panorama={panorama()} />);
    expect(screen.getByLabelText("Los próximos 14 días")).toHaveTextContent(
      "Cada barra es la ventana de preparación hasta la evaluación",
    );
  });

  it("sin materias no dibuja un mapa vacío que parezca un plan", () => {
    render(<HoyAutogestion {...BASE} panorama={panorama({ materias: [], proximaEvaluacion: null })} />);
    expect(screen.getByLabelText("Los próximos 14 días")).toHaveTextContent(
      "Todavía no hay materias con fechas",
    );
  });

  it("el mapa **no es una agenda**: ninguna fila crea nada", () => {
    const abrir = vi.fn();
    render(<HoyAutogestion {...BASE} panorama={panorama()} onAbrirMateria={abrir} />);
    // Los únicos controles del mapa navegan. No hay «agendar», «reprogramar» ni
    // nada que escriba: el *cuándo* vive en el `Commitment` (ADR-064).
    const mapa = screen.getByLabelText("Los próximos 14 días");
    for (const boton of mapa.querySelectorAll("button")) {
      expect(boton.textContent ?? "").not.toMatch(/agendar|reprogramar|planificar|guardar/i);
    }
  });
});

describe("la composición adaptativa — ADR-089 §4", () => {
  const rescate: HeroProjection = { ...HERO, nivel: "RESCUE_REQUIRED" };
  const incumplido: HeroProjection = { ...HERO, nivel: "COMMITMENT_MISSED" };

  it.each<[string, HeroLevel]>([
    ["rescate", "RESCUE_REQUIRED"],
    ["incumplimiento", "COMMITMENT_MISSED"],
  ])("en %s la pantalla se repliega: menos información, no más", (_, nivel) => {
    render(<HoyAutogestion {...BASE} hero={{ ...HERO, nivel }} panorama={panorama()} />);
    expect(screen.queryByLabelText("Los próximos 14 días")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Próxima evaluación")).not.toBeInTheDocument();
  });

  it("y el Hero **nunca** se repliega: es la única conducta primaria", () => {
    for (const hero of [rescate, incumplido]) {
      const { unmount } = render(<HoyAutogestion {...BASE} hero={hero} panorama={panorama()} />);
      expect(screen.getByText("Completá la práctica de Modelo de negocio")).toBeInTheDocument();
      unmount();
    }
  });

  it("en cursado normal el contexto sí se muestra", () => {
    render(<HoyAutogestion {...BASE} panorama={panorama()} />);
    expect(screen.getByLabelText("Los próximos 14 días")).toBeInTheDocument();
  });
});

describe("abrir un objeto desde `UX01` — ADR-088 §10.6", () => {
  it("tocar una materia del mapa la abre **con su cursada**", () => {
    const abrir = vi.fn();
    render(<HoyAutogestion {...BASE} panorama={panorama()} onAbrirMateria={abrir} />);

    const mapa = screen.getByLabelText("Los próximos 14 días");
    fireEvent.click(mapa.querySelectorAll("button")[0] as HTMLElement);

    expect(abrir).toHaveBeenCalledTimes(1);
    expect(abrir.mock.calls[0]?.[0]).toMatchObject({ cursadaId: "ce-1" });
  });

  it("tocar la evaluación abre la misma materia", () => {
    const abrir = vi.fn();
    render(<HoyAutogestion {...BASE} panorama={panorama()} onAbrirMateria={abrir} />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
    expect(abrir.mock.calls[0]?.[0]).toMatchObject({ cursadaId: "ce-1" });
  });

  it("sin espacio de trabajo montado, el mapa **no ofrece la acción**", () => {
    // `undefined` es el Track A sin sesión. Una CTA que no lleva a ningún lado
    // sería peor que la ausencia (`AGENTS.md` §2.2).
    render(<HoyAutogestion {...BASE} panorama={panorama()} />);
    expect(screen.queryByRole("button", { name: "Abrir" })).not.toBeInTheDocument();
  });
});
