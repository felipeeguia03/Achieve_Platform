import { candidatosDelAde, type CandidatoDelAde, type ContextoDelAde } from "@/lib/domain/ade";
import { fechasEntre, sumarDias } from "@/lib/domain/calendario";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import { MINUTO } from "@/lib/domain/plan-vivo/intervalos";
import type {
  BloqueFijo,
  Dependency,
  FranjaSemanal,
  Intervalo,
  PlanningWorkItem,
  PlanVivoBase,
  Plazo,
  RazonDePrioridad,
} from "@/lib/domain/plan-vivo/tipos";
import { DIAS_LARGOS } from "@/lib/content/es-AR";
import { diaDeSemana, fechaEnZona, instanteEnZona } from "@/lib/domain/zona";
import { rutaDeCtaCon } from "@/lib/navigation";
import { nodos } from "@/lib/navigation/surfaces";
import { proyectarCalendario, type InsumosDelCalendario } from "./proyeccion-calendario";

/**
 * **La base del Plan vivo** — [ADR-110](../../../docs/decisions.md#adr-110).
 *
 * Arma lo que el servidor sabe, en instantes absolutos, y **nada** de lo que el
 * estudiante movió: eso vive en su navegador. Pura, para poder probarla sin base.
 *
 * ## Tres reglas que no son obvias
 *
 * 1. **La `Action` viva es la única fila.** El resto del orden del ADE son
 *    candidatos (ADR-109 D-02 · A), y el tema de la acción viva no se repite.
 * 2. **Una evaluación sin hora no bloquea**: va como marca del día. Con hora,
 *    bloquea **60 minutos** desde su inicio — el schema no guarda duración, y
 *    es el bloqueo mínimo para no ubicar trabajo encima (supuesto de ADR-110).
 * 3. **Una `Action` que espera evidencia o está bloqueada no se planifica.** Su
 *    trabajo ya se hizo o espera otra cosa; un tema que depende de ella queda
 *    esperándola.
 */

export interface InsumosDelPlan {
  calendario: InsumosDelCalendario;
  disponibilidad: ReadonlyArray<{ dia: number; desde: string | null; hasta: string | null; minutos: number | null }>;
  contextos: ReadonlyArray<{ cursadaId: string; contexto: ContextoDelAde }>;
  accionesVivas: ReadonlyArray<{
    id: string;
    cursadaId: string;
    topicId: string | null;
    objetivo: string;
    estado: string;
    minutosMin: number | null;
    minutosMax: number | null;
    evidencia: string | null;
  }>;
  compromisosVivos: ReadonlyArray<{ id: string; actionId: string }>;
  compromisoConFocus: string | null;
}

export interface RepositorioDelPlan {
  insumos(institutionId: string, studentId: string, semana: string, hoy: string): Promise<InsumosDelPlan>;
}

export const MINUTOS_DE_BLOQUEO_DE_EVALUACION = 60;

const COMPROMETIBLE = new Set(["RECOMMENDED", "ACCEPTED"]);
const CON_HORARIO = new Set(["COMMITTED", "IN_PROGRESS"]);

const idDeAccion = (id: string) => `action:${id}`;
const idDeCandidato = (cursada: string, tema: string) => `candidato:${cursada}:${tema}`;

const TEXTO_DE_SENAL: Readonly<Record<Exclude<CandidatoDelAde["senales"][number], "EVALUACION">, string>> = {
  SIN_PRACTICA: "Todavía no registraste práctica en esta unidad.",
  RECENCIA: "Todavía no la trabajaste.",
  PESO: "Es de las unidades que más tiempo piden en la materia.",
};

function rango(min: number | null, max: number | null) {
  if (min === null || max === null || min <= 0 || max < min) return null;
  return { minMinutes: min, likelyMinutes: Math.round((min + max) / 2 / 5) * 5, maxMinutes: max };
}

