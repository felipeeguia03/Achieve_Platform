/**
 * El espacio de trabajo — [ADR-088](../../docs/decisions.md#adr-088).
 *
 * **Qué es.** La memoria de trabajo del estudiante: los objetos académicos que
 * tiene abiertos y quiere retomar. Un objeto es una unidad de Análisis, el TP2
 * de Computación Gráfica, la evaluación de Historia Económica.
 *
 * ## Lo que NO es, y son cuatro cosas distintas
 *
 * 1. **No es navegación.** La barra lateral contesta *"¿a qué sección voy?"*;
 *    esto contesta *"¿qué tengo abierto?"*. Por eso no está en `menu.ts`.
 * 2. **No es el breadcrumb.** [ADR-019](../../docs/decisions.md#adr-019) §2
 *    sigue vigente y **no se reemplaza**: la miga dice dónde estás, y eso es
 *    otra pregunta. Un espacio que contestara las dos sería la segunda lista de
 *    destinos que ADR-019 temía.
 * 3. **No crea entidades.** Abrir un objeto no crea una `Action`, un
 *    `Commitment` ni una `Evidence`. No entra a `cta-registry.ts` porque **no
 *    solicita una acción de dominio**.
 * 4. **No es una caché de dominio.** Guarda una etiqueta y una ruta. El backend
 *    sigue decidiendo el acceso: una etiqueta local **no es una autorización**.
 *
 * ## Por qué es puro
 *
 * `lib/domain/` no tiene React, no tiene I/O y no toca `localStorage`
 * (`AGENTS.md` §6). Acá viven las reglas; la persistencia vive en
 * `lib/client/espacio-de-trabajo/persistencia.ts`, que es **el único módulo
 * autorizado** a hablar con el navegador (ADR-088 §4).
 */

/**
 * Los tipos de objeto que se pueden abrir.
 *
 * ⚠️ **Cada uno corresponde a algo que el dominio ya modela.** No se agrega un
 * tipo porque quede bien en la barra: se agrega cuando existe la entidad y
 * existe la ruta que la abre.
 */
export type TipoDeObjeto =
  | "materia"
  | "unidad"
  | "recurso"
  | "trabajo-practico"
  | "accion"
  | "compromiso"
  | "evidencia"
  | "evaluacion"
  | "modo-examen"
  | "formacion"
  | "bitacora";

import type { Marco } from "./marco-de-panel";

export interface ObjetoAbierto {
  /** `tipo:entidadId`. **La identidad, y nunca la etiqueta visible.** */
  clave: string;
  tipo: TipoDeObjeto;
  entidadId: string;
  /** *"Unidad 2"*. Se trunca al dibujar; el completo va al `title`. */
  etiqueta: string;
  /** *"Economía"*. `null` ⇒ el objeto no tiene contexto y **no se inventa**. */
  etiquetaSecundaria: string | null;
  /** La URL real. Requisito 1 del multiventana: **URL por objeto**. */
  ruta: string;
  /** ISO. */
  abiertoEn: string;
  /** ISO. Ordena el desalojo y elige la vecina al cerrar. */
  visitadoEn: string;
  /**
   * Dónde está y cuánto mide su ventana — Enmienda 2.
   *
   * `null` ⇒ **todavía no se abrió nunca**, y nace en cascada. No es *"en el
   * origen"*: una ventana nueva en `0,0` encima de otra es indistinguible de una
   * que el estudiante puso ahí.
   *
   * ⚠️ **Sobrevive al minimizado, que es el punto.** Minimizar y volver a abrir
   * devuelve la ventana **al mismo lugar y al mismo tamaño**.
   */
  marco: Marco | null;
}

export interface EspacioDeTrabajo {
  objetos: readonly ObjetoAbierto[];
  /** La clave del objeto activo. `null` ⇒ ninguno. */
  activo: string | null;
}

/**
 * **Requisito 6 del multiventana: límite duro.** El manual lo llama
 * innegociable y [ADR-019](../../docs/decisions.md#adr-019) lo citó como parte
 * de la razón para descartar el dock.
 *
 * Se elige **alto a propósito**: en un día normal nadie lo toca. Y cuando actúa
 * **se dice** — un objeto que desaparece en silencio es peor que no tenerlo.
 */
export const LIMITE_DURO = 12;

/**
 * **Requisito 5: comportamiento a escala.** Hasta acá se dibujan; el resto va a
 * desbordamiento con su contador.
 *
 * ⚠️ **Es la corrección de `A-07`**, no su copia. El anti-patrón catalogado no
 * es *"el dock existe"*: es *"el dock ya trunca títulos con dos elementos
 * abiertos"*. Cinco a ancho legible es lo contrario de eso.
 */
