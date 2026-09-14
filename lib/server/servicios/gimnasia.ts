/**
 * Service de **Gimnasia cognitiva** — [ADR-102](../../../docs/decisions.md#adr-102).
 *
 * Las reglas viven acá y en `lib/domain/gimnasia/`; el Repository lee y escribe,
 * y la base garantiza lo que dos pedidos simultáneos podrían saltearse (una
 * sesión abierta, un intento abierto, una respuesta por lugar de la cola).
 *
 * ## El resultado lo calcula el servidor
 *
 * El cliente manda **respuestas**, nunca puntuaciones. Con la semilla y el largo
 * inicial que fijó este Service al empezar, la partida se rehace entera y se
 * corrige acá. Una respuesta de Recuerdo real se acepta sólo si es la pregunta
 * que toca en la cola.
 *
 * ## Lo que este Service NO hace, y cada ausencia es la decisión
 *
 * - **No crea `Action`, `Commitment`, `Evidence` ni progreso.** Jugar no es
 *   estudiar la materia, ni entregar, ni avanzar una unidad (AGENTS.md §2.1).
 * - **No toca el ADE ni la precedencia de Hoy.** La rutina no es una acción.
 * - **No emite un evento por respuesta.** *"Evento nuevo para cada interacción:
 *   no está aprobado"*: los repasos son filas.
 * - **No clasifica al estudiante.** El nivel es del juego.
 */
import { canTransition, gymAttemptTransitions, gymSessionTransitions } from "@/lib/domain/state-machines";
import type { GymAttemptStatus, GymSessionStatus } from "@/lib/domain/types";
import { fechaEnZona } from "@/lib/domain/zona";
import {
  jugarCuadricula,
  largoInicialDeCuadricula,
  REGLAS_CUADRICULA,
} from "@/lib/domain/gimnasia/cuadricula-fugaz";
import {
  jugarCadena,
  largoDeNivel,
  largoInicialDeCadena,
  nivelResultante,
  REGLAS_CADENA,
} from "@/lib/domain/gimnasia/cadena-inversa";
import {
  conRepasos,
  corregirCerrada,
  diasEntre,
  esCerrada,
  esResultadoDeRecuerdo,
  pendientesDeHoy,
  POLITICA_DE_REPASO,
  proximoRepaso,
  recuerdoDiferido,
  resultadoDeCerrada,
  seleccionarPreguntas,
  siguienteDeLaCola,
  type CandidataDeRecuerdo,
  type ResultadoDeRecuerdo,
  type TipoDeRespuesta,
} from "@/lib/domain/gimnasia/recuerdo-real";
import {
  diasConRutina,
  esJuego,
  juegosDeLaRutina,
  JUEGOS_DE_MEMORIA,
  marcaDe,
  minutosDe,
  type Juego,
  type OrigenDeSesion,
} from "@/lib/domain/gimnasia/rutina";
import type {
  GimnasiaProps,
  IntentoEmpezado,
  PreguntaDeRecuerdo,
  RespuestaRegistrada,
  ResultadoDeIntento,
  ResumenDeJuego,
} from "@/lib/domain/gimnasia/vista";
import type { PublicadorDeEventos } from "./eventos";

// ── Filas ────────────────────────────────────────────────────────────────────

export interface SesionFila {
  id: string;
  studentId: string;
  origen: OrigenDeSesion;
  juegos: Juego[];
  estado: GymSessionStatus;
  iniciadaEn: string;
  terminadaEn: string | null;
}

export interface ResultadoGuardado {
  respuestas: unknown;
  rondas: number | null;
  aciertos: number;
  errores: number;
  maximo: number | null;
  maximoIntentado: number | null;
  puntuacion: number | null;
  nivelAnterior: number | null;
  nivel: number | null;
  parciales: number | null;
  marcaPersonal: boolean;
}

export interface IntentoFila {
  id: string;
  studentId: string;
  sesionId: string;
  juego: Juego;
  version: string;
  estado: GymAttemptStatus;
  iniciadoEn: string;
  completadoEn: string | null;
  semilla: number | null;
  largoInicial: number | null;
  plan: string[] | null;
  clave: string;
  /** `null` hasta `COMPLETED`. */
  resultado: ResultadoGuardado | null;
}

export interface ItemFila {
  id: string;
  cursoId: string | null;
  materia: string | null;
  pregunta: string;
  tipo: TipoDeRespuesta;
  opciones: { id: string; texto: string }[] | null;
  /** `null` en una abierta. **Nunca sale al cliente.** */
  aceptadas: string[] | null;
  canonica: string;
  explicacion: string | null;
  version: number;
  sintetica: boolean;
}

export interface RepasoFila {
  id: string;
  itemId: string;
  intentoId: string;
  posicion: number;
  resultado: ResultadoDeRecuerdo;
  proximoRepaso: string;
  respondidoEn: string;
  clave: string;
}

export interface RepositorioDeGimnasia {
  sesionAbierta(institutionId: string, studentId: string): Promise<SesionFila | null>;
  sesionPorClave(institutionId: string, studentId: string, clave: string): Promise<SesionFila | null>;
  /** Scoped por estudiante: la ajena **no existe** para esta lectura. */
  sesionDelEstudiante(institutionId: string, studentId: string, sesionId: string): Promise<SesionFila | null>;
  /** `null` ⇒ la base rechazó por la unicidad (otra abierta, o la misma clave). */
  crearSesion(
    institutionId: string,
    datos: { studentId: string; origen: OrigenDeSesion; juegos: Juego[]; clave: string },
  ): Promise<SesionFila | null>;
  /** Compare-and-swap desde `IN_PROGRESS`. `null` ⇒ ya no estaba abierta. */
  cerrarSesion(institutionId: string, sesionId: string, estado: "COMPLETED" | "CANCELLED", ahora: string): Promise<SesionFila | null>;
  /** Las rutinas completadas, para los días con rutina. */
  rutinasCompletadas(institutionId: string, studentId: string): Promise<Array<{ terminadaEn: string }>>;

