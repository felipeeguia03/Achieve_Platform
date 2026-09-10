"use client";

/**
 * La barra del espacio de trabajo — [ADR-088](../../docs/decisions.md#adr-088).
 *
 * ## Por qué no se parece a un navegador
 *
 * Las pestañas de un navegador son **iguales entre sí** y se distinguen por su
 * texto. Acá cada objeto lleva **el ícono de su tipo**, y el tipo es una
 * distinción del dominio: una unidad no es una evaluación no es un TP. Se lee
 * de un vistazo sin leer la etiqueta, que es lo que un navegador nunca puede.
 *
 * ## Cómo se evita `A-07`
 *
 * El anti-patrón catalogado es *"el dock ya trunca títulos con dos elementos
 * abiertos"*. Acá el ancho mínimo es fijo y hay **hasta cinco**; el sexto va al
 * desbordamiento **entero**, con su nombre completo. Se prefiere un menú a una
 * etiqueta ilegible.
 *
 * ## Accesibilidad
 *
 * `role="tablist"` con flechas, `Home`/`End` y `Delete`. El arrastre existe,
 * **y no es el único camino**: el menú de cada objeto ofrece mover a izquierda y
 * derecha (ADR-088, requisito 3).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CalendarClock,
  ClipboardList,
  FileText,
  GraduationCap,
  Layers,
  MoreHorizontal,
  NotebookPen,
  PlayCircle,
  Plus,
  Target,
  Upload,
  X,
} from "lucide-react";

import {
  VISIBLES,
  repartir,
  type ObjetoAbierto,
  type TipoDeObjeto,
} from "@/lib/domain/espacio-de-trabajo";
import { t } from "@/lib/content/es-AR";
import { useEspacioDeTrabajo } from "./espacio-de-trabajo";

/** Un ícono por tipo. **No hay emoji**: el set es el de la aplicación (Lucide). */
const ICONOS: Record<TipoDeObjeto, typeof BookOpen> = {
  materia: GraduationCap,
  unidad: Layers,
  recurso: FileText,
  "trabajo-practico": ClipboardList,
  accion: Target,
  compromiso: CalendarClock,
  evidencia: Upload,
  evaluacion: CalendarClock,
  "modo-examen": BookOpen,
  formacion: PlayCircle,
  bitacora: NotebookPen,
};

/**
 * Cuánto ocupa un objeto dibujado, en píxeles: etiqueta + botón de cerrar + gap.
 *
 * ⚠️ **Es el peor caso, no el promedio, y tiene que serlo.** El reparto decide
 * cuántos entran antes de medir el texto; si se calculara con un ancho típico,
 * cinco nombres largos harían aparecer scroll horizontal en el `body` — que es
 * exactamente el defecto que esto vino a arreglar.
 */
const ANCHO_DE_OBJETO = 192;

/** Lo que se reserva para el separador, el `+` y el botón de desbordamiento. */
const ANCHO_DE_CONTROLES = 110;

