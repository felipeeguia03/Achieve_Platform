"use client";

/**
 * ACHIEVE — Hoy / Autogestión (VI.1)
 * Motor de precedencia de 9 niveles (§3.2) como función pura + los 4 estados
 * demostrados con wireframe (A, B, C, D1), copy literal.
 */

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Eyebrow, EstadoGeneral, ReglaDeNegocio, HeroCard, EstadoChip, CTAPrincipal } from "./design-system";

type ActionStatus = "IN_PROGRESS" | "EVIDENCE_PENDING" | "NONE";
type CommitmentStatus = "CONFIRMED_OR_DUE" | "MISSED" | "NONE";
type RescueStatus = "REQUIRED" | "MATERIALIZED" | "NONE";

export type HeroInput = {
  action: ActionStatus;
  commitment: CommitmentStatus;
  rescue: RescueStatus;
  actionRecommended: boolean;
  contextIncomplete: boolean;
  evidenceInfoOnly: boolean;
};

export type HeroLevel =
  | "IN_PROGRESS" | "EVIDENCE_PENDING" | "COMMITMENT_NEXT" | "RESCUE_REQUIRED"
  | "COMMITMENT_MISSED" | "ACTION_RECOMMENDED" | "CONTEXT_INCOMPLETE"
  | "EVIDENCE_INFO" | "NO_ACTION_AVAILABLE";

/** VI.1 §3.2 — el primero que aplique gana. No se reordena por riesgo ni por examen (§3.3). */
export function selectHeroLevel(input: HeroInput): HeroLevel {
  if (input.action === "IN_PROGRESS") return "IN_PROGRESS";
  if (input.action === "EVIDENCE_PENDING") return "EVIDENCE_PENDING";
  if (input.commitment === "CONFIRMED_OR_DUE" || input.rescue === "MATERIALIZED") return "COMMITMENT_NEXT";
  if (input.rescue === "REQUIRED") return "RESCUE_REQUIRED";
  if (input.commitment === "MISSED") return "COMMITMENT_MISSED";
  if (input.actionRecommended) return "ACTION_RECOMMENDED";
  if (input.contextIncomplete) return "CONTEXT_INCOMPLETE";
  if (input.evidenceInfoOnly) return "EVIDENCE_INFO";
  return "NO_ACTION_AVAILABLE";
}

const DEMO_STATES = [
  { id: "A", label: "A · Al día", input: { action: "NONE", commitment: "NONE", rescue: "NONE", actionRecommended: true, contextIncomplete: false, evidenceInfoOnly: false } as HeroInput },
  { id: "B", label: "B · En curso", input: { action: "IN_PROGRESS", commitment: "NONE", rescue: "NONE", actionRecommended: false, contextIncomplete: false, evidenceInfoOnly: false } as HeroInput },
  { id: "C", label: "C · Evidencia", input: { action: "EVIDENCE_PENDING", commitment: "NONE", rescue: "NONE", actionRecommended: false, contextIncomplete: false, evidenceInfoOnly: false } as HeroInput },
  { id: "D1", label: "D1 · Rescate", input: { action: "NONE", commitment: "NONE", rescue: "REQUIRED", actionRecommended: false, contextIncomplete: false, evidenceInfoOnly: false } as HeroInput },
] as const;

type MateriaResumen = { nombre: string; estado: string; ultimoAvance: string; tone: "neutral" | "urgencia" };

function HeroContent({ level, onAvanzar }: { level: HeroLevel; onAvanzar?: () => void }) {
  switch (level) {
    case "ACTION_RECOMMENDED":
      return (
        <HeroCard>
          <Eyebrow>Programación · Unidad 4</Eyebrow>
          <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, color: "var(--foreground)" }}>Resolver ejercicios 1–5</p>
          <ReglaDeNegocio>Porque: consolida lo visto hoy.</ReglaDeNegocio>
          <ReglaDeNegocio>40 min · Entregá: 5 ejercicios</ReglaDeNegocio>
          <ReglaDeNegocio>Después: queda definido cuándo vas a hacerla.</ReglaDeNegocio>
          <CTAPrincipal onClick={onAvanzar}>Comprometerme</CTAPrincipal>
        </HeroCard>
      );
    case "IN_PROGRESS":
      return (
        <HeroCard>
          <Eyebrow>Análisis II · Unidad 3</Eyebrow>
          <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, color: "var(--foreground)" }}>Resolver ejercicios 8–14</p>
          <ReglaDeNegocio>Porque: prepara la próxima clase.</ReglaDeNegocio>
          <ReglaDeNegocio>En curso · Entregá: 7 ejercicios</ReglaDeNegocio>
          <ReglaDeNegocio>Al terminar, subís la evidencia acordada.</ReglaDeNegocio>
          <CTAPrincipal onClick={onAvanzar}>Continuar</CTAPrincipal>
        </HeroCard>
      );
    case "EVIDENCE_PENDING":
      return (
        <HeroCard>
          <Eyebrow>Análisis II · Unidad 3</Eyebrow>
          <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, color: "var(--foreground)" }}>Subí los ejercicios 8–14</p>
          <ReglaDeNegocio>Porque: la acción se cierra con evidencia verificable.</ReglaDeNegocio>
          <ReglaDeNegocio>Entregá: foto/archivo de 7 ejercicios</ReglaDeNegocio>
          <ReglaDeNegocio>Después: la evidencia queda pendiente de validación.</ReglaDeNegocio>
          <CTAPrincipal onClick={onAvanzar}>Subir evidencia</CTAPrincipal>
        </HeroCard>
      );
    case "RESCUE_REQUIRED":
      return (
        <HeroCard>
          <EstadoChip tone="urgencia">Análisis II · Compromiso incumplido</EstadoChip>
          <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, color: "var(--foreground)" }}>Necesitamos rearmar este compromiso.</p>
          <ReglaDeNegocio>Porque: el compromiso de las 19:00 quedó incumplido.</ReglaDeNegocio>
          <ReglaDeNegocio>Primero necesitamos acordar cómo retomar.</ReglaDeNegocio>
          <CTAPrincipal onClick={onAvanzar}>Retomar</CTAPrincipal>
        </HeroCard>
      );
    default:
      return (
        <HeroCard>
          <ReglaDeNegocio>No hay una próxima acción disponible. Podés revisar tus materias.</ReglaDeNegocio>
          <CTAPrincipal onClick={onAvanzar}>Ver materias</CTAPrincipal>
        </HeroCard>
      );
  }
}

