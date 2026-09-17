"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE — la pila de simulación.
 *
 * `1. Límites → 2. Teoría de Derivadas → 3. Práctica de Derivadas`. Cada paso
 * guarda su escenario de antes y de después, así su diff, sus riesgos y la
 * siguiente acción salen de comparar dos proyecciones, no de un texto preparado.
 *
 * En **Modo limpio** se ve sólo el resumen breve y *Ver por qué cambió*; en
 * **Modo explicado**, el detalle del último paso abierto.
 */

import { ArrowRight, RotateCcw, Undo2 } from "lucide-react";
import { useState } from "react";

import { useLab } from "./contexto";
import { frasesDeCambio, frasesDeIgual, frasesTemporales, t, textoDeRecomendada } from "./copy";
import { extremosDelPaso } from "./escenario";
import { MAXIMO_DE_PASOS, TEMAS } from "./fixture";
import { diferencia, entidad, esVacio, nombreCorto, proyectar, tituloDe } from "./proyeccion";
import s from "./lab.module.css";
import type { Escenario } from "./tipos";

export function Pila() {
  const lab = useLab();
  const pasos = lab.proyeccionDelEscenario.pasos;
  const [abierto, setAbierto] = useState<number | null>(null);
  const [porQue, setPorQue] = useState(false);
  const elegido = abierto !== null && abierto <= pasos.length ? abierto : pasos.length || null;
  const limpio = lab.modo === "LIMPIO";
  const otros =
    Object.keys(lab.escenario.reubicaciones).length +
    Object.keys(lab.escenario.renegociaciones).length +
    lab.escenario.agregadas.length +
    lab.escenario.quitadas.length;

  const extremos = elegido ? extremosDelPaso(lab.estado, elegido) : null;
  const antes = extremos ? proyectar(extremos.antes) : null;
  const despues = extremos ? proyectar(extremos.despues) : null;
  const d = antes && despues ? diferencia(antes, despues) : null;
  const paso = elegido ? pasos[elegido - 1] : null;
  const mostrarDetalle = !limpio || porQue;

  return (
    <section className={`${s.tarjeta} ${s.pila}`} aria-labelledby="lab-pila-titulo" data-pila>
      <div className={s.pilaCabecera}>
        <h2 id="lab-pila-titulo" className={s.tarjetaTitulo}>
          {t("PILA.TITULO")} · {pasos.length} de {MAXIMO_DE_PASOS}
        </h2>
        <div className={s.acciones}>
          <button type="button" className={s.boton} onClick={() => lab.despachar({ tipo: "DESHACER" })} disabled={lab.estado.historial.length <= 1} title={t("PILA.DESHACER.AYUDA")}>
            <Undo2 size={14} aria-hidden />
            {t("PILA.DESHACER")}
          </button>
          <button type="button" className={s.boton} onClick={() => lab.despachar({ tipo: "RESTABLECER" })} disabled={esVacio(lab.escenario)}>
            <RotateCcw size={14} aria-hidden />
            {t("PILA.RESTABLECER")}
          </button>
          <button type="button" className={s.botonTexto} onClick={() => lab.cambiarPlano("REAL")}>
            {t("PILA.VOLVER_REAL")}
          </button>
        </div>
      </div>

      {pasos.length === 0 ? (
        <p className={s.textoSuave}>{t("PILA.VACIA")}</p>
      ) : (
        <ol className={s.pilaPasos} aria-label="Pasos simulados, en orden">
          {pasos.map((p, i) => (
            <li key={`${p.id}-${p.numero}`} className={s.pilaItem}>
              {i > 0 && <ArrowRight size={14} aria-hidden className={s.pilaFlecha} />}
              <button
                type="button"
                className={s.pilaPaso}
                aria-pressed={elegido === p.numero}
                data-paso={p.numero}
                aria-label={`Paso ${p.numero}: ${tituloDe(p.id)}${p.incompleto ? `, ${t("PILA.INCOMPLETO")}` : ""}${p.override ? `, ${t("PILA.OVERRIDE")}` : ""}`}
                onClick={() => {
                  setAbierto(p.numero);
                  lab.seleccionar(p.id);
                }}
              >
                {p.numero}. {nombreCorto(p.id)}
                {p.incompleto && <span className={s.pilaMarca}>{t("PILA.INCOMPLETO")}</span>}
                {p.override && !p.incompleto && <span className={s.pilaMarca}>{t("PILA.OVERRIDE")}</span>}
              </button>
            </li>
          ))}
        </ol>
      )}

      {pasos.length >= MAXIMO_DE_PASOS && (
        <p className={s.aviso} data-maximo>
          {t("SIM.MAXIMO")}
        </p>
      )}
      {otros > 0 && (
        <p className={s.textoSuave}>
          {t("PILA.OTROS_CAMBIOS")} {describirOtros(lab.escenario)}
        </p>
      )}

      {paso && d && antes && despues && (
        <div className={s.pilaDetalle} data-detalle-paso={paso.numero} aria-live="polite">
          <p className={s.texto}>
            <strong>
              {t("PILA.PASO")} {paso.numero}: {tituloDe(paso.id)}.
            </strong>{" "}
            {frasesTemporales(antes, despues, d)[0]} {t("PILA.SIGUIENTE")}: {textoDeRecomendada(despues.recomendada)}.
          </p>
          {limpio && (
            <button type="button" className={s.botonTexto} aria-expanded={porQue} onClick={() => setPorQue((x) => !x)}>
              {porQue ? t("PILA.OCULTAR_POR_QUE") : t("PILA.VER_POR_QUE")}
            </button>
          )}
          {mostrarDetalle && (
            <div className={s.pilaColumnas}>
              <div className={s.seccion}>
                <h3 className={s.seccionTitulo}>{t("PILA.SUPUESTO")}</h3>
                <p className={s.texto}>
                  {paso.incompleto
                    ? `Supuesto incompleto: se hace sin ${paso.faltan.map(nombreCorto).join(" ni ")}. Usa su tiempo, no constata el tema y no desbloquea lo que depende de él.`
                    : t("SIM.SUPUESTO")}
                </p>
              </div>
              <div className={s.seccion}>
                <h3 className={s.seccionTitulo}>{t("PILA.QUE_CAMBIO")}</h3>
                <ul className={s.lista}>
                  {frasesDeCambio(antes, despues, d).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <h3 className={s.seccionTitulo}>{t("PILA.QUE_IGUAL")}</h3>
                <ul className={s.lista}>
                  {frasesDeIgual(d).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className={s.seccion}>
                <h3 className={s.seccionTitulo}>{t("PILA.ACADEMICO")}</h3>
                <ul className={s.lista}>
                  {impactoAcademico(paso.id, paso.incompleto, d.temasQueCambian).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <h3 className={s.seccionTitulo}>{t("PILA.RIESGOS")}</h3>
                <ul className={s.lista} data-riesgos>
                  {d.riesgosAgregados.map((r) => (
                    <li key={r.id} data-riesgo="agregado">
                      Agrega: {r.texto}
                    </li>
                  ))}
                  {d.riesgosEliminados.map((r) => (
                    <li key={r.id} data-riesgo="eliminado">
                      Quita: {r.texto}
                    </li>
                  ))}
                  {d.riesgosAgregados.length + d.riesgosEliminados.length === 0 && <li>Sin cambios en los riesgos.</li>}
                </ul>
              </div>
            </div>
          )}
          {paso.numero < pasos.length && (
            <button type="button" className={s.boton} onClick={() => lab.despachar({ tipo: "VOLVER_A_PASO", numero: paso.numero })}>
              {t("PILA.VOLVER_A_PASO")} {paso.numero}
            </button>
          )}
        </div>
      )}

      {pasos.length > 0 && (
        <div className={s.pilaCierre} data-cierre>
          <p className={s.textoSuave}>{t("PILA.CIERRE")}</p>
          <div className={s.acciones}>
            <button type="button" className={s.boton} onClick={() => lab.avisar(`${t("ACCION.EMPEZAR.DEMO")} (${tituloDe(pasos[0].id)})`)}>
              {t("PILA.EMPEZAR_PRIMERO")}
            </button>
            <button
              type="button"
              className={s.boton}
              onClick={() => {
                lab.seleccionar(pasos[0].id);
                lab.avisar("En el producto, elegir cuándo para el primero llevaría a confirmar un compromiso. En el laboratorio no se confirma nada.");
              }}
            >
              {t("PILA.ELEGIR_CUANDO_PRIMERO")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function impactoAcademico(id: string, incompleto: boolean, temasQueCambian: readonly string[]): string[] {
  const e = entidad(id);
  if (!e || !(e.kind === "WORKITEM" || e.kind === "COMPROMISO")) return [];
  if (incompleto) return ["No mueve el Gantt: falta el prerequisito."];
  if (temasQueCambian.length > 0)
    return temasQueCambian.map((tid) => {
      const tema = TEMAS.find((x) => x.id === tid)!;
      return `${tema.nombre}: pasaría a progreso registrado si se cumple el supuesto.`;
    });
  return [`${t("SIM.NO_MUEVE")}. ${e.impacto.explicacion}`];
}

function describirOtros(esc: Escenario): string {
  const partes: string[] = [];
  for (const id of Object.keys(esc.reubicaciones)) partes.push(`${nombreCorto(id)} reubicada`);
  for (const id of Object.keys(esc.renegociaciones)) partes.push(`${nombreCorto(id)} con horario cambiado`);
  if (esc.agregadas.length) partes.push(`${esc.agregadas.length} excepción de disponibilidad`);
  if (esc.quitadas.length) partes.push(`${esc.quitadas.length} franja quitada`);
  return `${partes.join(" · ")}.`;
}