export function BarraDeObjetos({ onAbrirPaleta }: { onAbrirPaleta: () => void }) {
  const { espacio, listo, desalojado, alternarPanel, cerrar } = useEspacioDeTrabajo();
  const [menu, setMenu] = useState<string | null>(null);
  const [desbordeAbierto, setDesbordeAbierto] = useState(false);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [ancho, setAncho] = useState<number | null>(null);

  /**
   * Mide **la columna de contenido**, no la ventana.
   *
   * La barra lateral ocupa 256 px y se puede colapsar a 80: restarlos a mano
   * sería una segunda copia de esa medida, y quedaría mal el día que alguien
   * cambie una de las dos. El `ResizeObserver` mira el contenedor real, así que
   * colapsar la barra lateral ensancha el espacio y entran más objetos **sin
   * que nadie avise**.
   */
  const contenedor = useRef<HTMLDivElement | null>(null);
  /**
   * ⚠️ **Un ancho de `0` es «todavía no está maquetado», no «no entra nada».**
   *
   * Los dos casos llegan acá: el primer frame antes del layout, y jsdom, que no
   * maqueta nunca. Tratarlos como falta de espacio dejaba **un solo objeto
   * visible** y el resto en el menú — que es peor que no medir. Por eso `0` se
   * guarda como `null`, y `null` significa *usá el techo*.
   */
  const medir = useCallback((nodo: HTMLDivElement | null) => {
    contenedor.current = nodo;
    if (!nodo) return;
    setAncho(nodo.clientWidth > 0 ? nodo.clientWidth : null);
  }, []);

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo || typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(([entrada]) => {
      if (!entrada) return;
      setAncho(entrada.contentRect.width > 0 ? entrada.contentRect.width : null);
    });
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [listo]);

  // Antes de leer la memoria no se dibuja: ver el comentario de hidratación en
  // `espacio-de-trabajo.tsx`. Y sin objetos la barra **no existe** — una barra
  // vacía flotando sería cromo puro ocupando el pie de todas las pantallas.
  const hayObjetos = listo && espacio.objetos.length > 0;

  /*
    Sin medida todavía se usa el techo: es el primer frame, y en desktop entran.
    Un cupo de 1 mientras se mide haría parpadear la barra al cargar (`P-12`).
  */
  const cupo =
    ancho === null
      ? VISIBLES
      : Math.floor((ancho - ANCHO_DE_CONTROLES) / ANCHO_DE_OBJETO);

  const { visibles, desbordados } = repartir(espacio, cupo);

  return (
    <>
      {desalojado && <AvisoDeDesalojo objeto={desalojado} />}

      {/*
        Móvil: **no se intenta meter la barra entera**. §10.12 — una píldora con
        el contexto activo, y todo lo demás en una hoja. Tres etiquetas de 190 px
        a 360 px es exactamente `A-07`.
      */}
      {hayObjetos && <PildoraMovil onAbrirPaleta={onAbrirPaleta} />}

      <div
        ref={medir}
        // `sticky` y no `fixed`: así queda dentro de la columna de contenido y
        // **nunca por debajo de la barra lateral**, sin tener que replicar su
        // ancho con un `left:` que se desincroniza al colapsarla.
        //
        // ⚠️ **Se dibuja aunque no haya objetos**, y por eso no lleva alto ni
        // fondo: es el contenedor que el `ResizeObserver` mide. Sin él, medir
        // exigiría un segundo elemento o adivinar el ancho de la barra lateral.
        className="sticky hidden md:flex justify-center"
        /*
          ⚠️ **Por encima del panel (`z-index` 40), y es la corrección de un
          defecto medido.** Con la ventana interna abierta, su fondo tapaba la
          barra: se veía y no se podía tocar, justo el gesto para el que existe.
          Ahora se puede pasar de un objeto a otro **sin cerrar la ventana**.

          El envoltorio no intercepta nada (`pointerEvents: none`); sólo la
          píldora. Tocar el hueco de al lado sigue siendo *tocar afuera*, que
          minimiza.
        */
        style={{ bottom: 16, zIndex: 50, padding: "0 16px", pointerEvents: "none" }}
      >
        {hayObjetos && (
        <div
          role="tablist"
          aria-label={t("ESPACIO.TITULO")}
          className="flex items-center gap-1"
          style={{
            pointerEvents: "auto",
            maxWidth: "100%",
            background: "var(--card)",
            border: ".5px solid var(--border)",
            borderRadius: "var(--radius-pildora)",
            boxShadow: "var(--sombra-flotante, 0 8px 28px rgba(0,0,0,0.14))",
            padding: 6,
          }}
        >
          {visibles.map((objeto, i) => (
            <Objeto
              key={objeto.clave}
              objeto={objeto}
              activo={espacio.activo === objeto.clave}
              indice={i}
              total={visibles.length}
              menuAbierto={menu === objeto.clave}
              arrastrando={arrastrando === objeto.clave}
              onMenu={() => setMenu((m) => (m === objeto.clave ? null : objeto.clave))}
              onCerrarMenu={() => setMenu(null)}
              onArrastrar={setArrastrando}
              onActivar={() => alternarPanel(objeto.clave)}
              onCerrar={() => cerrar(objeto.clave)}
            />
          ))}

          {desbordados.length > 0 && (
            <Desbordamiento
              objetos={desbordados}
              abierto={desbordeAbierto}
              onAlternar={() => setDesbordeAbierto((a) => !a)}
              onCerrar={() => setDesbordeAbierto(false)}
            />
          )}

          {/* Separado del resto: no es un objeto, es cómo se agrega uno. */}
          <span aria-hidden style={{ width: 1, height: 22, background: "var(--border)", margin: "0 4px" }} />
          <button
            onClick={onAbrirPaleta}
            aria-label={t("ESPACIO.ABRIR_OTRO")}
            title={t("ESPACIO.ABRIR_OTRO")}
            className="flex items-center justify-center"
            style={{ minWidth: 44, minHeight: 44, borderRadius: "var(--radius-pildora)", color: "var(--muted-foreground)" }}
          >
            <Plus size={18} aria-hidden />
          </button>
        </div>
        )}
      </div>
    </>
  );
}

