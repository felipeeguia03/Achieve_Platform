"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE V3 — los diálogos.
 *
 * - **Conflicto duro**: *Esta acción no puede quedarse acá*, con el motivo concreto y
 *   horarios que sí sirven. No hay «ubicar igual».
 * - **Advertencia blanda**: explica la consecuencia y **deja seguir** (*Ubicar igual*).
 * - **Renegociar**: antes y después, consecuencias, confirmación. Cancelar conserva
 *   el horario original.
 */

import { useId, useState } from "react";

import { useLab, type Dialogo as DialogoAbierto } from "./contexto";
import { Dialogo } from "./dialogo";
import { CINCO_HORAS, EVALUACIONES, MATERIAS, instanteDe } from "./fixture";
import { DIA, HORA_FIN, HORA_INICIO, SEMANA, diaMedio, diasDesdeElLunes, enHoras, fechaDe, horaDe, instante, tramoMedio } from "./formato";
import { accion, mundoDe, posiciones, totales, validarCambioDeHorario, validarUbicacion, margenAntesDe, evaluacionesDeLaSemana, unir, intersectar, total } from "./motor";
import s from "./lab.module.css";
import type { AccionDelLab } from "./estado";
import type { VentanaViva } from "./tipos";

export interface AccionesDeDialogo {
  cerrar: () => void;
  intentarUbicar: (id: string, ini: number, duracion: number) => void;
  intentarMover: (compromisoId: string, ini: number) => void;
  aplicar: (a: AccionDelLab, anuncio: string) => void;
  pedirSimular: (id: string) => void;
  seleccionar: (id: string | null) => void;
}

export function Dialogos({ dialogo, acciones }: { dialogo: DialogoAbierto; acciones: AccionesDeDialogo }) {
  switch (dialogo.tipo) {
    case "CONFLICTO":
      return <DeConflicto d={dialogo} acc={acciones} />;
    case "ADVERTENCIA":
      return <DeAdvertencia d={dialogo} acc={acciones} />;
    case "ELEGIR":
      return <ElegirHorario d={dialogo} acc={acciones} />;
    case "COMPROMETER":
      return <Comprometer d={dialogo} acc={acciones} />;
    case "RENEGOCIAR":
      return <Renegociar d={dialogo} acc={acciones} />;
    case "PRERREQUISITO":
      return (
        <Dialogo titulo="Falta simular un prerrequisito" onCerrar={acciones.cerrar}>
          <p>
            {accion(dialogo.accionId)!.titulo} depende de {dialogo.faltan.map((r) => accion(r)!.titulo).join(" y ")}. Sin eso, la simulación no puede suponer una práctica constatada.
          </p>
          <div className={s.acciones}>
            <button
              type="button"
              className={s.botonPrimario}
              onClick={() => {
                acciones.cerrar();
                acciones.pedirSimular(dialogo.faltan[0]);
              }}
            >
              Simular primero {accion(dialogo.faltan[0])!.corto}
            </button>
            <button type="button" className={s.boton} onClick={acciones.cerrar}>
              Cancelar
            </button>
          </div>
        </Dialogo>
      );
    case "DISPONIBILIDAD":
      return <Disponibilidad d={dialogo} acc={acciones} />;
    case "REORGANIZAR":
      return <Reorganizar acc={acciones} />;
    case "AVISO":
      return (
        <Dialogo titulo={dialogo.titulo} onCerrar={acciones.cerrar}>
          <p>{dialogo.texto}</p>
          <div className={s.acciones}>
            <button type="button" className={s.botonPrimario} onClick={acciones.cerrar}>
              Entendido
            </button>
          </div>
        </Dialogo>
      );
  }
}

