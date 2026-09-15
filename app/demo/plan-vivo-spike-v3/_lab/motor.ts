/**
 * 🧪 **LABORATORIO DESCARTABLE V3 — el Plan Engine del laboratorio.**
 *
 * ⚠️ **No es el motor del producto ni una propuesta de motor.** Es lo mínimo para que
 * el calendario sea coherente: determinista, codicioso y sin partir bloques.
 * Lo sigue decidiendo [ADR-109](../../../../docs/decisions.md#adr-109), `PENDING`.
 *
 * Qué hace, y nada más:
 *
 * - **Capacidad**: la disponibilidad futura de la semana, sin clases ni evaluaciones.
 * - **Sugerencias**: ubica lo que el estudiante no ubicó en el primer hueco donde
 *   entra completo, por prioridad, con los prerrequisitos antes.
 * - **Conflictos duros**: lo que no puede quedarse acá (clase, evaluación,
 *   compromiso, pasado, dependencia, fecha límite).
 * - **Advertencias blandas**: sólo cuando hay una **consecuencia material** — una
 *   acción más prioritaria pierde su último espacio, el margen baja del mínimo, el
 *   máximo no entra, queda fuera de la disponibilidad o falta el prerrequisito.
 *   **Nunca bloquean.**
 * - **Simulación**: supone la acción hecha en su horario, con evidencia suficiente
 *   y progreso registrado, y recalcula lo demás.
 */

import { ACCIONES, CLASES, EVALUACIONES, MARGEN_MINIMO, MATERIAS, MAXIMO_DE_PASOS, ORDEN_DE_PRIORIDAD, instanteDe } from "./fixture";
import { DIA, FIN_DE_SEMANA, deArticulo, HORA_FIN, HORA_INICIO, fechaDe, horaDe, instante, minutoDelDia, nombreDelDia, redondearArriba, tramoMedio } from "./formato";
import type {
  Accion,
  Advertencia,
  CompromisoVivo,
  Conflicto,
  EstadoLab,
  Evaluacion,
  Intervalo,
  MotivoSinSimular,
  Posicion,
  Totales,
  Ubicacion,
  Validacion,
  VentanaViva,
} from "./tipos";

// ── Intervalos ────────────────────────────────────────────────────────────────────

export const seSuperponen = (a: Intervalo, b: Intervalo) => a.ini < b.fin && b.ini < a.fin;
export const total = (xs: readonly Intervalo[]) => xs.reduce((s, x) => s + (x.fin - x.ini), 0);

export function unir(xs: readonly Intervalo[]): Intervalo[] {
  const orden = xs.filter((x) => x.fin > x.ini).map((x) => ({ ini: x.ini, fin: x.fin })).sort((a, b) => a.ini - b.ini);
  const out: Intervalo[] = [];
  for (const x of orden) {
    const u = out[out.length - 1];
    if (u && x.ini <= u.fin) u.fin = Math.max(u.fin, x.fin);
    else out.push(x);
  }
  return out;
}

export function intersectar(a: readonly Intervalo[], b: readonly Intervalo[]): Intervalo[] {
  const out: Intervalo[] = [];
  for (const x of unir(a))
    for (const y of unir(b)) {
      const ini = Math.max(x.ini, y.ini);
      const fin = Math.min(x.fin, y.fin);
      if (fin > ini) out.push({ ini, fin });
    }
  return unir(out);
}

export function restar(base: readonly Intervalo[], quitar: readonly Intervalo[]): Intervalo[] {
  let resto = unir(base);
  for (const q of unir(quitar)) {
    const siguiente: Intervalo[] = [];
    for (const r of resto) {
      if (!seSuperponen(r, q)) {
        siguiente.push(r);
        continue;
      }
      if (r.ini < q.ini) siguiente.push({ ini: r.ini, fin: q.ini });
      if (q.fin < r.fin) siguiente.push({ ini: q.fin, fin: r.fin });
    }
    resto = siguiente;
  }
  return resto;
}

// ── El mundo que el motor mira ───────────────────────────────────────────────────

export interface Simulada {
  accionId: string;
  ini: number;
  fin: number;
  paso: number;
}

