"use client";

/**
 * La ventana interna del espacio de trabajo — [ADR-088](../../docs/decisions.md#adr-088),
 * Enmienda 1.
 *
 * Tocar una ficha de la barra **despliega el objeto encima de la pantalla en la
 * que estás**, en vez de sacarte de ella. Volver a tocarla lo minimiza.
 *
 * ## Por qué esto sube el listón, y no lo baja
 *
 * ADR-019 descartó el multiventana por seis requisitos innegociables. ADR-088 se
 * comprometió a cumplirlos; una ventana interna real **ejercita tres de ellos de
 * verdad** por primera vez:
 *
 * - **1 · URL por ficha.** El panel vive en `?abierto=<clave>`. Se puede
 *   compartir, el botón atrás lo cierra y recargar lo repone. Un panel que
 *   viviera sólo en memoria no tendría ninguna de las tres.
 * - **3 · Trampa de foco.** Mientras está abierto, `Tab` circula **adentro**.
 *   Al cerrarse, el foco vuelve a donde estaba.
 * - **4 · Jerarquía de `Escape` con dos capas.** `Escape` cierra primero un menú
 *   abierto; sólo si no hay menú, minimiza el panel. **Nunca cierra el objeto**:
 *   cerrar es destructivo y no se hace con una tecla de escape.
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
 * ⚠️ **A menos de 768 px no hay ventana que manejar.** El panel ocupa la
 * pantalla, como corresponde: arrastrar un rectángulo por un teléfono no es una
 * función, es una forma de perderlo.
 *
 * ## El panel consulta; la superficie trabaja
 *
 * **El panel no decide nada.** Las CTAs que la superficie dibuja se cablean acá
 * —si no, quedarían muertas: ver `VistaDeMateria`— pero **todas navegan**. La
 * precedencia y la CTA única (`I-06`) siguen viviendo en `UX02`–`UX05`; lo que
 * el panel hace es llevarte hasta ellas.
 *
 * Es la misma distinción que hace el software de `docs/diseño/` en su propia
 * ficha —*"se listan para consultarlas: renovar, triagear y editar el legajo se
 * hacen en la cartera, que sigue siendo la única superficie de trabajo"*—. Se
 * toma **el mecanismo**, no su dominio.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Maximize2, Minimize2, Minus, X } from "lucide-react";

import { MateriaCursado } from "@/components/screens/materia-cursado";
import { NoSePudoCargar } from "./no-se-pudo-cargar";
import { useSuperficie } from "@/lib/client/superficie";
import { rutaDeCta, rutaDeCtaCon } from "@/lib/navigation";
import { t } from "@/lib/content/es-AR";
import {
  alternarExpandido,
  areaDe,
  encuadrar,
  marcoInicial,
  mover,
  redimensionar,
  type Area,
  type Borde,
  type Marco,
} from "@/lib/domain/marco-de-panel";
import type { ObjetoAbierto } from "@/lib/domain/espacio-de-trabajo";
import type { MateriaProps } from "@/lib/domain/view-models";
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
  const { panel, espacio, minimizarPanel, cerrar, verComoPagina, encuadrar: guardarMarco } =
    useEspacioDeTrabajo();
  const { area, escritorio } = useArea();

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
  /** Dónde estaba el foco antes de abrir, para devolverlo al cerrar. */
  const foco = useRef<HTMLElement | null>(null);

  const clave = panel?.clave ?? null;

  useEffect(() => {
    if (clave === null) return;
    foco.current = document.activeElement as HTMLElement | null;
    // El primer foco va al contenedor, no al primer botón: leer antes de actuar.
    caja.current?.focus();
    const anterior = foco.current;
    return () => anterior?.focus?.();
  }, [clave]);

  /**
   * `Escape`, capa 2.
   *
   * ⚠️ **No usa captura, y ésa es la jerarquía.** Los menús de la barra sí
   * escuchan en captura y llaman a `stopPropagation`, así que cuando hay uno
   * abierto el evento no llega hasta acá. Con nada encima, minimiza.
   */
  const alTeclear = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        minimizarPanel();
        return;
      }
      if (e.key !== "Tab" || !caja.current) return;

      // Trampa de foco (requisito 3): `Tab` circula adentro del panel.
      const focos = caja.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const primero = focos[0];
      const ultimo = focos[focos.length - 1];
      if (!primero || !ultimo) return;

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    },
    [minimizarPanel],
  );

  // Sin medir todavía no se dibuja: una ventana que aparece en un lugar y salta
  // a otro un frame después es peor que esperar ese frame (`P-12`).
  if (!panel || clave === null || area === null) return null;

  // El marco efectivo: el del arrastre si hay uno, si no el guardado, y si nunca
  // se abrió, uno en cascada. `encuadrar` lo mete en la pantalla de ahora, que
  // puede no ser la de cuando se guardó.
  const indice = espacio.objetos.findIndex((o) => o.clave === clave);
  const marco =
    arrastre ??
    (panel.marco ? encuadrar(panel.marco, area) : marcoInicial(area, Math.max(0, indice)));

  function empezarGesto(e: React.PointerEvent, borde: Borde | null) {
    if (!escritorio || area === null) return;
    // Expandida no se mueve ni se estira: ocupa todo, no hay a dónde llevarla.
    if (marco.expandido) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    gesto.current = { x: e.clientX, y: e.clientY, base: marco, borde, ultimo: marco };
    setArrastre(marco);
  }

  function seguirGesto(e: React.PointerEvent) {
    const g = gesto.current;
    if (!g || area === null) return;
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
    if (!g || clave === null) return;
    // Recién acá se escribe en el estado compartido, y por lo tanto en la
    // memoria: en cada `pointermove` sería un render de la barra y de `UX02` por
    // píxel. Y se guarda **lo que el gesto calculó**, no lo que el estado alcanzó
    // a reflejar.
    guardarMarco(clave, g.ultimo);
    setArrastre(null);
  }

  function expandir() {
    if (area === null || clave === null) return;
    guardarMarco(clave, alternarExpandido(marco, area));
  }

  /*
    ⚠️ **A menos de 768 px el panel ocupa la pantalla y no se maneja.** Arrastrar
    y estirar un rectángulo en un teléfono no es una función: es una forma de
    perderlo detrás del borde.
  */
  const estiloDeVentana: React.CSSProperties = escritorio
    ? {
        position: "absolute",
        left: marco.x,
        top: marco.y,
        width: marco.ancho,
        height: marco.alto,
      }
    : { position: "absolute", inset: "16px 16px 96px" };

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        // Tocar afuera **minimiza**, no cierra: el objeto sigue en la barra.
        if (e.target === e.currentTarget) minimizarPanel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background: "rgba(0,0,0,0.18)",
      }}
    >
      <div
        ref={caja}
        role="dialog"
        aria-modal="true"
        aria-label={panel.etiqueta}
        tabIndex={-1}
        onKeyDown={alTeclear}
        style={{
          ...estiloDeVentana,
          display: "flex",
          flexDirection: "column",
          background: "var(--card)",
          border: ".5px solid var(--border)",
          borderRadius: "var(--radius)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
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
        {escritorio && !marco.expandido && <Agarres onEmpezar={empezarGesto} onSeguir={seguirGesto} onSoltar={terminarGesto} />}

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
            padding: "10px 12px 10px 18px",
            borderBottom: ".5px solid var(--border)",
            cursor: escritorio && !marco.expandido ? "grab" : "default",
            touchAction: "none",
          }}
        >
          <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
            {panel.etiquetaSecundaria
              ? `${panel.etiqueta} · ${panel.etiquetaSecundaria}`
              : panel.etiqueta}
          </p>

          <button
            onClick={() => verComoPagina(clave)}
            className="ml-auto flex items-center gap-1"
            style={{
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

          {/*
            ⚠️ **Minimizar y cerrar NO son lo mismo, y por eso son dos.**
            Minimizar guarda el panel y **deja el objeto en la barra**; cerrar
            saca el objeto. Dos botones que hicieran lo mismo serían ruido.
          */}
          {escritorio && (
            <button
              onClick={expandir}
              aria-label={marco.expandido ? t("PANEL.RESTAURAR") : t("PANEL.EXPANDIR")}
              title={marco.expandido ? t("PANEL.RESTAURAR") : t("PANEL.EXPANDIR")}
              className="flex items-center justify-center"
              style={{ width: 36, height: 36, borderRadius: "var(--radius-control)", color: "var(--muted-foreground)" }}
            >
              {marco.expandido ? <Minimize2 size={15} aria-hidden /> : <Maximize2 size={15} aria-hidden />}
            </button>
          )}
          <button
            onClick={minimizarPanel}
            aria-label={t("PANEL.MINIMIZAR")}
            title={t("PANEL.MINIMIZAR")}
            className="flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: "var(--radius-control)", color: "var(--muted-foreground)" }}
          >
            <Minus size={16} aria-hidden />
          </button>
          <button
            onClick={() => cerrar(clave)}
            aria-label={`${t("PANEL.CERRAR")}: ${panel.etiqueta}`}
            title={t("PANEL.CERRAR")}
            className="flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: "var(--radius-control)", color: "var(--muted-foreground)" }}
          >
            <X size={16} aria-hidden />
          </button>
        </header>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 4 }}>
          <Contenido objeto={panel} />
          <p
            style={{
              padding: "4px 18px 16px",
              fontSize: "var(--text-meta)",
              color: "var(--muted-foreground)",
            }}
          >
            {t("PANEL.SOLO_CONSULTA")}
          </p>
        </div>
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
 * Qué se dibuja adentro, según el tipo.
 *
 * ⚠️ **Los tipos que todavía no tienen vista lo dicen.** No se cae a una
 * pantalla parecida ni se deja el panel en blanco: se ofrece abrirlo como
 * página, que es el camino que sí existe (`AGENTS.md` §2.7).
 */
