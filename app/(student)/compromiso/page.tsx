"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Compromiso } from "@/components/screens/compromiso";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { rutaDeCta } from "@/lib/navigation";

const DESTINO = rutaDeCta("CTA-004");

function Vista() {
  const router = useRouter();
  const params = useSearchParams();

  const id = escenarioDesde(params.get("escenario"), "compromiso") ?? "FX-DAY-BASE";
  const props = getEscenario(id).compromiso;
  if (!props) throw new Error(`El escenario ${id} no proyecta esta vista`);

  return (
    <Compromiso
      {...props}
      onAvanzar={DESTINO ? () => router.push(DESTINO) : undefined}
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
