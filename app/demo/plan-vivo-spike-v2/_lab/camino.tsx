"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE — «Tu plan traducido».
 *
 * El orden, no el horario: arriba lo que ya ocurrió, después cada nivel de
 * prioridad con sus workitems lado a lado, y las dependencias como conectores
 * discretos. Sale de la **misma proyección** que el plan semanal.
 *
 * Los conectores se dibujan midiendo las estaciones y escribiendo el SVG a mano
 * (sin estado de React): sólo números calculados, nada que venga del usuario.
 */

import { CalendarCheck, CircleCheck, CircleDashed, FlaskConical, Hourglass, Link2, TriangleAlert } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

import { useLab } from "./contexto";
import { PRIORIDAD_VISIBLE, t } from "./copy";
import { COMPROMISOS, HECHOS, ID, MATERIAS, ORDEN_DE_PRIORIDAD, WORKITEMS } from "./fixture";
import { franjaCorta } from "./formato";
import { BotonSimular } from "./inspector";
import { colocadoDe, entidad, nombreCorto, porQueNoSeSimula } from "./proyeccion";
import s from "./lab.module.css";
import type { Proyeccion } from "./tipos";

interface EstadoDeEstacion {
  texto: string;
  Icono: typeof CircleCheck;
  clase: string;
  hecho: boolean;
  actual: boolean;
}

export function estadoDeEstacion(id: string, p: Proyeccion): EstadoDeEstacion {
  const e = entidad(id);
  const base = { clase: "", hecho: false, actual: false };
  if (e?.kind === "HECHO")
    return e.progresoRegistrado
      ? { ...base, texto: "Progreso registrado", Icono: CircleCheck, clase: s.estacionHecha, hecho: true }
      : { ...base, texto: "Realizado · evidencia pendiente", Icono: Hourglass, clase: s.estacionHecha, hecho: true };
  if (e?.kind === "COMPROMISO") {
    if (e.estado === "INCUMPLIDO") return { ...base, texto: "Incumplido", Icono: TriangleAlert, clase: s.estacionHecha, hecho: true };
    if (p.completados.includes(id)) return { ...base, texto: `Simulado · paso ${pasoDe(id, p)}`, Icono: FlaskConical, clase: s.estacionSimulada, hecho: true };
    const f = p.compromisos[id]?.franja;
    return { ...base, texto: `Comprometido${f ? ` · ${franjaCorta(f)}` : ""}`, Icono: CalendarCheck };
  }
  if (e?.kind !== "WORKITEM") return { ...base, texto: "", Icono: CircleDashed };
  if (p.completados.includes(id)) return { ...base, texto: `Simulado · paso ${pasoDe(id, p)}`, Icono: FlaskConical, clase: s.estacionSimulada, hecho: true };
  if (p.retirados.includes(id)) return { ...base, texto: "Ya no hace falta en el escenario", Icono: CircleCheck, clase: s.estacionSimulada, hecho: true };
  if (p.pasos.some((x) => x.id === id && x.incompleto && !x.sinLugar))
    return { ...base, texto: "Intento sin prerequisito · sigue pendiente", Icono: TriangleAlert, clase: s.estacionBloqueada };
  const faltan = e.requiere.filter((r) => !p.completados.includes(r) && !p.retirados.includes(r));
  if (faltan.length > 0)
    return { ...base, texto: `Bloqueado por dependencia: ${faltan.map(nombreCorto).join(", ")}`, Icono: Link2, clase: s.estacionBloqueada };
  if (p.recomendada === id) return { ...base, texto: "Recomendado ahora", Icono: CircleDashed, clase: s.estacionActual, actual: true };
  if (e.prioridad === "DESPUES") return { ...base, texto: "Posterior", Icono: CircleDashed };
  return { ...base, texto: "Propuesta", Icono: CircleDashed };
}

const pasoDe = (id: string, p: Proyeccion) => p.pasos.find((x) => x.id === id && !x.incompleto && !x.sinLugar)?.numero ?? "—";

const NIVELES: readonly { clave: string; titulo: string; ids: readonly string[] }[] = [
  { clave: "HECHO", titulo: t("CAMINO.YA_OCURRIO"), ids: [...HECHOS.map((h) => h.id), ID.COMPROMISO_INCUMPLIDO] },
  ...ORDEN_DE_PRIORIDAD.map((prioridad) => ({
    clave: prioridad,
    titulo: PRIORIDAD_VISIBLE[prioridad],
    ids: [
      ...WORKITEMS.filter((w) => w.prioridad === prioridad).map((w) => w.id),
      ...COMPROMISOS.filter((c) => c.estado === "CONFIRMADO" && c.prioridad === prioridad).map((c) => c.id),
    ],
  })),
];

const SVG = "http://www.w3.org/2000/svg";

