import { describe, expect, it } from "vitest";

import { candidatosDelAde, recomendar, type ContextoDelAde, type UnidadCandidata } from "@/lib/domain/ade";
import { primerHueco, MINUTO } from "@/lib/domain/plan-vivo/intervalos";
import {
  planificar,
  validarIntercambio,
  validarUbicacion,
  type ResultadoDeUbicacion,
} from "@/lib/domain/plan-vivo/planificador";
import {
  aplicar,
  disponibilidadDeHistorial,
  ESTADO_INICIAL,
  entradaDe,
  estadoReal,
  estadoVisible,
  propuestasAutomaticas,
  reducir,
  SESION_INICIAL,
  type Accion,
  type SesionDelPlan,
} from "@/lib/domain/plan-vivo/sesion";
import { ganttConSupuestos, impactoDelEscenario, impactoIndividual } from "@/lib/domain/plan-vivo/impacto";
import type { BloqueFijo, PlanningWorkItem, PlanVivoBase } from "@/lib/domain/plan-vivo/tipos";
import type { GanttProjection } from "@/lib/domain/view-models";

/**
 * El planificador del Plan vivo — [ADR-110](../docs/decisions.md#adr-110).
 *
 * Una semana sintética en UTC para que la aritmética se lea: lunes 14 de
 * septiembre de 2026, **ahora = lunes 08:00**. Disponibilidad lunes y martes de
 * 18 a 20; miércoles de 18 a 18:30 y de 19 a 19:30 (fragmentada).
 */

const H = 60 * MINUTO;
const LUNES = Date.UTC(2026, 8, 14);
const t = (dia: number, hh: number, mm = 0) => LUNES + dia * 24 * H + hh * H + mm * MINUTO;

const franja = (dia: number, h1: number, h2: number, m1 = 0, m2 = 0) => ({ ini: t(dia, h1, m1), fin: t(dia, h2, m2) });

function item(id: string, p: Partial<PlanningWorkItem> = {}): PlanningWorkItem {
  return {
    id,
    sourceType: "CANDIDATO",
    actionId: null,
    cursadaId: "ce-a",
    materia: "Análisis",
    topicId: `t-${id}`,
    tema: `Tema ${id}`,
    title: `Tema ${id}`,
    durationRange: { minMinutes: 30, likelyMinutes: 60, maxMinutes: 90 },
    costo: 100,
    priority: { principal: "Todavía no registraste práctica en esta unidad.", razones: [] },
    dependencies: [],
    deadline: null,
    expectedEvidence: null,
    commitmentId: null,
    comprometible: false,
    ...p,
  };
}

const clase: BloqueFijo = {
  ...franja(0, 18, 19),
  id: "clase:lunes",
  tipo: "CLASE",
  titulo: "Análisis",
  cursadaId: "ce-a",
  itemId: null,
  estado: null,
  estimado: false,
  enlace: null,
};

function base(p: Partial<PlanVivoBase> = {}): PlanVivoBase {
  return {
    ahora: t(0, 8),
    zona: "UTC",
    semana: "2026-09-14",
    horizonte: { ini: LUNES, fin: LUNES + 7 * 24 * H },
    disponibilidad: [franja(0, 18, 20), franja(1, 18, 20), franja(2, 18, 18, 0, 30), franja(2, 19, 19, 0, 30)],
    disponibilidadSemanal: [],
    fijos: [clase],
    items: [item("a", { costo: 300 }), item("b", { costo: 200 }), item("c", { costo: 100 })],
    materias: [{ cursadaId: "ce-a", nombre: "Análisis" }],
    ...p,
  };
}

const proyectar = (b: PlanVivoBase, s: SesionDelPlan = SESION_INICIAL) => planificar(entradaDe(b, estadoVisible(s)));
const posicion = (b: PlanVivoBase, s: SesionDelPlan, id: string) =>
  proyectar(b, s).placedItems.find((p) => p.itemId === id)?.ini ?? null;
