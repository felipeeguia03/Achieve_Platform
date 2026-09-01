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

import type { HeroLevel, HeroVariante } from "./precedence";
import type { NivelOverview, VarianteOverview } from "./overview-precedence";
import type { NivelPaso, VariantePaso } from "./step-precedence";

export type Tono = "urgencia" | "exito" | "humano";

export interface Chip {
  tono: Tono;
  texto: string;
}

/**
 * Los tratamientos de ausencia, tipados. `P-09` exige que vacío, no-cargado,
 * sin-asignar y cero **se vean distinto**; un booleano `ausente` los colapsaba
 * en uno solo, que es exactamente lo que el principio prohíbe.
 *
 * `design-system-capturas.md` §1.6 observa tres tratamientos en columnas
 * contiguas de una misma tabla, y §9.2 agrega el cuarto caso. **Achieve usa
 * dos de ellos, y resuelve los otros dos por vías más fuertes:**
 *
 * | Estado de `P-09` | En Achieve |
 * |---|---|
 * | Sin asignar | `SIN_ASIGNAR` — *itálica* atenuada, con el copy que fija la spec |
 * | Cero real | `CERO_REAL` — el número, ink pleno, cifra tabular |
 * | No hay dato | **la fila no se renderiza.** Ver abajo |
 * | No cargado | **no ocurre:** el Track A es cero red |
 *
 * **Por qué no hay em-dash.** §1.6 pinta *"no hay dato"* con un em-dash en la
 * celda, porque en una tabla la columna tiene que conservar su lugar. Achieve
 * no es una tabla —§12.6 decidió tarjetas— y su regla es más fuerte:
 * **omitir, no inventar**; si falta el contrato, la línea desaparece entera.
 * Un em-dash acá sería copiar la superficie de la captura en vez de su
 * razonamiento, y además dejaría un renglón que no dice nada.
 *
 * **`CERO_REAL` no es una ausencia: es un valor.** Está en la lista porque el
 * checklist lo exige distinguible de las otras, y porque confundirlo con ellas
 * es la trampa concreta que `design-system.md` §7 marca como verificable.
 *
 * ⚠️ **Un dato adverso tampoco es una ausencia.** *"incumplido"*, *"vencido"* o
 * *"necesita atención"* son datos presentes, y §1.6 les da chip de color. Se
 * expresan con `tono`, nunca con `ausencia`.
 */
export type TipoDeAusencia = "SIN_ASIGNAR" | "CERO_REAL";

/**
 * Una fila etiqueta/valor. `ausencia` la marca como ausencia tipada, no como
 * dato: se renderiza distinto porque "no evaluado" no es un valor.
 *
 * Se llama `FilaDato` y no `Fila` para no colisionar con el componente `Fila`
 * de `components/screens/design-system.tsx`, que es quien la dibuja.
 */
export interface FilaDato {
  label: string;
  valor: string;
  /** Qué clase de ausencia es. Ausente ⇒ el valor es un dato normal. */
  ausencia?: TipoDeAusencia;
  /** El color lo trae el dato, nunca una comparación de string en el componente. */
  tono?: Tono;
}

// ── UX01 · Hoy / Autogestión ─────────────────────────────────────────────────

export interface HeroProjection {
  /** Lo elige `selectHeroLevel`, no la pantalla. */
  nivel: HeroLevel;
  /** El discriminador de CTA dentro del nivel (ADR-017). */
  variante: HeroVariante | null;
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
  /**
   * El estado general de la materia. **`null` ⇒ no hay lectura y la línea no se
   * dibuja** (Etapa B2.6).
   *
   * Un estado de materia es una lectura de riesgo, y el Risk Engine es la Fase
   * B6. La `B2.5` lo resolvió devolviendo `'Bajo control'` fijo desde SQL para
   * toda materia: eso es exactamente el copy que
   * [`product.md`](../../docs/product.md) §13 prohíbe —*"Bajo control" sin
   * lectura confiable del Risk Engine*—, y con datos persistidos la pantalla se
   * lo estaba afirmando al estudiante sin que nadie lo hubiera evaluado.
   *
   * En el Track A sigue siendo un `string`: ahí el estado **es dato del
   * escenario**, y un fixture que simula una lectura no afirma nada sobre nadie.
   */
  estado: string | null;
  /** `null` ⇒ "Sin avance registrado", que no es lo mismo que "hace 0 días". */
  ultimoAvance: string | null;
  tono: "neutral" | "urgencia";
}

