/**
 * 🧪 **LABORATORIO DESCARTABLE — «Mi Plan vivo» V2.** `/demo/plan-vivo-spike-v2`
 *
 * La evolución de V1 (`/demo/plan-vivo-spike`, que sigue intacta): seleccionar
 * cualquier elemento, reorganizar lo que legítimamente puede moverse, simular
 * hasta cinco workitems en cadena y ver a la vez el plan semanal, el camino y el
 * Gantt académico. **No es producto**: sin Shell, sin sesión, sin base, sin red y
 * sin escritura. Decide [ADR-109](../../../docs/decisions.md#adr-109), `PENDING`.
 *
 * ⚠️ **Apagada por defecto, con flag propio.** Sin `PLAN_VIVO_SPIKE_V2=1` responde
 * `404`. `PLAN_VIVO_SPIKE=1` prende V1 y **no** prende esta.
 *
 * `?escenario=` elige un estado demostrativo de arranque (`base`, `futuro`,
 * `historico`, `clase-pasada`, `clase-futura`, `evaluacion`, `un-paso`,
 * `tres-pasos`, `prioridad-inferior`, `dependencia`, `reubicada`, `renegociado`,
 * `limpio`, `calendario`); `?vista=calendario` y `?modo=limpio` se combinan con
 * cualquiera. Al refrescar vuelve ahí: nada se guarda.
 *
 * Para borrar: esta carpeta, `tests/plan-vivo-spike-v2*` y
 * `docs/experiments/plan-vivo/V2_*.md`. Nada más la importa.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { LabPlanVivo } from "./_lab/lab-plan-vivo";

export const metadata: Metadata = {
  title: "Laboratorio V2 · Mi Plan vivo",
  robots: { index: false, follow: false },
};

export default async function PlanVivoSpikeV2Page({
  searchParams,
}: {
  searchParams: Promise<{ escenario?: string | string[]; vista?: string | string[]; modo?: string | string[] }>;
}) {
  // Sin esto el build la prerenderiza con el valor de la variable al compilar.
  await connection();
  if (process.env.PLAN_VIVO_SPIKE_V2 !== "1") notFound();
  const { escenario, vista, modo } = await searchParams;
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
  return <LabPlanVivo escenario={uno(escenario)} vista={uno(vista)} modo={uno(modo)} />;
}
