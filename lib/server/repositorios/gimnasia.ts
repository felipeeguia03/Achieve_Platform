import "server-only";

import type {
  IntentoFila,
  ItemFila,
  RepasoFila,
  RepositorioDeGimnasia,
  ResultadoGuardado,
  SesionFila,
} from "../servicios/gimnasia";
import { clienteDeServicio } from "../supabase";

/**
 * **Gimnasia cognitiva** contra Postgres — [ADR-102](../../../docs/decisions.md#adr-102).
 *
 * ⚠️ **El `institution_id` y el estudiante van en el `WHERE`** (I11): una sesión o
 * un intento ajeno no se leen y después se descartan — no se leen. Para quien
 * pregunta, lo de otro **no existe**, y la ruta contesta `404`.
 *
 * ⚠️ **`accepted_answers` se lee sólo para corregir en el Service.** Ninguna
 * proyección la devuelve.
 */

/** La violación de unicidad de Postgres: la base ganó una carrera. */
const UNICIDAD = "23505";

const COLUMNAS_SESION = "id, student_id, origin, planned_games, status, started_at, ended_at";
const COLUMNAS_INTENTO =
  "id, student_id, gym_session_id, game, rules_version, status, started_at, completed_at, seed, start_length, plan, idempotency_key, " +
  "answers, rounds, correct_count, error_count, max_span, max_attempted_span, score, level_before, level_after, partial_count, personal_best";
const COLUMNAS_REPASO = "id, recall_item_id, gym_attempt_id, position, outcome, next_review_on, answered_at, idempotency_key";

type Fila = Record<string, unknown>;

function aSesion(f: Fila): SesionFila {
  return {
    id: f.id as string,
    studentId: f.student_id as string,
    origen: f.origin as SesionFila["origen"],
    juegos: f.planned_games as SesionFila["juegos"],
    estado: f.status as SesionFila["estado"],
    iniciadaEn: f.started_at as string,
    terminadaEn: (f.ended_at as string | null) ?? null,
  };
}

function aIntento(f: Fila): IntentoFila {
  const completo = f.status === "COMPLETED";
  return {
    id: f.id as string,
    studentId: f.student_id as string,
    sesionId: f.gym_session_id as string,
    juego: f.game as IntentoFila["juego"],
    version: f.rules_version as string,
    estado: f.status as IntentoFila["estado"],
    iniciadoEn: f.started_at as string,
    completadoEn: (f.completed_at as string | null) ?? null,
    semilla: (f.seed as number | null) ?? null,
    largoInicial: (f.start_length as number | null) ?? null,
    plan: (f.plan as string[] | null) ?? null,
    clave: f.idempotency_key as string,
    resultado: completo
      ? {
          respuestas: f.answers ?? null,
          rondas: (f.rounds as number | null) ?? null,
          aciertos: (f.correct_count as number | null) ?? 0,
          errores: (f.error_count as number | null) ?? 0,
          maximo: (f.max_span as number | null) ?? null,
          maximoIntentado: (f.max_attempted_span as number | null) ?? null,
          puntuacion: (f.score as number | null) ?? null,
          nivelAnterior: (f.level_before as number | null) ?? null,
          nivel: (f.level_after as number | null) ?? null,
          parciales: (f.partial_count as number | null) ?? null,
          marcaPersonal: (f.personal_best as boolean | null) ?? false,
        }
      : null,
  };
}

function aRepaso(f: Fila): RepasoFila {
  return {
    id: f.id as string,
    itemId: f.recall_item_id as string,
    intentoId: f.gym_attempt_id as string,
    posicion: f.position as number,
    resultado: f.outcome as RepasoFila["resultado"],
    proximoRepaso: f.next_review_on as string,
    respondidoEn: f.answered_at as string,
    clave: f.idempotency_key as string,
  };
}

type Uno<T> = T | T[] | null;
const uno = <T>(x: Uno<T>): T | null => (Array.isArray(x) ? (x[0] ?? null) : x);

