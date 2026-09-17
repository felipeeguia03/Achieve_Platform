"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE V3 — el calendario semanal: la única representación
 * temporal del plan.
 *
 * - Días en columnas, horas de 07:00 a 23:00 en el eje vertical, escala proporcional.
 * - **El alto de un bloque es su duración probable**; el máximo va como una cola
 *   punteada debajo, y el detalle completo está en el inspector.
 * - La disponibilidad es **el fondo** de la columna, no otra fila.
 * - Un solo indicador «Ahora», en el día actual. No es disponibilidad ni compromiso.
 * - Clases, evaluaciones, Focus en curso e historia **no son arrastrables**. Una
 *   propuesta se arrastra; un compromiso también, pero soltarlo **abre la
 *   renegociación**, nunca lo mueve solo.
 */

import { useLayoutEffect, useRef } from "react";

import { useLab } from "./contexto";
import { liberados, movidos } from "./explicacion";
import { MATERIAS } from "./fixture";
import { DIA, HORA_FIN, HORA_INICIO, SEMANA, diaCorto, diaMedio, diasDesdeElLunes, fechaDe, horaDe, minutoDelDia } from "./formato";
import { accion } from "./motor";
import { etiquetaDeItem, idDeSeleccion, textoDeMovilidad } from "./presentacion";
import s from "./lab.module.css";
import type { CalendarProjectionItem } from "./tipos";

export const PX_POR_HORA = { escritorio: 48, movil: 56 } as const;
const MINIMO_PX = 22;

const HORAS = Array.from({ length: HORA_FIN - HORA_INICIO + 1 }, (_, i) => HORA_INICIO + i);

function useFlip(contenedor: React.RefObject<HTMLElement | null>, activo: boolean, firma: string) {
  const previas = useRef(new Map<string, DOMRect>());
  useLayoutEffect(() => {
    const raiz = contenedor.current;
    if (!raiz) return;
    const actuales = new Map<string, DOMRect>();
    raiz.querySelectorAll<HTMLElement>("[data-lab-clave]").forEach((el) => {
      const clave = el.dataset.labClave!;
      const r = el.getBoundingClientRect();
      actuales.set(clave, r);
      const antes = previas.current.get(clave);
      if (!activo || !antes || typeof el.animate !== "function") return;
      const dx = antes.left - r.left;
      const dy = antes.top - r.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      const duracion = parseFloat(getComputedStyle(raiz).getPropertyValue("--lab-duracion")) || 240;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: duracion, easing: "ease-out" });
    });
    previas.current = actuales;
  }, [contenedor, activo, firma]);
}

