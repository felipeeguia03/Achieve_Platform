import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Calendario, type CalendarioPantallaProps } from "@/components/screens/calendario";
import { rutaDelEvento } from "@/components/superficies/calendario";
import {
  desplazarVista,
  esFechaDeCalendario,
  fechasDelBloque,
  grillaDelMes,
  lunesDe,
  rangoDeVista,
  sumarMeses,
} from "@/lib/domain/calendario";
import { menu } from "@/lib/navigation/menu";
import { cadenaDe } from "@/lib/navigation/migas";
import { nodos, superficieIds } from "@/lib/navigation/surfaces";
import { proyectarCalendario, type InsumosDelCalendario } from "@/lib/server/servicios/proyeccion-calendario";
import type { EventoDeCalendario } from "@/lib/domain/view-models";

/**
 * El Calendario — [ADR-100](../docs/decisions.md#adr-100).
 *
 * Tres garantías: **proyecta, no agenda** (no aparece nada que no exista en la
 * base); **no inventa** (sin hora no hay hora, sin nombre no hay chip, un
 * incumplido no se ve cumplido); y **cada evento lleva a su objeto**.
 */

const RAIZ = resolve(__dirname, "..");
// Domingo 13 de septiembre de 2026, 12:00 en Córdoba.
const AHORA = "2026-09-13T15:00:00.000Z";
const ZONA = "America/Argentina/Cordoba";

const insumos = (over: Partial<InsumosDelCalendario> = {}): InsumosDelCalendario => ({
  materias: [
    { cursadaId: "c1", nombre: "ANALISIS MATEMATICO I" },
    { cursadaId: "c2", nombre: "Derecho" },
  ],
  bloques: [
    // Martes 14–16, y jueves 20–22 estimado.
    { cursadaId: "c1", bloqueId: "b1", dia: 2, desde: "14:00:00", hasta: "16:00:00", aula: "Aula 3", estimada: false },
    { cursadaId: "c2", bloqueId: "b2", dia: 4, desde: "20:00:00", hasta: "22:00:00", aula: null, estimada: true },
  ],
  evaluaciones: [],
  proximaEvaluacion: null,
  compromisos: [],
  clasesAbiertas: [],
  ...over,
});

describe("las fechas", () => {
  it("la grilla del mes va de lunes a domingo, con semanas enteras", () => {
    // Septiembre 2026 empieza martes y termina miércoles.
    expect(grillaDelMes("2026-09-13")).toEqual({ desde: "2026-08-31", hasta: "2026-10-04" });
    expect(lunesDe("2026-09-13")).toBe("2026-09-07");
  });

  it("moverse un mes recorta al último día que exista", () => {
    expect(sumarMeses("2026-01-31", 1)).toBe("2026-02-28");
    expect(desplazarVista("mes", "2026-09-13", 1)).toBe("2026-10-01");
    expect(desplazarVista("semana", "2026-09-13", -1)).toBe("2026-09-06");
  });

  it("la semana cabe siempre en la grilla de su mes, aunque cruce el cambio de mes", () => {
    const semana = rangoDeVista("semana", "2026-10-01");
    const mes = grillaDelMes("2026-10-01");
    expect(semana.desde >= mes.desde && semana.hasta <= mes.hasta).toBe(true);
  });

  it("un día de semana fuera de escala no cae nunca", () => {
    expect(fechasDelBloque(7, "2026-09-01", "2026-09-30")).toEqual([]);
    expect(fechasDelBloque(2, "2026-09-01", "2026-09-15")).toEqual(["2026-09-01", "2026-09-08", "2026-09-15"]);
  });

  it("una fecha imposible no es una fecha", () => {
    expect(esFechaDeCalendario("2026-02-31")).toBe(false);
    expect(esFechaDeCalendario("2026-09-13")).toBe(true);
    expect(esFechaDeCalendario("13/09/2026")).toBe(false);
  });
});

