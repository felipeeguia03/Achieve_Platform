/**
 * 🧪 **LABORATORIO DESCARTABLE V3 — el estado local y sus cambios.**
 *
 * Todo vive en memoria y **se pierde al refrescar**. El reducer es la segunda
 * barrera: la pantalla avisa antes, pero acá tampoco entra una ubicación con conflicto
 * duro, un compromiso movido sin su operación ni un sexto paso de simulación.
 *
 * Lo que cada acción **no** hace está dicho en su caso, porque es lo que el
 * laboratorio quiere que se vea:
 *
 * - `UBICAR` no crea progreso, no quita trabajo pendiente y no toca el Gantt.
 * - `COMPROMETER` no crea progreso, evidencia ni cambia el Gantt.
 * - `SIMULAR` sólo agrega a la pila del escenario: el plan real no cambia.
 */

import { ACCIONES, AHORA, AHORA_ADELANTADO, COMPROMISOS, ID, MAXIMO_DE_PASOS, VENTANAS, instanteDe } from "./fixture";
import { horaDe, instante, nombreDelDia, fechaDe, tramoMedio } from "./formato";
import { accion, bandeja, compromisoDe, mundoDe, porQueNoSeSimula, posiciones, validarCambioDeHorario, validarUbicacion } from "./motor";
import { mundoDelEscenario, type Plano } from "./proyeccion";
import type { CompromisoVivo, EstadoLab, VentanaViva } from "./tipos";

export type AccionDelLab =
  | { tipo: "UBICAR"; id: string; ini: number; duracion: number }
  | { tipo: "DEVOLVER"; id: string }
  | { tipo: "COMPROMETER"; id: string }
  | { tipo: "CAMBIAR_HORARIO"; compromisoId: string; ini: number }
  | { tipo: "SIMULAR"; id: string }
  | { tipo: "DESHACER_PASO" }
  | { tipo: "REINICIAR_ESCENARIO" }
  | { tipo: "AJUSTAR_DISPONIBILIDAD"; ventanas: readonly VentanaViva[] }
  | { tipo: "ADELANTAR_RELOJ"; fecha: string; hora: string; focus?: { accionId: string; desde: string } }
  | { tipo: "REORGANIZAR" };

export function estadoInicial(): EstadoLab {
  return {
    ahora: instante(AHORA.fecha, AHORA.hora),
    relojAdelantado: false,
    ubicaciones: {},
    compromisos: COMPROMISOS.map((c): CompromisoVivo => {
      const { ini, fin } = instanteDe(c.tramo);
      return { id: c.id, accionId: c.accionId, ini, fin, evidencia: c.evidencia, estado: c.estado, origen: "FIXTURE", promesaOriginal: { ini, fin }, cambios: [], focusDesde: null };
    }),
    ventanas: VENTANAS.map((v) => ({ id: v.id, ...instanteDe(v.tramo), origen: "DECLARADA" as const })),
    pasos: [],
    bitacora: [],
    devueltas: { [ID.PIPELINE]: "Retoma el compromiso incumplido del martes 10:30." },
  };
}

const anotar = (e: EstadoLab, texto: string): EstadoLab["bitacora"] => [...e.bitacora, { id: `BIT-${e.bitacora.length + 1}`, cuando: e.ahora, texto }];

function sinClave<T>(r: Readonly<Record<string, T>>, clave: string): Record<string, T> {
  const copia = { ...r };
  delete copia[clave];
  return copia;
}

