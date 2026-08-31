import { assertTransition, commitmentTransitions } from "@/lib/domain/state-machines";
import type { CommitmentState } from "@/lib/domain/types";
import type { PublicadorDeEventos } from "./eventos";

/**
 * Service de `Commitment`. Acá viven las reglas, la máquina de estados, el
 * scoping institucional y la idempotencia
 * ([`architecture.md`](../../../docs/architecture.md) §3.2).
 *
 * **La máquina de estados no se reescribe acá.** Es la misma
 * `commitmentTransitions` de `lib/domain/`, pura, que el Track A ya usa para
 * proyectar. Una segunda tabla de transiciones en el backend serían dos
 * verdades sobre el mismo dominio, y divergirían: el propio módulo lo anticipa
 * —*"el Track B la ejecuta en Service"*—.
 *
 * **Sin `server-only` y sin importar el Repository concreto.** §3.2 dice que
 * cada capa conoce a la de abajo *"mediante inyección de dependencias"*, y §3.7
 * pide unit tests del Service *"con Repositories falsos, sin HTTP ni base
 * real"*. Las dos cosas piden lo mismo: que el dominio no sepa de Supabase.
 */
export interface Compromiso {
  id: string;
  institutionId: string;
  actionId: string;
  state: CommitmentState;
}

/** Lo único que este Service necesita de la persistencia. */
export interface RepositorioDeCompromisos {
  porId(institutionId: string, id: string): Promise<Compromiso | null>;
  cambiarEstadoSi(
    institutionId: string,
    id: string,
    esperado: CommitmentState,
    nuevo: CommitmentState,
    marcas?: Readonly<Record<string, string>>,
  ): Promise<Compromiso | null>;
}

export type ResultadoDeTransicion =
  | { estado: "OK"; compromiso: Compromiso }
  /** No existe, o existe en otra institución. Desde afuera es lo mismo. */
  | { estado: "NO_ENCONTRADO" }
  /** La transición no está declarada en la máquina. */
  | { estado: "TRANSICION_PROHIBIDA"; desde: CommitmentState; hacia: CommitmentState }
  /**
   * Era válida cuando se leyó y otra request llegó primero. **No es lo mismo
   * que prohibida:** acá el cliente puede releer y reintentar.
   */
  | { estado: "CONFLICTO" };

const MARCA_DE_TIEMPO: Partial<Record<CommitmentState, string>> = {
  STARTED: "started_at",
  COMPLETED: "completed_at",
  MISSED: "missed_at",
};

/**
 * Mueve un compromiso de estado.
 *
 * `institutionId` **no viene del cliente**: lo resuelve la sesión desde la
 * base. Aceptarlo del request sería regalar el aislamiento de Parte I §29.
 */
export async function transicionar(
  deps: { repo: RepositorioDeCompromisos; eventos: PublicadorDeEventos },
  institutionId: string,
  id: string,
  hacia: CommitmentState,
  actorId: string | null = null,
  ahora: () => Date = () => new Date(),
): Promise<ResultadoDeTransicion> {
  const { repo, eventos } = deps;
  const actual = await repo.porId(institutionId, id);
  if (!actual) return { estado: "NO_ENCONTRADO" };

  // Falla antes de tocar la base: una transición prohibida no merece un viaje.
  try {
    assertTransition("Commitment", commitmentTransitions, actual.state, hacia);
  } catch {
    return { estado: "TRANSICION_PROHIBIDA", desde: actual.state, hacia };
  }

  const columna = MARCA_DE_TIEMPO[hacia];
  const marcas = columna ? { [columna]: ahora().toISOString() } : {};

  const guardado = await repo.cambiarEstadoSi(institutionId, id, actual.state, hacia, marcas);

  // Cero filas: entre la lectura y la escritura alguien más lo movió. El estado
  // que validamos ya no es el estado que hay.
  if (!guardado) return { estado: "CONFLICTO" };

  // El evento se publica **después** de que la escritura ganó, no antes: un
  // evento de algo que perdió la carrera sería un hecho que no ocurrió.
  //
  // El nombre es semántico —`CommitmentConfirmed`, no `commitment_update`—
  // porque `product_event` es el registro de lo que pasó en el producto, no un
  // diario de escrituras.
  await eventos.publicar({
    nombre: `Commitment${hacia.charAt(0)}${hacia.slice(1).toLowerCase()}`,
    institutionId,
    actorId,
    sujetoTipo: "commitment",
    sujetoId: guardado.id,
    causa: `${actual.state}->${hacia}`,
  });

  return { estado: "OK", compromiso: guardado };
}
