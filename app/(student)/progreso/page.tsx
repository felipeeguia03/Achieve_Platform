"use client";

import { useRouter } from "next/navigation";
import { ProgresoBitacora } from "@/components/screens/progreso-bitacora";
import { getEscenario } from "@/lib/fixtures";
import { rutaDeCta } from "@/lib/navigation";

// La CTA principal de esta superficie es CTA-010. Su destino sale del registro
// canónico, no de un recorrido lineal escrito a mano.
const DESTINO = rutaDeCta("CTA-010");

export default function ProgresoBitacoraPage() {
  const router = useRouter();
  const props = getEscenario("FX-LOCAL-PROG-VALIDATED").progreso;
  if (!props) throw new Error("El escenario FX-LOCAL-PROG-VALIDATED no proyecta UX06");

  return (
    <ProgresoBitacora
      {...props}
      onAvanzar={DESTINO ? () => router.push(DESTINO) : undefined}
    />
  );
}
