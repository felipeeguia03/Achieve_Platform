"use client";

/**
 * ACHIEVE — **Plan vivo en el Calendario**, [ADR-110](../../docs/decisions.md#adr-110).
 *
 * Tres regiones: **la semana de tu plan** (calendario), **el trabajo por
 * ubicar** (columna) e **impacto académico** (el Gantt de Materia, abajo).
 *
 * ## Lo que esta pantalla tiene prohibido
 *
 * 1. **Decidir.** Todo llega calculado por el planificador puro: la pantalla no
 *    ordena, no valida y no elige horarios.
 * 2. **Mostrar prioridad como magnitud** (`P-03`, respuesta del owner). Se ve la
 *    razón y el orden; nunca *«prioridad alta»* ni un número.
 * 3. **Confundir propuesta con compromiso.** La propuesta va con contorno; el
 *    compromiso, sólido y con su ícono. Las dos dicen qué son en palabras.
 * 4. **Presentar un supuesto como avance.** Lo simulado se rotula *supuesto* y
 *    el Gantt real no cambia.
 * 5. **Depender sólo del color.** Cada estado tiene texto o forma.
 */

import { CalendarCheck, ChevronLeft, ChevronRight, Lock, LockOpen, Redo2, Timer, Undo2, X } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";

import { Gantt } from "./materia-cursado";
import { ReglaDeNegocio, TituloDePanel, TituloDeSeccion } from "./design-system";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { t, type CopyId } from "@/lib/content/es-AR";
import { fechasEntre, sumarDias } from "@/lib/domain/calendario";
import { colorDeMateria } from "@/lib/domain/color-de-materia";
import { enHoras, fechaEnZona, horaEnZona, instanteDelDia, minutoDelDia, tramo } from "@/lib/domain/plan-vivo/formato";
import { ganttConSupuestos, impactoDelEscenario, impactoIndividual } from "@/lib/domain/plan-vivo/impacto";
import { compararPrioridad } from "@/lib/domain/plan-vivo/planificador";
import type { EstadoEditable } from "@/lib/domain/plan-vivo/sesion";
import type {
  BloqueFijo,
  Intervalo,
  ManualPresentation,
  MotivoDeConflicto,
  PlacedPlanningItem,
  Placement,
  PlacementStrategy,
  PlanningProjection,
  PlanningWorkItem,
  PlanVivoBase,
} from "@/lib/domain/plan-vivo/tipos";
import type { MateriaProps } from "@/lib/domain/view-models";

// ── Contrato ───────────────────────────────────────────────────────────────────

export type ModoDeImpacto = "ACTUAL" | "SELECCION" | "ESCENARIO";

export type DialogoDelPlan =
  | { tipo: "CONFLICTO"; itemId: string; motivo: MotivoDeConflicto | "NO_UBICADA"; contra: string | null; alternativas: readonly number[] }
  | { tipo: "SIN_DISPONIBILIDAD"; itemId: string; ini: number; franja: Intervalo }
  | { tipo: "DESPLAZA" | "CONSECUENCIA"; itemId: string; ini: number; afectados: readonly string[] }
  | { tipo: "INTERCAMBIO"; a: Placement; b: Placement; salen: readonly string[]; afectados: readonly string[] }
  | { tipo: "VACIAR" }
  | { tipo: "ELEGIR"; itemId: string; opciones: readonly number[] }
  | { tipo: "COMPROMETERME"; itemId: string; ini: number; error: string | null };

export type PlanVivoProps =
  | { cargando: true }
  | {
      cargando?: false;
      base: PlanVivoBase;
      proyeccion: PlanningProjection;
      /** Sólo en simulación: para decir *«plan real: X»* al lado de lo que cambió. */
      proyeccionReal: PlanningProjection | null;
      estado: EstadoEditable;
      simulando: boolean;
      presentacion: ManualPresentation;
      seleccion: string | null;
      explicacion: string | null;
      editandoDisponibilidad: boolean;
      puedeDeshacer: boolean;
      puedeRehacer: boolean;
      disponibilidadSinGuardar: boolean;
      dialogo: DialogoDelPlan | null;
      aviso: string | null;
      ocupado: boolean;
      impacto: ModoDeImpacto;
      materiaDelImpacto: string | null;
      materia: MateriaProps | null;
      materiaCargando: boolean;
      onSemana: (sentido: -1 | 0 | 1) => void;
      onEstrategia: (s: PlacementStrategy) => void;
      onPresentacion: (p: ManualPresentation) => void;
      onSeleccionar: (id: string | null) => void;
      onPorQue: (id: string | null) => void;
      onUbicar: (id: string, ini: number) => void;
      onSoltarSobre: (arrastrado: string, destino: string) => void;
      onDevolver: (id: string) => void;
      onFijar: (id: string) => void;
      onDesfijar: (id: string) => void;
      onElegirHorario: (id: string) => void;
      onComprometerme: (id: string) => void;
      onConfirmarCompromiso: (id: string, ini: number) => void;
      onEditarDisponibilidad: (v: boolean) => void;
      onCrearDisponibilidad: (f: Intervalo) => void;
      onQuitarDisponibilidad: (f: Intervalo) => void;
      onGuardarDisponibilidad: () => void;
      onVaciar: () => void;
      onReconstruir: () => void;
      onSimular: () => void;
      onDescartarSimulacion: () => void;
      onSimularHecha: (id: string) => void;
      onDeshacer: () => void;
      onRehacer: () => void;
      onImpacto: (modo: ModoDeImpacto, cursada?: string) => void;
      onAbrir: (ruta: string) => void;
      onCerrarDialogo: () => void;
      onAceptarDialogo: (d: DialogoDelPlan) => void;
    };

type Props = Extract<PlanVivoProps, { base: PlanVivoBase }>;

// ── Estilo (el mismo vocabulario que el Calendario de ADR-100) ────────────────

const TARJETA: React.CSSProperties = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14 };
const META: React.CSSProperties = { fontSize: "var(--text-meta)", color: "var(--muted-foreground)" };
const ALTO_HORA = 44;
const ARRASTRE = "application/x-achieve-plan";

const MIME_OK = (e: React.DragEvent) => e.dataTransfer.types.includes(ARRASTRE);

