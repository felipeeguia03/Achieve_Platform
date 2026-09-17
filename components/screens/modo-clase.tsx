"use client";

/**
 * ACHIEVE — **Modo Clase** · [ADR-098](../../docs/decisions.md#adr-098) y
 * [ADR-099](../../docs/decisions.md#adr-099).
 *
 * El lenguaje de `UX02`: cabecera con la materia, dos columnas de tarjetas y una
 * franja al pie. A la izquierda **el trabajo de la clase** —apuntes, grabaciones,
 * material—; a la derecha **lo que se toca y se consulta** —marcas, unidades,
 * momentos y *Finalizar clase*—. En móvil las marcas van primero.
 *
 * Recibe props y callbacks; **no pide nada a la red**.
 *
 * ## Lo que esta pantalla no hace, y cada ausencia es la decisión
 *
 * - **No graba sola.** *Grabar audio* pide confirmar un aviso la primera vez
 *   (ADR-099 §2), y sin micrófono la clase funciona entera.
 * - **No pregunta cómo te fue.** El checkpoint espera a la psicopedagoga.
 * - **No anima nada.** Los relojes cambian un número por segundo.
 * - **No colorea por estado.** Las unidades se distinguen por forma (ADR-085).
 */

import { useEffect, useState } from "react";
import {
  Bookmark,
  CircleHelp,
  ClipboardList,
  DoorOpen,
  GraduationCap,
  Layers,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

import { CTAPrincipal, MarcaDeMateria, ReglaDeNegocio, TituloDePanel } from "./design-system";
import { CTAEsqueleto, Esqueleto, PantallaCargando, Renglon } from "./esqueleto";
import {
  CabeceraDePanel,
  meta,
  PanelDeApuntes,
  PanelDeGrabaciones,
  PanelDeMaterial,
  PanelDeUnidades,
  tarjeta,
  type ApuntePendiente,
  type PropsDeApuntes,
  type PropsDeGrabaciones,
  type PropsDeMaterial,
} from "./modo-clase/paneles";
import { t, textoDeDuracion, type CopyId } from "@/lib/content/es-AR";
import { reloj, segundosEntre, TIPOS_DE_MARCA, type TipoDeMarca } from "@/lib/domain/sesion-de-clase";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import type { ClaseProps } from "@/lib/domain/view-models";

export type { ApuntePendiente, EstadoDeGrabadora, SubidaDeMaterial } from "./modo-clase/paneles";

/** Una marca que el estudiante tocó y el servidor todavía no confirmó. */
export interface MarcaPendiente {
  clave: string;
  tipo: TipoDeMarca;
  /** Segundos **mostrados**: el valor que se guarda lo pone el servidor. */
  segundos: number;
  estado: "ENVIANDO" | "ERROR";
}

export interface ModoClaseProps {
  clase: ClaseProps;
  apuntes: Omit<PropsDeApuntes, "apuntes"> & { pendientes: readonly ApuntePendiente[] };
  marcas: {
    pendientes: readonly MarcaPendiente[];
    onMarcar: (tipo: TipoDeMarca) => void;
    onReintentar: (clave: string) => void;
    onDetalle: (marcaId: string, texto: string) => void;
  };
  grabadora: Omit<PropsDeGrabaciones, "activa" | "grabaciones">;
  material: Omit<PropsDeMaterial, "material">;
  onFinalizar: () => void;
  finalizando: boolean;
  errorAlFinalizar: boolean;
  /** `true` sólo justo después de finalizar: el acuse no se repite al volver. */
  recienGuardada: boolean;
}

const COPY_DE_MARCA: Record<TipoDeMarca, CopyId> = {
  QUESTION: "CLASE.MARCA.QUESTION",
  IMPORTANT: "CLASE.MARCA.IMPORTANT",
  ASSESSMENT: "CLASE.MARCA.ASSESSMENT",
  REVIEW: "CLASE.MARCA.REVIEW",
};

/**
 * El ícono es **representación**, y va `aria-hidden`: el nombre lo dice la
 * palabra (`P-06`, nada sólo por forma o color). El dominio guarda el tipo.
 */
const ICONO: Record<TipoDeMarca, LucideIcon> = {
  QUESTION: CircleHelp,
  IMPORTANT: Star,
  ASSESSMENT: ClipboardList,
  REVIEW: Bookmark,
};

/** *Clase práctica* · *Clase teórica* · *Clase*. El tipo es simulado (ADR-099 §7). */
export function tituloDeClase(clase: Pick<ClaseProps, "tipo">): string {
  return t(clase.tipo === "TEORICA" ? "CLASE.TITULO.TEORICA" : clase.tipo === "PRACTICA" ? "CLASE.TITULO.PRACTICA" : "CLASE.TITULO");
}

/** El reloj de la clase. **Muestra; no escribe nada** (AGENTS.md §2.3). */
function useSegundosDesde(inicio: string, activo: boolean): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (!activo) return;
    const id = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activo]);
  return segundosEntre(inicio, new Date(ahora).toISOString());
}

