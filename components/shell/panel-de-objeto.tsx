"use client";

/**
 * Las ventanas internas del espacio de trabajo — [ADR-088](../../docs/decisions.md#adr-088),
 * Enmiendas 1, 2 y 3.
 *
 * Cada ficha desplegada de la barra es **una ventana**, y **todas existen a la
 * vez**: se apilan, se traen al frente tocándolas, se arrastran, se estiran y se
 * bajan a la barra de a una. La Enmienda 3 es exactamente eso — *"cuando abrís
 * dos o tres de esos cuadros de la barra de pestañas deberían existir todos, y
 * poder acomodarlos"*.
 *
 * ## Por qué esto sube el listón, y no lo baja
 *
 * ADR-019 descartó el multiventana por seis requisitos innegociables. ADR-088 se
 * comprometió a cumplirlos, y con varias ventanas **tres de ellos se ejercitan
 * más fuerte**, no menos:
 *
 * - **1 · URL por ficha.** El escritorio entero vive en `?abierto=<a>,<b>` —y el
 *   orden de la lista **es el apilamiento**—. Se puede compartir con las tres
 *   ventanas puestas, el botón atrás deshace el último gesto y recargar repone
 *   todo. Nada de esto tendría un apilamiento guardado en memoria.
 * - **4 · Jerarquía de `Escape` con dos capas.** `Escape` cierra primero un menú
 *   abierto; sin menú, minimiza **la ventana que tiene el foco**, no todas.
 *   **Nunca cierra el objeto**: cerrar es destructivo y no se hace con una tecla
 *   de escape.
 * - **6 · Límite duro.** Sigue siendo el de los objetos abiertos: **no se agrega
 *   un segundo límite para las ventanas**. Nunca puede haber más ventanas que
 *   objetos, así que el techo ya está puesto y un segundo número sería una regla
 *   inventada.
 *
 * ## ⚠️ Y una que la Enmienda 3 tuvo que retirar: la trampa de foco
 *
 * La Enmienda 1 atrapaba el `Tab` adentro del panel, **y correspondía**: era una
 * ventana modal, con su fondo oscurecido y una sola por vez. Con varias ventanas
 * **no hay nada modal que atrapar**: el fondo se sigue usando, la barra se sigue
 * tocando y `Tab` tiene que poder salir de una ventana y llegar a la otra.
 * Mantener la trampa dejaría al teclado encerrado en la última ventana abierta,
 * que es un defecto de accesibilidad, no una garantía.
 *
 * Lo que **sí** se conserva es la otra mitad, que es la que importa: al abrirse
 * el foco entra a la ventana, y al bajarla vuelve a donde estaba.
 *
 * ## Se maneja como una ventana — Enmienda 2
 *
 * Se arrastra de la barra de título, se redimensiona de sus ocho bordes, se
 * expande y **vuelve al mismo lugar** cuando se la minimiza y se la abre de
 * nuevo. Cada objeto recuerda el suyo.
 *
 * ⚠️ **Toda la aritmética vive en `lib/domain/marco-de-panel.ts`**, que es puro.
 * Acá sólo se traducen eventos de puntero a deltas: topar contra los bordes,
 * respetar el mínimo y restaurar al tamaño previo son **reglas**, y probarlas
 * con un mouse de mentira sería probar el doble.
 *
 * ⚠️ **A menos de 768 px no hay escritorio que acomodar.** Se dibuja **sólo la
 * ventana de adelante**, a pantalla completa. Tres rectángulos apilados en un
 * teléfono no son tres ventanas: son una sola tapando a dos que no se pueden
 * agarrar.
 *
 * ## La ventana ya no es sólo para consultar — Enmienda 6
 *
 * ⚠️ **Cambió, y lo decidió el owner.** Hasta la Enmienda 5 la ventana dibujaba
 * `UX02` y nada más, con la aclaración *"acá sólo se consulta"* al pie; el resto
 * de los objetos ni siquiera tenían vista. Ahora **la ventana dibuja la
 * superficie entera**, la misma que la ruta, con sus CTAs vivas: entregar desde
 * una ventana entrega.
 *
 * Lo que **no** cambió es de quién es la decisión: la precedencia y la CTA única
 * (`I-06`) siguen viviendo en `UX02`–`UX05` y en el registro canónico. La
 * ventana no elige qué CTA mostrar ni inventa destinos — dibuja la pantalla que
 * ya existe, y por eso es **el mismo componente** y no una copia.
 *
 * ⚠️ **Y por eso navegar desde adentro mueve la pantalla de atrás.** Una CTA que
 * lleva a `UX03` lleva a `UX03`: el fondo cambia y la ventana sigue donde
 * estaba. Es lo que hace cualquier escritorio cuando una ventana abre algo en
 * otra; la alternativa —una historia de navegación por ventana— sería un
 * segundo router, y con él una segunda verdad sobre dónde está el estudiante.
 */

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { Semaforo } from "./controles-de-ventana";
import { guardarEnLaFicha, salirDeLaFicha } from "./movimiento";
import { ProveedorDeMigaDelObjeto } from "./miga-del-objeto";
import { VISTA_POR_CAMINO } from "@/components/superficies/registro";
import { useConsultaDeRuta } from "@/components/superficies/consulta";
import { t } from "@/lib/content/es-AR";
import { colorDelObjeto } from "@/lib/domain/color-de-materia";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import {
  alternarExpandido,
  amosaicar,
  areaDe,
  encuadrar,
  marcoInicial,
  mover,
  redimensionar,
  type Area,
  type Borde,
  type Marco,
  type Zona,
} from "@/lib/domain/marco-de-panel";
import type { ObjetoAbierto } from "@/lib/domain/espacio-de-trabajo";
import { useEspacioDeTrabajo } from "./espacio-de-trabajo";

