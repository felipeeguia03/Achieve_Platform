/**
 * **El planificador del Plan vivo** — [ADR-110](../../../docs/decisions.md#adr-110).
 *
 * Determinista, codicioso y explicable. **No optimiza**: recorre el trabajo en
 * orden de prioridad (con los prerrequisitos antes) y le da a cada uno el
 * primer hueco libre donde entra **entero**, antes de su plazo. Un optimizador
 * opaco no se puede explicar, y el pedido lo descarta.
 *
 * ## Lo que nunca hace
 *
 * - **Mover lo fijo.** Clases, evaluaciones, compromisos, un Focus en curso y la
 *   historia son bloques: se restan de la capacidad y nada más.
 * - **Mover lo que el estudiante eligió o fijó.** Las ubicaciones de la entrada
 *   se respetan en los dos modos; sólo salen si dejaron de ser válidas.
 * - **Partir un trabajo.** Dos huecos de 30 min no alojan uno de 60.
 * - **Tocar el progreso.** `pendiente` sólo baja con `hechos`, que sólo existen
 *   en la simulación.
 */

import { alinear, contenido, duracion, intersectar, MINUTO, primerHueco, restar, seSuperponen, unir } from "./intervalos";
import type {
  BloqueFijo,
  CausaDeNoEntrar,
  Intervalo,
  MotivoDeConflicto,
  NotFittingItem,
  PlacedPlanningItem,
  Placement,
  PlacementExplanation,
  PlanningConflict,
  PlanningInput,
  PlanningMetrics,
  PlanningProjection,
  PlanningWorkItem,
} from "./tipos";

export const REGLA_DEL_PLANIFICADOR = "plan-vivo-v1";

const probable = (i: PlanningWorkItem): number | null => i.durationRange?.likelyMinutes ?? null;

// ── Orden ───────────────────────────────────────────────────────────────────────

/**
 * Comparación lexicográfica: costo del ADE (mayor primero) → plazo más cercano
 * → materia → id. **El id cierra el empate** para que dos corridas den lo mismo.
 */
