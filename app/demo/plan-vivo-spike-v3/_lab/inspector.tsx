"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE V3 — el inspector contextual.
 *
 * Cambia según el origen del bloque. Muestra **sólo las acciones que corresponden
 * al estado actual**, y ninguna cifra que no salga de la proyección.
 */

import { CalendarCheck, CalendarClock, FlaskConical, Lock, Undo2, X } from "lucide-react";
import { forwardRef } from "react";

import { MedidorDePrioridad } from "./bandeja";
import { useLab } from "./contexto";
import { explicarPaso } from "./explicacion";
import { ACCIONES, CLASES, COMPROMISOS, EVALUACIONES, MATERIAS, NOMBRE_DE_PRIORIDAD, REGISTROS, TEMAS, instanteDe } from "./fixture";
import { deArticulo, enHoras, horaDe, instante, tramoMedio } from "./formato";
import { accion, evaluacion, margenAntesDe, mundoDe, ocupaciones, seSuperponen } from "./motor";
import { relacionDeFecha } from "./presentacion";
import s from "./lab.module.css";
import type { Accion, Clase, CompromisoVivo, Evaluacion, Registro } from "./tipos";

const nombreDeTema = (id: string) => {
  const t = TEMAS.find((x) => x.id === id);
  return t ? `${t.codigo} · ${t.nombre}` : id;
};
const conY = (xs: readonly string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);

export const Inspector = forwardRef<HTMLHeadingElement>(function Inspector(_, ref) {
  const lab = useLab();
  const id = lab.seleccion;
  let contenido: React.ReactNode;
  if (!id) contenido = <SinSeleccion />;
  else if (ACCIONES.some((a) => a.id === id)) {
    const c = lab.estado.compromisos.find((x) => x.accionId === id && x.estado !== "INCUMPLIDO");
    contenido = c && !lab.mostrada.simuladas.includes(id) ? <DeCompromiso c={c} tituloRef={ref} /> : <DeAccion a={accion(id)!} tituloRef={ref} />;
  } else if (lab.estado.compromisos.some((c) => c.id === id)) contenido = <DeCompromiso c={lab.estado.compromisos.find((c) => c.id === id)!} tituloRef={ref} />;
  else if (CLASES.some((c) => c.id === id)) contenido = <DeClase c={CLASES.find((c) => c.id === id)!} tituloRef={ref} />;
  else if (EVALUACIONES.some((e) => e.id === id)) contenido = <DeEvaluacion e={EVALUACIONES.find((e) => e.id === id)!} tituloRef={ref} />;
  else if (REGISTROS.some((r) => r.id === id)) contenido = <DeRegistro r={REGISTROS.find((r) => r.id === id)!} tituloRef={ref} />;
  else contenido = <SinSeleccion />;

  return (
    <aside id="lab3-inspector" className={`${s.tarjeta} ${s.inspector}`} aria-label="Inspector" data-inspector data-seleccion={id ?? ""}>
      {contenido}
    </aside>
  );
});