/**
 * El ancho a partir del cual hay ventana que manejar.
 *
 * Coincide con `md:` de Tailwind, que es donde la barra de escritorio reemplaza
 * a la píldora móvil. Dos umbrales distintos dejarían un tramo con barra de
 * escritorio y panel a pantalla completa.
 */
const ANCHO_DE_ESCRITORIO = 768;

/** El área utilizable, medida y observada. `null` ⇒ todavía no se midió. */
function useArea(): { area: Area | null; escritorio: boolean } {
  const [viewport, setViewport] = useState<{ ancho: number; alto: number } | null>(null);

  useEffect(() => {
    const medir = () =>
      setViewport({ ancho: window.innerWidth, alto: window.innerHeight });
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  if (viewport === null) return { area: null, escritorio: false };
  return { area: areaDe(viewport), escritorio: viewport.ancho >= ANCHO_DE_ESCRITORIO };
}

export function PanelDeObjeto() {
  const { paneles, espacio } = useEspacioDeTrabajo();
  const { area, escritorio } = useArea();

  // Sin medir todavía no se dibuja: una ventana que aparece en un lugar y salta
  // a otro un frame después es peor que esperar ese frame (`P-12`).
  if (paneles.length === 0 || area === null) return null;

  /*
    En móvil sólo la de adelante. **`slice(-1)`, no `[0]`**: la de adelante es la
    última del apilamiento, que es la que el estudiante tocó más recientemente.
  */
  const visibles = escritorio ? paneles : paneles.slice(-1);

  return (
    /*
      ⚠️ **El contenedor no intercepta nada** (`pointerEvents: none`), y ésa es
      la diferencia con la Enmienda 1. Antes había un fondo oscurecido que
      tomaba el clic de afuera para minimizar; con varias ventanas eso sería un
      escritorio que se apaga solo apenas tocás la pantalla de atrás. Ahora lo
      de atrás **se sigue usando**, que es lo que hace que tener tres ventanas
      sirva para algo.
    */
    <div role="presentation" style={{ position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none" }}>
      {visibles.map((objeto, i) => (
        <Ventana
          key={objeto.clave}
          objeto={objeto}
          area={area}
          escritorio={escritorio}
          /*
            El apilamiento, **relativo al contenedor**. El contenedor ya está en
            40 y crea su contexto, así que estos números nunca alcanzan a la
            barra de objetos (50): por más ventanas que se abran, la barra de la
            que salieron **sigue arriba y sigue clickeable**.
          */
          apilado={i + 1}
          cascada={Math.max(0, espacio.objetos.findIndex((o) => o.clave === objeto.clave))}
        />
      ))}
    </div>
  );
}

function Ventana({
  objeto,
  area,
  escritorio,
  apilado,
  cascada,
}: {
  objeto: ObjetoAbierto;
  area: Area;
  escritorio: boolean;
  apilado: number;
  /** Su posición en la barra, para que la segunda ventana no nazca encima de la primera. */
  cascada: number;
}) {
  const { minimizarPanel, traerAlFrente, cerrar, verComoPagina, encuadrar: guardarMarco } =
    useEspacioDeTrabajo();

  const clave = objeto.clave;

  /**
   * El marco que se está dibujando.
   *
   * ⚠️ **Durante el arrastre vive acá, no en el espacio de trabajo.** Escribir
   * en el estado compartido en cada `pointermove` volvería a renderizar la barra
   * y el contenido de `UX02` sesenta veces por segundo. Se guarda **al soltar**.
   */
  const [arrastre, setArrastre] = useState<Marco | null>(null);
  /**
   * El gesto en curso.
   *
   * ⚠️ **Lleva el último marco calculado adentro, y no es redundante.** La
   * primera versión lo leía del estado al soltar y **guardaba el de antes**: el
   * `setArrastre` del último `pointermove` todavía no había llegado a este
   * closure. Se midió en el navegador — la ventana se achicaba y volvía al
   * tamaño original al minimizarla. Del ref no hay versión vieja posible.
   */
  const gesto = useRef<{
    x: number;
    y: number;
    base: Marco;
    borde: Borde | null;
    ultimo: Marco;
  } | null>(null);

  const caja = useRef<HTMLDivElement>(null);

  /**
   * El foco entra al abrirse y vuelve al bajarse — la mitad de la Enmienda 1 §3
   * que la Enmienda 3 **sí** conserva.
   *
   * ⚠️ **Sólo se devuelve si el foco se quedó sin dueño.** Con varias ventanas,
   * bajar la de atrás mientras trabajás en la de adelante no puede arrancarte el
   * foco de donde lo tenías: si `document.activeElement` ya es otra cosa, es
   * porque alguien lo tiene, y no se le saca.
   */
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    // El primer foco va al contenedor, no al primer botón: leer antes de actuar.
    caja.current?.focus();
    return () => {
      const ahora = document.activeElement;
      if (ahora === null || ahora === document.body) anterior?.focus?.();
    };
  }, []);

  /**
   * La ventana sale de su ficha — Enmienda 4.
   *
   * ⚠️ **Corre una sola vez, al aparecer.** Con `marco` en las dependencias se
   * volvería a disparar en cada arrastre: la ventana se metería en su ficha y
   * saldría de nuevo mientras la estás moviendo. Y no lo necesita — el efecto
   * mide la caja del DOM, que ya dice dónde está.
   */
  useEffect(() => {
    const nodo = caja.current;
    if (!nodo) return;
    const animacion = salirDeLaFicha(nodo, clave);
    return () => animacion?.cancel();
  }, [clave]);

  /**
   * Minimizar: **primero se guarda en su ficha, después se minimiza.**
   *
   * ⚠️ **El orden es la corrección de un defecto medido.** Al revés —minimizar
   * y animar lo que quedó— React desmonta la ventana en el frame del medio y lo
   * que se ve es un desvanecido en el lugar, no algo que se guarda.
   */
  const guardar = useCallback(() => {
    guardarEnLaFicha(clave, () => minimizarPanel(clave));
  }, [clave, minimizarPanel]);

  /**
   * `Escape`, capa 2.
   *
   * ⚠️ **No usa captura, y ésa es la jerarquía.** Los menús de la barra sí
   * escuchan en captura y llaman a `stopPropagation`, así que cuando hay uno
   * abierto el evento no llega hasta acá. Con nada encima, minimiza **esta**
   * ventana: la que tiene el foco, no el escritorio entero.
   */
  const alTeclear = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      guardar();
    },
    [guardar],
  );

  // El marco efectivo: el del arrastre si hay uno, si no el guardado, y si nunca
  // se abrió, uno en cascada. `encuadrar` lo mete en la pantalla de ahora, que
  // puede no ser la de cuando se guardó.
  const marco =
    arrastre ?? (objeto.marco ? encuadrar(objeto.marco, area) : marcoInicial(area, cascada));

  function empezarGesto(e: React.PointerEvent, borde: Borde | null) {
    if (!escritorio) return;
    // Expandida no se mueve ni se estira: ocupa todo, no hay a dónde llevarla.
    if (marco.expandido) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    gesto.current = { x: e.clientX, y: e.clientY, base: marco, borde, ultimo: marco };
    setArrastre(marco);
  }

  function seguirGesto(e: React.PointerEvent) {
    const g = gesto.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    const siguiente =
      g.borde === null ? mover(g.base, dx, dy, area) : redimensionar(g.base, g.borde, dx, dy, area);
    g.ultimo = siguiente;
    setArrastre(siguiente);
  }

  function terminarGesto() {
    const g = gesto.current;
    gesto.current = null;
    if (!g) return;
    // Recién acá se escribe en el estado compartido, y por lo tanto en la
    // memoria: en cada `pointermove` sería un render de la barra y de `UX02` por
    // píxel. Y se guarda **lo que el gesto calculó**, no lo que el estado alcanzó
    // a reflejar.
    guardarMarco(clave, g.ultimo);
    setArrastre(null);
  }

  function expandir() {
    guardarMarco(clave, alternarExpandido(marco, area));
  }

  /**
   * A media pantalla, o a un cuarto — Enmienda 6.
   *
   * ⚠️ **El gesto no es un botón nuevo, y eso es lo que lo hace descubrible.**
   * Es *mantener apretado el control de expandir*, que es donde alguien ya va a
   * buscar el tamaño de la ventana; un cuarto control al lado de los tres
   * redondos sería un cuarto punto mudo que hay que aprender.
   */
  function alMosaico(zona: Zona) {
    guardarMarco(clave, amosaicar(marco, zona, area));
  }

  const nombre = nombreDeObjeto(objeto.etiqueta);
  const completo = objeto.etiquetaSecundaria
    ? `${nombre} · ${nombreDeObjeto(objeto.etiquetaSecundaria)}`
    : nombre;
  const color = colorDelObjeto(objeto.tipo, objeto.entidadId);

  /*
    ⚠️ **A menos de 768 px la ventana ocupa la pantalla y no se maneja.**
    Arrastrar y estirar un rectángulo en un teléfono no es una función: es una
    forma de perderlo detrás del borde.
  */
  const estiloDeVentana: React.CSSProperties = escritorio
    ? { left: marco.x, top: marco.y, width: marco.ancho, height: marco.alto }
    : { inset: "16px 16px 96px" };

  return (
    <div
      ref={caja}
      data-ventana={clave}
      role="dialog"
      /*
        ⚠️ **Sin `aria-modal`, y es la corrección de la Enmienda 3.** Anunciar
        como modal algo que no lo es le dice al lector de pantalla que el resto
        de la página **no existe** — cuando el resto de la página es justamente
        lo que se sigue usando, incluida la barra y las otras dos ventanas.
      */
      aria-label={completo}
      tabIndex={-1}
      onKeyDown={alTeclear}
      /*
        Tocar una ventana la sube al frente, como cualquier escritorio. Va en
        captura para que también cuente tocar algo de adentro: subir sólo cuando
        se toca el borde obligaría a apuntar a un marco de medio píxel.
      */
      onPointerDownCapture={() => traerAlFrente(clave)}
      style={{
        ...estiloDeVentana,
        position: "absolute",
        zIndex: apilado,
        pointerEvents: "auto",
        // El efecto de escala necesita el origen arriba a la izquierda: con el
        // origen al centro, la ventana sale de un lugar cercano y equivocado.
        transformOrigin: "0 0",
        display: "flex",
        flexDirection: "column",
        background: "var(--card)",
        border: ".5px solid var(--border)",
        borderRadius: "var(--radius)",
        /*
          ⚠️ **La de adelante se despega más que las de atrás.** Con tres
          ventanas del mismo color y la misma sombra, cuál está activa es una
          adivinanza; la profundidad es la única señal que no gasta ni color ni
          texto.
        */
        boxShadow: apilado > 1 ? "0 32px 80px rgba(0,0,0,0.22)" : "0 18px 48px rgba(0,0,0,0.16)",
        outline: "none",
        overflow: "hidden",
        /*
          Sin transición mientras se arrastra: animar el tamaño durante un
          gesto lo vuelve pastoso y lo despega del puntero.

          ⚠️ Se mira `arrastre` —estado— y no el `ref` del gesto: leer un `ref`
          durante el render es exactamente lo que el lint rechaza, y con razón
          —su valor no dispara un render, así que la transición podría quedar
          de un frame anterior—.
        */
        transition: arrastre ? "none" : "width 140ms ease, height 140ms ease",
      }}
    >
      {escritorio && !marco.expandido && (
        <Agarres onEmpezar={empezarGesto} onSeguir={seguirGesto} onSoltar={terminarGesto} />
      )}

      <header
        className="flex items-center gap-3"
        onPointerDown={(e) => {
          /*
            ⚠️ **Se agarra de toda la barra menos de sus botones.**

            La primera versión exigía `e.target === e.currentTarget`, o sea
            **sólo el fondo**: agarrar del nombre del objeto —que es de donde
            agarra cualquiera— no movía nada. Se midió en el navegador.

            Lo que sí hay que excluir son los botones: si no, apretar
            «minimizar» movería la ventana.
          */
          if ((e.target as HTMLElement).closest("button")) return;
          empezarGesto(e, null);
        }}
        onPointerMove={seguirGesto}
        onPointerUp={terminarGesto}
        onPointerCancel={terminarGesto}
        onDoubleClick={expandir}
        aria-label={escritorio ? t("PANEL.MOVER") : undefined}
        style={{
          flexShrink: 0,
          padding: "10px 12px 10px 14px",
          /*
            ⚠️ **La franja de identidad — Enmienda 5, y es lo que distingue un
            cuadrante de otro.** Con tres ventanas del mismo blanco superpuestas,
            cuál es cuál se contesta leyendo el título de cada una; el color la
            contesta de un vistazo, y es **el mismo** que esa materia tiene en la
            lista y en su ficha.

            Va arriba y no a la izquierda como en la lista porque acá el borde
            izquierdo lo ocupan los agarres de redimensionar: una franja de 3 px
            ahí sería un blanco falso sobre el que se intenta estirar la ventana.
          */
          borderTop: color ? `3px solid ${color}` : undefined,
          borderBottom: ".5px solid var(--border)",
          cursor: escritorio && !marco.expandido ? "grab" : "default",
          touchAction: "none",
        }}
      >
        {/*
          El semáforo, arriba a la izquierda. Es el mismo componente que la
          superficie usa: dos semáforos distintos serían dos gramáticas para el
          mismo gesto.
        */}
        <Semaforo
          nombre={completo}
          /*
            ⚠️ **Amosaicada también cuenta como «agrandada»**, y por eso el
            control dice *Restaurar*: desde media pantalla el gesto que falta es
            volver al tamaño propio, no ocupar todo.
          */
          expandido={marco.expandido || marco.zona !== null}
          zona={marco.zona}
          onCerrar={() => cerrar(clave)}
          onMinimizar={guardar}
          onExpandir={escritorio ? expandir : undefined}
          onMosaico={escritorio ? alMosaico : undefined}
          area={area}
        />

        <p
          className="truncate"
          style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)", minWidth: 0 }}
        >
          {completo}
        </p>

        <button
          onClick={() => verComoPagina(clave)}
          className="ml-auto flex items-center gap-1"
          style={{
            flexShrink: 0,
            minHeight: 36,
            padding: "0 12px",
            borderRadius: "var(--radius-pildora)",
            border: ".5px solid var(--border)",
            fontSize: "var(--text-label)",
            color: "var(--foreground)",
          }}
        >
          {t("PANEL.VER_COMO_PAGINA")}
          <ArrowUpRight size={14} aria-hidden />
        </button>
      </header>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 16px 20px" }}>
        <Contenido objeto={objeto} />
      </div>
    </div>
  );
}