function Objeto({
  objeto,
  activo,
  indice,
  total,
  menuAbierto,
  arrastrando,
  onMenu,
  onCerrarMenu,
  onArrastrar,
  onActivar,
  onCerrar,
}: {
  objeto: ObjetoAbierto;
  activo: boolean;
  indice: number;
  total: number;
  menuAbierto: boolean;
  arrastrando: boolean;
  onMenu: () => void;
  onCerrarMenu: () => void;
  onArrastrar: (clave: string | null) => void;
  onActivar: () => void;
  onCerrar: () => void;
}) {
  const { reordenar, mover, cerrarOtros, cerrarTodos, espacio } = useEspacioDeTrabajo();
  const Icono = ICONOS[objeto.tipo];
  const boton = useRef<HTMLButtonElement>(null);

  // El nombre completo siempre disponible, aunque el ancho lo corte: es la
  // mitad accesible del truncado (§10.2).
  const completo = objeto.etiquetaSecundaria
    ? `${objeto.etiqueta} · ${objeto.etiquetaSecundaria}`
    : objeto.etiqueta;

  function alTeclear(e: React.KeyboardEvent) {
    const barra = boton.current?.closest('[role="tablist"]');
    const botones = barra ? Array.from(barra.querySelectorAll<HTMLButtonElement>('[role="tab"]')) : [];
    const mover_ = (i: number) => botones[Math.max(0, Math.min(i, botones.length - 1))]?.focus();

    if (e.key === "ArrowRight") { e.preventDefault(); mover_(indice + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); mover_(indice - 1); }
    else if (e.key === "Home") { e.preventDefault(); mover_(0); }
    else if (e.key === "End") { e.preventDefault(); mover_(botones.length - 1); }
    // Cerrar con `Delete`, nunca con `Escape`: `Escape` sale de una capa, y
    // cerrar un objeto es destructivo (ADR-088, requisito 4).
    else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); onCerrar(); }
  }

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <span
        draggable
        onDragStart={() => {
          arrastrandoGlobal.actual = objeto.clave;
          onArrastrar(objeto.clave);
        }}
        onDragEnd={() => {
          arrastrandoGlobal.actual = null;
          onArrastrar(null);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const origen = espacio.objetos.findIndex((o) => o.clave === objeto.clave);
          const arrastrado = espacio.objetos.find((o) => o.clave === arrastrandoGlobal.actual);
          if (arrastrado && origen !== -1) reordenar(arrastrado.clave, origen);
          arrastrandoGlobal.actual = null;
          onArrastrar(null);
        }}
        className="flex items-center"
        style={{
          background: activo ? "var(--muted)" : "transparent",
          borderRadius: "var(--radius-pildora)",
          opacity: arrastrando ? 0.5 : 1,
          // 120–200 ms, y sólo si el sistema no pidió lo contrario.
          transition: "background 140ms ease",
        }}
      >
        <button
          ref={boton}
          role="tab"
          aria-selected={activo}
          tabIndex={activo ? 0 : -1}
          title={completo}
          onClick={onActivar}
          onKeyDown={alTeclear}
          onContextMenu={(e) => { e.preventDefault(); onMenu(); }}
          className="flex items-center gap-2"
          style={{
            minHeight: 44,
            maxWidth: 160,
            padding: "0 6px 0 12px",
            color: "var(--foreground)",
            fontSize: "var(--text-label)",
            fontWeight: activo ? 600 : 400,
          }}
        >
          <Icono size={15} aria-hidden style={{ flexShrink: 0, color: "var(--muted-foreground)" }} />
          {/*
            ⚠️ **El orden de sacrificio importa, y es la mitad de `A-07`.**
            Cuando no entra todo, lo que se recorta es **el contexto**, no el
            nombre del objeto: un `ANALISI…` seguido de un contexto entero es
            justo el defecto que ADR-088 §3 se comprometió a no reproducir.

            `flexShrink` 1 contra 6 es lo que fija ese orden.
          */}
          <span className="truncate" style={{ flexShrink: 1, minWidth: 0 }}>
            {objeto.etiqueta}
          </span>
          {objeto.etiquetaSecundaria && (
            <span
              className="truncate"
              style={{ flexShrink: 6, minWidth: 0, color: "var(--muted-foreground)" }}
            >
              {objeto.etiquetaSecundaria}
            </span>
          )}
        </button>

        <button
          onClick={onCerrar}
          aria-label={`${t("ESPACIO.CERRAR")}: ${completo}`}
          title={t("ESPACIO.CERRAR")}
          className="flex items-center justify-center"
          style={{
            width: 28, height: 44, flexShrink: 0,
            color: "var(--muted-foreground)",
            borderRadius: "var(--radius-pildora)",
          }}
        >
          <X size={14} aria-hidden />
        </button>
      </span>

      {menuAbierto && (
        <Menu
          onCerrar={onCerrarMenu}
          opciones={[
            { texto: t("ESPACIO.MOVER_IZQUIERDA"), inhabilitada: indice === 0, alElegir: () => mover(objeto.clave, -1) },
            { texto: t("ESPACIO.MOVER_DERECHA"), inhabilitada: indice === total - 1, alElegir: () => mover(objeto.clave, 1) },
            { texto: t("ESPACIO.CERRAR"), alElegir: onCerrar },
            { texto: t("ESPACIO.CERRAR_OTROS"), inhabilitada: total <= 1, alElegir: () => cerrarOtros(objeto.clave) },
            { texto: t("ESPACIO.CERRAR_TODOS"), alElegir: cerrarTodos },
          ]}
        />
      )}
    </span>
  );
}

