import "server-only";

import type { AlmacenDeClase, BucketDeClase } from "../servicios/clase-material";
import { clienteDeServicio } from "../supabase";

/**
 * Storage de **Modo Clase** — [ADR-099](../../../docs/decisions.md#adr-099) §2 y §5.
 *
 * Dos buckets privados, `clase-audio` y `clase-material`, con el mismo criterio
 * que `evidencia` (ADR-005 ítem 4): **URL firmada de corta duración**, y el
 * archivo no pasa por el servidor de aplicación.
 *
 * ⚠️ **Acá sí hay borrado, y es el único del repositorio.** `Evidence` sigue sin
 * borrado porque su retención está en ADR-006 §3. Una grabación o un apunte
 * adjunto son material propio del estudiante: ADR-099 le da la salida, sobre
 * todo si grabó a alguien sin querer.
 */

/** Una hora para escuchar: el reproductor pide rangos mientras se escucha. */
const SEGUNDOS_DE_FIRMA_PARA_LEER = 3600;

export const almacenDeClaseReal: AlmacenDeClase = {
  // La firma de subida la fija Supabase (dos horas) y es de un solo objeto: la
  // clave va adentro y no se puede reusar para otra ruta.
  async firmarSubida(bucket, clave) {
    const { data, error } = await clienteDeServicio().storage.from(bucket).createSignedUploadUrl(clave);
    if (error) throw new Error(`No se pudo firmar la subida: ${error.message}`);
    return { url: data.signedUrl, token: data.token };
  },

  async firmarLectura(bucket, clave, descarga) {
    const { data, error } = await clienteDeServicio()
      .storage.from(bucket)
      .createSignedUrl(clave, SEGUNDOS_DE_FIRMA_PARA_LEER, descarga ? { download: descarga } : undefined);
    if (error) throw new Error(`No se pudo firmar la lectura: ${error.message}`);
    return data.signedUrl;
  },

  /**
   * Lo que el storage dice del objeto, **no lo que declaró el cliente**. El
   * tamaño y el tipo que se guardan salen de acá.
   */
  async objeto(bucket: BucketDeClase, clave: string) {
    const corte = clave.lastIndexOf("/");
    const carpeta = clave.slice(0, corte);
    const nombre = clave.slice(corte + 1);
    const { data, error } = await clienteDeServicio().storage.from(bucket).list(carpeta, { search: nombre, limit: 10 });
    if (error) throw new Error(`No se pudo leer el objeto: ${error.message}`);
    const o = (data ?? []).find((x) => x.name === nombre);
    if (!o) return null;
    const meta = (o.metadata ?? {}) as { size?: number; mimetype?: string };
    return { bytes: Number(meta.size ?? 0), mime: meta.mimetype ?? null };
  },

  async borrar(bucket, clave) {
    const { error } = await clienteDeServicio().storage.from(bucket).remove([clave]);
    if (error) throw new Error(`No se pudo borrar el objeto: ${error.message}`);
  },
};
