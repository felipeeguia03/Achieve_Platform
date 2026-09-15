/**
 * 🧪 LABORATORIO DESCARTABLE V3 — qué cambió entre un paso del escenario y el anterior.
 *
 * Las frases salen de **comparar dos proyecciones**, no de un guion: si el motor no
 * mueve nada, no hay frase de movimiento.
 */

import { EVALUACIONES, TEMAS } from "./fixture";
import { deArticulo, enHoras, nombreDelDia, fechaDe, horaDe, tramoMedio } from "./formato";
import { accion } from "./motor";
import type { Proyeccion } from "./tipos";

export type TipoDeLinea = "SIMULADA" | "ANTES" | "LIBERA" | "ADELANTA" | "MARGEN" | "GANTT";
export interface Linea {
  tipo: TipoDeLinea;
  texto: string;
}

export interface Movido {
  accionId: string;
  antes: { ini: number; fin: number };
  despues: { ini: number; fin: number };
}

const conHorario = (p: Proyeccion["posiciones"][string] | undefined) => (p && p.tipo !== "SIN_LUGAR" ? p : null);

export function movidos(anterior: Proyeccion, actual: Proyeccion): Movido[] {
  const out: Movido[] = [];
  for (const [id, p] of Object.entries(actual.posiciones)) {
    const a = conHorario(anterior.posiciones[id]);
    const d = conHorario(p);
    if (a && d && a.ini !== d.ini) out.push({ accionId: id, antes: { ini: a.ini, fin: a.fin }, despues: { ini: d.ini, fin: d.fin } });
  }
  return out;
}

export function liberados(anterior: Proyeccion, actual: Proyeccion) {
  return actual.retiradas
    .filter((id) => !anterior.retiradas.includes(id))
    .map((id) => ({ accionId: id, lugar: conHorario(anterior.posiciones[id]) }));
}

const nombreDeEvaluacion = (id: string) => EVALUACIONES.find((e) => e.id === id)!.corto;

export function explicarPaso(anterior: Proyeccion, actual: Proyeccion, accionId: string): Linea[] {
  const a = accion(accionId)!;
  const lineas: Linea[] = [];
  const paso = actual.pasos.find((p) => p.accionId === accionId);
  if (paso?.ini != null && paso.fin != null) lineas.push({ tipo: "SIMULADA", texto: `${a.corto} queda simulada el ${tramoMedio(paso.ini, paso.fin)}, con evidencia suficiente y progreso registrado.` });

  const mov = movidos(anterior, actual);
  const adelantados = mov.filter((m) => m.despues.ini < m.antes.ini);
  const corridos = mov.filter((m) => m.despues.ini > m.antes.ini);
  const lista = (xs: readonly Movido[], cuando: "antes" | "despues") =>
    xs.map((m) => `${accion(m.accionId)!.corto} (${nombreDelDia(fechaDe(m[cuando].ini))} ${horaDe(m[cuando].ini)})`).join(", ");
  if (mov.length > 0) lineas.push({ tipo: "ANTES", texto: `Antes estaba acá: ${lista(mov, "antes")}.` });
  const lib = liberados(anterior, actual);
  if (lib.length > 0)
    lineas.push({
      tipo: "LIBERA",
      texto: `Este espacio se libera: ${lib.map((l) => `${accion(l.accionId)!.titulo}${l.lugar ? ` (${tramoMedio(l.lugar.ini, l.lugar.fin)})` : ""}`).join(", ")} ya no hace falta.`,
    });
  if (adelantados.length > 0) lineas.push({ tipo: "ADELANTA", texto: `${adelantados.length === 1 ? `${accion(adelantados[0].accionId)!.corto} puede adelantarse` : "Pueden adelantarse"}: ${lista(adelantados, "despues")}.` });
  if (corridos.length > 0) lineas.push({ tipo: "ADELANTA", texto: `Se corren: ${lista(corridos, "despues")}.` });

  const cambiosDeMargen = actual.margenes
    .map((x) => ({ x, antes: anterior.margenes.find((y) => y.evaluacionId === x.evaluacionId)?.minutos ?? null }))
    .filter(({ x, antes }) => antes !== null && antes !== x.minutos);
  if (cambiosDeMargen.length === 0) lineas.push({ tipo: "MARGEN", texto: "El margen antes de las evaluaciones de la semana no cambia." });
  for (const { x, antes } of cambiosDeMargen)
    lineas.push({ tipo: "MARGEN", texto: `${x.minutos > antes! ? "Queda este nuevo margen" : "Se achica el margen"} antes ${deArticulo(nombreDeEvaluacion(x.evaluacionId))}: ${enHoras(antes!)} → ${enHoras(x.minutos)}.` });

  const tema = TEMAS.find((t) => t.id === a.tema)!;
  const filaAntes = anterior.gantt[a.materia].temas.find((t) => t.id === tema.id)!;
  const filaDespues = actual.gantt[a.materia].temas.find((t) => t.id === tema.id)!;
  lineas.push(
    a.recorrido
      ? { tipo: "GANTT", texto: `El Gantt académico avanza hasta este punto: ${tema.nombre}, de «${filaAntes.etiqueta}» a «${filaDespues.etiqueta}». Dominio todavía no evaluado.` }
      : { tipo: "GANTT", texto: `El Gantt académico no suma recorrido: ${a.explicacionRecorrido}` },
  );
  return lineas;
}

/** Modo limpio: una sola frase. */
export function resumirPaso(anterior: Proyeccion, actual: Proyeccion, accionId: string): string {
  const a = accion(accionId)!;
  const partes = [`${a.corto}, simulada.`];
  const mov = movidos(anterior, actual).filter((m) => m.despues.ini < m.antes.ini);
  if (mov[0]) partes.push(`${accion(mov[0].accionId)!.corto} se adelanta al ${nombreDelDia(fechaDe(mov[0].despues.ini))} ${horaDe(mov[0].despues.ini)}.`);
  const lib = liberados(anterior, actual);
  if (lib[0]) partes.push(`${accion(lib[0].accionId)!.corto} ya no hace falta.`);
  const parcial = actual.margenes.find((x) => x.evaluacionId === a.antesDe) ?? actual.margenes[actual.margenes.length - 1];
  if (parcial) partes.push(`Margen antes ${deArticulo(nombreDeEvaluacion(parcial.evaluacionId))}: ${enHoras(parcial.minutos)}.`);
  return partes.join(" ");
}