  intentosDeSesion(institutionId: string, sesionId: string): Promise<IntentoFila[]>;
  intentoDelEstudiante(institutionId: string, studentId: string, intentoId: string): Promise<IntentoFila | null>;
  intentoPorClave(institutionId: string, sesionId: string, clave: string): Promise<IntentoFila | null>;
  /** Los `STARTED` de la sesión pasan a `ABANDONED`. */
  abandonarAbiertos(institutionId: string, sesionId: string): Promise<void>;
  /** `null` ⇒ la base rechazó por la unicidad. */
  crearIntento(
    institutionId: string,
    datos: {
      studentId: string;
      sesionId: string;
      juego: Juego;
      version: string;
      semilla: number | null;
      largoInicial: number | null;
      plan: string[] | null;
      clave: string;
    },
  ): Promise<IntentoFila | null>;
  /** Compare-and-swap desde `STARTED`. `null` ⇒ ya no estaba abierto. */
  completarIntento(institutionId: string, intentoId: string, resultado: ResultadoGuardado, ahora: string): Promise<IntentoFila | null>;
  /** Los completados de un juego, **el más reciente primero**. */
  intentosCompletados(institutionId: string, studentId: string, juego: Juego): Promise<IntentoFila[]>;

  /**
   * Las preguntas que el estudiante puede ver: de sus materias activas y las
   * generales. Sólo `PUBLISHED`, más las sintéticas `DRAFT` si se pide.
   */
  itemsVisibles(institutionId: string, studentId: string, incluirSinteticos: boolean): Promise<ItemFila[]>;
  repasosDelEstudiante(institutionId: string, studentId: string): Promise<RepasoFila[]>;
  repasosDeIntento(institutionId: string, intentoId: string): Promise<RepasoFila[]>;
  repasoPorClave(institutionId: string, studentId: string, clave: string): Promise<RepasoFila | null>;
  /** `null` ⇒ la base rechazó por la clave o por el lugar de la cola. */
  crearRepaso(
    institutionId: string,
    datos: {
      studentId: string;
      itemId: string;
      version: number;
      intentoId: string;
      posicion: number;
      resultado: ResultadoDeRecuerdo;
      automatica: boolean;
      respuesta: string | null;
      politica: string;
      proximoRepaso: string;
      clave: string;
    },
  ): Promise<RepasoFila | null>;
  /** La próxima evaluación con fecha (desde `hoy`) de cada materia activa, visible para el estudiante. */
  proximasEvaluaciones(institutionId: string, studentId: string, hoy: string): Promise<Array<{ cursoId: string; fecha: string }>>;
}

export interface Dependencias {
  repo: RepositorioDeGimnasia;
  eventos: PublicadorDeEventos;
  /** ISO. */
  ahora: () => string;
  /** Una semilla nueva de 31 bits. En producción sale de `crypto`. */
  semilla: () => number;
  /** `MODO_PRUEBA=1`: las preguntas sintéticas se ven. Lo decide la composición. */
  incluirSinteticos: boolean;
}

export interface Estudiante {
  studentId: string;
  zona: string;
}

// ── Lecturas compartidas ─────────────────────────────────────────────────────

const hoyDe = (d: Dependencias, zona: string) => fechaEnZona(Date.parse(d.ahora()), zona);

const mejor = (valores: Array<number | null | undefined>): number | null => {
  const v = valores.filter((x): x is number => typeof x === "number");
  return v.length === 0 ? null : Math.max(...v);
};

interface Recuerdo {
  items: ItemFila[];
  repasos: RepasoFila[];
  seleccion: string[];
  pendientes: number;
}

async function recuerdoDe(d: Dependencias, institutionId: string, e: Estudiante): Promise<Recuerdo> {
  const hoy = hoyDe(d, e.zona);
  const [items, repasos, evaluaciones] = await Promise.all([
    d.repo.itemsVisibles(institutionId, e.studentId, d.incluirSinteticos),
    d.repo.repasosDelEstudiante(institutionId, e.studentId),
    d.repo.proximasEvaluaciones(institutionId, e.studentId, hoy),
  ]);
  const proxima = new Map<string, string>();
  for (const ev of evaluaciones) {
    const previa = proxima.get(ev.cursoId);
    if (!previa || ev.fecha < previa) proxima.set(ev.cursoId, ev.fecha);
  }
  const candidatas: CandidataDeRecuerdo[] = items.map((i) => ({
    itemId: i.id,
    cursoId: i.cursoId,
    // ⚠️ Hoy siempre `false`: la unidad activa de una cursada no tiene una
    // lectura única que usar acá sin tocar el ADE (ADR-102 §9).
    unidadActiva: false,
    evaluacionEnDias: i.cursoId && proxima.has(i.cursoId) ? diasEntre(hoy, proxima.get(i.cursoId)!) : null,
  }));
  const estados = conRepasos(candidatas, repasos);
  const { vencidas, nuevas } = pendientesDeHoy(estados, hoy);
  return { items, repasos, seleccion: seleccionarPreguntas(estados, hoy), pendientes: vencidas + nuevas };
}

function preguntaDe(item: ItemFila, posicion: number, total: number): PreguntaDeRecuerdo {
  return {
    itemId: item.id,
    pregunta: item.pregunta,
    tipo: item.tipo,
    opciones: item.opciones,
    materia: item.materia,
    sintetica: item.sintetica,
    posicion,
    total,
  };
}

