/**
 * Service de **Modo Clase** — [ADR-098](../../../docs/decisions.md#adr-098).
 *
 * Las reglas viven acá; el Repository lee y escribe, y la base garantiza lo que
 * dos pedidos simultáneos podrían saltearse (una sola activa, la clave única).
 *
 * ## Lo que este Service NO hace, y cada ausencia es la decisión
 *
 * - **No crea `Evidence`, progreso ni `Action`s.** Abrir una clase no es
 *   evidencia de nada (AGENTS.md §2.1).
 * - **No escribe `class_session` ni `class_event_record`.** Aquélla es la clase
 *   dictada; ésta, un reporte de clase con contrato abierto (`C01-004`).
 * - **No cierra clases por tiempo.** La termina el estudiante (§2.3).
 * - **No emite un evento por marca.** Sólo el inicio y el fin.
 */
import { canTransition, classSessionTransitions } from "@/lib/domain/state-machines";
import {
  esTipoDeMarca,
  MAXIMO_DE_APUNTES,
  MAXIMO_DE_TEXTO_DE_MARCA,
  segundosEntre,
  type TipoDeMarca,
} from "@/lib/domain/sesion-de-clase";
import type { ClassSessionStatus } from "@/lib/domain/types";
import type { PublicadorDeEventos } from "./eventos";

export interface ClaseFila {
  id: string;
  studentId: string;
  cursadaId: string;
  bloqueId: string | null;
  horarioDesde: string | null;
  horarioHasta: string | null;
  estado: ClassSessionStatus;
  iniciadaEn: string;
  terminadaEn: string | null;
  apuntes: string | null;
  apuntesGuardadosEn: string | null;
}

export interface MarcaFila {
  id: string;
  claseId: string;
  tipo: TipoDeMarca;
  segundos: number;
  texto: string | null;
  clave: string;
  creadaEn: string;
}

export interface RepositorioDeClases {
  /** `true` si la cursada es del estudiante y está activa. */
  cursadaPropia(institutionId: string, studentId: string, cursadaId: string): Promise<boolean>;
  /** El horario del bloque **si pertenece a esa cursada** (o a su oferta). */
  horarioDeBloque(
    institutionId: string,
    cursadaId: string,
    bloqueId: string,
  ): Promise<{ desde: string; hasta: string } | null>;
  activa(institutionId: string, studentId: string): Promise<ClaseFila | null>;
  /** Scoped por estudiante: la ajena **no existe** para esta lectura. */
  delEstudiante(institutionId: string, studentId: string, claseId: string): Promise<ClaseFila | null>;
  /** `null` ⇒ la base rechazó por la unicidad de la activa. */
  crear(
    institutionId: string,
    datos: { studentId: string; cursadaId: string; bloqueId: string | null; desde: string | null; hasta: string | null },
  ): Promise<ClaseFila | null>;
  guardarApuntes(institutionId: string, claseId: string, apuntes: string, ahora: string): Promise<ClaseFila>;
  /** Compare-and-swap: sólo si sigue `ACTIVE`. `null` ⇒ no encontró ese estado. */
  terminar(institutionId: string, claseId: string, ahora: string): Promise<ClaseFila | null>;
  marcaPorClave(institutionId: string, claseId: string, clave: string): Promise<MarcaFila | null>;
  /** `null` ⇒ la base rechazó la clave: otro pedido la ganó primero. */
  crearMarca(
    institutionId: string,
    datos: { claseId: string; tipo: TipoDeMarca; segundos: number; texto: string | null; clave: string },
  ): Promise<MarcaFila | null>;
  /** La marca con su clase, sólo si la clase es del estudiante. */
  marcaDelEstudiante(institutionId: string, studentId: string, marcaId: string): Promise<MarcaFila | null>;
  guardarTextoDeMarca(institutionId: string, marcaId: string, texto: string | null, ahora: string): Promise<MarcaFila>;
}

export interface Dependencias {
  repo: RepositorioDeClases;
  eventos: PublicadorDeEventos;
  /** ISO. Inyectado para que el tiempo de una marca se pueda probar. */
  ahora: () => string;
}

// ── Iniciar ──────────────────────────────────────────────────────────────────

export type ResultadoDeInicio =
  | { estado: "OK"; clase: ClaseFila; duplicado: boolean }
  /** Hay otra activa, de otra materia. Se devuelve para poder volver a ella. */
  | { estado: "YA_HAY_OTRA_ACTIVA"; clase: ClaseFila }
  | { estado: "CURSADA_AJENA" }
  | { estado: "BLOQUE_AJENO" };

