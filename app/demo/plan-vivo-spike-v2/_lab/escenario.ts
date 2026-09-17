/**
 * 🧪 **LABORATORIO DESCARTABLE — la sesión de simulación.**
 *
 * El escenario vive **en memoria**: un historial de escenarios, el último es el
 * actual. Deshacer saca el último; *Volver a este paso* corta el historial justo
 * después de ese paso; *Restablecer* deja sólo el vacío. **Nada se persiste**:
 * refrescar vuelve siempre al plan real.
 *
 * Puro: el componente sólo despacha acciones.
 */

import { ID, MAXIMO_DE_PASOS } from "./fixture";
import { mismaFranja } from "./formato";
import {
  compromisoEnVentana,
  huecosParaCompromiso,
  huecosParaPropuesta,
  porQueNoSeSimula,
  proyectar,
  VACIO,
} from "./proyeccion";
import type { Escenario, Franja } from "./tipos";

export interface EstadoDelLab {
  historial: readonly Escenario[];
}

export type Accion =
  | { tipo: "SIMULAR"; id: string; override: boolean }
  | { tipo: "DESHACER" }
  | { tipo: "VOLVER_A_PASO"; numero: number }
  | { tipo: "RESTABLECER" }
  | { tipo: "REUBICAR"; id: string; franja: Franja }
  | { tipo: "RENEGOCIAR"; id: string; franja: Franja }
  | { tipo: "AGREGAR_VENTANA"; id: string }
  | { tipo: "QUITAR_VENTANA"; id: string }
  | { tipo: "RESTABLECER_DISPONIBILIDAD" };

export const INICIAL: EstadoDelLab = { historial: [VACIO] };

export const escenarioActual = (e: EstadoDelLab): Escenario => e.historial[e.historial.length - 1];

/** Aplica una acción a un escenario, **sin historial**. Sirve para las vistas previas. */
export function aplicar(esc: Escenario, accion: Accion): Escenario {
  switch (accion.tipo) {
    case "SIMULAR": {
      if (porQueNoSeSimula(esc, proyectar(esc), accion.id) !== null) return esc;
      return { ...esc, pasos: [...esc.pasos, { id: accion.id, override: accion.override }] };
    }
    case "REUBICAR": {
      const { huecos } = huecosParaPropuesta(esc, accion.id);
      if (!huecos.some((h) => mismaFranja(h, accion.franja))) return esc;
      return { ...esc, reubicaciones: { ...esc.reubicaciones, [accion.id]: accion.franja } };
    }
    case "RENEGOCIAR": {
      const { huecos } = huecosParaCompromiso(esc, accion.id);
      if (!huecos.some((h) => mismaFranja(h, accion.franja))) return esc;
      return { ...esc, renegociaciones: { ...esc.renegociaciones, [accion.id]: accion.franja } };
    }
    case "AGREGAR_VENTANA":
      return esc.agregadas.includes(accion.id) ? esc : { ...esc, agregadas: [...esc.agregadas, accion.id] };
    case "QUITAR_VENTANA":
      // ⚠️ Un compromiso adentro no se mueve solo: primero se le cambia el horario.
      if (compromisoEnVentana(esc, accion.id) !== null) return esc;
      if (esc.agregadas.includes(accion.id)) return { ...esc, agregadas: esc.agregadas.filter((x) => x !== accion.id) };
      return esc.quitadas.includes(accion.id) ? esc : { ...esc, quitadas: [...esc.quitadas, accion.id] };
    case "RESTABLECER_DISPONIBILIDAD":
      return esc.agregadas.length === 0 && esc.quitadas.length === 0 ? esc : { ...esc, agregadas: [], quitadas: [] };
    default:
      return esc;
  }
}

