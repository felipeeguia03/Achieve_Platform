import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlanVivo, type PlanVivoProps } from "@/components/screens/plan-vivo";
import type { ContextoDelAde, UnidadCandidata } from "@/lib/domain/ade";
import { filasSemanales } from "@/lib/domain/plan-vivo/disponibilidad";
import { planificar } from "@/lib/domain/plan-vivo/planificador";
import { ESTADO_INICIAL, entradaDe, type EstadoEditable } from "@/lib/domain/plan-vivo/sesion";
import type { PlanVivoBase } from "@/lib/domain/plan-vivo/tipos";
import { instanteEnZona } from "@/lib/domain/zona";
import { menuVisible } from "@/lib/navigation/menu";
import { nodos, superficieIds } from "@/lib/navigation/surfaces";
import { armarBaseDelPlan, type InsumosDelPlan } from "@/lib/server/servicios/proyeccion-plan-vivo";

/**
 * **Mi plan** — [ADR-110](../docs/decisions.md#adr-110) y su
 * [Enmienda 1](../docs/decisions.md#adr-110-enmienda-1): la base que arma el
 * servidor, la pantalla, la ruta propia `/plan` y el flag.
 */

const ZONA = "America/Argentina/Cordoba";
const SEMANA = "2026-09-14";
const AHORA = "2026-09-14T11:00:00.000Z"; // lunes 08:00 en Córdoba

const unidad = (p: Partial<UnidadCandidata> & { topicId: string }): UnidadCandidata => ({
  nombre: `Unidad ${p.topicId}`,
  orden: 1,
  requiere: [],
  practicaValor: null,
  practicaEstado: "no_information",
  dominioValor: null,
  dominioEstado: "no_information",
  recenciaEn: null,
  peso: null,
  recursos: [{ id: "r", titulo: "r" }],
  ...p,
});

function insumos(p: Partial<InsumosDelPlan> = {}): InsumosDelPlan {
  const contexto: ContextoDelAde = {
    courseEnrollmentId: "ce1",
    materia: "ANALISIS MATEMATICO I",
    unidades: [
      unidad({ topicId: "u1", orden: 1 }),
      unidad({ topicId: "u2", orden: 2 }),
      unidad({ topicId: "u3", orden: 3, requiere: ["u2"] }),
      unidad({ topicId: "u4", orden: 4, practicaEstado: "value", practicaValor: 5 }),
    ],
    proximaEvaluacion: { titulo: "Primer parcial", fecha: "2026-09-17", temas: ["u2"] },
    minutosDisponibles: 60,
    hayAccionViva: true,
    ahora: "",
  };
  return {
    calendario: {
      materias: [{ cursadaId: "ce1", nombre: "ANALISIS MATEMATICO I" }],
      bloques: [{ cursadaId: "ce1", dia: 1, desde: "14:00:00", hasta: "16:00:00", aula: null, estimada: false }],
      evaluaciones: [
        { id: "ev1", cursadaId: "ce1", tipo: "parcial", titulo: "Primer parcial", fecha: "2026-09-17", hora: "10:00:00", modalidad: null },
        { id: "ev2", cursadaId: "ce1", tipo: "entrega", titulo: "Entrega TP", fecha: "2026-09-18", hora: null, modalidad: null },
      ],
      proximaEvaluacion: "2026-09-17",
      compromisos: [
        { id: "co1", cursadaId: "ce1", inicio: "2026-09-15T21:00:00.000Z", minutos: 45, estado: "CONFIRMED", titulo: "Practicar U1" },
        { id: "co0", cursadaId: "ce1", inicio: "2026-09-14T10:00:00.000Z", minutos: 30, estado: "MISSED", titulo: "Practicar U0" },
      ],
      clasesAbiertas: [],
    },
    disponibilidad: [
      { dia: 2, desde: "18:00:00", hasta: "20:00:00", minutos: 120 },
      { dia: 3, desde: null, hasta: null, minutos: 90 },
    ],
    contextos: [{ cursadaId: "ce1", contexto }],
    accionesVivas: [
      { id: "a1", cursadaId: "ce1", topicId: "u1", objetivo: "Practicar U1", estado: "COMMITTED", minutosMin: 30, minutosMax: 60, evidencia: "Ejercicios" },
    ],
    compromisosVivos: [{ id: "co1", actionId: "a1" }],
    compromisoConFocus: null,
    ...p,
  };
}

