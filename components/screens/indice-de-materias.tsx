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

import { ReglaDeNegocio, TituloDePanel } from "./design-system";
import type { MateriaEnIndice, MateriasProps } from "@/lib/domain/view-models";

export interface IndiceDeMateriasProps extends MateriasProps {
  /** `CTA-001`. Recibe la cursada de **la fila que se tocó** (ADR-054, opción `B`). */
  onAbrirMateria?: (cursadaId: string) => void;
}

/**
 * El color de una materia — **identidad, no medida**.
 *
 * ⚠️ **Por qué esto no viola [ADR-075](../../docs/decisions.md#adr-075) §C1.** La
 * psicopedagoga prohibió *"colores propios de calificación —rojo/verde— para el
 * porcentaje de actividad"*. Un color de calificación es el que **cambia con el
 * número**: verde si vas bien, rojo si vas mal. Éste sale del `cursadaId` y es
 * **constante**: la misma materia tiene el mismo color al 3% y al 100%, así que
 * no puede leerse como un juicio sobre la cifra.
 *
 * **Es lo que hace que la pantalla se vea como el mockup sin afirmar nada**: el
 * color distingue materias, que es para lo que el owner lo quería.
 *
 * ⚠️ **Queda para confirmar con la psicopedagoga.** Que un color sea constante
 * no garantiza que nadie lo lea como semáforo, y esa lectura es empírica: se
 * prueba con personas, no se decide acá.
 */
const PALETA = ["#b04a2f", "#3d6b4a", "#b8862f", "#41508f", "#6b4a80", "#2f6b73"] as const;

function colorDeMateria(cursadaId: string): string {
  let n = 0;
  for (const c of cursadaId) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return PALETA[n % PALETA.length];
}

export function IndiceDeMaterias({
  fecha,
  proximaEvaluacion,
  materias,
  aclaracion,
  onAbrirMateria,
}: IndiceDeMateriasProps) {
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

      <div style={{ height: 20 }} />

      {materias.length === 0 ? (
        // Un estudiante con el alta completa y sin cursadas es un estado válido.
        // Se dice, no se disfraza de error ni se rellena con una fila de ejemplo.
        <p style={{ fontSize: "var(--text-body)" }}>
          Todavía no hay materias cargadas. Cuando cargues una, aparece acá con su
          preparación.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {materias.map((m) => (
            <Fila key={m.cursadaId} m={m} onAbrir={onAbrirMateria} />
          ))}
        </ul>
      )}

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

  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 18px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${color}`,
        background: "var(--card)",
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
        onClick={onAbrir ? () => onAbrir(m.cursadaId) : undefined}
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
