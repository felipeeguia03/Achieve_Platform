import "server-only";

import type { ClaseFila, MarcaFila, RepositorioDeClases } from "../servicios/clase";
import type { ContextoDeClase } from "../servicios/proyeccion-clase";
import { numeroDeUnidad } from "../servicios/proyeccion-tablero";
import { clienteDeServicio } from "../supabase";

/**
 * **Modo Clase** contra Postgres — [ADR-098](../../../docs/decisions.md#adr-098).
 *
 * ⚠️ **El `institution_id` y el estudiante van en el `WHERE`** (I11): una clase
 * ajena no se lee y después se descarta — no se lee. Para quien pregunta, la
 * clase de otro **no existe**, y la ruta contesta `404`.
 *
 * ⚠️ **No toca `class_session` para escribir.** La lee sólo para decir la unidad
 * de la última clase dada, que es lo que ya muestra Hoy.
 */

/** La violación de unicidad de Postgres: la base ganó una carrera. */
const UNICIDAD = "23505";

const COLUMNAS_CLASE =
  "id, student_id, course_enrollment_id, class_schedule_block_id, scheduled_start, scheduled_end, status, started_at, ended_at, notes, notes_updated_at";
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
    apuntes: (f.notes as string | null) ?? null,
    apuntesGuardadosEn: (f.notes_updated_at as string | null) ?? null,
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
    const db = clienteDeServicio();
    const cursada = await db
      .from("course_enrollment")
      .select("offering_id")
      .eq("institution_id", institutionId)
      .eq("id", cursadaId)
      .maybeSingle();
    if (cursada.error) throw new Error(`No se pudo leer la cursada: ${cursada.error.message}`);
    const oferta = (cursada.data as { offering_id: string } | null)?.offering_id;

    // Los dos dueños posibles del bloque (ADR-083): la cursada o su oferta.
    const { data, error } = await db
      .from("class_schedule_block")
      .select("start_time, end_time, offering_id, course_enrollment_id")
      .eq("institution_id", institutionId)
      .eq("id", bloqueId)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer el bloque: ${error.message}`);
    const b = data as Record<string, string | null> | null;
    if (!b) return null;
    const esSuyo = b.course_enrollment_id === cursadaId || (oferta !== undefined && b.offering_id === oferta);
    return esSuyo ? { desde: b.start_time as string, hasta: b.end_time as string } : null;
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

  async guardarApuntes(institutionId, claseId, apuntes, ahora) {
    const { data, error } = await clienteDeServicio()
      .from("student_class_session")
      .update({ notes: apuntes, notes_updated_at: ahora })
      .eq("institution_id", institutionId)
      .eq("id", claseId)
      .select(COLUMNAS_CLASE)
      .single();
    if (error) throw new Error(`No se pudieron guardar los apuntes: ${error.message}`);
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
async function contextoDe(institutionId: string, clase: ClaseFila, hoy: string): Promise<ContextoDeClase> {
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

  let aula: string | null = null;
  let horarioEstimado: boolean | null = null;
  if (clase.bloqueId) {
    const bloque = await db
      .from("class_schedule_block")
      .select("room, source_type")
      .eq("institution_id", institutionId)
      .eq("id", clase.bloqueId)
      .maybeSingle();
    if (bloque.error) throw new Error(`No se pudo leer el bloque: ${bloque.error.message}`);
    const b = bloque.data as { room: string | null; source_type: string } | null;
    if (b) {
      aula = b.room;
      horarioEstimado = b.source_type === "inference";
    }
  }

  // La última clase dada con temas. Una futura no se dio (ADR-094).
  const dadas = await db
    .from("class_session")
    .select("session_date, class_session_topic(topic:topic_id(code, sequence))")
    .eq("offering_id", fila.offering_id)
    .lte("session_date", hoy)
    .order("session_date", { ascending: false })
    .limit(20);
  if (dadas.error) throw new Error(`No se pudieron leer las clases dadas: ${dadas.error.message}`);
  const conTemas = ((dadas.data ?? []) as unknown as Array<{
    class_session_topic: Array<{ topic: Uno<{ code: string | null; sequence: number | null }> }> | null;
  }>).find((s) => (s.class_session_topic ?? []).length > 0);
  const numeros = (conTemas?.class_session_topic ?? [])
    .map((t) => uno(t.topic))
    .map((t) => (t ? numeroDeUnidad(t.code, t.sequence) : null))
    .filter((n): n is number => n !== null);

  return {
    materia: uno(oferta?.course ?? null)?.name ?? "",
    comision: oferta?.commission ?? null,
    docente: uno(oferta?.instructor ?? null)?.name ?? null,
    aula,
    horarioEstimado,
    unidadDeUltimaClase: numeros.length > 0 ? Math.max(...numeros) : null,
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
