/**
 * 🧪 **LABORATORIO DESCARTABLE — «Mi Plan vivo» V2.** Tipos exclusivos de esta carpeta.
 *
 * ⚠️ **No son contratos del dominio.** No los importes desde `lib/`, `components/`
 * ni ninguna ruta productiva. Existen para que el Product Owner pruebe una pantalla
 * y decida [ADR-109](../../../../docs/decisions.md#adr-109), que sigue `PENDING`.
 * Si el experimento sigue, se tiran y se escriben los reales con su ADR.
 *
 * ## Por qué cinco formas y no un `workitem` con booleanos
 *
 * Todo se dibuja como un bloque, pero no es lo mismo:
 *
 * - `ClaseDelCursado` y `Evaluacion` son **de la facultad**: nadie del lado del
 *   estudiante las mueve.
 * - `WorkItem` es **trabajo académico propuesto**: se prioriza, se reubica y se
 *   simula.
 * - `Compromiso` es un workitem **con día, hora, duración y evidencia confirmados**:
 *   sólo cambia con *Cambiar horario*, y conserva la promesa original.
 * - `HechoHistorico` **ya ocurrió**: no tiene ningún control de movimiento.
 * - `VentanaDeDisponibilidad` es **cuándo el estudiante dijo que puede estudiar**.
 *
 * La diferencia está en la forma del dato (`kind`), no en la disciplina de quien
 * escribe la pantalla.
 */

export type LabMateriaId = "ANALISIS" | "ECONOMIA" | "ARQUITECTURA";

export interface LabMateria {
  id: LabMateriaId;
  nombre: string;
  corto: string;
  /** Un token de `app/globals.css`. Identidad, nunca estado. */
  color: string;
}

/** Día y hora de pared en `America/Argentina/Cordoba`. */
export interface Franja {
  /** `YYYY-MM-DD`, dentro de la semana del laboratorio. */
  dia: string;
  /** `HH:MM`. */
  desde: string;
  /** `HH:MM`. */
  hasta: string;
}

export type Confianza = "baja" | "media" | "alta";

export interface Rango {
  min: number;
  /** La duración que suman los totales y la que ocupa un bloque. */
  probable: number;
  max: number;
}

/** Prioridad **blanda**: varios pueden compartir nivel. No es dependencia. */
export type Prioridad = "PRIMERO" | "ENSEGUIDA" | "DESPUES";

/** Un tema o unidad de una materia, para el Gantt académico. */
export interface Tema {
  id: string;
  materia: LabMateriaId;
  unidad: string;
  nombre: string;
  /** Qué sabe el laboratorio de la cátedra. */
  catedra:
    | { estado: "DADA"; cuando: string; fuente: string; claseId: string | null }
    | { estado: "ESPERADA"; cuando: string; fuente: string; claseId: string; confianza: Confianza };
  /** Qué hay registrado del estudiante **hoy**. Una simulación nunca lo cambia. */
  vos: "PROGRESO_REGISTRADO" | "EVIDENCIA_SIN_PROGRESO" | "SIN_PROGRESO";
}

export interface ClaseDelCursado {
  kind: "CLASE";
  id: string;
  materia: LabMateriaId;
  titulo: string;
  franja: Franja;
  comision: string;
  aula: string;
  fuente: string;
  /** Sólo en una clase que ya pasó y quedó registrada. */
  registro: {
    asistencia: string;
    temasConfirmados: readonly string[];
    notas: readonly string[];
    resumen: string;
    accionesGeneradas: readonly string[];
  } | null;
  /** Sólo en una clase que todavía no pasó. **Nada de esto es un hecho.** */
  esperado: {
    temasEsperados: readonly string[];
    confianza: Confianza;
    materialesPrevios: readonly string[];
  } | null;
}

export interface Evaluacion {
  kind: "EVALUACION";
  id: string;
  materia: LabMateriaId;
  titulo: string;
  franja: Franja;
  modalidad: string;
  alcance: { temas: readonly string[]; estado: "CONFIRMADO" | "PROVISIONAL"; detalle: string };
  fuente: string;
  accionesRelacionadas: readonly string[];
  restricciones: readonly string[];
}

