import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

import { HoyAutogestion } from "@/components/screens/hoy-autogestion";
import type {
  HeroProjection,
  HoyProps,
  RepartoProjection,
  RiesgoProyectado,
  TableroProps,
} from "@/lib/domain/view-models";
import type { HeroLevel } from "@/lib/domain/precedence";

/**
 * El tablero de `UX01` — [ADR-093](../docs/decisions.md#adr-093), con el cuadro
 * de hoy de [ADR-094](../docs/decisions.md#adr-094) y **sin las evaluaciones**,
 * que [ADR-096](../docs/decisions.md#adr-096) retiró.
 *
 * Lo que se prueba no es que los bloques se dibujen: es que **digan la verdad
 * cuando no saben**. Sin fecha no hay cuenta regresiva, sin clases dadas el
 * vacío no dice «todo hecho», y ningún vacío afirma que no hay riesgos.
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
  tablero: null,
};

function tablero(over: Partial<TableroProps> = {}): TableroProps {
  return {
    proximaEvaluacion: { dias: 12 },
    riesgos: [],
    hoy: {
      clases: [{ cursadaId: "ce-2", hora: "08:00–10:00", materia: "Química", detalle: "Un. 5 · Aula 3.12", cuando: null, entrada: null }],
      claseAbierta: null,
      avanzar: [{ cursadaId: "ce-1", materia: "Análisis Matemático II", unidades: "Un. 1 · 2 · 3 +2" }],
      vacioDeAvance: "Lo dado en clase ya tiene evidencia.",
      horarios: [{ tipo: "DISPONIBLE", hora: "18:00–20:00", texto: "Disponible para estudiar", cursadaId: null }],
      notas: [
        "Horarios y aulas estimados por Achieve, no publicados por la facultad.",
        "Un.: la unidad de la última clase dada.",
      ],
    },
    ...over,
  };
}

const riesgo = (over: Partial<RiesgoProyectado> = {}): RiesgoProyectado => ({
  regla: "COBERTURA_BAJA_CERCA",
  motor: "ACADEMICO",
  titulo: "Análisis Matemático II: evaluación en 4 días con 0% de cobertura",
  detalle: "Menos de la mitad del tiempo estimado tiene evidencia enviada, a una semana o menos.",
  cursadaId: "ce-1",
  // ADR-096: el nombre viaja en el riesgo, no en otra sección de la pantalla.
  materia: "Análisis Matemático II",
  ...over,
});

describe("sin tablero, `UX01` sigue siendo la pantalla que conduce", () => {
  it("no dibuja el cuadro de hoy, los riesgos ni las evaluaciones", () => {
    render(<HoyAutogestion {...BASE} />);
    expect(screen.queryByLabelText("Tu día")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Riesgos detectados")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Próximas evaluaciones")).not.toBeInTheDocument();
  });

  it("el Hero sigue estando: la capa que conduce no depende de la que acompaña", () => {
    render(<HoyAutogestion {...BASE} />);
    expect(screen.getByText("Completá la práctica de Modelo de negocio")).toBeInTheDocument();
  });

  /**
   * ADR-093: el owner sacó de Hoy la cola, el mapa y el reparto. **Los datos
   * siguen en `HoyProps`**; si la pantalla los volviera a dibujar, esto rompe.
   */
  it("lo que ADR-093 retiró no se dibuja aunque los datos lleguen", () => {
    const reparto: RepartoProjection = {
      disponible: "0,5 h",
      requerido: "49 h",
      falta: true,
      tramo: "CRITICA",
      titulo: "Tu plan no entra completo en el tiempo disponible.",
      cifras: "Esta semana declaraste 0,5 h disponibles.",
      aclaracion: "Es una estimación para organizarte; no predice tu resultado.",
      acciones: ["Elegir qué priorizar"],
      materias: [{ cursadaId: "ce-9", nombre: "Física I", asignado: "0 h", motivo: "POR_URGENCIA" }],
      regla: "Es una estimación, no una agenda.",
    };
    render(
      <HoyAutogestion
        {...BASE}
        materias={[{ cursadaId: "ce-9", nombre: "Física I", estado: null, ultimoAvance: null, tono: "neutral" }]}
        reparto={reparto}
        tablero={tablero()}
      />,
    );
    expect(screen.queryByText("Física I")).not.toBeInTheDocument();
    expect(screen.queryByText("Tus horas esta semana")).not.toBeInTheDocument();
    expect(screen.queryByText("Los próximos 14 días")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Siguiente")).not.toBeInTheDocument();
  });
});

