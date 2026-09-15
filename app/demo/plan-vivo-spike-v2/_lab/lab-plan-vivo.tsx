"use client";

/**
 * 🧪 **LABORATORIO DESCARTABLE — «Mi Plan vivo» V2.** La pantalla completa.
 *
 * Todo el estado vive en memoria y **se pierde al refrescar**: sin red, sin
 * `localStorage`, sin escritura. `?escenario=` sólo elige el estado demostrativo
 * de arranque; la URL no se actualiza al interactuar.
 *
 * ## Tres acciones que no se mezclan
 *
 * - **Hover o foco** sobre *Simular este workitem* (o una estación del camino):
 *   vista previa sobre el escenario actual. No toca la pila.
 * - **Clic o Enter** sobre cualquier elemento: lo selecciona y abre el inspector.
 *   No simula.
 * - **El botón *Simular este workitem***: agrega el paso, avisando antes si hay
 *   trabajo más prioritario o falta un prerequisito.
 */

import { CalendarDays, ChevronDown, FlaskConical, ListTree, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";

import { Contexto, useLab, type LabContexto, type VistaPrevia } from "./contexto";
import { frasePostergados, frasesDeCambio, t, textoDeRecomendada } from "./copy";
import { Dialogo } from "./dialogo";
import {
  aplicar,
  escenarioActual,
  ESTADOS_DEMOSTRATIVOS,
  estadoDesde,
  reducir,
  type Accion,
  type Modo,
  type Plano,
  type Vista,
} from "./escenario";
import { AHORA, EXCEPCIONES, MATERIAS } from "./fixture";
import { diaLargo, enHoras, franjaCorta, ZONA_DEL_LAB } from "./formato";
import { Inspector, BotonSimular } from "./inspector";
import { PlanSemanal } from "./plan-semanal";
import {
  advertenciasAlSimular,
  compromisoEnVentana,
  diferencia,
  esVacio,
  nombreCorto,
  PLAN_REAL,
  porQueNoSeSimula,
  proyectar,
  tituloDe,
  VACIO,
  workitem,
} from "./proyeccion";
import s from "./lab.module.css";
import type { Proyeccion } from "./tipos";

type DialogoAbierto =
  | { tipo: "PRIORIDAD"; id: string; superiores: string[] }
  | { tipo: "DEPENDENCIA"; id: string; faltan: string[] }
  | { tipo: "QUITAR"; ventanaId: string; compromisoId: string };

function suscribirMovimiento(cb: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener?.("change", cb);
  return () => mq.removeEventListener?.("change", cb);
}
const prefiereMenosMovimiento = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const ESTADOS_DE_URL = Object.keys(ESTADOS_DEMOSTRATIVOS);

export function LabPlanVivo({ escenario: param, vista: vistaParam, modo: modoParam }: { escenario: string | null; vista: string | null; modo: string | null }) {
  const demo = ESTADOS_DEMOSTRATIVOS[param ?? "base"] ?? ESTADOS_DEMOSTRATIVOS.base;
  const [estado, despacharInterno] = useReducer(reducir, demo.acciones, estadoDesde);
  const [plano, setPlano] = useState<Plano>(demo.plano);
  const [modo, setModo] = useState<Modo>(modoParam === "limpio" ? "LIMPIO" : (demo.modo ?? "EXPLICADO"));
  const [vista, setVista] = useState<Vista>(vistaParam === "calendario" ? "CALENDARIO" : (demo.vista ?? "PLAN"));
  const [seleccion, setSeleccion] = useState<string | null>(demo.seleccion);
  const [vistaPrevia, setVistaPrevia] = useState<VistaPrevia | null>(null);
  const [reubicacion, setReubicacion] = useState<LabContexto["reubicacion"]>(null);
  const [dialogo, setDialogo] = useState<DialogoAbierto | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState("");
  const [menu, setMenu] = useState(false);
  const [interactuo, setInteractuo] = useState(false);
  const menosMovimiento = useSyncExternalStore(suscribirMovimiento, prefiereMenosMovimiento, () => false);
  const tituloDelInspector = useRef<HTMLHeadingElement>(null);

  const escenario = escenarioActual(estado);
  const proyeccionDelEscenario = useMemo(() => proyectar(escenario), [escenario]);
  const escenarioPrevio = useMemo(() => {
    if (!vistaPrevia) return null;
    const accion: Accion = vistaPrevia.tipo === "PASO" ? { tipo: "SIMULAR", id: vistaPrevia.id, override: true } : vistaPrevia.accion;
    const e = aplicar(escenario, accion);
    return e === escenario ? null : e;
  }, [vistaPrevia, escenario]);
  const proyeccionPrevia = useMemo(() => (escenarioPrevio ? proyectar(escenarioPrevio) : null), [escenarioPrevio]);
  const anterior = useMemo(
    () => (estado.historial.length > 1 ? proyectar(estado.historial[estado.historial.length - 2]) : null),
    [estado.historial],
  );

  const mostrada: Proyeccion = proyeccionPrevia ?? (plano === "ESCENARIO" ? proyeccionDelEscenario : PLAN_REAL);
  const escenarioMostrado = escenarioPrevio ?? (plano === "ESCENARIO" ? escenario : VACIO);
  const referencia = proyeccionPrevia ? proyeccionDelEscenario : plano === "ESCENARIO" ? anterior : null;

  const despachar = useCallback(
    (accion: Accion) => {
      setInteractuo(true);
      const siguiente = reducir(estado, accion);
      despacharInterno(accion);
      if (siguiente === estado) return;
      const p = proyectar(escenarioActual(siguiente));
      const n = p.pasos.length;
      const prefijo =
        accion.tipo === "SIMULAR"
          ? `Paso ${n} agregado al escenario: ${tituloDe(accion.id)}.`
          : accion.tipo === "DESHACER"
            ? "Se deshizo el último cambio del escenario."
            : accion.tipo === "RESTABLECER"
              ? "Escenario restablecido: es igual a tu plan real."
              : accion.tipo === "VOLVER_A_PASO"
                ? `El escenario volvió al paso ${accion.numero}.`
                : "Escenario actualizado.";
      setAnuncio(`${prefijo} Trabajo pendiente esta semana: ${enHoras(p.totales.pendiente)}. Trabajo sin ubicar: ${enHoras(p.totales.sinUbicar)}.`);
    },
    [estado],
  );

  const seleccionar = useCallback((id: string | null) => {
    setInteractuo(true);
    setSeleccion(id);
    setReubicacion(null);
    setVistaPrevia(null);
    if (id && typeof window !== "undefined" && window.matchMedia?.("(max-width: 900px)").matches) {
      requestAnimationFrame(() => {
        tituloDelInspector.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
        tituloDelInspector.current?.focus({ preventScroll: true });
      });
    }
  }, []);

  const confirmarSimulacion = useCallback(
    (id: string, override: boolean) => {
      setDialogo(null);
      setVistaPrevia(null);
      despachar({ tipo: "SIMULAR", id, override });
      setPlano("ESCENARIO");
      setSeleccion(id);
    },
    [despachar],
  );

  const pedirSimular = useCallback(
    (id: string) => {
      if (porQueNoSeSimula(escenario, proyeccionDelEscenario, id) !== null) return;
      const { faltan, superiores } = advertenciasAlSimular(proyeccionDelEscenario, id);
      setVistaPrevia(null);
      if (faltan.length > 0) setDialogo({ tipo: "DEPENDENCIA", id, faltan });
      else if (superiores.length > 0) setDialogo({ tipo: "PRIORIDAD", id, superiores });
      else confirmarSimulacion(id, false);
    },
    [escenario, proyeccionDelEscenario, confirmarSimulacion],
  );

  const previsualizarPaso = useCallback(
    (id: string | null) => {
      // En el plan real sólo se previsualiza si el escenario todavía es igual a él: si no, la vista saltaría.
      if (id && plano === "REAL" && !esVacio(escenario)) return;
      setInteractuo(true);
      setVistaPrevia((actual) => (id ? { tipo: "PASO", id } : actual?.tipo === "PASO" ? null : actual));
    },
    [plano, escenario],
  );

  const previsualizarAccion = useCallback((accion: Accion | null) => {
    setInteractuo(true);
    setVistaPrevia(accion ? { tipo: "ACCION", accion } : null);
  }, []);

  const pedirQuitarVentana = useCallback(
    (ventanaId: string) => {
      const compromisoId = compromisoEnVentana(escenario, ventanaId);
      if (compromisoId) return setDialogo({ tipo: "QUITAR", ventanaId, compromisoId });
      despachar({ tipo: "QUITAR_VENTANA", id: ventanaId });
      setPlano("ESCENARIO");
    },
    [escenario, despachar],
  );

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setVistaPrevia(null);
      setReubicacion(null);
      setMenu(false);
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  const contexto: LabContexto = {
    estado,
    escenario,
    escenarioMostrado,
    real: PLAN_REAL,
    proyeccionDelEscenario,
    mostrada,
    referencia,
    plano,
    modo,
    vista,
    seleccion,
    vistaPrevia,
    movimientoReducido: menosMovimiento,
    animar: interactuo && !menosMovimiento,
    seleccionar,
    previsualizarPaso,
    previsualizarAccion,
    pedirSimular,
    despachar,
    cambiarPlano: (p) => {
      setInteractuo(true);
      setVistaPrevia(null);
      setPlano(p);
    },
    cambiarModo: setModo,
    cambiarVista: setVista,
    avisar: setAviso,
    abrirReubicacion: (id, forma) => {
      setVistaPrevia(null);
      setReubicacion({ id, forma });
    },
    reubicacion,
    cerrarReubicacion: () => setReubicacion(null),
    pedirQuitarVentana,
  };

  const recomendada = mostrada.recomendada ? workitem(mostrada.recomendada) : null;

  return (
    <Contexto.Provider value={contexto}>
      <div className={s.pagina} data-plano={plano} data-modo={modo} data-vista={vista}>
        <div className={s.ribete}>
          <span className={s.ribeteMarca}>
            <FlaskConical size={13} aria-hidden />
            {t("LAB.RIBETE")}
          </span>
          <span>{t("LAB.RIBETE.DETALLE")}</span>
          <span className={s.reloj}>
            Reloj del laboratorio: {diaLargo(AHORA.dia)}, {AHORA.hora} · {ZONA_DEL_LAB}
          </span>
          <a className={s.saltar} href="#lab-inspector">
            {t("INSPECTOR.SALTAR")}
          </a>
        </div>

        <header className={s.encabezado}>
          <div>
            <h1 className={s.titulo}>{t("TITULO")}</h1>
            <p className={s.bajada} data-bajada>
              {plano === "ESCENARIO" ? t("BAJADA.ESCENARIO") : t("BAJADA.REAL")}
            </p>
          </div>
          <Indicadores p={mostrada} real={PLAN_REAL} mostrarReal={mostrada !== PLAN_REAL} />
        </header>
        <p className={s.soloLectores} aria-live="polite" data-anuncio>
          {anuncio}
        </p>

        {recomendada && (
          <div className={s.proxima} style={{ ["--lab-materia" as string]: MATERIAS[recomendada.materia].color }} data-proxima={recomendada.id}>
            <div className={s.proximaTexto}>
              <span className={s.proximaEtiqueta}>{t("PROXIMA.ETIQUETA")}</span>
              <span className={s.proximaTitulo}>{recomendada.titulo}</span>
              <span className={s.textoSuave}>
                {MATERIAS[recomendada.materia].corto} · {recomendada.duracion.min}–{recomendada.duracion.max} min
                {(() => {
                  const c = mostrada.colocados.find((x) => x.clave === recomendada.id);
                  return c?.franja ? ` · ${franjaCorta(c.franja)}` : "";
                })()}
              </span>
            </div>
            <div className={s.acciones}>
              <BotonSimular id={recomendada.id} compacto />
              <button type="button" className={s.boton} onClick={() => seleccionar(recomendada.id)}>
                {t("PROXIMA.VER")}
              </button>
            </div>
          </div>
        )}
        {!recomendada && <p className={s.textoSuave}>{textoDeRecomendada(null)}</p>}

        <div className={s.controles} role="toolbar" aria-label="Controles del laboratorio">
          <Segmentado
            etiqueta={t("PLANO.ETIQUETA")}
            valor={plano}
            opciones={[
              ["REAL", t("PLANO.REAL")],
              ["ESCENARIO", t("PLANO.ESCENARIO")],
            ]}
            onCambiar={(v) => contexto.cambiarPlano(v as Plano)}
            dato="plano"
          />
          <Segmentado
            etiqueta={t("MODO.ETIQUETA")}
            valor={modo}
            opciones={[
              ["EXPLICADO", t("MODO.EXPLICADO")],
              ["LIMPIO", t("MODO.LIMPIO")],
            ]}
            onCambiar={(v) => setModo(v as Modo)}
            dato="modo"
          />
          <Segmentado
            etiqueta={t("VISTA.ETIQUETA")}
            valor={vista}
            opciones={[
              ["PLAN", t("VISTA.PLAN")],
              ["CALENDARIO", t("VISTA.CALENDARIO")],
            ]}
            iconos={{ PLAN: <ListTree size={14} aria-hidden />, CALENDARIO: <CalendarDays size={14} aria-hidden /> }}
            onCambiar={(v) => setVista(v as Vista)}
            dato="vista"
          />
          <div className={s.menuContenedor}>
            <button type="button" className={s.boton} aria-expanded={menu} aria-controls="lab-menu-disponibilidad" onClick={() => setMenu((x) => !x)}>
              {t("DISP.MENU")}
              <ChevronDown size={14} aria-hidden />
            </button>
            {menu && (
              <div className={s.menu} id="lab-menu-disponibilidad">
                <p className={s.menuTitulo}>{t("DISP.AGREGAR")}</p>
                {EXCEPCIONES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={s.opcion}
                    disabled={escenario.agregadas.includes(v.id)}
                    onClick={() => {
                      despachar({ tipo: "AGREGAR_VENTANA", id: v.id });
                      setPlano("ESCENARIO");
                      setMenu(false);
                    }}
                  >
                    {franjaCorta(v.franja)}
                    {escenario.agregadas.includes(v.id) ? " · ya agregada" : ""}
                  </button>
                ))}
                <button
                  type="button"
                  className={s.opcion}
                  disabled={escenario.agregadas.length === 0 && escenario.quitadas.length === 0}
                  onClick={() => {
                    despachar({ tipo: "RESTABLECER_DISPONIBILIDAD" });
                    setMenu(false);
                  }}
                >
                  {t("DISP.RESTABLECER")}
                </button>
                <p className={s.menuAyuda}>{t("DISP.AYUDA")}</p>
                <p className={s.menuAyuda}>{t("DISP.NO_ES_PROGRESO")}</p>
              </div>
            )}
          </div>
        </div>

        {aviso && (
          <div className={s.avisoDemo} role="status" data-aviso-demo>
            <span>{aviso}</span>
            <button type="button" className={s.botonIcono} onClick={() => setAviso(null)} aria-label="Cerrar aviso">
              <X size={14} aria-hidden />
            </button>
          </div>
        )}

        {/* PILA */}

        <div className={s.cuerpo}>
          <PlanSemanal encabezado={<ResumenLimpio />} />
          <Inspector ref={tituloDelInspector} />
        </div>

        {/* CAMINO Y GANTT */}

        {dialogo?.tipo === "PRIORIDAD" && (
          <Dialogo titulo={t("PRIORIDAD.TITULO")} onCerrar={() => setDialogo(null)}>
            <p className={s.texto} data-postergados>
              {frasePostergados(dialogo.superiores)} {t("PRIORIDAD.BAJADA")}
            </p>
            <CostoDelOrden id={dialogo.id} />
            <div className={s.acciones}>
              <button
                type="button"
                className={s.boton}
                onClick={() => {
                  setDialogo(null);
                  seleccionar(proyeccionDelEscenario.recomendada);
                }}
              >
                {t("PRIORIDAD.VOLVER")}
              </button>
              <button type="button" className={s.botonPrimario} onClick={() => confirmarSimulacion(dialogo.id, true)}>
                {t("PRIORIDAD.IGUAL")}
              </button>
            </div>
          </Dialogo>
        )}
        {dialogo?.tipo === "DEPENDENCIA" && (
          <Dialogo titulo={t("DEPENDENCIA.TITULO")} onCerrar={() => setDialogo(null)}>
            <p className={s.texto}>
              {tituloDe(dialogo.id)} depende de {dialogo.faltan.map(nombreCorto).join(" y ")}, que todavía no está hecho en el escenario.
            </p>
            <p className={s.textoSuave}>{t("DEPENDENCIA.BAJADA")}</p>
            <div className={s.acciones}>
              <button
                type="button"
                className={s.botonPrimario}
                onClick={() => {
                  setDialogo(null);
                  pedirSimular(dialogo.faltan[0]);
                }}
              >
                {t("DEPENDENCIA.PRIMERO")} {nombreCorto(dialogo.faltan[0])}
              </button>
              <button type="button" className={s.boton} onClick={() => confirmarSimulacion(dialogo.id, true)}>
                {t("DEPENDENCIA.IGUAL")}
              </button>
              <button type="button" className={s.botonTexto} onClick={() => setDialogo(null)}>
                {t("ACCION.CANCELAR")}
              </button>
            </div>
          </Dialogo>
        )}
        {dialogo?.tipo === "QUITAR" && (
          <Dialogo titulo={t("QUITAR.TITULO")} onCerrar={() => setDialogo(null)}>
            <p className={s.texto}>
              {tituloDe(dialogo.compromisoId)} está confirmado en esa franja. {t("QUITAR.BAJADA")}
            </p>
            <div className={s.acciones}>
              <button
                type="button"
                className={s.botonPrimario}
                onClick={() => {
                  setDialogo(null);
                  setSeleccion(dialogo.compromisoId);
                  setReubicacion({ id: dialogo.compromisoId, forma: "RENEGOCIAR" });
                }}
              >
                {t("QUITAR.CAMBIAR")}
              </button>
              <button type="button" className={s.boton} onClick={() => setDialogo(null)}>
                {t("ACCION.CANCELAR")}
              </button>
            </div>
          </Dialogo>
        )}
      </div>
    </Contexto.Provider>
  );
}