/**
 * Lo que suma la semana al orden del ADE — [ADR-110 · Enmienda 5](../../../docs/decisions.md#adr-110-enmienda-5).
 *
 * **Por materia**: todos los trabajos de una materia reciben lo mismo, así que
 * el orden del ADE adentro de la materia no cambia (el plan no contradice a
 * Hoy). Entre materias, adelanta la que tiene la evaluación más cerca, clase
 * pronto o un riesgo que Hoy ya muestra. Los pesos están por debajo de la
 * señal de evaluación del ADE (`1000`) sumada a su cercanía: entrar en un
 * parcial próximo sigue siendo lo que más pesa.
 */
export const URGENCIA_SEMANAL = {
  /** Evaluación a `horizonteDias` o menos: hasta `evaluacion`, lineal con la cercanía. */
  horizonteDias: 21,
  evaluacion: 800,
  /** Clase en los próximos 7 días: hasta `clase`, lineal con la cercanía. */
  clase: 150,
  /** Hoy muestra un riesgo de la materia. */
  riesgo: 400,
  /** Trabajo a esta distancia o más de lo que se puede hacer ya **no se genera**. */
  distanciaMaxima: 2,
} as const;

const DIA_MS = 86_400_000;

function cuandoEs(dias: number): string {
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  return `en ${dias} días`;
}

/**
 * Qué tan lejos está un trabajo de poder hacerse **por prerrequisitos
 * declarados**: `0` sin prerrequisitos pendientes, `1` si espera a uno que ya
 * se puede hacer, y así.
 */
function distancias(items: readonly PlanningWorkItem[]): Map<string, number> {
  const porId = new Map(items.map((x) => [x.id, x]));
  const memo = new Map<string, number>();
  const de = (id: string, visitando: Set<string>): number => {
    const hecho = memo.get(id);
    if (hecho !== undefined) return hecho;
    const item = porId.get(id);
    if (!item || visitando.has(id)) return 0;
    visitando.add(id);
    let d = 0;
    for (const dep of item.dependencies) {
      if (dep.itemId === null) continue;
      d = Math.max(d, 1 + (porId.has(dep.itemId) ? de(dep.itemId, visitando) : 0));
    }
    visitando.delete(id);
    memo.set(id, d);
    return d;
  };
  for (const x of items) de(x.id, new Set());
  return memo;
}

