"use client";

/**
 * 🧪 SPIKE DESCARTABLE — cómo se ve cada cosa del camino temporal.
 *
 * Cada estado lleva **texto + ícono + borde o trama**. El color de la materia es
 * un filete a la izquierda: identidad, nunca estado.
 */

import {
  ArrowRightLeft,
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

import { t, ESTADO_VISIBLE } from "./copy";
import { MATERIAS } from "./fixture";
import { duracionDe, enHoras } from "./formato";
import s from "./spike.module.css";
import type { MotivoDeHuella } from "./celdas";
import type { SpikeDisponibilidad, SpikeEstado, SpikeMargen, SpikePlanItem } from "./tipos";

const ICONO: Readonly<Record<SpikeEstado, LucideIcon>> = {
  INSTITUCIONAL: Lock,
  COMPROMISO_CONFIRMADO: CalendarCheck,
  SUGERIDA: CircleDashed,
  EVIDENCIA_PENDIENTE: Hourglass,
  PROGRESO_REGISTRADO: CircleCheck,
  INCUMPLIDO: TriangleAlert,
  NECESITA_REUBICACION: ArrowRightLeft,
  PROPUESTA_SIN_CONFIRMAR: CalendarClock,
};

const CLASE: Readonly<Record<SpikeEstado, string>> = {
  INSTITUCIONAL: s.institucional,
  COMPROMISO_CONFIRMADO: s.confirmado,
  SUGERIDA: s.sugerida,
  EVIDENCIA_PENDIENTE: s.evidencia,
  PROGRESO_REGISTRADO: s.progreso,
  INCUMPLIDO: s.incumplido,
  NECESITA_REUBICACION: s.reubicar,
  PROPUESTA_SIN_CONFIRMAR: s.sinConfirmar,
};

export const colorDe = (item: Pick<SpikePlanItem, "materia">) => MATERIAS[item.materia].color;

export function etiquetaDeEstado(item: SpikePlanItem): string {
  return item.estado === "INSTITUCIONAL" ? item.tipo : ESTADO_VISIBLE[item.estado];
}

export function Bloque({
  item,
  recomendada,
  seleccionado,
  pasado,
  requiereTitulo,
  animar,
  onSeleccionar,
}: {
  item: SpikePlanItem;
  recomendada: boolean;
  seleccionado: boolean;
  pasado: boolean;
  /** Título del prerequisito todavía no hecho, si lo hay. */
  requiereTitulo: string | null;
  animar: boolean;
  onSeleccionar: (id: string) => void;
}) {
  const Icono = ICONO[item.estado];
  const clases = [
    s.bloque,
    CLASE[item.estado],
    recomendada && item.estado === "SUGERIDA" ? s.recomendada : "",
    item.hipotetico ? s.bloqueHipotetico : "",
    pasado && !item.hipotetico && item.estado !== "INCUMPLIDO" ? s.bloquePasado : "",
    seleccionado ? s.bloqueSeleccionado : "",
    animar && item.hipotetico ? s.aparece : "",
  ].join(" ");
  const hora = item.franja ? `${item.franja.desde}–${item.franja.hasta}` : null;
  const rango = item.rango && item.carril === "ACCIONES" && item.rango.min !== item.rango.max
    ? `${item.rango.min}–${item.rango.max} min`
    : item.franja
      ? enHoras(duracionDe(item.franja))
      : item.rango
        ? enHoras(item.rango.probable)
        : null;

  // Lo que ya pasó se achica a una línea, salvo un incumplido: día, hora y duración
  // prometidos tienen que seguir a la vista.
  const compacto = pasado && !item.hipotetico && item.estado !== "INCUMPLIDO";
  const estadoVisible = item.hipotetico ? `${etiquetaDeEstado(item)} · simulado` : etiquetaDeEstado(item);

  return (
    <button
      type="button"
      className={[clases, compacto ? s.bloqueCompacto : ""].join(" ")}
      style={{ ["--spike-materia" as string]: colorDe(item) }}
      data-spike-id={item.id}
      data-estado={item.estado}
      data-hipotetico={item.hipotetico || undefined}
      aria-pressed={seleccionado}
      aria-label={`${MATERIAS[item.materia].nombre} · ${item.titulo} · ${estadoVisible}${hora ? ` · ${hora}` : ""}`}
      onClick={() => onSeleccionar(item.id)}
    >
      <span className={s.bloqueFila}>
        <span className={s.bloqueMateria}>{MATERIAS[item.materia].corto}</span>
        <span className={s.bloqueEstado}>
          {item.hipotetico ? <FlaskConical size={11} aria-hidden /> : <Icono size={11} aria-hidden />}
          {estadoVisible}
        </span>
      </span>
      <span className={s.bloqueTitulo}>{item.titulo}</span>
      {!compacto && (
        <span className={s.bloqueMeta}>
          {[hora, rango].filter(Boolean).join(" · ")}
          {recomendada && item.estado === "SUGERIDA" ? " · recomendada" : ""}
        </span>
      )}
      {requiereTitulo && !compacto && (
        <span className={s.bloqueMeta}>
          ↳ {t("CAMINO.REQUIERE")} {requiereTitulo}
        </span>
      )}
    </button>
  );
}

const MOTIVO_DE_HUELLA: Readonly<Record<MotivoDeHuella, string>> = {
  MOVIDO: "antes acá",
  RETIRADO: "ya no hace falta",
  DESUBICADO: "antes acá",
  UBICADO: "antes sin lugar",
};

export function Huella({
  item,
  franja,
  motivo,
  animar,
}: {
  item: SpikePlanItem;
  franja: { desde: string; hasta: string } | null;
  motivo: MotivoDeHuella;
  animar: boolean;
}) {
  return (
    <div
      className={[s.huella, franja ? "" : s.huellaChica, animar ? s.aparece : ""].join(" ")}
      data-huella-de={item.id}
      aria-label={`${t("LEYENDA.HUELLA")}: ${item.titulo}`}
    >
      <span style={{ fontWeight: 600 }}>{MOTIVO_DE_HUELLA[motivo]}</span>
      <span>
        {item.titulo}
        {franja ? ` · ${franja.desde}–${franja.hasta}` : ""}
      </span>
    </div>
  );
}

export function FranjaDisponible({ franja, pasada }: { franja: SpikeDisponibilidad; pasada: boolean }) {
  return (
    <div
      className={[s.franja, franja.agregada ? s.franjaNueva : "", pasada ? s.bloquePasado : ""].join(" ")}
      data-franja={franja.id}
    >
      <span>{franja.agregada ? t("CAMINO.DISPONIBLE_NUEVO") : t("CAMINO.DISPONIBLE")}</span>
      <span>
        {franja.desde}–{franja.hasta}
      </span>
    </div>
  );
}

export function Margen({ margen, animar }: { margen: SpikeMargen; animar: boolean }) {
  return (
    <div className={[s.margen, animar ? s.aparece : ""].join(" ")} data-margen={`${margen.dia}-${margen.desde}`}>
      <span>
        {t("CAMINO.MARGEN")} {enHoras(margen.minutos)}
      </span>
      <span style={{ fontWeight: 400 }}>
        {margen.desde}–{margen.hasta}
        {margen.antesDelParcial ? ` · ${t("CAMINO.ANTES_DEL_PARCIAL")}` : ""}
      </span>
    </div>
  );
}
