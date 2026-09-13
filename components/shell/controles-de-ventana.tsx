"use client";

/**
 * Los controles de ventana — [ADR-088](../../docs/decisions.md#adr-088), Enmienda 3.
 *
 * Tres controles redondos arriba a la izquierda: **cerrar, minimizar y
 * expandir**, en ese orden. Es el mecanismo de un escritorio, y el owner lo
 * pidió con ese nombre.
 *
 * ## Se toma el mecanismo, no la marca
 *
 * ⚠️ **No son rojo, amarillo y verde.** Achieve tiene tres colores semánticos
 * —éxito, urgencia y humano— y **los tres significan algo del dominio**:
 * `--exito-fill` en un botón de expandir diría *"esto salió bien"* sobre un
 * control de cromo. Eso es deriva de vocabulario por el eje del color, el mismo
 * `A-04` que hizo que el marco no se llamara «ventana».
 *
 * Y los colores literales de otro sistema operativo tampoco entran:
 * `AGENTS.md` §1.5 es explícito en que de una fuente se toma **el mecanismo**,
 * nunca su marca. Lo que hace que se lean como controles de ventana es **la
 * forma, el tamaño, el orden y el lugar**, no de quién son los colores.
 *
 * ## Y llevan su glifo puesto
 *
 * ⚠️ **No aparecen al pasar el mouse.** Un control que sólo dice qué hace cuando
 * ya lo estás por apretar es `P-05` al revés: el área activa tiene que
 * **parecer** lo que es. Con tres círculos mudos, cerrar y minimizar se
 * distinguen por la posición — y equivocarse cierra el objeto.
 */

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Minus, X } from "lucide-react";

import { t, type CopyId } from "@/lib/content/es-AR";
import {
  MARCO_MINIMO,
  ZONAS,
  rectanguloDeZona,
  type Area,
  type Zona,
} from "@/lib/domain/marco-de-panel";

/**
 * Un control redondo. El `hover` vive en estado porque el estilo es inline.
 *
 * ⚠️ **Los manejadores de puntero llegan de afuera y no reemplazan al `onClick`.**
 * El de expandir necesita saber cuánto se lo mantuvo apretado (Enmienda 6), y la
 * tentación era hacerlo todo con `pointerdown`/`pointerup`: eso rompe el
 * teclado, porque `Enter` sobre un `<button>` dispara `click` y ningún evento de
 * puntero. Los dos caminos conviven.
 */
function ControlRedondo({
  etiqueta,
  titulo,
  descripcion,
  expandible,
  menuAbierto,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onContextMenu,
  onKeyDown,
  children,
}: {
  etiqueta: string;
  /** Lo que se ve al pasar el mouse. Por defecto, la etiqueta. */
  titulo?: string;
  /** Lo que se dice de más, para quien no ve el `title`. */
  descripcion?: string;
  /** `true` ⇒ el control tiene un menú colgando y se anuncia como tal. */
  expandible?: boolean;
  menuAbierto?: boolean;
  onClick: () => void;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerLeave?: () => void;
  onPointerCancel?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  children: React.ReactNode;
}) {
  const [encima, setEncima] = useState(false);

  return (
    <button
      onClick={onClick}
      aria-label={descripcion ? `${etiqueta} · ${descripcion}` : etiqueta}
      /*
        ⚠️ **El gesto escondido va en el `aria-label`, no en un `aria-description`.**
        `aria-description` todavía no está soportado sobre `role="button"` —el
        linter de accesibilidad lo marca— y un atributo que la mitad de los
        lectores ignora es peor que no tenerlo: el gesto quedaría dicho sólo para
        quien pasa el mouse. Va pegado a la etiqueta, que se anuncia siempre.
      */
      title={titulo ?? etiqueta}
      aria-haspopup={expandible ? "menu" : undefined}
      aria-expanded={expandible ? menuAbierto === true : undefined}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => {
        setEncima(false);
        onPointerLeave?.();
      }}
      onFocus={() => setEncima(true)}
      onBlur={() => setEncima(false)}
      className="flex items-center justify-center"
      style={{
        /*
          ⚠️ **14 px de círculo dentro de 28 px de área táctil.** El punto se
          dibuja chico porque tres puntos grandes al lado del nombre del objeto
          pesan más que el nombre; lo que no puede ser chico es **dónde se puede
          apretar**, y por eso el `padding` va afuera del círculo y no adentro.
        */
        width: 14,
        height: 14,
        flexShrink: 0,
        borderRadius: 999,
        border: ".5px solid var(--border)",
        background: encima ? "var(--foreground)" : "var(--muted)",
        color: encima ? "var(--primary-foreground)" : "var(--muted-foreground)",
        transition: "background 140ms ease, color 140ms ease",
      }}
    >
      {children}
    </button>
  );
}