export function reducir(e: EstadoLab, a: AccionDelLab): EstadoLab {
  const m = mundoDe(e);
  switch (a.tipo) {
    case "UBICAR": {
      if (validarUbicacion(m, a.id, a.ini, a.duracion).duros.length > 0) return e;
      const titulo = accion(a.id)!.titulo;
      return {
        ...e,
        ubicaciones: { ...e.ubicaciones, [a.id]: { ini: a.ini, duracion: a.duracion } },
        devueltas: sinClave(e.devueltas, a.id),
        bitacora: anotar(e, `Ubicaste «${titulo}» el ${tramoMedio(a.ini, a.ini + a.duracion)}. Sigue siendo una propuesta.`),
      };
    }
    case "DEVOLVER": {
      if (!e.ubicaciones[a.id]) return e;
      return { ...e, ubicaciones: sinClave(e.ubicaciones, a.id), bitacora: anotar(e, `Devolviste «${accion(a.id)!.titulo}» a Acciones por ubicar.`) };
    }
    case "COMPROMETER": {
      const u = e.ubicaciones[a.id];
      if (!u || u.ini < e.ahora || compromisoDe(m, a.id) || !bandeja(m).some((x) => x.id === a.id)) return e;
      const fin = u.ini + u.duracion;
      const nuevo: CompromisoVivo = {
        id: `COM-LOCAL-${a.id}`,
        accionId: a.id,
        ini: u.ini,
        fin,
        evidencia: accion(a.id)!.evidencia,
        estado: "CONFIRMADO",
        origen: "LOCAL",
        promesaOriginal: { ini: u.ini, fin },
        cambios: [],
        focusDesde: null,
      };
      return {
        ...e,
        ubicaciones: sinClave(e.ubicaciones, a.id),
        compromisos: [...e.compromisos.filter((c) => c.id !== nuevo.id), nuevo],
        bitacora: anotar(e, `Te comprometiste con «${accion(a.id)!.titulo}» el ${tramoMedio(u.ini, fin)}. No registra progreso.`),
      };
    }
    case "CAMBIAR_HORARIO": {
      if (validarCambioDeHorario(m, a.compromisoId, a.ini).duros.length > 0) return e;
      const c = e.compromisos.find((x) => x.id === a.compromisoId)!;
      const despues = { ini: a.ini, fin: a.ini + (c.fin - c.ini) };
      return {
        ...e,
        compromisos: e.compromisos.map((x) =>
          x.id === c.id ? { ...x, ...despues, cambios: [...x.cambios, { antes: { ini: x.ini, fin: x.fin }, despues, cuando: e.ahora }] } : x,
        ),
        bitacora: anotar(e, `Cambiaste el horario de «${accion(c.accionId)!.titulo}»: de ${tramoMedio(c.ini, c.fin)} a ${tramoMedio(despues.ini, despues.fin)}.`),
      };
    }
    case "SIMULAR": {
      if (e.pasos.length >= MAXIMO_DE_PASOS) return e;
      const { mundo } = mundoDelEscenario(e);
      if (porQueNoSeSimula(mundo, a.id) !== null) return e;
      return { ...e, pasos: [...e.pasos, a.id] };
    }
    case "DESHACER_PASO":
      return e.pasos.length === 0 ? e : { ...e, pasos: e.pasos.slice(0, -1) };
    case "REINICIAR_ESCENARIO":
      return e.pasos.length === 0 ? e : { ...e, pasos: [] };
    case "AJUSTAR_DISPONIBILIDAD": {
      const antes = e.ventanas.reduce((s, v) => s + v.fin - v.ini, 0);
      const despues = a.ventanas.reduce((s, v) => s + v.fin - v.ini, 0);
      return { ...e, ventanas: a.ventanas, bitacora: anotar(e, `Reajustaste la disponibilidad del laboratorio: ${despues >= antes ? "+" : "−"}${Math.abs(despues - antes)} min declarados.`) };
    }
    case "ADELANTAR_RELOJ": {
      const ahora = instante(a.fecha, a.hora);
      if (ahora <= e.ahora) return e;
      const devueltas: Record<string, string> = { ...e.devueltas };
      const compromisos = e.compromisos.map((c): CompromisoVivo => {
        if (c.estado !== "CONFIRMADO" || c.ini >= ahora) return c;
        if (a.focus && a.focus.accionId === c.accionId && c.fin > ahora) return { ...c, estado: "EN_CURSO", focusDesde: instante(a.fecha, a.focus.desde) };
        devueltas[c.accionId] = `Retoma el compromiso incumplido del ${nombreDelDia(fechaDe(c.ini))} ${horaDe(c.ini)}.`;
        return { ...c, estado: "INCUMPLIDO" };
      });
      const ubicaciones: Record<string, EstadoLab["ubicaciones"][string]> = {};
      for (const [id, u] of Object.entries(e.ubicaciones)) {
        if (u.ini >= ahora) ubicaciones[id] = u;
        else devueltas[id] = "Su horario pasó sin compromiso: volvió a Acciones por ubicar.";
      }
      const incumplidos = compromisos.filter((c, i) => c.estado === "INCUMPLIDO" && e.compromisos[i].estado !== "INCUMPLIDO").length;
      return {
        ...e,
        ahora,
        relojAdelantado: true,
        compromisos,
        ubicaciones,
        devueltas,
        pasos: [],
        bitacora: [
          ...e.bitacora,
          {
            id: `BIT-${e.bitacora.length + 1}`,
            cuando: ahora,
            texto: `El reloj pasó a ${nombreDelDia(a.fecha)} ${a.hora}. ${incumplidos === 1 ? "Un compromiso quedó incumplido" : `${incumplidos} compromisos quedaron incumplidos`}; ninguno se movió.`,
          },
        ],
      };
    }
    case "REORGANIZAR": {
      const pos = posiciones(m);
      const ubicaciones = { ...e.ubicaciones };
      let n = 0;
      for (const [id, p] of Object.entries(pos)) {
        if (p.tipo !== "SUGERIDA") continue;
        ubicaciones[id] = { ini: p.ini, duracion: p.fin - p.ini };
        n++;
      }
      if (n === 0) return e;
      return { ...e, ubicaciones, bitacora: anotar(e, `Reorganizaste sin cortar: ${n} acciones quedaron ubicadas como propuestas. Ningún compromiso se movió.`) };
    }
  }
}