/**
 * Los ocho agarres para redimensionar.
 *
 * ⚠️ **Van detrás del contenido en el orden del DOM y con `zIndex` propio**, no
 * encima: un agarre que tape el borde del contenido se come los clics de lo
 * primero y lo último de cada fila.
 *
 * ⚠️ **Y son `aria-hidden`.** Redimensionar con el teclado no es una función que
 * exista acá, y anunciar ocho controles que no se pueden usar sin mouse es peor
 * que no anunciarlos. Lo que sí funciona sin mouse es todo lo demás: expandir,
 * minimizar, cerrar y `Escape` son botones y teclas.
 */
const AGARRES: ReadonlyArray<{ borde: Borde; estilo: React.CSSProperties; cursor: string }> = [
  { borde: "n", estilo: { top: -3, left: 10, right: 10, height: 6 }, cursor: "ns-resize" },
  { borde: "s", estilo: { bottom: -3, left: 10, right: 10, height: 6 }, cursor: "ns-resize" },
  { borde: "o", estilo: { left: -3, top: 10, bottom: 10, width: 6 }, cursor: "ew-resize" },
  { borde: "e", estilo: { right: -3, top: 10, bottom: 10, width: 6 }, cursor: "ew-resize" },
  { borde: "no", estilo: { top: -3, left: -3, width: 14, height: 14 }, cursor: "nwse-resize" },
  { borde: "ne", estilo: { top: -3, right: -3, width: 14, height: 14 }, cursor: "nesw-resize" },
  { borde: "so", estilo: { bottom: -3, left: -3, width: 14, height: 14 }, cursor: "nesw-resize" },
  { borde: "se", estilo: { bottom: -3, right: -3, width: 14, height: 14 }, cursor: "nwse-resize" },
];

