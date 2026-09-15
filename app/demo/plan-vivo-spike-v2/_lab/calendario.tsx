"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE — el Calendario, sincronizado.
 *
 * ⚠️ **Lee la misma proyección que el plan** (`mostrada`): con *Tu plan real* se ve
 * el real, con *Escenario* el escenario. Una reubicación o un cambio de horario
 * aparecen sólo en el del escenario, y la promesa original sigue a la vista. Sin
 * vista mensual, sin edición, sin sincronizar con nada.
 */

import { ArrowLeft } from "lucide-react";

import { colorDe, etiquetaDe } from "./bloque";
import { useLab } from "./contexto";
import { t } from "./copy";
import { SEMANA } from "./fixture";
import { aMinutos, diaCorto, diaLargo, duracionDe } from "./formato";
import { entidad, nombreCorto } from "./proyeccion";
import s from "./lab.module.css";

const DESDE = 8;
const HASTA = 22;
const ALTO_HORA = 36;

const CLASE_POR_ESTADO: Record<string, string> = {
  FIJO: s.fijo,
  HECHO: s.hecho,
  INCUMPLIDO: s.incumplido,
  CONFIRMADO: s.confirmado,
  PROMESA_ANTERIOR: s.promesa,
  PROPUESTA: s.propuesta,
  SIMULADO: s.simulado,
  INTENTO: s.intento,
};

export function Calendario() {
  const lab = useLab();
  const p = lab.mostrada;
  const eventos = p.colocados.filter((c) => c.franja);
  const rotulo = lab.vistaPrevia ? t("ESCENARIO.VISTA_PREVIA") : lab.plano === "ESCENARIO" ? t("ESCENARIO.RIBETE") : t("REAL.RIBETE");

  return (
    <section className={s.tarjeta} aria-labelledby="lab-cal-titulo" data-calendario data-plano={lab.plano}>
      <header className={s.tarjetaCabecera}>
        <h2 id="lab-cal-titulo" className={s.tarjetaTitulo}>
          {t("CAL.TITULO")} · 14 al 20 de septiembre
        </h2>
        <span className={`${s.pastilla} ${lab.plano === "ESCENARIO" || lab.vistaPrevia ? s.pastillaEscenario : s.pastillaNeutra}`} data-ribete-calendario>
          {rotulo}
        </span>
        <span className={s.textoSuave}>{t("CAL.SOLO_LECTURA")}</span>
        <button type="button" className={s.botonTexto} onClick={() => lab.cambiarVista("PLAN")} style={{ marginLeft: "auto" }}>
          <ArrowLeft size={14} aria-hidden />
          {t("CAL.VOLVER")}
        </button>
      </header>

      <div className={s.planScroll} tabIndex={0} aria-label="Grilla semanal por hora">
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
                .filter((c) => c.franja!.dia === dia)
                .map((c) => {
                  const e = entidad(c.id);
                  if (!e || !("materia" in e)) return null;
                  const fr = c.franja!;
                  const top = ((aMinutos(fr.desde) - DESDE * 60) / 60) * ALTO_HORA;
                  const alto = Math.max(18, (duracionDe(fr) / 60) * ALTO_HORA);
                  const etiqueta = etiquetaDe(c, p);
                  return (
                    <button
                      key={c.clave}
                      type="button"
                      className={[s.calEvento, CLASE_POR_ESTADO[c.estado], lab.seleccion === c.id ? s.bloqueSeleccionado : ""].join(" ")}
                      style={{ top, height: alto, ["--lab-materia" as string]: colorDe(c.id) }}
                      data-cal-clave={c.clave}
                      data-cal-id={c.id}
                      data-estado={c.estado}
                      aria-pressed={lab.seleccion === c.id}
                      aria-label={`${e.titulo}, ${diaLargo(dia)} ${fr.desde}–${fr.hasta}, ${etiqueta}`}
                      onClick={() => lab.seleccionar(c.id)}
                    >
                      {fr.desde} {nombreCorto(c.id)} · {etiqueta}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