function Segmentado({
  etiqueta,
  valor,
  opciones,
  iconos,
  onCambiar,
  dato,
}: {
  etiqueta: string;
  valor: string;
  opciones: readonly (readonly [string, string])[];
  iconos?: Record<string, React.ReactNode>;
  onCambiar: (v: string) => void;
  dato: string;
}) {
  return (
    <div className={s.segmentado} role="group" aria-label={etiqueta} data-segmentado={dato}>
      {opciones.map(([v, texto]) => (
        <button key={v} type="button" className={s.segmento} aria-pressed={valor === v} onClick={() => onCambiar(v)}>
          {iconos?.[v]}
          {texto}
        </button>
      ))}
    </div>
  );
}

function Indicadores({ p, real, mostrarReal }: { p: Proyeccion; real: Proyeccion; mostrarReal: boolean }) {
  const t0 = p.totales;
  const libres = t0.declarada - t0.usadaPorSimulado;
  const antes = (actual: number, delReal: number) =>
    mostrarReal && actual !== delReal ? (
      <span className={s.indicadorAntes}>
        {t("INDICADOR.PLAN_REAL")} {enHoras(delReal)} →{" "}
      </span>
    ) : null;
  const queEs = (def: string, extra?: string) => (
    <details className={s.queEs}>
      <summary>{t("INDICADOR.QUE_ES")}</summary>
      <p>{def}</p>
      {extra && <p>{extra}</p>}
    </details>
  );
  return (
    <div className={s.indicadoresBloque}>
      <dl className={s.indicadores} data-indicadores>
        <div className={s.indicador} data-indicador="pendiente">
          <dt>{t("INDICADOR.PENDIENTE")}</dt>
          <dd>
            {antes(t0.pendiente, real.totales.pendiente)}
            {enHoras(t0.pendiente)}
          </dd>
          <span className={s.indicadorDetalle}>
            entre {enHoras(t0.pendienteMin)} y {enHoras(t0.pendienteMax)} · {t("INDICADOR.HORIZONTE")}
          </span>
          {queEs(t("INDICADOR.PENDIENTE.DEF"), t("INDICADOR.PENDIENTE.FUENTE"))}
        </div>
        <div className={s.indicador} data-indicador="disponible">
          <dt>{t("INDICADOR.DISPONIBLE")}</dt>
          <dd>
            {antes(t0.declarada, real.totales.declarada)}
            {enHoras(t0.declarada)}
          </dd>
          {t0.usadaPorSimulado > 0 && (
            <span className={s.indicadorDetalle}>
              {enHoras(libres)} para lo pendiente · {enHoras(t0.usadaPorSimulado)} usadas por lo simulado
            </span>
          )}
          {queEs(t("INDICADOR.DISPONIBLE.DEF"))}
        </div>
        <div className={s.indicador} data-indicador="sin-ubicar">
          <dt>{t("INDICADOR.SIN_UBICAR")}</dt>
          <dd>
            {antes(t0.sinUbicar, real.totales.sinUbicar)}
            {enHoras(t0.sinUbicar)}
          </dd>
          {queEs(t("INDICADOR.SIN_UBICAR.DEF"))}
        </div>
        <div className={s.indicador} data-indicador="margen">
          <dt>{t("INDICADOR.MARGEN")}</dt>
          <dd>
            {antes(t0.margen, real.totales.margen)}
            {enHoras(t0.margen)}
          </dd>
          {queEs(t("INDICADOR.MARGEN.DEF"))}
        </div>
      </dl>
      {t0.margen > 0 && t0.sinUbicar > 0 && (
        <p className={s.indicadorNota} data-coexistencia>
          {porQueConviven(p)}
        </p>
      )}
    </div>
  );
}

