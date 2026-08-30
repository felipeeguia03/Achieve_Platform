"use client";

/**
 * Topbar del shell (Fase A2.1).
 *
 * Patrón de `docs/diseño/`: breadcrumb a la izquierda, buscador al centro,
 * contexto de cuenta a la derecha. Alto medido: **56 px**
 * (`design-system-capturas.md` §12.3).
 *
 * **La topbar no lleva la CTA primaria de la pantalla.** Lleva navegación y
 * contexto. La acción principal vive a ancho completo al final de la columna
 * principal ([ADR-015](../../docs/decisions.md)).
 */

import Link from "next/link";
import { Search } from "lucide-react";
import { t } from "@/lib/content/es-AR";

export interface Miga {
  etiqueta: string;
  /** `null` ⇒ es el elemento actual y no se enlaza. */
  href: string | null;
}

export function BarraSuperior({ migas }: { migas: readonly Miga[] }) {
  return (
    <header
      className="hairline-b flex items-center gap-4"
      style={{
        height: 56,
        flexShrink: 0,
        padding: "0 24px",
        borderBottom: ".5px solid var(--border)",
        background: "var(--background)",
      }}
    >
      {/* Breadcrumb: el camino completo, con el objeto actual al final. */}
      <nav aria-label="Ruta" className="flex items-center gap-2 min-w-0">
        {migas.map((miga, i) => (
          <span key={miga.etiqueta} className="flex items-center gap-2 min-w-0">
            {i > 0 && (
              <span aria-hidden style={{ color: "var(--muted-foreground)", fontSize: "var(--text-label)" }}>
                ›
              </span>
            )}
            {miga.href === null ? (
              <span
                aria-current="page"
                className="truncate"
                style={{ fontSize: "var(--text-label)", color: "var(--foreground)" }}
              >
                {miga.etiqueta}
              </span>
            ) : (
              <Link
                href={miga.href}
                className="truncate"
                style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}
              >
                {miga.etiqueta}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/*
        El buscador se dibuja deshabilitado hasta que exista la paleta de
        comandos (Etapa A2.2). Deshabilitado con tratamiento propio —opacidad,
        cursor y `aria-disabled`— distinto de secundario, que es el
        anti-patrón `A-08`. No se ofrece un campo que no busca nada.
      */}
      <div
        className="ml-auto hidden lg:flex items-center gap-2"
        aria-disabled="true"
        title="Disponible en la próxima etapa"
        style={{
          background: "var(--muted)",
          border: ".5px solid var(--border)",
          borderRadius: "var(--radius-pildora)",
          padding: "6px 14px",
          minWidth: 260,
          opacity: 0.55,
          cursor: "not-allowed",
          color: "var(--muted-foreground)",
          fontSize: "var(--text-label)",
        }}
      >
        <Search size={15} aria-hidden />
        <span>{t("SHELL.BUSCAR")}</span>
        <kbd
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-meta)",
          }}
        >
          ⌘K
        </kbd>
      </div>
    </header>
  );
}
