"use client";

/**
 * ACHIEVE — el **Calendario**, [ADR-100](../../docs/decisions.md#adr-100).
 *
 * Tres vistas —día, semana, mes— de **los mismos eventos**: el horario semanal de
 * cursada, las evaluaciones con fecha y los compromisos que el estudiante tomó.
 * Cada evento lleva a su objeto.
 *
 * ## Lo que esta pantalla tiene prohibido
 *
 * 1. **Agendar.** Tocar un día **abre ese día**; no crea un bloque. El mockup del
 *    owner decía *"Click en un día para agendar un bloque"* y eso **no se
 *    construyó**: un compromiso nace en `UX04`, con su acción y su acuerdo.
 * 2. **Proponer un plan.** El botón *"Plan de estudio"* y el aviso *"Ver
 *    propuesta"* del mockup no tienen detrás nada que los sostenga: el ADE no
 *    agenda (ADR-064). Las evaluaciones encimadas ya las dice `UX01`.
 * 3. **Ocultar una evaluación.** Las clases y los compromisos se pueden apagar;
 *    las evaluaciones no, como en el mockup (*"siempre visible"*).
 * 4. **Inventar una hora o una duración.** Un evento sin hora va arriba del día;
 *    una evaluación con hora y sin fin se dibuja con alto mínimo, sin rótulo de
 *    fin.
 *
 * El color de cada chip es **identidad de materia, no medida** (ADR-075 §C1): el
 * mismo que en Materias y en Hoy.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";

import { TituloDePanel, ReglaDeNegocio } from "./design-system";
import { t } from "@/lib/content/es-AR";
import { colorDeMateria } from "@/lib/domain/color-de-materia";
import {
  diaDeLaSemana,
  fechasEntre,
  lunesDe,
  minutosDelDia,
  rangoDeVista,
  sumarDias,
  type VistaDeCalendario,
} from "@/lib/domain/calendario";
import type { CalendarioProps, EventoDeCalendario } from "@/lib/domain/view-models";

export interface CalendarioPantallaProps {
  vista: VistaDeCalendario;
  /** El día en que está anclada la vista, `YYYY-MM-DD`. */
  fecha: string;
  /** `null` ⇒ **todavía no llegó**: la grilla se dibuja igual, sin eventos. */
  datos: CalendarioProps | null;
  /** Hoy según el navegador, hasta que llegue el del servidor. */
  hoyLocal: string;
  mostrarClases: boolean;
  mostrarCompromisos: boolean;
  onVista: (v: VistaDeCalendario) => void;
  onFecha: (fecha: string) => void;
  onAnterior: () => void;
  onSiguiente: () => void;
  onAlternarClases: () => void;
  onAlternarCompromisos: () => void;
  onAbrir: (evento: EventoDeCalendario) => void;
}

const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: "var(--text-meta)" };
const TARJETA: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
};

const NOMBRE_DE_VISTA: Record<VistaDeCalendario, string> = { dia: "Día", semana: "Semana", mes: "Mes" };
const COLUMNAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// ── Formato ──────────────────────────────────────────────────────────────────

function formatear(fecha: string, opciones: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("es-AR", { ...opciones, timeZone: "UTC" })
    .format(new Date(`${fecha}T00:00:00Z`))
    .replace(/[.,]/g, "");
}

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** *"Septiembre 2026"* · *"14 – 20 sept 2026"* · *"Lunes 14 de septiembre"*. */
function rotuloDelPeriodo(vista: VistaDeCalendario, fecha: string): string {
  if (vista === "mes") return mayuscula(formatear(fecha, { month: "long", year: "numeric" }).replace(" de ", " "));
  if (vista === "dia") return mayuscula(formatear(fecha, { weekday: "long", day: "numeric", month: "long" }));
  const lunes = lunesDe(fecha);
  const domingo = sumarDias(lunes, 6);
  // Armado a mano: `Intl` intercala «de» —*"20 de sept de 2026"*— y el rótulo
  // de una semana se lee mejor corto.
  const mes = (f: string) => formatear(f, { month: "short" });
  const anio = domingo.slice(0, 4);
  return lunes.slice(0, 7) === domingo.slice(0, 7)
    ? `${Number(lunes.slice(8))} – ${Number(domingo.slice(8))} ${mes(domingo)} ${anio}`
    : `${Number(lunes.slice(8))} ${mes(lunes)} – ${Number(domingo.slice(8))} ${mes(domingo)} ${anio}`;
}

