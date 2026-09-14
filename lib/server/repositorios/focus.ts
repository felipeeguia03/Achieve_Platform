import "server-only";

import type { ActionStatus, CommitmentState } from "@/lib/domain/types";
import type { EstadoDeSesion, Tramo } from "@/lib/domain/sesion-de-focus";
import type {
  CompromisoParaFocus,
  Escritura,
  Preferencias,
  RepositorioDeFocus,
  SesionFila,
} from "../servicios/focus";
import { clienteDeServicio } from "../supabase";

/**
 * **Modo Focus** contra Postgres — [ADR-104](../../../docs/decisions.md#adr-104).
 *
 * ⚠️ **El `institution_id` y el estudiante van en el `WHERE`** (I11): la sesión
 * ajena no se lee y después se descarta — no se lee. Para quien pregunta, **no
 * existe**, y la ruta contesta `404`.
 *
 * ⚠️ **Las escrituras de un comando van por `aplicar_comando_de_focus()`**, que
 * escribe todo o nada. Un `update` suelto acá dejaría un tramo cerrado sin su
 * siguiente si el pedido se corta en el medio.
 */

const COLUMNAS_SESION =
  "id, student_id, course_enrollment_id, action_id, commitment_id, scheduled_start_at, planned_minutes, status, mode, " +
  "pomodoro_focus_minutes, pomodoro_short_break_minutes, pomodoro_long_break_minutes, pomodoro_blocks_before_long, " +
  "started_at, last_heartbeat_at, ended_at, end_kind, advance_text, scratchpad, scratchpad_updated_at, version";
const COLUMNAS_TRAMO = "id, kind, mode, block_number, break_kind, started_at, planned_end_at, ended_at, end_reason";

/** Los compromisos sobre los que se puede trabajar, en orden de preferencia (ADR-104 §4). */
const VIVOS = ["STARTED", "DUE", "CONFIRMED"];
const ACCIONES_TERMINADAS = ["COMPLETED", "CANCELLED", "REPLACED"];

/** Postgres devuelve `timestamptz` como `2026-09-13T21:00:00+00:00`; el dominio compara ISO. */
const instante = (v: unknown): string => new Date(v as string).toISOString();
const instanteONulo = (v: unknown): string | null => (v === null || v === undefined ? null : instante(v));

function aTramo(f: Record<string, unknown>): Tramo {
  return {
    id: f.id as string,
    tipo: f.kind as Tramo["tipo"],
    modo: (f.mode as Tramo["modo"]) ?? null,
    bloque: (f.block_number as number | null) ?? null,
    descanso: (f.break_kind as Tramo["descanso"]) ?? null,
    inicio: instante(f.started_at),
    finPlaneado: instanteONulo(f.planned_end_at),
    fin: instanteONulo(f.ended_at),
    motivo: (f.end_reason as Tramo["motivo"]) ?? null,
  };
}

function aSesion(f: Record<string, unknown>, tramos: Tramo[]): SesionFila {
  const pomodoro =
    f.mode === "POMODORO"
      ? {
          foco: f.pomodoro_focus_minutes as number,
          descansoCorto: f.pomodoro_short_break_minutes as number,
          descansoLargo: f.pomodoro_long_break_minutes as number,
          bloquesAntesDelLargo: f.pomodoro_blocks_before_long as number,
        }
      : null;
  const sesion: EstadoDeSesion = {
    estado: f.status as EstadoDeSesion["estado"],
    modo: f.mode as EstadoDeSesion["modo"],
    pomodoro,
    iniciadaEn: instante(f.started_at),
    ultimoLatido: instante(f.last_heartbeat_at),
    terminadaEn: instanteONulo(f.ended_at),
    tramos,
  };
  return {
    id: f.id as string,
    studentId: f.student_id as string,
    cursadaId: f.course_enrollment_id as string,
    accionId: f.action_id as string,
    compromisoId: f.commitment_id as string,
    horarioAcordado: instante(f.scheduled_start_at),
    minutosAcordados: f.planned_minutes as number,
    version: f.version as number,
    cierre: (f.end_kind as SesionFila["cierre"]) ?? null,
    avance: (f.advance_text as string | null) ?? null,
    anotador: (f.scratchpad as string | null) ?? null,
    anotadorGuardadoEn: instanteONulo(f.scratchpad_updated_at),
    sesion,
  };
}

