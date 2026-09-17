"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE — lo que comparten las tres vistas.
 *
 * Plan semanal, camino, Gantt, Calendario e inspector leen **la misma proyección**
 * (`mostrada`) de acá. Ninguno arma su propia copia de los datos.
 */

import { createContext, useContext } from "react";

import type { Accion, EstadoDelLab, Modo, Plano, Vista } from "./escenario";
import type { Escenario, Proyeccion } from "./tipos";

/**
 * Un lugar elegido en *Reubicar* o *Cambiar horario*, antes de confirmar. Es lo
 * único que se previsualiza: **pasar el mouse no simula ni previsualiza nada**.
 */
export interface VistaPrevia {
  accion: Accion;
}

export interface LabContexto {
  estado: EstadoDelLab;
  escenario: Escenario;
  /** El escenario de lo que se dibuja: vacío en el plan real, con la vista previa aplicada si la hay. */
  escenarioMostrado: Escenario;
  real: Proyeccion;
  proyeccionDelEscenario: Proyeccion;
  /** Lo que se dibuja ahora mismo: real, escenario o vista previa. */
  mostrada: Proyeccion;
  /**
   * Lo mismo **sin la vista previa**. Lo leen el inspector, el camino y la franja
   * de acción, para que elegir un lugar en *Reubicar* no los reacomode mientras
   * se elige.
   */
  estable: Proyeccion;
  /** Contra qué se dibujan las huellas. `null` = sin huellas. */
  referencia: Proyeccion | null;
  plano: Plano;
  modo: Modo;
  vista: Vista;
  seleccion: string | null;
  vistaPrevia: VistaPrevia | null;
  movimientoReducido: boolean;
  /** Si ya hubo interacción: al cargar nada se mueve. */
  animar: boolean;
  seleccionar: (id: string | null) => void;
  previsualizarAccion: (accion: Accion | null) => void;
  pedirSimular: (id: string) => void;
  despachar: (accion: Accion) => void;
  cambiarPlano: (p: Plano) => void;
  cambiarModo: (m: Modo) => void;
  cambiarVista: (v: Vista) => void;
  avisar: (texto: string) => void;
  /** Abre *Cambiar horario* o *Reubicar* en el inspector. */
  abrirReubicacion: (id: string, forma: "REUBICAR" | "ELEGIR" | "RENEGOCIAR") => void;
  reubicacion: { id: string; forma: "REUBICAR" | "ELEGIR" | "RENEGOCIAR" } | null;
  cerrarReubicacion: () => void;
  pedirQuitarVentana: (id: string) => void;
}

export const Contexto = createContext<LabContexto | null>(null);

export function useLab(): LabContexto {
  const c = useContext(Contexto);
  if (!c) throw new Error("useLab fuera del laboratorio");
  return c;
}
