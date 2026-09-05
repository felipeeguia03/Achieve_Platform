import "server-only";

import { clienteDeServicio } from "../supabase";
import type { ConteoDelReinicio, InstitucionDePrueba } from "../servicios/prueba";

/**
 * ⚠️⚠️ **MODO PRUEBA. No es una capacidad del producto.**
 *
 * Las dos funciones de base viven en
 * `supabase/migrations/20260916000000_reinicio_de_alta_de_prueba.sql`, con el
 * detalle de qué se borra y qué no. Acá sólo se las llama.
 *
 * **El gate no está en este archivo, y no debe estarlo.** Vive en
 * `app/api/prueba/alta/route.ts`, que responde `404` sin `MODO_PRUEBA=1` — el
 * mismo patrón que `GET /api/escalamiento` (B6.6.3). Un repositorio que se
 * autocensura por variable de entorno esconde el cerrojo donde nadie lo busca.
 */

/** Distingue el rechazo declarado del error de base. Lo traduce el Service. */
export class RechazoDePrueba extends Error {
  constructor(readonly motivo: "OTRA_INSTITUCION" | "INSTITUCION_SIN_PLAN") {
    super(motivo);
  }
}

export const pruebaReal = {
  async instituciones(): Promise<InstitucionDePrueba[]> {
    const { data, error } = await clienteDeServicio().rpc("instituciones_de_prueba");
    if (error) throw new Error(`No se pudieron leer las instituciones: ${error.message}`);
    return (data ?? []) as InstitucionDePrueba[];
  },

  async reiniciarAlta(
    institutionId: string,
    studentId: string,
    nuevaInstitucion: string | null,
  ): Promise<ConteoDelReinicio> {
    const { data, error } = await clienteDeServicio().rpc("reiniciar_alta_de_prueba", {
      p_institution_id: institutionId,
      p_student_id: studentId,
      p_nueva_institucion: nuevaInstitucion,
    });

    if (error) {
      // Los dos `RAISE` de la función son rechazos con nombre, no fallas. Se
      // reconocen por su texto porque `postgres-js` no expone el `ERRCODE` de un
      // `check_violation` levantado a mano de otra forma; el texto lo fija la
      // migración y hay test.
      if (/no tiene ningún plan publicado/.test(error.message)) {
        throw new RechazoDePrueba("INSTITUCION_SIN_PLAN");
      }
      if (/no pertenece a la institución/.test(error.message)) {
        throw new RechazoDePrueba("OTRA_INSTITUCION");
      }
      throw new Error(`No se pudo reiniciar el alta: ${error.message}`);
    }

    const [fila] = (data ?? []) as {
      cursadas: number;
      declaraciones: number;
      consentimientos: number;
      inscripciones: number;
      institucion: string;
    }[];
    return {
      cursadas: fila.cursadas,
      declaraciones: fila.declaraciones,
      consentimientos: fila.consentimientos,
      inscripciones: fila.inscripciones,
      institucionId: fila.institucion,
    };
  },
};