export const VISIBLES = 5;

export const ESPACIO_VACIO: EspacioDeTrabajo = { objetos: [], activo: null };

/** `tipo:entidadId`. **La identidad nunca es el texto visible** (ADR-088). */
export function claveDe(tipo: TipoDeObjeto, entidadId: string): string {
  return `${tipo}:${entidadId}`;
}

/** Lo que hace falta para abrir algo. La clave y los instantes los pone el módulo. */
export interface ObjetoPorAbrir {
  tipo: TipoDeObjeto;
  entidadId: string;
  etiqueta: string;
  etiquetaSecundaria?: string | null;
  ruta: string;
}

export interface ResultadoDeApertura {
  espacio: EspacioDeTrabajo;
  /**
   * El objeto que el límite duro sacó para hacer lugar. `null` ⇒ no se desalojó
   * nada. **La pantalla lo dice**; no se cierra en silencio.
   */
  desalojado: ObjetoAbierto | null;
  /** `true` ⇒ ya estaba abierto y sólo se activó. No se creó un duplicado. */
  yaEstaba: boolean;
}

/**
 * Abre un objeto, o **activa el que ya estaba**.
 *
 * ⚠️ **Nunca hay dos objetos con la misma clave.** Es la regla de identidad de
 * ADR-088: dos aperturas del mismo TP no son dos objetos, y la segunda no
 * reordena la barra — sólo actualiza `visitadoEn`. Reordenar por visita haría
 * que la barra se moviera sola bajo el cursor.
 */
export function abrir(
  espacio: EspacioDeTrabajo,
  porAbrir: ObjetoPorAbrir,
  ahora: string,
): ResultadoDeApertura {
  const clave = claveDe(porAbrir.tipo, porAbrir.entidadId);
  const existente = espacio.objetos.find((o) => o.clave === clave);

  if (existente) {
    return {
      espacio: {
        objetos: espacio.objetos.map((o) => (o.clave === clave ? { ...o, visitadoEn: ahora } : o)),
        activo: clave,
      },
      desalojado: null,
      yaEstaba: true,
    };
  }

  const nuevo: ObjetoAbierto = {
    clave,
    // Nace sin marco: quién lo dibuja sabe cuánta pantalla hay, y el dominio no.
    marco: null,
    tipo: porAbrir.tipo,
    entidadId: porAbrir.entidadId,
    etiqueta: porAbrir.etiqueta,
    etiquetaSecundaria: porAbrir.etiquetaSecundaria ?? null,
    ruta: porAbrir.ruta,
    abiertoEn: ahora,
    visitadoEn: ahora,
  };

  // El límite duro actúa **antes** de agregar, y saca el menos visitado — no el
  // más viejo. Lo que hace tiempo que no se mira es lo que menos se extraña.
  let objetos = [...espacio.objetos];
  let desalojado: ObjetoAbierto | null = null;
  if (objetos.length >= LIMITE_DURO) {
    const victima = [...objetos].sort((a, b) => a.visitadoEn.localeCompare(b.visitadoEn))[0];
    if (victima) {
      desalojado = victima;
      objetos = objetos.filter((o) => o.clave !== victima.clave);
    }
  }

  return { espacio: { objetos: [...objetos, nuevo], activo: clave }, desalojado, yaEstaba: false };
}

/** Activa uno que ya está abierto. Una clave desconocida **no cambia nada**. */
export function activar(
  espacio: EspacioDeTrabajo,
  clave: string,
  ahora: string,
): EspacioDeTrabajo {
  if (!espacio.objetos.some((o) => o.clave === clave)) return espacio;
  return {
    objetos: espacio.objetos.map((o) => (o.clave === clave ? { ...o, visitadoEn: ahora } : o)),
    activo: clave,
  };
}

/**
 * Cierra uno.
 *
 * ⚠️ **Al cerrar el activo se activa el vecino más recientemente visitado**, no
 * el de al lado en la barra: el orden de la barra lo eligió el estudiante
 * arrastrando, y no dice nada sobre a dónde quiere volver.
 *
 * Con nada abierto queda `activo: null`, y **la pantalla no se rompe**: la ruta
 * actual sigue siendo la ruta actual. Cerrar un objeto no navega.
 */
export function cerrar(espacio: EspacioDeTrabajo, clave: string): EspacioDeTrabajo {
  const objetos = espacio.objetos.filter((o) => o.clave !== clave);
  if (objetos.length === espacio.objetos.length) return espacio;
  if (espacio.activo !== clave) return { objetos, activo: espacio.activo };

  const vecino = [...objetos].sort((a, b) => b.visitadoEn.localeCompare(a.visitadoEn))[0];
  return { objetos, activo: vecino?.clave ?? null };
}

