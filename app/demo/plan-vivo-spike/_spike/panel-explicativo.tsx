"use client";

/**
 * 🧪 SPIKE DESCARTABLE — el panel de la derecha.
 *
 * ⚠️ **La tarjeta de Próxima acción es lo primero y no se mueve.** Es la que
 * dispara la simulación con el mouse o el foco: si se corriera mientras el camino
 * se reacomoda, perdería el hover debajo del cursor y la simulación parpadearía.
 * Todo lo que cambia con el escenario va **debajo** de ella.
 */

import { CalendarDays, FlaskConical, RotateCcw, Undo2 } from "lucide-react";

import { colorDe, etiquetaDeEstado } from "./bloque";
import { CONFIANZA_VISIBLE, RAZONES_DE_LIMITES, t } from "./copy";
import { ALTERNATIVAS, ID, MATERIAS } from "./fixture";
import { diaCorto, diaLargo, enHoras, relojDe } from "./formato";
import { itemDe } from "./proyecciones";
import s from "./spike.module.css";
import type { SpikePlanDiff, SpikePlanProjection, SpikeScenario } from "./tipos";
import { ESTADO_VISIBLE } from "./copy";

export type EstadoDeSimulacion = "NINGUNA" | "HOVER" | "FIJADA";

/** El último registro de Límites en el fixture: martes 8 de septiembre. */
const ULTIMO_REGISTRO_DE_LIMITES = "2026-09-08";

function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
}

/** Las razones de la recomendada, con el día y la hora del escenario. **Hechos, sin puntaje.** */
export function razonesDeLaRecomendada(p: SpikePlanProjection): string[] {
  const lim = itemDe(p, ID.LIMITES)!;
  const reloj = relojDe(p.ahora);
  const razones = [t(RAZONES_DE_LIMITES[0]), t(RAZONES_DE_LIMITES[1]), t(RAZONES_DE_LIMITES[2])];
  if (lim.franja && lim.rango) {
    const cuando = lim.franja.dia === reloj.dia ? "de hoy" : `del ${diaLargo(lim.franja.dia)}`;
    const exceso = lim.rango.max - lim.rango.probable;
    razones.push(
      `Su duración probable entra en tu bloque ${cuando}, ${lim.franja.desde}–${lim.franja.hasta}.` +
        (exceso > 0 ? ` Si se estira al máximo, pasa ${exceso} min.` : ""),
    );
  }
  razones.push(
    `El último registro de Límites es del martes 8 de septiembre: hace ${diasEntre(ULTIMO_REGISTRO_DE_LIMITES, reloj.dia)} días.`,
  );
  return razones;
}