function estadoGeneralPara(level: HeroLevel): string {
  switch (level) {
    case "ACTION_RECOMMENDED": return "BAJO CONTROL";
    case "IN_PROGRESS": return "ACCIÓN EN CURSO";
    case "EVIDENCE_PENDING": return "FALTA CERRAR ESTA ACCIÓN";
    case "RESCUE_REQUIRED": return "NECESITA RECUPERACIÓN";
    default: return "SIN ACCIONES POR AHORA";
  }
}

function MateriasQueue({ materias, onVerMateria }: { materias: MateriaResumen[]; onVerMateria?: () => void }) {
  const [index, setIndex] = useState(0);
  const multiple = materias.length > 1;
  const actual = materias[index];
  if (!actual) return null;

  return (
    <div className="hairline-t pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="eyebrow" style={{ marginBottom: 0 }}>Materias</p>
        {multiple && (
          <div className="flex items-center gap-2" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
            <button aria-label="Anterior" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} style={{ opacity: index === 0 ? 0.3 : 1 }}><ArrowLeft size={14} /></button>
            <span>{index + 1} de {materias.length}</span>
            <button aria-label="Siguiente" onClick={() => setIndex((i) => Math.min(materias.length - 1, i + 1))} disabled={index === materias.length - 1} style={{ opacity: index === materias.length - 1 ? 0.3 : 1 }}><ArrowRight size={14} /></button>
          </div>
        )}
      </div>
      <button onClick={onVerMateria} className="flex w-full items-center justify-between text-left" style={{ fontSize: "var(--text-body)" }}>
        <span style={{ color: "var(--foreground)" }}>{actual.nombre}</span>
        <span style={{ color: actual.tone === "urgencia" ? "var(--urgencia-texto)" : "var(--muted-foreground)", fontSize: "var(--text-label)" }}>{actual.estado}</span>
      </button>
      <p style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
        {actual.ultimoAvance ? `Último avance: ${actual.ultimoAvance}` : <span style={{ fontStyle: "italic" }}>Sin avance registrado</span>}
      </p>
    </div>
  );
}

export function HoyAutogestion({ onAvanzar, onVerMateria }: { onAvanzar?: () => void; onVerMateria?: () => void }) {
  const [demoId, setDemoId] = useState<(typeof DEMO_STATES)[number]["id"]>("A");
  const demo = DEMO_STATES.find((d) => d.id === demoId) ?? DEMO_STATES[0];
  const level = useMemo(() => selectHeroLevel(demo.input), [demo]);

  const materias: MateriaResumen[] = level === "RESCUE_REQUIRED"
    ? [{ nombre: "Análisis II", estado: "Necesita atención", ultimoAvance: "", tone: "urgencia" }]
    : [
        { nombre: "Programación", estado: "Bajo control", ultimoAvance: "hoy", tone: "neutral" },
        { nombre: "Análisis II", estado: level === "IN_PROGRESS" || level === "EVIDENCE_PENDING" ? "Necesita atención" : "Bajo control", ultimoAvance: "ayer", tone: "neutral" },
        { nombre: "Arquitectura", estado: "Bajo control", ultimoAvance: "hace 3 días", tone: "neutral" },
      ];

  return (
    <div className="space-y-4" style={{ background: "var(--background)", padding: "16px", borderRadius: "var(--radius)" }}>
      <div className="flex gap-1.5 hairline-b pb-3">
        {DEMO_STATES.map((s) => (
          <button key={s.id} onClick={() => setDemoId(s.id)} style={{ fontSize: "var(--text-meta)", fontFamily: "var(--font-mono)", padding: "4px 10px", borderRadius: "var(--radius-pildora)", border: "1px solid var(--border)", background: demoId === s.id ? "var(--primary)" : "transparent", color: demoId === s.id ? "var(--primary-foreground)" : "var(--muted-foreground)" }}>
            {s.label}
          </button>
        ))}
      </div>
      <header>
        <Eyebrow>Proyección · no prioriza</Eyebrow>
        <h2>Hoy</h2>
        <p className="subcopy">vie 28 ago</p>
      </header>
      <EstadoGeneral>{estadoGeneralPara(level)}</EstadoGeneral>
      <HeroContent level={level} onAvanzar={onAvanzar} />
      <MateriasQueue materias={materias} onVerMateria={onVerMateria} />
    </div>
  );
}
