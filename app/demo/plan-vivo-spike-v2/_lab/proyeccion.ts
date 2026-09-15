/**
 * 🧪 **LABORATORIO DESCARTABLE — la proyección local de V2.**
 *
 * Una sola función, `proyectar(escenario)`, alimenta las tres vistas: el plan
 * semanal, el camino y el Gantt. El **plan real** es `proyectar(VACIO)` y no
 * depende de nada que el estudiante toque.
 *
 * ## El acomodador del laboratorio
 *
 * ⚠️ **No es el motor del producto ni una propuesta de motor.** Es lo mínimo para
 * que combinar pasos, reubicar y renegociar se vea coherente:
 *
 * 1. Lo que no se mueve ocupa su lugar: clases, evaluaciones y compromisos.
 * 2. Las propuestas reubicadas a mano ocupan el lugar elegido.
 * 3. Los pasos del escenario se hacen **en orden**: cada uno va en el primer hueco
 *    libre después del anterior. Así `P2 = simular(P1, w2)`: el segundo parte del
 *    primero, no del plan real.
 * 4. Lo que queda pendiente se acomoda por prioridad y, dentro de ella, en el
 *    orden del fixture: primer hueco que alcance, sin partir bloques, después de
 *    sus prerequisitos y antes de su evaluación.
 *
 * Puro: sin React, sin reloj propio, sin red, sin escritura. Mismo escenario,
 * misma salida.
 */

import {
  AHORA,
  CLASES,
  COMPROMISOS,
  EVALUACIONES,
  EXCEPCIONES,
  HECHOS,
  MAXIMO_DE_PASOS,
  ORDEN_DE_PRIORIDAD,
  TEMAS,
  VENTANAS,
  WORKITEMS,
} from "./fixture";
import { duracionDe, enHoras, enSemana, finDe, franjaDe, inicioDe, mismaFranja } from "./formato";
import type {
  Colocado,
  Compromiso,
  Entidad,
  Escenario,
  EstadoDeTemaEnEscenario,
  Franja,
  Margen,
  MotivoSinUbicar,
  PasoProyectado,
  PlanDiff,
  Proyeccion,
  Riesgo,
  Totales,
  VentanaDeDisponibilidad,
  VentanaEnPlan,
  WorkItem,
} from "./tipos";

export const VACIO: Escenario = Object.freeze({
  pasos: [],
  reubicaciones: {},
  renegociaciones: {},
  agregadas: [],
  quitadas: [],
});

export const esVacio = (esc: Escenario) =>
  esc.pasos.length === 0 &&
  Object.keys(esc.reubicaciones).length === 0 &&
  Object.keys(esc.renegociaciones).length === 0 &&
  esc.agregadas.length === 0 &&
  esc.quitadas.length === 0;

export const AHORA_EN_SEMANA = enSemana(AHORA.dia, AHORA.hora);

// ── Búsqueda ──────────────────────────────────────────────────────────────────

const TODAS: readonly Entidad[] = [...CLASES, ...EVALUACIONES, ...HECHOS, ...COMPROMISOS, ...WORKITEMS, ...VENTANAS, ...EXCEPCIONES];
const POR_ID = new Map(TODAS.map((e) => [e.id, e]));

export function entidad(id: string): Entidad | null {
  return POR_ID.get(id) ?? null;
}

export function workitem(id: string): WorkItem | null {
  const e = POR_ID.get(id);
  return e?.kind === "WORKITEM" ? e : null;
}

const INDICE = new Map(WORKITEMS.map((w, i) => [w.id, i]));
export const nivelDe = (w: Pick<WorkItem, "prioridad">) => ORDEN_DE_PRIORIDAD.indexOf(w.prioridad);

/** El orden recomendado: prioridad, y dentro de ella el orden del fixture. */
export const enOrdenRecomendado = (a: WorkItem, b: WorkItem) => nivelDe(a) - nivelDe(b) || INDICE.get(a.id)! - INDICE.get(b.id)!;

