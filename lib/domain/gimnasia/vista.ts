/**
 * Lo que la pantalla de Gimnasia cognitiva recibe —
 * [ADR-102](../../../docs/decisions.md#adr-102). **Una sola lectura** (`GET
 * /api/gimnasia`) arma la pantalla entera, y lo que un juego necesita para
 * correr llega al empezarlo.
 *
 * ⚠️ **Toda cifra ausente es `null`, no `0`** (AGENTS.md §2.5): sin partidas no
 * hay mejor puntuación, y *«Mejor puntuación: 0»* diría que jugó y no acertó.
 */

import type { TipoDeRespuesta, ResultadoDeRecuerdo } from "./recuerdo-real";
import type { Juego, Marca, OrigenDeSesion } from "./rutina";

export interface RutinaRecomendada {
  juegos: Juego[];
  minutos: number;
  /**
   * Las materias de las preguntas que entrarían hoy. **Vacía si no hay ninguna
   * de una materia**: el nombre nunca se inventa.
   */
  materias: string[];
  /** Hay historia con qué adaptar. Sin ella, la tarjeta no dice *«adaptada»*. */
  adaptada: boolean;
}

export interface SesionEnCurso {
  id: string;
  origen: OrigenDeSesion;
  juegos: Juego[];
  completados: Juego[];
  iniciadaEn: string;
}

export interface ProgresoDeGimnasia {
  diasConRutina: number;
  mejorSecuenciaCuadricula: number | null;
  mejorCadena: number | null;
  repasosCompletados: number;
  /** `null` ⇒ no hay repasos separados por 24 h suficientes para decir algo. */
  recuerdoDiferido: { recordados: number; total: number } | null;
}

export interface TarjetaDeCuadricula {
  mejorPuntuacion: number | null;
  intentos: number;
}

export interface TarjetaDeCadena {
  /** `null` ⇒ nunca jugó. */
  nivel: number | null;
  largo: number | null;
  mejorCadena: number | null;
}

export type SituacionDeRecuerdo =
  /** No hay ninguna pregunta que mostrarle. No se fabrican. */
  | "SIN_CONTENIDO"
  | "PENDIENTES"
  | "AL_DIA";

export interface TarjetaDeRecuerdo {
  situacion: SituacionDeRecuerdo;
  /** Vencidas + nuevas. */
  pendientes: number;
  practicoAntes: boolean;
}

export interface GimnasiaProps {
  /** Con `MODO_PRUEBA=1` hay preguntas sintéticas a la vista, y la pantalla lo dice. */
  simulada: boolean;
  rutina: RutinaRecomendada;
  sesionEnCurso: SesionEnCurso | null;
  progreso: ProgresoDeGimnasia;
  cuadricula: TarjetaDeCuadricula;
  cadena: TarjetaDeCadena;
  recuerdo: TarjetaDeRecuerdo;
}

// ── Lo que devuelve empezar un juego ────────────────────────────────────────

export interface PreguntaDeRecuerdo {
  itemId: string;
  pregunta: string;
  tipo: TipoDeRespuesta;
  /** Sólo en opción múltiple. **Sin la correcta marcada.** */
  opciones: { id: string; texto: string }[] | null;
  materia: string | null;
  /** Es una pregunta sintética de la demo: se rotula. */
  sintetica: boolean;
  /** Desde `0`. */
  posicion: number;
  total: number;
}

export type IntentoEmpezado =
  | { juego: "FLASH_GRID"; intento: string; semilla: number; largoInicial: number; version: string }
  | { juego: "REVERSE_CHAIN"; intento: string; semilla: number; largoInicial: number; nivelAnterior: number | null; version: string }
  | { juego: "REAL_RECALL"; intento: string; version: string; pregunta: PreguntaDeRecuerdo | null };

export interface ResumenDeCuadricula {
  juego: "FLASH_GRID";
  puntuacion: number;
  secuenciaMaxima: number;
  aciertos: number;
  errores: number;
  rondas: number;
  marca: Marca;
}

export interface ResumenDeCadena {
  juego: "REVERSE_CHAIN";
  aciertos: number;
  errores: number;
  largoMaximoCorrecto: number;
  nivelAnterior: number | null;
  nivel: number;
  marca: Marca;
}

export interface ResumenDeRecuerdo {
  juego: "REAL_RECALL";
  respondidas: number;
  recordadas: number;
  parciales: number;
  noRecordadas: number;
  materias: string[];
  /** El repaso más próximo de lo respondido. `null` si no respondió nada. */
  proximoRepaso: string | null;
}

export type ResumenDeJuego = ResumenDeCuadricula | ResumenDeCadena | ResumenDeRecuerdo;

export interface ResultadoDeIntento {
  resumen: ResumenDeJuego;
  /** La sesión quedó completa con este intento. */
  sesionCompletada: boolean;
  duracionSegundos: number;
  /**
   * Con la sesión completa, **todos** sus juegos, del primero al último. Lo arma
   * el servidor: después de una recarga la pantalla no conserva los anteriores,
   * y el resumen final no puede depender de lo que quedó en memoria.
   */
  sesion: { juegos: Array<{ resumen: ResumenDeJuego; duracionSegundos: number }>; duracionSegundos: number } | null;
}

/** Después de confirmar una respuesta cerrada o autoevaluar una abierta. */
export interface RespuestaRegistrada {
  /** `null` en una abierta: nadie la corrigió. */
  correcta: boolean | null;
  resultado: ResultadoDeRecuerdo;
  respuestaCanonica: string;
  explicacion: string | null;
  proximoRepaso: string;
  siguiente: PreguntaDeRecuerdo | null;
  /** Presente cuando la sesión de preguntas terminó con esta respuesta. */
  final: ResultadoDeIntento | null;
}