export function compararPrioridad(a: PlanningWorkItem, b: PlanningWorkItem): number {
  if (a.costo !== b.costo) return b.costo - a.costo;
  const pa = a.deadline?.instante ?? Number.POSITIVE_INFINITY;
  const pb = b.deadline?.instante ?? Number.POSITIVE_INFINITY;
  if (pa !== pb) return pa - pb;
  if (a.materia !== b.materia) return a.materia < b.materia ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Orden de prioridad **con los prerrequisitos antes**. Un trabajo nunca queda
 * delante de otro trabajo del que depende; entre los que están libres, gana la
 * prioridad. Un ciclo (dato malo) no cuelga: lo que queda se agrega al final.
 */
export function ordenTopologico(items: readonly PlanningWorkItem[]): PlanningWorkItem[] {
  const ids = new Set(items.map((i) => i.id));
  const restantes = [...items].sort(compararPrioridad);
  const hecho = new Set<string>();
  const out: PlanningWorkItem[] = [];
  while (restantes.length > 0) {
    const k = restantes.findIndex((i) =>
      i.dependencies.every((d) => d.itemId === null || !ids.has(d.itemId) || hecho.has(d.itemId)),
    );
    const [siguiente] = restantes.splice(k === -1 ? 0 : k, 1);
    hecho.add(siguiente.id);
    out.push(siguiente);
  }
  return out;
}

// ── Contexto compartido ─────────────────────────────────────────────────────────

interface Contexto {
  input: PlanningInput;
  items: Map<string, PlanningWorkItem>;
  hechos: Set<string>;
  inicio: number;
  /** Disponibilidad futura dentro del horizonte. */
  disponible: Intervalo[];
  /** Disponible menos todo lo fijo. */
  libresBase: Intervalo[];
  /** El bloque del compromiso (o Focus) de cada trabajo. */
  bloqueDe: Map<string, BloqueFijo>;
}

function contexto(input: PlanningInput): Contexto {
  const inicio = Math.max(input.ahora, input.horizonte.ini);
  const futuro = inicio < input.horizonte.fin ? [{ ini: inicio, fin: input.horizonte.fin }] : [];
  const disponible = intersectar(input.disponibilidad, futuro);
  const bloqueDe = new Map<string, BloqueFijo>();
  for (const f of input.fijos) if (f.itemId && (f.tipo === "COMPROMISO" || f.tipo === "FOCUS")) bloqueDe.set(f.itemId, f);
  return {
    input,
    items: new Map(input.items.map((i) => [i.id, i])),
    hechos: new Set(input.hechos),
    inicio,
    disponible,
    libresBase: restar(disponible, input.fijos),
    bloqueDe,
  };
}

/** Trabajo que todavía hay que hacer: ni supuesto hecho ni comprometido. */
const esMovible = (c: Contexto, i: PlanningWorkItem) => !c.hechos.has(i.id) && !i.commitmentId && !c.bloqueDe.has(i.id);

/**
 * Cuándo termina el prerrequisito, o `null` si todavía no tiene lugar.
 * `-∞` ⇒ ya está satisfecho y no condiciona la hora.
 */
function finDelPrerrequisito(c: Contexto, itemId: string | null, ubicadas: ReadonlyMap<string, PlacedPlanningItem>): number | null {
  if (itemId === null || c.hechos.has(itemId)) return Number.NEGATIVE_INFINITY;
  // Un prerrequisito que no es trabajo planificable (p. ej. espera evidencia) **no** está satisfecho.
  if (!c.items.has(itemId)) return null;
  const bloque = c.bloqueDe.get(itemId);
  if (bloque) return bloque.fin;
  return ubicadas.get(itemId)?.fin ?? null;
}

const MOTIVO_DE_FIJO: Readonly<Record<BloqueFijo["tipo"], MotivoDeConflicto>> = {
  CLASE: "CLASE",
  EVALUACION: "EVALUACION",
  COMPROMISO: "COMPROMISO",
  FOCUS: "FOCUS",
  HISTORIA: "HISTORIA",
};

export interface Conflicto {
  motivo: MotivoDeConflicto;
  contra: string | null;
}

/**
 * Lo **duro**: lo que impide que un trabajo quede en `ini`, sin mirar a las
 * otras propuestas ni a los prerrequisitos. Orden fijo, el primero gana.
 */
function conflictoDuro(c: Contexto, item: PlanningWorkItem, ini: number): Conflicto | null {
  const min = probable(item);
  if (min === null) return { motivo: "SIN_DURACION", contra: null };
  const franja = { ini, fin: ini + min * MINUTO };
  if (ini < c.input.ahora) return { motivo: "PASADO", contra: null };
  if (ini < c.input.horizonte.ini || franja.fin > c.input.horizonte.fin) return { motivo: "FUERA_DEL_HORIZONTE", contra: null };
  const fijo = c.input.fijos.find((f) => seSuperponen(f, franja));
  if (fijo) return { motivo: MOTIVO_DE_FIJO[fijo.tipo], contra: fijo.id };
  if (item.deadline && franja.fin > item.deadline.instante) return { motivo: "FECHA_LIMITE", contra: item.deadline.evaluacionId };
  return null;
}

function conflictoDeDependencia(
  c: Contexto,
  item: PlanningWorkItem,
  ini: number,
  ubicadas: ReadonlyMap<string, PlacedPlanningItem>,
): Conflicto | null {
  for (const d of item.dependencies) {
    const fin = finDelPrerrequisito(c, d.itemId, ubicadas);
    if (fin === null || ini < fin) return { motivo: "DEPENDENCIA", contra: d.itemId };
  }
  return null;
}

// ── El recorrido codicioso ──────────────────────────────────────────────────────

interface Reparto {
  ubicadas: Map<string, PlacedPlanningItem>;
  noEntran: NotFittingItem[];
}

function llenar(c: Contexto, previas: ReadonlyMap<string, PlacedPlanningItem>, candidatos: readonly PlanningWorkItem[]): Reparto {
  const ubicadas = new Map(previas);
  const noEntran: NotFittingItem[] = [];
  for (const item of ordenTopologico(candidatos)) {
    if (ubicadas.has(item.id)) continue;
    const min = probable(item);
    if (min === null) {
      noEntran.push({ itemId: item.id, causa: "SIN_DURACION", requiere: null });
      continue;
    }
    let desde = c.inicio;
    let faltante: string | null = null;
    for (const d of item.dependencies) {
      const fin = finDelPrerrequisito(c, d.itemId, ubicadas);
      if (fin === null) {
        faltante = d.reason;
        break;
      }
      desde = Math.max(desde, fin);
    }
    if (faltante !== null) {
      noEntran.push({ itemId: item.id, causa: "DEPENDENCIA", requiere: faltante });
      continue;
    }
    const libres = restar(c.libresBase, [...ubicadas.values()]);
    const hasta = item.deadline?.instante ?? Number.POSITIVE_INFINITY;
    const ini = primerHueco(libres, desde, min, hasta);
    if (ini !== null) {
      ubicadas.set(item.id, { itemId: item.id, ini, fin: ini + min * MINUTO, origen: "AUTOMATICA", fijada: false });
      continue;
    }
    noEntran.push({ itemId: item.id, causa: causaDeNoEntrar(libres, alinear(desde), min, hasta), requiere: null });
  }
  return { ubicadas, noEntran };
}

/**
 * Por qué no entró. **La fragmentación se dice**: si la suma de huecos alcanza
 * pero ninguno aloja el bloque entero, no es falta de tiempo.
 */
function causaDeNoEntrar(libres: readonly Intervalo[], desde: number, min: number, hasta: number): CausaDeNoEntrar {
  const largo = min * MINUTO;
  if (Number.isFinite(hasta)) {
    if (desde + largo > hasta) return "FECHA_LIMITE";
    const antes = duracion(intersectar(libres, [{ ini: desde, fin: hasta }]));
    if (antes >= largo) return "FRAGMENTACION";
    const despues = duracion(intersectar(libres, [{ ini: desde, fin: Number.MAX_SAFE_INTEGER }]));
    if (despues >= largo) return "FECHA_LIMITE";
    return "CAPACIDAD";
  }
  const todo = duracion(intersectar(libres, [{ ini: desde, fin: Number.MAX_SAFE_INTEGER }]));
  return todo >= largo ? "FRAGMENTACION" : "CAPACIDAD";
}

/**
 * Las ubicaciones de la entrada que siguen siendo válidas. Primero las fijadas,
 * después las elegidas, en el orden en que llegaron: si dos se pisan, **gana la
 * que llegó antes** y la otra vuelve a la cola con su conflicto.
 */
function respetar(c: Contexto): { ubicadas: Map<string, PlacedPlanningItem>; conflictos: PlanningConflict[] } {
  const conflictos: PlanningConflict[] = [];
  let ubicadas = new Map<string, PlacedPlanningItem>();
  const orden = [...c.input.ubicaciones].sort((a, b) => Number(b.fijada) - Number(a.fijada));
  for (const u of orden) {
    const item = c.items.get(u.itemId);
    if (!item || !esMovible(c, item) || ubicadas.has(item.id)) continue;
    const duro = conflictoDuro(c, item, u.ini);
    if (duro) {
      conflictos.push({ itemId: item.id, ...duro });
      continue;
    }
    const franja = { ini: u.ini, fin: u.ini + probable(item)! * MINUTO };
    if (!contenido(franja, c.disponible)) {
      conflictos.push({ itemId: item.id, motivo: "FUERA_DE_DISPONIBILIDAD", contra: null });
      continue;
    }
    const otra = [...ubicadas.values()].find((p) => seSuperponen(p, franja));
    if (otra) {
      conflictos.push({ itemId: item.id, motivo: otra.fijada ? "FIJADA" : "PROPUESTA", contra: otra.itemId });
      continue;
    }
    ubicadas.set(item.id, { ...u, fin: franja.fin });
  }
  // Las dependencias se miran al final, y hasta que no cambie nada: sacar una
  // ubicación puede dejar sin prerrequisito a otra.
  for (let cambio = true; cambio; ) {
    cambio = false;
    for (const p of ubicadas.values()) {
      const dep = conflictoDeDependencia(c, c.items.get(p.itemId)!, p.ini, ubicadas);
      if (dep) {
        conflictos.push({ itemId: p.itemId, ...dep });
        ubicadas = new Map([...ubicadas].filter(([id]) => id !== p.itemId));
        cambio = true;
        break;
      }
    }
  }
  return { ubicadas, conflictos };
}

// ── La proyección ───────────────────────────────────────────────────────────────

export function planificar(input: PlanningInput): PlanningProjection {
  const c = contexto(input);
  const pendientes = input.items.filter((i) => !c.hechos.has(i.id));
  const movibles = pendientes.filter((i) => esMovible(c, i));
  const { ubicadas: respetadas, conflictos } = respetar(c);

  const automatico = input.strategy === "AUTOMATIC";
  // En manual el recorrido corre **a la sombra**: dice qué entraría, sin ubicar nada.
  const retenidas = new Set(input.retenidas);
  const reparto = llenar(c, respetadas, movibles.filter((i) => !(automatico && retenidas.has(i.id))));
  const ubicadas = automatico ? reparto.ubicadas : respetadas;
  const feasible = automatico
    ? []
    : ordenTopologico(movibles.filter((i) => !respetadas.has(i.id) && reparto.ubicadas.has(i.id))).map((i) => i.id);
  const noEntran = reparto.noEntran;
  // Una retenida en automático no «no entra»: el estudiante la sacó. Queda en la cola, sin causa.

  const placedItems = [...ubicadas.values()].sort((a, b) => a.ini - b.ini || (a.itemId < b.itemId ? -1 : 1));
  const unplacedItems = ordenTopologico(movibles.filter((i) => !ubicadas.has(i.id)));

  const explanations: PlacementExplanation[] = [
    ...placedItems.map((p): PlacementExplanation => {
      const item = c.items.get(p.itemId)!;
      const causa = p.fijada ? "FIJADA" : p.origen === "MANUAL" ? "ELEGIDA" : item.deadline ? "ANTES_DEL_PLAZO" : "PRIMER_HUECO";
      return { itemId: p.itemId, causa };
    }),
    ...pendientes.filter((i) => !esMovible(c, i)).map((i): PlacementExplanation => ({ itemId: i.id, causa: "COMPROMETIDA" })),
    ...noEntran.map((n): PlacementExplanation => ({ itemId: n.itemId, causa: n.causa })),
  ];

  return {
    placedItems,
    unplacedItems,
    feasiblePrioritySet: feasible,
    notFittingItems: noEntran,
    conflicts: conflictos,
    metrics: metricas(c, pendientes, placedItems, noEntran),
    explanations,
  };
}

function metricas(
  c: Contexto,
  pendientes: readonly PlanningWorkItem[],
  ubicadas: readonly PlacedPlanningItem[],
  noEntran: readonly NotFittingItem[],
): PlanningMetrics {
  const minutos = (ms: number) => Math.round(ms / MINUTO);
  const deItem = (i: PlanningWorkItem): number | null => {
    const bloque = c.bloqueDe.get(i.id);
    return bloque ? minutos(bloque.fin - bloque.ini) : probable(i);
  };
  const pendiente = pendientes.reduce((s, i) => s + (deItem(i) ?? 0), 0);
  const comprometido = pendientes.filter((i) => !esMovible(c, i)).reduce((s, i) => s + (deItem(i) ?? 0), 0);
  const asignado = comprometido + ubicadas.reduce((s, p) => s + minutos(p.fin - p.ini), 0);

  const ocupantes: Intervalo[] = [
    ...ubicadas,
    ...c.input.fijos.filter((f) => f.tipo === "COMPROMISO" || f.tipo === "FOCUS"),
  ];
  const total = minutos(duracion(c.disponible));
  const ocupada = minutos(duracion(intersectar(c.disponible, unir(ocupantes))));
  const noEntra = noEntran.reduce((s, n) => s + (probable(c.items.get(n.itemId)!) ?? 0), 0);

  return {
    pendiente,
    asignado,
    sinUbicar: Math.max(0, pendiente - asignado),
    disponibilidadTotal: total,
    disponibilidadOcupada: ocupada,
    disponibilidadLibre: Math.max(0, total - ocupada),
    noEntra,
    sinDuracion: pendientes.filter((i) => esMovible(c, i) && probable(i) === null).length,
  };
}

// ── Validar lo que el estudiante hace ───────────────────────────────────────────

export type ResultadoDeUbicacion =
  | { tipo: "OK" }
  /** Duro: no se ubica, y no hay «ubicar igual». */
  | { tipo: "CONFLICTO"; motivo: MotivoDeConflicto; contra: string | null }
  /** El horario está libre pero nadie lo declaró disponible. */
  | { tipo: "SIN_DISPONIBILIDAD"; franja: Intervalo }
  /** Pisa propuestas movibles: se ubica sólo si se confirma que salen. */
  | { tipo: "DESPLAZA"; desplazados: readonly string[] }
  /** Entra, pero trabajo más prioritario pierde su lugar. */
  | { tipo: "CONSECUENCIA"; pierden: readonly string[] };

/** Las ubicaciones de la entrada con `itemId` puesto en `ini`, y sin las que salen. */
export function conUbicacion(input: PlanningInput, itemId: string, ini: number, salen: readonly string[] = []): PlanningInput {
  const fuera = new Set([itemId, ...salen]);
  const previa = input.ubicaciones.find((u) => u.itemId === itemId);
  return {
    ...input,
    ubicaciones: [
      ...input.ubicaciones.filter((u) => !fuera.has(u.itemId)),
      { itemId, ini, origen: "MANUAL", fijada: previa?.fijada ?? false },
    ],
  };
}

/** Lo que entra con la entrada tal cual: ubicado en automático, *entraría* en manual. */
function queEntra(input: PlanningInput, p: PlanningProjection): Set<string> {
  return input.strategy === "AUTOMATIC"
    ? new Set(p.placedItems.map((x) => x.itemId))
    : new Set([...p.placedItems.map((x) => x.itemId), ...p.feasiblePrioritySet]);
}

/**
 * ¿Puede quedar `itemId` en `ini`? En este orden: lo duro, las dependencias, las
 * propuestas que pisaría, la disponibilidad y, al final, las **consecuencias
 * materiales**. Una prioridad menor sin consecuencia **no avisa**.
 */
export function validarUbicacion(input: PlanningInput, itemId: string, ini: number): ResultadoDeUbicacion {
  const c = contexto(input);
  const item = c.items.get(itemId);
  if (!item || !esMovible(c, item)) return { tipo: "CONFLICTO", motivo: "COMPROMISO", contra: item?.commitmentId ?? null };
  const duro = conflictoDuro(c, item, ini);
  if (duro) return { tipo: "CONFLICTO", ...duro };

  const actual = planificar(input);
  const ubicadas = new Map(actual.placedItems.filter((p) => p.itemId !== itemId).map((p) => [p.itemId, p]));
  const dep = conflictoDeDependencia(c, item, ini, ubicadas);
  if (dep) return { tipo: "CONFLICTO", ...dep };

  const franja = { ini, fin: ini + probable(item)! * MINUTO };
  const pisadas = [...ubicadas.values()].filter((p) => seSuperponen(p, franja));
  const fijada = pisadas.find((p) => p.fijada);
  if (fijada) return { tipo: "CONFLICTO", motivo: "FIJADA", contra: fijada.itemId };
  // Mover un trabajo que depende de éste a antes de su prerrequisito también es duro.
  const dependiente = [...ubicadas.values()].find((p) =>
    c.items.get(p.itemId)!.dependencies.some((d) => d.itemId === itemId) && p.ini < franja.fin,
  );
  if (dependiente) return { tipo: "CONFLICTO", motivo: "DEPENDENCIA", contra: dependiente.itemId };
  if (pisadas.length > 0) return { tipo: "DESPLAZA", desplazados: pisadas.map((p) => p.itemId) };

  if (!contenido(franja, c.disponible)) return { tipo: "SIN_DISPONIBILIDAD", franja };

  const antes = queEntra(input, actual);
  const siguiente = conUbicacion(input, itemId, ini);
  const despues = queEntra(siguiente, planificar(siguiente));
  const pierden = input.items
    .filter((i) => i.id !== itemId && antes.has(i.id) && !despues.has(i.id) && compararPrioridad(i, item) < 0)
    .map((i) => i.id);
  return pierden.length > 0 ? { tipo: "CONSECUENCIA", pierden } : { tipo: "OK" };
}

export type ResultadoDeIntercambio =
  | { tipo: "DIRECTO"; a: Placement; b: Placement; salen: readonly string[] }
  | { tipo: "REORGANIZAR"; a: Placement; b: Placement; salen: readonly string[]; movidos: readonly string[] }
  | { tipo: "PROHIBIDO"; motivo: MotivoDeConflicto | "NO_UBICADA"; itemId: string };

/**
 * La entrada después del intercambio: `a` y `b` **primero** entre las no
 * fijadas (así ganan su lugar) y sin las propuestas elegidas que pisan.
 * Es exactamente lo que aplica la operación `INTERCAMBIAR` de la sesión.
 */
export function conIntercambio(input: PlanningInput, a: Placement, b: Placement, salen: readonly string[]): PlanningInput {
  const fuera = new Set([a.itemId, b.itemId, ...salen]);
  return { ...input, ubicaciones: [a, b, ...input.ubicaciones.filter((u) => !fuera.has(u.itemId))] };
}

/**
 * Soltar una propuesta sobre otra. **Directo** sólo si las dos son propuestas
 * sin fijar, duran lo mismo, entran en el lugar de la otra y no mueven a nadie
 * más. Si mueven a alguien, se muestra antes. Si no pueden, se dice por qué.
 */
export function validarIntercambio(input: PlanningInput, aId: string, bId: string): ResultadoDeIntercambio {
  const actual = planificar(input);
  const pa = actual.placedItems.find((p) => p.itemId === aId);
  const pb = actual.placedItems.find((p) => p.itemId === bId);
  if (!pa) return { tipo: "PROHIBIDO", motivo: "NO_UBICADA", itemId: aId };
  if (!pb) return { tipo: "PROHIBIDO", motivo: "NO_UBICADA", itemId: bId };
  if (pa.fijada) return { tipo: "PROHIBIDO", motivo: "FIJADA", itemId: aId };
  if (pb.fijada) return { tipo: "PROHIBIDO", motivo: "FIJADA", itemId: bId };

  const c = contexto(input);
  const a: Placement = { itemId: aId, ini: pb.ini, origen: "MANUAL", fijada: false };
  const b: Placement = { itemId: bId, ini: pa.ini, origen: "MANUAL", fijada: false };
  const franjaDe = (p: Placement) => ({ ini: p.ini, fin: p.ini + probable(c.items.get(p.itemId)!)! * MINUTO });
  const [fa, fb] = [franjaDe(a), franjaDe(b)];
  if (seSuperponen(fa, fb)) return { tipo: "PROHIBIDO", motivo: "PROPUESTA", itemId: aId };

  const resto = actual.placedItems.filter((p) => p.itemId !== aId && p.itemId !== bId);
  const pisadas = resto.filter((p) => seSuperponen(p, fa) || seSuperponen(p, fb));
  const fijada = pisadas.find((p) => p.fijada);
  if (fijada) return { tipo: "PROHIBIDO", motivo: "FIJADA", itemId: fijada.itemId };

  const quedan = new Map<string, PlacedPlanningItem>(
    resto.filter((p) => !pisadas.includes(p)).map((p) => [p.itemId, p]),
  );
  quedan.set(aId, { ...a, fin: fa.fin });
  quedan.set(bId, { ...b, fin: fb.fin });
  for (const [p, franja] of [[a, fa], [b, fb]] as const) {
    const item = c.items.get(p.itemId)!;
    const duro = conflictoDuro(c, item, p.ini);
    if (duro) return { tipo: "PROHIBIDO", motivo: duro.motivo, itemId: p.itemId };
    if (!contenido(franja, c.disponible)) return { tipo: "PROHIBIDO", motivo: "FUERA_DE_DISPONIBILIDAD", itemId: p.itemId };
    if (conflictoDeDependencia(c, item, p.ini, quedan)) return { tipo: "PROHIBIDO", motivo: "DEPENDENCIA", itemId: p.itemId };
    const dependiente = [...quedan.values()].some(
      (q) => c.items.get(q.itemId)!.dependencies.some((d) => d.itemId === p.itemId) && q.ini < franja.fin,
    );
    if (dependiente) return { tipo: "PROHIBIDO", motivo: "DEPENDENCIA", itemId: p.itemId };
  }

  const salen = pisadas.map((p) => p.itemId);
  const despues = planificar(conIntercambio(input, a, b, salen));
  const posDespues = new Map(despues.placedItems.map((p) => [p.itemId, p.ini]));
  if (posDespues.get(aId) !== a.ini || posDespues.get(bId) !== b.ini) {
    return { tipo: "PROHIBIDO", motivo: "PROPUESTA", itemId: aId };
  }
  const movidos = resto.map((p) => p.itemId).filter((id) => posDespues.get(id) !== actual.placedItems.find((p) => p.itemId === id)!.ini);
  const iguales = pa.fin - pa.ini === pb.fin - pb.ini;
  return iguales && movidos.length === 0
    ? { tipo: "DIRECTO", a, b, salen }
    : { tipo: "REORGANIZAR", a, b, salen, movidos };
}