/** Qué cambió, en frases. Sale del diff: la pantalla no compara nada por su cuenta. */
export function frasesDeCambio(antes: SpikePlanProjection, despues: SpikePlanProjection, d: SpikePlanDiff): string[] {
  const titulo = (id: string) => (itemDe(despues, id) ?? itemDe(antes, id))!.titulo;
  const frases: string[] = [];
  for (const id of d.retirados)
    frases.push(itemDe(despues, id) ? `${titulo(id)} sale del trabajo pendiente.` : `${titulo(id)} deja de hacer falta.`);
  for (const c of d.cambiosDeEstado)
    if (!d.retirados.includes(c.id)) frases.push(`${titulo(c.id)}: ${ESTADO_VISIBLE[c.antes]} → ${ESTADO_VISIBLE[c.despues]}.`);
  for (const m of d.movidos)
    frases.push(`${titulo(m.id)}: ${diaCorto(m.antes!.dia)} ${m.antes!.desde} → ${diaCorto(m.despues!.dia)} ${m.despues!.desde}.`);
  for (const id of d.ubicados) {
    const fr = itemDe(despues, id)!.franja!;
    frases.push(`${titulo(id)} entra: ${diaCorto(fr.dia)} ${fr.desde}–${fr.hasta}.`);
  }
  for (const id of d.desubicados) frases.push(`${titulo(id)} queda por ubicar.`);
  if (d.minutos.margen !== 0) {
    const antesDelParcial = despues.margenes.filter((m) => m.antesDelParcial).reduce((t, m) => t + m.minutos, 0);
    frases.push(
      `Margen: ${enHoras(antes.totales.margen)} → ${enHoras(despues.totales.margen)}` +
        (antesDelParcial > 0 ? `, ${enHoras(antesDelParcial)} antes del parcial.` : "."),
    );
  }
  if (d.siguienteAntes !== d.siguienteDespues && d.siguienteDespues)
    frases.push(`Lo que sigue pasa a ser ${titulo(d.siguienteDespues)} (antes: ${d.siguienteAntes ? titulo(d.siguienteAntes) : "nada"}).`);
  if (d.minutos.pendiente !== 0)
    frases.push(`Trabajo pendiente estimado: ${enHoras(antes.totales.pendiente)} → ${enHoras(despues.totales.pendiente)}.`);
  if (d.minutos.disponible !== 0)
    frases.push(`Tiempo disponible: ${enHoras(antes.totales.disponible)} → ${enHoras(despues.totales.disponible)}.`);
  if (d.minutos.sinUbicar !== 0)
    frases.push(`Sin ubicar: ${enHoras(antes.totales.sinUbicar)} → ${enHoras(despues.totales.sinUbicar)}.`);
  return frases;
}

export function frasesDeIgual(antes: SpikePlanProjection, despues: SpikePlanProjection, d: SpikePlanDiff): string[] {
  const frases = [t("DIFF.IGUAL.RESTRICCIONES")];
  if (d.minutos.pendiente === 0) frases.push("El trabajo académico pendiente: agregar tiempo no lo achica.");
  for (const i of despues.items)
    if (i.franja === null && itemDe(antes, i.id)?.franja === null && i.estado === "SUGERIDA")
      frases.push(`${i.titulo} sigue sin lugar.`);
  return frases;
}