export function tituloDe(id: string): string {
  const e = POR_ID.get(id);
  if (!e) return id;
  if (e.kind === "DISPONIBILIDAD") return "Disponibilidad";
  return e.titulo;
}

/** Un título corto para frases: *"Límites"*, *"Teoría de Derivadas"*. */
export function nombreCorto(id: string): string {
  const corto = tituloDe(id)
    .replace(/^Resolver (Práctica \d+: )?/, "")
    .replace(/^Leer teoría de /, "Teoría de ")
    .replace(/^Leer /, "")
    .replace(/^Resumir /, "Resumen de ")
    .replace(/^un /, "")
    .replace(/ con ejercicios extra$/, "");
  return corto.charAt(0).toUpperCase() + corto.slice(1);
}

// ── Tramos en minutos de la semana ────────────────────────────────────────────

type Tramo = readonly [number, number];

const tramo = (f: Franja): Tramo => [inicioDe(f), finDe(f)];
const largo = (t: Tramo) => t[1] - t[0];
const sumar = (ts: readonly Tramo[]) => ts.reduce((s, t) => s + largo(t), 0);

function fusionar(ts: readonly Tramo[]): Tramo[] {
  const orden = [...ts].sort((a, b) => a[0] - b[0]);
  const salida: [number, number][] = [];
  for (const [d, h] of orden) {
    const ultimo = salida[salida.length - 1];
    if (ultimo && d <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], h);
    else salida.push([d, h]);
  }
  return salida;
}

function restar(base: readonly Tramo[], q: Tramo): Tramo[] {
  return base.flatMap(([d, h]): Tramo[] => {
    if (q[1] <= d || q[0] >= h) return [[d, h]];
    const partes: Tramo[] = [];
    if (q[0] > d) partes.push([d, q[0]]);
    if (q[1] < h) partes.push([q[1], h]);
    return partes;
  });
}

const contiene = (libres: readonly Tramo[], t: Tramo) => libres.some(([d, h]) => d <= t[0] && t[1] <= h);

/** Primer hueco de `minutos` seguidos que empiece en `desde` o después y termine en `hasta` o antes. */
function buscarHueco(libres: readonly Tramo[], minutos: number, desde: number, hasta: number | null): Tramo | null {
  for (const [d, h] of [...libres].sort((a, b) => a[0] - b[0])) {
    const inicio = Math.max(d, desde);
    const fin = inicio + minutos;
    if (fin > h) continue;
    if (hasta !== null && fin > hasta) continue;
    return [inicio, fin];
  }
  return null;
}

// ── Piezas del escenario ──────────────────────────────────────────────────────

export function ventanasDe(esc: Escenario): VentanaDeDisponibilidad[] {
  return [
    ...VENTANAS.filter((v) => !esc.quitadas.includes(v.id)),
    ...EXCEPCIONES.filter((v) => esc.agregadas.includes(v.id)),
  ];
}

const FIJOS: readonly Tramo[] = [...CLASES, ...EVALUACIONES].map((e) => tramo(e.franja));

function utiles(ventanas: readonly VentanaDeDisponibilidad[]): Tramo[] {
  let libres = fusionar(ventanas.map((v) => tramo(v.franja)))
    .map(([d, h]): Tramo => [Math.max(d, AHORA_EN_SEMANA), h])
    .filter(([d, h]) => h > d);
  for (const f of FIJOS) libres = restar(libres, f);
  return libres;
}

function compromisosDe(esc: Escenario): Record<string, Compromiso> {
  const salida: Record<string, Compromiso> = {};
  for (const c of COMPROMISOS) {
    const nueva = esc.renegociaciones[c.id];
    salida[c.id] =
      nueva && c.estado === "CONFIRMADO"
        ? {
            ...c,
            franja: nueva,
            renegociaciones: [
              ...c.renegociaciones,
              { antes: c.franja, despues: nueva, registro: "Cambio de horario registrado sólo en este laboratorio." },
            ],
          }
        : c;
  }
  return salida;
}

