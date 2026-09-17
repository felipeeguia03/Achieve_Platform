"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE V3 — lo que comparten las piezas de la pantalla.
 *
 * Una sola proyección mostrada (`mostrada`): el calendario, la bandeja, el
 * encabezado, el inspector y el Gantt leen ésa.
 */

import { createContext, useContext } from "react";

import type { Intento, Modo } from "./estado";
import type { Plano } from "./proyeccion";
import type { Advertencia, Conflicto, EstadoLab, Proyeccion } from "./tipos";

export type Dialogo =
  | { tipo: "CONFLICTO"; intento: Intento; motivos: readonly Conflicto[]; alternativas: readonly number[] }
  | { tipo: "ADVERTENCIA"; intento: Extract<Intento, { tipo: "UBICAR" }>; advertencias: readonly Advertencia[] }
  | { tipo: "ELEGIR"; accionId: string | null; compromisoId: string | null }
  | { tipo: "COMPROMETER"; accionId: string }
  | { tipo: "RENEGOCIAR"; compromisoId: string; ini: number; advertencias: readonly Advertencia[] }
  | { tipo: "PRERREQUISITO"; accionId: string; faltan: readonly string[] }
  | { tipo: "DISPONIBILIDAD"; conCincoHoras: boolean }
  | { tipo: "REORGANIZAR" }
  | { tipo: "AVISO"; titulo: string; texto: string };

export interface Arrastre {
  tipo: "ACCION" | "COMPROMISO";
  id: string;
  /** Minutos entre el borde superior del bloque y el puntero. */
  desplazamiento: number;
  duracion: number;
}

export interface VistaPrevia {
  clave: string;
  accionId: string;
  ini: number;
  fin: number;
  valida: boolean;
  texto: string;
}

export interface LabContexto {
  estado: EstadoLab;
  real: Proyeccion;
  mostrada: Proyeccion;
  anterior: Proyeccion | null;
  plano: Plano;
  modo: Modo;
  seleccion: string | null;
  esMovil: boolean;
  diaMovil: string;
  vistaPrevia: VistaPrevia | null;
  arrastre: Arrastre | null;
  movimientoReducido: boolean;
  seleccionar: (id: string | null) => void;
  cambiarDiaMovil: (fecha: string) => void;
  intentar: (intento: Intento) => void;
  aceptarSugerida: (accionId: string) => void;
  abrir: (d: Dialogo) => void;
  devolver: (accionId: string) => void;
  pedirSimular: (accionId: string) => void;
  empezarArrastre: (a: Arrastre | null) => void;
  previsualizarArrastre: (ini: number | null) => void;
}

export const Contexto = createContext<LabContexto | null>(null);

export function useLab(): LabContexto {
  const c = useContext(Contexto);
  if (!c) throw new Error("useLab fuera del laboratorio V3");
  return c;
}
