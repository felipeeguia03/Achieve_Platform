"use client";

import { useRouter } from "next/navigation";
import { Compromiso } from "@/components/screens/compromiso";
import { getEscenario } from "@/lib/fixtures";
import { rutaDeCta } from "@/lib/navigation";

// La CTA principal de esta superficie es CTA-004. Su destino sale del registro
// canónico, no de un recorrido lineal escrito a mano.
const DESTINO = rutaDeCta("CTA-004");

export default function CompromisoPage() {
  const router = useRouter();
  const props = getEscenario("FX-DAY-BASE").compromiso;
  if (!props) throw new Error("El escenario FX-DAY-BASE no proyecta UX04");

  return (
    <Compromiso
      {...props}
      onAvanzar={DESTINO ? () => router.push(DESTINO) : undefined}
    />
  );
}