const noAntesDe = (w: WorkItem) => (w.noAntesDe ? enSemana(w.noAntesDe.dia, w.noAntesDe.hora) : 0);
const limiteDe = (w: WorkItem) => {
  const e = w.antesDe ? EVALUACIONES.find((x) => x.id === w.antesDe) : null;
  return e ? inicioDe(e.franja) : null;
};

// ── Armado ────────────────────────────────────────────────────────────────────

interface Armado {
  libresIniciales: Tramo[];
  libres: Tramo[];
  colocados: Colocado[];
  completados: Map<string, Tramo>;
  retirados: Set<string>;
  pasos: PasoProyectado[];
  usada: number;
  compromisos: Record<string, Compromiso>;
  pines: Map<string, Tramo>;
}

/**
 * Todo lo que ocupa lugar **antes** de acomodar las propuestas pendientes.
 * `excluir` deja afuera la franja de un elemento: es lo que usa la búsqueda de
 * huecos para ofrecer un lugar nuevo sin chocar con el suyo.
 */
function armarHastaAcomodar(esc: Escenario, excluir: string | null): Armado {
  const libresIniciales = utiles(ventanasDe(esc));
  let libres: Tramo[] = [...libresIniciales];
  const colocados: Colocado[] = [];
  const base = { hipotetico: false, pasoNumero: null, reubicado: false, motivoSinUbicar: null };

  for (const e of [...CLASES, ...EVALUACIONES])
    colocados.push({ ...base, clave: e.id, id: e.id, carril: "FACULTAD", franja: e.franja, estado: "FIJO" });
  for (const h of HECHOS)
    colocados.push({ ...base, clave: h.id, id: h.id, carril: "TRABAJO", franja: h.franja, estado: "HECHO" });

  const compromisos = compromisosDe(esc);
  for (const c of COMPROMISOS) {
    if (c.estado === "INCUMPLIDO") {
      colocados.push({ ...base, clave: c.id, id: c.id, carril: "COMPROMISOS", franja: c.franja, estado: "INCUMPLIDO" });
      continue;
    }
    const vigente = compromisos[c.id];
    if (!mismaFranja(vigente.franja, c.franja))
      colocados.push({ ...base, clave: `${c.id}#promesa`, id: c.id, carril: "COMPROMISOS", franja: c.franja, estado: "PROMESA_ANTERIOR", hipotetico: true });
    if (c.id !== excluir) libres = restar(libres, tramo(vigente.franja));
  }

  const pines = new Map<string, Tramo>();
  for (const w of WORKITEMS) {
    const pin = esc.reubicaciones[w.id];
    if (!pin || w.id === excluir) continue;
    const t = tramo(pin);
    // Una reubicación que dejó de caber (p. ej., se quitó su franja) se descarta: es una propuesta, no una promesa.
    if (!contiene(libres, t)) continue;
    libres = restar(libres, t);
    pines.set(w.id, t);
  }

  let cursor = AHORA_EN_SEMANA;
  let usada = 0;
  const completados = new Map<string, Tramo>();
  const retirados = new Set<string>();
  const pasos: PasoProyectado[] = [];

  esc.pasos.slice(0, MAXIMO_DE_PASOS).forEach((paso, i) => {
    const numero = i + 1;
    const vacio = { numero, id: paso.id, override: paso.override, incompleto: false, faltan: [] as string[], sinLugar: false, franja: null };
    const c = compromisos[paso.id];
    if (c) {
      if (c.estado !== "CONFIRMADO" || completados.has(c.id)) return void pasos.push({ ...vacio, sinLugar: true });
      const t = tramo(c.franja);
      completados.set(c.id, t);
      usada += largo(t);
      cursor = Math.max(cursor, t[1]);
      return void pasos.push({ ...vacio, franja: c.franja });
    }
    const w = workitem(paso.id);
    if (!w || completados.has(w.id) || retirados.has(w.id)) return void pasos.push({ ...vacio, sinLugar: true });

    const faltan = w.requiere.filter((r) => !completados.has(r));
    let t = pines.get(w.id) ?? null;
    if (t) pines.delete(w.id);
    else {
      t = buscarHueco(libres, w.duracion.probable, Math.max(cursor, noAntesDe(w)), null);
      if (t) libres = restar(libres, t);
    }
    if (!t) return void pasos.push({ ...vacio, faltan, incompleto: faltan.length > 0, sinLugar: true });

    const franja = franjaDe(t[0], t[1]);
    usada += largo(t);
    cursor = t[1];
    if (faltan.length > 0) {
      colocados.push({ ...base, clave: `${w.id}#intento`, id: w.id, carril: "TRABAJO", franja, estado: "INTENTO", hipotetico: true, pasoNumero: numero });
      return void pasos.push({ ...vacio, faltan, incompleto: true, franja });
    }
    completados.set(w.id, t);
    for (const x of WORKITEMS) if (x.seRetiraSi?.id === w.id) retirados.add(x.id);
    pasos.push({ ...vacio, franja });
  });

  // Un trabajo que dejó de hacer falta devuelve el lugar al que lo habían reubicado.
  for (const id of retirados) {
    const pin = pines.get(id);
    if (!pin) continue;
    pines.delete(id);
    libres = fusionar([...libres, pin]);
  }

  return { libresIniciales, libres, colocados, completados, retirados, pasos, usada, compromisos, pines };
}