function DeConflicto({ d, acc }: { d: Extract<DialogoAbierto, { tipo: "CONFLICTO" }>; acc: AccionesDeDialogo }) {
  const esCompromiso = d.intento.tipo === "MOVER";
  const duracion = d.intento.tipo === "UBICAR" ? d.intento.duracion : 0;
  return (
    <Dialogo titulo={esCompromiso ? "Este compromiso no puede quedarse acá" : "Esta acción no puede quedarse acá"} onCerrar={acc.cerrar}>
      <div role="alert" data-conflicto>
        <ul className={s.lista}>
          {d.motivos.map((m) => (
            <li key={m.texto} data-motivo={m.tipo}>
              {m.texto}
            </li>
          ))}
        </ul>
      </div>
      {d.alternativas.length > 0 && d.intento.tipo === "UBICAR" && (
        <>
          <p className={s.textoSuave}>Horarios donde sí entra completa:</p>
          <div className={s.acciones}>
            {d.alternativas.map((ini) => (
              <button key={ini} type="button" className={s.boton} onClick={() => acc.intentarUbicar((d.intento as { id: string }).id, ini, duracion)}>
                Ubicar el {tramoMedio(ini, ini + duracion)}
              </button>
            ))}
          </div>
        </>
      )}
      <div className={s.acciones}>
        <button type="button" className={s.botonPrimario} onClick={acc.cerrar}>
          {esCompromiso ? "Conservar el horario original" : "Volver"}
        </button>
      </div>
    </Dialogo>
  );
}

function DeAdvertencia({ d, acc }: { d: Extract<DialogoAbierto, { tipo: "ADVERTENCIA" }>; acc: AccionesDeDialogo }) {
  const a = accion(d.intento.id)!;
  const primera = d.advertencias[0];
  const titulo = primera.tipo === "PRIORIDAD" ? "Hay una acción más prioritaria" : primera.tipo === "MARGEN" ? "Se reduce tu margen" : "Revisá antes de ubicar";
  const afectada = d.advertencias.find((x) => x.afectada)?.afectada ?? null;
  return (
    <Dialogo titulo={titulo} onCerrar={acc.cerrar}>
      <div aria-live="polite" data-advertencia>
        <ul className={s.lista}>
          {d.advertencias.map((x) => (
            <li key={x.texto} data-tipo-advertencia={x.tipo}>
              {x.texto}
            </li>
          ))}
        </ul>
      </div>
      <p className={s.textoSuave}>
        Es una advertencia: la decisión es tuya. {a.titulo} quedaría el {tramoMedio(d.intento.ini, d.intento.ini + d.intento.duracion)} como propuesta.
      </p>
      <div className={s.acciones}>
        <button
          type="button"
          className={s.boton}
          onClick={() => {
            acc.cerrar();
            if (afectada) acc.seleccionar(afectada);
          }}
        >
          Volver y revisar
        </button>
        <button
          type="button"
          className={s.botonPrimario}
          onClick={() => acc.aplicar({ tipo: "UBICAR", id: a.id, ini: d.intento.ini, duracion: d.intento.duracion }, `Ubicaste ${a.titulo} el ${tramoMedio(d.intento.ini, d.intento.ini + d.intento.duracion)}, a pesar del aviso. Sigue siendo una propuesta.`)}
        >
          Ubicar igual
        </button>
      </div>
    </Dialogo>
  );
}

const HORAS_DE_INICIO = Array.from({ length: (HORA_FIN - HORA_INICIO) * 4 }, (_, i) => HORA_INICIO * 60 + i * 15);

