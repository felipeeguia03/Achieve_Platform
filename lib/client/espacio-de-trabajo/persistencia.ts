"use client";

/**
 * La persistencia del espacio de trabajo — [ADR-088](../../../docs/decisions.md#adr-088) §4.
 *
 * ## ⚠️ Éste es el ÚNICO módulo del repositorio autorizado a usar `localStorage`
 *
 * El guard de *cero persistencia* de `tests/track-a-rules.test.ts` sigue
 * prohibiéndolo en todo el resto de `app/`, `components/`, `lib/` y `hooks/`, y
 * **nombra este archivo como su única excepción** — exactamente como la B1.6
 * hizo con la red, nombrando `lib/client/` y `lib/server/repositorios/` en vez
 * de aflojar el regex.
 *
 * Si hace falta persistir algo más, **no se agrega acá**: se decide en un ADR y
 * se agrega su propio módulo a la lista del guard. La excepción es angosta a
 * propósito.
 *
 * ## Lo que se guarda, y lo que no
 *
 * Se guardan **identificadores, etiquetas, rutas y la geometría de la ventana**.
 * No se guarda evidencia, no se guardan reflexiones, no se guardan mensajes
 * humanos y no se guarda el nombre de ninguna persona.
 *
 * ⚠️ **La geometría entró en la Enmienda 2 y no obligó a versionar la clave**:
 * es un campo nuevo y opcional, así que lo guardado antes se sigue leyendo. Lo
 * que obligaría a versionar es cambiarle el significado a un campo que ya
 * existe.
 *
 * ⚠️ **Una etiqueta guardada no es una autorización.** El backend sigue
 * decidiendo el acceso a cada entidad; esto es una lista de atajos, no una
 * caché de dominio. Si el estudiante perdió el acceso, la ruta contesta lo que
 * tenga que contestar y el objeto se cierra.
 *
 * ## Aislamiento por estudiante
 *
 * La clave lleva el `studentId` adentro: **otro estudiante es otro namespace**,
 * no otro contenido en el mismo. Así, dos sesiones en el mismo navegador no
 * pueden verse los objetos ni por accidente ni por un bug de limpieza.
 */

import { comoMarco } from "@/lib/domain/marco-de-panel";
import {
  ESPACIO_VACIO,
  type EspacioDeTrabajo,
  type ObjetoAbierto,
  type TipoDeObjeto,
} from "@/lib/domain/espacio-de-trabajo";

/**
 * La versión va en la clave, no adentro del JSON.
 *
 * Cambiar la forma de lo guardado **no migra**: cambia la versión y lo viejo
 * queda huérfano. Migrar una lista de atajos cuesta más de lo que vale.
 */
const PREFIJO = "achieve.espacio-de-trabajo.v1";

export function claveDeAlmacenamiento(studentId: string): string {
  return `${PREFIJO}.${studentId}`;
}

const TIPOS: readonly TipoDeObjeto[] = [
  "materia",
  "unidad",
  "recurso",
  "trabajo-practico",
  "accion",
  "compromiso",
  "evidencia",
  "evaluacion",
  "modo-examen",
  "formacion",
  "bitacora",
];

/**
 * Valida un objeto leído del navegador, campo por campo.
 *
 * **Nada de lo que sale de `localStorage` se cree.** Se lo trata como entrada
 * de red: puede estar editado a mano, puede venir de una versión vieja y puede
 * estar truncado a la mitad.
 */
