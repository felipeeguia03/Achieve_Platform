"use client";

/** ACHIEVE — Compromiso (VI.4). Copy literal §6.1 (DRAFT estándar). */

import { Eyebrow, ReglaDeNegocio, HeroCard, EstadoChip, CTAPrincipal, Fila } from "./design-system";

export function Compromiso({ onAvanzar }: { onAvanzar?: () => void }) {
  return (
    <div className="space-y-4" style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}>
      <header>
        <Eyebrow>Unidad 3 · Acción aceptada</Eyebrow>
        <h2 style={{ fontSize: 20 }}>Resolver ejercicios 8–14</h2>
      </header>

      <HeroCard>
        <Fila label="Fecha" value="Sáb 23 ago ▾" />
        <Fila label="Hora" value="19:00 ▾" />
        <Fila label="Tiempo que declarás" value="70 min ▾" />
        <ReglaDeNegocio>Estimación 60–75 · cubre el mínimo. Zona horaria: Córdoba.</ReglaDeNegocio>
      </HeroCard>

      <HeroCard>
        <ReglaDeNegocio>Evidencia esperada: 7 ejercicios · Cierre: completos y adjuntos</ReglaDeNegocio>
        <ReglaDeNegocio>
          Después: queda <EstadoChip tone="humano">CONFIRMED</EstadoChip> en Hoy y Materia; podrás iniciarlo cuando corresponda.
        </ReglaDeNegocio>
        <CTAPrincipal onClick={onAvanzar}>Confirmar compromiso</CTAPrincipal>
      </HeroCard>
    </div>
  );
}