function ElegirHorario({ d, acc }: { d: Extract<DialogoAbierto, { tipo: "ELEGIR" }>; acc: AccionesDeDialogo }) {
  const lab = useLab();
  const idBase = useId();
  const m = mundoDe(lab.estado);
  const compromiso = d.compromisoId ? lab.estado.compromisos.find((c) => c.id === d.compromisoId)! : null;
  const a = accion(compromiso ? compromiso.accionId : d.accionId!)!;
  const pos = lab.real.posiciones[a.id];
  const inicial = compromiso ? compromiso.ini : pos && pos.tipo !== "SIN_LUGAR" ? pos.ini : Math.max(lab.estado.ahora, diasDesdeElLunes(fechaDe(lab.estado.ahora)) * DIA + HORA_INICIO * 60);
  const [fecha, setFecha] = useState(fechaDe(inicial));
  const [minuto, setMinuto] = useState(Math.min(HORA_FIN * 60 - 15, Math.max(HORA_INICIO * 60, Math.ceil((inicial % DIA) / 15) * 15)));
  const [duracion, setDuracion] = useState(compromiso ? compromiso.fin - compromiso.ini : pos?.tipo === "UBICADA" ? pos.fin - pos.ini : a.duracion.probable);
  const ini = diasDesdeElLunes(fecha) * DIA + minuto;
  const v = compromiso ? validarCambioDeHorario(m, compromiso.id, ini) : validarUbicacion(m, a.id, ini, duracion);

  return (
    <Dialogo titulo={compromiso ? "Cambiar horario del compromiso" : "Elegir horario"} onCerrar={acc.cerrar}>
      <p>
        <strong>{a.titulo}</strong> · {MATERIAS[a.materia].nombre}
      </p>
      <div className={s.campos}>
        <label className={s.campo} htmlFor={`${idBase}-dia`}>
          Día
          <select id={`${idBase}-dia`} value={fecha} onChange={(e) => setFecha(e.target.value)}>
            {SEMANA.map((f) => (
              <option key={f} value={f} disabled={instante(f, "23:00") <= lab.estado.ahora}>
                {diaMedio(f)}
              </option>
            ))}
          </select>
        </label>
        <label className={s.campo} htmlFor={`${idBase}-hora`}>
          Hora
          <select id={`${idBase}-hora`} value={minuto} onChange={(e) => setMinuto(Number(e.target.value))}>
            {HORAS_DE_INICIO.map((mm) => (
              <option key={mm} value={mm}>
                {horaDe(mm)}
              </option>
            ))}
          </select>
        </label>
        <label className={s.campo} htmlFor={`${idBase}-dur`}>
          Duración
          <select id={`${idBase}-dur`} value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} disabled={!!compromiso}>
            {compromiso ? (
              <option value={duracion}>{duracion} min · la comprometida</option>
            ) : (
              [...new Set([a.duracion.min, a.duracion.probable, a.duracion.max])].map((x) => (
                <option key={x} value={x}>
                  {x} min · {x === a.duracion.probable ? "probable" : x === a.duracion.min ? "mínimo" : "máximo"}
                </option>
              ))
            )}
          </select>
        </label>
      </div>
      <div aria-live="polite" data-validacion-elegir>
        {v.duros.length > 0 ? (
          <div className={s.recuadro}>
            <strong>No puede quedarse acá.</strong>
            <ul className={s.lista}>
              {v.duros.map((x) => (
                <li key={x.texto}>{x.texto}</li>
              ))}
            </ul>
          </div>
        ) : v.blandos.length > 0 ? (
          <p className={s.recuadro}>Entra, con {v.blandos.length === 1 ? "una advertencia" : `${v.blandos.length} advertencias`} que vas a ver antes de confirmar.</p>
        ) : (
          <p className={s.recuadro}>Entra completa: {tramoMedio(ini, ini + duracion)}.</p>
        )}
      </div>
      <div className={s.acciones}>
        <button
          type="button"
          className={s.botonPrimario}
          disabled={v.duros.length > 0}
          onClick={() => (compromiso ? acc.intentarMover(compromiso.id, ini) : acc.intentarUbicar(a.id, ini, duracion))}
        >
          {compromiso ? "Revisar el cambio" : "Ubicar acá"}
        </button>
        <button type="button" className={s.boton} onClick={acc.cerrar}>
          Cancelar
        </button>
      </div>
    </Dialogo>
  );
}