function Agarres({
  onEmpezar,
  onSeguir,
  onSoltar,
}: {
  onEmpezar: (e: React.PointerEvent, borde: Borde) => void;
  onSeguir: (e: React.PointerEvent) => void;
  onSoltar: () => void;
}) {
  return (
    <>
      {AGARRES.map(({ borde, estilo, cursor }) => (
        <span
          key={borde}
          aria-hidden
          data-agarre={borde}
          onPointerDown={(e) => onEmpezar(e, borde)}
          onPointerMove={onSeguir}
          onPointerUp={onSoltar}
          onPointerCancel={onSoltar}
          style={{ position: "absolute", zIndex: 2, cursor, touchAction: "none", ...estilo }}
        />
      ))}
    </>
  );
}

/**
 * Qué se dibuja adentro de la ventana — Enmienda 6.
 *
 * ⚠️ **Es la superficie de verdad, no una versión reducida.** Hasta la Enmienda
 * 5 la ventana sabía dibujar `UX02` y nada más, y el resto de los objetos caían
 * en *"abrilo como página"*. El owner pidió que **todo** pueda quedar en la
 * barra, así que todo tiene que poder verse: lo que se dibuja acá es el mismo
 * componente que dibuja la ruta, con los mismos datos y las mismas CTAs.
 *
 * ⚠️ **Se elige por la ruta del objeto, no por su tipo.** El tipo dice *qué es*
 * —una evidencia, una acción— y hay tres objetos de tipo `modo-examen` que son
 * tres pantallas distintas. La ruta es lo que el objeto ya lleva adentro y lo
 * que la ficha usó para abrirlo: un solo dato, y ningún `if` por pantalla.
 *
 * ⚠️ **Una ruta desconocida lo dice y ofrece la página.** Es §2.7 —*omitir, no
 * inventar*—: no se cae a una pantalla parecida ni se deja la ventana en blanco.
 */
