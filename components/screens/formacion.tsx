"use client";

/**
 * La biblioteca de Formación — [ADR-087](../../docs/decisions.md#adr-087).
 *
 * ## Las cuatro reglas que esta pantalla hace cumplir
 *
 * 1. **Es opcional, y se nota.** `D1` la declaró *opcional y no obligatoria*:
 *    sin contador en el menú, sin nada que caduque, sin progreso de biblioteca.
 *    Un «3 de 5 vistas» convertiría en deuda algo que el estudiante puede no
 *    abrir nunca sin consecuencia.
 * 2. **V1 es de solo lectura.** ADR-087 Enmienda 2: la pieza se abre y se lee
 *    siempre, **con cursadas o sin ellas**. No hay botón, no hay selector de
 *    materia y no hay `CTA-021`: la escritura no existe todavía, y un control
 *    que la prometiera mentiría.
 * 3. **No hay video.** La autora declara que faltan los guiones. `D4`: se
 *    omite, no se simula — ni reproductor vacío ni *«próximamente»*.
 * 4. **No promete aprendizaje.** Formación enseña método; no certifica que se
 *    sepa. Nada de «dominado», «nivel» ni porcentajes ([ADR-072](../../docs/decisions.md#adr-072),
 *    [ADR-075](../../docs/decisions.md#adr-075) §C1).
 */

import { useState } from "react";

import { t } from "@/lib/content/es-AR";
import type { FormacionProps, PiezaDeFormacion } from "@/lib/domain/view-models";
import { ReglaDeNegocio, TituloDePanel } from "./design-system";

export type FormacionScreenProps = FormacionProps;

export function Formacion({ piezas, aviso }: FormacionScreenProps) {
  // Cuál está abierta. Estado de sesión, no de dominio: no se persiste.
  const [abierta, setAbierta] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/*
        `D-01`: el `h1` lo dibuja la primitiva, no la pantalla. Hay guard, y es
        el que lo encontró: una superficie con su propio `h1` se sale de la
        escala tipográfica y del árbol de encabezados sin que nadie lo note.
      */}
      <TituloDePanel
        eyebrow={t("FORMACION.EYEBROW")}
        titulo={t("FORMACION.TITULO")}
        escala={30}
        subcopy={t("FORMACION.SUBCOPY")}
      />

      {/*
        Estado vacío o incompleto: se dice, no se disimula. Va **arriba** de
        cualquier CTA (`I-05`), y sin imperativo — el estudiante no puede
        publicar contenido ni inscribirse a una materia desde acá (`C-04`).
      */}
      {aviso && (
        <ReglaDeNegocio>
          <span style={{ color: "var(--urgencia-texto)" }}>{aviso}</span>
        </ReglaDeNegocio>
      )}

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {piezas.map((p) => (
          <Pieza
            key={p.id}
            pieza={p}
            abierta={abierta === p.id}
            onAlternar={() => setAbierta((a) => (a === p.id ? null : p.id))}
          />
        ))}
      </ul>
    </div>
  );
}

function Pieza({
  pieza,
  abierta,
  onAlternar,
}: {
  pieza: PiezaDeFormacion;
  abierta: boolean;
  onAlternar: () => void;
}) {
  return (
    <li
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--card)",
        overflow: "hidden",
      }}
    >
      {/*
        El título es **la frase del estudiante**, no un rótulo de catálogo. Es
        como la nombra la autora, y es lo que hace que alguien se reconozca en
        la lista antes de abrir nada.
      */}
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierta}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "14px 18px",
          background: "transparent",
          border: 0,
          font: "inherit",
          color: "inherit",
          cursor: "pointer",
        }}
      >
        <p style={{ fontSize: "var(--text-body)", fontWeight: 600, margin: 0 }}>«{pieza.titulo}»</p>
        <p style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)", margin: "4px 0 0" }}>
          {pieza.problema}
        </p>
      </button>

      {abierta && (
        <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          <Parte titulo={t("FORMACION.OBJETIVO")}>{pieza.objetivo}</Parte>
          <Parte titulo={t("FORMACION.EXPLICACION")}>{pieza.explicacion}</Parte>
          <Parte titulo={t("FORMACION.ACCION")}>{pieza.accionPosterior}</Parte>
          <Parte titulo={t("FORMACION.EVIDENCIA")}>{pieza.evidenciaEsperada}</Parte>
          {/* `null` ⇒ la pieza no declara material: la línea **desaparece**. */}
          {pieza.material && <Parte titulo={t("FORMACION.MATERIAL")}>{pieza.material}</Parte>}

          {/*
            La procedencia va **junto al dato** (`product.md` §7), nunca sólo en
            un tooltip. La traduce `provenanceVisible()`; acá sólo se muestra.
          */}
          <p style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)", margin: 0 }}>
            {pieza.procedencia}
          </p>
        </div>
      )}
    </li>
  );
}

/**
 * Una de las seis partes de la pieza.
 *
 * ⚠️ **No usa `TituloDePanel`**, aunque la tentación era obvia: esa primitiva
 * dibuja un `h1`, y seis de ellas dejarían la superficie con siete. `D-01` pide
 * **uno solo**, y el de esta pantalla ya lo puso el encabezado.
 */
function Parte({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        style={{
          fontSize: "var(--text-label)",
          fontWeight: 600,
          color: "var(--muted-foreground)",
          margin: 0,
        }}
      >
        {titulo}
      </h2>
      <p style={{ fontSize: "var(--text-body)", margin: "4px 0 0" }}>{children}</p>
    </div>
  );
}
