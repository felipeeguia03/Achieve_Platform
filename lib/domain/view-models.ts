/**
 * Los view models de UX01–UX06: la forma exacta de las props que recibe cada
 * pantalla.
 *
 * **Esta es la frontera que hace barato el Track B** (architecture.md §2.4).
 * Las pantallas nunca importan un fixture: reciben uno de estos objetos. Cuando
 * `lib/fixtures/` se reemplace por llamadas reales, la capa de presentación no
 * se toca.
 *
 * Son **proyecciones de lectura**, no entidades. La UI proyecta, nunca decide
 * (AGENTS.md §2.2): acá no hay estado de dominio que la pantalla pueda escribir.
 *
 * Convención de ausencia, transversal a todos los tipos de este archivo:
 * **`null` significa "se omite la línea entera"**, nunca "mostrar un
 * placeholder" (AGENTS.md §2.7, "omitir, no inventar").
 */

import type { HeroLevel } from "./precedence";

export type Tono = "urgencia" | "exito" | "humano";

export interface Chip {
  tono: Tono;
  texto: string;
}

/**
 * Una fila etiqueta/valor. `ausente` la marca como ausencia tipada, no como
 * dato: se renderiza distinto porque "no evaluado" no es un valor.
 *
 * Se llama `FilaDato` y no `Fila` para no colisionar con el componente `Fila`
 * de `components/screens/design-system.tsx`, que es quien la dibuja.
 */
export interface FilaDato {
  label: string;
  valor: string;
  ausente?: boolean;
  /** El color lo trae el dato, nunca una comparación de string en el componente. */
  tono?: Tono;
}

// ── UX01 · Hoy / Autogestión ─────────────────────────────────────────────────

export interface HeroProjection {
  /** Lo elige `selectHeroLevel`, no la pantalla. */
  nivel: HeroLevel;
  contexto: string | null;
  titulo: string | null;
  /** La línea `Porque:` — DD10. Sin el prefijo: el prefijo es copy. */
  razon: string | null;
  /**
   * Primer segmento de la línea operativa. Normalmente la estimación de la
   * Action ("40 min"), pero la spec usa esa misma posición para un estado
   * ("En curso") cuando la Action ya arrancó. `null` ⇒ el segmento se omite y
   * la línea empieza por la evidencia esperada.
   */
  tiempoOEstado: string | null;
  /** `null` ⇒ no se inventa el requisito de evidencia. */
  evidenciaEsperada: string | null;
  /**
   * La línea de qué pasa después. `conPrefijo` decide si lleva el rótulo
   * "Después:" delante: la spec lo usa en unos estados y en otros no, y el
   * texto es dato mientras el rótulo es copy (regla `C-07`).
   * `null` ⇒ se omite la línea entera.
   */
  queSigue: { texto: string; conPrefijo: boolean } | null;
  chip: Chip | null;
}

export interface MateriaResumen {
  nombre: string;
  estado: string;
  /** `null` ⇒ "Sin avance registrado", que no es lo mismo que "hace 0 días". */
  ultimoAvance: string | null;
  tono: "neutral" | "urgencia";
}

export interface HoyProps {
  fecha: string;
  estadoGeneral: string;
  hero: HeroProjection;
  materias: MateriaResumen[];
}

// ── UX02 · Materia / Cursado ─────────────────────────────────────────────────

/**
 * `P-08`: cátedra y estudiante son **dos fuentes en columnas separadas**, nunca
 * fusionadas. Un reporte del alumno no se convierte en voz de la cátedra
 * (AGENTS.md §2.6).
 */
export interface ColumnaFuente {
  titulo: string;
  contenido: string;
  /** Provenance en lenguaje natural. Los enums técnicos nunca son copy visible. */
  detalle: string;
  tono: "neutral" | "urgencia";
}

export interface MateriaProps {
  materia: string;
  /** `null` ⇒ no hay examen registrado; se omite la línea. */
  examen: string | null;
  estado: Chip;
  ultimoAvance: string | null;
  hero: HeroProjection;
  catedraYVos: { catedra: ColumnaFuente; vos: ColumnaFuente } | null;
  unidades: FilaDato[];
}

// ── UX03 · Próxima Acción ────────────────────────────────────────────────────

export interface ProximaAccionProps {
  contexto: string;
  unidad: string;
  titulo: string;
  razon: string | null;
  /** Cada fila ausente se omite entera. */
  duracion: string | null;
  recurso: string | null;
  evidenciaEsperada: string | null;
  criterioCierre: string | null;
  queSigue: string | null;
}

// ── UX04 · Compromiso ────────────────────────────────────────────────────────

export interface CompromisoProps {
  contexto: string;
  titulo: string;
  fecha: string | null;
  hora: string | null;
  tiempoDeclarado: string | null;
  /** Nota de capacidad + zona horaria. `null` ⇒ se omite. */
  notaEstimacion: string | null;
  evidenciaEsperada: string | null;
  criterioCierre: string | null;
  /** El estado en que queda al confirmar. Se muestra como chip. */
  estadoResultante: Chip | null;
}

// ── UX05 · Evidencia ─────────────────────────────────────────────────────────

export interface EvidenciaProps {
  contexto: string;
  titulo: string;
  unidad: string | null;
  evidenciaEsperada: string | null;
  criterioCierre: string | null;
  /** Tipos permitidos, en copy de dominio. `null` ⇒ se omite la línea. */
  formatosPermitidos: string | null;
  /** Nombre del archivo sintético que simula el adjunto en el Track A. */
  nombreAdjuntoDemo: string;
}

// ── UX06 · Progreso / Bitácora ───────────────────────────────────────────────

export interface ProgresoProps {
  contexto: string;
  estadoEvidencia: Chip;
  detalleEvidencia: string;
  /**
   * Solo se lista acá una dimensión con un `ProgressUpdated` real detrás.
   * `VALIDATED` no produce `ProgressUpdated` por sí solo (AGENTS.md §2.1).
   */
  cambioConfirmado: FilaDato[];
  fuenteCambio: string | null;
  /**
   * Los estados de no-cambio, que son distinguibles entre sí: "conserva su
   * estado" ≠ "no evaluado" ≠ "no disponible" ≠ `0` (AGENTS.md §2.5).
   */
  sinCambioConfirmado: FilaDato[];
  queSigue: string | null;
}