export function armarBaseDelPlan(
  i: InsumosDelPlan,
  ahoraIso: string,
  zona: string,
  semana: string,
  riesgos: ReadonlyMap<string, string> = new Map(),
): PlanVivoBase {
  const ahora = Date.parse(ahoraIso);
  const hasta = sumarDias(semana, 6);
  const fechas = fechasEntre(semana, hasta);
  const horizonte: Intervalo = {
    ini: instanteEnZona(semana, "00:00", zona),
    fin: instanteEnZona(sumarDias(semana, 7), "00:00", zona),
  };
  const nombre = new Map(i.calendario.materias.map((m) => [m.cursadaId, nombreDeObjeto(m.nombre)]));

  // ── Disponibilidad ──────────────────────────────────────────────────────────
  const disponibilidad: Intervalo[] = [];
  for (const fecha of fechas) {
    for (const f of i.disponibilidad) {
      if (f.dia !== diaDeSemana(fecha) || !f.desde || !f.hasta) continue;
      disponibilidad.push({ ini: instanteEnZona(fecha, f.desde, zona), fin: instanteEnZona(fecha, f.hasta, zona) });
    }
  }
  const disponibilidadSemanal: FranjaSemanal[] = i.disponibilidad.map((f) => ({
    dia: f.dia,
    desde: f.desde ? f.desde.slice(0, 5) : null,
    hasta: f.hasta ? f.hasta.slice(0, 5) : null,
    minutos: f.minutos ?? 0,
  }));

  // ── Trabajo ─────────────────────────────────────────────────────────────────
  const accionDeCompromiso = new Map(i.compromisosVivos.map((c) => [c.actionId, c.id]));
  const items: PlanningWorkItem[] = [];
  const evaluacionesConHora = i.calendario.evaluaciones;

  for (const { cursadaId, contexto } of i.contextos) {
    const materia = nombre.get(cursadaId);
    if (!materia) continue;
    const ctx = { ...contexto, ahora: ahoraIso, hayAccionViva: false };
    const candidatos = candidatosDelAde(ctx);
    const nombreDeTema = new Map(ctx.unidades.map((u) => [u.topicId, u.nombre]));
    const viva = i.accionesVivas.find((a) => a.cursadaId === cursadaId) ?? null;
    const planificable = viva && (COMPROMETIBLE.has(viva.estado) || CON_HORARIO.has(viva.estado)) ? viva : null;

    const plazo = (): Plazo | null => {
      const ev = ctx.proximaEvaluacion;
      if (!ev?.fecha) return null;
      const conHora = evaluacionesConHora.find((e) => e.cursadaId === cursadaId && e.fecha === ev.fecha && e.hora);
      return {
        instante: instanteEnZona(ev.fecha, conHora?.hora ?? "00:00", zona),
        evaluacionId: conHora?.id ?? `${cursadaId}:${ev.fecha}`,
        titulo: ev.titulo,
      };
    };
    const itemDeTema = (topicId: string): string | null => {
      if (viva?.topicId === topicId) return idDeAccion(viva.id);
      return candidatos.some((c) => c.topicId === topicId) ? idDeCandidato(cursadaId, topicId) : null;
    };
    const dependencias = (c: CandidatoDelAde | undefined): Dependency[] =>
      (c?.requiere ?? []).map((t) => ({
        topicId: t,
        itemId: itemDeTema(t) ?? `pendiente:${t}`,
        kind: "HARD",
        reason: nombreDeTema.get(t) ?? "otra unidad",
        source: { tipo: "topic_prerequisite", id: t },
      }));
    const razones = (c: CandidatoDelAde): RazonDePrioridad[] =>
      c.senales.map((s) =>
        s === "EVALUACION"
          ? { tipo: "EVALUACION", texto: `Entra en ${ctx.proximaEvaluacion?.titulo}.`, fuente: { tipo: "assessment", id: null } }
          : { tipo: s, texto: TEXTO_DE_SENAL[s], fuente: { tipo: s === "PESO" ? "topic" : "topic_progress", id: c.topicId } },
      );

    const primero = candidatos[0];
    if (planificable) {
      const c = candidatos.find((x) => x.topicId === planificable.topicId);
      items.push({
        id: idDeAccion(planificable.id),
        sourceType: "ACTION",
        actionId: planificable.id,
        cursadaId,
        materia,
        topicId: planificable.topicId,
        tema: planificable.topicId ? (nombreDeTema.get(planificable.topicId) ?? null) : null,
        title: planificable.objetivo,
        durationRange: rango(planificable.minutosMin, planificable.minutosMax),
        // La acción viva es la que el ADE eligió primero: nada de su cursada le gana.
        costo: c?.costo ?? (primero ? primero.costo + 1 : 0),
        priority: c ? { principal: c.razon, razones: razones(c) } : { principal: "Es tu acción de esta materia.", razones: [] },
        dependencies: dependencias(c),
        deadline: c?.entraEnEvaluacion ? plazo() : null,
        expectedEvidence: planificable.evidencia,
        commitmentId: accionDeCompromiso.get(planificable.id) ?? null,
        comprometible: COMPROMETIBLE.has(planificable.estado),
      });
    }
    for (const c of candidatos) {
      if (c.topicId === viva?.topicId) continue;
      items.push({
        id: idDeCandidato(cursadaId, c.topicId),
        sourceType: "CANDIDATO",
        actionId: null,
        cursadaId,
        materia,
        topicId: c.topicId,
        tema: c.nombre,
        title: c.nombre,
        durationRange: rango(c.minutosMin, c.minutosMax),
        costo: c.costo,
        priority: { principal: c.razon, razones: razones(c) },
        dependencies: dependencias(c),
        deadline: c.entraEnEvaluacion ? plazo() : null,
        expectedEvidence: null,
        commitmentId: null,
        comprometible: false,
      });
    }
  }

  // ── Lo fijo ─────────────────────────────────────────────────────────────────
  const vista = proyectarCalendario(i.calendario, semana, hasta, ahoraIso, zona);
  const itemDeCompromiso = new Map(
    i.compromisosVivos.map((c) => [c.id, idDeAccion(c.actionId)]),
  );
  // Con los ids de **todos** los trabajos: el recorte por distancia viene después
  // y nunca saca uno comprometido (la acción viva es siempre `ACTION`).
  const idsDeItems = new Set(items.map((x) => x.id));
  const fijos: BloqueFijo[] = [];
  const evaluacionesDelDia: Array<PlanVivoBase["evaluacionesDelDia"][number]> = [];
  for (const e of vista.eventos) {
    if (e.tipo === "evaluacion") {
      if (!e.desde) {
        evaluacionesDelDia.push({ id: e.id, fecha: e.fecha, titulo: e.titulo, cursadaId: e.cursadaId });
        continue;
      }
      const ini = instanteEnZona(e.fecha, e.desde, zona);
      fijos.push({ ...comun(e), ini, fin: ini + MINUTOS_DE_BLOQUEO_DE_EVALUACION * MINUTO, tipo: "EVALUACION", itemId: null, estado: null });
      continue;
    }
    if (!e.desde || !e.hasta) continue;
    const franja = { ini: instanteEnZona(e.fecha, e.desde, zona), fin: instanteEnZona(e.fecha, e.hasta, zona) };
    if (e.tipo === "clase") {
      fijos.push({ ...comun(e), ...franja, tipo: "CLASE", itemId: null, estado: null, estimado: !!e.estimado });
      continue;
    }
    // Compromiso: vivo si todavía se puede cumplir; historia si ya pasó su suerte.
    const compromisoId = e.enlace.a === "compromiso" ? e.enlace.compromisoId : null;
    const itemId = compromisoId ? (itemDeCompromiso.get(compromisoId) ?? null) : null;
    const vivo = e.estado === "PENDIENTE" || e.estado === "EN_CURSO";
    const conFocus = compromisoId !== null && compromisoId === i.compromisoConFocus;
    fijos.push({
      ...comun(e),
      ...franja,
      tipo: !vivo ? "HISTORIA" : conFocus ? "FOCUS" : "COMPROMISO",
      itemId: vivo && itemId && idsDeItems.has(itemId) ? itemId : null,
      estado: e.detalle,
    });
  }

  // ── La semana: urgencia por materia y recorte de lo lejano (Enm. 5) ──────────
  const hoy = fechaEnZona(ahora, zona);
  const U = URGENCIA_SEMANAL;
  const urgenciaDe = new Map<string, { puntos: number; razones: RazonDePrioridad[] }>();
  for (const { cursadaId, contexto } of i.contextos) {
    const razones: RazonDePrioridad[] = [];
    let puntos = 0;
    const ev = contexto.proximaEvaluacion;
    if (ev?.fecha) {
      const dias = Math.round((Date.parse(ev.fecha) - Date.parse(hoy)) / DIA_MS);
      if (dias >= 0 && dias <= U.horizonteDias) {
        puntos += Math.round((U.evaluacion * (U.horizonteDias - dias)) / U.horizonteDias);
        razones.push({ tipo: "EVALUACION_CERCA", texto: `${ev.titulo} es ${cuandoEs(dias)}.`, fuente: { tipo: "assessment", id: null } });
      }
    }
    const clase = fijos
      .filter((f) => f.tipo === "CLASE" && f.cursadaId === cursadaId && f.ini > ahora)
      .sort((a, b) => a.ini - b.ini)[0];
    if (clase) {
      const dias = Math.round((Date.parse(fechaEnZona(clase.ini, zona)) - Date.parse(hoy)) / DIA_MS);
      if (dias < 7) {
        puntos += Math.round((U.clase * (7 - dias)) / 7);
        const cuando = dias <= 1 ? cuandoEs(dias) : `el ${DIAS_LARGOS[diaDeSemana(fechaEnZona(clase.ini, zona))]}`;
        razones.push({ tipo: "CLASE_CERCA", texto: `Tenés clase ${cuando}.`, fuente: { tipo: "class_session", id: clase.id } });
      }
    }
    const riesgo = riesgos.get(cursadaId);
    if (riesgo) {
      puntos += U.riesgo;
      razones.push({ tipo: "RIESGO", texto: riesgo, fuente: { tipo: "planning_risk", id: cursadaId } });
    }
    urgenciaDe.set(cursadaId, { puntos, razones });
  }
  const lejos = distancias(items);
  /*
    ⚠️ **El orden del programa también es distancia** (Enm. 5, el owner: *«sí,
    el orden cuenta como distancia»*): cuántas unidades **anteriores** de la
    misma materia siguen pendientes. *Unidad 3 sin haber hecho la 1 ni la 2* está
    a 2. **Es distancia, no dependencia**: no crea `Dependency` (ADR-110 sigue
    diciendo que una dependencia nunca sale del número de unidad) y el ADE no lo
    lee.

    Lo que entra en la próxima evaluación **no** se recorta por orden: el parcial
    lo pide ahora, sea la unidad que sea.
  */
  const ordenDe = new Map<string, number | null>();
  for (const { cursadaId, contexto } of i.contextos) {
    for (const u of contexto.unidades) ordenDe.set(`${cursadaId}:${u.topicId}`, u.orden);
  }
  const orden = (x: PlanningWorkItem) => (x.topicId ? (ordenDe.get(`${x.cursadaId}:${x.topicId}`) ?? null) : null);
  const porOrden = (x: PlanningWorkItem): number => {
    const n = orden(x);
    if (n === null || x.deadline) return 0;
    return items.filter((y) => y.cursadaId === x.cursadaId && y.id !== x.id && (orden(y) ?? Infinity) < n).length;
  };
  const semanales = items
    .filter((x) => x.sourceType === "ACTION" || Math.max(lejos.get(x.id) ?? 0, porOrden(x)) < U.distanciaMaxima)
    .map((x): PlanningWorkItem => {
      const u = urgenciaDe.get(x.cursadaId);
      if (!u || u.puntos === 0) return x;
      return { ...x, urgencia: u.puntos, priority: { ...x.priority, razones: [...u.razones, ...x.priority.razones] } };
    });

  return {
    ahora,
    zona,
    semana,
    horizonte,
    disponibilidad,
    disponibilidadSemanal,
    fijos,
    items: semanales,
    materias: i.calendario.materias.map((m) => ({ cursadaId: m.cursadaId, nombre: nombreDeObjeto(m.nombre) })),
    evaluacionesDelDia,
  };
}

function comun(e: ReturnType<typeof proyectarCalendario>["eventos"][number]) {
  return {
    id: e.id,
    titulo: e.titulo,
    cursadaId: e.cursadaId,
    estimado: false,
    enlace: enlaceDe(e),
  };
}

/** La misma regla que el Calendario (ADR-100): cada bloque lleva a su objeto. */
function enlaceDe(e: ReturnType<typeof proyectarCalendario>["eventos"][number]): string | null {
  const l = e.enlace;
  if (l.a === "materia") return rutaDeCtaCon("CTA-001", l.cursadaId);
  if (l.a === "clase") {
    const base = nodos.CLASE.ruta;
    return base ? (l.activa ? base : `${base}?clase=${encodeURIComponent(l.claseId)}`) : null;
  }
  const base = nodos.UX04.ruta;
  return base ? `${base}?compromiso=${encodeURIComponent(l.compromisoId)}` : null;
}
