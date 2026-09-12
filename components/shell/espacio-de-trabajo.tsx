"use client";

/**
 * El estado del espacio de trabajo — [ADR-088](../../docs/decisions.md#adr-088).
 *
 * Junta las tres piezas y **no agrega reglas**: las reglas están en
 * `lib/domain/espacio-de-trabajo.ts`, la memoria en
 * `lib/client/espacio-de-trabajo/persistencia.ts`, y acá viven los efectos —
 * identidad, hidratación, ruta y guardado.
 *
 * ## Hidratación sin parpadeo
 *
 * El HTML del servidor **no tiene** los objetos: no hay `localStorage` durante
 * el SSR. Si el primer render del cliente los dibujara, React vería dos árboles
 * distintos. Por eso `listo` arranca en `false` y la barra **no se dibuja**
 * hasta que la memoria se leyó: mostrar objetos equivocados y corregirlos un
 * frame después es peor que esperar un frame (`P-12`, *nada salta al cargar*).
 *
 * ## Entrar no guarda nada; minimizar sí — Enmienda 7
 *
 * ⚠️ **Cambió respecto de la Enmienda 6, y lo pidió el owner.** Entrar a una
 * pantalla ya no deja su ficha: la barra se llenaba sola y se volvía un
 * historial. Ahora un objeto entra a la barra **por un gesto**: minimizar la
 * pantalla, achicarla a ventana o elegir una materia en el buscador.
 *
 * La pantalla que se está mirando puede ser la de un objeto **sin estar
 * guardado** — `enPantalla` —, y es eso lo que decide si hay controles. Estar
 * guardado lo decide el espacio.
 *
 * ## Activar no es un re-render global
 *
 * El objeto activo se deriva de la URL: del apilamiento si hay ventanas, y del
 * `pathname` si no. **El estado no se duplica**: no hay un «activo» que la barra
 * mantenga por su cuenta y que pueda quedar en desacuerdo con la URL.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  ESPACIO_VACIO,
  abrir as abrirEnDominio,
  alternarDespliegue,
  cerrar as cerrarEnDominio,
  cerrarOtros as cerrarOtrosEnDominio,
  cerrarTodos as cerrarTodosEnDominio,
  claveAlFrente,
  claveDe,
  claveEnRuta,
  clavesDesplegadas,
  desplegar,
  encuadrarObjeto,
  minimizarPanelDe,
  mover as moverEnDominio,
  objetoDe,
  objetosDe,
  activar as activarEnDominio,
  reordenar as reordenarEnDominio,
  retener,
  rutaConPaneles,
  sinLaDeLaSuperficie,
  validarContra,
  type EspacioDeTrabajo,
  type ObjetoAbierto,
  type ObjetoPorAbrir,
} from "@/lib/domain/espacio-de-trabajo";
import type { Marco } from "@/lib/domain/marco-de-panel";
import { nodoIds, nodos, rutaConocida } from "@/lib/navigation";
import {
  RUTA_AL_MINIMIZAR,
  esFichaDeSeccion,
  fondoDe,
  objetoEnPantalla,
} from "@/lib/navigation/objeto-en-pantalla";
import { identidadDeSesion } from "@/lib/client/api";
import { guardar, leer } from "@/lib/client/espacio-de-trabajo/persistencia";

export interface ContextoDeEspacio {
  espacio: EspacioDeTrabajo;
  /** `false` ⇒ **no hay espacio de trabajo montado** y todo lo de abajo es inerte. */
  montado: boolean;
  /** `false` ⇒ la memoria todavía no se leyó y **no se dibuja nada**. */
  listo: boolean;
  /**
   * El objeto que el límite duro sacó, para avisarlo. Se limpia solo.
   * `null` ⇒ no hay nada que avisar.
   */
  desalojado: ObjetoAbierto | null;
  /**
   * Las ventanas desplegadas, **en orden de apilamiento** — Enmienda 3.
   *
   * La última es la de adelante. Vacío ⇒ todas minimizadas o ninguna abierta,
   * que **para el estudiante es lo mismo**: la barra es lo que queda.
   */
  paneles: readonly ObjetoAbierto[];
  /**
   * El objeto de la pantalla que se está mirando **entera**, esté guardado o no
   * — Enmienda 7. `null` ⇒ es una sección del menú, o todavía no se sabe qué
   * objeto es, y **no hay controles**.
   */
  enPantalla: ObjetoPorAbrir | null;
  /**
   * Abre el objeto **como ventana, sin moverse de pantalla** — Enmienda 6.
   *
   * Es lo que hace el buscador: elegís una materia y aparece encima de lo que
   * estabas haciendo, con su ficha en la barra.
   */
  abrirEnVentana: (objeto: ObjetoPorAbrir) => void;
  /** Despliega la ventana del objeto, o la minimiza si ya estaba desplegada. */
  alternarPanel: (clave: string) => void;
  /** Minimiza **esa** ventana. El objeto sigue en la barra. */
  minimizarPanel: (clave: string) => void;
  /** Sube una ventana al frente del apilamiento. */
  traerAlFrente: (clave: string) => void;
  /** Expande la ventana a la pantalla del objeto, y se lleva la ventana. */
  verComoPagina: (clave: string) => void;
  /**
   * Minimiza la pantalla que se está mirando — Enmienda 7.
   *
   * **La guarda en la barra y lleva a `Hoy`.** Es el único camino, junto con
   * achicar, por el que algo que se abrió adentro de una sección queda a mano.
   */
  minimizarPantalla: () => void;
  /** La guarda en la barra y la vuelve ventana sobre la sección de la que cuelga. */
  achicarPantalla: () => void;
  /** Guarda dónde quedó la ventana de un objeto — Enmienda 2. */
  encuadrar: (clave: string, marco: Marco) => void;
  cerrar: (clave: string) => void;
  cerrarOtros: (clave: string) => void;
  cerrarTodos: () => void;
  reordenar: (clave: string, destino: number) => void;
  mover: (clave: string, direccion: -1 | 1) => void;
}

