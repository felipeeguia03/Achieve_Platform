"use client";

/** ACHIEVE — Próxima Acción (VI.3). Copy literal §5.1. */

import { Eyebrow, ReglaDeNegocio, HeroCard, CTAPrincipal, CTASecundaria, Fila } from "./design-system";

export function ProximaAccion({ onAvanzar }: { onAvanzar?: () => void }) {
  return (
    <div className="space-y-4" style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}>
      <header>
        <Eyebrow>Cursado · Análisis II</Eyebrow>
        <h2 style={{ fontSize: 22 }}>Unidad 3</h2>
      </header>

      <HeroCard>
        <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, color: "var(--foreground)", marginTop: 0 }}>Resolver ejercicios 8–14</p>
        <ReglaDeNegocio>Porque: prepara la próxima clase.</ReglaDeNegocio>
        <Fila label="Duración" value="60–75 min" />
        <Fila label="Usá" value="Guía 3 · Cátedra · oficial" />
        <Fila label="Evidencia" value="7 ejercicios resueltos" />
        <ReglaDeNegocio>Cerrás cuando: están completos y adjuntás la producción acordada.</ReglaDeNegocio>
        <ReglaDeNegocio>Después: definís cuándo vas a hacerla.</ReglaDeNegocio>
        <CTAPrincipal onClick={onAvanzar}>Me comprometo</CTAPrincipal>
        <CTASecundaria>No puedo hacerla · Corregir dato</CTASecundaria>
      </HeroCard>

      <CTASecundaria>Ver razones y fuentes</CTASecundaria>
    </div>
  );
}
