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
 * ## Activar no es un re-render global
 *
 * Activar un objeto hace `router.push`, y el `pathname` que vuelve reactiva el
 * objeto que corresponde. **El estado no se duplica**: no hay un «activo» que
 * la barra mantenga por su cuenta y que pueda quedar en desacuerdo con la URL.
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
  activar as activarEnDominio,
  cerrar as cerrarEnDominio,
  cerrarOtros as cerrarOtrosEnDominio,
  cerrarTodos as cerrarTodosEnDominio,
  mover as moverEnDominio,
  reordenar as reordenarEnDominio,
  claveDelPanel,
  claveEnRuta,
  encuadrarObjeto,
  objetoDe,
  rutaConPanel,
  vecinoAlCerrar,
  validarContra,
  type EspacioDeTrabajo,
  type ObjetoAbierto,
  type ObjetoPorAbrir,
} from "@/lib/domain/espacio-de-trabajo";
import type { Marco } from "@/lib/domain/marco-de-panel";
import { rutaConocida } from "@/lib/navigation";
import { identidadDeSesion } from "@/lib/client/api";
import { guardar, leer } from "@/lib/client/espacio-de-trabajo/persistencia";

export interface ContextoDeEspacio {
  espacio: EspacioDeTrabajo;
  /** `false` ⇒ la memoria todavía no se leyó y **no se dibuja nada**. */
  listo: boolean;
  /**
   * El objeto que el límite duro sacó, para avisarlo. Se limpia solo.
   * `null` ⇒ no hay nada que avisar.
   */
  desalojado: ObjetoAbierto | null;
  /**
   * El objeto desplegado en el panel — ADR-088, Enmienda 1. `null` ⇒ minimizado
   * o cerrado, que **para el estudiante es lo mismo**: la barra es lo que queda.
   */
  panel: ObjetoAbierto | null;
  abrir: (objeto: ObjetoPorAbrir) => void;
  activar: (clave: string) => void;
  /** Despliega el panel del objeto, o lo minimiza si ya estaba desplegado. */
  alternarPanel: (clave: string) => void;
  /** Minimiza: el panel se guarda, **el objeto sigue en la barra**. */
  minimizarPanel: () => void;
  /** Lleva el objeto a su superficie completa y cierra el panel. */
  verComoPagina: (clave: string) => void;
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
 * Abre o activa un objeto académico desde cualquier superficie.
 *
 * Es la acción reutilizable que pide §10.6: `UX01`, `UX02`, el índice, el mapa
 * de catorce días y la paleta llaman **a esto**, no cada uno a su `router.push`.
 * Duplicar la navegación en cada componente es cómo se llega a que dos lugares
 * abran el mismo objeto de dos formas distintas.
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
  listo: false,
  desalojado: null,
  panel: null,
  abrir: NADA,
  activar: NADA,
  alternarPanel: NADA,
  minimizarPanel: NADA,
  verComoPagina: NADA,
  encuadrar: NADA,
  cerrar: NADA,
  cerrarOtros: NADA,
  cerrarTodos: NADA,
  reordenar: NADA,
  mover: NADA,
};