function Comprometer({ d, acc }: { d: Extract<DialogoAbierto, { tipo: "COMPROMETER" }>; acc: AccionesDeDialogo }) {
  const lab = useLab();
  const a = accion(d.accionId)!;
  const u = lab.estado.ubicaciones[a.id];
  if (!u) return null;
  return (
    <Dialogo titulo="Comprometerme" onCerrar={acc.cerrar}>
      <dl className={s.datos}>
        <dt>Acción</dt>
        <dd>{a.titulo}</dd>
        <dt>Día y hora</dt>
        <dd>{tramoMedio(u.ini, u.ini + u.duracion)}</dd>
        <dt>Duración</dt>
        <dd>
          {u.duracion} min · rango {a.duracion.min}–{a.duracion.max}
        </dd>
        <dt>Evidencia esperada</dt>
        <dd>{a.evidencia}</dd>
      </dl>
      <p className={s.textoSuave}>
        Comprometerte no registra progreso, no quita trabajo pendiente y no mueve el Gantt. A partir de acá el horario cambia sólo con una renegociación explícita.
      </p>
      <div className={s.acciones}>
        <button type="button" className={s.botonPrimario} onClick={() => acc.aplicar({ tipo: "COMPROMETER", id: a.id }, `Te comprometiste con ${a.titulo} el ${tramoMedio(u.ini, u.ini + u.duracion)}. No registra progreso.`)}>
          Confirmar compromiso
        </button>
        <button type="button" className={s.boton} onClick={acc.cerrar}>
          Cancelar
        </button>
      </div>
    </Dialogo>
  );
}

function Renegociar({ d, acc }: { d: Extract<DialogoAbierto, { tipo: "RENEGOCIAR" }>; acc: AccionesDeDialogo }) {
  const lab = useLab();
  const c = lab.estado.compromisos.find((x) => x.id === d.compromisoId)!;
  const a = accion(c.accionId)!;
  const fin = d.ini + (c.fin - c.ini);
  return (
    <Dialogo titulo="Cambiar horario del compromiso" onCerrar={acc.cerrar}>
      <p>
        <strong>{a.titulo}</strong>
      </p>
      <div className={s.comparacion}>
        <p className={s.recuadro} data-antes>
          <span className={s.textoSuave}>Horario anterior</span>
          <br />
          {tramoMedio(c.ini, c.fin)}
        </p>
        <p className={`${s.recuadro} ${s.recuadroEscenario}`} data-despues>
          <span className={s.textoSuave}>Horario nuevo</span>
          <br />
          {tramoMedio(d.ini, fin)}
        </p>
      </div>
      <div aria-live="polite">
        <strong>Consecuencias</strong>
        <ul className={s.lista}>
          {d.advertencias.length === 0 ? <li>No cambia nada más de tu semana.</li> : d.advertencias.map((x) => <li key={x.texto}>{x.texto}</li>)}
          <li>La promesa original ({tramoMedio(c.promesaOriginal.ini, c.promesaOriginal.fin)}) queda registrada.</li>
          <li>No registra progreso y la evidencia esperada sigue siendo la misma.</li>
        </ul>
      </div>
      <div className={s.acciones}>
        <button
          type="button"
          className={s.botonPrimario}
          onClick={() => acc.aplicar({ tipo: "CAMBIAR_HORARIO", compromisoId: c.id, ini: d.ini }, `Cambiaste el horario del compromiso ${a.titulo}: ahora es el ${tramoMedio(d.ini, fin)}.`)}
        >
          Cambiar horario
        </button>
        <button type="button" className={s.boton} onClick={acc.cerrar}>
          Cancelar
        </button>
      </div>
    </Dialogo>
  );
}

