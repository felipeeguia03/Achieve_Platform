/**
 * Qué objeto es la pantalla que se está mirando — [ADR-088](../../docs/decisions.md#adr-088),
 * Enmienda 7.
 *
 * ## La barra no se llena sola
 *
 * La Enmienda 6 hacía que **entrar** a cualquier pantalla dejara su ficha: tocar
 * cinco ítems del menú eran cinco fichas que nadie pidió, y la barra se volvía
 * un historial. El owner lo corrigió así: *"que no se popule la barra apenas
 * entrás; para que se popule tenés que minimizar"*.
 *
 * Entonces hay dos preguntas distintas, y este archivo contesta la primera:
 *
 * 1. **¿Esta pantalla es un objeto que se podría guardar?** Si sí, lleva los
 *    controles de minimizar y achicar. Eso es `objetoEnPantalla`.
 * 2. **¿Ya está guardado?** Eso lo sabe el espacio de trabajo, y sólo pasa
 *    cuando alguien minimizó o achicó.
 *
 * ## ⚠️ Las secciones del menú NO son objetos
 *
 * *Hoy*, *Materias*, *Progreso*, *Formación* y *Modo Examen* son **lugares a los
 * que se va**: la barra lateral ya los tiene a un clic, y una ficha suya sería la
 * segunda lista de destinos que [ADR-019](../../docs/decisions.md#adr-019) temía.
 * Lo que sí es un objeto es **algo abierto adentro** de una de ellas: una
 * materia, un video de Formación, la acción del día, un paso del protocolo.
 */

import { ctaRegistry } from "./cta-registry";
import { cadenaDe, etiquetaDeMiga, seccionesDelMenu } from "./migas";
import { nodos, type NodoId } from "./surfaces";
import {
  rutaConPaneles,
  type ObjetoAbierto,
  type ObjetoPorAbrir,
  type TipoDeObjeto,
} from "@/lib/domain/espacio-de-trabajo";

/**
 * El parámetro que dice qué video de Formación está abierto.
 *
 * ⚠️ **Existe por la Enmienda 7, y no es un detalle.** Hasta acá la pieza abierta
 * era estado de la pantalla: sin URL no hay ficha que la devuelva, no hay miga
 * que la nombre y el botón atrás no la cierra.
 */
export const PARAM_PIEZA = "pieza";

/**
 * Las pantallas que son **de un objeto**, y de dónde sale su identidad.
 *
 * `parametro` en `null` ⇒ la pantalla es de un solo objeto a la vez, y su id es
 * el `NodoId`: hay **una** acción del día, no una por URL. Con parámetro, el id
 * es el valor, y dos materias son dos fichas.
 */
const PANTALLAS_DE_OBJETO: Partial<
  Record<
    NodoId,
    {
      tipo: TipoDeObjeto;
      parametro: string | null;
      /**
       * Sin el parámetro, la pantalla muestra **su único objeto vigente** y su id
       * es el `NodoId`. Es `/clase` pelada: la clase activa, que hay una sola.
       */
      sinParametroEsElNodo?: true;
    }
  >
> = {
  // El nombre del parámetro sale del registro canónico, no se escribe acá.
  UX02: { tipo: "materia", parametro: ctaRegistry["CTA-001"].parametro?.nombre ?? null },
  FORMACION: { tipo: "formacion", parametro: PARAM_PIEZA },
  UX03: { tipo: "accion", parametro: null },
  UX04: { tipo: "compromiso", parametro: null },
  UX05: { tipo: "evidencia", parametro: null },
  UX08: { tipo: "modo-examen", parametro: null },
  UX09: { tipo: "modo-examen", parametro: null },
  /*
    ADR-088 · Enmienda 8 — **toda pantalla que abre algo lleva los controles**.
    Progreso y la activación de Modo Examen dejaron el menú con ADR-100 · Enm. 1:
    ya no son lugares, son de **una** materia, y por eso llevan su cursada. Sin
    ella el id sería `UX06`/`UX07`, que `esFichaDeSeccion` descarta como ficha
    vieja de sección.
  */
  UX06: { tipo: "bitacora", parametro: ctaRegistry["CTA-009"].parametro?.nombre ?? null },
  UX07: { tipo: "modo-examen", parametro: ctaRegistry["CTA-019"].parametro?.nombre ?? null },
  CLASE: { tipo: "clase", parametro: "clase", sinParametroEsElNodo: true },
};

/** A dónde se vuelve cuando no hay una sección de la que se salió. */
const RUTA_BASE = nodos.UX01.ruta ?? "/hoy";

