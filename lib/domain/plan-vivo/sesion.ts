/**
 * **La sesión del Plan vivo** — [ADR-110](../../../docs/decisions.md#adr-110).
 *
 * El estado editable **no se guarda como copia**: se deriva de la base del
 * servidor más una lista de operaciones, y deshacer es mover un cursor. La
 * simulación es lo mismo sobre un **snapshot inmutable** del plan real:
 *
 * ```text
 * real       = base ⊕ ops_real[0..cursor]
 * simulación = snapshot(real) ⊕ ops_sim[0..cursor]
 * ```
 *
 * Descartar la simulación es tirar su lista: el plan real **nunca** se tocó.
 *
 * ⚠️ **Deshacer sólo alcanza planificación.** Un `Commitment`, una `Evidence`,
 * un progreso o un Focus no son operaciones de esta lista: tienen sus flujos.
 */

import { restar, unir } from "./intervalos";
import type { Intervalo, Placement, PlacementStrategy, PlanningInput, PlanningProjection, PlanVivoBase } from "./tipos";

export type Operacion =
  | { tipo: "AGREGAR_DISPONIBILIDAD"; franja: Intervalo }
  | { tipo: "QUITAR_DISPONIBILIDAD"; franja: Intervalo }
  /** Ubicar o mover. `salen`: propuestas elegidas que vuelven a la cola. */
  | { tipo: "UBICAR"; itemId: string; ini: number; salen: readonly string[] }
  | { tipo: "AGREGAR_Y_UBICAR"; franja: Intervalo; itemId: string; ini: number }
  | { tipo: "DEVOLVER"; itemId: string }
  | { tipo: "INTERCAMBIAR"; a: Placement; b: Placement; salen: readonly string[] }
  | { tipo: "FIJAR"; itemId: string; ini: number }
  | { tipo: "DESFIJAR"; itemId: string }
  /** Saca **todas** las propuestas, fijadas incluidas, y pasa a manual. */
  | { tipo: "VACIAR" }
  /** Vuelve a la propuesta de Achieve: automático, conservando sólo las fijadas. */
  | { tipo: "RECONSTRUIR" }
  /**
   * Cambia la estrategia. Al pasar a manual, `conservar` trae las propuestas
   * automáticas que estaban a la vista: **no se mueve nada** por elegir manual.
   */
  | { tipo: "ESTRATEGIA"; valor: PlacementStrategy; conservar: readonly Placement[] }
  /** Sólo en simulación: supone el trabajo hecho, con evidencia suficiente y progreso. */
  | { tipo: "SIMULAR_HECHA"; itemId: string };

export interface EstadoEditable {
  strategy: PlacementStrategy;
  ubicaciones: readonly Placement[];
  agregada: readonly Intervalo[];
  quitada: readonly Intervalo[];
  hechos: readonly string[];
  /** Devueltas a la cola por el estudiante: el automático no las vuelve a ubicar. */
  retenidas: readonly string[];
}

export interface Historial {
  ops: readonly Operacion[];
  cursor: number;
  /** Debajo de esto no se deshace: es la semilla después de actualizar la base. */
  piso: number;
}

export interface SesionDelPlan {
  real: Historial;
  simulacion: { snapshot: EstadoEditable; historial: Historial } | null;
}

export const ESTADO_INICIAL: EstadoEditable = {
  strategy: "AUTOMATIC",
  ubicaciones: [],
  agregada: [],
  quitada: [],
  hechos: [],
  retenidas: [],
};

export const SESION_INICIAL: SesionDelPlan = { real: { ops: [], cursor: 0, piso: 0 }, simulacion: null };

const sin = (xs: readonly Placement[], ids: readonly string[]) => xs.filter((u) => !ids.includes(u.itemId));
const manual = (itemId: string, ini: number, fijada = false): Placement => ({ itemId, ini, origen: "MANUAL", fijada });

