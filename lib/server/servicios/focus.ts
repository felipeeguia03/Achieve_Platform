/**
 * Service de **Modo Focus** — [ADR-104](../../../docs/decisions.md#adr-104).
 *
 * El dominio decide (`lib/domain/sesion-de-focus.ts`, puro); acá se lee, se
 * avanza el reloj, se aplica el comando y se escribe **todo o nada** por la
 * función de base. La base garantiza lo que dos pedidos simultáneos podrían
 * saltearse: una sola sesión abierta, un solo tramo abierto, la versión.
 *
 * ## Lo que este Service NO hace, y cada ausencia es la decisión
 *
 * - **No crea `Evidence`, progreso ni cumplimiento.** Empezar no es cumplir y
 *   cerrar no es entregar (AGENTS.md §2.1).
 * - **No lleva el compromiso a `COMPLETED`.** La entrega exige un compromiso
 *   vivo y el cierre lo hace la validación (ADR-104 §15).
 * - **No cierra sesiones por tiempo.** Las cierra el estudiante (§11).
 * - **No publica el anotador.** Ni en eventos ni en ningún lado (§12).
 */
import { focusSessionTransitions, canTransition } from "@/lib/domain/state-machines";
import {
  aplicarComando,
  avanzarReloj,
  esModoDeFoco,
  esPreset,
  esSonido,
  faseDe,
  MAXIMO_DE_ANOTADOR,
  MAXIMO_DE_AVANCE,
  presetDe,
  resumenDe,
  validarPomodoro,
  type Comando,
  type EstadoDeSesion,
  type Fase,
  type PreferenciasDeFocus,
  type PresetOPersonalizado,
  type Tramo,
} from "@/lib/domain/sesion-de-focus";
import type { ActionStatus, CommitmentState } from "@/lib/domain/types";
import type { PublicadorDeEventos } from "./eventos";

export interface SesionFila {
  id: string;
  studentId: string;
  cursadaId: string;
  accionId: string;
  compromisoId: string;
  horarioAcordado: string;
  minutosAcordados: number;
  version: number;
  cierre: "SAVED" | "DONE" | null;
  avance: string | null;
  anotador: string | null;
  anotadorGuardadoEn: string | null;
  sesion: EstadoDeSesion;
}

/** Lo que hace falta saber de un compromiso para empezar sobre él. */
export interface CompromisoParaFocus {
  id: string;
  studentId: string;
  cursadaId: string;
  accionId: string;
  estado: CommitmentState;
  estadoDeAccion: ActionStatus;
  inicio: string;
  minutos: number;
}

/** Las filas que un comando escribe, en la forma de `aplicar_comando_de_focus`. */
export interface Escritura {
  sesion: Record<string, unknown>;
  cerrar: Array<{ id: string; ended_at: string; end_reason: string }>;
  abrir: Array<Record<string, unknown>>;
}

export type Preferencias = PreferenciasDeFocus;

export const PREFERENCIAS_INICIALES: Preferencias = {
  ultimoModo: "FREE",
  preset: null,
  personalizado: null,
  // Apagado la primera vez (§19).
  sonido: "NINGUNO",
  volumen: 40,
};

export interface RepositorioDeFocus {
  /** Scoped por estudiante: el compromiso ajeno **no existe** para esta lectura. */
  compromisoDelEstudiante(institutionId: string, studentId: string, compromisoId: string): Promise<CompromisoParaFocus | null>;
  /**
   * El compromiso vivo del estudiante —acotado a la cursada, si se pide—: primero
   * el `STARTED`, después el `DUE`, después el `CONFIRMED`; a igualdad, el más
   * reciente (ADR-104 §4). Hoy sólo ofrece *Empezar* si existe uno.
   */
  compromisoVigente(institutionId: string, studentId: string, cursadaId: string | null): Promise<CompromisoParaFocus | null>;
  abierta(institutionId: string, studentId: string): Promise<SesionFila | null>;
  delEstudiante(institutionId: string, studentId: string, sesionId: string): Promise<SesionFila | null>;
  /** `null` ⇒ la base rechazó por la unicidad de la abierta. */
  crear(institutionId: string, c: CompromisoParaFocus, ahora: string): Promise<string | null>;
  /** `null` ⇒ la versión ya no era ésa, o la sesión ya estaba cerrada. */
  aplicar(institutionId: string, sesionId: string, version: number, e: Escritura): Promise<number | null>;
  guardarAnotador(institutionId: string, sesionId: string, texto: string | null, ahora: string): Promise<void>;
  preferencias(institutionId: string, studentId: string): Promise<Preferencias | null>;
  guardarPreferencias(institutionId: string, studentId: string, p: Preferencias, ahora: string): Promise<void>;
}

