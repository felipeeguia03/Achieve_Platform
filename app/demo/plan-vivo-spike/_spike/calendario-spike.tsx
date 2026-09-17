"use client";

/**
 * 🧪 SPIKE DESCARTABLE — la prueba mínima de Calendario.
 *
 * ⚠️ **Lee de la misma proyección que el Plan**, no de una copia: el compromiso que
 * se ve acá es `itemDe(proyeccion, id)`, el mismo objeto que dibuja el camino
 * temporal. Si el reloj lo vuelve incumplido, acá también. Sin vista mensual,
 * sin edición, sin arrastrar y sin sincronizar con nada.
 */

import { ArrowLeft } from "lucide-react";

import { colorDe, etiquetaDeEstado } from "./bloque";
import { t } from "./copy";
import { MATERIAS, SEMANA } from "./fixture";
import { aMinutos, diaCorto, diaLargo, duracionDe, enHoras } from "./formato";
import { itemDe } from "./proyecciones";
import s from "./spike.module.css";
import type { SpikePlanProjection } from "./tipos";

/** Lo más temprano del fixture es a las 14:00: la grilla no dibuja la mañana vacía. */
const DESDE = 13;
const HASTA = 22;
const ALTO_HORA = 40;

export function CalendarioSpike({
  proyeccion,
  seleccion,
  onSeleccionar,
  onVolver,
}: {
  proyeccion: SpikePlanProjection;
  seleccion: string;
  onSeleccionar: (id: string) => void;
  onVolver: () => void;
}) {
  const elegido = itemDe(proyeccion, seleccion);
  const eventos = proyeccion.items.filter((i) => i.franja && i.carril !== "ACCIONES");

  return (
    <section className={s.tarjeta} aria-labelledby="spike-cal-titulo" data-vista="calendario">
      <header className={s.caminoCabecera}>
        <h2 id="spike-cal-titulo" className={s.caminoTitulo}>
          {t("CAL.TITULO")} · 14 al 20 de septiembre
        </h2>
        <span className={`${s.pastilla} ${s.pastillaNeutra}`}>{t("CAL.SOLO_LECTURA")}</span>
        <button type="button" className={s.botonTexto} onClick={onVolver} style={{ marginLeft: "auto" }}>
          <ArrowLeft size={14} aria-hidden />
          {t("CAL.VOLVER")}
        </button>
      </header>

      {elegido && elegido.franja && (
        <dl className={s.datos} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }} data-detalle-calendario>
          <dt>{t("CAL.CAMPO.ID")}</dt>
          <dd style={{ fontFamily: "var(--font-mono)" }}>{elegido.id}</dd>
          <dt>{t("CAL.CAMPO.MATERIA")}</dt>
          <dd>{MATERIAS[elegido.materia].nombre}</dd>
          <dt>{t("CAL.CAMPO.ACCION")}</dt>
          <dd>{elegido.titulo}</dd>
          <dt>{t("CAL.CAMPO.DIA")}</dt>
          <dd>{diaLargo(elegido.franja.dia)}</dd>
          <dt>{t("CAL.CAMPO.HORA")}</dt>
          <dd>
            {elegido.franja.desde}–{elegido.franja.hasta}
          </dd>
          <dt>{t("CAL.CAMPO.DURACION")}</dt>
          <dd>{enHoras(duracionDe(elegido.franja))}</dd>
          <dt>{t("CAL.CAMPO.ESTADO")}</dt>
          <dd data-estado-calendario={elegido.estado}>{etiquetaDeEstado(elegido)}</dd>
        </dl>
      )}

      <div className={s.caminoScroll} tabIndex={0} aria-label="Grilla semanal">
        <div className={s.calendario}>
          <div />
          {SEMANA.map((dia) => (
            <div key={dia} className={s.diaCabecera}>
              {diaCorto(dia)}
            </div>
          ))}
          <div>
            {Array.from({ length: HASTA - DESDE }, (_, i) => (
              <div key={i} className={s.calHora}>
                {String(DESDE + i).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {SEMANA.map((dia) => (
            <div key={dia} className={s.calColumna} style={{ height: (HASTA - DESDE) * ALTO_HORA }}>
              {eventos
                .filter((e) => e.franja!.dia === dia)
                .map((e) => {
                  const top = ((aMinutos(e.franja!.desde) - DESDE * 60) / 60) * ALTO_HORA;
                  const alto = (duracionDe(e.franja!) / 60) * ALTO_HORA;
                  const esCompromiso = e.carril === "COMPROMISOS";
                  const estilo: React.CSSProperties = {
                    top,
                    height: alto,
                    ["--spike-materia" as string]: colorDe(e),
                    ...(e.estado === "COMPROMISO_CONFIRMADO"
                      ? { background: "var(--foreground)", color: "var(--background)" }
                      : e.estado === "INCUMPLIDO"
                        ? { background: "var(--urgencia-tinte)", border: "2px solid var(--urgencia-texto)" }
                        : {}),
                    ...(seleccion === e.id ? { outline: "2px solid var(--ring)", outlineOffset: 1 } : {}),
                  };
                  const texto = `${e.franja!.desde} ${MATERIAS[e.materia].corto} · ${e.estado === "INSTITUCIONAL" ? e.tipo : etiquetaDeEstado(e)}`;
                  return esCompromiso ? (
                    <button
                      key={e.id}
                      type="button"
                      className={`${s.calEvento} ${s.calEventoCompromiso}`}
                      style={estilo}
                      data-cal-id={e.id}
                      onClick={() => onSeleccionar(e.id)}
                      aria-label={`${e.titulo}, ${diaLargo(dia)} ${e.franja!.desde}–${e.franja!.hasta}, ${etiquetaDeEstado(e)}`}
                    >
                      {texto}
                    </button>
                  ) : (
                    <div key={e.id} className={s.calEvento} style={estilo} data-cal-id={e.id}>
                      {texto}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
