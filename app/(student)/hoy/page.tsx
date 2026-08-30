"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HoyAutogestion } from "@/components/screens/hoy-autogestion";
import { escenarioDesde, getEscenario, proyectarHoy } from "@/lib/fixtures";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";

// Los tres destinos salen del registro canónico, no de un recorrido escrito a
// mano: CTA-002 a la próxima acción, CTA-001 a la materia, CTA-009 al progreso.
const A_ACCION = rutaDeCta("CTA-002");
const A_MATERIA = rutaDeCta("CTA-001");
const A_PROGRESO = rutaDeCta("CTA-009");

function Hoy() {
  const router = useRouter();
  const params = useSearchParams();

  const id = escenarioDesde(params.get("escenario"), "hoy") ?? "FX-DAY-BASE";
  const props = proyectarHoy(getEscenario(id));
  if (!props) throw new Error(`El escenario ${id} no proyecta UX01`);

  const destino = siguienteUrl("/hoy", params.get("escenario")) ?? A_ACCION;

  return (
    <HoyAutogestion
      {...props}
      onAvanzar={destino ? () => router.push(destino) : undefined}
      onVerMateria={A_MATERIA ? () => router.push(A_MATERIA) : undefined}
      onVerProgreso={A_PROGRESO ? () => router.push(A_PROGRESO) : undefined}
    />
  );
}

export default function HoyPage() {
  return (
    <Suspense>
      <Hoy />
    </Suspense>
  );
}
