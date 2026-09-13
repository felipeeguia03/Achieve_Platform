/**
 * **La clase que abre el estudiante** — [ADR-098](../../docs/decisions.md#adr-098).
 *
 * ## ⛔ No es `class_session`
 *
 * `class_session` es una clase **dictada**, de la comisión: alimenta el Gantt,
 * el `Un.` de Hoy y el ritmo de cátedra de todos los alumnos. Ésta es de **un**
 * estudiante: la abrió él, tiene sus apuntes y sus marcas, y no le cambia nada
 * a nadie más.
 *
 * ## Qué es declarado y qué es derivado
 *
 * | Declarado | Derivado (acá) |
 * |---|---|
 * | iniciar, terminar, cada marca, los apuntes | la duración, cuántas marcas de cada tipo, el momento de una marca |
 *
 * **Nada es inferido.** Si algún día una IA dice de qué trató la clase, entra
 * con su propia procedencia y nunca se mezcla con lo de esta tabla.
 *
 * **Puro:** sin React, sin I/O, sin copy.
 */

/**
 * Los cuatro tipos de marca. **El emoji es de la pantalla**, nunca del dominio.
 *
 * ⚠️ **`ASSESSMENT`, no `EXAM`.** El vocabulario canónico es `Assessment`, y
 * lo que viene puede ser un final o un TP: *"Parcial"* hubiera sido falso la
 * mitad de las veces.
 *
 * ⛔ **Una marca no es `class_event_record`.** Aquél cambia decisiones del
 * sistema y su contrato es `C01-004`, `OPEN`. Una `ASSESSMENT` no sube la
 * prioridad de ningún tema: es un señalador del estudiante (AGENTS.md §2.6).
 */
export const TIPOS_DE_MARCA = ["QUESTION", "IMPORTANT", "ASSESSMENT", "REVIEW"] as const;
export type TipoDeMarca = (typeof TIPOS_DE_MARCA)[number];

export function esTipoDeMarca(valor: unknown): valor is TipoDeMarca {
  return typeof valor === "string" && (TIPOS_DE_MARCA as readonly string[]).includes(valor);
}

/**
 * Límites **técnicos**, no reglas de producto: impiden que un reintento mal
 * armado o un pegado accidental llene la base. No dicen cuánto conviene
 * escribir.
 */
export const MAXIMO_DE_TEXTO_DE_MARCA = 1_000;
/**
 * El límite de `student_class_session.notes`, **columna sin escritor desde
 * ADR-099**. Queda porque el `CHECK` de la migración de ADR-098 lo sigue diciendo.
 */
export const MAXIMO_DE_APUNTES = 50_000;

// ── ADR-099 · entradas, material y grabaciones ───────────────────────────────

/** Una entrada de apuntes: lo que se escribe entre dos Enter. */
export const MAXIMO_DE_ENTRADA = 4_000;
export const MAXIMO_DE_ETIQUETA = 60;
export const MAXIMO_DE_TITULO = 200;
export const MAXIMO_DE_LINK = 2_000;
/** 25 MB. El mismo número que el bucket `clase-material` y el `CHECK`. */
export const MAXIMO_DE_ARCHIVO = 26_214_400;
/** 50 MB: dos horas de voz a 32 kbps entran con margen. Bucket `clase-audio`. */
export const MAXIMO_DE_AUDIO = 52_428_800;
/** Cuatro horas. La duración la declara el archivo; esto la acota. */
export const DURACION_MAXIMA_DE_GRABACION = 14_400;

/**
 * Las etiquetas que la pantalla **sugiere**. Son texto del estudiante, no tipos
 * del dominio: una etiqueta es cualquier texto corto (ADR-099 §3).
 */
export const ETIQUETAS_SUGERIDAS = ["Teoría", "Ejercicio", "Consigna", "Posible evaluación", "Repasar"] as const;

/**
 * Qué archivos se aceptan como material. **Lista cerrada**: un ejecutable subido
 * como «material» y abierto con URL firmada es un problema, no un archivo.
 */
export const TIPOS_DE_MATERIAL = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export function esTipoDeMaterial(mime: unknown): boolean {
  return typeof mime === "string" && (TIPOS_DE_MATERIAL as readonly string[]).includes(mime);
}

/** Lo que graba `MediaRecorder` en los navegadores de escritorio y móvil. */
export function esTipoDeAudio(mime: unknown): boolean {
  return typeof mime === "string" && /^audio\/(webm|ogg|mp4|mpeg|aac|wav)(;.*)?$/i.test(mime);
}

/**
 * Un link aceptable: `http` o `https`, y nada más. `javascript:` o `data:` en
 * un `href` no es un link de la clase.
 */
export function esLinkValido(valor: unknown): valor is string {
  if (typeof valor !== "string" || valor.length > MAXIMO_DE_LINK) return false;
  try {
    const u = new URL(valor);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** `12:30`, o `1:02:05` si pasa la hora: el segundo de una grabación. */
export function minutero(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const dos = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${dos(m)}:${dos(s % 60)}` : `${m}:${dos(s % 60)}`;
}

/** `2,4 MB` · `830 KB`. */
export function tamanoLegible(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export interface Marca {
  id: string;
  tipo: TipoDeMarca;
  /** Segundos desde que empezó la clase. Lo calcula el servidor. */
  segundos: number;
  texto: string | null;
  creadaEn: string;
}

/**
 * Cuántas marcas de cada tipo.
 *
 * **Acá `0` es un cero real**, no *"sin datos"*: la clase existe y el
 * estudiante no marcó nada de ese tipo. Es distinto de una clase que no se
 * pudo leer, que no llega a esta función.
 */
export function resumenDeMarcas(marcas: readonly Pick<Marca, "tipo">[]): Record<TipoDeMarca, number> {
  const resumen = { QUESTION: 0, IMPORTANT: 0, ASSESSMENT: 0, REVIEW: 0 };
  for (const m of marcas) resumen[m.tipo] += 1;
  return resumen;
}

/** Las marcas en el orden en que ocurrieron. Empate: el orden de creación. */
export function enOrden<M extends Pick<Marca, "segundos" | "creadaEn">>(marcas: readonly M[]): M[] {
  return [...marcas].sort((a, b) => a.segundos - b.segundos || a.creadaEn.localeCompare(b.creadaEn));
}

/**
 * Segundos transcurridos entre dos instantes ISO, nunca negativo.
 *
 * Un reloj corrido entre servidor y base podría dar `-1`, y una marca a
 * «-00:00:01» no es un dato: es un defecto.
 */
export function segundosEntre(desde: string, hasta: string): number {
  return Math.max(0, Math.floor((Date.parse(hasta) - Date.parse(desde)) / 1000));
}

/**
 * La duración de una clase terminada, en minutos. `null` si sigue abierta:
 * **una clase abierta no tiene duración**, tiene tiempo transcurrido.
 */
export function duracionEnMinutos(clase: { iniciadaEn: string; terminadaEn: string | null }): number | null {
  if (clase.terminadaEn === null) return null;
  return Math.floor(segundosEntre(clase.iniciadaEn, clase.terminadaEn) / 60);
}

/** `HH:MM:SS`, para el momento de una marca y el reloj de la clase. */
export function reloj(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${dos(Math.floor(s / 3600))}:${dos(Math.floor((s % 3600) / 60))}:${dos(s % 60)}`;
}