// ── La pantalla ──────────────────────────────────────────────────────────────

/** Todo lo que la pantalla principal muestra, en una lectura. */
export async function proyectarGimnasia(d: Dependencias, institutionId: string, e: Estudiante): Promise<GimnasiaProps> {
  const [abierta, rutinas, cuadriculas, cadenas, recuerdo] = await Promise.all([
    d.repo.sesionAbierta(institutionId, e.studentId),
    d.repo.rutinasCompletadas(institutionId, e.studentId),
    d.repo.intentosCompletados(institutionId, e.studentId, "FLASH_GRID"),
    d.repo.intentosCompletados(institutionId, e.studentId, "REVERSE_CHAIN"),
    recuerdoDe(d, institutionId, e),
  ]);

  const intentosAbiertos = abierta ? await d.repo.intentosDeSesion(institutionId, abierta.id) : [];
  const nivel = cadenas[0]?.resultado?.nivel ?? null;
  const porId = new Map(recuerdo.items.map((i) => [i.id, i]));
  const materias = [
    ...new Set(recuerdo.seleccion.map((id) => porId.get(id)?.materia).filter((m): m is string => !!m)),
  ];
  const juegos = juegosDeLaRutina(recuerdo.seleccion.length > 0);

  return {
    simulada: recuerdo.items.some((i) => i.sintetica),
    rutina: {
      juegos,
      minutos: minutosDe(juegos),
      materias,
      adaptada: cuadriculas.length + cadenas.length > 0,
    },
    sesionEnCurso: abierta
      ? {
          id: abierta.id,
          origen: abierta.origen,
          juegos: abierta.juegos,
          completados: intentosAbiertos.filter((i) => i.estado === "COMPLETED").map((i) => i.juego),
          iniciadaEn: abierta.iniciadaEn,
        }
      : null,
    progreso: {
      diasConRutina: diasConRutina(rutinas.map((r) => fechaEnZona(Date.parse(r.terminadaEn), e.zona))),
      mejorSecuenciaCuadricula: mejor(cuadriculas.map((i) => i.resultado?.maximo)),
      mejorCadena: mejor(cadenas.map((i) => i.resultado?.maximo)),
      repasosCompletados: recuerdo.repasos.length,
      recuerdoDiferido: recuerdoDiferido(recuerdo.repasos),
    },
    cuadricula: {
      mejorPuntuacion: mejor(cuadriculas.map((i) => i.resultado?.puntuacion)),
      intentos: cuadriculas.length,
    },
    cadena: {
      nivel,
      largo: nivel === null ? null : largoDeNivel(nivel),
      mejorCadena: mejor(cadenas.map((i) => i.resultado?.maximo)),
    },
    recuerdo: {
      situacion: recuerdo.items.length === 0 ? "SIN_CONTENIDO" : recuerdo.pendientes > 0 ? "PENDIENTES" : "AL_DIA",
      pendientes: recuerdo.pendientes,
      practicoAntes: recuerdo.repasos.length > 0,
    },
  };
}

// ── Sesión ───────────────────────────────────────────────────────────────────

export type ResultadoDeInicioDeSesion =
  | { estado: "OK"; sesion: SesionFila; duplicado: boolean }
  /** Hay otra sesión abierta: se devuelve para retomarla o descartarla. */
  | { estado: "YA_HAY_OTRA_ABIERTA"; sesion: SesionFila }
  | { estado: "PEDIDO_INVALIDO" }
  /** Recuerdo real suelto sin preguntas: no se fabrican. */
  | { estado: "SIN_PREGUNTAS" };

/**
 * Empezar la rutina (`CTA-024`) o un juego suelto (`CTA-025`).
 *
 * **Idempotente por clave:** el doble toque devuelve la misma sesión. Con otra
 * abierta no se abre una segunda (índice único en la base).
 */
export async function iniciarSesion(
  d: Dependencias,
  institutionId: string,
  pedido: Estudiante & { origen: unknown; juego: unknown; clave: string },
): Promise<ResultadoDeInicioDeSesion> {
  if (pedido.origen !== "ROUTINE" && pedido.origen !== "SINGLE_GAME") return { estado: "PEDIDO_INVALIDO" };
  if (pedido.origen === "SINGLE_GAME" && !esJuego(pedido.juego)) return { estado: "PEDIDO_INVALIDO" };
  if (!pedido.clave.trim()) return { estado: "PEDIDO_INVALIDO" };
  const origen: OrigenDeSesion = pedido.origen;

  const previa = await d.repo.sesionPorClave(institutionId, pedido.studentId, pedido.clave);
  if (previa) return { estado: "OK", sesion: previa, duplicado: true };

  const abierta = await d.repo.sesionAbierta(institutionId, pedido.studentId);
  if (abierta) return { estado: "YA_HAY_OTRA_ABIERTA", sesion: abierta };

  let juegos: Juego[];
  if (origen === "ROUTINE" || pedido.juego === "REAL_RECALL") {
    const { seleccion } = await recuerdoDe(d, institutionId, pedido);
    if (origen === "SINGLE_GAME" && seleccion.length === 0) return { estado: "SIN_PREGUNTAS" };
    juegos = origen === "ROUTINE" ? juegosDeLaRutina(seleccion.length > 0) : ["REAL_RECALL"];
  } else {
    juegos = [pedido.juego as Juego];
  }

  const creada = await d.repo.crearSesion(institutionId, {
    studentId: pedido.studentId,
    origen,
    juegos,
    clave: pedido.clave,
  });
  if (!creada) {
    // Dos pedidos llegaron juntos: gana el que la base dejó entrar.
    const porClave = await d.repo.sesionPorClave(institutionId, pedido.studentId, pedido.clave);
    if (porClave) return { estado: "OK", sesion: porClave, duplicado: true };
    const otra = await d.repo.sesionAbierta(institutionId, pedido.studentId);
    if (otra) return { estado: "YA_HAY_OTRA_ABIERTA", sesion: otra };
    throw new Error("La base rechazó la sesión y no hay ninguna abierta ni con esa clave");
  }

  await d.eventos.publicar({
    nombre: "GymSessionStarted",
    institutionId,
    actorId: pedido.studentId,
    sujetoTipo: "gym_session",
    sujetoId: creada.id,
    causa: origen === "ROUTINE" ? "rutina" : "juego",
    payload: { juegos },
  });
  return { estado: "OK", sesion: creada, duplicado: false };
}