export const aplicarTodas = (acciones: readonly AccionDelLab[]) => acciones.reduce(reducir, estadoInicial());

// ── Estados demostrativos ─────────────────────────────────────────────────────────

export type Modo = "LIMPIO" | "EXPLICAR";

export type Intento =
  | { tipo: "UBICAR"; id: string; ini: number; duracion: number }
  | { tipo: "MOVER"; compromisoId: string; ini: number };

export interface EstadoDemostrativo {
  descripcion: string;
  acciones: readonly AccionDelLab[];
  plano: Plano;
  modo: Modo;
  seleccion: string | null;
  intento: Intento | null;
  dialogo: "DISPONIBILIDAD" | "REORGANIZAR" | null;
}

const MAR = "2026-09-15";
const MIE = "2026-09-16";
const JUE = "2026-09-17";
const VIE = "2026-09-18";

const base: EstadoDemostrativo = { descripcion: "El plan real, sin nada seleccionado.", acciones: [], plano: "REAL", modo: "LIMPIO", seleccion: null, intento: null, dialogo: null };
const reloj: AccionDelLab[] = [
  { tipo: "UBICAR", id: ID.NORMALIZAR, ini: instante(JUE, "19:00"), duracion: 90 },
  { tipo: "COMPROMETER", id: ID.NORMALIZAR },
  { tipo: "ADELANTAR_RELOJ", fecha: AHORA_ADELANTADO.fecha, hora: AHORA_ADELANTADO.hora, focus: { accionId: ID.NORMALIZAR, desde: "19:03" } },
];

export const ESTADOS_DEMOSTRATIVOS: Readonly<Record<string, EstadoDemostrativo>> = {
  base,
  ubicacion: { ...base, descripcion: "Límites seleccionada, con su ubicación sugerida.", seleccion: ID.LIMITES },
  prioridad: {
    ...base,
    descripcion: "Economía soltada el martes 19:00: Límites pierde su último bloque antes de la clase de Derivadas.",
    seleccion: ID.ECONOMIA_U2,
    intento: { tipo: "UBICAR", id: ID.ECONOMIA_U2, ini: instante(MAR, "19:00"), duracion: 40 },
  },
  conflicto: {
    ...base,
    descripcion: "Límites soltada encima de la clase de Análisis del miércoles.",
    seleccion: ID.LIMITES,
    intento: { tipo: "UBICAR", id: ID.LIMITES, ini: instante(MIE, "14:00"), duracion: 60 },
  },
  compromiso: {
    ...base,
    descripcion: "Límites ubicada y comprometida el martes 19:00.",
    acciones: [
      { tipo: "UBICAR", id: ID.LIMITES, ini: instante(MAR, "19:00"), duracion: 60 },
      { tipo: "COMPROMETER", id: ID.LIMITES },
    ],
    seleccion: `COM-LOCAL-${ID.LIMITES}`,
  },
  renegociacion: {
    ...base,
    descripcion: "El compromiso de Arquitectura arrastrado al viernes 14:00: pide confirmación.",
    seleccion: ID.COMPROMISO_U4,
    intento: { tipo: "MOVER", compromisoId: ID.COMPROMISO_U4, ini: instante(VIE, "14:00") },
  },
  simulacion: {
    ...base,
    descripcion: "Límites simulada: el refuerzo se retira y Derivadas se adelanta.",
    acciones: [{ tipo: "SIMULAR", id: ID.LIMITES }],
    plano: "ESCENARIO",
    modo: "EXPLICAR",
    seleccion: ID.LIMITES,
  },
  "simulacion-multiple": {
    ...base,
    descripcion: "Límites → Teoría de Derivadas → Práctica de Derivadas, acumulados.",
    acciones: [
      { tipo: "SIMULAR", id: ID.LIMITES },
      { tipo: "SIMULAR", id: ID.TEORIA_DERIVADAS },
      { tipo: "SIMULAR", id: ID.PRACTICA_DERIVADAS },
    ],
    plano: "ESCENARIO",
    seleccion: ID.PRACTICA_DERIVADAS,
  },
  disponibilidad: { ...base, descripcion: "Reajustar disponibilidad con cinco horas más en vista previa.", dialogo: "DISPONIBILIDAD" },
  reloj: { ...base, descripcion: "Jueves 19:10: el compromiso de las 15:00 quedó incumplido y hay una sesión de Focus en curso.", acciones: reloj, seleccion: ID.COMPROMISO_U4 },
  rescate: { ...base, descripcion: "Jueves 19:10 con Reorganizar sin cortar abierto.", acciones: reloj, dialogo: "REORGANIZAR" },
};

export const ESCENARIOS_DE_URL = Object.keys(ESTADOS_DEMOSTRATIVOS);

/** Para los tests: las acciones del fixture siguen existiendo. */
export const IDS_DE_ACCIONES = ACCIONES.map((a) => a.id);
