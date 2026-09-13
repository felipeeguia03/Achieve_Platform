/**
 * **Las unidades de esta clase, y cómo venís** — [ADR-099](../../docs/decisions.md#adr-099) §8.
 *
 * ## De dónde sale cada cosa
 *
 * | Qué | Fuente | Qué es |
 * |---|---|---|
 * | El estado de cada unidad | `estado_de_materia()`, **el mismo que el Gantt de `UX02`** | Hecho |
 * | Qué unidades faltan | Las anteriores a la de la clase sin `criterio_alcanzado` | Derivado |
 * | La unidad de la clase | Una clase dictada **esa fecha** con temas · o · la que sigue a la última dada | Hecho · o · **inferencia rotulada** |
 *
 * ⚠️ **No inventa cronograma.** ADR-094 prohibió simular clases futuras: esto
 * no escribe nada, se calcula al leer y la pantalla dice cuándo es estimado.
 *
 * ⚠️ **"Faltan" describe actividad registrada, no conocimiento** (ADR-075 §C1).
 *
 * **Puro:** sin React, sin I/O, sin copy.
 */

export type EstadoDeUnidadEnClase = "sin_evidencia" | "enviada" | "requiere_revision" | "criterio_alcanzado";

export interface UnidadDeMateria {
  id: string;
  /** El número que se muestra: `1` en *Unidad 1*. `null` ⇒ la unidad no lo declara. */
  numero: number | null;
  codigo: string | null;
  nombre: string;
  estado: EstadoDeUnidadEnClase;
  /** `null` ⇒ no se sabe cuánto lleva; el dibujo la reparte pareja. */
  minutos: number | null;
}

export type PosicionDeUnidad = "ANTERIOR" | "ESTA_CLASE" | "POSTERIOR";

export interface UnidadesDeClase {
  unidades: Array<UnidadDeMateria & { posicion: PosicionDeUnidad }>;
  /** `DICTADA` ⇒ lo dice el libro de temas. `ESTIMADA` ⇒ lo calculó Achieve, y se rotula. */
  fuente: "DICTADA" | "ESTIMADA";
  /** Las unidades anteriores **sin criterio alcanzado**, en orden. Vacío ⇒ venís al día. */
  faltan: UnidadDeMateria[];
}

/**
 * @param unidades En **el orden dictado**, como las entrega `estado_de_materia()`.
 * @param temasDeEsaFecha Los temas de una clase dictada el día de la clase. Hecho.
 * @param temasDeLaUltimaDada Los temas de la última clase dada **antes** de ese día.
 * @returns `null` si la materia no tiene unidades: sin temario no hay nada que decir.
 */
export function unidadesDeLaClase(
  unidades: readonly UnidadDeMateria[],
  temasDeEsaFecha: readonly string[],
  temasDeLaUltimaDada: readonly string[],
): UnidadesDeClase | null {
  if (unidades.length === 0) return null;
  const indice = new Map(unidades.map((u, i) => [u.id, i]));
  const posiciones = (temas: readonly string[]) =>
    temas.map((t) => indice.get(t)).filter((i): i is number => i !== undefined);

  let estaClase: number[];
  let fuente: UnidadesDeClase["fuente"];
  const dictadas = posiciones(temasDeEsaFecha);
  if (dictadas.length > 0) {
    estaClase = [...new Set(dictadas)].sort((a, b) => a - b);
    fuente = "DICTADA";
  } else {
    // La que sigue a la última dada. Si la última dada fue la última unidad, se
    // queda ahí: no hay una siguiente que inventar.
    const previas = posiciones(temasDeLaUltimaDada);
    const siguiente = previas.length > 0 ? Math.min(Math.max(...previas) + 1, unidades.length - 1) : 0;
    estaClase = [siguiente];
    fuente = "ESTIMADA";
  }

  const primera = estaClase[0];
  const ultima = estaClase[estaClase.length - 1];
  const posicion = (i: number): PosicionDeUnidad =>
    estaClase.includes(i) ? "ESTA_CLASE" : i < ultima ? "ANTERIOR" : "POSTERIOR";
  return {
    unidades: unidades.map((u, i) => ({ ...u, posicion: posicion(i) })),
    fuente,
    faltan: unidades.filter((u, i) => i < primera && u.estado !== "criterio_alcanzado"),
  };
}

/**
 * *"1, 2, 3 y 4"*. Las que no declaran número se nombran por su nombre: una
 * lista con huecos diría menos de lo que se sabe.
 */
export function listaDeUnidades(unidades: readonly Pick<UnidadDeMateria, "numero" | "nombre">[]): string {
  const partes = unidades.map((u) => (u.numero !== null ? String(u.numero) : u.nombre));
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
}