export type ResultadoDeCancelacion =
  | { estado: "OK"; sesion: SesionFila; duplicado: boolean }
  | { estado: "NO_ENCONTRADA" };

/**
 * Descartar la sesión. **Lo terminado adentro queda guardado:** cancelar no borra
 * intentos ni repasos. Idempotente: cancelar una cerrada la devuelve igual.
 */
export async function cancelarSesion(
  d: Dependencias,
  institutionId: string,
  pedido: { studentId: string; sesionId: string },
): Promise<ResultadoDeCancelacion> {
  const sesion = await d.repo.sesionDelEstudiante(institutionId, pedido.studentId, pedido.sesionId);
  if (!sesion) return { estado: "NO_ENCONTRADA" };
  if (!canTransition(gymSessionTransitions, sesion.estado, "CANCELLED")) {
    return { estado: "OK", sesion, duplicado: true };
  }
  const cerrada = await d.repo.cerrarSesion(institutionId, sesion.id, "CANCELLED", d.ahora());
  if (!cerrada) {
    const releida = await d.repo.sesionDelEstudiante(institutionId, pedido.studentId, pedido.sesionId);
    return releida ? { estado: "OK", sesion: releida, duplicado: true } : { estado: "NO_ENCONTRADA" };
  }
  await d.repo.abandonarAbiertos(institutionId, sesion.id);
  await d.eventos.publicar({
    nombre: "GymSessionCancelled",
    institutionId,
    actorId: pedido.studentId,
    sujetoTipo: "gym_session",
    sujetoId: cerrada.id,
    causa: "estudiante",
  });
  return { estado: "OK", sesion: cerrada, duplicado: false };
}

/**
 * Si todos los ejercicios previstos están completos, la sesión se completa.
 * **Converge:** llamarla de nuevo no hace nada, así que un reintento después de
 * un fallo a mitad de camino la termina igual.
 */
async function cerrarSiEstaCompleta(d: Dependencias, institutionId: string, sesionId: string, studentId: string): Promise<boolean> {
  const sesion = await d.repo.sesionDelEstudiante(institutionId, studentId, sesionId);
  if (!sesion) return false;
  if (sesion.estado === "COMPLETED") return true;
  if (sesion.estado !== "IN_PROGRESS") return false;
  const intentos = await d.repo.intentosDeSesion(institutionId, sesionId);
  const completos = new Set(intentos.filter((i) => i.estado === "COMPLETED").map((i) => i.juego));
  if (!sesion.juegos.every((j) => completos.has(j))) return false;

  const cerrada = await d.repo.cerrarSesion(institutionId, sesionId, "COMPLETED", d.ahora());
  if (!cerrada) {
    const releida = await d.repo.sesionDelEstudiante(institutionId, studentId, sesionId);
    return releida?.estado === "COMPLETED";
  }
  await d.eventos.publicar({
    nombre: "GymSessionCompleted",
    institutionId,
    actorId: studentId,
    sujetoTipo: "gym_session",
    sujetoId: sesionId,
    causa: cerrada.origen === "ROUTINE" ? "rutina" : "juego",
    payload: { juegos: cerrada.juegos },
  });
  return true;
}

// ── Intento ──────────────────────────────────────────────────────────────────

export type ResultadoDeInicioDeIntento =
  | { estado: "OK"; intento: IntentoEmpezado; duplicado: boolean }
  | { estado: "NO_ENCONTRADA" }
  | { estado: "SESION_CERRADA" }
  | { estado: "JUEGO_NO_PREVISTO" }
  | { estado: "JUEGO_COMPLETADO" }
  | { estado: "SIN_PREGUNTAS" };

async function intentoEmpezado(d: Dependencias, institutionId: string, e: Estudiante, intento: IntentoFila): Promise<IntentoEmpezado> {
  switch (intento.juego) {
    case "FLASH_GRID":
      return { juego: "FLASH_GRID", intento: intento.id, semilla: intento.semilla!, largoInicial: intento.largoInicial!, version: intento.version };
    case "REVERSE_CHAIN": {
      // El nivel anterior es el del último intento completado **antes** de éste.
      const previos = (await d.repo.intentosCompletados(institutionId, e.studentId, "REVERSE_CHAIN")).filter(
        (i) => i.id !== intento.id,
      );
      return {
        juego: "REVERSE_CHAIN",
        intento: intento.id,
        semilla: intento.semilla!,
        largoInicial: intento.largoInicial!,
        nivelAnterior: previos[0]?.resultado?.nivel ?? null,
        version: intento.version,
      };
    }
    case "REAL_RECALL":
      return { juego: "REAL_RECALL", intento: intento.id, version: intento.version, pregunta: await preguntaQueToca(d, institutionId, e, intento) };
  }
}