/**
 * Iniciar una clase — `CTA-022`.
 *
 * **Idempotente por construcción, sin clave:** una sola activa por estudiante,
 * así que repetir el pedido sobre la misma materia devuelve la misma clase. Si
 * la activa es de otra materia, no se abre una segunda (ADR-098 §2).
 */
export async function iniciarClase(
  d: Dependencias,
  institutionId: string,
  pedido: { studentId: string; cursadaId: string; bloqueId: string | null },
): Promise<ResultadoDeInicio> {
  if (!(await d.repo.cursadaPropia(institutionId, pedido.studentId, pedido.cursadaId))) {
    return { estado: "CURSADA_AJENA" };
  }

  const resolverActiva = (activa: ClaseFila): ResultadoDeInicio =>
    activa.cursadaId === pedido.cursadaId
      ? { estado: "OK", clase: activa, duplicado: true }
      : { estado: "YA_HAY_OTRA_ACTIVA", clase: activa };

  const activa = await d.repo.activa(institutionId, pedido.studentId);
  if (activa) return resolverActiva(activa);

  let horario: { desde: string; hasta: string } | null = null;
  if (pedido.bloqueId) {
    horario = await d.repo.horarioDeBloque(institutionId, pedido.cursadaId, pedido.bloqueId);
    if (!horario) return { estado: "BLOQUE_AJENO" };
  }

  const creada = await d.repo.crear(institutionId, {
    studentId: pedido.studentId,
    cursadaId: pedido.cursadaId,
    bloqueId: pedido.bloqueId,
    desde: horario?.desde ?? null,
    hasta: horario?.hasta ?? null,
  });

  // Dos pedidos llegaron juntos y la base dejó entrar a uno: se contesta con
  // el que ganó, igual que si hubiera llegado primero.
  if (!creada) {
    const ganadora = await d.repo.activa(institutionId, pedido.studentId);
    if (!ganadora) throw new Error("La base rechazó la clase y no hay ninguna activa");
    return resolverActiva(ganadora);
  }

  await d.eventos.publicar({
    nombre: "ClassSessionStarted",
    institutionId,
    actorId: pedido.studentId,
    sujetoTipo: "student_class_session",
    sujetoId: creada.id,
    causa: pedido.bloqueId ? "horario" : "manual",
  });
  return { estado: "OK", clase: creada, duplicado: false };
}

// ── Apuntes ──────────────────────────────────────────────────────────────────

export type ResultadoDeApuntes =
  | { estado: "OK"; clase: ClaseFila }
  | { estado: "NO_ENCONTRADA" }
  | { estado: "DEMASIADO_LARGO" };

/**
 * Guardar los apuntes. **Editables siempre**, también con la clase terminada:
 * son material del estudiante, no un reporte (ADR-098 §4). El último que llega
 * gana; el cliente manda el texto entero.
 */
export async function guardarApuntes(
  d: Dependencias,
  institutionId: string,
  pedido: { studentId: string; claseId: string; apuntes: string },
): Promise<ResultadoDeApuntes> {
  if (pedido.apuntes.length > MAXIMO_DE_APUNTES) return { estado: "DEMASIADO_LARGO" };
  const clase = await d.repo.delEstudiante(institutionId, pedido.studentId, pedido.claseId);
  if (!clase) return { estado: "NO_ENCONTRADA" };
  return { estado: "OK", clase: await d.repo.guardarApuntes(institutionId, clase.id, pedido.apuntes, d.ahora()) };
}

// ── Terminar ─────────────────────────────────────────────────────────────────

export type ResultadoDeFin =
  | { estado: "OK"; clase: ClaseFila; duplicado: boolean }
  | { estado: "NO_ENCONTRADA" };

/**
 * Terminar la clase — `CTA-023`.
 *
 * **Idempotente:** terminar una terminada devuelve la misma, sin otro evento.
 * La transición pasa por la tabla; la escritura, por compare-and-swap.
 */
