/**
 * Gimnasia cognitiva — la pantalla, la navegación y las fronteras de la API ·
 * [ADR-102](../docs/decisions.md#adr-102).
 *
 * Los juegos se juegan enteros con clics sobre botones nativos —que es lo que
 * hace un teclado con Enter o Espacio— y en la **presentación sin tiempo**, así
 * no dependen de temporizadores.
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { Gimnasia, type GimnasiaScreenProps } from "@/components/screens/gimnasia";
import { CadenaInversa } from "@/components/screens/gimnasia/cadena-inversa";
import { CuadriculaFugaz } from "@/components/screens/gimnasia/cuadricula-fugaz";
import { RecuerdoReal } from "@/components/screens/gimnasia/recuerdo-real";
import { SesionDeGimnasia, type AccionesDeGimnasia } from "@/components/screens/gimnasia/sesion";
import { copy } from "@/lib/content/es-AR";
import { invertir, jugarCadena } from "@/lib/domain/gimnasia/cadena-inversa";
import { jugarCuadricula, secuenciaDeRonda } from "@/lib/domain/gimnasia/cuadricula-fugaz";
import type { GimnasiaProps, IntentoEmpezado, PreguntaDeRecuerdo, ResultadoDeIntento } from "@/lib/domain/gimnasia/vista";
import { menu } from "@/lib/navigation/menu";
import { migasDe } from "@/lib/navigation/migas";
import { objetoEnPantalla } from "@/lib/navigation/objeto-en-pantalla";
import { nodos, superficieIds } from "@/lib/navigation/surfaces";

const LEER = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const BASE: GimnasiaProps = {
  simulada: false,
  rutina: { juegos: ["FLASH_GRID", "REVERSE_CHAIN", "REAL_RECALL"], minutos: 8, materias: ["Economía I"], adaptada: false },
  sesionEnCurso: null,
  progreso: { diasConRutina: 0, mejorSecuenciaCuadricula: null, mejorCadena: null, repasosCompletados: 0, recuerdoDiferido: null },
  cuadricula: { mejorPuntuacion: null, intentos: 0 },
  cadena: { nivel: null, largo: null, mejorCadena: null },
  recuerdo: { situacion: "PENDIENTES", pendientes: 4, practicoAntes: false },
};

function portada(over: Partial<GimnasiaScreenProps> = {}) {
  const props: GimnasiaScreenProps = {
    ...BASE,
    onEmpezarRutina: vi.fn(),
    onJugar: vi.fn(),
    onContinuar: vi.fn(),
    onDescartar: vi.fn(),
    ...over,
  };
  const r = render(<Gimnasia {...props} />);
  return { ...r, props };
}

describe("la portada", () => {
  it("dice lo que el owner escribió: eyebrow, título, subtítulo y el aviso responsable", () => {
    portada();
    expect(screen.getByText("Autogestión · Gimnasia cognitiva")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Entrená cómo estudiás" })).toBeInTheDocument();
    expect(screen.getByText("Juegos breves para practicar memoria y aplicar lo aprendido en tus materias.")).toBeInTheDocument();
    expect(screen.getByText(/No miden inteligencia ni constituyen un diagnóstico/)).toBeInTheDocument();
  });

  it("tres tarjetas, una sola categoría y ninguna categoría futura, ni deshabilitada", () => {
    const { container } = portada();
    expect(container.querySelectorAll("[data-juego]")).toHaveLength(3);
    for (const nombre of ["Cuadrícula fugaz", "Cadena inversa", "Recuerdo real"]) {
      expect(screen.getByRole("heading", { level: 3, name: nombre })).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { level: 2, name: "Memoria" })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Atención|Control ejecutivo|Razonamiento|Lenguaje|Próximamente/);
  });

  it("una sola CTA principal: Empezar rutina", () => {
    const { container, props } = portada();
    const principales = container.querySelectorAll("[data-cta-primaria]");
    expect(principales).toHaveLength(1);
    expect(principales[0]).toHaveTextContent("Empezar rutina");
    fireEvent.click(principales[0]);
    expect(props.onEmpezarRutina).toHaveBeenCalled();
  });

  it("la rutina dice duración, cantidad, materias y si está adaptada, sin inventar una materia", () => {
    portada({ rutina: { ...BASE.rutina, adaptada: true } });
    expect(screen.getByText("Memoria · 3 ejercicios")).toBeInTheDocument();
    expect(screen.getByText("8 minutos")).toBeInTheDocument();
    expect(screen.getByText("Incluye contenidos de Economía I")).toBeInTheDocument();
    expect(screen.getByText("Adaptada a tus partidas anteriores")).toBeInTheDocument();
  });

  it("sin datos no es cero: «todavía sin partidas», y el recuerdo diferido no se dibuja", () => {
    const { container } = portada();
    expect(screen.getAllByText("todavía sin partidas").length).toBeGreaterThanOrEqual(2);
    expect(container.textContent).not.toMatch(/Recordadas un día o más después/);
    expect(container.textContent).not.toMatch(/Mejor puntuación: 0/);
  });

  it("con historial: marcas del ejercicio, el nivel con sus dígitos y la CTA según el estado real", () => {
    portada({
      cuadricula: { mejorPuntuacion: 1850, intentos: 2 },
      cadena: { nivel: 3, largo: 5, mejorCadena: 5 },
      recuerdo: { situacion: "PENDIENTES", pendientes: 2, practicoAntes: true },
      progreso: { diasConRutina: 2, mejorSecuenciaCuadricula: 6, mejorCadena: 5, repasosCompletados: 9, recuerdoDiferido: { recordados: 4, total: 6 } },
    });
    expect(screen.getByText("Mejor puntuación: 1850")).toBeInTheDocument();
    expect(screen.getByText("Nivel 3 · 5 dígitos")).toBeInTheDocument();
    expect(screen.getByText("2 repasos para hoy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver a jugar" })).toBeInTheDocument();
    // «Continuar» en Cadena inversa (tiene nivel) y en Recuerdo real (ya practicó): son copy de CTA-025.
    expect(screen.getAllByRole("button", { name: "Continuar" })).toHaveLength(2);
    expect(screen.getByText("4 de 6")).toBeInTheDocument();
  });

  it("sin preguntas: Recuerdo real en preparación, sin botón, y la rutina con los dos genéricos", () => {
    const { container } = portada({
      rutina: { juegos: ["FLASH_GRID", "REVERSE_CHAIN"], minutos: 5, materias: [], adaptada: false },
      recuerdo: { situacion: "SIN_CONTENIDO", pendientes: 0, practicoAntes: false },
    });
    const tarjeta = container.querySelector('[data-juego="Recuerdo real"]') as HTMLElement;
    expect(within(tarjeta).getByText("Prepará tu primer set")).toBeInTheDocument();
    expect(within(tarjeta).queryByRole("button")).toBeNull();
    expect(container.textContent).not.toMatch(/Preparar\b/);
    expect(screen.getByText("Memoria · 2 ejercicios")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Incluye contenidos de/);
  });

  it("al día: Sin repasos pendientes y sin botón", () => {
    const { container } = portada({ recuerdo: { situacion: "AL_DIA", pendientes: 0, practicoAntes: true } });
    const tarjeta = container.querySelector('[data-juego="Recuerdo real"]') as HTMLElement;
    expect(within(tarjeta).getByText("Sin repasos pendientes")).toBeInTheDocument();
    expect(within(tarjeta).queryByRole("button")).toBeNull();
  });

  it("con una sesión sin terminar: se retoma o se descarta; no se ofrece empezar otra", () => {
    const { container, props } = portada({
      sesionEnCurso: { id: "s1", origen: "ROUTINE", juegos: ["FLASH_GRID", "REVERSE_CHAIN", "REAL_RECALL"], completados: ["FLASH_GRID"], iniciadaEn: "2026-09-13T15:00:00Z" },
    });
    expect(screen.getByText("Tenés una rutina sin terminar")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Empezar rutina" })).toBeNull();
    expect(container.querySelectorAll("[data-juego] button")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Descartar" }));
    expect(props.onContinuar).toHaveBeenCalled();
    expect(props.onDescartar).toHaveBeenCalled();
  });

  it("la demo lo dice arriba, y un rechazo del backend se anuncia", () => {
    portada({ simulada: true, aviso: "Tenés otra sesión sin terminar." });
    expect(screen.getByRole("note")).toHaveTextContent(/sintéticas/);
    expect(screen.getByRole("alert")).toHaveTextContent("Tenés otra sesión sin terminar.");
  });
});

describe("el copy no habla de la persona", () => {
  const textos = Object.entries(copy).filter(([id]) => id.startsWith("GIMNASIA.")).map(([, v]) => String(v));

  it("sin inteligencia medida, diagnóstico, edad cerebral, porcentajes de mejora ni urgencia", () => {
    const todo = textos.join("\n");
    expect(todo).not.toMatch(/edad cerebral|coeficiente|cociente|déficit|tu memoria (es|aumentó)|capacidad cognitiva|\d+\s?%|ranking|compañeros|urgente|¡Rápido/i);
    // «inteligencia» y «diagnóstico» aparecen **sólo** en el aviso que dice que no se miden.
    const conInteligencia = Object.entries(copy).filter(([, v]) => /inteligencia|diagn[oó]stico/i.test(String(v))).map(([id]) => id);
    expect(conInteligencia).toEqual(["GIMNASIA.AVISO_RESPONSABLE"]);
  });

  it("Cadena inversa no se describe como memoria visual", () => {
    expect(copy["GIMNASIA.CADENA.HABILIDAD"]).toBe("Memoria de trabajo");
    expect(textos.filter((t) => /cadena/i.test(t)).join(" ")).not.toMatch(/visual/i);
  });
});

describe("Cuadrícula fugaz, jugada entera", () => {
  it("presentación sin tiempo: cada casilla se anuncia, se repite con botones y la partida se confirma al terminar", async () => {
    const semilla = 17;
    const onTerminar = vi.fn<(r: number[][]) => Promise<boolean>>(async () => true);
    render(<CuadriculaFugaz semilla={semilla} largoInicial={3} onTerminar={onTerminar} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /Presentación sin tiempo/ }));
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));

    const jugar = (ronda: number, largo: number, acertar: boolean) => {
      const secuencia = secuenciaDeRonda(semilla, ronda, largo);
      for (let i = 0; i < largo; i++) {
        // La casilla encendida lleva su número: no depende del color.
        expect(document.querySelector("[data-encendida]")).toHaveTextContent(String(i + 1));
        fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
      }
      expect(screen.getByText("Tu turno: tocá las casillas en el mismo orden")).toBeInTheDocument();
      const casillas = acertar ? secuencia : Array.from({ length: largo }, () => 0);
      for (const c of casillas) fireEvent.click(document.querySelector(`[data-casilla="${c}"]`)!);
    };

    jugar(0, 3, true);
    expect(screen.getByRole("status")).toHaveTextContent("Bien: era esa secuencia.");
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    jugar(1, 4, false);
    expect(screen.getByRole("status")).toHaveTextContent("No era esa secuencia.");
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    jugar(2, 4, false);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    });

    expect(onTerminar).toHaveBeenCalledTimes(1);
    const respuestas = onTerminar.mock.calls[0][0];
    const r = jugarCuadricula(semilla, 3, respuestas);
    expect(r.estado === "OK" && r.partida.terminada).toBe(true);
  });

  it("cada casilla es un botón con su fila y columna", () => {
    render(<CuadriculaFugaz semilla={1} largoInicial={3} onTerminar={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
    expect(screen.getAllByRole("button", { name: /Casilla fila \d, columna \d/ })).toHaveLength(9);
  });

  it("si no se pudo guardar, lo dice y reintentar es seguro", async () => {
    const onTerminar = vi.fn(async () => false);
    render(<CuadriculaFugaz semilla={2} largoInicial={3} onTerminar={onTerminar} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
    for (let ronda = 0; ronda < 2; ronda++) {
      for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
      for (let i = 0; i < 3; i++) fireEvent.click(document.querySelector('[data-casilla="0"]')!);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
      });
    }
    expect(screen.getByText(/Reintentar es seguro/)).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    });
    expect(onTerminar).toHaveBeenCalledTimes(2);
  });
});

describe("Cadena inversa, jugada entera", () => {
  it("se memoriza, se oculta, se escribe al revés y se confirman las cinco pruebas", async () => {
    const semilla = 23;
    const onTerminar = vi.fn<(r: string[]) => Promise<boolean>>(async () => true);
    render(<CadenaInversa semilla={semilla} largoInicial={3} onTerminar={onTerminar} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));

    for (let i = 0; i < 5; i++) {
      const cadena = (document.querySelector("[data-cadena]")!.textContent ?? "").replace(/\s/g, "");
      fireEvent.click(screen.getByRole("button", { name: "Ya lo memoricé" }));
      // Oculta mientras se responde.
      expect(document.querySelector("[data-cadena]")).toBeNull();
      const campo = screen.getByLabelText("Tu respuesta, al revés");
      // Pegar está bloqueado: anularía el ejercicio.
      expect(fireEvent.paste(campo)).toBe(false);
      fireEvent.change(campo, { target: { value: i === 1 ? "000" : invertir(cadena).split("").join(" ") } });
      fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
      expect(screen.getByRole("status")).toHaveTextContent(i === 1 ? /No era así/ : /Bien/);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
      });
    }
    expect(onTerminar).toHaveBeenCalledTimes(1);
    const respuestas = onTerminar.mock.calls[0][0];
    const r = jugarCadena(semilla, 3, respuestas);
    expect(r.estado === "OK" && r.partida.resultado.aciertos).toBe(4);
  });
});

const PREGUNTA_CERRADA: PreguntaDeRecuerdo = {
  itemId: "q1", pregunta: "¿Qué es la oferta?", tipo: "SHORT_ANSWER", opciones: null, materia: "Economía I", sintetica: true, posicion: 0, total: 2,
};
const PREGUNTA_ABIERTA: PreguntaDeRecuerdo = { ...PREGUNTA_CERRADA, itemId: "q2", tipo: "SELF_ASSESSED", materia: null, posicion: 1 };

const FINAL: ResultadoDeIntento = {
  resumen: { juego: "REAL_RECALL", respondidas: 2, recordadas: 1, parciales: 1, noRecordadas: 0, materias: ["Economía I"], proximoRepaso: "2026-09-14" },
  sesionCompletada: true,
  duracionSegundos: 95,
  sesion: {
    juegos: [
      { resumen: { juego: "FLASH_GRID", puntuacion: 700, secuenciaMaxima: 4, aciertos: 2, errores: 2, rondas: 4, marca: "NUEVA" }, duracionSegundos: 120 },
      { resumen: { juego: "REVERSE_CHAIN", aciertos: 4, errores: 1, largoMaximoCorrecto: 6, nivelAnterior: 3, nivel: 4, marca: "SIN_CAMBIO" }, duracionSegundos: 90 },
      { resumen: { juego: "REAL_RECALL", respondidas: 2, recordadas: 1, parciales: 1, noRecordadas: 0, materias: ["Economía I"], proximoRepaso: "2026-09-14" }, duracionSegundos: 95 },
    ],
    duracionSegundos: 305,
  },
};

describe("Recuerdo real", () => {
  it("cerrada: la referencia no está hasta confirmar; abierta: revela, autoevalúa y termina", async () => {
    const onResponder = vi.fn()
      .mockResolvedValueOnce({ estado: "OK", registrada: { correcta: true, resultado: "RECALLED", respuestaCanonica: "La cantidad que se ofrece.", explicacion: null, proximoRepaso: "2026-09-16", siguiente: PREGUNTA_ABIERTA, final: null } })
      .mockResolvedValueOnce({ estado: "REVELADA", respuestaCanonica: "Referencia abierta.", explicacion: null })
      .mockResolvedValueOnce({ estado: "OK", registrada: { correcta: null, resultado: "PARTIAL", respuestaCanonica: "Referencia abierta.", explicacion: null, proximoRepaso: "2026-09-14", siguiente: null, final: FINAL } });
    const onTerminado = vi.fn();
    render(<RecuerdoReal primera={PREGUNTA_CERRADA} onResponder={onResponder} onTerminado={onTerminado} onSalirGuardando={vi.fn()} />);

    expect(screen.getByText("Pregunta sintética de ejemplo")).toBeInTheDocument();
    expect(screen.queryByText("La cantidad que se ofrece.")).toBeNull();
    fireEvent.change(screen.getByLabelText("Tu respuesta"), { target: { value: "oferta" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirmar respuesta" }));
    });
    expect(onResponder).toHaveBeenLastCalledWith(expect.objectContaining({ item: "q1", accion: "RESPONDER", respuesta: "oferta" }));
    expect(screen.getByText("La cantidad que se ofrece.")).toBeInTheDocument();
    expect(screen.getByText("Vuelve a aparecer el 16/09")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("General")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Tu respuesta"), { target: { value: "lo que me acuerdo" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirmar respuesta" }));
    });
    // Revelar no manda el texto: no se guarda.
    expect(onResponder).toHaveBeenLastCalledWith({ item: "q2", accion: "REVELAR" });
    expect(screen.getByText("¿Cómo la recordaste?")).toBeInTheDocument();
    for (const b of ["No la recordé", "La recordé parcialmente", "La recordé", "Me resultó fácil"]) {
      expect(screen.getByRole("button", { name: b })).toBeInTheDocument();
    }
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "La recordé parcialmente" }));
    });
    expect(onResponder).toHaveBeenLastCalledWith(expect.objectContaining({ item: "q2", accion: "AUTOEVALUAR", resultado: "PARTIAL" }));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onTerminado).toHaveBeenCalledWith(FINAL);
  });

  it("opción múltiple y verdadero/falso se responden con controles nativos", () => {
    render(
      <RecuerdoReal
        primera={{ ...PREGUNTA_CERRADA, tipo: "MULTIPLE_CHOICE", opciones: [{ id: "a", texto: "Uno" }, { id: "b", texto: "Dos" }] }}
        onResponder={vi.fn()} onTerminado={vi.fn()} onSalirGuardando={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Confirmar respuesta" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Dos"));
    expect(screen.getByRole("button", { name: "Confirmar respuesta" })).toBeEnabled();
  });

  it("el texto de una pregunta se dibuja como texto, nunca como HTML", () => {
    const { container } = render(
      <RecuerdoReal primera={{ ...PREGUNTA_CERRADA, pregunta: "<img src=x onerror=alert(1)> ¿a < b?" }} onResponder={vi.fn()} onTerminado={vi.fn()} onSalirGuardando={vi.fn()} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/<img src=x/)).toBeInTheDocument();
  });
});

function acciones(over: Partial<AccionesDeGimnasia> = {}): AccionesDeGimnasia {
  return {
    iniciarIntento: vi.fn(async (_s: string, juego: string): Promise<IntentoEmpezado> =>
      juego === "REAL_RECALL"
        ? { juego: "REAL_RECALL", intento: "i-rr", version: "RR-1", pregunta: { ...PREGUNTA_CERRADA, total: 1 } }
        : { juego: "REVERSE_CHAIN", intento: "i-ci", semilla: 1, largoInicial: 3, nivelAnterior: null, version: "CI-1" },
    ),
    confirmarResultado: vi.fn(async () => null),
    responder: vi.fn(async () => ({ estado: "OK" as const, registrada: { correcta: true, resultado: "RECALLED" as const, respuestaCanonica: "x", explicacion: null, proximoRepaso: "2026-09-16", siguiente: null, final: FINAL } })),
    cancelar: vi.fn(async () => true),
    ...over,
  };
}

describe("la rutina", () => {
  it("retoma donde quedó: con la cuadrícula hecha, va 2 de 3 y pide la cadena", async () => {
    const a = acciones();
    await act(async () => {
      render(
        <SesionDeGimnasia
          sesion={{ id: "s1", origen: "ROUTINE", juegos: ["FLASH_GRID", "REVERSE_CHAIN", "REAL_RECALL"], completados: ["FLASH_GRID"], iniciadaEn: "x" }}
          acciones={a} onSalir={vi.fn()} onVolverAHoy={vi.fn()}
        />,
      );
    });
    expect(screen.getByText("2 de 3")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    expect(a.iniciarIntento).toHaveBeenCalledWith("s1", "REVERSE_CHAIN", expect.any(String));
  });

  it("al terminar: Rutina terminada, el resumen, y la CTA principal vuelve a la próxima acción", async () => {
    const onVolverAHoy = vi.fn();
    const onSalir = vi.fn();
    await act(async () => {
      render(
        <SesionDeGimnasia
          sesion={{ id: "s1", origen: "ROUTINE", juegos: ["FLASH_GRID", "REVERSE_CHAIN", "REAL_RECALL"], completados: ["FLASH_GRID", "REVERSE_CHAIN"], iniciadaEn: "x" }}
          acciones={acciones()} onSalir={onSalir} onVolverAHoy={onVolverAHoy}
        />,
      );
    });
    expect(screen.getByText("3 de 3")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Tu respuesta"), { target: { value: "oferta" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirmar respuesta" }));
    });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(screen.getByRole("heading", { name: "Rutina terminada" })).toBeInTheDocument();
    expect(screen.getByText("Materias practicadas")).toBeInTheDocument();
    // Los tres juegos, aunque dos se jugaron antes de montar esta pantalla (una recarga).
    expect(document.querySelectorAll("[data-resumen]")).toHaveLength(3);
    expect(screen.getByText("Nuevo nivel en Cadena inversa: 4", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Duración: 5 min 05 s")).toBeInTheDocument();
    const principal = document.querySelectorAll("[data-cta-primaria]");
    expect(principal).toHaveLength(1);
    expect(principal[0]).toHaveTextContent("Volver a mi próxima acción");
    fireEvent.click(principal[0]);
    expect(onVolverAHoy).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ver todos los juegos" }));
    expect(onSalir).toHaveBeenCalled();
  });

  it("salir sin nada hecho descarta sin preguntar; con progreso, pregunta y ofrece retomar después", async () => {
    const sinNada = acciones();
    const onSalir = vi.fn();
    await act(async () => {
      render(<SesionDeGimnasia sesion={{ id: "s1", origen: "ROUTINE", juegos: ["FLASH_GRID", "REVERSE_CHAIN"], completados: [], iniciadaEn: "x" }} acciones={sinNada} onSalir={onSalir} onVolverAHoy={vi.fn()} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Salir" }));
    });
    expect(sinNada.cancelar).toHaveBeenCalledWith("s1");
    expect(onSalir).toHaveBeenCalled();
  });

  it("con progreso, salir pregunta: seguir, retomar después o descartar", async () => {
    const a = acciones();
    const onSalir = vi.fn();
    await act(async () => {
      render(<SesionDeGimnasia sesion={{ id: "s1", origen: "ROUTINE", juegos: ["FLASH_GRID", "REVERSE_CHAIN"], completados: ["FLASH_GRID"], iniciadaEn: "x" }} acciones={a} onSalir={onSalir} onVolverAHoy={vi.fn()} />);
    });
    fireEvent.click(screen.getByRole("button", { name: "Salir" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Lo que ya terminaste queda guardado");
    fireEvent.click(screen.getByRole("button", { name: "Salir y retomar después" }));
    expect(a.cancelar).not.toHaveBeenCalled();
    expect(onSalir).toHaveBeenCalled();
  });
});

describe("la navegación", () => {
  it("Gimnasia está en la barra lateral, después de Formación, sin contador", () => {
    const i = menu.findIndex((m) => m.nodo === "GIMNASIA");
    expect(menu[i]).toEqual({ nodo: "GIMNASIA", etiqueta: "Gimnasia", contador: null });
    expect(menu[i - 1].nodo).toBe("FORMACION");
  });

  it("es un nodo con ruta y sin wireframe: las superficies siguen siendo nueve", () => {
    expect(nodos.GIMNASIA).toMatchObject({ ruta: "/gimnasia", wireframe: null });
    expect(superficieIds).toHaveLength(9);
    expect(superficieIds).not.toContain("GIMNASIA");
  });

  it("la sección no lleva controles; la rutina abierta sí, y su ficha dice «Gimnasia · Memoria»", () => {
    expect(objetoEnPantalla("GIMNASIA", "/gimnasia", null)).toBeNull();
    expect(objetoEnPantalla("GIMNASIA", "/gimnasia?sesion=s1", null)).toBeNull();
    expect(objetoEnPantalla("GIMNASIA", "/gimnasia?sesion=s1", "Memoria")).toMatchObject({
      tipo: "gimnasia",
      entidadId: "s1",
      etiqueta: "Gimnasia · Memoria",
      ruta: "/gimnasia?sesion=s1",
    });
  });

  it("la miga empieza en la sección: Gimnasia › Memoria", () => {
    expect(migasDe("GIMNASIA").map((m) => m.etiqueta)).toEqual(["Gimnasia"]);
    expect(migasDe("GIMNASIA", "Memoria").map((m) => m.etiqueta)).toEqual(["Gimnasia", "Memoria"]);
  });
});

describe("las fronteras del backend", () => {
  const RUTAS = [
    "app/api/gimnasia/route.ts",
    "app/api/gimnasia/sesion/route.ts",
    "app/api/gimnasia/sesion/cancelar/route.ts",
    "app/api/gimnasia/intento/route.ts",
    "app/api/gimnasia/intento/resultado/route.ts",
    "app/api/gimnasia/recuerdo/route.ts",
  ];
  const codigo = (ts: string) => ts.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("la sesión, el padrón y el alta van antes que nada, en un solo lugar", () => {
    const sesion = LEER("app/api/gimnasia/_sesion.ts");
    expect(sesion).toContain("resolverSesion(tokenDelHeader(");
    expect(sesion).toContain("{ status: 401 }");
    expect(sesion).toContain("{ status: 403 }");
    expect(sesion).toContain("altaPendiente(");
    for (const ruta of RUTAS) expect(LEER(ruta), ruta).toContain("estudianteDe(request)");
  });

  it("el estudiante sale de la sesión, nunca del pedido, y ninguna ruta toca la base", () => {
    for (const ruta of RUTAS) {
      const c = codigo(LEER(ruta));
      expect(c, ruta).not.toMatch(/cuerpo\??\.(estudiante|studentId|institucion|institutionId|zona|puntuacion|score|nivel)\b/);
      expect(c, ruta).not.toMatch(/supabase|clienteDeServicio/);
      expect(c, ruta).not.toMatch(/status: 403/);
    }
  });

  it("el Service no toca Action, Commitment, Evidence, progreso ni el ADE, y no emite por respuesta", () => {
    const c = codigo(LEER("lib/server/servicios/gimnasia.ts") + LEER("lib/server/repositorios/gimnasia.ts"));
    expect(c).not.toMatch(/from\("(action|commitment|evidence|topic_progress|progress_entry|action_recommendation|reflection)"\)/);
    expect(c).not.toMatch(/registrar_progreso|ProgressUpdated|materializar_recomendacion/);
    const emitidos = [...LEER("lib/server/servicios/gimnasia.ts").matchAll(/nombre: "(\w+)"/g)].map((m) => m[1]);
    expect(new Set(emitidos)).toEqual(new Set(["GymSessionStarted", "GymSessionCancelled", "GymSessionCompleted", "GymAttemptCompleted"]));
  });

  it("las respuestas aceptadas nunca viajan en lo que se proyecta", () => {
    const vista = LEER("lib/domain/gimnasia/vista.ts");
    expect(codigo(vista)).not.toMatch(/aceptadas|accepted_answers/);
    expect(codigo(LEER("lib/server/servicios/gimnasia.ts")).match(/function preguntaDe[\s\S]*?\n}/)?.[0]).not.toMatch(/aceptadas|canonica/);
  });

  it("no hay IA ni red externa en Gimnasia", () => {
    const todo = ["lib/server/servicios/gimnasia.ts", "lib/server/repositorios/gimnasia.ts", "lib/domain/gimnasia/recuerdo-real.ts", ...RUTAS].map(LEER).join("\n");
    expect(todo).not.toMatch(/openai|anthropic|fetch\(|https?:\/\//i);
  });

  it("las tablas nuevas entran a limpiar_mundo", () => {
    const script = LEER("scripts/db-aislamiento.sh");
    for (const tabla of ["recall_review", "gym_attempt", "gym_session"]) expect(script).toContain(`delete from ${tabla};`);
  });
});
