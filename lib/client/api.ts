import { clienteDeNavegador } from "./supabase-navegador";

/**
 * El cliente de `/api/*` del navegador. Etapa B2.6.
 *
 * ## Qué venía mal
 *
 * La `B2.5` conectó `UX01` a la base y dejó la ruta haciendo
 * `fetch("/api/hoy")` **sin header de autorización**. El endpoint respondía
 * `401`, el `catch` dejaba los datos en `null` y la pantalla dibujaba el
 * fixture. O sea: en un navegador, `UX01` **nunca** mostró datos persistidos, y
 * lo hacía sin decirlo.
 *
 * Dos defectos distintos, y por eso hay dos piezas:
 *
 *   1. **Faltaba el token.** Lo resuelve `tokenDeSesion()`.
 *   2. **El fallo era indistinguible del éxito.** Lo resuelve `Respuesta`, que
 *      obliga a la ruta a ramificar: un `SIN_SESION` no se puede leer como si
 *      fueran datos.
 */

/**
 * El resultado de pedir una superficie. **Un tipo suma, no `T | null`.**
 *
 * `null` colapsaba tres situaciones que el estudiante necesita distinguir: no
 * tener sesión, que el backend se haya caído, y no tener datos todavía. La
 * tercera es del dominio y la proyecta la pantalla; las dos primeras no son del
 * dominio y **no se pueden dibujar como si lo fueran**.
 */
export type Respuesta<T> =
  | { estado: "OK"; datos: T }
  /** Sin sesión, o con una que el backend no reconoce (`401`). */
  | { estado: "SIN_SESION" }
  /** Identidad válida sin `student` en el padrón (`403`). */
  | { estado: "SIN_PADRON" }
  /** El backend no contestó, o contestó cualquier otra cosa. */
  | { estado: "ERROR" };

/**
 * El access token de la sesión vigente, o `null`.
 *
 * **El spec no tiene pantalla de login y acá no se inventa una** (regla 1 de
 * `AGENTS.md`). Para el MVP sintético la sesión se da de alta fuera de las nueve
 * superficies, con `npm run db:demo`, y el navegador entra con las credenciales
 * del estudiante sintético.
 *
 * ⚠️ **Sólo fuera de producción.** El alta por contraseña desde el cliente vive
 * detrás de `NEXT_PUBLIC_DEMO_*`, que existen únicamente en el entorno local y
 * apuntan a un estudiante que no es una persona. Con
 * [ADR-006](../../docs/decisions.md#adr-006) abierto no hay ningún otro tipo de
 * estudiante posible.
 */
export async function tokenDeSesion(): Promise<string | null> {
  const supabase = clienteDeNavegador();

  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.access_token;

  const email = process.env.NEXT_PUBLIC_DEMO_EMAIL;
  const password = process.env.NEXT_PUBLIC_DEMO_PASSWORD;
  if (process.env.NODE_ENV === "production" || !email || !password) return null;

  const alta = await supabase.auth.signInWithPassword({ email, password });
  return alta.data.session?.access_token ?? null;
}

/**
 * Pide una superficie a `/api/*` con la sesión vigente.
 *
 * El `institutionId` y el `studentId` **no viajan en el request**: salen de la
 * sesión del lado del servidor. Mandarlos desde el navegador sería regalar el
 * aislamiento que `db:verify` comprueba en cada corrida.
 */
export async function pedir<T>(ruta: string): Promise<Respuesta<T>> {
  let token: string | null;
  try {
    token = await tokenDeSesion();
  } catch {
    // Falta una clave de entorno, o el proveedor de auth no responde. No es lo
    // mismo que "no hay sesión", pero para la superficie el efecto es idéntico:
    // no se pudo cargar, y no se dibuja nada que finja lo contrario.
    return { estado: "ERROR" };
  }
  if (!token) return { estado: "SIN_SESION" };

  try {
    const r = await fetch(ruta, { headers: { Authorization: `Bearer ${token}` } });
    if (r.status === 401) return { estado: "SIN_SESION" };
    if (r.status === 403) return { estado: "SIN_PADRON" };
    if (!r.ok) return { estado: "ERROR" };
    return { estado: "OK", datos: (await r.json()) as T };
  } catch {
    return { estado: "ERROR" };
  }
}

/**
 * Escribe en `/api/*` con la sesión vigente — Etapa B5.5.
 *
 * Mismo manejo de sesión que `pedir`, y la misma regla: el `institutionId` y el
 * `studentId` **no viajan en el cuerpo**. Los resuelve el servidor.
 *
 * Un `409` no es `ERROR`: es el dominio diciendo que no. Sale como `RECHAZADO`
 * con el motivo, para que la superficie lo pueda mostrar en vez de un *"no se
 * pudo cargar"* que no explica nada.
 */
export type ResultadoDeEnvio<T> = Respuesta<T> | { estado: "RECHAZADO"; motivo: string };

export async function enviar<T>(ruta: string, cuerpo: unknown): Promise<ResultadoDeEnvio<T>> {
  let token: string | null;
  try {
    token = await tokenDeSesion();
  } catch {
    return { estado: "ERROR" };
  }
  if (!token) return { estado: "SIN_SESION" };

  try {
    const r = await fetch(ruta, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    if (r.status === 401) return { estado: "SIN_SESION" };
    if (r.status === 403) return { estado: "SIN_PADRON" };
    if (r.status === 409) {
      const cuerpo = (await r.json().catch(() => ({}))) as { error?: string };
      return { estado: "RECHAZADO", motivo: cuerpo.error ?? "La operación no es válida ahora" };
    }
    if (!r.ok) return { estado: "ERROR" };
    return { estado: "OK", datos: (await r.json()) as T };
  } catch {
    return { estado: "ERROR" };
  }
}
