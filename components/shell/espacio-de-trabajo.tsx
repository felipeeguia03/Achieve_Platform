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
 * ## Abrir es ir a la materia; la ventana viene después — Enmienda 3
 *
 * ⚠️ **Cambió respecto de la Enmienda 1, y lo pidió el owner.** Abrir una
 * materia **lleva a su superficie completa**, como antes de la Enmienda 1: es la
 * pantalla donde se trabaja, y meterla en una ventana chica desde el primer
 * gesto era resolver el segundo problema antes del primero.
 *
 * La ventana es lo que se hace **después**, y por dos caminos: el control de
 * minimizar de la superficie, o la ficha de la barra. **Y hay tantas ventanas
 * como fichas desplegadas**, no una.
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
  activar as activarEnDominio,
  alternarDespliegue,
  cerrar as cerrarEnDominio,
  cerrarOtros as cerrarOtrosEnDominio,
  cerrarTodos as cerrarTodosEnDominio,
  claveAlFrente,
  claveEnRuta,
  clavesDesplegadas,
  desplegar,
  encuadrarObjeto,
  minimizarPanelDe,
  mover as moverEnDominio,
  objetoDe,
  objetosDe,
  reordenar as reordenarEnDominio,
  rutaConPaneles,
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

/**
 * A dónde se vuelve al minimizar una superficie que no se sabe de dónde vino.
 *
 * `Hoy` es la pantalla que contesta *"¿qué necesito hacer ahora?"*: es el único
 * destino que nunca es un callejón. **No se inventa una ruta**: es la del menú.
 */
