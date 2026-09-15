"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE V3 — *Acciones por ubicar*.
 *
 * Lo que falta hacer y **no** está comprometido, por prioridad. Una acción ubicada
 * sigue acá —es una propuesta— hasta que el estudiante se compromete. Lo que ya
 * ocurrió **no** entra: está en el calendario, en el día y la hora en que pasó.
 *
 * Cada carta se arrastra al calendario, se abre con clic o Enter, y tiene
 * *Elegir horario* como alternativa accesible al arrastre.
 */

import { CalendarClock, CircleDashed, FlaskConical, Move, TriangleAlert } from "lucide-react";

import { useLab } from "./contexto";
import { MATERIAS, NOMBRE_DE_PRIORIDAD } from "./fixture";
import { enHoras, tramoCorto } from "./formato";
import { accion } from "./motor";
import { barrasDePrioridad, prioridadEnFrase, relacionDeFecha } from "./presentacion";
import s from "./lab.module.css";
import type { Prioridad } from "./tipos";

export function MedidorDePrioridad({ prioridad }: { prioridad: Prioridad }) {
  const llenas = barrasDePrioridad(prioridad);
  return (
    <span className={s.prioridadBarras} aria-hidden>
      {[1, 2, 3, 4].map((n) => (
        <i key={n} data-llena={n <= llenas} style={{ height: 3 + n * 2 }} />
      ))}
    </span>
  );
}

const MOTIVO_SIN_LUGAR = {
  SIN_HUECO: "No entra completa en ningún hueco de la semana",
  PLAZO: "Sólo entraría después de su fecha límite",
  DEPENDENCIA: "Espera un prerrequisito que no tiene lugar",
} as const;

export function Bandeja() {
  const lab = useLab();
  const p = lab.mostrada;
  const editable = lab.plano === "REAL";
  const ids = p.pendientes;
  const minutos = ids.reduce((suma, id) => suma + accion(id)!.duracion.probable, 0);

  return (
    <section className={`${s.tarjeta} ${s.bandeja}`} aria-labelledby="lab3-bandeja-titulo" data-bandeja>
      <div className={s.bandejaCabecera}>
        <div>
          <h2 id="lab3-bandeja-titulo" className={s.seccionTitulo}>
            Acciones por ubicar
          </h2>
          <p className={s.textoSuave}>
            {ids.length} acciones · {enHoras(minutos)} probables · ordenadas por prioridad
            {lab.plano === "ESCENARIO" ? " · en el escenario" : ""}
          </p>
        </div>
        {p.retiradas.length > 0 && (
          <p className={s.textoSuave} data-retiradas>
            Ya no hace falta: {p.retiradas.map((id) => accion(id)!.titulo).join(", ")}.
          </p>
        )}
      </div>
      {ids.length === 0 ? (
        <p className={s.textoSuave}>No queda trabajo sin comprometer en esta proyección.</p>
      ) : (
        <ol className={s.bandejaLista}>
          {ids.map((id) => {
            const a = accion(id)!;
            const pos = p.posiciones[id];
            const ubicada = pos?.tipo === "UBICADA";
            const devuelta = lab.estado.devueltas[id];
            const seleccionada = lab.seleccion === id;
            return (
              <li
                key={id}
                className={s.carta}
                data-bandeja-item={id}
                data-seleccionada={seleccionada}
                style={{ ["--m" as string]: MATERIAS[a.materia].color }}
                draggable={editable}
                onDragStart={(e) => {
                  if (!editable) return;
                  e.dataTransfer?.setData("text/plain", id);
                  lab.empezarArrastre({ tipo: "ACCION", id, desplazamiento: 0, duracion: ubicada ? pos.fin - pos.ini : a.duracion.probable });
                }}
                onDragEnd={() => {
                  lab.empezarArrastre(null);
                  lab.previsualizarArrastre(null);
                }}
              >
                <button type="button" className={s.cartaPrincipal} aria-pressed={seleccionada} onClick={() => lab.seleccionar(id)}>
                  <span className={s.cartaMateria}>{MATERIAS[a.materia].nombre}</span>
                  <span className={s.cartaTitulo}>{a.titulo}</span>
                  <span className={s.cartaDato}>
                    {a.duracion.probable} min · <span className={s.prioridad}>
                      <MedidorDePrioridad prioridad={a.prioridad} />
                      {prioridadEnFrase(a.prioridad)}
                    </span>
                  </span>
                  <span className={s.cartaMateria}>
                    rango {a.duracion.min}–{a.duracion.max} min{relacionDeFecha(a) ? ` · ${relacionDeFecha(a)}` : ""}
                  </span>
                  <span>{a.razonCorta}</span>
                  <span className={s.soloLectores}>Prioridad {NOMBRE_DE_PRIORIDAD[a.prioridad]}.</span>
                </button>
                <p className={s.cartaEstado} data-estado-carta={pos?.tipo ?? "SIN_LUGAR"}>
                  {ubicada ? (
                    <>
                      <Move size={11} aria-hidden /> Ubicada · {tramoCorto(pos.ini, pos.fin)} · todavía no es compromiso
                    </>
                  ) : pos?.tipo === "SUGERIDA" ? (
                    <>
                      <CircleDashed size={11} aria-hidden /> Por ubicar · sugerida {tramoCorto(pos.ini, pos.fin)}
                    </>
                  ) : (
                    <>
                      <TriangleAlert size={11} aria-hidden /> {pos?.tipo === "SIN_LUGAR" ? MOTIVO_SIN_LUGAR[pos.motivo] : "Sin horario"}
                    </>
                  )}
                </p>
                {devuelta && <p className={s.cartaEstado}>{devuelta}</p>}
                <div className={s.cartaAcciones}>
                  {editable && (
                    <button type="button" className={s.boton} onClick={() => lab.abrir({ tipo: "ELEGIR", accionId: id, compromisoId: null })}>
                      <CalendarClock size={12} aria-hidden /> Elegir horario
                    </button>
                  )}
                  <button type="button" className={s.botonTexto} onClick={() => lab.pedirSimular(id)} data-simular={id}>
                    <FlaskConical size={12} aria-hidden /> Simular impacto
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