export interface ImpactoAcademico {
  temas: readonly string[];
  /** Si, con evidencia suficiente, se registra progreso sobre esos temas. */
  produceProgreso: boolean;
  explicacion: string;
}

export interface WorkItem {
  kind: "WORKITEM";
  id: string;
  materia: LabMateriaId;
  tipo: string;
  titulo: string;
  /** Qué tiene que quedar a la vista al terminar. */
  objetivo: string;
  prioridad: Prioridad;
  razonDePrioridad: string;
  /** Dependencias académicas: ids que tienen que estar **hechos** antes. */
  requiere: readonly string[];
  duracion: Rango;
  confianza: { nivel: Confianza; fuente: string };
  evidencia: string | null;
  impacto: ImpactoAcademico;
  /** No se puede ubicar antes de este momento (p. ej., el tema se da en una clase). */
  noAntesDe: { dia: string; hora: string; motivo: string } | null;
  /** Tiene que terminar antes de esta evaluación. */
  antesDe: string | null;
  /** Trabajo condicional: deja de hacer falta si este otro se completa. */
  seRetiraSi: { id: string; motivo: string } | null;
  origen: string | null;
  /** Por qué ésta y no otra, en frases. **Sin puntajes.** */
  alternativas: readonly string[];
}

export interface Renegociacion {
  antes: Franja;
  despues: Franja;
  /** En el laboratorio, siempre local. */
  registro: string;
}

export interface Compromiso {
  kind: "COMPROMISO";
  id: string;
  materia: LabMateriaId;
  titulo: string;
  prioridad: Prioridad;
  franja: Franja;
  evidencia: string;
  estado: "CONFIRMADO" | "INCUMPLIDO";
  /** La promesa como se confirmó la primera vez. No se edita nunca. */
  promesaOriginal: Franja;
  renegociaciones: readonly Renegociacion[];
  realizado: string;
  /** Si está incumplido, qué workitem lleva el trabajo que sigue pendiente. */
  trabajoPendienteId: string | null;
  impacto: ImpactoAcademico;
}

export interface HechoHistorico {
  kind: "HECHO";
  id: string;
  materia: LabMateriaId;
  tipo: string;
  titulo: string;
  franja: Franja;
  /** Los temas sobre los que trabajó, haya o no progreso registrado. */
  temas: readonly string[];
  duracionEstimada: Rango;
  duracionReal: number;
  focus: string | null;
  evidencia: { descripcion: string; estado: "ENVIADA_SIN_REVISAR" | "SUFICIENTE" };
  reflexion: string | null;
  progresoRegistrado: { temas: readonly string[]; cuando: string } | null;
  /** El `PlanDiff` histórico: qué cambió en el plan cuando esto pasó. Escrito en el fixture. */
  impactoEnElPlan: readonly string[];
  cambioEnGantt: string;
}

export interface VentanaDeDisponibilidad {
  kind: "DISPONIBILIDAD";
  id: string;
  franja: Franja;
  origen: "RECURRENTE" | "EXCEPCION";
  detalle: string;
}

export type Entidad = ClaseDelCursado | Evaluacion | WorkItem | Compromiso | HechoHistorico | VentanaDeDisponibilidad;

// ── Escenario ─────────────────────────────────────────────────────────────────

export interface PasoDelEscenario {
  id: string;
  /** El estudiante confirmó un orden distinto del recomendado. Sólo local. */
  override: boolean;
}

/** Todo lo que el estudiante cambió **en el escenario**. El plan real no tiene nada de esto. */
export interface Escenario {
  pasos: readonly PasoDelEscenario[];
  /** Propuestas reubicadas a mano. Siguen siendo propuestas. */
  reubicaciones: Readonly<Record<string, Franja>>;
  /** Compromisos con horario cambiado. La promesa original no se toca. */
  renegociaciones: Readonly<Record<string, Franja>>;
  agregadas: readonly string[];
  quitadas: readonly string[];
}

// ── Proyección ────────────────────────────────────────────────────────────────

export type Carril = "FACULTAD" | "COMPROMISOS" | "TRABAJO";

