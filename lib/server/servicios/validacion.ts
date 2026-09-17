import type { PublicadorDeEventos } from "./eventos";
import { transicionar, type RepositorioDeEvidencias } from "./evidencia";
import type { ResultadoDeProgresoEntrante, ResultadoDelRegistro } from "./progreso";
import type { CadenaCausal } from "../repositorios/evidencia";

/**
 * La validación declarativa — D4·A, D5·A y el cierre de `C01-009`.
 *
 * ## La causalidad, explícita
 *
 * ```
 * Evidence suficiente → validación registrada → progreso registrado → Action completada
 * ```
 *
 * Cada flecha es una operación que ocurre porque la anterior ocurrió, y ninguna
 * se infiere de un estado. En particular **`VALIDATED` no produce
 * `ProgressUpdated`**: lo produce este orquestador, que decidió registrarlo. Y
 * la `Action` no se completa porque exista una evidencia validada: se completa
 * porque esta operación la completa, después de que el progreso quedó escrito.
 *
 * ## Quién puede llamarla
 *
 * **Nunca el estudiante, y nunca la ruta de subida.** Va con secreto de
 * servicio: alguien validando su propia evidencia no es una validación.
 *
 * ## Qué pasa si la evidencia no alcanza
 *
 * `SUBMITTED → INSUFFICIENT`, y **la `Action` se queda en `COMMITTED`**. No hay
 * progreso ni cierre. La entrega anterior se conserva sin tocar: el estudiante
 * manda una nueva, que es otra fila (`I4`).
 *
 * ## Idempotencia
 *
 * No hay transacción entre las tres escrituras: son entidades distintas y el
 * schema no ofrece una. Lo que hay es **reentrada completa** — cada paso
 * comprueba su estado antes de actuar y el progreso lleva su clave derivada de
 * la evidencia (`I8`). Correrla dos veces deja el mismo mundo que correrla una:
 * ni un `ProgressUpdated` ni un `ActionCompleted` de más.
 */

export interface ValidacionEntrante {
  institutionId: string;
  evidenciaId: string;
  /** Quién la valida. Identidad externa, sin FK: `C01-030` sigue abierto. */
  validadaPor: string;
  /** `false` ⇒ la entrega no alcanza. La `Action` no se cierra. */
  suficiente?: boolean;
  cambios?: readonly { dimension: string; valor?: number; texto?: string }[];
  noCambioExplicito?: boolean;
  razonDeNoCambio?: string | null;
}

export type ResultadoDeValidacion =
  | {
      estado: "OK";
      evidenciaId: string;
      progreso: ResultadoDelRegistro;
      yaEstaba: boolean;
      accionCompletada: boolean;
      accionId: string;
    }
  /** La entrega no alcanzó. La `Action` sigue esperando otra. */
  | { estado: "INSUFICIENTE"; evidenciaId: string; accionId: string }
  | { estado: "NO_ENCONTRADA" }
  | { estado: "NO_VALIDABLE"; desde: string }
  /**
   * Evidencia, compromiso y acción no forman una cadena de un mismo estudiante.
   * **No se dice cuál de las tres falla**: quien prueba con una evidencia ajena
   * no debe poder deducir de quién es.
   */
  | { estado: "CADENA_INVALIDA" }
  | { estado: "PROGRESO_RECHAZADO"; detalle: ResultadoDelRegistro };

