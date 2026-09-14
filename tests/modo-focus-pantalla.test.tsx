/**
 * Modo Focus — las pantallas · [ADR-104](../docs/decisions.md#adr-104).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  FocusConcentracion,
  FocusDescanso,
  FocusFinalizada,
  FocusLista,
  FocusPausada,
  FocusRecuperacion,
  FocusSinSesion,
  SelectorDePomodoro,
} from "@/components/screens/modo-focus";
import { t } from "@/lib/content/es-AR";
import type { FocusProps } from "@/lib/domain/view-models";

const SESION: FocusProps = {
  id: "s-1",
  fase: "CONCENTRACION",
  cursadaId: "cur-1",
  compromisoId: "com-1",
  materia: "Análisis III",
  accion: "Resolver ejercicios 4 al 8",
  unidad: null,
  acordado: { hora: "18:00", minutos: 40 },
  empezoA: "18:07",
  demoraMinutos: 7,
  modo: "FREE",
  pomodoro: null,
  preset: null,
  tramo: { tipo: "FOCUS", inicio: "2026-09-13T21:07:00Z", finPlaneado: null, bloque: null, posicion: null, deBloques: null, descanso: null },
  focoPrevioSegundos: 0,
  servidorAhora: "2026-09-13T21:39:00Z",
  ultimoLatidoHora: "18:38",
  resumen: { focoSegundos: 32 * 60, descansoSegundos: 0, totalSegundos: 32 * 60, pausadoSegundos: 0, pausas: 0, bloquesCompletos: 0, bloquesParciales: 0 },
  anotador: "",
  avance: null,
  cierre: null,
  terminadaA: null,
};

const nada = () => {};
const quieta = {
  focoSegundos: 1938,
  ocupado: false,
  aviso: null,
  anotador: "comprar pan",
  guardado: "GUARDADO" as const,
  onContinuar: nada,
  onPomodoro: nada,
  onSalir: nada,
  onTerminar: nada,
  onAnotar: nada,
};

describe("ADR-104 §20 · la concentración", () => {
  it("ocupa toda la ventana en oscuro, sin controles de ventana ni navegación", () => {
    const onPausar = vi.fn();
    const { container } = render(
      <FocusConcentracion
        sesion={SESION}
        segundos={1925}
        regresivo={false}
        terminaA={null}
        anotador=""
        guardado={null}
        sonido="NINGUNO"
        volumen={40}
        silenciado={false}
        ocupado={false}
        onPausar={onPausar}
        onTerminar={nada}
        onAnotar={nada}
        onSonido={nada}
        onVolumen={nada}
        onSilenciar={nada}
      />,
    );
    const region = container.querySelector('[data-foco="oscuro"]') as HTMLElement;
    expect(region).not.toBeNull();
    expect(region.style.position).toBe("fixed");
    expect(screen.getByText("32:05")).toBeInTheDocument();
    expect(screen.getByText(t("FOCUS.LIBRE"))).toBeInTheDocument();
    expect(screen.queryByText(t("FOCUS.MINIMIZAR"))).toBeNull();
    expect(container.querySelectorAll("nav")).toHaveLength(0);
    expect(container.querySelectorAll("[data-cta-primaria]")).toHaveLength(1);
    fireEvent.click(screen.getByText(t("FOCUS.PAUSAR")));
    expect(onPausar).toHaveBeenCalled();
    // El anotador está a mano, y dice que es privado.
    expect(screen.getByText(t("FOCUS.PARA_DESPUES_AYUDA"))).toBeInTheDocument();
  });

  it("adentro de una ventana ocupa la ventana, no la pantalla", () => {
    const { container } = render(
      <FocusConcentracion sesion={SESION} enVentana segundos={0} regresivo={false} terminaA={null} anotador="" guardado={null} sonido="NINGUNO" volumen={40} silenciado={false} ocupado={false} onPausar={nada} onTerminar={nada} onAnotar={nada} onSonido={nada} onVolumen={nada} onSilenciar={nada} />,
    );
    expect((container.querySelector('[data-foco="oscuro"]') as HTMLElement).style.position).toBe("relative");
  });

  it("en Pomodoro dice *Foco 2 de 4* y cuándo termina", () => {
    render(
      <FocusConcentracion
        sesion={{ ...SESION, modo: "POMODORO", pomodoro: { foco: 25, descansoCorto: 5, descansoLargo: 15, bloquesAntesDelLargo: 4 }, tramo: { ...SESION.tramo!, bloque: 2, posicion: 2, deBloques: 4, finPlaneado: "2026-09-13T21:45:00Z" } }}
        segundos={300}
        regresivo
        terminaA="18:45"
        anotador=""
        guardado={null}
        sonido="NINGUNO"
        volumen={40}
        silenciado={false}
        ocupado={false}
        onPausar={nada}
        onTerminar={nada}
        onAnotar={nada}
        onSonido={nada}
        onVolumen={nada}
        onSilenciar={nada}
      />,
    );
    expect(screen.getByText(/Foco 2 de 4 · termina 18:45/)).toBeInTheDocument();
  });
});

describe("ADR-104 §10 · pausa, lista y descanso", () => {
  it("pausada: Continuar es la única principal, y se puede minimizar", () => {
    const onMinimizar = vi.fn();
    const { container } = render(<FocusPausada sesion={{ ...SESION, fase: "PAUSADA" }} {...quieta} onMinimizar={onMinimizar} />);
    expect(container.querySelectorAll("[data-cta-primaria]")).toHaveLength(1);
    expect(screen.getByText(t("FOCUS.CONTINUAR"))).toBeInTheDocument();
    fireEvent.click(screen.getByText(t("FOCUS.MINIMIZAR")));
    expect(onMinimizar).toHaveBeenCalled();
    expect(screen.getByText(t("FOCUS.SALIR_Y_GUARDAR"))).toBeInTheDocument();
    expect(screen.getByText(t("FOCUS.TERMINE"))).toBeInTheDocument();
    expect(screen.getByText(t("FOCUS.PASAR_A_POMODORO"))).toBeInTheDocument();
    expect(screen.getByText("32:18")).toBeInTheDocument();
  });

  it("adentro de una ventana no hay botón propio de minimizar: la ventana tiene el suyo", () => {
    render(<FocusPausada sesion={{ ...SESION, fase: "PAUSADA" }} {...quieta} onMinimizar={null} />);
    expect(screen.queryByText(t("FOCUS.MINIMIZAR"))).toBeNull();
  });

  it("en Pomodoro no se ofrece volver a pasar a Pomodoro", () => {
    render(<FocusPausada sesion={{ ...SESION, fase: "PAUSADA", modo: "POMODORO" }} {...quieta} onMinimizar={null} />);
    expect(screen.queryByText(t("FOCUS.PASAR_A_POMODORO"))).toBeNull();
  });

  it("lista: el foco espera el clic (§7)", () => {
    render(<FocusLista sesion={{ ...SESION, fase: "LISTA" }} {...quieta} onMinimizar={null} />);
    expect(screen.getByText(t("FOCUS.LISTA"))).toBeInTheDocument();
    expect(screen.getByText(t("FOCUS.CONTINUAR_ESTUDIANDO"))).toBeInTheDocument();
  });

  it("descanso: volver antes, y el bloque que viene", () => {
    render(
      <FocusDescanso
        sesion={{ ...SESION, fase: "DESCANSO", modo: "POMODORO", pomodoro: { foco: 25, descansoCorto: 5, descansoLargo: 15, bloquesAntesDelLargo: 4 }, tramo: { ...SESION.tramo!, tipo: "BREAK", descanso: "SHORT" }, resumen: { ...SESION.resumen, bloquesCompletos: 1 } }}
        segundos={240}
        ocupado={false}
        onVolverAntes={nada}
        onTerminarSesion={nada}
      />,
    );
    expect(screen.getByText(/Descanso corto · Después, foco 2 de 4/)).toBeInTheDocument();
    expect(screen.getByText(t("FOCUS.DESCANSO_REGLA"))).toBeInTheDocument();
    expect(screen.getByText(t("FOCUS.VOLVER_ANTES"))).toBeInTheDocument();
  });
});

describe("ADR-104 §16 · recuperación", () => {
  it("dice cuándo empezó y el último registro, con tres salidas", () => {
    render(<FocusRecuperacion sesion={{ ...SESION, fase: "RECUPERACION" }} ocupado={false} onReanudar={nada} onTermineAlCerrar={nada} onRevisar={nada} />);
    expect(screen.getByText("Iniciada a las 18:07 · último registro 18:38")).toBeInTheDocument();
    for (const k of ["FOCUS.REANUDAR", "FOCUS.TERMINE_AL_CERRAR", "FOCUS.REVISAR"] as const) expect(screen.getByText(t(k))).toBeInTheDocument();
  });
});

describe("ADR-104 §4 · sin sesión", () => {
  it("sin compromiso iniciable **no hay CTA**: se dice dónde se empieza", () => {
    const { container } = render(<FocusSinSesion iniciable={null} aviso={null} ocupado={false} onEmpezar={nada} onTerminar={nada} />);
    expect(container.querySelectorAll("[data-cta-primaria]")).toHaveLength(0);
    expect(screen.getByText(t("FOCUS.SIN_COMPROMISO"))).toBeInTheDocument();
  });

  it("con uno, *Es hora de empezar* sólo si llegó la hora", () => {
    const iniciable = { compromisoId: "c", cursadaId: "cur-1", materia: "Análisis III", accion: "Resolver", unidad: null, hora: "18:00", minutos: 40, esHora: false, yaEmpezado: false };
    const { rerender } = render(<FocusSinSesion iniciable={iniciable} aviso={null} ocupado={false} onEmpezar={nada} onTerminar={nada} />);
    expect(screen.queryByText(t("FOCUS.ES_HORA"))).toBeNull();
    expect(screen.getByText(t("FOCUS.EMPEZAR"))).toBeInTheDocument();
    rerender(<FocusSinSesion iniciable={{ ...iniciable, esHora: true, yaEmpezado: true }} aviso={null} ocupado={false} onEmpezar={nada} onTerminar={nada} />);
    expect(screen.getByText(t("FOCUS.ES_HORA"))).toBeInTheDocument();
    expect(screen.getByText(t("FOCUS.CONTINUAR"))).toBeInTheDocument();
  });

  it("el sonido se elige y se prueba antes de empezar (§19 y Enm. 1)", () => {
    const iniciable = { compromisoId: "c", cursadaId: "cur-1", materia: "Análisis III", accion: "Resolver", unidad: null, hora: "18:00", minutos: 40, esHora: true, yaEmpezado: false };
    const onSonido = vi.fn();
    const onProbar = vi.fn();
    const { rerender } = render(
      <FocusSinSesion iniciable={iniciable} aviso={null} ocupado={false} onEmpezar={nada} onTerminar={nada} sonido={{ sonido: "NINGUNO", volumen: 40, onSonido, onVolumen: nada, onProbar }} />,
    );
    // Apagado: no hay nada que probar.
    expect(screen.queryByText(t("FOCUS.PROBAR"))).toBeNull();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "LLUVIA" } });
    expect(onSonido).toHaveBeenCalledWith("LLUVIA");
    rerender(
      <FocusSinSesion iniciable={iniciable} aviso={null} ocupado={false} onEmpezar={nada} onTerminar={nada} sonido={{ sonido: "LLUVIA", volumen: 40, onSonido, onVolumen: nada, onProbar }} />,
    );
    for (const s of ["Lluvia", "Mar", "Viento", "Chimenea"]) expect(screen.getByRole("option", { name: s })).toBeInTheDocument();
    fireEvent.click(screen.getByText(t("FOCUS.PROBAR")));
    expect(onProbar).toHaveBeenCalled();
    // Antes de empezar no hay nada sonando que silenciar.
    expect(screen.queryByRole("button", { name: t("FOCUS.SILENCIAR") })).toBeNull();
  });
});

describe("ADR-104 §8 y §21 · la sesión cerrada", () => {
  it("el dato principal es el tiempo registrado en Focus; un libre no muestra bloques", () => {
    render(
      <FocusFinalizada
        sesion={{ ...SESION, fase: "FINALIZADA", terminadaA: "19:19", avance: "Resolví el 4", resumen: { ...SESION.resumen, focoSegundos: 52 * 60, totalSegundos: 72 * 60, descansoSegundos: 600, pausadoSegundos: 600 } }}
        anotador="comprar pan"
        guardado={null}
        onAnotar={nada}
        onVerBitacora={nada}
      />,
    );
    expect(screen.getByRole("heading", { name: "52 min de Focus" })).toBeInTheDocument();
    expect(screen.getByText("18:07–19:19")).toBeInTheDocument();
    expect(screen.getByText("1 h 12 min")).toBeInTheDocument();
    expect(screen.queryByText(t("FOCUS.BLOQUES"))).toBeNull();
    expect(screen.getByText("«Resolví el 4»")).toBeInTheDocument();
    expect(screen.getByText(t("FOCUS.NO_DICE"))).toBeInTheDocument();
  });
});

describe("ADR-104 §6 · elegir Pomodoro", () => {
  it("tres presets y personalizado; un valor fuera de límite apaga la principal", () => {
    const onElegir = vi.fn();
    render(<SelectorDePomodoro inicial={null} personalizadoInicial={null} onElegir={onElegir} onCancelar={nada} />);
    fireEvent.click(screen.getByRole("radio", { name: /Intermedio/ }));
    fireEvent.click(screen.getByText(t("FOCUS.EMPEZAR_BLOQUE")));
    expect(onElegir).toHaveBeenCalledWith({ foco: 40, descansoCorto: 8, descansoLargo: 20, bloquesAntesDelLargo: 4 });

    fireEvent.click(screen.getByRole("radio", { name: /Personalizado/ }));
    fireEvent.change(screen.getByLabelText(t("FOCUS.CAMPO.FOCO")), { target: { value: "500" } });
    expect(screen.getByText(t("FOCUS.EMPEZAR_BLOQUE")).closest("button")).toBeDisabled();
  });
});