function comoObjeto(valor: unknown): ObjetoAbierto | null {
  if (typeof valor !== "object" || valor === null) return null;
  const o = valor as Record<string, unknown>;

  const tipo = o.tipo;
  if (typeof tipo !== "string" || !TIPOS.includes(tipo as TipoDeObjeto)) return null;
  if (typeof o.entidadId !== "string" || o.entidadId === "") return null;
  if (typeof o.etiqueta !== "string" || o.etiqueta === "") return null;
  if (typeof o.ruta !== "string" || !o.ruta.startsWith("/")) return null;
  if (typeof o.abiertoEn !== "string" || typeof o.visitadoEn !== "string") return null;

  const secundaria = o.etiquetaSecundaria;
  if (secundaria !== null && secundaria !== undefined && typeof secundaria !== "string") return null;

  /*
    El marco es **opcional y tolerante**: una entrada guardada antes de la
    Enmienda 2 no lo tiene, y eso no la invalida. Se vuelve a abrir en cascada,
    que es exactamente lo que corresponde a una ventana que nunca se movió.
  */
  return {
    marco: comoMarco(o.marco),
    clave: `${tipo}:${o.entidadId}`,
    tipo: tipo as TipoDeObjeto,
    entidadId: o.entidadId,
    etiqueta: o.etiqueta,
    etiquetaSecundaria: typeof secundaria === "string" ? secundaria : null,
    ruta: o.ruta,
    abiertoEn: o.abiertoEn,
    visitadoEn: o.visitadoEn,
  };
}

/**
 * Lee el espacio guardado.
 *
 * ⚠️ **Un dato corrupto no rompe la aplicación y no se repara a medias.** Si el
 * JSON no parsea, se descarta entero. Si parsea pero trae objetos inválidos,
 * **se conservan los válidos y se tiran los otros**: perder un atajo es
 * barato, y arrancar vacío por una fila rota sería peor.
 *
 * Devuelve el espacio vacío en el servidor: no hay `window` durante el SSR, y
 * **eso no es un error** — es el estado con el que el HTML tiene que salir para
 * que la hidratación no vea dos árboles distintos.
 */
export function leer(studentId: string): EspacioDeTrabajo {
  if (typeof window === "undefined") return ESPACIO_VACIO;

  let crudo: string | null = null;
  try {
    crudo = window.localStorage.getItem(claveDeAlmacenamiento(studentId));
  } catch {
    // Almacenamiento bloqueado (ventana privada, cookies de terceros). No es un
    // fallo del producto: se sigue sin memoria.
    return ESPACIO_VACIO;
  }
  if (crudo === null) return ESPACIO_VACIO;

  try {
    const datos: unknown = JSON.parse(crudo);
    if (typeof datos !== "object" || datos === null) return ESPACIO_VACIO;
    const d = datos as Record<string, unknown>;
    if (!Array.isArray(d.objetos)) return ESPACIO_VACIO;

    const objetos = d.objetos
      .map(comoObjeto)
      .filter((o): o is ObjetoAbierto => o !== null)
      // Un archivo editado a mano puede traer la misma clave dos veces, y la
      // regla de identidad no admite duplicados ni siquiera restaurando.
      .filter((o, i, todos) => todos.findIndex((x) => x.clave === o.clave) === i);

    const activo = typeof d.activo === "string" && objetos.some((o) => o.clave === d.activo)
      ? d.activo
      : null;

    return { objetos, activo };
  } catch {
    return ESPACIO_VACIO;
  }
}

/** Guarda. Un almacenamiento lleno o bloqueado **no rompe nada**: se sigue sin memoria. */
export function guardar(studentId: string, espacio: EspacioDeTrabajo): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      claveDeAlmacenamiento(studentId),
      JSON.stringify({ objetos: espacio.objetos, activo: espacio.activo }),
    );
  } catch {
    /* Sin memoria se sigue funcionando. La lista de atajos no es dominio. */
  }
}

/** Borra el de un estudiante. Se llama al cerrar sesión. */
export function olvidar(studentId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(claveDeAlmacenamiento(studentId));
  } catch {
    /* Nada que hacer, y nada que romper. */
  }
}

/**
 * Borra **todos** los espacios guardados en este navegador.
 *
 * Se llama al cerrar sesión, porque ahí no siempre se sabe qué `studentId`
 * tenía la sesión que se está cerrando — y dejar el de otra identidad esperando
 * a que alguien entre es justamente lo que §17 prohíbe.
 */
export function olvidarTodo(): void {
  if (typeof window === "undefined") return;
  try {
    const claves: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k !== null && k.startsWith(`${PREFIJO}.`)) claves.push(k);
    }
    for (const k of claves) window.localStorage.removeItem(k);
  } catch {
    /* Nada que hacer, y nada que romper. */
  }
}