export interface DependenciasDeValidacion {
  evidencias: RepositorioDeEvidencias;
  eventos: PublicadorDeEventos;
  contextoDeEvidencia(institutionId: string, id: string): Promise<CadenaCausal | null>;
  registrarProgreso(entrada: ResultadoDeProgresoEntrante): Promise<ResultadoDelRegistro>;
  /**
   * Cierra el `Commitment` que causó el cumplimiento y después la `Action`,
   * recorriendo las dos máquinas. Idempotente.
   */
  completarAccion(
    institutionId: string,
    actionId: string,
    commitmentId: string,
    actorId: string | null,
  ): Promise<boolean>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * El actor de un `product_event` es `uuid`, y quien valida hoy es una identidad
 * externa sin FK. Cuando no es un UUID el actor correcto es **`null`** —lo
 * produjo un proceso, no una persona autenticada— y el validador declarado
 * viaja en el payload, que sí admite texto.
 */
function actorDe(validadaPor: string): string | null {
  return UUID.test(validadaPor) ? validadaPor : null;
}

/** Los estados desde los que todavía queda algo que hacer. */
const PENDIENTES = new Set(["SUBMITTED", "SUFFICIENT"]);

/**
 * Regla 2 del cierre: los tres objetos son del mismo estudiante y están
 * encadenados de verdad. Una evidencia sin compromiso, o adjunta al compromiso
 * de otra `Action`, no cierra nada.
 */
function cadenaValida(c: CadenaCausal): boolean {
  return (
    c.commitmentId !== null &&
    c.accionDelCompromiso === c.actionId &&
    c.estudianteDeLaAccion !== "" &&
    c.estudianteDeLaAccion === c.estudianteDelCompromiso
  );
}

export async function validarEvidencia(
  deps: DependenciasDeValidacion,
  entrada: ValidacionEntrante,
): Promise<ResultadoDeValidacion> {
  const { institutionId, evidenciaId } = entrada;
  const suficiente = entrada.suficiente ?? true;
  const actor = actorDe(entrada.validadaPor);

  const actual = await deps.evidencias.porId(institutionId, evidenciaId);
  if (!actual) return { estado: "NO_ENCONTRADA" };

  const cadena = await deps.contextoDeEvidencia(institutionId, evidenciaId);
  if (!cadena) return { estado: "NO_ENCONTRADA" };
  if (!cadenaValida(cadena)) return { estado: "CADENA_INVALIDA" };

  // ── La entrega no alcanza ──────────────────────────────────────────────────
  if (!suficiente) {
    if (actual.state === "INSUFFICIENT") {
      return { estado: "INSUFICIENTE", evidenciaId, accionId: cadena.actionId };
    }
    if (actual.state !== "SUBMITTED") return { estado: "NO_VALIDABLE", desde: actual.state };

    await deps.evidencias.cambiarEstadoSi(institutionId, evidenciaId, "SUBMITTED", "INSUFFICIENT", {
      validation_method: "declarativa",
      ...(actor ? { reviewer_id: actor } : {}),
    });
    await deps.eventos.publicar({
      nombre: "EvidenceInsufficient",
      institutionId,
      actorId: actor,
      sujetoTipo: "evidence",
      sujetoId: evidenciaId,
      causa: "SUBMITTED->INSUFFICIENT",
      payload: { metodo: "declarativa", validadaPor: entrada.validadaPor },
    });
    // Sin progreso y sin cierre: la `Action` sigue `COMMITTED` esperando otra
    // entrega, y la que no alcanzó queda intacta.
    return { estado: "INSUFICIENTE", evidenciaId, accionId: cadena.actionId };
  }

  // ── La entrega alcanza ─────────────────────────────────────────────────────
  const yaEstaba = actual.state === "VALIDATED";
  if (!yaEstaba && !PENDIENTES.has(actual.state)) {
    return { estado: "NO_VALIDABLE", desde: actual.state };
  }

  // Paso 1 · el lifecycle, un escalón por vez. `SUFFICIENT` no es `VALIDATED`:
  // saltarlo colapsaría dos hechos distintos en uno.
  if (actual.state === "SUBMITTED") {
    await deps.evidencias.cambiarEstadoSi(institutionId, evidenciaId, "SUBMITTED", "SUFFICIENT", {
      validation_method: "declarativa",
      // `reviewer_id` es `uuid` y sólo se escribe si el llamador mandó uno.
      // Fabricar un identificador para llenar la columna sería inventar la
      // identidad de quien valida, que es lo que `C01-030` no definió.
      ...(actor ? { reviewer_id: actor } : {}),
    });
    await deps.eventos.publicar({
      nombre: "EvidenceSufficient",
      institutionId,
      actorId: actor,
      sujetoTipo: "evidence",
      sujetoId: evidenciaId,
      causa: "SUBMITTED->SUFFICIENT",
      payload: { metodo: "declarativa", validadaPor: entrada.validadaPor },
    });
  }

  if (!yaEstaba) {
    await transicionar(
      { repo: deps.evidencias, eventos: deps.eventos },
      institutionId,
      evidenciaId,
      "VALIDATED",
      {},
      actor,
    );
  }

  // Paso 2 · el progreso, **invocado explícitamente**. Su clave lo hace
  // reentrante: un segundo intento devuelve la misma entrada, no una nueva.
  const progreso = await deps.registrarProgreso({
    institutionId,
    courseEnrollmentId: cadena.courseEnrollmentId,
    topicId: cadena.topicId,
    actionId: cadena.actionId,
    evidenceId: evidenciaId,
    // El validador la señala como causa. No la infiere el Service.
    causalEvidenceId: evidenciaId,
    tipo: "validacion_declarativa",
    cambios: (entrada.cambios ?? []) as ResultadoDeProgresoEntrante["cambios"],
    noCambioExplicito: entrada.noCambioExplicito,
    razonDeNoCambio: entrada.razonDeNoCambio ?? null,
    idempotencyKey: `validacion:${evidenciaId}`,
    actorId: actor,
  });

  if (progreso.estado !== "OK") return { estado: "PROGRESO_RECHAZADO", detalle: progreso };

  /*
    Paso 3 · el cierre de la `Action`, **después** de que el progreso quedó
    escrito. Ese orden es la regla 4: cumplir la acción y haber avanzado
    académicamente son hechos distintos, y por eso un progreso con
    `explicit_no_change = TRUE` cierra igual. Lo que no puede pasar es cerrar
    sin haber registrado ninguna de las dos cosas.
  */
  const accionCompletada = await deps.completarAccion(
    institutionId,
    cadena.actionId,
    // `cadenaValida` ya garantizó que no es `null`.
    cadena.commitmentId as string,
    actor,
  );

  return {
    estado: "OK",
    evidenciaId,
    progreso,
    yaEstaba,
    accionCompletada,
    accionId: cadena.actionId,
  };
}