/**
 * Las transiciones de `Commitment` y `Action` entran por inyección: son las del
 * Service de cada uno, con su compare-and-swap y su evento. Focus **no escribe
 * estados de otras entidades por su cuenta**.
 */
export interface Dependencias {
  repo: RepositorioDeFocus;
  eventos: PublicadorDeEventos;
  ahora: () => string;
  iniciarCompromiso(institutionId: string, compromisoId: string, actorId: string): Promise<void>;
  llevarAccion(institutionId: string, accionId: string, hacia: "IN_PROGRESS" | "EVIDENCE_PENDING", actorId: string): Promise<void>;
}

const INICIABLES: readonly CommitmentState[] = ["CONFIRMED", "DUE", "STARTED"];
const ACCIONES_EN_JUEGO: readonly ActionStatus[] = ["COMMITTED", "IN_PROGRESS", "EVIDENCE_PENDING"];

// ── Empezar ──────────────────────────────────────────────────────────────────

export type ResultadoDeInicio =
  | { estado: "OK"; sesion: SesionFila; duplicado: boolean }
  /** Hay otra abierta, sobre otro compromiso. Se devuelve para poder volver a ella. */
  | { estado: "YA_HAY_OTRA_ABIERTA"; sesion: SesionFila }
  | { estado: "SIN_COMPROMISO" }
  | { estado: "NO_INICIABLE"; compromiso: CommitmentState; accion: ActionStatus };

/**
 * Empezar — `CTA-026` (ADR-104 §3).
 *
 * El orden importa: primero el compromiso a `STARTED` y la acción a
 * `IN_PROGRESS` **por su máquina**, después la sesión. Si algo se corta en el
 * medio, repetir el pedido crea la sesión: `STARTED` es donde ya tenía que estar.
 */
export async function empezar(
  d: Dependencias,
  institutionId: string,
  pedido: { studentId: string; compromisoId: string | null; cursadaId: string | null },
): Promise<ResultadoDeInicio> {
  const abierta = await d.repo.abierta(institutionId, pedido.studentId);

  const compromiso = pedido.compromisoId
    ? await d.repo.compromisoDelEstudiante(institutionId, pedido.studentId, pedido.compromisoId)
    : await d.repo.compromisoVigente(institutionId, pedido.studentId, pedido.cursadaId);

  if (abierta) {
    // Sin compromiso pedido, o el mismo: es volver a la sesión. Otro: 409.
    if (!pedido.compromisoId || abierta.compromisoId === compromiso?.id) {
      return { estado: "OK", sesion: abierta, duplicado: true };
    }
    return { estado: "YA_HAY_OTRA_ABIERTA", sesion: abierta };
  }

  if (!compromiso) return { estado: "SIN_COMPROMISO" };
  if (!INICIABLES.includes(compromiso.estado) || !ACCIONES_EN_JUEGO.includes(compromiso.estadoDeAccion)) {
    return { estado: "NO_INICIABLE", compromiso: compromiso.estado, accion: compromiso.estadoDeAccion };
  }

  if (compromiso.estado !== "STARTED") await d.iniciarCompromiso(institutionId, compromiso.id, pedido.studentId);
  if (compromiso.estadoDeAccion === "COMMITTED") {
    await d.llevarAccion(institutionId, compromiso.accionId, "IN_PROGRESS", pedido.studentId);
  }

  const id = await d.repo.crear(institutionId, compromiso, d.ahora());
  if (!id) {
    // Dos pedidos llegaron juntos y la base dejó entrar a uno.
    const ganadora = await d.repo.abierta(institutionId, pedido.studentId);
    if (!ganadora) throw new Error("La base rechazó la sesión y no hay ninguna abierta");
    return ganadora.compromisoId === compromiso.id
      ? { estado: "OK", sesion: ganadora, duplicado: true }
      : { estado: "YA_HAY_OTRA_ABIERTA", sesion: ganadora };
  }

  await d.eventos.publicar({
    nombre: "FocusSessionStarted",
    institutionId,
    actorId: pedido.studentId,
    sujetoTipo: "focus_session",
    sujetoId: id,
    causa: `desde:${compromiso.estado}`,
  });

  const creada = await d.repo.delEstudiante(institutionId, pedido.studentId, id);
  if (!creada) throw new Error("La sesión recién creada no se pudo leer");
  return { estado: "OK", sesion: creada, duplicado: false };
}

