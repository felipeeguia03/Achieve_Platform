/**
 * 🧪 LABORATORIO DESCARTABLE V3 — cómo se nombra cada cosa en pantalla.
 *
 * Un solo lugar para que el calendario, la bandeja y el inspector digan lo mismo.
 */

import {
  CalendarCheck,
  Check,
  CheckCheck,
  CircleDashed,
  CircleSlash,
  FlaskConical,
  Flag,
  Hourglass,
  Lock,
  Move,
  RotateCcw,
  Timer,
  type LucideIcon,
} from "lucide-react";

import { NOMBRE_DE_PRIORIDAD, ORDEN_DE_PRIORIDAD } from "./fixture";
import { deArticulo, diaCorto, horaDe, instante } from "./formato";
import { evaluacion, inicioDeEvaluacion } from "./motor";
import type { Accion, CalendarProjectionItem, Prioridad } from "./tipos";

export function etiquetaDeItem(it: CalendarProjectionItem): { texto: string; Icono: LucideIcon } {
  switch (it.tipo) {
    case "CLASE":
      return { texto: it.estado === "CURSADA" ? "Clase cursada · fija" : "Clase · fija", Icono: Lock };
    case "EVALUACION":
      return { texto: "Evaluación · fija", Icono: Flag };
    case "PROPUESTA":
      return it.ubicacion === "ELEGIDA" ? { texto: "Propuesta ubicada", Icono: Move } : { texto: it.hipotetico ? "Sugerida en el escenario" : "Ubicación sugerida", Icono: CircleDashed };
    case "COMPROMISO":
      return it.estado === "INCUMPLIDO" ? { texto: "Compromiso incumplido", Icono: CircleSlash } : { texto: "Compromiso", Icono: CalendarCheck };
    case "FOCUS":
      return { texto: "Focus en curso", Icono: Timer };
    case "EVIDENCIA":
      return it.estado === "ENVIADA" ? { texto: "Evidencia enviada", Icono: Hourglass } : { texto: "Evidencia insuficiente", Icono: RotateCcw };
    case "COMPLETADA":
      if (it.estado === "SIMULADA") return { texto: `Simulado · paso ${it.origen.kind === "SIMULACION" ? it.origen.paso : ""}`, Icono: FlaskConical };
      return it.estado === "VALIDADA" ? { texto: "Evidencia validada", Icono: CheckCheck } : { texto: "Completada", Icono: Check };
  }
}

/** Qué entidad abre el inspector al tocar un bloque. */
export function idDeSeleccion(it: CalendarProjectionItem): string {
  switch (it.origen.kind) {
    case "SIMULACION":
      return it.origen.accionId;
    default:
      return it.origen.id;
  }
}

export const textoDeMovilidad = (it: CalendarProjectionItem): string =>
  ({
    INAMOVIBLE: "No se mueve.",
    MOVIBLE: "Se puede mover.",
    RENEGOCIACION: "Cambia de horario sólo con renegociación.",
    HISTORICO: "Ya ocurrió o es hipotético: no se mueve.",
  })[it.movilidad];

export const prioridadEnFrase = (p: Prioridad) => `prioridad ${NOMBRE_DE_PRIORIDAD[p].toLowerCase()}`;
export const barrasDePrioridad = (p: Prioridad) => ORDEN_DE_PRIORIDAD.length - ORDEN_DE_PRIORIDAD.indexOf(p);

/** La fecha que importa para una acción, en una línea. */
export function relacionDeFecha(a: Accion): string | null {
  if (a.antesDe) {
    const e = evaluacion(a.antesDe)!;
    const ini = inicioDeEvaluacion(a.antesDe);
    return `Antes ${deArticulo(e.corto)} · ${diaCorto(e.tramo.fecha)}, ${horaDe(ini)}`;
  }
  if (a.convieneAntesDe) return `Conviene antes de ${a.convieneAntesDe.motivo} · ${diaCorto(a.convieneAntesDe.fecha)}, ${a.convieneAntesDe.hora}`;
  if (a.noAntesDe) return `Después de ${diaCorto(a.noAntesDe.fecha)}, ${a.noAntesDe.hora}`;
  return null;
}

export const instanteDeConveniencia = (a: Accion) => (a.convieneAntesDe ? instante(a.convieneAntesDe.fecha, a.convieneAntesDe.hora) : null);