const armar = (p: Partial<InsumosDelPlan> = {}) => armarBaseDelPlan(insumos(p), AHORA, ZONA, SEMANA);

describe("la base del servidor", () => {
  it("la Action viva es la única fila; el resto son candidatos, sin lo ya practicado", () => {
    const b = armar();
    expect(b.items.map((i) => [i.id, i.sourceType, i.actionId])).toEqual([
      ["action:a1", "ACTION", "a1"],
      ["candidato:ce1:u2", "CANDIDATO", null],
      ["candidato:ce1:u3", "CANDIDATO", null],
    ]);
    const accion = b.items[0];
    expect(accion).toMatchObject({ commitmentId: "co1", comprometible: false, expectedEvidence: "Ejercicios" });
    expect(accion.durationRange).toEqual({ minMinutes: 30, likelyMinutes: 45, maxMinutes: 60 });
    expect(b.items.every((i) => i.sourceType === "ACTION" || !i.comprometible)).toBe(true);
  });

  it("una acción recomendada se puede comprometer", () => {
    const b = armar({
      accionesVivas: [{ ...insumos().accionesVivas[0], estado: "RECOMMENDED" }],
      compromisosVivos: [],
    });
    expect(b.items[0]).toMatchObject({ comprometible: true, commitmentId: null });
  });

  it("las dependencias son los prerrequisitos explícitos, y el plazo es la evaluación con su hora", () => {
    const b = armar();
    const u2 = b.items.find((i) => i.topicId === "u2")!;
    const u3 = b.items.find((i) => i.topicId === "u3")!;
    expect(u3.dependencies).toEqual([
      { topicId: "u2", itemId: "candidato:ce1:u2", kind: "HARD", reason: "Unidad u2", source: { tipo: "topic_prerequisite", id: "u2" } },
    ]);
    expect(u2.deadline).toEqual({ instante: instanteEnZona("2026-09-17", "10:00", ZONA), evaluacionId: "ev1", titulo: "Primer parcial" });
    expect(u2.priority.principal).toBe("Entra en Primer parcial.");
  });

  it("ninguna razón visible expone una magnitud ni dice «prioridad» (P-03)", () => {
    for (const i of armar().items) {
      for (const texto of [i.priority.principal, ...i.priority.razones.map((r) => r.texto)]) {
        expect(texto).not.toMatch(/prioridad|\d{2,}/i);
      }
    }
  });

  it("lo fijo: clase, evaluación con hora (60 min), compromiso vivo con su trabajo, e incumplido como historia", () => {
    const b = armar();
    const clase = b.fijos.find((f) => f.tipo === "CLASE")!;
    expect([clase.ini, clase.fin]).toEqual([instanteEnZona("2026-09-14", "14:00", ZONA), instanteEnZona("2026-09-14", "16:00", ZONA)]);
    const ev = b.fijos.find((f) => f.tipo === "EVALUACION")!;
    expect(ev.fin - ev.ini).toBe(60 * 60_000);
    expect(b.fijos.find((f) => f.tipo === "COMPROMISO")).toMatchObject({ itemId: "action:a1", enlace: "/compromiso?compromiso=co1" });
    expect(b.fijos.find((f) => f.tipo === "HISTORIA")).toMatchObject({ itemId: null });
    expect(b.evaluacionesDelDia).toEqual([expect.objectContaining({ fecha: "2026-09-18" })]);
  });

  it("un Focus abierto marca su compromiso como en curso", () => {
    expect(armar({ compromisoConFocus: "co1" }).fijos.some((f) => f.tipo === "FOCUS" && f.itemId === "action:a1")).toBe(true);
  });

  it("la disponibilidad semanal se expande sobre la semana; sin hora no se dibuja", () => {
    const b = armar();
    expect(b.disponibilidad).toEqual([
      { ini: instanteEnZona("2026-09-15", "18:00", ZONA), fin: instanteEnZona("2026-09-15", "20:00", ZONA) },
    ]);
    expect(b.disponibilidadSemanal).toContainEqual({ dia: 3, desde: null, hasta: null, minutos: 90 });
  });

  it("guardar devuelve las filas semanales sin perder las que no tienen hora", () => {
    const b = armar();
    expect(filasSemanales(b, b.disponibilidad)).toEqual([
      { dia: 2, desde: "18:00", hasta: "20:00", minutos: 120 },
      { dia: 3, minutos: 90 },
    ]);
    const extra = { ini: instanteEnZona("2026-09-18", "09:00", ZONA), fin: instanteEnZona("2026-09-18", "10:30", ZONA) };
    expect(filasSemanales(b, [...b.disponibilidad, extra])).toContainEqual({ dia: 5, desde: "09:00", hasta: "10:30", minutos: 90 });
  });

  it("una acción que espera evidencia no se planifica, y lo que depende de su tema la espera", () => {
    const contexto = insumos().contextos[0].contexto;
    const b = armar({
      accionesVivas: [{ ...insumos().accionesVivas[0], topicId: "u2", estado: "EVIDENCE_PENDING" }],
      compromisosVivos: [],
      contextos: [{ cursadaId: "ce1", contexto }],
    });
    expect(b.items.some((i) => i.topicId === "u2")).toBe(false);
    const p = planificar(entradaDe(b, ESTADO_INICIAL));
    expect(p.notFittingItems.find((n) => n.itemId === "candidato:ce1:u3")?.causa).toBe("DEPENDENCIA");
  });

  it("el plan inicial ubica el candidato antes del parcial, sin tocar la clase ni el compromiso", () => {
    const b = armar();
    const p = planificar(entradaDe(b, ESTADO_INICIAL));
    const u2 = p.placedItems.find((x) => x.itemId === "candidato:ce1:u2")!;
    expect(u2.fin).toBeLessThanOrEqual(b.items.find((i) => i.topicId === "u2")!.deadline!.instante);
    for (const f of b.fijos) expect(u2.ini < f.fin && f.ini < u2.fin).toBe(false);
  });
});

