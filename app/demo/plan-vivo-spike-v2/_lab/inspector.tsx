"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE — el inspector universal.
 *
 * Responde a lo seleccionado, sea lo que sea. **Seleccionar no simula**: simular
 * es el botón *Simular este workitem*. Lo que no se puede mover **no tiene
 * controles de movimiento** — no deshabilitados: no están.
 */

import { CalendarDays, CheckCircle2, FlaskConical, Lock, X } from "lucide-react";
import { forwardRef, useState } from "react";

import { etiquetaDe, yaPaso } from "./bloque";
import { useLab } from "./contexto";
import {
  CONFIANZA_VISIBLE,
  frasesDeCambio,
  frasesDeIgual,
  frasesTemporales,
  MOTIVO_SIN_UBICAR,
  PRIORIDAD_VISIBLE,
  t,
} from "./copy";
import { aplicar } from "./escenario";
import { MATERIAS, TEMAS } from "./fixture";
import { duracionDe, enHoras, franjaCorta, franjaLarga } from "./formato";
import {
  colocadoDe,
  diferencia,
  entidad,
  huecosParaCompromiso,
  huecosParaPropuesta,
  nombreCorto,
  ocupacionDeVentana,
  porQueNoSeSimula,
  proyectar,
  tituloDe,
  type NoSimulable,
} from "./proyeccion";
import s from "./lab.module.css";
import type { ClaseDelCursado, Compromiso, Evaluacion, Franja, HechoHistorico, VentanaDeDisponibilidad, WorkItem } from "./tipos";

const temaNombre = (id: string) => {
  const tema = TEMAS.find((x) => x.id === id);
  return tema ? `${tema.unidad} · ${tema.nombre}` : id;
};

export const TEXTO_NO_SIMULABLE: Readonly<Record<NoSimulable, string>> = {
  MAXIMO: t("SIM.MAXIMO"),
  YA_EN_ESCENARIO: t("SIM.YA_EN_ESCENARIO"),
  YA_NO_HACE_FALTA: t("SIM.YA_NO_HACE_FALTA"),
  NO_ES_TRABAJO: t("SIM.NO_ES_TRABAJO"),
  SIN_LUGAR: t("SIM.SIN_LUGAR"),
};

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <>
      <dt>{etiqueta}</dt>
      <dd>{children}</dd>
    </>
  );
}

function Seccion({ titulo, children, dato }: { titulo: string; children: React.ReactNode; dato?: string }) {
  return (
    <div className={s.seccion} data-seccion={dato}>
      <h3 className={s.seccionTitulo}>{titulo}</h3>
      {children}
    </div>
  );
}