/** Las materias activas del estudiante: `course_id` → nombre. */
async function materiasActivas(institutionId: string, studentId: string): Promise<Map<string, string>> {
  const { data, error } = await clienteDeServicio()
    .from("course_enrollment")
    .select("offering_id, oferta:offering_id(course:course_id(id, name))")
    .eq("institution_id", institutionId)
    .eq("student_id", studentId)
    .eq("status", "active");
  if (error) throw new Error(`No se pudieron leer las materias: ${error.message}`);
  const materias = new Map<string, string>();
  for (const f of (data ?? []) as unknown as Array<{ oferta: Uno<{ course: Uno<{ id: string; name: string }> }> }>) {
    const curso = uno(uno(f.oferta)?.course ?? null);
    if (curso) materias.set(curso.id, curso.name);
  }
  return materias;
}

export const gimnasiaReal: RepositorioDeGimnasia = {
  async sesionAbierta(institutionId, studentId) {
    const { data, error } = await clienteDeServicio()
      .from("gym_session")
      .select(COLUMNAS_SESION)
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .eq("status", "IN_PROGRESS")
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer la sesión abierta: ${error.message}`);
    return data ? aSesion(data) : null;
  },

  async sesionPorClave(institutionId, studentId, clave) {
    const { data, error } = await clienteDeServicio()
      .from("gym_session")
      .select(COLUMNAS_SESION)
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .eq("idempotency_key", clave)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer la sesión: ${error.message}`);
    return data ? aSesion(data) : null;
  },

  async sesionDelEstudiante(institutionId, studentId, sesionId) {
    const { data, error } = await clienteDeServicio()
      .from("gym_session")
      .select(COLUMNAS_SESION)
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .eq("id", sesionId)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer la sesión: ${error.message}`);
    return data ? aSesion(data) : null;
  },

  async crearSesion(institutionId, datos) {
    const { data, error } = await clienteDeServicio()
      .from("gym_session")
      .insert({
        institution_id: institutionId,
        student_id: datos.studentId,
        origin: datos.origen,
        planned_games: datos.juegos,
        idempotency_key: datos.clave,
      })
      .select(COLUMNAS_SESION)
      .single();
    if (error?.code === UNICIDAD) return null;
    if (error) throw new Error(`No se pudo empezar la sesión: ${error.message}`);
    return aSesion(data);
  },

  async cerrarSesion(institutionId, sesionId, estado, ahora) {
    // Compare-and-swap: el estado esperado va en el `WHERE`.
    const { data, error } = await clienteDeServicio()
      .from("gym_session")
      .update({ status: estado, ended_at: ahora })
      .eq("institution_id", institutionId)
      .eq("id", sesionId)
      .eq("status", "IN_PROGRESS")
      .select(COLUMNAS_SESION)
      .maybeSingle();
    if (error) throw new Error(`No se pudo cerrar la sesión: ${error.message}`);
    return data ? aSesion(data) : null;
  },

  async rutinasCompletadas(institutionId, studentId) {
    const { data, error } = await clienteDeServicio()
      .from("gym_session")
      .select("ended_at")
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .eq("origin", "ROUTINE")
      .eq("status", "COMPLETED");
    if (error) throw new Error(`No se pudieron leer las rutinas: ${error.message}`);
    return ((data ?? []) as Array<{ ended_at: string }>).map((f) => ({ terminadaEn: f.ended_at }));
  },

  async intentosDeSesion(institutionId, sesionId) {
    const { data, error } = await clienteDeServicio()
      .from("gym_attempt")
      .select(COLUMNAS_INTENTO)
      .eq("institution_id", institutionId)
      .eq("gym_session_id", sesionId)
      .order("started_at", { ascending: true });
    if (error) throw new Error(`No se pudieron leer los intentos: ${error.message}`);
    return ((data ?? []) as unknown as Fila[]).map(aIntento);
  },

  async intentoDelEstudiante(institutionId, studentId, intentoId) {
    const { data, error } = await clienteDeServicio()
      .from("gym_attempt")
      .select(COLUMNAS_INTENTO)
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .eq("id", intentoId)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer el intento: ${error.message}`);
    return data ? aIntento(data as unknown as Fila) : null;
  },

  async intentoPorClave(institutionId, sesionId, clave) {
    const { data, error } = await clienteDeServicio()
      .from("gym_attempt")
      .select(COLUMNAS_INTENTO)
      .eq("institution_id", institutionId)
      .eq("gym_session_id", sesionId)
      .eq("idempotency_key", clave)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer el intento: ${error.message}`);
    return data ? aIntento(data as unknown as Fila) : null;
  },

  async abandonarAbiertos(institutionId, sesionId) {
    const { error } = await clienteDeServicio()
      .from("gym_attempt")
      .update({ status: "ABANDONED" })
      .eq("institution_id", institutionId)
      .eq("gym_session_id", sesionId)
      .eq("status", "STARTED");
    if (error) throw new Error(`No se pudieron cerrar los intentos abiertos: ${error.message}`);
  },

  async crearIntento(institutionId, datos) {
    const { data, error } = await clienteDeServicio()
      .from("gym_attempt")
      .insert({
        institution_id: institutionId,
        student_id: datos.studentId,
        gym_session_id: datos.sesionId,
        game: datos.juego,
        rules_version: datos.version,
        seed: datos.semilla,
        start_length: datos.largoInicial,
        plan: datos.plan,
        idempotency_key: datos.clave,
      })
      .select(COLUMNAS_INTENTO)
      .single();
    if (error?.code === UNICIDAD) return null;
    if (error) throw new Error(`No se pudo empezar el juego: ${error.message}`);
    return aIntento(data as unknown as Fila);
  },

  async completarIntento(institutionId, intentoId, r: ResultadoGuardado, ahora) {
    const { data, error } = await clienteDeServicio()
      .from("gym_attempt")
      .update({
        status: "COMPLETED",
        completed_at: ahora,
        answers: r.respuestas,
        rounds: r.rondas,
        correct_count: r.aciertos,
        error_count: r.errores,
        max_span: r.maximo,
        max_attempted_span: r.maximoIntentado,
        score: r.puntuacion,
        level_before: r.nivelAnterior,
        level_after: r.nivel,
        partial_count: r.parciales,
        personal_best: r.marcaPersonal,
      })
      .eq("institution_id", institutionId)
      .eq("id", intentoId)
      .eq("status", "STARTED")
      .select(COLUMNAS_INTENTO)
      .maybeSingle();
    if (error?.code === UNICIDAD) return null;
    if (error) throw new Error(`No se pudo guardar el resultado: ${error.message}`);
    return data ? aIntento(data as unknown as Fila) : null;
  },

  async intentosCompletados(institutionId, studentId, juego) {
    const { data, error } = await clienteDeServicio()
      .from("gym_attempt")
      .select(COLUMNAS_INTENTO)
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .eq("game", juego)
      .eq("status", "COMPLETED")
      .order("completed_at", { ascending: false });
    if (error) throw new Error(`No se pudieron leer los intentos: ${error.message}`);
    return ((data ?? []) as unknown as Fila[]).map(aIntento);
  },

  async itemsVisibles(institutionId, studentId, incluirSinteticos) {
    const materias = await materiasActivas(institutionId, studentId);
    const cursos = [...materias.keys()];
    const db = clienteDeServicio();

    // Las generales (`course_id IS NULL`) y las de sus materias activas. Nunca
    // `RETIRED`; `DRAFT` sólo si es sintética y la demo lo pide.
    let consulta = db
      .from("recall_item")
      .select("id, code, course_id, prompt, answer_type, options, accepted_answers, canonical_answer, explanation, version, publication_status")
      .neq("publication_status", "RETIRED");
    consulta = cursos.length > 0
      ? consulta.or(`course_id.is.null,course_id.in.(${cursos.join(",")})`)
      : consulta.is("course_id", null);
    const { data, error } = await consulta;
    if (error) throw new Error(`No se pudieron leer las preguntas: ${error.message}`);

    return ((data ?? []) as Array<Record<string, unknown>>)
      .filter((f) => {
        if (f.publication_status === "PUBLISHED") return true;
        return incluirSinteticos && String(f.code).startsWith("SYN-");
      })
      .map((f): ItemFila => {
        const opciones = f.options as Array<{ id: string; text: string }> | null;
        const cursoId = (f.course_id as string | null) ?? null;
        return {
          id: f.id as string,
          cursoId,
          materia: cursoId ? (materias.get(cursoId) ?? null) : null,
          pregunta: f.prompt as string,
          tipo: f.answer_type as ItemFila["tipo"],
          opciones: opciones ? opciones.map((o) => ({ id: o.id, texto: o.text })) : null,
          aceptadas: (f.accepted_answers as string[] | null) ?? null,
          canonica: f.canonical_answer as string,
          explicacion: (f.explanation as string | null) ?? null,
          version: f.version as number,
          sintetica: f.publication_status !== "PUBLISHED",
        };
      });
  },

  async repasosDelEstudiante(institutionId, studentId) {
    const { data, error } = await clienteDeServicio()
      .from("recall_review")
      .select(COLUMNAS_REPASO)
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .order("answered_at", { ascending: false });
    if (error) throw new Error(`No se pudieron leer los repasos: ${error.message}`);
    return ((data ?? []) as Fila[]).map(aRepaso);
  },

  async repasosDeIntento(institutionId, intentoId) {
    const { data, error } = await clienteDeServicio()
      .from("recall_review")
      .select(COLUMNAS_REPASO)
      .eq("institution_id", institutionId)
      .eq("gym_attempt_id", intentoId)
      .order("position", { ascending: true });
    if (error) throw new Error(`No se pudieron leer los repasos: ${error.message}`);
    return ((data ?? []) as Fila[]).map(aRepaso);
  },

  async repasoPorClave(institutionId, studentId, clave) {
    const { data, error } = await clienteDeServicio()
      .from("recall_review")
      .select(COLUMNAS_REPASO)
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .eq("idempotency_key", clave)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer el repaso: ${error.message}`);
    return data ? aRepaso(data) : null;
  },

  async crearRepaso(institutionId, datos) {
    const { data, error } = await clienteDeServicio()
      .from("recall_review")
      .insert({
        institution_id: institutionId,
        student_id: datos.studentId,
        recall_item_id: datos.itemId,
        item_version: datos.version,
        gym_attempt_id: datos.intentoId,
        position: datos.posicion,
        outcome: datos.resultado,
        auto_graded: datos.automatica,
        answer: datos.respuesta,
        policy_version: datos.politica,
        next_review_on: datos.proximoRepaso,
        idempotency_key: datos.clave,
      })
      .select(COLUMNAS_REPASO)
      .single();
    if (error?.code === UNICIDAD) return null;
    if (error) throw new Error(`No se pudo guardar el repaso: ${error.message}`);
    return aRepaso(data);
  },

  async proximasEvaluaciones(institutionId, studentId, hoy) {
    const db = clienteDeServicio();
    const cursadas = await db
      .from("course_enrollment")
      .select("offering_id, oferta:offering_id(course_id)")
      .eq("institution_id", institutionId)
      .eq("student_id", studentId)
      .eq("status", "active");
    if (cursadas.error) throw new Error(`No se pudieron leer las cursadas: ${cursadas.error.message}`);
    const filas = (cursadas.data ?? []) as unknown as Array<{ offering_id: string; oferta: Uno<{ course_id: string }> }>;
    if (filas.length === 0) return [];
    const cursoDeOferta = new Map(filas.map((f) => [f.offering_id, uno(f.oferta)?.course_id ?? null]));

    // Visibles según quién las declaró (ADR-067): las institucionales y las
    // propias, nunca las que cargó otro estudiante.
    const { data, error } = await db
      .from("assessment")
      .select("offering_id, assessment_date, declared_by")
      .in("offering_id", [...cursoDeOferta.keys()])
      .gte("assessment_date", hoy)
      .or(`declared_by.is.null,declared_by.eq.${studentId}`);
    if (error) throw new Error(`No se pudieron leer las evaluaciones: ${error.message}`);
    return ((data ?? []) as Array<{ offering_id: string; assessment_date: string }>).flatMap((f) => {
      const cursoId = cursoDeOferta.get(f.offering_id);
      return cursoId ? [{ cursoId, fecha: f.assessment_date }] : [];
    });
  },
};