/** El estado local más lo que el escenario supone hecho. El plan real tiene `hechas` vacío. */
export interface Mundo {
  ahora: number;
  ubicaciones: Readonly<Record<string, Ubicacion>>;
  compromisos: readonly CompromisoVivo[];
  ventanas: readonly VentanaViva[];
  hechas: readonly string[];
  simuladas: readonly Simulada[];
}

export const mundoDe = (e: EstadoLab): Mundo => ({
  ahora: e.ahora,
  ubicaciones: e.ubicaciones,
  compromisos: e.compromisos,
  ventanas: e.ventanas,
  hechas: [],
  simuladas: [],
});

const INDICE = new Map(ACCIONES.map((a, i) => [a.id, i]));
export const accion = (id: string): Accion | null => ACCIONES.find((a) => a.id === id) ?? null;
export const evaluacion = (id: string): Evaluacion | null => EVALUACIONES.find((e) => e.id === id) ?? null;
export const rangoDePrioridad = (a: Accion) => ORDEN_DE_PRIORIDAD.indexOf(a.prioridad);
const porPrioridad = (a: Accion, b: Accion) => rangoDePrioridad(a) - rangoDePrioridad(b) || INDICE.get(a.id)! - INDICE.get(b.id)!;

export const inicioDeEvaluacion = (id: string) => instanteDe(evaluacion(id)!.tramo).ini;

export const hecha = (m: Mundo, id: string) => m.hechas.includes(id);
export const retirada = (m: Mundo, a: Accion) => !!a.seRetiraSi && hecha(m, a.seRetiraSi.id);
export const compromisosVivos = (m: Mundo) => m.compromisos.filter((c) => c.estado !== "INCUMPLIDO");
export const compromisoDe = (m: Mundo, accionId: string) => compromisosVivos(m).find((c) => c.accionId === accionId) ?? null;

/** Todo lo que falta hacer, comprometido o no. */
export const accionesPendientes = (m: Mundo) => ACCIONES.filter((a) => !hecha(m, a.id) && !retirada(m, a));
/** Lo que falta y **no** está comprometido: la bandeja *Acciones por ubicar*, ubicado o no. */
export const bandeja = (m: Mundo) => accionesPendientes(m).filter((a) => !compromisoDe(m, a.id)).sort(porPrioridad);

export function ubicacionesVigentes(m: Mundo): { accionId: string; ini: number; fin: number }[] {
  const enBandeja = new Set(bandeja(m).map((a) => a.id));
  return Object.entries(m.ubicaciones)
    .filter(([id]) => enBandeja.has(id))
    .map(([accionId, u]) => ({ accionId, ini: u.ini, fin: u.ini + u.duracion }));
}

export type TipoDeOcupacion = "CLASE" | "EVALUACION" | "COMPROMISO" | "FOCUS" | "UBICADA" | "SIMULADA";
export interface Ocupacion extends Intervalo {
  tipo: TipoDeOcupacion;
  id: string;
  titulo: string;
}

export const FIJOS: readonly Ocupacion[] = [
  ...CLASES.map((c) => ({ ...instanteDe(c.tramo), tipo: "CLASE" as const, id: c.id, titulo: `la clase de ${MATERIAS[c.materia].nombre}` })),
  ...EVALUACIONES.map((e) => ({ ...instanteDe(e.tramo), tipo: "EVALUACION" as const, id: e.id, titulo: `${e.titulo} de ${MATERIAS[e.materia].nombre}` })),
];

export interface Exclusion {
  accionId?: string;
  compromisoId?: string;
}