const RUTA_BASE = "/hoy";

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
   * Las ventanas desplegadas, **en orden de apilamiento** — Enmienda 3.
   *
   * La última es la de adelante. Vacío ⇒ todas minimizadas o ninguna abierta,
   * que **para el estudiante es lo mismo**: la barra es lo que queda.
   */
  paneles: readonly ObjetoAbierto[];
  /**
   * El objeto cuya **superficie completa** se está mirando. `null` ⇒ la pantalla
   * actual no es la de ningún objeto abierto, y entonces no hay ventana que
   * minimizar.
   */
  enSuperficie: ObjetoAbierto | null;
  /** Abre el objeto **y va a su superficie**: la materia, entera — Enmienda 3. */
  abrir: (objeto: ObjetoPorAbrir) => void;
  activar: (clave: string) => void;
  /** Despliega la ventana del objeto, o la minimiza si ya estaba desplegada. */
  alternarPanel: (clave: string) => void;
  /** Minimiza **esa** ventana. El objeto sigue en la barra. */
  minimizarPanel: (clave: string) => void;
  /** Sube una ventana al frente del apilamiento. */
  traerAlFrente: (clave: string) => void;
  /** Lleva el objeto a su superficie completa y se lleva su ventana. */
  verComoPagina: (clave: string) => void;
  /**
   * Minimiza la **superficie** que se está mirando — Enmienda 3.
   *
   * El objeto queda en la barra y la pantalla vuelve de donde vino. Es el gesto
   * de una ventana que baja al dock: no se cierra nada.
   */
  minimizarSuperficie: () => void;
  /** Convierte la superficie que se está mirando en una ventana sobre su origen. */
  superficieAVentana: () => void;
  /** Cierra el objeto de la superficie que se está mirando y vuelve de donde vino. */
  cerrarSuperficie: () => void;
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
  paneles: [],
  enSuperficie: null,
  abrir: NADA,
  activar: NADA,
  alternarPanel: NADA,
  minimizarPanel: NADA,
  traerAlFrente: NADA,
  verComoPagina: NADA,
  minimizarSuperficie: NADA,
  superficieAVentana: NADA,
  cerrarSuperficie: NADA,
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
   * De qué pantalla salió cada objeto, para volver ahí al minimizarlo.
   *
   * ⚠️ **Es estado de sesión y NO se persiste**, a diferencia del marco. El
   * marco es *cómo* quedó la ventana —algo que el estudiante eligió y espera
   * encontrar mañana—; de dónde vino es *qué estaba haciendo hace un minuto*, y
   * restaurarlo de una sesión anterior mandaría a alguien a una pantalla que
   * dejó ayer. Sin origen se vuelve a `Hoy`, que nunca es un callejón.
   */
  const origen = useRef<Map<string, string>>(new Map());
  const origenDe = useCallback(
    (clave: string) => origen.current.get(clave) ?? RUTA_BASE,
    [],
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
   * **El apilamiento se DERIVA de la URL; no se guarda** — requisito 1 y 2 del
   * multiventana, y la razón por la que atrás y adelante funcionan solos.
   *
   * ⚠️ **La primera versión sincronizaba el activo con un efecto, y estaba
   * mal.** Un `setState` dentro de un efecto encadena renders —el lint lo
   * rechaza, y con razón— pero el problema de fondo era peor: había **dos
   * fuentes de verdad** sobre qué está activo, la URL y el estado, y cualquier
   * navegación que no pasara por la barra las dejaba en desacuerdo.
   *
   * Derivándolo hay una sola, y con la Enmienda 3 eso vale para **cuántas
   * ventanas hay y en qué orden se apilan**: compartir la URL comparte el
   * escritorio.
   */
  const clavesPanel = useMemo(
    () => clavesDesplegadas(espacio, rutaActual),
    [espacio, rutaActual],
  );

  /**
   * ⚠️ **La ventana de adelante manda sobre la ruta.** Con la de Álgebra al
   * frente encima de `Hoy`, el objeto activo es Álgebra: es lo que el estudiante
   * está mirando. Si mandara la ruta, la barra marcaría como activo algo que
   * quedó atrás de las ventanas.
   */
  const claveEnSuperficie = useMemo(
    () => claveEnRuta(espacio, rutaActual),
    [espacio, rutaActual],
  );
  const activo = useMemo(
    () => claveAlFrente(clavesPanel) ?? claveEnSuperficie,
    [clavesPanel, claveEnSuperficie],
  );
  const paneles = useMemo(() => objetosDe(espacio, clavesPanel), [espacio, clavesPanel]);
  const enSuperficie = useMemo(
    () => objetoDe(espacio, claveEnSuperficie),
    [espacio, claveEnSuperficie],
  );
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

      const clave = resultado.espacio.activo;
      /*
        ⚠️ **Se recuerda de dónde salió, sin las ventanas de la URL.** Guardar
        `?abierto=…` como origen haría que minimizar la superficie repusiera
        ventanas que el estudiante ya había bajado.
      */
      if (clave !== null) origen.current.set(clave, rutaConPaneles(rutaActual, []));

      /*
        **Abrir lleva a la materia, entera** — Enmienda 3. Es la pantalla donde
        se trabaja; la ventana chica es para consultar, y se elige después.
      */
      router.push(objeto.ruta);
    },
    [espacio, router, rutaActual],
  );

  /** Activar es ir a la superficie del objeto. La ventana la maneja la ficha. */
  const activar = useCallback(
    (clave: string) => {
      const objeto = espacio.objetos.find((o) => o.clave === clave);
      if (!objeto) return;
      setEspacio(activarEnDominio(espacio, clave, new Date().toISOString()));
      router.push(objeto.ruta);
    },
    [espacio, router],
  );

  /**
   * El gesto de la ficha: despliega su ventana, o la minimiza si ya estaba.
   *
   * ⚠️ **No saca las otras.** Es la Enmienda 3 entera: dos o tres fichas
   * desplegadas son dos o tres ventanas, y tocar la cuarta no baja las tres
   * primeras. Un escritorio donde abrir algo cierra lo anterior no es un
   * escritorio.
   */
  const alternarPanel = useCallback(
    (clave: string) => {
      if (!espacio.objetos.some((o) => o.clave === clave)) return;
      setEspacio(activarEnDominio(espacio, clave, new Date().toISOString()));
      router.push(rutaConPaneles(rutaActual, alternarDespliegue(clavesPanel, clave)));
    },
    [espacio, clavesPanel, rutaActual, router],
  );

  const minimizarPanel = useCallback(
    (clave: string) => {
      router.push(rutaConPaneles(rutaActual, minimizarPanelDe(clavesPanel, clave)));
    },
    [clavesPanel, rutaActual, router],
  );

  /**
   * Subir una ventana al frente.
   *
   * ⚠️ **`replace`, no `push`, y es la diferencia entre un historial y un
   * basurero.** Tocar tres ventanas por turno son tres entradas de historial que
   * no llevan a ninguna parte: el botón atrás tendría que apretarse quince veces
   * para salir de una pantalla. Cambiar el apilamiento **no es navegar**.
   */
  const traerAlFrente = useCallback(
    (clave: string) => {
      if (claveAlFrente(clavesPanel) === clave) return;
      if (!clavesPanel.includes(clave)) return;
      router.replace(rutaConPaneles(rutaActual, desplegar(clavesPanel, clave)));
    },
    [clavesPanel, rutaActual, router],
  );

  /**
   * A la superficie completa.
   *
   * ⚠️ **Y se lleva su ventana.** Dejarla desplegada encima de su propia
   * superficie sería la misma materia dos veces en la misma pantalla, una tapando
   * a la otra.
   */
  const verComoPagina = useCallback(
    (clave: string) => {
      const objeto = espacio.objetos.find((o) => o.clave === clave);
      if (!objeto) return;
      setEspacio(activarEnDominio(espacio, clave, new Date().toISOString()));
      router.push(rutaConPaneles(objeto.ruta, minimizarPanelDe(clavesPanel, clave)));
    },
    [espacio, clavesPanel, router],
  );

  /**
   * Minimizar la superficie — el gesto que pidió el owner en la Enmienda 3.
   *
   * La materia **no se cierra**: baja a la barra y la pantalla vuelve de donde
   * vino. Es exactamente lo que hace el botón del medio de una ventana de
   * escritorio, y la ficha de la barra es el dock donde queda.
   */
  const minimizarSuperficie = useCallback(() => {
    if (claveEnSuperficie === null) return;
    router.push(rutaConPaneles(origenDe(claveEnSuperficie), clavesPanel));
  }, [claveEnSuperficie, clavesPanel, origenDe, router]);

  /** La superficie se vuelve una ventana sobre la pantalla de la que salió. */
  const superficieAVentana = useCallback(() => {
    if (claveEnSuperficie === null) return;
    router.push(
      rutaConPaneles(origenDe(claveEnSuperficie), desplegar(clavesPanel, claveEnSuperficie)),
    );
  }, [claveEnSuperficie, clavesPanel, origenDe, router]);

  /**
   * Cerrar desde la superficie.
   *
   * ⚠️ **Vuelve al origen, no al vecino.** Quedarse en la pantalla de un objeto
   * que se acaba de cerrar dejaría la barra sin la ficha y la URL con la
   * materia: la pantalla seguiría entera y **nada explicaría por qué la ficha se
   * fue**.
   */
  const cerrarSuperficie = useCallback(() => {
    if (claveEnSuperficie === null) return;
    setEspacio(cerrarEnDominio(espacio, claveEnSuperficie));
    origen.current.delete(claveEnSuperficie);
    router.push(
      rutaConPaneles(origenDe(claveEnSuperficie), minimizarPanelDe(clavesPanel, claveEnSuperficie)),
    );
  }, [espacio, claveEnSuperficie, clavesPanel, origenDe, router]);

  /**
   * Cerrar.
   *
   * ⚠️ **Navega sólo si se cerró el que se está mirando.** §10.7 pide activar el
   * vecino más reciente, y con el activo derivado de la URL «activar» quiere
   * decir navegar. Cerrar un objeto **de fondo** no mueve a nadie de pantalla:
   * el que ordena la barra no pidió irse a ningún lado.
   *
   * ⚠️ **Cerrar un objeto con ventana desplegada se lleva su ventana y sólo la
   * suya** — Enmienda 3. Las otras siguen donde estaban: no son de este objeto.
   */
  const cerrar = useCallback(
    (clave: string) => {
      const vecino = vecinoAlCerrar(espacio, clave);
      setEspacio(cerrarEnDominio(espacio, clave));
      origen.current.delete(clave);

      const quedan = minimizarPanelDe(clavesPanel, clave);

      if (clavesPanel.includes(clave)) {
        router.push(rutaConPaneles(rutaActual, quedan));
        return;
      }
      // Sin ventana propia, cerrar el que se está mirando lleva al vecino.
      if (clave === claveEnSuperficie && vecino) {
        router.push(rutaConPaneles(vecino.ruta, quedan));
      }
    },
    [espacio, claveEnSuperficie, clavesPanel, rutaActual, router],
  );

  const cerrarOtros = useCallback(
    (clave: string) => {
      setEspacio((actual) => cerrarOtrosEnDominio(actual, clave));
      // Las ventanas de los que se fueron **no pueden quedar**: serían huérfanas.
      const quedan = clavesPanel.filter((c) => c === clave);
      if (quedan.length !== clavesPanel.length) {
        router.push(rutaConPaneles(rutaActual, quedan));
      }
    },
    [clavesPanel, rutaActual, router],
  );

  const cerrarTodos = useCallback(() => {
    setEspacio(cerrarTodosEnDominio());
    if (clavesPanel.length > 0) router.push(rutaConPaneles(rutaActual, []));
  }, [clavesPanel, rutaActual, router]);

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
      paneles,
      enSuperficie,
      abrir,
      activar,
      alternarPanel,
      minimizarPanel,
      traerAlFrente,
      verComoPagina,
      minimizarSuperficie,
      superficieAVentana,
      cerrarSuperficie,
      encuadrar,
      cerrar,
      cerrarOtros,
      cerrarTodos,
      reordenar,
      mover,
    }),
    [
      espacioVisible, listo, desalojado, paneles, enSuperficie, abrir, activar,
      alternarPanel, minimizarPanel, traerAlFrente, verComoPagina, minimizarSuperficie,
      superficieAVentana, cerrarSuperficie, encuadrar, cerrar, cerrarOtros, cerrarTodos,
      reordenar, mover,
    ],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
