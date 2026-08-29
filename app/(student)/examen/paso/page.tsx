"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasoDeProtocolo } from "@/components/screens/paso-de-protocolo";
import { getEscenario, escenarioUX09Desde } from "@/lib/fixtures";
import { rutaDeCta } from "@/lib/navigation";

// CTA-010 vuelve a Hoy; el retorno propio de UX09 es al Overview (§30).
const AL_OVERVIEW = "/examen/overview";
const A_ACCION = rutaDeCta("CTA-013");

function Paso() {
  const router = useRouter();
  const params = useSearchParams();

  const id = escenarioUX09Desde(params.get("escenario")) ?? "FX-LOCAL-PASO-COMPLETO";
  const props = getEscenario(id).ux09;
  if (!props) throw new Error(`El escenario ${id} no proyecta UX09`);

  // Abrir el recurso es navegación, no transición: no muta nada. En el Track A
  // no hay recurso real que abrir, así que la CTA sólo navega cuando su destino
  // es una superficie del grafo.
  const destino = props.ctaPrimaria?.texto === "COMPROMETERME" ? A_ACCION : null;

  return (
    <PasoDeProtocolo
      {...props}
      onAvanzar={destino ? () => router.push(destino) : undefined}
      onVolver={() => router.push(AL_OVERVIEW)}
    />
  );
}

export default function PasoDeProtocoloPage() {
  return (
    <Suspense>
      <Paso />
    </Suspense>
  );
}