// ── La pantalla ────────────────────────────────────────────────────────────────

afterEach(cleanup);

function props(base: PlanVivoBase, estado: EstadoEditable = ESTADO_INICIAL, extra: Partial<PlanVivoProps> = {}) {
  const noop = () => {};
  const proyeccion = planificar(entradaDe(base, estado));
  return {
    base,
    proyeccion,
    proyeccionReal: null,
    estado,
    simulando: false,
    presentacion: "GUIDED" as const,
    seleccion: null,
    explicacion: null,
    editandoDisponibilidad: false,
    puedeDeshacer: false,
    puedeRehacer: false,
    disponibilidadSinGuardar: false,
    dialogo: null,
    aviso: null,
    ocupado: false,
    impacto: "ACTUAL" as const,
    materiaDelImpacto: null,
    materia: null,
    materiaCargando: false,
    onSemana: noop,
    onEstrategia: noop,
    onPresentacion: noop,
    onSeleccionar: noop,
    onPorQue: noop,
    onUbicar: noop,
    onSoltarSobre: noop,
    onDevolver: noop,
    onFijar: noop,
    onDesfijar: noop,
    onElegirHorario: noop,
    onComprometerme: noop,
    onConfirmarCompromiso: noop,
    onEditarDisponibilidad: noop,
    onCrearDisponibilidad: noop,
    onQuitarDisponibilidad: noop,
    onGuardarDisponibilidad: noop,
    onVaciar: noop,
    onReconstruir: noop,
    onSimular: noop,
    onDescartarSimulacion: noop,
    onSimularHecha: noop,
    onDeshacer: noop,
    onRehacer: noop,
    onImpacto: noop,
    onAbrir: noop,
    onCerrarDialogo: noop,
    onAceptarDialogo: noop,
    ...extra,
  } as Extract<PlanVivoProps, { base: PlanVivoBase }>;
}

const comprometible = () =>
  armar({ accionesVivas: [{ ...insumos().accionesVivas[0], estado: "RECOMMENDED" }], compromisosVivos: [], calendario: { ...insumos().calendario, compromisos: [] } });

