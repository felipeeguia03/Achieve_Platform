import type { PublicadorDeEventos } from "./eventos";
import { transicionar, type RepositorioDeEvidencias } from "./evidencia";
import type { ResultadoDeProgresoEntrante, ResultadoDelRegistro } from "./progreso";

/**
 * La validación declarativa — D4·A y D5·A del paquete de decisión.
 *
 * ## Qué orquesta, y por qué acá
 *
 * Dos cosas, en este orden y **las dos explícitas**:
 *
 * 1. `SUBMITTED → SUFFICIENT → VALIDATED` sobre la `Evidence`.
 * 2. `registrarProgreso`, **invocado**, no inferido.
 *
 * El invariante que esto no rompe es el más caro del repositorio: **`VALIDATED`
 * no produce `ProgressUpdated`**. Nadie deriva progreso del estado de la
 * evidencia; hay un orquestador que decide registrarlo y lo dice. Por eso vive
 * en su propio Service y no dentro del de `Evidence`: si una ruta de `Evidence`
 * escribiera progreso, el guard estático rompería, y con razón.
 *
 * ## Quién puede llamarla
 *
 * **Nunca el estudiante.** Va con secreto de servicio: alguien validando su
 * propia evidencia no es una validación. `C01-013` sigue `OPEN` para el resto
 * —quién revisa de verdad, con qué criterio—; esto es el mínimo declarativo que
 * el MVP necesita para cerrar el circuito, y queda rotulado como tal en
 * `validation_method`.
 *
 * ## Idempotencia
 *
 * No hay transacción entre las dos: son entidades distintas y el schema no
 * ofrece una. Lo que hay es **reentrada completa** — cada paso comprueba su
 * estado antes de actuar, y el progreso lleva su propia clave derivada de la
 * evidencia (`I8`). Correrla dos veces deja el mismo mundo que correrla una.
 */

export interface ValidacionEntrante {
  institutionId: string;
  evidenciaId: string;
  /** Quién la valida. Identidad externa, sin FK: `C01-030` sigue abierto. */
  validadaPor: string;
  /** Lo que el validador declara que cambió. Vacío ⇒ hay que declarar no-cambio. */
  cambios?: readonly { dimension: string; valor?: number; texto?: string }[];
  noCambioExplicito?: boolean;
  razonDeNoCambio?: string | null;
}

export type ResultadoDeValidacion =
  | { estado: "OK"; evidenciaId: string; progreso: ResultadoDelRegistro; yaEstaba: boolean }
  | { estado: "NO_ENCONTRADA" }
  /** No está en un estado desde el que se pueda validar. */
  | { estado: "NO_VALIDABLE"; desde: string }
  | { estado: "PROGRESO_RECHAZADO"; detalle: ResultadoDelRegistro };

export interface DependenciasDeValidacion {
  evidencias: RepositorioDeEvidencias;
  eventos: PublicadorDeEventos;
  contextoDeEvidencia(
    institutionId: string,
    id: string,
  ): Promise<{ actionId: string; courseEnrollmentId: string; topicId: string | null } | null>;
  registrarProgreso(entrada: ResultadoDeProgresoEntrante): Promise<ResultadoDelRegistro>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function esUuid(v: string): boolean {
  return UUID.test(v);
}

/**
 * El actor de un `product_event` es `uuid`, y quien valida hoy es una identidad
 * externa sin FK. Cuando no es un UUID el actor correcto es **`null`** —lo
 * produjo un proceso, no una persona autenticada— y el validador declarado
 * viaja en el payload, que sí admite texto. Inventarle un UUID para llenar la
 * columna sería fabricar la identidad que `C01-030` no definió.
 */
function actorDe(validadaPor: string): string | null {
  return esUuid(validadaPor) ? validadaPor : null;
}

/** Los estados desde los que todavía queda algo que hacer. */
const PENDIENTES = new Set(["SUBMITTED", "SUFFICIENT"]);

export async function validarEvidencia(
  deps: DependenciasDeValidacion,
  entrada: ValidacionEntrante,
): Promise<ResultadoDeValidacion> {
  const { institutionId, evidenciaId } = entrada;

  const actual = await deps.evidencias.porId(institutionId, evidenciaId);
  if (!actual) return { estado: "NO_ENCONTRADA" };

  const yaEstaba = actual.state === "VALIDATED";
  if (!yaEstaba && !PENDIENTES.has(actual.state)) {
    return { estado: "NO_VALIDABLE", desde: actual.state };
  }

  // Paso 1 · el lifecycle, un escalón por vez. `SUFFICIENT` no es `VALIDATED`:
  // saltarlo colapsaría dos hechos distintos en uno.
  if (actual.state === "SUBMITTED") {
    await deps.evidencias.cambiarEstadoSi(institutionId, evidenciaId, "SUBMITTED", "SUFFICIENT", {
      validation_method: "declarativa",
      // `reviewer_id` es `uuid` y **sólo se escribe si el llamador mandó uno**.
      // Fabricar un identificador para llenar la columna sería inventar la
      // identidad de quien valida, que es justo lo que `C01-030` no definió
      // todavía. Sin UUID la columna queda `NULL` y el actor vive en el evento
      // y en la auditoría, que sí aceptan identidad externa.
      ...(esUuid(entrada.validadaPor) ? { reviewer_id: entrada.validadaPor } : {}),
    });
    await deps.eventos.publicar({
      nombre: "EvidenceSufficient",
      institutionId,
      actorId: actorDe(entrada.validadaPor),
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
      actorDe(entrada.validadaPor),
    );
  }

  // Paso 2 · el progreso, **invocado explícitamente**. Su clave lo hace
  // reentrante: un segundo intento devuelve la misma entrada, no una nueva.
  const contexto = await deps.contextoDeEvidencia(institutionId, evidenciaId);
  if (!contexto) return { estado: "NO_ENCONTRADA" };

  const progreso = await deps.registrarProgreso({
    institutionId,
    courseEnrollmentId: contexto.courseEnrollmentId,
    topicId: contexto.topicId,
    actionId: contexto.actionId,
    evidenceId: evidenciaId,
    // El validador la señala como causa. No la infiere el Service.
    causalEvidenceId: evidenciaId,
    tipo: "validacion_declarativa",
    cambios: (entrada.cambios ?? []) as ResultadoDeProgresoEntrante["cambios"],
    noCambioExplicito: entrada.noCambioExplicito,
    razonDeNoCambio: entrada.razonDeNoCambio ?? null,
    idempotencyKey: `validacion:${evidenciaId}`,
    actorId: actorDe(entrada.validadaPor),
  });

  if (progreso.estado !== "OK") return { estado: "PROGRESO_RECHAZADO", detalle: progreso };

  return { estado: "OK", evidenciaId, progreso, yaEstaba };
}