function Contenido({ objeto }: { objeto: ObjetoAbierto }) {
  if (objeto.tipo === "materia") return <VistaDeMateria cursadaId={objeto.entidadId} />;

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

/**
 * `UX02` adentro del panel.
 *
 * ⚠️ **Es la misma lectura y el mismo componente**, con la cursada del objeto.
 * Una segunda versión de la materia «para el panel» sería una segunda verdad
 * sobre la misma pantalla — que es el motivo por el que `proyeccion-hoy.ts` no
 * tiene su propia tabla de precedencia.
 *
 * ## Por qué las CTAs se cablean, y no se dejan sin `onClick`
 *
 * ⚠️ **Se descubrió mirándolo en el navegador.** `MateriaCursado` decide qué
 * CTA dibuja **por el dato**, no por el manejador: sin cablearlas, *«Activar
 * Modo Examen»* aparecía y no hacía nada. Un control muerto es peor que
 * ninguno — `AGENTS.md` §2.2 es literal: *una CTA cuya condición de aparición no
 * se cumple no se renderiza*, y una que aparece tiene que llevar a algún lado.
 *
 * Cablearlas **no rompe** la distinción de la Enmienda 1: todas **navegan a la
 * superficie**. El panel sigue sin decidir nada; te lleva al lugar donde se
 * decide. Los destinos salen del registro canónico, igual que en `UX02`.
 */
function VistaDeMateria({ cursadaId }: { cursadaId: string }) {
  const router = useRouter();
  const { respuesta, reintentar } = useSuperficie<MateriaProps>(
    `/api/materia?cursada=${encodeURIComponent(cursadaId)}`,
  );

  // `P-12`: nada salta al cargar. Un esqueleto que se reemplaza es peor que un
  // frame de espera dentro de una ventana que el estudiante acaba de abrir.
  if (respuesta.estado === "CARGANDO") return <div style={{ minHeight: 240 }} />;

  if (respuesta.estado !== "OK") {
    return (
      <div style={{ padding: 12 }}>
        <NoSePudoCargar
          motivo={respuesta.estado}
          onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar}
        />
      </div>
    );
  }

  const props = respuesta.datos;
  const aAccion = rutaDeCta("CTA-002");
  const aRegistro = rutaDeCta("CTA-009");
  const aModoExamen = rutaDeCta("CTA-019");

  return (
    <MateriaCursado
      {...props}
      /*
        Los tres destinos son los mismos que cablea `UX02`, y salen del registro
        canónico. Navegar **deja el panel atrás**, que es lo correcto: a partir
        de acá el estudiante está trabajando, no consultando.
      */
      onAvanzar={aAccion ? () => router.push(aAccion) : undefined}
      onVerRegistro={
        aRegistro
          ? () => router.push(rutaDeCtaCon("CTA-009", props.cursadaId) ?? aRegistro)
          : undefined
      }
      onModoExamen={
        aModoExamen
          ? () => router.push(rutaDeCtaCon("CTA-019", props.cursadaId) ?? aModoExamen)
          : undefined
      }
    />
  );
}
