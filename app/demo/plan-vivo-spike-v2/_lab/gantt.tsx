"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE — el Gantt académico, real frente a simulado.
 *
 * Tres pistas por materia, **en temas**, nunca en porcentajes:
 *
 * - **Cátedra**: la clase dada con información registrada, o esperada según el
 *   cronograma (con otro trazo, fuente y confianza).
 * - **Vos hoy**: progreso registrado. **Una simulación nunca la mueve.**
 * - **Si cumplís este escenario**: lo registrado más lo que el escenario supone.
 *
 * Sin readiness, sin probabilidad de aprobar, sin *"dominio"*.
 */

import { Check, CircleDashed, FlaskConical, Hourglass } from "lucide-react";

import { useLab } from "./contexto";
import { t } from "./copy";
import { MATERIAS, TEMAS, WORKITEMS } from "./fixture";
import { entidad, nombreCorto } from "./proyeccion";
import s from "./lab.module.css";
import type { LabMateriaId, Proyeccion, Tema } from "./tipos";

const ORDEN_MATERIAS: readonly LabMateriaId[] = ["ANALISIS", "ECONOMIA", "ARQUITECTURA"];

/** El último tema de una racha desde el primero que cumple la condición. */
function hasta(temas: readonly Tema[], cumple: (t: Tema) => boolean): Tema | null {
  let ultimo: Tema | null = null;
  for (const tema of temas) {
    if (!cumple(tema)) break;
    ultimo = tema;
  }
  return ultimo;
}

export function frasesDelGantt(materia: LabMateriaId, p: Proyeccion): { catedra: string; vos: string; escenario: string } {
  const temas = TEMAS.filter((x) => x.materia === materia);
  const catedra = hasta(temas, (x) => x.catedra.estado === "DADA");
  const vos = hasta(temas, (x) => x.vos === "PROGRESO_REGISTRADO");
  const esc = hasta(temas, (x) => p.temasEnEscenario[x.id] !== "SIN_CAMBIO");
  const simulados = temas.filter((x) => p.temasEnEscenario[x.id] === "SIMULADO");
  const contiguos = esc !== null && simulados.every((x) => temas.indexOf(x) <= temas.indexOf(esc));
  return {
    catedra: catedra ? `La cátedra llegó hasta ${catedra.nombre}.` : "La cátedra todavía no dio estas unidades.",
    vos: vos ? `Vos tenés progreso registrado hasta ${vos.nombre}.` : "Vos todavía no tenés progreso registrado en estas unidades.",
    escenario:
      simulados.length === 0
        ? "Si cumplís este escenario… no cambia."
        : contiguos
          ? `Si cumplís este escenario… llegarías hasta ${esc!.nombre}.`
          : `Si cumplís este escenario… sumarías ${simulados.map((x) => x.nombre).join(" y ")}, sin progreso registrado en las unidades anteriores.`,
  };
}

/** Qué temas resaltar y qué decir, según lo que se mira. */
export function lecturaDelGantt(id: string | null, p: Proyeccion): { temas: string[]; nota: string | null } {
  const e = id ? entidad(id) : null;
  if (!e) return { temas: [], nota: null };
  const nombre = (tid: string) => TEMAS.find((x) => x.id === tid)?.nombre ?? tid;
  switch (e.kind) {
    case "WORKITEM": {
      const temas = [...e.impacto.temas];
      if (p.pasos.some((x) => x.id === e.id && x.incompleto && !x.sinLugar))
        return { temas, nota: "Simulado sin su prerequisito: no mueve el Gantt ni desbloquea lo que depende de él." };
      if (!e.impacto.produceProgreso) return { temas, nota: `${t("SIM.NO_MUEVE")}. ${e.impacto.explicacion}` };
      const partes: string[] = [];
      for (const tid of temas) {
        const tema = TEMAS.find((x) => x.id === tid)!;
        partes.push(
          tema.catedra.estado === "DADA" && tema.vos !== "PROGRESO_REGISTRADO"
            ? `Cierra la brecha con la cátedra en ${tema.nombre}.`
            : tema.catedra.estado === "ESPERADA"
              ? `Sumaría ${tema.nombre}, que la cátedra todavía no dio: supone que la clase se da según el cronograma.`
              : `Suma progreso en ${tema.nombre}.`,
        );
      }
      const dependientes = WORKITEMS.filter((w) => w.requiere.includes(e.id));
      if (dependientes.length) partes.push(`Desbloquea ${dependientes.map((w) => nombreCorto(w.id)).join(" y ")}.`);
      partes.push("Sólo con evidencia suficiente.");
      return { temas, nota: partes.join(" ") };
    }
    case "COMPROMISO":
      return { temas: [...e.impacto.temas], nota: e.impacto.explicacion };
    case "CLASE":
      return e.registro
        ? { temas: [...e.registro.temasConfirmados], nota: `Clase dada y registrada: confirma ${e.registro.temasConfirmados.map(nombre).join(" y ")} en la pista de la cátedra.` }
        : { temas: [...(e.esperado?.temasEsperados ?? [])], nota: `Clase esperada: ${e.esperado?.temasEsperados.map(nombre).join(" y ")}, según el cronograma de la cátedra, pendiente de confirmación.` };
    case "EVALUACION":
      return { temas: [...e.alcance.temas], nota: `El parcial abarca ${e.alcance.temas.map(nombre).join(", ")}. Alcance ${e.alcance.estado === "CONFIRMADO" ? "confirmado" : "provisional"}.` };
    case "HECHO":
      return {
        temas: [...e.temas],
        nota: e.progresoRegistrado ? `Movió el Gantt de verdad: ${e.cambioEnGantt}` : "Esta actividad todavía no modificó el progreso académico.",
      };
    default:
      return { temas: [], nota: null };
  }
}