const correr = (s: SesionDelPlan, ...acciones: Accion[]) => acciones.reduce(reducir, s);
const operar = (op: Extract<Accion, { tipo: "OPERAR" }>["op"]): Accion => ({ tipo: "OPERAR", op });

describe("el automático propone un plan inicial", () => {
  it("ubica por prioridad en el primer hueco donde entra entero, sin pisar la clase", () => {
    const p = proyectar(base());
    expect(p.placedItems.map((x) => [x.itemId, x.ini])).toEqual([
      ["a", t(0, 19)],
      ["b", t(1, 18)],
      ["c", t(1, 19)],
    ]);
    expect(p.placedItems.every((x) => x.origen === "AUTOMATICA")).toBe(true);
  });

  it("es determinista: dos corridas dan lo mismo", () => {
    expect(proyectar(base())).toEqual(proyectar(base()));
  });

  it("no mueve clases, evaluaciones, compromisos ni fijados: la base sale igual", () => {
    const b = base();
    const antes = JSON.stringify(b.fijos);
    proyectar(b, correr(SESION_INICIAL, operar({ tipo: "VACIAR" }), operar({ tipo: "RECONSTRUIR" })));
    expect(JSON.stringify(b.fijos)).toBe(antes);
  });

  it("un compromiso no se mueve y su trabajo no vuelve a la cola", () => {
    const comprometido = item("a", { costo: 300, commitmentId: "co-1", sourceType: "ACTION", actionId: "ac-1" });
    const bloque: BloqueFijo = { ...clase, ...franja(1, 18, 19), id: "compromiso:co-1", tipo: "COMPROMISO", itemId: "a" };
    const b = base({ items: [comprometido, item("b", { costo: 200 })], fijos: [clase, bloque] });
    const p = proyectar(b);
    expect(p.placedItems.map((x) => x.itemId)).toEqual(["b"]);
    expect(p.unplacedItems.map((x) => x.id)).toEqual([]);
    expect(p.placedItems[0].ini).toBe(t(0, 19));
  });

  it("la fragmentación se dice: dos medias horas no alojan una hora", () => {
    const b = base({ disponibilidad: [franja(2, 18, 18, 0, 30), franja(2, 19, 19, 0, 30)], fijos: [] });
    const p = proyectar(b);
    expect(p.notFittingItems[0]).toEqual({ itemId: "a", causa: "FRAGMENTACION", requiere: null });
    expect(primerHueco(b.disponibilidad, t(0, 0), 60)).toBeNull();
  });

  it("un trabajo sin duración no se ubica y se cuenta aparte (sin datos no es cero)", () => {
    const p = proyectar(base({ items: [item("x", { durationRange: null })] }));
    expect(p.notFittingItems).toEqual([{ itemId: "x", causa: "SIN_DURACION", requiere: null }]);
    expect(p.metrics.sinDuracion).toBe(1);
    expect(p.metrics.pendiente).toBe(0);
  });

  it("nunca ubica después del plazo", () => {
    const p = proyectar(base({ items: [item("x", { deadline: { instante: t(0, 19, 30), evaluacionId: "ev", titulo: "Parcial" } })] }));
    expect(p.placedItems).toEqual([]);
    expect(p.notFittingItems[0].causa).toBe("FECHA_LIMITE");
  });
});

