/**
 * 🧪 **LABORATORIO DESCARTABLE V3 — «Mi Plan vivo», calendario como plan.** Tipos de esta carpeta.
 *
 * ⚠️ **No son contratos del dominio.** No los importes desde `lib/`, `components/` ni
 * ninguna ruta productiva. Existen para que el Product Owner pruebe una pantalla y
 * decida [ADR-109](../../../../docs/decisions.md#adr-109), que sigue `PENDING`.
 *
 * ## Por qué no hay un `WorkItem` genérico
 *
 * El calendario dibuja todo como bloques, pero los orígenes son distintos y la
 * diferencia vive **en la forma del dato**:
 *
 * - `Clase` y `Evaluacion` son de la facultad: nadie los mueve.
 * - `Accion` es trabajo propuesto: se ubica, se mueve y se simula.
 * - `CompromisoVivo` es una acción con día, hora, duración y evidencia confirmados:
 *   sólo cambia de horario por renegociación explícita.
 * - `Registro` ya ocurrió: no se mueve y dice qué se constató.
 *
 * `CalendarProjectionItem` une esos orígenes **para dibujar**, y cada variante conserva
 * la referencia a su entidad de origen.
 */

export type MateriaId = "ANALISIS" | "FISICA" | "ECONOMIA" | "ARQUITECTURA" | "BASES";

export interface Materia {
  id: MateriaId;
  nombre: string;
  corto: string;
  /** Un token de `app/globals.css`. Identidad, nunca estado. */
  color: string;
  comision: string;
}

export type Confianza = "baja" | "media" | "alta";

export interface Rango {
  min: number;
  /** La duración que ocupa el bloque y la que suman los totales. */
  probable: number;
  max: number;
}

/** Prioridad blanda, en palabras. **Sin puntaje.** */
export type Prioridad = "MUY_ALTA" | "ALTA" | "MEDIA" | "BAJA";

/** Día y hora de pared, en un mismo día. */
export interface Tramo {
  fecha: string;
  desde: string;
  hasta: string;
}

export interface Intervalo {
  ini: number;
  fin: number;
}

/** Un tema o unidad, como lo muestra el Gantt de Materia. */
export interface Tema {
  id: string;
  materia: MateriaId;
  codigo: string;
  nombre: string;
  /** La primera clase que lo dictó. `null` ⇒ todavía no se dictó: la barra no tiene inicio. */
  primeraClase: Tramo | null;
  /** La evaluación que lo cubre. `null` ⇒ sin fin: **no hay barra**. */
  evaluacionId: string | null;
}

export interface Clase {
  kind: "CLASE";
  id: string;
  materia: MateriaId;
  titulo: string;
  tramo: Tramo;
  aula: string;
  fuente: string;
  temas: readonly string[];
  /** Sólo si la clase ya ocurrió y quedó registrada. */
  registro: { asistencia: string; notas: readonly string[] } | null;
}

export interface Evaluacion {
  kind: "EVALUACION";
  id: string;
  materia: MateriaId;
  titulo: string;
  corto: string;
  tramo: Tramo;
  modalidad: string;
  alcance: readonly string[];
  alcanceDetalle: string;
  fuente: string;
  confianza: Confianza;
}

export interface Accion {
  kind: "ACCION";
  id: string;
  materia: MateriaId;
  tema: string;
  tipo: string;
  /** Verbo y objetivo: *Resolver Práctica 2 de Límites*. */
  titulo: string;
  /** Cómo se nombra en una frase: *Límites*. */
  corto: string;
  duracion: Rango;
  confianza: { nivel: Confianza; fuente: string };
  prioridad: Prioridad;
  /** La razón principal, en la bandeja. */
  razonCorta: string;
  /** *Por qué esta acción*, en el inspector. */
  razones: readonly string[];
  evidencia: string;
  /** Dependencias académicas: tienen que estar hechas (o ubicadas antes). */
  requiere: readonly string[];
  /** No se puede ubicar antes: el tema se da en esa clase. **Conflicto duro.** */
  noAntesDe: { fecha: string; hora: string; motivo: string } | null;
  /** Conviene antes, y perderlo es una consecuencia. **Advertencia blanda.** */
  convieneAntesDe: { fecha: string; hora: string; motivo: string } | null;
  /** Tiene que terminar antes de esta evaluación. **Conflicto duro.** */
  antesDe: string | null;
  /** Trabajo condicional: deja de hacer falta si otra acción queda constatada. */
  seRetiraSi: { id: string; motivo: string } | null;
  /** Si, con evidencia suficiente, suma recorrido registrado al tema. */
  recorrido: boolean;
  explicacionRecorrido: string;
  origen: string | null;
  alternativas: readonly string[];
}