function descripcion(e: EventoDeCalendario): string {
  const cuando = [
    formatear(e.fecha, { weekday: "long", day: "numeric", month: "long" }),
    e.desde ? (e.hasta ? `de ${e.desde} a ${e.hasta}` : `a las ${e.desde}`) : null,
  ]
    .filter(Boolean)
    .join(", ");
  const que = e.tipo === "clase" ? `Clase de ${e.titulo}` : e.tipo === "evaluacion" ? e.titulo : `Compromiso: ${e.titulo}`;
  const destino =
    e.enlace.a === "clase" ? "Abrir clase" : e.enlace.a === "compromiso" ? "Abrir compromiso" : "Abrir materia";
  return [que, cuando, e.detalle, e.estimado ? "horario estimado" : null, destino].filter(Boolean).join(". ");
}

// ── La pantalla ──────────────────────────────────────────────────────────────

export function Calendario(p: CalendarioPantallaProps) {
  const hoy = p.datos?.hoy ?? p.hoyLocal;
  const eventos = (p.datos?.eventos ?? []).filter(
    (e) => (e.tipo !== "clase" || p.mostrarClases) && (e.tipo !== "compromiso" || p.mostrarCompromisos),
  );
  const rango = rangoDeVista(p.vista, p.fecha);
  const enRango = eventos.filter((e) => e.fecha >= rango.desde && e.fecha <= rango.hasta);

  return (
    <div data-calendario>
      <TituloDePanel
        titulo="Calendario"
        acciones={
          <span className="hidden md:inline-flex">
            {p.datos ? <Pildora fecha={p.datos.fechaDeHoy} dias={p.datos.proximaEvaluacionEnDias} /> : <PildoraEsqueleto />}
          </span>
        }
      />
      {/* En el piso móvil la píldora baja: arriba a la derecha pisaba el título. */}
      <div className="md:hidden" style={{ marginTop: -20 }}>
        {p.datos ? <Pildora fecha={p.datos.fechaDeHoy} dias={p.datos.proximaEvaluacionEnDias} /> : <PildoraEsqueleto />}
      </div>

      {/* ── La barra de controles ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center" style={{ gap: 12, margin: "24px 0 16px" }}>
        <div role="group" aria-label="Vista" className="inline-flex" style={{ ...TARJETA, borderRadius: 10, padding: 3, gap: 2 }}>
          {(["dia", "semana", "mes"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => p.onVista(v)}
              aria-pressed={p.vista === v}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                background: p.vista === v ? "var(--foreground)" : "transparent",
                color: p.vista === v ? "var(--background)" : "var(--muted-foreground)",
                fontSize: "var(--text-label)",
                fontWeight: p.vista === v ? 600 : 500,
              }}
            >
              {NOMBRE_DE_VISTA[v]}
            </button>
          ))}
        </div>

        <h2 aria-live="polite" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>
          {rotuloDelPeriodo(p.vista, p.fecha)}
        </h2>

        <div className="flex flex-wrap items-center" style={{ gap: 8, marginLeft: "auto" }}>
          <Alternador activo={p.mostrarClases} onClick={p.onAlternarClases}>
            Clases
          </Alternador>
          <Alternador activo={p.mostrarCompromisos} onClick={p.onAlternarCompromisos}>
            Compromisos
          </Alternador>
          <span aria-hidden className="hidden sm:inline-block" style={{ width: 1, height: 24, background: "var(--border)", margin: "0 4px" }} />
          {/* Los tres juntos: partidos en dos líneas, «›» quedaba solo abajo. */}
          <span className="inline-flex" style={{ gap: 8 }}>
            <BotonDeBorde onClick={p.onAnterior} etiqueta={`${NOMBRE_DE_VISTA[p.vista]} anterior`}>
              <ChevronLeft size={16} aria-hidden />
            </BotonDeBorde>
            <BotonDeBorde onClick={() => p.onFecha(hoy)}>Hoy</BotonDeBorde>
            <BotonDeBorde onClick={p.onSiguiente} etiqueta={`${NOMBRE_DE_VISTA[p.vista]} siguiente`}>
              <ChevronRight size={16} aria-hidden />
            </BotonDeBorde>
          </span>
        </div>
      </div>

      {/*
        ── La grilla ───────────────────────────────────────────────────────────
        ⚠️ **Su alto no depende de los eventos** (13 sep 2026, pedido del owner):
        prender las clases no puede empujar el calendario fuera de la pantalla.
        El mes reparte `ALTO_GRILLA` entre sus semanas y la semana entre sus horas;
        lo que no entra se resume en *"+N más"*.
      */}
      <div aria-busy={p.datos === null} style={{ overflowX: "auto", position: "relative" }}>
        {p.vista === "mes" ? (
          <Mes fecha={p.fecha} hoy={hoy} eventos={eventos} cargando={p.datos === null} onDia={(f) => { p.onFecha(f); p.onVista("dia"); }} onAbrir={p.onAbrir} />
        ) : (
          <Horas
            fechas={fechasEntre(rango.desde, rango.hasta)}
            hoy={hoy}
            eventos={enRango}
            cargando={p.datos === null}
            detallada={p.vista === "dia"}
            onDia={(f) => { p.onFecha(f); p.onVista("dia"); }}
            onAbrir={p.onAbrir}
          />
        )}
        {/* Encima de la grilla y no debajo: debajo le sumaba una línea al alto. */}
        {p.datos && enRango.length === 0 && (
          <p
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              margin: 0,
              padding: "8px 14px",
              ...TARJETA,
              borderRadius: 999,
              fontSize: "var(--text-label)",
              color: "var(--muted-foreground)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            {p.vista === "dia" ? "Este día no tiene" : "Estas fechas no tienen"} clases, evaluaciones ni compromisos
            {!p.mostrarClases || !p.mostrarCompromisos ? " a la vista" : ""}.
          </p>
        )}
      </div>

      <Leyenda />

      {/*
        Una sola línea, **reservada aunque las clases estén apagadas**: si apareciera
        sólo con ellas, prenderlas movería el pie. El texto largo va en `title`.

        ⚠️ **El aviso de estimado es obligatorio y va literal** (ADR-094): sin él el
        aula y la hora se leen como dato de la facultad. Y la otra mitad es la que
        ADR-100 exige decir — que el calendario no sabe de feriados.
      */}
      <div style={{ minHeight: 20 }}>
        {p.mostrarClases && (
          <ReglaDeNegocio>
            <span title={EXPLICACION_DE_CLASES}>
              Las clases repiten tu horario semanal: no contemplan feriados, suspensiones ni el fin del cuatrimestre.
            </span>
            {p.datos?.horarioEstimado && (
              <>
                <span aria-hidden> · </span>
                {t("COMUN.HORARIO_ESTIMADO")}
              </>
            )}
          </ReglaDeNegocio>
        )}
      </div>
    </div>
  );
}

