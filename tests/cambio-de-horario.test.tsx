import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { Compromiso } from "@/components/screens/compromiso";
import {
  proyectarCompromiso,
  type EstadoDeCompromiso,
} from "@/lib/server/servicios/proyeccion-compromiso";
import { elegibilidadDeRenegociacion, motivoDelEstado } from "@/lib/domain/renegociacion";
import { escenarios } from "@/lib/fixtures";
import { MOTIVO_DE_CAMBIO } from "@/lib/content/es-AR";

/**
 * **Cambiar horario en `UX04`** — [ADR-050](../docs/decisions.md#adr-050),
 * decidido por el Product Owner el 4 de septiembre de 2026.
 *
 * Dos mitades, y las dos importan: que la proyección diga la verdad sobre qué
 * se puede hacer, y que la pantalla lo muestre como el owner lo pidió — con la
 * acción principal intacta y **sin botones apagados sin explicación**.
 */

/** 09:00 de Córdoba; el compromiso es a las 20:00 del mismo día. */
const BASE: EstadoDeCompromiso = {
  instante: "2026-09-04T12:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  zonaInstitucional: "America/Argentina/Cordoba",
  compromisoId: "cm-1",
  state: "CONFIRMED",
  materia: "Análisis Matemático II",
  objetivo: "Resolver la guía de integrales",
  inicioEn: "2026-09-04T23:00:00.000Z",
  zonaDelAcuerdo: "America/Argentina/Cordoba",
  minutosPlanificados: 45,
  evidenciaEsperada: null,
  criterioCierre: null,
  esRenegociacion: false,
  esRescate: false,
  original: null,
  yaEmpezo: false,
};

describe("ADR-050 · la proyección dice qué se puede hacer", () => {
  it("un CONFIRMED ofrece horarios, y la CTA principal sigue siendo Empezar", () => {
    const p = proyectarCompromiso(BASE);
    expect(p.ctaPrimaria).toEqual({ texto: "Empezar", habilitada: true });
    expect(p.cambioDeHorario?.sePuede).toBe(true);
  });

  it("los horarios se etiquetan en la zona DEL ACUERDO, no en la del estudiante", () => {
    // El estudiante viajó a Madrid; el acuerdo sigue siendo el de Córdoba.
    const p = proyectarCompromiso({ ...BASE, zona: "Europe/Madrid" });
    if (!p.cambioDeHorario?.sePuede) throw new Error("debería ofrecer");
    const enCordoba = new Intl.DateTimeFormat("es-AR", {
      hour: "2-digit", minute: "2-digit", hour12: false,
      timeZone: "America/Argentina/Cordoba",
    }).format(new Date(p.cambioDeHorario.horarios[0].valor));
    expect(p.cambioDeHorario.horarios[0].etiqueta).toBe(enCordoba);
  });

  it("el horario actual que se muestra es el del acuerdo vigente", () => {
    const p = proyectarCompromiso(BASE);
    if (!p.cambioDeHorario?.sePuede) throw new Error("debería ofrecer");
    expect(p.cambioDeHorario.horaActual).toBe(p.hora);
  });

  it.each([
    ["STARTED", "Este compromiso ya empezó."],
    ["MISSED", "Este compromiso se incumplió; ahora corresponde rescatarlo."],
  ])("un %s no ofrece cambiar, y explica por qué", (state, motivo) => {
    const p = proyectarCompromiso({ ...BASE, state });
    expect(p.cambioDeHorario).toEqual({ sePuede: false, motivo });
  });

  it("una cadena que ya se movió lo dice con la copy aprobada", () => {
    const p = proyectarCompromiso({ ...BASE, esRenegociacion: true });
    expect(p.cambioDeHorario).toEqual({
      sePuede: false,
      motivo: "Ya cambiaste el horario de este compromiso una vez.",
    });
  });

  /**
   * Un estado terminal es el único caso en que la pantalla **no dice nada**:
   * no hay nada que explicarle a alguien que mira un compromiso ya cerrado.
   */
  it("un estado terminal no habla del tema", () => {
    expect(proyectarCompromiso({ ...BASE, state: "CLOSED" }).cambioDeHorario).toBeNull();
  });

  /**
   * El guard que evita prometer lo que el servidor rechaza: **todo horario
   * ofrecido tiene que pasar las cinco condiciones de ADR-046**.
   */
  it("todo horario ofrecido es elegible según el dominio", () => {
    const p = proyectarCompromiso(BASE);
    if (!p.cambioDeHorario?.sePuede) throw new Error("debería ofrecer");
    for (const h of p.cambioDeHorario.horarios) {
      expect(
        elegibilidadDeRenegociacion({
          estado: "CONFIRMED",
          renegociadoDeId: null,
          inicioOriginal: BASE.inicioEn,
          inicioPropuesto: h.valor,
          ahora: BASE.instante,
          zonaInstitucional: BASE.zonaInstitucional,
        }),
        `${h.etiqueta} se ofrece y el dominio lo rechaza`,
      ).toEqual({ elegible: true });
    }
  });
});