// ── Comandos ─────────────────────────────────────────────────────────────────

/** Lo que un comando necesita escribir: la sesión, lo que se cierra y lo que se abre. */
export function escrituraDe(antes: EstadoDeSesion, despues: EstadoDeSesion, ahora: string, avance?: string | null): Escritura {
  const cerrar: Escritura["cerrar"] = [];
  const abrir: Escritura["abrir"] = [];
  for (const t of despues.tramos) {
    if (t.id === null) {
      abrir.push(filaDeTramo(t));
      continue;
    }
    const previo = antes.tramos.find((x) => x.id === t.id);
    if (previo && previo.fin === null && t.fin !== null) {
      cerrar.push({ id: t.id, ended_at: t.fin, end_reason: t.motivo ?? "SAVED" });
    }
  }

  const cerrada = despues.estado === "ENDED";
  const r = cerrada ? resumenDe(despues, ahora) : null;
  const p = despues.pomodoro;
  const sesion: Record<string, unknown> = {
    status: despues.estado,
    mode: despues.modo,
    pomodoro_focus_minutes: p?.foco ?? null,
    pomodoro_short_break_minutes: p?.descansoCorto ?? null,
    pomodoro_long_break_minutes: p?.descansoLargo ?? null,
    pomodoro_blocks_before_long: p?.bloquesAntesDelLargo ?? null,
    last_heartbeat_at: despues.ultimoLatido,
    ended_at: despues.terminadaEn,
    end_kind: null,
    focus_seconds: r?.focoSegundos ?? null,
    break_seconds: r?.descansoSegundos ?? null,
    paused_seconds: r?.pausadoSegundos ?? null,
    pauses: r?.pausas ?? null,
    complete_blocks: r?.bloquesCompletos ?? null,
    partial_blocks: r?.bloquesParciales ?? null,
  };
  if (avance !== undefined) sesion.advance_text = avance;
  return { sesion, cerrar, abrir };
}

function filaDeTramo(t: Tramo): Record<string, unknown> {
  return {
    kind: t.tipo,
    mode: t.modo,
    block_number: t.bloque,
    break_kind: t.descanso,
    started_at: t.inicio,
    planned_end_at: t.finPlaneado,
    ended_at: t.fin,
    end_reason: t.motivo,
  };
}

export type ResultadoDeComando =
  | { estado: "OK"; sesion: SesionFila }
  | { estado: "NO_ENCONTRADA" }
  | { estado: "FASE_INVALIDA"; fase: Fase; sesion: SesionFila }
  | { estado: "CONFIGURACION_INVALIDA" }
  | { estado: "DEMASIADO_LARGO" };

/** Lo que llega del cliente, sin validar. */
export type ComandoEntrante =
  | { tipo: "PAUSAR" | "CONTINUAR" | "VOLVER_ANTES" | "LATIDO" }
  | { tipo: "POMODORO"; configuracion: unknown }
  | { tipo: "RECUPERAR"; opcion: unknown };

function comandoDe(entrante: ComandoEntrante): Comando | null {
  switch (entrante.tipo) {
    case "POMODORO": {
      const c = validarPomodoro(entrante.configuracion);
      return c ? { tipo: "POMODORO", configuracion: c } : null;
    }
    case "RECUPERAR":
      return entrante.opcion === "REANUDAR" || entrante.opcion === "REVISAR"
        ? { tipo: "RECUPERAR", opcion: entrante.opcion }
        : null;
    case "PAUSAR":
    case "CONTINUAR":
    case "VOLVER_ANTES":
    case "LATIDO":
      return { tipo: entrante.tipo };
    default:
      return null;
  }
}

/**
 * Aplica un comando o un cierre. Relee y reintenta **una vez** si otro pedido
 * ganó la versión: el doble clic sobre *Pausar* termina en una pausa, no en un
 * error.
 */
