import "server-only";

import type { ClaseFila, MarcaFila, RepositorioDeClases } from "../servicios/clase";
import type { ContextoDeClase } from "../servicios/proyeccion-clase";
import { clienteDeServicio } from "../supabase";

/**
 * **Modo Clase** contra Postgres — [ADR-098](../../../docs/decisions.md#adr-098).
 *
 * ⚠️ **El `institution_id` y el estudiante van en el `WHERE`** (I11): una clase
 * ajena no se lee y después se descarta — no se lee. Para quien pregunta, la
 * clase de otro **no existe**, y la ruta contesta `404`.
 *
 * ⚠️ **No toca `class_session` para escribir.** La lee sólo para ubicar la unidad
 * de la clase (ADR-099 §8).
 */

/** La violación de unicidad de Postgres: la base ganó una carrera. */
const UNICIDAD = "23505";

const COLUMNAS_CLASE =
  "id, student_id, course_enrollment_id, class_schedule_block_id, scheduled_start, scheduled_end, status, started_at, ended_at";
const COLUMNAS_MARCA = "id, student_class_session_id, marker_type, elapsed_seconds, detail, idempotency_key, created_at";

function aClase(f: Record<string, unknown>): ClaseFila {
  return {
    id: f.id as string,
    studentId: f.student_id as string,
    cursadaId: f.course_enrollment_id as string,
    bloqueId: (f.class_schedule_block_id as string | null) ?? null,
    horarioDesde: (f.scheduled_start as string | null) ?? null,
    horarioHasta: (f.scheduled_end as string | null) ?? null,
    estado: f.status as ClaseFila["estado"],
    iniciadaEn: f.started_at as string,
    terminadaEn: (f.ended_at as string | null) ?? null,
  };
}

function aMarca(f: Record<string, unknown>): MarcaFila {
  return {
    id: f.id as string,
    claseId: f.student_class_session_id as string,
    tipo: f.marker_type as MarcaFila["tipo"],
    segundos: f.elapsed_seconds as number,
    texto: (f.detail as string | null) ?? null,
    clave: f.idempotency_key as string,
    creadaEn: f.created_at as string,
  };
}

