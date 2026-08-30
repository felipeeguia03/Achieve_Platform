"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Compromiso } from "@/components/screens/compromiso";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";

const DESTINO = rutaDeCta("CTA-004");

function Vista() {
  const router = useRouter();
  const params = useSearchParams();

  const id = escenarioDesde(params.get("escenario"), "compromiso") ?? "FX-DAY-BASE";
  const props = getEscenario(id).compromiso;
  if (!props) throw new Error(`El escenario ${id} no proyecta esta vista`);

  // El recorrido de focus group manda sobre el destino genérico: en una
  // sesión, la CTA tiene que llevar a la estación siguiente.
  const destino = siguienteUrl("/compromiso", params.get("escenario")) ?? DESTINO;

  return (
    <Compromiso
      {...props}
      onAvanzar={destino ? () => router.push(destino) : undefined}
    />
  );
}

export default function CompromisoPage() {
  return (
    <Suspense>
      <Vista />
    </Suspense>
  );
}