describe("la proyección", () => {
  it("el horario semanal se dibuja sobre cada fecha del rango, con su materia y su aula", () => {
    const r = proyectarCalendario(insumos(), "2026-09-14", "2026-09-20", AHORA, ZONA);
    const clases = r.eventos.filter((e) => e.tipo === "clase");
    expect(clases.map((c) => [c.fecha, c.desde, c.hasta, c.titulo, c.detalle])).toEqual([
      ["2026-09-15", "14:00", "16:00", "Analisis matematico I", "Aula 3"],
      ["2026-09-17", "20:00", "22:00", "Derecho", null],
    ]);
    // Sin clase abierta, la clase lleva a su materia.
    expect(clases[0].enlace).toEqual({ a: "materia", cursadaId: "c1" });
    expect(r.horarioEstimado).toBe(true);
  });

  it("si el estudiante abrió la clase ese día, el bloque lleva a esa clase", () => {
    const r = proyectarCalendario(
      insumos({
        clasesAbiertas: [
          { id: "s1", cursadaId: "c1", iniciadaEn: "2026-09-15T17:05:00Z", estado: "ENDED", bloqueId: "b1" },
        ],
      }),
      "2026-09-14",
      "2026-09-20",
      AHORA,
      ZONA,
    );
    const martes = r.eventos.find((e) => e.fecha === "2026-09-15");
    expect(martes?.enlace).toEqual({ a: "clase", claseId: "s1", activa: false });
  });

  it("una evaluación sin hora va sin hora, y sin título no se le inventa nombre", () => {
    const r = proyectarCalendario(
      insumos({
        evaluaciones: [
          { id: "e1", cursadaId: "c1", tipo: "final", titulo: null, fecha: "2026-09-17", hora: null, modalidad: "oral" },
          { id: "e2", cursadaId: "c2", tipo: null, titulo: null, fecha: "2026-09-18", hora: "09:00:00", modalidad: null },
        ],
        proximaEvaluacion: "2026-09-17",
      }),
      "2026-09-14",
      "2026-09-20",
      AHORA,
      ZONA,
    );
    const [final, sinNombre] = r.eventos.filter((e) => e.tipo === "evaluacion");
    expect(final).toMatchObject({ titulo: "Final · Analisis matematico I", desde: null, enlace: { a: "materia", cursadaId: "c1" } });
    expect(final.detalle).not.toBeNull();
    expect(sinNombre).toMatchObject({ titulo: "Derecho", desde: "09:00" });
    expect(r.proximaEvaluacionEnDias).toBe(4);
  });

  it("sin evaluación próxima no hay «0 días»", () => {
    expect(proyectarCalendario(insumos(), "2026-09-14", "2026-09-20", AHORA, ZONA).proximaEvaluacionEnDias).toBeNull();
  });

  it("un compromiso se ubica en la fecha local, no en la de UTC", () => {
    const r = proyectarCalendario(
      insumos({
        bloques: [],
        compromisos: [
          // 23:30 del lunes 14 en Córdoba es martes 15 en UTC.
          { id: "k1", cursadaId: "c1", inicio: "2026-09-15T02:30:00Z", minutos: 45, estado: "CONFIRMED", titulo: "Integrales por partes" },
        ],
      }),
      "2026-09-14",
      "2026-09-20",
      AHORA,
      ZONA,
    );
    expect(r.eventos).toHaveLength(1);
    expect(r.eventos[0]).toMatchObject({
      fecha: "2026-09-14",
      desde: "23:30",
      // Cruza la medianoche: se corta a fin del día, no se estira al siguiente.
      hasta: "23:59",
      enlace: { a: "compromiso", compromisoId: "k1" },
      estado: "PENDIENTE",
    });
  });

  it("un incumplido se ve incumplido, también cerrado; un renegociado y un borrador no se dibujan", () => {
    const compromiso = (id: string, estado: string) => ({
      id,
      cursadaId: "c1",
      inicio: "2026-09-16T21:00:00Z",
      minutos: 30,
      estado,
      titulo: id,
    });
    const r = proyectarCalendario(
      insumos({
        bloques: [],
        compromisos: [
          compromiso("missed", "MISSED"),
          compromiso("closed", "CLOSED"),
          compromiso("renegotiated", "RENEGOTIATED"),
          compromiso("draft", "DRAFT"),
          compromiso("completed", "COMPLETED"),
        ],
      }),
      "2026-09-14",
      "2026-09-20",
      AHORA,
      ZONA,
    );
    const porId = Object.fromEntries(r.eventos.map((e) => [e.titulo, e.estado]));
    expect(porId).toEqual({ missed: "INCUMPLIDO", closed: "INCUMPLIDO", completed: "CUMPLIDO" });
  });

  it("no aparece nada de una cursada que no es del estudiante", () => {
    const r = proyectarCalendario(
      insumos({
        bloques: [{ cursadaId: "ajena", dia: 2, desde: "10:00", hasta: "12:00", aula: null, estimada: false }],
        evaluaciones: [{ id: "x", cursadaId: "ajena", tipo: "final", titulo: "Final", fecha: "2026-09-15", hora: null, modalidad: null }],
      }),
      "2026-09-14",
      "2026-09-20",
      AHORA,
      ZONA,
    );
    expect(r.eventos.some((e) => e.cursadaId === "ajena")).toBe(false);
  });
});