const Contexto = createContext<ContextoDeEspacio | null>(null);

/**
 * El espacio de trabajo, desde cualquier pantalla.
 *
 * Fuera del proveedor devuelve un espacio vacío inerte: `/login` y el alta no lo
 * montan, y un hook que explota ahí obligaría a cada pantalla a preguntarse si
 * está adentro.
 */
export function useEspacioDeTrabajo(): ContextoDeEspacio {
  const ctx = useContext(Contexto);
  return ctx ?? INERTE;
}

const NADA = () => {};
const INERTE: ContextoDeEspacio = {
  espacio: ESPACIO_VACIO,
  montado: false,
  listo: false,
  desalojado: null,
  paneles: [],
  enPantalla: null,
  abrirEnVentana: NADA,
  alternarPanel: NADA,
  minimizarPanel: NADA,
  traerAlFrente: NADA,
  verComoPagina: NADA,
  minimizarPantalla: NADA,
  achicarPantalla: NADA,
  encuadrar: NADA,
  cerrar: NADA,
  cerrarOtros: NADA,
  cerrarTodos: NADA,
  reordenar: NADA,
  mover: NADA,
};

export function ProveedorDeEspacioDeTrabajo({
  nombreEnPantalla = null,
  children,
}: {
  /**
   * El nombre del objeto que la pantalla abrió, si abrió uno. Lo declara ella
   * con `useMigaDelObjeto` —el mismo que nombra la miga—, porque llega en la
   * respuesta de la API y el Shell no lo conoce antes.
   */
  nombreEnPantalla?: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const [espacio, setEspacio] = useState<EspacioDeTrabajo>(ESPACIO_VACIO);
  const [identidad, setIdentidad] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [desalojado, setDesalojado] = useState<ObjetoAbierto | null>(null);

  // La ruta completa, para sincronizar el activo. `useSearchParams` obliga a
  // Suspense arriba; el Shell ya lo provee.
  const consulta = search.toString();
  const rutaActual = useMemo(
    () => (consulta ? `${pathname}?${consulta}` : pathname),
    [pathname, consulta],
  );

  /** Qué nodo es la pantalla. Sale del camino: el grafo ya lo sabe. */
  const nodo = useMemo(() => nodoIds.find((id) => nodos[id].ruta === pathname) ?? null, [pathname]);

  /**
   * Quién es. Sin sesión —Track A con `?escenario=`— **no hay memoria**, y eso
   * no es un fallo: es la regla de cero persistencia siguiendo vigente donde
   * ADR-088 no la levantó.
   */
  useEffect(() => {
    let vigente = true;
    void identidadDeSesion().then((id) => {
      if (!vigente) return;
      setIdentidad(id);
      /*
        ⚠️ **Las fichas de sección que dejó la Enmienda 6 se descartan acá.** Están
        en el navegador de quien ya usó la barra, y son justo lo que la Enmienda 7
        dice que no tiene que estar: sin este filtro, la barra seguiría llena de
        *Hoy* y *Progreso* hasta que alguien las cerrara a mano.
      */
      setEspacio(
        id === null
          ? ESPACIO_VACIO
          : retener(validarContra(leer(id), rutaConocida), (o) => !esFichaDeSeccion(o)),
      );
      setListo(true);
    });
    return () => {
      vigente = false;
    };
  }, []);

  /**
   * Lo que dice la URL, **crudo** — el apilamiento se DERIVA de la URL; no se
   * guarda (requisitos 1 y 2 del multiventana).
   *
   * ⚠️ **No es lo que se dibuja, y la diferencia es la Enmienda 6.** Acá está
   * también la ventana del objeto cuya pantalla se está mirando, que no se
   * dibuja pero **tampoco se pierde**. Las acciones que arman URLs trabajan sobre
   * esta lista; lo que se dibuja sale de la de abajo.
   */
  const clavesEnUrl = useMemo(
    () => clavesDesplegadas(espacio, rutaActual),
    [espacio, rutaActual],
  );

  /** La clave del objeto **guardado** cuya pantalla se está mirando. */
  const claveEnSuperficie = useMemo(
    () => claveEnRuta(espacio, rutaActual),
    [espacio, rutaActual],
  );

  /**
   * Las que **se dibujan** — Enmienda 6: *"si una pestaña se está mostrando
   * atrás, no puede ser abierta simultáneamente"*. La regla vive en el dominio
   * (`sinLaDeLaSuperficie`) y acá sólo se aplica.
   */
  const clavesPanel = useMemo(
    () => sinLaDeLaSuperficie(clavesEnUrl, claveEnSuperficie),
    [clavesEnUrl, claveEnSuperficie],
  );
  const activo = useMemo(
    () => claveAlFrente(clavesPanel) ?? claveEnSuperficie,
    [clavesPanel, claveEnSuperficie],
  );
  const paneles = useMemo(() => objetosDe(espacio, clavesPanel), [espacio, clavesPanel]);

  /**
   * El objeto de la pantalla, **guardado o no**.
   *
   * ⚠️ **Si ya está guardado, manda el guardado.** Su etiqueta es la que tiene la
   * ficha, y la pantalla puede no haber declarado todavía su nombre: sin esto,
   * los controles desaparecerían un instante cada vez que se vuelve a la
   * materia desde su ventana.
   */
  const enPantalla = useMemo<ObjetoPorAbrir | null>(() => {
    const guardado = objetoDe(espacio, claveEnSuperficie);
    if (guardado) return guardado;
    return nodo === null ? null : objetoEnPantalla(nodo, rutaActual, nombreEnPantalla);
  }, [espacio, claveEnSuperficie, nodo, rutaActual, nombreEnPantalla]);

  const espacioVisible = useMemo<EspacioDeTrabajo>(
    () => ({ objetos: espacio.objetos, activo }),
    [espacio.objetos, activo],
  );

  // Guardar. Sólo con identidad, y sólo después de leer: un guardado antes de
  // la lectura pisaría con el vacío del SSR lo que el estudiante tenía.
  useEffect(() => {
    if (!listo || identidad === null) return;
    guardar(identidad, { objetos: espacio.objetos, activo });
  }, [espacio.objetos, activo, identidad, listo]);

  // El aviso de desalojo se retira solo: es información, no una decisión que el
  // estudiante tenga que despachar.
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (desalojado === null) return;
    reloj.current = setTimeout(() => setDesalojado(null), 6000);
    return () => {
      if (reloj.current) clearTimeout(reloj.current);
    };
  }, [desalojado]);

  /**
   * Guarda un objeto en la barra y devuelve su clave. Ya guardado, sólo lo activa.
   *
   * ⚠️ **Es el único lugar donde algo entra a la barra**, y lo llaman tres gestos:
   * minimizar, achicar y el buscador. Entrar a una pantalla no pasa por acá.
   */
  const guardarEnBarra = useCallback(
    (objeto: ObjetoPorAbrir): string => {
      const resultado = abrirEnDominio(espacio, objeto, new Date().toISOString());
      setEspacio(resultado.espacio);
      if (resultado.desalojado) setDesalojado(resultado.desalojado);
      return claveDe(objeto.tipo, objeto.entidadId);
    },
    [espacio],
  );

  /**
   * Abrir **sin moverse de pantalla** — Enmienda 6, el gesto del buscador.
   *
   * ⚠️ **`push` y no `replace`, a diferencia de traer al frente.** Abrir algo
   * *sí* es navegar: el estudiante quiere poder deshacerlo con el botón atrás.
   *
   * ⚠️ **Si la ventana cae sobre su propia pantalla, no se dibuja** —es la regla
   * de un objeto, un lugar— y lo que queda es la ficha en la barra.
   */
  const abrirEnVentana = useCallback(
    (objeto: ObjetoPorAbrir) => {
      const clave = guardarEnBarra(objeto);
      router.push(rutaConPaneles(rutaActual, desplegar(clavesEnUrl, clave)));
    },
    [guardarEnBarra, clavesEnUrl, rutaActual, router],
  );

  /**
   * El gesto de la ficha: despliega su ventana, o la minimiza si ya estaba.
   *
   * ⚠️ **No saca las otras.** Es la Enmienda 3 entera: dos o tres fichas
   * desplegadas son dos o tres ventanas, y tocar la cuarta no baja las tres
   * primeras.
   */
  const alternarPanel = useCallback(
    (clave: string) => {
      if (!espacio.objetos.some((o) => o.clave === clave)) return;

      /*
        ⚠️ **La ficha del objeto que se está mirando entero minimiza la
        pantalla** — Enmienda 6. Su ventana no puede desplegarse: ya está
        ocupando la pantalla. Termina en el mismo lugar que el botón de
        minimizar: la ficha en la barra y `Hoy` adelante (Enmienda 7).
      */
      if (clave === claveEnSuperficie) {
        router.push(rutaConPaneles(RUTA_AL_MINIMIZAR, clavesEnUrl));
        return;
      }

      setEspacio(activarEnDominio(espacio, clave, new Date().toISOString()));
      router.push(rutaConPaneles(rutaActual, alternarDespliegue(clavesEnUrl, clave)));
    },
    [espacio, claveEnSuperficie, clavesEnUrl, rutaActual, router],
  );

  const minimizarPanel = useCallback(
    (clave: string) => {
      router.push(rutaConPaneles(rutaActual, minimizarPanelDe(clavesEnUrl, clave)));
    },
    [clavesEnUrl, rutaActual, router],
  );

  /**
   * Subir una ventana al frente.
   *
   * ⚠️ **`replace`, no `push`, y es la diferencia entre un historial y un
   * basurero.** Cambiar el apilamiento **no es navegar**.
   */
  const traerAlFrente = useCallback(
    (clave: string) => {
      if (claveAlFrente(clavesPanel) === clave) return;
      if (!clavesPanel.includes(clave)) return;
      router.replace(rutaConPaneles(rutaActual, desplegar(clavesEnUrl, clave)));
    },
    [clavesPanel, clavesEnUrl, rutaActual, router],
  );

  /**
   * Expandir la ventana: **va a la pantalla del objeto, y se lleva su ventana**.
   *
   * Es lo que hacía *«Ver como página»*, que la Enmienda 7 retiró: el botón de
   * expandir hace eso mismo y un segundo control para lo mismo sobraba.
   */
  const verComoPagina = useCallback(
    (clave: string) => {
      const objeto = espacio.objetos.find((o) => o.clave === clave);
      if (!objeto) return;
      setEspacio(activarEnDominio(espacio, clave, new Date().toISOString()));
      router.push(rutaConPaneles(objeto.ruta, minimizarPanelDe(clavesEnUrl, clave)));
    },
    [espacio, clavesEnUrl, router],
  );

  /**
   * Minimizar la pantalla — Enmienda 7: *"lleva a Hoy y guarda la pestaña en la
   * barra de tareas"*.
   *
   * ⚠️ **Se llevan las ventanas de la URL, no las visibles.** La ventana del
   * objeto que se estaba mirando entero está en la primera lista y no en la
   * segunda (Enmienda 6): con las visibles, minimizar **borraría** la ventana
   * que este mismo gesto tiene que devolver.
   */
  const minimizarPantalla = useCallback(() => {
    if (enPantalla === null) return;
    guardarEnBarra(enPantalla);
    router.push(rutaConPaneles(RUTA_AL_MINIMIZAR, clavesEnUrl));
  }, [enPantalla, guardarEnBarra, clavesEnUrl, router]);

  /**
   * Achicar la pantalla: **la guarda y la vuelve ventana** sobre la sección de la
   * que cuelga — una materia sobre *Materias*, un video sobre *Formación*.
   */
  const achicarPantalla = useCallback(() => {
    if (enPantalla === null || nodo === null) return;
    const clave = guardarEnBarra(enPantalla);
    router.push(rutaConPaneles(fondoDe(nodo), desplegar(clavesEnUrl, clave)));
  }, [enPantalla, nodo, guardarEnBarra, clavesEnUrl, router]);

  /**
   * Cerrar.
   *
   * ⚠️ **Cerrar no navega, nunca** — Enmienda 7. Cerrar la ficha de la materia
   * que se está mirando la saca de la barra y **la pantalla se queda**: sigue
   * siendo la materia, con sus controles, sólo que ya no está guardada. Antes
   * llevaba al vecino, y era mover a alguien de pantalla por ordenar la barra.
   *
   * ⚠️ **Cerrar un objeto con ventana desplegada se lleva su ventana y sólo la
   * suya** — Enmienda 3. Las otras siguen donde estaban.
   */
  const cerrar = useCallback(
    (clave: string) => {
      setEspacio(cerrarEnDominio(espacio, clave));
      if (clavesPanel.includes(clave)) {
        router.push(rutaConPaneles(rutaActual, minimizarPanelDe(clavesEnUrl, clave)));
      }
    },
    [espacio, clavesPanel, clavesEnUrl, rutaActual, router],
  );

  const cerrarOtros = useCallback(
    (clave: string) => {
      setEspacio((actual) => cerrarOtrosEnDominio(actual, clave));
      // Las ventanas de los que se fueron **no pueden quedar**: serían huérfanas.
      const quedan = clavesEnUrl.filter((c) => c === clave);
      if (quedan.length !== clavesEnUrl.length) {
        router.push(rutaConPaneles(rutaActual, quedan));
      }
    },
    [clavesEnUrl, rutaActual, router],
  );

  const cerrarTodos = useCallback(() => {
    setEspacio(cerrarTodosEnDominio());
    if (clavesEnUrl.length > 0) router.push(rutaConPaneles(rutaActual, []));
  }, [clavesEnUrl, rutaActual, router]);

  const reordenar = useCallback((clave: string, destino: number) => {
    setEspacio((actual) => reordenarEnDominio(actual, clave, destino));
  }, []);

  const mover = useCallback((clave: string, direccion: -1 | 1) => {
    setEspacio((actual) => moverEnDominio(actual, clave, direccion));
  }, []);

  const encuadrar = useCallback((clave: string, marco: Marco) => {
    setEspacio((actual) => encuadrarObjeto(actual, clave, marco));
  }, []);

  const valor = useMemo<ContextoDeEspacio>(
    () => ({
      espacio: espacioVisible,
      montado: true,
      listo,
      desalojado,
      paneles,
      enPantalla,
      abrirEnVentana,
      alternarPanel,
      minimizarPanel,
      traerAlFrente,
      verComoPagina,
      minimizarPantalla,
      achicarPantalla,
      encuadrar,
      cerrar,
      cerrarOtros,
      cerrarTodos,
      reordenar,
      mover,
    }),
    [
      espacioVisible, listo, desalojado, paneles, enPantalla, abrirEnVentana, alternarPanel,
      minimizarPanel, traerAlFrente, verComoPagina, minimizarPantalla, achicarPantalla,
      encuadrar, cerrar, cerrarOtros, cerrarTodos, reordenar, mover,
    ],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