describe("dependencias duras", () => {
  const conDependencia = () =>
    base({
      items: [
        item("deriv", { costo: 900, dependencies: [{ topicId: "t-lim", itemId: "lim", kind: "HARD", reason: "Límites", source: { tipo: "topic_prerequisite", id: null } }] }),
        item("lim", { costo: 10 }),
      ],
    });

  it("el automático nunca las viola, aunque el dependiente sea más prioritario", () => {
    const p = proyectar(conDependencia());
    const ini = Object.fromEntries(p.placedItems.map((x) => [x.itemId, x.ini]));
    expect(ini.lim).toBe(t(0, 19));
    expect(ini.deriv).toBe(t(1, 18));
  });

  it("sin lugar para el prerrequisito, el dependiente no entra y dice qué falta", () => {
    const b = conDependencia();
    const s = correr(SESION_INICIAL, operar({ tipo: "VACIAR" }));
    const p = proyectar(b, s);
    expect(p.notFittingItems).toEqual([]);
    const sin = proyectar({ ...b, items: [b.items[0], { ...b.items[1], durationRange: null }] });
    expect(sin.notFittingItems).toContainEqual({ itemId: "deriv", causa: "DEPENDENCIA", requiere: "Límites" });
  });

  it("en manual bloquea ubicar el dependiente antes del prerrequisito", () => {
    const b = conDependencia();
    const s = correr(SESION_INICIAL, operar({ tipo: "VACIAR" }), operar({ tipo: "UBICAR", itemId: "lim", ini: t(1, 18), salen: [] }));
    const r = validarUbicacion(entradaDe(b, estadoVisible(s)), "deriv", t(0, 19));
    expect(r).toEqual({ tipo: "CONFLICTO", motivo: "DEPENDENCIA", contra: "lim" });
    expect(validarUbicacion(entradaDe(b, estadoVisible(s)), "deriv", t(1, 19))).toEqual({ tipo: "OK" });
  });

  it("no existe dependencia blanda en el modelo (ADR-110)", () => {
    const tipos = conDependencia().items.flatMap((i) => i.dependencies.map((d) => d.kind));
    expect(new Set(tipos)).toEqual(new Set(["HARD"]));
  });
});

describe("validar lo que el estudiante hace", () => {
  const vacio = () => correr(SESION_INICIAL, operar({ tipo: "VACIAR" }));
  const validar = (b: PlanVivoBase, s: SesionDelPlan, id: string, ini: number): ResultadoDeUbicacion =>
    validarUbicacion(entradaDe(b, estadoVisible(s)), id, ini);

  it("sobre la clase es un conflicto duro", () => {
    expect(validar(base(), vacio(), "a", t(0, 18))).toEqual({ tipo: "CONFLICTO", motivo: "CLASE", contra: "clase:lunes" });
  });

  it("en el pasado es un conflicto duro", () => {
    expect(validar(base(), vacio(), "a", t(0, 7))).toMatchObject({ tipo: "CONFLICTO", motivo: "PASADO" });
  });

  it("en un horario vacío no declarado pide agregar disponibilidad", () => {
    expect(validar(base(), vacio(), "a", t(3, 10))).toEqual({ tipo: "SIN_DISPONIBILIDAD", franja: { ini: t(3, 10), fin: t(3, 11) } });
  });

  it("una prioridad menor sin consecuencias no avisa", () => {
    expect(validar(base(), vacio(), "c", t(0, 19))).toEqual({ tipo: "OK" });
  });

  it("avisa sólo cuando trabajo más prioritario pierde su lugar", () => {
    const b = base({ disponibilidad: [franja(0, 19, 20)] });
    expect(validar(b, vacio(), "c", t(0, 19))).toEqual({ tipo: "CONSECUENCIA", pierden: ["a"] });
  });

  it("sobre una propuesta elegida la desplaza, y sobre una fijada no", () => {
    const b = base();
    const s = correr(vacio(), operar({ tipo: "UBICAR", itemId: "b", ini: t(1, 18), salen: [] }));
    expect(validar(b, s, "a", t(1, 18))).toEqual({ tipo: "DESPLAZA", desplazados: ["b"] });
    const fijada = correr(vacio(), operar({ tipo: "FIJAR", itemId: "b", ini: t(1, 18) }));
    expect(validar(b, fijada, "a", t(1, 18))).toEqual({ tipo: "CONFLICTO", motivo: "FIJADA", contra: "b" });
  });
});