export function aplicar(e: EstadoEditable, op: Operacion): EstadoEditable {
  switch (op.tipo) {
    case "AGREGAR_DISPONIBILIDAD":
      return {
        ...e,
        agregada: unir([...e.agregada, op.franja]),
        quitada: restar(e.quitada, [op.franja]),
      };
    case "QUITAR_DISPONIBILIDAD":
      return {
        ...e,
        agregada: restar(e.agregada, [op.franja]),
        quitada: unir([...e.quitada, op.franja]),
      };
    case "UBICAR": {
      const previa = e.ubicaciones.find((u) => u.itemId === op.itemId);
      return {
        ...e,
        ubicaciones: [...sin(e.ubicaciones, [op.itemId, ...op.salen]), manual(op.itemId, op.ini, previa?.fijada)],
        retenidas: e.retenidas.filter((id) => id !== op.itemId),
      };
    }
    case "AGREGAR_Y_UBICAR":
      return aplicar(aplicar(e, { tipo: "AGREGAR_DISPONIBILIDAD", franja: op.franja }), {
        tipo: "UBICAR",
        itemId: op.itemId,
        ini: op.ini,
        salen: [],
      });
    case "DEVOLVER":
      return {
        ...e,
        ubicaciones: sin(e.ubicaciones, [op.itemId]),
        retenidas: e.retenidas.includes(op.itemId) ? e.retenidas : [...e.retenidas, op.itemId],
      };
    case "INTERCAMBIAR":
      return { ...e, ubicaciones: [op.a, op.b, ...sin(e.ubicaciones, [op.a.itemId, op.b.itemId, ...op.salen])] };
    case "FIJAR":
      return {
        ...e,
        ubicaciones: [...sin(e.ubicaciones, [op.itemId]), manual(op.itemId, op.ini, true)],
        retenidas: e.retenidas.filter((id) => id !== op.itemId),
      };
    case "DESFIJAR":
      return {
        ...e,
        ubicaciones: e.ubicaciones.map((u) => (u.itemId === op.itemId ? { ...u, fijada: false } : u)),
      };
    case "VACIAR":
      return { ...e, strategy: "MANUAL", ubicaciones: [] };
    case "RECONSTRUIR":
      return { ...e, strategy: "AUTOMATIC", ubicaciones: e.ubicaciones.filter((u) => u.fijada), retenidas: [] };
    case "ESTRATEGIA": {
      if (op.valor === e.strategy) return e;
      if (op.valor === "MANUAL") {
        const ya = new Set(e.ubicaciones.map((u) => u.itemId));
        const conservadas = op.conservar.filter((u) => !ya.has(u.itemId)).map((u) => manual(u.itemId, u.ini));
        return { ...e, strategy: "MANUAL", ubicaciones: [...e.ubicaciones, ...conservadas] };
      }
      return { ...e, strategy: "AUTOMATIC" };
    }
    case "SIMULAR_HECHA":
      return e.hechos.includes(op.itemId)
        ? e
        : { ...e, hechos: [...e.hechos, op.itemId], ubicaciones: sin(e.ubicaciones, [op.itemId]) };
  }
}

const reproducir = (desde: EstadoEditable, h: Historial) => h.ops.slice(0, h.cursor).reduce(aplicar, desde);

export const estadoReal = (s: SesionDelPlan): EstadoEditable => reproducir(ESTADO_INICIAL, s.real);

/** Lo que se ve: la simulación si hay una, el plan real si no. */
export function estadoVisible(s: SesionDelPlan): EstadoEditable {
  return s.simulacion ? reproducir(s.simulacion.snapshot, s.simulacion.historial) : estadoReal(s);
}

function empujar(h: Historial, op: Operacion): Historial {
  // Una operación nueva después de deshacer **descarta el futuro**, como todo editor.
  return { ...h, ops: [...h.ops.slice(0, h.cursor), op], cursor: h.cursor + 1 };
}

export type Accion =
  | { tipo: "OPERAR"; op: Operacion }
  | { tipo: "DESHACER" }
  | { tipo: "REHACER" }
  | { tipo: "ENTRAR_A_SIMULACION" }
  | { tipo: "DESCARTAR_SIMULACION" }
  /** La base cambió en el servidor (se guardó disponibilidad o un compromiso): el historial real se vacía. */
  | { tipo: "BASE_ACTUALIZADA"; conservar: EstadoEditable };