describe("ADR-050 · la pantalla, como la pidió el Product Owner", () => {
  const props = proyectarCompromiso(BASE);

  it("«Empezar» conserva la jerarquía y «Cambiar horario» es secundaria", () => {
    render(<Compromiso {...props} />);
    expect(screen.getByText("Empezar")).toBeInTheDocument();
    expect(screen.getByText("Cambiar horario")).toBeInTheDocument();
    // La palabra interna no aparece en la interfaz.
    expect(screen.queryByText(/Renegociar/i)).not.toBeInTheDocument();
  });

  it("al apretarla se despliega el bloque, sin navegar a ningún lado", () => {
    render(<Compromiso {...props} />);
    fireEvent.click(screen.getByText("Cambiar horario"));

    expect(screen.getByText("Horario actual")).toBeInTheDocument();
    expect(screen.getByLabelText("Nuevo horario")).toBeInTheDocument();
    expect(screen.getByText("Confirmar nuevo horario")).toBeInTheDocument();
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
  });

  it("no confirma nada hasta que hay un horario elegido", () => {
    const onCambiarHorario = vi.fn();
    render(<Compromiso {...props} onCambiarHorario={onCambiarHorario} />);
    fireEvent.click(screen.getByText("Cambiar horario"));

    fireEvent.click(screen.getByText("Confirmar nuevo horario"));
    expect(onCambiarHorario).not.toHaveBeenCalled();
  });

  it("y al elegir uno, manda exactamente el instante que ofreció", () => {
    if (!props.cambioDeHorario?.sePuede) throw new Error("debería ofrecer");
    const elegido = props.cambioDeHorario.horarios[2].valor;
    const onCambiarHorario = vi.fn();
    render(<Compromiso {...props} onCambiarHorario={onCambiarHorario} />);
    fireEvent.click(screen.getByText("Cambiar horario"));

    fireEvent.change(screen.getByLabelText("Nuevo horario"), { target: { value: elegido } });
    fireEvent.click(screen.getByText("Confirmar nuevo horario"));
    expect(onCambiarHorario).toHaveBeenCalledWith(elegido);
  });

  it("«Cancelar» cierra el bloque y no deja nada elegido", () => {
    render(<Compromiso {...props} />);
    fireEvent.click(screen.getByText("Cambiar horario"));
    fireEvent.click(screen.getByText("Cancelar"));

    expect(screen.queryByLabelText("Nuevo horario")).not.toBeInTheDocument();
    expect(screen.getByText("Cambiar horario")).toBeInTheDocument();
  });

  /**
   * Lo que el Product Owner descartó expresamente: *"no mostrar un botón
   * deshabilitado sin explicación"*. Y la acción que sí corresponde al estado
   * **queda intacta**.
   */
  it("cuando no se puede, explica en vez de apagar un botón", () => {
    const noElegible = proyectarCompromiso({ ...BASE, state: "MISSED" });
    render(<Compromiso {...noElegible} />);

    expect(screen.getByText("Este compromiso ya no se puede cambiar.")).toBeInTheDocument();
    expect(
      screen.getByText("Este compromiso se incumplió; ahora corresponde rescatarlo."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Cambiar horario")).not.toBeInTheDocument();
    // La salida del incumplimiento sigue ahí.
    expect(screen.getByText("Retomar")).toBeInTheDocument();
  });

  it("muestra «Horario actualizado» cuando el servidor confirmó el cambio", () => {
    render(<Compromiso {...props} confirmacionDeCambio="Horario actualizado" />);
    expect(screen.getByText("Horario actualizado")).toBeInTheDocument();
    // Y la acción principal vuelve a ser la del estado.
    expect(screen.getByText("Empezar")).toBeInTheDocument();
  });

  /**
   * El fixture aprobado que hasta ADR-050 describía una pantalla que nadie
   * podía ver: nada calculaba la elegibilidad, así que este estado no se
   * producía nunca.
   */
  it("el fixture RENEGOCIACION_NO_ELEGIBLE ahora se puede renderizar entero", () => {
    const v = escenarios["FX-LOCAL-COM-RENEGOCIACION-NO-ELEGIBLE"].compromiso!;
    render(<Compromiso {...v} />);
    expect(screen.getByText("Este compromiso ya no se puede cambiar.")).toBeInTheDocument();
    expect(
      screen.getByText("Ya cambiaste el horario de este compromiso una vez."),
    ).toBeInTheDocument();
  });
});

describe("ADR-050 · el 409, cuando la elegibilidad cambia en el medio", () => {
  /**
   * La pantalla ofrece horarios que ya validó, así que un rechazo del servidor
   * significa que **el mundo se movió**: otro camino gastó la renegociación, o
   * el compromiso empezó. Lo que el estudiante ve tiene que ser el estado de
   * producto, con su motivo, y no un error técnico.
   */
  it("cada estado manda su propio motivo, no uno solo para todos", () => {
    expect(motivoDelEstado("STARTED")).toBe("YA_EMPEZO");
    expect(motivoDelEstado("MISSED")).toBe("INCUMPLIDO");
    // El caso real del 409: alguien movió el horario por otro camino.
    expect(motivoDelEstado("RENEGOTIATED")).toBe("CADENA_YA_RENEGOCIADA");
  });

  it("y cada motivo tiene una copy distinta, que es la aprobada", () => {
    expect(MOTIVO_DE_CAMBIO.YA_EMPEZO).toBe("Este compromiso ya empezó.");
    expect(MOTIVO_DE_CAMBIO.INCUMPLIDO).toBe(
      "Este compromiso se incumplió; ahora corresponde rescatarlo.",
    );
    expect(MOTIVO_DE_CAMBIO.CADENA_YA_RENEGOCIADA).toBe(
      "Ya cambiaste el horario de este compromiso una vez.",
    );
    expect(MOTIVO_DE_CAMBIO.SIN_HORARIO_POSIBLE).toBe(
      "Ya no queda un horario válido dentro del día acordado.",
    );
  });

  /**
   * **Una sola tabla.** Si la proyección tuviera la suya, la pantalla diría una
   * cosa antes de intentar y otra después de que el servidor la contradiga.
   */
  it("la proyección y la pantalla resuelven la copy con la misma tabla", () => {
    const p = proyectarCompromiso({ ...BASE, state: "MISSED" });
    expect(p.cambioDeHorario).toEqual({
      sePuede: false,
      motivo: MOTIVO_DE_CAMBIO[motivoDelEstado("MISSED")],
    });
  });

  /** Un estado sin copy no dibuja el bloque: el chip ya lo dice todo. */
  it("un motivo sin copy no inventa una", () => {
    expect(MOTIVO_DE_CAMBIO.ESTADO_TERMINAL).toBeUndefined();
    expect(proyectarCompromiso({ ...BASE, state: "COMPLETED" }).cambioDeHorario).toBeNull();
  });
});