async function ejecutar(
  d: Dependencias,
  institutionId: string,
  studentId: string,
  sesionId: string,
  comando: Comando,
  cierre?: { como: "SAVED" | "DONE"; avance: string | null },
): Promise<ResultadoDeComando> {
  for (let intento = 0; intento < 2; intento++) {
    const fila = await d.repo.delEstudiante(institutionId, studentId, sesionId);
    if (!fila) return { estado: "NO_ENCONTRADA" };

    const ahora = d.ahora();
    const avanzada = avanzarReloj(fila.sesion, ahora);
    if (fila.sesion.estado === "ENDED") return { estado: "FASE_INVALIDA", fase: "FINALIZADA", sesion: fila };

    const r = aplicarComando(avanzada, comando, ahora);
    if (r.estado !== "OK") return { estado: "FASE_INVALIDA", fase: r.fase, sesion: fila };

    const escritura = escrituraDe(fila.sesion, r.sesion, ahora, cierre ? cierre.avance : undefined);
    if (cierre) escritura.sesion.end_kind = cierre.como;

    const version = await d.repo.aplicar(institutionId, fila.id, fila.version, escritura);
    if (version === null) continue;

    const releida = await d.repo.delEstudiante(institutionId, studentId, sesionId);
    if (!releida) return { estado: "NO_ENCONTRADA" };
    return { estado: "OK", sesion: releida };
  }
  const actual = await d.repo.delEstudiante(institutionId, studentId, sesionId);
  if (!actual) return { estado: "NO_ENCONTRADA" };
  return { estado: "FASE_INVALIDA", fase: faseDe(avanzarReloj(actual.sesion, d.ahora()), d.ahora()), sesion: actual };
}

export async function comando(
  d: Dependencias,
  institutionId: string,
  pedido: { studentId: string; sesionId: string; comando: ComandoEntrante },
): Promise<ResultadoDeComando> {
  const c = comandoDe(pedido.comando);
  if (!c) return { estado: "CONFIGURACION_INVALIDA" };
  const r = await ejecutar(d, institutionId, pedido.studentId, pedido.sesionId, c);
  // Recordar el último modo y preset: preferencia, no perfil (§18).
  if (r.estado === "OK" && c.tipo === "POMODORO") {
    const previas = (await d.repo.preferencias(institutionId, pedido.studentId)) ?? PREFERENCIAS_INICIALES;
    const preset = presetDe(c.configuracion);
    await d.repo.guardarPreferencias(
      institutionId,
      pedido.studentId,
      { ...previas, ultimoModo: "POMODORO", preset, personalizado: preset === "PERSONALIZADO" ? c.configuracion : previas.personalizado },
      d.ahora(),
    );
  }
  return r;
}

// ── Cerrar ───────────────────────────────────────────────────────────────────

export type ComoCerrar = "SAVED" | "DONE" | "RECUPERADA";

/**
 * *Salir y guardar* (`CTA-027`), *Terminé · Subir evidencia* (`CTA-006`) y
 * *Terminé cuando se cerró* (la recuperación).
 *
 * ⚠️ **Idempotente**: cerrar una cerrada devuelve la misma, sin otro evento. Y
 * *Terminé* lleva la acción a `EVIDENCE_PENDING` **aunque la sesión ya estuviera
 * cerrada**: el reintento de un pedido que se cortó después de cerrar tiene que
 * terminar donde iba.
 */
export async function cerrar(
  d: Dependencias,
  institutionId: string,
  pedido: { studentId: string; sesionId: string; como: ComoCerrar; avance: string | null },
): Promise<ResultadoDeComando> {
  const avance = pedido.avance?.trim() || null;
  if (avance && avance.length > MAXIMO_DE_AVANCE) return { estado: "DEMASIADO_LARGO" };

  const previa = await d.repo.delEstudiante(institutionId, pedido.studentId, pedido.sesionId);
  if (!previa) return { estado: "NO_ENCONTRADA" };

  let resultado: ResultadoDeComando;
  if (!canTransition(focusSessionTransitions, previa.sesion.estado, "ENDED")) {
    resultado = { estado: "OK", sesion: previa };
  } else {
    const c: Comando = pedido.como === "RECUPERADA" ? { tipo: "CERRAR_EN_EL_ULTIMO_LATIDO" } : { tipo: "CERRAR", como: pedido.como };
    resultado = await ejecutar(d, institutionId, pedido.studentId, pedido.sesionId, c, {
      como: pedido.como === "DONE" ? "DONE" : "SAVED",
      avance,
    });
    if (resultado.estado === "OK") {
      await d.eventos.publicar({
        nombre: "FocusSessionEnded",
        institutionId,
        actorId: pedido.studentId,
        sujetoTipo: "focus_session",
        sujetoId: previa.id,
        causa: pedido.como === "DONE" ? "termine" : pedido.como === "RECUPERADA" ? "recuperacion" : "salir-y-guardar",
      });
    }
  }

  if (resultado.estado === "OK" && pedido.como === "DONE") {
    await d.llevarAccion(institutionId, previa.accionId, "EVIDENCE_PENDING", pedido.studentId);
  }
  return resultado;
}

