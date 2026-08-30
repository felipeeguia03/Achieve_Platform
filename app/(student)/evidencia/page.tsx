"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Evidencia } from "@/components/screens/evidencia";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { rutaDeCta } from "@/lib/navigation";

const DESTINO = rutaDeCta("CTA-007");

function Vista() {
  const router = useRouter();
  const params = useSearchParams();

  const id = escenarioDesde(params.get("escenario"), "evidencia") ?? "FX-EVD-BASE";
  const props = getEscenario(id).evidencia;
  if (!props) throw new Error(`El escenario ${id} no proyecta esta vista`);

  return (
    <Evidencia
      {...props}
      onAvanzar={DESTINO ? () => router.push(DESTINO) : undefined}
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
