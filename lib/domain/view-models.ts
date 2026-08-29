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
import type { NivelOverview, VarianteOverview } from "./overview-precedence";

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

// ── UX07 · Activación de Modo Examen ─────────────────────────────────────────

/**
 * Los estados visibles de `UX07`, de `product-spec-source.md` §VI.7 §15.
 *
 * **No son una máquina paralela de UI.** Describen una situación sobre
 * entidades y lecturas que ya existen. El spec es explícito: *"No se usan
 * `DRAFT`, `PENDING_ACTIVATION`, `DUPLICATE`, `CANCELLED_ASSESSMENT` ni otros
 * estados técnicos inventados."*
 */
export type EstadoActivacion =
  | "RECOMENDACION"
  | "REVISION_MANUAL"
  | "SELECCION"
  | "SIN_ASSESSMENT"
  | "FALTAN_DATOS"
  | "FECHA_DESCONOCIDA"
  | "MODALIDAD_DESCONOCIDA"
  | "FUERA_DE_P0"
  | "YA_ACTIVA"
  | "CAMBIO_DE_FECHA"
  | "CANCELADA"
  | "PASADA"
  | "CONTRADICTORIOS"
  | "NO_DISPONIBLE"
  | "VERIFICANDO"
  | "HANDOFF_NO_DISPONIBLE";

/**
 * Un dato de la evaluación con su procedencia.
 *
 * `provenance` llega **ya traducido a copy de producto** (`VI.7` §18.2):
 * *"Cátedra · oficial"*, *"Reportado por vos · sin verificar"*, *"Dato en
 * revisión · hay versiones distintas"*. Los enums técnicos nunca son copy
 * visible (AGENTS.md §2.6), y ninguna capa eleva la verificación.
 *
 * `null` ⇒ se omite. Un dato sin provenance conocida no dice *"oficial"*.
 */
export interface DatoDeEvaluacion {
  label: string;
  valor: string;
  provenance: string | null;
  /** Valor anterior, sólo cuando el owner expone el cambio (`VI.7` §16.16). */
  anterior: string | null;
  /** Marca visual de dato en disputa. El owner resuelve; la UI no elige. */
  enRevision?: boolean;
}

/** Una evaluación elegible dentro del mismo `CourseEnrollment` (`VI.7` §16.14). */
export interface OpcionDeEvaluacion {
  id: string;
  evaluacion: string;
  datos: DatoDeEvaluacion[];
  seleccionada: boolean;
}

export interface ActivacionExamenProps {
  estado: EstadoActivacion;
  /** El `CourseEnrollment` de origen. Materia y comisión NO son selectores. */
  materia: string;
  comision: string | null;
  /** Título del microcopy de `VI.7` §22.1, resuelto por estado. */
  titulo: string;
  /** `null` cuando todavía no hay una Assessment inequívoca. */
  evaluacion: string | null;
  datos: DatoDeEvaluacion[];
  /**
   * Por qué apareció. Sólo la razón **recibida**: la vista no calcula
   * elegibilidad ni prioridad, y no convierte proximidad en hecho.
   */
  razonAparicion: string | null;
  /** Lista corta de faltantes (`VI.7` §16.6). Vacía ⇒ no se muestra. */
  faltantes: readonly string[];
  /** Aviso de estado vacío, desconocido, contradictorio o de error (`§25`). */
  aviso: string | null;
  /** Sólo en `SELECCION`. La lista conserva el orden recibido; no rankea. */
  opciones: readonly OpcionDeEvaluacion[] | null;
  // ── Columna secundaria ────────────────────────────────────────────────────
  queCambia: readonly string[];
  queNoCambia: readonly string[];
  /** Qué ocurrirá después. `null` ⇒ se omite: no se promete un destino. */
  despues: string | null;
  // ── Decisión ──────────────────────────────────────────────────────────────
  /**
   * `null` ⇒ **no hay CTA primaria y no se renderiza ninguna**. `VI.7` §21.3 es
   * explícito: cuando ya existe `ACTIVE`, el estado reemplaza el CTA de
   * activación y *"no se conserva un botón Activar deshabilitado que sugiera
   * una segunda operación"*.
   */
  ctaPrimaria: { texto: string; habilitada: boolean } | null;
  /** El retorno seguro. Vive en la columna secundaria, nunca como primaria. */
  ctaRetorno: string;
}

// ── UX08 · Modo Examen / Overview ────────────────────────────────────────────

/** Un hito del recorrido. Sin porcentaje y sin lista fija de pasos. */
export interface PasoDelRecorrido {
  label: string;
  estado: "CONFIRMADO" | "ACTUAL" | "PENDIENTE";
}

export interface OverviewExamenProps {
  /** Lo decide `selectOverviewLevel`, no la pantalla. */
  nivel: NivelOverview;
  variante: VarianteOverview | null;

  // ── Identidad y contexto ──────────────────────────────────────────────────
  materia: string;
  evaluacion: string;
  datos: DatoDeEvaluacion[];

  // ── Estado dominante · columna principal ──────────────────────────────────
  /** Microcopy de `VI.8` §23, resuelto por estado. */
  estadoDominante: string;
  /** El objeto que gana la precedencia. `null` ⇒ no hay objeto que mostrar. */
  objeto: string | null;
  /**
   * Una sola CTA primaria, sobre el mismo objeto y lifecycle autoritativo, con
   * destino real. `null` ⇒ no se renderiza ninguna.
   */
  ctaPrimaria: { texto: string; habilitada: boolean } | null;
  /** Qué pasa después. Sin outcome anticipado ni saltos. */
  despues: string | null;
  /** Lo que queda secundario por precedencia. Se muestra, no se oculta. */
  secundarios: readonly string[];
  aviso: string | null;

  // ── Columna secundaria ────────────────────────────────────────────────────
  /** `null` ⇒ *"Recorrido todavía no disponible."* No se listan 12 pasos. */
  recorrido: readonly PasoDelRecorrido[] | null;
  /** Sólo dimensiones con un `ProgressUpdated` real detrás. */
  cambioConfirmado: readonly FilaDato[];
  /** Lo que no cambió, distinguible entre sí: "no evaluado" ≠ "sin datos". */
  pendiente: readonly FilaDato[];
  fuenteProgreso: string | null;

  /**
   * Status de preparación **recibido del owner**, con su descargo literal.
   *
   * `UX08` **no calcula readiness, no muestra score ni porcentaje y no crea
   * card** ([ADR-011](../../docs/decisions.md), `VI.8` §18). Esto es otra cosa:
   * releer un valor que `ExamPreparation` ya trae. `null` ⇒ no se muestra nada.
   */
  statusRecibido: { valor: string; descargo: string } | null;

  // ── Banda de continuidad ──────────────────────────────────────────────────
  /** Cursado, sus cinco dimensiones y la Bitácora continúan. */
  cursadoPersistente: string;
  ctaRetorno: string;
}
