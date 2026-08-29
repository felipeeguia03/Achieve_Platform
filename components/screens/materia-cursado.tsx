"use client";

/** ACHIEVE — Materia / Cursado (VI.2). Copy literal §7 (wireframe base). */

import { Eyebrow, EstadoGeneral, ReglaDeNegocio, HeroCard, EstadoChip, CTAPrincipal, Fila } from "./design-system";

export function MateriaCursado({ onAvanzar }: { onAvanzar?: () => void }) {
  return (
    <div className="space-y-4" style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}>
      <header>
        <Eyebrow>Análisis Matemático II</Eyebrow>
        <h2 style={{ fontSize: 22 }}>Cursado</h2>
        <p className="subcopy" style={{ marginTop: 2 }}>Examen · Parcial 1</p>
      </header>

      <EstadoGeneral>
        <EstadoChip tone="urgencia">Necesita atención</EstadoChip>
        <span style={{ marginLeft: 8, fontWeight: 400, color: "var(--muted-foreground)" }}>avance hace 2 días</span>
      </EstadoGeneral>

      <HeroCard>
        <Eyebrow>Ahora · Unidad 3</Eyebrow>
        <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, color: "var(--foreground)" }}>Resolver ejercicios 8–14</p>
        <ReglaDeNegocio>Porque: prepara la próxima clase.</ReglaDeNegocio>
        <ReglaDeNegocio>60–75 min · Entrega: 7 ejercicios</ReglaDeNegocio>
        <CTAPrincipal onClick={onAvanzar}>Comprometerme</CTAPrincipal>
      </HeroCard>

      {/* P-08: dos fuentes de verdad, nunca fusionadas */}
      <div>
        <Eyebrow>Cátedra y vos</Eyebrow>
        <div className="flex gap-3 rounded-[var(--radius-control)] border p-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <div className="flex-1">
            <p style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: ".04em" }}>Reporte de clase</p>
            <p style={{ fontSize: "var(--text-label)", lineHeight: 1.4 }}>U4 iniciada<br /><span style={{ color: "var(--muted-foreground)" }}>reportado por vos · sin corroborar</span></p>
          </div>
          <div className="flex-1">
            <p style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: ".04em" }}>Vos</p>
            <p style={{ fontSize: "var(--text-label)", lineHeight: 1.4 }}>U3 con práctica pendiente<br /><span style={{ color: "var(--urgencia-texto)" }}>Brecha: existe y requiere atención</span></p>
          </div>
        </div>
      </div>

      <div>
        <Eyebrow>Unidades</Eyebrow>
        <Fila label="U1" value="práctica registrada" />
        <Fila label="U2" value="en construcción" />
        <Fila label="U3" value={<span style={{ color: "var(--urgencia-texto)" }}>necesita atención</span>} />
        <Fila label="U4" value="recorrido inicial" />
      </div>
    </div>
  );
}
