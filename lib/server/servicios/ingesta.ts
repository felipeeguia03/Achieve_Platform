import type { PublicadorDeEventos } from "./eventos";

/**
 * Ingesta del Academic Data Layer — Fase B2b, [ADR-023](../../../docs/decisions.md#adr-023).
 *
 * Estructura conocimiento académico. **No recomienda nada**: eso es el ADE, que
 * sigue `PENDING` en [ADR-004](../../../docs/decisions.md#adr-004).
 *
 * ### Las tres reglas que no se relajan
 *
 * 1. **Procedencia obligatoria.** No hay forma de pedir una ingesta sin decir
 *    de dónde salió el dato. No es validación de formulario: es que el tipo no
 *    compila sin `fuente`.
 * 2. **Todo entra `unverified`.** `I9`: *"ninguna capa eleva un
 *    `verification_status`"*. El ingestor **no puede** marcar nada como
 *    `official` — no es que no deba: no tiene por dónde.
 * 3. **No se carga identidad de docente.** Un programa suele traer el nombre
 *    del profesor, y un docente es una persona real. ADR-023 lo deja fuera
 *    hasta que la consulta de ADR-006 lo cubra.
 */

/** De dónde salió el dato. Sin esto no hay ingesta. */
export interface Fuente {
  /**
   * `institution` e `instructor` **no están**: son afirmaciones de autoridad, y
   * el ingestor asistido no la tiene. Quien tiene autoridad corrobora después,
   * con una operación distinta.
   */
  tipo: "student" | "community" | "public_web" | "inference";
  /** Dónde exactamente: una URL, un archivo, "programa 2026 que trajo Ana". */
  referencia: string;
  /** Cuándo se observó. No es "cuándo se cargó". */
  observadoEn: string;
  /** `0..1`. Ausente ⇒ no se declara confianza; no se asume alta. */
  confianza?: number;
}

/** Una materia tal como la trae el material, ya estructurada. */
export interface GuiaDeMateria {
  fuente: Fuente;
  curso: { codigo: string; nombre: string };
  cursada: { periodo: string; comision?: string };
  /** Unidades en el orden del programa. El orden **no** implica prerequisito. */
  unidades: Array<{ codigo?: string; nombre: string; orden?: number }>;
  /**
   * Prerequisitos **explícitos**, por nombre de unidad. Nunca se derivan del
   * orden: `topic_prerequisite` existe justamente para no inferirlos.
   */
  prerequisitos?: Array<{ unidad: string; requiere: string }>;
  evaluaciones?: Array<{
    tipo: string;
    titulo: string;
    /** Puede faltar. Una fecha desconocida **no se estima**. */
    fecha?: string;
    modalidad?: "practico" | "teorico_escrito" | "oral" | "mixta" | "otra";
    alcance?: string;
  }>;
}

export type ResultadoDeIngesta =
  | { estado: "OK"; cursadaId: string; unidades: number; evaluaciones: number }
  | { estado: "FUENTE_INVALIDA"; motivo: string }
  | { estado: "GUIA_INVALIDA"; motivo: string }
  /** La institución tiene que existir antes. No se crea sola (ADR-005 ítem 6). */
  | { estado: "INSTITUCION_DESCONOCIDA" };

export interface RepositorioDeIngesta {
  existeInstitucion(institutionId: string): Promise<boolean>;
  /**
   * Crea o reusa curso y cursada, y **reemplaza** unidades y evaluaciones de
   * esa cursada por las de la guía, en una sola transacción.
   */
  ingerirMateria(
    institutionId: string,
    guia: GuiaDeMateria,
  ): Promise<{ cursadaId: string; unidades: number; evaluaciones: number }>;
}

/** `0..1`, y `NaN` no es un número válido aunque `typeof` diga que sí. */
function confianzaValida(c: number | undefined): boolean {
  return c === undefined || (Number.isFinite(c) && c >= 0 && c <= 1);
}

export function validarFuente(f: Fuente): string | null {
  if (!f.referencia?.trim()) {
    // Una fuente sin referencia es "lo dijo alguien": no se puede volver a
    // mirar, y por lo tanto no se puede corroborar nunca.
    return "la fuente necesita una referencia concreta";
  }
  if (!Number.isFinite(Date.parse(f.observadoEn))) return "`observadoEn` no es una fecha";
  if (!confianzaValida(f.confianza)) return "la confianza va entre 0 y 1";
  return null;
}

export function validarGuia(g: GuiaDeMateria): string | null {
  if (!g.curso.codigo?.trim() || !g.curso.nombre?.trim()) return "el curso necesita código y nombre";
  if (!g.cursada.periodo?.trim()) return "la cursada necesita período";
  if (g.unidades.length === 0) return "una materia sin unidades no aporta conocimiento";

  const nombres = new Set(g.unidades.map((u) => u.nombre));
  if (nombres.size !== g.unidades.length) return "hay unidades repetidas";

  for (const p of g.prerequisitos ?? []) {
    // Un prerequisito hacia una unidad que no está en la guía sería un vínculo
    // colgado; y uno reflexivo lo rechaza el CHECK de la base igual.
    if (!nombres.has(p.unidad) || !nombres.has(p.requiere)) {
      return `el prerequisito ${p.unidad} → ${p.requiere} apunta a una unidad que no está en la guía`;
    }
    if (p.unidad === p.requiere) return "una unidad no es prerequisito de sí misma";
  }
  return null;
}

export async function ingerirMateria(
  deps: { repo: RepositorioDeIngesta; eventos: PublicadorDeEventos },
  institutionId: string,
  guia: GuiaDeMateria,
  actorId: string | null = null,
): Promise<ResultadoDeIngesta> {
  const errorFuente = validarFuente(guia.fuente);
  if (errorFuente) return { estado: "FUENTE_INVALIDA", motivo: errorFuente };

  const errorGuia = validarGuia(guia);
  if (errorGuia) return { estado: "GUIA_INVALIDA", motivo: errorGuia };

  if (!(await deps.repo.existeInstitucion(institutionId))) {
    return { estado: "INSTITUCION_DESCONOCIDA" };
  }

  const r = await deps.repo.ingerirMateria(institutionId, guia);

  await deps.eventos.publicar({
    nombre: "AcademicDataIngested",
    institutionId,
    actorId,
    sujetoTipo: "course_offering",
    sujetoId: r.cursadaId,
    // La referencia de la fuente va en la causa: es **el hecho** de dónde vino,
    // no contenido. Poder reconstruir de dónde salió un dato es media
    // provenance.
    causa: `${guia.fuente.tipo}:${guia.fuente.referencia}`,
    payload: { unidades: r.unidades, evaluaciones: r.evaluaciones },
  });

  return { estado: "OK", ...r };
}
