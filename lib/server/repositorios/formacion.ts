import "server-only";

import type { SourceType, VerificationStatus } from "@/lib/domain/types";
import { clienteDeServicio } from "../supabase";

/**
 * La lectura de la biblioteca de Formación —
 * [ADR-087](../../../docs/decisions.md#adr-087).
 *
 * ⚠️ **El filtro de publicación NO está acá.** Vive en
 * `biblioteca_de_formacion()`, en la base: un repositorio que se olvide de
 * filtrar no puede exponer lo que la función nunca le mandó. `D5` es demasiado
 * importante para depender de que cada capa se acuerde.
 */
export interface PiezaPersistida {
  id: string;
  codigo: string;
  titulo: string;
  problema: string;
  objetivo: string;
  explicacion: string;
  accionPosterior: string;
  evidenciaEsperada: string;
  material: string | null;
  // Tipados con el vocabulario del ADL: `provenanceVisible()` no acepta
  // cualquier string, y ensancharlo acá dejaría entrar un valor que la base
  // rechaza pero el tipo permite.
  fuente: SourceType;
  verificacion: VerificationStatus;
}

/**
 * ⚠️ **No trae cursadas, y no es un olvido** — ADR-087 Enmienda 2 `E2.3`.
 *
 * V1 es de **solo lectura**: la biblioteca se lee igual con cursadas o sin
 * ellas. Qué cursadas son elegibles para aplicar una pieza pertenece a la
 * vertical de aplicación (V2), y se evalúa **al aplicar**, nunca para permitir
 * la lectura.
 */
export interface BibliotecaPersistida {
  piezas: PiezaPersistida[];
}

export interface RepositorioDeFormacion {
  biblioteca(institutionId: string, studentId: string): Promise<BibliotecaPersistida | null>;
}

export const formacionReal: RepositorioDeFormacion = {
  async biblioteca(institutionId, studentId) {
    const { data, error } = await clienteDeServicio().rpc("biblioteca_de_formacion", {
      p_institution_id: institutionId,
      p_student_id: studentId,
    });
    if (error) throw new Error(`No se pudo leer la biblioteca: ${error.message}`);
    return (data ?? null) as BibliotecaPersistida | null;
  },
};