describe("los enlaces", () => {
  const evento = (enlace: EventoDeCalendario["enlace"]): EventoDeCalendario => ({
    id: "x",
    tipo: "clase",
    fecha: "2026-09-15",
    desde: null,
    hasta: null,
    titulo: "x",
    detalle: null,
    cursadaId: "c1",
    enlace,
  });

  it("cada evento lleva a su objeto, con la ruta del grafo", () => {
    expect(rutaDelEvento(evento({ a: "materia", cursadaId: "c 1" }))).toBe("/materia?cursada=c%201");
    expect(rutaDelEvento(evento({ a: "clase", claseId: "s1", activa: false }))).toBe("/clase?clase=s1");
    expect(rutaDelEvento(evento({ a: "clase", claseId: "s1", activa: true }))).toBe("/clase");
    expect(rutaDelEvento(evento({ a: "compromiso", compromisoId: "k1" }))).toBe("/compromiso?compromiso=k1");
  });

  it("la pantalla de compromiso pasa `?compromiso=` a la API", () => {
    const src = readFileSync(resolve(RAIZ, "components/superficies/compromiso.tsx"), "utf8");
    expect(src).toContain("/api/compromiso?compromiso=");
  });
});

describe("la navegación", () => {
  it("es un nodo sin wireframe: las superficies siguen siendo nueve", () => {
    expect(nodos.CALENDARIO.wireframe).toBeNull();
    expect(nodos.CALENDARIO.ruta).toBe("/calendario");
    expect(superficieIds).not.toContain("CALENDARIO");
    expect(superficieIds).toHaveLength(9);
  });

  it("está en la barra lateral, pegado a Materias, sin contador, y es raíz de su miga", () => {
    const i = menu.findIndex((m) => m.nodo === "CALENDARIO");
    expect(menu[i - 1]?.nodo).toBe("UX02_INDICE");
    expect(menu[i]?.contador).toBeNull();
    expect(cadenaDe("CALENDARIO")).toEqual(["CALENDARIO"]);
  });

  it("sólo lee: el repositorio no escribe y los bloques salen de `horarios.ts`", () => {
    const src = readFileSync(resolve(RAIZ, "lib/server/repositorios/calendario.ts"), "utf8");
    expect(src).toContain("horariosReal.deCursadas(");
    expect(src).not.toContain('.from("class_schedule_block")');
    expect(src).not.toMatch(/\.(insert|update|upsert|delete)\(|\.rpc\(/);
  });
});

describe("la pantalla", () => {
  const base = (over: Partial<CalendarioPantallaProps> = {}): CalendarioPantallaProps => ({
    vista: "mes",
    fecha: "2026-09-13",
    hoyLocal: "2026-09-13",
    datos: proyectarCalendario(
      insumos({
        evaluaciones: [
          { id: "e1", cursadaId: "c1", tipo: "final", titulo: null, fecha: "2026-09-17", hora: "09:00:00", modalidad: null },
        ],
        compromisos: [
          { id: "k1", cursadaId: "c1", inicio: "2026-09-16T21:00:00Z", minutos: 45, estado: "CONFIRMED", titulo: "Integrales por partes" },
        ],
      }),
      "2026-08-31",
      "2026-10-04",
      AHORA,
      ZONA,
    ),
    mostrarClases: true,
    mostrarCompromisos: true,
    onVista: vi.fn(),
    onFecha: vi.fn(),
    onAnterior: vi.fn(),
    onSiguiente: vi.fn(),
    onAlternarClases: vi.fn(),
    onAlternarCompromisos: vi.fn(),
    onAbrir: vi.fn(),
    ...over,
  });

  it("dibuja los tres tipos, y tocar uno lo abre", () => {
    const p = base();
    render(<Calendario {...p} />);
    expect(screen.getByRole("heading", { level: 1, name: "Calendario" })).toBeInTheDocument();
    expect(document.querySelectorAll('[data-evento="clase"]').length).toBeGreaterThan(0);
    const final = screen.getByRole("button", { name: /^Final · Analisis matematico I/ });
    fireEvent.click(final);
    expect(p.onAbrir).toHaveBeenCalledWith(expect.objectContaining({ id: "evaluacion:e1" }));
    expect(screen.getByRole("button", { name: /^Compromiso: Integrales por partes/ })).toBeInTheDocument();
  });

  it("apagar clases y compromisos las saca; la evaluación queda", () => {
    render(<Calendario {...base({ mostrarClases: false, mostrarCompromisos: false })} />);
    expect(document.querySelectorAll('[data-evento="clase"]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-evento="compromiso"]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-evento="evaluacion"]')).toHaveLength(1);
    // Los alternadores dicen su estado.
    expect(screen.getByRole("button", { name: "Clases" })).toHaveAttribute("aria-pressed", "false");
  });

  it("no ofrece agendar ni un plan de estudio", () => {
    render(<Calendario {...base()} />);
    const texto = document.body.textContent ?? "";
    expect(texto).not.toMatch(/agendar|plan de estudio|ver propuesta/i);
  });

  it("tocar un día abre la vista de ese día", () => {
    const p = base();
    render(<Calendario {...p} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver el jueves 17 de septiembre" }));
    expect(p.onFecha).toHaveBeenCalledWith("2026-09-17");
    expect(p.onVista).toHaveBeenCalledWith("dia");
  });

  it("la semana pone lo que no tiene hora arriba, sin hora inventada", () => {
    const datos = proyectarCalendario(
      insumos({
        bloques: [],
        evaluaciones: [{ id: "e1", cursadaId: "c2", tipo: "parcial", titulo: null, fecha: "2026-09-15", hora: null, modalidad: null }],
      }),
      "2026-08-31",
      "2026-10-04",
      AHORA,
      ZONA,
    );
    render(<Calendario {...base({ vista: "semana", fecha: "2026-09-15", datos })} />);
    expect(screen.getByText("sin hora")).toBeInTheDocument();
    const chip = screen.getByRole("button", { name: /^Parcial · Derecho/ });
    expect(within(chip).queryByText(/\d\d:\d\d/)).toBeNull();
  });

  it("mientras carga dibuja la grilla, sin eventos ni píldora", () => {
    render(<Calendario {...base({ datos: null })} />);
    expect(screen.getByLabelText("Mes")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-evento]")).toHaveLength(0);
    expect(screen.queryByText(/para la próxima evaluación/)).toBeNull();
  });
});