/**
 * Cuánto hay que mantener apretado para que aparezca el mosaico — Enmienda 6.
 *
 * ⚠️ **450 ms, y el número importa en las dos direcciones.** Más corto y un
 * clic común con la mano lenta abre un menú que nadie pidió; más largo y el
 * gesto se siente roto —se suelta antes de que pase nada— que es como se
 * aprende que la función no existe. Es el rango de un *long press* de sistema.
 */
const MANTENER_APRETADO = 450;

/** El dibujito de una zona: el rectángulo de la pantalla con su mitad pintada. */
function Miniatura({ zona }: { zona: Zona }) {
  /*
    Las mismas proporciones que la zona de verdad, en 22 × 15. No es decoración:
    es la única parte del control que dice **cuál** de las ocho es, y por eso se
    dibuja con las reglas del dominio y no con ocho íconos elegidos a ojo.
  */
  const r = rectanguloDeZona({ x: 0, y: 0, ancho: 100, alto: 100 }, zona);
  return (
    <span
      aria-hidden
      style={{
        position: "relative",
        display: "block",
        width: 22,
        height: 15,
        border: ".5px solid currentColor",
        borderRadius: 2,
        opacity: 0.85,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: `${r.x}%`,
          top: `${r.y}%`,
          width: `${r.ancho}%`,
          height: `${r.alto}%`,
          background: "currentColor",
        }}
      />
    </span>
  );
}

const ETIQUETA_DE_ZONA = {
  izquierda: "PANEL.ZONA.IZQUIERDA",
  derecha: "PANEL.ZONA.DERECHA",
  arriba: "PANEL.ZONA.ARRIBA",
  abajo: "PANEL.ZONA.ABAJO",
  "sup-izq": "PANEL.ZONA.SUP_IZQ",
  "sup-der": "PANEL.ZONA.SUP_DER",
  "inf-izq": "PANEL.ZONA.INF_IZQ",
  "inf-der": "PANEL.ZONA.INF_DER",
} as const satisfies Record<Zona, CopyId>;

/**
 * Qué zonas **entran** en esta pantalla.
 *
 * ⚠️ **Las que no entran no se dibujan, no se dibujan en gris.** Un cuarto de
 * una pantalla de 900 px de ancho mide 434 px de alto y 442 de ancho — entra—;
 * uno de 720 px no llega al mínimo de 380 × 260, y la ventana se saldría de su
 * cuadrante apenas la pongas ahí. `AGENTS.md` §2.7 es *omitir, no inventar*:
 * ofrecer una zona que no se va a respetar es prometer una cuadrícula que la
 * pantalla no puede dibujar.
 */
function zonasQueEntran(area: Area): readonly Zona[] {
  return ZONAS.filter((z) => {
    const r = rectanguloDeZona(area, z);
    return r.ancho >= MARCO_MINIMO.ancho && r.alto >= MARCO_MINIMO.alto;
  });
}

