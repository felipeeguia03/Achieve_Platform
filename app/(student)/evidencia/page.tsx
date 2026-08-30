"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Evidencia } from "@/components/screens/evidencia";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";

const DESTINO = rutaDeCta("CTA-007");

function Vista() {
  const router = useRouter();
  const params = useSearchParams();

  const id = escenarioDesde(params.get("escenario"), "evidencia") ?? "FX-EVD-BASE";
  const props = getEscenario(id).evidencia;
  if (!props) throw new Error(`El escenario ${id} no proyecta esta vista`);

  // El recorrido de focus group manda sobre el destino genérico: en una
  // sesión, la CTA tiene que llevar a la estación siguiente.
  const destino = siguienteUrl("/evidencia", params.get("escenario")) ?? DESTINO;

  return (
    <Evidencia
      {...props}
      onAvanzar={destino ? () => router.push(destino) : undefined}
    />
  );
}

export default function EvidenciaPage() {
  return (
    <Suspense>
      <Vista />
    </Suspense>
  );
}
