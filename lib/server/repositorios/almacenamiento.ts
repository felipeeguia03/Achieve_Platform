import "server-only";

import { clienteDeServicio } from "../supabase";

/**
 * Storage de `Evidence` — ADR-005 ítem 4.
 *
 * **Bucket privado y URL firmada de corta duración.** La firma **es** el
 * control de acceso: sin ella no se lee ni se escribe nada, ni adivinando la
 * URL. El archivo no pasa por el servidor de aplicación, que para una foto por
 * entrega es memoria y tiempo regalados.
 *
 * ⚠️ **No hay borrado acá, y es deliberado.** Retención y purga siguen dentro
 * de [ADR-006](../../docs/decisions.md#adr-006). Construir el borrado hoy sería
 * adelantar esa decisión — el mismo criterio que en `audit_log`.
 */
const BUCKET = "evidencia";

/** Cinco minutos: alcanza para subir, no para compartir por chat. */
const SEGUNDOS_DE_FIRMA = 300;

/**
 * La clave del objeto se **deriva** de la institución y la evidencia; no la
 * elige el cliente. Si el cliente propusiera la ruta, podría escribir sobre la
 * carpeta de otra institución con sólo pedir una firma para esa ruta.
 */
export function claveDeObjeto(institutionId: string, evidenceId: string, nombre: string): string {
  // Se colapsan los puntos consecutivos además de los separadores: la barra ya
  // no puede salir del prefijo, pero un `..` en el nombre no aporta nada y
  // confunde a cualquiera que lea la clave.
  const limpio = nombre.replace(/[^\w.-]/g, "_").replace(/\.{2,}/g, ".").slice(-80);
  return `${institutionId}/${evidenceId}/${limpio}`;
}

export async function urlFirmadaParaSubir(clave: string): Promise<{ url: string; token: string }> {
  const { data, error } = await clienteDeServicio()
    .storage.from(BUCKET)
    .createSignedUploadUrl(clave);
  if (error) throw new Error(`No se pudo firmar la subida: ${error.message}`);
  return { url: data.signedUrl, token: data.token };
}

export async function urlFirmadaParaLeer(clave: string): Promise<string> {
  const { data, error } = await clienteDeServicio()
    .storage.from(BUCKET)
    .createSignedUrl(clave, SEGUNDOS_DE_FIRMA);
  if (error) throw new Error(`No se pudo firmar la lectura: ${error.message}`);
  return data.signedUrl;
}