function Boton({
  onClick,
  children,
  etiqueta,
  primario,
  activo,
  disabled,
  tipo = "button",
}: {
  onClick?: () => void;
  children: React.ReactNode;
  etiqueta?: string;
  primario?: boolean;
  activo?: boolean;
  disabled?: boolean;
  tipo?: "button" | "submit";
}) {
  const lleno = primario || activo;
  return (
    <button
      type={tipo}
      onClick={onClick}
      aria-label={etiqueta}
      aria-pressed={activo}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-1.5 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        minHeight: 36,
        padding: "0 12px",
        borderRadius: 8,
        border: `1px solid ${lleno ? "var(--foreground)" : "var(--border)"}`,
        background: lleno ? "var(--foreground)" : "var(--card)",
        color: lleno ? "var(--background)" : "var(--foreground)",
        fontSize: "var(--text-label)",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Segmentado<T extends string>({
  etiqueta,
  valor,
  opciones,
  onChange,
}: {
  etiqueta: string;
  valor: T;
  opciones: ReadonlyArray<{ valor: T; texto: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={etiqueta} className="inline-flex" style={{ ...TARJETA, borderRadius: 10, padding: 3, gap: 2 }}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={valor === o.valor}
          onClick={() => onChange(o.valor)}
          style={{
            minHeight: 30,
            padding: "0 12px",
            borderRadius: 7,
            background: valor === o.valor ? "var(--foreground)" : "transparent",
            color: valor === o.valor ? "var(--background)" : "var(--muted-foreground)",
            fontSize: "var(--text-label)",
            fontWeight: valor === o.valor ? 600 : 500,
          }}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

const causaTexto = (causa: string, requiere: string | null) =>
  causa === "DEPENDENCIA" ? `${t("PLAN_VIVO.CAUSA.DEPENDENCIA")} ${requiere ?? "otra unidad"}.` : t(`PLAN_VIVO.CAUSA.${causa}` as CopyId);

const motivoTexto = (m: string) => t(`PLAN_VIVO.CONFLICTO.${m}` as CopyId);

function diaLargo(fecha: string) {
  const s = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", timeZone: "UTC" })
    .format(new Date(`${fecha}T12:00:00Z`))
    .replace(",", "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function rotuloDeSemana(lunes: string) {
  const domingo = sumarDias(lunes, 6);
  const mes = (f: string) =>
    new Intl.DateTimeFormat("es-AR", { month: "short", timeZone: "UTC" }).format(new Date(`${f}T12:00:00Z`)).replace(".", "");
  return lunes.slice(0, 7) === domingo.slice(0, 7)
    ? `${Number(lunes.slice(8))} – ${Number(domingo.slice(8))} ${mes(domingo)} ${domingo.slice(0, 4)}`
    : `${Number(lunes.slice(8))} ${mes(lunes)} – ${Number(domingo.slice(8))} ${mes(domingo)} ${domingo.slice(0, 4)}`;
}

// ── La pantalla ───────────────────────────────────────────────────────────────

export function PlanVivo(props: PlanVivoProps) {
  if (props.cargando) {
    return (
      <div data-plan-vivo aria-busy>
        <TituloDePanel titulo={t("PLAN_VIVO.TITULO")} subcopy={t("PLAN_VIVO.SUBCOPY")} />
        <div style={{ ...TARJETA, height: 420, marginTop: 24 }} />
      </div>
    );
  }
  return <PlanCargado {...props} />;
}

function PlanCargado(p: Props) {
  const { base, proyeccion, estado } = p;
  const itemPorId = useMemo(() => new Map(base.items.map((i) => [i.id, i])), [base]);
  const colocadoPorId = useMemo(() => new Map(proyeccion.placedItems.map((x) => [x.itemId, x])), [proyeccion]);
  const seleccionado = p.seleccion ? (itemPorId.get(p.seleccion) ?? null) : null;
  const manual = estado.strategy === "MANUAL";
  const [colaAbierta, setColaAbierta] = useState(false);

  return (
    <div
      data-plan-vivo
      data-simulando={p.simulando || undefined}
      style={
        p.simulando
          ? {
              outline: "2px dashed var(--humano)",
              outlineOffset: 8,
              borderRadius: 16,
              background: "color-mix(in srgb, var(--humano-tinte) 35%, transparent)",
            }
          : undefined
      }
    >
      <TituloDePanel
        titulo={t("PLAN_VIVO.TITULO")}
        subcopy={t("PLAN_VIVO.SUBCOPY")}
        acciones={p.simulando ? null : <Boton onClick={p.onSimular}>{t("PLAN_VIVO.SIMULAR")}</Boton>}
      />

      {p.simulando && (
        <div
          role="status"
          data-banner-simulacion
          className="flex flex-wrap items-center"
          style={{ ...TARJETA, gap: 12, padding: "10px 14px", marginTop: 16, borderColor: "var(--humano)", background: "var(--humano-tinte)", color: "var(--humano-tinte-texto)" }}
        >
          <strong>{t("PLAN_VIVO.SIMULANDO")}</strong>
          <span>{t("PLAN_VIVO.SIMULANDO_AYUDA")}</span>
          <span className="inline-flex" style={{ marginLeft: "auto", gap: 6 }}>
            <Boton etiqueta={t("PLAN_VIVO.DESHACER")} onClick={p.onDeshacer} disabled={!p.puedeDeshacer}>
              <Undo2 size={16} aria-hidden />
            </Boton>
            <Boton etiqueta={t("PLAN_VIVO.REHACER")} onClick={p.onRehacer} disabled={!p.puedeRehacer}>
              <Redo2 size={16} aria-hidden />
            </Boton>
            <Boton onClick={p.onDescartarSimulacion}>{t("PLAN_VIVO.DESCARTAR")}</Boton>
          </span>
        </div>
      )}

      {/* ── Controles ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center" style={{ gap: 10, margin: "20px 0 12px" }}>
        <span className="inline-flex items-center" style={{ gap: 6 }}>
          <Boton etiqueta="Semana anterior" onClick={() => p.onSemana(-1)}>
            <ChevronLeft size={16} aria-hidden />
          </Boton>
          <Boton onClick={() => p.onSemana(0)}>Esta semana</Boton>
          <Boton etiqueta="Semana siguiente" onClick={() => p.onSemana(1)}>
            <ChevronRight size={16} aria-hidden />
          </Boton>
        </span>
        <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>{rotuloDeSemana(base.semana)}</h2>

        <span className="flex flex-wrap items-center" style={{ gap: 8, marginLeft: "auto" }}>
          <Segmentado
            etiqueta="Organización"
            valor={estado.strategy}
            onChange={p.onEstrategia}
            opciones={[
              { valor: "AUTOMATIC", texto: t("PLAN_VIVO.AUTOMATICO") },
              { valor: "MANUAL", texto: t("PLAN_VIVO.MANUAL") },
            ]}
          />
          {manual && (
            <Segmentado
              etiqueta="Presentación de la lista"
              valor={p.presentacion}
              onChange={p.onPresentacion}
              opciones={[
                { valor: "GUIDED", texto: t("PLAN_VIVO.GUIADO") },
                { valor: "FREE", texto: t("PLAN_VIVO.LIBRE") },
              ]}
            />
          )}
          <Boton activo={p.editandoDisponibilidad} onClick={() => p.onEditarDisponibilidad(!p.editandoDisponibilidad)}>
            {p.editandoDisponibilidad ? t("PLAN_VIVO.TERMINAR_DISPONIBILIDAD") : t("PLAN_VIVO.AGREGAR_DISPONIBILIDAD")}
          </Boton>
          {!p.simulando && (
            <>
              <Boton etiqueta={t("PLAN_VIVO.DESHACER")} onClick={p.onDeshacer} disabled={!p.puedeDeshacer}>
                <Undo2 size={16} aria-hidden />
              </Boton>
              <Boton etiqueta={t("PLAN_VIVO.REHACER")} onClick={p.onRehacer} disabled={!p.puedeRehacer}>
                <Redo2 size={16} aria-hidden />
              </Boton>
            </>
          )}
          {(manual || estado.ubicaciones.length > 0) && <Boton onClick={p.onReconstruir}>{t("PLAN_VIVO.RECONSTRUIR")}</Boton>}
          {proyeccion.placedItems.length > 0 && <Boton onClick={p.onVaciar}>{t("PLAN_VIVO.VACIAR")}</Boton>}
        </span>
      </div>

      {p.editandoDisponibilidad && <FormularioDeDisponibilidad base={base} onCrear={p.onCrearDisponibilidad} />}

      <Metricas p={p} />

      {p.disponibilidadSinGuardar && (
        <div role="status" className="flex flex-wrap items-center" style={{ ...TARJETA, gap: 12, padding: "10px 14px", margin: "12px 0" }}>
          <span>{t("PLAN_VIVO.DISPONIBILIDAD_SIN_GUARDAR")}</span>
          <span style={{ marginLeft: "auto" }}>
            <Boton primario disabled={p.ocupado} onClick={p.onGuardarDisponibilidad}>
              {t("PLAN_VIVO.GUARDAR_DISPONIBILIDAD")}
            </Boton>
          </span>
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <ReglaDeNegocio>{t("PLAN_VIVO.EFIMERO")}</ReglaDeNegocio>
      </div>
      {base.disponibilidadSemanal.length === 0 && estado.agregada.length === 0 && (
        <ReglaDeNegocio>{t("PLAN_VIVO.SIN_DISPONIBILIDAD_DECLARADA")}</ReglaDeNegocio>
      )}

      {/* ── Calendario + columna ──────────────────────────────────────────── */}
      <div className="grid items-start lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]" style={{ gap: 16, marginTop: 12 }}>
        <Semana p={p} itemPorId={itemPorId} />
        <aside
          aria-label={t("PLAN_VIVO.COLA")}
          className="flex flex-col lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
          style={{ gap: 12, overscrollBehavior: "contain" }}
        >
          {seleccionado && <Inspector p={p} item={seleccionado} colocado={colocadoPorId.get(seleccionado.id) ?? null} />}
          {/* Debajo de `lg` la cola se pliega: el calendario queda primero. */}
          <div className="lg:hidden">
            <Boton activo={colaAbierta} onClick={() => setColaAbierta(!colaAbierta)}>
              {t("PLAN_VIVO.COLA")} · {proyeccion.unplacedItems.length}
            </Boton>
          </div>
          <div className={colaAbierta ? "flex flex-col" : "hidden lg:flex lg:flex-col"} style={{ gap: 12 }}>
            <Cola p={p} itemPorId={itemPorId} />
          </div>
        </aside>
      </div>

      <Impacto p={p} itemPorId={itemPorId} />

      <p aria-live="polite" className="sr-only">
        {p.aviso}
      </p>

      <Dialogos p={p} itemPorId={itemPorId} />
      <Explicacion p={p} itemPorId={itemPorId} />
    </div>
  );
}

// ── Métricas ──────────────────────────────────────────────────────────────────

function Metricas({ p }: { p: Props }) {
  const m = p.proyeccion.metrics;
  const r = p.proyeccionReal?.metrics ?? null;
  const cifra = (valor: number, antes: number | undefined) => (
    <>
      <strong style={{ fontSize: 20, fontWeight: 600 }}>{enHoras(valor)}</strong>
      {r && antes !== undefined && antes !== valor && (
        <span style={META}>
          {" "}
          · {t("PLAN_VIVO.PLAN_REAL")}: {enHoras(antes)}
        </span>
      )}
    </>
  );
  const tarjeta = (titulo: string, contenido: React.ReactNode, ayuda?: string) => (
    <div style={{ ...TARJETA, padding: "10px 14px", minWidth: 0 }} title={ayuda}>
      <p style={META}>{titulo}</p>
      <p style={{ margin: 0 }}>{contenido}</p>
    </div>
  );
  return (
    <section aria-label="Cómo viene tu semana" className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 10 }}>
      {tarjeta(
        t("PLAN_VIVO.METRICA.PENDIENTE"),
        <>
          {cifra(m.pendiente, r?.pendiente)}
          {m.sinDuracion > 0 && (
            <span style={META}>
              {" "}
              · {m.sinDuracion} {t("PLAN_VIVO.METRICA.SIN_DURACION")}
            </span>
          )}
        </>,
        t("PLAN_VIVO.METRICA.PENDIENTE_AYUDA"),
      )}
      {tarjeta(t("PLAN_VIVO.METRICA.SIN_UBICAR"), cifra(m.sinUbicar, r?.sinUbicar))}
      {tarjeta(t("PLAN_VIVO.METRICA.NO_ENTRA"), cifra(m.noEntra, r?.noEntra))}
      {tarjeta(
        t("PLAN_VIVO.METRICA.DISPONIBLE"),
        <>
          {cifra(m.disponibilidadTotal, r?.disponibilidadTotal)}
          <span style={META}>
            {" "}
            · {enHoras(m.disponibilidadLibre)} {t("PLAN_VIVO.METRICA.LIBRE")}
          </span>
        </>,
      )}
    </section>
  );
}

// ── Disponibilidad por teclado ────────────────────────────────────────────────

function FormularioDeDisponibilidad({ base, onCrear }: { base: PlanVivoBase; onCrear: (f: Intervalo) => void }) {
  const fechas = fechasEntre(base.semana, sumarDias(base.semana, 6));
  const [fecha, setFecha] = useState(fechas.find((f) => f >= fechaEnZona(base.ahora, base.zona)) ?? fechas[0]);
  const [desde, setDesde] = useState(18 * 60);
  const [hasta, setHasta] = useState(20 * 60);
  const horas = Array.from({ length: 96 }, (_, i) => i * 15);
  const id = useId();
  const selector = (etiqueta: string, valor: number, set: (v: number) => void, filtro: (m: number) => boolean) => (
    <label className="inline-flex items-center" style={{ gap: 6, fontSize: "var(--text-label)" }}>
      {etiqueta}
      <select value={valor} onChange={(e) => set(Number(e.target.value))} style={{ ...TARJETA, borderRadius: 8, minHeight: 36, padding: "0 8px" }}>
        {horas.filter(filtro).map((m) => (
          <option key={m} value={m}>
            {`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <form
      aria-labelledby={id}
      onSubmit={(e) => {
        e.preventDefault();
        if (hasta > desde) onCrear({ ini: instanteDelDia(fecha, desde, base.zona), fin: instanteDelDia(fecha, hasta, base.zona) });
      }}
      className="flex flex-wrap items-center"
      style={{ ...TARJETA, gap: 10, padding: "10px 14px", marginBottom: 12 }}
    >
      <p id={id} style={{ ...META, flexBasis: "100%" }}>
        {t("PLAN_VIVO.AYUDA_DISPONIBILIDAD")}
      </p>
      <label className="inline-flex items-center" style={{ gap: 6, fontSize: "var(--text-label)" }}>
        Día
        <select value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ ...TARJETA, borderRadius: 8, minHeight: 36, padding: "0 8px" }}>
          {fechas.map((f) => (
            <option key={f} value={f}>
              {diaLargo(f)}
            </option>
          ))}
        </select>
      </label>
      {selector("Desde", desde, setDesde, () => true)}
      {selector("Hasta", hasta, setHasta, (m) => m > desde)}
      <Boton tipo="submit" primario>
        {t("PLAN_VIVO.AGREGAR_DISPONIBILIDAD")}
      </Boton>
    </form>
  );
}

// ── La semana ─────────────────────────────────────────────────────────────────

function Semana({ p, itemPorId }: { p: Props; itemPorId: Map<string, PlanningWorkItem> }) {
  const { base, proyeccion } = p;
  const fechas = fechasEntre(base.semana, sumarDias(base.semana, 6));
  const hoy = fechaEnZona(base.ahora, base.zona);
  const [diaMovil, setDiaMovil] = useState(fechas.includes(hoy) ? hoy : fechas[0]);

  const disponibilidad = useMemo(() => {
    const quitada = p.estado.quitada;
    const todas = [...base.disponibilidad, ...p.estado.agregada];
    // Lo quitado no se dibuja; lo agregado sí. Mismo cálculo que la entrada del planificador.
    return todas.flatMap((d) => {
      let partes: Intervalo[] = [d];
      for (const q of quitada) {
        partes = partes.flatMap((x) =>
          x.ini < q.fin && q.ini < x.fin
            ? [...(q.ini > x.ini ? [{ ini: x.ini, fin: q.ini }] : []), ...(q.fin < x.fin ? [{ ini: q.fin, fin: x.fin }] : [])]
            : [x],
        );
      }
      return partes;
    });
  }, [base, p.estado]);

  // Franja visible: de 7 a 23, estirada si hay algo antes o después.
  const minutos = [
    ...disponibilidad.flatMap((d) => [minutoDelDia(d.ini, base.zona), minutoDelDia(d.fin, base.zona) || 24 * 60]),
    ...base.fijos.flatMap((f) => [minutoDelDia(f.ini, base.zona), minutoDelDia(f.fin, base.zona) || 24 * 60]),
  ];
  const desde = Math.min(7, ...minutos.map((m) => Math.floor(m / 60)));
  const hasta = Math.max(23, ...minutos.map((m) => Math.ceil(m / 60)));
  const horas = Array.from({ length: hasta - desde }, (_, i) => desde + i);

  return (
    <section aria-label={t("PLAN_VIVO.TITULO")} style={{ ...TARJETA, padding: 12, minWidth: 0 }}>
      {/* En el piso móvil se ve un día por vez. */}
      <div className="flex md:hidden" role="group" aria-label="Día" style={{ gap: 4, overflowX: "auto", marginBottom: 8 }}>
        {fechas.map((f) => (
          <Boton key={f} activo={f === diaMovil} onClick={() => setDiaMovil(f)}>
            {diaLargo(f)}
          </Boton>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <div className="flex" style={{ minWidth: 0 }}>
          <div aria-hidden style={{ width: 44, flexShrink: 0, paddingTop: 44 }}>
            {horas.map((h) => (
              <div key={h} style={{ height: ALTO_HORA, ...META, fontFamily: "var(--font-mono)", textAlign: "right", paddingRight: 6, transform: "translateY(-6px)" }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {fechas.map((fecha) => (
            <Dia
              key={fecha}
              className={fecha === diaMovil ? "flex-1" : "hidden md:block flex-1"}
              fecha={fecha}
              esHoy={fecha === hoy}
              desde={desde}
              horas={horas.length}
              p={p}
              itemPorId={itemPorId}
              disponibilidad={disponibilidad.filter((d) => fechaEnZona(d.ini, base.zona) === fecha)}
              fijos={base.fijos.filter((f) => fechaEnZona(f.ini, base.zona) === fecha)}
              colocados={proyeccion.placedItems.filter((x) => fechaEnZona(x.ini, base.zona) === fecha)}
            />
          ))}
        </div>
      </div>
      <Leyenda />
    </section>
  );
}

function Dia({
  className,
  fecha,
  esHoy,
  desde,
  horas,
  p,
  itemPorId,
  disponibilidad,
  fijos,
  colocados,
}: {
  className: string;
  fecha: string;
  esHoy: boolean;
  desde: number;
  horas: number;
  p: Props;
  itemPorId: Map<string, PlanningWorkItem>;
  disponibilidad: Intervalo[];
  fijos: BloqueFijo[];
  colocados: readonly PlacedPlanningItem[];
}) {
  const { base } = p;
  const zona = base.zona;
  const columna = useRef<HTMLDivElement>(null);
  const [pintando, setPintando] = useState<{ a: number; b: number } | null>(null);
  const [sobre, setSobre] = useState<number | null>(null);

  const top = (instante: number) => ((minutoDelDia(instante, zona) - desde * 60) / 60) * ALTO_HORA;
  const alto = (i: Intervalo) => Math.max(14, ((i.fin - i.ini) / 3_600_000) * ALTO_HORA);
  const minutoEn = (clientY: number) => {
    const r = columna.current!.getBoundingClientRect();
    const m = ((clientY - r.top) / ALTO_HORA) * 60 + desde * 60;
    return Math.max(0, Math.min(24 * 60 - 15, Math.floor(m / 15) * 15));
  };
  const evaluaciones = base.evaluacionesDelDia.filter((e) => e.fecha === fecha);
  const ahora = esHoy ? top(base.ahora) : null;

  return (
    <div className={className} style={{ minWidth: 96, borderLeft: "1px solid var(--border)" }}>
      <div style={{ height: 44, padding: "2px 6px", overflow: "hidden" }}>
        <p style={{ fontSize: "var(--text-label)", fontWeight: esHoy ? 700 : 500, margin: 0 }}>{diaLargo(fecha)}</p>
        {evaluaciones.map((e) => (
          <p key={e.id} title={e.titulo} style={{ ...META, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <span aria-hidden>⚑ </span>
            {e.titulo} · {t("PLAN_VIVO.EVALUACION_SIN_HORA")}
          </p>
        ))}
      </div>
      <div
        ref={columna}
        data-dia={fecha}
        style={{
          position: "relative",
          height: horas * ALTO_HORA,
          backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px ${ALTO_HORA}px)`,
          cursor: p.editandoDisponibilidad ? "crosshair" : undefined,
          touchAction: p.editandoDisponibilidad ? "none" : undefined,
          outline: sobre !== null ? "2px solid var(--ring)" : undefined,
        }}
        onDragOver={(e) => {
          if (!MIME_OK(e)) return;
          e.preventDefault();
          setSobre(minutoEn(e.clientY));
        }}
        onDragLeave={() => setSobre(null)}
        onDrop={(e) => {
          if (!MIME_OK(e)) return;
          e.preventDefault();
          setSobre(null);
          p.onUbicar(e.dataTransfer.getData(ARRASTRE), instanteDelDia(fecha, minutoEn(e.clientY), zona));
        }}
        onPointerDown={(e) => {
          if (!p.editandoDisponibilidad || e.target !== e.currentTarget) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          const m = minutoEn(e.clientY);
          setPintando({ a: m, b: m + 15 });
        }}
        onPointerMove={(e) => {
          if (!pintando) return;
          setPintando({ a: pintando.a, b: Math.max(pintando.a + 15, minutoEn(e.clientY) + 15) });
        }}
        onPointerUp={() => {
          if (!pintando) return;
          p.onCrearDisponibilidad({ ini: instanteDelDia(fecha, pintando.a, zona), fin: instanteDelDia(fecha, Math.min(pintando.b, 24 * 60 - 1), zona) });
          setPintando(null);
        }}
      >
        {disponibilidad.map((d) => (
          <div
            key={`${d.ini}`}
            data-disponibilidad
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: top(d.ini),
              height: alto(d),
              background: "color-mix(in srgb, var(--exito-tinte) 70%, transparent)",
              borderLeft: "3px solid var(--exito-fill)",
              pointerEvents: p.editandoDisponibilidad ? "auto" : "none",
            }}
          >
            {p.editandoDisponibilidad && (
              <button
                type="button"
                onClick={() => p.onQuitarDisponibilidad(d)}
                aria-label={`${t("PLAN_VIVO.QUITAR_FRANJA")}: ${tramo(d.ini, d.fin, zona)}`}
                style={{ position: "absolute", right: 2, top: 2, width: 28, height: 28, borderRadius: 6, background: "var(--card)", border: "1px solid var(--border)" }}
                className="inline-flex items-center justify-center"
              >
                <X size={14} aria-hidden />
              </button>
            )}
          </div>
        ))}

        {pintando && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: ((pintando.a - desde * 60) / 60) * ALTO_HORA,
              height: ((pintando.b - pintando.a) / 60) * ALTO_HORA,
              background: "var(--exito-tinte)",
              border: "2px dashed var(--exito-fill)",
            }}
          />
        )}

        {fijos.map((f) => (
          <BloqueFijoVista key={f.id} f={f} p={p} top={top(f.ini)} alto={alto(f)} />
        ))}

        {colocados.map((c) => {
          const item = itemPorId.get(c.itemId);
          return item ? <BloquePropuesto key={c.itemId} c={c} item={item} p={p} top={top(c.ini)} alto={alto(c)} /> : null;
        })}

        {sobre !== null && (
          <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: ((sobre - desde * 60) / 60) * ALTO_HORA, borderTop: "2px solid var(--ring)" }} />
        )}

        {ahora !== null && ahora >= 0 && (
          <div
            data-ahora
            style={{ position: "absolute", left: 0, right: 0, top: ahora, borderTop: "2px solid var(--urgencia-texto)", pointerEvents: "none" }}
          >
            <span style={{ ...META, color: "var(--urgencia-texto)", background: "var(--card)", padding: "0 4px", position: "absolute", top: -9, left: 2 }}>
              {t("PLAN_VIVO.AHORA")} · {horaEnZona(p.base.ahora, zona)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const NOMBRE_DE_FIJO: Record<BloqueFijo["tipo"], string> = {
  CLASE: "Clase",
  EVALUACION: "Evaluación",
  COMPROMISO: "Compromiso",
  FOCUS: "Focus en curso",
  HISTORIA: "Registro",
};

function BloqueFijoVista({ f, p, top, alto }: { f: BloqueFijo; p: Props; top: number; alto: number }) {
  const color = f.cursadaId ? colorDeMateria(f.cursadaId) : "var(--muted-foreground)";
  const estilo: React.CSSProperties =
    f.tipo === "CLASE"
      ? {
          background: `color-mix(in srgb, ${color} 16%, var(--card))`,
          border: `1px solid color-mix(in srgb, ${color} 30%, var(--card))`,
          borderLeft: `3px ${f.estimado ? "dashed" : "solid"} ${color}`,
        }
      : f.tipo === "EVALUACION"
        ? { background: "var(--foreground)", color: "var(--background)", border: "1px solid var(--foreground)" }
        : f.tipo === "HISTORIA"
          ? { background: "var(--muted)", color: "var(--muted-foreground)", border: `1px ${f.estado?.includes("incumplido") ? "dashed" : "solid"} var(--border)` }
          : { background: "var(--card)", border: "2px solid var(--foreground)", boxShadow: `inset 3px 0 0 ${color}` };
  const cuando = tramo(f.ini, f.fin, p.base.zona);
  const etiqueta = [NOMBRE_DE_FIJO[f.tipo], f.titulo, cuando, f.estado, f.estimado ? t("COMUN.HORARIO_ESTIMADO") : null, "No se mueve desde el plan"]
    .filter(Boolean)
    .join(". ");
  return (
    <button
      type="button"
      data-fijo={f.tipo}
      aria-label={etiqueta}
      title={etiqueta}
      onClick={() => f.enlace && p.onAbrir(f.enlace)}
      onDragOver={(e) => MIME_OK(e) && e.preventDefault()}
      onDrop={(e) => {
        if (!MIME_OK(e)) return;
        e.preventDefault();
        e.stopPropagation();
        p.onUbicar(e.dataTransfer.getData(ARRASTRE), f.ini);
      }}
      className="text-left"
      style={{
        ...estilo,
        position: "absolute",
        left: 2,
        right: 2,
        top,
        height: alto,
        borderRadius: 6,
        padding: "2px 6px",
        overflow: "hidden",
        fontSize: "var(--text-meta)",
        zIndex: 1,
      }}
    >
      <span className="inline-flex items-center" style={{ gap: 4, fontWeight: 600 }}>
        {f.tipo === "COMPROMISO" && <CalendarCheck size={12} aria-hidden />}
        {f.tipo === "FOCUS" && <Timer size={12} aria-hidden />}
        {f.tipo !== "CLASE" && f.tipo !== "EVALUACION" && <span>{NOMBRE_DE_FIJO[f.tipo]} · </span>}
        {f.titulo}
      </span>
    </button>
  );
}

function BloquePropuesto({ c, item, p, top, alto }: { c: PlacedPlanningItem; item: PlanningWorkItem; p: Props; top: number; alto: number }) {
  const color = colorDeMateria(item.cursadaId);
  const seleccionado = p.seleccion === item.id;
  const tipo = c.fijada ? t("PLAN_VIVO.FIJADA") : c.origen === "MANUAL" ? t("PLAN_VIVO.ELEGIDA") : t("PLAN_VIVO.PROPUESTA");
  const etiqueta = [tipo, item.title, item.materia, tramo(c.ini, c.fin, p.base.zona), t("PLAN_VIVO.NO_ES_COMPROMISO")].join(". ");
  return (
    <button
      type="button"
      data-propuesta={c.origen}
      data-fijada={c.fijada || undefined}
      draggable={!c.fijada}
      aria-label={etiqueta}
      aria-pressed={seleccionado}
      title={etiqueta}
      onClick={() => p.onSeleccionar(seleccionado ? null : item.id)}
      onDoubleClick={() => item.comprometible && !p.simulando && p.onComprometerme(item.id)}
      onDragStart={(e) => {
        e.dataTransfer.setData(ARRASTRE, item.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => MIME_OK(e) && e.preventDefault()}
      onDrop={(e) => {
        if (!MIME_OK(e)) return;
        e.preventDefault();
        e.stopPropagation();
        p.onSoltarSobre(e.dataTransfer.getData(ARRASTRE), item.id);
      }}
      className="text-left motion-safe:transition-[top] motion-safe:duration-200"
      style={{
        position: "absolute",
        left: 4,
        right: 4,
        top,
        height: alto,
        zIndex: 2,
        borderRadius: 6,
        padding: "2px 6px",
        overflow: "hidden",
        background: `color-mix(in srgb, ${color} 8%, var(--card))`,
        border: `2px ${c.origen === "AUTOMATICA" && !c.fijada ? "dashed" : "solid"} ${color}`,
        outline: seleccionado ? "3px solid var(--ring)" : undefined,
        fontSize: "var(--text-meta)",
        cursor: c.fijada ? "default" : "grab",
      }}
    >
      <span className="flex items-center" style={{ gap: 4, fontWeight: 600 }}>
        {c.fijada && <Lock size={11} aria-hidden />}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
      </span>
      <span style={{ display: "block", color: "var(--muted-foreground)" }}>{tipo}</span>
    </button>
  );
}

function Leyenda() {
  const muestra = (estilo: React.CSSProperties, texto: string) => (
    <span className="inline-flex items-center" style={{ gap: 6 }}>
      <span aria-hidden style={{ width: 18, height: 12, borderRadius: 3, ...estilo }} />
      {texto}
    </span>
  );
  return (
    <div className="flex flex-wrap" style={{ gap: 14, marginTop: 10, ...META }}>
      {muestra({ background: "var(--exito-tinte)", borderLeft: "3px solid var(--exito-fill)" }, "Disponibilidad")}
      {muestra({ border: "2px dashed var(--foreground)" }, "Propuesta de Achieve")}
      {muestra({ border: "2px solid var(--foreground)" }, "Ubicada por vos o fijada")}
      {muestra({ border: "2px solid var(--foreground)", background: "var(--card)", boxShadow: "inset 3px 0 0 var(--foreground)" }, "Compromiso")}
      {muestra({ background: "var(--muted)", border: "1px solid var(--border)" }, "Clase")}
      {muestra({ background: "var(--foreground)" }, "Evaluación")}
    </div>
  );
}

// ── Columna: inspector y cola ─────────────────────────────────────────────────

function Inspector({ p, item, colocado }: { p: Props; item: PlanningWorkItem; colocado: PlacedPlanningItem | null }) {
  const comprometido = p.base.fijos.find((f) => f.itemId === item.id) ?? null;
  const hecha = p.estado.hechos.includes(item.id);
  const futuro = colocado !== null && colocado.ini > p.base.ahora;
  return (
    <section aria-label="Seleccionada" data-inspector style={{ ...TARJETA, padding: 14 }}>
      <div className="flex items-start" style={{ gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={META}>
            {item.materia} · {item.sourceType === "ACTION" ? t("PLAN_VIVO.ACCION") : t("PLAN_VIVO.CANDIDATO")}
          </p>
          <h3 style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, margin: "2px 0" }}>{item.title}</h3>
        </div>
        <span style={{ marginLeft: "auto" }}>
          <Boton etiqueta="Cerrar selección" onClick={() => p.onSeleccionar(null)}>
            <X size={14} aria-hidden />
          </Boton>
        </span>
      </div>
      <p style={{ fontSize: "var(--text-label)", margin: "4px 0" }}>
        {hecha
          ? t("PLAN_VIVO.SUPUESTA")
          : comprometido
            ? `Compromiso · ${tramo(comprometido.ini, comprometido.fin, p.base.zona)}`
            : colocado
              ? `${colocado.fijada ? t("PLAN_VIVO.FIJADA") : colocado.origen === "MANUAL" ? t("PLAN_VIVO.ELEGIDA") : t("PLAN_VIVO.PROPUESTA")} · ${tramo(colocado.ini, colocado.fin, p.base.zona)}`
              : t("PLAN_VIVO.COLA")}
      </p>
      {!comprometido && !hecha && <p style={META}>{t("PLAN_VIVO.NO_ES_COMPROMISO")}</p>}
      {hecha && <p style={META}>{t("PLAN_VIVO.SUPUESTO_AYUDA")}</p>}
      {item.durationRange && (
        <p style={META}>
          {t("PLAN_VIVO.COMPROMISO.DURACION")}: {enHoras(item.durationRange.likelyMinutes)} ·{" "}
          {t("PLAN_VIVO.COMPROMISO.RANGO").replace("{min}", String(item.durationRange.minMinutes)).replace("{max}", String(item.durationRange.maxMinutes))}
        </p>
      )}
      <p style={{ fontSize: "var(--text-label)", margin: "6px 0 0" }}>
        {item.priority.principal}{" "}
        <button type="button" onClick={() => p.onPorQue(item.id)} style={{ textDecoration: "underline", fontSize: "var(--text-label)" }}>
          {t("PLAN_VIVO.POR_QUE")}
        </button>
      </p>
      {!comprometido && !hecha && (
        <div className="flex flex-wrap" style={{ gap: 6, marginTop: 10 }}>
          {item.comprometible && futuro && !p.simulando && (
            <Boton primario onClick={() => p.onComprometerme(item.id)}>
              {t("PLAN_VIVO.COMPROMETERME")}
            </Boton>
          )}
          {!colocado?.fijada && <Boton onClick={() => p.onElegirHorario(item.id)}>{t("PLAN_VIVO.ELEGIR_HORARIO")}</Boton>}
          {colocado && !colocado.fijada && (
            <Boton onClick={() => p.onFijar(item.id)}>
              <Lock size={14} aria-hidden /> {t("PLAN_VIVO.FIJAR")}
            </Boton>
          )}
          {colocado?.fijada && (
            <Boton onClick={() => p.onDesfijar(item.id)}>
              <LockOpen size={14} aria-hidden /> {t("PLAN_VIVO.DESFIJAR")}
            </Boton>
          )}
          {colocado && !colocado.fijada && <Boton onClick={() => p.onDevolver(item.id)}>{t("PLAN_VIVO.DEVOLVER")}</Boton>}
          {p.simulando && <Boton onClick={() => p.onSimularHecha(item.id)}>{t("PLAN_VIVO.SIMULAR_HECHA")}</Boton>}
        </div>
      )}
      {item.sourceType === "CANDIDATO" && !p.simulando && <p style={{ ...META, marginTop: 8 }}>{t("PLAN_VIVO.COMPROMISO.CANDIDATO")}</p>}
    </section>
  );
}

function Tarjeta({
  p,
  item,
  badge,
  causa,
}: {
  p: Props;
  item: PlanningWorkItem;
  badge?: "ENTRA" | "NO_ENTRA";
  causa?: string | null;
}) {
  const seleccionado = p.seleccion === item.id;
  return (
    <li
      data-cola={item.id}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(ARRASTRE, item.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      style={{
        ...TARJETA,
        borderRadius: 10,
        padding: "8px 10px",
        borderLeft: `4px solid ${colorDeMateria(item.cursadaId)}`,
        outline: seleccionado ? "3px solid var(--ring)" : undefined,
        cursor: "grab",
        listStyle: "none",
      }}
    >
      <button type="button" aria-pressed={seleccionado} onClick={() => p.onSeleccionar(seleccionado ? null : item.id)} className="w-full text-left">
        <span className="flex items-baseline" style={{ gap: 6 }}>
          <strong style={{ fontSize: "var(--text-label)", fontWeight: 600 }}>{item.title}</strong>
          {item.durationRange && <span style={{ ...META, marginLeft: "auto", whiteSpace: "nowrap" }}>{enHoras(item.durationRange.likelyMinutes)}</span>}
        </span>
        <span style={{ ...META, display: "block" }}>
          {item.materia}
          {item.sourceType === "ACTION" ? ` · ${t("PLAN_VIVO.ACCION")}` : ""}
        </span>
      </button>
      <p style={{ fontSize: "var(--text-meta)", margin: "2px 0 0" }}>
        {item.priority.principal}{" "}
        <button type="button" onClick={() => p.onPorQue(item.id)} style={{ textDecoration: "underline" }}>
          {t("PLAN_VIVO.POR_QUE")}
        </button>
      </p>
      {badge && (
        <span
          style={{
            ...META,
            display: "inline-block",
            marginTop: 4,
            padding: "1px 8px",
            borderRadius: 999,
            border: `1px ${badge === "ENTRA" ? "solid" : "dashed"} var(--border)`,
            color: badge === "ENTRA" ? "var(--exito-tinte-texto)" : "var(--muted-foreground)",
            background: badge === "ENTRA" ? "var(--exito-tinte)" : "transparent",
          }}
        >
          {badge === "ENTRA" ? t("PLAN_VIVO.BADGE_ENTRA") : t("PLAN_VIVO.BADGE_NO_ENTRA")}
        </span>
      )}
      {causa && <p style={{ ...META, margin: "2px 0 0" }}>{causa}</p>}
    </li>
  );
}

function Lista({ titulo, children, vacio }: { titulo: string; children: React.ReactNode[]; vacio?: string }) {
  return (
    <section style={{ ...TARJETA, padding: 12 }}>
      <TituloDeSeccion>{titulo}</TituloDeSeccion>
      {children.length > 0 ? (
        <ul className="flex flex-col" style={{ gap: 8, marginTop: 8, padding: 0 }}>
          {children}
        </ul>
      ) : (
        vacio && <p style={{ ...META, marginTop: 6 }}>{vacio}</p>
      )}
    </section>
  );
}

function Cola({ p, itemPorId }: { p: Props; itemPorId: Map<string, PlanningWorkItem> }) {
  const { proyeccion, estado } = p;
  const [filtro, setFiltro] = useState<string>("");
  const [orden, setOrden] = useState<"PRIORIDAD" | "DURACION">("PRIORIDAD");
  const causa = new Map(proyeccion.notFittingItems.map((n) => [n.itemId, causaTexto(n.causa, n.requiere)]));
  const entra = new Set(proyeccion.feasiblePrioritySet);
  const retenidas = new Set(estado.retenidas);
  const pendientes = proyeccion.unplacedItems;
  const hechas = estado.hechos.map((id) => itemPorId.get(id)).filter((i): i is PlanningWorkItem => !!i);
  const margen = proyeccion.metrics.disponibilidadLibre;
  const tarjeta = (i: PlanningWorkItem, extra: Partial<Parameters<typeof Tarjeta>[0]> = {}) => (
    <Tarjeta key={i.id} p={p} item={i} causa={causa.get(i.id) ?? null} {...extra} />
  );

  let contenido: React.ReactNode;
  if (p.base.items.length === 0) {
    contenido = <Lista titulo={t("PLAN_VIVO.COLA")} vacio={t("PLAN_VIVO.VACIO")}>{[]}</Lista>;
  } else if (estado.strategy === "AUTOMATIC") {
    contenido = (
      <>
        <Lista titulo={t("PLAN_VIVO.COLA_AUTO")} vacio={t("PLAN_VIVO.COLA_AUTO_VACIA")}>
          {pendientes.filter((i) => !retenidas.has(i.id)).map((i) => tarjeta(i))}
        </Lista>
        {pendientes.some((i) => retenidas.has(i.id)) && (
          <Lista titulo={t("PLAN_VIVO.RETENIDAS")}>{pendientes.filter((i) => retenidas.has(i.id)).map((i) => tarjeta(i, { causa: null }))}</Lista>
        )}
      </>
    );
  } else if (p.presentacion === "GUIDED") {
    contenido = (
      <>
        <Lista titulo={t("PLAN_VIVO.ENTRARIAN")}>{pendientes.filter((i) => entra.has(i.id)).map((i) => tarjeta(i, { causa: null }))}</Lista>
        <Lista titulo={t("PLAN_VIVO.NO_ENTRAN")}>{pendientes.filter((i) => !entra.has(i.id)).map((i) => tarjeta(i))}</Lista>
      </>
    );
  } else {
    const materias = [...new Map(pendientes.map((i) => [i.cursadaId, i.materia])).entries()];
    const visibles = pendientes
      .filter((i) => !filtro || i.cursadaId === filtro)
      .sort((a, b) =>
        orden === "DURACION"
          ? (a.durationRange?.likelyMinutes ?? Infinity) - (b.durationRange?.likelyMinutes ?? Infinity) || compararPrioridad(a, b)
          : 0,
      );
    contenido = (
      <section style={{ ...TARJETA, padding: 12 }}>
        <TituloDeSeccion>{t("PLAN_VIVO.COLA")}</TituloDeSeccion>
        <div className="flex flex-wrap" style={{ gap: 8, margin: "8px 0" }}>
          <label style={{ ...META, display: "inline-flex", gap: 4, alignItems: "center" }}>
            Materia
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ ...TARJETA, borderRadius: 8, minHeight: 32 }}>
              <option value="">Todas</option>
              {materias.map(([id, nombre]) => (
                <option key={id} value={id}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>
          <label style={{ ...META, display: "inline-flex", gap: 4, alignItems: "center" }}>
            Orden
            <select value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} style={{ ...TARJETA, borderRadius: 8, minHeight: 32 }}>
              <option value="PRIORIDAD">Como lo ordena Achieve</option>
              <option value="DURACION">Más cortas primero</option>
            </select>
          </label>
        </div>
        <ul className="flex flex-col" style={{ gap: 8, padding: 0 }}>
          {visibles.map((i) => tarjeta(i, { badge: entra.has(i.id) ? "ENTRA" : "NO_ENTRA", causa: entra.has(i.id) ? null : causa.get(i.id) }))}
        </ul>
      </section>
    );
  }

  return (
    <>
      {contenido}
      {estado.strategy === "MANUAL" && margen > 0 && (
        <p style={META}>
          {t("PLAN_VIVO.MARGEN")}: {enHoras(margen)}
        </p>
      )}
      {hechas.length > 0 && (
        <Lista titulo={t("PLAN_VIVO.SUPUESTA")}>
          {hechas.map((i) => (
            <li key={i.id} style={{ ...TARJETA, borderRadius: 10, padding: "6px 10px", listStyle: "none", backgroundImage: "repeating-linear-gradient(45deg, var(--muted) 0 6px, transparent 6px 12px)" }}>
              <strong style={{ fontSize: "var(--text-label)" }}>{i.title}</strong>
              <span style={{ ...META, display: "block" }}>
                {i.materia} · {t("PLAN_VIVO.SUPUESTA")}
              </span>
            </li>
          ))}
        </Lista>
      )}
    </>
  );
}

// ── Impacto académico ─────────────────────────────────────────────────────────

function Impacto({ p, itemPorId }: { p: Props; itemPorId: Map<string, PlanningWorkItem> }) {
  const seleccionado = p.seleccion ? (itemPorId.get(p.seleccion) ?? null) : null;
  const modo = p.impacto === "SELECCION" && !seleccionado ? "ACTUAL" : p.impacto;
  const cursada = p.materiaDelImpacto;
  const escenario = useMemo(() => impactoDelEscenario(p.base, p.proyeccion, p.estado.hechos), [p.base, p.proyeccion, p.estado.hechos]);
  const temasHechos = p.estado.hechos.map((id) => itemPorId.get(id)).filter((i) => i && i.cursadaId === cursada).map((i) => i!.tema).filter((x): x is string => !!x);

  const temas =
    modo === "ESCENARIO"
      ? (escenario.find((e) => e.cursadaId === cursada)?.temas ?? [])
      : modo === "SELECCION" && seleccionado?.tema
        ? [...temasHechos, seleccionado.tema]
        : temasHechos;
  const gantt = p.materia?.gantt ? ganttConSupuestos(p.materia.gantt, temas, t("PLAN_VIVO.IMPACTO.SUPUESTO")) : null;
  const individual = seleccionado ? impactoIndividual(p.base, seleccionado.id) : null;
  const nombreDe = (id: string) => itemPorId.get(id)?.title ?? id;

  return (
    <section aria-labelledby="impacto-academico" data-impacto style={{ marginTop: 24 }}>
      <h2 id="impacto-academico" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
        {t("PLAN_VIVO.IMPACTO.TITULO")}
      </h2>
      <ReglaDeNegocio>{t("PLAN_VIVO.IMPACTO.SUBCOPY")}</ReglaDeNegocio>
      <div className="flex flex-wrap items-center" style={{ gap: 8, margin: "10px 0" }}>
        <Segmentado<ModoDeImpacto>
          etiqueta="Qué mostrar"
          valor={modo}
          onChange={(m) => p.onImpacto(m)}
          opciones={[
            { valor: "ACTUAL", texto: t("PLAN_VIVO.IMPACTO.ACTUAL") },
            ...(seleccionado ? [{ valor: "SELECCION" as const, texto: t("PLAN_VIVO.IMPACTO.SI_LA_HACES") }] : []),
            { valor: "ESCENARIO", texto: t("PLAN_VIVO.IMPACTO.ESCENARIO") },
          ]}
        />
        <span className="flex flex-wrap" role="group" aria-label="Materia" style={{ gap: 6 }}>
          {p.base.materias.map((m) => (
            <Boton key={m.cursadaId} activo={m.cursadaId === cursada} onClick={() => p.onImpacto(modo === "SELECCION" ? "ACTUAL" : modo, m.cursadaId)}>
              <span aria-hidden style={{ width: 8, height: 8, borderRadius: 2, background: colorDeMateria(m.cursadaId) }} />
              {m.nombre}
            </Boton>
          ))}
        </span>
      </div>

      {modo === "SELECCION" && individual && individual.desbloquea.length > 0 && (
        <ReglaDeNegocio>
          {t("PLAN_VIVO.IMPACTO.DESBLOQUEA")} {individual.desbloquea.map(nombreDe).join(", ")}.
        </ReglaDeNegocio>
      )}

      {modo === "ESCENARIO" && (
        <ul className="grid md:grid-cols-2" style={{ gap: 8, padding: 0, margin: "0 0 10px" }}>
          {escenario.map((e) => {
            const nombre = p.base.materias.find((m) => m.cursadaId === e.cursadaId)?.nombre ?? "";
            return (
              <li key={e.cursadaId} style={{ ...TARJETA, padding: "8px 12px", listStyle: "none" }}>
                <strong style={{ fontSize: "var(--text-label)" }}>{nombre}</strong>
                <p style={META}>
                  {t("PLAN_VIVO.IMPACTO.PENDIENTE_FINAL")}: {enHoras(e.pendienteFinal)}
                </p>
                {e.llegan.length > 0 && (
                  <p style={META}>
                    {t("PLAN_VIVO.IMPACTO.LLEGAN")}: {e.llegan.map(nombreDe).join(", ")}
                  </p>
                )}
                {e.noLlegan.length > 0 && (
                  <p style={META}>
                    {t("PLAN_VIVO.IMPACTO.NO_LLEGAN")}: {e.noLlegan.map(nombreDe).join(", ")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div style={{ overflowX: "auto" }}>
        {!cursada ? (
          <p style={META}>{t("PLAN_VIVO.IMPACTO.SIN_MATERIA")}</p>
        ) : p.materiaCargando ? (
          <div aria-busy style={{ ...TARJETA, height: 160 }} />
        ) : gantt ? (
          <div style={{ minWidth: 560 }}>
            <Gantt gantt={gantt} color={colorDeMateria(cursada)} />
          </div>
        ) : (
          <p style={META}>{t("PLAN_VIVO.IMPACTO.SIN_GANTT")}</p>
        )}
      </div>
    </section>
  );
}

// ── Diálogos ──────────────────────────────────────────────────────────────────

function Dialogos({ p, itemPorId }: { p: Props; itemPorId: Map<string, PlanningWorkItem> }) {
  const d = p.dialogo;
  const nombre = (id: string) => itemPorId.get(id)?.title ?? "";
  const zona = p.base.zona;
  const lista = (ids: readonly string[]) => (
    <ul style={{ paddingLeft: 18, margin: "6px 0" }}>
      {ids.map((id) => (
        <li key={id}>{nombre(id)}</li>
      ))}
    </ul>
  );
  const duracion = (id: string) => itemPorId.get(id)?.durationRange?.likelyMinutes ?? 0;

  let titulo = "";
  let cuerpo: React.ReactNode = null;
  let aceptar: string | null = null;
  if (d?.tipo === "CONFLICTO") {
    const fijo = d.contra ? p.base.fijos.find((f) => f.id === d.contra) : null;
    titulo = d.motivo === "NO_UBICADA" || d.motivo === "FIJADA" ? t("PLAN_VIVO.INTERCAMBIO.PROHIBIDO") : t("PLAN_VIVO.CONFLICTO.TITULO");
    cuerpo = (
      <>
        <p>
          <strong>{nombre(d.itemId)}</strong>: {motivoTexto(d.motivo)}
        </p>
        {fijo?.tipo === "COMPROMISO" && fijo.enlace && (
          <p style={{ marginTop: 8 }}>
            <Boton onClick={() => p.onAbrir(fijo.enlace!)}>{t("PLAN_VIVO.CONFLICTO.CAMBIAR_COMPROMISO")}</Boton>
          </p>
        )}
        {d.alternativas.length > 0 && (
          <>
            <p style={{ ...META, marginTop: 10 }}>{t("PLAN_VIVO.CONFLICTO.ALTERNATIVAS")}</p>
            <div className="flex flex-col" style={{ gap: 6, marginTop: 4 }}>
              {d.alternativas.map((ini) => (
                <Boton key={ini} onClick={() => p.onUbicar(d.itemId, ini)}>
                  {tramo(ini, ini + duracion(d.itemId) * 60_000, zona)}
                </Boton>
              ))}
            </div>
          </>
        )}
      </>
    );
  } else if (d?.tipo === "SIN_DISPONIBILIDAD") {
    titulo = t("PLAN_VIVO.SIN_DISPONIBILIDAD.TITULO");
    cuerpo = (
      <>
        <p>{t("PLAN_VIVO.SIN_DISPONIBILIDAD.TEXTO")}</p>
        <p style={META}>{tramo(d.franja.ini, d.franja.fin, zona)}</p>
      </>
    );
    aceptar = t("PLAN_VIVO.SIN_DISPONIBILIDAD.ACEPTAR");
  } else if (d?.tipo === "DESPLAZA") {
    titulo = t("PLAN_VIVO.DESPLAZA.TITULO");
    cuerpo = lista(d.afectados);
    aceptar = t("PLAN_VIVO.DESPLAZA.ACEPTAR");
  } else if (d?.tipo === "CONSECUENCIA") {
    titulo = t("PLAN_VIVO.CONSECUENCIA.TITULO");
    cuerpo = (
      <>
        <p>{t("PLAN_VIVO.CONSECUENCIA.TEXTO")}</p>
        {lista(d.afectados)}
        <Boton
          onClick={() => {
            p.onCerrarDialogo();
            p.onSeleccionar(d.afectados[0]);
          }}
        >
          {t("PLAN_VIVO.CONSECUENCIA.REVISAR")}
        </Boton>
      </>
    );
    aceptar = t("PLAN_VIVO.CONSECUENCIA.ACEPTAR");
  } else if (d?.tipo === "INTERCAMBIO") {
    titulo = t("PLAN_VIVO.INTERCAMBIO.TITULO");
    cuerpo = (
      <>
        <p>
          {nombre(d.a.itemId)} ↔ {nombre(d.b.itemId)}
        </p>
        {d.afectados.length > 0 && (
          <>
            <p style={{ marginTop: 6 }}>{t("PLAN_VIVO.INTERCAMBIO.TEXTO")}</p>
            {lista(d.afectados)}
          </>
        )}
      </>
    );
    aceptar = t("PLAN_VIVO.INTERCAMBIO.ACEPTAR");
  } else if (d?.tipo === "VACIAR") {
    titulo = t("PLAN_VIVO.VACIAR.TITULO");
    cuerpo = <p>{t("PLAN_VIVO.VACIAR.TEXTO")}</p>;
    aceptar = t("PLAN_VIVO.VACIAR.ACEPTAR");
  } else if (d?.tipo === "ELEGIR") {
    titulo = `${t("PLAN_VIVO.ELEGIR.TITULO")}: ${nombre(d.itemId)}`;
    cuerpo =
      d.opciones.length === 0 ? (
        <p>{t("PLAN_VIVO.ELEGIR.VACIO")}</p>
      ) : (
        <div className="flex flex-col" style={{ gap: 6 }}>
          {d.opciones.map((ini) => (
            <Boton key={ini} onClick={() => p.onUbicar(d.itemId, ini)}>
              {tramo(ini, ini + duracion(d.itemId) * 60_000, zona)}
            </Boton>
          ))}
        </div>
      );
  } else if (d?.tipo === "COMPROMETERME") {
    const item = itemPorId.get(d.itemId);
    titulo = t("PLAN_VIVO.COMPROMISO.TITULO");
    cuerpo = item && (
      <dl className="grid" style={{ gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: "var(--text-label)" }}>
        <dt style={META}>Acción</dt>
        <dd>{item.title}</dd>
        <dt style={META}>Materia</dt>
        <dd>{item.materia}</dd>
        <dt style={META}>{t("COMPROMISO.FECHA")}</dt>
        <dd>{tramo(d.ini, d.ini + duracion(d.itemId) * 60_000, zona)}</dd>
        {item.durationRange && (
          <>
            <dt style={META}>{t("PLAN_VIVO.COMPROMISO.DURACION")}</dt>
            <dd>
              {enHoras(item.durationRange.likelyMinutes)} ·{" "}
              {t("PLAN_VIVO.COMPROMISO.RANGO").replace("{min}", String(item.durationRange.minMinutes)).replace("{max}", String(item.durationRange.maxMinutes))}
            </dd>
          </>
        )}
        {item.expectedEvidence && (
          <>
            <dt style={META}>{t("COMPROMISO.EVIDENCIA_PREFIJO")}</dt>
            <dd>{item.expectedEvidence}</dd>
          </>
        )}
        <dt style={META}>{t("PLAN_VIVO.COMPROMISO.MOTIVO")}</dt>
        <dd>{item.priority.principal}</dd>
        {d.error && (
          <dd role="alert" style={{ gridColumn: "1 / -1", color: "var(--urgencia-texto)" }}>
            {d.error}
          </dd>
        )}
      </dl>
    );
  }

  return (
    <Dialog open={d !== null} onOpenChange={(abierto) => !abierto && p.onCerrarDialogo()}>
      {d && (
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            {d.tipo === "COMPROMETERME" && <DialogDescription>{t("PLAN_VIVO.COMPROMISO.TEXTO")}</DialogDescription>}
          </DialogHeader>
          <div style={{ fontSize: "var(--text-body)" }}>{cuerpo}</div>
          <DialogFooter>
            <Boton onClick={p.onCerrarDialogo}>{t("PLAN_VIVO.CANCELAR")}</Boton>
            {aceptar && (
              <Boton primario onClick={() => p.onAceptarDialogo(d)}>
                {aceptar}
              </Boton>
            )}
            {d.tipo === "COMPROMETERME" && (
              <Boton primario disabled={p.ocupado} onClick={() => p.onConfirmarCompromiso(d.itemId, d.ini)}>
                {t("PLAN_VIVO.COMPROMETERME")}
              </Boton>
            )}
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

// ── ¿Por qué? ─────────────────────────────────────────────────────────────────

function Explicacion({ p, itemPorId }: { p: Props; itemPorId: Map<string, PlanningWorkItem> }) {
  const item = p.explicacion ? (itemPorId.get(p.explicacion) ?? null) : null;
  const mostrado = item;
  const causa = mostrado ? p.proyeccion.explanations.find((e) => e.itemId === mostrado.id)?.causa : undefined;
  const orden = [...p.base.items].sort(compararPrioridad);
  const siguiente = mostrado ? orden[orden.findIndex((i) => i.id === mostrado.id) + 1] : undefined;

  return (
    <Sheet open={item !== null} onOpenChange={(abierto) => !abierto && p.onPorQue(null)}>
      <SheetContent side="right" showCloseButton={false}>
        {mostrado && (
          <div style={{ padding: 16, overflowY: "auto" }}>
            <div style={{ float: "right" }}>
              <Boton etiqueta="Cerrar" onClick={() => p.onPorQue(null)}>
                <X size={14} aria-hidden />
              </Boton>
            </div>
            <SheetHeader style={{ padding: 0 }}>
              <SheetTitle>{mostrado.title}</SheetTitle>
              <SheetDescription>{mostrado.materia}</SheetDescription>
            </SheetHeader>
            <TituloDeSeccion>{t("PLAN_VIVO.EXPLICA.RAZONES")}</TituloDeSeccion>
            <ul style={{ paddingLeft: 18, margin: "4px 0 12px" }}>
              {(mostrado.priority.razones.length > 0 ? mostrado.priority.razones.map((r) => r.texto) : [mostrado.priority.principal]).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {mostrado.deadline && (
              <p style={{ margin: "0 0 12px" }}>
                {mostrado.deadline.titulo}: {tramo(mostrado.deadline.instante, mostrado.deadline.instante, p.base.zona).split(",")[0]}
              </p>
            )}
            {mostrado.dependencies.length > 0 && (
              <>
                <TituloDeSeccion>{t("PLAN_VIVO.EXPLICA.DEPENDENCIAS")}</TituloDeSeccion>
                <ul style={{ paddingLeft: 18, margin: "4px 0 12px" }}>
                  {mostrado.dependencies.map((d) => (
                    <li key={d.topicId}>{d.reason}</li>
                  ))}
                </ul>
              </>
            )}
            {causa && (
              <p style={{ margin: "0 0 12px" }}>
                {causa === "DEPENDENCIA" || ["SIN_DURACION", "FECHA_LIMITE", "FRAGMENTACION", "CAPACIDAD"].includes(causa)
                  ? causaTexto(causa, p.proyeccion.notFittingItems.find((n) => n.itemId === mostrado.id)?.requiere ?? null)
                  : t(`PLAN_VIVO.EXPLICA.${causa}` as CopyId)}
              </p>
            )}
            {siguiente && (
              <>
                <TituloDeSeccion>{t("PLAN_VIVO.EXPLICA.SIGUIENTE")}</TituloDeSeccion>
                <p style={{ margin: "4px 0 12px" }}>
                  {siguiente.title} · {siguiente.materia}
                </p>
              </>
            )}
            <ReglaDeNegocio>{t("PLAN_VIVO.EXPLICA.FUENTE")}</ReglaDeNegocio>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