export function proyectar(esc: Escenario): Proyeccion {
  const a = armarHastaAcomodar(esc, null);
  let libres = a.libres;
  const { colocados, completados, retirados, pines } = a;
  const base = { hipotetico: false, pasoNumero: null, reubicado: false, motivoSinUbicar: null };
  const numeroDePaso = (id: string) => a.pasos.find((p) => p.id === id && !p.incompleto && !p.sinLugar)?.numero ?? null;

  // Compromisos vigentes.
  for (const c of COMPROMISOS) {
    if (c.estado !== "CONFIRMADO") continue;
    const vigente = a.compromisos[c.id];
    const hecho = completados.has(c.id);
    colocados.push({
      ...base,
      clave: c.id,
      id: c.id,
      carril: "COMPROMISOS",
      franja: vigente.franja,
      estado: hecho ? "SIMULADO" : "CONFIRMADO",
      hipotetico: hecho || !mismaFranja(vigente.franja, c.franja),
      pasoNumero: hecho ? numeroDePaso(c.id) : null,
    });
  }

  // Lo simulado como hecho.
  for (const w of WORKITEMS) {
    const t = completados.get(w.id);
    if (!t) continue;
    colocados.push({ ...base, clave: w.id, id: w.id, carril: "TRABAJO", franja: franjaDe(t[0], t[1]), estado: "SIMULADO", hipotetico: true, pasoNumero: numeroDePaso(w.id) });
  }

  // Las propuestas que quedan, por prioridad.
  const pendientes = WORKITEMS.filter((w) => !completados.has(w.id) && !retirados.has(w.id)).sort(enOrdenRecomendado);
  const lugar = new Map<string, Tramo>(pines);
  const motivo = new Map<string, MotivoSinUbicar>();
  for (const w of pendientes) {
    if (lugar.has(w.id)) continue;
    let desde = Math.max(AHORA_EN_SEMANA, noAntesDe(w));
    let bloqueada = false;
    for (const r of w.requiere) {
      const fin = completados.get(r)?.[1] ?? lugar.get(r)?.[1];
      if (fin !== undefined) desde = Math.max(desde, fin);
      else if (!retirados.has(r)) bloqueada = true;
    }
    if (bloqueada) {
      motivo.set(w.id, "DEPENDENCIA");
      continue;
    }
    let hasta = limiteDe(w);
    for (const d of WORKITEMS)
      if (d.requiere.includes(w.id) && pines.has(d.id)) hasta = Math.min(hasta ?? Infinity, pines.get(d.id)![0]);
    const t = buscarHueco(libres, w.duracion.probable, desde, hasta);
    if (t) {
      libres = restar(libres, t);
      lugar.set(w.id, t);
    } else {
      motivo.set(w.id, hasta !== null && buscarHueco(libres, w.duracion.probable, desde, null) ? "PLAZO" : "SIN_VENTANA");
    }
  }
  for (const w of pendientes) {
    const t = lugar.get(w.id);
    colocados.push({
      ...base,
      clave: w.id,
      id: w.id,
      carril: "TRABAJO",
      franja: t ? franjaDe(t[0], t[1]) : null,
      estado: "PROPUESTA",
      reubicado: pines.has(w.id),
      hipotetico: pines.has(w.id),
      motivoSinUbicar: t ? null : (motivo.get(w.id) ?? "SIN_VENTANA"),
    });
  }

  // Totales.
  const compromisosPendientes = COMPROMISOS.filter((c) => c.estado === "CONFIRMADO" && !completados.has(c.id));
  const minutosDe = (c: Compromiso) => duracionDe(a.compromisos[c.id].franja);
  const totales: Totales = {
    pendiente: pendientes.reduce((s, w) => s + w.duracion.probable, 0) + compromisosPendientes.reduce((s, c) => s + minutosDe(c), 0),
    pendienteMin: pendientes.reduce((s, w) => s + w.duracion.min, 0) + compromisosPendientes.reduce((s, c) => s + minutosDe(c), 0),
    pendienteMax: pendientes.reduce((s, w) => s + w.duracion.max, 0) + compromisosPendientes.reduce((s, c) => s + minutosDe(c), 0),
    declarada: sumar(a.libresIniciales),
    usadaPorSimulado: a.usada,
    sinUbicar: pendientes.filter((w) => !lugar.has(w.id)).reduce((s, w) => s + w.duracion.probable, 0),
    margen: sumar(libres),
  };

  const margenes: Margen[] = fusionar(libres).map(([d, h]) => ({ ...franjaDe(d, h), minutos: h - d }));

  const ventanas: VentanaEnPlan[] = ventanasDe(esc).map((v) => ({
    ventana: v,
    minutosUtiles: sumar(a.libresIniciales.flatMap((t) => {
      const [vd, vh] = tramo(v.franja);
      const d = Math.max(vd, t[0]);
      const h = Math.min(vh, t[1]);
      return h > d ? [[d, h] as Tramo] : [];
    })),
  }));

  const completadosIds = [...completados.keys()];
  const producenProgreso = completadosIds.flatMap((id) => {
    const e = POR_ID.get(id);
    return e && (e.kind === "WORKITEM" || e.kind === "COMPROMISO") && e.impacto.produceProgreso ? e.impacto.temas : [];
  });
  const temasEnEscenario: Record<string, EstadoDeTemaEnEscenario> = {};
  for (const t of TEMAS)
    temasEnEscenario[t.id] = t.vos === "PROGRESO_REGISTRADO" ? "PROGRESO_REGISTRADO" : producenProgreso.includes(t.id) ? "SIMULADO" : "SIN_CAMBIO";

  const recomendada = pendientes.find((w) => w.requiere.every((r) => completados.has(r) || retirados.has(r)))?.id ?? null;

  const proyeccion: Proyeccion = {
    esEscenario: !esVacio(esc),
    colocados,
    ventanas,
    margenes,
    totales,
    completados: completadosIds,
    retirados: [...retirados],
    pasos: a.pasos,
    temasEnEscenario,
    riesgos: [],
    recomendada,
    compromisos: a.compromisos,
  };
  return { ...proyeccion, riesgos: riesgosDe(proyeccion) };
}

