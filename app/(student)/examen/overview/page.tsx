"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OverviewModoExamen } from "@/components/screens/overview-modo-examen";
import { getEscenario, escenarioUX08Desde } from "@/lib/fixtures";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";

// CTA-012 abre UX09, que se construye en la Etapa 0.6. Hasta entonces
// `rutaDeCta` devuelve null y la CTA no navega: no se inventa un destino.
const AL_PASO = rutaDeCta("CTA-012");
const A_CURSADO = "/materia";

function Overview() {
  const router = useRouter();
  const params = useSearchParams();

  const id = escenarioUX08Desde(params.get("escenario")) ?? "FX-LOCAL-OV-ACTIVA";
  const props = getEscenario(id).ux08;
  if (!props) throw new Error(`El escenario ${id} no proyecta UX08`);

  const destino = siguienteUrl("/examen/overview", params.get("escenario")) ?? AL_PASO;

  return (
    <OverviewModoExamen
      {...props}
      onAvanzar={destino ? () => router.push(destino) : undefined}
      onVolver={() => router.push(A_CURSADO)}
    />
  );
}

export default function OverviewModoExamenPage() {
  return (
    <Suspense>
      <Overview />
    </Suspense>
  );
}