const escrituras: RepositorioDeClases = {
  async cursadaPropia(institutionId, studentId, cursadaId) {
    const { data, error } = await clienteDeServicio()
      .from("course_enrollment")
      .select("id")
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .eq("id", cursadaId)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer la cursada: ${error.message}`);
    return data !== null;
  },

  async horarioDeBloque(institutionId, cursadaId, bloqueId) {
    // El bloque tiene que estar entre **los efectivos** de la cursada
    // (`bloques_de_cursada()`, ADR-105 §5), no sólo pertenecer a uno de sus
    // dueños: un horario que la precedencia descartó no abre una clase.
    const { data, error } = await clienteDeServicio().rpc("bloques_de_cursada", {
      p_course_enrollment_id: cursadaId,
    });
    if (error) throw new Error(`No se pudo leer el bloque: ${error.message}`);
    const b = ((data ?? []) as Array<{ id: string; institution_id: string; start_time: string; end_time: string }>).find(
      (x) => x.id === bloqueId && x.institution_id === institutionId,
    );
    return b ? { desde: b.start_time, hasta: b.end_time } : null;
  },

  async activa(institutionId, studentId) {
    const { data, error } = await clienteDeServicio()
      .from("student_class_session")
      .select(COLUMNAS_CLASE)
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .eq("status", "ACTIVE")
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer la clase activa: ${error.message}`);
    return data ? aClase(data) : null;
  },

  async delEstudiante(institutionId, studentId, claseId) {
    const { data, error } = await clienteDeServicio()
      .from("student_class_session")
      .select(COLUMNAS_CLASE)
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .eq("id", claseId)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer la clase: ${error.message}`);
    return data ? aClase(data) : null;
  },

  async crear(institutionId, datos) {
    const { data, error } = await clienteDeServicio()
      .from("student_class_session")
      .insert({
        institution_id: institutionId,
        student_id: datos.studentId,
        course_enrollment_id: datos.cursadaId,
        class_schedule_block_id: datos.bloqueId,
        scheduled_start: datos.desde,
        scheduled_end: datos.hasta,
      })
      .select(COLUMNAS_CLASE)
      .single();
    if (error?.code === UNICIDAD) return null;
    if (error) throw new Error(`No se pudo iniciar la clase: ${error.message}`);
    return aClase(data);
  },

  async terminar(institutionId, claseId, ahora) {
    // Compare-and-swap: el estado esperado va en el `WHERE`.
    const { data, error } = await clienteDeServicio()
      .from("student_class_session")
      .update({ status: "ENDED", ended_at: ahora })
      .eq("institution_id", institutionId)
      .eq("id", claseId)
      .eq("status", "ACTIVE")
      .select(COLUMNAS_CLASE)
      .maybeSingle();
    if (error) throw new Error(`No se pudo terminar la clase: ${error.message}`);
    return data ? aClase(data) : null;
  },

  async marcaPorClave(institutionId, claseId, clave) {
    const { data, error } = await clienteDeServicio()
      .from("class_marker")
      .select(COLUMNAS_MARCA)
      .eq("institution_id", institutionId)
      .eq("student_class_session_id", claseId)
      .eq("idempotency_key", clave)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer la marca: ${error.message}`);
    return data ? aMarca(data) : null;
  },

  async crearMarca(institutionId, datos) {
    const { data, error } = await clienteDeServicio()
      .from("class_marker")
      .insert({
        institution_id: institutionId,
        student_class_session_id: datos.claseId,
        marker_type: datos.tipo,
        elapsed_seconds: datos.segundos,
        detail: datos.texto,
        idempotency_key: datos.clave,
      })
      .select(COLUMNAS_MARCA)
      .single();
    if (error?.code === UNICIDAD) return null;
    if (error) throw new Error(`No se pudo guardar la marca: ${error.message}`);
    return aMarca(data);
  },

  async marcaDelEstudiante(institutionId, studentId, marcaId) {
    const { data, error } = await clienteDeServicio()
      .from("class_marker")
      .select(`${COLUMNAS_MARCA}, clase:student_class_session_id!inner(student_id)`)
      .eq("institution_id", institutionId)
      .eq("id", marcaId)
      .eq("clase.student_id", studentId)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer la marca: ${error.message}`);
    return data ? aMarca(data as Record<string, unknown>) : null;
  },

  async guardarTextoDeMarca(institutionId, marcaId, texto, ahora) {
    const { data, error } = await clienteDeServicio()
      .from("class_marker")
      .update({ detail: texto, detail_updated_at: ahora })
      .eq("institution_id", institutionId)
      .eq("id", marcaId)
      .select(COLUMNAS_MARCA)
      .single();
    if (error) throw new Error(`No se pudo guardar el texto de la marca: ${error.message}`);
    return aMarca(data);
  },
};

// ── Lecturas para las pantallas ──────────────────────────────────────────────

async function marcasDe(institutionId: string, claseId: string): Promise<MarcaFila[]> {
  const { data, error } = await clienteDeServicio()
    .from("class_marker")
    .select(COLUMNAS_MARCA)
    .eq("institution_id", institutionId)
    .eq("student_class_session_id", claseId);
  if (error) throw new Error(`No se pudieron leer las marcas: ${error.message}`);
  return ((data ?? []) as Array<Record<string, unknown>>).map(aMarca);
}

type Uno<T> = T | T[] | null;
const uno = <T>(x: Uno<T>): T | null => (Array.isArray(x) ? (x[0] ?? null) : x);

/**
 * Lo que la pantalla dice arriba: materia, comisión, docente, aula y la unidad
 * de la última clase dada. **Cada una `null` si no se sabe.**
 */
async function contextoDe(institutionId: string, clase: ClaseFila, fecha: string): Promise<ContextoDeClase> {
  const db = clienteDeServicio();

  const cursada = await db
    .from("course_enrollment")
    .select("offering_id, oferta:offering_id(commission, instructor:instructor_id(name), course:course_id(name))")
    .eq("institution_id", institutionId)
    .eq("id", clase.cursadaId)
    .single();
  if (cursada.error) throw new Error(`No se pudo leer la materia de la clase: ${cursada.error.message}`);
  const fila = cursada.data as unknown as {
    offering_id: string;
    oferta: Uno<{ commission: string | null; instructor: Uno<{ name: string }>; course: Uno<{ name: string }> }>;
  };
  const oferta = uno(fila.oferta);

  // Los bloques de la semana de esta cursada. Dan el aula
  // y el orden que usa la simulación del tipo de clase (ADR-099 §7).
  // ADR-105 §5: los efectivos de la cursada, con la misma precedencia que todo.
  const bloques = await db.rpc("bloques_de_cursada", { p_course_enrollment_id: clase.cursadaId });
  if (bloques.error) throw new Error(`No se pudieron leer los bloques: ${bloques.error.message}`);
  const semana = ((bloques.data ?? []) as Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    room: string | null;
    source_type: string;
  }>).sort(
    // La semana de cursado empieza el lunes: el domingo (`0`) va al final.
    (x, y) => (x.day_of_week + 6) % 7 - (y.day_of_week + 6) % 7 || x.start_time.localeCompare(y.start_time),
  );
  const bloque = clase.bloqueId ? semana.find((b) => b.id === clase.bloqueId) : undefined;

  // Las clases dictadas hasta ese día, con sus temas. **Sólo se leen** (ADR-094):
  // la de esa fecha es un hecho; la última anterior da la estimación.
  const dadas = await db
    .from("class_session")
    .select("session_date, class_session_topic(topic_id)")
    .eq("offering_id", fila.offering_id)
    .lte("session_date", fecha)
    .order("session_date", { ascending: false })
    .limit(30);
  if (dadas.error) throw new Error(`No se pudieron leer las clases dadas: ${dadas.error.message}`);
  const sesiones = ((dadas.data ?? []) as unknown as Array<{
    session_date: string;
    class_session_topic: Array<{ topic_id: string }> | null;
  }>).map((d) => ({ fecha: d.session_date, temas: (d.class_session_topic ?? []).map((t) => t.topic_id) }));

  return {
    materia: uno(oferta?.course ?? null)?.name ?? "",
    ofertaId: fila.offering_id,
    comision: oferta?.commission ?? null,
    docente: uno(oferta?.instructor ?? null)?.name ?? null,
    aula: bloque?.room ?? null,
    horarioEstimado: bloque ? bloque.source_type === "inference" : null,
    bloquesDeLaSemana: semana.map((b) => ({ id: b.id, dia: b.day_of_week })),
    temasDeEsaFecha: sesiones.filter((x) => x.fecha === fecha).flatMap((x) => x.temas),
    temasDeLaUltimaDada: sesiones.find((x) => x.fecha < fecha && x.temas.length > 0)?.temas ?? [],
  };
}

/** Las clases de una materia, la más reciente primero, con el tipo de cada marca y nada más. */
async function deCursada(
  institutionId: string,
  studentId: string,
  cursadaId: string,
): Promise<Array<{ clase: ClaseFila; tipos: Array<Pick<MarcaFila, "tipo">> }>> {
  const db = clienteDeServicio();
  const { data, error } = await db
    .from("student_class_session")
    .select(COLUMNAS_CLASE)
    .eq("institution_id", institutionId)
    .eq("student_id", studentId)
    .eq("course_enrollment_id", cursadaId)
    .order("started_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer las clases: ${error.message}`);
  const clases = ((data ?? []) as Array<Record<string, unknown>>).map(aClase);
  if (clases.length === 0) return [];

  const marcas = await db
    .from("class_marker")
    .select("student_class_session_id, marker_type")
    .eq("institution_id", institutionId)
    .in("student_class_session_id", clases.map((c) => c.id));
  if (marcas.error) throw new Error(`No se pudieron leer las marcas: ${marcas.error.message}`);
  const filas = (marcas.data ?? []) as Array<{ student_class_session_id: string; marker_type: MarcaFila["tipo"] }>;

  return clases.map((clase) => ({
    clase,
    tipos: filas.filter((m) => m.student_class_session_id === clase.id).map((m) => ({ tipo: m.marker_type })),
  }));
}

export const clasesReal = { ...escrituras, marcasDe, contextoDe, deCursada };
