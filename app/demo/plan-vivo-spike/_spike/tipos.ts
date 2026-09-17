/**
 * 🧪 **SPIKE DESCARTABLE — «Mi Plan vivo».** Tipos exclusivos del laboratorio.
 *
 * ⚠️ **No son contratos del dominio.** No los importes desde `lib/`, `components/`
 * ni ninguna ruta productiva: existen para que el Product Owner mire una
 * pantalla y decida [ADR-109](../../../../docs/decisions.md#adr-109), que sigue
 * `PENDING`. Si el experimento sigue, estos tipos **se tiran** y se escriben los
 * reales en `lib/domain/` con su ADR. Si no sigue, se borra la carpeta entera.
 *
 * Los nombres llevan el prefijo `Spike` a propósito: nada de acá tiene que
 * poder confundirse con `Action`, `Commitment` o `Evidence`.
 */

/** Los escenarios que el spike sabe dibujar. Cada uno es una proyección **preparada a mano**. */
export type SpikeScenario =
  | "BASE"
  | "COMPLETION_SIMULATION"
  | "EXTRA_AVAILABILITY_PREVIEW"
  | "EXTRA_AVAILABILITY_APPLIED"
  | "TIME_ADVANCED_MISSED"
  /** Agregado al pedido: cómo quedaría una reubicación **sin confirmarla**. */
  | "RESCUE_PREVIEW";

export type SpikeMateriaId = "ANALISIS" | "ECONOMIA" | "ARQUITECTURA";

export interface SpikeMateria {
  id: SpikeMateriaId;
  nombre: string;
  /** Lo que entra en un bloque angosto. */
  corto: string;
  /** Un token de `app/globals.css`. Identidad, nunca estado. */
  color: string;
}

/** Los carriles del camino temporal. */
export type SpikeCarril = "FACULTAD" | "COMPROMISOS" | "ACCIONES";

/**
 * Qué es el bloque, **en el lenguaje visual del spike**. Cada estado se dibuja
 * con texto + ícono + borde o trama; el color sólo refuerza.
 */
export type SpikeEstado =
  /** Clase o evaluación de la facultad. Nunca se mueve. */
  | "INSTITUCIONAL"
  /** Compromiso confirmado por el estudiante. No se reubica en silencio. */
  | "COMPROMISO_CONFIRMADO"
  /** Propuesta del plan, todavía no comprometida. Se puede reordenar. */
  | "SUGERIDA"
  /** Evidencia enviada y todavía sin revisar. No es suficiencia. */
  | "EVIDENCIA_PENDIENTE"
  /** Progreso registrado. Es un hecho distinto de la evidencia validada. */
  | "PROGRESO_REGISTRADO"
  /** Compromiso cuyo bloque pasó sin empezarse. Queda para siempre. */
  | "INCUMPLIDO"
  /** Trabajo de un compromiso incumplido: sigue pendiente, sin hora. */
  | "NECESITA_REUBICACION"
  /** Propuesta de horario nuevo para ese trabajo. Necesita confirmación. */
  | "PROPUESTA_SIN_CONFIRMAR";

export type SpikeConfianza = "baja" | "media" | "alta";

export interface SpikeRango {
  min: number;
  max: number;
  /**
   * La duración que suman los totales. **No es el promedio** de `min` y `max`:
   * es la que el fixture declara como más probable, y se dice así.
   */
  probable: number;
}

/** Día y hora de pared en `America/Argentina/Cordoba`. */
export interface SpikeFranjaHoraria {
  /** `YYYY-MM-DD`. */
  dia: string;
  /** `HH:MM`. */
  desde: string;
  /** `HH:MM`. */
  hasta: string;
}

/** Lo que el catálogo del fixture sabe de cada elemento, antes de ubicarlo. */
export interface SpikeElemento {
  /** Identificador sintético del laboratorio (`*-SYN-SPIKE-*`). */
  id: string;
  carril: SpikeCarril;
  materia: SpikeMateriaId;
  /** Tipo corto que se lee en el bloque: *Clase*, *Parcial*, *Práctica*… */
  tipo: string;
  titulo: string;
  estado: SpikeEstado;
  rango: SpikeRango | null;
  confianza: { nivel: SpikeConfianza; fuente: string } | null;
  evidenciaEsperada: string | null;
  /** Ids de lo que tiene que estar hecho antes. Explícito, nunca por orden. */
  requiere: readonly string[];
  /**
   * La franja de lo que **no se mueve**: clases, evaluaciones, compromisos y lo
   * que ya pasó. Un escenario no puede reubicarlo — sólo cambiarle el estado —,
   * y esa garantía está en la forma del dato, no en la disciplina de quien
   * escribe el fixture. `null` = el escenario decide dónde va.
   */
  franjaFija: SpikeFranjaHoraria | null;
}

/** Un elemento ubicado (o no) dentro de una proyección. */
export interface SpikePlanItem extends SpikeElemento {
  /** `null` = no está ubicado: va a *Por ubicar* o a *Necesita reubicación*. */
  franja: SpikeFranjaHoraria | null;
  /** Resultado de una simulación o vista previa: todavía no pasó. */
  hipotetico: boolean;
}

/** Una franja de disponibilidad declarada. */
export interface SpikeDisponibilidad extends SpikeFranjaHoraria {
  id: string;
  /** Agregada por el escenario de cinco horas más. */
  agregada: boolean;
}

/** Tiempo disponible que ningún bloque ocupa. **Se calcula**, no se escribe. */
export interface SpikeMargen extends SpikeFranjaHoraria {
  minutos: number;
  /** Termina antes del parcial de Análisis. */
  antesDelParcial: boolean;
}

export interface SpikeTotales {
  /** Suma de la duración probable de todo el trabajo pendiente. */
  pendiente: number;
  pendienteMin: number;
  pendienteMax: number;
  /** Disponibilidad futura que queda para el trabajo pendiente. */
  disponible: number;
  /** Trabajo pendiente sin franja. */
  sinUbicar: number;
  /** Disponibilidad sin trabajo encima. */
  margen: number;
}

export interface SpikePlanProjection {
  escenario: SpikeScenario;
  /** El reloj del escenario, ISO con `-03:00`. */
  ahora: string;
  items: readonly SpikePlanItem[];
  disponibilidad: readonly SpikeDisponibilidad[];
  margenes: readonly SpikeMargen[];
  totales: SpikeTotales;
  /** Id de la acción recomendada del escenario. `null` = ninguna. */
  proximaAccion: string | null;
  /** Id de la que viene después, si se hace la recomendada. */
  siguienteAccion: string | null;
}

export interface SpikeMovimiento {
  id: string;
  antes: SpikeFranjaHoraria | null;
  despues: SpikeFranjaHoraria | null;
}

export interface SpikePlanDiff {
  movidos: readonly SpikeMovimiento[];
  /** Salen del trabajo pendiente (completados en la simulación, o que ya no hacen falta). */
  retirados: readonly string[];
  /** Entran a una franja desde *Por ubicar*. */
  ubicados: readonly string[];
  /** Salen de una franja hacia *Por ubicar*. */
  desubicados: readonly string[];
  cambiosDeEstado: readonly { id: string; antes: SpikeEstado; despues: SpikeEstado }[];
  minutos: {
    pendiente: number;
    disponible: number;
    sinUbicar: number;
    margen: number;
  };
  siguienteAntes: string | null;
  siguienteDespues: string | null;
  /** Clases, evaluaciones y compromisos que quedaron exactamente igual. */
  restriccionesIguales: readonly string[];
}