async function conTramos(institutionId: string, fila: Record<string, unknown> | null): Promise<SesionFila | null> {
  if (!fila) return null;
  const { data, error } = await clienteDeServicio()
    .from("focus_segment")
    .select(COLUMNAS_TRAMO)
    .eq("institution_id", institutionId)
    .eq("focus_session_id", fila.id as string)
    .order("started_at", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`No se pudieron leer los tramos: ${error.message}`);
  return aSesion(fila, ((data ?? []) as unknown as Array<Record<string, unknown>>).map(aTramo));
}

/** El compromiso con su acción, **sólo si la cursada de la acción es del estudiante**. */
async function compromisoConAccion(
  institutionId: string,
  studentId: string,
  compromisoId: string,
): Promise<CompromisoParaFocus | null> {
  const db = clienteDeServicio();
  const { data, error } = await db
    .from("commitment")
    .select("id, state, start_at, planned_minutes, action_id")
    .eq("institution_id", institutionId)
    .eq("id", compromisoId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el compromiso: ${error.message}`);
  const c = data as Record<string, unknown> | null;
  if (!c) return null;

  const accion = await db
    .from("action")
    .select("id, status, course_enrollment_id, course_enrollment:course_enrollment_id!inner(student_id)")
    .eq("institution_id", institutionId)
    .eq("id", c.action_id as string)
    .maybeSingle();
  if (accion.error) throw new Error(`No se pudo leer la acción: ${accion.error.message}`);
  const a = accion.data as unknown as {
    id: string;
    status: ActionStatus;
    course_enrollment_id: string;
    course_enrollment: { student_id: string } | Array<{ student_id: string }>;
  } | null;
  const duenio = Array.isArray(a?.course_enrollment) ? a?.course_enrollment[0]?.student_id : a?.course_enrollment?.student_id;
  if (!a || duenio !== studentId) return null;

  return {
    id: c.id as string,
    studentId,
    cursadaId: a.course_enrollment_id,
    accionId: a.id,
    estado: c.state as CommitmentState,
    estadoDeAccion: a.status,
    inicio: instante(c.start_at),
    minutos: c.planned_minutes as number,
  };
}

export const focusReal: RepositorioDeFocus = {
  compromisoDelEstudiante(institutionId, studentId, compromisoId) {
    return compromisoConAccion(institutionId, studentId, compromisoId);
  },

  async compromisoVigente(institutionId, studentId, cursadaId) {
    const db = clienteDeServicio();
    let cursadas = db
      .from("course_enrollment")
      .select("id")
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .eq("status", "active");
    if (cursadaId) cursadas = cursadas.eq("id", cursadaId);
    const { data: filas, error } = await cursadas;
    if (error) throw new Error(`No se pudieron leer las cursadas: ${error.message}`);
    const ids = ((filas ?? []) as Array<{ id: string }>).map((c) => c.id);
    if (ids.length === 0) return null;

    const acciones = await db
      .from("action")
      .select("id")
      .eq("institution_id", institutionId)
      .in("course_enrollment_id", ids)
      .not("status", "in", `(${ACCIONES_TERMINADAS.join(",")})`);
    if (acciones.error) throw new Error(`No se pudieron leer las acciones: ${acciones.error.message}`);
    const accionIds = ((acciones.data ?? []) as Array<{ id: string }>).map((a) => a.id);
    if (accionIds.length === 0) return null;

    const vivos = await db
      .from("commitment")
      .select("id, state, start_at")
      .eq("institution_id", institutionId)
      .in("action_id", accionIds)
      .in("state", VIVOS);
    if (vivos.error) throw new Error(`No se pudieron leer los compromisos: ${vivos.error.message}`);
    // El que ya empezó, después el que llegó su hora, después el acordado; y a
    // igualdad, el más reciente. **Determinista**: no depende de desempates de
    // `created_at`, que el alta escribe iguales para todas las cursadas.
    const elegido = ((vivos.data ?? []) as Array<{ id: string; state: string; start_at: string }>).sort(
      (x, y) => VIVOS.indexOf(x.state) - VIVOS.indexOf(y.state) || y.start_at.localeCompare(x.start_at),
    )[0];
    return elegido ? compromisoConAccion(institutionId, studentId, elegido.id) : null;
  },

  async abierta(institutionId, studentId) {
    const { data, error } = await clienteDeServicio()
      .from("focus_session")
      .select(COLUMNAS_SESION)
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .eq("status", "OPEN")
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer la sesión abierta: ${error.message}`);
    return conTramos(institutionId, data as Record<string, unknown> | null);
  },

  async delEstudiante(institutionId, studentId, sesionId) {
    const { data, error } = await clienteDeServicio()
      .from("focus_session")
      .select(COLUMNAS_SESION)
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .eq("id", sesionId)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer la sesión: ${error.message}`);
    return conTramos(institutionId, data as Record<string, unknown> | null);
  },

  async crear(institutionId, c, ahora) {
    const { data, error } = await clienteDeServicio().rpc("empezar_sesion_de_focus", {
      p_institution_id: institutionId,
      p_student_id: c.studentId,
      p_course_enrollment_id: c.cursadaId,
      p_action_id: c.accionId,
      p_commitment_id: c.id,
      p_scheduled_start_at: c.inicio,
      p_planned_minutes: c.minutos,
      p_ahora: ahora,
    });
    if (error) throw new Error(`No se pudo empezar la sesión: ${error.message}`);
    return (data as string | null) ?? null;
  },

  async aplicar(institutionId, sesionId, version, e: Escritura) {
    const { data, error } = await clienteDeServicio().rpc("aplicar_comando_de_focus", {
      p_institution_id: institutionId,
      p_session_id: sesionId,
      p_version: version,
      p_sesion: e.sesion,
      p_cerrar: e.cerrar,
      p_abrir: e.abrir,
    });
    if (error) throw new Error(`No se pudo aplicar el comando: ${error.message}`);
    return (data as number | null) ?? null;
  },

  async guardarAnotador(institutionId, sesionId, texto, ahora) {
    const { error } = await clienteDeServicio()
      .from("focus_session")
      .update({ scratchpad: texto, scratchpad_updated_at: ahora })
      .eq("institution_id", institutionId)
      .eq("id", sesionId);
    if (error) throw new Error(`No se pudo guardar el anotador: ${error.message}`);
  },

  async preferencias(institutionId, studentId) {
    const { data, error } = await clienteDeServicio()
      .from("focus_preference")
      .select("*")
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .maybeSingle();
    if (error) throw new Error(`No se pudieron leer las preferencias: ${error.message}`);
    const f = data as Record<string, unknown> | null;
    if (!f) return null;
    return {
      ultimoModo: f.last_mode as Preferencias["ultimoModo"],
      preset: (f.preset as Preferencias["preset"]) ?? null,
      personalizado:
        f.custom_focus_minutes === null
          ? null
          : {
              foco: f.custom_focus_minutes as number,
              descansoCorto: f.custom_short_break_minutes as number,
              descansoLargo: f.custom_long_break_minutes as number,
              bloquesAntesDelLargo: f.custom_blocks_before_long as number,
            },
      sonido: f.sound as Preferencias["sonido"],
      volumen: f.volume as number,
    };
  },

  async guardarPreferencias(institutionId, studentId, p, ahora) {
    const { error } = await clienteDeServicio()
      .from("focus_preference")
      .upsert(
        {
          student_id: studentId,
          institution_id: institutionId,
          last_mode: p.ultimoModo,
          preset: p.preset,
          custom_focus_minutes: p.personalizado?.foco ?? null,
          custom_short_break_minutes: p.personalizado?.descansoCorto ?? null,
          custom_long_break_minutes: p.personalizado?.descansoLargo ?? null,
          custom_blocks_before_long: p.personalizado?.bloquesAntesDelLargo ?? null,
          sound: p.sonido,
          volume: p.volumen,
          updated_at: ahora,
        },
        { onConflict: "student_id" },
      );
    if (error) throw new Error(`No se pudieron guardar las preferencias: ${error.message}`);
  },
};

/** Lo que la pantalla dice arriba: materia, acción y unidad. **Cada una `null` si no se sabe.** */
export async function contextoDeFocus(
  institutionId: string,
  accionId: string,
): Promise<{ materia: string | null; accion: string | null; unidad: string | null }> {
  const { data, error } = await clienteDeServicio()
    .from("action")
    .select("objective, topic:topic_id(name), course_enrollment:course_enrollment_id(oferta:offering_id(course:course_id(name)))")
    .eq("institution_id", institutionId)
    .eq("id", accionId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el contexto de la sesión: ${error.message}`);
  type Uno<T> = T | T[] | null;
  const uno = <T>(x: Uno<T>): T | null => (Array.isArray(x) ? (x[0] ?? null) : x);
  const f = data as unknown as {
    objective: string | null;
    topic: Uno<{ name: string }>;
    course_enrollment: Uno<{ oferta: Uno<{ course: Uno<{ name: string }> }> }>;
  } | null;
  if (!f) return { materia: null, accion: null, unidad: null };
  return {
    materia: uno(uno(uno(f.course_enrollment)?.oferta ?? null)?.course ?? null)?.name ?? null,
    accion: f.objective,
    unidad: uno(f.topic)?.name ?? null,
  };
}