export interface HoyProps {
  fecha: string;
  estadoGeneral: string;
  hero: HeroProjection;
  materias: MateriaResumen[];
  /**
   * `CTA-009` — *ver progreso*. `null` ⇒ la Bitácora no está disponible y la
   * CTA **no se renderiza**, en vez de renderizarse deshabilitada.
   */
  verProgreso: string | null;
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

/** Estados críticos de `UX02` (spec `VI.2`). */
export type EstadoMateria =
  | "NORMAL"
  | "CONTEXTO_INCOMPLETO"
  | "CONFIANZA_VS_DOMINIO"
  | "SIN_RECOMENDACION"
  | "NO_DISPONIBLE";

export interface MateriaProps {
  estado: EstadoMateria;
  materia: string;
  /** `null` ⇒ no hay examen registrado; se omite la línea. */
  examen: string | null;
  /**
   * El chip de estado general de la materia. **`null` ⇒ no se renderiza**, en
   * vez de renderizarse con una afirmación sin fuente (Etapa B2.6).
   *
   * Mismo motivo que `MateriaResumen.estado`: sin Risk Engine (Fase B6) nadie
   * evaluó esta materia, y *"Bajo control"* o *"Necesita atención"* serían
   * juicios que el sistema no puede sostener.
   */
  chip: Chip | null;
  ultimoAvance: string | null;
  hero: HeroProjection;
  catedraYVos: { catedra: ColumnaFuente; vos: ColumnaFuente } | null;
  unidades: FilaDato[];
  /**
   * Las cinco dimensiones, **separadas**. Confianza no es dominio: una
   * confianza alta con dominio no evaluado se muestra como dos hechos
   * distintos, y la vista **no genera una Action** a partir de la brecha.
   */
  dimensiones: readonly FilaDato[];
  /** Aviso de estado vacío, incompleto o de error. `null` ⇒ se omite. */
  aviso: string | null;
  /**
   * Captura de "pasó algo en clase". `null` ⇒ no se ofrece.
   *
   * Un reporte del alumno registrado durante una clase **no** se convierte en
   * voz de la cátedra (AGENTS.md §2.6).
   */
  capturaDeClase: string | null;
}

// ── UX03 · Próxima Acción ────────────────────────────────────────────────────

/** Estados críticos de `UX03` (spec `VI.3`). */
export type EstadoAccion =
  | "NORMAL"
  | "INCERTIDUMBRE"
  | "RAZON_NO_CONFIRMADA"
  | "SIN_RECURSO"
  | "BLOQUEADA"
  | "REEMPLAZADA"
  | "CORRECCION";

export interface ProximaAccionProps {
  estado: EstadoAccion;
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
  /** Provenance del recurso. `null` ⇒ no se oficializa lo desconocido. */
  provenanceRecurso: string | null;
  aviso: string | null;
  /** `null` ⇒ **no se renderiza CTA primaria**, en vez de una deshabilitada. */
  ctaPrimaria: { texto: string; habilitada: boolean } | null;
}

// ── UX04 · Compromiso ────────────────────────────────────────────────────────

/**
 * Estados críticos de `UX04` (spec `VI.4`), incluidos los ocho del lifecycle de
 * `Commitment`.
 */
export type EstadoCompromiso =
  | "DRAFT"
  | "CONFIRMED"
  | "DUE"
  | "STARTED"
  | "COMPLETED"
  | "RENEGOTIATED"
  | "MISSED"
  | "CLOSED"
  | "CAPACIDAD_INSUFICIENTE"
  | "FECHA_INVALIDA"
  | "RENEGOCIACION"
  | "RENEGOCIACION_NO_ELEGIBLE"
  | "RESCATE";

export interface CompromisoProps {
  estado: EstadoCompromiso;
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
  aviso: string | null;
  /**
   * El Commitment original, cuando esta vista es una renegociación o un
   * rescate. **No es editable**: el original se preserva (AGENTS.md §2.4).
   */
  original: readonly FilaDato[] | null;
  /** `null` ⇒ no se renderiza CTA primaria. */
  ctaPrimaria: { texto: string; habilitada: boolean } | null;
}

// ── UX05 · Evidencia ─────────────────────────────────────────────────────────

/** Los siete estados de `Evidence` más los de la propia entrega (`VI.5`). */
export type EstadoEvidencia =
  | "EXPECTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SUFFICIENT"
  | "INSUFFICIENT"
  | "RESUBMISSION_REQUESTED"
  | "VALIDATED"
  | "SUBIENDO"
  | "UPLOAD_FALLIDO"
  | "ARTEFACTO_FORMAL"
  | "TARDIA";

export interface EvidenciaProps {
  estado: EstadoEvidencia;
  contexto: string;
  titulo: string;
  unidad: string | null;
  evidenciaEsperada: string | null;
  criterioCierre: string | null;
  /** Tipos permitidos, en copy de dominio. `null` ⇒ se omite la línea. */
  formatosPermitidos: string | null;
  /** Nombre del archivo sintético que simula el adjunto en el Track A. */
  nombreAdjuntoDemo: string;
  /** Estado del lifecycle en copy de producto. Nunca el enum crudo. */
  estadoVisible: string | null;
  aviso: string | null;
  /**
   * La Reflection configurada. `requerida` bloquea sólo el submit dependiente;
   * `null` ⇒ no se ofrece.
   */
  reflection: { titulo: string; requerida: boolean } | null;
  /** `null` ⇒ no se renderiza CTA primaria: no hay entrega posible. */
  ctaPrimaria: { texto: string; habilitada: boolean } | null;
  /** El adjunto ya existe y la pantalla no lo pide de nuevo. */
  adjuntoPrevio: string | null;
}

// ── UX06 · Progreso / Bitácora ───────────────────────────────────────────────

/** Los cuatro resultados posibles de una re-evaluación (`VI.6`). */
export type EstadoProgreso =
  | "CAMBIO_CONFIRMADO"
  | "SIN_CAMBIO_EXPLICITO"
  | "SIN_DATOS"
  | "NO_DISPONIBLE";

/** Una entrada de la Bitácora. Los eventos del mismo ciclo se agrupan. */
export interface EntradaDeBitacora {
  titulo: string;
  detalle: string;
  /** Provenance ya en copy. `null` ⇒ *"Fuente o estado no disponible"*. */
  provenance: string | null;
}

export interface ProgresoProps {
  estado: EstadoProgreso;
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
   *
   * **Desde [ADR-020] no comparten tratamiento.** Un no-cambio declarado por el
   * owner es un **dato presente** —alguien miró y confirmó— y va sin `ausencia`;
   * "no evaluado" y "sin información" son ausencias tipadas y la llevan. La
   * distinción se ve sin color, que es lo que `P-09` exige.
   */
  sinCambioConfirmado: FilaDato[];
  /**
   * De dónde sale el no-cambio, cuando lo declaró el owner. `null` ⇒ el bloque
   * sólo tiene ausencias, y una ausencia no tiene fuente que citar.
   */
  fuenteSinCambio: string | null;
  queSigue: string | null;
  aviso: string | null;
  /**
   * Bitácora agrupada por ciclo. Los eventos de un mismo ciclo se muestran
   * juntos y **no como cuatro avances independientes**.
   */
  bitacora: readonly { ciclo: string; entradas: readonly EntradaDeBitacora[] }[] | null;
  ctaPrimaria: { texto: string; habilitada: boolean } | null;
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

// ── UX09 · Paso de Protocolo ─────────────────────────────────────────────────

/**
 * Un bloque de contenido configurado del paso.
 *
 * `WF-S11` **renderiza contenido recibido**: no deriva, no resume con
 * significado nuevo, no completa y no corrige contenido pedagógico
 * (`VI.9` §12.1). `valor: null` ⇒ se muestra el copy de ausencia que el spec
 * fija en §27, nunca una versión generada.
 */
export interface BloqueDePaso {
  titulo: string;
  valor: string | null;
  /** Copy exacto de §27 cuando el contenido falta. */
  ausencia: string;
}

export interface RecursoConfigurado {
  nombre: string;
  tipo: string | null;
  /** Provenance ya traducida a copy. `null` ⇒ *"Fuente o verificación no disponible"*. */
  provenance: string | null;
  /** Derechos de uso, si el owner los declara. */
  derechos: string | null;
}

export interface PasoProtocoloProps {
  nivel: NivelPaso;
  variante: VariantePaso | null;