describe("intercambiar", () => {
  it("dos propuestas de igual duración se intercambian directo", () => {
    const b = base();
    const r = validarIntercambio(entradaDe(b, ESTADO_INICIAL), "a", "b");
    expect(r.tipo).toBe("DIRECTO");
    if (r.tipo !== "DIRECTO") return;
    const s = correr(SESION_INICIAL, operar({ tipo: "INTERCAMBIAR", a: r.a, b: r.b, salen: r.salen }));
    expect(posicion(b, s, "a")).toBe(t(1, 18));
    expect(posicion(b, s, "b")).toBe(t(0, 19));
  });

  it("con duraciones distintas pide ver la reorganización antes", () => {
    const b = base({ items: [item("a", { costo: 300 }), item("b", { costo: 200, durationRange: { minMinutes: 20, likelyMinutes: 30, maxMinutes: 40 } })] });
    expect(validarIntercambio(entradaDe(b, ESTADO_INICIAL), "a", "b").tipo).toBe("REORGANIZAR");
  });

  it("uno incompatible explica por qué", () => {
    const b = base({
      items: [
        item("a", { costo: 300, deadline: { instante: t(0, 20), evaluacionId: "ev", titulo: "Parcial" } }),
        item("b", { costo: 200 }),
      ],
    });
    expect(validarIntercambio(entradaDe(b, ESTADO_INICIAL), "a", "b")).toEqual({ tipo: "PROHIBIDO", motivo: "FECHA_LIMITE", itemId: "a" });
  });

  it("una fijada no se intercambia", () => {
    const b = base();
    const s = correr(SESION_INICIAL, operar({ tipo: "FIJAR", itemId: "a", ini: t(0, 19) }));
    expect(validarIntercambio(entradaDe(b, estadoVisible(s)), "a", "b")).toEqual({ tipo: "PROHIBIDO", motivo: "FIJADA", itemId: "a" });
  });
});

describe("las métricas", () => {
  it("son coherentes entre sí", () => {
    const m = proyectar(base()).metrics;
    expect(m).toMatchObject({ pendiente: 180, asignado: 180, sinUbicar: 0, disponibilidadTotal: 300, disponibilidadOcupada: 180 });
    expect(m.disponibilidadLibre).toBe(m.disponibilidadTotal - m.disponibilidadOcupada);
  });

  it("crear disponibilidad aumenta la capacidad y no baja el pendiente", () => {
    const b = base({ items: [...base().items, item("d", { costo: 50 }), item("e", { costo: 40 })] });
    const antes = proyectar(b);
    const s = correr(SESION_INICIAL, operar({ tipo: "AGREGAR_DISPONIBILIDAD", franja: franja(3, 18, 20) }));
    const despues = proyectar(b, s);
    expect(despues.metrics.disponibilidadTotal).toBe(antes.metrics.disponibilidadTotal + 120);
    expect(despues.metrics.pendiente).toBe(antes.metrics.pendiente);
    expect(antes.notFittingItems.map((n) => n.itemId)).toEqual(["d", "e"]);
    // El automático incorpora lo que antes no entraba.
    expect(despues.notFittingItems).toEqual([]);
    expect(despues.metrics.sinUbicar).toBeLessThan(antes.metrics.sinUbicar);
  });

  it("un compromiso no cambia el pendiente", () => {
    const b = base();
    const conCompromiso = base({
      items: b.items.map((i) => (i.id === "a" ? { ...i, commitmentId: "co" } : i)),
      fijos: [clase, { ...clase, ...franja(0, 19, 20), id: "compromiso:co", tipo: "COMPROMISO", itemId: "a" }],
    });
    expect(proyectar(conCompromiso).metrics.pendiente).toBe(proyectar(b).metrics.pendiente);
  });

  it("ubicar a mano no cambia el pendiente pero sí lo sin ubicar", () => {
    const b = base();
    const vacio = correr(SESION_INICIAL, operar({ tipo: "VACIAR" }));
    const uno = correr(vacio, operar({ tipo: "UBICAR", itemId: "a", ini: t(0, 19), salen: [] }));
    expect(proyectar(b, uno).metrics.pendiente).toBe(proyectar(b, vacio).metrics.pendiente);
    expect(proyectar(b, uno).metrics.sinUbicar).toBe(proyectar(b, vacio).metrics.sinUbicar - 60);
  });
});