/** Lo que ocupa el tiempo del estudiante: compromisos vivos, propuestas ubicadas y lo simulado. */
export function ocupacionesDelEstudiante(m: Mundo, ex: Exclusion = {}): Ocupacion[] {
  const titulo = (id: string) => accion(id)?.titulo ?? id;
  return [
    ...compromisosVivos(m)
      .filter((c) => c.id !== ex.compromisoId)
      .map((c) => ({ ini: c.ini, fin: c.fin, tipo: (c.estado === "EN_CURSO" ? "FOCUS" : "COMPROMISO") as TipoDeOcupacion, id: c.id, titulo: titulo(c.accionId) })),
    ...ubicacionesVigentes(m)
      .filter((u) => u.accionId !== ex.accionId)
      .map((u) => ({ ini: u.ini, fin: u.fin, tipo: "UBICADA" as const, id: u.accionId, titulo: titulo(u.accionId) })),
    ...m.simuladas.map((s) => ({ ini: s.ini, fin: s.fin, tipo: "SIMULADA" as const, id: s.accionId, titulo: titulo(s.accionId) })),
  ];
}

export const ocupaciones = (m: Mundo, ex: Exclusion = {}): Ocupacion[] => [...FIJOS, ...ocupacionesDelEstudiante(m, ex)];

/** La disponibilidad futura de la semana, sin clases ni evaluaciones encima. */
export const disponibilidadFutura = (m: Mundo, hasta = FIN_DE_SEMANA) =>
  restar(intersectar(unir(m.ventanas), [{ ini: m.ahora, fin: hasta }]), FIJOS);

export const huecosLibres = (m: Mundo, ex: Exclusion = {}) => restar(disponibilidadFutura(m), ocupacionesDelEstudiante(m, ex));

// ── Posiciones ────────────────────────────────────────────────────────────────────

export function posicionesFirmes(m: Mundo): Record<string, Posicion> {
  const pos: Record<string, Posicion> = {};
  for (const c of compromisosVivos(m)) if (!hecha(m, c.accionId)) pos[c.accionId] = { tipo: "COMPROMETIDA", ini: c.ini, fin: c.fin, compromisoId: c.id };
  for (const u of ubicacionesVigentes(m)) pos[u.accionId] = { tipo: "UBICADA", ini: u.ini, fin: u.fin };
  return pos;
}

const limiteDe = (a: Accion) => (a.antesDe ? inicioDeEvaluacion(a.antesDe) : Infinity);

/** Desde cuándo puede empezar. `null` ⇒ espera un prerrequisito que no tiene lugar. */
function desdeCuando(m: Mundo, a: Accion, pos: Readonly<Record<string, Posicion>>, soloFirmes: boolean): number | null {
  let desde = m.ahora;
  if (a.noAntesDe) desde = Math.max(desde, instante(a.noAntesDe.fecha, a.noAntesDe.hora));
  for (const r of a.requiere) {
    if (hecha(m, r)) continue;
    const p = pos[r];
    if (!p || p.tipo === "SIN_LUGAR") {
      if (soloFirmes) continue;
      return null;
    }
    desde = Math.max(desde, p.fin);
  }
  return desde;
}

export function buscarHueco(huecos: readonly Intervalo[], desde: number, duracion: number, hasta = Infinity): number | null {
  for (const h of huecos) {
    const ini = redondearArriba(Math.max(h.ini, desde), 5);
    if (ini + duracion <= h.fin && ini + duracion <= hasta) return ini;
  }
  return null;
}

function ordenDeRecorrido(lista: readonly Accion[]): Accion[] {
  const orden = [...lista].sort(porPrioridad);
  const out: Accion[] = [];
  const visitar = (a: Accion) => {
    if (out.includes(a)) return;
    for (const r of a.requiere) {
      const previa = orden.find((x) => x.id === r);
      if (previa) visitar(previa);
    }
    out.push(a);
  };
  orden.forEach(visitar);
  return out;
}

/**
 * Dónde queda cada acción pendiente: comprometida, ubicada por el estudiante,
 * **sugerida** por el motor o sin lugar. Determinista.
 */
export function posiciones(m: Mundo): Record<string, Posicion> {
  const pos = posicionesFirmes(m);
  let huecos = huecosLibres(m);
  for (const a of ordenDeRecorrido(bandeja(m).filter((x) => !pos[x.id]))) {
    const desde = desdeCuando(m, a, pos, false);
    if (desde === null) {
      pos[a.id] = { tipo: "SIN_LUGAR", motivo: "DEPENDENCIA" };
      continue;
    }
    const ini = buscarHueco(huecos, desde, a.duracion.probable, limiteDe(a));
    if (ini === null) {
      pos[a.id] = { tipo: "SIN_LUGAR", motivo: buscarHueco(huecos, desde, a.duracion.probable) !== null ? "PLAZO" : "SIN_HUECO" };
      continue;
    }
    const fin = ini + a.duracion.probable;
    pos[a.id] = { tipo: "SUGERIDA", ini, fin };
    huecos = restar(huecos, [{ ini, fin }]);
  }
  return pos;
}