const EXPLICACION_DE_CLASES =
  "Las clases son tu horario semanal de cursada, repetido en cada semana: el calendario todavía no sabe de feriados, suspensiones ni cuándo termina el cuatrimestre.";

// ── Controles ────────────────────────────────────────────────────────────────

function Pildora({ fecha, dias }: { fecha: string; dias: number | null }) {
  const cerca = dias !== null && dias <= 7;
  return (
    <span
      className="inline-flex items-center gap-2"
      style={{ ...TARJETA, borderRadius: 999, padding: "6px 14px", fontSize: "var(--text-label)", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}
    >
      <span aria-hidden style={{ width: 7, height: 7, borderRadius: 999, background: cerca ? "var(--urgencia-texto)" : "var(--muted-foreground)" }} />
      <span>{fecha}</span>
      {/* `null` ⇒ no hay evaluación con fecha, que no es «0 días» (`P-09`). */}
      {dias !== null && (
        <>
          <span aria-hidden>·</span>
          {dias === 0 ? (
            <strong style={{ color: "var(--foreground)" }}>{t("HOY.PILDORA.HOY")}</strong>
          ) : (
            <span>
              <strong style={{ color: "var(--foreground)" }}>{dias === 1 ? "1 día" : `${dias} días`}</strong>{" "}
              {t("HOY.PILDORA.DIAS")}
            </span>
          )}
        </>
      )}
    </span>
  );
}

// ── Esqueletos ───────────────────────────────────────────────────────────────

/**
 * Lo que ocupa el lugar de un dato **mientras la respuesta no llegó** —
 * `design-system-capturas.md` §9.1. Sale del mismo layout que lo reemplaza:
 * la grilla, la barra y el pie se dibujan reales desde el primer frame, y sólo
 * los eventos y la píldora son bloques.
 *
 * ⚠️ **No es un evento.** No lleva texto, ni `data-evento`, ni color de materia,
 * y va `aria-hidden`: quien lee con lector oye `aria-busy` en la grilla, no
 * clases inventadas. Dónde caen los bloques es **fijo** y no dice nada del
 * horario del estudiante. Late sólo si el sistema no pide menos movimiento.
 */
const ESQUELETO = "motion-safe:animate-pulse";
const TINTA_DE_ESQUELETO = "var(--muted)";

/** Anchos de los chips del mes, en ciclo: iguales se leerían como datos. */
const ANCHOS_DE_CHIP = ["72%", "56%", "88%", "64%", "80%"];

/**
 * Los bloques de una columna de semana o día: `[hora de inicio, horas]`. Dos
 * patrones alternados por columna, dentro de la franja por defecto de 8 a 22.
 */
const BLOQUES_DE_COLUMNA: [number, number][][] = [
  [[9, 2], [15, 1.5]],
  [[11, 1.5], [18, 2]],
];

function PildoraEsqueleto() {
  // Mismo relleno, borde y cuerpo de letra que `Pildora`: el alto no cambia al llegar.
  return (
    <span
      data-esqueleto
      aria-hidden
      className={`inline-flex items-center ${ESQUELETO}`}
      style={{
        border: "1px solid transparent",
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: "var(--text-label)",
        background: TINTA_DE_ESQUELETO,
        width: 220,
      }}
    >
      &nbsp;
    </span>
  );
}

function ChipEsqueleto({ ancho }: { ancho: string }) {
  return (
    <span
      data-esqueleto
      aria-hidden
      className={ESQUELETO}
      style={{ display: "block", width: ancho, height: ALTO_DE_CHIP, flexShrink: 0, borderRadius: 5, background: TINTA_DE_ESQUELETO }}
    />
  );
}

function Alternador({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      style={{
        padding: "7px 14px",
        borderRadius: 8,
        border: `1px solid ${activo ? "var(--foreground)" : "var(--border)"}`,
        background: activo ? "var(--foreground)" : "var(--card)",
        color: activo ? "var(--background)" : "var(--muted-foreground)",
        fontSize: "var(--text-label)",
        fontWeight: 500,
      }}
    >
      {children}
    </button>
  );
}

function BotonDeBorde({ onClick, etiqueta, children }: { onClick: () => void; etiqueta?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="inline-flex items-center justify-center hover:bg-[var(--muted)]"
      style={{
        minWidth: 36,
        height: 34,
        padding: "0 12px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--card)",
        color: "var(--foreground)",
        fontSize: "var(--text-label)",
        fontWeight: 500,
      }}
    >
      {children}
    </button>
  );
}

// ── Los chips ────────────────────────────────────────────────────────────────

/**
 * Cómo se ve cada tipo — la forma dice el tipo, el color dice la materia.
 *
 * - **Clase:** relleno suave del color de la materia con filete a la izquierda,
 *   el mismo tratamiento que la ventana del Gantt.
 * - **Compromiso:** tarjeta con borde y el punto de la materia. Punteado si se
 *   incumplió: **se ve, no se esconde** (`AGENTS.md` §2.4).
 * - **Evaluación:** tinta invertida, que se lee en los dos temas sin un color
 *   nuevo.
 */
function estiloDeChip(e: EventoDeCalendario): React.CSSProperties {
  const color = e.cursadaId ? colorDeMateria(e.cursadaId) : "var(--muted-foreground)";
  if (e.tipo === "evaluacion") {
    return { background: "var(--foreground)", color: "var(--background)", border: "1px solid var(--foreground)" };
  }
  if (e.tipo === "clase") {
    return {
      background: `color-mix(in srgb, ${color} 16%, var(--card))`,
      color: "var(--foreground)",
      border: `1px solid color-mix(in srgb, ${color} 30%, var(--card))`,
      borderLeft: `3px ${e.estimado ? "dashed" : "solid"} ${color}`,
    };
  }
  return {
    background: "var(--card)",
    color: e.estado === "CUMPLIDO" || e.estado === "INCUMPLIDO" ? "var(--muted-foreground)" : "var(--foreground)",
    border: `1px ${e.estado === "INCUMPLIDO" ? "dashed" : "solid"} var(--border)`,
  };
}

function Punto({ e }: { e: EventoDeCalendario }) {
  if (e.tipo === "clase") return null;
  const color = e.cursadaId ? colorDeMateria(e.cursadaId) : "currentColor";
  return <span aria-hidden style={{ width: 7, height: 7, borderRadius: 2, background: color, flexShrink: 0 }} />;
}

function Chip({ e, onAbrir }: { e: EventoDeCalendario; onAbrir: (e: EventoDeCalendario) => void }) {
  // En la celda del mes sólo entra la hora de inicio: con el rango completo no
  // se lee la materia. El rango entero va en el `aria-label` y en la semana.
  return (
    <button
      type="button"
      data-evento={e.tipo}
      onClick={(ev) => {
        ev.stopPropagation();
        onAbrir(e);
      }}
      aria-label={descripcion(e)}
      title={descripcion(e)}
      className="flex w-full items-center hover:brightness-[0.97]"
      style={{
        ...estiloDeChip(e),
        gap: 6,
        minWidth: 0,
        flexShrink: 0,
        height: ALTO_DE_CHIP,
        padding: "0 6px",
        borderRadius: 5,
        fontSize: 12,
        lineHeight: 1,
        textAlign: "left",
        fontWeight: e.tipo === "evaluacion" ? 600 : 500,
      }}
    >
      <Punto e={e} />
      {e.desde && (
        <span style={{ ...MONO, fontSize: 11, opacity: 0.8, flexShrink: 0 }}>
          {e.desde}
        </span>
      )}
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textDecoration: e.estado === "CUMPLIDO" ? "line-through" : undefined,
        }}
      >
        {e.titulo}
      </span>
    </button>
  );
}