async function preguntaQueToca(d: Dependencias, institutionId: string, e: Estudiante, intento: IntentoFila): Promise<PreguntaDeRecuerdo | null> {
  if (intento.estado !== "STARTED" || !intento.plan) return null;
  const repasos = await d.repo.repasosDeIntento(institutionId, intento.id);
  const toca = siguienteDeLaCola(intento.plan, repasos);
  if (!toca) return null;
  const items = await d.repo.itemsVisibles(institutionId, e.studentId, d.incluirSinteticos);
  const item = items.find((i) => i.id === toca.itemId);
  return item ? preguntaDe(item, toca.posicion, toca.total) : null;
}

/**
 * Empezar un juego dentro de la sesión.
 *
 * **La dificultad la fija el servidor acá**, con la historia real del
 * estudiante (ADR-102 §7): la semilla, el largo inicial y las preguntas. Un
 * intento anterior que quedó abierto —una recarga— se abandona: la partida nueva
 * tiene otra semilla y no se puede memorizar la anterior.
 */
export async function iniciarIntento(
  d: Dependencias,
  institutionId: string,
  pedido: Estudiante & { sesionId: string; juego: unknown; clave: string },
): Promise<ResultadoDeInicioDeIntento> {
  if (!esJuego(pedido.juego) || !pedido.clave.trim()) return { estado: "JUEGO_NO_PREVISTO" };
  const juego = pedido.juego;

  const sesion = await d.repo.sesionDelEstudiante(institutionId, pedido.studentId, pedido.sesionId);
  if (!sesion) return { estado: "NO_ENCONTRADA" };

  const previo = await d.repo.intentoPorClave(institutionId, sesion.id, pedido.clave);
  if (previo && previo.juego === juego) {
    return { estado: "OK", intento: await intentoEmpezado(d, institutionId, pedido, previo), duplicado: true };
  }

  if (sesion.estado !== "IN_PROGRESS") return { estado: "SESION_CERRADA" };
  if (!sesion.juegos.includes(juego)) return { estado: "JUEGO_NO_PREVISTO" };
  const intentos = await d.repo.intentosDeSesion(institutionId, sesion.id);
  if (intentos.some((i) => i.juego === juego && i.estado === "COMPLETED")) return { estado: "JUEGO_COMPLETADO" };

  let semilla: number | null = null;
  let largoInicial: number | null = null;
  let plan: string[] | null = null;
  let version: string;
  if (juego === "FLASH_GRID") {
    const previos = await d.repo.intentosCompletados(institutionId, pedido.studentId, juego);
    semilla = d.semilla();
    largoInicial = largoInicialDeCuadricula(previos.map((i) => i.resultado?.maximo ?? 0));
    version = REGLAS_CUADRICULA.version;
  } else if (juego === "REVERSE_CHAIN") {
    const previos = await d.repo.intentosCompletados(institutionId, pedido.studentId, juego);
    semilla = d.semilla();
    largoInicial = largoInicialDeCadena(previos[0]?.resultado?.nivel ?? null);
    version = REGLAS_CADENA.version;
  } else {
    plan = (await recuerdoDe(d, institutionId, pedido)).seleccion;
    if (plan.length === 0) return { estado: "SIN_PREGUNTAS" };
    version = POLITICA_DE_REPASO.version;
  }

  await d.repo.abandonarAbiertos(institutionId, sesion.id);
  const creado = await d.repo.crearIntento(institutionId, {
    studentId: pedido.studentId,
    sesionId: sesion.id,
    juego,
    version,
    semilla,
    largoInicial,
    plan,
    clave: pedido.clave,
  });
  if (!creado) {
    const ganador = await d.repo.intentoPorClave(institutionId, sesion.id, pedido.clave);
    if (!ganador) throw new Error("La base rechazó el intento y no hay ninguno con esa clave");
    return { estado: "OK", intento: await intentoEmpezado(d, institutionId, pedido, ganador), duplicado: true };
  }
  return { estado: "OK", intento: await intentoEmpezado(d, institutionId, pedido, creado), duplicado: false };
}

// ── Resultado ────────────────────────────────────────────────────────────────

export type ResultadoDeRegistro =
  | { estado: "OK"; resultado: ResultadoDeIntento; duplicado: boolean }
  | { estado: "NO_ENCONTRADO" }
  /** Se empezó otro intento del mismo juego, o la sesión se descartó. */
  | { estado: "INTENTO_REEMPLAZADO" }
  | { estado: "RESPUESTAS_INVALIDAS" }
  | { estado: "PARTIDA_SIN_TERMINAR" }
  /** Recuerdo real sin ninguna respuesta confirmada: no hay nada que guardar. */
  | { estado: "NADA_RESPONDIDO" };

const segundosEntre = (desde: string, hasta: string) => Math.max(0, Math.round((Date.parse(hasta) - Date.parse(desde)) / 1000));

