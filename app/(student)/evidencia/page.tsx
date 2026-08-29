"use client";

import { useRouter } from "next/navigation";
import { Evidencia } from "@/components/screens/evidencia";
import { getEscenario } from "@/lib/fixtures";
import { rutaDeCta } from "@/lib/navigation";

// La CTA principal de esta superficie es CTA-007. Su destino sale del registro
// canónico, no de un recorrido lineal escrito a mano.
const DESTINO = rutaDeCta("CTA-007");

export default function EvidenciaPage() {
  const router = useRouter();
  const props = getEscenario("FX-EVD-BASE").evidencia;
  if (!props) throw new Error("El escenario FX-EVD-BASE no proyecta UX05");

  return (
    <Evidencia
      {...props}
      onAvanzar={DESTINO ? () => router.push(DESTINO) : undefined}
    />
  );
}