export function ProveedorDeEspacioDeTrabajo({ children }: { children: React.ReactNode }) {
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
      // Sin identidad el espacio queda en memoria y listo pasa igual: la barra
      // funciona en la sesión, no entre sesiones.
      setEspacio(
        id === null ? ESPACIO_VACIO : validarContra(leer(id), rutaConocida),
      );
      setListo(true);
    });
    return () => {
      vigente = false;
    };
  }, []);

  /**
   * **El objeto activo se DERIVA de la URL; no se guarda** — requisito 2 del
   * multiventana, y la razón por la que atrás y adelante funcionan solos.
   *
   * ⚠️ **La primera versión lo sincronizaba con un efecto, y estaba mal.** Un
   * `setState` dentro de un efecto encadena renders —el lint lo rechaza, y con
   * razón— pero el problema de fondo era peor: había **dos fuentes de verdad**
   * sobre qué está activo, la URL y el estado, y cualquier navegación que no
   * pasara por la barra las dejaba en desacuerdo.
   *
   * Derivándolo hay una sola. El botón atrás del navegador reactiva el objeto
   * correcto **sin que nadie escuche nada**.
   */
  const clavePanel = useMemo(() => claveDelPanel(espacio, rutaActual), [espacio, rutaActual]);

  /**
   * ⚠️ **El panel manda sobre la ruta.** Con la ficha de Álgebra desplegada
   * encima de `Hoy`, el objeto activo es Álgebra: es lo que el estudiante está
   * mirando. Si mandara la ruta, la barra marcaría como activo algo que quedó
   * atrás del panel.
   */
  const activo = useMemo(
    () => clavePanel ?? claveEnRuta(espacio, rutaActual),
    [clavePanel, espacio, rutaActual],
  );
  const panel = useMemo(() => objetoDe(espacio, clavePanel), [espacio, clavePanel]);
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

  const abrir = useCallback(
    (objeto: ObjetoPorAbrir) => {
      const resultado = abrirEnDominio(espacio, objeto, new Date().toISOString());
      setEspacio(resultado.espacio);
      if (resultado.desalojado) setDesalojado(resultado.desalojado);
      /*
        Abrir desde una tarjeta **despliega el panel encima**, sin sacarte de la
        pantalla. Tocar una materia del mapa de 14 días para ver cómo viene no
        debería costarte perder Hoy.
      */
      router.push(rutaConPanel(rutaActual, resultado.espacio.activo));
    },
    [espacio, router, rutaActual],
  );

  /**
   * Activar **despliega el panel**; no navega — ADR-088, Enmienda 1.
   *
   * ⚠️ **Cambió respecto de la primera versión, y a propósito.** Antes tocar una
   * ficha te sacaba de la pantalla en la que estabas: consultar en qué anda
   * Álgebra te costaba perder Hoy y volver. El panel es para consultar sin
   * moverse; ir a la superficie sigue estando, y es `verComoPagina`.
   */
  const activar = useCallback(
    (clave: string) => {
      const objeto = espacio.objetos.find((o) => o.clave === clave);
      if (!objeto) return;
      setEspacio(activarEnDominio(espacio, clave, new Date().toISOString()));
      router.push(rutaConPanel(rutaActual, clave));
    },
    [espacio, router, rutaActual],
  );

  /** Tocar la ficha desplegada la minimiza. Es el gesto que pidió el owner. */
  const alternarPanel = useCallback(
    (clave: string) => {
      if (clavePanel === clave) {
        router.push(rutaConPanel(rutaActual, null));
        return;
      }
      activar(clave);
    },
    [clavePanel, rutaActual, router, activar],
  );

  const minimizarPanel = useCallback(() => {
    router.push(rutaConPanel(rutaActual, null));
  }, [rutaActual, router]);

  /**
   * A la superficie completa.
   *
   * ⚠️ **El panel consulta; la superficie trabaja.** Es la distinción que el
   * software de `docs/diseño/` enuncia en su propia ficha —*"se listan para
   * consultarlas… la cartera sigue siendo la única superficie de trabajo"*— y
   * acá vale igual: comprometerse, empezar y entregar pasan en `UX02`–`UX05`.
   */
  const verComoPagina = useCallback(
    (clave: string) => {
      const objeto = espacio.objetos.find((o) => o.clave === clave);
      if (!objeto) return;
      setEspacio(activarEnDominio(espacio, clave, new Date().toISOString()));
      router.push(objeto.ruta);
    },
    [espacio, router],
  );

  /**
   * Cerrar.
   *
   * ⚠️ **Navega sólo si se cerró el que se está mirando.** §10.7 pide activar el
   * vecino más reciente, y con el activo derivado de la URL «activar» quiere
   * decir navegar. Cerrar un objeto **de fondo** no mueve a nadie de pantalla:
   * el que ordena la barra no pidió irse a ningún lado.
   *
   * Sin vecinos se conserva la ruta actual, que es la otra salida que §10.7
   * admite. **Nunca queda una pantalla rota.**
   */
  const cerrar = useCallback(
    (clave: string) => {
      const vecino = vecinoAlCerrar(espacio, clave);
      setEspacio(cerrarEnDominio(espacio, clave));

      // Cerrar el objeto del panel **se lleva el panel**: una ventana de algo que
      // ya no está abierto es una ventana huérfana.
      if (clave === clavePanel) {
        router.push(rutaConPanel(rutaActual, vecino ? vecino.clave : null));
        return;
      }
      // Sin panel, cerrar el que se está mirando lleva al vecino, como antes.
      if (clavePanel === null && clave === activo && vecino) router.push(vecino.ruta);
    },
    [espacio, activo, clavePanel, rutaActual, router],
  );

  const cerrarOtros = useCallback((clave: string) => {
    setEspacio((actual) => cerrarOtrosEnDominio(actual, clave));
  }, []);

  const cerrarTodos = useCallback(() => {
    setEspacio(cerrarTodosEnDominio());
  }, []);

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
      listo,
      desalojado,
      panel,
      abrir,
      activar,
      alternarPanel,
      minimizarPanel,
      verComoPagina,
      encuadrar,
      cerrar,
      cerrarOtros,
      cerrarTodos,
      reordenar,
      mover,
    }),
    [
      espacioVisible, listo, desalojado, panel, abrir, activar, alternarPanel,
      minimizarPanel, verComoPagina, encuadrar, cerrar, cerrarOtros, cerrarTodos, reordenar, mover,
    ],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
