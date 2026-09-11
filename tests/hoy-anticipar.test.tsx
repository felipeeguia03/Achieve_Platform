import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

import { HoyAutogestion } from "@/components/screens/hoy-autogestion";
import type {
  HeroProjection,
  HoyProps,
  RepartoProjection,
  RiesgoProyectado,
  TableroProps,
  TarjetaDeEvaluacion,
} from "@/lib/domain/view-models";
import type { HeroLevel } from "@/lib/domain/precedence";

/**
 * El tablero de `UX01` — [ADR-093](../docs/decisions.md#adr-093), que reemplaza
 * la capa «anticipar» de ADR-089.
 *
 * Lo que se prueba no es que las tarjetas se dibujen: es que **digan la verdad
 * cuando no saben**. Sin fecha no hay cuenta regresiva, sin cobertura no hay
 * barra, sin actividad no hay «hace 0 días», y ningún vacío se lee como
 * «no tenés evaluaciones».
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

const NOTA = "* temas marcados por vos sobre el total cargado. No es una nota ni una predicción.";

function tarjeta(over: Partial<TarjetaDeEvaluacion> = {}): TarjetaDeEvaluacion {
  return {
    cursadaId: "ce-1",
    nombre: "Análisis Matemático II",
    evaluacion: { rotulo: "Final", fecha: "vie 12 sept", modalidad: "teórico escrito" },
    dias: 12,
    faltan: "12 d",
    cobertura: { fraccion: 0.26, porcentaje: 26 },
    sinCobertura: null,
    ultimoAvance: "hace 7 días",
    tono: "neutral",
    ...over,
  };
}

function tablero(over: Partial<TableroProps> = {}): TableroProps {
  return {
    proximaEvaluacion: { dias: 12 },
    tarjetas: [tarjeta()],
    aclaracionDeCobertura: NOTA,
    horizonteEnDias: 14,
    riesgos: [],
    hoy: {
      clases: [{ cursadaId: "ce-2", hora: "08:00–10:00", materia: "Química", detalle: "Un. 5 · Aula 3.12" }],
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
  ...over,
});

const opcion1 = () => screen.getByLabelText("Opción 1 · tarjetas");
const opcion2 = () => screen.getByLabelText("Opción 2 · carril");

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

describe("Opción 1 · tarjetas", () => {
  it("cada tarjeta dice tipo, día, modalidad, días que faltan y cobertura", () => {
    render(<HoyAutogestion {...BASE} tablero={tablero()} />);
    const t = opcion1();
    expect(t).toHaveTextContent("Análisis Matemático II");
    expect(t).toHaveTextContent("Final · vie 12 sept · teórico escrito");
    expect(t).toHaveTextContent("12 d");
    expect(t).toHaveTextContent("cobertura 26%");
    expect(t).toHaveTextContent("último avance hace 7 días");
  });

  it("la nota de ADR-072 acompaña a las barras", () => {
    render(<HoyAutogestion {...BASE} tablero={tablero()} />);
    expect(screen.getByLabelText("Próximas evaluaciones")).toHaveTextContent(NOTA);
  });

  it("sin cobertura dice **por qué**, en lugar de una cifra o una barra vacía", () => {
    const tb = tablero({
      tarjetas: [tarjeta({ cobertura: null, sinCobertura: "sin temas cargados — no puedo estimar" })],
      aclaracionDeCobertura: null,
    });
    render(<HoyAutogestion {...BASE} tablero={tb} />);
    expect(opcion1()).toHaveTextContent("sin temas cargados — no puedo estimar");
    expect(opcion1()).not.toHaveTextContent(/cobertura \d/);
  });

  it("sin fecha dice que no hay, y **no dibuja una cuenta en cero**", () => {
    const tb = tablero({ tarjetas: [tarjeta({ evaluacion: null, dias: null, faltan: null })] });
    render(<HoyAutogestion {...BASE} tablero={tb} />);
    expect(opcion1()).toHaveTextContent("sin evaluación con fecha");
    expect(opcion1()).not.toHaveTextContent(/\b0 d\b/);
  });

  it("sin avance no dice «hace 0 días»", () => {
    render(<HoyAutogestion {...BASE} tablero={tablero({ tarjetas: [tarjeta({ ultimoAvance: null })] })} />);
    expect(opcion1()).toHaveTextContent("sin avance registrado");
  });

  /** *Sin datos no es cero* (`AGENTS.md` §2.5): nadie verificó que no haya evaluaciones. */
  it("sin ninguna fecha cargada NO dice «no tenés evaluaciones»", () => {
    const tb = tablero({
      proximaEvaluacion: null,
      tarjetas: [tarjeta({ evaluacion: null, dias: null, faltan: null })],
    });
    render(<HoyAutogestion {...BASE} tablero={tb} />);
    const seccion = screen.getByLabelText("Próximas evaluaciones");
    expect(seccion).toHaveTextContent("Ninguna de tus materias tiene fecha de evaluación cargada");
    expect(seccion.textContent ?? "").not.toMatch(/no ten[ée]s (evaluaciones|ex[áa]menes)/i);
  });

  it("tocar una tarjeta abre la materia **con su cursada**", () => {
    const abrir = vi.fn();
    render(<HoyAutogestion {...BASE} tablero={tablero()} onAbrirMateria={abrir} />);
    fireEvent.click(within(opcion1()).getByRole("button", { name: /Análisis Matemático II/ }));
    expect(abrir.mock.calls[0]?.[0]).toMatchObject({ cursadaId: "ce-1" });
  });

  it("sin espacio de trabajo, cae a `CTA-001` con la misma cursada (ADR-054)", () => {
    const ver = vi.fn();
    render(<HoyAutogestion {...BASE} tablero={tablero()} onVerMateria={ver} />);
    fireEvent.click(within(opcion1()).getByRole("button", { name: /Análisis Matemático II/ }));
    expect(ver).toHaveBeenCalledWith("ce-1");
  });

  it("sin ningún destino, la tarjeta **no es un botón**", () => {
    // Una CTA que no lleva a ningún lado sería peor que la ausencia (`AGENTS.md` §2.2).
    render(<HoyAutogestion {...BASE} tablero={tablero()} />);
    expect(within(opcion1()).queryByRole("button", { name: /Análisis/ })).not.toBeInTheDocument();
  });
});