export function Calendario() {
  const lab = useLab();
  const p = lab.mostrada;
  const px = lab.esMovil ? PX_POR_HORA.movil : PX_POR_HORA.escritorio;
  const hoy = fechaDe(p.ahora);
  const dias = lab.esMovil ? [lab.diaMovil] : SEMANA;
  const raiz = useRef<HTMLDivElement>(null);
  const editable = lab.plano === "REAL";

  const firma = p.items.map((it) => `${it.clave}@${it.ini}`).join("|");
  useFlip(raiz, !lab.movimientoReducido, firma);

  const visible = (it: CalendarProjectionItem) => {
    if (it.tipo !== "PROPUESTA" || it.ubicacion === "ELEGIDA") return true;
    if (lab.plano === "ESCENARIO") return true;
    return lab.seleccion === it.origen.id;
  };

  const huellas =
    lab.modo === "EXPLICAR" && lab.plano === "ESCENARIO" && lab.anterior
      ? [
          ...movidos(lab.anterior, p).map((m) => ({ clave: `huella-${m.accionId}`, ...m.antes, tipo: "ANTES" as const, texto: `Antes estaba acá · ${accion(m.accionId)!.corto}` })),
          ...liberados(lab.anterior, p)
            .filter((l) => l.lugar)
            .map((l) => ({ clave: `libera-${l.accionId}`, ini: l.lugar!.ini, fin: l.lugar!.fin, tipo: "LIBERA" as const, texto: `Este espacio se libera · ${accion(l.accionId)!.corto}` })),
        ]
      : [];

  const top = (ini: number) => ((minutoDelDia(ini) - HORA_INICIO * 60) / 60) * px;
  const alto = (ini: number, fin: number) => Math.max(MINIMO_PX, ((fin - ini) / 60) * px);

  const minutoDesdeEvento = (e: React.DragEvent<HTMLElement>, fecha: string) => {
    const r = e.currentTarget.getBoundingClientRect();
    const bruto = HORA_INICIO * 60 + ((e.clientY - r.top) / px) * 60 - (lab.arrastre?.desplazamiento ?? 0);
    return diasDesdeElLunes(fecha) * DIA + Math.round(bruto / 15) * 15;
  };

  const soltar = (e: React.DragEvent<HTMLElement>, fecha: string) => {
    const a = lab.arrastre;
    if (!a || !editable) return;
    e.preventDefault();
    const ini = minutoDesdeEvento(e, fecha);
    lab.empezarArrastre(null);
    if (!Number.isFinite(ini)) return lab.previsualizarArrastre(null);
    lab.previsualizarArrastre(null);
    lab.intentar(a.tipo === "ACCION" ? { tipo: "UBICAR", id: a.id, ini, duracion: a.duracion } : { tipo: "MOVER", compromisoId: a.id, ini });
  };

  return (
    <section className={`${s.tarjeta}`} aria-labelledby="lab3-cal-titulo" data-calendario data-plano={lab.plano}>
      <div className={s.calCabecera}>
        <div>
          <h2 id="lab3-cal-titulo" className={s.seccionTitulo}>
            {lab.plano === "ESCENARIO" ? "Tu semana en el escenario" : "Tu semana"}
          </h2>
          <p className={s.textoSuave}>
            {lab.plano === "ESCENARIO"
              ? "Lo simulado va rayado y rotulado. Tu plan real no cambió."
              : editable
                ? "Arrastrá una acción a un hueco, o usá «Elegir horario». Lo fijo tiene candado."
                : ""}
          </p>
        </div>
        <ul className={s.leyenda} aria-label="Referencias del calendario">
          <li>▮ Clase y evaluación: fijas</li>
          <li>▭ Propuesta: contorno</li>
          <li>┅ Sugerida: contorno punteado</li>
          <li>■ Compromiso: sólido</li>
          <li>▨ Simulado: rayado</li>
          <li>▒ Fondo verde: disponible</li>
        </ul>
      </div>

      {lab.esMovil && (
        <div className={s.diasMovil} role="group" aria-label="Día que se muestra">
          {SEMANA.map((f) => (
            <button key={f} type="button" className={s.segmento} aria-pressed={lab.diaMovil === f} onClick={() => lab.cambiarDiaMovil(f)}>
              {diaCorto(f)}
              {f === hoy ? " · hoy" : ""}
            </button>
          ))}
        </div>
      )}

      <div ref={raiz} className={s.grilla} style={{ ["--lab-columnas" as string]: dias.length }} data-dias={dias.length}>
        <div aria-hidden />
        {dias.map((f) => (
          <div key={f} className={s.grillaDia} data-hoy={f === hoy}>
            {diaCorto(f)}
            {f === hoy && <span className={s.grillaDiaHoy}>hoy</span>}
          </div>
        ))}

        <div className={s.horas} aria-hidden>
          {HORAS.map((h) => (
            <span key={h} className={s.hora} style={{ top: (h - HORA_INICIO) * px }}>
              {h < HORA_FIN ? `${String(h).padStart(2, "0")}:00` : ""}
            </span>
          ))}
        </div>

        {dias.map((f) => {
          const inicioDelDia = diasDesdeElLunes(f) * DIA;
          const delDia = (ini: number) => ini >= inicioDelDia && ini < inicioDelDia + DIA;
          const destino = !!lab.vistaPrevia && delDia(lab.vistaPrevia.ini);
          return (
            <div
              key={f}
              className={s.columna}
              data-columna={f}
              data-destino={destino}
              aria-label={diaMedio(f)}
              role="group"
              onDragOver={(e) => {
                if (!lab.arrastre || !editable) return;
                e.preventDefault();
                const ini = minutoDesdeEvento(e, f);
                if (Number.isFinite(ini)) lab.previsualizarArrastre(ini);
              }}
              onDrop={(e) => soltar(e, f)}
            >
              {f < hoy && <div className={s.pasado} style={{ height: "100%" }} aria-hidden />}
              {f === hoy && <div className={s.pasado} style={{ height: Math.max(0, top(p.ahora)) }} aria-hidden />}

              {lab.estado.ventanas.filter((v) => delDia(v.ini)).map((v) => (
                <div
                  key={v.id}
                  className={s.disponible}
                  data-disponible={v.id}
                  data-pasada={v.fin <= p.ahora}
                  style={{ top: top(v.ini), height: ((v.fin - v.ini) / 60) * px }}
                  aria-hidden
                >
                  {v.fin - v.ini >= 45 && <span className={s.disponibleTexto}>disponible</span>}
                </div>
              ))}

              {huellas.filter((h) => delDia(h.ini)).map((h) => (
                <div key={h.clave} className={s.huella} data-tipo={h.tipo} data-huella={h.tipo} style={{ top: top(h.ini), height: alto(h.ini, h.fin) }} aria-hidden>
                  {h.texto}
                </div>
              ))}

              {p.items.filter((it) => delDia(it.ini) && visible(it)).map((it) => (
                <Bloque key={it.clave} it={it} px={px} top={top(it.ini)} alto={alto(it.ini, it.fin)} editable={editable} />
              ))}

              {lab.vistaPrevia && delDia(lab.vistaPrevia.ini) && (
                <div
                  className={s.bloque}
                  data-previa="true"
                  data-valida={lab.vistaPrevia.valida}
                  data-vista-previa={lab.vistaPrevia.accionId}
                  style={{ top: top(lab.vistaPrevia.ini), height: alto(lab.vistaPrevia.ini, lab.vistaPrevia.fin) }}
                  aria-hidden
                >
                  <span className={s.bloqueTitulo}>{lab.vistaPrevia.texto}</span>
                  <span className={s.bloqueMeta}>
                    {horaDe(lab.vistaPrevia.ini)}–{horaDe(lab.vistaPrevia.fin)}
                  </span>
                </div>
              )}

              {f === hoy && (
                <div className={s.ahora} style={{ top: top(p.ahora) }} data-ahora>
                  <span>Ahora · {horaDe(p.ahora)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Bloque({ it, px, top, alto, editable }: { it: CalendarProjectionItem; px: number; top: number; alto: number; editable: boolean }) {
  const lab = useLab();
  const id = idDeSeleccion(it);
  const { texto, Icono } = etiquetaDeItem(it);
  const materia = MATERIAS[it.materia];
  const a = it.tipo === "PROPUESTA" ? accion(it.origen.id) : it.tipo === "COMPROMISO" || it.tipo === "FOCUS" ? accion(it.origen.accionId) : null;
  const futuro = it.ini >= lab.mostrada.ahora;
  const arrastrable =
    editable && futuro && (it.tipo === "PROPUESTA" || (it.tipo === "COMPROMISO" && it.estado === "CONFIRMADO"));
  const duracion = it.fin - it.ini;
  const rango = a && it.tipo !== "FOCUS" ? ` · probable ${duracion} min (${a.duracion.min}–${a.duracion.max})` : "";
  const cola = a && (it.tipo === "PROPUESTA" || it.tipo === "COMPROMISO") && a.duracion.max > duracion ? ((a.duracion.max - duracion) / 60) * px : 0;

  return (
    <>
      <button
        type="button"
        className={s.bloque}
        data-lab-clave={it.clave}
        data-tipo={it.tipo}
        data-estado={"estado" in it ? it.estado : undefined}
        data-ubicacion={it.tipo === "PROPUESTA" ? it.ubicacion : undefined}
        data-hipotetico={it.hipotetico}
        data-movilidad={it.movilidad}
        style={{ top, height: alto, ["--m" as string]: materia.color }}
        aria-pressed={lab.seleccion === id}
        aria-label={`${texto}: ${materia.nombre} · ${it.titulo}, ${diaMedio(fechaDe(it.ini))} ${horaDe(it.ini)}–${horaDe(it.fin)}${rango}. ${textoDeMovilidad(it)}`}
        draggable={arrastrable}
        onDragStart={(e) => {
          if (!arrastrable) return;
          e.dataTransfer?.setData("text/plain", id);
          const r = e.currentTarget.getBoundingClientRect();
          const desplazamiento = Math.max(0, Math.round((((e.clientY - r.top) / px) * 60) / 15) * 15);
          lab.empezarArrastre({ tipo: it.tipo === "COMPROMISO" ? "COMPROMISO" : "ACCION", id, desplazamiento, duracion });
        }}
        onDragEnd={() => {
          lab.empezarArrastre(null);
          lab.previsualizarArrastre(null);
        }}
        onClick={() => lab.seleccionar(id)}
      >
        <span className={s.bloqueLinea}>
          <Icono size={11} aria-hidden />
          <span className={s.bloqueTitulo}>{it.titulo}</span>
        </span>
        {alto >= 34 && (
          <span className={s.bloqueMeta}>
            {materia.corto} · {texto}
          </span>
        )}
        {alto >= 52 && (
          <span className={s.bloqueMeta}>
            {horaDe(it.ini)}–{horaDe(it.fin)}
            {a && it.tipo !== "FOCUS" ? ` · ${a.duracion.min}–${a.duracion.max} min` : ""}
          </span>
        )}
      </button>
      {cola > 0 && <span className={s.cola} style={{ top: top + alto, height: cola, ["--m" as string]: materia.color }} aria-hidden data-cola={it.clave} />}
    </>
  );
}
