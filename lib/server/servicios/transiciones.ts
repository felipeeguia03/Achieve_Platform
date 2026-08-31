import { assertTransition } from "@/lib/domain/state-machines";
import type { PublicadorDeEventos } from "./eventos";

/**
 * El núcleo compartido de toda transición de estado del Track B.
 *
 * `Action` y `Commitment` hacen exactamente lo mismo —leer con scoping,
 * validar contra la máquina del dominio, escribir con compare-and-swap y
 * publicar el hecho— y sólo se diferencian en la tabla de transiciones y en qué
 * columnas extra tocan. Dos copias de esta secuencia divergirían en el orden,
 * que es justamente donde están los errores: publicar antes de escribir, o
 * escribir sin comparar.
 */
export interface EntidadConEstado<S extends string> {
  id: string;
  institutionId: string;
  state: S;
}

export interface RepositorioTransicionable<S extends string, E extends EntidadConEstado<S>> {
  porId(institutionId: string, id: string): Promise<E | null>;
  cambiarEstadoSi(
    institutionId: string,
    id: string,
    esperado: S,
    nuevo: S,
    columnas?: Readonly<Record<string, unknown>>,
  ): Promise<E | null>;
}

export type ResultadoDeTransicion<S extends string, E> =
  | { estado: "OK"; entidad: E }
  /** No existe, o existe en otra institución. Desde afuera es lo mismo. */
  | { estado: "NO_ENCONTRADO" }
  | { estado: "TRANSICION_PROHIBIDA"; desde: S; hacia: S }
  /**
   * Era válida cuando se leyó y otra request llegó primero. **No es lo mismo
   * que prohibida:** de un conflicto se reintenta; de lo prohibido no.
   */
  | { estado: "CONFLICTO" };

export interface ConfiguracionDeTransicion<S extends string> {
  /** Nombre del dominio, para el error y para el evento. */
  entidad: string;
  transiciones: Readonly<Record<S, readonly S[]>>;
  /** Columnas extra a escribir junto con el estado nuevo. */
  columnasPara?: (hacia: S, ahora: Date) => Readonly<Record<string, unknown>>;
  /** Nombre semántico del evento. `CommitmentDue`, no `commitment_update`. */
  nombreDeEvento: (hacia: S) => string;
  sujetoTipo: string;
}

export async function transicionarEntidad<S extends string, E extends EntidadConEstado<S>>(
  deps: { repo: RepositorioTransicionable<S, E>; eventos: PublicadorDeEventos },
  config: ConfiguracionDeTransicion<S>,
  institutionId: string,
  id: string,
  hacia: S,
  actorId: string | null = null,
  ahora: () => Date = () => new Date(),
): Promise<ResultadoDeTransicion<S, E>> {
  const actual = await deps.repo.porId(institutionId, id);
  if (!actual) return { estado: "NO_ENCONTRADO" };

  // Falla antes de tocar la base: una transición prohibida no merece un viaje.
  try {
    assertTransition(config.entidad, config.transiciones, actual.state, hacia);
  } catch {
    return { estado: "TRANSICION_PROHIBIDA", desde: actual.state, hacia };
  }

  const columnas = config.columnasPara?.(hacia, ahora()) ?? {};
  const guardado = await deps.repo.cambiarEstadoSi(
    institutionId,
    id,
    actual.state,
    hacia,
    columnas,
  );

  // Cero filas: entre la lectura y la escritura alguien más lo movió.
  if (!guardado) return { estado: "CONFLICTO" };

  // Después de que la escritura ganó, nunca antes: un evento de algo que perdió
  // la carrera sería un hecho que no ocurrió.
  await deps.eventos.publicar({
    nombre: config.nombreDeEvento(hacia),
    institutionId,
    actorId,
    sujetoTipo: config.sujetoTipo,
    sujetoId: guardado.id,
    causa: `${actual.state}->${hacia}`,
  });

  return { estado: "OK", entidad: guardado };
}
