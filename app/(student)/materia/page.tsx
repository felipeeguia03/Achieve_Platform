"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MateriaCursado } from "@/components/screens/materia-cursado";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { rutaDeCta } from "@/lib/navigation";

const DESTINO = rutaDeCta("CTA-002");

function Vista() {
  const router = useRouter();
  const params = useSearchParams();

  const id = escenarioDesde(params.get("escenario"), "materia") ?? "FX-DAY-BASE";
  const props = getEscenario(id).materia;
  if (!props) throw new Error(`El escenario ${id} no proyecta esta vista`);

  return (
    <MateriaCursado
      {...props}
      onAvanzar={DESTINO ? () => router.push(DESTINO) : undefined}
    />
  );
}

export default function MateriaCursadoPage() {
  return (
    <Suspense>
      <Vista />
    </Suspense>
  );
}