describe("el encabezado", () => {
  it("dice para qué es la pantalla", () => {
    render(<HoyAutogestion {...BASE} />);
    expect(screen.getByText("Qué necesita atención hoy")).toBeInTheDocument();
  });

  it("la píldora lleva la fecha y los días a la próxima evaluación", () => {
    render(<HoyAutogestion {...BASE} tablero={tablero()} />);
    expect(screen.getByText("12 días")).toBeInTheDocument();
    expect(screen.getByText(/para la próxima evaluación/)).toBeInTheDocument();
  });

  it("si es hoy, lo dice en vez de «0 días»", () => {
    render(<HoyAutogestion {...BASE} tablero={tablero({ proximaEvaluacion: { dias: 0 } })} />);
    expect(screen.getByText("Hoy tenés una evaluación")).toBeInTheDocument();
    expect(screen.queryByText("0 días")).not.toBeInTheDocument();
  });

  it("sin ninguna fecha, la píldora es la fecha sola: no inventa una cuenta", () => {
    render(<HoyAutogestion {...BASE} tablero={tablero({ proximaEvaluacion: null })} />);
    expect(screen.getByText("jue 10 sep")).toBeInTheDocument();
    expect(screen.queryByText(/para la próxima evaluación/)).not.toBeInTheDocument();
  });
});

describe("las evaluaciones salieron de `UX01` — ADR-096", () => {
  /**
   * El owner miró las dos formas que ADR-093 puso a comparar —tarjetas y
   * carril— y **descartó las dos**. Lo que queda de las evaluaciones en esta
   * pantalla es **el número de la píldora**; el listado vive en `/materias`.
   */
  it("no hay tarjetas, no hay carril, y no queda una sección vacía", () => {
    render(<HoyAutogestion {...BASE} tablero={tablero()} />);
    expect(screen.queryByLabelText("Opción 1 · tarjetas")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Opción 2 · carril")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Próximas evaluaciones")).not.toBeInTheDocument();
  });

  it("la pantalla tiene exactamente tres cuerpos: Hero, Tu día y Riesgos", () => {
    render(<HoyAutogestion {...BASE} tablero={tablero()} />);
    expect(screen.getByText("Completá la práctica de Modelo de negocio")).toBeInTheDocument();
    expect(screen.getByLabelText("Tu día")).toBeInTheDocument();
    expect(screen.getByLabelText("Riesgos detectados")).toBeInTheDocument();
  });
});

describe("riesgos detectados", () => {
  it("cuenta los que hay y los enuncia", () => {
    const tb = tablero({
      riesgos: [riesgo(), riesgo({ regla: "PLAN_NO_ENTRA", motor: "PERSONAL", titulo: "Tu plan no entra completo en el tiempo disponible.", detalle: null, cursadaId: null, materia: null })],
    });
    render(<HoyAutogestion {...BASE} tablero={tb} />);
    const r = screen.getByLabelText("Riesgos detectados");
    expect(r).toHaveTextContent("2 detectados");
    expect(r).toHaveTextContent("evaluación en 4 días con 0% de cobertura");
  });

  it("en singular con uno", () => {
    render(<HoyAutogestion {...BASE} tablero={tablero({ riesgos: [riesgo()] })} />);
    expect(screen.getByLabelText("Riesgos detectados")).toHaveTextContent("1 detectado");
  });

  it("sin riesgos lo dice, **sin afirmar que todo está bien**", () => {
    render(<HoyAutogestion {...BASE} tablero={tablero()} />);
    const r = screen.getByLabelText("Riesgos detectados");
    expect(r).toHaveTextContent("Ninguna regla se cumple con lo que está cargado hoy.");
    expect(r.textContent ?? "").not.toMatch(/todo bien|vas bien|bajo control/i);
  });

  it("uno de una materia ofrece abrirla; uno sin materia no ofrece nada", () => {
    const abrir = vi.fn();
    const tb = tablero({
      riesgos: [riesgo(), riesgo({ regla: "EVALUACIONES_ENCIMADAS", titulo: "2 evaluaciones el mismo día", cursadaId: null, materia: null })],
    });
    render(<HoyAutogestion {...BASE} tablero={tb} onAbrirMateria={abrir} />);
    const botones = within(screen.getByLabelText("Riesgos detectados")).getAllByRole("button", { name: "Abrir materia" });
    expect(botones).toHaveLength(1);
    fireEvent.click(botones[0] as HTMLElement);
    expect(abrir.mock.calls[0]?.[0]).toMatchObject({ cursadaId: "ce-1", nombre: "Análisis Matemático II" });
  });

  it("dice qué son: avisos para organizarse, no una evaluación de la persona", () => {
    render(<HoyAutogestion {...BASE} tablero={tablero()} />);
    expect(screen.getByLabelText("Riesgos detectados")).toHaveTextContent(
      /no evalúan cómo vas ni predicen tu resultado/,
    );
  });
});