// ── Mes ──────────────────────────────────────────────────────────────────────

/**
 * El alto de la grilla en las tres vistas, con el borde. Medido en 1440×900: con
 * la barra de controles arriba y la leyenda y su nota abajo, el calendario entra
 * entero sin scrollear.
 */
export const ALTO_GRILLA = 600;
/** Un evento en la celda del mes o en la fila *sin hora*: una línea. */
const ALTO_DE_CHIP = 20;
const CABECERA_DEL_MES = 36;
/** El número del día arriba de la celda. */
const ALTO_DEL_NUMERO = 24;
const HUECO = 3;
const RELLENO_DE_CELDA = { arriba: 4, abajo: 6 };

/**
 * Cuántos renglones —eventos o *"+N más"*— entran en una celda del mes. Sale del
 * alto de la fila, **no de cuántos eventos haya**: un mes de seis semanas tiene
 * filas más bajas y muestra menos antes de resumir.
 */
export function renglonesPorCelda(semanas: number): number {
  const fila = (ALTO_GRILLA - 2 - CABECERA_DEL_MES) / semanas;
  const libre = fila - 1 - RELLENO_DE_CELDA.arriba - RELLENO_DE_CELDA.abajo - ALTO_DEL_NUMERO;
  return Math.max(1, Math.floor(libre / (ALTO_DE_CHIP + HUECO)));
}