export type EstadoEnPlan =
  /** Clase o evaluación. */
  | "FIJO"
  /** Hecho histórico. */
  | "HECHO"
  | "INCUMPLIDO"
  | "CONFIRMADO"
  /** La promesa anterior de un compromiso con horario cambiado en el escenario. */
  | "PROMESA_ANTERIOR"
  | "PROPUESTA"
  /** Completado **en el escenario**. No pasó. */
  | "SIMULADO"
  /** Simulado sin su prerequisito: ocupa el tiempo y no constata nada. */
  | "INTENTO";

export type MotivoSinUbicar =
  /** Ninguna ventana libre dura lo que necesita. */
  | "SIN_VENTANA"
  /** Sólo entraría después de la evaluación para la que existe. */
  | "PLAZO"
  /** Su prerequisito no tiene lugar. */
  | "DEPENDENCIA";

export interface Colocado {
  /** Clave única en la proyección. */
  clave: string;
  /** La entidad que dibuja. */
  id: string;
  carril: Carril;
  franja: Franja | null;
  estado: EstadoEnPlan;
  /** Existe sólo en el escenario. */
  hipotetico: boolean;
  pasoNumero: number | null;
  reubicado: boolean;
  motivoSinUbicar: MotivoSinUbicar | null;
}

export interface Margen extends Franja {
  minutos: number;
}

export interface VentanaEnPlan {
  ventana: VentanaDeDisponibilidad;
  /** Minutos que todavía no pasaron y no pisan una clase. */
  minutosUtiles: number;
}

export interface Totales {
  /** Suma probable del trabajo pendiente en el horizonte. */
  pendiente: number;
  pendienteMin: number;
  pendienteMax: number;
  /** Disponibilidad declarada útil: futura y sin clases encima. */
  declarada: number;
  /** Parte de la declarada que ocupa lo simulado como hecho (o un intento). */
  usadaPorSimulado: number;
  sinUbicar: number;
  margen: number;
}

export type EstadoDeTema = "PROGRESO_REGISTRADO" | "EVIDENCIA_SIN_PROGRESO" | "SIN_PROGRESO";
export type EstadoDeTemaEnEscenario = "PROGRESO_REGISTRADO" | "SIMULADO" | "SIN_CAMBIO";

export interface Riesgo {
  id: string;
  texto: string;
}

export interface PasoProyectado {
  numero: number;
  id: string;
  override: boolean;
  /** Se simuló sin un prerequisito: no constata. */
  incompleto: boolean;
  faltan: readonly string[];
  /** No hubo lugar para simularlo. */
  sinLugar: boolean;
  franja: Franja | null;
}

export interface Proyeccion {
  esEscenario: boolean;
  colocados: readonly Colocado[];
  ventanas: readonly VentanaEnPlan[];
  margenes: readonly Margen[];
  totales: Totales;
  /** Ids completados en el escenario con su prerequisito cumplido. */
  completados: readonly string[];
  /** Ids que dejaron de hacer falta. */
  retirados: readonly string[];
  pasos: readonly PasoProyectado[];
  temasEnEscenario: Readonly<Record<string, EstadoDeTemaEnEscenario>>;
  riesgos: readonly Riesgo[];
  /** El primer trabajo pendiente del orden recomendado con sus dependencias cumplidas. */
  recomendada: string | null;
  /** Los compromisos como quedan en esta proyección. */
  compromisos: Readonly<Record<string, Compromiso>>;
}

export interface Movimiento {
  clave: string;
  id: string;
  antes: Franja;
  despues: Franja;
}

export interface PlanDiff {
  movidos: readonly Movimiento[];
  completados: readonly string[];
  retirados: readonly string[];
  intentos: readonly string[];
  ubicados: readonly string[];
  desubicados: readonly string[];
  minutos: { pendiente: number; declarada: number; usada: number; sinUbicar: number; margen: number };
  recomendadaAntes: string | null;
  recomendadaDespues: string | null;
  riesgosAgregados: readonly Riesgo[];
  riesgosEliminados: readonly Riesgo[];
  temasQueCambian: readonly string[];
  /** Clases, evaluaciones y compromisos que quedaron en el mismo lugar. */
  restriccionesIguales: readonly string[];
}