function Contenido({ objeto }: { objeto: ObjetoAbierto }) {
  const camino = objeto.ruta.split("?")[0] ?? objeto.ruta;
  const Vista = VISTA_POR_CAMINO[camino];
  /*
    ⚠️ **La consulta sale de la ruta DEL OBJETO, no de la barra de direcciones.**
    Dos ventanas de dos materias distintas están las dos sobre `/hoy?abierto=…`:
    si leyeran la URL del navegador, las dos mostrarían la misma materia. Es el
    defecto que `useConsultaDeRuta` existe para que no ocurra.
  */
  const consulta = useConsultaDeRuta(objeto.ruta);

  if (!Vista) {
    return (
      <div style={{ padding: "28px 18px" }}>
        <p style={{ fontSize: "var(--text-body)", color: "var(--foreground)" }}>
          {t("PANEL.SIN_VISTA")}
        </p>
        <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
          {t("PANEL.SIN_VISTA_AYUDA")}
        </p>
      </div>
    );
  }

  return (
    /*
      ⚠️ **La miga se apaga adentro de la ventana, y no es cosmético.** El
      breadcrumb de la topbar dice **dónde estás**, y estás en la pantalla de
      atrás. Una ventana de Álgebra abierta sobre `Hoy` que renombrara la última
      miga a *"Álgebra"* diría que navegaste a un lugar al que no fuiste — y con
      dos ventanas abiertas, la última en montarse ganaría. El proveedor con un
      `noop` deja que la superficie llame a `useMigaDelObjeto` como siempre sin
      que nadie la escuche.
    */
    <ProveedorDeMigaDelObjeto value={SIN_MIGA}>
      {/*
        `useSearchParams` vive adentro de cada superficie. El `Shell` ya pone una
        frontera arriba, pero la ventana se monta y se desmonta sola cada vez que
        se despliega: con la suya, suspender no vacía la pantalla de atrás.
      */}
      <Suspense fallback={<div style={{ minHeight: 240 }} />}>
        <Vista consulta={consulta} />
      </Suspense>
    </ProveedorDeMigaDelObjeto>
  );
}

/**
 * El sumidero de la miga.
 *
 * ⚠️ **Fuera del componente a propósito.** `value={() => {}}` en el JSX crea una
 * función nueva por render, y `useMigaDelObjeto` la tiene entre las dependencias
 * de su efecto: cada arrastre de la ventana volvería a correr el efecto de cada
 * superficie que hay adentro.
 */
const SIN_MIGA = () => {};
