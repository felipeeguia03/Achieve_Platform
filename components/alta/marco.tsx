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

/**
 * Cuántas pantallas tiene el alta. Cuatro desde
 * [ADR-073](../../docs/decisions.md#adr-073): WhatsApp, carrera, materias y
 * disponibilidad.
 */
export const PASOS_DEL_ALTA = 4;

export function MarcoDelAlta({
  paso,
  titulo,
  ayuda,
  children,
  ancho = 560,
}: {
  paso: 1 | 2 | 3 | 4;
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
            El total se dice. No es el "paso 5 de 12" que el protocolo de examen
            tiene prohibido: allá el total no está determinado y afirmarlo sería
            falso; acá el alta tiene un número exacto de pantallas y saber
            cuántas faltan es lo que hace que se sienta breve.

            ⚠️ **Son cuatro desde ADR-073**, no tres. El número vive en una
            constante y no repetido en cada pantalla: agregar un paso y olvidarse
            de actualizar el denominador le mostraría al estudiante "4/3".
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
            {t("ALTA.PASOS")} · {paso}/{PASOS_DEL_ALTA}
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
