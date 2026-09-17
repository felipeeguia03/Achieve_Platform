/**
 * 🧪 **LABORATORIO DESCARTABLE V3 — una sola proyección.**
 *
 * El calendario, la bandeja, el encabezado, el inspector y el Gantt leen **el mismo
 * objeto**: `proyectar(estado, plano)`. Nada escribe cifras por su cuenta.
 *
 * - **Plan real**: el estado local tal como está. `hechas` vacío.
 * - **Escenario**: cada paso de la pila se simula sobre el mundo que dejó el paso
 *   anterior (`simularPaso`), nunca sobre el plan real original.
 */

import { ACCIONES, CLASES, EVALUACIONES, REGISTROS, TEMAS, instanteDe, ORDEN_DE_MATERIAS } from "./fixture";
import { FIN_DE_SEMANA } from "./formato";
import {
  accion,
  accionesPendientes,
  bandeja,
  evaluacionesDeLaSemana,
  hecha,
  margenAntesDe,
  mundoDe,
  porQueNoSeSimula,
  posiciones,
  retirada,
  simularPaso,
  totales,
  type Mundo,
} from "./motor";
import type {
  CalendarProjectionItem,
  EstadoLab,
  GanttMateria,
  GanttTema,
  MateriaId,
  PasoProyectado,
  PiezaDelTema,
  Posicion,
  Proyeccion,
} from "./tipos";

export type Plano = "REAL" | "ESCENARIO";

/** El mundo después de simular los primeros `n` pasos de la pila. */
export function mundoDelEscenario(estado: EstadoLab, n = estado.pasos.length): { mundo: Mundo; pasos: PasoProyectado[] } {
  let mundo = mundoDe(estado);
  const pasos: PasoProyectado[] = [];
  estado.pasos.slice(0, n).forEach((id, i) => {
    const bloqueo = porQueNoSeSimula(mundo, id);
    if (bloqueo) {
      pasos.push({ numero: i + 1, accionId: id, ini: null, fin: null, bloqueo });
      return;
    }
    mundo = simularPaso(mundo, id);
    const s = mundo.simuladas[mundo.simuladas.length - 1];
    pasos.push({ numero: i + 1, accionId: id, ini: s.ini, fin: s.fin, bloqueo: null });
  });
  return { mundo, pasos };
}

const enSemana = (ini: number) => ini >= 0 && ini < FIN_DE_SEMANA;

function items(m: Mundo, pos: Readonly<Record<string, Posicion>>, hipotetico: boolean): CalendarProjectionItem[] {
  const out: CalendarProjectionItem[] = [];
  for (const c of CLASES) {
    const { ini, fin } = instanteDe(c.tramo);
    out.push({ tipo: "CLASE", clave: c.id, ini, fin, materia: c.materia, titulo: c.titulo, hipotetico: false, origen: { kind: "CLASE", id: c.id }, estado: fin <= m.ahora ? "CURSADA" : "PROXIMA", movilidad: "INAMOVIBLE" });
  }
  for (const e of EVALUACIONES) {
    const { ini, fin } = instanteDe(e.tramo);
    if (!enSemana(ini)) continue;
    out.push({ tipo: "EVALUACION", clave: e.id, ini, fin, materia: e.materia, titulo: e.titulo, hipotetico: false, origen: { kind: "EVALUACION", id: e.id }, movilidad: "INAMOVIBLE" });
  }
  for (const r of REGISTROS) {
    const { ini, fin } = instanteDe(r.tramo);
    if (!enSemana(ini)) continue;
    const base = { clave: r.id, ini, fin, materia: r.materia, titulo: r.titulo, hipotetico: false, movilidad: "HISTORICO" as const };
    if (r.estado === "EVIDENCIA_ENVIADA" || r.evidencia.revision === "INSUFICIENTE")
      out.push({ ...base, tipo: "EVIDENCIA", origen: { kind: "REGISTRO", id: r.id }, estado: r.evidencia.revision === "INSUFICIENTE" ? "INSUFICIENTE" : "ENVIADA" });
    else out.push({ ...base, tipo: "COMPLETADA", origen: { kind: "REGISTRO", id: r.id }, estado: r.estado === "EVIDENCIA_VALIDADA" ? "VALIDADA" : "COMPLETADA" });
  }
  for (const c of m.compromisos) {
    const a = accion(c.accionId)!;
    const base = { clave: c.id, ini: c.ini, fin: c.fin, materia: a.materia, titulo: a.titulo, hipotetico: false };
    if (c.estado === "EN_CURSO") out.push({ ...base, tipo: "FOCUS", origen: { kind: "COMPROMISO", id: c.id, accionId: c.accionId }, movilidad: "INAMOVIBLE" });
    else out.push({ ...base, tipo: "COMPROMISO", origen: { kind: "COMPROMISO", id: c.id, accionId: c.accionId }, estado: c.estado, movilidad: c.estado === "INCUMPLIDO" ? "HISTORICO" : "RENEGOCIACION" });
  }
  for (const [id, p] of Object.entries(pos)) {
    if (p.tipo !== "UBICADA" && p.tipo !== "SUGERIDA") continue;
    const a = accion(id)!;
    out.push({
      tipo: "PROPUESTA",
      clave: `${id}${p.tipo === "SUGERIDA" ? "#sugerida" : ""}`,
      ini: p.ini,
      fin: p.fin,
      materia: a.materia,
      titulo: a.titulo,
      hipotetico: hipotetico && p.tipo === "SUGERIDA",
      origen: { kind: "ACCION", id },
      ubicacion: p.tipo === "UBICADA" ? "ELEGIDA" : "SUGERIDA",
      movilidad: "MOVIBLE",
    });
  }
  for (const s of m.simuladas) {
    const a = accion(s.accionId)!;
    out.push({ tipo: "COMPLETADA", clave: `SIM-${s.accionId}`, ini: s.ini, fin: s.fin, materia: a.materia, titulo: a.titulo, hipotetico: true, origen: { kind: "SIMULACION", accionId: s.accionId, paso: s.paso }, estado: "SIMULADA", movilidad: "HISTORICO" });
  }
  return out.filter((x) => enSemana(x.ini)).sort((a, b) => a.ini - b.ini);
}