export interface CompromisoDelFixture {
  id: string;
  accionId: string;
  tramo: Tramo;
  evidencia: string;
  estado: "CONFIRMADO" | "INCUMPLIDO";
  confirmadoEl: string;
}

export interface Registro {
  kind: "REGISTRO";
  id: string;
  materia: MateriaId;
  tema: string;
  titulo: string;
  tramo: Tramo;
  duracionEstimada: Rango;
  estado: "COMPLETADA" | "EVIDENCIA_ENVIADA" | "EVIDENCIA_VALIDADA";
  evidencia: { descripcion: string; revision: "SIN_EVIDENCIA_REQUERIDA" | "SIN_REVISAR" | "SUFICIENTE" | "INSUFICIENTE" };
  progreso: { cuando: string } | null;
  /** Si cuenta como una actividad del recorrido del tema. */
  pieza: boolean;
  sesion: string | null;
  cambioEnPlan: readonly string[];
}

export interface VentanaDelFixture {
  id: string;
  tramo: Tramo;
}

// ── Estado local del laboratorio ─────────────────────────────────────────────────

export interface Ubicacion {
  ini: number;
  duracion: number;
}

export interface CambioDeHorario {
  antes: Intervalo;
  despues: Intervalo;
  cuando: number;
}

export interface CompromisoVivo {
  id: string;
  accionId: string;
  ini: number;
  fin: number;
  evidencia: string;
  estado: "CONFIRMADO" | "EN_CURSO" | "INCUMPLIDO";
  origen: "FIXTURE" | "LOCAL";
  /** La promesa como se confirmó. No se edita nunca. */
  promesaOriginal: Intervalo;
  cambios: readonly CambioDeHorario[];
  focusDesde: number | null;
}

export interface VentanaViva {
  id: string;
  ini: number;
  fin: number;
  origen: "DECLARADA" | "AGREGADA";
}

export interface EntradaDeBitacora {
  id: string;
  cuando: number;
  texto: string;
}

export interface EstadoLab {
  ahora: number;
  relojAdelantado: boolean;
  /** Propuestas ubicadas por el estudiante. **No son compromisos.** */
  ubicaciones: Readonly<Record<string, Ubicacion>>;
  compromisos: readonly CompromisoVivo[];
  ventanas: readonly VentanaViva[];
  /** La pila del escenario. Nunca más de cinco. */
  pasos: readonly string[];
  bitacora: readonly EntradaDeBitacora[];
  /** Acciones que volvieron a la bandeja, con el motivo. */
  devueltas: Readonly<Record<string, string>>;
}

// ── Motor ─────────────────────────────────────────────────────────────────────────

export type Posicion =
  | { tipo: "UBICADA"; ini: number; fin: number }
  | { tipo: "COMPROMETIDA"; ini: number; fin: number; compromisoId: string }
  | { tipo: "SUGERIDA"; ini: number; fin: number }
  | { tipo: "SIN_LUGAR"; motivo: "SIN_HUECO" | "PLAZO" | "DEPENDENCIA" };

export type TipoDeConflicto =
  | "PASADO"
  | "FUERA_DE_GRILLA"
  | "CLASE"
  | "EVALUACION"
  | "COMPROMISO"
  | "FOCUS"
  | "UBICADA"
  | "NO_ANTES_DE"
  | "DEPENDENCIA"
  | "PLAZO"
  | "INAMOVIBLE";

export interface Conflicto {
  tipo: TipoDeConflicto;
  texto: string;
}

export type TipoDeAdvertencia = "PRIORIDAD" | "MARGEN" | "MAXIMO" | "FUERA_DE_DISPONIBILIDAD" | "PRERREQUISITO_SIN_HORARIO";

export interface Advertencia {
  tipo: TipoDeAdvertencia;
  texto: string;
  afectada: string | null;
}

export interface Validacion {
  duros: readonly Conflicto[];
  blandos: readonly Advertencia[];
}

export type MotivoSinSimular =
  | { tipo: "MAXIMO" }
  | { tipo: "YA_SIMULADA" }
  | { tipo: "RETIRADA" }
  | { tipo: "NO_PENDIENTE" }
  | { tipo: "PRERREQUISITO"; faltan: readonly string[] }
  | { tipo: "SIN_LUGAR" };

// ── Proyección para el calendario ──────────────────────────────────────────────────

interface ItemBase {
  clave: string;
  ini: number;
  fin: number;
  materia: MateriaId;
  titulo: string;
  /** Existe sólo en el escenario. */
  hipotetico: boolean;
}

export interface ClassCalendarItem extends ItemBase {
  tipo: "CLASE";
  origen: { kind: "CLASE"; id: string };
  estado: "CURSADA" | "PROXIMA";
  movilidad: "INAMOVIBLE";
}

