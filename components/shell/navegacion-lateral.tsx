"use client";

/**
 * Navegación lateral del shell (Fase A2.1).
 *
 * Replica el patrón de las capturas de `docs/diseño/`
 * ([ADR-018](../../docs/decisions.md)), con las medidas tomadas de ellas y no
 * estimadas: **256 px expandida, 80 px colapsada**, las dos múltiplos de 8
 * (`design-system-capturas.md` §12.3).
 *
 * ── Lo que este componente no hace ──────────────────────────────────────────
 *
 * **No es una CTA.** No solicita una acción de dominio y no compite con la
 * acción primaria de la pantalla: `I-06` sigue diciendo una sola acción
 * destacada, y la barra no lo es.
 *
 * **No hay conmutador de tema.** Las capturas lo tienen, pero Achieve no define
 * paleta oscura y los tres semánticos están medidos sobre superficie clara
 * (`design-system-capturas.md` §12.4). Un control de tema que no cambia nada
 * sería prometer lo que no se sostiene.
 *
 * **Colapsar no degrada el contador.** El manual marca `A-03` como defecto del
 * producto original: al colapsar, el contador se degrada a un punto. Acá el
 * número **sigue siendo número**.
 *
 * ⚠️ **Recogida, la etiqueta NO se ve** — [ADR-101](../../docs/decisions.md#adr-101),
 * pedido del owner con el software de las capturas delante. Revierte la mitad
 * de `A-03` que dejaba el nombre chico debajo del ícono: el nombre pasa al
 * `aria-label` y al `title`, así lo lee un lector de pantalla y aparece al
 * pasar el mouse.
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Brain, CalendarRange, GraduationCap, ChevronLeft, ChevronRight, Library, PlayCircle, Route, Sun } from "lucide-react";
import { ConmutadorDeTema } from "./conmutador-de-tema";
import { DURACION_DE_BARRA, TRANSICION_DE_BARRA } from "./movimiento";
import { menu, rutaDelItem, type ItemDeMenu } from "@/lib/navigation/menu";
import { nodos, type NodoId } from "@/lib/navigation/surfaces";
import { t } from "@/lib/content/es-AR";

/*
  ⚠️ **Un ícono por ítem del menú, y el mapa se escribe con los nodos del menú.**
  Estaba escrito con `UX02` —que no está en el menú desde ADR-077— y sin
  `FORMACION`, así que *Materias* y *Formación* caían al sol de *Hoy*: tres
  ítems con el mismo dibujo. `Partial` y no un `as unknown as`, para que el
  hueco se vea en el tipo y no en la pantalla.
*/
const ICONOS: Partial<Record<NodoId, typeof Sun>> = {
  UX01: Sun,
  // ADR-110 · Enm. 1. **Un camino, no un calendario**: el ícono tenía que
  // distinguirse de `CALENDARIO`, porque separarlos es justamente la enmienda.
  PLAN_VIVO: Route,
  UX02_INDICE: Library,
  CALENDARIO: CalendarRange,
  FORMACION: PlayCircle,
  GIMNASIA: Brain,
  RECORRIDO: GraduationCap,
};

/**
 * `true` mientras la barra **se está recogiendo**: el nombre sigue montado, con
 * opacidad cero, hasta que el ancho termina de cerrarse.
 *
 * ⚠️ **Sólo si la recogió un clic.** Al hidratar, la barra nace expandida y se
 * corrige a recogida (`useBarraRecogida`); eso no es un gesto y no se anima.
 */
function useRecogiendose(colapsada: boolean, animar: boolean): boolean {
  const [previa, setPrevia] = useState(colapsada);
  const [recogiendose, setRecogiendose] = useState(false);
  // Ajuste durante el render, no en un efecto: el nombre no llega a desmontarse.
  if (previa !== colapsada) {
    setPrevia(colapsada);
    setRecogiendose(colapsada && animar);
  }
  useEffect(() => {
    if (!recogiendose) return;
    const id = setTimeout(() => setRecogiendose(false), DURACION_DE_BARRA);
    return () => clearTimeout(id);
  }, [recogiendose]);
  return recogiendose;
}

