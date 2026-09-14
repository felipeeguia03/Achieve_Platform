"use client";

/**
 * Piezas chicas que comparten la portada y los tres juegos de Gimnasia —
 * [ADR-102](../../../docs/decisions.md#adr-102).
 *
 * ⚠️ **Nada de colores propios.** Todo sale de los tokens de `app/globals.css`;
 * el acierto y el error se dicen **con palabras y forma**, además del tinte
 * (`P-06`: no depender del color).
 */

import { useEffect, useState } from "react";

export const estiloPanel: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "20px 22px",
};

/** Una acción que no es la principal del estado: borde fino, ancho de contenido. */
export function BotonSecundario({
  children,
  onClick,
  disabled,
  tipo = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tipo?: "button" | "submit";
}) {
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 40,
        padding: "8px 16px",
        borderRadius: "var(--radius-control)",
        border: "1px solid var(--border)",
        background: "var(--card)",
        color: disabled ? "var(--muted-foreground)" : "var(--foreground)",
        font: "inherit",
        fontSize: "var(--text-body)",
        fontWeight: 500,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

/** La acción principal dentro de un juego, en inversión y con ancho de contenido. */
export function BotonPrincipal({
  children,
  onClick,
  disabled,
  tipo = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tipo?: "button" | "submit";
}) {
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={disabled}
      data-cta-primaria
      style={{
        minHeight: 44,
        padding: "10px 20px",
        borderRadius: "var(--radius-control)",
        border: "none",
        background: disabled ? "var(--border)" : "var(--primary)",
        color: disabled ? "var(--muted-foreground)" : "var(--primary-foreground)",
        font: "inherit",
        fontSize: "var(--text-body)",
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

/** Un aviso de resultado: lo anuncia el lector de pantalla y lleva su signo además del tinte. */
export function Retroalimentacion({ bien, children }: { bien: boolean; children: React.ReactNode }) {
  return (
    <p
      role="status"
      aria-live="polite"
      data-resultado={bien ? "bien" : "mal"}
      style={{
        margin: 0,
        padding: "10px 14px",
        borderRadius: "var(--radius-control)",
        background: bien ? "var(--exito-tinte)" : "var(--urgencia-tinte)",
        color: bien ? "var(--exito-tinte-texto)" : "var(--urgencia-tinte-texto)",
        fontSize: "var(--text-body)",
        fontWeight: 600,
      }}
    >
      <span aria-hidden style={{ marginRight: 8 }}>{bien ? "✓" : "✕"}</span>
      {children}
    </p>
  );
}

/** Una cifra con su rótulo. `null` ⇒ el texto de ausencia, **nunca un `0`** (§2.5). */
export function Cifra({ rotulo, valor, unidad, ausente }: { rotulo: string; valor: number | string | null; unidad?: string; ausente: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      <span style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>{rotulo}</span>
      {valor === null ? (
        <span style={{ fontSize: "var(--text-body)", fontStyle: "italic", color: "var(--muted-foreground)" }}>{ausente}</span>
      ) : (
        <span style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {valor}
          {unidad && <span style={{ fontSize: "var(--text-label)", fontWeight: 400, color: "var(--muted-foreground)" }}> {unidad}</span>}
        </span>
      )}
    </div>
  );
}

/** `prefers-reduced-motion`: sin transiciones. La presentación temporizada es la mecánica, no un adorno, y sigue. */
export function useMenosMovimiento(): boolean {
  const [menos, setMenos] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const alCambiar = () => setMenos(q.matches);
    alCambiar();
    q.addEventListener?.("change", alCambiar);
    return () => q.removeEventListener?.("change", alCambiar);
  }, []);
  return menos;
}

/** Una clave de idempotencia nueva. `crypto.randomUUID` existe en todo navegador soportado y en jsdom. */
export function claveNueva(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** `YYYY-MM-DD` → *13/09*. La fecha ya viene resuelta en la zona del estudiante. */
export function fechaCorta(fecha: string): string {
  const [, m, d] = fecha.split("-");
  return `${d}/${m}`;
}

export function duracionLegible(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const s = segundos % 60;
  return min > 0 ? `${min} min ${String(s).padStart(2, "0")} s` : `${s} s`;
}

/** El interruptor de la presentación sin tiempo. */
export function InterruptorPasoAPaso({ activo, onCambiar, textoPrincipal, detalle }: { activo: boolean; onCambiar: (v: boolean) => void; textoPrincipal: string; detalle: string }) {
  return (
    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: "var(--text-label)", cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={activo}
        onChange={(e) => onCambiar(e.target.checked)}
        style={{ marginTop: 3, width: 16, height: 16 }}
      />
      <span>
        <span style={{ fontWeight: 600, display: "block" }}>{textoPrincipal}</span>
        <span style={{ color: "var(--muted-foreground)" }}>{detalle}</span>
      </span>
    </label>
  );
}
