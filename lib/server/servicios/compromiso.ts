import { commitmentTransitions } from "@/lib/domain/state-machines";
import type { CommitmentState } from "@/lib/domain/types";
import type { PublicadorDeEventos } from "./eventos";
import {
  transicionarEntidad,
  type EntidadConEstado,
  type RepositorioTransicionable,
  type ResultadoDeTransicion,
} from "./transiciones";

/**
 * Service de `Commitment`.
 *
 * **La máquina de estados no se reescribe acá.** Es la misma
 * `commitmentTransitions` de `lib/domain/`, pura, que el Track A usa para
 * proyectar. Dos tablas de transiciones serían dos verdades sobre el mismo
 * dominio, y divergirían: el propio módulo lo anticipa —*"el Track B la ejecuta
 * en Service"*—.
 *
 * La secuencia —leer con scoping, validar, compare-and-swap, publicar— vive en
 * `transiciones.ts` y la comparte con `Action`.
 */
export interface Compromiso extends EntidadConEstado<CommitmentState> {
  actionId: string;
}

export type RepositorioDeCompromisos = RepositorioTransicionable<CommitmentState, Compromiso>;
export type { ResultadoDeTransicion };

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
) {
  return transicionarEntidad(
    deps,
    {
      entidad: "Commitment",
      transiciones: commitmentTransitions,
      sujetoTipo: "commitment",
      nombreDeEvento: (h) => `Commitment${h.charAt(0)}${h.slice(1).toLowerCase()}`,
      columnasPara: (h, cuando) => {
        const col = MARCA_DE_TIEMPO[h];
        return col ? { [col]: cuando.toISOString() } : {};
      },
    },
    institutionId,
    id,
    hacia,
    actorId,
    ahora,
  );
}
