/**
 * **Cuadrícula fugaz** — memoria visuoespacial y secuencial ·
 * [ADR-102](../../../docs/decisions.md#adr-102) §5.
 *
 * Se ilumina una secuencia de casillas, se oculta, y el estudiante la repite en
 * el mismo orden.
 *
 * ## Las reglas son configuración versionada
 *
 * Cambiar un número de `REGLAS_CUADRICULA` **cambia la versión**: cada intento
 * guarda la versión con la que se jugó y el servidor lo corrige con esa. Es el
 * mismo criterio que `PLAN-v0.1` en los riesgos de planificación.
 *
 * ## Lo que este juego NO afirma
 *
 * No mejora la inteligencia, ni el rendimiento académico, ni «la memoria». La
 * marca describe el desempeño **en este ejercicio**.
 */

import { azarDePrueba, enteroEntre } from "./azar";

export const REGLAS_CUADRICULA = {
  version: "CF-1",
  /** Primera sesión: 3×3 y tres casillas. */
  largoInicial: 3,
  largoMinimo: 3,
  /** Las 16 casillas de 4×4: sin repetir, no entra una secuencia más larga. */
  largoMaximo: 16,
  rondasMaximas: 10,
  /** Al segundo error termina la partida. */
  erroresMaximos: 2,
  /** *"Al superar secuencias de longitud 6, usar cuadrícula 4×4"*: desde 7. */
  largoParaCuatroPorCuatro: 7,
  puntosPorCasilla: 100,
  /** Bonificación menor: por cada ronda correcta seguida antes de ésta. */
  bonoPorRacha: 25,
  /** Cuántos intentos recientes miran la dificultad inicial. */
  intentosRecientes: 3,
  /** Se empieza este tanto por debajo de la mejor secuencia reciente. */
  retrocesoInicial: 2,
  /** Tiempo de cada casilla encendida en la presentación con tiempo. */
  milisegundosPorCasilla: 700,
} as const;

export type Lado = 3 | 4;

/** 3×3 hasta seis casillas; 4×4 desde siete. **Nunca más grande en el MVP.** */
export function ladoDeCuadricula(largo: number): Lado {
  return largo >= REGLAS_CUADRICULA.largoParaCuatroPorCuatro ? 4 : 3;
}

/**
 * La secuencia de una ronda: índices de casilla, fila por fila desde `0`.
 *
 * ⚠️ **Sin casillas repetidas dentro de una secuencia**, y es la regla explícita
 * del MVP. Entra siempre: el largo 6 cabe en las 9 casillas de 3×3, y el largo
 * se acota en `largoMaximo`, las 16 de 4×4.
 */
export function secuenciaDeRonda(semilla: number, ronda: number, largo: number): number[] {
  const lado = ladoDeCuadricula(largo);
  const casillas = Array.from({ length: lado * lado }, (_, i) => i);
  const azar = azarDePrueba(semilla, ronda, largo);
  // Fisher–Yates parcial: las primeras `largo` posiciones quedan barajadas.
  for (let i = 0; i < largo; i++) {
    const j = enteroEntre(azar, i, casillas.length);
    [casillas[i], casillas[j]] = [casillas[j], casillas[i]];
  }
  return casillas.slice(0, largo);
}

export interface RondaDeCuadricula {
  /** Desde `0`. */
  ronda: number;
  largo: number;
  lado: Lado;
  correcta: boolean;
  puntos: number;
}

export interface ResultadoDeCuadricula {
  version: string;
  largoInicial: number;
  rondas: RondaDeCuadricula[];
  aciertos: number;
  errores: number;
  /** La secuencia más larga repetida bien. `0` si no acertó ninguna: es un cero real. */
  secuenciaMaxima: number;
  puntuacion: number;
}

export interface EstadoDeCuadricula {
  resultado: ResultadoDeCuadricula;
  terminada: boolean;
  /** La ronda que sigue, si la partida sigue. */
  siguiente: { ronda: number; largo: number; lado: Lado; secuencia: number[] } | null;
}

