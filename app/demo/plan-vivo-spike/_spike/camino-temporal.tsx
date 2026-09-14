"use client";

/**
 * 🧪 SPIKE DESCARTABLE — el camino temporal: siete días fijos, cuatro carriles.
 *
 * ## Cómo se mueve
 *
 * Técnica FLIP con la Web Animations API, sin librería: después de cada cambio de
 * escenario se mide dónde quedó cada bloque, se compara con dónde estaba, y se
 * anima **sólo el que se movió**, desde su lugar viejo hasta el nuevo. Lo demás
 * no se toca. Al cargar no se mueve nada, y con `prefers-reduced-motion` el cambio
 * es instantáneo: las huellas, los rótulos y el texto explican lo mismo.
 */

import { FlaskConical } from "lucide-react";
import { useLayoutEffect, useMemo, useRef } from "react";

import { Bloque, FranjaDisponible, Huella, Margen } from "./bloque";
import { CARRILES, claveDeCelda, esDiaPasado, yaPaso, type Camino, type CarrilDelCamino, type Entrada } from "./celdas";
import { t, type ClaveDeCopy } from "./copy";
import { SEMANA } from "./fixture";
import { diaCorto } from "./formato";
import { itemDe } from "./proyecciones";
import s from "./spike.module.css";
import type { SpikePlanProjection } from "./tipos";

const ETIQUETA_DE_CARRIL: Readonly<Record<CarrilDelCamino, ClaveDeCopy>> = {
  FACULTAD: "CAMINO.CARRIL.FACULTAD",
  COMPROMISOS: "CAMINO.CARRIL.COMPROMISOS",
  ACCIONES: "CAMINO.CARRIL.ACCIONES",
  MARGEN: "CAMINO.CARRIL.MARGEN",
};

