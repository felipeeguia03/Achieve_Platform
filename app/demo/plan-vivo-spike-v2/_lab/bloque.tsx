"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE — cómo se ve cada cosa del plan semanal.
 *
 * Cada estado lleva **texto + ícono + borde o fondo**. El color de la materia es
 * un filete a la izquierda: identidad, nunca estado.
 *
 * ⚠️ **Corrección de V1:** lo simulado ya no va al 60 % de opacidad, que no
 * alcanzaba contraste AA. Ahora tiene fondo de acento, borde discontinuo y el
 * texto *Simulado · paso N* a contraste pleno.
 */

import {
  CalendarCheck,
  CalendarClock,
  CircleCheck,
  CircleDashed,
  FlaskConical,
  Hourglass,
  Lock,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { ESTADO_VISIBLE, PRIORIDAD_VISIBLE, t } from "./copy";
import { AHORA, EVALUACIONES, HECHOS, MATERIAS } from "./fixture";
import { aMinutos, diaCorto, duracionDe, enHoras } from "./formato";
import { entidad, nombreCorto } from "./proyeccion";
import s from "./lab.module.css";
import type { Colocado, EstadoEnPlan, Franja, Margen, Proyeccion, VentanaEnPlan } from "./tipos";

const ICONO: Readonly<Record<EstadoEnPlan, LucideIcon>> = {
  FIJO: Lock,
  HECHO: CircleCheck,
  INCUMPLIDO: TriangleAlert,
  CONFIRMADO: CalendarCheck,
  PROMESA_ANTERIOR: CalendarClock,
  PROPUESTA: CircleDashed,
  SIMULADO: FlaskConical,
  INTENTO: TriangleAlert,
};

const CLASE: Readonly<Record<EstadoEnPlan, string>> = {
  FIJO: s.fijo,
  HECHO: s.hecho,
  INCUMPLIDO: s.incumplido,
  CONFIRMADO: s.confirmado,
  PROMESA_ANTERIOR: s.promesa,
  PROPUESTA: s.propuesta,
  SIMULADO: s.simulado,
  INTENTO: s.intento,
};

export const colorDe = (id: string) => {
  const e = entidad(id);
  return e && "materia" in e ? MATERIAS[e.materia].color : "var(--muted-foreground)";
};

/** ¿Ya pasó, respecto del reloj fijo del laboratorio? */
export function yaPaso(f: Franja): boolean {
  return f.dia < AHORA.dia || (f.dia === AHORA.dia && aMinutos(f.hasta) <= aMinutos(AHORA.hora));
}

/** El rótulo de estado que se lee en el bloque. */
export function etiquetaDe(c: Colocado, p: Proyeccion): string {
  const e = entidad(c.id);
  if (!e) return ESTADO_VISIBLE[c.estado];
  if (c.estado === "FIJO") {
    if (e.kind === "EVALUACION") return "Parcial";
    return c.franja && yaPaso(c.franja) ? "Clase registrada" : "Clase";
  }
  if (c.estado === "HECHO") {
    const h = HECHOS.find((x) => x.id === c.id);
    return h?.progresoRegistrado ? "Progreso registrado" : "Evidencia enviada";
  }
  if (c.estado === "SIMULADO") return `Simulado · paso ${c.pasoNumero ?? "—"}`;
  if (c.estado === "INTENTO") return `Intento sin prerequisito · paso ${c.pasoNumero ?? "—"}`;
  if (c.estado === "PROPUESTA") {
    const base = p.recomendada === c.id ? "Recomendada" : "Propuesta";
    return c.reubicado ? `${base} · reubicada` : base;
  }
  if (c.estado === "CONFIRMADO" && c.hipotetico) return "Compromiso · horario cambiado";
  return ESTADO_VISIBLE[c.estado];
}

export function Bloque({
  colocado: c,
  proyeccion,
  seleccionado,
  animar,
  onSeleccionar,
}: {
  colocado: Colocado;
  proyeccion: Proyeccion;
  seleccionado: boolean;
  animar: boolean;
  onSeleccionar: (id: string) => void;
}) {
  const e = entidad(c.id);
  if (!e || e.kind === "DISPONIBILIDAD") return null;
  const Icono = c.estado === "HECHO" && HECHOS.find((h) => h.id === c.id)?.progresoRegistrado === null ? Hourglass : ICONO[c.estado];
  const pasado = c.franja ? yaPaso(c.franja) : false;
  const hora = c.franja ? `${c.franja.desde}–${c.franja.hasta}` : null;
  const duracion =
    e.kind === "WORKITEM"
      ? c.estado === "PROPUESTA"
        ? `${e.duracion.min}–${e.duracion.max} min`
        : enHoras(e.duracion.probable)
      : c.franja
        ? enHoras(duracionDe(c.franja))
        : null;
  const faltan =
    e.kind === "WORKITEM" && c.estado === "PROPUESTA"
      ? e.requiere.filter((r) => !proyeccion.completados.includes(r) && !proyeccion.retirados.includes(r))
      : [];
  const etiqueta = etiquetaDe(c, proyeccion);
  const esEvaluacion = EVALUACIONES.some((x) => x.id === c.id);

  return (
    <button
      type="button"
      className={[
        s.bloque,
        CLASE[c.estado],
        c.estado === "HECHO" && etiqueta === "Evidencia enviada" ? s.hechoEvidencia : "",
        proyeccion.recomendada === c.id && c.estado === "PROPUESTA" ? s.recomendada : "",
        esEvaluacion ? s.evaluacion : "",
        pasado && c.estado !== "INCUMPLIDO" ? s.bloquePasado : "",
        seleccionado ? s.bloqueSeleccionado : "",
        animar && c.hipotetico ? s.aparece : "",
      ].join(" ")}
      style={{ ["--lab-materia" as string]: colorDe(c.id) }}
      data-lab-clave={c.clave}
      data-lab-id={c.id}
      data-estado={c.estado}
      data-hipotetico={c.hipotetico || undefined}
      data-movil={c.estado === "FIJO" || c.estado === "HECHO" || c.estado === "INCUMPLIDO" ? undefined : true}
      aria-pressed={seleccionado}
      aria-label={[MATERIAS[e.materia].nombre, e.titulo, etiqueta, hora, pasado ? t("PLAN.YA_OCURRIO") : null].filter(Boolean).join(" · ")}
      onClick={() => onSeleccionar(c.id)}
    >
      <span className={s.bloqueFila}>
        <span className={s.bloqueMateria}>{MATERIAS[e.materia].corto}</span>
        <span className={s.bloqueEstado}>
          <Icono size={11} aria-hidden />
          {etiqueta}
        </span>
      </span>
      <span className={s.bloqueTitulo}>{e.titulo}</span>
      <span className={s.bloqueMeta}>
        {[hora, duracion].filter(Boolean).join(" · ")}
        {e.kind === "WORKITEM" && c.estado === "PROPUESTA" ? ` · ${PRIORIDAD_VISIBLE[e.prioridad]}` : ""}
      </span>
      {faltan.length > 0 && (
        <span className={s.bloqueMeta}>
          ↳ {t("CAMINO.REQUIERE")} {faltan.map(nombreCorto).join(", ")}
        </span>
      )}
    </button>
  );
}

export type MotivoDeHuella = "MOVIDO" | "RETIRADO" | "DESUBICADO" | "UBICADO";

export function Huella({ id, franja, destino, motivo, animar }: { id: string; franja: Franja | null; destino: Franja | null; motivo: MotivoDeHuella; animar: boolean }) {
  const texto =
    motivo === "RETIRADO" ? t("PLAN.YA_NO_HACE_FALTA") : motivo === "UBICADO" ? t("PLAN.ANTES_SIN_LUGAR") : t("PLAN.ANTES_AQUI");
  return (
    <div className={[s.huella, franja ? "" : s.huellaChica, animar ? s.aparece : ""].join(" ")} data-huella-de={id}>
      <span className={s.huellaMotivo}>{texto}</span>
      <span>
        {nombreCorto(id)}
        {franja ? ` · ${franja.desde}–${franja.hasta}` : ""}
      </span>
      {destino && motivo === "MOVIDO" && (
        <span className={s.huellaDestino} aria-hidden>
          → {destino.dia === franja?.dia ? destino.desde : `${diaCorto(destino.dia)} ${destino.desde}`}
        </span>
      )}
    </div>
  );
}

export function BloqueVentana({
  ventana: v,
  quitada,
  seleccionado,
  onSeleccionar,
}: {
  ventana: VentanaEnPlan;
  quitada: boolean;
  seleccionado: boolean;
  onSeleccionar: (id: string) => void;
}) {
  const pasada = v.minutosUtiles === 0 && !quitada;
  const origen = v.ventana.origen === "EXCEPCION" ? "Excepción" : "Recurrente";
  return (
    <button
      type="button"
      className={[s.ventana, v.ventana.origen === "EXCEPCION" ? s.ventanaExcepcion : "", quitada ? s.ventanaQuitada : "", pasada ? s.bloquePasado : "", seleccionado ? s.bloqueSeleccionado : ""].join(" ")}
      data-ventana={v.ventana.id}
      data-quitada={quitada || undefined}
      aria-pressed={seleccionado}
      aria-label={`Disponibilidad declarada · ${origen} · ${v.ventana.franja.desde}–${v.ventana.franja.hasta}${quitada ? " · quitada en el escenario" : ""}${pasada ? " · ya pasó" : ""}`}
      onClick={() => onSeleccionar(v.ventana.id)}
    >
      <span>
        {v.ventana.franja.desde}–{v.ventana.franja.hasta}
      </span>
      <span className={s.ventanaOrigen}>{quitada ? "quitada en el escenario" : origen.toLowerCase()}</span>
    </button>
  );
}

export function BloqueMargen({ margen, animar }: { margen: Margen; animar: boolean }) {
  return (
    <div className={[s.margen, animar ? s.aparece : ""].join(" ")} data-margen={`${margen.dia}-${margen.desde}`}>
      <span>
        {t("INDICADOR.MARGEN")} {enHoras(margen.minutos)}
      </span>
      <span className={s.margenHora}>
        {margen.desde}–{margen.hasta}
      </span>
    </div>
  );
}