describe("manual", () => {
  it("guiado separa lo que entraría de lo que no entra", () => {
    const b = base({ items: [...base().items, item("d", { costo: 50 }), item("e", { costo: 40 })] });
    const p = proyectar(b, correr(SESION_INICIAL, operar({ tipo: "VACIAR" })));
    expect(p.placedItems).toEqual([]);
    expect(p.feasiblePrioritySet).toEqual(["a", "b", "c"]);
    expect(p.notFittingItems.map((n) => [n.itemId, n.causa])).toEqual([
      ["d", "FRAGMENTACION"],
      ["e", "FRAGMENTACION"],
    ]);
    expect(p.unplacedItems.map((i) => i.id)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("después de ubicar a mano, recalcula las dos secciones sin mover lo demás", () => {
    const b = base();
    const s = correr(SESION_INICIAL, operar({ tipo: "VACIAR" }), operar({ tipo: "UBICAR", itemId: "c", ini: t(0, 19), salen: [] }));
    const p = proyectar(b, s);
    expect(p.placedItems.map((x) => x.itemId)).toEqual(["c"]);
    expect(p.feasiblePrioritySet).toEqual(["a", "b"]);
  });

  it("pasar a manual conserva las propuestas que estaban a la vista", () => {
    const b = base();
    const auto = proyectar(b);
    const s = correr(SESION_INICIAL, operar({ tipo: "ESTRATEGIA", valor: "MANUAL", conservar: propuestasAutomaticas(auto) }));
    expect(proyectar(b, s).placedItems.map((x) => [x.itemId, x.ini])).toEqual(auto.placedItems.map((x) => [x.itemId, x.ini]));
  });
});

describe("fijar, devolver y vaciar", () => {
  it("un fijado no se mueve al agregar disponibilidad antes", () => {
    const b = base({ ahora: t(0, 8), disponibilidad: [franja(1, 18, 20)], items: [item("a")] });
    const s = correr(SESION_INICIAL, operar({ tipo: "FIJAR", itemId: "a", ini: t(1, 19) }), operar({ tipo: "AGREGAR_DISPONIBILIDAD", franja: franja(0, 10, 12) }));
    expect(posicion(b, s, "a")).toBe(t(1, 19));
  });

  it("una propuesta no fijada sí se adelanta al agregar disponibilidad", () => {
    const b = base({ disponibilidad: [franja(1, 18, 20)], items: [item("a")] });
    const s = correr(SESION_INICIAL, operar({ tipo: "AGREGAR_DISPONIBILIDAD", franja: franja(0, 10, 12) }));
    expect(posicion(b, SESION_INICIAL, "a")).toBe(t(1, 18));
    expect(posicion(b, s, "a")).toBe(t(0, 10));
  });

  it("devolver a la cola se sostiene en automático", () => {
    const s = correr(SESION_INICIAL, operar({ tipo: "DEVOLVER", itemId: "a" }));
    const p = proyectar(base(), s);
    expect(p.placedItems.map((x) => x.itemId)).not.toContain("a");
    expect(p.unplacedItems.map((x) => x.id)).toContain("a");
  });

  it("vaciar saca las propuestas, conserva disponibilidad y compromisos, pasa a manual y no cambia el pendiente", () => {
    const bloque: BloqueFijo = { ...clase, ...franja(1, 18, 19), id: "compromiso:co", tipo: "COMPROMISO", itemId: "c" };
    const b = base({ items: base().items.map((i) => (i.id === "c" ? { ...i, commitmentId: "co" } : i)), fijos: [clase, bloque] });
    const s = correr(SESION_INICIAL, operar({ tipo: "AGREGAR_DISPONIBILIDAD", franja: franja(4, 9, 10) }), operar({ tipo: "VACIAR" }));
    const antes = proyectar(b, correr(SESION_INICIAL, operar({ tipo: "AGREGAR_DISPONIBILIDAD", franja: franja(4, 9, 10) })));
    const p = proyectar(b, s);
    expect(estadoVisible(s).strategy).toBe("MANUAL");
    expect(p.placedItems).toEqual([]);
    expect(p.metrics.disponibilidadTotal).toBe(antes.metrics.disponibilidadTotal);
    expect(p.metrics.pendiente).toBe(antes.metrics.pendiente);
    expect(p.metrics.sinUbicar).toBeGreaterThan(antes.metrics.sinUbicar);
    expect(p.metrics.asignado).toBe(60);
    expect(entradaDe(b, estadoVisible(s)).fijos).toContain(bloque);
  });

  it("reconstruir vuelve a la propuesta de Achieve y conserva las fijadas", () => {
    const s = correr(
      SESION_INICIAL,
      operar({ tipo: "FIJAR", itemId: "c", ini: t(1, 18) }),
      operar({ tipo: "VACIAR" }),
      operar({ tipo: "FIJAR", itemId: "c", ini: t(1, 18) }),
      operar({ tipo: "RECONSTRUIR" }),
    );
    const p = proyectar(base(), s);
    expect(estadoVisible(s).strategy).toBe("AUTOMATIC");
    expect(p.placedItems.find((x) => x.itemId === "c")).toMatchObject({ ini: t(1, 18), fijada: true });
    expect(p.placedItems).toHaveLength(3);
  });
});

describe("deshacer y rehacer", () => {
  it("vuelve exactamente al estado anterior, y una operación nueva descarta el futuro", () => {
    const b = base();
    const s1 = correr(SESION_INICIAL, operar({ tipo: "DEVOLVER", itemId: "a" }));
    const s2 = correr(s1, { tipo: "DESHACER" });
    expect(proyectar(b, s2)).toEqual(proyectar(b));
    const s3 = correr(s2, { tipo: "REHACER" });
    expect(proyectar(b, s3)).toEqual(proyectar(b, s1));
    const s4 = correr(s2, operar({ tipo: "VACIAR" }));
    expect(disponibilidadDeHistorial(s4)).toEqual({ deshacer: true, rehacer: false });
  });

  it("no deshace por debajo de la base actualizada", () => {
    const s = correr(SESION_INICIAL, operar({ tipo: "FIJAR", itemId: "a", ini: t(0, 19) }));
    const actualizada = reducir(s, { tipo: "BASE_ACTUALIZADA", conservar: estadoReal(s) });
    expect(disponibilidadDeHistorial(actualizada).deshacer).toBe(false);
    expect(correr(actualizada, { tipo: "DESHACER" })).toBe(actualizada);
    expect(estadoReal(actualizada).ubicaciones).toEqual(estadoReal(s).ubicaciones);
  });
});

describe("simulación", () => {
  const b = base({ items: [...base().items, item("d", { costo: 50 }), item("e", { costo: 40 })] });
  const real = correr(SESION_INICIAL, operar({ tipo: "FIJAR", itemId: "c", ini: t(1, 19) }));

  it("entrar captura un snapshot inmutable del plan real", () => {
    const s = correr(real, { tipo: "ENTRAR_A_SIMULACION" });
    expect(s.simulacion?.snapshot).toEqual(estadoReal(real));
    expect(Object.isFrozen(s.simulacion?.snapshot)).toBe(true);
  });

  it("agregar disponibilidad recalcula el escenario e incorpora trabajo que no entraba", () => {
    const s = correr(real, { tipo: "ENTRAR_A_SIMULACION" }, operar({ tipo: "AGREGAR_DISPONIBILIDAD", franja: franja(3, 18, 20) }));
    expect(proyectar(b, real).notFittingItems.map((n) => n.itemId)).toEqual(["d", "e"]);
    expect(proyectar(b, s).notFittingItems).toEqual([]);
    expect(proyectar(b, s).metrics.pendiente).toBe(proyectar(b, real).metrics.pendiente);
  });

  it("salir restaura exactamente el plan real, con sus fijados, y descarta los fijados simulados", () => {
    const antes = proyectar(b, real);
    const s = correr(
      real,
      { tipo: "ENTRAR_A_SIMULACION" },
      operar({ tipo: "AGREGAR_DISPONIBILIDAD", franja: franja(3, 18, 20) }),
      operar({ tipo: "FIJAR", itemId: "d", ini: t(3, 18) }),
      operar({ tipo: "SIMULAR_HECHA", itemId: "a" }),
    );
    const enSim = proyectar(b, s);
    expect(enSim.placedItems.find((x) => x.itemId === "c")?.fijada).toBe(true);
    expect(enSim.placedItems.find((x) => x.itemId === "d")?.fijada).toBe(true);
    const fuera = correr(s, { tipo: "DESCARTAR_SIMULACION" });
    expect(proyectar(b, fuera)).toEqual(antes);
    expect(fuera.real).toBe(real.real);
  });

  it("simular capacidad no cambia el pendiente; simular cumplimiento sí, sólo en el escenario", () => {
    const sim = correr(real, { tipo: "ENTRAR_A_SIMULACION" });
    const hecha = correr(sim, operar({ tipo: "SIMULAR_HECHA", itemId: "a" }));
    expect(proyectar(b, hecha).metrics.pendiente).toBe(proyectar(b, sim).metrics.pendiente - 60);
    expect(proyectar(b, correr(real, operar({ tipo: "SIMULAR_HECHA", itemId: "a" })))).toEqual(proyectar(b, real));
  });

  it("todo lo del escenario se deshace", () => {
    const sim = correr(real, { tipo: "ENTRAR_A_SIMULACION" });
    const s = correr(sim, operar({ tipo: "AGREGAR_DISPONIBILIDAD", franja: franja(3, 18, 20) }), operar({ tipo: "VACIAR" }), operar({ tipo: "SIMULAR_HECHA", itemId: "b" }));
    const atras = correr(s, { tipo: "DESHACER" }, { tipo: "DESHACER" }, { tipo: "DESHACER" });
    expect(proyectar(b, atras)).toEqual(proyectar(b, sim));
  });
});

describe("impacto académico", () => {
  const gantt: GanttProjection = {
    barra: 10,
    pie: "pie",
    aclaracion: null,
    enRevision: 0,
    criterioAlcanzado: 0,
    eje: { marcas: [], hoy: 0.5 } as unknown as GanttProjection["eje"],
    unidades: [
      { codigo: "U1", nombre: "Tema a", minutos: 60, estado: "sin_evidencia", etiqueta: "Sin evidencia", desde: 0.1, hasta: 0.4, nota: null },
      { codigo: "U2", nombre: "Tema z", minutos: 60, estado: "sin_evidencia", etiqueta: "Sin evidencia", desde: null, hasta: null, nota: "sin fecha" },
    ],
  };

  it("simular el escenario usa todo lo asignado, y el Gantt real no cambia", () => {
    const b = base();
    const p = proyectar(b);
    const [m] = impactoDelEscenario(b, p, []);
    expect(m.temas).toEqual(["Tema a", "Tema b", "Tema c"]);
    expect(m.pendienteFinal).toBe(0);
    const copia = ganttConSupuestos(gantt, m.temas, "Supuesto");
    expect(copia.unidades[0]).toMatchObject({ estado: "criterio_alcanzado", etiqueta: "Supuesto" });
    expect(copia.unidades[1]).toBe(gantt.unidades[1]);
    expect(gantt.unidades[0].estado).toBe("sin_evidencia");
  });

  it("el impacto individual dice qué trabajo deja de esperar", () => {
    const b = base({
      items: [item("lim"), item("deriv", { dependencies: [{ topicId: "t-lim", itemId: "lim", kind: "HARD", reason: "Límites", source: { tipo: "topic_prerequisite", id: null } }] })],
    });
    expect(impactoIndividual(b, "lim")).toEqual({ itemId: "lim", cursadaId: "ce-a", tema: "Tema lim", desbloquea: ["deriv"] });
  });
});

describe("candidatos del ADE", () => {
  const u = (p: Partial<UnidadCandidata> & { topicId: string }): UnidadCandidata => ({
    nombre: p.topicId,
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
  const ctx: ContextoDelAde = {
    courseEnrollmentId: "ce",
    materia: "Análisis",
    unidades: [
      u({ topicId: "u1", orden: 1 }),
      u({ topicId: "u2", orden: 2 }),
      u({ topicId: "u3", orden: 3, requiere: ["u1"] }),
      u({ topicId: "u4", orden: 4, practicaEstado: "value", practicaValor: 5 }),
    ],
    proximaEvaluacion: { titulo: "Primer parcial", fecha: "2026-09-20", temas: ["u2"] },
    minutosDisponibles: 90,
    hayAccionViva: false,
    ahora: "2026-09-14T08:00:00Z",
  };

  it("el primero es exactamente lo que recomendaría el ADE, con su razón y su bloque", () => {
    const rec = recomendar(ctx);
    const [primero] = candidatosDelAde(ctx);
    if (rec.rama !== "NEW") throw new Error("se esperaba NEW");
    expect(primero.topicId).toBe(rec.recomendacion.topicId);
    expect(primero.razon).toBe(rec.recomendacion.razon);
    expect([primero.minutosMin, primero.minutosMax]).toEqual([rec.recomendacion.minutosMin, rec.recomendacion.minutosMax]);
  });

  it("deja afuera lo que ya tiene práctica e incluye lo bloqueado, marcado", () => {
    const ids = candidatosDelAde(ctx).map((c) => [c.topicId, c.habilitada]);
    expect(ids).toEqual([
      ["u2", true],
      ["u1", true],
      ["u3", false],
    ]);
  });

  it("sin unidades no hay candidatos, y no expone la magnitud como texto", () => {
    expect(candidatosDelAde({ ...ctx, unidades: [] })).toEqual([]);
    for (const c of candidatosDelAde(ctx)) expect(c.razon).not.toMatch(/prioridad|\d{3,}/i);
  });
});

describe("una sola proyección", () => {
  it("la cola, el calendario y las métricas salen del mismo cálculo", () => {
    const b = base({ items: [...base().items, item("d", { costo: 50 }), item("e", { costo: 40 })] });
    const p = proyectar(b);
    const ubicado = p.placedItems.reduce((s, x) => s + (x.fin - x.ini) / MINUTO, 0);
    expect(p.metrics.asignado).toBe(ubicado);
    expect(p.metrics.noEntra).toBe(p.notFittingItems.length * 60);
    expect(new Set([...p.placedItems.map((x) => x.itemId), ...p.unplacedItems.map((x) => x.id)])).toEqual(new Set(b.items.map((i) => i.id)));
  });

  it("aplicar no muta el estado de entrada", () => {
    const e = { ...ESTADO_INICIAL };
    const copia = JSON.stringify(e);
    aplicar(e, { tipo: "VACIAR" });
    expect(JSON.stringify(e)).toBe(copia);
  });
});