export function reducir(s: SesionDelPlan, a: Accion): SesionDelPlan {
  switch (a.tipo) {
    case "OPERAR": {
      if (s.simulacion) return { ...s, simulacion: { ...s.simulacion, historial: empujar(s.simulacion.historial, a.op) } };
      // Suponer un trabajo hecho **nunca** entra al plan real.
      if (a.op.tipo === "SIMULAR_HECHA") return s;
      return { ...s, real: empujar(s.real, a.op) };
    }
    case "DESHACER": {
      const h = s.simulacion ? s.simulacion.historial : s.real;
      if (h.cursor <= h.piso) return s;
      const nuevo = { ...h, cursor: h.cursor - 1 };
      return s.simulacion ? { ...s, simulacion: { ...s.simulacion, historial: nuevo } } : { ...s, real: nuevo };
    }
    case "REHACER": {
      const h = s.simulacion ? s.simulacion.historial : s.real;
      if (h.cursor >= h.ops.length) return s;
      const nuevo = { ...h, cursor: h.cursor + 1 };
      return s.simulacion ? { ...s, simulacion: { ...s.simulacion, historial: nuevo } } : { ...s, real: nuevo };
    }
    case "ENTRAR_A_SIMULACION":
      if (s.simulacion) return s;
      // Congelado: nada de lo que pase en la simulación puede llegar a este objeto.
      return { ...s, simulacion: { snapshot: congelar(estadoReal(s)), historial: { ops: [], cursor: 0, piso: 0 } } };
    case "DESCARTAR_SIMULACION":
      return { ...s, simulacion: null };
    case "BASE_ACTUALIZADA": {
      const semilla: Operacion[] = [];
      const e = a.conservar;
      if (e.strategy === "MANUAL") semilla.push({ tipo: "ESTRATEGIA", valor: "MANUAL", conservar: [] });
      for (const id of e.retenidas) semilla.push({ tipo: "DEVOLVER", itemId: id });
      for (const u of e.ubicaciones) {
        semilla.push(u.fijada ? { tipo: "FIJAR", itemId: u.itemId, ini: u.ini } : { tipo: "UBICAR", itemId: u.itemId, ini: u.ini, salen: [] });
      }
      // La semilla no se puede deshacer: es el punto de partida sobre la base nueva.
      return { real: { ops: semilla, cursor: semilla.length, piso: semilla.length }, simulacion: null };
    }
  }
}

const puede = (h: Historial) => ({ deshacer: h.cursor > h.piso, rehacer: h.cursor < h.ops.length });
export const disponibilidadDeHistorial = (s: SesionDelPlan) => puede(s.simulacion ? s.simulacion.historial : s.real);

function congelar<T>(x: T): T {
  if (x && typeof x === "object") {
    for (const v of Object.values(x)) congelar(v);
    return Object.freeze(x);
  }
  return x;
}

// ── De la sesión a la entrada del planificador ──────────────────────────────────

export function entradaDe(base: PlanVivoBase, e: EstadoEditable): PlanningInput {
  return {
    ahora: base.ahora,
    horizonte: base.horizonte,
    disponibilidad: restar(unir([...base.disponibilidad, ...e.agregada]), e.quitada),
    fijos: base.fijos,
    items: base.items,
    ubicaciones: e.ubicaciones,
    strategy: e.strategy,
    hechos: e.hechos,
    retenidas: e.retenidas,
  };
}

/** Las propuestas automáticas que hay que conservar al pasar a manual. */
export function propuestasAutomaticas(p: PlanningProjection): Placement[] {
  return p.placedItems.filter((x) => x.origen === "AUTOMATICA").map(({ itemId, ini, origen, fijada }) => ({ itemId, ini, origen, fijada }));
}

/** ¿Hay disponibilidad agregada o quitada en el plan real, sin guardar? */
export const disponibilidadSinGuardar = (e: EstadoEditable) => e.agregada.length > 0 || e.quitada.length > 0;
