"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProgresoBitacora } from "@/components/screens/progreso-bitacora";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { rutaDeCta } from "@/lib/navigation";

const DESTINO = rutaDeCta("CTA-010");

function Vista() {
  const router = useRouter();
  const params = useSearchParams();

  const id = escenarioDesde(params.get("escenario"), "progreso") ?? "FX-LOCAL-PROG-VALIDATED";
  const props = getEscenario(id).progreso;
  if (!props) throw new Error(`El escenario ${id} no proyecta esta vista`);

  return (
    <ProgresoBitacora
      {...props}
      onAvanzar={DESTINO ? () => router.push(DESTINO) : undefined}
    />
  );
}

export default function ProgresoBitacoraPage() {
  return (
    <Suspense>
      <Vista />
    </Suspense>
  );
}
