"use client";

/** ACHIEVE — Evidencia (VI.5). Copy literal §6.1 (EXPECTED). */

import { useState } from "react";
import { Eyebrow, ReglaDeNegocio, HeroCard, CTAPrincipal, CTASecundaria } from "./design-system";

export function Evidencia({ onAvanzar }: { onAvanzar?: () => void }) {
  const [adjunto, setAdjunto] = useState(false);

  return (
    <div className="space-y-4" style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}>
      <header>
        <Eyebrow>Cursado · Análisis II</Eyebrow>
        <h2 style={{ fontSize: 20 }}>Resolver ejercicios 8–14</h2>
        <p className="subcopy" style={{ marginTop: 2 }}>Unidad 3</p>
      </header>

      <HeroCard>
        <Eyebrow>Evidencia esperada</Eyebrow>
        <ReglaDeNegocio>7 completos y adjuntos · Cierre: producción inspeccionable</ReglaDeNegocio>

        <button
          onClick={() => setAdjunto(true)}
          className="w-full text-center"
          style={{ border: "1px dashed var(--border)", borderRadius: "var(--radius-control)", padding: 18, marginTop: 10 }}
        >
          <div style={{ fontSize: 20, marginBottom: 4 }}>+</div>
          <div style={{ fontSize: "var(--text-label)", fontWeight: 600 }}>Adjuntar evidencia</div>
          <div style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)", marginTop: 4 }}>Permitido: foto o archivo</div>
          {!adjunto && <div style={{ fontStyle: "italic", color: "var(--muted-foreground)", fontSize: "var(--text-label)", marginTop: 6 }}>Todavía no adjuntaste contenido.</div>}
          {adjunto && <div style={{ color: "var(--exito-texto)", fontSize: "var(--text-label)", marginTop: 6 }}>foto_01.jpg cargada</div>}
        </button>

        <CTASecundaria>Agregar reflexión (opcional)</CTASecundaria>
        <ReglaDeNegocio>Enviar: queda SUBMITTED; sigue validación. No implica suficiencia ni dominio.</ReglaDeNegocio>
        <CTAPrincipal onClick={onAvanzar} disabled={!adjunto}>Enviar evidencia</CTAPrincipal>
      </HeroCard>
    </div>
  );
}