describe("el cuadro de hoy — ADR-094", () => {
  const cuadro = () => screen.getByLabelText("Tu día");
  const bloque = (nombre: string) => cuadro().querySelector(`[data-bloque="${nombre}"]`) as HTMLElement;

  it("las clases de hoy van con hora, materia, unidad y aula", () => {
    render(<HoyAutogestion {...BASE} tablero={tablero()} />);
    // Dos renglones: hora y materia arriba, unidad y aula abajo — en una sola
    // línea el aula se cortaba, y un dato ilegible es lo mismo que no tenerlo.
    expect(bloque("clases")).toHaveTextContent("08:00–10:00");
    expect(bloque("clases")).toHaveTextContent("Química");
    expect(bloque("clases")).toHaveTextContent("Un. 5 · Aula 3.12");
  });

  it("dice qué significa «Un.» y que horarios y aulas son estimados", () => {
    render(<HoyAutogestion {...BASE} tablero={tablero()} />);
    expect(cuadro()).toHaveTextContent("Un.: la unidad de la última clase dada.");
    expect(cuadro()).toHaveTextContent("estimados por Achieve, no publicados por la facultad");
  });

  it("podés avanzar: la materia y sus unidades; tocarla abre esa materia", () => {
    const abrir = vi.fn();
    render(<HoyAutogestion {...BASE} tablero={tablero()} onAbrirMateria={abrir} />);
    expect(bloque("avanzar")).toHaveTextContent("Un. 1 · 2 · 3 +2");
    fireEvent.click(within(bloque("avanzar")).getByRole("button", { name: "Análisis Matemático II" }));
    expect(abrir.mock.calls[0]?.[0]).toMatchObject({ cursadaId: "ce-1" });
  });

  it("**no es una agenda**: clases y horarios no tienen un solo botón", () => {
    render(<HoyAutogestion {...BASE} tablero={tablero()} onAbrirMateria={vi.fn()} />);
    expect(bloque("clases").querySelectorAll("button")).toHaveLength(0);
    expect(bloque("horarios").querySelectorAll("button")).toHaveLength(0);
  });

  /*
    **ADR-098 §8 enmienda ADR-094 §5**, y lo hace angosto: sólo la fila de una
    clase en curso o por empezar lleva `CTA-022`. Sigue sin haber agenda —ni
    un botón en *Horarios*, ni en las filas que no están ahora—.
  */
  it("ADR-098: la fila en curso lleva «Entrar a clase», y sólo ésa", () => {
    const entrar = vi.fn();
    const hoy = {
      ...tablero().hoy,
      clases: [
        { cursadaId: "ce-2", hora: "08:00–10:00", materia: "Química", detalle: null, cuando: "Ahora", entrada: { tipo: "ENTRAR" as const, bloqueId: "b-1" } },
        { cursadaId: "ce-3", hora: "14:00–16:00", materia: "Física", detalle: null, cuando: null, entrada: null },
      ],
    };
    render(<HoyAutogestion {...BASE} tablero={tablero({ hoy })} onEntrarAClase={entrar} />);
    const botones = within(bloque("clases")).getAllByRole("button");
    expect(botones).toHaveLength(1);
    expect(bloque("clases")).toHaveTextContent("Ahora");
    fireEvent.click(within(bloque("clases")).getByRole("button", { name: /Entrar a clase/ }));
    expect(entrar).toHaveBeenCalledWith({ cursadaId: "ce-2", bloqueId: "b-1" });
    expect(bloque("horarios").querySelectorAll("button")).toHaveLength(0);
  });

  it("ADR-098: con la clase ya abierta, la fila dice «Volver a la clase»", () => {
    const hoy = {
      ...tablero().hoy,
      clases: [{ cursadaId: "ce-2", hora: "08:00–10:00", materia: "Química", detalle: null, cuando: "Ahora", entrada: { tipo: "VOLVER" as const, bloqueId: "b-1" } }],
    };
    render(<HoyAutogestion {...BASE} tablero={tablero({ hoy })} onEntrarAClase={vi.fn()} />);
    expect(within(bloque("clases")).getByRole("button", { name: /Volver a la clase/ })).toBeInTheDocument();
  });

  it("ADR-098: una clase abierta que no es de hoy igual se ve, con su vuelta", () => {
    const volver = vi.fn();
    const hoy = { ...tablero().hoy, claseAbierta: { cursadaId: "ce-9", materia: "Álgebra" } };
    render(<HoyAutogestion {...BASE} tablero={tablero({ hoy })} onEntrarAClase={volver} />);
    expect(bloque("clases")).toHaveTextContent("Tenés una clase abierta");
    fireEvent.click(within(bloque("clases")).getByRole("button", { name: /Volver a la clase/ }));
    expect(volver).toHaveBeenCalledWith({ cursadaId: "ce-9", bloqueId: null });
  });

  it("ADR-098: sin quién atienda la entrada, no se dibuja el botón", () => {
    const hoy = {
      ...tablero().hoy,
      clases: [{ cursadaId: "ce-2", hora: "08:00–10:00", materia: "Química", detalle: null, cuando: "Ahora", entrada: { tipo: "ENTRAR" as const, bloqueId: "b-1" } }],
    };
    render(<HoyAutogestion {...BASE} tablero={tablero({ hoy })} />);
    expect(bloque("clases").querySelectorAll("button")).toHaveLength(0);
  });

  it("cada bloque vacío dice lo suyo, y avanzar no confunde «sin clases dadas» con «todo hecho»", () => {
    const hoy = { clases: [], claseAbierta: null, avanzar: [], vacioDeAvance: "Todavía no hay clases dadas cargadas.", horarios: [], notas: [] };
    render(<HoyAutogestion {...BASE} tablero={tablero({ hoy })} />);
    expect(bloque("clases")).toHaveTextContent("Hoy no tenés clases cargadas.");
    expect(bloque("avanzar")).toHaveTextContent("Todavía no hay clases dadas cargadas.");
    expect(bloque("horarios")).toHaveTextContent("Sin compromisos ni franjas declaradas para hoy.");
  });
});