/**
 * El objeto de la pantalla actual, listo para guardarse. `null` ⇒ **no lleva
 * controles**.
 *
 * Devuelve `null` en tres casos, y los tres son *omitir, no inventar*:
 *
 * - la pantalla es una sección del menú, sin nada abierto adentro;
 * - falta el parámetro que la identifica —`/materia` pelada, en el Track A—, y
 *   un id inventado sería una ficha que no vuelve a ningún lado;
 * - la pantalla necesita un nombre y todavía no llegó: la ficha no se guarda
 *   como *«Materia»* mientras carga.
 *
 * @param nombre El que la pantalla declara con `useMigaDelObjeto`.
 */
export function objetoEnPantalla(
  nodo: NodoId,
  ruta: string,
  nombre: string | null,
): ObjetoPorAbrir | null {
  const regla = PANTALLAS_DE_OBJETO[nodo];
  if (regla === undefined) return null;

  let entidadId: string = nodo;
  if (regla.parametro !== null) {
    const valor = new URLSearchParams(ruta.split("?")[1] ?? "").get(regla.parametro);
    if (valor) entidadId = valor;
    else if (!regla.sinParametroEsElNodo) return null;
  }

  const propio = (nombre ?? "").trim();
  // Sin parámetro, la pantalla **es** su nodo y su nombre es el de la miga.
  const etiqueta = propio !== "" ? propio : regla.parametro === null ? etiquetaDeMiga(nodo) : "";
  if (etiqueta === "") return null;

  return {
    tipo: regla.tipo,
    entidadId,
    etiqueta,
    /*
      ⚠️ **Sin contexto.** El de una materia empujaba su nombre a `ANALISI…`
      (Enmienda 5), y el de un video sería *Formación*, que ya dice la miga.
    */
    etiquetaSecundaria: null,
    // Sin las ventanas de la URL: la ruta es la del objeto, no la del escritorio.
    ruta: rutaConPaneles(ruta, []),
  };
}

/**
 * La pantalla que queda **detrás** cuando se achica a ventana.
 *
 * Es la sección del menú de la que cuelga el objeto: una materia se achica sobre
 * *Materias*, un video sobre *Formación*, un paso del protocolo sobre *Modo
 * Examen*. Lo que no cuelga de ninguna —el flujo de la acción, que empieza en sí
 * mismo— vuelve a `Hoy`, que nunca es un callejón.
 */
export function fondoDe(nodo: NodoId): string {
  const raiz = cadenaDe(nodo)[0];
  if (raiz !== undefined && seccionesDelMenu.has(raiz)) return nodos[raiz].ruta ?? RUTA_BASE;
  return RUTA_BASE;
}

/** A dónde lleva minimizar: siempre a `Hoy`, como pidió el owner. */
export const RUTA_AL_MINIMIZAR = RUTA_BASE;

/**
 * ¿Es la ficha de una sección, guardada por la Enmienda 6?
 *
 * ⚠️ **Existen en el navegador de quien ya la usó**, y no se pueden dejar: son
 * justo las fichas que la Enmienda 7 dice que no tienen que estar. Se reconocen
 * porque su id es el de un nodo del menú (`formacion:FORMACION`,
 * `modo-examen:UX07`); una materia o un video nunca tienen ese id.
 */
export function esFichaDeSeccion(objeto: Pick<ObjetoAbierto, "entidadId">): boolean {
  return seccionesDelMenu.has(objeto.entidadId as NodoId) || SECCIONES_RETIRADAS.has(objeto.entidadId as NodoId);
}

/**
 * Las que **fueron** secciones y salieron del menú — ADR-100 · Enmienda 1.
 *
 * ⚠️ Sus fichas viejas (`progreso:UX06`, `modo-examen:UX07`) siguen en el
 * navegador de quien usó la Enmienda 6: sin esto dejarían de reconocerse y se
 * quedarían en la barra para siempre.
 */
const SECCIONES_RETIRADAS = new Set<NodoId>(["UX06", "UX07"]);

/**
 * El objeto de una materia, para abrirla **en ventana** desde el buscador.
 *
 * La ruta la pone quien llama, porque sale del registro canónico de CTAs y **eso
 * no se duplica acá**.
 */
export function objetoDeMateria(
  cursadaId: string,
  nombre: string,
  ruta: string,
): ObjetoPorAbrir {
  return {
    tipo: "materia",
    entidadId: cursadaId,
    etiqueta: nombre,
    etiquetaSecundaria: null,
    ruta,
  };
}
