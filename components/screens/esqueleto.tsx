"use client";

/**
 * `Esqueleto` — la primitiva que `design-system.md` §3.2 declaraba faltante,
 * especificada por `design-system-capturas.md` §9.1 (`P-12`).
 *
 * ## Qué es y qué no es
 *
 * Es **el lugar que ocupa un dato mientras la respuesta no llegó**. Nada más:
 *
 * - **Bloques en `--muted`, sin texto.** No lleva un nombre de materia de
 *   ejemplo ni un `0`: un esqueleto que se lee como dato es un fixture colado
 *   (AGENTS.md §2.5, *sin datos no es cero*).
 * - **Sin color de materia ni tono semántico.** No afirma de qué es ni si va
 *   bien o mal.
 * - **`aria-hidden`.** Quien usa lector oye *«Cargando…»* una vez
 *   (`PantallaCargando`), no veinte bloques mudos.
 * - **Late sólo con `motion-safe`.** Si el sistema pide menos movimiento, queda
 *   quieto.
 *
 * ## Cómo se arma el de una pantalla
 *
 * ⚠️ **En el mismo archivo que la pantalla y con sus mismas primitivas** —
 * `TituloDePanel`, `HeroCard`, la misma grilla—, nunca dibujado aparte: §9.1
 * *"si se dibuja aparte, se desincroniza en el primer cambio"*. Lo que no
 * depende de la respuesta —el título fijo, la subcopy, los títulos de sección,
 * la regla del flujo— **va real desde el primer frame**; sólo los datos son
 * bloques.
 *
 * ⚠️ **Las secciones opcionales se dibujan como si estuvieran.** §9.1 obliga a
 * elegir: *"o el esqueleto miente, o las tarjetas truncan a alto fijo"*. Achieve
 * elige **dibujar el caso completo**: si al llegar falta una sección, la pantalla
 * se acorta, pero lo que sí está no se corre de lugar hacia abajo.
 */

import { t } from "@/lib/content/es-AR";

/** Las clases del bloque. `motion-safe:` es la mitad de §9.1: late sólo si se puede. */
export const CLASE_DE_ESQUELETO = "motion-safe:animate-pulse";
const TINTA = "var(--muted)";

type Cuerpo = "meta" | "label" | "body" | "title-sm" | "title-lg";

/** El alto de línea con que cada cuerpo se dibuja en las pantallas. */
const INTERLINEA: Record<Cuerpo, number> = {
  meta: 1.5,
  label: 1.5,
  body: 1.5,
  "title-sm": 1.5,
  // `TituloDePanel` fija 1.2 en el `h1`.
  "title-lg": 1.2,
};

/** Un bloque. La forma la da quien lo usa: el radio del elemento que reemplaza. */
export function Esqueleto({
  ancho = "100%",
  alto,
  radio = 6,
  style,
}: {
  ancho?: number | string;
  alto: number | string;
  radio?: number | string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      data-esqueleto
      aria-hidden
      className={CLASE_DE_ESQUELETO}
      style={{ display: "block", width: ancho, height: alto, borderRadius: radio, background: TINTA, flexShrink: 0, ...style }}
    />
  );
}

/**
 * Un renglón de texto: **mide lo que mide la línea** del cuerpo que reemplaza, y
 * la barra adentro es más baja que la línea, como la tinta de una letra.
 *
 * Es un `span` a propósito: entra en un `h1` o en un `p` sin romper el HTML.
 */
export function Renglon({ cuerpo = "body", ancho = "100%", style }: { cuerpo?: Cuerpo; ancho?: number | string; style?: React.CSSProperties }) {
  return (
    <span
      aria-hidden
      style={{
        display: "flex",
        alignItems: "center",
        fontSize: `var(--text-${cuerpo})`,
        height: `calc(var(--text-${cuerpo}) * ${INTERLINEA[cuerpo]})`,
        ...style,
      }}
    >
      <Esqueleto ancho={ancho} alto="0.72em" radio={4} />
    </span>
  );
}

/** Varios renglones; el último, más corto, que es como termina un párrafo. */
export function Parrafo({ renglones = 2, cuerpo = "label" }: { renglones?: number; cuerpo?: Cuerpo }) {
  return (
    <span aria-hidden style={{ display: "block" }}>
      {Array.from({ length: renglones }, (_, i) => (
        <Renglon key={i} cuerpo={cuerpo} ancho={i === renglones - 1 && renglones > 1 ? "62%" : "100%"} />
      ))}
    </span>
  );
}

/** La CTA principal: mismo alto mínimo y mismo radio que `CTAPrincipal`. */
export function CTAEsqueleto() {
  return <Esqueleto alto={44} radio="var(--radius-control)" />;
}

/** Una acción secundaria centrada, del alto de `CTASecundaria`. */
export function CTASecundariaEsqueleto() {
  return <Renglon cuerpo="label" ancho={140} style={{ justifyContent: "center", marginTop: 10 }} />;
}

/** El chip de estado: el alto de `EstadoChip` y su radio de píldora. */
export function ChipEsqueleto({ ancho = 120 }: { ancho?: number }) {
  return (
    <Esqueleto
      ancho={ancho}
      alto="calc(var(--text-label) * 1.5 + 6px)"
      radio="var(--radius-pildora)"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    />
  );
}

/** Una acción del objeto arriba a la derecha, del alto de `AccionDeObjeto`. */
export function AccionDeObjetoEsqueleto({ ancho = 110 }: { ancho?: number }) {
  return <Esqueleto ancho={ancho} alto="calc(var(--text-label) * 1.5 + 12px)" radio="var(--radius-pildora)" />;
}

/**
 * La píldora de la fecha de Hoy y del Calendario: mismo relleno, borde y cuerpo
 * de letra, así el alto no cambia cuando llega.
 */
export function PildoraEsqueleto() {
  return (
    <span
      data-esqueleto
      aria-hidden
      className={`inline-flex items-center ${CLASE_DE_ESQUELETO}`}
      style={{
        border: "1px solid transparent",
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: "var(--text-label)",
        background: TINTA,
        width: 220,
      }}
    >
      &nbsp;
    </span>
  );
}

/** Un par label/valor, con la geometría de `Fila`. */
export function FilaEsqueleto() {
  return (
    <div
      aria-hidden
      className="flex items-center justify-between"
      style={{ padding: "9px 0", borderBottom: ".5px solid var(--border)", fontSize: "var(--text-body)" }}
    >
      <Renglon cuerpo="label" ancho={110} />
      <Renglon cuerpo="body" ancho={140} />
    </div>
  );
}

/** Una tarjeta con borde, como las de `UX02` y Modo Clase. */
export function TarjetaEsqueleto({ children, padding = 16, style }: { children: React.ReactNode; padding?: number | string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        background: "var(--card)",
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * El marco de toda pantalla que carga: `aria-busy` y **un solo** aviso para
 * lectores de pantalla. `data-cargando` lo hace direccionable en los tests.
 */
export function PantallaCargando({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div data-cargando aria-busy="true" className={className} style={style}>
      <span role="status" className="sr-only">
        {t("COMUN.CARGANDO")}
      </span>
      {children}
    </div>
  );
}