describe("la pantalla", () => {
  it("propone un plan inicial: las propuestas se dibujan con contorno y dicen que no son compromiso", () => {
    const { container } = render(<PlanVivo {...props(comprometible())} />);
    const propuestas = container.querySelectorAll('[data-propuesta="AUTOMATICA"]');
    expect(propuestas.length).toBeGreaterThan(0);
    expect(propuestas[0].getAttribute("aria-label")).toContain("Todavía no es un compromiso.");
  });

  it("no muestra la prioridad como nivel", () => {
    const { container } = render(<PlanVivo {...props(comprometible())} />);
    expect(container.textContent).not.toMatch(/prioridad (muy )?(alta|media|baja)/i);
  });

  it("doble clic y la CTA abren el mismo flujo de compromiso; un candidato no lo ofrece", () => {
    const onComprometerme = vi.fn();
    const base = comprometible();
    const { container, rerender } = render(<PlanVivo {...props(base, ESTADO_INICIAL, { onComprometerme })} />);
    const bloque = container.querySelector<HTMLElement>('[data-propuesta][aria-label*="Practicar U1"]')!;
    fireEvent.doubleClick(bloque);
    expect(onComprometerme).toHaveBeenCalledWith("action:a1");

    rerender(<PlanVivo {...props(base, ESTADO_INICIAL, { onComprometerme, seleccion: "action:a1" })} />);
    fireEvent.click(screen.getByRole("button", { name: "Comprometerme" }));
    expect(onComprometerme).toHaveBeenLastCalledWith("action:a1");

    rerender(<PlanVivo {...props(base, ESTADO_INICIAL, { onComprometerme, seleccion: "candidato:ce1:u2" })} />);
    expect(screen.queryByRole("button", { name: "Comprometerme" })).toBeNull();
    expect(screen.getByText(/todavía no es una acción: para comprometerte/)).toBeTruthy();
  });

  it("en simulación la señal es persistente, en palabras, y no ofrece comprometerse", () => {
    const base = comprometible();
    const { container } = render(<PlanVivo {...props(base, ESTADO_INICIAL, { simulando: true, seleccion: "action:a1" })} />);
    expect(container.querySelector("[data-banner-simulacion]")?.textContent).toContain("Los cambios no modifican tu plan real.");
    expect(screen.queryByRole("button", { name: "Comprometerme" })).toBeNull();
    expect(screen.getByRole("button", { name: "Simular como realizada" })).toBeTruthy();
  });

  it("manual guiado separa las dos listas; libre muestra una sola con insignias", () => {
    const base = comprometible();
    const manual = { ...ESTADO_INICIAL, strategy: "MANUAL" as const };
    const { rerender } = render(<PlanVivo {...props(base, manual)} />);
    expect(screen.getByText("Entrarían en tu plan")).toBeTruthy();
    expect(screen.getByText("No entran todavía")).toBeTruthy();
    rerender(<PlanVivo {...props(base, manual, { presentacion: "FREE" })} />);
    expect(screen.queryByText("Entrarían en tu plan")).toBeNull();
    expect(screen.getAllByText(/^(Entra|No entra todavía)$/).length).toBeGreaterThan(0);
  });

  it("vaciar pide confirmación con el texto que conserva compromisos y avances", () => {
    render(<PlanVivo {...props(comprometible(), ESTADO_INICIAL, { dialogo: { tipo: "VACIAR" } })} />);
    expect(screen.getByText(/Tus compromisos, clases, evaluaciones, disponibilidad y avances se conservarán/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Vaciar propuestas" })).toBeTruthy();
  });

  it("un conflicto con un compromiso ofrece el flujo explícito de cambio de horario, no moverlo", () => {
    const onAbrir = vi.fn();
    const base = armar();
    render(
      <PlanVivo
        {...props(base, ESTADO_INICIAL, {
          onAbrir,
          dialogo: { tipo: "CONFLICTO", itemId: "candidato:ce1:u2", motivo: "COMPROMISO", contra: base.fijos.find((f) => f.tipo === "COMPROMISO")!.id, alternativas: [] },
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cambiar horario del compromiso" }));
    expect(onAbrir).toHaveBeenCalledWith("/compromiso?compromiso=co1");
  });

  it("lo fijo no es arrastrable; lo propuesto sin fijar sí", () => {
    const { container } = render(<PlanVivo {...props(comprometible())} />);
    for (const f of container.querySelectorAll("[data-fijo]")) expect(f.getAttribute("draggable")).not.toBe("true");
    expect(container.querySelector('[data-propuesta="AUTOMATICA"]')?.getAttribute("draggable")).toBe("true");
  });
});

// ── El flag ────────────────────────────────────────────────────────────────────

const leer = (ruta: string) => readFileSync(resolve(__dirname, "..", ruta), "utf8");

describe("el flag", () => {
  it("la ruta responde 404 sin PLAN_VIVO=1, antes de mirar la sesión", async () => {
    vi.resetModules();
    const resolverSesion = vi.fn();
    vi.doMock("@/lib/server/composicion", () => ({ resolverSesion, planVivoDe: vi.fn() }));
    const anterior = process.env.PLAN_VIVO;
    delete process.env.PLAN_VIVO;
    try {
      const { GET } = await import("@/app/api/plan-vivo/route");
      const r = await GET(new Request("http://x/api/plan-vivo"));
      expect(r.status).toBe(404);
      expect(resolverSesion).not.toHaveBeenCalled();
    } finally {
      if (anterior !== undefined) process.env.PLAN_VIVO = anterior;
      vi.doUnmock("@/lib/server/composicion");
    }
  });

  /*
    ADR-110 · Enmienda 1. Antes esto verificaba que el Calendario *eligiera* su
    vista. Ahora verifica algo más fuerte: que **no haya nada que elegir**. La
    ruta del Calendario no menciona el Plan vivo por ningún lado.
  */
  it("el Calendario volvió a ADR-100 y no tiene rastro del Plan vivo", () => {
    const pagina = leer("app/(student)/calendario/page.tsx");
    expect(pagina).toMatch(/VistaDeCalendario/);
    expect(pagina).not.toMatch(/PlanVivo|plan-vivo|PLAN_VIVO/);
    expect(existsSync(resolve(__dirname, "..", "components/superficies/calendario-o-plan.tsx"))).toBe(false);
  });

  it("Mi plan es su propia ruta, apagada sin el flag", () => {
    const pagina = leer("app/(student)/plan/page.tsx");
    expect(pagina).toMatch(/if \(!planVivoActivo\(\)\) notFound\(\)/);
    expect(pagina).toMatch(/await connection\(\)/);
    expect(leer("lib/server/plan-vivo-flag.ts")).toMatch(/process\.env\.PLAN_VIVO === "1"/);
    expect(leer("lib/client/plan-vivo-flag.tsx")).toMatch(/createContext\(false\)/);
    expect(leer("app/(student)/layout.tsx")).toMatch(/activo=\{planVivoActivo\(\)\}/);
  });

  it("sin el flag el ítem del menú no se dibuja, y con el flag va segundo", () => {
    expect(menuVisible({ planVivo: false }).some((i) => i.nodo === "PLAN_VIVO")).toBe(false);
    const conFlag = menuVisible({ planVivo: true });
    expect(conFlag.map((i) => i.etiqueta).slice(0, 2)).toEqual(["Hoy", "Mi plan"]);
    // El nodo existe y tiene ruta: un ítem de menú nunca lleva a un lugar que no existe.
    expect(nodos.PLAN_VIVO.ruta).toBe("/plan");
    // ⚠️ Y **no** es una décima superficie.
    expect(superficieIds).not.toContain("PLAN_VIVO");
    expect(superficieIds.length).toBe(9);
  });

  it("el Plan vivo sólo escribe por los contratos que ya existen", () => {
    const contenedor = leer("components/superficies/plan-vivo.tsx");
    const rutas = [...contenedor.matchAll(/enviar(?:<[^>]*>)?\("([^"]+)"/g)].map((m) => m[1]);
    expect(rutas.sort()).toEqual(["/api/alta/disponibilidad", "/api/compromiso"]);
    expect(leer("app/api/plan-vivo/route.ts")).not.toMatch(/export async function (POST|PATCH|DELETE)/);
    expect(leer("lib/server/repositorios/plan-vivo.ts")).not.toMatch(/\.(insert|update|upsert|delete)\(/);
  });

  it("no lee el anotador privado del Focus", () => {
    expect(leer("lib/server/repositorios/plan-vivo.ts")).not.toMatch(/scratchpad|advance_text/);
  });

  it("el laboratorio V3 sigue en su lugar y el producto no lo importa", () => {
    expect(leer("app/demo/plan-vivo-spike-v3/page.tsx")).toContain("PLAN_VIVO_SPIKE_V3");
    for (const f of ["components/screens/plan-vivo.tsx", "components/superficies/plan-vivo.tsx", "lib/server/servicios/proyeccion-plan-vivo.ts"]) {
      expect(leer(f)).not.toMatch(/app\/demo/);
    }
  });
});