// ── Riesgos del laboratorio ───────────────────────────────────────────────────

/**
 * ⚠️ **Reglas del laboratorio, no `RiskSignal` ni `PLAN-v0.1`.** Hablan de la
 * tarea y del calendario, nunca de la persona.
 */
const HORAS_PEGADO = 180;

function riesgosDe(p: Proyeccion): Riesgo[] {
  const riesgos: Riesgo[] = [];
  for (const c of p.colocados) {
    const w = c.estado === "PROPUESTA" || c.estado === "SIMULADO" || c.estado === "INTENTO" ? workitem(c.id) : null;
    if (!w) continue;
    const limite = limiteDe(w);
    if (c.estado === "PROPUESTA" && c.franja === null)
      riesgos.push({
        id: `SIN_LUGAR:${w.id}`,
        texto: limite !== null ? `${w.titulo} no tiene lugar antes del parcial.` : `${w.titulo} no tiene lugar esta semana.`,
      });
    if (c.franja && limite !== null) {
      const falta = limite - finDe(c.franja);
      if (falta >= 0 && falta < HORAS_PEGADO)
        riesgos.push({ id: `PEGADO:${c.clave}`, texto: `${w.titulo} queda a ${enHoras(falta)} del parcial.` });
    }
  }
  for (const paso of p.pasos)
    if (paso.incompleto && !paso.sinLugar)
      riesgos.push({
        id: `INTENTO:${paso.id}`,
        texto: `${tituloDe(paso.id)} se simuló sin ${paso.faltan.map(nombreCorto).join(" ni ")}: no constata el tema.`,
      });
  return riesgos;
}