  // ── Identidad (§13.1) ─────────────────────────────────────────────────────
  assessment: string;
  materia: string;
  modalidad: string;
  /** Label configurado del paso. `null` ⇒ identidad parcial. */
  labelDelPaso: string | null;
  /**
   * *"Protocolo {version recibida}"*. `null` ⇒ no se declara vigencia ni se usa
   * un protocolo genérico.
   *
   * **Nunca se muestra `Paso 5 de 12` ni un porcentaje** (§13.2): instancia,
   * orden, `current`/`next` y deduplicación siguen `SOURCE CONTRACT PENDING`.
   */
  version: string | null;

  // ── Contenido configurable (§12) ──────────────────────────────────────────
  objetivo: BloqueDePaso;
  explicacion: BloqueDePaso;
  entregable: BloqueDePaso;
  criterio: BloqueDePaso;
  recurso: RecursoConfigurado | null;
  /** *"Este paso no tiene un recurso configurado"*. No es un bloqueo. */
  avisoRecurso: string | null;

  // ── Estado y decisión ─────────────────────────────────────────────────────
  estadoDominante: string;
  /** *"Abriste este paso. Abrirlo no lo completa."* */
  avisoDeApertura: string | null;
  aviso: string | null;
  ctaPrimaria: { texto: string; habilitada: boolean } | null;
  despues: string | null;
  secundarios: readonly string[];

  // ── Configuración · columna secundaria ────────────────────────────────────
  /** Fuente del contenido: real o desconocida. Nunca se oficializa. */
  fuenteDelContenido: string;
  ctaRetorno: string;
}
