"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ActivacionModoExamen } from "@/components/screens/activacion-modo-examen";
import { getEscenario, escenarioUX07Desde } from "@/lib/fixtures";
import { rutaDeCta } from "@/lib/navigation";

// CTA-011 lleva a UX08, que se construye en la Etapa 0.5. Hasta entonces
// `rutaDeCta` devuelve null y la CTA no navega — no se inventa un destino.
const A_OVERVIEW = rutaDeCta("CTA-011");
const A_MATERIA = "/materia";

function Activacion() {
  const router = useRouter();
  const params = useSearchParams();

  // `?escenario=` abre cualquiera de los 22 estados críticos sin panel de debug.
  // Un id desconocido cae al escenario base en vez de adivinar cuál se pidió.
  const id = escenarioUX07Desde(params.get("escenario")) ?? "FX-EXAM-BASE";
  const props = getEscenario(id).ux07;
  if (!props) throw new Error(`El escenario ${id} no proyecta UX07`);

  return (
    <ActivacionModoExamen
      {...props}
      onActivar={A_OVERVIEW ? () => router.push(A_OVERVIEW) : undefined}
      onVolver={() => router.push(A_MATERIA)}
    />
  );
}

export default function ActivarModoExamenPage() {
  return (
    <Suspense>
      <Activacion />
    </Suspense>
  );
}
