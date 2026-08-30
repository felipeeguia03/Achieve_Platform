"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProximaAccion } from "@/components/screens/proxima-accion";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";

const DESTINO = rutaDeCta("CTA-003");

function Vista() {
  const router = useRouter();
  const params = useSearchParams();

  const id = escenarioDesde(params.get("escenario"), "accion") ?? "FX-DAY-BASE";
  const props = getEscenario(id).accion;
  if (!props) throw new Error(`El escenario ${id} no proyecta esta vista`);

  // El recorrido de focus group manda sobre el destino genérico: en una
  // sesión, la CTA tiene que llevar a la estación siguiente.
  const destino = siguienteUrl("/accion", params.get("escenario")) ?? DESTINO;

  return (
    <ProximaAccion
      {...props}
      onAvanzar={destino ? () => router.push(destino) : undefined}
    />
  );
}

export default function ProximaAccionPage() {
  return (
    <Suspense>
      <Vista />
    </Suspense>
  );
}
