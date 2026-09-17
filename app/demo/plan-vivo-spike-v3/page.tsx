/**
 * 🧪 **LABORATORIO DESCARTABLE — «Mi Plan vivo» V3: el calendario como plan.**
 * `/demo/plan-vivo-spike-v3`
 *
 * Tercera versión, al lado de V1 y V2, que siguen intactas. No existe una vista
 * *Plan* separada: el calendario es la única representación temporal, y el Plan
 * Engine del laboratorio sigue proponiendo, priorizando, detectando conflictos y
 * simulando. **No es producto**: sin Shell, sin sesión, sin base, sin red y sin
 * escritura. Decide [ADR-109](../../../docs/decisions.md#adr-109), `PENDING`.
 *
 * ⚠️ **Apagada por defecto, con flag propio.** Sin `PLAN_VIVO_SPIKE_V3=1` responde
 * `404`, también en build de producción. Los flags de V1 y V2 no la prenden.
 *
 * `?escenario=` elige un estado de arranque: `ubicacion`, `prioridad`, `conflicto`,
 * `compromiso`, `renegociacion`, `simulacion`, `simulacion-multiple`,
 * `disponibilidad`, `reloj`, `rescate`. Al refrescar vuelve ahí: nada se guarda.
 *
 * Para borrar: esta carpeta, `tests/plan-vivo-spike-v3*` y
 * `docs/experiments/plan-vivo-v3/`. Nada más la importa.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { LabPlanVivoV3 } from "./_lab/lab-v3";

export const metadata: Metadata = {
  title: "Laboratorio V3 · Calendario como plan",
  robots: { index: false, follow: false },
};

export default async function PlanVivoSpikeV3Page({ searchParams }: { searchParams: Promise<{ escenario?: string | string[] }> }) {
  // Sin esto el build la prerenderiza con el valor de la variable al compilar.
  await connection();
  if (process.env.PLAN_VIVO_SPIKE_V3 !== "1") notFound();
  const { escenario } = await searchParams;
  return <LabPlanVivoV3 escenario={(Array.isArray(escenario) ? escenario[0] : escenario) ?? null} />;
}