export function reducir(estado: EstadoDelLab, accion: Accion): EstadoDelLab {
  switch (accion.tipo) {
    case "DESHACER":
      return estado.historial.length > 1 ? { historial: estado.historial.slice(0, -1) } : estado;
    case "RESTABLECER":
      return estado.historial.length === 1 && estado.historial[0] === VACIO ? estado : INICIAL;
    case "VOLVER_A_PASO": {
      const i = estado.historial.findIndex((e) => e.pasos.length === accion.numero);
      return i < 0 || i === estado.historial.length - 1 ? estado : { historial: estado.historial.slice(0, i + 1) };
    }
    default: {
      const actual = escenarioActual(estado);
      if (accion.tipo === "SIMULAR" && actual.pasos.length >= MAXIMO_DE_PASOS) return estado;
      const siguiente = aplicar(actual, accion);
      return siguiente === actual ? estado : { historial: [...estado.historial, siguiente] };
    }
  }
}

/** El escenario de antes y de después de agregar el paso `numero`. */
export function extremosDelPaso(estado: EstadoDelLab, numero: number): { antes: Escenario; despues: Escenario } | null {
  const i = estado.historial.findIndex((e) => e.pasos.length === numero);
  if (i <= 0) return null;
  return { antes: estado.historial[i - 1], despues: estado.historial[i] };
}

// ── Estados demostrativos (`?escenario=`) ─────────────────────────────────────

export type Plano = "REAL" | "ESCENARIO";
export type Modo = "EXPLICADO" | "LIMPIO";
export type Vista = "PLAN" | "CALENDARIO";

export interface EstadoDemostrativo {
  acciones: readonly Accion[];
  seleccion: string | null;
  plano: Plano;
  modo?: Modo;
  vista?: Vista;
}

const simular = (id: string, override = false): Accion => ({ tipo: "SIMULAR", id, override });
const TRES = [simular(ID.LIMITES), simular(ID.TEORIA_DERIVADAS), simular(ID.PRACTICA_DERIVADAS)];
const REUBICADA: Accion = { tipo: "REUBICAR", id: ID.ECONOMIA_U3, franja: { dia: "2026-09-19", desde: "10:00", hasta: "11:00" } };
const RENEGOCIADO: Accion = { tipo: "RENEGOCIAR", id: ID.COMPROMISO, franja: { dia: "2026-09-17", desde: "19:30", hasta: "20:30" } };

/**
 * Herramientas del laboratorio, no de la experiencia: cada una arranca del mismo
 * fixture y se arma con las mismas acciones que la pantalla.
 */
export const ESTADOS_DEMOSTRATIVOS: Readonly<Record<string, EstadoDemostrativo>> = {
  base: { acciones: [], seleccion: null, plano: "REAL" },
  futuro: { acciones: [], seleccion: ID.LIMITES, plano: "REAL" },
  historico: { acciones: [], seleccion: ID.HECHO_ARQ, plano: "REAL" },
  "clase-pasada": { acciones: [], seleccion: ID.CLASE_ANA_LUN, plano: "REAL" },
  "clase-futura": { acciones: [], seleccion: ID.CLASE_ANA_MIE, plano: "REAL" },
  evaluacion: { acciones: [], seleccion: ID.PARCIAL, plano: "REAL" },
  "un-paso": { acciones: [simular(ID.LIMITES)], seleccion: ID.LIMITES, plano: "ESCENARIO" },
  "tres-pasos": { acciones: TRES, seleccion: ID.PRACTICA_DERIVADAS, plano: "ESCENARIO" },
  "prioridad-inferior": { acciones: [...TRES, simular(ID.ECONOMIA_U3, true)], seleccion: ID.ECONOMIA_U3, plano: "ESCENARIO" },
  dependencia: { acciones: [simular(ID.PRACTICA_DERIVADAS, true)], seleccion: ID.PRACTICA_DERIVADAS, plano: "ESCENARIO" },
  reubicada: { acciones: [REUBICADA], seleccion: ID.ECONOMIA_U3, plano: "ESCENARIO" },
  renegociado: { acciones: [RENEGOCIADO], seleccion: ID.COMPROMISO, plano: "ESCENARIO" },
  limpio: { acciones: TRES, seleccion: null, plano: "ESCENARIO", modo: "LIMPIO" },
  calendario: { acciones: [REUBICADA, RENEGOCIADO], seleccion: ID.COMPROMISO, plano: "ESCENARIO", vista: "CALENDARIO" },
};

export function estadoDesde(acciones: readonly Accion[]): EstadoDelLab {
  return acciones.reduce(reducir, INICIAL);
}