export function Item({
  item,
  activo,
  colapsada,
  recogiendose = false,
  animar = false,
}: {
  item: ItemDeMenu;
  activo: boolean;
  colapsada: boolean;
  /** La barra se está cerrando: el nombre se desvanece en vez de irse de golpe. */
  recogiendose?: boolean;
  /** Las medidas transicionan. Sólo después de que alguien tocó la flecha. */
  animar?: boolean;
}) {
  const Icono = ICONOS[item.nodo] ?? Sun;
  const conNombre = !colapsada || recogiendose;
  const transicion = animar ? TRANSICION_DE_BARRA : "";
  /*
    ⚠️ **Un ítem del menú navega, y nada más** — [ADR-088](../../docs/decisions.md#adr-088),
    Enmienda 7. La Enmienda 6 lo interceptaba para dejar la sección abierta en
    la barra de objetos, y la barra se llenaba sola con cada clic. Una sección
    es un lugar al que se va: la barra lateral **ya es** su acceso a un clic, y
    una ficha suya sería la segunda lista de destinos que ADR-019 temía.
  */
  return (
    <Link
      href={rutaDelItem(item)}
      data-item-menu={item.nodo}
      aria-current={activo ? "page" : undefined}
      // Recogida, el nombre sólo vive acá: lo lee el lector y aparece al pasar el mouse.
      aria-label={colapsada ? item.etiqueta : undefined}
      title={colapsada ? item.etiqueta : undefined}
      className={`flex items-center gap-3 overflow-hidden whitespace-nowrap ${transicion}`}
      style={{
        // El ítem activo es una píldora de superficie clara con sombra suave,
        // no un fondo de color: el color semántico se guarda para la alarma.
        background: activo ? "var(--card)" : "transparent",
        boxShadow: activo ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
        borderRadius: "var(--radius-pildora)",
        /*
          ⚠️ **Recogida, el ícono se centra con padding y no con `justify-center`.**
          Cambiar de alineación no se puede animar: el ícono saltaba al centro.
          19 px = (56 de ancho útil − 18 del ícono) / 2.
        */
        padding: colapsada ? "10px 0 10px 19px" : "10px 14px",
        color: "var(--foreground)",
        fontSize: "var(--text-body)",
        fontWeight: activo ? 600 : 400,
        minHeight: 40,
      }}
    >
      <span className="relative flex items-center">
        <Icono size={18} aria-hidden />
        {/*
          Colapsada, el contador se queda **como número** pegado al ícono.

          El manual de diseño marca esto como el anti-patrón `A-03`: en el
          producto original, colapsar degrada el contador (17) a un punto y
          "se pierde información para ganar 250 px". La regla es explícita —
          *un modo compacto puede reducir tamaño, nunca cantidad de
          información*—. Acá se reduce el tamaño del número, no el número.
        */}
        {colapsada && item.contador !== null && (
          <span
            data-contador
            style={{
              position: "absolute",
              top: -6,
              left: 12,
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              borderRadius: "var(--radius-pildora)",
              fontSize: "var(--text-meta)",
              fontWeight: 600,
              padding: "0 5px",
              lineHeight: 1.5,
            }}
          >
            {item.contador}
          </span>
        )}
      </span>

      {/* ADR-101: recogida, sólo el ícono — como el software de las capturas. */}
      {conNombre && (
        <span className={transicion} style={{ opacity: colapsada ? 0 : 1 }}>
          {item.etiqueta}
        </span>
      )}

      {conNombre && item.contador !== null && (
        <span
          data-contador
          className={transicion}
          style={{
            opacity: colapsada ? 0 : 1,
            marginLeft: "auto",
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            borderRadius: "var(--radius-pildora)",
            fontSize: "var(--text-meta)",
            fontWeight: 600,
            padding: "2px 8px",
          }}
        >
          {item.contador}
        </span>
      )}
    </Link>
  );
}