/** El selector de zonas, colgado del control de expandir. */
function Mosaico({
  zonas,
  actual,
  onElegir,
  onCerrar,
}: {
  zonas: readonly Zona[];
  actual: Zona | null;
  onElegir: (zona: Zona) => void;
  onCerrar: () => void;
}) {
  const caja = useRef<HTMLDivElement>(null);

  /*
    ⚠️ **`Escape` se come acá y no sube, igual que en los menús de la barra.**
    Es la jerarquía de dos capas del requisito 4: con el selector abierto,
    `Escape` lo cierra; sin él, minimiza la ventana. Sin `stopPropagation`, un
    solo `Escape` haría las dos cosas y la ventana se iría a la barra cuando lo
    único que se quería era salir del menú.
  */
  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCerrar();
      }
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
      aria-label={t("PANEL.MOSAICO")}
      /*
        Cuelga **hacia abajo** del control: el semáforo vive en la barra de
        título, y un menú hacia arriba se saldría de la ventana en cuanto
        estuviera pegada al borde superior de la pantalla —que es justo donde
        queda cada vez que se la amosaica—.
      */
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        left: -8,
        display: "grid",
        gridTemplateColumns: "repeat(4, auto)",
        gap: 4,
        padding: 6,
        background: "var(--popover)",
        border: ".5px solid var(--border)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--sombra-menu)",
        zIndex: 3,
      }}
    >
      {zonas.map((zona) => (
        <button
          key={zona}
          role="menuitem"
          onClick={() => {
            onElegir(zona);
            onCerrar();
          }}
          aria-label={t(ETIQUETA_DE_ZONA[zona])}
          title={t(ETIQUETA_DE_ZONA[zona])}
          aria-current={actual === zona ? "true" : undefined}
          className="flex items-center justify-center"
          style={{
            // 36 px: el mínimo táctil que el resto del cromo respeta.
            minWidth: 36,
            minHeight: 36,
            borderRadius: "var(--radius-control)",
            // La que ya está puesta se marca: sin eso, volver a elegirla parece
            // que no hizo nada — y lo que hace es sacarla del mosaico.
            background: actual === zona ? "var(--muted)" : "transparent",
            color: "var(--foreground)",
          }}
        >
          <Miniatura zona={zona} />
        </button>
      ))}
    </div>
  );
}

/**
 * El control de expandir, que además **abre el mosaico si lo mantenés
 * apretado** — Enmienda 6.
 *
 * ⚠️ **Tres caminos al mismo menú, y hacen falta los tres.** Mantener apretado
 * es el gesto que pidió el owner y el que trae la mano; el clic derecho es el
 * que prueba quien usa una computadora de escritorio; y `↓` con el foco puesto
 * es el que existe **sin mouse**, porque un long-press no se puede hacer con el
 * teclado y una función a la que sólo se llega con el puntero no está
 * terminada.
 */
function ControlDeExpandir({
  nombre,
  expandido,
  zona,
  zonas,
  onExpandir,
  onMosaico,
}: {
  nombre: string;
  expandido: boolean;
  zona: Zona | null;
  zonas: readonly Zona[];
  onExpandir: () => void;
  onMosaico: (zona: Zona) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * ⚠️ **Si el long-press ya disparó, el clic de soltar NO cuenta.** Sin esto,
   * mantener apretado abría el menú y **al soltar expandía la ventana**: el menú
   * quedaba flotando sobre una ventana que ya había hecho la otra cosa. Se ve
   * enseguida y se explica mal.
   */
  const yaDisparo = useRef(false);

  useEffect(() => () => {
    if (reloj.current) clearTimeout(reloj.current);
  }, []);

  function empezar() {
    if (zonas.length === 0) return;
    yaDisparo.current = false;
    reloj.current = setTimeout(() => {
      yaDisparo.current = true;
      setAbierto(true);
    }, MANTENER_APRETADO);
  }

  function soltar() {
    if (reloj.current) clearTimeout(reloj.current);
    reloj.current = null;
  }

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <ControlRedondo
        etiqueta={`${expandido ? t("PANEL.RESTAURAR") : t("PANEL.EXPANDIR")}: ${nombre}`}
        /*
          El gesto escondido, **dicho** — `I-04`. El `title` lo lee quien pasa el
          mouse y `aria-description` quien no ve la pantalla; sin las dos, el
          mosaico existiría sólo para el que ya sabe que existe.
        */
        titulo={
          zonas.length > 0
            ? `${expandido ? t("PANEL.RESTAURAR") : t("PANEL.EXPANDIR")} · ${t("PANEL.MOSAICO_AYUDA")}`
            : undefined
        }
        descripcion={zonas.length > 0 ? t("PANEL.MOSAICO_AYUDA") : undefined}
        expandible={zonas.length > 0}
        menuAbierto={abierto}
        onClick={() => {
          if (yaDisparo.current) {
            yaDisparo.current = false;
            return;
          }
          onExpandir();
        }}
        onPointerDown={empezar}
        onPointerUp={soltar}
        onPointerLeave={soltar}
        onPointerCancel={soltar}
        onContextMenu={(e) => {
          if (zonas.length === 0) return;
          e.preventDefault();
          setAbierto(true);
        }}
        onKeyDown={(e) => {
          if (zonas.length === 0) return;
          // `↓` abre el menú, que es lo que hace cualquier control con un menú
          // colgando. `Alt+Enter` porque es el otro que la gente prueba.
          if (e.key === "ArrowDown" || (e.key === "Enter" && e.altKey)) {
            e.preventDefault();
            setAbierto(true);
          }
        }}
      >
        {expandido ? (
          <Minimize2 size={8} strokeWidth={2.5} aria-hidden />
        ) : (
          <Maximize2 size={8} strokeWidth={2.5} aria-hidden />
        )}
      </ControlRedondo>

      {abierto && (
        <Mosaico
          zonas={zonas}
          actual={zona}
          onElegir={onMosaico}
          onCerrar={() => setAbierto(false)}
        />
      )}
    </span>
  );
}