function Mes({
  fecha,
  hoy,
  eventos,
  cargando,
  onDia,
  onAbrir,
}: {
  fecha: string;
  hoy: string;
  eventos: EventoDeCalendario[];
  cargando: boolean;
  onDia: (f: string) => void;
  onAbrir: (e: EventoDeCalendario) => void;
}) {
  const { desde, hasta } = rangoDeVista("mes", fecha);
  const fechas = fechasEntre(desde, hasta);
  const mes = fecha.slice(0, 7);
  const porDia = agrupar(eventos);
  const semanas = fechas.length / 7;
  const renglones = renglonesPorCelda(semanas);

  return (
    <div
      aria-label="Mes"
      style={{
        ...TARJETA,
        overflow: "hidden",
        minWidth: 760,
        height: ALTO_GRILLA,
        display: "grid",
        gridTemplateRows: `${CABECERA_DEL_MES}px repeat(${semanas}, minmax(0, 1fr))`,
      }}
    >
      <div className="grid grid-cols-7 items-center" style={{ borderBottom: "1px solid var(--border)" }}>
        {COLUMNAS.map((c) => (
          <div
            key={c}
            style={{ ...MONO, padding: "0 12px", textAlign: "right", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted-foreground)" }}
          >
            {c}
          </div>
        ))}
      </div>

      {Array.from({ length: semanas }, (_, fila) => (
        <div key={fila} className="grid grid-cols-7" style={{ minHeight: 0 }}>
          {fechas.slice(fila * 7, fila * 7 + 7).map((f, col) => {
            const delDia = porDia.get(f) ?? [];
            // Si no entran todos, el último renglón es el *"+N más"*.
            const visibles = delDia.length > renglones ? renglones - 1 : delDia.length;
            const fuera = f.slice(0, 7) !== mes;
            const esHoy = f === hoy;
            return (
              <div
                key={f}
                onClick={() => onDia(f)}
                className="cursor-pointer"
                style={{
                  minHeight: 0,
                  overflow: "hidden",
                  padding: `${RELLENO_DE_CELDA.arriba}px 6px ${RELLENO_DE_CELDA.abajo}px`,
                  borderTop: fila === 0 ? undefined : "1px solid var(--border)",
                  borderLeft: col === 0 ? undefined : "1px solid var(--border)",
                  background: esHoy
                    ? "color-mix(in srgb, var(--foreground) 4%, var(--card))"
                    : fuera
                      ? "color-mix(in srgb, var(--muted) 55%, var(--card))"
                      : "var(--card)",
                  display: "flex",
                  flexDirection: "column",
                  gap: HUECO,
                  minWidth: 0,
                }}
              >
                <div className="flex justify-end" style={{ height: ALTO_DEL_NUMERO, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onDia(f);
                    }}
                    aria-label={`Ver el ${formatear(f, { weekday: "long", day: "numeric", month: "long" })}`}
                    aria-current={esHoy ? "date" : undefined}
                    style={{
                      color: esHoy ? "var(--background)" : fuera ? "var(--muted-foreground)" : "var(--foreground)",
                      fontSize: esHoy ? 13 : 16,
                      fontWeight: esHoy ? 600 : 300,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {/*
                      El círculo va en el `span`: `globals.css` le fija el radio a
                      todo `button` con `!important`, y un botón no puede ser redondo.
                    */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: ALTO_DEL_NUMERO,
                        height: ALTO_DEL_NUMERO,
                        padding: esHoy ? 0 : "0 4px",
                        borderRadius: 999,
                        background: esHoy ? "var(--foreground)" : "transparent",
                      }}
                    >
                      {fuera && !esHoy ? formatear(f, { day: "numeric", month: "short" }) : Number(f.slice(8))}
                    </span>
                  </button>
                </div>
                {/* Un chip por día hábil del mes, nunca más de lo que entra en la celda. */}
                {cargando && !fuera && col < 5 && (
                  <ChipEsqueleto ancho={ANCHOS_DE_CHIP[(fila * 2 + col) % ANCHOS_DE_CHIP.length]} />
                )}
                {delDia.slice(0, visibles).map((e) => (
                  <Chip key={e.id} e={e} onAbrir={onAbrir} />
                ))}
                {delDia.length > visibles && (
                  <MasEventos cantidad={delDia.length - visibles} onClick={() => onDia(f)} />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function agrupar(eventos: EventoDeCalendario[]): Map<string, EventoDeCalendario[]> {
  const m = new Map<string, EventoDeCalendario[]>();
  for (const e of eventos) m.set(e.fecha, [...(m.get(e.fecha) ?? []), e]);
  // Dentro del día: primero lo que no tiene hora, después por hora. Las
  // evaluaciones, ante la misma hora, adelante — son las que no se mueven.
  for (const lista of m.values()) {
    lista.sort((a, b) => {
      if (a.desde !== b.desde) return a.desde === null ? -1 : b.desde === null ? 1 : a.desde < b.desde ? -1 : 1;
      return (a.tipo === "evaluacion" ? 0 : 1) - (b.tipo === "evaluacion" ? 0 : 1);
    });
  }
  return m;
}

/** *"+N más"*: abre el día, que es donde se ven todos. */
function MasEventos({ cantidad, onClick }: { cantidad: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(ev) => {
        ev.stopPropagation();
        onClick();
      }}
      className="hover:underline"
      style={{
        ...MONO,
        height: ALTO_DE_CHIP,
        flexShrink: 0,
        textAlign: "left",
        color: "var(--muted-foreground)",
        padding: "0 4px",
        whiteSpace: "nowrap",
      }}
    >
      +{cantidad} más
    </button>
  );
}

// ── Semana y día ─────────────────────────────────────────────────────────────

const CABECERA_DE_HORAS = 48;
/** La fila *sin hora*: **un solo renglón**, para que no le robe alto a la franja. */
const FILA_SIN_HORA = ALTO_DE_CHIP + 12;
/**
 * Por debajo de esto una hora no se lee, y la franja scrollea **adentro** de la
 * grilla en vez de achicarse. Pasa sólo si un evento estira el día a más de ~20 h.
 */
const HORA_MINIMA_PX = 24;
/** Lo mínimo que ocupa un evento, para que su texto se lea. **No es una duración.** */
const ALTO_MINIMO = ALTO_DE_CHIP;
/** Por debajo de este alto, el evento va en una línea: hora de inicio y título. */
const ALTO_DE_DOS_LINEAS = 40;

/**
 * El alto de una hora: lo que queda de `ALTO_GRILLA` repartido entre las horas de
 * la franja. **Más horas, horas más bajas**; el total no cambia.
 */
export function altoDeHora(horas: number, conFilaSinHora: boolean): number {
  const cuerpo = ALTO_GRILLA - 2 - CABECERA_DE_HORAS - (conFilaSinHora ? FILA_SIN_HORA : 0);
  return Math.max(HORA_MINIMA_PX, cuerpo / Math.max(1, horas));
}

function Horas({
  fechas,
  hoy,
  eventos,
  cargando,
  detallada,
  onDia,
  onAbrir,
}: {
  fechas: string[];
  hoy: string;
  eventos: EventoDeCalendario[];
  cargando: boolean;
  detallada: boolean;
  onDia: (f: string) => void;
  onAbrir: (e: EventoDeCalendario) => void;
}) {
  const conHora = eventos.filter((e) => e.desde !== null);
  const sinHora = eventos.filter((e) => e.desde === null);

  // La franja visible: 8 a 22 salvo que algún evento caiga afuera.
  const inicios = conHora.map((e) => minutosDelDia(e.desde) as number);
  const fines = conHora.map((e) => minutosDelDia(e.hasta) ?? (minutosDelDia(e.desde) as number) + 30);
  const primera = Math.max(0, Math.min(8, ...inicios.map((m) => Math.floor(m / 60))));
  const ultima = Math.min(24, Math.max(22, ...fines.map((m) => Math.ceil(m / 60))));
  const horas = Array.from({ length: ultima - primera }, (_, i) => primera + i);
  const horaPx = altoDeHora(horas.length, sinHora.length > 0);
  const columnas = `64px repeat(${fechas.length}, minmax(0, 1fr))`;

  return (
    <div
      aria-label={detallada ? "Día" : "Semana"}
      style={{
        ...TARJETA,
        overflow: "hidden",
        minWidth: detallada ? 0 : 760,
        height: ALTO_GRILLA,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Cabecera de días */}
      <div className="grid" style={{ gridTemplateColumns: columnas, height: CABECERA_DE_HORAS, flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
        <div />
        {fechas.map((f) => {
          const esHoy = f === hoy;
          return (
            <button
              key={f}
              type="button"
              onClick={() => onDia(f)}
              aria-current={esHoy ? "date" : undefined}
              className="flex items-center justify-center"
              style={{ gap: 8, padding: "0 6px", borderLeft: "1px solid var(--border)" }}
            >
              <span style={{ ...MONO, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted-foreground)" }}>
                {COLUMNAS[(diaDeLaSemana(f) + 6) % 7]}
              </span>
              <span
                style={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: esHoy ? "var(--foreground)" : "transparent",
                  color: esHoy ? "var(--background)" : "var(--foreground)",
                  fontSize: esHoy ? 14 : 18,
                  fontWeight: esHoy ? 600 : 300,
                }}
              >
                {Number(f.slice(8))}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lo que no tiene hora: una fila arriba, sin hora inventada. */}
      {sinHora.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: columnas, height: FILA_SIN_HORA, flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-end" style={{ ...MONO, padding: "0 8px", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>
            sin hora
          </div>
          {fechas.map((f) => {
            const delDia = sinHora.filter((e) => e.fecha === f);
            // En la semana entra uno por día y el resto se resume; en el día van
            // todos en fila, y si no entran la fila scrollea de costado.
            const visibles = detallada ? delDia : delDia.slice(0, 1);
            return (
              <div
                key={f}
                className="flex items-center"
                style={{ gap: 6, padding: "0 6px", borderLeft: "1px solid var(--border)", minWidth: 0, overflowX: detallada ? "auto" : "hidden" }}
              >
                {visibles.map((e) => (
                  <span key={e.id} style={detallada ? { width: 260, flexShrink: 0 } : { flex: 1, minWidth: 0 }}>
                    <Chip e={e} onAbrir={onAbrir} />
                  </span>
                ))}
                {delDia.length > visibles.length && (
                  <MasEventos cantidad={delDia.length - visibles.length} onClick={() => onDia(f)} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* El cuerpo con horas */}
      <div className="grid" style={{ gridTemplateColumns: columnas, position: "relative", flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div>
          {horas.map((h) => (
            <div key={h} style={{ height: horaPx, position: "relative" }}>
              <span style={{ ...MONO, position: "absolute", top: -7, right: 8, color: "var(--muted-foreground)" }}>
                {h === primera ? "" : `${String(h).padStart(2, "0")}:00`}
              </span>
            </div>
          ))}
        </div>
        {fechas.map((f, i) => (
          <ColumnaDelDia
            key={f}
            eventos={conHora.filter((e) => e.fecha === f)}
            // Sábado y domingo sin bloques: una semana llena de punta a punta se leería como horario.
            esqueleto={cargando && (detallada || i < 5) ? BLOQUES_DE_COLUMNA[i % BLOQUES_DE_COLUMNA.length] : []}
            primera={primera}
            horas={horas.length}
            horaPx={horaPx}
            esHoy={f === hoy}
            detallada={detallada}
            onAbrir={onAbrir}
          />
        ))}
      </div>
    </div>
  );
}

function ColumnaDelDia({
  eventos,
  esqueleto,
  primera,
  horas,
  horaPx,
  esHoy,
  detallada,
  onAbrir,
}: {
  eventos: EventoDeCalendario[];
  /** Bloques `[hora, horas]` mientras carga; vacío cuando ya llegó. */
  esqueleto: [number, number][];
  primera: number;
  horas: number;
  horaPx: number;
  esHoy: boolean;
  detallada: boolean;
  onAbrir: (e: EventoDeCalendario) => void;
}) {
  const carriles = carrilesDe(eventos);
  const total = Math.max(1, ...carriles.values());

  return (
    <div
      style={{
        position: "relative",
        height: horas * horaPx,
        borderLeft: "1px solid var(--border)",
        background: esHoy ? "color-mix(in srgb, var(--foreground) 3%, var(--card))" : undefined,
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${horaPx - 1}px, var(--border) ${horaPx - 1}px, var(--border) ${horaPx}px)`,
      }}
    >
      {esqueleto.map(([hora, largo]) => (
        <span
          key={hora}
          data-esqueleto
          aria-hidden
          className={ESQUELETO}
          style={{
            position: "absolute",
            top: (hora - primera) * horaPx + 1,
            height: largo * horaPx - 2,
            left: 3,
            right: 3,
            borderRadius: 6,
            background: TINTA_DE_ESQUELETO,
          }}
        />
      ))}
      {eventos.map((e) => {
        const desde = minutosDelDia(e.desde) as number;
        const hasta = minutosDelDia(e.hasta);
        const top = ((desde - primera * 60) / 60) * horaPx;
        const alto = hasta !== null && hasta > desde ? ((hasta - desde) / 60) * horaPx : ALTO_MINIMO;
        const unaLinea = Math.max(ALTO_MINIMO, alto - 2) < ALTO_DE_DOS_LINEAS;
        const carril = (carriles.get(e.id) ?? 1) - 1;
        const color = e.cursadaId ? colorDeMateria(e.cursadaId) : "var(--muted-foreground)";
        return (
          <button
            key={e.id}
            type="button"
            data-evento={e.tipo}
            onClick={() => onAbrir(e)}
            aria-label={descripcion(e)}
            title={descripcion(e)}
            className="hover:brightness-[0.97]"
            style={{
              ...estiloDeChip(e),
              position: "absolute",
              top: top + 1,
              height: Math.max(ALTO_MINIMO, alto - 2),
              left: `calc(${(carril / total) * 100}% + 3px)`,
              width: `calc(${100 / total}% - 6px)`,
              borderRadius: 6,
              padding: unaLinea ? "0 6px" : "3px 6px",
              overflow: "hidden",
              textAlign: "left",
              display: "flex",
              flexDirection: unaLinea ? "row" : "column",
              alignItems: unaLinea ? "center" : undefined,
              gap: unaLinea ? 6 : 1,
              fontSize: 12,
              lineHeight: 1.3,
            }}
          >
            <span className="flex items-center" style={{ gap: 6, minWidth: 0, flexShrink: 0 }}>
              <Punto e={e} />
              <span style={{ ...MONO, fontSize: 11, opacity: 0.8, flexShrink: 0 }}>
                {e.hasta && !unaLinea ? `${e.desde}–${e.hasta}` : e.desde}
              </span>
            </span>
            <span
              style={{
                fontWeight: 600,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: detallada && !unaLinea ? "normal" : "nowrap",
                textDecoration: e.estado === "CUMPLIDO" ? "line-through" : undefined,
              }}
            >
              {e.titulo}
            </span>
            {e.detalle && alto >= 56 && (
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.75 }}>
                {e.detalle}
              </span>
            )}
            {e.tipo === "clase" && e.estimado && detallada && alto >= 72 && (
              <span style={{ ...MONO, fontSize: 10, color }}>horario estimado</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * En qué carril va cada evento cuando se pisan: el primero libre. Devuelve el
 * número de carril (desde 1). Un evento que no se pisa con nada va en el 1.
 */
function carrilesDe(eventos: EventoDeCalendario[]): Map<string, number> {
  const ordenados = [...eventos].sort((a, b) => (a.desde as string) < (b.desde as string) ? -1 : 1);
  const finDeCarril: number[] = [];
  const resultado = new Map<string, number>();
  for (const e of ordenados) {
    const desde = minutosDelDia(e.desde) as number;
    const hasta = Math.max(desde + 30, minutosDelDia(e.hasta) ?? desde + 30);
    let carril = finDeCarril.findIndex((fin) => fin <= desde);
    if (carril === -1) carril = finDeCarril.push(0) - 1;
    finDeCarril[carril] = hasta;
    resultado.set(e.id, carril + 1);
  }
  return resultado;
}

// ── Leyenda ──────────────────────────────────────────────────────────────────

function Leyenda() {
  const muestra: React.CSSProperties = { display: "inline-block", width: 12, height: 12, borderRadius: 3, marginRight: 8, verticalAlign: "-2px" };
  return (
    <p
      className="flex flex-wrap items-center"
      style={{ columnGap: 22, rowGap: 6, fontSize: "var(--text-label)", color: "var(--muted-foreground)", margin: "12px 0 4px" }}
    >
      <span>
        <span style={{ ...muestra, background: "color-mix(in srgb, var(--materia-1) 16%, var(--card))", borderLeft: "3px solid var(--materia-1)" }} />
        clase
      </span>
      <span>
        <span style={{ ...muestra, background: "var(--card)", border: "1px solid var(--border)" }} />
        compromiso
      </span>
      <span>
        <span style={{ ...muestra, background: "var(--foreground)" }} />
        evaluación (siempre visible)
      </span>
      <span>el color es la materia</span>
      <span>
        Tocá un día para verlo entero · tocá un evento para abrirlo
      </span>
    </p>
  );
}
