"use client";

/**
 * ACHIEVE — el área «Materias», [ADR-077](../../docs/decisions.md#adr-077).
 *
 * El área que la Parte II §10 del spec nombra desde siempre —*"espacios
 * persistentes de cursado y evaluaciones"*— y que nunca se había construido:
 * el ítem del menú decía «Materias» y llevaba al cursado de **una**.
 *
 * ## Las cuatro cosas que esta pantalla tiene prohibido hacer
 *
 * Son las de [ADR-072](../../docs/decisions.md#adr-072), y ninguna es opcional:
 *
 * 1. **Leer `domain_value`.** La barra es cobertura, no dominio. El mockup del
 *    owner rotulaba *«1/9 dominados»* y eso **no se adoptó**: el dominio exige
 *    evaluación, la cobertura sólo exige que hayas producido algo.
 * 2. **Ordenar por cobertura.** *"Ordenar por cobertura es un ranking de qué tan
 *    mal vas."* El orden llega dado por la proyección: próxima evaluación, con
 *    las sin fecha al fondo.
 * 3. **Completar la barra sola.** Un tema sin minutos conocidos no entra al
 *    denominador.
 * 4. **Dibujar barra sin datos.** `cobertura: null` no es `0%`: es
 *    `sinCobertura`, que dice por qué.
 *
 * Y una quinta, de [ADR-075](../../docs/decisions.md#adr-075) §C1: **sin colores
 * de calificación**. Ver `colorDeMateria`.
 */

import { useState } from "react";
import { ReglaDeNegocio, TituloDePanel } from "./design-system";
import type { EjeDelPeriodo, MateriaEnIndice, MateriasProps } from "@/lib/domain/view-models";
import { colorDeMateria } from "@/lib/domain/color-de-materia";

export interface IndiceDeMateriasProps extends MateriasProps {
  /** `CTA-001`. Recibe la cursada de **la fila que se tocó** (ADR-054, opción `B`). */
  onAbrirMateria?: (cursadaId: string) => void;
}

/*
  ⚠️ **El color se mudó a `lib/domain/color-de-materia.ts`, y no se copió.**

  El escritorio de ADR-088 lo necesita para que la ventana de una materia tenga
  **el color que esa materia tiene en esta lista**. Dos copias de la función
  serían dos paletas el día que alguien toque una: la lista y las ventanas
  dirían colores distintos para la misma materia, y el color pasaría a mentir
  sobre la identidad en vez de fijarla.

  La razón por la que esto no viola ADR-075 §C1 —identidad, no medida— viaja con
  la función, que es donde se va a leer.
*/

export function IndiceDeMaterias({
  fecha,
  eje,
  proximaEvaluacion,
  materias,
  aclaracion,
  onAbrirMateria,
}: IndiceDeMateriasProps) {
  // El Gantt arranca por defecto: es la vista que contesta la pregunta del área
  // —*cómo está distribuida tu carga*— de un vistazo.
  const [vista, setVista] = useState<"gantt" | "lista">("gantt");

  return (
    <div data-indice-de-materias>
      {/*
        `D-01`: la cabecera sale de la primitiva, y ninguna pantalla escribe
        su propio encabezado de nivel uno. Y
        `proximaEvaluacion` es `null` cuando ninguna materia tiene fecha: la
        línea entonces sólo lleva el día. **No dice «0 días»** — no saber cuándo
        y que sea hoy son cosas distintas (`P-09`).
      */}
      <TituloDePanel
        eyebrow="Cómo está distribuida tu carga"
        titulo="Materias"
        escala={30}
        meta={proximaEvaluacion ? `${fecha} · ${proximaEvaluacion}` : fecha}
      />

      {/*
        ⚠️ **Dos vistas de los MISMOS datos, no dos pantallas.** Las dos leen la
        misma `MateriaEnIndice`, en el mismo orden y con la misma cobertura: lo
        que cambia es la forma, nunca lo que se afirma. Es por eso que el
        selector vive acá y no en la navegación.
      */}
      <div style={{ display: "flex", gap: 8, margin: "20px 0 16px" }}>
        {(["gantt", "lista"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVista(v)}
            aria-pressed={vista === v}
            style={{
              padding: "7px 16px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: vista === v ? "var(--foreground)" : "transparent",
              color: vista === v ? "var(--background)" : "inherit",
              font: "inherit",
              fontSize: "var(--text-meta)",
              cursor: "pointer",
            }}
          >
            {v === "gantt" ? "Gantt del período" : "Lista"}
          </button>
        ))}
        <p
          style={{
            marginLeft: "auto",
            alignSelf: "center",
            fontSize: "var(--text-meta)",
            color: "var(--muted-foreground)",
          }}
        >
          {vista === "gantt"
            ? "Cada barra es la ventana de preparación hasta el examen. El relleno es lo que ya cubriste."
            : "Ordenadas por la evaluación más cercana."}
        </p>
      </div>

      {materias.length === 0 ? (
        // Un estudiante con el alta completa y sin cursadas es un estado válido.
        // Se dice, no se disfraza de error ni se rellena con una fila de ejemplo.
        <p style={{ fontSize: "var(--text-body)" }}>
          Todavía no hay materias cargadas. Cuando cargues una, aparece acá con su
          preparación.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: vista === "gantt" ? 0 : 10 }}>
          {materias.map((m) =>
            vista === "gantt" ? (
              <FilaDelGantt key={m.cursadaId} m={m} eje={eje} onAbrir={onAbrirMateria} />
            ) : (
              <Fila key={m.cursadaId} m={m} onAbrir={onAbrirMateria} />
            ),
          )}
        </ul>
      )}

      {vista === "gantt" && materias.length > 0 && <Leyenda />}

      {/*
        ⚠️ **La aclaración va con la barra o no va.** Es `null` cuando ninguna
        fila dibuja barra: explicar un porcentaje que no está en pantalla sería
        ruido, y el porcentaje sin ella se lee como una nota.
      */}
      {aclaracion && <ReglaDeNegocio>{aclaracion}</ReglaDeNegocio>}
    </div>
  );
}

