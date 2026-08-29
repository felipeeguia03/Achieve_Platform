"use client";

import { useRouter } from "next/navigation";
import { ProximaAccion } from "@/components/screens/proxima-accion";
import { getEscenario } from "@/lib/fixtures";
import { rutaDeCta } from "@/lib/navigation";

// La CTA principal de esta superficie es CTA-003. Su destino sale del registro
// canónico, no de un recorrido lineal escrito a mano.
const DESTINO = rutaDeCta("CTA-003");

export default function ProximaAccionPage() {
  const router = useRouter();
  const props = getEscenario("FX-DAY-BASE").accion;
  if (!props) throw new Error("El escenario FX-DAY-BASE no proyecta UX03");

  return (
    <ProximaAccion
      {...props}
      onAvanzar={DESTINO ? () => router.push(DESTINO) : undefined}
    />
  );
}
