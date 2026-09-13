import { diasEntre, fechasDelBloque } from "@/lib/domain/calendario";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import { fechaEnZona } from "@/lib/domain/zona";
import type {
  CalendarioProps,
  EstadoDeCompromisoEnCalendario,
  EventoDeCalendario,
} from "@/lib/domain/view-models";
import type { BloqueDeCursada } from "./proyeccion-materias";
import { modalidadVisible } from "./proyeccion-materia";
import { fechaDeCalendario, horaCorta } from "./tiempo";

/**
 * El calendario del estudiante — [ADR-100](../../../docs/decisions.md#adr-100).
 *
 * Junta tres cosas que ya existen, **sin crear ninguna**: el horario semanal de
 * cursada, las evaluaciones con fecha y los compromisos que el estudiante tomó.
 *
 * ## Lo que esta proyección tiene prohibido
 *
 * 1. **Agendar.** No propone bloques de estudio ni huecos: el ADE no agenda
 *    (ADR-064) y un bloque que Achieve dibuja por su cuenta se leería como un
 *    compromiso que nadie tomó.
 * 2. **Inventar una hora.** Una evaluación sin `assessment_time` va **sin hora**,
 *    arriba del día. Sin fecha, no aparece: no hay dónde ponerla.
 * 3. **Hacer parecer cumplido un incumplido.** `MISSED` y `CLOSED` se leen
 *    *incumplido*; `RENEGOTIATED` no se dibuja porque lo reemplaza el nuevo, y
 *    dibujar los dos contaría el mismo trabajo dos veces.
 * 4. **Leer la clase dictada como horario.** Los bloques salen de
 *    `horariosReal.deCursadas()`, la misma lectura que Hoy y Materias (ADR-095).
 */

export interface InsumosDelCalendario {
  materias: ReadonlyArray<{ cursadaId: string; nombre: string }>;
  bloques: readonly BloqueDeCursada[];
  /** Las del rango **y visibles para este estudiante** (ADR-067: `declared_by`). */
  evaluaciones: ReadonlyArray<{
    id: string;
    cursadaId: string;
    tipo: string | null;
    titulo: string | null;
    /** `YYYY-MM-DD`. Sin fecha no llega: la lectura ya la dejó afuera. */
    fecha: string;
    /** `HH:MM:SS` o `null`. */
    hora: string | null;
    modalidad: string | null;
  }>;
  /** `YYYY-MM-DD` de la próxima evaluación desde hoy, o `null`. */
  proximaEvaluacion: string | null;
  compromisos: ReadonlyArray<{
    id: string;
    cursadaId: string;
    /** ISO. */
    inicio: string;
    minutos: number;
    estado: string;
    titulo: string;
  }>;
  /** Las clases que el estudiante abrió (`student_class_session`), para enlazar su bloque. */
  clasesAbiertas: ReadonlyArray<{
    id: string;
    cursadaId: string;
    /** ISO. */
    iniciadaEn: string;
    estado: "ACTIVE" | "ENDED";
    bloqueId: string | null;
  }>;
}

export interface RepositorioDeCalendario {
  insumos(
    institutionId: string,
    studentId: string,
    desde: string,
    hasta: string,
    hoy: string,
  ): Promise<InsumosDelCalendario>;
}

/** Los estados que se dibujan, y cómo se leen. Ausente ⇒ no se dibuja. */
const ESTADO_VISIBLE: Readonly<Record<string, EstadoDeCompromisoEnCalendario>> = {
  CONFIRMED: "PENDIENTE",
  DUE: "PENDIENTE",
  STARTED: "EN_CURSO",
  COMPLETED: "CUMPLIDO",
  MISSED: "INCUMPLIDO",
  CLOSED: "INCUMPLIDO",
};

const TEXTO_DE_ESTADO: Readonly<Record<EstadoDeCompromisoEnCalendario, string | null>> = {
  // Pendiente es lo esperable de un compromiso a futuro: decirlo en cada chip es ruido.
  PENDIENTE: null,
  EN_CURSO: "en curso",
  CUMPLIDO: "cumplido",
  INCUMPLIDO: "incumplido",
};

const TIPO_VISIBLE: Readonly<Record<string, string>> = {
  parcial: "Parcial",
  final: "Final",
  tp: "Trabajo práctico",
  entrega: "Entrega",
  coloquio: "Coloquio",
};

