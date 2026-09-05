import { RUTA_DEL_PASO, siguientePaso } from "@/lib/domain/alta";

/**
 * Service del **modo prueba** — reiniciar el alta de un estudiante sintético.
 *
 * ⚠️⚠️ **No es una capacidad del producto, y no se convierte en una.** Existe
 * para que el tramo de alta se pueda recorrer muchas veces seguidas —cómo toma
 * las materias, cómo se comporta con otro catálogo— sin bajar a la terminal a
 * correr `npm run db:demo`, que vuelve a sembrar el mundo entero.
 *
 * **Los tres cerrojos, y ninguno sobra:**
 *
 * 1. **Apagado por defecto.** Sin `MODO_PRUEBA=1` la ruta responde `404`, no
 *    `403`: un `403` confirmaría que existe. Un despliegue que no declara la
 *    variable **no la tiene**. Es el patrón de `GET /api/escalamiento`.
 * 2. **Con el JWT del estudiante, y sólo sobre sí mismo.** No lleva secreto de
 *    servicio a propósito: un secreto podría reiniciar a cualquiera, y esta
 *    operación **no tiene por qué poder tocar a otro**. El `studentId` sale de
 *    la sesión y nunca del cuerpo.
 * 3. **`ADR-006` sigue cerrado.** Mientras lo esté no existe ningún estudiante
 *    que no sea sintético, así que no hay dato de una persona que se pueda
 *    borrar con esto. **El día que exista, esto se apaga antes.**
 *
 * ## Lo que no hace, y no es un olvido
 *
 * **No emite ningún `product_event`.** Reiniciar no es un hecho del dominio: es
 * deshacer una corrida de prueba. Declararlo en `lib/domain/product-events.ts`
 * metería una herramienta de laboratorio en el modelo de eventos del producto, y
 * ese catálogo tiene guard en las dos direcciones por algo.
 *
 * **Y no borra los eventos anteriores** — `product_event` y `audit_log` son
 * append-only (`I12`). Lo que ocurrió, ocurrió. La consecuencia está declarada
 * en la migración: la próxima confirmación emite **otro**
 * `AcademicMapMinimumReached`, así que en una base con reinicios el conteo de
 * activaciones no mide nada.
 */

export interface InstitucionDePrueba {
  institucionId: string;
  nombre: string;
  /** Cuántas carreras ofrece. Sirve para elegir con qué catálogo probar. */
  carreras: number;
}

export interface ConteoDelReinicio {
  cursadas: number;
  declaraciones: number;
  consentimientos: number;
  inscripciones: number;
  /** Dónde quedó el estudiante: la misma institución, o la nueva. */
  institucionId: string;
}

export interface RepositorioDePrueba {
  instituciones(): Promise<InstitucionDePrueba[]>;
  reiniciarAlta(
    institutionId: string,
    studentId: string,
    nuevaInstitucion: string | null,
  ): Promise<ConteoDelReinicio>;
}

/** El rechazo que la base declara. Lo levanta el repositorio con este `motivo`. */
export type MotivoDeRechazo = "OTRA_INSTITUCION" | "INSTITUCION_SIN_PLAN";

export type ResultadoDelReinicio =
  | {
      estado: "OK";
      borrado: ConteoDelReinicio;
      /**
       * A dónde va el estudiante ahora. **Se deriva del dominio**, no se escribe
       * a mano: si mañana [ADR-042](../../../docs/decisions.md#adr-042) reordena
       * los pasos del alta, esto sigue apuntando al primero.
       */
      siguiente: string;
    }
  | { estado: MotivoDeRechazo };

/**
 * Deja al estudiante como antes de empezar el alta.
 *
 * `nuevaInstitucion` **simula el padrón**; no le devuelve al estudiante una
 * elección que [ADR-052](../../../docs/decisions.md#adr-052) le sacó. El alta
 * sigue ofreciendo **sólo** la institución del padrón, y esta función no la
 * toca: mueve la ficha, que es lo que haría un backoffice.
 */
export async function reiniciarAlta(
  repo: RepositorioDePrueba,
  institutionId: string,
  studentId: string,
  nuevaInstitucion: string | null,
  esRechazo: (e: unknown) => MotivoDeRechazo | null,
): Promise<ResultadoDelReinicio> {
  let borrado: ConteoDelReinicio;
  try {
    borrado = await repo.reiniciarAlta(institutionId, studentId, nuevaInstitucion);
  } catch (e) {
    const motivo = esRechazo(e);
    // Un rechazo declarado se contesta; cualquier otra cosa sube y sale `500`.
    // Colapsarlos diría "no se pudo" sobre algo que la base explicó.
    if (motivo) return { estado: motivo };
    throw e;
  }

  // Después de reiniciar, los tres pasos están sin contestar: el primero es el
  // primero. Se calcula igual en vez de asumirlo, por la razón de arriba.
  const paso = siguientePaso({
    consentimientoRespondido: false,
    carreraDeclarada: false,
    materiasConfirmadas: false,
  });
  if (paso === null) {
    // Inalcanzable por construcción, y por eso se dice en vez de devolver una
    // ruta inventada: significaría que el alta ya no tiene pasos.
    throw new Error("El alta no declara un primer paso");
  }

  return { estado: "OK", borrado, siguiente: RUTA_DEL_PASO[paso] };
}
