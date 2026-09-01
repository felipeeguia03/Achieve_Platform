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

/**
 * ¿El request trae el secreto de servicio? — Etapa B4.2.
 *
 * Para lo que **no lo dispara una persona**: el reloj del lifecycle lo llama un
 * scheduler, no un estudiante, y por eso no puede autenticarse con un JWT de
 * sesión. `Authorization: Bearer <RELOJ_SHARED_SECRET>`.
 *
 * **Comparación en tiempo constante.** Un `===` sobre strings sale antes en el
 * primer carácter distinto, y eso filtra el secreto de a un byte por vez a quien
 * mida. Cuesta tres líneas evitarlo.
 *
 * **Sin secreto configurado, nadie entra.** Devuelve `false` en vez de dejar
 * pasar: un endpoint que se abre solo cuando falta una variable de entorno es
 * peor que uno que no existe.
 */
export function esSecretoDeServicio(recibido: string | null, esperado: string | undefined): boolean {
  if (!recibido || !esperado) return false;
  if (recibido.length !== esperado.length) return false;

  let diferencia = 0;
  for (let i = 0; i < recibido.length; i++) {
    diferencia |= recibido.charCodeAt(i) ^ esperado.charCodeAt(i);
  }
  return diferencia === 0;
}