/** La razón explícita de que haya margen y trabajo sin ubicar a la vez. */
export function porQueConviven(p: Proyeccion): string {
  const mayorHueco = Math.max(0, ...p.margenes.map((m) => m.minutos));
  const sinLugar = p.colocados.filter((c) => c.estado === "PROPUESTA" && c.franja === null);
  const menor = Math.min(...sinLugar.map((c) => workitem(c.id)?.duracion.probable ?? Infinity));
  if (mayorHueco < menor)
    return `Hay margen y trabajo sin ubicar a la vez porque el margen está en huecos de hasta ${enHoras(mayorHueco)}, y lo que falta ubicar necesita al menos ${enHoras(menor)} seguidos. No se parten ni se acortan bloques.`;
  return "Hay margen y trabajo sin ubicar a la vez porque lo que falta ubicar no puede ir en esos huecos: depende de algo que todavía no tiene lugar o tendría que ir antes del parcial.";
}

function ResumenLimpio() {
  const { modo, referencia, mostrada } = useLab();
  const [abierto, setAbierto] = useState(false);
  if (modo !== "LIMPIO" || !referencia) return null;
  const frases = frasesDeCambio(referencia, mostrada, diferencia(referencia, mostrada));
  if (frases.length === 0) return null;
  return (
    <div className={s.resumenLimpio} data-resumen-limpio>
      <span>{frases[0]}</span>
      <button type="button" className={s.botonTexto} aria-expanded={abierto} onClick={() => setAbierto((x) => !x)}>
        {abierto ? t("PILA.OCULTAR_POR_QUE") : t("PILA.VER_POR_QUE")}
      </button>
      {abierto && (
        <ul className={s.lista}>
          {frases.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CostoDelOrden({ id }: { id: string }) {
  const { escenario, proyeccionDelEscenario } = useLab();
  const despues = proyectar(aplicar(escenario, { tipo: "SIMULAR", id, override: true }));
  const d = diferencia(proyeccionDelEscenario, despues);
  const costo = [...d.riesgosAgregados.map((r) => r.texto), ...d.desubicados.map((x) => `${tituloDe(x)} queda por ubicar.`)];
  return (
    <div className={s.seccion} data-costo>
      <h3 className={s.seccionTitulo}>Qué costaría este orden</h3>
      <ul className={s.lista}>{costo.length === 0 ? <li>En este escenario no agrega riesgos visibles.</li> : costo.map((c) => <li key={c}>{c}</li>)}</ul>
    </div>
  );
}
