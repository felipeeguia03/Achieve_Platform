import { actionTransitions } from "@/lib/domain/state-machines";
import type { ActionStatus } from "@/lib/domain/types";
import type { PublicadorDeEventos } from "./eventos";
import {
  transicionarEntidad,
  type EntidadConEstado,
  type RepositorioTransicionable,
  type ResultadoDeTransicion,
} from "./transiciones";

/**
 * Service de `Action` — Etapa B2.1.
 *
 * **Aceptar una Action NO crea un Commitment** (`AGENTS.md` §2.1). Este Service
 * mueve la Action a `ACCEPTED` y **nada más**: el Commitment lo crea su propio
 * Service cuando el estudiante confirma en `UX04`. Que las dos cosas parezcan
 * el mismo gesto en la pantalla no las convierte en la misma operación.
 */
export interface Accion extends EntidadConEstado<ActionStatus> {
  courseEnrollmentId: string;
}

export type RepositorioDeAcciones = RepositorioTransicionable<ActionStatus, Accion>;

/** `BLOCKED` sin razón es un estado que no explica nada (`P-01`). */
const CONFIG = {
  entidad: "Action",
  transiciones: actionTransitions,
  sujetoTipo: "action",
  nombreDeEvento: (hacia: ActionStatus) =>
    `Action${hacia.charAt(0)}${hacia.slice(1).toLowerCase().replace(/_(.)/g, (_, c) => c.toUpperCase())}`,
} as const;

export async function transicionar(
  deps: { repo: RepositorioDeAcciones; eventos: PublicadorDeEventos },
  institutionId: string,
  id: string,
  hacia: ActionStatus,
  extra: { razonDeBloqueo?: string; reemplazadaPorId?: string } = {},
  actorId: string | null = null,
): Promise<ResultadoDeTransicion<ActionStatus, Accion> | { estado: "FALTA_RAZON" }> {
  // `BLOCKED` sin razón deja al estudiante con un estado y sin explicación, que
  // es exactamente lo que `P-01` prohíbe. Se rechaza antes de tocar la base.
  if (hacia === "BLOCKED" && !extra.razonDeBloqueo) return { estado: "FALTA_RAZON" };

  return transicionarEntidad(
    deps,
    {
      ...CONFIG,
      columnasPara: (h) => ({
        ...(h === "BLOCKED" ? { blocked_reason: extra.razonDeBloqueo } : {}),
        ...(h === "REPLACED" ? { replaced_by_id: extra.reemplazadaPorId ?? null } : {}),
        // Salir de BLOCKED limpia la razón: conservarla haría que la pantalla
        // mostrara un bloqueo que ya no existe.
        ...(h !== "BLOCKED" ? { blocked_reason: null } : {}),
      }),
    },
    institutionId,
    id,
    hacia,
    actorId,
  );
}

/**
 * **La UI no genera Actions y este Service tampoco decide cuál.** El Engine
 * produce la recomendación; acá sólo se registra el hecho de que el estudiante
 * la aceptó. `AGENTS.md` §2: *"la UI proyecta, nunca decide"* — y el backend
 * de ejecución tampoco.
 */
export async function aceptar(
  deps: { repo: RepositorioDeAcciones; eventos: PublicadorDeEventos },
  institutionId: string,
  id: string,
  actorId: string | null = null,
) {
  return transicionar(deps, institutionId, id, "ACCEPTED", {}, actorId);
}
