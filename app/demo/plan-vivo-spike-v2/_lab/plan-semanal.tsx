"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE — el plan semanal: siete días fijos, cinco carriles.
 *
 * ## Qué corrige de V1
 *
 * - **Un solo «Ahora»**, en la cabecera de la columna de hoy. El eje es de días,
 *   no de horas: no se finge una posición horaria que la escala no tiene.
 * - **«Trabajo académico»** en vez de *Próximas acciones*, con *Ya ocurrió* y *Por
 *   venir* separados en el día de hoy.
 * - **Disponibilidad declarada y margen, en carriles distintos.**
 *
 * ## Cómo se mueve
 *
 * FLIP con la Web Animations API, igual que V1: se anima **sólo** lo que cambió de
 * franja. Clases, evaluaciones y lo que no cambia no se animan, y al cargar nada se
 * mueve. Con `prefers-reduced-motion` el cambio es instantáneo.
 */

import { FlaskConical } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

import { BloqueMargen, BloqueVentana, Bloque, Huella, yaPaso, type MotivoDeHuella } from "./bloque";
import { useLab } from "./contexto";
import { MOTIVO_SIN_UBICAR, t, type ClaveDeCopy } from "./copy";
import { AHORA, SEMANA, VENTANAS, EXCEPCIONES } from "./fixture";
import { aMinutos, diaCorto, diaMedio } from "./formato";
import { diferencia } from "./proyeccion";
import s from "./lab.module.css";
import type { Colocado, Franja, Margen, VentanaEnPlan } from "./tipos";

type CarrilDelPlan = "FACULTAD" | "COMPROMISOS" | "TRABAJO" | "DISPONIBILIDAD" | "MARGEN";
const CARRILES: readonly CarrilDelPlan[] = ["FACULTAD", "COMPROMISOS", "TRABAJO", "DISPONIBILIDAD", "MARGEN"];
const ETIQUETA: Readonly<Record<CarrilDelPlan, ClaveDeCopy>> = {
  FACULTAD: "PLAN.CARRIL.FACULTAD",
  COMPROMISOS: "PLAN.CARRIL.COMPROMISOS",
  TRABAJO: "PLAN.CARRIL.TRABAJO",
  DISPONIBILIDAD: "PLAN.CARRIL.DISPONIBILIDAD",
  MARGEN: "PLAN.CARRIL.MARGEN",
};

type Entrada =
  | { tipo: "bloque"; clave: string; orden: number; c: Colocado }
  | { tipo: "huella"; clave: string; orden: number; id: string; franja: Franja | null; destino: Franja | null; motivo: MotivoDeHuella }
  | { tipo: "ventana"; clave: string; orden: number; v: VentanaEnPlan; quitada: boolean }
  | { tipo: "margen"; clave: string; orden: number; m: Margen }
  | { tipo: "rotulo"; clave: string; orden: number; texto: string };

const claveDeCelda = (carril: CarrilDelPlan, dia: string) => `${carril}|${dia}`;
const franjaTexto = (f: Franja | null) => (f ? `${f.dia} ${f.desde}` : "sin-lugar");

export const TEXTO_AHORA = `${t("LAB.AHORA")} · ${diaMedio(AHORA.dia)} · ${AHORA.hora}`;