function Fila({ m, onAbrir }: { m: MateriaEnIndice; onAbrir?: (id: string) => void }) {
  const color = colorDeMateria(m.cursadaId);

  // La fila entera abre la materia · pedido del owner, 9 sep 2026.
  //
  // ⚠️ **El botón de la derecha NO se saca, y el `li` NO es un `button`.** Un
  // `button` dentro de otro es HTML inválido, y mover el control al `li` dejaría
  // la fila sin nada enfocable: quien navega con teclado perdería el acceso. El
  // `li` agrega el clic de mouse **encima** del control, que sigue siendo el
  // camino visible (`P-07`).
  return (
    <li
      onClick={onAbrir ? () => onAbrir(m.cursadaId) : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 18px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${color}`,
        background: "var(--card)",
        cursor: onAbrir ? "pointer" : "default",
      }}
    >
      <div style={{ flex: "1 1 240px", minWidth: 0 }}>
        <p style={{ fontSize: "var(--text-body)", fontWeight: 600, margin: 0 }}>{m.nombre}</p>

        {/*
          Evaluación · último avance. **Cada parte se omite si falta**, y ninguna
          se rellena: sin evaluación se dice que no hay, y sin avance se dice
          «Sin avance registrado» — que no es «hace 0 días».
        */}
        <p
          style={{
            fontSize: "var(--text-meta)",
            color: "var(--muted-foreground)",
            margin: "2px 0 0",
          }}
        >
          {[m.evaluacion ?? "Sin evaluación cargada", m.ultimoAvance ?? "Sin avance registrado"]
            .join(" · ")}
        </p>
      </div>

      <div style={{ flex: "0 1 260px", minWidth: 140 }}>
        {m.cobertura ? (
          <>
            {/*
              ⚠️ **El color es identidad de materia, no calificación.** Es el
              mismo al 3% que al 100% — ver `colorDeMateria`.
            */}
            <div
              role="img"
              aria-label={m.cobertura.texto}
              style={{ height: 8, borderRadius: 4, background: "var(--muted)", overflow: "hidden" }}
            >
              <div
                style={{
                  width: `${Math.round(m.cobertura.fraccion * 100)}%`,
                  height: "100%",
                  background: color,
                }}
              />
            </div>
            <p
              style={{
                fontSize: "var(--text-meta)",
                color: "var(--muted-foreground)",
                margin: "4px 0 0",
              }}
            >
              {m.cobertura.texto}
            </p>
          </>
        ) : (
          // ⚠️ **Sin barra, y el motivo en su lugar.** No una barra en cero:
          // faltar datos y faltar trabajo no se dibujan igual (ADR-072 §4).
          <p
            style={{
              fontSize: "var(--text-meta)",
              color: "var(--muted-foreground)",
              margin: 0,
            }}
          >
            {m.sinCobertura}
          </p>
        )}
      </div>

      {/*
        Los días. `null` ⇒ la columna queda **vacía**, no en cero: un `0` diría
        «es hoy», que es una afirmación que nadie hizo.
      */}
      <div
        style={{
          flex: "0 0 auto",
          minWidth: 48,
          textAlign: "right",
          fontSize: "var(--text-body)",
          color: m.tono === "urgencia" ? color : "var(--muted-foreground)",
          fontWeight: m.tono === "urgencia" ? 600 : 400,
        }}
      >
        {m.faltan ?? "—"}
      </div>

      {/*
        ⚠️ **Una sola CTA, con tres etiquetas.** Las tres son `CTA-001` y las
        tres navegan a esta materia; lo que cambia es qué le falta a la fila.
        Declarar tres CTAs para una navegación inflaría el registro canónico.
      */}
      <button
        type="button"
        // `stopPropagation` porque el `li` ya abre: sin esto el clic sobre el
        // botón navegaría dos veces.
        onClick={
          onAbrir
            ? (e) => {
                e.stopPropagation();
                onAbrir(m.cursadaId);
              }
            : undefined
        }
        style={{
          flex: "0 0 auto",
          padding: "8px 16px",
          borderRadius: 999,
          border: "1px solid var(--border)",
          background: "transparent",
          font: "inherit",
          fontSize: "var(--text-meta)",
          cursor: onAbrir ? "pointer" : "default",
        }}
      >
        {m.etiqueta}
      </button>
    </li>
  );
}

/**
 * Una fila del Gantt del período — [ADR-078](../../docs/decisions.md#adr-078).
 *
 * ## Lo que la barra afirma
 *
 * **Cuánto tiempo hay** —de la primera clase a la evaluación— y **cuánto está
 * cubierto**. Nada más.
 *
 * ⚠️ **No es el reparto.** El reparto de `UX01` dice *"esta semana te tocan
 * 4,5 h de Cálculo"*: horas sobre un presupuesto. Esto dice días de calendario.
 * No afirman la misma magnitud, y por eso no pueden contradecirse.
 *
 * ## Lo que tiene prohibido
 *
 * 1. **Dibujar una barra sin fecha de examen.** Sin fin no hay plazo: va
 *    punteada, diciendo *"sin ventana de preparación"*.
 * 2. **Rellenar cuando no hay minutos.** `cobertura: null` no es `0%`
 *    ([ADR-072](../../docs/decisions.md#adr-072) §4).
 * 3. **Hacer aritmética de fechas.** Las posiciones llegan calculadas y
 *    versionadas por `REGLA_DE_VENTANA`.
 */
function FilaDelGantt({
  m,
  eje,
  onAbrir,
}: {
  m: MateriaEnIndice;
  eje: EjeDelPeriodo;
  onAbrir?: (id: string) => void;
}) {
  const color = colorDeMateria(m.cursadaId);
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

  // La fila entera abre la materia · pedido del owner, 9 sep 2026.
  //
  // ⚠️ **El botón de la derecha NO se saca, y el `li` NO es un `button`.** Un
  // `button` dentro de otro es HTML inválido, y mover el control al `li` dejaría
  // la fila sin nada enfocable: quien navega con teclado perdería el acceso. El
  // `li` agrega el clic de mouse **encima** del control, que sigue siendo el
  // camino visible (`P-07`).
  return (
    <li
      onClick={onAbrir ? () => onAbrir(m.cursadaId) : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "16px 4px",
        borderBottom: "1px solid var(--border)",
        cursor: onAbrir ? "pointer" : "default",
      }}
    >
      <div style={{ flex: "0 0 250px", minWidth: 0 }}>
        <p style={{ fontSize: "var(--text-body)", fontWeight: 600, margin: 0 }}>{m.nombre}</p>
        <p
          style={{
            fontSize: "var(--text-meta)",
            color: "var(--muted-foreground)",
            margin: "2px 0 0",
          }}
        >
          {m.evaluacion ?? "Sin evaluación cargada"}
        </p>
        {/*
          El texto de cobertura, el mismo que la Lista y que `UX02`. Cuando no
          hay barra, dice por qué — y no se calla, que sería peor.
        */}
        <p
          style={{
            fontSize: "var(--text-meta)",
            color: "var(--muted-foreground)",
            margin: "2px 0 0",
          }}
        >
          {m.cobertura?.texto ?? m.sinCobertura}
        </p>
        {/*
          ⚠️ **El hecho, no el juicio.** El mockup decía «frenada hace 7 días».
          Siete días sin actividad en una materia que se cursa una vez por semana
          es lo normal; llamarla frenada convierte una cadencia en un problema.

          ⚠️ **Y falta la línea de horarios del mockup a propósito**: el bloque
          horario de cursada está decidido (ADR-062) y **no existe en el
          schema**. Derivarlo de las horas de las clases dictadas sería inferir
          la regla desde sus instancias.
        */}
        <p
          style={{
            fontSize: "var(--text-meta)",
            color: "var(--muted-foreground)",
            margin: "2px 0 0",
          }}
        >
          {m.ultimoAvance ? `última actividad ${m.ultimoAvance}` : "Sin avance registrado"}
        </p>
      </div>

      <div style={{ flex: "1 1 auto", position: "relative", height: 34, minWidth: 200 }}>
        {/* Las marcas de semana, con `hoy` entre ellas. */}
        {eje.marcas.map((marca) => (
          <div
            key={marca.etiqueta}
            style={{
              position: "absolute",
              left: pct(marca.posicion),
              top: 0,
              bottom: 0,
              width: 1,
              background: marca.esHoy ? "var(--foreground)" : "var(--border)",
            }}
          />
        ))}

        {m.ventana ? (
          <div
            role="img"
            aria-label={`${m.nombre}: ${m.evaluacion ?? "sin evaluación"}. ${m.cobertura?.texto ?? m.sinCobertura}`}
            style={{
              position: "absolute",
              left: pct(m.ventana.desde),
              width: pct(Math.max(0, m.ventana.hasta - m.ventana.desde)),
              top: 8,
              height: 18,
              borderRadius: 4,
              // ⚠️ El fondo es la ventana; el relleno, la cobertura. Sin
              // cobertura conocida queda **sólo el contorno**: se ve que hay
              // plazo y que no se puede estimar cuánto está hecho.
              background: `color-mix(in srgb, ${color} 14%, transparent)`,
              border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
              // Un inicio que no es un hecho se dibuja punteado por la
              // izquierda: hay plazo, no se sabe desde cuándo.
              borderLeftStyle: m.ventana.inicioDesconocido ? "dotted" : "solid",
              overflow: "hidden",
            }}
          >
            {m.cobertura && (
              <div
                style={{
                  width: pct(m.cobertura.fraccion),
                  height: "100%",
                  background: color,
                }}
              />
            )}
          </div>
        ) : (
          // ⚠️ **Sin fecha de examen no hay ventana**, y se dice. Una barra
          // hasta el borde del eje le inventaría un plazo al estudiante.
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 8,
              height: 18,
              borderRadius: 4,
              border: "1px dashed var(--border)",
              display: "flex",
              alignItems: "center",
              paddingLeft: 8,
              fontSize: "var(--text-meta)",
              color: "var(--muted-foreground)",
            }}
          >
            sin ventana de preparación
          </div>
        )}

        {/* El rombo de la evaluación, sobre el fin de la ventana. */}
        {m.ventana && (
          <div
            style={{
              position: "absolute",
              left: pct(m.ventana.hasta),
              top: 12,
              width: 10,
              height: 10,
              marginLeft: -5,
              background: color,
              transform: "rotate(45deg)",
            }}
          />
        )}
      </div>

      <div
        style={{
          flex: "0 0 auto",
          minWidth: 44,
          textAlign: "right",
          fontSize: "var(--text-body)",
          color: m.tono === "urgencia" ? color : "var(--muted-foreground)",
          fontWeight: m.tono === "urgencia" ? 600 : 400,
        }}
      >
        {m.faltan ?? "—"}
      </div>

      <button
        type="button"
        // `stopPropagation` porque el `li` ya abre: sin esto el clic sobre el
        // botón navegaría dos veces.
        onClick={
          onAbrir
            ? (e) => {
                e.stopPropagation();
                onAbrir(m.cursadaId);
              }
            : undefined
        }
        style={{
          flex: "0 0 auto",
          padding: "8px 16px",
          borderRadius: 999,
          border: "1px solid var(--border)",
          background: "transparent",
          font: "inherit",
          fontSize: "var(--text-meta)",
          cursor: onAbrir ? "pointer" : "default",
        }}
      >
        {m.etiqueta}
      </button>
    </li>
  );
}

/** Qué significa cada cosa del Gantt. Sin esto, las formas no dicen nada. */
function Leyenda() {
  return (
    <p
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 18,
        fontSize: "var(--text-meta)",
        color: "var(--muted-foreground)",
        marginTop: 14,
      }}
    >
      <span>▭ ventana de preparación</span>
      <span>◆ fecha de examen</span>
      <span>línea llena = hoy</span>
      <span>relleno = cobertura de temas</span>
      <span>borde punteado = no se sabe desde cuándo</span>
    </p>
  );
}
