import "server-only";

import type { EstadoDeActivacion, RepositorioDeActivacion } from "../servicios/proyeccion-activacion";
import type {
  EstadoDePreparacion,
  RepositorioDePreparacionLectura,
} from "../servicios/proyeccion-preparacion";
import type { EstadoDePaso, RepositorioDePasoLectura } from "../servicios/proyeccion-paso";
import { clienteDeServicio } from "../supabase";

/**
 * Lectura de `UX07`, `UX08` y `UX09` — una llamada por superficie.
 *
 * Las tres funciones viven en el mismo archivo porque comparten la misma tabla
 * raíz, pero **no comparten consulta**: cada superficie mira un recorte
 * distinto, y una función que sirviera a las tres devolvería a `UX07` cosas que
 * `UX07` no puede mostrar.
 */
export const activacionLecturaReal: RepositorioDeActivacion = {
  async estadoDeActivacion(institutionId, studentId, ahora, courseEnrollmentId = null) {
    const { data, error } = await clienteDeServicio().rpc("estado_de_activacion", {
      p_institution_id: institutionId,
      p_student_id: studentId,
      p_ahora: ahora,
      p_course_enrollment_id: courseEnrollmentId,
    });
    if (error) throw new Error(`No se pudo leer la activación: ${error.message}`);
    return (data as EstadoDeActivacion | null) ?? null;
  },
};

export const preparacionLecturaReal: RepositorioDePreparacionLectura = {
  async estadoDePreparacion(institutionId, studentId, ahora, preparacionId = null) {
    const { data, error } = await clienteDeServicio().rpc("estado_de_preparacion", {
      p_institution_id: institutionId,
      p_student_id: studentId,
      p_ahora: ahora,
      p_exam_preparation_id: preparacionId,
    });
    if (error) throw new Error(`No se pudo leer la preparación: ${error.message}`);
    return (data as EstadoDePreparacion | null) ?? null;
  },
};

export const pasoLecturaReal: RepositorioDePasoLectura = {
  async estadoDePaso(institutionId, studentId, ahora, preparacionId, pasoId) {
    const { data, error } = await clienteDeServicio().rpc("estado_de_paso", {
      p_institution_id: institutionId,
      p_student_id: studentId,
      p_ahora: ahora,
      p_exam_preparation_id: preparacionId,
      p_protocol_step_id: pasoId,
    });
    if (error) throw new Error(`No se pudo leer el paso: ${error.message}`);
    return (data as EstadoDePaso | null) ?? null;
  },
};
