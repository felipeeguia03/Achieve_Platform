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
 * **Colapsar no destruye información.** El manual marca `A-03` como defecto del
 * producto original: al colapsar, el contador se degrada a un punto y los
 * íconos quedan sin etiqueta. Acá el número **sigue siendo número** y la
 * etiqueta **sigue estando**, más chica. Se copia el mecanismo, no el defecto.
 */

import Link from "next/link";
import { CalendarDays, ClipboardList, Library, PanelLeft, PlayCircle, Sun } from "lucide-react";
import { ConmutadorDeTema } from "./conmutador-de-tema";
import { menu, rutaDelItem, type ItemDeMenu } from "@/lib/navigation/menu";
import type { NodoId } from "@/lib/navigation/surfaces";
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
  UX02_INDICE: Library,
  UX06: ClipboardList,
  FORMACION: PlayCircle,
  UX07: CalendarDays,
};

export function Item({
  item,
  activo,
  colapsada,
}: {
  item: ItemDeMenu;
  activo: boolean;
  colapsada: boolean;
}) {
  const Icono = ICONOS[item.nodo] ?? Sun;
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
      className={colapsada ? "flex flex-col items-center" : "flex items-center gap-3"}
      style={{
        // El ítem activo es una píldora de superficie clara con sombra suave,
        // no un fondo de color: el color semántico se guarda para la alarma.
        background: activo ? "var(--card)" : "transparent",
        boxShadow: activo ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
        borderRadius: colapsada ? "var(--radius)" : "var(--radius-pildora)",
        padding: colapsada ? "8px 4px" : "10px 14px",
        gap: colapsada ? 4 : undefined,
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

      {/*
        La etiqueta tampoco desaparece: `A-03` señala que "los íconos sin
        etiqueta obligan a recordar en un producto que en todo lo demás evita
        el recuerdo". Colapsada baja a 11 px debajo del ícono; no se va.
      */}
      <span
        style={
          colapsada
            ? { fontSize: "var(--text-meta)", lineHeight: 1.2, textAlign: "center" }
            : undefined
        }
      >
        {item.etiqueta}
      </span>

      {!colapsada && item.contador !== null && (
        <span
          data-contador
          style={{
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
  return (
    <nav
      aria-label={t("SHELL.NAVEGACION")}
      className="hairline-r hidden md:flex md:flex-col"
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
      }}
    >
      <div
        className="flex items-center"
        style={{ justifyContent: colapsada ? "center" : "space-between", minHeight: 40 }}
      >
        {!colapsada && (
          <span style={{ fontWeight: 600, fontSize: "var(--text-body)", letterSpacing: "-0.022em" }}>
            Achieve
          </span>
        )}
        <button
          onClick={onAlternar}
          aria-label={colapsada ? t("SHELL.EXPANDIR") : t("SHELL.COLAPSAR")}
          aria-expanded={!colapsada}
          style={{ color: "var(--muted-foreground)", padding: 4 }}
        >
          <PanelLeft size={18} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col" style={{ gap: 4, marginTop: 12 }}>
        {menu.map((item) => (
          <Item key={item.nodo} item={item} activo={item.nodo === nodoActivo} colapsada={colapsada} />
        ))}
      </div>

      {/*
        El tema, al pie — ADR-097. **Salir se mudó al menú del avatar**, arriba a
        la derecha, que es donde lo busca quien usó el software de las capturas.
      */}
      <div className="hairline-t" style={{ marginTop: "auto", paddingTop: 12 }}>
        <ConmutadorDeTema colapsada={colapsada} />
      </div>
    </nav>
  );
}
