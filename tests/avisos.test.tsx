import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * **La campanita, con avisos simulados** —
 * [ADR-097 · Enmienda 1](../docs/decisions.md#adr-097-enmienda-1).
 *
 * El owner pidió *"por ahora poné avisos sintéticos en la campanita"*. Lo que se
 * prueba es que la ficción **no se escape**: sólo con `MODO_PRUEBA=1`, rotulada,
 * y sin nombrar nada que el dominio no registre.
 */
const LEER = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const pedir = vi.fn();
vi.mock("@/lib/client/api", () => ({ pedir: (...a: unknown[]) => pedir(...a) }));

const { Campanita, haceCuanto } = await import("@/components/shell/campanita");
const { avisosSimulados } = await import("@/lib/server/simulacion/avisos");
const { rutaConocida } = await import("@/lib/navigation");

beforeEach(() => {
  pedir.mockReset();
});

describe("la ruta está apagada por defecto", () => {
  const RUTA = LEER("app/api/avisos/route.ts");

  it("responde 404 sin MODO_PRUEBA, y el cerrojo va antes que el token", () => {
    expect(RUTA).toContain('process.env.MODO_PRUEBA !== "1"');
    expect(RUTA).toContain("status: 404");
    expect(RUTA.indexOf("if (apagada())")).toBeLessThan(RUTA.indexOf("resolverSesion("));
  });

  it("va con la sesión del estudiante, nunca con secreto de servicio", () => {
    expect(RUTA).toContain("tokenDelHeader");
    expect(RUTA).not.toMatch(/secretoDeServicio|SERVICE_ROLE|x-service/i);
  });

  it("y está escrita para borrarse cuando haya notificaciones reales", () => {
    expect(RUTA).toMatch(/Esta ruta se borra/);
  });
});

describe("los avisos simulados", () => {
  const MATERIAS = [
    { cursadaId: "ce-1", nombre: "Análisis matemático I" },
    { cursadaId: "ce-2", nombre: "Álgebra" },
  ];
  const AHORA = new Date("2026-09-13T12:00:00.000Z");

  it("se declaran simulados", () => {
    expect(avisosSimulados(MATERIAS, AHORA).simulados).toBe(true);
  });

  it("nombran las materias del estudiante, y sin materias no inventan una", () => {
    const con = avisosSimulados(MATERIAS, AHORA).avisos.map((a) => a.texto).join(" ");
    expect(con).toContain("Análisis matemático I");
    const sin = avisosSimulados([], AHORA).avisos.map((a) => a.texto).join(" ");
    expect(sin).not.toMatch(/undefined|null| de \.| en :/);
  });

  it("toda ruta a la que llevan es una ruta que la aplicación reconoce", () => {
    for (const materias of [MATERIAS, []]) {
      for (const a of avisosSimulados(materias, AHORA).avisos) {
        if (a.ruta !== null) expect(rutaConocida(a.ruta), a.id).toBe(true);
      }
    }
  });

  /** ADR-042: la Plataforma no observa si hay un operador ni si alguien va a escribir. */
  it("no prometen contacto de una persona", () => {
    const todo = avisosSimulados(MATERIAS, AHORA).avisos.map((a) => `${a.texto} ${a.detalle ?? ""}`).join(" ");
    expect(todo).not.toMatch(/operador|te va a escribir|te escribirá|asignad/i);
  });
});

describe("la campanita en pantalla", () => {
  const AVISOS = avisosSimulados([{ cursadaId: "ce-1", nombre: "Álgebra" }]).avisos;

  it("sin respuesta de la ruta —sin MODO_PRUEBA— no se dibuja", async () => {
    pedir.mockResolvedValue({ estado: "ERROR" });
    const { container } = render(<Campanita />);
    await waitFor(() => expect(pedir).toHaveBeenCalledWith("/api/avisos"));
    expect(container).toBeEmptyDOMElement();
  });

  it("cuenta lo que no leíste, y lo dice el nombre accesible", async () => {
    pedir.mockResolvedValue({ estado: "OK", datos: { simulados: true, avisos: AVISOS } });
    render(<Campanita />);
    expect(await screen.findByRole("button", { name: "Avisos, 3 sin leer" })).toBeInTheDocument();
  });

  it("abierta, dice «Simulado» arriba de la lista", async () => {
    pedir.mockResolvedValue({ estado: "OK", datos: { simulados: true, avisos: AVISOS } });
    render(<Campanita />);
    fireEvent.click(await screen.findByRole("button", { name: /Avisos/ }));
    expect(screen.getByText("Simulado")).toBeInTheDocument();
  });

  it("«Marcar todas como leídas» saca el contador", async () => {
    pedir.mockResolvedValue({ estado: "OK", datos: { simulados: true, avisos: AVISOS } });
    render(<Campanita />);
    fireEvent.click(await screen.findByRole("button", { name: /Avisos/ }));
    fireEvent.click(screen.getByRole("button", { name: "Marcar todas como leídas" }));
    expect(screen.getByRole("button", { name: "Avisos" })).toBeInTheDocument();
  });

  it("tocar un aviso lleva a su pantalla", async () => {
    pedir.mockResolvedValue({ estado: "OK", datos: { simulados: true, avisos: AVISOS } });
    render(<Campanita />);
    fireEvent.click(await screen.findByRole("button", { name: /Avisos/ }));
    expect(screen.getByRole("menuitem", { name: /vence hoy/ })).toHaveAttribute("href", "/compromiso");
  });

  it("dice hace cuánto como una persona", () => {
    const ahora = new Date("2026-09-13T12:00:00.000Z");
    expect(haceCuanto("2026-09-13T11:45:00.000Z", ahora)).toBe("hace 15 min");
    expect(haceCuanto("2026-09-13T10:00:00.000Z", ahora)).toBe("hace 2 h");
    expect(haceCuanto("2026-09-12T09:00:00.000Z", ahora)).toBe("ayer");
    expect(haceCuanto("2026-09-09T12:00:00.000Z", ahora)).toBe("hace 4 días");
  });
});