export function Camino() {
  const lab = useLab();
  const p = lab.mostrada;
  const lienzo = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const firma = `${p.completados.join()}|${p.retirados.join()}|${p.pasos.length}|${lab.seleccion}`;

  useLayoutEffect(() => {
    const raiz = lienzo.current;
    const dibujo = svg.current;
    if (!raiz || !dibujo) return;
    const trazar = () => {
      const origen = raiz.getBoundingClientRect();
      const caminos: SVGPathElement[] = [];
      for (const w of WORKITEMS)
        for (const r of w.requiere) {
          const a = raiz.querySelector<HTMLElement>(`[data-estacion="${r}"]`)?.getBoundingClientRect();
          const b = raiz.querySelector<HTMLElement>(`[data-estacion="${w.id}"]`)?.getBoundingClientRect();
          if (!a || !b || (a.width === 0 && b.width === 0)) continue;
          const x1 = a.left - origen.left + a.width / 2;
          const y1 = a.bottom - origen.top;
          const x2 = b.left - origen.left + b.width / 2;
          const y2 = b.top - origen.top;
          const medio = (y1 + y2) / 2;
          const path = document.createElementNS(SVG, "path");
          path.setAttribute("d", `M ${x1} ${y1} C ${x1} ${medio}, ${x2} ${medio}, ${x2} ${y2}`);
          path.setAttribute("data-conector", `${r}>${w.id}`);
          caminos.push(path);
        }
      dibujo.replaceChildren(...caminos);
    };
    trazar();
    if (typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(trazar);
    observador.observe(raiz);
    return () => observador.disconnect();
  }, [firma]);

  return (
    <section className={`${s.tarjeta} ${s.camino}`} aria-labelledby="lab-camino-titulo" data-camino>
      <div>
        <h2 id="lab-camino-titulo" className={s.tarjetaTitulo}>
          {t("CAMINO.TITULO")}
        </h2>
        <p className={s.textoSuave}>{t("CAMINO.BAJADA")}</p>
      </div>
      <div className={s.caminoLienzo} ref={lienzo}>
        <svg ref={svg} className={s.caminoConectores} aria-hidden />
        {NIVELES.map((nivel) => {
          const lleno = nivel.ids.every((id) => estadoDeEstacion(id, p).hecho);
          return (
            <div key={nivel.clave} className={s.nivel} data-nivel={nivel.clave}>
              <div className={[s.riel, lleno ? s.rielLleno : ""].join(" ")} aria-hidden>
                <span className={s.rielPunto} />
              </div>
              <div>
                <h3 className={s.nivelTitulo}>{nivel.titulo}</h3>
                <ul className={s.estaciones} role="list">
                  {nivel.ids.map((id) => (
                    <Estacion key={id} id={id} p={p} />
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Estacion({ id, p }: { id: string; p: Proyeccion }) {
  const lab = useLab();
  const e = entidad(id);
  if (!e || !("materia" in e)) return null;
  const estado = estadoDeEstacion(id, p);
  const simulable = porQueNoSeSimula(lab.escenario, lab.proyeccionDelEscenario, id) === null;
  const duracion = e.kind === "WORKITEM" ? `${e.duracion.probable} min probables` : null;
  const c = colocadoDe(p, id);
  const puedePrevisualizar = simulable && (e.kind === "WORKITEM" || e.kind === "COMPROMISO");
  const seleccionada = lab.seleccion === id;

  return (
    <li
      className={[s.estacion, estado.clase, seleccionada ? s.estacionSeleccionada : ""].join(" ")}
      style={{ ["--lab-materia" as string]: MATERIAS[e.materia].color }}
      data-estacion={id}
      data-estado-estacion={estado.texto}
      onPointerEnter={(ev) => puedePrevisualizar && ev.pointerType !== "touch" && ev.pointerType !== "pen" && lab.previsualizarPaso(id)}
      onPointerLeave={() => puedePrevisualizar && lab.previsualizarPaso(null)}
    >
      <button
        type="button"
        className={s.estacionBoton}
        aria-pressed={seleccionada}
        onClick={() => lab.seleccionar(id)}
        onFocus={() => puedePrevisualizar && lab.previsualizarPaso(id)}
        onBlur={() => puedePrevisualizar && lab.previsualizarPaso(null)}
      >
        <span className={s.estacionEstado}>
          <estado.Icono size={12} aria-hidden />
          {estado.texto}
        </span>
        <span className={s.estacionTitulo}>{e.titulo}</span>
        <span className={s.estacionMeta}>
          {[
            MATERIAS[e.materia].corto,
            e.kind === "WORKITEM" ? `Prioridad: ${PRIORIDAD_VISIBLE[e.prioridad]}` : null,
            duracion,
            c?.franja && e.kind === "WORKITEM" && !estado.hecho ? franjaCorta(c.franja) : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {e.kind === "WORKITEM" && e.requiere.length > 0 && (
          <span className={s.estacionMeta}>
            ↳ {t("CAMINO.REQUIERE")} {e.requiere.map(nombreCorto).join(", ")}
          </span>
        )}
      </button>
      {simulable && <BotonSimular id={id} compacto />}
    </li>
  );
}
