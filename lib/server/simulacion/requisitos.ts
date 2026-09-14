import "server-only";

import {
  evaluarRequisitos,
  type CondicionesDeCursado,
  type RequisitosDeCursado,
  type SituacionDeCursado,
} from "@/lib/domain/requisitos-de-cursado";

/**
 * Los requisitos de cursado, simulados — [ADR-108](../../../docs/decisions.md#adr-108).
 *
 * ⚠️ **Nada de esto es un dato de la facultad.** Achieve no tiene las
 * condiciones de promoción y regularidad de una cátedra, no registra asistencia
 * y no conoce las notas de los parciales. El owner pidió ver cómo se leería
 * *«piden X, venís Y %, quedan 6 clases»*: todo sale de acá, **sólo con
 * `MODO_PRUEBA=1`**, y el panel lo rotula *Simulado*.
 *
 * ⚠️ **No es el modelo real.** Las condiciones son del programa de la materia
 * (y tienen que llegar con su procedencia); la asistencia y las notas son datos
 * de una persona y tocan [ADR-006](../../../docs/decisions.md#adr-006). Esta
 * forma **no se migra a columnas**: se borra cuando exista lo real.
 *
 * ⚠️ **El período de 16 semanas también es simulado.** El período real no tiene
 * fechas (ADR-100): acá se inventa uno, y por eso sólo vive detrás de la variable.
 *
 * **Determinístico**: la misma cursada da los mismos números en cada recarga.
 */

export const SEMANAS_DEL_PERIODO_SIMULADO = 16;

export function simulacionDeRequisitosActiva(): boolean {
  return process.env.MODO_PRUEBA === "1";
}

/** FNV-1a de 32 bits, como `simulacion/clase.ts`. */
function huella(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Un número en `[desde, hasta]` a partir de otra sal: bits independientes por dato. */
function entre(semilla: string, sal: string, desde: number, hasta: number): number {
  return desde + (huella(`${semilla}·${sal}`) % (hasta - desde + 1));
}

export function condicionesSimuladas(cursadaId: string): CondicionesDeCursado {
  const promociona = entre(cursadaId, "promociona", 0, 4) !== 0;
  return {
    promocion: promociona
      ? {
          notaMinima: entre(cursadaId, "nota-promo", 0, 2) === 0 ? 8 : 7,
          tpsAprobados: 100,
          asistenciaTeorico: 75,
          asistenciaPractico: 80,
        }
      : null,
    regular: { notaMinima: 4, tpsAprobados: 75, asistenciaTeorico: 60, asistenciaPractico: 75 },
  };
}

/**
 * @param bloquesPorSemana Los bloques del horario de la materia. Alternan teórico
 *   y práctico, como la clase simulada de ADR-099; sin horario se asume uno de cada.
 */
export function situacionSimulada(cursadaId: string, bloquesPorSemana: number): SituacionDeCursado {
  const bloques = Math.max(2, bloquesPorSemana);
  const teoricas = Math.ceil(bloques / 2);
  const practicas = Math.floor(bloques / 2);
  const semana = entre(cursadaId, "semana", 6, 12);

  const asistencia = (sal: string, porSemana: number) => {
    const dadas = semana * porSemana;
    // Entre 0 y 35 % de faltas: da los cuatro estados repartidos entre materias.
    const faltas = entre(cursadaId, sal, 0, Math.ceil(dadas * 0.35));
    return { total: SEMANAS_DEL_PERIODO_SIMULADO * porSemana, dadas, asistidas: dadas - faltas };
  };

  const tpsTotal = entre(cursadaId, "tps", 4, 6);
  const vencidos = Math.floor((semana / SEMANAS_DEL_PERIODO_SIMULADO) * tpsTotal);

  return {
    parciales: [
      { nombre: "Parcial 1", nota: semana >= 8 ? entre(cursadaId, "p1", 4, 10) : null },
      { nombre: "Parcial 2", nota: null },
    ],
    tps: {
      total: tpsTotal,
      vencidos,
      aprobados: Math.max(0, vencidos - entre(cursadaId, "tps-sin-aprobar", 0, 1)),
    },
    teorico: asistencia("teorico", teoricas),
    practico: asistencia("practico", practicas),
  };
}

export function requisitosSimulados(cursadaId: string, bloquesPorSemana: number): RequisitosDeCursado {
  return evaluarRequisitos(condicionesSimuladas(cursadaId), situacionSimulada(cursadaId, bloquesPorSemana));
}