/**
 * Qué se está arrastrando.
 *
 * ⚠️ **Fuera de React a propósito.** `dataTransfer` no se puede leer durante
 * `dragover` en todos los navegadores, y un `useState` acá volvería a
 * renderizar la barra entera en cada píxel del arrastre.
 */
const arrastrandoGlobal: { actual: string | null } = { actual: null };

function Desbordamiento({
  objetos,
  abierto,
  onAlternar,
  onCerrar,
}: {
  objetos: readonly ObjetoAbierto[];
  abierto: boolean;
  onAlternar: () => void;
  onCerrar: () => void;
}) {
  const { alternarPanel, cerrar, espacio } = useEspacioDeTrabajo();
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={onAlternar}
        aria-expanded={abierto}
        aria-label={`${t("ESPACIO.MAS")} (${objetos.length})`}
        title={t("ESPACIO.MAS")}
        className="flex items-center gap-1 justify-center"
        style={{
          minWidth: 44, minHeight: 44, padding: "0 10px",
          borderRadius: "var(--radius-pildora)",
          color: "var(--muted-foreground)",
          fontSize: "var(--text-meta)",
        }}
      >
        <MoreHorizontal size={16} aria-hidden />
        {objetos.length}
      </button>

      {abierto && (
        <Menu
          onCerrar={onCerrar}
          opciones={objetos.map((o) => ({
            texto: o.etiquetaSecundaria ? `${o.etiqueta} · ${o.etiquetaSecundaria}` : o.etiqueta,
            destacada: espacio.activo === o.clave,
            alElegir: () => alternarPanel(o.clave),
            alCerrar: () => cerrar(o.clave),
          }))}
        />
      )}
    </span>
  );
}

interface OpcionDeMenu {
  texto: string;
  inhabilitada?: boolean;
  destacada?: boolean;
  alElegir: () => void;
  /** Si existe, la fila lleva su propia ✕. */
  alCerrar?: () => void;
}

/**
 * El menú flotante.
 *
 * **`Escape` cierra esta capa y nada más** — la jerarquía de dos capas del
 * requisito 4: primero el menú, después (si no hay menú) la paleta. Nunca
 * cierra un objeto.
 */