export function PlanSemanal({ encabezado }: { encabezado: React.ReactNode }) {
  const lab = useLab();
  const p = lab.mostrada;
  const ref = lab.modo === "EXPLICADO" ? lab.referencia : null;
  const raiz = useRef<HTMLElement>(null);
  const antes = useRef<Map<string, { x: number; y: number; franja: string }>>(new Map());
  const yaDibujo = useRef(false);

  const celdas = new Map<string, Entrada[]>();
  const agregar = (carril: CarrilDelPlan, dia: string, e: Entrada) => {
    const k = claveDeCelda(carril, dia);
    celdas.set(k, [...(celdas.get(k) ?? []), e]);
  };
  const porUbicar: Entrada[] = [];

  for (const c of p.colocados) {
    const e: Entrada = { tipo: "bloque", clave: c.clave, orden: c.franja ? aMinutos(c.franja.desde) : 0, c };
    if (c.franja) agregar(c.carril, c.franja.dia, e);
    else if (c.estado === "PROPUESTA") porUbicar.push(e);
  }
  for (const v of p.ventanas)
    agregar("DISPONIBILIDAD", v.ventana.franja.dia, { tipo: "ventana", clave: v.ventana.id, orden: aMinutos(v.ventana.franja.desde), v, quitada: false });
  for (const id of lab.escenarioMostrado.quitadas) {
    const v = [...VENTANAS, ...EXCEPCIONES].find((x) => x.id === id);
    if (v) agregar("DISPONIBILIDAD", v.franja.dia, { tipo: "ventana", clave: v.id, orden: aMinutos(v.franja.desde), v: { ventana: v, minutosUtiles: 0 }, quitada: true });
  }
  for (const m of p.margenes) agregar("MARGEN", m.dia, { tipo: "margen", clave: `margen-${m.dia}-${m.desde}`, orden: aMinutos(m.desde), m });

  if (ref) {
    const d = diferencia(ref, p);
    const viejo = new Map(ref.colocados.map((c) => [c.clave, c]));
    const huella = (clave: string, motivo: MotivoDeHuella, destino: Franja | null) => {
      const c = viejo.get(clave);
      if (!c) return;
      const e: Entrada = { tipo: "huella", clave: `huella-${clave}`, orden: c.franja ? aMinutos(c.franja.desde) - 0.2 : 0, id: c.id, franja: c.franja, destino, motivo };
      if (c.franja) agregar(c.carril, c.franja.dia, e);
      else porUbicar.push(e);
    };
    for (const m of d.movidos) huella(m.clave, "MOVIDO", m.despues);
    for (const id of d.desubicados) huella(id, "DESUBICADO", null);
    for (const id of d.ubicados) huella(id, "UBICADO", null);
    for (const id of d.retirados) huella(id, "RETIRADO", null);
  }

  // Hoy, en Trabajo académico: lo que ya ocurrió y lo que viene, separados.
  const hoy = celdas.get(claveDeCelda("TRABAJO", AHORA.dia)) ?? [];
  const minutoAhora = aMinutos(AHORA.hora);
  const pasadas = hoy.filter((e) => e.tipo === "bloque" && e.c.franja && yaPaso(e.c.franja));
  const futuras = hoy.filter((e) => !(e.tipo === "bloque" && e.c.franja && yaPaso(e.c.franja)) && e.tipo !== "rotulo");
  if (pasadas.length) agregar("TRABAJO", AHORA.dia, { tipo: "rotulo", clave: "rotulo-ocurrio", orden: -1, texto: t("PLAN.YA_OCURRIO") });
  if (futuras.length) agregar("TRABAJO", AHORA.dia, { tipo: "rotulo", clave: "rotulo-venir", orden: minutoAhora - 0.5, texto: t("PLAN.POR_VENIR") });

  for (const [k, v] of celdas) celdas.set(k, [...v].sort((a, b) => a.orden - b.orden));

  const firma = p.colocados.map((c) => `${c.clave}:${franjaTexto(c.franja)}:${c.estado}`).join("|");
  useLayoutEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const scroll = el.querySelector<HTMLElement>("[data-zona-scroll]");
    const origen = el.getBoundingClientRect();
    const nuevas = new Map<string, { x: number; y: number; franja: string }>();
    const bloques = el.querySelectorAll<HTMLElement>("[data-lab-clave][data-movil]");
    bloques.forEach((b) => b.getAnimations?.().forEach((a) => a.cancel()));
    bloques.forEach((b) => {
      const r = b.getBoundingClientRect();
      const enGrilla = scroll?.contains(b) ?? false;
      nuevas.set(b.dataset.labClave!, {
        x: r.left - origen.left + (enGrilla ? scroll!.scrollLeft : 0),
        y: r.top - origen.top,
        franja: b.closest<HTMLElement>("[data-franja]")?.dataset.franja ?? "",
      });
    });
    if (yaDibujo.current && lab.animar && !lab.movimientoReducido) {
      bloques.forEach((b) => {
        const previo = antes.current.get(b.dataset.labClave!);
        const actual = nuevas.get(b.dataset.labClave!)!;
        if (!previo || previo.franja === actual.franja || typeof b.animate !== "function") return;
        const dx = previo.x - actual.x;
        const dy = previo.y - actual.y;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        b.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], {
          duration: 480,
          easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
        });
      });
    }
    antes.current = nuevas;
    yaDibujo.current = true;
  }, [firma, lab.animar, lab.movimientoReducido]);

  const dibujar = (e: Entrada) => {
    switch (e.tipo) {
      case "bloque":
        return (
          <div key={e.clave} className={s.envoltorio} data-franja={franjaTexto(e.c.franja)}>
            <BloqueConFranja c={e.c} />
          </div>
        );
      case "huella":
        return <Huella key={e.clave} id={e.id} franja={e.franja} destino={e.destino} motivo={e.motivo} animar={lab.animar} />;
      case "ventana":
        return (
          <BloqueVentana key={e.clave} ventana={e.v} quitada={e.quitada} seleccionado={lab.seleccion === e.v.ventana.id} onSeleccionar={lab.seleccionar} />
        );
      case "margen":
        return <BloqueMargen key={e.clave} margen={e.m} animar={lab.animar} />;
      case "rotulo":
        return (
          <span key={e.clave} className={s.rotuloTiempo}>
            {e.texto}
          </span>
        );
    }
  };

  const ribete = lab.vistaPrevia
    ? { texto: t("ESCENARIO.VISTA_PREVIA"), tipo: "vista-previa" }
    : lab.plano === "ESCENARIO"
      ? { texto: t("ESCENARIO.RIBETE"), tipo: "escenario" }
      : { texto: t("REAL.RIBETE"), tipo: "real" };

  return (
    <section className={s.tarjeta} ref={raiz} aria-labelledby="lab-plan-titulo" data-plan-semanal data-plano={lab.vistaPrevia ? "VISTA_PREVIA" : lab.plano}>
      <header className={s.tarjetaCabecera}>
        <h2 id="lab-plan-titulo" className={s.tarjetaTitulo}>
          {t("PLAN.TITULO")} · 14 al 20 de septiembre
        </h2>
        <span
          className={[s.pastilla, ribete.tipo === "real" ? s.pastillaNeutra : ribete.tipo === "escenario" ? s.pastillaEscenario : s.pastillaVistaPrevia].join(" ")}
          data-ribete={ribete.tipo}
        >
          {ribete.tipo !== "real" && <FlaskConical size={13} aria-hidden />}
          {ribete.texto}
        </span>
        <span className={s.desplazar}>{t("PLAN.DESPLAZAR")}</span>
        {encabezado}
      </header>

      <div className={s.planScroll} data-zona-scroll tabIndex={0} aria-label="Semana del 14 al 20 de septiembre">
        <div className={s.grilla} role="table" aria-label="Plan de la semana por carril y día">
          <div role="row" className={s.fila}>
            <div className={`${s.diaCabecera} ${s.esquina}`} role="columnheader" aria-label="Carril" />
            {SEMANA.map((dia) => {
              const esHoy = dia === AHORA.dia;
              return (
                <div key={dia} role="columnheader" data-dia={dia} className={[s.diaCabecera, esHoy ? s.diaCabeceraHoy : ""].join(" ")}>
                  <span>
                    {diaCorto(dia)}
                    {esHoy ? ` · ${t("PLAN.HOY")}` : ""}
                  </span>
                  {esHoy && (
                    <span className={s.ahora} data-ahora title={t("PLAN.AHORA.AYUDA")} aria-describedby="lab-ayuda-ahora">
                      {TEXTO_AHORA}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {CARRILES.map((carril) => (
            <div role="row" key={carril} className={s.fila}>
              <div className={s.etiquetaCarril} role="rowheader">
                {t(ETIQUETA[carril])}
              </div>
              {SEMANA.map((dia) => (
                <div
                  key={dia}
                  role="cell"
                  data-celda={claveDeCelda(carril, dia)}
                  className={[s.celda, dia === AHORA.dia ? s.celdaHoy : "", s[`celda${carril}`] ?? ""].join(" ")}
                >
                  {(celdas.get(claveDeCelda(carril, dia)) ?? []).map(dibujar)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p id="lab-ayuda-ahora" className={s.soloLectores}>
        {t("PLAN.AHORA.AYUDA")}
      </p>

      <div className={s.banda} data-banda="por-ubicar">
        <span className={s.bandaEtiqueta}>{t("PLAN.POR_UBICAR")}</span>
        <div className={s.bandaItems}>
          {porUbicar.length === 0 ? (
            <span className={s.bandaVacia}>{t("PLAN.POR_UBICAR.VACIO")}</span>
          ) : (
            porUbicar.map((e) =>
              e.tipo === "bloque" ? (
                <div key={e.clave} className={s.porUbicar} data-franja="sin-lugar">
                  <BloqueConFranja c={e.c} />
                  {e.c.motivoSinUbicar && <span className={s.motivo}>No entra: {MOTIVO_SIN_UBICAR[e.c.motivoSinUbicar]}.</span>}
                </div>
              ) : (
                dibujar(e)
              ),
            )
          )}
        </div>
      </div>

      <Leyenda />
    </section>
  );
}

function BloqueConFranja({ c }: { c: Colocado }) {
  const lab = useLab();
  return <Bloque colocado={c} proyeccion={lab.mostrada} seleccionado={lab.seleccion === c.id} animar={lab.animar} onSeleccionar={lab.seleccionar} />;
}

function Leyenda() {
  const muestra = (clase: string) => <span className={[s.muestra, clase].join(" ")} aria-hidden />;
  const items: [React.ReactNode, ClaveDeCopy][] = [
    [muestra(s.fijo), "LEYENDA.FIJO"],
    [muestra(s.hecho), "LEYENDA.HECHO"],
    [muestra(s.confirmado), "LEYENDA.CONFIRMADO"],
    [muestra(s.propuesta), "LEYENDA.PROPUESTA"],
    [muestra(s.simulado), "LEYENDA.SIMULADO"],
    [muestra(s.intento), "LEYENDA.INTENTO"],
    [muestra(s.incumplido), "LEYENDA.INCUMPLIDO"],
    [muestra(s.huella), "LEYENDA.HUELLA"],
  ];
  return (
    <div className={s.leyenda}>
      <span className={s.leyendaTitulo}>{t("LEYENDA.TITULO")}</span>
      {items.map(([m, clave]) => (
        <span key={clave} className={s.leyendaItem}>
          {m}
          {t(clave)}
        </span>
      ))}
    </div>
  );
}
