"use client";

/**
 * ACHIEVE — primitivas visuales compartidas entre las 6 pantallas del loop
 * diario. Extraídas de hoy-autogestion.tsx para no duplicar (y no divergir)
 * el sistema de tokens en cada pantalla nueva.
 *
 * Tokens: ver app/globals.css. Contraste AA medido — ver auditoría en la
 * conversación de diseño. Regla fija: el color semántico NUNCA es borde fino
 * ni texto directo sobre superficie clara — siempre EstadoChip (relleno
 * sólido + texto ink).
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function EstadoGeneral({ children }: { children: React.ReactNode }) {
  return (
    <div className="hairline-b pb-2" style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--foreground)" }}>
      {children}
    </div>
  );
}

/** P-01: la regla de negocio va pegada al control, no en un tooltip. */
export function ReglaDeNegocio({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>{children}</p>;
}

export function HeroCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="shadow-none" style={{ borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--card)" }}>
      <CardContent className="space-y-3 pt-5 pb-5">{children}</CardContent>
    </Card>
  );
}

export function EstadoChip({ tone, children }: { tone: "urgencia" | "exito" | "humano"; children: React.ReactNode }) {
  const fill = tone === "urgencia" ? "var(--urgencia-fill)" : tone === "exito" ? "var(--exito-fill)" : "var(--humano)";
  const text = tone === "humano" ? "#ffffff" : "var(--foreground)";
  return (
    <span style={{ display: "inline-block", background: fill, color: text, fontSize: "var(--text-label)", fontWeight: 600, padding: "3px 10px", borderRadius: "var(--radius-pildora)" }}>
      {children}
    </span>
  );
}

export function CTAPrincipal({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  // I-06: una sola acción destacada por pantalla, en negro/inversión.
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="w-full"
      style={{
        background: disabled ? "var(--border)" : "var(--primary)",
        color: disabled ? "var(--muted-foreground)" : "var(--primary-foreground)",
        borderRadius: "var(--radius-control)",
        minHeight: 44,
        fontWeight: 600,
        fontSize: "var(--text-body)",
      }}
    >
      {children}
    </Button>
  );
}

export function CTASecundaria({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "center", fontSize: "var(--text-label)", color: "var(--muted-foreground)", marginTop: 10, background: "transparent", border: "none" }}>
      {children}
    </button>
  );
}

export function Fila({ label, value, ausente }: { label: string; value: React.ReactNode; ausente?: boolean }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "9px 0", borderBottom: ".5px solid var(--border)", fontSize: "var(--text-body)" }}>
      <span style={{ color: "var(--muted-foreground)", fontSize: "var(--text-label)" }}>{label}</span>
      <span style={{ fontWeight: 500, fontStyle: ausente ? "italic" : "normal", color: ausente ? "var(--muted-foreground)" : "var(--foreground)" }}>{value}</span>
    </div>
  );
}

/** Barra de progreso del recorrido de diseño — no es parte del producto. */
export function PasoDelRecorrido({ paso, total, label }: { paso: number; total: number; label: string }) {
  return (
    <div className="flex items-center justify-between hairline-b pb-3" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
      <span>{label}</span>
      <span>{paso} de {total}</span>
    </div>
  );
}