export type Jugada =
  | { estado: "OK"; partida: EstadoDeCuadricula }
  | { estado: "INVALIDA"; motivo: "RESPUESTAS_DE_MAS" | "CASILLA_INEXISTENTE" | "LARGO_INICIAL_INVALIDO" };

/**
 * Rehace la partida con la semilla y las respuestas. **Es la única corrección:**
 * la usa el cliente para saber qué ronda sigue y el servidor para calcular el
 * resultado que se guarda.
 *
 * ⚠️ **La velocidad no entra.** Una respuesta rápida nunca compensa una
 * incorrecta, y en el MVP ni siquiera desempata.
 */
export function jugarCuadricula(semilla: number, largoInicial: number, respuestas: readonly (readonly number[])[]): Jugada {
  const r = REGLAS_CUADRICULA;
  if (!Number.isInteger(largoInicial) || largoInicial < r.largoMinimo || largoInicial > r.largoMaximo) {
    return { estado: "INVALIDA", motivo: "LARGO_INICIAL_INVALIDO" };
  }

  let largo = largoInicial;
  let errores = 0;
  let racha = 0;
  let puntuacion = 0;
  let secuenciaMaxima = 0;
  const rondas: RondaDeCuadricula[] = [];

  const terminada = () => errores >= r.erroresMaximos || rondas.length >= r.rondasMaximas;

  for (const respuesta of respuestas) {
    if (terminada()) return { estado: "INVALIDA", motivo: "RESPUESTAS_DE_MAS" };
    const lado = ladoDeCuadricula(largo);
    if (respuesta.some((c) => !Number.isInteger(c) || c < 0 || c >= lado * lado)) {
      return { estado: "INVALIDA", motivo: "CASILLA_INEXISTENTE" };
    }
    const esperada = secuenciaDeRonda(semilla, rondas.length, largo);
    const correcta = respuesta.length === esperada.length && respuesta.every((c, i) => c === esperada[i]);

    let puntos = 0;
    if (correcta) {
      puntos = largo * r.puntosPorCasilla + racha * r.bonoPorRacha;
      racha += 1;
      secuenciaMaxima = Math.max(secuenciaMaxima, largo);
    } else {
      errores += 1;
      racha = 0;
    }
    puntuacion += puntos;
    rondas.push({ ronda: rondas.length, largo, lado, correcta, puntos });
    // Acierto: una casilla más, hasta el tope. Error: se mantiene el largo.
    if (correcta) largo = Math.min(largo + 1, r.largoMaximo);
  }

  const fin = terminada();
  return {
    estado: "OK",
    partida: {
      resultado: {
        version: r.version,
        largoInicial,
        rondas,
        aciertos: rondas.filter((x) => x.correcta).length,
        errores,
        secuenciaMaxima,
        puntuacion,
      },
      terminada: fin,
      siguiente: fin
        ? null
        : { ronda: rondas.length, largo, lado: ladoDeCuadricula(largo), secuencia: secuenciaDeRonda(semilla, rondas.length, largo) },
    },
  };
}

/**
 * Con qué largo empieza la partida — la adaptación del MVP (`ADR-102` §7).
 *
 * - **Sin historia, los valores por defecto.** Nada de test diagnóstico.
 * - **Con historia, cerca de lo reciente pero por debajo:** la mejor secuencia
 *   de los últimos tres intentos menos dos. Nunca arranca en la marca máxima, y
 *   una mala partida vieja no pesa: sólo miran los recientes.
 *
 * @param recientes Las secuencias máximas de los intentos completados, **el más reciente primero**.
 */
export function largoInicialDeCuadricula(recientes: readonly number[]): number {
  const r = REGLAS_CUADRICULA;
  const ventana = recientes.slice(0, r.intentosRecientes);
  if (ventana.length === 0) return r.largoInicial;
  return Math.max(r.largoMinimo, Math.max(...ventana) - r.retrocesoInicial);
}
