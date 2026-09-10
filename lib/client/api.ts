import { clienteDeNavegador } from "./supabase-navegador";
import { olvidarTodo } from "./espacio-de-trabajo/persistencia";

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
  /**
   * El alta todavía no está completa (`409`) — B6.14, ADR-052.
   *
   * **No es un error y no se dibuja.** Es el backend diciendo a dónde va este
   * estudiante, y `siguiente` es la ruta concreta. Colapsarlo con `ERROR`
   * mostraría un *"no se pudo cargar"* sobre algo que sí se pudo: lo que falta
   * es que el estudiante termine de darse de alta.
   */
  | { estado: "ALTA_INCOMPLETA"; siguiente: string }
  /** El backend no contestó, o contestó cualquier otra cosa. */
  | { estado: "ERROR" };

/**
 * El access token de la sesión vigente, o `null`.
 *
 * ## Ya no da de alta la sesión, y ese es el punto
 *
 * Hasta [ADR-039](../../docs/decisions.md#adr-039) esto hacía
 * `signInWithPassword` con credenciales de entorno cuando no había sesión: el
 * navegador entraba solo. Con una pantalla de ingreso eso sería teatro —el
 * login no decidiría nada, porque la sesión ya estaría abierta antes de
 * llegar—, así que **acá sólo se lee lo que ya existe**.
 *
 * `null` significa *no hay sesión*, y quien pregunta manda a `/login`.
 */
export async function tokenDeSesion(): Promise<string | null> {
  const { data } = await clienteDeNavegador().auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Quién es el estudiante de esta sesión, para **aislar su espacio de trabajo**
 * — [ADR-088](../../docs/decisions.md#adr-088) §4.
 *
 * Sale de Auth y de ningún otro lado. `null` ⇒ no hay sesión, y entonces el
 * espacio de trabajo **no persiste nada**: el Track A corre con `?escenario=` y
 * sin backend, y darle memoria a una demo sería guardar el recorrido de un
 * focus group en la máquina de quien lo corrió.
 *
 * Envuelto en `try` porque sin las variables de entorno de Supabase el cliente
 * lanza al construirse, y eso es exactamente el caso del Track A.
 */
export async function identidadDeSesion(): Promise<string | null> {
  try {
    const { data } = await clienteDeNavegador().auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Cierra la sesión. La pantalla que llame decide a dónde ir después.
 *
 * ⚠️ **Y borra el espacio de trabajo de este navegador.** Es el único lugar
 * donde se cierra sesión, así que es el único donde hace falta: dejar los
 * objetos de una identidad esperando a que entre otra es lo que ADR-088 §4
 * prohíbe. Se borra **todo** el namespace y no sólo el del estudiante actual,
 * porque acá ya no se sabe con certeza cuál era.
 */
export async function cerrarSesion(): Promise<void> {
  olvidarTodo();
  await clienteDeNavegador().auth.signOut();
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
    if (r.status === 409) {
      const cuerpo = (await r.json().catch(() => ({}))) as { error?: string; siguiente?: string };
      if (cuerpo.error === "ALTA_INCOMPLETA" && cuerpo.siguiente) {
        return { estado: "ALTA_INCOMPLETA", siguiente: cuerpo.siguiente };
      }
      return { estado: "ERROR" };
    }
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
export type ResultadoDeEnvio<T> =
  | Respuesta<T>
  /**
   * `motivo` es el texto del servidor; `codigo` es **el motivo canónico**,
   * cuando la ruta lo declara. La superficie prefiere el código y resuelve la
   * copy con `t()`: así el texto que lee el estudiante vive en `es-AR.ts` y no
   * en el mensaje de error de una API — ADR-050.
   */
  | { estado: "RECHAZADO"; motivo: string; codigo?: string }
  /**
   * `404` — **lo que se pidió ya no está**, y reintentar no lo va a traer.
   *
   * Se separa de `ERROR` porque las dos cosas se ven igual y no lo son: un
   * `ERROR` es *"probá de nuevo en un momento"*, y esto es permanente. Mostrar
   * el mensaje de red sobre un `404` le pide al estudiante que insista contra
   * algo que nunca va a funcionar.
   */
  | { estado: "NO_ENCONTRADO" };

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
    if (r.status === 404) return { estado: "NO_ENCONTRADO" };
    if (r.status === 409) {
      const cuerpo = (await r.json().catch(() => ({}))) as { error?: string; motivo?: string };
      return {
        estado: "RECHAZADO",
        motivo: cuerpo.error ?? "La operación no es válida ahora",
        codigo: cuerpo.motivo,
      };
    }
    if (!r.ok) return { estado: "ERROR" };
    return { estado: "OK", datos: (await r.json()) as T };
  } catch {
    return { estado: "ERROR" };
  }
}

/**
 * Sube el archivo de una evidencia a la URL firmada que devolvió el servidor.
 *
 * Vive acá y no en la pantalla **por la regla de cero red de la presentación**:
 * una pantalla que hace `fetch` decide de dónde salen sus datos, y la frontera
 * de la Fase 0 existe para impedirlo. Hay guard estático.
 *
 * La firma es el control de acceso —la URL ya la lleva—, así que esto no manda
 * el token de sesión: el bucket es privado y sin firma no entra nadie.
 */
export async function subirEvidencia(url: string, contenido: string): Promise<boolean> {
  try {
    const r = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: contenido,
    });
    return r.ok;
  } catch {
    return false;
  }
}