/**
 * Guarda dónde quedó la ventana de un objeto — Enmienda 2.
 *
 * ⚠️ **No toca `visitadoEn`.** Mover una ventana no es visitarla: si contara
 * como visita, arrastrar la de Álgebra la salvaría del desalojo por encima de
 * una que el estudiante realmente estuvo mirando.
 */
export function encuadrarObjeto(
  espacio: EspacioDeTrabajo,
  clave: string,
  marco: Marco,
): EspacioDeTrabajo {
  if (!espacio.objetos.some((o) => o.clave === clave)) return espacio;
  return {
    objetos: espacio.objetos.map((o) => (o.clave === clave ? { ...o, marco } : o)),
    activo: espacio.activo,
  };
}

/** Cierra todos menos uno. Una clave desconocida **no vacía el espacio**. */
export function cerrarOtros(espacio: EspacioDeTrabajo, clave: string): EspacioDeTrabajo {
  const queda = espacio.objetos.find((o) => o.clave === clave);
  if (!queda) return espacio;
  return { objetos: [queda], activo: clave };
}

export function cerrarTodos(): EspacioDeTrabajo {
  return ESPACIO_VACIO;
}

/**
 * Mueve un objeto a otra posición.
 *
 * **Requisito 3 del multiventana, su mitad accesible.** El arrastre existe, y
 * esto es lo que hace que no sea el único camino: el menú contextual y el
 * teclado llaman acá (ADR-088 §2).
 */
export function reordenar(
  espacio: EspacioDeTrabajo,
  clave: string,
  destino: number,
): EspacioDeTrabajo {
  const desde = espacio.objetos.findIndex((o) => o.clave === clave);
  if (desde === -1) return espacio;
  const limite = Math.max(0, Math.min(destino, espacio.objetos.length - 1));
  if (limite === desde) return espacio;

  const objetos = [...espacio.objetos];
  const [movido] = objetos.splice(desde, 1);
  if (!movido) return espacio;
  objetos.splice(limite, 0, movido);
  return { objetos, activo: espacio.activo };
}

/** *"Mover a la izquierda"* / *"Mover a la derecha"* del menú contextual. */
export function mover(
  espacio: EspacioDeTrabajo,
  clave: string,
  direccion: -1 | 1,
): EspacioDeTrabajo {
  const desde = espacio.objetos.findIndex((o) => o.clave === clave);
  if (desde === -1) return espacio;
  return reordenar(espacio, clave, desde + direccion);
}

/**
 * El reparto entre lo que se dibuja y lo que va al desbordamiento.
 *
 * ⚠️ **El activo siempre se ve.** Si quedó más allá de `VISIBLES` —porque el
 * estudiante lo arrastró al fondo, o porque abrió seis— entra igual, sacando al
 * último de los visibles. Un objeto activo escondido en un menú es exactamente
 * *"no perder el lugar"* fallando.
 */
export function repartir(
  espacio: EspacioDeTrabajo,
  /**
   * Cuántos entran **de verdad en el ancho que hay**. Por defecto, el techo.
   *
   * ⚠️ **Se agregó después de medirlo en el navegador.** Con cinco objetos
   * abiertos a 1024 px la barra medía ~1100 px contra 720 px de columna, y el
   * `body` ganaba scroll horizontal. Achicar las etiquetas habría sido volver a
   * `A-07`; lo que corresponde es **mostrar menos y decir cuántos faltan**, que
   * es lo que el requisito 5 pide.
   */
  cupo: number = VISIBLES,
): {
  visibles: readonly ObjetoAbierto[];
  desbordados: readonly ObjetoAbierto[];
} {
  // Siempre al menos uno: una barra que sólo muestra el menú no dice nada.
  const techo = Math.max(1, Math.min(cupo, VISIBLES));

  if (espacio.objetos.length <= techo) {
    return { visibles: espacio.objetos, desbordados: [] };
  }

  const visibles = espacio.objetos.slice(0, techo);
  const desbordados = espacio.objetos.slice(techo);

  const activoEscondido =
    espacio.activo !== null && desbordados.some((o) => o.clave === espacio.activo);
  if (!activoEscondido) return { visibles, desbordados };

  const activo = desbordados.find((o) => o.clave === espacio.activo);
  if (!activo) return { visibles, desbordados };
  const ultimo = visibles[visibles.length - 1];
  if (!ultimo) return { visibles, desbordados };

  return {
    visibles: [...visibles.slice(0, techo - 1), activo],
    desbordados: [ultimo, ...desbordados.filter((o) => o.clave !== activo.clave)],
  };
}

