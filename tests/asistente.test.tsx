import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { Asistente } from "@/components/shell/asistente";
import {
  FASE_INICIAL,
  GUION,
  avanzar,
  lineasDelResumen,
  ofreceOpciones,
  type Fase,
} from "@/lib/client/simulacion/asistente";

/**
 * **El asistente de reportes y mejoras, simulado** —
 * [ADR-103](../docs/decisions.md#adr-103).
 *
 * Lo que se prueba es que funcione como el del software de las capturas y que
 * la ficción **no se escape**: sólo con `MODO_PRUEBA=1`, rotulado, sin red, y
 * con un resumen que cita en vez de inventar.
 */
const LEER = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("sólo existe en modo prueba", () => {
  it.each(["app/(student)/layout.tsx", "app/alta/layout.tsx"])("%s lo monta detrás de MODO_PRUEBA", (p) => {
    expect(LEER(p)).toContain('process.env.MODO_PRUEBA === "1" && <Asistente />');
  });

  it("no habla por red ni guarda nada", () => {
    for (const p of ["components/shell/asistente.tsx", "lib/client/simulacion/asistente.ts"]) {
      const codigo = LEER(p).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
      expect(codigo, p).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket)\s*\(|\b(localStorage|sessionStorage|indexedDB)\b/);
      expect(codigo, p).not.toMatch(/@\/lib\/client\/api/);
    }
  });

  it("y el dock de prueba ya no ocupa la esquina del botón", () => {
    expect(LEER("components/prueba/panel.tsx")).toContain("bottom: 84");
  });
});

describe("el guion", () => {
  const texto = (t: string) => ({ entrada: "TEXTO" as const, texto: t, adjuntos: [] });

  function recorrer(): Fase {
    let fase = avanzar(FASE_INICIAL, { entrada: "ELEGIR", tipo: "MEJORA" }).fase;
    fase = avanzar(fase, texto("poder buscar por descripción")).fase;
    return avanzar(fase, texto("búsqueda general")).fase;
  }

  it("elegir, describir y aclarar llega a la tarjeta de confirmación", () => {
    const fase = recorrer();
    expect(fase.fase).toBe("CONFIRMAR");
  });

  it("el resumen cita lo que se escribió, no lo parafrasea", () => {
    const fase = recorrer();
    if (fase.fase !== "CONFIRMAR") throw new Error("no llegó");
    expect(lineasDelResumen(fase.borrador)).toEqual([
      "Proponés: poder buscar por descripción",
      "Lo que agregaste: búsqueda general",
    ]);
  });

  it("confirmar muestra *Reporte enviado* y vuelve a ofrecer las opciones", () => {
    const turno = avanzar(recorrer(), { entrada: "CONFIRMAR" });
    expect(turno.delEstudiante).toMatchObject([{ texto: GUION.CONFIRMO }]);
    expect(turno.delAsistente.map((m) => m.clase)).toEqual(["ENVIADO", "ASISTENTE"]);
    expect(ofreceOpciones(turno.fase)).toBe(true);
  });

  it("corregir vuelve a mostrar la tarjeta con la corrección", () => {
    let fase = avanzar(recorrer(), { entrada: "CORREGIR" }).fase;
    expect(fase.fase).toBe("CORREGIR");
    const turno = avanzar(fase, texto("también por colores"));
    fase = turno.fase;
    if (fase.fase !== "CONFIRMAR") throw new Error("no volvió");
    expect(lineasDelResumen(fase.borrador)).toContain("Corrección: también por colores");
  });

  it("una entrada que la fase no espera no hace nada: un clic viejo no envía", () => {
    const turno = avanzar(FASE_INICIAL, { entrada: "CONFIRMAR" });
    expect(turno).toEqual({ fase: FASE_INICIAL, delEstudiante: [], delAsistente: [] });
  });

  it("escribir antes de elegir guarda el texto y pregunta qué es", () => {
    const turno = avanzar(FASE_INICIAL, texto("no carga el calendario"));
    expect(turno.fase).toMatchObject({ fase: "TIPO_PENDIENTE", descripcion: "no carga el calendario" });
    const siguiente = avanzar(turno.fase, { entrada: "ELEGIR", tipo: "PROBLEMA" });
    expect(siguiente.fase).toMatchObject({ fase: "ACLARAR", tipo: "PROBLEMA" });
  });

  it("no promete contacto ni plazos", () => {
    const todo = JSON.stringify(GUION);
    expect(todo).not.toMatch(/te (contactaremos|escribiremos|vamos a escribir)|en breve|hoy mismo|te respondemos/i);
  });
});

describe("la pantalla", () => {
  it("el botón abre el panel, rotulado *Simulado*", () => {
    render(<Asistente demora={0} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir el asistente" }));
    expect(screen.getByRole("dialog", { name: "Asistente de Achieve" })).toBeTruthy();
    expect(screen.getByText("Simulado")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cerrar el asistente" })).toBeTruthy();
  });

  it("recorre la conversación entera hasta *Reporte enviado*", async () => {
    render(<Asistente demora={0} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir el asistente" }));
    fireEvent.click(screen.getByRole("button", { name: "Sugerir una mejora" }));
    await screen.findByText(GUION.PEDIR_DESCRIPCION.MEJORA);

    const campo = screen.getByLabelText("Contame qué pasó o pegá una captura…");
    fireEvent.change(campo, { target: { value: "buscar por descripción" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await screen.findByText(GUION.PEDIR_ACLARACION.MEJORA);

    fireEvent.change(campo, { target: { value: "búsqueda general" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await screen.findByText("Tu sugerencia");
    expect(screen.getByText("Proponés: buscar por descripción")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar y enviar" }));
    await screen.findByText("Reporte enviado");
    // La tarjeta ya enviada no vuelve a ofrecer confirmar.
    expect(screen.queryByRole("button", { name: "Confirmar y enviar" })).toBeNull();
    await waitFor(() => expect(screen.getByRole("button", { name: "Reportar un problema" })).toBeTruthy());
  });

  it("*Nueva conversación* vuelve al saludo", async () => {
    render(<Asistente demora={0} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir el asistente" }));
    expect(screen.queryByRole("button", { name: "Nueva conversación" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reportar un problema" }));
    await screen.findByText(GUION.PEDIR_DESCRIPCION.PROBLEMA);
    fireEvent.click(screen.getByRole("button", { name: "Nueva conversación" }));
    expect(screen.queryByText(GUION.PEDIR_DESCRIPCION.PROBLEMA)).toBeNull();
    expect(screen.getByText(GUION.SALUDO)).toBeTruthy();
  });
});