function Cambios({ antes, despues, diff }: { antes: SpikePlanProjection; despues: SpikePlanProjection; diff: SpikePlanDiff }) {
  const cambios = frasesDeCambio(antes, despues, diff);
  return (
    <>
      <div className={s.seccion} data-seccion="cambio">
        <h3 className={s.seccionTitulo}>{t("DIFF.CAMBIO")}</h3>
        {cambios.length === 0 ? (
          <p className={s.textoSuave}>{t("DIFF.NADA")}</p>
        ) : (
          <ul className={s.lista}>
            {cambios.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
      </div>
      <div className={s.seccion} data-seccion="igual">
        <h3 className={s.seccionTitulo}>{t("DIFF.IGUAL")}</h3>
        <ul className={s.lista}>
          {frasesDeIgual(antes, despues, diff).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function PanelExplicativo({
  fijo,
  proyeccion,
  referencia,
  diff,
  simulacion,
  verQuePaso,
  seleccion,
  onTarjeta,
  onVolver,
  onAplicar,
  onDescartar,
  onRestablecer,
  onReorganizar,
  onVerQuePaso,
  onVerEnCalendario,
}: {
  fijo: SpikeScenario;
  proyeccion: SpikePlanProjection;
  referencia: SpikePlanProjection | null;
  diff: SpikePlanDiff | null;
  simulacion: EstadoDeSimulacion;
  verQuePaso: boolean;
  seleccion: string | null;
  onTarjeta: {
    onPointerEnter: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
    onFocus: () => void;
    onBlur: () => void;
    onClick: () => void;
  };
  onVolver: () => void;
  onAplicar: () => void;
  onDescartar: () => void;
  onRestablecer: () => void;
  onReorganizar: () => void;
  onVerQuePaso: () => void;
  onVerEnCalendario: (id: string) => void;
}) {
  const lim = itemDe(proyeccion, ID.LIMITES)!;
  const simulable = fijo === "BASE";
  const simulando = simulacion !== "NINGUNA";
  const seleccionado = seleccion && seleccion !== ID.LIMITES ? itemDe(proyeccion, seleccion) : null;

  const contenidoDeTarjeta = (
    <>
      <span className={s.tarjetaFila}>
        <span>{t("ACCION.ETIQUETA")}</span>
        <span>· {MATERIAS[lim.materia].nombre}</span>
        {simulando && (
          <span className={`${s.pastilla} ${s.pastillaSimulacion}`} style={{ marginLeft: "auto" }}>
            <FlaskConical size={12} aria-hidden />
            {simulacion === "FIJADA" ? t("ACCION.FIJADA") : t("ACCION.SIMULANDO")}
          </span>
        )}
      </span>
      <span className={s.tarjetaTitulo}>{lim.titulo}</span>
      <dl className={s.datos}>
        <dt>{t("ACCION.DURACION")}</dt>
        <dd>
          {lim.rango!.min}–{lim.rango!.max} min · {t("ACCION.PROBABLE")} {lim.rango!.probable}
        </dd>
        <dt>{t("ACCION.CONFIANZA")}</dt>
        <dd>
          {CONFIANZA_VISIBLE[lim.confianza!.nivel]} · {t("ACCION.FUENTE").toLowerCase()}: {lim.confianza!.fuente}
        </dd>
        <dt>{t("ACCION.EVIDENCIA")}</dt>
        <dd>{lim.evidenciaEsperada}</dd>
        {lim.franja && (
          <>
            <dt>Cuándo</dt>
            <dd>
              {diaLargo(lim.franja.dia)}, {lim.franja.desde}–{lim.franja.hasta}
            </dd>
          </>
        )}
      </dl>
    </>
  );

  return (
    <aside className={`${s.tarjeta} ${s.panel}`} aria-label="Explicación del plan">
      {fijo === "TIME_ADVANCED_MISSED" && (
        <div className={s.seccion} data-seccion="reloj">
          <h3 className={s.seccionTitulo}>{t("RELOJ.TITULO")}</h3>
          <p className={s.texto}>{t("RELOJ.BAJADA")}</p>
          <div className={s.acciones}>
            <button type="button" className={s.botonPrimario} onClick={onReorganizar}>
              {t("RELOJ.CTA")}
            </button>
            <button type="button" className={s.boton} aria-expanded={verQuePaso} onClick={onVerQuePaso}>
              {t("RELOJ.VER")}
            </button>
          </div>
          {verQuePaso && (
            <dl className={s.datos} data-seccion="que-paso">
              <dt>{t("RELOJ.HECHO")}</dt>
              <dd>{t("RELOJ.HECHO.DETALLE")}</dd>
              <dt>{t("RELOJ.TRABAJO")}</dt>
              <dd>{t("RELOJ.TRABAJO.DETALLE")}</dd>
              <dt>{t("RELOJ.PROPUESTA")}</dt>
              <dd>{t("RELOJ.PROPUESTA.DETALLE")}</dd>
            </dl>
          )}
          <p className={s.textoSuave}>{t("RELOJ.PROPUESTAS_PASADAS")}</p>
          <p className={s.textoSuave}>{t("RELOJ.DISPONIBILIDAD_PASADA")}</p>
          <button type="button" className={s.botonTexto} onClick={() => onVerEnCalendario(ID.COMPROMISO)}>
            <CalendarDays size={14} aria-hidden />
            {t("CAL.VER")}
          </button>
        </div>
      )}

      {fijo === "RESCUE_PREVIEW" && referencia && diff && (
        <div className={s.seccion} data-seccion="rescate">
          <span className={`${s.pastilla} ${s.pastillaVistaPrevia}`} style={{ alignSelf: "flex-start" }}>
            {t("RESCATE.RIBETE")}
          </span>
          <p className={s.texto}>{t("RESCATE.MENSAJE")}</p>
          <p className={s.textoSuave}>{t("RESCATE.NO_SE_CONFIRMA")}</p>
          <Cambios antes={referencia} despues={proyeccion} diff={diff} />
          <div className={s.acciones}>
            <button type="button" className={s.boton} onClick={onDescartar}>
              <Undo2 size={14} aria-hidden />
              {t("RESCATE.DESCARTAR")}
            </button>
          </div>
        </div>
      )}

      <div className={s.seccion}>
        {simulable ? (
          <button
            type="button"
            className={[s.tarjetaAccion, simulando ? s.tarjetaAccionActiva : ""].join(" ")}
            style={{ ["--spike-materia" as string]: colorDe(lim) }}
            aria-pressed={simulacion === "FIJADA"}
            aria-describedby="spike-pista"
            data-tarjeta-accion
            {...onTarjeta}
          >
            {contenidoDeTarjeta}
          </button>
        ) : (
          <div
            className={`${s.tarjetaAccion} ${s.tarjetaAccionInerte}`}
            style={{ ["--spike-materia" as string]: colorDe(lim) }}
            data-tarjeta-accion
          >
            {contenidoDeTarjeta}
          </div>
        )}
        <p id="spike-pista" className={s.textoSuave}>
          {simulable ? `${t("ACCION.PISTA")} ${t("ACCION.PISTA_TACTIL")}` : t("ACCION.NO_DISPONIBLE")}
        </p>
      </div>

      {fijo === "BASE" && simulando && referencia && diff && (
        <div className={s.seccion} data-seccion="simulacion" aria-live="polite">
          <span className={`${s.pastilla} ${s.pastillaSimulacion}`} style={{ alignSelf: "flex-start" }}>
            <FlaskConical size={12} aria-hidden />
            {t("SIM.RIBETE")}
          </span>
          <p className={s.texto}>
            <strong>{t("SIM.SUPUESTO")}</strong>
          </p>
          <ol className={s.pasos}>
            <li>{t("SIM.PASO.1")}</li>
            <li>{t("SIM.PASO.2")}</li>
            <li>{t("SIM.PASO.3")}</li>
            <li>{t("SIM.PASO.4")}</li>
            <li>{t("SIM.PASO.5")}</li>
          </ol>
          <p className={s.textoSuave}>{t("SIM.PASOS.NOTA")}</p>
          <p className={s.aviso}>{t("SIM.MENSAJE")}</p>
          <Cambios antes={referencia} despues={proyeccion} diff={diff} />
          <div className={s.seccion}>
            <h3 className={s.seccionTitulo}>{t("SIM.SUPUESTOS")}</h3>
            <ul className={s.lista}>
              <li>{t("SIM.SUPUESTO.A")}</li>
              <li>{t("SIM.SUPUESTO.B")}</li>
              <li>{t("SIM.SUPUESTO.C")}</li>
              <li>{t("SIM.SUPUESTO.D")}</li>
            </ul>
          </div>
          <div className={s.acciones}>
            <button type="button" className={s.boton} onClick={onVolver}>
              <Undo2 size={14} aria-hidden />
              {t("SIM.VOLVER")}
            </button>
          </div>
        </div>
      )}

      {(fijo === "EXTRA_AVAILABILITY_PREVIEW" || fijo === "EXTRA_AVAILABILITY_APPLIED") && referencia && diff && (
        <div className={s.seccion} data-seccion="disponibilidad">
          <span
            className={`${s.pastilla} ${fijo === "EXTRA_AVAILABILITY_PREVIEW" ? s.pastillaVistaPrevia : s.pastillaNeutra}`}
            style={{ alignSelf: "flex-start" }}
          >
            {fijo === "EXTRA_AVAILABILITY_PREVIEW" ? t("DISP.RIBETE") : t("DISP.RIBETE_APLICADA")}
          </span>
          <p className={s.aviso}>{t("DISP.MENSAJE")}</p>
          <div className={s.seccion}>
            <h3 className={s.seccionTitulo}>{t("DISP.NUEVAS")}</h3>
            <ul className={s.lista}>
              {proyeccion.disponibilidad
                .filter((d) => d.agregada)
                .map((d) => (
                  <li key={d.id}>
                    {diaLargo(d.dia)}, {d.desde}–{d.hasta}
                  </li>
                ))}
            </ul>
          </div>
          <Cambios antes={referencia} despues={proyeccion} diff={diff} />
          <div className={s.seccion}>
            <h3 className={s.seccionTitulo}>{t("DISP.FIJO")}</h3>
            <p className={s.texto}>{t("DISP.FIJO.DETALLE")}</p>
          </div>
          <div className={s.acciones}>
            {fijo === "EXTRA_AVAILABILITY_PREVIEW" && (
              <>
                <button type="button" className={s.botonPrimario} onClick={onAplicar}>
                  {t("DISP.APLICAR")}
                </button>
                <button type="button" className={s.boton} onClick={onDescartar}>
                  {t("DISP.DESCARTAR")}
                </button>
              </>
            )}
            <button type="button" className={s.botonTexto} onClick={onRestablecer}>
              <RotateCcw size={14} aria-hidden />
              {t("CONTROL.RESTABLECER")}
            </button>
          </div>
        </div>
      )}

      {seleccionado && (
        <div className={s.seccion} data-seccion="seleccion">
          <h3 className={s.seccionTitulo}>{t("BLOQUE.SELECCIONADO")}</h3>
          <p className={s.texto}>
            <strong>{seleccionado.titulo}</strong>
          </p>
          <dl className={s.datos}>
            <dt>{t("CAL.CAMPO.MATERIA")}</dt>
            <dd>{MATERIAS[seleccionado.materia].nombre}</dd>
            <dt>{t("CAL.CAMPO.ESTADO")}</dt>
            <dd>
              {etiquetaDeEstado(seleccionado)}
              {seleccionado.hipotetico ? " · simulado" : ""}
            </dd>
            {seleccionado.franja && (
              <>
                <dt>{t("CAL.CAMPO.DIA")}</dt>
                <dd>
                  {diaLargo(seleccionado.franja.dia)}, {seleccionado.franja.desde}–{seleccionado.franja.hasta}
                </dd>
              </>
            )}
            {seleccionado.rango && seleccionado.rango.min !== seleccionado.rango.max && (
              <>
                <dt>{t("ACCION.DURACION")}</dt>
                <dd>
                  {seleccionado.rango.min}–{seleccionado.rango.max} min · {t("ACCION.PROBABLE")} {seleccionado.rango.probable}
                </dd>
              </>
            )}
            {seleccionado.confianza && (
              <>
                <dt>{t("ACCION.CONFIANZA")}</dt>
                <dd>
                  {seleccionado.confianza.nivel} · {seleccionado.confianza.fuente}
                </dd>
              </>
            )}
            {seleccionado.evidenciaEsperada && (
              <>
                <dt>{t("ACCION.EVIDENCIA")}</dt>
                <dd>{seleccionado.evidenciaEsperada}</dd>
              </>
            )}
          </dl>
          {seleccionado.carril === "COMPROMISOS" && (
            <button type="button" className={s.boton} onClick={() => onVerEnCalendario(seleccionado.id)}>
              <CalendarDays size={14} aria-hidden />
              {t("CAL.VER")}
            </button>
          )}
        </div>
      )}

      <div className={s.seccion} data-seccion="razones">
        <h3 className={s.seccionTitulo}>{t("ACCION.POR_QUE")}</h3>
        <ul className={s.lista}>
          {razonesDeLaRecomendada(proyeccion).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <div className={s.seccion} data-seccion="alternativas">
        <h3 className={s.seccionTitulo}>{t("ACCION.ALTERNATIVAS")}</h3>
        {ALTERNATIVAS.map((a) => {
          const item = itemDe(proyeccion, a.id);
          if (!item) return null;
          return (
            <div key={a.id} className={s.alternativa}>
              <span>{item.titulo}</span>
              <span className={s.alternativaRazones}>{a.razones.join(" · ")}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