/** ¿Hay un bloque completo para `a` antes de `limite`, sin contar las sugerencias de otras? */
function cabeAntes(m: Mundo, a: Accion, limite: number): boolean {
  const desde = desdeCuando(m, a, posicionesFirmes(m), true) ?? m.ahora;
  return buscarHueco(huecosLibres(m, { accionId: a.id }), desde, a.duracion.probable, limite) !== null;
}

// ── Totales y márgenes ────────────────────────────────────────────────────────────

export function totales(m: Mundo): Totales {
  const disp = disponibilidadFutura(m);
  const firmes = posicionesFirmes(m);
  const enBandeja = bandeja(m);
  const vivos = compromisosVivos(m).filter((c) => !hecha(m, c.accionId));
  const restante = (c: CompromisoVivo) => Math.max(0, c.fin - Math.max(c.ini, m.ahora));
  const comprometido = vivos.reduce((s, c) => s + restante(c), 0);
  const ubicadas = ubicacionesVigentes(m);
  const ubicado = ubicadas.reduce((s, u) => s + (u.fin - u.ini), 0);
  const sinUbicar = enBandeja.filter((a) => !firmes[a.id]);
  const futuro = intersectar(unir(ocupacionesDelEstudiante(m)), [{ ini: m.ahora, fin: FIN_DE_SEMANA }]);
  const conRango = (campo: "min" | "max") =>
    comprometido +
    ubicadas.reduce((s, u) => s + accion(u.accionId)!.duracion[campo], 0) +
    sinUbicar.reduce((s, a) => s + a.duracion[campo], 0);
  return {
    pendiente: comprometido + ubicado + sinUbicar.reduce((s, a) => s + a.duracion.probable, 0),
    pendienteMin: conRango("min"),
    pendienteMax: conRango("max"),
    capacidad: total(disp),
    comprometido,
    ubicado,
    sinUbicar: sinUbicar.reduce((s, a) => s + a.duracion.probable, 0),
    simulado: m.simuladas.reduce((s, x) => s + (x.fin - x.ini), 0),
    libre: total(huecosLibres(m)),
    usadoDentro: total(intersectar(disp, futuro)),
  };
}

/**
 * Margen antes de una evaluación: la disponibilidad que queda antes, menos lo que ya
 * ocupa el estudiante en ese tramo, menos lo que **tiene** que ocurrir antes y todavía
 * no tiene horario. Puede ser negativo.
 */
export function margenAntesDe(m: Mundo, evaluacionId: string): number {
  const limite = inicioDeEvaluacion(evaluacionId);
  const disp = disponibilidadFutura(m, limite);
  const usado = total(intersectar(disp, ocupacionesDelEstudiante(m)));
  const firmes = posicionesFirmes(m);
  const requerido = bandeja(m)
    .filter((a) => !firmes[a.id] && a.antesDe && inicioDeEvaluacion(a.antesDe) <= limite)
    .reduce((s, a) => s + a.duracion.probable, 0);
  return total(disp) - usado - requerido;
}

/** Las evaluaciones que todavía no pasaron y caen dentro de la semana. */
export const evaluacionesDeLaSemana = (m: Mundo) =>
  EVALUACIONES.filter((e) => {
    const ini = instanteDe(e.tramo).ini;
    return ini > m.ahora && ini < FIN_DE_SEMANA;
  });

// ── Validación de una ubicación ───────────────────────────────────────────────────

