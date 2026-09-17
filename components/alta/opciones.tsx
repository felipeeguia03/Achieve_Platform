"use client";

/**
 * Elegir **una** entre pocas opciones — el control segmentado de las capturas
 * (`docs/diseño/`, *«Tipo de búsqueda»*), con la semántica de un `radiogroup`.
 *
 * Lo usan el semestre de `/alta/carrera` y las preguntas de `/alta/cursada` y
 * `/recorrido`. **Ninguna opción llega elegida**: `valor` en `null` es *todavía
 * no contestó*, y el control no lo rellena (ADR-062: *"nunca seleccionar
 * automáticamente"*).
 */

export interface Opcion<V extends string> {
  valor: V;
  etiqueta: string;
  /** Una línea debajo, más chica. `undefined` ⇒ la línea desaparece. */
  detalle?: string;
}

export function Opciones<V extends string>({
  etiqueta,
  opciones,
  valor,
  onCambiar,
  columnas = false,
}: {
  etiqueta: string;
  opciones: readonly Opcion<V>[];
  valor: V | null;
  onCambiar: (v: V) => void;
  /** `true` ⇒ una opción por fila (listas largas o con detalle). */
  columnas?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      style={{
        display: columnas ? "grid" : "flex",
        flexWrap: "wrap",
        gap: 8,
        gridTemplateColumns: columnas ? "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" : undefined,
      }}
    >
      {opciones.map((o) => {
        const activa = valor === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activa}
            data-opcion={o.valor}
            onClick={() => onCambiar(o.valor)}
            style={{
              textAlign: "left",
              padding: "8px 14px",
              borderRadius: "var(--radius-control)",
              border: activa ? "1px solid var(--foreground)" : "1px solid var(--border)",
              background: activa ? "var(--foreground)" : "var(--card)",
              color: activa ? "var(--background)" : "var(--foreground)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "var(--text-body)", fontWeight: 500 }}>{o.etiqueta}</span>
            {o.detalle && (
              <span style={{ fontSize: "var(--text-meta)", opacity: 0.8 }}>{o.detalle}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