export function NavegacionLateral({
  nodoActivo,
  colapsada,
  onAlternar,
}: {
  nodoActivo: NodoId | null;
  colapsada: boolean;
  onAlternar: () => void;
}) {
  /*
    Las medidas transicionan **recién después del primer clic en la flecha**.
    Así la corrección de la hidratación y el `Shell` que monta al navegar dejan
    la barra puesta, sin animarla.
  */
  const [animar, setAnimar] = useState(false);
  const recogiendose = useRecogiendose(colapsada, animar);
  const conNombre = !colapsada || recogiendose;
  const transicion = animar ? TRANSICION_DE_BARRA : "";

  return (
    <nav
      aria-label={t("SHELL.NAVEGACION")}
      className={`hairline-r hidden md:flex md:flex-col ${transicion}`}
      style={{
        // Medido sobre las capturas, no estimado.
        width: colapsada ? 80 : 256,
        flexShrink: 0,
        padding: colapsada ? "16px 12px" : "16px",
        gap: 4,
        // El mismo fondo que la página; la separa el hairline. En oscuro es el
        // negro de la página, como en las capturas (ADR-097).
        background: "var(--background)",
        borderRight: ".5px solid var(--border)",
        /*
          ⚠️ **Fijo: siempre se ve entero, y lo que scrollea es la derecha** — lo
          pidió el owner. `sticky` con el alto de la ventana y no `fixed`: sigue
          ocupando su lugar en la fila, así la columna de contenido no necesita un
          `margin-left` que se desincronice al colapsar la barra (256 ↔ 80 px).
          `alignSelf` evita que el flex lo estire al alto de la página, que es lo
          que lo hacía scrollear con ella. Si alguna vez no entra —una ventana muy
          baja—, scrollea él solo, sin arrastrar la página.
        */
        position: "sticky",
        top: 0,
        height: "100vh",
        alignSelf: "flex-start",
        overflowY: "auto",
        // Mientras se achica, lo que no entra se recorta: sin esto aparece una
        // barra de scroll horizontal durante la transición.
        overflowX: "hidden",
      }}
    >
      {/*
        ⚠️ **El logo es el mismo en día y en noche** — ADR-101, lo pidió el owner.
        Es la suricata sobre su propio círculo negro: no depende del fondo, así
        que no lleva variante por tema.

        Expandida: logo y nombre a la izquierda, la flecha `‹` a la derecha.
        Recogida: el logo arriba y la flecha `›` debajo, como en las capturas.

        ⚠️ **La flecha va en `absolute` para poder viajar.** Pasar de fila a
        columna no se anima; `top` y `right` sí. El logo no se mueve: 16 + 6 px
        expandida y 12 + 10 recogida lo dejan en el mismo lugar.
      */}
      <div
        className={`relative shrink-0 ${transicion}`}
        style={{ height: colapsada ? 84 : 40 }}
      >
        {/*
          El logo lleva a Hoy, como en cualquier software: es la portada. Navega y
          nada más — igual que un ítem del menú, no guarda nada en la barra de
          objetos (ADR-088, Enmienda 7).
        */}
        <Link
          href={nodos.UX01.ruta ?? "/hoy"}
          data-logo
          className={`flex items-center whitespace-nowrap ${transicion}`}
          style={{ gap: 10, height: 40, paddingLeft: colapsada ? 10 : 6, width: "fit-content" }}
        >
          <Image src="/achieve-logo.png" alt="Achieve" width={36} height={36} priority />
          {conNombre && (
            <span
              aria-hidden
              className={transicion}
              style={{
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: "-0.03em",
                color: "var(--foreground)",
                opacity: colapsada ? 0 : 1,
              }}
            >
              Achieve
            </span>
          )}
        </Link>
        <button
          onClick={() => {
            setAnimar(true);
            onAlternar();
          }}
          aria-label={colapsada ? t("SHELL.EXPANDIR") : t("SHELL.COLAPSAR")}
          aria-expanded={!colapsada}
          title={colapsada ? t("SHELL.EXPANDIR") : t("SHELL.COLAPSAR")}
          className={`absolute flex items-center justify-center hover:bg-[var(--card)] ${transicion}`}
          style={{
            color: "var(--muted-foreground)",
            width: 32,
            height: 32,
            borderRadius: 999,
            // Expandida, centrada en la fila del logo; recogida, 12 px debajo y
            // centrada en los 56 px útiles.
            top: colapsada ? 50 : 4,
            right: colapsada ? 12 : 0,
          }}
        >
          {colapsada ? <ChevronRight size={18} aria-hidden /> : <ChevronLeft size={18} aria-hidden />}
        </button>
      </div>

      <div className="flex flex-col" style={{ gap: 4, marginTop: 12 }}>
        {menu.map((item) => (
          <Item
            key={item.nodo}
            item={item}
            activo={item.nodo === nodoActivo}
            colapsada={colapsada}
            recogiendose={recogiendose}
            animar={animar}
          />
        ))}
      </div>

      {/*
        El tema, al pie — ADR-097. **Salir se mudó al menú del avatar**, arriba a
        la derecha, que es donde lo busca quien usó el software de las capturas.
      */}
      <div className="hairline-t" style={{ marginTop: "auto", paddingTop: 12 }}>
        <ConmutadorDeTema colapsada={colapsada} animar={animar} />
      </div>
    </nav>
  );
}