function textoDeOcupacion(o: Ocupacion): string {
  const cuando = tramoMedio(o.ini, o.fin);
  switch (o.tipo) {
    case "CLASE":
      return `Se superpone con ${o.titulo} (${cuando}).`;
    case "EVALUACION":
      return `Se superpone con ${o.titulo} (${cuando}).`;
    case "COMPROMISO":
      return `Se superpone con tu compromiso «${o.titulo}» (${cuando}). Para usar ese horario, primero cambiale el horario al compromiso.`;
    case "FOCUS":
      return `Hay una sesión de Focus en curso en ese horario («${o.titulo}», ${cuando}).`;
    case "UBICADA":
      return `Se superpone con «${o.titulo}», que ya ubicaste el ${cuando}.`;
    case "SIMULADA":
      return `Se superpone con «${o.titulo}», simulada en el escenario (${cuando}).`;
  }
}

const TIPO_POR_OCUPACION: Readonly<Record<TipoDeOcupacion, Conflicto["tipo"]>> = {
  CLASE: "CLASE",
  EVALUACION: "EVALUACION",
  COMPROMISO: "COMPROMISO",
  FOCUS: "FOCUS",
  UBICADA: "UBICADA",
  SIMULADA: "UBICADA",
};

function duros(m: Mundo, a: Accion, ini: number, fin: number, ex: Exclusion): Conflicto[] {
  const out: Conflicto[] = [];
  const agregar = (c: Conflicto) => {
    if (!out.some((x) => x.texto === c.texto)) out.push(c);
  };
  if (ini < m.ahora) agregar({ tipo: "PASADO", texto: `Ese horario ya pasó: el reloj del laboratorio marca ${nombreDelDia(fechaDe(m.ahora))} ${horaDe(m.ahora)}.` });
  const dia = Math.floor(ini / DIA);
  if (ini < 0 || fin > FIN_DE_SEMANA || minutoDelDia(ini) < HORA_INICIO * 60 || fin - dia * DIA > HORA_FIN * 60)
    agregar({ tipo: "FUERA_DE_GRILLA", texto: `No entra completa: el calendario de la semana va de ${String(HORA_INICIO).padStart(2, "0")}:00 a ${HORA_FIN}:00.` });
  for (const o of ocupaciones(m, ex)) if (seSuperponen({ ini, fin }, o)) agregar({ tipo: TIPO_POR_OCUPACION[o.tipo], texto: textoDeOcupacion(o) });
  if (a.noAntesDe && ini < instante(a.noAntesDe.fecha, a.noAntesDe.hora))
    agregar({ tipo: "NO_ANTES_DE", texto: `Esta acción va después: ${a.noAntesDe.motivo}.` });
  const firmes = posicionesFirmes(m);
  for (const r of a.requiere) {
    const p = firmes[r];
    if (hecha(m, r) || !p || p.tipo === "SIN_LUGAR" || p.fin <= ini) continue;
    const previa = accion(r)!;
    agregar({
      tipo: "DEPENDENCIA",
      texto: `${a.corto} necesita ${previa.corto} terminada antes, y ${previa.corto} está ${p.tipo === "COMPROMETIDA" ? "comprometida" : "ubicada"} el ${tramoMedio(p.ini, p.fin)}.`,
    });
  }
  for (const d of ACCIONES.filter((x) => x.requiere.includes(a.id))) {
    const p = firmes[d.id];
    if (!p || p.tipo === "SIN_LUGAR" || p.ini >= fin) continue;
    agregar({ tipo: "DEPENDENCIA", texto: `${a.corto} tiene que terminar antes de ${d.corto}, que está ${p.tipo === "COMPROMETIDA" ? "comprometida" : "ubicada"} el ${tramoMedio(p.ini, p.fin)}.` });
  }
  if (a.antesDe && fin > inicioDeEvaluacion(a.antesDe)) {
    const e = evaluacion(a.antesDe)!;
    agregar({ tipo: "PLAZO", texto: `Queda después de su fecha límite: ${e.corto} es el ${nombreDelDia(e.tramo.fecha)} a las ${e.tramo.desde}.` });
  }
  return out;
}