function Menu({ opciones, onCerrar }: { opciones: readonly OpcionDeMenu[]; onCerrar: () => void }) {
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); onCerrar(); }
    }
    function afuera(e: MouseEvent) {
      if (caja.current && !caja.current.contains(e.target as Node)) onCerrar();
    }
    document.addEventListener("keydown", alTeclear, true);
    document.addEventListener("mousedown", afuera);
    return () => {
      document.removeEventListener("keydown", alTeclear, true);
      document.removeEventListener("mousedown", afuera);
    };
  }, [onCerrar]);

  return (
    <div
      ref={caja}
      role="menu"
      style={{
        position: "absolute", bottom: "calc(100% + 8px)", left: 0,
        minWidth: 220, maxWidth: 320,
        background: "var(--popover)",
        border: ".5px solid var(--border)",
        borderRadius: "var(--radius)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
        padding: 4, zIndex: 40,
      }}
    >
      {opciones.map((o) => (
        <span key={o.texto} className="flex items-center">
          <button
            role="menuitem"
            disabled={o.inhabilitada}
            onClick={() => { o.alElegir(); onCerrar(); }}
            className="flex-1 truncate text-left"
            style={{
              padding: "9px 12px", minHeight: 40,
              fontSize: "var(--text-label)",
              fontWeight: o.destacada ? 600 : 400,
              // `A-08`: deshabilitado con tratamiento propio, no indistinguible
              // del secundario.
              color: o.inhabilitada ? "var(--muted-foreground)" : "var(--foreground)",
              opacity: o.inhabilitada ? 0.5 : 1,
              cursor: o.inhabilitada ? "not-allowed" : "pointer",
              borderRadius: "var(--radius-control)",
            }}
          >
            {o.texto}
          </button>
          {o.alCerrar && (
            <button
              onClick={() => o.alCerrar?.()}
              aria-label={`${t("ESPACIO.CERRAR")}: ${o.texto}`}
              className="flex items-center justify-center"
              style={{ width: 36, height: 40, color: "var(--muted-foreground)" }}
            >
              <X size={13} aria-hidden />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

/** El límite duro actuando, dicho. Nada se cierra en silencio (ADR-088 §2). */
function AvisoDeDesalojo({ objeto }: { objeto: ObjetoAbierto }) {
  return (
    <div
      role="status"
      className="sticky flex justify-center"
      style={{ bottom: 76, zIndex: 51, padding: "0 16px", pointerEvents: "none" }}
    >
      <p
        style={{
          background: "var(--card)",
          border: ".5px solid var(--border)",
          borderRadius: "var(--radius-pildora)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
          padding: "8px 16px",
          fontSize: "var(--text-meta)",
          color: "var(--muted-foreground)",
        }}
      >
        {t("ESPACIO.DESALOJADO")} <strong style={{ color: "var(--foreground)" }}>{objeto.etiqueta}</strong>
      </p>
    </div>
  );
}

export { arrastrandoGlobal };


/**
 * El espacio de trabajo a 360 px — §10.12.
 *
 * Una píldora con **el objeto activo** y el total; al tocarla se abre una hoja
 * con todos. No compite con la navegación principal porque a este ancho la
 * barra lateral no está y la orientación la da el breadcrumb de la topbar.
 *
 * ⚠️ **Respeta el área segura del dispositivo.** Sin
 * `env(safe-area-inset-bottom)` la píldora queda debajo del indicador de inicio
 * de un iPhone, que es donde el pulgar no llega.
 */
function PildoraMovil({ onAbrirPaleta }: { onAbrirPaleta: () => void }) {
  const { espacio, alternarPanel, cerrar } = useEspacioDeTrabajo();
  const [hoja, setHoja] = useState(false);

  const activo = espacio.objetos.find((o) => o.clave === espacio.activo) ?? espacio.objetos[0];
  if (!activo) return null;
  const Icono = ICONOS[activo.tipo];

  return (
    <>
      <div
        className="sticky flex md:hidden justify-center"
        style={{
          bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          // Mismo motivo que la barra de escritorio: se maneja el panel desde acá.
          zIndex: 50,
          padding: "0 12px",
          pointerEvents: "none",
        }}
      >
        <button
          onClick={() => setHoja(true)}
          aria-haspopup="dialog"
          aria-label={`${t("ESPACIO.TITULO")} (${espacio.objetos.length})`}
          className="flex items-center gap-2"
          style={{
            pointerEvents: "auto",
            maxWidth: "100%",
            minHeight: 44,
            padding: "0 16px",
            background: "var(--card)",
            border: ".5px solid var(--border)",
            borderRadius: "var(--radius-pildora)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
            fontSize: "var(--text-label)",
            color: "var(--foreground)",
          }}
        >
          <Icono size={15} aria-hidden style={{ flexShrink: 0, color: "var(--muted-foreground)" }} />
          <span className="truncate">{activo.etiqueta}</span>
          {espacio.objetos.length > 1 && (
            <span style={{ color: "var(--muted-foreground)", fontSize: "var(--text-meta)" }}>
              +{espacio.objetos.length - 1}
            </span>
          )}
        </button>
      </div>

      {hoja && (
        <HojaDeObjetos
          onCerrarHoja={() => setHoja(false)}
          onAbrirPaleta={() => {
            setHoja(false);
            onAbrirPaleta();
          }}
          onActivar={(clave) => {
            alternarPanel(clave);
            setHoja(false);
          }}
          onCerrarObjeto={cerrar}
        />
      )}
    </>
  );
}

function HojaDeObjetos({
  onCerrarHoja,
  onAbrirPaleta,
  onActivar,
  onCerrarObjeto,
}: {
  onCerrarHoja: () => void;
  onAbrirPaleta: () => void;
  onActivar: (clave: string) => void;
  onCerrarObjeto: (clave: string) => void;
}) {
  const { espacio } = useEspacioDeTrabajo();

  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); onCerrarHoja(); }
    }
    document.addEventListener("keydown", alTeclear, true);
    return () => document.removeEventListener("keydown", alTeclear, true);
  }, [onCerrarHoja]);

  return (
    <div
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrarHoja(); }}
      className="md:hidden"
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(0,0,0,0.18)",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("ESPACIO.TITULO")}
        style={{
          width: "100%",
          background: "var(--card)",
          borderTopLeftRadius: "var(--radius)",
          borderTopRightRadius: "var(--radius)",
          border: ".5px solid var(--border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          maxHeight: "72vh", overflowY: "auto",
        }}
      >
        <p
          style={{
            padding: "16px 18px 8px",
            fontSize: "var(--text-label)",
            fontWeight: 600,
            color: "var(--foreground)",
          }}
        >
          {t("ESPACIO.TITULO")}
        </p>

        <ul>
          {espacio.objetos.map((o) => {
            const Icono = ICONOS[o.tipo];
            return (
              <li key={o.clave} className="flex items-center">
                <button
                  onClick={() => onActivar(o.clave)}
                  aria-current={espacio.activo === o.clave ? "true" : undefined}
                  className="flex flex-1 items-center gap-3 text-left min-w-0"
                  style={{
                    padding: "12px 18px", minHeight: 48,
                    fontWeight: espacio.activo === o.clave ? 600 : 400,
                    fontSize: "var(--text-body)",
                    color: "var(--foreground)",
                  }}
                >
                  <Icono size={16} aria-hidden style={{ flexShrink: 0, color: "var(--muted-foreground)" }} />
                  <span className="truncate">{o.etiqueta}</span>
                  {o.etiquetaSecundaria && (
                    <span className="truncate" style={{ color: "var(--muted-foreground)", fontSize: "var(--text-label)" }}>
                      {o.etiquetaSecundaria}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => onCerrarObjeto(o.clave)}
                  aria-label={`${t("ESPACIO.CERRAR")}: ${o.etiqueta}`}
                  className="flex items-center justify-center"
                  style={{ width: 48, height: 48, flexShrink: 0, color: "var(--muted-foreground)" }}
                >
                  <X size={16} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>

        <button
          onClick={onAbrirPaleta}
          className="flex w-full items-center gap-3"
          style={{
            padding: "14px 18px", minHeight: 48,
            borderTop: ".5px solid var(--border)",
            fontSize: "var(--text-body)",
            color: "var(--foreground)",
          }}
        >
          <Plus size={16} aria-hidden />
          {t("ESPACIO.ABRIR_OTRO")}
        </button>
      </div>
    </div>
  );
}
