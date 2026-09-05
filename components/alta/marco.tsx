"use client";

/**
 * El marco de las tres pantallas del alta — Fase B6.14.5,
 * [ADR-052](../../docs/decisions.md#adr-052).
 *
 * **Fuera del `Shell`, como `/login`.** Estas pantallas no son superficies de
 * producto: el registro canónico de navegación sigue teniendo nueve nodos, no
 * existe `UX10`, y dibujar la navegación lateral acá ofrecería nueve destinos
 * que el estudiante todavía no puede visitar — todos devuelven `409`.
 *
 * El orden semántico de `design-system.md` §6.1 se conserva: estado, contexto,
 * la decisión, una razón, y **la CTA principal a ancho completo al final**. A
 * 360 px baja el tamaño, nunca la cantidad de información (`A-03`).
 */

import { t } from "@/lib/content/es-AR";

export function MarcoDelAlta({
  paso,
  titulo,
  ayuda,
  children,
  ancho = 560,
}: {
  paso: 1 | 2 | 3;
  titulo: string;
  /** La razón, pegada a la decisión (`P-01`). `null` ⇒ la línea desaparece. */
  ayuda?: string | null;
  children: React.ReactNode;
  ancho?: number;
}) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "start center",
        padding: "48px 24px",
        background: "var(--background)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: `${ancho}px`,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <header style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/*
            Tres pasos, y se dicen. No es el "paso 5 de 12" que el protocolo de
            examen tiene prohibido: allá el total no está determinado y afirmarlo
            sería falso; acá el alta tiene exactamente tres pantallas y saber
            cuántas faltan es lo que hace que se sienta breve.
          */}
          <p
            style={{
              fontSize: "var(--text-meta)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted-foreground)",
              margin: 0,
            }}
          >
            {t("ALTA.PASOS")} · {paso}/3
          </p>
          <h1 style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, margin: 0 }}>{titulo}</h1>
          {ayuda && (
            <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: 0 }}>{ayuda}</p>
          )}
        </header>
        {children}
      </div>
    </main>
  );
}

/** El error de red, con `role="alert"` para que se anuncie sin recorrer todo. */
export function ErrorDelAlta({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null;
  return (
    <p role="alert" style={{ fontSize: "13px", color: "var(--urgencia-texto)", margin: 0 }}>
      {mensaje}
    </p>
  );
}