function blandos(m: Mundo, despues: Mundo, a: Accion, ini: number, fin: number, ex: Exclusion, verbo: "ubicás" | "movés"): Advertencia[] {
  const out: Advertencia[] = [];
  const cuando = `${verbo === "ubicás" ? "el" : "al"} ${nombreDelDia(fechaDe(ini))} a las ${horaDe(ini)}`;
  const firmes = posicionesFirmes(m);

  // Una acción MÁS prioritaria pierde su último espacio. Misma prioridad o menor: sin aviso.
  for (const y of bandeja(m)) {
    if (y.id === a.id || firmes[y.id] || rangoDePrioridad(y) >= rangoDePrioridad(a)) continue;
    if (y.convieneAntesDe) {
      const limite = instante(y.convieneAntesDe.fecha, y.convieneAntesDe.hora);
      if (cabeAntes(m, y, limite) && !cabeAntes(despues, y, limite)) {
        out.push({ tipo: "PRIORIDAD", afectada: y.id, texto: `Si ${verbo} ${a.corto} ${cuando}, ${y.corto} pierde el último bloque completo antes de ${y.convieneAntesDe.motivo}.` });
        continue;
      }
    }
    if (y.antesDe) {
      const limite = inicioDeEvaluacion(y.antesDe);
      if (cabeAntes(m, y, limite) && !cabeAntes(despues, y, limite))
        out.push({ tipo: "PRIORIDAD", afectada: y.id, texto: `Si ${verbo} ${a.corto} ${cuando}, ${y.corto} ya no entra completa antes ${deArticulo(evaluacion(y.antesDe)!.corto)}.` });
    }
  }

  for (const e of evaluacionesDeLaSemana(m)) {
    const antes = margenAntesDe(m, e.id);
    const ahora = margenAntesDe(despues, e.id);
    if (antes >= MARGEN_MINIMO && ahora < MARGEN_MINIMO)
      out.push({ tipo: "MARGEN", afectada: null, texto: `El margen antes ${deArticulo(e.corto)} baja de ${enMin(antes)} a ${enMin(ahora)}, por debajo de la hora que el laboratorio usa como mínimo.` });
  }

  const finMaximo = ini + a.duracion.max;
  if (finMaximo > fin) {
    const choca = ocupaciones(m, ex).find((o) => seSuperponen({ ini: fin, fin: finMaximo }, o));
    if (choca)
      out.push({ tipo: "MAXIMO", afectada: null, texto: `Si te lleva el máximo (${a.duracion.max} min), terminaría a las ${horaDe(finMaximo)} y se superpondría con ${choca.tipo === "CLASE" || choca.tipo === "EVALUACION" ? choca.titulo : `«${choca.titulo}»`}.` });
  }

  if (total(intersectar([{ ini, fin }], unir(m.ventanas))) < fin - ini)
    out.push({ tipo: "FUERA_DE_DISPONIBILIDAD", afectada: null, texto: "Queda fuera de tu disponibilidad declarada: ese tiempo no estaba reservado para estudiar y no descuenta de tu tiempo disponible." });

  for (const r of a.requiere) {
    if (hecha(m, r) || firmes[r]) continue;
    const previa = accion(r)!;
    out.push({ tipo: "PRERREQUISITO_SIN_HORARIO", afectada: r, texto: `${a.corto} depende de ${previa.corto}, que todavía no tiene horario. Para que sirva, ${previa.corto} tiene que ir antes.` });
  }
  return out;
}

const enMin = (n: number) => {
  const abs = Math.abs(n);
  const h = Math.floor(abs / 60);
  const mm = abs % 60;
  const s = h === 0 ? `${mm} min` : mm === 0 ? `${h} h` : `${h} h ${String(mm).padStart(2, "0")}`;
  return n < 0 ? `−${s}` : s;
};

export function validarUbicacion(m: Mundo, accionId: string, ini: number, duracion: number): Validacion {
  const a = accion(accionId);
  if (!a || compromisoDe(m, accionId) || hecha(m, accionId) || retirada(m, a))
    return { duros: [{ tipo: "INAMOVIBLE", texto: "Sólo una acción propuesta se ubica así. Un compromiso cambia de horario con renegociación." }], blandos: [] };
  const fin = ini + duracion;
  const ex = { accionId };
  const d = duros(m, a, ini, fin, ex);
  if (d.length > 0) return { duros: d, blandos: [] };
  const despues: Mundo = { ...m, ubicaciones: { ...m.ubicaciones, [accionId]: { ini, duracion } } };
  return { duros: [], blandos: blandos(m, despues, a, ini, fin, ex, "ubicás") };
}