export function CaminoTemporal({
  proyeccion,
  camino,
  altos,
  ribete,
  mensaje,
  seleccion,
  movimientoReducido,
  animar,
  onSeleccionar,
}: {
  proyeccion: SpikePlanProjection;
  camino: Camino;
  altos: Record<CarrilDelCamino, number>;
  /** El rótulo permanente de simulación o vista previa. `null` = plan actual. */
  ribete: { texto: string; tipo: "simulacion" | "vista-previa" | "neutro" } | null;
  mensaje: string | null;
  seleccion: string | null;
  movimientoReducido: boolean;
  /** Si ya hubo interacción: al cargar no aparece nada con movimiento. */
  animar: boolean;
  onSeleccionar: (id: string) => void;
}) {
  const raiz = useRef<HTMLElement>(null);
  const posiciones = useRef<Map<string, { x: number; y: number; zona: string }>>(new Map());
  const yaDibujo = useRef(false);
  const diaAnterior = useRef(camino.diaDeAhora);

  // Si el reloj cambia de día, se trae a la vista el día anterior a «Ahora» —el del
  // compromiso de ayer— y el de hoy. Al cargar no se desplaza nada: el lunes ya es
  // la primera columna.
  useLayoutEffect(() => {
    if (diaAnterior.current === camino.diaDeAhora) return;
    diaAnterior.current = camino.diaDeAhora;
    const scroll = raiz.current?.querySelector<HTMLElement>("[data-zona-scroll]");
    const indice = Math.max(0, SEMANA.indexOf(camino.diaDeAhora) - 1);
    const columna = raiz.current?.querySelector<HTMLElement>(`[data-dia="${SEMANA[indice]}"]`);
    const etiqueta = raiz.current?.querySelector<HTMLElement>("[data-esquina]");
    if (!scroll || !columna || typeof scroll.scrollTo !== "function") return;
    const izquierda =
      columna.getBoundingClientRect().left - scroll.getBoundingClientRect().left + scroll.scrollLeft;
    scroll.scrollTo({
      left: Math.max(0, izquierda - (etiqueta?.getBoundingClientRect().width ?? 0)),
      behavior: movimientoReducido ? "auto" : "smooth",
    });
  }, [camino.diaDeAhora, movimientoReducido]);

  useLayoutEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const scroll = el.querySelector<HTMLElement>("[data-zona-scroll]");
    const origen = el.getBoundingClientRect();
    const nuevas = new Map<string, { x: number; y: number; zona: string }>();
    const bloques = el.querySelectorAll<HTMLElement>("[data-spike-id]");

    bloques.forEach((b) => b.getAnimations?.().forEach((a) => a.cancel()));
    bloques.forEach((b) => {
      const r = b.getBoundingClientRect();
      const enGrilla = scroll?.contains(b) ?? false;
      nuevas.set(b.dataset.spikeId!, {
        x: r.left - origen.left + (enGrilla ? scroll!.scrollLeft : 0),
        y: r.top - origen.top,
        zona: enGrilla ? "grilla" : "banda",
      });
    });

    if (yaDibujo.current && !movimientoReducido) {
      bloques.forEach((b) => {
        const antes = posiciones.current.get(b.dataset.spikeId!);
        const ahora = nuevas.get(b.dataset.spikeId!)!;
        if (!antes || antes.zona !== ahora.zona || typeof b.animate !== "function") return;
        const dx = antes.x - ahora.x;
        const dy = antes.y - ahora.y;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        b.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
          { duration: 480, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
        );
      });
    }
    posiciones.current = nuevas;
    yaDibujo.current = true;
  }, [proyeccion, movimientoReducido]);

  const tituloDeRequisito = useMemo(() => {
    return (id: string): string | null => {
      const item = itemDe(proyeccion, id)!;
      for (const req of item.requiere) {
        const r = itemDe(proyeccion, req);
        if (r && r.estado !== "PROGRESO_REGISTRADO") return r.titulo.replace(/^Resolver |^Repasar /, "");
      }
      return null;
    };
  }, [proyeccion]);

  const dibujar = (e: Entrada, dia: string) => {
    const pasado = yaPaso(e, camino, dia);
    switch (e.tipo) {
      case "item":
        return (
          <Bloque
            key={e.clave}
            item={e.item}
            recomendada={e.item.id === proyeccion.proximaAccion}
            seleccionado={seleccion === e.item.id}
            pasado={pasado}
            requiereTitulo={e.item.carril === "ACCIONES" && !pasado ? tituloDeRequisito(e.item.id) : null}
            animar={animar}
            onSeleccionar={onSeleccionar}
          />
        );
      case "huella":
        return <Huella key={e.clave} item={e.item} franja={e.franja} motivo={e.motivo} animar={animar} />;
      case "ahora":
        return (
          <div key={e.clave} className={s.ahora} aria-hidden>
            {t("CAMINO.AHORA")} {e.hora}
          </div>
        );
      case "disponible":
        return <FranjaDisponible key={e.clave} franja={e.franja} pasada={pasado} />;
      case "margen":
        return <Margen key={e.clave} margen={e.margen} animar={animar} />;
    }
  };

  return (
    <section className={s.tarjeta} ref={raiz} aria-labelledby="spike-camino-titulo">
      <header className={s.caminoCabecera}>
        <h2 id="spike-camino-titulo" className={s.caminoTitulo}>
          {t("CAMINO.TITULO")} · 14 al 20 de septiembre
        </h2>
        {ribete && (
          <span
            className={[
              s.pastilla,
              ribete.tipo === "simulacion" ? s.pastillaSimulacion : ribete.tipo === "vista-previa" ? s.pastillaVistaPrevia : s.pastillaNeutra,
            ].join(" ")}
            data-ribete={ribete.tipo}
          >
            <FlaskConical size={13} aria-hidden />
            {ribete.texto}
          </span>
        )}
        <span className={s.desplazar}>{t("CAMINO.DESPLAZAR")}</span>
        {mensaje && <p className={s.caminoMensaje}>{mensaje}</p>}
      </header>

      <div className={s.caminoScroll} data-zona-scroll tabIndex={0} aria-label="Semana del 14 al 20 de septiembre">
        <div className={s.grilla} role="table" aria-label="Plan de la semana por carril y día">
          <div role="row" style={{ display: "contents" }}>
            <div className={`${s.diaCabecera} ${s.esquina}`} role="columnheader" data-esquina />
            {SEMANA.map((dia) => (
              <div
                key={dia}
                role="columnheader"
                data-dia={dia}
                className={[
                  s.diaCabecera,
                  esDiaPasado(dia, camino.diaDeAhora) ? s.diaCabeceraPasado : "",
                  dia === camino.diaDeAhora ? s.diaCabeceraHoy : "",
                ].join(" ")}
              >
                {diaCorto(dia)}
                {esDiaPasado(dia, camino.diaDeAhora) && <span style={{ fontWeight: 400 }}>· {t("CAMINO.YA_PASO")}</span>}
              </div>
            ))}
          </div>
          {CARRILES.map((carril) => (
            <div role="row" key={carril} style={{ display: "contents" }}>
              <div className={s.etiquetaCarril} role="rowheader" style={{ minHeight: altos[carril] }}>
                {t(ETIQUETA_DE_CARRIL[carril])}
              </div>
              {SEMANA.map((dia) => (
                <div
                  key={dia}
                  role="cell"
                  data-celda={claveDeCelda(carril, dia)}
                  className={[s.celda, esDiaPasado(dia, camino.diaDeAhora) ? s.celdaPasada : ""].join(" ")}
                  style={{ minHeight: altos[carril] }}
                >
                  {(camino.celdas.get(claveDeCelda(carril, dia)) ?? []).map((e) => dibujar(e, dia))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {camino.reubicar.length > 0 && (
        <div className={s.banda} data-banda="reubicar">
          <span className={`${s.bandaEtiqueta} ${s.bandaEtiquetaUrgente}`}>{t("CAMINO.REUBICAR")}</span>
          <div className={s.bandaItems}>{camino.reubicar.map((e) => dibujar(e, camino.diaDeAhora))}</div>
        </div>
      )}
      <div className={s.banda} data-banda="por-ubicar">
        <span className={s.bandaEtiqueta}>{t("CAMINO.POR_UBICAR")}</span>
        <div className={s.bandaItems}>
          {camino.porUbicar.length === 0 ? (
            <span className={s.bandaVacia}>{t("CAMINO.POR_UBICAR.VACIO")}</span>
          ) : (
            camino.porUbicar.map((e) => dibujar(e, camino.diaDeAhora))
          )}
        </div>
      </div>

      <Leyenda />
    </section>
  );
}

function Leyenda() {
  const muestra = (clase: string, extra?: React.CSSProperties) => (
    <span className={[s.bloque, s.muestra, clase].join(" ")} style={extra} aria-hidden />
  );
  const items: [React.ReactNode, ClaveDeCopy][] = [
    [muestra(s.institucional), "LEYENDA.INSTITUCIONAL"],
    [muestra(s.confirmado), "LEYENDA.CONFIRMADO"],
    [muestra(s.sugerida), "LEYENDA.SUGERIDA"],
    [muestra(s.evidencia), "LEYENDA.EVIDENCIA"],
    [muestra(s.progreso), "LEYENDA.PROGRESO"],
    [muestra(s.incumplido), "LEYENDA.INCUMPLIDO"],
    [muestra(`${s.sugerida} ${s.bloqueHipotetico}`), "LEYENDA.SIMULADO"],
    [<span key="h" className={`${s.huella} ${s.muestra}`} aria-hidden />, "LEYENDA.HUELLA"],
    [<span key="m" className={`${s.margen} ${s.muestra}`} aria-hidden />, "LEYENDA.MARGEN"],
  ];
  return (
    <div className={s.leyenda} aria-label={t("LEYENDA.TITULO")}>
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