/**
 * Sincroniza el activo con la ruta del navegador.
 *
 * **Requisito 2 del multiventana: atrás y adelante funcionan.** El espacio
 * **no intercepta la history API**; escucha la ruta y marca activo al objeto
 * que la tiene. Volver con el botón atrás a `/materia?cursada=abc` reactiva ese
 * objeto sin que nadie lo haya tocado.
 *
 * ⚠️ **Una ruta que no corresponde a ningún objeto abierto NO abre uno.** Deja
 * `activo` en `null`: estar en Progreso no es tener Progreso abierto, y crear un
 * objeto por navegar convertiría el espacio en un historial.
 */
/**
 * El parámetro que despliega el panel — ADR-088, Enmienda 1.
 *
 * ⚠️ **La ventana interna vive en la URL, y no es un detalle.** El requisito 1
 * del multiventana es *URL por ficha*: un panel que sólo existiera en memoria no
 * se podría compartir, el botón atrás no lo cerraría y recargar lo perdería. Con
 * el parámetro, las tres cosas salen gratis.
 */
export const PARAM_PANEL = "abierto";

/**
 * El separador entre claves desplegadas.
 *
 * ⚠️ **La coma, y no un parámetro repetido.** `?abierto=a&abierto=b` obligaría a
 * `URLSearchParams.getAll` acá y a `set` en cinco lugares distintos del
 * proveedor, y el orden de los repetidos no está garantizado por nadie. Con una
 * sola clave y una lista, **el orden es el dato** — y el orden es el
 * apilamiento.
 */
const SEPARADOR_DE_PANELES = ",";

/**
 * Qué objetos están desplegados, y **en qué orden se apilan** — Enmienda 3.
 *
 * El último de la lista es **el de adelante**. Es la misma convención que
 * cualquier manejo de ventanas: lo que se toca sube al final.
 *
 * ⚠️ **Una clave que no corresponde a un objeto abierto se descarta**, sin
 * descartar las otras. La URL se puede editar a mano, y un parámetro con una
 * clave inventada entre dos válidas no es motivo para perder las dos válidas.
 *
 * ⚠️ **Y no hay repetidos.** `?abierto=a,a` es una ventana, no dos: la regla de
 * identidad de ADR-088 §1 no admite dos objetos con la misma clave, y tampoco
 * dos ventanas del mismo objeto.
 */
export function clavesDesplegadas(espacio: EspacioDeTrabajo, ruta: string): readonly string[] {
  const consulta = ruta.split("?")[1] ?? "";
  const crudo = new URLSearchParams(consulta).get(PARAM_PANEL);
  if (crudo === null || crudo === "") return [];

  const vistas = new Set<string>();
  const claves: string[] = [];
  for (const clave of crudo.split(SEPARADOR_DE_PANELES)) {
    if (clave === "" || vistas.has(clave)) continue;
    if (!espacio.objetos.some((o) => o.clave === clave)) continue;
    vistas.add(clave);
    claves.push(clave);
  }
  return claves;
}

/** La de adelante. `null` ⇒ no hay ninguna desplegada. */
export function claveAlFrente(claves: readonly string[]): string | null {
  return claves[claves.length - 1] ?? null;
}

/** El objeto de una clave, si está abierto. */
export function objetoDe(espacio: EspacioDeTrabajo, clave: string | null): ObjetoAbierto | null {
  if (clave === null) return null;
  return espacio.objetos.find((o) => o.clave === clave) ?? null;
}

/** Los objetos de una lista de claves, **en el orden de la lista**. */
export function objetosDe(
  espacio: EspacioDeTrabajo,
  claves: readonly string[],
): readonly ObjetoAbierto[] {
  return claves
    .map((clave) => espacio.objetos.find((o) => o.clave === clave))
    .filter((o): o is ObjetoAbierto => o !== undefined);
}

/**
 * La ruta actual con **estas** ventanas desplegadas, en este orden.
 *
 * Se construye acá y no en el componente para que la regla de qué parámetro se
 * usa —y con qué separador— viva en un solo lugar: dos lugares que arman la URL
 * son dos lugares donde se escribe mal el nombre del parámetro.
 */
export function rutaConPaneles(ruta: string, claves: readonly string[]): string {
  const [camino = "", consulta = ""] = ruta.split("?");
  const params = new URLSearchParams(consulta);
  if (claves.length === 0) params.delete(PARAM_PANEL);
  else params.set(PARAM_PANEL, claves.join(SEPARADOR_DE_PANELES));
  const cola = params.toString();
  return cola ? `${camino}?${cola}` : camino;
}