async function resumenDe(d: Dependencias, institutionId: string, e: Estudiante, intento: IntentoFila): Promise<ResumenDeJuego> {
  const r = intento.resultado!;
  switch (intento.juego) {
    case "FLASH_GRID": {
      const anteriores = (await d.repo.intentosCompletados(institutionId, e.studentId, "FLASH_GRID")).filter(
        (i) => i.completadoEn !== null && intento.completadoEn !== null && i.completadoEn < intento.completadoEn,
      );
      return {
        juego: "FLASH_GRID",
        puntuacion: r.puntuacion ?? 0,
        secuenciaMaxima: r.maximo ?? 0,
        aciertos: r.aciertos,
        errores: r.errores,
        rondas: r.rondas ?? 0,
        marca: marcaDe(r.puntuacion ?? 0, mejor(anteriores.map((i) => i.resultado?.puntuacion))),
      };
    }
    case "REVERSE_CHAIN": {
      const anteriores = (await d.repo.intentosCompletados(institutionId, e.studentId, "REVERSE_CHAIN")).filter(
        (i) => i.completadoEn !== null && intento.completadoEn !== null && i.completadoEn < intento.completadoEn,
      );
      return {
        juego: "REVERSE_CHAIN",
        aciertos: r.aciertos,
        errores: r.errores,
        largoMaximoCorrecto: r.maximo ?? 0,
        nivelAnterior: r.nivelAnterior,
        nivel: r.nivel ?? 1,
        marca: marcaDe(r.maximo ?? 0, mejor(anteriores.map((i) => i.resultado?.maximo))),
      };
    }
    case "REAL_RECALL": {
      const [repasos, items] = await Promise.all([
        d.repo.repasosDeIntento(institutionId, intento.id),
        d.repo.itemsVisibles(institutionId, e.studentId, d.incluirSinteticos),
      ]);
      const porId = new Map(items.map((i) => [i.id, i]));
      return {
        juego: "REAL_RECALL",
        respondidas: repasos.length,
        recordadas: repasos.filter((x) => x.resultado === "RECALLED" || x.resultado === "EASY").length,
        parciales: repasos.filter((x) => x.resultado === "PARTIAL").length,
        noRecordadas: repasos.filter((x) => x.resultado === "NOT_RECALLED").length,
        materias: [...new Set(repasos.map((x) => porId.get(x.itemId)?.materia).filter((m): m is string => !!m))],
        proximoRepaso: repasos.map((x) => x.proximoRepaso).sort()[0] ?? null,
      };
    }
  }
}

async function resultadoDe(d: Dependencias, institutionId: string, e: Estudiante, intento: IntentoFila): Promise<ResultadoDeIntento> {
  const sesionCompletada = await cerrarSiEstaCompleta(d, institutionId, intento.sesionId, e.studentId);
  let sesion: ResultadoDeIntento["sesion"] = null;
  if (sesionCompletada) {
    const completos = (await d.repo.intentosDeSesion(institutionId, intento.sesionId))
      .filter((i) => i.estado === "COMPLETED")
      .sort((a, b) => a.completadoEn!.localeCompare(b.completadoEn!));
    const juegos = await Promise.all(
      completos.map(async (i) => ({ resumen: await resumenDe(d, institutionId, e, i), duracionSegundos: segundosEntre(i.iniciadoEn, i.completadoEn!) })),
    );
    sesion = { juegos, duracionSegundos: juegos.reduce((s, j) => s + j.duracionSegundos, 0) };
  }
  return {
    resumen: await resumenDe(d, institutionId, e, intento),
    sesionCompletada,
    duracionSegundos: segundosEntre(intento.iniciadoEn, intento.completadoEn ?? d.ahora()),
    sesion,
  };
}

function esListaDeCasillas(v: unknown): v is number[][] {
  return Array.isArray(v) && v.length <= REGLAS_CUADRICULA.rondasMaximas
    && v.every((r) => Array.isArray(r) && r.length <= REGLAS_CUADRICULA.largoMaximo && r.every((c) => Number.isInteger(c)));
}

function esListaDeCadenas(v: unknown): v is string[] {
  return Array.isArray(v) && v.length <= REGLAS_CADENA.pruebasPorSesion && v.every((r) => typeof r === "string" && r.length <= 40);
}

async function completar(
  d: Dependencias,
  institutionId: string,
  e: Estudiante,
  intento: IntentoFila,
  resultado: ResultadoGuardado,
): Promise<ResultadoDeRegistro> {
  const completo = await d.repo.completarIntento(institutionId, intento.id, resultado, d.ahora());
  if (!completo) {
    const releido = await d.repo.intentoDelEstudiante(institutionId, e.studentId, intento.id);
    if (releido?.estado === "COMPLETED") return { estado: "OK", resultado: await resultadoDe(d, institutionId, e, releido), duplicado: true };
    return { estado: "INTENTO_REEMPLAZADO" };
  }
  await d.eventos.publicar({
    nombre: "GymAttemptCompleted",
    institutionId,
    actorId: e.studentId,
    sujetoTipo: "gym_attempt",
    sujetoId: completo.id,
    causa: completo.juego,
    // Sólo lo necesario: qué juego, con qué reglas y si superó su marca. Ni
    // respuestas ni preguntas.
    payload: { juego: completo.juego, version: completo.version, marcaPersonal: resultado.marcaPersonal },
  });
  return { estado: "OK", resultado: await resultadoDe(d, institutionId, e, completo), duplicado: false };
}

/**
 * Confirmar el resultado de un juego. **Idempotente:** un intento completado
 * devuelve su resultado guardado, sin recalcular ni otro evento.
 *
 * Para la cuadrícula y la cadena, `respuestas` son las de cada ronda y la
 * partida tiene que estar terminada según las reglas. Para Recuerdo real es
 * *salir guardando*: se completa con lo ya confirmado.
 */
