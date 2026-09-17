"use client";

/**
 * 🧪 **SPIKE DESCARTABLE — «Mi Plan vivo».** La pantalla completa del laboratorio.
 *
 * Todo el estado vive en memoria y **se pierde al refrescar**: no hay red, no hay
 * `localStorage`, no hay escritura. `?escenario=` sólo elige desde dónde se
 * arranca, para poder mandarle al Product Owner un link a cada escenario; la URL
 * no se actualiza al interactuar.
 *
 * ## Qué es preparado y qué no
 *
 * Las ubicaciones de cada escenario están escritas a mano (`fixture.ts`). Las
 * cifras, los márgenes, las huellas y las frases de *Qué cambió* se **calculan**
 * a partir de ellas (`proyecciones.ts`, `celdas.ts`). No hay motor.
 */

import { CalendarDays, ChevronDown, FastForward, FlaskConical, ListTree, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { CalendarioSpike } from "./calendario-spike";
import { CaminoTemporal } from "./camino-temporal";
import { altosEstables, armarCamino } from "./celdas";
import { encabezado, t } from "./copy";
import { ESCENARIOS, ID } from "./fixture";
import { diaLargo, enHoras, relojDe, ZONA_DEL_SPIKE } from "./formato";
import { PanelExplicativo, type EstadoDeSimulacion } from "./panel-explicativo";
import { diferencia, proyectar, referenciaDe } from "./proyecciones";
import s from "./spike.module.css";
import type { SpikeScenario } from "./tipos";

/** Los escenarios que se "fijan". La simulación de Límites se superpone a `BASE`. */
type EscenarioFijo = Exclude<SpikeScenario, "COMPLETION_SIMULATION">;
type Vista = "PLAN" | "CALENDARIO";

const DESDE_URL: Readonly<Record<string, { fijo: EscenarioFijo; simulacion: EstadoDeSimulacion }>> = {
  base: { fijo: "BASE", simulacion: "NINGUNA" },
  simulacion: { fijo: "BASE", simulacion: "FIJADA" },
  disponibilidad: { fijo: "EXTRA_AVAILABILITY_PREVIEW", simulacion: "NINGUNA" },
  "disponibilidad-aplicada": { fijo: "EXTRA_AVAILABILITY_APPLIED", simulacion: "NINGUNA" },
  reloj: { fijo: "TIME_ADVANCED_MISSED", simulacion: "NINGUNA" },
  rescate: { fijo: "RESCUE_PREVIEW", simulacion: "NINGUNA" },
};

export const ESCENARIOS_DE_URL = Object.keys(DESDE_URL);

function suscribirMovimiento(cb: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener?.("change", cb);
  return () => mq.removeEventListener?.("change", cb);
}
const prefiereMenosMovimiento = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Todos los caminos posibles, para que los carriles tengan el mismo alto en cualquier escenario. */
const ALTOS = altosEstables(
  (Object.keys(ESCENARIOS) as SpikeScenario[]).map((e) => {
    const ref = referenciaDe(e);
    return armarCamino(proyectar(e), ref ? proyectar(ref) : null, true);
  }),
);

export function SpikePlanVivo({ escenario, vista }: { escenario: string | null; vista: string | null }) {
  const inicial = DESDE_URL[escenario ?? "base"] ?? DESDE_URL.base;
  const [fijo, setFijo] = useState<EscenarioFijo>(inicial.fijo);
  const [simulacion, setSimulacion] = useState<EstadoDeSimulacion>(inicial.simulacion);
  const [vistaActual, setVista] = useState<Vista>(vista === "calendario" ? "CALENDARIO" : "PLAN");
  const [seleccion, setSeleccion] = useState<string | null>(vista === "calendario" ? ID.COMPROMISO : null);
  const [menu, setMenu] = useState<"DISPONIBILIDAD" | "RELOJ" | null>(null);
  const [verQuePaso, setVerQuePaso] = useState(false);
  const [interactuo, setInteractuo] = useState(false);
  const menosMovimiento = useSyncExternalStore(suscribirMovimiento, prefiereMenosMovimiento, () => false);

  const actual: SpikeScenario = fijo === "BASE" && simulacion !== "NINGUNA" ? "COMPLETION_SIMULATION" : fijo;
  const proyeccion = useMemo(() => proyectar(actual), [actual]);
  const idReferencia = referenciaDe(actual);
  const referencia = useMemo(() => (idReferencia ? proyectar(idReferencia) : null), [idReferencia]);
  const diff = useMemo(() => (referencia ? diferencia(referencia, proyeccion) : null), [referencia, proyeccion]);
  const hipotetico = actual === "COMPLETION_SIMULATION" || actual === "EXTRA_AVAILABILITY_PREVIEW" || actual === "RESCUE_PREVIEW";
  const camino = useMemo(() => armarCamino(proyeccion, referencia, hipotetico), [proyeccion, referencia, hipotetico]);

  const cambiar = useCallback((f: () => void) => {
    setInteractuo(true);
    f();
  }, []);

  const volverAlPlan = useCallback(() => cambiar(() => setSimulacion("NINGUNA")), [cambiar]);
  const restablecer = () =>
    cambiar(() => {
      setFijo("BASE");
      setSimulacion("NINGUNA");
      setMenu(null);
      setVerQuePaso(false);
      setSeleccion(null);
      setVista("PLAN");
    });

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenu(null);
      setSimulacion((sim) => (sim === "NINGUNA" ? sim : "NINGUNA"));
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  const onTarjeta = {
    // Un toque también dispara `pointerenter`: en pantalla táctil la simulación se fija con el clic.
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === "touch" || e.pointerType === "pen" || fijo !== "BASE") return;
      cambiar(() => setSimulacion((sim) => (sim === "NINGUNA" ? "HOVER" : sim)));
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType === "touch" || e.pointerType === "pen") return;
      setSimulacion((sim) => (sim === "HOVER" ? "NINGUNA" : sim));
    },
    onFocus: () => {
      if (fijo !== "BASE") return;
      cambiar(() => setSimulacion((sim) => (sim === "NINGUNA" ? "HOVER" : sim)));
    },
    onBlur: () => setSimulacion((sim) => (sim === "HOVER" ? "NINGUNA" : sim)),
    onClick: () => cambiar(() => setSimulacion((sim) => (sim === "FIJADA" ? "NINGUNA" : "FIJADA"))),
  };

  const cifras = {
    pendiente: enHoras(proyeccion.totales.pendiente),
    disponible: enHoras(proyeccion.totales.disponible),
    sinUbicar: enHoras(proyeccion.totales.sinUbicar),
    margen: enHoras(proyeccion.totales.margen),
  };
  const { titulo, bajada } = encabezado(actual, cifras);
  const reloj = relojDe(proyeccion.ahora);

  const ribete =
    actual === "COMPLETION_SIMULATION"
      ? { texto: t("SIM.RIBETE"), tipo: "simulacion" as const }
      : actual === "EXTRA_AVAILABILITY_PREVIEW"
        ? { texto: t("DISP.RIBETE"), tipo: "vista-previa" as const }
        : actual === "RESCUE_PREVIEW"
          ? { texto: t("RESCATE.RIBETE"), tipo: "vista-previa" as const }
          : actual === "EXTRA_AVAILABILITY_APPLIED"
            ? { texto: t("DISP.RIBETE_APLICADA"), tipo: "neutro" as const }
            : null;
  const mensaje =
    actual === "COMPLETION_SIMULATION"
      ? t("SIM.MENSAJE")
      : actual === "EXTRA_AVAILABILITY_PREVIEW" || actual === "EXTRA_AVAILABILITY_APPLIED"
        ? t("DISP.MENSAJE")
        : null;

  const antes = referencia?.totales;
  const indicador = (clave: "pendiente" | "disponible", etiqueta: string) => (
    <div className={s.indicador}>
      <dt>{etiqueta}</dt>
      <dd>
        {antes && antes[clave] !== proyeccion.totales[clave] && (
          <span className={s.indicadorAntes}>{enHoras(antes[clave])} → </span>
        )}
        {enHoras(proyeccion.totales[clave])}
      </dd>
      {clave === "pendiente" && (
        <span className={s.indicadorDetalle}>
          entre {enHoras(proyeccion.totales.pendienteMin)} y {enHoras(proyeccion.totales.pendienteMax)}
        </span>
      )}
    </div>
  );

  return (
    <div className={s.pagina} data-escenario={actual}>
      <div className={s.ribete}>
        <span className={s.ribeteMarca}>
          <FlaskConical size={13} aria-hidden />
          {t("LAB.RIBETE")}
        </span>
        <span>{t("LAB.RIBETE.DETALLE")}</span>
        <span className={s.reloj} data-reloj={proyeccion.ahora}>
          {t("LAB.RELOJ")}: {diaLargo(reloj.dia)} · {reloj.hora} · {ZONA_DEL_SPIKE}
        </span>
      </div>

      <header className={s.encabezado}>
        <div>
          <h1 className={s.titulo}>{titulo}</h1>
          <p className={s.bajada}>{bajada}</p>
        </div>
        <dl className={s.indicadores}>
          {indicador("pendiente", t("INDICADOR.PENDIENTE"))}
          {indicador("disponible", t("INDICADOR.DISPONIBLE"))}
          <div className={s.indicador}>
            <dt>
              {t("INDICADOR.SIN_UBICAR")} · {t("INDICADOR.MARGEN").toLowerCase()}
            </dt>
            <dd>
              {antes && (antes.sinUbicar !== proyeccion.totales.sinUbicar || antes.margen !== proyeccion.totales.margen) && (
                <span className={s.indicadorAntes}>
                  {enHoras(antes.sinUbicar)} · {enHoras(antes.margen)} →{" "}
                </span>
              )}
              {cifras.sinUbicar} · {cifras.margen}
            </dd>
          </div>
        </dl>
      </header>
      <p className={s.soloLectores} aria-live="polite">
        {titulo}. {bajada}
      </p>

      <div className={s.controles} role="toolbar" aria-label="Controles del laboratorio">
        <button type="button" className={s.boton} aria-pressed={vistaActual === "PLAN"} onClick={() => setVista("PLAN")}>
          <ListTree size={14} aria-hidden />
          {t("VISTA.PLAN")}
        </button>
        <button
          type="button"
          className={s.boton}
          aria-pressed={vistaActual === "CALENDARIO"}
          onClick={() => {
            setSeleccion(ID.COMPROMISO);
            setVista("CALENDARIO");
          }}
        >
          <CalendarDays size={14} aria-hidden />
          {t("VISTA.CALENDARIO")}
        </button>

        <div className={s.menuContenedor}>
          <button
            type="button"
            className={s.boton}
            aria-expanded={menu === "DISPONIBILIDAD"}
            aria-controls="spike-menu-disponibilidad"
            onClick={() => setMenu(menu === "DISPONIBILIDAD" ? null : "DISPONIBILIDAD")}
          >
            {t("CONTROL.DISPONIBILIDAD")}
            <ChevronDown size={14} aria-hidden />
          </button>
          {menu === "DISPONIBILIDAD" && (
            <div className={s.menu} id="spike-menu-disponibilidad">
              {fijo === "BASE" ? (
                <button
                  type="button"
                  className={s.opcion}
                  onClick={() =>
                    cambiar(() => {
                      setSimulacion("NINGUNA");
                      setFijo("EXTRA_AVAILABILITY_PREVIEW");
                      setMenu(null);
                      setVista("PLAN");
                    })
                  }
                >
                  {t("CONTROL.DISPONIBILIDAD.OPCION")}
                </button>
              ) : (
                <p className={s.menuAyuda}>{t("CONTROL.SOLO_DESDE_BASE")}</p>
              )}
              <p className={s.menuAyuda}>{t("CONTROL.DISPONIBILIDAD.AYUDA")}</p>
            </div>
          )}
        </div>

        <div className={s.menuContenedor}>
          <button
            type="button"
            className={s.boton}
            aria-expanded={menu === "RELOJ"}
            aria-controls="spike-menu-reloj"
            onClick={() => setMenu(menu === "RELOJ" ? null : "RELOJ")}
          >
            <FastForward size={14} aria-hidden />
            {t("CONTROL.RELOJ")}
            <ChevronDown size={14} aria-hidden />
          </button>
          {menu === "RELOJ" && (
            <div className={s.menu} id="spike-menu-reloj">
              {fijo === "BASE" ? (
                <button
                  type="button"
                  className={s.opcion}
                  onClick={() =>
                    cambiar(() => {
                      setSimulacion("NINGUNA");
                      setFijo("TIME_ADVANCED_MISSED");
                      setMenu(null);
                      setVerQuePaso(false);
                    })
                  }
                >
                  {t("CONTROL.RELOJ.OPCION")}
                </button>
              ) : (
                <p className={s.menuAyuda}>{t("CONTROL.SOLO_DESDE_BASE")}</p>
              )}
              <p className={s.menuAyuda}>{t("CONTROL.RELOJ.AYUDA")}</p>
            </div>
          )}
        </div>

        <span className={s.separador} />
        <button type="button" className={s.botonTexto} onClick={restablecer}>
          <RotateCcw size={14} aria-hidden />
          {t("CONTROL.RESTABLECER")}
        </button>
      </div>

      <div className={s.cuerpo}>
        {vistaActual === "PLAN" ? (
          <CaminoTemporal
            proyeccion={proyeccion}
            camino={camino}
            altos={ALTOS}
            ribete={ribete}
            mensaje={mensaje}
            seleccion={seleccion}
            movimientoReducido={menosMovimiento}
            animar={interactuo && !menosMovimiento}
            onSeleccionar={(id) => setSeleccion((actualSel) => (actualSel === id ? null : id))}
          />
        ) : (
          <CalendarioSpike
            proyeccion={proyeccion}
            seleccion={seleccion ?? ID.COMPROMISO}
            onSeleccionar={setSeleccion}
            onVolver={() => setVista("PLAN")}
          />
        )}
        <PanelExplicativo
          fijo={fijo}
          proyeccion={proyeccion}
          referencia={referencia}
          diff={diff}
          simulacion={simulacion}
          verQuePaso={verQuePaso}
          seleccion={seleccion}
          onTarjeta={onTarjeta}
          onVolver={volverAlPlan}
          onAplicar={() => cambiar(() => setFijo("EXTRA_AVAILABILITY_APPLIED"))}
          onDescartar={() =>
            cambiar(() => setFijo(fijo === "RESCUE_PREVIEW" ? "TIME_ADVANCED_MISSED" : "BASE"))
          }
          onRestablecer={restablecer}
          onReorganizar={() => cambiar(() => setFijo("RESCUE_PREVIEW"))}
          onVerQuePaso={() => setVerQuePaso((v) => !v)}
          onVerEnCalendario={(id) => {
            setSeleccion(id);
            setVista("CALENDARIO");
          }}
        />
      </div>
    </div>
  );
}
