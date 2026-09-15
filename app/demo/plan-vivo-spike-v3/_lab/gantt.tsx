"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE V3 — *Impacto académico*: el Gantt de la materia.
 *
 * **Replica el Gantt de `UX02`** (`components/screens/materia-cursado.tsx`, ADR-085),
 * sin importarlo: columna *Tema*, eje de fechas con la línea de hoy, una fila por
 * unidad en el orden dictado y columna *Estado* en palabras. Sus reglas se conservan:
 *
 * - La **ventana** va de la primera clase dictada a la evaluación que cubre el tema.
 *   **Sin evaluación no hay barra**, y la fila dice por qué.
 * - Un solo color por materia: identidad, nunca calificación.
 * - El estado describe **actividad** —recorrido registrado, evidencia suficiente—,
 *   nunca dominio.
 *
 * Lo que el laboratorio agrega encima de esa ventana:
 *
 * - **Lo que falta**: una barra desde el primer bloque pendiente del tema hasta el
 *   último, según la propuesta del motor **sin decisiones de agenda**: ubicar o
 *   comprometerse no la mueve; simular, retirar trabajo o registrar progreso sí.
 * - **Margen**: del fin de lo que falta hasta la evaluación.
 * - **Dos capas** en el escenario: la del plan real, punteada, y la del escenario,
 *   rayada. El Gantt **sólo cambia** con una simulación completa o con progreso
 *   registrado: ubicar o comprometerse no lo mueve.
 */

import { Check } from "lucide-react";

import { useLab } from "./contexto";
import { explicarPaso } from "./explicacion";
import { EVALUACIONES, MATERIAS, ORDEN_DE_MATERIAS, TEMAS } from "./fixture";
import { DIA, deArticulo, diaCorto, diasDesdeElLunes, enHoras, fechaDe, horaDe } from "./formato";
import { accion, porQueNoSeSimula, simularPaso } from "./motor";
import { mundoDelEscenario, proyectarMundo } from "./proyeccion";
import s from "./lab.module.css";
import type { GanttTema, MateriaId, Proyeccion } from "./tipos";

const momento = (m: number) => `${diaCorto(fechaDe(m))} ${horaDe(m)}`;

export type Zoom = "SEMANA" | "PERIODO";

export function ejeDe(zoom: Zoom, ahora: number, materia: MateriaId): { desde: number; hasta: number; marcas: { etiqueta: string; en: number; esHoy: boolean }[] } {
  const hoy = Math.floor(ahora / DIA) * DIA;
  if (zoom === "SEMANA") {
    return {
      desde: 0,
      hasta: 7 * DIA,
      marcas: Array.from({ length: 7 }, (_, i) => ({ etiqueta: diaCorto(fechaDe(i * DIA)), en: i * DIA + DIA / 2, esHoy: i * DIA === hoy })),
    };
  }
  // El eje del período de Materia: dos semanas atrás y tres adelante, estirado si una evaluación cae más lejos.
  const desde = hoy - 14 * DIA;
  const ultima = Math.max(hoy + 21 * DIA, ...EVALUACIONES.filter((e) => e.materia === materia).map((e) => diasDesdeElLunes(e.tramo.fecha) * DIA));
  const semanas = Math.ceil((ultima - desde) / (7 * DIA));
  const hasta = desde + semanas * 7 * DIA;
  const marcas = Array.from({ length: semanas + 1 }, (_, i) => {
    const n = i - 2;
    return { etiqueta: n === 0 ? "hoy" : n < 0 ? `−${-n} sem` : `+${n} sem`, en: hoy + n * 7 * DIA, esHoy: n === 0 };
  }).filter((m) => m.en <= hasta);
  return { desde, hasta, marcas };
}

export function materiaDeSeleccion(id: string | null, p: Proyeccion): MateriaId | null {
  if (!id) return null;
  const a = accion(id);
  if (a) return a.materia;
  const it = p.items.find((x) => x.origen.kind !== "SIMULACION" && x.origen.id === id);
  return it?.materia ?? null;
}

function temasResaltados(id: string | null, p: Proyeccion): string[] {
  if (!id) return [];
  const a = accion(id);
  if (a) return [a.tema];
  const it = p.items.find((x) => x.origen.kind !== "SIMULACION" && x.origen.id === id);
  if (!it) return [];
  if (it.tipo === "COMPROMISO" || it.tipo === "FOCUS") return [accion(it.origen.accionId)!.tema];
  if (it.tipo === "EVALUACION") return [...EVALUACIONES.find((e) => e.id === id)!.alcance];
  return TEMAS.filter((t) => t.materia === it.materia && (it.titulo.includes(t.nombre) || it.titulo.includes(t.nombre.split(" ")[0]))).map((t) => t.id);
}

