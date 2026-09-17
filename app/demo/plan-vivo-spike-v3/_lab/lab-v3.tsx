"use client";

/**
 * 🧪 **LABORATORIO DESCARTABLE V3 — «Mi Plan vivo», calendario como plan.**
 *
 * No hay vista *Plan* separada: el calendario es la única representación temporal.
 * El Plan Engine del laboratorio (`motor.ts`) sigue proponiendo, priorizando,
 * detectando conflictos y simulando; el calendario es desde donde se lo mira y se lo
 * edita.
 *
 * Todo el estado vive en memoria y **se pierde al refrescar**: sin red, sin
 * almacenamiento, sin escritura. `?escenario=` elige el estado de arranque.
 *
 * Orden de tabulación: controles → Acciones por ubicar → calendario → inspector →
 * Gantt. La bandeja va antes que el calendario en el documento y la grilla la
 * dibuja debajo.
 */

import { CalendarDays, Clock3, FlaskConical, RotateCcw, Undo2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";

import { Bandeja } from "./bandeja";
import { Calendario } from "./calendario";
import { Contexto, type Arrastre, type Dialogo, type LabContexto, type VistaPrevia } from "./contexto";
import { Dialogos, type AccionesDeDialogo } from "./dialogos";
import { aplicarTodas, ESTADOS_DEMOSTRATIVOS, reducir, type AccionDelLab, type EstadoDemostrativo, type Intento, type Modo } from "./estado";
import { explicarPaso, resumirPaso } from "./explicacion";
import { AHORA_ADELANTADO, EVALUACIONES, MAXIMO_DE_PASOS } from "./fixture";
import { deArticulo, diaLargo, enHoras, fechaDe, horaDe, tramoMedio, ZONA_DEL_LAB } from "./formato";
import { Gantt, materiaDeSeleccion, type Zoom } from "./gantt";
import { Inspector } from "./inspector";
import { accion, alternativas, mundoDe, porQueNoSeSimula, validarCambioDeHorario, validarUbicacion } from "./motor";
import { mundoDelEscenario, proyectar, proyectarAnterior, type Plano } from "./proyeccion";
import s from "./lab.module.css";
import type { EstadoLab, MateriaId } from "./tipos";

function suscribirA(consulta: string) {
  return (cb: () => void) => {
    if (typeof window === "undefined" || !window.matchMedia) return () => {};
    const mq = window.matchMedia(consulta);
    mq.addEventListener?.("change", cb);
    return () => mq.removeEventListener?.("change", cb);
  };
}
const coincide = (consulta: string) => () => typeof window !== "undefined" && !!window.matchMedia?.(consulta).matches;
const MOVIL = "(max-width: 700px)";
const PANEL = "(max-width: 1180px)";
const REDUCIDO = "(prefers-reduced-motion: reduce)";
const suscribirMovil = suscribirA(MOVIL);
const suscribirPanel = suscribirA(PANEL);
const suscribirReducido = suscribirA(REDUCIDO);
const esMovilAhora = coincide(MOVIL);
const esPanelAhora = coincide(PANEL);
const esReducidoAhora = coincide(REDUCIDO);
const nunca = () => false;

/** Qué pasa con un intento de ubicar o mover: se aplica, avisa o se bloquea. */
export function evaluarIntento(estado: EstadoLab, intento: Intento): { dialogo: Dialogo | null; aplicar: AccionDelLab | null } {
  const m = mundoDe(estado);
  if (intento.tipo === "UBICAR") {
    const v = validarUbicacion(m, intento.id, intento.ini, intento.duracion);
    if (v.duros.length > 0) return { dialogo: { tipo: "CONFLICTO", intento, motivos: v.duros, alternativas: alternativas(m, intento.id, intento.duracion) }, aplicar: null };
    if (v.blandos.length > 0) return { dialogo: { tipo: "ADVERTENCIA", intento, advertencias: v.blandos }, aplicar: null };
    return { dialogo: null, aplicar: { tipo: "UBICAR", id: intento.id, ini: intento.ini, duracion: intento.duracion } };
  }
  const v = validarCambioDeHorario(m, intento.compromisoId, intento.ini);
  if (v.duros.length > 0) return { dialogo: { tipo: "CONFLICTO", intento, motivos: v.duros, alternativas: [] }, aplicar: null };
  return { dialogo: { tipo: "RENEGOCIAR", compromisoId: intento.compromisoId, ini: intento.ini, advertencias: v.blandos }, aplicar: null };
}

function dialogoInicial(demo: EstadoDemostrativo, estado: EstadoLab): Dialogo | null {
  if (demo.dialogo === "DISPONIBILIDAD") return { tipo: "DISPONIBILIDAD", conCincoHoras: true };
  if (demo.dialogo === "REORGANIZAR") return { tipo: "REORGANIZAR" };
  return demo.intento ? evaluarIntento(estado, demo.intento).dialogo : null;
}

export function LabPlanVivoV3({ escenario: param }: { escenario: string | null }) {
  const demo = ESTADOS_DEMOSTRATIVOS[param ?? "base"] ?? ESTADOS_DEMOSTRATIVOS.base;
  const [inicial] = useState(() => aplicarTodas(demo.acciones));
  const [estado, despacharBase] = useReducer(reducir, inicial);
  const [plano, setPlano] = useState<Plano>(demo.plano);
  const [modo, setModo] = useState<Modo>(demo.modo);
  const [seleccion, setSeleccion] = useState<string | null>(demo.seleccion);
  const [dialogo, setDialogo] = useState<Dialogo | null>(() => dialogoInicial(demo, inicial));
  const [anuncio, setAnuncio] = useState("");
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [arrastreIni, setArrastreIni] = useState<number | null>(null);
  const [diaMovil, setDiaMovil] = useState(fechaDe(inicial.ahora));
  const [zoom, setZoom] = useState<Zoom>("SEMANA");
  const [materiaGantt, setMateriaGantt] = useState<MateriaId>(() => {
    const a = demo.seleccion ? accion(demo.seleccion) : null;
    return a?.materia ?? "ANALISIS";
  });
  const esMovil = useSyncExternalStore(suscribirMovil, esMovilAhora, nunca);
  const esPanel = useSyncExternalStore(suscribirPanel, esPanelAhora, nunca);
  const movimientoReducido = useSyncExternalStore(suscribirReducido, esReducidoAhora, nunca);
  const tituloDelInspector = useRef<HTMLHeadingElement>(null);

  const real = useMemo(() => proyectar(estado, "REAL"), [estado]);
  const escenario = useMemo(() => proyectar(estado, "ESCENARIO"), [estado]);
  const anterior = useMemo(() => proyectarAnterior(estado), [estado]);
  const mostrada = plano === "ESCENARIO" ? escenario : real;

  const despachar = useCallback((a: AccionDelLab, texto: string) => {
    despacharBase(a);
    setAnuncio(texto);
  }, []);

  const seleccionar = useCallback(
    (id: string | null) => {
      setSeleccion(id);
      const materia = materiaDeSeleccion(id, mostrada);
      if (materia) setMateriaGantt(materia);
      if (id && esPanel) requestAnimationFrame(() => tituloDelInspector.current?.focus());
    },
    [mostrada, esPanel],
  );

  const intentar = useCallback(
    (intento: Intento) => {
      const r = evaluarIntento(estado, intento);
      if (r.aplicar && r.aplicar.tipo === "UBICAR") {
        const a = accion(r.aplicar.id)!;
        despachar(r.aplicar, `Ubicaste ${a.titulo} el ${tramoMedio(r.aplicar.ini, r.aplicar.ini + r.aplicar.duracion)}. Sigue siendo una propuesta: no es un compromiso ni registra progreso.`);
        setDialogo(null);
        setSeleccion(a.id);
        return;
      }
      if (r.dialogo?.tipo === "CONFLICTO") setAnuncio(`No puede quedarse acá: ${r.dialogo.motivos[0].texto}`);
      if (r.dialogo?.tipo === "ADVERTENCIA") setAnuncio(`Advertencia: ${r.dialogo.advertencias[0].texto}`);
      setDialogo(r.dialogo);
    },
    [estado, despachar],
  );

  const pedirSimular = useCallback(
    (id: string) => {
      const a = accion(id)!;
      const { mundo } = mundoDelEscenario(estado);
      const motivo = estado.pasos.length >= MAXIMO_DE_PASOS ? ({ tipo: "MAXIMO" } as const) : porQueNoSeSimula(mundo, id);
      if (motivo?.tipo === "PRERREQUISITO") {
        setDialogo({ tipo: "PRERREQUISITO", accionId: id, faltan: motivo.faltan });
        return;
      }
      if (motivo) {
        const texto = {
          MAXIMO: `El escenario ya tiene ${MAXIMO_DE_PASOS} pasos: es el límite del laboratorio. Deshacé uno o reiniciá el escenario.`,
          YA_SIMULADA: `${a.titulo} ya está simulada en el escenario.`,
          RETIRADA: `${a.titulo} ya no hace falta en el escenario.`,
          NO_PENDIENTE: `${a.titulo} no está pendiente.`,
          SIN_LUGAR: `${a.titulo} no tiene un horario donde entre completa: ubicala primero o reajustá la disponibilidad.`,
        }[motivo.tipo];
        setAnuncio(texto);
        setDialogo({ tipo: "AVISO", titulo: "No se puede simular", texto });
        return;
      }
      despacharBase({ tipo: "SIMULAR", id });
      setPlano("ESCENARIO");
      setSeleccion(id);
      setMateriaGantt(a.materia);
      setAnuncio(`Paso ${estado.pasos.length + 1} del escenario: ${a.titulo} simulada. Esto es una simulación. No modifica tu plan real.`);
    },
    [estado],
  );

  const vistaPrevia: VistaPrevia | null = useMemo(() => {
    const m = mundoDe(estado);
    if (arrastre && arrastreIni !== null) {
      if (arrastre.tipo === "ACCION") {
        const valida = validarUbicacion(m, arrastre.id, arrastreIni, arrastre.duracion).duros.length === 0;
        return { clave: "arrastre", accionId: arrastre.id, ini: arrastreIni, fin: arrastreIni + arrastre.duracion, valida, texto: valida ? "Soltar acá" : "No puede quedarse acá" };
      }
      const c = estado.compromisos.find((x) => x.id === arrastre.id)!;
      const valida = validarCambioDeHorario(m, c.id, arrastreIni).duros.length === 0;
      return { clave: "arrastre", accionId: c.accionId, ini: arrastreIni, fin: arrastreIni + (c.fin - c.ini), valida, texto: valida ? "Soltar para revisar el cambio" : "No puede quedarse acá" };
    }
    if (dialogo?.tipo === "ADVERTENCIA") return { clave: "aviso", accionId: dialogo.intento.id, ini: dialogo.intento.ini, fin: dialogo.intento.ini + dialogo.intento.duracion, valida: true, texto: "Vista previa · sin ubicar" };
    if (dialogo?.tipo === "RENEGOCIAR") {
      const c = estado.compromisos.find((x) => x.id === dialogo.compromisoId)!;
      return { clave: "renegociar", accionId: c.accionId, ini: dialogo.ini, fin: dialogo.ini + (c.fin - c.ini), valida: true, texto: "Horario nuevo · sin confirmar" };
    }
    if (dialogo?.tipo === "CONFLICTO") {
      const i = dialogo.intento;
      if (i.tipo === "UBICAR") return { clave: "conflicto", accionId: i.id, ini: i.ini, fin: i.ini + i.duracion, valida: false, texto: "No puede quedarse acá" };
      const c = estado.compromisos.find((x) => x.id === i.compromisoId)!;
      return { clave: "conflicto", accionId: c.accionId, ini: i.ini, fin: i.ini + (c.fin - c.ini), valida: false, texto: "No puede quedarse acá" };
    }
    return null;
  }, [arrastre, arrastreIni, dialogo, estado]);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector("[data-dialogo]")) return;
      setArrastre(null);
      setArrastreIni(null);
      if (esPanel) setSeleccion(null);
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [esPanel]);

  const contexto: LabContexto = {
    estado,
    real,
    mostrada,
    anterior: plano === "ESCENARIO" ? anterior : null,
    plano,
    modo,
    seleccion,
    esMovil,
    diaMovil,
    vistaPrevia,
    arrastre,
    movimientoReducido,
    seleccionar,
    cambiarDiaMovil: setDiaMovil,
    intentar,
    aceptarSugerida: (id) => {
      const p = real.posiciones[id];
      if (p?.tipo === "SUGERIDA") intentar({ tipo: "UBICAR", id, ini: p.ini, duracion: p.fin - p.ini });
    },
    abrir: setDialogo,
    devolver: (id) => despachar({ tipo: "DEVOLVER", id }, `${accion(id)!.titulo} volvió a Acciones por ubicar.`),
    pedirSimular,
    empezarArrastre: setArrastre,
    previsualizarArrastre: setArrastreIni,
  };

  const accionesDeDialogo: AccionesDeDialogo = {
    cerrar: () => setDialogo(null),
    intentarUbicar: (id, ini, duracion) => intentar({ tipo: "UBICAR", id, ini, duracion }),
    intentarMover: (compromisoId, ini) => intentar({ tipo: "MOVER", compromisoId, ini }),
    aplicar: (a, texto) => {
      despachar(a, texto);
      setDialogo(null);
      if (a.tipo === "UBICAR") setSeleccion(a.id);
      if (a.tipo === "COMPROMETER") setSeleccion(`COM-LOCAL-${a.id}`);
    },
    pedirSimular,
    seleccionar,
  };

  const t = mostrada.totales;
  const incumplidosConTrabajo = estado.relojAdelantado && estado.compromisos.some((c) => c.estado === "INCUMPLIDO" && real.pendientes.includes(c.accionId));
  const diferencia = (actual: number, delReal: number) =>
    plano === "ESCENARIO" && actual !== delReal ? <span className={s.lecturaReal}>plan real {enHoras(delReal)}</span> : null;

  return (
    <Contexto.Provider value={contexto}>
      <div className={s.pagina} data-plano={plano} data-modo={modo} data-movimiento={movimientoReducido ? "reducido" : "normal"} data-lab-v3>
        <div className={s.ribete}>
          <span className={s.ribeteMarca}>
            <FlaskConical size={13} aria-hidden /> Laboratorio V3 · datos de demostración
          </span>
          <span>Nada se guarda ni se envía.</span>
          {param && ESTADOS_DEMOSTRATIVOS[param] && <span data-demo={param}>Escenario de demostración: {demo.descripcion}</span>}
          <span>
            Reloj del laboratorio: {diaLargo(fechaDe(estado.ahora))}, {horaDe(estado.ahora)} · {ZONA_DEL_LAB}
          </span>
          <a className={s.saltar} href="#lab3-inspector">
            Saltar al inspector
          </a>
        </div>

        <header className={s.encabezado}>
          <div>
            <h1 className={s.titulo}>Tu semana</h1>
            <p className={s.bajada}>
              <CalendarDays size={13} aria-hidden /> Semana del 14 al 20 de septiembre · {plano === "ESCENARIO" ? "escenario hipotético" : "plan real"}
            </p>
          </div>
          <dl className={s.lectura} data-lectura>
            <div data-lectura-dato="pendiente">
              <dt>Trabajo pendiente</dt>
              <dd>{enHoras(t.pendiente)}</dd>
              {diferencia(t.pendiente, real.totales.pendiente)}
            </div>
            <div data-lectura-dato="disponible">
              <dt>Tiempo disponible</dt>
              <dd>{enHoras(t.capacidad)}</dd>
              <span className={s.lecturaReal}>{enHoras(t.libre)} sin usar</span>
            </div>
            <div data-lectura-dato="sin-ubicar">
              <dt>Sin ubicar</dt>
              <dd>{enHoras(t.sinUbicar)}</dd>
              {diferencia(t.sinUbicar, real.totales.sinUbicar)}
            </div>
            {mostrada.margenes.map((m) => (
              <div key={m.evaluacionId} data-lectura-dato={`margen-${m.evaluacionId}`}>
                <dt>Margen antes {deArticulo(EVALUACIONES.find((e) => e.id === m.evaluacionId)!.corto)}</dt>
                <dd className={m.minutos < 0 ? s.negativo : undefined}>{enHoras(m.minutos)}</dd>
                {diferencia(m.minutos, real.margenes.find((x) => x.evaluacionId === m.evaluacionId)?.minutos ?? m.minutos)}
              </div>
            ))}
          </dl>
        </header>

        <div className={s.barra} role="toolbar" aria-label="Controles del calendario">
          <div className={s.segmentado} role="group" aria-label="Qué se muestra">
            <button type="button" className={s.segmento} aria-pressed={plano === "REAL"} onClick={() => setPlano("REAL")} data-plano-boton="REAL">
              Plan real
            </button>
            <button type="button" className={s.segmento} aria-pressed={plano === "ESCENARIO"} onClick={() => setPlano("ESCENARIO")} data-plano-boton="ESCENARIO">
              Escenario
            </button>
          </div>
          <div className={s.segmentado} role="group" aria-label="Cómo se muestran los cambios">
            <button type="button" className={s.segmento} aria-pressed={modo === "LIMPIO"} onClick={() => setModo("LIMPIO")} data-modo-boton="LIMPIO">
              Modo limpio
            </button>
            <button type="button" className={s.segmento} aria-pressed={modo === "EXPLICAR"} onClick={() => setModo("EXPLICAR")} data-modo-boton="EXPLICAR">
              Explicar movimientos
            </button>
          </div>
          <button type="button" className={s.boton} onClick={() => setDialogo({ tipo: "DISPONIBILIDAD", conCincoHoras: false })} disabled={plano !== "REAL"}>
            Reajustar disponibilidad
          </button>
          <span className={s.empuje} />
          {incumplidosConTrabajo && plano === "REAL" && (
            <button type="button" className={s.botonPrimario} onClick={() => setDialogo({ tipo: "REORGANIZAR" })} data-reorganizar-boton>
              Reorganizar sin cortar
            </button>
          )}
          {!estado.relojAdelantado && (
            <button
              type="button"
              className={s.boton}
              onClick={() => {
                despachar({ tipo: "ADELANTAR_RELOJ", fecha: AHORA_ADELANTADO.fecha, hora: AHORA_ADELANTADO.hora }, `El reloj del laboratorio pasó a jueves ${AHORA_ADELANTADO.hora}. Los compromisos que no empezaron quedaron incumplidos, en su horario.`);
                setPlano("REAL");
                setDiaMovil(AHORA_ADELANTADO.fecha);
              }}
              data-adelantar-reloj
            >
              <Clock3 size={14} aria-hidden /> Adelantar el reloj a jueves {AHORA_ADELANTADO.hora}
            </button>
          )}
        </div>

        {(plano === "ESCENARIO" || estado.pasos.length > 0) && (
          <section className={s.escenario} aria-label="Escenario simulado" data-escenario>
            <span className={s.escenarioMarca}>
              <FlaskConical size={14} aria-hidden /> Escenario simulado
            </span>
            <span className={s.textoSuave}>Esto es una simulación. No modifica tu plan real.</span>
            {escenario.pasos.length > 0 ? (
              <ol className={s.escenarioPasos} aria-label="Pasos del escenario">
                {escenario.pasos.map((p) => (
                  <li key={p.numero} data-paso={p.accionId}>
                    {p.numero}. {accion(p.accionId)!.corto}
                    {p.bloqueo ? " · sin lugar ahora" : ""}
                  </li>
                ))}
              </ol>
            ) : (
              <span className={s.textoSuave}>Seleccioná una acción y tocá «Simular impacto». Cada paso parte del anterior.</span>
            )}
            <span className={s.textoSuave} data-contador-pasos>
              {estado.pasos.length} de {MAXIMO_DE_PASOS}
            </span>
            <span className={s.empuje} />
            <button type="button" className={s.boton} disabled={estado.pasos.length === 0} onClick={() => despachar({ tipo: "DESHACER_PASO" }, "Se deshizo el último paso del escenario.")}>
              <Undo2 size={14} aria-hidden /> Deshacer último paso
            </button>
            <button type="button" className={s.boton} disabled={estado.pasos.length === 0} onClick={() => despachar({ tipo: "REINICIAR_ESCENARIO" }, "Escenario reiniciado: es igual a tu plan real.")}>
              <RotateCcw size={14} aria-hidden /> Reiniciar escenario
            </button>
            {plano === "ESCENARIO" ? (
              <button type="button" className={s.botonTexto} onClick={() => setPlano("REAL")}>
                Volver al plan real
              </button>
            ) : (
              <button type="button" className={s.botonTexto} onClick={() => setPlano("ESCENARIO")}>
                Ver el escenario
              </button>
            )}
            {plano === "ESCENARIO" && anterior && estado.pasos.length > 0 && modo === "LIMPIO" && (
              <p className={s.cambio} data-resumen-limpio>
                {resumirPaso(anterior, escenario, estado.pasos[estado.pasos.length - 1])}
              </p>
            )}
            {plano === "ESCENARIO" && anterior && estado.pasos.length > 0 && modo === "EXPLICAR" && (
              <ol className={s.lineas} key={estado.pasos.join("|")} data-explicacion>
                {explicarPaso(anterior, escenario, estado.pasos[estado.pasos.length - 1]).map((l) => (
                  <li key={l.texto} data-linea={l.tipo}>
                    {l.texto}
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        <p className={s.soloLectores} aria-live="polite" data-anuncio>
          {anuncio}
        </p>

        <div className={s.cuerpo}>
          <div className={s.areaBandeja}>
            <Bandeja />
          </div>
          <div className={s.areaCalendario}>
            <Calendario />
          </div>
          <div className={s.areaInspector} data-abierto={seleccion !== null}>
            <Inspector ref={tituloDelInspector} />
          </div>
        </div>

        <Gantt
          materia={materiaGantt}
          cambiarMateria={setMateriaGantt}
          zoom={zoom}
          cambiarZoom={setZoom}
        />

        <details className={s.bitacora} data-bitacora>
          <summary>Bitácora del laboratorio ({estado.bitacora.length})</summary>
          {estado.bitacora.length === 0 ? (
            <p className={s.textoSuave}>Todavía no cambiaste nada en este laboratorio.</p>
          ) : (
            <ol className={s.lista}>
              {estado.bitacora.map((b) => (
                <li key={b.id}>
                  {horaDe(b.cuando)} · {b.texto}
                </li>
              ))}
            </ol>
          )}
        </details>

        {dialogo && <Dialogos dialogo={dialogo} acciones={accionesDeDialogo} />}
      </div>
    </Contexto.Provider>
  );
}

