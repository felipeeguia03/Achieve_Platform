"use client";

/** ACHIEVE — Progreso / Bitácora (VI.6). Copy literal §16.5 (VALIDATED con cambio confirmado). */

import { Eyebrow, ReglaDeNegocio, HeroCard, EstadoChip, CTAPrincipal, CTASecundaria, Fila } from "./design-system";

export function ProgresoBitacora({ onAvanzar }: { onAvanzar?: () => void }) {
  return (
    <div className="space-y-4" style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}>
      <header>
        <Eyebrow>Avance · Análisis II · Unidad 3</Eyebrow>
      </header>

      <div>
        <EstadoChip tone="exito">Evidencia validada</EstadoChip>
        <ReglaDeNegocio>Ejercicios 8–14 · validada 20:26</ReglaDeNegocio>
      </div>

      <div>
        <Eyebrow>Cambio confirmado</Eyebrow>
        <Fila label="Práctica" value="12 → 19 ejercicios" />
        <Fila label="Recencia" value="hoy" />
        <p style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)", marginTop: 6 }}>Fuente: Evidence validada</p>
      </div>

      <div>
        <Eyebrow>Sin cambio confirmado</Eyebrow>
        <Fila label="Recorrido" value="conserva su estado" ausente />
        <Fila label="Dominio" value="no evaluado" ausente />
        <Fila label="Confianza" value="alta · declarada ayer" />
      </div>

      <HeroCard>
        <Eyebrow>Qué sigue</Eyebrow>
        <ReglaDeNegocio>Reforzar cambio de variables.</ReglaDeNegocio>
        <CTAPrincipal onClick={onAvanzar}>Ver siguiente acción</CTAPrincipal>
      </HeroCard>
      <CTASecundaria>Ver Bitácora</CTASecundaria>
    </div>
  );
}