export function ModoClase(p: ModoClaseProps) {
  const { clase } = p;
  const activa = clase.estado === "ACTIVE";
  const segundos = useSegundosDesde(clase.iniciadaEn, activa);

  const lineaDeHorario = [clase.dia, clase.horario ? `${clase.horario.desde}–${clase.horario.hasta}` : t("CLASE.MANUAL")].join(
    " · ",
  );

  return (
    <div data-modo-clase data-estado={clase.estado}>
      {/*
        La cabecera va **fuera** del contenedor con `gap`: trae su propia
        distancia al contenido y adentro se sumarían. Por lo mismo, el aviso de
        horario estimado va dentro de su línea de contexto y no debajo.
      */}
      <TituloDePanel
        titulo={tituloDeClase(clase)}
        meta={
          <>
            <span style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 8 }}>
              <MarcaDeMateria cursadaId={clase.cursadaId} />
            </span>
            <span>{nombreDeObjeto(clase.materia)}</span>
            {" · "}
            <span>{lineaDeHorario}</span>
            {clase.horarioEstimado && (
              <span style={{ ...meta, display: "block", marginTop: 2 }}>{t("CLASE.HORARIO_ESTIMADO")}</span>
            )}
          </>
        }
        acciones={<EstadoDeLaClase activa={activa} segundos={segundos} duracion={clase.duracionMinutos} />}
      />

      <div className="flex flex-col gap-4">

      {p.recienGuardada && (
        <div role="status" data-clase-guardada style={{ ...tarjeta, borderColor: "var(--foreground)" }}>
          <p style={{ fontWeight: 600 }}>{t("CLASE.GUARDADA")}</p>
          <ReglaDeNegocio>{t("CLASE.FINALIZAR_REGLA")}</ReglaDeNegocio>
        </div>
      )}

      {/*
        Tres bloques y no dos columnas, para que el orden de lectura en móvil sea
        el de uso: **marcas, apuntes, lo demás**. En desktop los bloques se
        ubican en la grilla: el trabajo a la izquierda ocupando las dos filas.
      */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(300px,1fr)] lg:grid-rows-[auto_1fr]">
        {activa && (
          <div className="lg:col-start-2 lg:row-start-1">
            <PanelDeMarcas {...p} segundos={segundos} />
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <PanelDeApuntes apuntes={clase.apuntes} {...p.apuntes} />
          <PanelDeGrabaciones activa={activa} grabaciones={clase.grabaciones} {...p.grabadora} />
          <PanelDeMaterial material={clase.material} {...p.material} />
        </div>

        <div className={`flex min-w-0 flex-col gap-4 lg:col-start-2 ${activa ? "lg:row-start-2" : "lg:row-start-1 lg:row-span-2"}`}>
          {!activa && <Resumen clase={clase} />}
          {clase.unidades && <PanelDeUnidades unidades={clase.unidades} cursadaId={clase.cursadaId} />}
          <Momentos {...p} />
          {activa && (
            <div className="flex flex-col gap-2">
              {/* `CTA-023`. Una sola principal en la pantalla (`I-06`). */}
              <CTAPrincipal onClick={p.onFinalizar} disabled={p.finalizando}>
                {t("CLASE.FINALIZAR")}
              </CTAPrincipal>
              {p.errorAlFinalizar && (
                <p role="alert" style={{ ...meta, color: "var(--foreground)" }}>
                  {t("CLASE.FINALIZAR_ERROR")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <FranjaDeLaClase clase={clase} />
      </div>
    </div>
  );
}

// ── Mientras carga ───────────────────────────────────────────────────────────

/** Un panel mientras carga: su título es fijo y va real; el contenido, en bloques. */
function PanelEsqueleto({ titulo, children }: { titulo: CopyId; children: React.ReactNode }) {
  return (
    <section aria-hidden style={tarjeta}>
      <p className="titulo-de-seccion" style={{ margin: 0 }}>
        {t(titulo)}
      </p>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </section>
  );
}

/**
 * Modo Clase mientras la clase no llegó — `P-12`.
 *
 * Se dibuja **la clase en curso**, que es a lo que se entra casi siempre: marcas
 * arriba a la derecha, apuntes, grabaciones y material a la izquierda, momentos
 * y la CTA de finalizar debajo. Los cuatro botones de marca van en bloques y no
 * en botones: tocar *No entendí* antes de que exista la clase no tendría dónde
 * guardarse.
 */
export function ModoClaseEsqueleto() {
  return (
    <PantallaCargando>
      <TituloDePanel
        titulo={<Renglon cuerpo="title-lg" ancho={320} />}
        meta={<Renglon cuerpo="body" ancho={280} />}
        acciones={<Esqueleto ancho={110} alto={30} radio="var(--radius-pildora)" />}
      />
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(300px,1fr)] lg:grid-rows-[auto_1fr]">
          <div className="lg:col-start-2 lg:row-start-1">
            <PanelEsqueleto titulo="CLASE.MARCAR">
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <Esqueleto key={i} alto={64} radio="var(--radius-control)" />
                ))}
              </div>
              <Renglon cuerpo="label" ancho="80%" />
            </PanelEsqueleto>
          </div>
          <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <PanelEsqueleto titulo="CLASE.APUNTES">
              {[0, 1, 2].map((i) => (
                <div key={i} className="hairline-b flex gap-3 py-2.5">
                  <Renglon cuerpo="meta" ancho={48} style={{ width: 64, flexShrink: 0 }} />
                  <Renglon cuerpo="body" ancho={["85%", "60%", "72%"][i]} style={{ flex: 1 }} />
                </div>
              ))}
              <Esqueleto alto={64} radio="var(--radius-control)" />
            </PanelEsqueleto>
            <PanelEsqueleto titulo="CLASE.GRABACIONES">
              <Renglon cuerpo="label" ancho="75%" />
              <Esqueleto ancho={140} alto={36} radio="var(--radius-control)" />
            </PanelEsqueleto>
            <PanelEsqueleto titulo="CLASE.MATERIAL">
              <Renglon cuerpo="label" ancho="60%" />
              <Esqueleto ancho={140} alto={36} radio="var(--radius-control)" />
            </PanelEsqueleto>
          </div>
          <div className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-start-2">
            <PanelEsqueleto titulo="CLASE.UNIDADES">
              <Renglon cuerpo="label" ancho="85%" />
              <Renglon cuerpo="label" ancho="55%" />
            </PanelEsqueleto>
            <PanelEsqueleto titulo="CLASE.MOMENTOS">
              <Renglon cuerpo="meta" ancho="70%" />
            </PanelEsqueleto>
            <CTAEsqueleto />
          </div>
        </div>
      </div>
    </PantallaCargando>
  );
}

function EstadoDeLaClase({ activa, segundos, duracion }: { activa: boolean; segundos: number; duracion: number | null }) {
  return (
    <span
      data-estado-de-clase
      className="inline-flex items-center"
      style={{
        gap: 8,
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-pildora)",
        background: "var(--card)",
        padding: "5px 12px",
        fontSize: "var(--text-label)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: activa ? "var(--exito-texto)" : "var(--muted-foreground)",
        }}
      />
      <span style={{ fontWeight: 600 }}>{t(activa ? "CLASE.EN_CURSO" : "CLASE.TERMINADA")}</span>
      {activa ? (
        <span style={{ color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
          <span className="sr-only">{t("CLASE.RELOJ")}: </span>
          <span data-reloj>{reloj(segundos)}</span>
        </span>
      ) : (
        duracion !== null && <span style={{ color: "var(--muted-foreground)" }}>{textoDeDuracion(duracion)}</span>
      )}
    </span>
  );
}

function PanelDeMarcas(p: ModoClaseProps & { segundos: number }) {
  return (
    <section aria-labelledby="clase-marcar" style={tarjeta} data-panel="marcas">
      <CabeceraDePanel id="clase-marcar" titulo={t("CLASE.MARCAR")} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {TIPOS_DE_MARCA.map((tipo) => {
          const Icono = ICONO[tipo];
          return (
            <button
              key={tipo}
              type="button"
              data-marca={tipo}
              onClick={() => p.marcas.onMarcar(tipo)}
              className="focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                minHeight: 64,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-control)",
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: "var(--text-label)",
                fontWeight: 600,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 6px",
                textAlign: "center",
              }}
            >
              <Icono aria-hidden size={18} strokeWidth={1.75} />
              {t(COPY_DE_MARCA[tipo])}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 8 }}>
        <ReglaDeNegocio>{t("CLASE.MARCAR_REGLA")}</ReglaDeNegocio>
      </div>
    </section>
  );
}

function Momentos(p: ModoClaseProps) {
  const { clase } = p;
  const { pendientes } = p.marcas;
  const vacio = clase.marcas.length === 0 && pendientes.length === 0;

  return (
    <section aria-labelledby="clase-momentos" style={tarjeta} data-panel="momentos">
      <CabeceraDePanel id="clase-momentos" titulo={t("CLASE.MOMENTOS")} />
      {/* El acuse de cada toque, para quien no mira la pantalla. */}
      <p aria-live="polite" className="sr-only">
        {pendientes.length > 0 ? t(COPY_DE_MARCA[pendientes[pendientes.length - 1].tipo]) : ""}
      </p>
      {vacio ? (
        <p style={{ ...meta, marginTop: 8 }}>{t("CLASE.SIN_MOMENTOS")}</p>
      ) : (
        <ol className="mt-2 flex flex-col" data-momentos>
          {clase.marcas.map((m) => (
            <Momento key={m.id} marca={m} onDetalle={p.marcas.onDetalle} />
          ))}
          {pendientes.map((m) => {
            const Icono = ICONO[m.tipo];
            return (
              <li key={m.clave} data-pendiente={m.estado} className="hairline-b flex items-center gap-3 py-2">
                <span style={{ ...meta, fontVariantNumeric: "tabular-nums" }}>{reloj(m.segundos)}</span>
                <Icono aria-hidden size={14} strokeWidth={1.75} />
                <span style={{ fontSize: "var(--text-label)", fontWeight: 500 }}>{t(COPY_DE_MARCA[m.tipo])}</span>
                {m.estado === "ENVIANDO" ? (
                  <span style={{ ...meta, marginLeft: "auto" }}>{t("CLASE.MARCA_ENVIANDO")}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => p.marcas.onReintentar(m.clave)}
                    style={{ ...meta, marginLeft: "auto", color: "var(--urgencia-texto)", textDecoration: "underline" }}
                  >
                    {t("CLASE.MARCA_ERROR")}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function Momento({
  marca,
  onDetalle,
}: {
  marca: ClaseProps["marcas"][number];
  onDetalle: (id: string, texto: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(marca.texto ?? "");
  const Icono = ICONO[marca.tipo];

  return (
    <li className="hairline-b flex flex-col gap-1 py-2" data-momento={marca.tipo}>
      <div className="flex items-center gap-3">
        <span style={{ ...meta, fontVariantNumeric: "tabular-nums" }}>{reloj(marca.segundos)}</span>
        <Icono aria-hidden size={14} strokeWidth={1.75} />
        <span style={{ fontSize: "var(--text-label)", fontWeight: 500 }}>{t(COPY_DE_MARCA[marca.tipo])}</span>
        {!editando && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            style={{ ...meta, marginLeft: "auto", textDecoration: "underline" }}
          >
            {t("CLASE.DETALLE")}
          </button>
        )}
      </div>
      {marca.texto && !editando && (
        <p style={{ fontSize: "var(--text-label)", paddingLeft: 2, overflowWrap: "anywhere" }}>{marca.texto}</p>
      )}
      {editando && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onDetalle(marca.id, texto);
            setEditando(false);
          }}
        >
          <input
            aria-label={`${t("CLASE.DETALLE")} · ${t(COPY_DE_MARCA[marca.tipo])} ${reloj(marca.segundos)}`}
            value={texto}
            maxLength={1000}
            autoFocus
            onChange={(e) => setTexto(e.target.value)}
            placeholder={t("CLASE.DETALLE_PLACEHOLDER")}
            style={{
              flex: 1,
              minWidth: 0,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-control)",
              background: "var(--background)",
              color: "var(--foreground)",
              padding: "6px 10px",
              fontSize: "var(--text-label)",
            }}
          />
          <button type="submit" style={{ ...meta, color: "var(--foreground)", fontWeight: 600 }}>
            {t("CLASE.GUARDAR")}
          </button>
        </form>
      )}
    </li>
  );
}

/** Lo **derivado** de una clase terminada: duración y cuántas marcas de cada tipo. */
function Resumen({ clase }: { clase: ClaseProps }) {
  return (
    <section aria-labelledby="clase-resumen" style={tarjeta} data-resumen>
      <CabeceraDePanel id="clase-resumen" titulo={t("CLASE.RESUMEN")} />
      {clase.duracionMinutos !== null && (
        <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, margin: "6px 0" }}>
          <span className="sr-only">{t("CLASE.DURACION")}: </span>
          {textoDeDuracion(clase.duracionMinutos)}
        </p>
      )}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {TIPOS_DE_MARCA.map((tipo) => (
          <li key={tipo} style={{ fontSize: "var(--text-label)" }}>
            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{clase.resumen[tipo]}</span>{" "}
            <span style={{ color: "var(--muted-foreground)" }}>{t(COPY_DE_MARCA[tipo])}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * La franja del pie — ADR-099 §6: comisión, aula, inscriptos y docente. **Cada
 * dato que falta no se dibuja**, y si faltan todos, tampoco la franja. Lo
 * simulado lleva su rótulo.
 */
function FranjaDeLaClase({ clase }: { clase: ClaseProps }) {
  const datos: Array<{ id: string; icono: LucideIcon; etiqueta: CopyId; valor: string }> = [];
  if (clase.pie.comision) datos.push({ id: "comision", icono: Layers, etiqueta: "CLASE.PIE.COMISION", valor: clase.pie.comision });
  if (clase.pie.aula) datos.push({ id: "aula", icono: DoorOpen, etiqueta: "CLASE.PIE.AULA", valor: clase.pie.aula });
  if (clase.pie.inscriptos !== null) {
    datos.push({ id: "inscriptos", icono: Users, etiqueta: "CLASE.PIE.INSCRIPTOS", valor: String(clase.pie.inscriptos) });
  }
  if (clase.docente) datos.push({ id: "docente", icono: GraduationCap, etiqueta: "CLASE.PIE.DOCENTE", valor: clase.docente });
  if (datos.length === 0) return null;

  return (
    <footer
      data-franja-de-clase
      aria-label={t("CLASE.PIE")}
      style={{ ...tarjeta, padding: "12px 16px" }}
      className="flex flex-wrap items-center gap-x-8 gap-y-3"
    >
      {datos.map((d) => {
        const Icono = d.icono;
        return (
          <div key={d.id} data-dato-de-clase={d.id} className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex items-center justify-center"
              style={{ width: 30, height: 30, borderRadius: "var(--radius-control)", background: "var(--muted)" }}
            >
              <Icono size={15} strokeWidth={1.75} />
            </span>
            <div>
              <p style={{ ...meta, lineHeight: 1.2 }}>{t(d.etiqueta)}</p>
              <p style={{ fontSize: "var(--text-body)", fontWeight: 600, lineHeight: 1.3, fontVariantNumeric: "tabular-nums" }}>
                {d.valor}
              </p>
            </div>
          </div>
        );
      })}
      {clase.pie.simulado && (
        <span
          data-simulado
          title={t("CLASE.PIE.SIMULADO_REGLA")}
          className="ml-auto"
          style={{
            fontSize: "var(--text-meta)",
            fontFamily: "var(--font-mono)",
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius-pildora)",
            padding: "2px 10px",
            color: "var(--muted-foreground)",
          }}
        >
          {t("CLASE.PIE.SIMULADO")}
        </span>
      )}
    </footer>
  );
}
