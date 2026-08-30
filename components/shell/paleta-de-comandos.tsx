"use client";

/**
 * Paleta de comandos (Etapa A2.2).
 *
 * `I-03` del manual: **entrada polimórfica** —un solo campo que acepta todos
 * los tipos de identificador y desambigua solo—, con **una vía de escape para
 * forzar la interpretación cuando dos formatos colisionen**. Acá los prefijos
 * `>` y `#` son esa vía, y se muestran en pantalla: una vía de escape que hay
 * que adivinar no es una vía de escape.
 *
 * `I-04`: **el atajo se muestra dentro del control que dispara**. El `⌘K` vive
 * en el buscador de la topbar, no en un tooltip.
 *
 * `P-07`: ningún atajo elimina su camino visible — la paleta no reemplaza a la
 * navegación lateral, la acompaña.
 *
 * **Cero red y cero persistencia.** Busca sobre el catálogo en memoria y no
 * recuerda nada entre sesiones.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { buscarEnPaleta } from "@/lib/navigation/paleta";
import { indiceDePaleta } from "@/lib/fixtures/indice-paleta";
import { t } from "@/lib/content/es-AR";

export function PaletaDeComandos({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  // Remontar en cada apertura deja la paleta limpia sin resetear estado dentro
  // de un efecto, que encadena renders.
  return abierta ? <Dialogo onCerrar={onCerrar} /> : null;
}

function Dialogo({ onCerrar }: { onCerrar: () => void }) {
  const router = useRouter();
  const [consulta, setConsulta] = useState("");
  const [seleccion, setSeleccion] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const contenedor = useRef<HTMLDivElement>(null);

  const { entradas, forzado } = useMemo(() => buscarEnPaleta(indiceDePaleta, consulta), [consulta]);

  // El foco es un efecto legítimo: toca el DOM, no el estado. Reiniciar
  // consulta y selección NO se hace acá — se hace remontando el diálogo con
  // `key`, para no encadenar renders.
  useEffect(() => {
    campo.current?.focus();
  }, []);

  function elegir(indice: number) {
    const entrada = entradas[indice];
    if (entrada === undefined) return;
    onCerrar();
    router.push(entrada.url);
  }

  function alTeclear(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      // Escape con jerarquía definida (`I-02`): cierra la paleta y devuelve el
      // foco a la pantalla, sin navegar.
      e.preventDefault();
      onCerrar();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSeleccion((i) => Math.min(entradas.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSeleccion((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      elegir(seleccion);
    }
  }

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
        zIndex: 50,
      }}
    >
      <div
        ref={contenedor}
        role="dialog"
        aria-modal="true"
        aria-label={t("PALETA.TITULO")}
        onKeyDown={alTeclear}
        style={{
          width: "min(640px, calc(100vw - 32px))",
          background: "var(--card)",
          borderRadius: "var(--radius)",
          border: ".5px solid var(--border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        <div
          className="hairline-b flex items-center gap-3"
          style={{ padding: "14px 18px", borderBottom: ".5px solid var(--border)" }}
        >
          <Search size={16} aria-hidden style={{ color: "var(--muted-foreground)" }} />
          <input
            ref={campo}
            value={consulta}
            onChange={(e) => {
              setConsulta(e.target.value);
              setSeleccion(0);
            }}
            placeholder={t("PALETA.PLACEHOLDER")}
            aria-label={t("PALETA.PLACEHOLDER")}
            aria-controls="paleta-resultados"
            style={{
              flex: 1,
              background: "transparent",
              outline: "none",
              fontSize: "var(--text-body)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/*
          La vía de escape de `I-03`, visible. Forzar la interpretación no sirve
          si hay que adivinar cómo se fuerza.
        */}
        <div
          className="hairline-b"
          style={{
            padding: "8px 18px",
            borderBottom: ".5px solid var(--border)",
            fontSize: "var(--text-meta)",
            color: "var(--muted-foreground)",
          }}
        >
          {forzado === null ? t("PALETA.AYUDA") : t(`PALETA.FORZADO.${forzado === "superficie" ? "SUPERFICIE" : "ESCENARIO"}` as never)}
        </div>

        <ul id="paleta-resultados" role="listbox" style={{ maxHeight: "48vh", overflowY: "auto" }}>
          {entradas.length === 0 ? (
            // El vacío explica qué se puede buscar, no dice "sin resultados".
            <li style={{ padding: "20px 18px" }}>
              <p style={{ fontSize: "var(--text-body)", fontWeight: 600 }}>{t("PALETA.VACIO")}</p>
              <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
                {t("PALETA.VACIO_AYUDA")}
              </p>
            </li>
          ) : (
            entradas.map((entrada, i) => (
              <li key={entrada.url} role="option" aria-selected={i === seleccion}>
                <button
                  onMouseEnter={() => setSeleccion(i)}
                  onClick={() => elegir(i)}
                  data-entrada-paleta={entrada.tipo}
                  className="flex w-full items-baseline gap-3 text-left"
                  style={{
                    padding: "10px 18px",
                    background: i === seleccion ? "var(--muted)" : "transparent",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--text-body)",
                      color: "var(--foreground)",
                      fontFamily: entrada.tipo === "escenario" ? "var(--font-mono)" : undefined,
                    }}
                  >
                    {entrada.titulo}
                  </span>
                  <span
                    className="truncate"
                    style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}
                  >
                    {entrada.detalle}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