export function proyectarCalendario(
  i: InsumosDelCalendario,
  desde: string,
  hasta: string,
  ahora: string,
  zona: string,
): CalendarioProps {
  const hoy = fechaEnZona(Date.parse(ahora), zona);
  const nombre = new Map(i.materias.map((m) => [m.cursadaId, nombreDeObjeto(m.nombre)]));
  const eventos: EventoDeCalendario[] = [];

  // ── Clases: el horario semanal, sobre cada fecha del rango ──────────────────
  const bloques = i.bloques.filter((b) => nombre.has(b.cursadaId));
  for (const b of bloques) {
    for (const fecha of fechasDelBloque(b.dia, desde, hasta)) {
      /*
        ⚠️ **La clase abierta se busca por fecha y cursada, no sólo por bloque.**
        Una clase iniciada a mano tiene `bloqueId` nulo (ADR-098) y sigue siendo
        la clase de ese día. Si hay una del mismo bloque, gana ésa.
      */
      const delDia = i.clasesAbiertas.filter(
        (c) => c.cursadaId === b.cursadaId && fechaEnZona(Date.parse(c.iniciadaEn), zona) === fecha,
      );
      const abierta = delDia.find((c) => b.bloqueId && c.bloqueId === b.bloqueId) ?? delDia[0];
      eventos.push({
        id: `clase:${b.bloqueId ?? `${b.cursadaId}-${b.dia}-${b.desde}`}:${fecha}`,
        tipo: "clase",
        fecha,
        desde: b.desde.slice(0, 5),
        hasta: b.hasta.slice(0, 5),
        titulo: nombre.get(b.cursadaId) as string,
        detalle: b.aula,
        cursadaId: b.cursadaId,
        enlace: abierta
          ? { a: "clase", claseId: abierta.id, activa: abierta.estado === "ACTIVE" }
          : { a: "materia", cursadaId: b.cursadaId },
        estimado: b.estimada,
      });
    }
  }

  // ── Evaluaciones ────────────────────────────────────────────────────────────
  for (const e of i.evaluaciones) {
    const materia = nombre.get(e.cursadaId);
    if (!materia || e.fecha < desde || e.fecha > hasta) continue;
    // El título declarado manda; sin título, el tipo. Sin ninguno, sólo la materia:
    // ponerle «Examen» sería inventarle un nombre.
    const instancia = e.titulo?.trim() || (e.tipo ? (TIPO_VISIBLE[e.tipo] ?? null) : null);
    eventos.push({
      id: `evaluacion:${e.id}`,
      tipo: "evaluacion",
      fecha: e.fecha,
      desde: e.hora ? e.hora.slice(0, 5) : null,
      hasta: null,
      titulo: instancia ? `${instancia} · ${materia}` : materia,
      detalle: modalidadVisible(e.modalidad),
      cursadaId: e.cursadaId,
      enlace: { a: "materia", cursadaId: e.cursadaId },
    });
  }

  // ── Compromisos ─────────────────────────────────────────────────────────────
  for (const c of i.compromisos) {
    const estado = ESTADO_VISIBLE[c.estado];
    const fecha = fechaEnZona(Date.parse(c.inicio), zona);
    if (!estado || !nombre.has(c.cursadaId) || fecha < desde || fecha > hasta) continue;
    const fin = new Date(Date.parse(c.inicio) + c.minutos * 60_000).toISOString();
    eventos.push({
      id: `compromiso:${c.id}`,
      tipo: "compromiso",
      fecha,
      desde: horaCorta(c.inicio, zona),
      // Un compromiso que cruza la medianoche no se estira al día siguiente: se
      // corta a fin de día en la grilla, y el horario real está en su pantalla.
      hasta: fechaEnZona(Date.parse(fin), zona) === fecha ? horaCorta(fin, zona) : "23:59",
      titulo: c.titulo,
      detalle: [nombre.get(c.cursadaId), TEXTO_DE_ESTADO[estado]].filter(Boolean).join(" · ") || null,
      cursadaId: c.cursadaId,
      enlace: { a: "compromiso", compromisoId: c.id },
      estado,
    });
  }

  eventos.sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
    // Sin hora primero: es lo que ocupa el día entero.
    if (a.desde !== b.desde) return a.desde === null ? -1 : b.desde === null ? 1 : a.desde < b.desde ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });

  return {
    hoy,
    fechaDeHoy: fechaDeCalendario(hoy),
    desde,
    hasta,
    eventos,
    proximaEvaluacionEnDias: i.proximaEvaluacion === null ? null : diasEntre(hoy, i.proximaEvaluacion),
    horarioEstimado: eventos.some((e) => e.tipo === "clase" && e.estimado),
  };
}
