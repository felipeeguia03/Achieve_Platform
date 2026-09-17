import "server-only";

import { clienteDeServicio } from "../supabase";

/**
 * La institución, y de ella una sola cosa por ahora: su zona horaria
 * — [ADR-049](../../../docs/decisions.md#adr-049).
 *
 * ⚠️ **No es la del estudiante.** `student.timezone` dice a qué hora ve el
 * estudiante su propio día y es la que proyectan todas las superficies;
 * `commitment.timezone_at_commit` es la congelada en el acuerdo. Ésta define el
 * *"día calendario"* de las reglas de negocio que nombran a la institución:
 * la elegibilidad de renegociación (ADR-046 §5) y la ventana de 14 días del
 * Modo Examen (ADR-048). Confundirlas no rompe nada visible: cambia el
 * veredicto de dos reglas para quien esté en otro huso.
 */
async function zonaHoraria(institutionId: string): Promise<string | null> {
  const { data, error } = await clienteDeServicio()
    .from("institution")
    .select("timezone")
    .eq("id", institutionId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer la zona de la institución: ${error.message}`);

  // `null` ⇒ la institución no existe. **No se sustituye por un default**: un
  // fallback silencioso acá aplicaría la regla con la zona equivocada, que es
  // exactamente lo que la columna vino a evitar.
  return (data as { timezone?: string } | null)?.timezone ?? null;
}

/**
 * Se llama `institucionReal`, en singular, y no es un capricho de nombre:
 * `institucionesReal` ya existe en `instituciones.ts` y traduce identificadores
 * del CRM. Son dos preocupaciones distintas sobre la misma tabla.
 */
export const institucionReal = { zonaHoraria };