/**
 * El semáforo: cerrar · minimizar · expandir.
 *
 * `onExpandir` ausente ⇒ **el control no se dibuja**. Es §2.7 —*omitir, no
 * inventar*—: a menos de 768 px no hay tamaño que alternar, y un botón que no
 * hace nada es peor que ninguno.
 */
export function Semaforo({
  nombre,
  expandido,
  zona = null,
  area,
  onCerrar,
  onMinimizar,
  onExpandir,
  onMosaico,
}: {
  /** Con qué nombrar el objeto en los `aria-label`. Con varias ventanas, «Cerrar» a secas es ambiguo. */
  nombre: string;
  expandido?: boolean;
  /** En qué zona está encajada, para marcarla en el selector. */
  zona?: Zona | null;
  /** El área utilizable, para saber **qué zonas entran**. Sin ella no hay mosaico. */
  area?: Area;
  /**
   * Ausente ⇒ **no hay cruz** — Enmienda 7. Es el caso de la pantalla completa:
   * no se cierra, se sale de ella; cerrar es sacar la ficha, y eso va en la ficha.
   */
  onCerrar?: () => void;
  onMinimizar: () => void;
  onExpandir?: () => void;
  /** Ausente ⇒ no hay mosaico: es el caso de la superficie, que ya ocupa todo. */
  onMosaico?: (zona: Zona) => void;
}) {
  const zonas = onMosaico && area ? zonasQueEntran(area) : [];

  return (
    <span className="flex items-center" style={{ gap: 8, flexShrink: 0 }}>
      {onCerrar && (
        <ControlRedondo etiqueta={`${t("PANEL.CERRAR")}: ${nombre}`} onClick={onCerrar}>
          <X size={9} strokeWidth={2.5} aria-hidden />
        </ControlRedondo>
      )}

      {/*
        ⚠️ **Minimizar y cerrar NO son lo mismo, y por eso son dos.** Minimizar
        deja el objeto en la barra; cerrar lo saca. Es la Enmienda 1 §4, y con
        dos controles pegados importa el doble.
      */}
      <ControlRedondo etiqueta={`${t("PANEL.MINIMIZAR")}: ${nombre}`} onClick={onMinimizar}>
        <Minus size={9} strokeWidth={2.5} aria-hidden />
      </ControlRedondo>

      {onExpandir &&
        (onMosaico && zonas.length > 0 ? (
          <ControlDeExpandir
            nombre={nombre}
            expandido={expandido === true}
            zona={zona}
            zonas={zonas}
            onExpandir={onExpandir}
            onMosaico={onMosaico}
          />
        ) : (
          <ControlRedondo
            etiqueta={`${expandido ? t("PANEL.RESTAURAR") : t("PANEL.EXPANDIR")}: ${nombre}`}
            onClick={onExpandir}
          >
            {expandido ? (
              <Minimize2 size={8} strokeWidth={2.5} aria-hidden />
            ) : (
              <Maximize2 size={8} strokeWidth={2.5} aria-hidden />
            )}
          </ControlRedondo>
        ))}
    </span>
  );
}