export async function registrarResultado(
  d: Dependencias,
  institutionId: string,
  pedido: Estudiante & { intentoId: string; respuestas: unknown },
): Promise<ResultadoDeRegistro> {
  const intento = await d.repo.intentoDelEstudiante(institutionId, pedido.studentId, pedido.intentoId);
  if (!intento) return { estado: "NO_ENCONTRADO" };
  if (intento.estado === "COMPLETED") {
    return { estado: "OK", resultado: await resultadoDe(d, institutionId, pedido, intento), duplicado: true };
  }
  if (!canTransition(gymAttemptTransitions, intento.estado, "COMPLETED")) return { estado: "INTENTO_REEMPLAZADO" };

  if (intento.juego === "FLASH_GRID") {
    if (!esListaDeCasillas(pedido.respuestas)) return { estado: "RESPUESTAS_INVALIDAS" };
    const jugada = jugarCuadricula(intento.semilla!, intento.largoInicial!, pedido.respuestas);
    if (jugada.estado !== "OK") return { estado: "RESPUESTAS_INVALIDAS" };
    if (!jugada.partida.terminada) return { estado: "PARTIDA_SIN_TERMINAR" };
    const r = jugada.partida.resultado;
    const previos = await d.repo.intentosCompletados(institutionId, pedido.studentId, "FLASH_GRID");
    return completar(d, institutionId, pedido, intento, {
      respuestas: pedido.respuestas,
      rondas: r.rondas.length,
      aciertos: r.aciertos,
      errores: r.errores,
      maximo: r.secuenciaMaxima,
      maximoIntentado: null,
      puntuacion: r.puntuacion,
      nivelAnterior: null,
      nivel: null,
      parciales: null,
      marcaPersonal: marcaDe(r.puntuacion, mejor(previos.map((i) => i.resultado?.puntuacion))) === "NUEVA",
    });
  }

  if (intento.juego === "REVERSE_CHAIN") {
    if (!esListaDeCadenas(pedido.respuestas)) return { estado: "RESPUESTAS_INVALIDAS" };
    const jugada = jugarCadena(intento.semilla!, intento.largoInicial!, pedido.respuestas);
    if (jugada.estado !== "OK") return { estado: "RESPUESTAS_INVALIDAS" };
    if (!jugada.partida.terminada) return { estado: "PARTIDA_SIN_TERMINAR" };
    const r = jugada.partida.resultado;
    const previos = await d.repo.intentosCompletados(institutionId, pedido.studentId, "REVERSE_CHAIN");
    const nivelAnterior = previos[0]?.resultado?.nivel ?? null;
    return completar(d, institutionId, pedido, intento, {
      respuestas: pedido.respuestas,
      rondas: r.pruebas.length,
      aciertos: r.aciertos,
      errores: r.errores,
      maximo: r.largoMaximoCorrecto,
      maximoIntentado: r.largoMaximoIntentado,
      puntuacion: null,
      nivelAnterior,
      nivel: nivelResultante(nivelAnterior, r.largoConsolidado),
      parciales: null,
      marcaPersonal: marcaDe(r.largoMaximoCorrecto, mejor(previos.map((i) => i.resultado?.maximo))) === "NUEVA",
    });
  }

  // REAL_RECALL: salir guardando.
  const repasos = await d.repo.repasosDeIntento(institutionId, intento.id);
  if (repasos.length === 0) return { estado: "NADA_RESPONDIDO" };
  return completarRecuerdo(d, institutionId, pedido, intento, repasos);
}

function completarRecuerdo(d: Dependencias, institutionId: string, e: Estudiante, intento: IntentoFila, repasos: RepasoFila[]) {
  return completar(d, institutionId, e, intento, {
    respuestas: null,
    rondas: repasos.length,
    aciertos: repasos.filter((x) => x.resultado === "RECALLED" || x.resultado === "EASY").length,
    errores: repasos.filter((x) => x.resultado === "NOT_RECALLED").length,
    maximo: null,
    maximoIntentado: null,
    puntuacion: null,
    nivelAnterior: null,
    nivel: null,
    parciales: repasos.filter((x) => x.resultado === "PARTIAL").length,
    // Recuerdo real no tiene marca: repasar no es competir con uno mismo.
    marcaPersonal: false,
  });
}

// ── Recuerdo real ────────────────────────────────────────────────────────────

export type ResultadoDePregunta =
  | { estado: "OK"; pregunta: PreguntaDeRecuerdo | null }
  | { estado: "NO_ENCONTRADO" };

/** La pregunta que toca, para retomar después de una recarga. **Sin la respuesta.** */
export async function preguntaActual(
  d: Dependencias,
  institutionId: string,
  pedido: Estudiante & { intentoId: string },
): Promise<ResultadoDePregunta> {
  const intento = await d.repo.intentoDelEstudiante(institutionId, pedido.studentId, pedido.intentoId);
  if (!intento || intento.juego !== "REAL_RECALL") return { estado: "NO_ENCONTRADO" };
  return { estado: "OK", pregunta: await preguntaQueToca(d, institutionId, pedido, intento) };
}

export type AccionDeRecuerdo = "RESPONDER" | "REVELAR" | "AUTOEVALUAR";

export type ResultadoDeRespuesta =
  | { estado: "OK"; registrada: RespuestaRegistrada; duplicado: boolean }
  /** Una abierta: la referencia, **sin guardar nada**. Abrir no es responder. */
  | { estado: "REVELADA"; respuestaCanonica: string; explicacion: string | null }
  | { estado: "NO_ENCONTRADO" }
  | { estado: "INTENTO_CERRADO" }
  /** No es la pregunta que toca en la cola. */
  | { estado: "NO_TOCA" }
  | { estado: "TIPO_INCORRECTO" }
  | { estado: "RESPUESTA_INVALIDA" };

/**
 * Responder una pregunta de Recuerdo real.
 *
 * - **`RESPONDER`** — una cerrada: el servidor corrige y guarda.
 * - **`REVELAR`** — una abierta confirmada: devuelve la referencia y **no guarda**.
 * - **`AUTOEVALUAR`** — la abierta, clasificada por el estudiante: se guarda.
 *
 * ⚠️ **La respuesta canónica sólo sale después de confirmar.** Y sólo de la
 * pregunta que toca: pedir la de otra devuelve `NO_TOCA`.
 */