function Cabecera({ materia, eyebrow, titulo, tituloRef }: { materia: Accion["materia"] | null; eyebrow: string; titulo: string; tituloRef: React.Ref<HTMLHeadingElement> }) {
  const lab = useLab();
  return (
    <div className={s.inspectorCabecera} style={materia ? { ["--m" as string]: MATERIAS[materia].color } : undefined}>
      <div>
        <span className={s.eyebrow}>
          {materia && <span className={s.marca} aria-hidden />}
          {eyebrow}
        </span>
        <h2 id="lab3-inspector-titulo" ref={tituloRef} tabIndex={-1} className={s.inspectorTitulo} data-inspector-titulo>
          {titulo}
        </h2>
      </div>
      <button type="button" className={`${s.boton} ${s.cerrar}`} onClick={() => lab.seleccionar(null)} aria-label="Cerrar el inspector">
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}

function SinSeleccion() {
  const lab = useLab();
  const p = lab.mostrada;
  const proxima = p.pendientes.find((id) => p.posiciones[id]?.tipo !== "SIN_LUGAR") ?? null;
  const a = proxima ? accion(proxima)! : null;
  const pos = proxima ? p.posiciones[proxima] : null;
  return (
    <>
      <div>
        <span className={s.eyebrow}>Inspector</span>
        <h2 id="lab3-inspector-titulo" tabIndex={-1} className={s.inspectorTitulo}>
          Seleccioná un bloque o una acción
        </h2>
      </div>
      <p className={s.textoSuave}>Clic o Enter sobre cualquier cosa del calendario o de la bandeja para ver qué es, de dónde sale y qué se puede hacer.</p>
      {a && pos && pos.tipo !== "SIN_LUGAR" && (
        <div className={s.bloqueInspector} data-proxima={a.id}>
          <h3>Lo más prioritario sin compromiso</h3>
          <p>
            <strong>{a.titulo}</strong> · {MATERIAS[a.materia].corto} · {a.duracion.probable} min · prioridad {NOMBRE_DE_PRIORIDAD[a.prioridad].toLowerCase()}
          </p>
          <p className={s.textoSuave}>
            {pos.tipo === "UBICADA" ? "Ubicada" : "Sugerida"} el {tramoMedio(pos.ini, pos.fin)} · {a.razonCorta}
          </p>
          <div className={s.acciones}>
            <button type="button" className={s.botonPrimario} onClick={() => lab.seleccionar(a.id)}>
              Ver la acción
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function porQueAca(mundo: ReturnType<typeof mundoDe>, a: Accion, ini: number, fin: number): string {
  const partes = ["entra completa"];
  if (a.convieneAntesDe && fin <= instante(a.convieneAntesDe.fecha, a.convieneAntesDe.hora)) partes.push(`ocurre antes de ${a.convieneAntesDe.motivo}`);
  if (a.noAntesDe) partes.push(`queda después de ${a.noAntesDe.motivo.split(" se dan en ")[1] ?? "la clase que da el tema"}`);
  if (a.antesDe) {
    const margen = margenAntesDe({ ...mundo, ubicaciones: { ...mundo.ubicaciones, [a.id]: { ini, duracion: fin - ini } } }, a.antesDe);
    partes.push(`conserva ${enHoras(margen)} de margen antes ${deArticulo(evaluacion(a.antesDe)!.corto)}`);
  }
  return `Te conviene ubicarla acá porque ${conY(partes)}.`;
}

function DeAccion({ a, tituloRef }: { a: Accion; tituloRef: React.Ref<HTMLHeadingElement> }) {
  const lab = useLab();
  const p = lab.mostrada;
  const pos = p.posiciones[a.id];
  const real = lab.plano === "REAL";
  const mundo = mundoDe(lab.estado);
  const pasoSimulado = p.pasos.find((x) => x.accionId === a.id && x.bloqueo === null) ?? null;
  const retirada = p.retiradas.includes(a.id);
  const conHorario = pos && pos.tipo !== "SIN_LUGAR" ? pos : pasoSimulado && pasoSimulado.ini !== null ? { ini: pasoSimulado.ini, fin: pasoSimulado.fin! } : null;
  const desbloquea = ACCIONES.filter((x) => x.requiere.includes(a.id));
  const esUltimo = pasoSimulado && p.pasos[p.pasos.length - 1]?.accionId === a.id && lab.anterior;

  let maximo: string | null = null;
  if (conHorario) {
    const finMax = conHorario.ini + a.duracion.max;
    const choca = ocupaciones(mundo, { accionId: a.id }).find((o) => o.ini < finMax && o.fin > conHorario.fin && seSuperponen({ ini: conHorario.fin, fin: finMax }, o));
    maximo = `Terminaría a las ${horaDe(finMax)}${choca ? ` y se superpondría con «${choca.titulo}»` : " y no se superpone con nada"}.`;
  }

  return (
    <>
      <Cabecera materia={a.materia} eyebrow={`${MATERIAS[a.materia].nombre} · ${a.tipo}`} titulo={a.titulo} tituloRef={tituloRef} />

      <p className={`${s.recuadro} ${pasoSimulado || lab.plano === "ESCENARIO" ? s.recuadroEscenario : ""}`} data-estado-accion>
        {pasoSimulado
          ? `Simulada · paso ${pasoSimulado.numero} · ${tramoMedio(pasoSimulado.ini!, pasoSimulado.fin!)}. Hipotético: no pasó.`
          : retirada
            ? `Ya no hace falta en el escenario. ${a.seRetiraSi?.motivo ?? ""}`
            : pos?.tipo === "UBICADA"
              ? `Propuesta ubicada · ${tramoMedio(pos.ini, pos.fin)}. Todavía no es un compromiso.`
              : pos?.tipo === "SUGERIDA"
                ? `Por ubicar. Achieve la sugiere el ${tramoMedio(pos.ini, pos.fin)}.`
                : "Por ubicar. No tiene un hueco donde entre completa esta semana."}
      </p>

      <dl className={s.datos}>
        <dt>Tema</dt>
        <dd>{nombreDeTema(a.tema)}</dd>
        <dt>Duración</dt>
        <dd>
          mínimo {a.duracion.min} · probable {a.duracion.probable} · máximo {a.duracion.max} min
        </dd>
        <dt>Confianza</dt>
        <dd>
          {a.confianza.nivel} · {a.confianza.fuente}
        </dd>
        {maximo && (
          <>
            <dt>Si usa el máximo</dt>
            <dd data-si-maximo>{maximo}</dd>
          </>
        )}
        <dt>Prioridad</dt>
        <dd className={s.prioridad}>
          <MedidorDePrioridad prioridad={a.prioridad} /> {NOMBRE_DE_PRIORIDAD[a.prioridad]} · {a.razonCorta}
        </dd>
        <dt>Evidencia esperada</dt>
        <dd>{a.evidencia}</dd>
        <dt>Fecha relacionada</dt>
        <dd>{relacionDeFecha(a) ?? "Sin fecha esta semana"}</dd>
        <dt>Prerrequisitos</dt>
        <dd>{a.requiere.length ? a.requiere.map((r) => `${accion(r)!.titulo}${p.simuladas.includes(r) ? " (simulada)" : ""}`).join(", ") : "Ninguno"}</dd>
        <dt>Qué desbloquea</dt>
        <dd>{desbloquea.length ? desbloquea.map((x) => x.titulo).join(", ") : a.seRetiraSi ? "Nada: es condicional" : "Nada directamente"}</dd>
        {a.origen && (
          <>
            <dt>Origen</dt>
            <dd>{a.origen}</dd>
          </>
        )}
      </dl>

      {real && pos?.tipo === "SUGERIDA" && (
        <div className={s.bloqueInspector} data-sugerencia>
          <h3>Ubicación sugerida · {tramoMedio(pos.ini, pos.fin)}</h3>
          <p>{porQueAca(mundo, a, pos.ini, pos.fin)}</p>
          <p className={s.textoSuave}>Podés aceptarla, moverla, ignorarla o elegir otro horario.</p>
        </div>
      )}

      <div className={s.bloqueInspector}>
        <h3>Por qué esta acción</h3>
        <ul className={s.lista}>
          {a.razones.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {a.alternativas.length > 0 && (
          <>
            <h3>Frente a otras</h3>
            <ul className={s.lista}>
              {a.alternativas.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {!pasoSimulado && !retirada && (
        <div className={s.acciones} data-acciones-inspector>
          {real && pos?.tipo === "SUGERIDA" && (
            <button type="button" className={s.botonPrimario} onClick={() => lab.aceptarSugerida(a.id)}>
              <CalendarCheck size={14} aria-hidden /> Aceptar horario sugerido
            </button>
          )}
          {real && pos?.tipo === "UBICADA" && pos.ini >= p.ahora && (
            <button type="button" className={s.botonPrimario} onClick={() => lab.abrir({ tipo: "COMPROMETER", accionId: a.id })}>
              <CalendarCheck size={14} aria-hidden /> Comprometerme
            </button>
          )}
          {real && (
            <button type="button" className={s.boton} onClick={() => lab.abrir({ tipo: "ELEGIR", accionId: a.id, compromisoId: null })}>
              <CalendarClock size={14} aria-hidden /> Elegir horario
            </button>
          )}
          <button type="button" className={s.boton} onClick={() => lab.pedirSimular(a.id)} data-simular={a.id}>
            <FlaskConical size={14} aria-hidden /> Simular impacto
          </button>
          {real && pos?.tipo === "UBICADA" && (
            <button type="button" className={s.botonTexto} onClick={() => lab.devolver(a.id)}>
              <Undo2 size={14} aria-hidden /> Devolver a Acciones por ubicar
            </button>
          )}
        </div>
      )}
      {!real && !pasoSimulado && <p className={s.textoSuave}>Para ubicarla o comprometerte, volvé a Plan real: el escenario no escribe.</p>}

      <div className={`${s.recuadro} ${s.recuadroEscenario}`}>
        <strong>{pasoSimulado ? "Qué supone esta simulación" : "Si la simulás"}</strong>
        <ol className={s.lista}>
          <li>La acción se realiza en {conHorario ? `el horario indicado (${tramoMedio(conHorario.ini, conHorario.fin)})` : "el horario indicado"}.</li>
          <li>La evidencia resulta suficiente.</li>
          <li>{a.recorrido ? "Se registra el progreso académico correspondiente." : a.explicacionRecorrido}</li>
          <li>El Plan Engine recalcula el escenario.</li>
        </ol>
        <span>Esto es una simulación. No modifica tu plan real.</span>
      </div>

      {esUltimo && (
        <div className={s.bloqueInspector} data-que-cambio>
          <h3>Qué cambió con este paso</h3>
          <ul className={s.lista}>
            {explicarPaso(lab.anterior!, p, a.id).map((l) => (
              <li key={l.texto}>{l.texto}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

const ESTADO_DE_COMPROMISO = { CONFIRMADO: "Confirmado", EN_CURSO: "Focus en curso", INCUMPLIDO: "Incumplido" } as const;

function DeCompromiso({ c, tituloRef }: { c: CompromisoVivo; tituloRef: React.Ref<HTMLHeadingElement> }) {
  const lab = useLab();
  const a = accion(c.accionId)!;
  const real = lab.plano === "REAL";
  const delFixture = COMPROMISOS.find((x) => x.id === c.id);
  const futuro = c.ini >= lab.estado.ahora;
  return (
    <>
      <Cabecera materia={a.materia} eyebrow={`${MATERIAS[a.materia].nombre} · Compromiso`} titulo={a.titulo} tituloRef={tituloRef} />
      <p className={s.recuadro} data-estado-compromiso={c.estado}>
        {c.estado === "CONFIRMADO" && "Compromiso confirmado: día, hora, duración y evidencia. Cambia de horario sólo con renegociación explícita."}
        {c.estado === "EN_CURSO" && `Focus en curso desde las ${horaDe(c.focusDesde ?? c.ini)}. No se mueve mientras está en curso.`}
        {c.estado === "INCUMPLIDO" && "Quedó incumplido y no se edita para parecer cumplido. El trabajo sigue pendiente en Acciones por ubicar."}
      </p>
      <dl className={s.datos}>
        <dt>Estado</dt>
        <dd>{ESTADO_DE_COMPROMISO[c.estado]}</dd>
        <dt>Horario</dt>
        <dd>{tramoMedio(c.ini, c.fin)}</dd>
        <dt>Duración</dt>
        <dd>
          {c.fin - c.ini} min · la acción estima {a.duracion.min}–{a.duracion.max}
        </dd>
        <dt>Evidencia esperada</dt>
        <dd>{c.evidencia}</dd>
        <dt>Confirmado</dt>
        <dd>{delFixture ? delFixture.confirmadoEl : "en este laboratorio, localmente"}</dd>
        <dt>Promesa original</dt>
        <dd>{tramoMedio(c.promesaOriginal.ini, c.promesaOriginal.fin)}</dd>
        <dt>Progreso</dt>
        <dd>Ninguno: comprometerse no es avanzar.</dd>
      </dl>
      {c.cambios.length > 0 && (
        <div className={s.bloqueInspector}>
          <h3>Cambios de horario</h3>
          <ul className={s.lista}>
            {c.cambios.map((x, i) => (
              <li key={i}>
                De {tramoMedio(x.antes.ini, x.antes.fin)} a {tramoMedio(x.despues.ini, x.despues.fin)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={s.acciones}>
        {real && c.estado === "CONFIRMADO" && futuro && (
          <button type="button" className={s.boton} onClick={() => lab.abrir({ tipo: "ELEGIR", accionId: null, compromisoId: c.id })}>
            <CalendarClock size={14} aria-hidden /> Cambiar horario
          </button>
        )}
        {c.estado !== "INCUMPLIDO" && (
          <button type="button" className={s.boton} onClick={() => lab.pedirSimular(a.id)} data-simular={a.id}>
            <FlaskConical size={14} aria-hidden /> Simular impacto
          </button>
        )}
        {c.estado === "INCUMPLIDO" && real && lab.estado.relojAdelantado && (
          <button type="button" className={s.botonPrimario} onClick={() => lab.abrir({ tipo: "REORGANIZAR" })}>
            Reorganizar sin cortar
          </button>
        )}
        {c.estado === "INCUMPLIDO" && (
          <button type="button" className={s.botonTexto} onClick={() => lab.seleccionar(a.id)}>
            Ver el trabajo pendiente
          </button>
        )}
      </div>
    </>
  );
}

function DeClase({ c, tituloRef }: { c: Clase; tituloRef: React.Ref<HTMLHeadingElement> }) {
  const lab = useLab();
  const { ini, fin } = instanteDe(c.tramo);
  const cursada = fin <= lab.mostrada.ahora;
  return (
    <>
      <Cabecera materia={c.materia} eyebrow={`${MATERIAS[c.materia].nombre} · Clase`} titulo={c.titulo} tituloRef={tituloRef} />
      <p className={s.recuadro}>
        <Lock size={12} aria-hidden /> Horario de la cátedra: no se mueve desde el plan.
      </p>
      <dl className={s.datos}>
        <dt>Comisión</dt>
        <dd>{MATERIAS[c.materia].comision}</dd>
        <dt>Horario</dt>
        <dd>{tramoMedio(ini, fin)}</dd>
        <dt>Aula</dt>
        <dd>{c.aula}</dd>
        <dt>Estado</dt>
        <dd>{cursada ? "Cursada" : "Próxima"}</dd>
        <dt>{cursada && c.registro ? "Temas confirmados" : "Temas previstos"}</dt>
        <dd>{c.temas.map(nombreDeTema).join(", ")}</dd>
        <dt>Fuente</dt>
        <dd>{c.fuente}</dd>
      </dl>
      {cursada && c.registro && (
        <div className={s.bloqueInspector}>
          <h3>Registro de la clase</h3>
          <p>{c.registro.asistencia}</p>
          <ul className={s.lista}>
            {c.registro.notas.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
      {cursada && !c.registro && <p className={s.textoSuave}>No hay registro de esta clase en el laboratorio.</p>}
      <div className={s.acciones}>
        <button
          type="button"
          className={s.boton}
          onClick={() => lab.abrir({ tipo: "AVISO", titulo: "Abrir la clase", texto: "En el producto esto abre Modo Clase de esta clase. El laboratorio no navega ni vuelve a implementarlo." })}
        >
          {cursada ? "Abrir el registro de la clase" : "Abrir la clase"}
        </button>
      </div>
    </>
  );
}

function DeEvaluacion({ e, tituloRef }: { e: Evaluacion; tituloRef: React.Ref<HTMLHeadingElement> }) {
  const lab = useLab();
  const p = lab.mostrada;
  const relacionadas = ACCIONES.filter((a) => a.antesDe === e.id && (p.pendientes.includes(a.id) || lab.estado.compromisos.some((c) => c.accionId === a.id && c.estado !== "INCUMPLIDO" && !p.simuladas.includes(a.id))));
  const margen = p.margenes.find((m) => m.evaluacionId === e.id);
  const { ini, fin } = instanteDe(e.tramo);
  return (
    <>
      <Cabecera materia={e.materia} eyebrow={`${MATERIAS[e.materia].nombre} · Evaluación`} titulo={e.titulo} tituloRef={tituloRef} />
      <p className={s.recuadro}>
        <Lock size={12} aria-hidden /> Fecha fija: el plan se acomoda a ella, nunca al revés.
      </p>
      <dl className={s.datos}>
        <dt>Fecha</dt>
        <dd>{tramoMedio(ini, fin)}</dd>
        <dt>Modalidad</dt>
        <dd>{e.modalidad}</dd>
        <dt>Alcance</dt>
        <dd>
          {e.alcance.map(nombreDeTema).join(", ")}. {e.alcanceDetalle}
        </dd>
        <dt>Fuente</dt>
        <dd>{e.fuente}</dd>
        <dt>Confianza</dt>
        <dd>{e.confianza}</dd>
        <dt>Tiempo pendiente</dt>
        <dd data-pendiente-evaluacion>
          {enHoras(relacionadas.reduce((suma, a) => suma + a.duracion.probable, 0))} en {relacionadas.length} acciones
        </dd>
        {margen && (
          <>
            <dt>Margen antes</dt>
            <dd className={margen.minutos < 0 ? s.negativo : undefined}>{enHoras(margen.minutos)}</dd>
          </>
        )}
      </dl>
      {relacionadas.length > 0 && (
        <div className={s.bloqueInspector}>
          <h3>Trabajo que tiene que ocurrir antes</h3>
          <ul className={s.lista}>
            {relacionadas.map((a) => (
              <li key={a.id}>
                <button type="button" className={s.botonTexto} onClick={() => lab.seleccionar(a.id)}>
                  {a.titulo}
                </button>{" "}
                · {a.duracion.probable} min
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

const REVISION = {
  SIN_EVIDENCIA_REQUERIDA: "No pedía evidencia",
  SIN_REVISAR: "Enviada, todavía sin revisar",
  SUFICIENTE: "Validada: suficiente",
  INSUFICIENTE: "Revisada: no alcanzó, con pedido de reenvío",
} as const;

function DeRegistro({ r, tituloRef }: { r: Registro; tituloRef: React.Ref<HTMLHeadingElement> }) {
  const lab = useLab();
  const { ini, fin } = instanteDe(r.tramo);
  return (
    <>
      <Cabecera materia={r.materia} eyebrow={`${MATERIAS[r.materia].nombre} · Ya ocurrió`} titulo={r.titulo} tituloRef={tituloRef} />
      <p className={s.recuadro}>Esto ya pasó: aparece en el día y la hora en que ocurrió, y no se mueve.</p>
      <dl className={s.datos}>
        <dt>Cuándo ocurrió</dt>
        <dd>{tramoMedio(ini, fin)}</dd>
        <dt>Cuánto duró</dt>
        <dd>
          {fin - ini} min · se estimaban {r.duracionEstimada.min}–{r.duracionEstimada.max}
        </dd>
        <dt>Evidencia</dt>
        <dd>{r.evidencia.descripcion}</dd>
        <dt>Validación</dt>
        <dd>{REVISION[r.evidencia.revision]}</dd>
        <dt>Progreso registrado</dt>
        <dd>{r.progreso ? `Sí, el ${r.progreso.cuando}, en ${nombreDeTema(r.tema)}` : "No: sin evidencia validada no hay progreso"}</dd>
        {r.sesion && (
          <>
            <dt>Sesión</dt>
            <dd>{r.sesion}</dd>
          </>
        )}
      </dl>
      <div className={s.bloqueInspector}>
        <h3>Qué cambió en el plan</h3>
        <ul className={s.lista}>
          {r.cambioEnPlan.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
      <div className={s.acciones}>
        <button type="button" className={s.boton} onClick={() => lab.abrir({ tipo: "AVISO", titulo: "Ver la evidencia", texto: "En el producto esto abre la evidencia y su sesión. El laboratorio no navega." })}>
          Ver la evidencia
        </button>
      </div>
    </>
  );
}