function Lista({ items }: { items: readonly string[] }) {
  return (
    <ul className={s.lista}>
      {[...new Set(items)].map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

function Inmovil({ texto }: { texto: string }) {
  return (
    <p className={s.inmovil} data-inmovil>
      <Lock size={13} aria-hidden />
      {texto}
    </p>
  );
}

export const Inspector = forwardRef<HTMLHeadingElement>(function Inspector(_, titulo) {
  const lab = useLab();
  const id = lab.seleccion;
  const e = id ? entidad(id) : null;

  return (
    <aside className={`${s.tarjeta} ${s.inspector}`} aria-labelledby="lab-inspector-titulo" id="lab-inspector" data-inspector={e?.kind ?? "VACIO"}>
      <div className={s.inspectorCabecera}>
        <h2 id="lab-inspector-titulo" ref={titulo} tabIndex={-1} className={s.tarjetaTitulo}>
          {e ? tituloDe(e.id) : t("INSPECTOR.TITULO")}
        </h2>
        {e && (
          <button type="button" className={s.botonIcono} onClick={() => lab.seleccionar(null)} aria-label={t("INSPECTOR.CERRAR")}>
            <X size={16} aria-hidden />
          </button>
        )}
      </div>
      {!e && <p className={s.textoSuave}>{t("INSPECTOR.VACIO")}</p>}
      {e?.kind === "WORKITEM" && <InspectorWorkitem w={e} />}
      {e?.kind === "HECHO" && <InspectorHecho h={e} />}
      {e?.kind === "CLASE" && <InspectorClase c={e} />}
      {e?.kind === "EVALUACION" && <InspectorEvaluacion ev={e} />}
      {e?.kind === "COMPROMISO" && <InspectorCompromiso c={lab.mostrada.compromisos[e.id] ?? e} />}
      {e?.kind === "DISPONIBILIDAD" && <InspectorVentana v={e} />}
    </aside>
  );
});

// ── Workitem ──────────────────────────────────────────────────────────────────

export function BotonSimular({ id, compacto = false }: { id: string; compacto?: boolean }) {
  const lab = useLab();
  const motivo = porQueNoSeSimula(lab.escenario, lab.proyeccionDelEscenario, id);
  const previa = {
    onPointerEnter: (ev: React.PointerEvent) => ev.pointerType !== "touch" && ev.pointerType !== "pen" && !motivo && lab.previsualizarPaso(id),
    onPointerLeave: () => lab.previsualizarPaso(null),
    onFocus: () => !motivo && lab.previsualizarPaso(id),
    onBlur: () => lab.previsualizarPaso(null),
  };
  return (
    <>
      <button
        type="button"
        className={compacto ? s.botonChico : s.botonPrimario}
        disabled={motivo !== null}
        aria-describedby={motivo ? `no-simulable-${id}` : undefined}
        data-simular={id}
        onClick={() => lab.pedirSimular(id)}
        {...previa}
      >
        <FlaskConical size={14} aria-hidden />
        {t("ACCION.SIMULAR")}
      </button>
      {motivo && !compacto && (
        <p id={`no-simulable-${id}`} className={s.textoSuave} data-no-simulable={motivo}>
          {TEXTO_NO_SIMULABLE[motivo]}
        </p>
      )}
    </>
  );
}

function SupuestoDeSimulacion() {
  return (
    <details className={s.detalles}>
      <summary>{t("PILA.SUPUESTO")}</summary>
      <p className={s.texto}>{t("SIM.SUPUESTO")}</p>
      <ol className={s.pasos}>
        <li>{t("SIM.PASO.1")}</li>
        <li>{t("SIM.PASO.2")}</li>
        <li>{t("SIM.PASO.3")}</li>
        <li>{t("SIM.PASO.4")}</li>
        <li>{t("SIM.PASO.5")}</li>
      </ol>
      <p className={s.textoSuave}>{t("SIM.NO_ES_COMPLETAR")}</p>
    </details>
  );
}

function InspectorWorkitem({ w }: { w: WorkItem }) {
  const lab = useLab();
  const p = lab.mostrada;
  const c = colocadoDe(p, w.id);
  const intento = p.colocados.find((x) => x.clave === `${w.id}#intento`);
  const retirado = p.retirados.includes(w.id);
  const hechos = new Set([...p.completados, ...p.retirados]);
  const simulable = porQueNoSeSimula(lab.escenario, lab.proyeccionDelEscenario, w.id) === null;

  // Qué cambiaría, calculado sobre el escenario actual: nada se agrega por mirarlo.
  const siSimula = simulable ? proyectar(aplicar(lab.escenario, { tipo: "SIMULAR", id: w.id, override: true })) : null;
  const d = siSimula ? diferencia(lab.proyeccionDelEscenario, siSimula) : null;

  return (
    <div className={s.inspectorCuerpo}>
      <div className={s.chips}>
        <span className={s.chip}>{MATERIAS[w.materia].nombre}</span>
        <span className={s.chip} data-estado-inspector={retirado ? "RETIRADO" : c?.estado}>
          {retirado ? t("SIM.YA_NO_HACE_FALTA") : c ? etiquetaDe(c, p) : "—"}
        </span>
        <span className={s.chip}>Prioridad: {PRIORIDAD_VISIBLE[w.prioridad]}</span>
      </div>
      <dl className={s.datos}>
        <Dato etiqueta="Objetivo">{w.objetivo}</Dato>
        <Dato etiqueta="Por qué esta prioridad">{w.razonDePrioridad}</Dato>
        <Dato etiqueta="Duración">
          {w.duracion.min}–{w.duracion.max} min · probable {w.duracion.probable}
        </Dato>
        <Dato etiqueta="Confianza">
          {CONFIANZA_VISIBLE[w.confianza.nivel]} · fuente: {w.confianza.fuente}
        </Dato>
        {w.evidencia && <Dato etiqueta="Evidencia esperada">{w.evidencia}</Dato>}
        <Dato etiqueta="Dependencias">
          {w.requiere.length === 0
            ? "Ninguna."
            : w.requiere.map((r) => `${tituloDe(r)} (${hechos.has(r) ? "hecho en el escenario" : "pendiente"})`).join(" · ")}
        </Dato>
        <Dato etiqueta="Ubicación">
          {retirado
            ? "Ya no hace falta en este escenario."
            : c?.franja
              ? `${franjaLarga(c.franja)}${c.reubicado ? " · reubicada en el escenario" : ""}`
              : c?.motivoSinUbicar
                ? `Por ubicar: ${MOTIVO_SIN_UBICAR[c.motivoSinUbicar]}.`
                : "—"}
        </Dato>
        {intento?.franja && <Dato etiqueta="Intento simulado">{franjaLarga(intento.franja)} · no constata el tema.</Dato>}
        {w.origen && <Dato etiqueta="Origen">{w.origen}</Dato>}
        {w.noAntesDe && <Dato etiqueta="No antes de">{w.noAntesDe.motivo}</Dato>}
      </dl>

      {w.seRetiraSi && <p className={s.textoSuave}>{w.seRetiraSi.motivo}</p>}

      {!retirado && !p.completados.includes(w.id) && (
        <div className={s.acciones} data-acciones-workitem>
          <BotonSimular id={w.id} />
          <button type="button" className={s.boton} onClick={() => lab.abrirReubicacion(w.id, "REUBICAR")}>
            {t("ACCION.REUBICAR")}
          </button>
          <button type="button" className={s.boton} onClick={() => lab.abrirReubicacion(w.id, "ELEGIR")}>
            {t("ACCION.ELEGIR_CUANDO")}
          </button>
          {lab.proyeccionDelEscenario.recomendada === w.id && (
            <button type="button" className={s.botonTexto} onClick={() => lab.avisar(t("ACCION.EMPEZAR.DEMO"))}>
              {t("ACCION.EMPEZAR")}
            </button>
          )}
        </div>
      )}
      {lab.reubicacion?.id === w.id && <SelectorDeHueco id={w.id} forma={lab.reubicacion.forma} actual={c?.franja ?? null} />}

      {d && siSimula && (
        <Seccion titulo="Si lo simulás" dato="impacto-temporal">
          <Lista items={[...frasesTemporales(lab.proyeccionDelEscenario, siSimula, d), ...frasesDeCambio(lab.proyeccionDelEscenario, siSimula, d).slice(0, 4)]} />
        </Seccion>
      )}
      <Seccion titulo={t("PILA.ACADEMICO")} dato="impacto-academico">
        <p className={s.texto}>
          {w.impacto.temas.map(temaNombre).join(" · ")}
        </p>
        {!w.impacto.produceProgreso && <p className={s.aviso}>{t("SIM.NO_MUEVE")}. {w.impacto.explicacion}</p>}
        {w.impacto.produceProgreso && <p className={s.textoSuave}>{w.impacto.explicacion}</p>}
      </Seccion>
      {d && (
        <Seccion titulo={t("PILA.QUE_IGUAL")}>
          <Lista items={frasesDeIgual(d)} />
        </Seccion>
      )}
      <Seccion titulo="Frente a otras opciones">
        <Lista items={w.alternativas} />
      </Seccion>
      <SupuestoDeSimulacion />
    </div>
  );
}

function SelectorDeHueco({ id, forma, actual }: { id: string; forma: "REUBICAR" | "ELEGIR" | "RENEGOCIAR"; actual: Franja | null }) {
  const lab = useLab();
  const [elegida, setElegida] = useState<Franja | null>(null);
  const busqueda = forma === "RENEGOCIAR" ? huecosParaCompromiso(lab.escenario, id) : huecosParaPropuesta(lab.escenario, id);
  const accion = (f: Franja) => (forma === "RENEGOCIAR" ? ({ tipo: "RENEGOCIAR", id, franja: f } as const) : ({ tipo: "REUBICAR", id, franja: f } as const));
  const titulo = forma === "RENEGOCIAR" ? t("ACCION.CAMBIAR_HORARIO") : forma === "ELEGIR" ? t("ACCION.ELEGIR_CUANDO") : t("ACCION.REUBICAR");

  const cerrar = () => {
    lab.previsualizarAccion(null);
    lab.cerrarReubicacion();
  };

  return (
    <div className={s.selector} role="group" aria-label={titulo} data-selector={forma}>
      <h3 className={s.seccionTitulo}>{titulo}</h3>
      {forma === "ELEGIR" && (
        <p className={s.textoSuave}>En el producto, elegir cuándo llevaría a confirmar un compromiso. Acá sólo lo ubica en el escenario: sigue siendo propuesta.</p>
      )}
      {forma === "REUBICAR" && <p className={s.textoSuave}>Reubicarla no la convierte en compromiso.</p>}
      {forma === "RENEGOCIAR" && (
        <p className={s.textoSuave}>La promesa original se conserva. En el producto, cambiar horario tiene condiciones que este laboratorio no aplica.</p>
      )}
      {busqueda.huecos.length === 0 ? (
        <p className={s.aviso}>No hay otro lugar válido en el escenario.</p>
      ) : (
        <div className={s.huecos}>
          {busqueda.huecos.map((f) => {
            const k = franjaCorta(f);
            const activa = elegida && franjaCorta(elegida) === k;
            return (
              <button
                key={k}
                type="button"
                className={s.hueco}
                aria-pressed={!!activa}
                data-hueco={`${f.dia} ${f.desde}`}
                onClick={() => {
                  setElegida(f);
                  lab.previsualizarAccion(accion(f));
                }}
              >
                {franjaCorta(f)}
              </button>
            );
          })}
        </div>
      )}
      {busqueda.notas.length > 0 && <Lista items={busqueda.notas} />}
      {elegida && (
        <p className={s.texto} data-antes-despues>
          Antes: {actual ? franjaCorta(actual) : "sin lugar"} → Después: {franjaCorta(elegida)}
        </p>
      )}
      <div className={s.acciones}>
        <button
          type="button"
          className={s.botonPrimario}
          disabled={!elegida}
          onClick={() => {
            if (!elegida) return;
            lab.despachar(accion(elegida));
            lab.cambiarPlano("ESCENARIO");
            cerrar();
          }}
        >
          {t("ACCION.CONFIRMAR_ESCENARIO")}
        </button>
        <button type="button" className={s.boton} onClick={cerrar}>
          {t("ACCION.CANCELAR")}
        </button>
      </div>
    </div>
  );
}

// ── Hecho histórico ───────────────────────────────────────────────────────────

function InspectorHecho({ h }: { h: HechoHistorico }) {
  const [detalle, setDetalle] = useState(false);
  return (
    <div className={s.inspectorCuerpo}>
      <div className={s.chips}>
        <span className={s.chip}>{MATERIAS[h.materia].nombre}</span>
        <span className={s.chip}>{t("PLAN.YA_OCURRIO")}</span>
      </div>
      <dl className={s.datos}>
        <Dato etiqueta="Cuándo">{franjaLarga(h.franja)}</Dato>
        <Dato etiqueta="Duración estimada">
          {h.duracionEstimada.min}–{h.duracionEstimada.max} min
        </Dato>
        <Dato etiqueta="Tiempo registrado en Focus">{h.focus ?? enHoras(h.duracionReal)}</Dato>
        <Dato etiqueta="Evidencia enviada">{h.evidencia.descripcion}</Dato>
        <Dato etiqueta="Estado de la evidencia">{h.evidencia.estado === "SUFICIENTE" ? "Suficiente" : "Enviada, sin revisar"}</Dato>
        {h.reflexion && <Dato etiqueta="Reflexión">«{h.reflexion}»</Dato>}
        <Dato etiqueta="Progreso registrado">
          {h.progresoRegistrado ? `${h.progresoRegistrado.temas.map(temaNombre).join(" · ")} · ${h.progresoRegistrado.cuando}` : "No."}
        </Dato>
      </dl>
      {!h.progresoRegistrado && (
        <p className={s.aviso} data-sin-progreso>
          Esta actividad todavía no modificó el progreso académico.
        </p>
      )}
      <Inmovil texto="Ya ocurrió: no se mueve." />
      <button type="button" className={s.boton} aria-expanded={detalle} onClick={() => setDetalle((x) => !x)}>
        {detalle ? t("ACCION.OCULTAR_DETALLE") : t("ACCION.VER_DETALLE")}
      </button>
      {detalle && (
        <div data-detalle-historico className={s.seccion}>
          <Seccion titulo="Impacto que produjo sobre el plan">
            <Lista items={h.impactoEnElPlan} />
          </Seccion>
          <Seccion titulo="Cambio real en el Gantt">
            <p className={s.texto}>{h.cambioEnGantt}</p>
          </Seccion>
        </div>
      )}
    </div>
  );
}

// ── Clase ─────────────────────────────────────────────────────────────────────

function InspectorClase({ c }: { c: ClaseDelCursado }) {
  const lab = useLab();
  const [registro, setRegistro] = useState(false);
  const pasada = yaPaso(c.franja) && c.registro !== null;
  return (
    <div className={s.inspectorCuerpo}>
      <div className={s.chips}>
        <span className={s.chip}>{MATERIAS[c.materia].nombre}</span>
        <span className={s.chip}>{pasada ? "Clase registrada" : "Clase por venir"}</span>
      </div>
      <dl className={s.datos}>
        <Dato etiqueta="Fecha y horario">{franjaLarga(c.franja)}</Dato>
        {c.registro && <Dato etiqueta="Asistencia">{c.registro.asistencia}</Dato>}
        <Dato etiqueta="Comisión">{c.comision}</Dato>
        <Dato etiqueta="Aula">{c.aula}</Dato>
        {c.registro && <Dato etiqueta="Temas confirmados">{c.registro.temasConfirmados.map(temaNombre).join(" · ")}</Dato>}
        {c.esperado && (
          <Dato etiqueta="Temas esperados">
            {c.esperado.temasEsperados.map(temaNombre).join(" · ")} · según el cronograma de la cátedra · pendiente de confirmación
          </Dato>
        )}
        {c.esperado && <Dato etiqueta="Confianza">{CONFIANZA_VISIBLE[c.esperado.confianza]}</Dato>}
        {c.esperado && c.esperado.materialesPrevios.length > 0 && <Dato etiqueta="Materiales previos">{c.esperado.materialesPrevios.join(" · ")}</Dato>}
        <Dato etiqueta="Fuente">{c.fuente}</Dato>
      </dl>
      <Inmovil texto="Horario de la facultad: no se mueve desde el plan." />
      {c.registro ? (
        <>
          <Seccion titulo="Notas">
            <Lista items={c.registro.notas} />
          </Seccion>
          <p className={s.textoSuave}>{c.registro.resumen}</p>
          <Seccion titulo="Acciones generadas">
            <div className={s.acciones}>
              {c.registro.accionesGeneradas.map((a) => (
                <button key={a} type="button" className={s.botonTexto} onClick={() => lab.seleccionar(a)}>
                  {tituloDe(a)}
                </button>
              ))}
            </div>
          </Seccion>
          <button type="button" className={s.boton} aria-expanded={registro} onClick={() => setRegistro((x) => !x)}>
            {t("ACCION.REGISTRO_CLASE")}
          </button>
          {registro && (
            <p className={s.aviso} data-registro-clase>
              Registro simulado: {c.registro.resumen} Apuntes: {c.registro.notas.length}. En el producto se abriría la clase en Modo Clase.
            </p>
          )}
        </>
      ) : (
        <button type="button" className={s.boton} onClick={() => lab.avisar(t("ACCION.MODO_CLASE.DEMO"))}>
          {t("ACCION.MODO_CLASE")}
        </button>
      )}
    </div>
  );
}

// ── Evaluación ────────────────────────────────────────────────────────────────

function InspectorEvaluacion({ ev }: { ev: Evaluacion }) {
  const lab = useLab();
  return (
    <div className={s.inspectorCuerpo}>
      <div className={s.chips}>
        <span className={s.chip}>{MATERIAS[ev.materia].nombre}</span>
        <span className={s.chip}>Evaluación</span>
      </div>
      <dl className={s.datos}>
        <Dato etiqueta="Fecha">{franjaLarga(ev.franja)}</Dato>
        <Dato etiqueta="Modalidad">{ev.modalidad}</Dato>
        <Dato etiqueta="Alcance">
          {ev.alcance.temas.map(temaNombre).join(" · ")} · {ev.alcance.estado === "CONFIRMADO" ? "confirmado" : "provisional"}. {ev.alcance.detalle}
        </Dato>
        <Dato etiqueta="Fuente">{ev.fuente}</Dato>
      </dl>
      <Inmovil texto="La evaluación no se mueve desde el plan." />
      <Seccion titulo="Restricciones">
        <Lista items={ev.restricciones} />
      </Seccion>
      <Seccion titulo="Acciones relacionadas">
        <div className={s.acciones}>
          {ev.accionesRelacionadas.map((a) => (
            <button key={a} type="button" className={s.botonTexto} onClick={() => lab.seleccionar(a)}>
              {nombreCorto(a)}
            </button>
          ))}
        </div>
      </Seccion>
      <Seccion titulo="Modo Examen">
        <p className={s.textoSuave}>{t("ACCION.MODO_EXAMEN.DEMO")}</p>
      </Seccion>
    </div>
  );
}

// ── Compromiso ────────────────────────────────────────────────────────────────

function InspectorCompromiso({ c }: { c: Compromiso }) {
  const lab = useLab();
  const colocado = colocadoDe(lab.mostrada, c.id);
  const simulado = lab.mostrada.completados.includes(c.id);
  return (
    <div className={s.inspectorCuerpo}>
      <div className={s.chips}>
        <span className={s.chip}>{MATERIAS[c.materia].nombre}</span>
        <span className={s.chip} data-estado-inspector={colocado?.estado}>
          {c.estado === "INCUMPLIDO" ? "Incumplido" : simulado ? "Simulado en el escenario" : "Confirmado"}
        </span>
      </div>
      <dl className={s.datos} data-compromiso>
        <Dato etiqueta="Qué se prometió">{c.titulo}</Dato>
        <Dato etiqueta="Día y hora">{franjaLarga(c.franja)}</Dato>
        <Dato etiqueta="Duración">{enHoras(duracionDe(c.franja))}</Dato>
        <Dato etiqueta="Evidencia esperada">{c.evidencia}</Dato>
        <Dato etiqueta="Promesa original">
          <span data-promesa-original>{franjaLarga(c.promesaOriginal)}</span>
        </Dato>
        <Dato etiqueta="Cambios de horario">
          {c.renegociaciones.length === 0 ? (
            "Ninguno."
          ) : (
            <span data-renegociaciones>
              {c.renegociaciones.map((r) => `${franjaCorta(r.antes)} → ${franjaCorta(r.despues)} (${r.registro})`).join(" · ")}
            </span>
          )}
        </Dato>
        <Dato etiqueta="Realizado frente a lo prometido">{c.realizado}</Dato>
      </dl>
      {c.estado === "INCUMPLIDO" && (
        <>
          <p className={s.textoSuave}>El compromiso queda incumplido y no se borra. Su trabajo sigue pendiente como otra propuesta.</p>
          {c.trabajoPendienteId && (
            <div className={s.acciones}>
              <button
                type="button"
                className={s.botonPrimario}
                onClick={() => {
                  lab.seleccionar(c.trabajoPendienteId);
                  lab.abrirReubicacion(c.trabajoPendienteId!, "ELEGIR");
                }}
              >
                Reorganizar sin cortar
              </button>
            </div>
          )}
        </>
      )}
      {c.estado === "CONFIRMADO" && !simulado && (
        <div className={s.acciones}>
          <button type="button" className={s.boton} onClick={() => lab.abrirReubicacion(c.id, "RENEGOCIAR")} data-cambiar-horario>
            {t("ACCION.CAMBIAR_HORARIO")}
          </button>
          <BotonSimular id={c.id} />
        </div>
      )}
      {lab.reubicacion?.id === c.id && <SelectorDeHueco id={c.id} forma="RENEGOCIAR" actual={c.franja} />}
      <button type="button" className={s.botonTexto} onClick={() => lab.cambiarVista(lab.vista === "PLAN" ? "CALENDARIO" : "PLAN")}>
        <CalendarDays size={14} aria-hidden />
        {lab.vista === "PLAN" ? t("ACCION.VER_EN_CALENDARIO") : t("ACCION.VER_EN_PLAN")}
      </button>
      <Seccion titulo={t("PILA.ACADEMICO")}>
        <p className={s.textoSuave}>{c.impacto.explicacion}</p>
      </Seccion>
    </div>
  );
}

// ── Disponibilidad ────────────────────────────────────────────────────────────

function InspectorVentana({ v }: { v: VentanaDeDisponibilidad }) {
  const lab = useLab();
  const quitada = lab.escenarioMostrado.quitadas.includes(v.id);
  const presente = lab.mostrada.ventanas.some((x) => x.ventana.id === v.id);
  const o = ocupacionDeVentana(lab.mostrada, v.id);
  return (
    <div className={s.inspectorCuerpo}>
      <div className={s.chips}>
        <span className={s.chip}>{t("INDICADOR.DISPONIBLE")}</span>
        <span className={s.chip}>{v.origen === "EXCEPCION" ? "Excepción" : "Recurrente"}</span>
      </div>
      <dl className={s.datos}>
        <Dato etiqueta="Origen">{v.origen === "EXCEPCION" ? `Excepción · ${v.detalle}` : `Recurrente · ${v.detalle}`}</Dato>
        <Dato etiqueta="Franja">{franjaLarga(v.franja)}</Dato>
        {presente && <Dato etiqueta="Duración útil">{o.utiles === 0 ? "Ya pasó." : enHoras(o.utiles)}</Dato>}
        {presente && (
          <Dato etiqueta="Qué trabajo la ocupa">{o.colocados.length === 0 ? "Nada." : o.colocados.map((x) => tituloDe(x.id)).join(" · ")}</Dato>
        )}
        {presente && <Dato etiqueta="Tiempo ocupado">{enHoras(o.ocupado)}</Dato>}
        {presente && <Dato etiqueta="Margen restante">{enHoras(o.margen)}</Dato>}
      </dl>
      {quitada && <p className={s.aviso}>Quitada en el escenario. Tu plan real la conserva.</p>}
      <p className={s.textoSuave}>{t("DISP.NO_ES_PROGRESO")}</p>
      {presente && o.utiles > 0 && (
        <div className={s.acciones}>
          <button type="button" className={s.boton} onClick={() => lab.pedirQuitarVentana(v.id)} data-quitar-ventana>
            {t("DISP.QUITAR")}
          </button>
        </div>
      )}
      {(lab.escenario.quitadas.length > 0 || lab.escenario.agregadas.length > 0) && (
        <button type="button" className={s.botonTexto} onClick={() => lab.despachar({ tipo: "RESTABLECER_DISPONIBILIDAD" })}>
          <CheckCircle2 size={14} aria-hidden />
          {t("DISP.RESTABLECER")}
        </button>
      )}
    </div>
  );
}