describe("la composición adaptativa — ADR-089 §4, conservada por ADR-093", () => {
  it.each<[string, HeroLevel]>([
    ["rescate", "RESCUE_REQUIRED"],
    ["incumplimiento", "COMMITMENT_MISSED"],
  ])("en %s la pantalla se repliega: menos información, no más", (_, nivel) => {
    render(<HoyAutogestion {...BASE} hero={{ ...HERO, nivel }} tablero={tablero({ riesgos: [riesgo()] })} />);
    expect(screen.queryByLabelText("Tu día")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Riesgos detectados")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Próximas evaluaciones")).not.toBeInTheDocument();
    // El Hero **nunca** se repliega: es la única conducta primaria.
    expect(screen.getByText("Completá la práctica de Modelo de negocio")).toBeInTheDocument();
  });
});

describe("el Hero — ADR-088 Enmienda 5 aplicada a `UX01`", () => {
  it("un tema TODO EN MAYÚSCULAS se escribe con mayúscula inicial, y una sola vez", () => {
    const hero: HeroProjection = {
      ...HERO,
      contexto: "ANALISIS MATEMATICO III · FUNCIONES DE VARIABLE COMPLEJA",
      titulo: "FUNCIONES DE VARIABLE COMPLEJA",
    };
    render(<HoyAutogestion {...BASE} hero={hero} />);
    expect(screen.getByText("Funciones de variable compleja")).toBeInTheDocument();
    // El romano sobrevive, y el tema no se repite en el eyebrow.
    expect(screen.getByText("Analisis matematico III")).toBeInTheDocument();
    expect(screen.getAllByText(/funciones de variable compleja/i)).toHaveLength(1);
  });

  it("un título ya bien escrito no se toca", () => {
    render(<HoyAutogestion {...BASE} />);
    expect(screen.getByText("Completá la práctica de Modelo de negocio")).toBeInTheDocument();
    expect(screen.getByText("Emprendedorismo")).toBeInTheDocument();
  });
});