export async function terminarClase(
  d: Dependencias,
  institutionId: string,
  pedido: { studentId: string; claseId: string },
): Promise<ResultadoDeFin> {
  const clase = await d.repo.delEstudiante(institutionId, pedido.studentId, pedido.claseId);
  if (!clase) return { estado: "NO_ENCONTRADA" };
  if (!canTransition(classSessionTransitions, clase.estado, "ENDED")) {
    return { estado: "OK", clase, duplicado: true };
  }

  const terminada = await d.repo.terminar(institutionId, clase.id, d.ahora());
  if (!terminada) {
    // Otro pedido la terminó entre la lectura y la escritura.
    const releida = await d.repo.delEstudiante(institutionId, pedido.studentId, pedido.claseId);
    if (!releida) return { estado: "NO_ENCONTRADA" };
    return { estado: "OK", clase: releida, duplicado: true };
  }

  await d.eventos.publicar({
    nombre: "ClassSessionEnded",
    institutionId,
    actorId: pedido.studentId,
    sujetoTipo: "student_class_session",
    sujetoId: terminada.id,
    causa: "estudiante",
  });
  return { estado: "OK", clase: terminada, duplicado: false };
}

// ── Marcar ───────────────────────────────────────────────────────────────────

export type ResultadoDeMarca =
  | { estado: "OK"; marca: MarcaFila; duplicado: boolean }
  | { estado: "NO_ENCONTRADA" }
  | { estado: "TIPO_INVALIDO" }
  | { estado: "SIN_CLAVE" }
  | { estado: "DEMASIADO_LARGO" }
  | { estado: "CLASE_TERMINADA" }
  | { estado: "CONFLICTO_DE_CLAVE" };

/**
 * Marcar un momento. **Un toque, sin formulario**: el texto es opcional.
 *
 * ⚠️ **La idempotencia va antes que la regla**, como en ADR-084: un reintento
 * que llega después de terminar la clase devuelve la marca que ya existe. A
 * *"¿la guardaste?"* la respuesta sigue siendo sí.
 *
 * ⚠️ **El momento lo pone el servidor.** El reloj del cliente no escribe
 * dominio (§2.3).
 */
export async function marcar(
  d: Dependencias,
  institutionId: string,
  pedido: { studentId: string; claseId: string; tipo: unknown; clave: string; texto: string | null },
): Promise<ResultadoDeMarca> {
  if (!esTipoDeMarca(pedido.tipo)) return { estado: "TIPO_INVALIDO" };
  const tipo = pedido.tipo;
  if (!pedido.clave.trim()) return { estado: "SIN_CLAVE" };
  const texto = pedido.texto?.trim() || null;
  if (texto && texto.length > MAXIMO_DE_TEXTO_DE_MARCA) return { estado: "DEMASIADO_LARGO" };

  const clase = await d.repo.delEstudiante(institutionId, pedido.studentId, pedido.claseId);
  if (!clase) return { estado: "NO_ENCONTRADA" };

  const repetida = (m: MarcaFila): ResultadoDeMarca =>
    m.tipo === tipo ? { estado: "OK", marca: m, duplicado: true } : { estado: "CONFLICTO_DE_CLAVE" };

  const previa = await d.repo.marcaPorClave(institutionId, clase.id, pedido.clave);
  if (previa) return repetida(previa);

  if (clase.estado !== "ACTIVE") return { estado: "CLASE_TERMINADA" };

  const creada = await d.repo.crearMarca(institutionId, {
    claseId: clase.id,
    tipo,
    segundos: segundosEntre(clase.iniciadaEn, d.ahora()),
    texto,
    clave: pedido.clave,
  });
  if (!creada) {
    const ganadora = await d.repo.marcaPorClave(institutionId, clase.id, pedido.clave);
    if (!ganadora) throw new Error("La base rechazó la marca y no hay ninguna con esa clave");
    return repetida(ganadora);
  }
  return { estado: "OK", marca: creada, duplicado: false };
}

export type ResultadoDeTexto =
  | { estado: "OK"; marca: MarcaFila }
  | { estado: "NO_ENCONTRADA" }
  | { estado: "DEMASIADO_LARGO" };

/** *"¿Qué no entendiste?"* — después, y también con la clase terminada. */
export async function completarMarca(
  d: Dependencias,
  institutionId: string,
  pedido: { studentId: string; marcaId: string; texto: string | null },
): Promise<ResultadoDeTexto> {
  const texto = pedido.texto?.trim() || null;
  if (texto && texto.length > MAXIMO_DE_TEXTO_DE_MARCA) return { estado: "DEMASIADO_LARGO" };
  const marca = await d.repo.marcaDelEstudiante(institutionId, pedido.studentId, pedido.marcaId);
  if (!marca) return { estado: "NO_ENCONTRADA" };
  return { estado: "OK", marca: await d.repo.guardarTextoDeMarca(institutionId, marca.id, texto, d.ahora()) };
}