function etiquetaDe(piezas: readonly PiezaDelTema[]): string {
  const n = piezas.length;
  const c = piezas.filter((p) => p.estado === "CONSTATADA").length;
  const s = piezas.filter((p) => p.estado === "SIMULADA").length;
  const e = piezas.filter((p) => p.estado === "ENVIADA").length;
  if (n === 0) return "Sin actividades cargadas";
  if (s > 0) return `Simulado · ${c + s} de ${n}`;
  if (c === n) return `Evidencia suficiente · ${c} de ${n}`;
  if (c > 0) return `Recorrido registrado · ${c} de ${n}`;
  if (e > 0) return "Evidencia enviada · sin revisar";
  return "Sin registro";
}

function ganttDe(m: Mundo, pos: Readonly<Record<string, Posicion>>, materia: MateriaId): GanttMateria {
  const temas: GanttTema[] = TEMAS.filter((t) => t.materia === materia).map((tema) => {
    const ev = tema.evaluacionId ? EVALUACIONES.find((e) => e.id === tema.evaluacionId)! : null;
    const ventanaIni = tema.primeraClase ? instanteDe(tema.primeraClase).ini : null;
    const ventanaFin = ev ? instanteDe(ev.tramo).ini : null;
    const nota =
      ventanaFin === null
        ? ventanaIni === null
          ? "Todavía no se dictó y no tiene evaluación con fecha: no se ubica."
          : "Sin evaluación que lo cubra: no se ubica."
        : ventanaIni === null
          ? "Todavía no se dictó: la barra arranca en el borde del eje."
          : null;

    const clases = [
      ...(tema.primeraClase ? [{ ini: instanteDe(tema.primeraClase).ini, dada: true }] : []),
      ...CLASES.filter((c) => c.temas.includes(tema.id))
        .map((c) => ({ ini: instanteDe(c.tramo).ini, dada: instanteDe(c.tramo).fin <= m.ahora }))
        .filter((c) => !tema.primeraClase || c.ini !== instanteDe(tema.primeraClase).ini),
    ];

    const piezas: PiezaDelTema[] = [
      ...REGISTROS.filter((r) => r.tema === tema.id && r.pieza).map((r) => ({ id: r.id, estado: r.progreso ? ("CONSTATADA" as const) : ("ENVIADA" as const) })),
      ...ACCIONES.filter((a) => a.tema === tema.id && a.recorrido && !retirada(m, a)).map((a) => ({ id: a.id, estado: hecha(m, a.id) ? ("SIMULADA" as const) : ("PENDIENTE" as const) })),
    ];

    const faltan = accionesPendientes(m).filter((a) => a.tema === tema.id);
    const lugares = faltan.map((a) => pos[a.id]);
    const sinLugar = lugares.some((p) => !p || p.tipo === "SIN_LUGAR");
    const conHorario = lugares.filter((p): p is Exclude<Posicion, { tipo: "SIN_LUGAR" }> => !!p && p.tipo !== "SIN_LUGAR");
    const trabajo = !sinLugar && conHorario.length > 0 ? { ini: Math.min(...conHorario.map((p) => p.ini)), fin: Math.max(...conHorario.map((p) => p.fin)) } : null;

    const hechas = [
      ...REGISTROS.filter((r) => r.tema === tema.id && r.progreso).map((r) => instanteDe(r.tramo).fin),
      ...m.simuladas.filter((s) => accion(s.accionId)!.tema === tema.id).map((s) => s.fin),
    ];

    const conPrerrequisito = ACCIONES.filter((a) => a.tema === tema.id && a.requiere.length > 0 && !retirada(m, a));
    const espera = conPrerrequisito.find((a) => !hecha(m, a.id) && a.requiere.some((r) => !hecha(m, r)));
    const liberada = conPrerrequisito.find((a) => a.requiere.every((r) => hecha(m, r)));
    const dependencia = espera
      ? { estado: "ESPERA" as const, de: espera.requiere.filter((r) => !hecha(m, r)).map((r) => accion(r)!.corto).join(" y ") }
      : liberada
        ? { estado: "DESBLOQUEADA" as const, de: liberada.requiere.map((r) => accion(r)!.corto).join(" y ") }
        : null;

    return {
      id: tema.id,
      codigo: tema.codigo,
      nombre: tema.nombre,
      ventanaIni,
      ventanaFin,
      nota,
      clases,
      piezas,
      trabajo,
      sinLugar,
      ultimaHecha: hechas.length ? Math.max(...hechas) : null,
      dependencia,
      etiqueta: etiquetaDe(piezas),
    };
  });
  return {
    materia,
    temas,
    evaluaciones: EVALUACIONES.filter((e) => e.materia === materia).map((e) => ({ id: e.id, ini: instanteDe(e.tramo).ini, corto: e.corto })),
  };
}