function Disponibilidad({ d, acc }: { d: Extract<DialogoAbierto, { tipo: "DISPONIBILIDAD" }>; acc: AccionesDeDialogo }) {
  const lab = useLab();
  const idBase = useId();
  const [ventanas, setVentanas] = useState<readonly VentanaViva[]>(() =>
    d.conCincoHoras ? [...lab.estado.ventanas, ...CINCO_HORAS.map((v) => ({ id: v.id, ...instanteDe(v.tramo), origen: "AGREGADA" as const }))] : lab.estado.ventanas,
  );
  const [fecha, setFecha] = useState(fechaDe(lab.estado.ahora + DIA));
  const [desde, setDesde] = useState(9 * 60);
  const [hasta, setHasta] = useState(10 * 60);

  const antes = mundoDe(lab.estado);
  const despues = { ...antes, ventanas };
  const tAntes = totales(antes);
  const tDespues = totales(despues);
  const pAntes = posiciones(antes);
  const pDespues = posiciones(despues);
  const entran = Object.keys(pDespues).filter((id) => pAntes[id]?.tipo === "SIN_LUGAR" && pDespues[id].tipo !== "SIN_LUGAR");
  const adelantan = Object.keys(pDespues).filter((id) => {
    const x = pAntes[id];
    const y = pDespues[id];
    return x?.tipo === "SUGERIDA" && y.tipo === "SUGERIDA" && y.ini < x.ini;
  });
  const margenes = evaluacionesDeLaSemana(antes).map((e) => ({ e, antes: margenAntesDe(antes, e.id), despues: margenAntesDe(despues, e.id) }));
  const fueraDeDisponibilidad = antes.compromisos.filter((c) => c.estado === "CONFIRMADO" && c.ini >= antes.ahora && total(intersectar([c], unir(ventanas))) < c.fin - c.ini);
  const cinco = CINCO_HORAS.every((v) => ventanas.some((x) => x.id === v.id));
  const futuras = ventanas.filter((v) => v.fin > lab.estado.ahora).sort((x, y) => x.ini - y.ini);

  return (
    <Dialogo titulo="Reajustar disponibilidad" onCerrar={acc.cerrar}>
      <p className={s.textoSuave}>Los cambios se aplican sólo a este laboratorio. Las clases y las evaluaciones nunca se mueven para hacer lugar.</p>
      <div className={s.acciones}>
        <button
          type="button"
          className={s.boton}
          aria-pressed={cinco}
          onClick={() =>
            setVentanas((vs) =>
              cinco ? vs.filter((v) => !CINCO_HORAS.some((c) => c.id === v.id)) : [...vs, ...CINCO_HORAS.map((v) => ({ id: v.id, ...instanteDe(v.tramo), origen: "AGREGADA" as const }))],
            )
          }
          data-cinco-horas
        >
          {cinco ? "Quitar las cinco horas adicionales" : "Previsualizar cinco horas adicionales"}
        </button>
      </div>

      <div>
        <strong>Tu disponibilidad de lo que queda de la semana</strong>
        {futuras.map((v) => (
          <div key={v.id} className={s.ventanaFila} data-ventana-fila={v.id}>
            <span>
              {tramoMedio(v.ini, v.fin)} {v.origen === "AGREGADA" ? "· agregada" : ""}
            </span>
            <button type="button" className={s.botonTexto} onClick={() => setVentanas((vs) => vs.filter((x) => x.id !== v.id))}>
              Marcar no disponible
            </button>
          </div>
        ))}
      </div>

      <div className={s.campos}>
        <label className={s.campo} htmlFor={`${idBase}-f`}>
          Día
          <select id={`${idBase}-f`} value={fecha} onChange={(e) => setFecha(e.target.value)}>
            {SEMANA.map((f) => (
              <option key={f} value={f} disabled={instante(f, "23:00") <= lab.estado.ahora}>
                {diaMedio(f)}
              </option>
            ))}
          </select>
        </label>
        <label className={s.campo} htmlFor={`${idBase}-d`}>
          Desde
          <select id={`${idBase}-d`} value={desde} onChange={(e) => setDesde(Number(e.target.value))}>
            {HORAS_DE_INICIO.map((mm) => (
              <option key={mm} value={mm}>
                {horaDe(mm)}
              </option>
            ))}
          </select>
        </label>
        <label className={s.campo} htmlFor={`${idBase}-h`}>
          Hasta
          <select id={`${idBase}-h`} value={hasta} onChange={(e) => setHasta(Number(e.target.value))}>
            {HORAS_DE_INICIO.map((mm) => mm + 15).map((mm) => (
              <option key={mm} value={mm}>
                {horaDe(mm)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={s.acciones}>
        <button
          type="button"
          className={s.boton}
          disabled={hasta <= desde}
          onClick={() => {
            const base = diasDesdeElLunes(fecha) * DIA;
            setVentanas((vs) => [...vs, { id: `DSP-LOCAL-${vs.length + 1}-${base + desde}`, ini: base + desde, fin: base + hasta, origen: "AGREGADA" }]);
          }}
        >
          Agregar horas
        </button>
      </div>

      <div className={s.recuadro} aria-live="polite" data-vista-disponibilidad>
        <strong>Antes de aplicar</strong>
        <ul className={s.lista}>
          <li data-capacidad>
            Tiempo disponible: {enHoras(tAntes.capacidad)} → {enHoras(tDespues.capacidad)}
          </li>
          <li>Acciones que ahora entran: {entran.length ? entran.map((id) => accion(id)!.corto).join(", ") : "ninguna nueva"}</li>
          <li>Podrían adelantarse: {adelantan.length ? adelantan.map((id) => accion(id)!.corto).join(", ") : "ninguna"}</li>
          {margenes.map(({ e, antes: x, despues: y }) => (
            <li key={e.id}>
              Margen antes de {e.corto}: {enHoras(x)} → {enHoras(y)}
              {y > x ? ` · recuperás ${enHoras(y - x)}` : ""}
            </li>
          ))}
          {fueraDeDisponibilidad.map((c) => (
            <li key={c.id}>
              «{accion(c.accionId)!.titulo}» queda fuera de tu disponibilidad y no se mueve: si hace falta, cambiale el horario.
            </li>
          ))}
        </ul>
      </div>
      <div className={s.acciones}>
        <button
          type="button"
          className={s.botonPrimario}
          onClick={() => acc.aplicar({ tipo: "AJUSTAR_DISPONIBILIDAD", ventanas }, `Disponibilidad reajustada en el laboratorio: ${enHoras(tDespues.capacidad)} disponibles.`)}
        >
          Aplicar al laboratorio
        </button>
        <button type="button" className={s.boton} onClick={acc.cerrar}>
          Cancelar
        </button>
      </div>
    </Dialogo>
  );
}

function Reorganizar({ acc }: { acc: AccionesDeDialogo }) {
  const lab = useLab();
  const m = mundoDe(lab.estado);
  const pos = posiciones(m);
  const propuestas = Object.entries(pos).filter(([, p]) => p.tipo === "SUGERIDA") as [string, { ini: number; fin: number }][];
  const incumplidos = lab.estado.compromisos.filter((c) => c.estado === "INCUMPLIDO");
  const sinLugar = Object.entries(pos).filter(([, p]) => p.tipo === "SIN_LUGAR");
  const evaluacionesPasadas = EVALUACIONES.filter((e) => instanteDe(e.tramo).ini < m.ahora && instanteDe(e.tramo).ini >= 0);
  return (
    <Dialogo titulo="Reorganizar sin cortar" onCerrar={acc.cerrar}>
      <p>Achieve propone horarios para lo que quedó pendiente, en el tiempo que queda de la semana. No parte bloques ni mueve compromisos.</p>
      <ul className={s.lista} data-reorganizar>
        {propuestas.map(([id, p]) => (
          <li key={id}>
            {accion(id)!.titulo} → {tramoMedio(p.ini, p.fin)}
          </li>
        ))}
      </ul>
      {sinLugar.length > 0 && <p className={s.textoSuave}>Sin lugar esta semana: {sinLugar.map(([id]) => accion(id)!.corto).join(", ")}.</p>}
      {incumplidos.length > 0 && (
        <p className={s.recuadro}>
          {incumplidos.map((c) => `«${accion(c.accionId)!.titulo}» (${tramoMedio(c.ini, c.fin)})`).join(" y ")} {incumplidos.length === 1 ? "queda incumplido" : "quedan incumplidos"} en su horario original. El rescate es una propuesta nueva, no una edición.
        </p>
      )}
      {evaluacionesPasadas.length > 0 && <p className={s.textoSuave}>Ya pasó: {evaluacionesPasadas.map((e) => e.titulo).join(", ")}.</p>}
      <div className={s.acciones}>
        <button type="button" className={s.botonPrimario} disabled={propuestas.length === 0} onClick={() => acc.aplicar({ tipo: "REORGANIZAR" }, `Reorganizaste sin cortar: ${propuestas.length} propuestas ubicadas. Ningún compromiso se movió.`)}>
          Ubicar estas propuestas
        </button>
        <button type="button" className={s.boton} onClick={acc.cerrar}>
          Cancelar
        </button>
      </div>
    </Dialogo>
  );
}

