/**
 * **Cadena inversa** — memoria de trabajo · [ADR-102](../../../docs/decisions.md#adr-102) §6.
 *
 * Se muestra una cadena de dígitos, se oculta, y el estudiante la escribe al
 * revés. Entrena **mantener y manipular**, no sólo repetir.
 *
 * ⚠️ **No es memoria visual.** Aunque los dígitos se lean en pantalla, el
 * estudiante puede recodificarlos de palabra: el copy no dice «visual».
 *
 * ## Nivel no es la persona
 *
 * El nivel es **la longitud de cadena consolidada en este juego**: *Nivel 3 ·
 * 5 dígitos*. No es un nivel de memoria, ni de nadie. Se muestra siempre con
 * sus dígitos al lado para que no se lea como una escala sobre el estudiante.
 */

import { azarDePrueba, enteroEntre } from "./azar";

export const REGLAS_CADENA = {
  version: "CI-1",
  largoMinimo: 3,
  largoMaximo: 12,
  pruebasPorSesion: 5,
  /** Dos aciertos en el largo actual habilitan probar el siguiente. */
  aciertosParaSubir: 2,
  /** Dos errores seguidos bajan el largo **sólo en esta sesión**. */
  erroresSeguidosParaBajar: 2,
  /** La presentación con tiempo: un segundo de base y un poco menos por dígito. */
  milisegundosBase: 1000,
  milisegundosPorDigito: 900,
} as const;

/**
 * La cadena de una prueba. **Sólo dígitos**, y sin dos iguales seguidos: *«3 3 3»*
 * se lee como un bloque y deja de pedir manipulación. Es la regla explícita.
 */
export function cadenaDePrueba(semilla: number, prueba: number, largo: number): string {
  const azar = azarDePrueba(semilla, prueba, largo);
  let cadena = "";
  let anterior = -1;
  while (cadena.length < largo) {
    const d = enteroEntre(azar, 0, 10);
    if (d === anterior) continue;
    cadena += String(d);
    anterior = d;
  }
  return cadena;
}

export function invertir(cadena: string): string {
  return [...cadena].reverse().join("");
}

/**
 * Lo que escribió el estudiante, sin espacios ni separadores.
 *
 * `null` ⇒ trae algo que no es un dígito: **no se corrige como «casi»**, es una
 * respuesta incorrecta.
 */
export function normalizarCadena(texto: string): string | null {
  const limpio = texto.replace(/[\s.,;:_\-/]+/g, "");
  return /^\d+$/.test(limpio) ? limpio : null;
}

/** El nivel de un largo, y al revés. Tres dígitos son el Nivel 1. */
export const nivelDeLargo = (largo: number) => largo - (REGLAS_CADENA.largoMinimo - 1);
export const largoDeNivel = (nivel: number) => nivel + (REGLAS_CADENA.largoMinimo - 1);

export interface PruebaDeCadena {
  prueba: number;
  largo: number;
  correcta: boolean;
  /** Para mostrarla cuando hubo error. Nunca antes de responder. */
  correctaEra: string;
}

export interface ResultadoDeCadena {
  version: string;
  largoInicial: number;
  pruebas: PruebaDeCadena[];
  aciertos: number;
  errores: number;
  largoMaximoIntentado: number;
  /** `0` si no acertó ninguna. */
  largoMaximoCorrecto: number;
  /** El largo con dos aciertos en esta sesión. `null` si no consolidó ninguno. */
  largoConsolidado: number | null;
}

export interface EstadoDeCadena {
  resultado: ResultadoDeCadena;
  terminada: boolean;
  siguiente: { prueba: number; largo: number; cadena: string } | null;
}

export type JugadaDeCadena =
  | { estado: "OK"; partida: EstadoDeCadena }
  | { estado: "INVALIDA"; motivo: "RESPUESTAS_DE_MAS" | "LARGO_INICIAL_INVALIDO" };

/**
 * Rehace la sesión con la semilla y las respuestas. Como en la cuadrícula, **es
 * la única corrección**: el cliente sabe qué prueba sigue y el servidor calcula
 * lo que se guarda.
 */
export function jugarCadena(semilla: number, largoInicial: number, respuestas: readonly string[]): JugadaDeCadena {
  const r = REGLAS_CADENA;
  if (!Number.isInteger(largoInicial) || largoInicial < r.largoMinimo || largoInicial > r.largoMaximo) {
    return { estado: "INVALIDA", motivo: "LARGO_INICIAL_INVALIDO" };
  }
  if (respuestas.length > r.pruebasPorSesion) return { estado: "INVALIDA", motivo: "RESPUESTAS_DE_MAS" };

  let largo = largoInicial;
  let aciertosEnLargo = 0;
  let erroresSeguidos = 0;
  let consolidado: number | null = null;
  const pruebas: PruebaDeCadena[] = [];

  for (const respuesta of respuestas) {
    const cadena = cadenaDePrueba(semilla, pruebas.length, largo);
    const esperada = invertir(cadena);
    const correcta = normalizarCadena(respuesta) === esperada;
    pruebas.push({ prueba: pruebas.length, largo, correcta, correctaEra: esperada });

    if (correcta) {
      aciertosEnLargo += 1;
      erroresSeguidos = 0;
      if (aciertosEnLargo >= r.aciertosParaSubir) {
        consolidado = Math.max(consolidado ?? 0, largo);
        if (largo < r.largoMaximo) largo += 1;
        aciertosEnLargo = 0;
      }
    } else {
      erroresSeguidos += 1;
      if (erroresSeguidos >= r.erroresSeguidosParaBajar && largo > r.largoMinimo) {
        largo -= 1;
        erroresSeguidos = 0;
        aciertosEnLargo = 0;
      }
    }
  }

  const terminada = pruebas.length >= r.pruebasPorSesion;
  const correctas = pruebas.filter((p) => p.correcta);
  return {
    estado: "OK",
    partida: {
      resultado: {
        version: r.version,
        largoInicial,
        pruebas,
        aciertos: correctas.length,
        errores: pruebas.length - correctas.length,
        largoMaximoIntentado: pruebas.reduce((m, p) => Math.max(m, p.largo), 0),
        largoMaximoCorrecto: correctas.reduce((m, p) => Math.max(m, p.largo), 0),
        largoConsolidado: consolidado,
      },
      terminada,
      siguiente: terminada ? null : { prueba: pruebas.length, largo, cadena: cadenaDePrueba(semilla, pruebas.length, largo) },
    },
  };
}

/**
 * El nivel que queda después de una sesión.
 *
 * ⚠️ **Nunca baja.** *"El nivel persistido no debe caer por una única mala
 * sesión"*: en el MVP no cae por ninguna. Dentro de la sesión el largo sí baja
 * con dos errores seguidos, y eso ya cuida la dificultad sin reescribir el
 * nivel. Mejor cadena y nivel se guardan por separado.
 */
export function nivelResultante(nivelAnterior: number | null, largoConsolidado: number | null): number {
  const base = nivelAnterior ?? 1;
  return largoConsolidado === null ? base : Math.max(base, nivelDeLargo(largoConsolidado));
}

/** Se empieza en el largo del nivel actual. Sin nivel, tres dígitos. */
export function largoInicialDeCadena(nivelActual: number | null): number {
  const r = REGLAS_CADENA;
  if (nivelActual === null) return r.largoMinimo;
  return Math.min(r.largoMaximo, Math.max(r.largoMinimo, largoDeNivel(nivelActual)));
}

export function milisegundosDeExposicion(largo: number): number {
  return REGLAS_CADENA.milisegundosBase + REGLAS_CADENA.milisegundosPorDigito * largo;
}