// ── Comparación ───────────────────────────────────────────────────────────────

export function diferencia(a: Proyeccion, b: Proyeccion): PlanDiff {
  const antes = new Map(a.colocados.map((c) => [c.clave, c]));
  const nuevos = (xs: readonly string[], ys: readonly string[]) => ys.filter((y) => !xs.includes(y));
  const idsDeRiesgo = (rs: readonly Riesgo[]) => rs.map((r) => r.id);

  return {
    movidos: b.colocados
      .filter((c) => {
        const x = antes.get(c.clave);
        return x?.franja && c.franja && !mismaFranja(x.franja, c.franja);
      })
      .map((c) => ({ clave: c.clave, id: c.id, antes: antes.get(c.clave)!.franja!, despues: c.franja! })),
    completados: nuevos(a.completados, b.completados),
    retirados: nuevos(a.retirados, b.retirados),
    intentos: nuevos(
      a.pasos.filter((p) => p.incompleto && !p.sinLugar).map((p) => p.id),
      b.pasos.filter((p) => p.incompleto && !p.sinLugar).map((p) => p.id),
    ),
    ubicados: b.colocados.filter((c) => c.franja && antes.get(c.clave)?.franja === null).map((c) => c.id),
    desubicados: b.colocados.filter((c) => c.franja === null && antes.get(c.clave)?.franja).map((c) => c.id),
    minutos: {
      pendiente: b.totales.pendiente - a.totales.pendiente,
      declarada: b.totales.declarada - a.totales.declarada,
      usada: b.totales.usadaPorSimulado - a.totales.usadaPorSimulado,
      sinUbicar: b.totales.sinUbicar - a.totales.sinUbicar,
      margen: b.totales.margen - a.totales.margen,
    },
    recomendadaAntes: a.recomendada,
    recomendadaDespues: b.recomendada,
    riesgosAgregados: b.riesgos.filter((r) => !idsDeRiesgo(a.riesgos).includes(r.id)),
    riesgosEliminados: a.riesgos.filter((r) => !idsDeRiesgo(b.riesgos).includes(r.id)),
    temasQueCambian: TEMAS.filter((t) => a.temasEnEscenario[t.id] !== b.temasEnEscenario[t.id]).map((t) => t.id),
    restriccionesIguales: b.colocados
      .filter((c) => c.estado === "FIJO" || c.estado === "CONFIRMADO" || c.estado === "INCUMPLIDO")
      .filter((c) => {
        const x = antes.get(c.clave);
        return x !== undefined && mismaFranja(x.franja, c.franja);
      })
      .map((c) => c.id),
  };
}