export function Gantt({ materia, cambiarMateria, zoom, cambiarZoom }: { materia: MateriaId; cambiarMateria: (m: MateriaId) => void; zoom: Zoom; cambiarZoom: (z: Zoom) => void }) {
  const lab = useLab();
  const p = lab.mostrada;
  const escenario = lab.plano === "ESCENARIO";
  const g = p.gantt[materia];
  const real = lab.real.gantt[materia];
  const anterior = lab.anterior?.gantt[materia] ?? null;
  const eje = ejeDe(zoom, p.ahora, materia);
  const x = (min: number) => Math.min(1, Math.max(0, (min - eje.desde) / (eje.hasta - eje.desde)));
  const pct = (f: number) => `${(f * 100).toFixed(3)}%`;
  const resaltados = temasResaltados(lab.seleccion, p);
  const preview = vistaDeSimulacion(lab);
  const margenes = p.margenes.filter((m) => EVALUACIONES.find((e) => e.id === m.evaluacionId)!.materia === materia);

  return (
    <section className={`${s.tarjeta} ${s.impacto}`} aria-labelledby="lab3-impacto-titulo" data-impacto data-gantt-materia={materia} style={{ ["--m" as string]: MATERIAS[materia].color }}>
      <div>
        <h2 id="lab3-impacto-titulo" className={s.seccionTitulo}>
          Impacto académico
        </h2>
        <p className={s.textoSuave}>
          El Gantt de la materia, como en Materia: una fila por tema, de la primera clase a la evaluación. Encima, cuándo terminaría lo que falta según la propuesta de Achieve.
        </p>
      </div>

      <div className={s.impactoControles}>
        <div className={s.segmentado} role="group" aria-label="Materia del Gantt">
          {ORDEN_DE_MATERIAS.map((m) => (
            <button key={m} type="button" className={s.segmento} aria-pressed={m === materia} onClick={() => cambiarMateria(m)} data-materia-gantt={m}>
              {MATERIAS[m].corto}
            </button>
          ))}
        </div>
        <div className={s.segmentado} role="group" aria-label="Eje del Gantt">
          <button type="button" className={s.segmento} aria-pressed={zoom === "SEMANA"} onClick={() => cambiarZoom("SEMANA")}>
            Esta semana
          </button>
          <button type="button" className={s.segmento} aria-pressed={zoom === "PERIODO"} onClick={() => cambiarZoom("PERIODO")}>
            Período
          </button>
        </div>
        <span className={s.textoSuave}>{escenario ? "Escenario rayado sobre el plan real punteado" : "Plan real"}</span>
      </div>

      {preview && preview.materia === materia && (
        <div className={`${s.recuadro} ${s.recuadroEscenario}`} aria-live="polite" data-gantt-si-simulas>
          <strong>{preview.titulo}</strong>
          {preview.lineas.length > 0 && (
            <ul className={s.lista}>
              {preview.lineas.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          )}
          <span>El Gantt todavía no cambia: cambia al simular o cuando se registra progreso.</span>
        </div>
      )}

      <div className={s.ganttScroll}>
        <div className={s.gantt} data-gantt data-capa={escenario ? "escenario" : "real"}>
          <div className={s.ganttEje}>
            <span className={s.ganttTema}>Tema</span>
            <div className={s.ganttMarcas}>
              {eje.marcas.map((m) => (
                <span key={m.etiqueta} className={s.ganttMarca} data-hoy={m.esHoy} style={{ left: pct(x(m.en)) }}>
                  {m.etiqueta}
                </span>
              ))}
            </div>
            <span className={s.ganttEstado}>Estado</span>
          </div>

          {g.temas.map((t) => (
            <Fila
              key={t.id}
              t={t}
              real={real.temas.find((r) => r.id === t.id)!}
              antes={lab.modo === "EXPLICAR" && escenario ? (anterior?.temas.find((r) => r.id === t.id) ?? null) : null}
              escenario={escenario}
              x={x}
              pct={pct}
              hoy={x(p.ahora)}
              resaltada={resaltados.includes(t.id)}
            />
          ))}
        </div>
      </div>

      <ul className={s.ganttLeyenda}>
        <li>
          <span className={s.muestra} style={{ opacity: 0.2 }} aria-hidden /> Ventana: primera clase → evaluación
        </li>
        <li>
          <span className={s.muestra} aria-hidden /> Lo que falta, según la propuesta de Achieve (no cambia al ubicar ni al comprometerte)
        </li>
        {escenario && (
          <li>
            <span className={s.muestra} style={{ background: "repeating-linear-gradient(135deg, var(--m) 0 4px, transparent 4px 8px)" }} aria-hidden /> Escenario · punteado: plan real
          </li>
        )}
        <li>
          <span className={s.muestra} style={{ background: "repeating-linear-gradient(90deg, var(--exito-texto) 0 3px, transparent 3px 6px)", height: 4 }} aria-hidden /> Margen hasta la evaluación
        </li>
        <li>
          <Check size={11} aria-hidden /> Última actividad constatada o simulada
        </li>
      </ul>

      {margenes.length > 0 && (
        <p className={s.textoSuave} data-gantt-margen>
          {margenes
            .map((m) => {
              const r = lab.real.margenes.find((y) => y.evaluacionId === m.evaluacionId)!;
              const nombre = EVALUACIONES.find((e) => e.id === m.evaluacionId)!.corto;
              return escenario && r.minutos !== m.minutos
                ? `Margen antes ${deArticulo(nombre)}: plan real ${enHoras(r.minutos)} · escenario ${enHoras(m.minutos)}.`
                : `Margen antes ${deArticulo(nombre)}: ${enHoras(m.minutos)}.`;
            })
            .join(" ")}
        </p>
      )}
      <p className={s.textoSuave}>Recorrido registrado y evidencia suficiente describen actividad. Dominio todavía no evaluado.</p>
    </section>
  );
}

function Fila({
  t,
  real,
  antes,
  escenario,
  x,
  pct,
  hoy,
  resaltada,
}: {
  t: GanttTema;
  real: GanttTema;
  antes: GanttTema | null;
  escenario: boolean;
  x: (m: number) => number;
  pct: (f: number) => string;
  hoy: number;
  resaltada: boolean;
}) {
  const ventana = t.ventanaFin !== null ? { ini: x(t.ventanaIni ?? Number.NEGATIVE_INFINITY), fin: x(t.ventanaFin) } : null;
  const barra = (i: { ini: number; fin: number }) => ({ left: pct(x(i.ini)), width: pct(Math.max(0, x(i.fin) - x(i.ini))) });
  const falta = t.trabajo ? `Lo que falta va del ${momento(t.trabajo.ini)} al ${momento(t.trabajo.fin)}.` : t.sinLugar ? "Lo que falta no entra antes de la evaluación." : "No falta nada del tema en el calendario.";
  const cambio = escenario && (real.trabajo?.fin !== t.trabajo?.fin || real.etiqueta !== t.etiqueta);

  return (
    <div className={s.ganttFila} data-gantt-tema={t.id} data-resaltada={resaltada} data-trabajo-fin={t.trabajo?.fin ?? ""} data-etiqueta={t.etiqueta}>
      <span className={s.ganttTema}>
        <span className={s.ganttCodigo}>{t.codigo}</span>
        {t.nombre}
        {t.nota && <span className={s.ganttNotaFila}>{t.nota}</span>}
        {t.dependencia && (
          <span className={s.ganttNotaFila} data-dependencia={t.dependencia.estado}>
            {t.dependencia.estado === "ESPERA" ? `Espera ${t.dependencia.de}` : `Desbloqueada: ${t.dependencia.de} ${escenario ? "simulada" : "hecha"}`}
          </span>
        )}
      </span>

      <div className={s.ganttCarril} role="img" aria-label={`${t.codigo} ${t.nombre}. ${t.etiqueta}. ${t.nota ?? falta}${cambio ? " Cambia en el escenario." : ""}`}>
        <div className={s.ganttHoy} style={{ left: pct(hoy) }} aria-hidden />
        {ventana && <div className={s.ganttVentana} data-ventana data-inicio-desconocido={t.ventanaIni === null} style={{ left: pct(ventana.ini), width: pct(Math.max(0.004, ventana.fin - ventana.ini)) }} />}
        {t.ventanaFin !== null && x(t.ventanaFin) > 0 && x(t.ventanaFin) < 1 && <div className={s.ganttEvaluacion} style={{ left: pct(x(t.ventanaFin)) }} data-evaluacion-marca />}
        {t.clases
          .filter((c) => x(c.ini) > 0 && x(c.ini) < 1)
          .map((c) => (
            <span key={c.ini} className={s.ganttClase} data-dada={c.dada} style={{ left: pct(x(c.ini)) }} title={c.dada ? "Clase dada" : "Clase próxima"} />
          ))}
        {t.trabajo && t.ventanaFin !== null && t.trabajo.fin < t.ventanaFin && (
          <div className={s.ganttMargen} data-margen style={{ left: pct(x(t.trabajo.fin)), width: pct(Math.max(0, x(t.ventanaFin) - x(t.trabajo.fin))) }} />
        )}
        {antes?.trabajo && (antes.trabajo.fin !== t.trabajo?.fin || antes.trabajo.ini !== t.trabajo?.ini) && (
          <div className={s.ganttTrabajo} data-capa="real" data-comparando="true" data-antes style={barra(antes.trabajo)} title="Antes de este paso" />
        )}
        {escenario && !antes && real.trabajo && (real.trabajo.fin !== t.trabajo?.fin || real.trabajo.ini !== t.trabajo?.ini) && (
          <div className={s.ganttTrabajo} data-capa="real" data-comparando="true" data-capa-real style={barra(real.trabajo)} title="Plan real" />
        )}
        {t.trabajo && <div className={s.ganttTrabajo} data-capa={escenario ? "escenario" : "real"} data-trabajo style={barra(t.trabajo)} />}
        {t.ultimaHecha !== null && x(t.ultimaHecha) > 0 && (
          <span className={s.ganttHecho} style={{ left: pct(x(t.ultimaHecha)) }} data-hecho aria-hidden>
            <Check size={9} />
          </span>
        )}
      </div>

      <span className={s.ganttEstado}>
        <span data-estado-tema>{t.etiqueta}</span>
        {t.piezas.length > 0 && (
          <span className={s.piezas} aria-hidden>
            {t.piezas.map((pz) => (
              <span key={pz.id} className={s.pieza} data-estado={pz.estado} />
            ))}
          </span>
        )}
        {cambio && <span>Plan real: {real.etiqueta}</span>}
      </span>
    </div>
  );
}

/** *Si lo simulás*: texto, sin mover barras. Sale de proyectar el paso sin aplicarlo. */
function vistaDeSimulacion(lab: ReturnType<typeof useLab>): { materia: MateriaId; titulo: string; lineas: string[] } | null {
  const a = lab.seleccion ? accion(lab.seleccion) : null;
  if (!a || lab.mostrada.simuladas.includes(a.id) || lab.mostrada.retiradas.includes(a.id)) return null;
  const base = lab.plano === "ESCENARIO" ? mundoDelEscenario(lab.estado).mundo : mundoDelEscenario(lab.estado, 0).mundo;
  const motivo = porQueNoSeSimula(base, a.id);
  if (motivo) {
    const texto =
      motivo.tipo === "PRERREQUISITO"
        ? `Para simularla, primero simulá ${motivo.faltan.map((r) => accion(r)!.corto).join(" y ")}.`
        : motivo.tipo === "MAXIMO"
          ? "El escenario ya tiene cinco pasos."
          : "No tiene un horario donde entre completa.";
    return { materia: a.materia, titulo: `Si simulás ${a.corto}: ${texto}`, lineas: [] };
  }
  const despues = simularPaso(base, a.id);
  const s0 = despues.simuladas[despues.simuladas.length - 1];
  const antes = proyectarMundo(base, lab.plano, lab.mostrada.pasos);
  const hipotetica = proyectarMundo(despues, "ESCENARIO", [...lab.mostrada.pasos, { numero: lab.mostrada.pasos.length + 1, accionId: a.id, ini: s0.ini, fin: s0.fin, bloqueo: null }]);
  return {
    materia: a.materia,
    titulo: `Si simulás ${a.corto}:`,
    lineas: explicarPaso(antes, hipotetica, a.id)
      .filter((l) => l.tipo !== "SIMULADA")
      .map((l) => l.texto.replace("Antes estaba acá: ", "Hoy está: ").replace("El Gantt académico avanza hasta este punto", "El Gantt avanzaría")),
  };
}
