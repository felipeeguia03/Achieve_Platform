/**
 * 🧪 **SPIKE DESCARTABLE — «Mi Plan vivo».** `/demo/plan-vivo-spike`
 *
 * Una demostración aislada para que el Product Owner mire si *ver cómo se mueve el
 * plan* ayuda a entender por qué actuar ahora. **No es producto**: no está en el
 * registro de navegación, no es una superficie, no tiene Shell, no pide sesión, no
 * lee la base y no escribe nada. Todo lo que muestra es un fixture de
 * demostración. Decide [ADR-109](../../../docs/decisions.md#adr-109), `PENDING`.
 *
 * ⚠️ **Apagada por defecto.** Sin `PLAN_VIVO_SPIKE=1` responde `404`: un despliegue
 * que no declara la variable no tiene la ruta. Mismo cerrojo que
 * `ESCALAMIENTO_SINTETICO` en `app/api/escalamiento/route.ts`.
 *
 * `?escenario=` elige desde qué escenario arranca —`base`, `simulacion`,
 * `disponibilidad`, `disponibilidad-aplicada`, `reloj`, `rescate`— y `?vista=calendario`
 * abre el Calendario. Es sólo el punto de partida: al refrescar vuelve ahí.
 *
 * Para borrar el experimento: esta carpeta, `tests/plan-vivo-spike*.test.ts*` y
 * `docs/experiments/plan-vivo/SPIKE.md`. Nada más la importa.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { SpikePlanVivo } from "./_spike/spike-plan-vivo";

export const metadata: Metadata = {
  title: "Laboratorio · Mi Plan vivo",
  robots: { index: false, follow: false },
};

export default async function PlanVivoSpikePage({
  searchParams,
}: {
  searchParams: Promise<{ escenario?: string | string[]; vista?: string | string[] }>;
}) {
  // ⚠️ Sin esto el build la prerenderiza con el valor de la variable **al compilar**:
  // encender el flag después no la prendería. Se lee en cada request.
  await connection();
  if (process.env.PLAN_VIVO_SPIKE !== "1") notFound();
  const { escenario, vista } = await searchParams;
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
  return <SpikePlanVivo escenario={uno(escenario)} vista={uno(vista)} />;
}