export async function responderRecuerdo(
  d: Dependencias,
  institutionId: string,
  pedido: Estudiante & {
    intentoId: string;
    itemId: string;
    accion: unknown;
    respuesta: unknown;
    resultado: unknown;
    clave: string;
  },
): Promise<ResultadoDeRespuesta> {
  const accion = pedido.accion;
  if (accion !== "RESPONDER" && accion !== "REVELAR" && accion !== "AUTOEVALUAR") return { estado: "RESPUESTA_INVALIDA" };
  if (accion !== "REVELAR" && !pedido.clave.trim()) return { estado: "RESPUESTA_INVALIDA" };

  const intento = await d.repo.intentoDelEstudiante(institutionId, pedido.studentId, pedido.intentoId);
  if (!intento || intento.juego !== "REAL_RECALL" || !intento.plan) return { estado: "NO_ENCONTRADO" };

  const items = await d.repo.itemsVisibles(institutionId, pedido.studentId, d.incluirSinteticos);
  const porId = new Map(items.map((i) => [i.id, i]));

  // La idempotencia va antes que la regla, como en ADR-084: un reintento de una
  // respuesta ya guardada devuelve lo que se guardó.
  if (accion !== "REVELAR") {
    const previa = await d.repo.repasoPorClave(institutionId, pedido.studentId, pedido.clave);
    if (previa) {
      if (previa.intentoId !== intento.id || previa.itemId !== pedido.itemId) return { estado: "RESPUESTA_INVALIDA" };
      return { estado: "OK", registrada: await registrada(d, institutionId, pedido, intento, previa, porId), duplicado: true };
    }
  }

  if (intento.estado !== "STARTED") return { estado: "INTENTO_CERRADO" };
  const repasos = await d.repo.repasosDeIntento(institutionId, intento.id);
  const toca = siguienteDeLaCola(intento.plan, repasos);
  if (!toca || toca.itemId !== pedido.itemId) return { estado: "NO_TOCA" };
  const item = porId.get(pedido.itemId);
  if (!item) return { estado: "NO_ENCONTRADO" };

  let resultado: ResultadoDeRecuerdo;
  let respuesta: string | null = null;
  if (accion === "REVELAR" || accion === "AUTOEVALUAR") {
    if (esCerrada(item.tipo)) return { estado: "TIPO_INCORRECTO" };
    if (accion === "REVELAR") return { estado: "REVELADA", respuestaCanonica: item.canonica, explicacion: item.explicacion };
    if (!esResultadoDeRecuerdo(pedido.resultado)) return { estado: "RESPUESTA_INVALIDA" };
    resultado = pedido.resultado;
  } else {
    if (!esCerrada(item.tipo) || !item.aceptadas) return { estado: "TIPO_INCORRECTO" };
    if (typeof pedido.respuesta !== "string") return { estado: "RESPUESTA_INVALIDA" };
    respuesta = pedido.respuesta.trim();
    if (respuesta === "" || respuesta.length > POLITICA_DE_REPASO.largoMaximoDeRespuesta) return { estado: "RESPUESTA_INVALIDA" };
    resultado = resultadoDeCerrada(corregirCerrada(item.tipo, item.aceptadas, respuesta));
  }

  const creado = await d.repo.crearRepaso(institutionId, {
    studentId: pedido.studentId,
    itemId: item.id,
    version: item.version,
    intentoId: intento.id,
    posicion: toca.posicion,
    resultado,
    automatica: accion === "RESPONDER",
    respuesta,
    politica: POLITICA_DE_REPASO.version,
    proximoRepaso: proximoRepaso(hoyDe(d, pedido.zona), resultado),
    clave: pedido.clave,
  });
  if (!creado) {
    const ganador = await d.repo.repasoPorClave(institutionId, pedido.studentId, pedido.clave);
    if (!ganador) return { estado: "NO_TOCA" };
    return { estado: "OK", registrada: await registrada(d, institutionId, pedido, intento, ganador, porId), duplicado: true };
  }
  return { estado: "OK", registrada: await registrada(d, institutionId, pedido, intento, creado, porId), duplicado: false };
}

/** Lo que vuelve después de guardar: la corrección, la referencia, lo que sigue y —si terminó— el cierre. */
async function registrada(
  d: Dependencias,
  institutionId: string,
  e: Estudiante,
  intento: IntentoFila,
  repaso: RepasoFila,
  porId: Map<string, ItemFila>,
): Promise<RespuestaRegistrada> {
  const item = porId.get(repaso.itemId);
  const repasos = await d.repo.repasosDeIntento(institutionId, intento.id);
  const toca = siguienteDeLaCola(intento.plan ?? [], repasos);
  const siguienteItem = toca ? porId.get(toca.itemId) : undefined;

  let final: ResultadoDeIntento | null = null;
  if (!toca) {
    const actual = await d.repo.intentoDelEstudiante(institutionId, e.studentId, intento.id);
    if (actual?.estado === "COMPLETED") final = await resultadoDe(d, institutionId, e, actual);
    else if (actual?.estado === "STARTED") {
      const r = await completarRecuerdo(d, institutionId, e, actual, repasos);
      if (r.estado === "OK") final = r.resultado;
    }
  }

  const cerrada = item ? esCerrada(item.tipo) : false;
  return {
    correcta: cerrada ? repaso.resultado === "RECALLED" : null,
    resultado: repaso.resultado,
    respuestaCanonica: item?.canonica ?? "",
    explicacion: item?.explicacion ?? null,
    proximoRepaso: repaso.proximoRepaso,
    siguiente: toca && siguienteItem ? preguntaDe(siguienteItem, toca.posicion, toca.total) : null,
    final,
  };
}

/** Los juegos de la categoría, para quien necesite el orden sin importar el dominio entero. */
export { JUEGOS_DE_MEMORIA };