describe("Opción 2 · carril", () => {
  const dos = () =>
    tablero({
      horizonteEnDias: 21,
      tarjetas: [
        tarjeta(),
        tarjeta({ cursadaId: "ce-2", nombre: "Física I", faltan: "18 d", dias: 18 }),
        tarjeta({ cursadaId: "ce-3", nombre: "Química", evaluacion: null, dias: null, faltan: null }),
      ],
    });

  it("una marca por evaluación con fecha, y el detalle de la primera", () => {
    render(<HoyAutogestion {...BASE} tablero={dos()} />);
    const c = opcion2();
    expect(within(c).getAllByRole("button", { pressed: false }).length).toBeGreaterThan(0);
    expect(within(c).getByRole("button", { pressed: true })).toHaveAccessibleName(/Análisis Matemático II/);
    expect(c.querySelector("[data-detalle]")).toHaveAttribute("data-detalle", "ce-1");
  });

  it("tocar otra marca cambia el detalle", () => {
    render(<HoyAutogestion {...BASE} tablero={dos()} />);
    fireEvent.click(within(opcion2()).getByRole("button", { name: /Física I · 18 d/ }));
    expect(opcion2().querySelector("[data-detalle]")).toHaveAttribute("data-detalle", "ce-2");
  });

  it("las que no tienen fecha **no se ubican en el eje**: van aparte", () => {
    render(<HoyAutogestion {...BASE} tablero={dos()} />);
    const c = opcion2();
    expect(within(c).queryByRole("button", { name: /Química ·/ })).not.toBeInTheDocument();
    expect(c).toHaveTextContent("Sin fecha:");
    fireEvent.click(within(c).getByRole("button", { name: "Química" }));
    expect(opcion2().querySelector("[data-detalle]")).toHaveAttribute("data-detalle", "ce-3");
  });

  it("el detalle abre la materia elegida, no la primera", () => {
    const abrir = vi.fn();
    render(<HoyAutogestion {...BASE} tablero={dos()} onAbrirMateria={abrir} />);
    fireEvent.click(within(opcion2()).getByRole("button", { name: /Física I · 18 d/ }));
    fireEvent.click(within(opcion2()).getByRole("button", { name: "Abrir materia" }));
    expect(abrir.mock.calls[0]?.[0]).toMatchObject({ cursadaId: "ce-2" });
  });
});

describe("riesgos detectados", () => {
  it("cuenta los que hay y los enuncia", () => {
    const tb = tablero({
      riesgos: [riesgo(), riesgo({ regla: "PLAN_NO_ENTRA", motor: "PERSONAL", titulo: "Tu plan no entra completo en el tiempo disponible.", detalle: null, cursadaId: null })],
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
      riesgos: [riesgo(), riesgo({ regla: "EVALUACIONES_ENCIMADAS", titulo: "2 evaluaciones el mismo día", cursadaId: null })],
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

  it("cada bloque vacío dice lo suyo, y avanzar no confunde «sin clases dadas» con «todo hecho»", () => {
    const hoy = { clases: [], avanzar: [], vacioDeAvance: "Todavía no hay clases dadas cargadas.", horarios: [], notas: [] };
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