export type ResultadoDeTerminado =
  | { estado: "OK"; accionId: string }
  | { estado: "SIN_COMPROMISO" }
  | { estado: "HAY_UNA_SESION_ABIERTA"; sesion: SesionFila }
  | { estado: "NO_INICIABLE"; compromiso: CommitmentState; accion: ActionStatus };

/**
 * *Terminé · Subir evidencia* **sin sesión abierta** — para quien trabajó sin
 * reloj (§15). Recorre la máquina entera: un compromiso que nunca empezó pasa
 * por `STARTED` y la acción por `IN_PROGRESS` antes de `EVIDENCE_PENDING`.
 */
export async function terminarSinSesion(
  d: Dependencias,
  institutionId: string,
  pedido: { studentId: string; compromisoId: string | null; cursadaId: string | null },
): Promise<ResultadoDeTerminado> {
  const abierta = await d.repo.abierta(institutionId, pedido.studentId);
  if (abierta) return { estado: "HAY_UNA_SESION_ABIERTA", sesion: abierta };

  const c = pedido.compromisoId
    ? await d.repo.compromisoDelEstudiante(institutionId, pedido.studentId, pedido.compromisoId)
    : await d.repo.compromisoVigente(institutionId, pedido.studentId, pedido.cursadaId);
  if (!c) return { estado: "SIN_COMPROMISO" };
  if (c.estadoDeAccion === "EVIDENCE_PENDING") return { estado: "OK", accionId: c.accionId };
  if (!INICIABLES.includes(c.estado) || !ACCIONES_EN_JUEGO.includes(c.estadoDeAccion)) {
    return { estado: "NO_INICIABLE", compromiso: c.estado, accion: c.estadoDeAccion };
  }

  if (c.estado !== "STARTED") await d.iniciarCompromiso(institutionId, c.id, pedido.studentId);
  if (c.estadoDeAccion === "COMMITTED") await d.llevarAccion(institutionId, c.accionId, "IN_PROGRESS", pedido.studentId);
  await d.llevarAccion(institutionId, c.accionId, "EVIDENCE_PENDING", pedido.studentId);
  return { estado: "OK", accionId: c.accionId };
}

// ── El anotador y las preferencias ───────────────────────────────────────────

export type ResultadoDeAnotador = { estado: "OK" } | { estado: "NO_ENCONTRADA" } | { estado: "DEMASIADO_LARGO" };

/**
 * *Para después* — privado (§12). Se escribe también con la sesión cerrada: es
 * del estudiante, no un registro de la sesión.
 */
export async function guardarAnotador(
  d: Dependencias,
  institutionId: string,
  pedido: { studentId: string; sesionId: string; texto: string | null },
): Promise<ResultadoDeAnotador> {
  const texto = pedido.texto && pedido.texto.trim() !== "" ? pedido.texto : null;
  if (texto && texto.length > MAXIMO_DE_ANOTADOR) return { estado: "DEMASIADO_LARGO" };
  const fila = await d.repo.delEstudiante(institutionId, pedido.studentId, pedido.sesionId);
  if (!fila) return { estado: "NO_ENCONTRADA" };
  await d.repo.guardarAnotador(institutionId, fila.id, texto, d.ahora());
  return { estado: "OK" };
}

/** `null` ⇒ algo no es válido y no se guarda nada. */
export function validarPreferencias(valor: unknown): Preferencias | null {
  if (typeof valor !== "object" || valor === null) return null;
  const v = valor as Record<string, unknown>;
  if (!esModoDeFoco(v.ultimoModo) || !esSonido(v.sonido)) return null;
  if (typeof v.volumen !== "number" || !Number.isInteger(v.volumen) || v.volumen < 0 || v.volumen > 100) return null;
  const preset = v.preset === null || v.preset === undefined ? null : v.preset;
  if (preset !== null && !esPreset(preset) && preset !== "PERSONALIZADO") return null;
  const personalizado = v.personalizado === null || v.personalizado === undefined ? null : validarPomodoro(v.personalizado);
  if (v.personalizado && !personalizado) return null;
  return { ultimoModo: v.ultimoModo, preset: preset as PresetOPersonalizado | null, personalizado, sonido: v.sonido, volumen: v.volumen };
}

export async function guardarPreferencias(
  d: Dependencias,
  institutionId: string,
  pedido: { studentId: string; preferencias: unknown },
): Promise<{ estado: "OK"; preferencias: Preferencias } | { estado: "INVALIDAS" }> {
  const p = validarPreferencias(pedido.preferencias);
  if (!p) return { estado: "INVALIDAS" };
  await d.repo.guardarPreferencias(institutionId, pedido.studentId, p, d.ahora());
  return { estado: "OK", preferencias: p };
}
