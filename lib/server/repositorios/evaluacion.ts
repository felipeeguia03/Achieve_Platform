import "server-only";

import type { EvaluacionDeclarada } from "../servicios/evaluacion";
import { clienteDeServicio } from "../supabase";

/**
 * El alta de evaluación, contra Postgres — [ADR-067](../../../docs/decisions.md#adr-067).
 *
 * Pasa por `declarar_evaluacion()` y no por un `INSERT` directo por una razón
 * concreta: **la comprobación de que la cursada es del estudiante y el `INSERT`
 * tienen que ser la misma operación**. Resueltos por separado hay una ventana
 * entre "verifiqué que es suya" y "escribí", y la función la cierra.
 *
 * **`verification_status` no viaja como parámetro**, igual que en
 * `ingerir_materia`: queda en su default `unverified` (`I9`). No es que no se
 * deba elevar — es que no hay por dónde.
 */
export const evaluacionesReal = {
  /**
   * Devuelve el id, o `null` si la cursada no es de este estudiante.
   *
   * La función no distingue *"no existe"* de *"no es tuya"*, y eso es a
   * propósito: contestar distinto le diría a quien prueba ids ajenos cuáles
   * existen.
   */
  async declarar(
    institutionId: string,
    estudianteId: string,
    e: EvaluacionDeclarada,
  ): Promise<string | null> {
    const { data, error } = await clienteDeServicio().rpc("declarar_evaluacion", {
      p_institution_id: institutionId,
      p_student_id: estudianteId,
      p_course_enrollment_id: e.cursadaId,
      p_tipo: e.tipo,
      p_titulo: e.titulo.trim(),
      // **Ausente no es cero ni es hoy.** `NULL` dice que no la declaró, que es
      // lo que pasó; poner `CURRENT_DATE` sería estimar una fecha.
      p_fecha: e.fecha ?? null,
      p_hora: e.hora ?? null,
      p_modalidad: e.modalidad ?? null,
      p_alcance: e.alcance?.trim() || null,
    });
    if (error) throw new Error(`No se pudo declarar la evaluación: ${error.message}`);

    return (data as string | null) ?? null;
  },
};