export function validarCambioDeHorario(m: Mundo, compromisoId: string, ini: number): Validacion {
  const c = m.compromisos.find((x) => x.id === compromisoId);
  if (!c || c.estado !== "CONFIRMADO")
    return {
      duros: [{ tipo: "INAMOVIBLE", texto: c?.estado === "EN_CURSO" ? "Hay una sesión de Focus en curso: no se mueve mientras dura." : "Un compromiso incumplido no se edita. El rescate es otra cosa." }],
      blandos: [],
    };
  if (c.ini < m.ahora)
    return { duros: [{ tipo: "PASADO", texto: "Su horario ya empezó: un compromiso que ya empezó no se mueve." }], blandos: [] };
  const a = accion(c.accionId)!;
  const fin = ini + (c.fin - c.ini);
  const ex = { compromisoId };
  const d = duros(m, a, ini, fin, ex);
  if (d.length > 0) return { duros: d, blandos: [] };
  const despues: Mundo = { ...m, compromisos: m.compromisos.map((x) => (x.id === compromisoId ? { ...x, ini, fin } : x)) };
  return { duros: [], blandos: blandos(m, despues, a, ini, fin, ex, "movés") };
}

/** Hasta `n` horarios válidos, para ofrecer cuando algo no puede quedarse donde se soltó. */
export function alternativas(m: Mundo, accionId: string, duracion: number, n = 2): number[] {
  const a = accion(accionId)!;
  const desde = desdeCuando(m, a, posicionesFirmes(m), true) ?? m.ahora;
  const out: number[] = [];
  let huecos = huecosLibres(m, { accionId });
  while (out.length < n) {
    const ini = buscarHueco(huecos, desde, duracion, limiteDe(a));
    if (ini === null) break;
    if (validarUbicacion(m, accionId, ini, duracion).duros.length === 0) out.push(ini);
    huecos = restar(huecos, [{ ini, fin: ini + duracion }]);
  }
  return out;
}

// ── Simulación ────────────────────────────────────────────────────────────────────

export function porQueNoSeSimula(m: Mundo, id: string): MotivoSinSimular | null {
  if (m.simuladas.length >= MAXIMO_DE_PASOS) return { tipo: "MAXIMO" };
  const a = accion(id);
  if (!a) return { tipo: "NO_PENDIENTE" };
  if (hecha(m, id)) return { tipo: "YA_SIMULADA" };
  if (retirada(m, a)) return { tipo: "RETIRADA" };
  const faltan = a.requiere.filter((r) => !hecha(m, r));
  if (faltan.length > 0) return { tipo: "PRERREQUISITO", faltan };
  const p = posiciones(m)[id];
  if (!p || p.tipo === "SIN_LUGAR") return { tipo: "SIN_LUGAR" };
  const c = compromisoDe(m, id);
  if (c && c.fin <= m.ahora) return { tipo: "SIN_LUGAR" };
  return null;
}

/**
 * Un paso del escenario: la acción se hace **en el horario que tiene** en este mundo,
 * la evidencia resulta suficiente, se registra el progreso y el motor recalcula.
 * Parte del mundo que recibe, nunca del plan real.
 */
export function simularPaso(m: Mundo, id: string): Mundo {
  const p = posiciones(m)[id];
  if (!p || p.tipo === "SIN_LUGAR") return m;
  const { [id]: _quitada, ...ubicaciones } = m.ubicaciones;
  void _quitada;
  return {
    ...m,
    ubicaciones,
    compromisos: m.compromisos.filter((c) => !(c.accionId === id && c.estado !== "INCUMPLIDO")),
    hechas: [...m.hechas, id],
    simuladas: [...m.simuladas, { accionId: id, ini: p.ini, fin: p.fin, paso: m.simuladas.length + 1 }],
  };
}