/**
 * El mundo que mira el Gantt: el mismo, **sin las decisiones de agenda tomadas en el
 * laboratorio**. Sin propuestas ubicadas ni compromisos creados acá, y con los que ya
 * existían en su promesa original, lo pendiente queda donde lo propone el motor. Por
 * eso ubicar, comprometerse o cambiar un horario **no mueve el Gantt**; lo mueven lo
 * simulado (que ocupa su horario y constata), lo retirado, el progreso y el reloj.
 */
export const mundoDelGantt = (m: Mundo): Mundo => ({
  ...m,
  ubicaciones: {},
  compromisos: m.compromisos
    .filter((c) => c.estado !== "CONFIRMADO" || c.origen === "FIXTURE")
    .map((c) => (c.estado === "CONFIRMADO" ? { ...c, ini: c.promesaOriginal.ini, fin: c.promesaOriginal.fin } : c)),
});

export function proyectarMundo(m: Mundo, plano: Plano, pasos: readonly PasoProyectado[]): Proyeccion {
  const pos = posiciones(m);
  const mg = mundoDelGantt(m);
  const posDelGantt = posiciones(mg);
  const gantt = Object.fromEntries(ORDEN_DE_MATERIAS.map((id) => [id, ganttDe(mg, posDelGantt, id)])) as Record<MateriaId, GanttMateria>;
  return {
    plano,
    ahora: m.ahora,
    items: items(m, pos, plano === "ESCENARIO"),
    posiciones: pos,
    pendientes: bandeja(m).map((a) => a.id),
    retiradas: ACCIONES.filter((a) => retirada(m, a)).map((a) => a.id),
    simuladas: [...m.hechas],
    pasos,
    totales: totales(m),
    margenes: evaluacionesDeLaSemana(m).map((e) => ({ evaluacionId: e.id, minutos: margenAntesDe(m, e.id) })),
    gantt,
  };
}

export function proyectar(estado: EstadoLab, plano: Plano): Proyeccion {
  if (plano === "REAL") return proyectarMundo(mundoDe(estado), "REAL", []);
  const { mundo, pasos } = mundoDelEscenario(estado);
  return proyectarMundo(mundo, "ESCENARIO", pasos);
}

/** El escenario un paso atrás: con qué se compara lo que cambió. `null` sin pasos. */
export function proyectarAnterior(estado: EstadoLab): Proyeccion | null {
  if (estado.pasos.length === 0) return null;
  const { mundo, pasos } = mundoDelEscenario(estado, estado.pasos.length - 1);
  return proyectarMundo(mundo, estado.pasos.length === 1 ? "REAL" : "ESCENARIO", pasos);
}