// ── Lo que pregunta la pantalla ───────────────────────────────────────────────

export function colocadoDe(p: Proyeccion, id: string): Colocado | null {
  return (
    p.colocados.find((c) => c.clave === id) ??
    p.colocados.find((c) => c.id === id && c.estado !== "PROMESA_ANTERIOR" && c.estado !== "INTENTO") ??
    null
  );
}

export type NoSimulable = "MAXIMO" | "YA_EN_ESCENARIO" | "INTENTO_SIN_PREREQUISITO" | "YA_NO_HACE_FALTA" | "NO_ES_TRABAJO" | "SIN_LUGAR";

/** ¿Se puede agregar al escenario? `null` = sí. */
export function porQueNoSeSimula(esc: Escenario, p: Proyeccion, id: string): NoSimulable | null {
  const e = POR_ID.get(id);
  if (!e || !(e.kind === "WORKITEM" || (e.kind === "COMPROMISO" && e.estado === "CONFIRMADO"))) return "NO_ES_TRABAJO";
  if (p.completados.includes(id)) return "YA_EN_ESCENARIO";
  // Un intento sin prerequisito se puede repetir, pero sólo cuando el prerequisito ya está.
  if (p.pasos.some((x) => x.id === id && x.incompleto && !x.sinLugar) && advertenciasAlSimular(p, id).faltan.length > 0)
    return "INTENTO_SIN_PREREQUISITO";
  if (p.retirados.includes(id)) return "YA_NO_HACE_FALTA";
  if (esc.pasos.length >= MAXIMO_DE_PASOS) return "MAXIMO";
  const probado = proyectar({ ...esc, pasos: [...esc.pasos, { id, override: false }] });
  if (probado.pasos[probado.pasos.length - 1]?.sinLugar) return "SIN_LUGAR";
  return null;
}

/** Lo que conviene avisar antes de simular. */
export function advertenciasAlSimular(p: Proyeccion, id: string): { faltan: string[]; superiores: string[] } {
  const w = workitem(id);
  if (!w) return { faltan: [], superiores: [] };
  const hechos = new Set([...p.completados, ...p.retirados]);
  return {
    faltan: w.requiere.filter((r) => !hechos.has(r)),
    superiores: WORKITEMS.filter((x) => x.id !== id && !hechos.has(x.id) && nivelDe(x) < nivelDe(w))
      .sort(enOrdenRecomendado)
      .map((x) => x.id),
  };
}

export interface Hueco {
  franja: Franja;
}

export interface BusquedaDeHuecos {
  huecos: Franja[];
  /** Por qué no hay más, en frases. */
  notas: string[];
}

