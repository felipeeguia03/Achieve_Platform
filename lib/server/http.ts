/**
 * Borde HTTP — utilidades del Controller.
 *
 * **Sin `server-only` a propósito, y sin secretos.** Acá vive lo que sabe de
 * HTTP y nada de dominio ni de persistencia. Vivía en el Service, que es la
 * capa equivocada: un Service "no lee headers"
 * ([`architecture.md`](../../docs/architecture.md) §3.2).
 */

/**
 * Extrae el token de `Authorization: Bearer <token>`.
 *
 * Devuelve `null` para cualquier otro esquema, **aunque el token sea válido**:
 * aceptar un JWT bajo `Basic` sería tratar el header como si sólo importara lo
 * que viene después del espacio.
 */
export function tokenDelHeader(authorization: string | null): string | null {
  if (!authorization) return null;
  const [esquema, token] = authorization.split(" ");
  if (esquema?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}
