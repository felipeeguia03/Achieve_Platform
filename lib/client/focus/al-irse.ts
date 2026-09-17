/**
 * Lo único que Modo Focus manda **mientras la página se va** — ADR-104 §12.
 *
 * Al cerrar la pestaña o recargar, un `fetch` común se cancela. `keepalive`
 * le pide al navegador que lo termine igual, y `sendBeacon` no sirve porque no
 * lleva el `Authorization`. Es **mejor esfuerzo**: la promesa del producto es
 * que el anotador se guarda solo mientras escribís, no que el último carácter
 * sobreviva a cualquier cierre.
 *
 * ⚠️ **El token se pide antes**, con `tokenDeSesion()`: en `pagehide` ya no hay
 * tiempo para una promesa.
 */
export function guardarAnotadorAlIrse(token: string | null, sesion: string, texto: string): void {
  if (!token) return;
  try {
    void fetch("/api/focus/anotador", {
      method: "POST",
      keepalive: true,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sesion, texto }),
    });
  } catch {
    // La página se está yendo: no hay a quién avisarle.
  }
}