export interface EvaluationCalendarItem extends ItemBase {
  tipo: "EVALUACION";
  origen: { kind: "EVALUACION"; id: string };
  movilidad: "INAMOVIBLE";
}

export interface ProposedActionCalendarItem extends ItemBase {
  tipo: "PROPUESTA";
  origen: { kind: "ACCION"; id: string };
  ubicacion: "ELEGIDA" | "SUGERIDA";
  movilidad: "MOVIBLE";
}

export interface CommitmentCalendarItem extends ItemBase {
  tipo: "COMPROMISO";
  origen: { kind: "COMPROMISO"; id: string; accionId: string };
  estado: "CONFIRMADO" | "INCUMPLIDO";
  movilidad: "RENEGOCIACION" | "HISTORICO";
}

export interface FocusCalendarItem extends ItemBase {
  tipo: "FOCUS";
  origen: { kind: "COMPROMISO"; id: string; accionId: string };
  movilidad: "INAMOVIBLE";
}

export interface EvidenceCalendarItem extends ItemBase {
  tipo: "EVIDENCIA";
  origen: { kind: "REGISTRO"; id: string };
  estado: "ENVIADA" | "INSUFICIENTE";
  movilidad: "HISTORICO";
}

export interface CompletedCalendarItem extends ItemBase {
  tipo: "COMPLETADA";
  origen: { kind: "REGISTRO"; id: string } | { kind: "SIMULACION"; accionId: string; paso: number };
  estado: "COMPLETADA" | "VALIDADA" | "SIMULADA";
  movilidad: "HISTORICO";
}

export type CalendarProjectionItem =
  | ClassCalendarItem
  | EvaluationCalendarItem
  | ProposedActionCalendarItem
  | CommitmentCalendarItem
  | FocusCalendarItem
  | EvidenceCalendarItem
  | CompletedCalendarItem;

export interface Totales {
  /** Compromisos vivos + propuestas ubicadas + sin ubicar. */
  pendiente: number;
  pendienteMin: number;
  pendienteMax: number;
  /** Disponibilidad futura de la semana, sin clases ni evaluaciones encima. */
  capacidad: number;
  comprometido: number;
  ubicado: number;
  sinUbicar: number;
  /** Lo que ocupa lo simulado. Cero en el plan real. */
  simulado: number;
  /** Disponibilidad que queda sin usar, medida sobre los huecos. */
  libre: number;
  /** Parte de lo ocupado por el estudiante que cae dentro de la disponibilidad. */
  usadoDentro: number;
}

export interface MargenDeEvaluacion {
  evaluacionId: string;
  minutos: number;
}

export interface PiezaDelTema {
  id: string;
  estado: "CONSTATADA" | "ENVIADA" | "SIMULADA" | "PENDIENTE";
}

export interface GanttTema {
  id: string;
  codigo: string;
  nombre: string;
  /** Primera clase dictada. `null` ⇒ no hay punta izquierda. */
  ventanaIni: number | null;
  /** Evaluación que lo cubre. `null` ⇒ no hay barra. */
  ventanaFin: number | null;
  nota: string | null;
  clases: readonly { ini: number; dada: boolean }[];
  piezas: readonly PiezaDelTema[];
  /**
   * Cuándo empieza y termina lo que falta, según la propuesta del motor **sin decisiones
   * de agenda** (`mundoDelGantt`). `null` ⇒ no falta nada o no entra.
   */
  trabajo: Intervalo | null;
  sinLugar: boolean;
  /** La última actividad constatada o simulada. */
  ultimaHecha: number | null;
  dependencia: { estado: "ESPERA" | "DESBLOQUEADA"; de: string } | null;
  etiqueta: string;
}

export interface GanttMateria {
  materia: MateriaId;
  temas: readonly GanttTema[];
  evaluaciones: readonly { id: string; ini: number; corto: string }[];
}

export interface PasoProyectado {
  numero: number;
  accionId: string;
  ini: number | null;
  fin: number | null;
  bloqueo: MotivoSinSimular | null;
}

export interface Proyeccion {
  plano: "REAL" | "ESCENARIO";
  ahora: number;
  items: readonly CalendarProjectionItem[];
  posiciones: Readonly<Record<string, Posicion>>;
  /** Acciones pendientes, en orden de prioridad. */
  pendientes: readonly string[];
  retiradas: readonly string[];
  simuladas: readonly string[];
  pasos: readonly PasoProyectado[];
  totales: Totales;
  margenes: readonly MargenDeEvaluacion[];
  gantt: Readonly<Record<MateriaId, GanttMateria>>;
}
