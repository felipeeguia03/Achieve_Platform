"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProximaAccion } from "@/components/screens/proxima-accion";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { rutaDeCta } from "@/lib/navigation";

const DESTINO = rutaDeCta("CTA-003");

function Vista() {
  const router = useRouter();
  const params = useSearchParams();

  const id = escenarioDesde(params.get("escenario"), "accion") ?? "FX-DAY-BASE";
  const props = getEscenario(id).accion;
  if (!props) throw new Error(`El escenario ${id} no proyecta esta vista`);

  return (
    <ProximaAccion
      {...props}
      onAvanzar={DESTINO ? () => router.push(DESTINO) : undefined}
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
