"use client";

import { Suspense } from "react";
import { Shell } from "@/components/shell/shell";
import { useRouter, useSearchParams } from "next/navigation";
import { MateriaCursado } from "@/components/screens/materia-cursado";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { rutaDeCta, siguienteUrl } from "@/lib/navigation";

const DESTINO = rutaDeCta("CTA-002");

function Vista() {
  const router = useRouter();
  const params = useSearchParams();

  const id = escenarioDesde(params.get("escenario"), "materia") ?? "FX-DAY-BASE";
  const props = getEscenario(id).materia;
  if (!props) throw new Error(`El escenario ${id} no proyecta esta vista`);

  // El recorrido de focus group manda sobre el destino genérico: en una
  // sesión, la CTA tiene que llevar a la estación siguiente.
  const destino = siguienteUrl("/materia", params.get("escenario")) ?? DESTINO;

  return (
    <MateriaCursado
      {...props}
      onAvanzar={destino ? () => router.push(destino) : undefined}
    />
  );
}

export default function MateriaCursadoPage() {
  return (
    <Shell nodo="UX02">
      <Suspense>
        <Vista />
      </Suspense>
    </Shell>
  );
}
