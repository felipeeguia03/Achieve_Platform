import "server-only";

/**
 * Los datos simulados de una clase — [ADR-099](../../../docs/decisions.md#adr-099) §6 y §7.
 *
 * ⚠️ **Nada de esto es un dato de la facultad.** El owner pidió *"obvio simula
 * todos esos datos"*: la comisión, la cantidad de inscriptos y si la clase es
 * teórica o práctica **no existen en el schema como dato de la clase**. Salen de
 * acá, **sólo con `MODO_PRUEBA=1`**, y la pantalla los rotula *Simulado*. Sin la
 * variable, la parte que falta no se dibuja.
 *
 * ⚠️ **No es el modelo de la comisión real.** ADR-062 la trae con el alta, y el
 * padrón de la comisión lo trae el CRM. Esta forma no se migra a columnas.
 *
 * **Determinístico**: la misma oferta da la misma comisión y los mismos
 * inscriptos en cada recarga, para que la demo no parezca inestable.
 */

export interface DatosSimuladosDeClase {
  comision: string;
  inscriptos: number;
  /** Con el formato de `simular-aulas`: *Aula 3.12*. Sólo llena un aula que falta. */
  aula: string;
  tipo: "TEORICA" | "PRACTICA";
}

export function simulacionDeClaseActiva(): boolean {
  return process.env.MODO_PRUEBA === "1";
}

/** FNV-1a de 32 bits: estable, sin dependencias, suficiente para repartir. */
function huella(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * @param semana Los bloques de la materia **ordenados de lunes a domingo**. El
 *   primero es teórico, el segundo práctico, y así: alterna.
 * @param diaDeLaClase `0`–`6`, domingo a sábado, en la zona de la institución.
 *
 * El tipo de una clase **iniciada a mano** sale del bloque de ese mismo día de
 * la semana, si la materia tiene uno; si no, de la huella de la clase.
 */
export function datosSimuladosDeClase(
  entrada: {
    ofertaId: string;
    claseId: string;
    bloqueId: string | null;
    semana: ReadonlyArray<{ id: string; dia: number }>;
    diaDeLaClase: number;
  },
): DatosSimuladosDeClase {
  const h = huella(entrada.ofertaId);
  const delBloque = entrada.bloqueId ? entrada.semana.findIndex((b) => b.id === entrada.bloqueId) : -1;
  const delDia = entrada.semana.findIndex((b) => b.dia === entrada.diaDeLaClase);
  const posicion = delBloque >= 0 ? delBloque : delDia >= 0 ? delDia : huella(entrada.claseId) % 2;
  const lugar = huella(entrada.bloqueId ?? entrada.ofertaId);
  return {
    comision: `${"ABCD"[h % 4]}${1 + ((h >>> 3) % 3)}`,
    inscriptos: 24 + ((h >>> 7) % 57),
    aula: `Aula ${1 + (lugar % 4)}.${String(1 + ((lugar >>> 5) % 24)).padStart(2, "0")}`,
    tipo: posicion % 2 === 0 ? "TEORICA" : "PRACTICA",
  };
}