/**
 * Despliega una ventana, o **la trae al frente si ya estaba**.
 *
 * ⚠️ **No hay dos ventanas del mismo objeto**, así que desplegar algo que ya
 * está desplegado no es abrir otra: es traerla adelante, que es lo que hace
 * cualquier escritorio cuando tocás algo que ya está abierto.
 */
export function desplegar(claves: readonly string[], clave: string): readonly string[] {
  return [...claves.filter((c) => c !== clave), clave];
}

/** Minimiza una ventana. **El objeto sigue abierto**: sale la ventana, no el objeto. */
export function minimizarPanelDe(claves: readonly string[], clave: string): readonly string[] {
  return claves.filter((c) => c !== clave);
}

/**
 * El gesto de la ficha: desplegar si está minimizada, minimizar si está desplegada.
 *
 * ⚠️ **Estar desplegada pero atrás cuenta como desplegada, y se minimiza.** La
 * alternativa —traerla al frente— dejaría la ficha sin forma de minimizar lo
 * que ella misma abrió. Subir al frente es tocar la ventana; la ficha alterna.
 */
export function alternarDespliegue(claves: readonly string[], clave: string): readonly string[] {
  return claves.includes(clave) ? minimizarPanelDe(claves, clave) : desplegar(claves, clave);
}

export function claveEnRuta(espacio: EspacioDeTrabajo, ruta: string): string | null {
  return espacio.objetos.find((o) => mismaRuta(o.ruta, ruta))?.clave ?? null;
}

export function sincronizarConRuta(
  espacio: EspacioDeTrabajo,
  ruta: string,
  ahora: string,
): EspacioDeTrabajo {
  const coincide = claveEnRuta(espacio, ruta);
  if (coincide === null) return espacio.activo === null ? espacio : { ...espacio, activo: null };
  if (espacio.activo === coincide) return espacio;
  return activar(espacio, coincide, ahora);
}

/**
 * A qué objeto conviene ir al cerrar `clave` — §10.7.
 *
 * **El vecino más recientemente visitado**, no el de al lado: el orden de la
 * barra lo eligió el estudiante arrastrando, y no dice nada sobre a dónde
 * quiere volver. `null` ⇒ no queda ninguno, y **la ruta actual se conserva**:
 * cerrar la última etiqueta no es motivo para mover a nadie de pantalla.
 */
export function vecinoAlCerrar(espacio: EspacioDeTrabajo, clave: string): ObjetoAbierto | null {
  const quedan = espacio.objetos.filter((o) => o.clave !== clave);
  return [...quedan].sort((a, b) => b.visitadoEn.localeCompare(a.visitadoEn))[0] ?? null;
}

/**
 * Compara rutas por camino y parámetros **significativos**.
 *
 * `?escenario=` se ignora: es el conmutador del catálogo sintético del Track A,
 * no parte de la identidad del objeto. Sin esto, recorrer la demo con un
 * escenario dejaría todos los objetos inactivos.
 */
function mismaRuta(a: string, b: string): boolean {
  return normalizarRuta(a) === normalizarRuta(b);
}

function normalizarRuta(ruta: string): string {
  const [camino, consulta = ""] = ruta.split("?");
  const params = new URLSearchParams(consulta);
  params.delete("escenario");
  // `abierto` dice **qué panel está desplegado**, no qué objeto es éste. Sin
  // sacarlo, abrir el panel encima de `/hoy` haría que ningún objeto coincidiera
  // con su propia ruta.
  params.delete(PARAM_PANEL);
  params.sort();
  const cola = params.toString();
  return cola ? `${camino}?${cola}` : (camino ?? ruta);
}

/**
 * Descarta objetos cuya ruta ya no es válida — §10.7 y §17.
 *
 * **Una ruta restaurada no se confía.** Se valida contra las rutas que la
 * aplicación reconoce antes de dibujar nada: un `localStorage` editado a mano no
 * puede meter una URL arbitraria en la barra.
 */
export function validarContra(
  espacio: EspacioDeTrabajo,
  rutaEsValida: (ruta: string) => boolean,
): EspacioDeTrabajo {
  const objetos = espacio.objetos.filter((o) => rutaEsValida(o.ruta));
  if (objetos.length === espacio.objetos.length) return espacio;
  const activo = objetos.some((o) => o.clave === espacio.activo) ? espacio.activo : null;
  return { objetos, activo };
}