/** Lugares válidos para una propuesta **en el escenario**. No reduce su duración. */
export function huecosParaPropuesta(esc: Escenario, id: string): BusquedaDeHuecos {
  const w = workitem(id);
  if (!w) return { huecos: [], notas: [] };
  const p = proyectar(esc);
  const a = armarHastaAcomodar(esc, id);
  const notas: string[] = [];
  let desde = Math.max(AHORA_EN_SEMANA, noAntesDe(w));
  for (const r of w.requiere) {
    const c = colocadoDe(p, r);
    if (p.completados.includes(r) || c?.franja) desde = Math.max(desde, finDe(c!.franja!));
    else if (!p.retirados.includes(r)) notas.push(`Primero necesita lugar ${nombreCorto(r)}, que es su prerequisito.`);
  }
  if (w.noAntesDe) notas.push(w.noAntesDe.motivo);
  const limite = limiteDe(w);
  const actual = colocadoDe(p, id)?.franja ?? null;
  const huecos: Franja[] = [];
  let despuesDelParcial = false;
  const minutos = w.duracion.probable;
  for (const [d, h] of [...a.libres].sort((x, y) => x[0] - y[0])) {
    const inicio = Math.max(d, desde);
    if (inicio + minutos > h) continue;
    if (limite !== null && inicio + minutos > limite) {
      despuesDelParcial = true;
      continue;
    }
    const fr = franjaDe(inicio, inicio + minutos);
    if (!mismaFranja(fr, actual)) huecos.push(fr);
  }
  const mayor = Math.max(0, ...a.libres.map(largo));
  if (huecos.length === 0 && mayor < minutos)
    notas.push(`Necesita ${enHoras(minutos)} seguidos y el hueco libre más largo es de ${enHoras(mayor)}. No se acorta su duración.`);
  if (despuesDelParcial) notas.push("Hay lugar, pero sólo después del parcial.");
  return { huecos, notas };
}

/** Lugares para un compromiso con *Cambiar horario*. Misma duración, sin pisar nada. */
export function huecosParaCompromiso(esc: Escenario, id: string): BusquedaDeHuecos {
  const c = compromisosDe(esc)[id];
  if (!c || c.estado !== "CONFIRMADO") return { huecos: [], notas: [] };
  const a = armarHastaAcomodar(esc, id);
  const minutos = duracionDe(c.franja);
  const huecos = [...a.libres]
    .sort((x, y) => x[0] - y[0])
    .filter(([d, h]) => h - d >= minutos)
    .map(([d]) => franjaDe(d, d + minutos))
    .filter((fr) => !mismaFranja(fr, c.franja));
  return { huecos, notas: huecos.length === 0 ? ["No hay otra franja libre que dure lo mismo."] : [] };
}

/** ¿Quitar esta franja dejaría un compromiso fuera de la disponibilidad? */
export function compromisoEnVentana(esc: Escenario, ventanaId: string): string | null {
  const v = [...VENTANAS, ...EXCEPCIONES].find((x) => x.id === ventanaId);
  if (!v) return null;
  const [vd, vh] = tramo(v.franja);
  const vigentes = compromisosDe(esc);
  for (const c of Object.values(vigentes)) {
    if (c.estado !== "CONFIRMADO") continue;
    const [cd, ch] = tramo(c.franja);
    if (cd < vh && vd < ch) return c.id;
  }
  return null;
}

/** Qué trabajo ocupa una franja de disponibilidad en la proyección, y cuánto queda libre. */
export function ocupacionDeVentana(p: Proyeccion, ventanaId: string): { colocados: Colocado[]; ocupado: number; margen: number; utiles: number } {
  const v = p.ventanas.find((x) => x.ventana.id === ventanaId);
  if (!v) return { colocados: [], ocupado: 0, margen: 0, utiles: 0 };
  const [vd, vh] = tramo(v.ventana.franja);
  const dentro = (f: Franja) => {
    const [d, h] = tramo(f);
    return Math.max(0, Math.min(h, vh) - Math.max(d, vd));
  };
  const colocados = p.colocados.filter(
    (c) => c.franja && c.estado !== "FIJO" && c.estado !== "HECHO" && c.estado !== "INCUMPLIDO" && c.estado !== "PROMESA_ANTERIOR" && dentro(c.franja) > 0 && inicioDe(c.franja) >= AHORA_EN_SEMANA,
  );
  const margen = p.margenes.reduce((s, m) => s + dentro(m), 0);
  return { colocados, ocupado: colocados.reduce((s, c) => s + dentro(c.franja!), 0), margen, utiles: v.minutosUtiles };
}

/** El plan real: nunca cambia durante el laboratorio. */
export const PLAN_REAL: Proyeccion = proyectar(VACIO);