export function Gantt() {
  const lab = useLab();
  const p = lab.mostrada;
  const mirado = lab.vistaPrevia?.tipo === "PASO" ? lab.vistaPrevia.id : lab.seleccion;
  const { temas: resaltados, nota } = lecturaDelGantt(mirado, p);

  return (
    <section className={`${s.tarjeta} ${s.gantt}`} aria-labelledby="lab-gantt-titulo" data-gantt>
      <div>
        <h2 id="lab-gantt-titulo" className={s.tarjetaTitulo}>
          {t("GANTT.TITULO")}
        </h2>
        <p className={s.textoSuave}>{t("GANTT.BAJADA")}</p>
      </div>
      {nota && (
        <p className={s.ganttNota} data-gantt-nota aria-live="polite">
          {nota}
        </p>
      )}
      {ORDEN_MATERIAS.map((m) => {
        const temas = TEMAS.filter((x) => x.materia === m);
        const frases = frasesDelGantt(m, p);
        return (
          <div key={m} className={s.ganttMateria} style={{ ["--lab-materia" as string]: MATERIAS[m].color }} data-gantt-materia={m}>
            <h3 className={s.ganttMateriaTitulo}>
              <span className={s.ganttMarca} aria-hidden />
              {MATERIAS[m].nombre}
            </h3>
            <ul className={s.ganttFrases}>
              <li data-frase="catedra">{frases.catedra}</li>
              <li data-frase="vos">{frases.vos}</li>
              <li data-frase="escenario">{frases.escenario}</li>
            </ul>
            <div className={s.ganttScroll}>
              <table className={s.ganttTabla}>
                <caption className={s.soloLectores}>Gantt de {MATERIAS[m].nombre}</caption>
                <thead>
                  <tr>
                    <th scope="col">Pista</th>
                    {temas.map((tema) => (
                      <th key={tema.id} scope="col">
                        {tema.unidad} · {tema.nombre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr data-pista="catedra">
                    <th scope="row">{t("GANTT.CATEDRA")}</th>
                    {temas.map((tema) => (
                      <td
                        key={tema.id}
                        className={[s.ganttCelda, tema.catedra.estado === "DADA" ? s.ganttDada : s.ganttEsperada, resaltados.includes(tema.id) ? s.ganttResaltado : ""].join(" ")}
                        data-gantt-tema={tema.id}
                        data-estado-pista={tema.catedra.estado}
                      >
                        {tema.catedra.estado === "DADA" ? <Check size={11} aria-hidden /> : <CircleDashed size={11} aria-hidden />}{" "}
                        {tema.catedra.estado === "DADA" ? `Dada · ${tema.catedra.cuando}` : `Esperada · ${tema.catedra.cuando} · confianza ${tema.catedra.confianza}`}
                      </td>
                    ))}
                  </tr>
                  <tr data-pista="vos">
                    <th scope="row">{t("GANTT.VOS")}</th>
                    {temas.map((tema) => (
                      <td
                        key={tema.id}
                        className={[
                          s.ganttCelda,
                          tema.vos === "PROGRESO_REGISTRADO" ? s.ganttLleno : tema.vos === "EVIDENCIA_SIN_PROGRESO" ? s.ganttEvidencia : "",
                          resaltados.includes(tema.id) ? s.ganttResaltado : "",
                        ].join(" ")}
                        data-gantt-tema={tema.id}
                        data-estado-pista={tema.vos}
                      >
                        {tema.vos === "PROGRESO_REGISTRADO" ? (
                          <>
                            <Check size={11} aria-hidden /> Progreso registrado
                          </>
                        ) : tema.vos === "EVIDENCIA_SIN_PROGRESO" ? (
                          <>
                            <Hourglass size={11} aria-hidden /> Evidencia enviada · sin progreso
                          </>
                        ) : (
                          "Sin progreso registrado"
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr data-pista="escenario">
                    <th scope="row">{t("GANTT.ESCENARIO")}</th>
                    {temas.map((tema) => {
                      const e = p.temasEnEscenario[tema.id];
                      return (
                        <td
                          key={tema.id}
                          className={[s.ganttCelda, e === "PROGRESO_REGISTRADO" ? s.ganttLleno : e === "SIMULADO" ? s.ganttSimulado : "", resaltados.includes(tema.id) ? s.ganttResaltado : ""].join(" ")}
                          data-gantt-tema={tema.id}
                          data-estado-pista={e}
                        >
                          {e === "PROGRESO_REGISTRADO" ? (
                            <>
                              <Check size={11} aria-hidden /> Registrado
                            </>
                          ) : e === "SIMULADO" ? (
                            <>
                              <FlaskConical size={11} aria-hidden /> Simulado
                            </>
                          ) : (
                            "Sin cambio"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      <p className={s.textoSuave}>{t("GANTT.SIN_READINESS")}</p>
    </section>
  );
}
